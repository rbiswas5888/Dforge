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
You operate on an active digital design canvas using the Llama 3.1 model.
Your task is to convert the user's design instructions into high-quality, structured layout operations.

ACTIVE CANVAS CONTEXT:
${JSON.stringify(context, null, 2)}

AVAILABLE DESIGN TOOL OPERATIONS:
${toolsDescription}

OUTPUT FORMAT RULES:
You MUST respond with a valid JSON object matching this schema:
{
  "intent": "<short summary of design task>",
  "explanation": "<explanation of design choices, layout structure, color harmony, and hierarchy>",
  "operations": [
    {
      "type": "<OperationName, e.g. CreateNode, UpdateNode, ApplyLayout, CreateComponent>",
      ...<operation properties>
    }
  ]
}

DESIGN GUIDELINES:
1. Always structure cards, pages, and components using Auto-Layout ('stack-horizontal' or 'stack-vertical') with clean padding (16-32) and gap (12-24).
2. Use modern colors: dark slate surfaces (#0f172a, #1e293b, #334155), vivid accents (#0d99ff, #8b5cf6, #10b981), and legible text (#f8fafc, #94a3b8).
3. Emit all necessary child layers (title text, subtitle, action buttons, metrics, containers) to create a complete, polished design.
4. Output RAW JSON ONLY. No markdown wrappers, no backticks, no preamble.`;

    try {
      const targetUrl = `${this.rawEndpoint}/api/generate`;
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          prompt: `${systemPrompt}\n\nUSER REQUEST: ${prompt}\n\nJSON:`,
          format: 'json',
          stream: false,
          options: {
            temperature: 0.2,
            num_predict: 2048
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
      const rawResponse = data.response;
      let parsed;

      try {
        parsed = JSON.parse(rawResponse);
      } catch (parseErr) {
        // Fallback: extract JSON with regex if model added wrapping text
        const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new ProviderError('Failed to parse structured JSON from Llama 3.1', 'ollama', null, parseErr);
        }
      }

      const operations = Array.isArray(parsed.operations) ? parsed.operations : [];

      if (onProgress) onProgress({ step: 3, total: 3, message: `Constructed ${operations.length} canvas operations.` });

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
