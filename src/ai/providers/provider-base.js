/**
 * DesignForge AI - Base Provider Adapter
 * Abstract interface for LLM inference providers with cancellation and streaming support
 */

import { CancellationError, ProviderError } from '../types.js';

export class BaseProvider {
  constructor(config = {}) {
    this.name = config.name || 'base';
    this.model = config.model || '';
    this.apiKey = config.apiKey || '';
    this.endpoint = config.endpoint || '';
    this.timeout = config.timeout || 30000;
  }

  /**
   * Generates a structured design response or tool call plan
   * @param {string} prompt - User instruction
   * @param {Object} context - Document context
   * @param {Object} options - { signal: AbortSignal, onProgress: Function }
   * @returns {Promise<{ intent: string, explanation: string, operations: Array }>}
   */
  async generate(prompt, context, options = {}) {
    throw new Error('generate() must be implemented by provider subclasses');
  }

  /**
   * Tests connection to verify model endpoint and credentials
   */
  async testConnection() {
    throw new Error('testConnection() must be implemented by provider subclasses');
  }

  checkSignal(signal) {
    if (signal && signal.aborted) {
      throw new CancellationError();
    }
  }
}
