/**
 * DesignForge AI - DF-UX Intelligence Native Provider Adapter
 * Connects DesignForge AI directly to the local DF-UX Intelligence Python FastAPI backend.
 * Provides model-independent UX reasoning, visual generation (DFIR), vision analysis,
 * design system mapping, and WCAG accessibility evaluations with 100% local execution.
 */

import { BaseProvider } from './provider-base.js';
import { ProviderError, CancellationError } from '../types.js';

export class DFUXProvider extends BaseProvider {
  constructor(config = {}) {
    super({
      name: 'dfux',
      model: config.model || 'qwen3-32b-ux',
      endpoint: config.endpoint || (typeof window !== 'undefined' ? '/api/v1' : 'http://127.0.0.1:8000/api/v1'),
      ...config
    });
  }

  /**
   * Tests connection to local DF-UX Intelligence service and queries model status.
   */
  async testConnection() {
    try {
      const targetUrl = `${this.endpoint}/health`;
      const res = await fetch(targetUrl, { method: 'GET' });
      if (!res.ok) {
        return {
          success: false,
          message: `DF-UX Intelligence responded with status ${res.status}: ${res.statusText}`
        };
      }
      const data = await res.json();
      let activeModel = this.model;
      try {
        const modelsRes = await fetch(`${this.endpoint}/models`);
        if (modelsRes.ok) {
          const modelsData = await modelsRes.json();
          if (modelsData.models && modelsData.models.length > 0) {
            activeModel = modelsData.default_model || modelsData.models[0].name;
          }
        }
      } catch (err) {
        // Models endpoint optional on quick ping
      }

      return {
        success: true,
        version: data.version || '1.0.0',
        activeModel,
        message: `Connected to DF-UX Intelligence! Active model: ${activeModel} (Zero-latency native UX engine, 100% offline & local).`
      };
    } catch (err) {
      return {
        success: false,
        message: `Failed to connect to DF-UX Intelligence at ${this.endpoint}: ${err.message}. Make sure Python FastAPI server is running on port 8000.`
      };
    }
  }

  /**
   * Generates design operations from a user prompt using DF-UX Intelligence backend.
   */
  async generate(prompt, context, options = {}) {
    const { signal, onProgress } = options;
    this.checkSignal(signal);

    if (onProgress) onProgress({ step: 1, total: 3, message: 'Consulting DF-UX Intelligence reasoning engine...' });

    try {
      const targetUrl = `${this.endpoint}/generate/ui`;
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          domain: 'general',
          target_framework: 'react',
          accessibility_level: 'AA'
        }),
        signal
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new ProviderError(`DF-UX Intelligence error: ${errorText || response.statusText}`, 'dfux', response.status);
      }

      this.checkSignal(signal);
      if (onProgress) onProgress({ step: 2, total: 3, message: 'Synthesizing DFIR structure & validating layout constraints...' });

      const data = await response.json();
      const dfir = data.dfir;

      if (!dfir || !dfir.root) {
        throw new ProviderError('DF-UX Intelligence returned invalid or empty DFIR structure.', 'dfux');
      }

      const operations = this.dfirToOperations(dfir);

      if (onProgress) onProgress({ step: 3, total: 3, message: `Constructed ${operations.length} native canvas nodes via DFIR.` });

      return {
        intent: dfir.metadata?.title || prompt,
        explanation: data.explanation || 'Synthesized structured design components via DF-UX Intelligence native engine.',
        operations,
        dfir,
        uxAnalysis: data.ux_analysis,
        accessibilityReport: data.accessibility_report
      };
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new CancellationError();
      }
      if (err instanceof ProviderError || err instanceof CancellationError) {
        throw err;
      }
      throw new ProviderError(err.message, 'dfux', null, err);
    }
  }

  /**
   * Translates DFIR hierarchy into native CreateNode operations
   */
  dfirToOperations(dfir) {
    const ops = [];
    if (!dfir || !dfir.root) return ops;

    const traverse = (node, parentId = null) => {
      const nodePayload = {
        id: node.id,
        type: node.type || 'frame',
        name: node.name || (node.type ? node.type.charAt(0).toUpperCase() + node.type.slice(1) : 'Node'),
        parentId,
        transform: node.transform || { x: 0, y: 0, width: 300, height: 200 },
        layout: node.layout || null,
        style: node.style || null,
        text: node.text || null,
        semanticTag: node.semanticTag || null
      };

      ops.push({
        type: 'CreateNode',
        node: nodePayload
      });

      if (Array.isArray(node.children)) {
        for (const child of node.children) {
          traverse(child, node.id);
        }
      }
    };

    traverse(dfir.root, null);
    return ops;
  }
}
