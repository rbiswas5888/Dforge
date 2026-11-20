/**
 * DesignForge AI - Lightweight Local Development Server
 * Serves static files with correct MIME types for ES modules & sandboxed previews
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { createServer as createViteServer } from 'vite';
import { createInitialDocument } from './src/engine/document.js';
import { CommandEngine } from './src/engine/commands.js';
import { DesignMcpServer } from './src/mcp/server/design_server.js';
import { CollabHub } from './src/collab/server/collab_hub.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Auto-spawn DF-UX Intelligence Python FastAPI backend on port 8000 if available
const uvicornBin = path.join(__dirname, 'LLM', '.venv', 'bin', 'uvicorn');
if (fs.existsSync(uvicornBin)) {
  const healthReq = http.get('http://127.0.0.1:8000/health', () => {});
  healthReq.on('error', () => {
    try {
      const pyProc = spawn(uvicornBin, ['app.main:app', '--host', '127.0.0.1', '--port', '8000'], {
        cwd: path.join(__dirname, 'LLM'),
        env: { ...process.env, PYTHONPATH: '.' },
        stdio: 'ignore'
      });
      pyProc.unref();
      process.on('exit', () => {
        try { pyProc.kill(); } catch {}
      });
    } catch (e) {
      console.warn('DF-UX auto-spawn notice:', e.message);
    }
  });
}

const sharedDoc = createInitialDocument('DesignForge Platform Default');
const sharedEngine = new CommandEngine(sharedDoc);
const mcpServerInstance = new DesignMcpServer(sharedEngine);

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
const vite = await createViteServer({
  appType: 'custom',
  server: {
    middlewareMode: true,
    hmr: false
  }
});
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf'
};

const previewSessions = new Map();

function serveStaticFile(req, res) {
  let reqPath = decodeURIComponent(req.url.split('?')[0]);
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  }
  if (reqPath === '/preview' || reqPath === '/preview/') {
    reqPath = '/preview.html';
  }

  const filePath = path.join(__dirname, reqPath);
  const resolvedDir = path.resolve(__dirname);
  const resolvedFile = path.resolve(filePath);

  if (resolvedFile !== resolvedDir && !resolvedFile.startsWith(resolvedDir + path.sep)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    fs.createReadStream(filePath).pipe(res);
  });
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 25 * 1024 * 1024) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body.trim()) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  });
  res.end(JSON.stringify(data));
}

function redactSensitiveFields(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const sanitized = Array.isArray(obj) ? [] : {};
  const SENSITIVE_KEYS = ['password', 'creditcard', 'cvv', 'cardnumber', 'ssn', 'secret', 'token', 'auth'];
  for (const [k, v] of Object.entries(obj)) {
    const lower = k.toLowerCase();
    if (SENSITIVE_KEYS.some(sk => lower.includes(sk))) {
      sanitized[k] = '[REDACTED]';
    } else if (typeof v === 'object' && v !== null) {
      sanitized[k] = redactSensitiveFields(v);
    } else {
      sanitized[k] = v;
    }
  }
  return sanitized;
}

const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE'
    });
    res.end();
    return;
  }

  // Real-Time Multi-User Collaboration API Endpoints (Section 7)
  if (req.url.startsWith('/api/collab')) {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || '127.0.0.1:3001'}`);
    let body = {};
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      body = await parseJsonBody(req).catch(() => ({}));
    }
    const result = collabHub.handleHttpRequest(req, res, parsedUrl.pathname, parsedUrl.searchParams, body);
    if (result) {
      return sendJson(res, result.status, result.body);
    }
    return sendJson(res, 404, { success: false, message: 'Collab endpoint not found' });
  }

  // Preview API Endpoints (Blueprint Section 11)
  if (req.url.startsWith('/api/preview')) {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || '127.0.0.1:3001'}`);
    const pathname = parsedUrl.pathname;

    try {
      // POST /api/preview/session - Create new session
      if (pathname === '/api/preview/session' && req.method === 'POST') {
        const body = await parseJsonBody(req);
        const sessionId = 'prev_' + Math.random().toString(36).substring(2, 10);
        const token = 'tok_' + Math.random().toString(36).substring(2, 12);
        const ttlSeconds = body.ttlSeconds || 86400; // 24 hours default
        const expiresAt = Date.now() + ttlSeconds * 1000;

        const session = {
          sessionId,
          token,
          name: body.name || 'Untitled Mobile Preview',
          flowId: body.flowId || null,
          devicePreset: body.devicePreset || 'iphone_15_pro',
          documentSnapshot: body.documentSnapshot || null,
          revision: 1,
          createdAt: Date.now(),
          expiresAt,
          events: []
        };
        previewSessions.set(sessionId, session);

        return sendJson(res, 201, {
          success: true,
          sessionId,
          token,
          previewUrl: `/preview.html?session=${sessionId}&token=${token}`,
          expiresAt
        });
      }

      // Match /api/preview/session/:sessionId or /api/preview/:sessionId
      const sessionMatch = pathname.match(/^\/api\/preview\/(?:session\/)?([a-zA-Z0-9_-]+)(\/events)?$/);
      if (sessionMatch) {
        const sessionId = sessionMatch[1];
        const isEventsRoute = sessionMatch[2] === '/events';
        const session = previewSessions.get(sessionId);

        if (!session || session.expiresAt < Date.now()) {
          return sendJson(res, 404, { success: false, error: 'Session not found or expired' });
        }

        // Usability Events Route
        if (isEventsRoute) {
          if (req.method === 'POST') {
            const body = await parseJsonBody(req);
            const sanitized = redactSensitiveFields(body);
            sanitized.receivedAt = Date.now();
            session.events.push(sanitized);
            return sendJson(res, 200, { success: true, count: session.events.length });
          }
          if (req.method === 'GET') {
            return sendJson(res, 200, { success: true, sessionId, count: session.events.length, events: session.events });
          }
        }

        // Session Retrieval & Update
        if (req.method === 'GET') {
          return sendJson(res, 200, {
            success: true,
            session: {
              sessionId: session.sessionId,
              name: session.name,
              flowId: session.flowId,
              devicePreset: session.devicePreset,
              documentSnapshot: session.documentSnapshot,
              revision: session.revision,
              createdAt: session.createdAt,
              expiresAt: session.expiresAt
            }
          });
        }

        if (req.method === 'PUT') {
          const body = await parseJsonBody(req);
          if (body.documentSnapshot) session.documentSnapshot = body.documentSnapshot;
          if (body.flowId !== undefined) session.flowId = body.flowId;
          if (body.devicePreset) session.devicePreset = body.devicePreset;
          session.revision += 1;
          return sendJson(res, 200, { success: true, revision: session.revision });
        }
      }

      return sendJson(res, 404, { success: false, error: 'API route not found' });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  // Streamable HTTP Gateway for DF-MCP Server (Specification Section 8)
  if (req.url === '/api/mcp' || req.url.startsWith('/api/mcp?') || req.url.startsWith('/api/mcp/')) {
    if (req.method === 'POST') {
      try {
        const body = await parseJsonBody(req);
        const { id, method, params = {} } = body;

        if (method === 'initialize') {
          return sendJson(res, 200, {
            jsonrpc: '2.0',
            id,
            result: {
              protocolVersion: '2024-11-05',
              serverInfo: {
                name: 'df-mcp-intelligence-server',
                version: '2.0.0',
                description: 'DesignForge AI Advanced MCP Server Architecture'
              },
              capabilities: {
                tools: { listChanged: true },
                resources: { subscribe: true, listChanged: true },
                prompts: { listChanged: true }
              }
            }
          });
        }

        if (method === 'ping') {
          return sendJson(res, 200, { jsonrpc: '2.0', id, result: {} });
        }

        if (method === 'tools/list') {
          const tools = Array.from(mcpServerInstance.tools.values()).map(t => t.definition);
          return sendJson(res, 200, { jsonrpc: '2.0', id, result: { tools } });
        }

        if (method === 'tools/call') {
          const { name, arguments: args = {} } = params;
          const tool = mcpServerInstance.tools.get(name);
          if (!tool) {
            return sendJson(res, 200, {
              jsonrpc: '2.0',
              id,
              error: { code: -32007, message: `Tool '${name}' not found on DF-MCP server` }
            });
          }
          const output = await tool.handler(args);
          return sendJson(res, 200, {
            jsonrpc: '2.0',
            id,
            result: {
              content: [
                {
                  type: 'text',
                  text: typeof output === 'string' ? output : JSON.stringify(output, null, 2)
                }
              ],
              isError: false,
              _raw: output
            }
          });
        }

        if (method === 'resources/list') {
          const resources = Array.from(mcpServerInstance.resources.values()).map(r => r.definition);
          return sendJson(res, 200, { jsonrpc: '2.0', id, result: { resources } });
        }

        if (method === 'resources/read') {
          const { uri } = params;
          const resource = mcpServerInstance.resources.get(uri);
          if (!resource) {
            return sendJson(res, 200, {
              jsonrpc: '2.0',
              id,
              error: { code: -32006, message: `Resource '${uri}' not found` }
            });
          }
          const data = await resource.handler(uri);
          return sendJson(res, 200, {
            jsonrpc: '2.0',
            id,
            result: {
              contents: [
                {
                  uri,
                  mimeType: resource.definition.mimeType,
                  text: typeof data === 'string' ? data : JSON.stringify(data, null, 2)
                }
              ]
            }
          });
        }

        if (method === 'prompts/list') {
          const prompts = Array.from(mcpServerInstance.prompts.values()).map(p => p.definition);
          return sendJson(res, 200, { jsonrpc: '2.0', id, result: { prompts } });
        }

        if (method === 'prompts/get') {
          const { name, arguments: args = {} } = params;
          const prompt = mcpServerInstance.prompts.get(name);
          if (!prompt) {
            return sendJson(res, 200, {
              jsonrpc: '2.0',
              id,
              error: { code: -32602, message: `Prompt '${name}' not found` }
            });
          }
          const messageText = await prompt.handler(args);
          return sendJson(res, 200, {
            jsonrpc: '2.0',
            id,
            result: {
              messages: [{ role: 'user', content: { type: 'text', text: messageText } }]
            }
          });
        }

        return sendJson(res, 200, {
          jsonrpc: '2.0',
          id,
          error: { code: -32601, message: `Method '${method}' not implemented` }
        });
      } catch (err) {
        return sendJson(res, 500, {
          jsonrpc: '2.0',
          error: { code: -32603, message: err.message }
        });
      }
    }

    if (req.method === 'GET') {
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({
        server: 'df-mcp-intelligence-server',
        status: 'online',
        transport: 'streamable-http',
        toolsCount: mcpServerInstance.tools.size,
        resourcesCount: mcpServerInstance.resources.size,
        promptsCount: mcpServerInstance.prompts.size
      }));
      return;
    }
  }

  // Reverse proxy for DF-UX Intelligence Python FastAPI Backend (Port 8000)
  if (req.url.startsWith('/api/v1')) {
    const proxyReq = http.request(
      `http://127.0.0.1:8000${req.url}`,
      {
        method: req.method,
        headers: {
          ...req.headers,
          host: '127.0.0.1:8000'
        }
      },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode, {
          ...proxyRes.headers,
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE'
        });
        proxyRes.pipe(res);
      }
    );
    proxyReq.on('error', (err) => {
      res.writeHead(503, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({
        error: 'DF-UX Intelligence Backend is unreachable on http://127.0.0.1:8000',
        details: err.message,
        hint: 'Start the Python FastAPI server with: cd LLM && ./.venv/bin/uvicorn app.main:app --port 8000'
      }));
    });
    req.pipe(proxyReq);
    return;
  }

  // Reverse proxy for Ollama local AI API (Llama 3.1)
  if (req.url.startsWith('/api/ollama')) {
    const targetPath = req.url.replace(/^\/api\/ollama/, '');
    const proxyReq = http.request(
      `http://127.0.0.1:11434${targetPath}`,
      {
        method: req.method,
        headers: {
          ...req.headers,
          host: '127.0.0.1:11434'
        }
      },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode, {
          ...proxyRes.headers,
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE'
        });
        proxyRes.pipe(res);
      }
    );
    proxyReq.on('error', (err) => {
      res.writeHead(502, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ error: 'Ollama is unreachable on http://127.0.0.1:11434', details: err.message }));
    });
    req.pipe(proxyReq);
    return;
  }

  const requestPath = req.url.split('?')[0];
  if (requestPath === '/') req.url = req.url.replace('/', '/index.html');
  if (requestPath === '/preview' || requestPath === '/preview/') {
    req.url = req.url.replace(requestPath, '/preview.html');
  }

  // Directly serve stylesheets and font/image assets so browser receives pure MIME types without Vite wrapping
  if (requestPath.endsWith('.css') || req.headers.accept?.includes('text/css') || requestPath.endsWith('.woff2') || requestPath.endsWith('.woff') || requestPath.endsWith('.png') || requestPath.endsWith('.svg') || requestPath.endsWith('.ico')) {
    serveStaticFile(req, res);
    return;
  }

  vite.middlewares(req, res, error => {
    if (error) {
      console.error('Vite middleware error:', error);
      if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'text/plain' });
      if (!res.writableEnded) res.end('Internal Server Error');
      return;
    }
    serveStaticFile(req, res);
  });
});

const collabHub = new CollabHub(server, { path: '/ws/collab' });

let currentPort = PORT;

function startServer(portToTry) {
  currentPort = portToTry;
  server.listen(portToTry, '0.0.0.0', () => {
    console.log(`⚡ DesignForge AI server running at http://localhost:${portToTry}/ and http://127.0.0.1:${portToTry}/`);
  });
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    currentPort += 1;
    console.warn(`⚠️ Port ${currentPort - 1} in use, trying port ${currentPort}...`);
    startServer(currentPort);
  } else {
    console.error('Server error:', err);
  }
});

server.on('close', () => vite.close());

startServer(currentPort);
