/**
 * DesignForge AI - MCP JSON-RPC Protocol Connection Manager
 * Manages request correlation, response resolution, timeouts, and notifications
 */

import {
  createJsonRpcRequest,
  createJsonRpcNotification,
  createJsonRpcResponse,
  createJsonRpcError,
  MCP_ERROR_CODES
} from './types.js';

export class McpConnection {
  constructor(transport, options = {}) {
    this.transport = transport;
    this.name = options.name || 'mcp-connection';
    this.timeoutMs = options.timeoutMs || 30000;

    this.pendingRequests = new Map(); // id -> { resolve, reject, timer }
    this.requestHandlers = new Map(); // method -> async (params) => result
    this.notificationHandlers = new Map(); // method -> (params) => void
    this.idCounter = 1;

    this.unsubscribeMessage = this.transport.onMessage((msg) => this.handleIncomingMessage(msg));
    this.unsubscribeError = this.transport.onError((err) => this.handleTransportError(err));
    this.unsubscribeClose = this.transport.onClose((reason) => this.handleTransportClose(reason));
  }

  generateId() {
    return `df_req_${Date.now()}_${this.idCounter++}`;
  }

  onRequest(method, handler) {
    this.requestHandlers.set(method, handler);
    return () => this.requestHandlers.delete(method);
  }

  onNotification(method, handler) {
    this.notificationHandlers.set(method, handler);
    return () => this.notificationHandlers.delete(method);
  }

  async sendRequest(method, params = {}, timeout = this.timeoutMs) {
    if (!this.transport.isConnected) {
      throw new Error(`Cannot send request '${method}': transport is not connected`);
    }

    const id = this.generateId();
    const req = createJsonRpcRequest(id, method, params);

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`MCP request '${method}' timed out after ${timeout}ms`));
      }, timeout);

      this.pendingRequests.set(id, { resolve, reject, timer, method });

      this.transport.send(req).catch((err) => {
        clearTimeout(timer);
        this.pendingRequests.delete(id);
        reject(err);
      });
    });
  }

  async sendNotification(method, params = {}) {
    if (!this.transport.isConnected) {
      throw new Error(`Cannot send notification '${method}': transport is not connected`);
    }
    const notif = createJsonRpcNotification(method, params);
    return this.transport.send(notif);
  }

  async sendResponse(id, result) {
    const res = createJsonRpcResponse(id, result);
    return this.transport.send(res);
  }

  async sendError(id, code, message, data = null) {
    const err = createJsonRpcError(id, code, message, data);
    return this.transport.send(err);
  }

  async handleIncomingMessage(msg) {
    if (!msg || typeof msg !== 'object') return;

    // 1. Is it a Response to our previous Request?
    if (msg.id !== undefined && (msg.result !== undefined || msg.error !== undefined)) {
      const pending = this.pendingRequests.get(msg.id);
      if (pending) {
        clearTimeout(pending.timer);
        this.pendingRequests.delete(msg.id);
        if (msg.error) {
          const err = new Error(msg.error.message || 'MCP Error');
          err.code = msg.error.code;
          err.data = msg.error.data;
          pending.reject(err);
        } else {
          pending.resolve(msg.result);
        }
      }
      return;
    }

    // 2. Is it an incoming Request?
    if (msg.method && msg.id !== undefined) {
      const handler = this.requestHandlers.get(msg.method);
      if (!handler) {
        await this.sendError(msg.id, MCP_ERROR_CODES.METHOD_NOT_FOUND, `Method '${msg.method}' not found`);
        return;
      }
      try {
        const result = await handler(msg.params || {});
        await this.sendResponse(msg.id, result);
      } catch (err) {
        const code = err.code || MCP_ERROR_CODES.INTERNAL_ERROR;
        await this.sendError(msg.id, code, err.message, err.data || null);
      }
      return;
    }

    // 3. Is it an incoming Notification?
    if (msg.method && msg.id === undefined) {
      const handler = this.notificationHandlers.get(msg.method);
      if (handler) {
        try {
          handler(msg.params || {});
        } catch (e) {
          console.error(`Error in notification handler for ${msg.method}:`, e);
        }
      }
    }
  }

  handleTransportError(err) {
    for (const [id, req] of this.pendingRequests.entries()) {
      clearTimeout(req.timer);
      req.reject(new Error(`Transport error on '${req.method}': ${err.message}`));
    }
    this.pendingRequests.clear();
  }

  handleTransportClose(reason) {
    for (const [id, req] of this.pendingRequests.entries()) {
      clearTimeout(req.timer);
      req.reject(new Error(`Transport closed while waiting for '${req.method}': ${reason}`));
    }
    this.pendingRequests.clear();
  }

  async close() {
    this.handleTransportClose('Connection closed by McpConnection');
    if (this.unsubscribeMessage) this.unsubscribeMessage();
    if (this.unsubscribeError) this.unsubscribeError();
    if (this.unsubscribeClose) this.unsubscribeClose();
    await this.transport.close();
  }
}
