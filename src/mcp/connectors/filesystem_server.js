/**
 * DesignForge AI - Project Files & Specifications MCP Server
 * Secure, scoped file connector for reading design specs and exporting code manifests.
 */

import { McpServer } from '../server/server.js';
import { MCP_PERMISSIONS, TOOL_CATEGORIES } from '../protocol/types.js';

export class FileSystemMcpServer extends McpServer {
  constructor(baseDir = '.') {
    super({
      name: 'designforge-project-files',
      version: '1.0.0',
      description: 'Scoped project filesystem connector for Markdown specifications and export files'
    });

    this.baseDir = baseDir;

    // Virtual project filesystem cache (accessible in browser and node)
    this.virtualFiles = new Map([
      ['specs/dashboard_prd.md', `# Treasury & Cloud Analytics Dashboard Specification
## Requirements
- Target: Desktop 1440x1024
- Theme: Deep Midnight Navy (#0f172a)
- Header: 72px high with Brand Logo and Search Bar
- Metrics: 4 KPI Cards (Total Volume, Net Revenue, Active Accounts, Chargeback Rate)
- Chart: Real-time volume trajectory with gradient fill
- Table: Recent Transactions (5 columns: Date, Counterparty, Status, Amount, Action)`],
      ['specs/mobile_app_spec.md', `# Mobile Banking App PRD
## Requirements
- Viewport: Mobile 390x844 (iPhone 15)
- Quick Action Buttons: Send, Request, Swap, Card Details
- Balance Card: Gradient backdrop with balance reveal toggle
- Recent Activity List with category icons`],
      ['design-system/brand_guidelines.md', `# Brand System Guidelines
- Primary Brand: #3b82f6 (Blue 500)
- Secondary Accent: #8b5cf6 (Violet 500)
- Dark Surface: #1e293b (Slate 800)
- Font: Inter, sans-serif
- Radius Scale: 4px, 8px, 12px, 16px`]
    ]);

    this.registerFileTools();
    this.registerFileResources();
  }

  registerFileTools() {
    this.registerTool({
      name: 'fs_list_files',
      category: TOOL_CATEGORIES.FILE_OPERATIONS,
      description: 'Lists all available specifications, design tokens, and project export files.',
      inputSchema: {
        type: 'object',
        properties: {
          directory: { type: 'string', description: 'Subdirectory path filter' }
        }
      },
      requiredScope: MCP_PERMISSIONS.PROJECT_READ
    }, async (args) => {
      const dir = args.directory || '';
      const matched = Array.from(this.virtualFiles.keys()).filter(k => k.startsWith(dir));
      return {
        baseDir: this.baseDir,
        files: matched.map(f => ({
          path: f,
          sizeBytes: this.virtualFiles.get(f).length,
          extension: f.split('.').pop()
        }))
      };
    });

    this.registerTool({
      name: 'fs_read_file',
      category: TOOL_CATEGORIES.FILE_OPERATIONS,
      description: 'Reads the contents of an approved project specification or documentation file.',
      inputSchema: {
        type: 'object',
        properties: {
          filePath: { type: 'string', required: true }
        },
        required: ['filePath']
      },
      requiredScope: MCP_PERMISSIONS.PROJECT_READ
    }, async (args) => {
      // Path traversal protection
      if (args.filePath.includes('..') || args.filePath.startsWith('/')) {
        throw new Error('Access denied: path traversal is strictly prohibited');
      }

      const content = this.virtualFiles.get(args.filePath);
      if (!content) {
        throw new Error(`File '${args.filePath}' does not exist in project scope`);
      }

      return {
        filePath: args.filePath,
        content,
        encoding: 'utf-8'
      };
    });

    this.registerTool({
      name: 'fs_write_file',
      category: TOOL_CATEGORIES.FILE_OPERATIONS,
      description: 'Writes a generated export artifact or report into the project directory.',
      inputSchema: {
        type: 'object',
        properties: {
          filePath: { type: 'string', required: true },
          content: { type: 'string', required: true }
        },
        required: ['filePath', 'content']
      },
      requiredScope: MCP_PERMISSIONS.PROJECT_WRITE,
      requiresApproval: true
    }, async (args) => {
      if (args.filePath.includes('..') || args.filePath.startsWith('/')) {
        throw new Error('Access denied: path traversal is strictly prohibited');
      }

      this.virtualFiles.set(args.filePath, args.content);
      return {
        success: true,
        filePath: args.filePath,
        sizeBytes: args.content.length
      };
    });
  }

  registerFileResources() {
    this.registerResource({
      uri: 'project://specs/dashboard_prd.md',
      name: 'Dashboard PRD Specification',
      description: 'Product Requirements Document for Enterprise Analytics Dashboard',
      mimeType: 'text/markdown'
    }, async () => this.virtualFiles.get('specs/dashboard_prd.md'));

    this.registerResource({
      uri: 'project://specs/mobile_app_spec.md',
      name: 'Mobile App Specification',
      description: 'Design requirements for mobile banking screen',
      mimeType: 'text/markdown'
    }, async () => this.virtualFiles.get('specs/mobile_app_spec.md'));
  }
}
