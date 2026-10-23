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
   * Serializes a document to .dforge JSON string
   */
  serializeDocument(document) {
    return JSON.stringify(document, null, 2);
  }

  /**
   * Parses an imported .dforge file content
   */
  parseDForgeContent(jsonString) {
    const doc = JSON.parse(jsonString);
    if (!doc.schemaVersion || !doc.pages) {
      throw new Error('Invalid DesignForge file: missing schemaVersion or pages');
    }
    return doc;
  }

  /**
   * Deserializes a .dforge JSON string
   */
  deserializeDocument(jsonString) {
    return this.parseDForgeContent(jsonString);
  }
}
