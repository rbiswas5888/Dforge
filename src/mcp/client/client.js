/**
 * DesignForge AI - MCP Client Implementation
 * Protocol-compliant client that connects to local & remote MCP servers,
 * discovers tools/resources/prompts, and invokes tools with strict security validation.
 */

import { McpConnection } from '../protocol/connection.js';
import {
  MCP_PROTOCOL_VERSION,
  MCP_ERROR_CODES
} from '../protocol/types.js';
import { globalSecurityManager } from '../security/permissions.js';
import { globalAuditLogger } from '../security/audit.js';

export class McpClient {
  constructor(serverId, options = {}) {
    this.serverId = serverId;
    this.name = options.name || 'designforge-client';
    this.security = options.security || globalSecurityManager;
    this.audit = options.audit || globalAuditLogger;

    this.connection = null;
    this.serverInfo = null;
    this.serverCapabilities = null;
    this.isReady = false;

    // Discovered capabilities cache
    this.cachedTools = [];
    this.cachedResources = [];
    this.cachedPrompts = [];
    this.lastHealthCheck = null;
  }

  async connect(transport) {
    this.connection = new McpConnection(transport, { name: this.serverId });
    await transport.connect();

    // Step 1: Perform protocol handshake 'initialize'
    const initResult = await this.connection.sendRequest('initialize', {
      protocolVersion: MCP_PROTOCOL_VERSION,
      clientInfo: {
        name: 'DesignForge AI Host',
        version: '1.0.0'
      },
      capabilities: {
        roots: { listChanged: true },
        sampling: {}
      }
    });

    this.serverInfo = initResult.serverInfo || {};
    this.serverCapabilities = initResult.capabilities || {};

    // Step 2: Send initialized notification
    await this.connection.sendNotification('notifications/initialized', {});

    this.isReady = true;
    this.lastHealthCheck = { status: 'healthy', timestamp: new Date().toISOString() };

    // Step 3: Discover capabilities
    await this.refreshCapabilities();

    return this;
  }

  async ping() {
    if (!this.connection) throw new Error('Not connected');
    const start = Date.now();
    await this.connection.sendRequest('ping', {});
    const latency = Date.now() - start;
    this.lastHealthCheck = { status: 'healthy', latencyMs: latency, timestamp: new Date().toISOString() };
    return { ok: true, latencyMs: latency };
  }

  async refreshCapabilities() {
    if (!this.isReady) return;

    if (this.serverCapabilities.tools) {
      const res = await this.connection.sendRequest('tools/list', {});
      this.cachedTools = res.tools || [];
    }

    if (this.serverCapabilities.resources) {
      const res = await this.connection.sendRequest('resources/list', {});
      this.cachedResources = res.resources || [];
    }

    if (this.serverCapabilities.prompts) {
      const res = await this.connection.sendRequest('prompts/list', {});
      this.cachedPrompts = res.prompts || [];
    }
  }

  async listTools() {
    if (this.cachedTools.length === 0) await this.refreshCapabilities();
    return this.cachedTools;
  }

  async listResources() {
    if (this.cachedResources.length === 0) await this.refreshCapabilities();
    return this.cachedResources;
  }

  async listPrompts() {
    if (this.cachedPrompts.length === 0) await this.refreshCapabilities();
    return this.cachedPrompts;
  }

  /**
   * Invokes a tool through schema and security evaluation
   */
  async callTool(toolName, args = {}, callingFeature = 'ai-assistant') {
    if (!this.isReady) {
      throw new Error(`MCP Client for server '${this.serverId}' is not connected`);
    }

    const startTime = Date.now();
    const requiredScope = this.security.getRequiredScope(toolName);

    try {
      // 1. Authorization & approval policy evaluation
      const auth = await this.security.authorizeToolCall(this.serverId, toolName, args, callingFeature);

      // 2. Protocol invocation
      const result = await this.connection.sendRequest('tools/call', {
        name: toolName,
        arguments: args
      });

      const durationMs = Date.now() - startTime;

      // 3. Output size limit validation
      this.security.validateOutputSize(result);

      // 4. Audit logging
      this.audit.log({
        serverId: this.serverId,
        toolName,
        feature: callingFeature,
        scope: requiredScope,
        approvalStatus: auth.userApproved ? 'user_approved' : 'auto_approved',
        status: result.isError ? 'error' : 'success',
        durationMs,
        diagnostics: { argsCount: Object.keys(args).length }
      });

      if (result.isError) {
        const msg = result.content?.[0]?.text || `Tool execution for '${toolName}' returned an error`;
        throw new Error(msg);
      }

      return result;
    } catch (err) {
      const durationMs = Date.now() - startTime;
      this.audit.log({
        serverId: this.serverId,
        toolName,
        feature: callingFeature,
        scope: requiredScope,
        approvalStatus: 'denied',
        status: err.code === MCP_ERROR_CODES.RATE_LIMITED ? 'rate_limited' : 'error',
        durationMs,
        errorMessage: err.message
      });
      throw err;
    }
  }

  async readResource(uri, callingFeature = 'resource-browser') {
    if (!this.isReady) throw new Error('Not connected');
    const start = Date.now();

    try {
      const res = await this.connection.sendRequest('resources/read', { uri });
      this.audit.log({
        serverId: this.serverId,
        toolName: `resource_read:${uri}`,
        feature: callingFeature,
        scope: 'project.read',
        approvalStatus: 'auto_approved',
        status: 'success',
        durationMs: Date.now() - start
      });
      return res.contents || [];
    } catch (err) {
      this.audit.log({
        serverId: this.serverId,
        toolName: `resource_read:${uri}`,
        feature: callingFeature,
        scope: 'project.read',
        approvalStatus: 'denied',
        status: 'error',
        errorMessage: err.message
      });
      throw err;
    }
  }

  async getPrompt(promptName, args = {}) {
    if (!this.isReady) throw new Error('Not connected');
    return this.connection.sendRequest('prompts/get', { name: promptName, arguments: args });
  }

  async disconnect() {
    this.isReady = false;
    if (this.connection) {
      await this.connection.close();
      this.connection = null;
    }
    this.lastHealthCheck = { status: 'disconnected', timestamp: new Date().toISOString() };
  }
}
