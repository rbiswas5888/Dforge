/**
 * DesignForge AI - Proprietary AI Engine Gateway with MCP Client Integration
 * Bridges high-level application requests to the modular DesignForgeAIService
 * and coordinates discovered MCP tools, resources, and prompts across servers.
 */

import { DesignForgeAIService } from '../ai/service.js';
import { PROVIDERS, PRIVACY_MODES } from '../ai/types.js';
import { MarkdownDesignParser } from '../ai/markdown_parser.js';

export { DesignForgeAIService, PROVIDERS, PRIVACY_MODES, MarkdownDesignParser };

export class AIEngine {
  constructor(commandEngine, mcpClientManager = null) {
    this.engine = commandEngine;
    this.service = new DesignForgeAIService(commandEngine.doc, commandEngine);
    this.mdParser = new MarkdownDesignParser();
    this.mcp = mcpClientManager;
  }

  setMcpClientManager(manager) {
    this.mcp = manager;
  }

  setApiKey(key) {
    this.service.configureProvider(this.service.activeProviderName, { apiKey: key });
  }

  setProvider(providerName) {
    this.service.setActiveProvider(providerName);
  }

  setPrivacyMode(mode) {
    this.service.setPrivacyMode(mode);
  }

  cancel() {
    this.service.cancel();
  }

  buildContext() {
    return this.service.contextManager.buildContext();
  }

  async generateDesignPlan(prompt, onProgress = null) {
    // If MCP is available and prompt requests external specs or tools, evaluate MCP tools
    if (this.mcp && (prompt.toLowerCase().includes('mcp') || prompt.toLowerCase().includes('spec') || prompt.toLowerCase().includes('read prd'))) {
      if (onProgress) onProgress({ status: 'mcp_discovery', message: 'Discovering applicable tools from connected MCP servers...' });
    }
    const { plan } = await this.service.plan(prompt, onProgress);
    return plan;
  }

  parseMarkdownSpec(markdownText) {
    return this.mdParser.parse(markdownText);
  }

  executePlan(plan) {
    return this.service.applyPlan(plan);
  }

  auditDocument() {
    return this.service.auditDocument();
  }

  /**
   * Invokes an authorized MCP tool via the MCP Client Manager
   */
  async invokeMcpTool(toolName, args = {}, callingFeature = 'ai-assistant') {
    if (!this.mcp) {
      throw new Error('MCP Client Manager is not connected to AI Engine');
    }
    return this.mcp.invokeTool(toolName, args, callingFeature);
  }
}
