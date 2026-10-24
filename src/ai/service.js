/**
 * DesignForge AI - Central AI Service Orchestrator
 * Coordinates providers, context management, pre-flight validation, atomic execution, and diagnostics
 */

import { PROVIDERS, PRIVACY_MODES, ValidationError, CancellationError, ProviderError } from './types.js';
import { ContextManager } from './context.js';
import { OperationValidator } from './validator.js';
import { OperationExecutor } from './operations.js';
import { DesignIntelligenceAnalyzer } from './intelligence.js';
import { LocalProvider } from './providers/local-provider.js';
import { OllamaProvider } from './providers/ollama-provider.js';
import { OpenAIProvider } from './providers/openai-provider.js';
import { GeminiProvider } from './providers/gemini-provider.js';
import { ReactCompiler } from '../engine/compiler.js';

export class DesignForgeAIService {
  constructor(document, commandEngine) {
    this.doc = document;
    this.engine = commandEngine;

    this.contextManager = new ContextManager(document, commandEngine);
    this.validator = new OperationValidator(document);
    this.executor = new OperationExecutor(commandEngine);
    this.intelligence = new DesignIntelligenceAnalyzer(document, commandEngine);

    // Active controller for request cancellation
    this.activeAbortController = null;

    // Providers registry
    this.providers = new Map();
    this.registerProvider(new OllamaProvider({ model: 'llama3.1' }));
    this.registerProvider(new LocalProvider());
    this.registerProvider(new OpenAIProvider());
    this.registerProvider(new GeminiProvider());

    // Load saved settings (defaults to OLLAMA with llama3.1)
    this.activeProviderName = this.loadSetting('ai_active_provider') || PROVIDERS.OLLAMA;
    this.privacyMode = this.loadSetting('ai_privacy_mode') || PRIVACY_MODES.LOCAL_ONLY;
    this.contextManager.setPrivacyMode(this.privacyMode);

    this.history = [];
  }

  loadSetting(key) {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(`designforge_${key}`);
    }
    return null;
  }

  saveSetting(key, val) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`designforge_${key}`, val);
    }
  }

  registerProvider(provider) {
    this.providers.set(provider.name, provider);
  }

  getProvider(name = this.activeProviderName) {
    return this.providers.get(name) || this.providers.get(PROVIDERS.LOCAL);
  }

  setActiveProvider(name) {
    if (this.providers.has(name)) {
      this.activeProviderName = name;
      this.saveSetting('ai_active_provider', name);
    }
  }

  setPrivacyMode(mode) {
    this.privacyMode = mode;
    this.contextManager.setPrivacyMode(mode);
    this.saveSetting('ai_privacy_mode', mode);
  }

  configureProvider(name, config) {
    const provider = this.providers.get(name);
    if (provider) {
      if (config.apiKey !== undefined) {
        provider.apiKey = config.apiKey;
        this.saveSetting(`api_key_${name}`, config.apiKey);
      }
      if (config.endpoint !== undefined) {
        provider.endpoint = config.endpoint;
        this.saveSetting(`endpoint_${name}`, config.endpoint);
      }
      if (config.model !== undefined) {
        provider.model = config.model;
        this.saveSetting(`model_${name}`, config.model);
      }
    }
  }

  /**
   * Cancels any active in-flight generation request
   */
  cancel() {
    if (this.activeAbortController) {
      this.activeAbortController.abort();
      this.activeAbortController = null;
    }
  }

  /**
   * Submits a natural-language request, produces a validated plan, and returns diff
   * @param {string} prompt - User request
   * @param {Function} onProgress - Progress reporter callback
   * @returns {Promise<{ plan: Object, validation: Object }>}
   */
  async plan(prompt, onProgress = null) {
    this.cancel(); // Abort previous if running
    this.activeAbortController = new AbortController();
    const signal = this.activeAbortController.signal;

    // Enforce privacy rule
    if (this.privacyMode === PRIVACY_MODES.LOCAL_ONLY && this.activeProviderName !== PROVIDERS.LOCAL) {
      throw new ProviderError(
        'Local-Only Privacy Mode is active. Switch privacy mode to Allow Hosted or select the Built-in Local Provider.',
        this.activeProviderName
      );
    }

    try {
      // 1. Build compact, relevant context
      const context = this.contextManager.buildContext();

      // 2. Check for Code-Aware query
      const lower = prompt.toLowerCase();
      if (lower.startsWith('generate react') || lower.startsWith('explain react') || lower.includes('code export')) {
        return this.handleCodeAwareQuery(prompt, context);
      }

      // 3. Delegate to active provider
      const provider = this.getProvider();
      const rawPlan = await provider.generate(prompt, context, { signal, onProgress });

      // 4. Pre-flight strict validation
      const validation = this.validator.validate(rawPlan.operations);
      if (!validation.valid) {
        throw new ValidationError(`Proposed operations failed validation:\n${validation.errors.join('\n')}`, validation.errors);
      }

      const verifiedPlan = {
        id: `plan_${Date.now()}`,
        prompt,
        intent: rawPlan.intent || prompt,
        explanation: rawPlan.explanation || 'Design plan synthesized successfully.',
        operations: rawPlan.operations,
        provider: provider.name,
        model: provider.model,
        timestamp: new Date().toISOString()
      };

      this.history.push({ prompt, plan: verifiedPlan });
      return { plan: verifiedPlan, validation };
    } finally {
      this.activeAbortController = null;
    }
  }

  /**
   * Applies an approved plan to the document via CommandEngine
   */
  applyPlan(plan) {
    if (!plan || !plan.operations) return null;
    const validation = this.validator.validate(plan.operations);
    if (!validation.valid) {
      throw new ValidationError(`Cannot execute invalid operations: ${validation.errors.join(', ')}`);
    }

    const report = this.executor.execute(plan.operations, `AI: ${plan.intent}`);
    return report;
  }

  /**
   * Code-Aware query handler (analyzes React compiler output for current selection)
   */
  handleCodeAwareQuery(prompt, context) {
    const selected = context.selection?.[0];
    const compiler = new ReactCompiler(this.doc);

    let explanation = '';
    if (selected) {
      const page = this.engine.getActivePage();
      const node = page.nodes[selected.id];
      const comp = compiler.compileNodeToComponent(node, page);
      explanation = `### React Analysis for '${selected.name}':\n\n\`\`\`tsx\n${comp.tsx}\n\`\`\`\n\n**Semantics:** Tagged as \`<${node.semanticTag || 'div'}>\` with responsive Auto-Layout.`;
    } else {
      explanation = `### Project React Architecture:\n- Root frame exported as standalone TypeScript component with CSS Modules.\n- Design tokens mapped to \`src/tokens/tokens.ts\`.\n- Zero runtime dependencies required.`;
    }

    return {
      plan: {
        id: `code_${Date.now()}`,
        prompt,
        intent: 'React Code Inspection',
        explanation,
        operations: [],
        provider: 'code-aware-engine'
      },
      validation: { valid: true, errors: [], warnings: [], isDestructive: false }
    };
  }

  /**
   * Audits the active document for design flaws, contrast issues, and layout bugs
   */
  auditDocument() {
    return this.intelligence.audit();
  }
}
