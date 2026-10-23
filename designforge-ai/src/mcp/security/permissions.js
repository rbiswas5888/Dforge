/**
 * DesignForge AI - MCP Permission & Security Engine
 * Centralized authorization, scope evaluation, approval policies, and rate limits
 */

import { MCP_PERMISSIONS, MCP_ERROR_CODES } from '../protocol/types.js';
import { globalAuditLogger } from './audit.js';

export class McpSecurityManager {
  constructor(auditLogger = globalAuditLogger) {
    this.audit = auditLogger;

    // serverId -> Set of granted scopes
    this.serverGrants = new Map();

    // Tool default required scopes
    this.toolScopes = new Map();

    // Tools requiring explicit human approval
    this.approvalRequiredTools = new Set([
      'design_apply_transaction',
      'design_undo_transaction',
      'fs_delete_file',
      'fs_write_file',
      'git_commit',
      'git_push'
    ]);

    // Pending approval queue: approvalId -> { id, serverId, toolName, params, resolve, reject, timestamp, description }
    this.pendingApprovals = new Map();
    this.approvalCounter = 1;

    // Rate limiting: serverId -> array of call timestamps
    this.rateLimits = new Map();
    this.maxCallsPerMinute = 120;

    // Maximum payload size (bytes)
    this.maxOutputSizeBytes = 2 * 1024 * 1024; // 2MB

    this.initDefaultGrants();
  }

  initDefaultGrants() {
    // Local design server is granted internal design scopes by default
    this.serverGrants.set('designforge-design-server', new Set([
      MCP_PERMISSIONS.DESIGN_READ,
      MCP_PERMISSIONS.DESIGN_WRITE,
      MCP_PERMISSIONS.DESIGN_EXPORT
    ]));

    // Local filesystem server
    this.serverGrants.set('designforge-project-files', new Set([
      MCP_PERMISSIONS.PROJECT_READ,
      MCP_PERMISSIONS.PROJECT_WRITE
    ]));

    // Documentation server
    this.serverGrants.set('designforge-docs', new Set([
      MCP_PERMISSIONS.PROJECT_READ
    ]));

    // Git handoff server
    this.serverGrants.set('designforge-git', new Set([
      MCP_PERMISSIONS.REPOSITORY_READ,
      MCP_PERMISSIONS.REPOSITORY_WRITE
    ]));
  }

  grantScope(serverId, scope) {
    if (!this.serverGrants.has(serverId)) {
      this.serverGrants.set(serverId, new Set());
    }
    this.serverGrants.get(serverId).add(scope);
  }

  revokeScope(serverId, scope) {
    if (this.serverGrants.has(serverId)) {
      this.serverGrants.get(serverId).delete(scope);
    }
  }

  hasScope(serverId, scope) {
    const grants = this.serverGrants.get(serverId);
    if (!grants) return false;
    return grants.has(scope);
  }

  getGrantedScopes(serverId) {
    return Array.from(this.serverGrants.get(serverId) || []);
  }

  registerToolScope(toolName, requiredScope, requiresApproval = false) {
    this.toolScopes.set(toolName, requiredScope);
    if (requiresApproval) {
      this.approvalRequiredTools.add(toolName);
    }
  }

  getRequiredScope(toolName) {
    if (this.toolScopes.has(toolName)) {
      return this.toolScopes.get(toolName);
    }
    // Infer default scope from tool name prefix
    if (toolName.startsWith('design_get_') || toolName.startsWith('design_list_') || toolName.startsWith('design_search_') || toolName.startsWith('design_validate_')) {
      return MCP_PERMISSIONS.DESIGN_READ;
    }
    if (toolName.startsWith('design_create_') || toolName.startsWith('design_update_') || toolName.startsWith('design_move_') || toolName.startsWith('design_reorder_') || toolName.startsWith('design_set_') || toolName.startsWith('design_bind_') || toolName.startsWith('design_apply_') || toolName.startsWith('design_undo_')) {
      return MCP_PERMISSIONS.DESIGN_WRITE;
    }
    if (toolName.startsWith('design_export_') || toolName.startsWith('design_generate_react')) {
      return MCP_PERMISSIONS.DESIGN_EXPORT;
    }
    if (toolName.startsWith('fs_read_') || toolName.startsWith('docs_')) {
      return MCP_PERMISSIONS.PROJECT_READ;
    }
    if (toolName.startsWith('fs_write_') || toolName.startsWith('fs_delete_')) {
      return MCP_PERMISSIONS.PROJECT_WRITE;
    }
    if (toolName.startsWith('git_')) {
      return MCP_PERMISSIONS.REPOSITORY_READ;
    }
    return MCP_PERMISSIONS.DESIGN_READ;
  }

  /**
   * Rate Limiter verification
   */
  checkRateLimit(serverId) {
    const now = Date.now();
    const windowStart = now - 60000;
    let timestamps = this.rateLimits.get(serverId) || [];
    timestamps = timestamps.filter(t => t > windowStart);
    if (timestamps.length >= this.maxCallsPerMinute) {
      const err = new Error(`Rate limit exceeded for server '${serverId}'. Maximum ${this.maxCallsPerMinute} calls/minute.`);
      err.code = MCP_ERROR_CODES.RATE_LIMITED;
      throw err;
    }
    timestamps.push(now);
    this.rateLimits.set(serverId, timestamps);
  }

  /**
   * Evaluates if an invocation is permitted, authorized, and whether human approval is needed
   */
  async authorizeToolCall(serverId, toolName, params = {}, callingFeature = 'ai-assistant') {
    this.checkRateLimit(serverId);

    const requiredScope = this.getRequiredScope(toolName);
    if (!this.hasScope(serverId, requiredScope)) {
      this.audit.log({
        serverId,
        toolName,
        feature: callingFeature,
        scope: requiredScope,
        approvalStatus: 'denied',
        status: 'denied',
        errorMessage: `Permission scope '${requiredScope}' not granted to server '${serverId}'`
      });
      const err = new Error(`Authorization failed: server '${serverId}' lacks required scope '${requiredScope}' for tool '${toolName}'`);
      err.code = MCP_ERROR_CODES.PERMISSION_DENIED;
      throw err;
    }

    // Check if human approval is required
    const isApprovalNeeded = this.approvalRequiredTools.has(toolName) || this.isDestructiveOperation(toolName, params);

    if (isApprovalNeeded) {
      return this.queueHumanApproval(serverId, toolName, params, requiredScope, callingFeature);
    }

    return { approved: true, autoApproved: true };
  }

  isDestructiveOperation(toolName, params) {
    if (toolName === 'design_apply_transaction') {
      const ops = params.operations || [];
      return ops.some(op => op.type === 'delete_node' || op.type === 'delete_page');
    }
    if (toolName === 'fs_delete_file' || toolName === 'git_push') {
      return true;
    }
    return false;
  }

  async queueHumanApproval(serverId, toolName, params, scope, callingFeature) {
    const approvalId = `appr_${Date.now()}_${this.approvalCounter++}`;
    const description = `Server '${serverId}' requested sensitive operation '${toolName}'`;

    return new Promise((resolve, reject) => {
      this.pendingApprovals.set(approvalId, {
        id: approvalId,
        serverId,
        toolName,
        params,
        scope,
        callingFeature,
        description,
        timestamp: new Date().toISOString(),
        resolve,
        reject
      });

      this.audit.log({
        serverId,
        toolName,
        feature: callingFeature,
        scope,
        approvalStatus: 'pending_approval',
        status: 'pending',
        diagnostics: { approvalId, description }
      });
    });
  }

  getPendingApprovals() {
    return Array.from(this.pendingApprovals.values()).map(a => ({
      id: a.id,
      serverId: a.serverId,
      toolName: a.toolName,
      params: a.params,
      scope: a.scope,
      callingFeature: a.callingFeature,
      description: a.description,
      timestamp: a.timestamp
    }));
  }

  approveRequest(approvalId) {
    const item = this.pendingApprovals.get(approvalId);
    if (!item) return false;
    this.pendingApprovals.delete(approvalId);
    this.audit.log({
      serverId: item.serverId,
      toolName: item.toolName,
      feature: item.callingFeature,
      scope: item.scope,
      approvalStatus: 'user_approved',
      status: 'pending'
    });
    item.resolve({ approved: true, userApproved: true, approvalId });
    return true;
  }

  rejectRequest(approvalId, reason = 'Operation rejected by user') {
    const item = this.pendingApprovals.get(approvalId);
    if (!item) return false;
    this.pendingApprovals.delete(approvalId);
    this.audit.log({
      serverId: item.serverId,
      toolName: item.toolName,
      feature: item.callingFeature,
      scope: item.scope,
      approvalStatus: 'denied',
      status: 'denied',
      errorMessage: reason
    });
    const err = new Error(`User rejected operation: ${reason}`);
    err.code = MCP_ERROR_CODES.APPROVAL_REQUIRED;
    item.reject(err);
    return true;
  }

  validateOutputSize(data) {
    try {
      const size = JSON.stringify(data).length;
      if (size > this.maxOutputSizeBytes) {
        throw new Error(`Tool output size of ${size} bytes exceeds permitted limit of ${this.maxOutputSizeBytes} bytes`);
      }
    } catch (e) {
      if (e.message.includes('exceeds permitted limit')) throw e;
    }
  }
}

export const globalSecurityManager = new McpSecurityManager(globalAuditLogger);
