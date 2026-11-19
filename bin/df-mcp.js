#!/usr/bin/env node
/**
 * DesignForge AI — DF-MCP STDIO Gateway
 * Standard Input/Output connector for Claude Desktop, Cursor, Antigravity, and VS Code.
 */

import readline from 'node:readline';
import { createInitialDocument } from '../src/engine/document.js';
import { CommandEngine } from '../src/engine/commands.js';
import { DesignMcpServer } from '../src/mcp/server/design_server.js';

const doc = createInitialDocument('DesignForge MCP Shared Project');
const engine = new CommandEngine(doc);
const server = new DesignMcpServer(engine);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

function sendResponse(response) {
  process.stdout.write(JSON.stringify(response) + '\n');
}

rl.on('line', async (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;

  try {
    const req = JSON.parse(trimmed);
    const { id, method, params = {} } = req;

    if (method === 'initialize') {
      return sendResponse({
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          serverInfo: {
            name: 'df-mcp-intelligence-server',
            version: '2.0.0'
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
      return sendResponse({ jsonrpc: '2.0', id, result: {} });
    }

    if (method === 'tools/list') {
      const tools = Array.from(server.tools.values()).map(t => t.definition);
      return sendResponse({ jsonrpc: '2.0', id, result: { tools } });
    }

    if (method === 'tools/call') {
      const { name, arguments: args = {} } = params;
      const tool = server.tools.get(name);
      if (!tool) {
        return sendResponse({
          jsonrpc: '2.0',
          id,
          error: { code: -32007, message: `Tool '${name}' not found` }
        });
      }
      const output = await tool.handler(args);
      return sendResponse({
        jsonrpc: '2.0',
        id,
        result: {
          content: [{ type: 'text', text: typeof output === 'string' ? output : JSON.stringify(output, null, 2) }],
          isError: false,
          _raw: output
        }
      });
    }

    if (method === 'resources/list') {
      const resources = Array.from(server.resources.values()).map(r => r.definition);
      return sendResponse({ jsonrpc: '2.0', id, result: { resources } });
    }

    if (method === 'prompts/list') {
      const prompts = Array.from(server.prompts.values()).map(p => p.definition);
      return sendResponse({ jsonrpc: '2.0', id, result: { prompts } });
    }

    sendResponse({
      jsonrpc: '2.0',
      id,
      error: { code: -32601, message: `Method '${method}' not implemented` }
    });
  } catch (err) {
    sendResponse({
      jsonrpc: '2.0',
      id: null,
      error: { code: -32700, message: err.message }
    });
  }
});
