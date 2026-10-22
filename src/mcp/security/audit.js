/**
 * DesignForge AI - MCP Audit Logger
 * Records structured, sanitized events for all MCP tool calls and connections.
 * Redacts secrets, auth headers, and sensitive document payloads.
 */

export class McpAuditLogger {
  constructor(maxEntries = 500) {
    this.maxEntries = maxEntries;
    this.entries = [];
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(entry) {
    for (const l of this.listeners) {
      try {
        l(entry);
      } catch (err) {
        console.error('Audit listener error:', err);
      }
    }
  }

  log(entryData) {
    const entry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      serverId: entryData.serverId || 'local-design-server',
      toolName: entryData.toolName || 'unknown',
      feature: entryData.feature || 'ai-assistant',
      scope: entryData.scope || 'none',
      approvalStatus: entryData.approvalStatus || 'auto_approved', // auto_approved | user_approved | pending | denied
      status: entryData.status || 'success', // success | error | denied | timeout
      durationMs: entryData.durationMs || 0,
      diagnostics: this.sanitizePayload(entryData.diagnostics || {}),
      errorMessage: entryData.errorMessage || null
    };

    this.entries.unshift(entry);
    if (this.entries.length > this.maxEntries) {
      this.entries.pop();
    }

    this.notify(entry);
    return entry;
  }

  getEntries(limit = 100, filter = {}) {
    let result = this.entries;
    if (filter.serverId) {
      result = result.filter(e => e.serverId === filter.serverId);
    }
    if (filter.status) {
      result = result.filter(e => e.status === filter.status);
    }
    if (filter.toolName) {
      result = result.filter(e => e.toolName.toLowerCase().includes(filter.toolName.toLowerCase()));
    }
    return result.slice(0, limit);
  }

  clear() {
    this.entries = [];
    this.notify({ type: 'cleared' });
  }

  /**
   * Sanitizes payloads, stripping API keys, passwords, and tokens
   */
  sanitizePayload(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    try {
      const copy = JSON.parse(JSON.stringify(obj));
      this.redactKeys(copy);
      return copy;
    } catch (e) {
      return { note: '[Unserializable payload redacted]' };
    }
  }

  redactKeys(target) {
    if (!target || typeof target !== 'object') return;
    const sensitive = ['apikey', 'api_key', 'token', 'secret', 'password', 'authorization', 'bearer', 'cookie'];

    for (const key of Object.keys(target)) {
      const lower = key.toLowerCase();
      if (sensitive.some(s => lower.includes(s))) {
        target[key] = '***REDACTED***';
      } else if (typeof target[key] === 'object' && target[key] !== null) {
        this.redactKeys(target[key]);
      }
    }
  }
}

export const globalAuditLogger = new McpAuditLogger();
