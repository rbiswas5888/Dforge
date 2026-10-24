/**
 * DesignForge AI - Ollama Provider Adapter
 * Dedicated native adapter for Ollama running local LLMs (Llama 3.1)
 * Supports tool calling, structured JSON output, model discovery, and health checks.
 */

import { BaseProvider } from './provider-base.js';
import { DESIGN_TOOLS_SCHEMA, ProviderError, CancellationError } from '../types.js';

export class OllamaProvider extends BaseProvider {
  constructor(config = {}) {
    super({
      name: 'ollama',
      model: config.model || 'llama3.1',
      endpoint: config.endpoint || (typeof window !== 'undefined' ? '/api/ollama' : 'http://127.0.0.1:11434'),
      ...config
    });
    this.rawEndpoint = this.endpoint.replace(/\/v1\/?$/, '');
  }

  /**
   * Tests connection to local Ollama instance and verifies Llama 3.1 availability
   */
  async testConnection() {
    try {
      const targetUrl = `${this.rawEndpoint}/api/tags`;
      const res = await fetch(targetUrl, { method: 'GET' });
      if (!res.ok) {
        return {
          success: false,
          message: `Ollama service responded with status ${res.status}: ${res.statusText}`
        };
      }
      const data = await res.json();
      const models = (data.models || []).map(m => m.name || m.model);
      const hasLlama31 = models.some(m => m.includes('llama3.1'));

      return {
        success: true,
        installedModels: models,
        hasRequestedModel: hasLlama31,
        message: hasLlama31
          ? `Connected to Ollama! Model '${this.model}' is ready for AI design generation.`
          : `Connected to Ollama, but '${this.model}' was not found in installed models (${models.join(', ')}). Run 'ollama run llama3.1' to pull it.`
      };
    } catch (err) {
      return {
        success: false,
        message: `Failed to connect to Ollama at ${this.rawEndpoint}: ${err.message}. Make sure Ollama is running ('ollama serve' or 'ollama run llama3.1').`
      };
    }
  }

  /**
   * Generates design operations from a user prompt using Llama 3.1
   */
  async generate(prompt, context, options = {}) {
    const { signal, onProgress } = options;
    this.checkSignal(signal);

    if (onProgress) onProgress({ step: 1, total: 3, message: `Consulting Llama 3.1 on local Ollama...` });

    const toolsDescription = DESIGN_TOOLS_SCHEMA.map(t => (
      `- ${t.name}: ${t.description}. Params: ${JSON.stringify(t.parameters)}`
    )).join('\n');

    const systemPrompt = `You are DesignForge AI, an expert AI product designer and layout architect.
You operate on an active digital design canvas powered by the Llama 3.1 model.
Convert user design requests into high-quality, structured layout operations.

OUTPUT RULES:
Output a single valid JSON object strictly matching this schema:
{
  "intent": "<short summary of design task>",
  "explanation": "<explanation of layout, color harmony, and hierarchy>",
  "operations": [
    {
      "type": "CreateNode",
      "node": {
        "type": "frame",
        "name": "<name>",
        "transform": { "width": 360, "height": 180 },
        "layout": { "mode": "stack-vertical", "gap": 12, "paddingTop": 16, "paddingRight": 16, "paddingBottom": 16, "paddingLeft": 16 },
        "style": { "fills": [{ "type": "solid", "color": "#1e293b" }], "cornerRadius": 12 }
      }
    }
  ]
}
Return raw JSON only without markdown code blocks.`;

    try {
      const targetUrl = `${this.rawEndpoint}/api/chat`;
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          format: 'json',
          stream: false,
          options: {
            temperature: 0.1,
            num_predict: 512
          }
        }),
        signal
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new ProviderError(`Ollama error: ${errorText || response.statusText}`, 'ollama', response.status);
      }

      this.checkSignal(signal);
      if (onProgress) onProgress({ step: 2, total: 3, message: 'Parsing Llama 3.1 design plan...' });

      const data = await response.json();
      const rawResponse = data.message?.content || data.response || '{}';
      let parsed;

      try {
        parsed = JSON.parse(rawResponse);
      } catch (parseErr) {
        const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new ProviderError('Failed to parse structured JSON from Llama 3.1', 'ollama', null, parseErr);
        }
      }

      const operations = Array.isArray(parsed.operations) ? parsed.operations : [];

      if (onProgress) onProgress({ step: 3, total: 3, message: `Constructed ${operations.length} canvas operations with Llama 3.1.` });

      return {
        intent: parsed.intent || prompt,
        explanation: parsed.explanation || 'Constructed design elements using Llama 3.1 local model.',
        operations
      };
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new CancellationError();
      }
      if (err instanceof ProviderError || err instanceof CancellationError) {
        throw err;
      }
      throw new ProviderError(err.message, 'ollama', null, err);
    }
  }
}
