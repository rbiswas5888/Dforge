/**
 * DesignForge AI — Unified Design System Subsystem
 * Central Authoritative Design System Registry
 * Conforms to Master Specification Section 3, 4, 8, 17
 */

import {
  createDesignSystem,
  createToken,
  createVariable,
  createComponentDef,
  createAssetRecord,
  TOKEN_CATEGORIES,
  VARIABLE_TYPES,
  THEME_MODES,
  generateDSId
} from './types.js';

export class DesignSystemRegistry {
  constructor(documentModel = null, storageEngine = null) {
    this.doc = documentModel;
    this.storage = storageEngine;
    this.system = this.loadOrCreateSystem();
  }

  loadOrCreateSystem() {
    // If document already embeds a design system model, load it
    if (this.doc && this.doc.designSystem) {
      return this.doc.designSystem;
    }

    // Initialize clean default system with existing document tokens migrated
    const ds = createDesignSystem('DesignForge Core System');
    this.migrateLegacyDocTokens(ds);
    if (this.doc) {
      this.doc.designSystem = ds;
    }
    return ds;
  }

  /**
   * Safe migration of legacy doc.tokens array into unified registry
   */
  migrateLegacyDocTokens(ds) {
    if (!this.doc || !this.doc.tokens) return;
    for (const group of this.doc.tokens) {
      const collectionId = group.id || `col_${group.name.toLowerCase().replace(/\s+/g, '_')}`;
      if (!ds.collections.some(c => c.id === collectionId)) {
        ds.collections.push({ id: collectionId, name: group.name });
      }

      for (const t of group.tokens || []) {
        if (!ds.tokens[t.id]) {
          const tok = createToken(t.type || 'color', t.name, t.value, {
            id: t.id,
            collectionId
          });
          ds.tokens[t.id] = tok;

          // Auto-sync into Assets view
          this.syncToAsset(ds, 'token', tok.name, tok.id, tok.category);

          // Auto-sync into Variables view
          if (!ds.variables[t.id]) {
            const varType = t.type === 'color' ? VARIABLE_TYPES.COLOR : VARIABLE_TYPES.DIMENSION;
            const variable = createVariable(tok.name, varType, tok.value, {
              id: `var_${t.id}`,
              linkedTokenId: tok.id,
              collectionId
            });
            ds.variables[variable.id] = variable;
            this.syncToAsset(ds, 'variable', variable.name, variable.id, variable.type);
          }
        }
      }
    }
  }

  // --- Automatic Synchronization & Registry Rules (Section 8) ---

  syncToAsset(ds, type, name, sourceId, category = 'General') {
    const existingAssetKey = Object.keys(ds.assets).find(
      k => ds.assets[k].sourceId === sourceId && ds.assets[k].type === type
    );

    if (existingAssetKey) {
      ds.assets[existingAssetKey].name = name;
      ds.assets[existingAssetKey].category = category;
    } else {
      const asset = createAssetRecord(type, name, { sourceId, category });
      ds.assets[asset.id] = asset;
    }
  }

  removeFromAsset(ds, sourceId) {
    for (const assetId of Object.keys(ds.assets)) {
      if (ds.assets[assetId].sourceId === sourceId) {
        delete ds.assets[assetId];
      }
    }
  }

  // --- Tokens CRUD ---

  addToken(category, name, value, options = {}) {
    const token = createToken(category, name, value, options);
    this.system.tokens[token.id] = token;
    this.system.updatedAt = new Date().toISOString();

    // Auto-sync to Assets inventory
    this.syncToAsset(this.system, 'token', token.name, token.id, token.category);

    // Keep doc.tokens synced for backwards compatibility with compiler and renderer
    this.syncDocTokensArray();
    this.persist();
    return token;
  }

  updateToken(id, updates = {}) {
    const token = this.system.tokens[id];
    if (!token) throw new Error(`Token ${id} not found.`);

    Object.assign(token, updates);
    token.updatedAt = new Date().toISOString();
    this.system.updatedAt = token.updatedAt;

    // Update Asset projection
    this.syncToAsset(this.system, 'token', token.name, token.id, token.category);

    // If a linked variable exists, propagate value
    for (const varId of Object.keys(this.system.variables)) {
      const v = this.system.variables[varId];
      if (v.linkedTokenId === id && updates.value !== undefined) {
        v.value = updates.value;
        v.updatedAt = token.updatedAt;
      }
    }

    this.syncDocTokensArray();
    this.persist();
    return token;
  }

  deleteToken(id, replacementTokenId = null) {
    const token = this.system.tokens[id];
    if (!token) return false;

    // Dependents validation: check if components or nodes reference this token
    const dependents = this.findTokenDependents(id);
    if (dependents.length > 0 && !replacementTokenId) {
      throw new Error(`Cannot delete token "${token.name}": referenced by ${dependents.length} layer(s). Specify a replacement token.`);
    }

    // Rebind dependents to replacement if provided
    if (replacementTokenId && this.system.tokens[replacementTokenId]) {
      this.rebindDependents(id, replacementTokenId);
    }

    delete this.system.tokens[id];
    this.removeFromAsset(this.system, id);
    this.syncDocTokensArray();
    this.persist();
    return true;
  }

  // --- Variables CRUD ---

  addVariable(name, type, value, options = {}) {
    const variable = createVariable(name, type, value, options);
    this.system.variables[variable.id] = variable;
    this.system.updatedAt = new Date().toISOString();

    this.syncToAsset(this.system, 'variable', variable.name, variable.id, variable.type);
    this.persist();
    return variable;
  }

  updateVariable(id, updates = {}) {
    const v = this.system.variables[id];
    if (!v) throw new Error(`Variable ${id} not found.`);

    Object.assign(v, updates);
    v.updatedAt = new Date().toISOString();
    this.system.updatedAt = v.updatedAt;

    this.syncToAsset(this.system, 'variable', v.name, v.id, v.type);
    this.persist();
    return v;
  }

  deleteVariable(id) {
    if (!this.system.variables[id]) return false;
    delete this.system.variables[id];
    this.removeFromAsset(this.system, id);
    this.persist();
    return true;
  }

  // --- Components CRUD ---

  registerComponent(name, options = {}) {
    const comp = createComponentDef(name, options);
    this.system.components[comp.id] = comp;
    this.system.updatedAt = new Date().toISOString();

    this.syncToAsset(this.system, 'component', comp.name, comp.id, comp.category);
    this.persist();
    return comp;
  }

  updateComponent(id, updates = {}) {
    const comp = this.system.components[id];
    if (!comp) throw new Error(`Component ${id} not found.`);

    Object.assign(comp, updates);
    comp.updatedAt = new Date().toISOString();
    this.system.updatedAt = comp.updatedAt;

    this.syncToAsset(this.system, 'component', comp.name, comp.id, comp.category);
    this.persist();
    return comp;
  }

  // --- Live Computed Overview Metrics (Section 4) ---

  computeOverviewMetrics() {
    const tokens = Object.values(this.system.tokens);
    const variables = Object.values(this.system.variables);
    const components = Object.values(this.system.components);
    const assets = Object.values(this.system.assets);

    // Compute variants count
    let totalVariants = 0;
    for (const c of components) {
      totalVariants += (c.variants || []).length;
    }

    // Detect duplicates (e.g., exact same hex color or spacing across multiple tokens)
    const duplicateCandidates = [];
    const valMap = new Map();
    for (const t of tokens) {
      const key = `${t.category}:${t.value}`;
      if (valMap.has(key)) {
        duplicateCandidates.push({
          tokenA: valMap.get(key),
          tokenB: t,
          value: t.value,
          category: t.category
        });
      } else {
        valMap.set(key, t);
      }
    }

    // Detect raw unbound values in the document model
    let unboundCount = 0;
    if (this.doc && this.doc.pages) {
      for (const p of this.doc.pages) {
        for (const n of Object.values(p.nodes || {})) {
          if (!n.tokenBindings || Object.keys(n.tokenBindings).length === 0) {
            if (n.style?.fills?.length > 0) unboundCount++;
          }
        }
      }
    }

    // Unused items
    const unusedTokens = tokens.filter(t => t.usageCount === 0);

    return {
      totalTokens: tokens.length,
      totalVariables: variables.length,
      totalComponents: components.length,
      totalVariants,
      totalAssets: assets.length,
      activeMode: this.system.activeMode,
      version: this.system.version,
      duplicateCandidatesCount: duplicateCandidates.length,
      duplicateCandidates,
      unboundCount,
      unusedCount: unusedTokens.length,
      unusedTokens,
      status: this.system.status
    };
  }

  // --- Themes & Modes (Section 5.3) ---

  setActiveMode(mode) {
    if (!this.system.modes.includes(mode)) {
      this.system.modes.push(mode);
    }
    this.system.activeMode = mode;
    this.persist();
  }

  getResolvedTokenValue(tokenId, mode = null) {
    const token = this.system.tokens[tokenId];
    if (!token) return null;
    const targetMode = mode || this.system.activeMode;

    if (token.modeOverrides && token.modeOverrides[targetMode]) {
      const overrideVal = token.modeOverrides[targetMode];
      if (overrideVal.startsWith('tok_') && this.system.tokens[overrideVal]) {
        return this.getResolvedTokenValue(overrideVal, targetMode);
      }
      return overrideVal;
    }

    if (token.refId && this.system.tokens[token.refId]) {
      return this.getResolvedTokenValue(token.refId, targetMode);
    }

    return token.value;
  }

  // --- Versioning & Publication (Section 17) ---

  publishRelease(versionTag, changeSummary = 'Release publish') {
    const release = {
      id: generateDSId('rel'),
      version: versionTag || this.system.version,
      publishedAt: new Date().toISOString(),
      summary: changeSummary,
      snapshot: {
        tokenCount: Object.keys(this.system.tokens).length,
        variableCount: Object.keys(this.system.variables).length,
        componentCount: Object.keys(this.system.components).length
      }
    };

    this.system.version = versionTag;
    this.system.status = 'published';
    this.system.history.unshift(release);
    this.persist();
    return release;
  }

  // --- Dependency Graph Helpers ---

  findTokenDependents(tokenId) {
    const deps = [];
    if (!this.doc || !this.doc.pages) return deps;
    for (const page of this.doc.pages) {
      for (const [nodeId, node] of Object.entries(page.nodes || {})) {
        if (node.tokenBindings) {
          for (const [prop, bindingTokId] of Object.entries(node.tokenBindings)) {
            if (bindingTokId === tokenId) {
              deps.push({ nodeId, nodeName: node.name, pageId: page.id, property: prop });
            }
          }
        }
      }
    }
    return deps;
  }

  rebindDependents(oldTokenId, newTokenId) {
    if (!this.doc || !this.doc.pages) return;
    for (const page of this.doc.pages) {
      for (const node of Object.values(page.nodes || {})) {
        if (node.tokenBindings) {
          for (const [prop, bindingTokId] of Object.entries(node.tokenBindings)) {
            if (bindingTokId === oldTokenId) {
              node.tokenBindings[prop] = newTokenId;
            }
          }
        }
      }
    }
  }

  syncDocTokensArray() {
    if (!this.doc) return;
    const collectionsMap = new Map();

    for (const t of Object.values(this.system.tokens)) {
      const colId = t.collectionId || 'collection_default';
      if (!collectionsMap.has(colId)) {
        const colDef = this.system.collections.find(c => c.id === colId);
        collectionsMap.set(colId, {
          id: colId,
          name: colDef ? colDef.name : 'General Tokens',
          tokens: []
        });
      }
      collectionsMap.get(colId).tokens.push({
        id: t.id,
        name: t.name,
        type: t.type,
        value: this.getResolvedTokenValue(t.id)
      });
    }

    this.doc.tokens = Array.from(collectionsMap.values());
  }

  persist() {
    if (this.storage && this.doc) {
      this.storage.saveAutosave(this.doc);
    }
  }
}
