/**
 * DesignForge AI - MCP Transports Layer
 * Provides In-Memory, Stdio (Process), and Streamable HTTP transports
 */

export class BaseTransport {
  constructor() {
    this.messageHandlers = new Set();
    this.errorHandlers = new Set();
    this.closeHandlers = new Set();
    this.isConnected = false;
  }

  onMessage(handler) {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  onError(handler) {
    this.errorHandlers.add(handler);
    return () => this.errorHandlers.delete(handler);
  }

  onClose(handler) {
    this.closeHandlers.add(handler);
    return () => this.closeHandlers.delete(handler);
  }

  emitMessage(message) {
    for (const h of this.messageHandlers) {
      try {
        h(message);
      } catch (err) {
        this.emitError(err);
      }
    }
  }

  emitError(err) {
    for (const h of this.errorHandlers) {
      try {
        h(err);
      } catch (e) {
        console.error('Unhandled transport error:', e);
      }
    }
  }

  emitClose(reason) {
    this.isConnected = false;
    for (const h of this.closeHandlers) {
      try {
        h(reason);
      } catch (e) {
        console.error('Unhandled transport close error:', e);
      }
    }
  }

  async connect() {
    throw new Error('Not implemented');
  }

  async send(message) {
    throw new Error('Not implemented');
  }

  async close() {
    throw new Error('Not implemented');
  }
}

/**
 * Paired In-Memory Transport for high-performance direct protocol execution
 */
export class InMemoryTransport extends BaseTransport {
  constructor(name = 'in-memory') {
    super();
    this.name = name;
    this.peer = null;
  }

  setPeer(peerTransport) {
    this.peer = peerTransport;
  }

  async connect() {
    this.isConnected = true;
    return true;
  }

  async send(message) {
    if (!this.isConnected || !this.peer) {
      throw new Error(`Transport ${this.name} is not connected to a peer`);
    }
    // Simulate async tick for real asynchronous message exchange
    queueMicrotask(() => {
      if (this.peer && this.peer.isConnected) {
        try {
          // Deep clone message to ensure pure message passing without object reference sharing
          const cloned = JSON.parse(JSON.stringify(message));
          this.peer.emitMessage(cloned);
        } catch (err) {
          this.peer.emitError(err);
        }
      }
    });
  }

  async close() {
    if (this.isConnected) {
      this.isConnected = false;
      this.emitClose('closed_by_client');
      if (this.peer && this.peer.isConnected) {
        this.peer.emitClose('peer_disconnected');
      }
    }
  }
}

/**
 * Helper to create a linked pair of In-Memory transports (one for client, one for server)
 */
export function createInMemoryTransportPair(clientName = 'client-transport', serverName = 'server-transport') {
  const clientSide = new InMemoryTransport(clientName);
  const serverSide = new InMemoryTransport(serverName);
  clientSide.setPeer(serverSide);
  serverSide.setPeer(clientSide);
  return { clientSide, serverSide };
}

/**
 * Stdio Transport for local processes (Node.js runtime / Desktop companion)
 */
export class StdioTransport extends BaseTransport {
  constructor(options = {}) {
    super();
    this.command = options.command;
    this.args = options.args || [];
    this.env = options.env || {};
    this.cwd = options.cwd || process.cwd?.() || '.';
    this.process = null;
    this.buffer = '';
  }

  async connect() {
    if (typeof process === 'undefined' || !process.versions?.node) {
      throw new Error('Stdio transport is only supported in a Node or desktop companion environment');
    }

    // Security check: reject shell injection characters
    const forbidden = [';', '&', '|', '`', '$', '>', '<'];
    if (forbidden.some(ch => this.command.includes(ch))) {
      throw new Error(`Invalid command binary path: forbidden characters detected in "${this.command}"`);
    }

    const { spawn } = await import('node:child_process');
    this.process = spawn(this.command, this.args, {
      cwd: this.cwd,
      env: { ...process.env, ...this.env },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    this.isConnected = true;

    this.process.stdout.on('data', (chunk) => {
      this.buffer += chunk.toString('utf8');
      const lines = this.buffer.split('\n');
      this.buffer = lines.pop(); // keep remainder
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const parsed = JSON.parse(trimmed);
          this.emitMessage(parsed);
        } catch (e) {
          this.emitError(new Error(`Failed to parse stdout JSON-RPC line: ${e.message}`));
        }
      }
    });

    this.process.stderr.on('data', (chunk) => {
      // Diagnostic stderr logging without treating as protocol payload
      console.warn(`[MCP Stdio ${this.command} STDERR]:`, chunk.toString('utf8').trim());
    });

    this.process.on('error', (err) => {
      this.emitError(err);
    });

    this.process.on('close', (code) => {
      this.emitClose(`Process exited with code ${code}`);
    });

    return true;
  }

  async send(message) {
    if (!this.isConnected || !this.process) {
      throw new Error('Stdio transport is not running');
    }
    const line = JSON.stringify(message) + '\n';
    this.process.stdin.write(line);
  }

  async close() {
    this.isConnected = false;
    if (this.process) {
      try {
        this.process.kill('SIGTERM');
      } catch (err) {
        // ignore
      }
      this.process = null;
    }
    this.emitClose('closed_by_user');
  }
}

/**
 * Streamable HTTP / SSE Transport for remote servers
 */
export class HttpStreamTransport extends BaseTransport {
  constructor(endpoint, options = {}) {
    super();
    this.endpoint = endpoint;
    this.headers = options.headers || {};
    this.abortController = null;
  }

  async connect() {
    try {
      new URL(this.endpoint);
    } catch (e) {
      throw new Error(`Invalid MCP server endpoint URL: ${this.endpoint}`);
    }
    this.isConnected = true;
    return true;
  }

  async send(message) {
    if (!this.isConnected) {
      throw new Error('HTTP transport is disconnected');
    }

    this.abortController = new AbortController();
    const timeoutId = setTimeout(() => this.abortController.abort(), 15000);

    try {
      const res = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream',
          ...this.headers
        },
        body: JSON.stringify(message),
        signal: this.abortController.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const body = await res.json();
        this.emitMessage(body);
      } else {
        // Text / SSE streaming chunk parse
        const text = await res.text();
        const lines = text.split('\n');
        for (const line of lines) {
          const trimmed = line.replace(/^data:\s*/, '').trim();
          if (!trimmed || trimmed === '[DONE]') continue;
          try {
            const parsed = JSON.parse(trimmed);
            this.emitMessage(parsed);
          } catch (e) {
            // Ignore non-json frames
          }
        }
      }
    } catch (err) {
      this.emitError(err);
      throw err;
    }
  }

  async close() {
    this.isConnected = false;
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.emitClose('closed');
  }
}
