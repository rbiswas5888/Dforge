/**
 * DesignForge AI - Proprietary AI Engine Gateway with MCP Client Integration
 * Bridges high-level application requests to the modular DesignForgeAIService
 * and coordinates discovered MCP tools, resources, and prompts across servers.
 */

import { DesignForgeAIService } from '../ai/service.js';
import { PROVIDERS, PRIVACY_MODES } from '../ai/types.js';
import { MarkdownDesignParser } from '../ai/markdown_parser.js';
import { DFIRCanvasBridge } from '../ai/dfir_bridge.js';

export { DesignForgeAIService, PROVIDERS, PRIVACY_MODES, MarkdownDesignParser, DFIRCanvasBridge };

export class AIEngine {
  constructor(commandEngine, mcpClientManager = null) {
    this.engine = commandEngine;
    this.service = new DesignForgeAIService(commandEngine.doc, commandEngine);
    this.mdParser = new MarkdownDesignParser();
    this.dfirBridge = new DFIRCanvasBridge(commandEngine.doc, commandEngine);
    this.mcp = mcpClientManager;
  }

  setMcpClientManager(manager) {
    this.mcp = manager;
  }

  setRegistry(registry) {
    this.service.setRegistry(registry);
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

  /**
   * Generates a validated DFIR design document via DF-UX Intelligence backend or local synthesis.
   */
  async generateDfir(prompt, options = {}) {
    try {
      const res = await fetch('/api/v1/generate/dfir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, options })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.dfir) {
          return data;
        }
      }
    } catch (err) {
      console.warn('DF-UX backend unreachable, falling back to local synthesis:', err);
    }
    // Fallback: Use local design plan generator
    const plan = await this.generateDesignPlan(prompt);
    return { success: true, plan, isLegacyPlan: true };
  }

  /**
   * Translates and commits a DFIR document to native canvas nodes.
   */
  applyDfir(dfir, options = {}) {
    return this.dfirBridge.applyDfirToCanvas(dfir, options);
  }

  /**
   * Exports canvas selection or root artboard to DFIR.
   */
  exportDfir(nodeId = null) {
    return this.dfirBridge.exportCanvasToDfir(nodeId);
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
