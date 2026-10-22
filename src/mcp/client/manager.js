/**
 * DesignForge AI - MCP Host & Client Manager
 * Manages multiple local and remote MCP server connections, aggregate tool discovery,
 * tool enablement toggles, and unified invocation routing.
 */

import { McpClient } from './client.js';
import {
  InMemoryTransport,
  StdioTransport,
  HttpStreamTransport,
  createInMemoryTransportPair
} from '../protocol/transport.js';
import { globalSecurityManager } from '../security/permissions.js';
import { globalAuditLogger } from '../security/audit.js';

export class McpClientManager {
  constructor(options = {}) {
    this.security = options.security || globalSecurityManager;
    this.audit = options.audit || globalAuditLogger;

    // Server ID -> { config, client, transport, status: 'connected' | 'connecting' | 'disconnected' | 'error' }
    this.servers = new Map();

    // Tool name -> { serverId, definition, enabled: boolean }
    this.toolRegistry = new Map();

    // Disabled tool names set
    this.disabledTools = new Set();

    // Event listeners
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(event, payload = {}) {
    for (const l of this.listeners) {
      try {
        l(event, payload);
      } catch (err) {
        console.error('McpClientManager listener error:', err);
      }
    }
  }

  /**
   * Register and connect a local in-memory server directly
   */
  async registerInMemoryServer(serverInstance, config = {}) {
    const serverId = config.id || serverInstance.name;
    const { clientSide, serverSide } = createInMemoryTransportPair(`client-${serverId}`, `server-${serverId}`);

    // Connect server side
    await serverInstance.connect(serverSide);

    // Create client
    const client = new McpClient(serverId, {
      name: config.name || serverInstance.name,
      security: this.security,
      audit: this.audit
    });

    const serverEntry = {
      id: serverId,
      name: config.name || serverInstance.name,
      description: config.description || serverInstance.description,
      transportType: 'in-memory',
      isLocal: true,
      status: 'connecting',
      client,
      serverInstance,
      transport: clientSide,
      lastConnected: null
    };

    this.servers.set(serverId, serverEntry);

    try {
      await client.connect(clientSide);
      serverEntry.status = 'connected';
      serverEntry.lastConnected = new Date().toISOString();
      await this.aggregateTools();
      this.notify('server-connected', { serverId });
      return client;
    } catch (err) {
      serverEntry.status = 'error';
      serverEntry.error = err.message;
      this.notify('server-error', { serverId, error: err.message });
      throw err;
    }
  }

  /**
   * Register and connect a remote Streamable HTTP server
   */
  async registerRemoteServer(config) {
    const serverId = config.id || `remote_${Date.now()}`;
    const transport = new HttpStreamTransport(config.endpoint, { headers: config.headers || {} });
    const client = new McpClient(serverId, {
      name: config.name || 'Remote MCP Server',
      security: this.security,
      audit: this.audit
    });

    const serverEntry = {
      id: serverId,
      name: config.name,
      description: config.description || 'Remote MCP Server',
      transportType: 'http-stream',
      endpoint: config.endpoint,
      isLocal: false,
      status: 'connecting',
      client,
      transport,
      lastConnected: null
    };

    this.servers.set(serverId, serverEntry);

    try {
      await client.connect(transport);
      serverEntry.status = 'connected';
      serverEntry.lastConnected = new Date().toISOString();
      await this.aggregateTools();
      this.notify('server-connected', { serverId });
      return client;
    } catch (err) {
      serverEntry.status = 'error';
      serverEntry.error = err.message;
      this.notify('server-error', { serverId, error: err.message });
      throw err;
    }
  }

  /**
   * Register and connect a local stdio process (Node environment)
   */
  async registerStdioServer(config) {
    const serverId = config.id || `stdio_${Date.now()}`;
    const transport = new StdioTransport({
      command: config.command,
      args: config.args || [],
      env: config.env || {},
      cwd: config.cwd
    });

    const client = new McpClient(serverId, {
      name: config.name || config.command,
      security: this.security,
      audit: this.audit
    });

    const serverEntry = {
      id: serverId,
      name: config.name || config.command,
      description: config.description || `Local process: ${config.command}`,
      transportType: 'stdio',
      command: config.command,
      args: config.args,
      isLocal: true,
      status: 'connecting',
      client,
      transport,
      lastConnected: null
    };

    this.servers.set(serverId, serverEntry);

    try {
      await client.connect(transport);
      serverEntry.status = 'connected';
      serverEntry.lastConnected = new Date().toISOString();
      await this.aggregateTools();
      this.notify('server-connected', { serverId });
      return client;
    } catch (err) {
      serverEntry.status = 'error';
      serverEntry.error = err.message;
      this.notify('server-error', { serverId, error: err.message });
      throw err;
    }
  }

  async disconnectServer(serverId) {
    const entry = this.servers.get(serverId);
    if (!entry) return;

    if (entry.client) {
      await entry.client.disconnect();
    }
    if (entry.serverInstance) {
      await entry.serverInstance.disconnect();
    }

    entry.status = 'disconnected';
    await this.aggregateTools();
    this.notify('server-disconnected', { serverId });
  }

  async removeServer(serverId) {
    await this.disconnectServer(serverId);
    this.servers.delete(serverId);
    await this.aggregateTools();
    this.notify('server-removed', { serverId });
  }

  async aggregateTools() {
    this.toolRegistry.clear();
    for (const [serverId, entry] of this.servers.entries()) {
      if (entry.status === 'connected' && entry.client) {
        const tools = await entry.client.listTools();
        for (const t of tools) {
          const enabled = !this.disabledTools.has(t.name);
          this.toolRegistry.set(t.name, {
            serverId,
            serverName: entry.name,
            definition: t,
            enabled
          });
        }
      }
    }
    this.notify('tools-updated', { count: this.toolRegistry.size });
  }

  setToolEnabled(toolName, enabled) {
    if (enabled) {
      this.disabledTools.delete(toolName);
    } else {
      this.disabledTools.add(toolName);
    }
    const registered = this.toolRegistry.get(toolName);
    if (registered) {
      registered.enabled = enabled;
    }
    this.notify('tool-toggle', { toolName, enabled });
  }

  isToolEnabled(toolName) {
    return !this.disabledTools.has(toolName);
  }

  async getAllTools() {
    if (this.toolRegistry.size === 0) {
      await this.aggregateTools();
    }
    return Array.from(this.toolRegistry.values());
  }

  async getAllResources() {
    const resources = [];
    for (const [serverId, entry] of this.servers.entries()) {
      if (entry.status === 'connected' && entry.client) {
        const res = await entry.client.listResources();
        for (const r of res) {
          resources.push({ ...r, serverId, serverName: entry.name });
        }
      }
    }
    return resources;
  }

  async getAllPrompts() {
    const prompts = [];
    for (const [serverId, entry] of this.servers.entries()) {
      if (entry.status === 'connected' && entry.client) {
        const pList = await entry.client.listPrompts();
        for (const p of pList) {
          prompts.push({ ...p, serverId, serverName: entry.name });
        }
      }
    }
    return prompts;
  }

  /**
   * Unified tool execution router
   */
  async invokeTool(toolName, args = {}, callingFeature = 'ai-assistant') {
    const reg = this.toolRegistry.get(toolName);
    if (!reg) {
      throw new Error(`Tool '${toolName}' is not available on any connected MCP server`);
    }

    if (!reg.enabled) {
      throw new Error(`Tool '${toolName}' has been disabled by user policy`);
    }

    const serverEntry = this.servers.get(reg.serverId);
    if (!serverEntry || serverEntry.status !== 'connected' || !serverEntry.client) {
      throw new Error(`Server '${reg.serverId}' offering '${toolName}' is currently disconnected`);
    }

    return serverEntry.client.callTool(toolName, args, callingFeature);
  }

  getServerSummaries() {
    return Array.from(this.servers.values()).map(s => ({
      id: s.id,
      name: s.name,
      description: s.description,
      transportType: s.transportType,
      isLocal: s.isLocal,
      status: s.status,
      endpoint: s.endpoint || s.command || 'in-memory',
      lastConnected: s.lastConnected,
      toolsCount: Array.from(this.toolRegistry.values()).filter(t => t.serverId === s.id).length
    }));
  }
}
