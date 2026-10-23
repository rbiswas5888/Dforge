/**
 * DesignForge AI - MCP Server Base Class
 * Compliant with MCP 2024-11-05 Specification
 */

import { McpConnection } from '../protocol/connection.js';
import {
  MCP_PROTOCOL_VERSION,
  MCP_ERROR_CODES
} from '../protocol/types.js';

export class McpServer {
  constructor(info = {}) {
    this.name = info.name || 'designforge-mcp-server';
    this.version = info.version || '1.0.0';
    this.description = info.description || 'DesignForge AI MCP Server';

    this.tools = new Map(); // name -> { definition, handler }
    this.resources = new Map(); // uri -> { definition, handler }
    this.resourceTemplates = [];
    this.prompts = new Map(); // name -> { definition, handler }

    this.connection = null;
    this.isInitialized = false;
  }

  registerTool(definition, handler) {
    if (!definition.name) throw new Error('Tool must have a name');
    this.tools.set(definition.name, {
      definition: {
        name: definition.name,
        description: definition.description || '',
        category: definition.category || 'General',
        inputSchema: definition.inputSchema || { type: 'object', properties: {} },
        outputSchema: definition.outputSchema || null,
        requiredScope: definition.requiredScope || null,
        requiresApproval: Boolean(definition.requiresApproval)
      },
      handler
    });
  }

  registerResource(definition, handler) {
    if (!definition.uri) throw new Error('Resource must have a URI');
    this.resources.set(definition.uri, {
      definition: {
        uri: definition.uri,
        name: definition.name || definition.uri,
        description: definition.description || '',
        mimeType: definition.mimeType || 'application/json'
      },
      handler
    });
  }

  registerResourceTemplate(template) {
    this.resourceTemplates.push(template);
  }

  registerPrompt(definition, handler) {
    if (!definition.name) throw new Error('Prompt must have a name');
    this.prompts.set(definition.name, {
      definition: {
        name: definition.name,
        description: definition.description || '',
        arguments: definition.arguments || []
      },
      handler
    });
  }

  async connect(transport) {
    this.connection = new McpConnection(transport, { name: this.name });

    // Wire up protocol methods
    this.connection.onRequest('initialize', async (params) => {
      this.isInitialized = true;
      return {
        protocolVersion: MCP_PROTOCOL_VERSION,
        serverInfo: {
          name: this.name,
          version: this.version
        },
        capabilities: {
          tools: { listChanged: true },
          resources: { subscribe: true, listChanged: true },
          prompts: { listChanged: true }
        }
      };
    });

    this.connection.onRequest('ping', async () => ({}));

    this.connection.onRequest('tools/list', async () => {
      const toolList = Array.from(this.tools.values()).map(t => t.definition);
      return { tools: toolList };
    });

    this.connection.onRequest('tools/call', async (params) => {
      const { name, arguments: args = {} } = params;
      const tool = this.tools.get(name);
      if (!tool) {
        const err = new Error(`Tool '${name}' not found on server '${this.name}'`);
        err.code = MCP_ERROR_CODES.TOOL_NOT_FOUND;
        throw err;
      }

      try {
        const result = await tool.handler(args);
        return {
          content: [
            {
              type: 'text',
              text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
            }
          ],
          isError: false,
          data: result
        };
      } catch (err) {
        return {
          content: [
            {
              type: 'text',
              text: `Error executing tool '${name}': ${err.message}`
            }
          ],
          isError: true
        };
      }
    });

    this.connection.onRequest('resources/list', async () => {
      const resourceList = Array.from(this.resources.values()).map(r => r.definition);
      return { resources: resourceList };
    });

    this.connection.onRequest('resources/templates/list', async () => {
      return { resourceTemplates: this.resourceTemplates };
    });

    this.connection.onRequest('resources/read', async (params) => {
      const { uri } = params;
      const resource = this.resources.get(uri);
      if (!resource) {
        // Try pattern matching against templates
        for (const t of this.resourceTemplates) {
          const regex = new RegExp('^' + t.uriTemplate.replace(/\{(\w+)\}/g, '(?<$1>[^/]+)') + '$');
          const match = uri.match(regex);
          if (match && t.handler) {
            const data = await t.handler(uri, match.groups || {});
            return {
              contents: [
                {
                  uri,
                  mimeType: t.mimeType || 'application/json',
                  text: typeof data === 'string' ? data : JSON.stringify(data, null, 2)
                }
              ]
            };
          }
        }
        const err = new Error(`Resource '${uri}' not found`);
        err.code = MCP_ERROR_CODES.RESOURCE_NOT_FOUND;
        throw err;
      }

      const content = await resource.handler();
      return {
        contents: [
          {
            uri,
            mimeType: resource.definition.mimeType,
            text: typeof content === 'string' ? content : JSON.stringify(content, null, 2)
          }
        ]
      };
    });

    this.connection.onRequest('prompts/list', async () => {
      const promptList = Array.from(this.prompts.values()).map(p => p.definition);
      return { prompts: promptList };
    });

    this.connection.onRequest('prompts/get', async (params) => {
      const { name, arguments: args = {} } = params;
      const p = this.prompts.get(name);
      if (!p) {
        throw new Error(`Prompt '${name}' not found`);
      }
      const resolved = await p.handler(args);
      return {
        description: p.definition.description,
        messages: Array.isArray(resolved) ? resolved : [
          {
            role: 'user',
            content: {
              type: 'text',
              text: typeof resolved === 'string' ? resolved : JSON.stringify(resolved, null, 2)
            }
          }
        ]
      };
    });

    await transport.connect();
    return this;
  }

  async disconnect() {
    if (this.connection) {
      await this.connection.close();
      this.connection = null;
      this.isInitialized = false;
    }
  }
}
