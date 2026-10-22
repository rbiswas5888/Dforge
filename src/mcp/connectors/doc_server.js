/**
 * DesignForge AI - Documentation & Design System Guidelines MCP Server
 */

import { McpServer } from '../server/server.js';
import { MCP_PERMISSIONS, TOOL_CATEGORIES } from '../protocol/types.js';

export class DocumentationMcpServer extends McpServer {
  constructor() {
    super({
      name: 'designforge-docs',
      version: '1.0.0',
      description: 'Design systems, accessibility standards, and web documentation connector'
    });

    this.guidelines = new Map([
      ['accessibility', {
        title: 'WCAG 2.1 AA Contrast Standards',
        category: 'A11y',
        body: 'Normal text requires at least 4.5:1 contrast against background. Large text (>=18pt or bold >=14pt) requires at least 3:1 contrast. Interactive controls require minimum 44x44px touch targets.'
      }],
      ['spacing', {
        title: '8-Point Spacing Scale',
        category: 'Layout',
        body: 'All spacing, margins, padding, and gaps must follow standard 8pt multiples: 4, 8, 12, 16, 24, 32, 48, 64px.'
      }],
      ['typography', {
        title: 'DesignForge Modern Typography Standards',
        category: 'Typography',
        body: 'Primary UI font is Inter. Display headings use Outfit or Playfair Display. Code and inspect blocks use JetBrains Mono.'
      }]
    ]);

    this.registerDocTools();
    this.registerDocResources();
  }

  registerDocTools() {
    this.registerTool({
      name: 'docs_search',
      category: TOOL_CATEGORIES.DOCUMENTATION,
      description: 'Searches design system guidelines, accessibility rules, and token standards.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', required: true }
        },
        required: ['query']
      },
      requiredScope: MCP_PERMISSIONS.PROJECT_READ
    }, async (args) => {
      const q = args.query.toLowerCase();
      const matches = [];
      for (const [key, doc] of this.guidelines.entries()) {
        if (key.includes(q) || doc.title.toLowerCase().includes(q) || doc.body.toLowerCase().includes(q)) {
          matches.push({ key, title: doc.title, category: doc.category, snippet: doc.body.slice(0, 120) + '...' });
        }
      }
      return { count: matches.length, results: matches };
    });

    this.registerTool({
      name: 'docs_get_guideline',
      category: TOOL_CATEGORIES.DOCUMENTATION,
      description: 'Retrieves full details of a specific design system guideline.',
      inputSchema: {
        type: 'object',
        properties: {
          topic: { type: 'string', required: true }
        },
        required: ['topic']
      },
      requiredScope: MCP_PERMISSIONS.PROJECT_READ
    }, async (args) => {
      const doc = this.guidelines.get(args.topic.toLowerCase());
      if (!doc) throw new Error(`Guideline topic '${args.topic}' not found`);
      return doc;
    });
  }

  registerDocResources() {
    this.registerResource({
      uri: 'docs://guidelines/accessibility',
      name: 'WCAG 2.1 AA Guidelines',
      description: 'Official color contrast and tap target guidelines',
      mimeType: 'text/markdown'
    }, async () => this.guidelines.get('accessibility').body);

    this.registerResource({
      uri: 'docs://guidelines/spacing',
      name: '8-Point Grid Spacing Scale',
      description: 'Layout and auto-layout spacing tokens specification',
      mimeType: 'text/markdown'
    }, async () => this.guidelines.get('spacing').body);
  }
}
