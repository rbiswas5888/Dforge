/**
 * DesignForge AI - Local-First Project Persistence & Storage Engine
 * Autosave, .dforge project file import/export, and schema migration
 */

import { SCHEMA_VERSION, createInitialDocument } from './document.js';

const AUTOSAVE_KEY = 'designforge_autosave_project';

export class StorageEngine {
  constructor() {
    this.autosaveTimer = null;
  }

  /**
   * Autosaves document state to browser storage
   */
  scheduleAutosave(document, delay = 500) {
    if (typeof localStorage === 'undefined') return false;
    if (this.autosaveTimer) clearTimeout(this.autosaveTimer);
    this.autosaveTimer = setTimeout(() => {
      try {
        const payload = JSON.stringify(document);
        localStorage.setItem(AUTOSAVE_KEY, payload);
        return true;
      } catch (err) {
        console.warn('Autosave warning:', err);
        return false;
      }
    }, delay);
  }

  /**
   * Loads autosaved document or returns null
   */
  loadAutosave() {
    if (typeof localStorage === 'undefined') return null;
    try {
      const data = localStorage.getItem(AUTOSAVE_KEY);
      if (data) {
        const doc = JSON.parse(data);
        if (doc && doc.schemaVersion === SCHEMA_VERSION && doc.pages?.length > 0) {
          return doc;
        }
      }
    } catch (err) {
      console.warn('Failed to parse autosave data:', err);
    }
    return null;
  }

  /**
   * Clears autosaved project
   */
  clearAutosave() {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(AUTOSAVE_KEY);
    }
  }

  /**
   * Exports document as a downloadable .dforge JSON file
   */
  exportDForgeFile(document) {
    const filename = `${(document.name || 'project').toLowerCase().replace(/\s+/g, '-')}.dforge`;
    const payload = JSON.stringify(document, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement ? window.document.createElement('a') : null;
    if (a) {
      a.href = url;
      a.download = filename;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    return filename;
  }

  /**
   * Creates a structured .dforge container bundle conforming to Blueprint Section 6.6
   * @param {Object} document
   * @returns {Object} Container bundle mapping filenames to contents
   */
  createDForgeBundle(document) {
    const manifest = {
      format: 'dforge',
      schemaVersion: document.schemaVersion || SCHEMA_VERSION,
      documentId: document.id,
      name: document.name,
      createdAt: document.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      capabilities: ['scene-graph', 'design-system', 'prototype'],
      assetManifest: []
    };

    const bundle = {
      'manifest.json': manifest,
      'document.json': document,
      'design-system/tokens.json': document.tokens || document.tokenCollections || [],
      'design-system/components.json': document.components || [],
      'prototype/flows.json': document.prototypeFlows || []
    };

    return bundle;
  }

  /**
   * Unpacks a .dforge container bundle or parsed JSON document
   * @param {Object|string} bundleOrJson
   * @returns {Object} Canonical design document
   */
  unpackDForgeBundle(bundleOrJson) {
    if (typeof bundleOrJson === 'string') {
      try {
        const parsed = JSON.parse(bundleOrJson);
        return this.unpackDForgeBundle(parsed);
      } catch (err) {
        throw new Error(`Failed to parse .dforge file: ${err.message}`);
      }
    }

    if (bundleOrJson && bundleOrJson['manifest.json'] && bundleOrJson['document.json']) {
      const doc = bundleOrJson['document.json'];
      if (bundleOrJson['design-system/tokens.json'] && (!doc.tokens || doc.tokens.length === 0)) {
        doc.tokens = bundleOrJson['design-system/tokens.json'];
      }
      if (bundleOrJson['prototype/flows.json'] && (!doc.prototypeFlows || doc.prototypeFlows.length === 0)) {
        doc.prototypeFlows = bundleOrJson['prototype/flows.json'];
      }
      return doc;
    }

    // Direct document schema fallback
    if (bundleOrJson && bundleOrJson.schemaVersion && bundleOrJson.pages) {
      return bundleOrJson;
    }

    throw new Error('Invalid DesignForge file: missing schemaVersion or manifest.json');
  }

  /**
   * Parses an imported .dforge file content
   */
  parseDForgeContent(jsonString) {
    return this.unpackDForgeBundle(jsonString);
  }
}

