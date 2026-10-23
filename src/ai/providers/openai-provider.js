/**
 * DesignForge AI - OpenAI & OpenAI-Compatible Provider Adapter
 * Supports OpenAI (GPT-4o), Ollama (localhost:11434/v1), LM Studio, and custom LLM endpoints
 */

import { BaseProvider } from './provider-base.js';
import { DESIGN_TOOLS_SCHEMA, ProviderError, CancellationError } from '../types.js';

export class OpenAIProvider extends BaseProvider {
  constructor(config = {}) {
    super({
      name: 'openai',
      model: config.model || 'gpt-4o',
      endpoint: config.endpoint || 'https://api.openai.com/v1',
      ...config
    });
  }

  async testConnection() {
    if (!this.apiKey && !this.endpoint.includes('localhost')) {
      return { success: false, message: 'API key is required for hosted OpenAI inference.' };
    }

    try {
      const res = await fetch(`${this.endpoint}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      if (res.ok) {
        return { success: true, message: `Connected to ${this.endpoint} successfully.` };
      }
      return { success: false, message: `Server returned status ${res.status}: ${res.statusText}` };
    } catch (err) {
      return { success: false, message: `Connection failed: ${err.message}` };
    }
  }

  async generate(prompt, context, options = {}) {
    const { signal, onProgress } = options;
    this.checkSignal(signal);

    if (!this.apiKey && !this.endpoint.includes('localhost')) {
      throw new ProviderError('API Key not configured. Please supply an API key in settings or use Local Provider.', 'openai', 401);
    }

    if (onProgress) onProgress({ step: 1, total: 3, message: `Connecting to ${this.model}...` });

    const tools = DESIGN_TOOLS_SCHEMA.map(t => ({
      type: 'function',
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters
      }
    }));

    const messages = [
      {
        role: 'system',
        content: `You are DesignForge AI, a native design platform model. You operate on the user's active canvas document by calling design tools.
Available context:
${JSON.stringify(context, null, 2)}

Rules:
1. Call appropriate design tools to fulfill user intent (CreateNode, UpdateNode, ApplyLayout, etc.).
2. Use existing design tokens for colors, gaps, and radii wherever possible.
3. Keep layout responsive using Auto-Layout stack-horizontal or stack-vertical.
4. Always provide an explanation of the changes made.`
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    try {
      const response = await fetch(`${this.endpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          tools,
          tool_choice: 'auto',
          temperature: 0.2
        }),
        signal
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new ProviderError(errorText || response.statusText, 'openai', response.status);
      }

      this.checkSignal(signal);
      if (onProgress) onProgress({ step: 2, total: 3, message: 'Parsing structured operations...' });

      const data = await response.json();
      const choice = data.choices?.[0];
      const toolCalls = choice?.message?.tool_calls || [];
      const explanation = choice?.message?.content || 'Completed requested design modifications.';

      const operations = [];
      for (const tc of toolCalls) {
        try {
          const args = JSON.parse(tc.function.arguments);
          operations.push({
            type: tc.function.name,
            ...args
          });
        } catch (e) {
          console.warn('Failed to parse tool call arguments:', tc);
        }
      }

      return {
        intent: prompt,
        explanation,
        operations
      };
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new CancellationError();
      }
      if (err instanceof ProviderError || err instanceof CancellationError) {
        throw err;
      }
      throw new ProviderError(err.message, 'openai', null, err);
    }
  }
}
