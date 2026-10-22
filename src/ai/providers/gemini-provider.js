/**
 * DesignForge AI - Google Gemini API Provider Adapter
 * Supports Gemini 1.5 Pro/Flash and 2.0 with tool declarations and structured outputs
 */

import { BaseProvider } from './provider-base.js';
import { DESIGN_TOOLS_SCHEMA, ProviderError, CancellationError } from '../types.js';

export class GeminiProvider extends BaseProvider {
  constructor(config = {}) {
    super({
      name: 'gemini',
      model: config.model || 'gemini-1.5-flash',
      endpoint: 'https://generativelanguage.googleapis.com/v1beta',
      ...config
    });
  }

  async testConnection() {
    if (!this.apiKey) {
      return { success: false, message: 'Gemini API key is required.' };
    }
    try {
      const res = await fetch(`${this.endpoint}/models/${this.model}?key=${this.apiKey}`);
      if (res.ok) {
        return { success: true, message: `Connected to Gemini (${this.model}) successfully.` };
      }
      return { success: false, message: `Server error: ${res.statusText}` };
    } catch (err) {
      return { success: false, message: `Connection test failed: ${err.message}` };
    }
  }

  async generate(prompt, context, options = {}) {
    const { signal, onProgress } = options;
    this.checkSignal(signal);

    if (!this.apiKey) {
      throw new ProviderError('Gemini API key is not configured.', 'gemini', 401);
    }

    if (onProgress) onProgress({ step: 1, total: 3, message: `Contacting Gemini API (${this.model})...` });

    // Format Gemini function declarations
    const functionDeclarations = DESIGN_TOOLS_SCHEMA.map(t => ({
      name: t.name,
      description: t.description,
      parameters: t.parameters
    }));

    const url = `${this.endpoint}/models/${this.model}:generateContent?key=${this.apiKey}`;

    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `You are DesignForge AI. You operate on an active design document by calling design tools.
Document Context:
${JSON.stringify(context, null, 2)}

User Request: "${prompt}"

Produce structured design operations by calling available tools.`
            }
          ]
        }
      ],
      tools: [{ functionDeclarations }]
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal
      });

      if (!response.ok) {
        const txt = await response.text();
        throw new ProviderError(txt || response.statusText, 'gemini', response.status);
      }

      this.checkSignal(signal);
      if (onProgress) onProgress({ step: 2, total: 3, message: 'Processing Gemini response...' });

      const data = await response.json();
      const candidate = data.candidates?.[0];
      const parts = candidate?.content?.parts || [];

      const operations = [];
      let explanation = '';

      for (const part of parts) {
        if (part.text) {
          explanation += part.text;
        }
        if (part.functionCall) {
          operations.push({
            type: part.functionCall.name,
            ...part.functionCall.args
          });
        }
      }

      return {
        intent: prompt,
        explanation: explanation.trim() || 'Executed design modifications with Gemini.',
        operations
      };
    } catch (err) {
      if (err.name === 'AbortError') throw new CancellationError();
      if (err instanceof ProviderError || err instanceof CancellationError) throw err;
      throw new ProviderError(err.message, 'gemini', null, err);
    }
  }
}
