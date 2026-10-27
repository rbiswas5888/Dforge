/**
 * DesignForge AI - Lightweight Local Development Server
 * Serves static files with correct MIME types for ES modules & sandboxed previews
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
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

  // Preview API Endpoints (Blueprint Section 11)
  if (req.url.startsWith('/api/preview')) {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost:3000'}`);
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

  // Normalize URL path
  let reqPath = decodeURIComponent(req.url.split('?')[0]);
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  }
  if (reqPath === '/preview' || reqPath === '/preview/') {
    reqPath = '/preview.html';
  }

  const filePath = path.join(__dirname, reqPath);

  // Prevent directory traversal
  if (!filePath.startsWith(__dirname)) {
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
      'Cache-Control': 'no-cache'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`⚡ DesignForge AI server running at http://localhost:${PORT}/ and http://127.0.0.1:${PORT}/`);
});
