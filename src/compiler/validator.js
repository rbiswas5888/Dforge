/**
 * DesignForge AI - Compiler Document Pre-Flight Validator
 * Verifies document integrity, node references, and schema compliance prior to compilation
 */

export class CompilerValidator {
  constructor(document) {
    this.doc = document;
  }

  validate() {
    const errors = [];
    const warnings = [];

    if (!this.doc) {
      return { valid: false, errors: ['Document is null or undefined'], warnings: [] };
    }

    if (!this.doc.schemaVersion) {
      errors.push('Missing schemaVersion in document manifest.');
    }

    if (!this.doc.pages || !Array.isArray(this.doc.pages) || this.doc.pages.length === 0) {
      errors.push('Document contains no pages to compile.');
      return { valid: false, errors, warnings };
    }

    // Build token dictionary for binding checks
    const tokenSet = new Set();
    if (this.doc.tokens && Array.isArray(this.doc.tokens)) {
      for (const col of this.doc.tokens) {
        for (const t of col.tokens || []) {
          tokenSet.add(t.id);
        }
      }
    }

    // Build component definition set
    const compSet = new Set((this.doc.components || []).map(c => c.id));

    // Validate each page
    this.doc.pages.forEach((page, pIdx) => {
      const pPrefix = `Page #${pIdx + 1} ('${page.name || page.id}'): `;

      if (!page.nodes || typeof page.nodes !== 'object') {
        errors.push(`${pPrefix}Missing or invalid nodes map.`);
        return;
      }

      if (!page.rootIds || !Array.isArray(page.rootIds)) {
        errors.push(`${pPrefix}Missing rootIds array.`);
        return;
      }

      if (page.rootIds.length === 0) {
        warnings.push(`${pPrefix}Contains zero root elements.`);
      }

      // Check rootIds exist
      for (const rid of page.rootIds) {
        if (!page.nodes[rid]) {
          errors.push(`${pPrefix}Root node ID '${rid}' does not exist in nodes dictionary.`);
        }
      }

      // Check childIds and cycles
      for (const [nid, node] of Object.entries(page.nodes)) {
        if (!node.type) {
          errors.push(`${pPrefix}Node '${nid}' has undefined type.`);
        }

        if (node.childIds) {
          for (const cid of node.childIds) {
            if (!page.nodes[cid]) {
              errors.push(`${pPrefix}Node '${node.name}' references non-existent child '${cid}'.`);
            }
            if (cid === nid) {
              errors.push(`${pPrefix}Circular reference: Node '${nid}' has itself as a child.`);
            }
          }
        }

        // Check component references
        if (node.type === 'component-instance' && node.componentRef) {
          if (!compSet.has(node.componentRef)) {
            warnings.push(`${pPrefix}Component instance '${node.name}' references unregistered component '${node.componentRef}'.`);
          }
        }

        // Check token bindings
        if (node.tokenBindings) {
          for (const [prop, tokenId] of Object.entries(node.tokenBindings)) {
            if (!tokenSet.has(tokenId)) {
              warnings.push(`${pPrefix}Node '${node.name}' binds property '${prop}' to non-existent token '${tokenId}'.`);
            }
          }
        }
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}
