/**
 * DesignForge AI - Deterministic Design-to-React Compiler Gateway
 * Connects the design platform to the modular DesignForgeReactCompiler
 */

import { DesignForgeReactCompiler } from '../compiler/index.js';

export { DesignForgeReactCompiler };

export class ReactCompiler extends DesignForgeReactCompiler {
  constructor(document, options = {}) {
    super(document, options);
  }
}
