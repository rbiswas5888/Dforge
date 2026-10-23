/**
 * DesignForge AI — Variables, Design Tokens & Multi-Mode Engine
 * Supports Collections (Primitives, Semantic, Component Tokens), Hierarchical Modes (Light, Dark, etc.),
 * Strict Variable Scoping, Token Aliasing with cycle detection, and Hexagon Popover metadata.
 */

export const VariableScope = {
  ALL: 'ALL',
  COLOR_FILL: 'COLOR_FILL',
  COLOR_STROKE: 'COLOR_STROKE',
  CORNER_RADIUS: 'CORNER_RADIUS',
  SPACING_PADDING: 'SPACING_PADDING',
  SPACING_GAP: 'SPACING_GAP',
  FONT_SIZE: 'FONT_SIZE',
  LINE_HEIGHT: 'LINE_HEIGHT',
  OPACITY: 'OPACITY',
  TEXT_CONTENT: 'TEXT_CONTENT',
  BOOLEAN: 'BOOLEAN'
};

export class VariableCollection {
  constructor(id, name, modes = ['default'], defaultModeId = 'default') {
    this.id = id;
    this.name = name; // 'Primitives' | 'Semantic' | 'Component Tokens' | etc.
    this.modes = modes; // ['Light', 'Dark'] etc.
    this.defaultModeId = defaultModeId;
    this.variables = {}; // Record<VariableID, VariableDefinition>
  }

  addVariable(variable) {
    if (!variable || !variable.id) throw new Error('Variable must have an id');
    this.variables[variable.id] = {
      id: variable.id,
      name: variable.name,
      description: variable.description || '',
      type: variable.type || 'COLOR', // 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN'
      scopes: variable.scopes || [VariableScope.ALL],
      valuesByMode: { ...(variable.valuesByMode || { [this.defaultModeId]: variable.defaultValue || '' }) }
    };
    return this.variables[variable.id];
  }

  getVariable(id) {
    return this.variables[id] || null;
  }
}

export class VariablesEngine {
  constructor() {
    this.collections = {};
    this.activeModesByCollection = {}; // collectionId -> modeId
    this.initDefaultCollections();
  }

  initDefaultCollections() {
    // 1. Primitives Collection
    const primitives = new VariableCollection('col_primitives', 'Primitives', ['default'], 'default');
    primitives.addVariable({
      id: 'color.blue.500',
      name: 'Blue / 500',
      type: 'COLOR',
      scopes: [VariableScope.COLOR_FILL, VariableScope.COLOR_STROKE],
      valuesByMode: { default: '#3B82F6' }
    });
    primitives.addVariable({
      id: 'color.blue.600',
      name: 'Blue / 600',
      type: 'COLOR',
      scopes: [VariableScope.COLOR_FILL, VariableScope.COLOR_STROKE],
      valuesByMode: { default: '#2563EB' }
    });
    primitives.addVariable({
      id: 'color.gray.900',
      name: 'Gray / 900',
      type: 'COLOR',
      scopes: [VariableScope.COLOR_FILL, VariableScope.COLOR_STROKE],
      valuesByMode: { default: '#0F172A' }
    });
    primitives.addVariable({
      id: 'color.gray.50',
      name: 'Gray / 50',
      type: 'COLOR',
      scopes: [VariableScope.COLOR_FILL, VariableScope.COLOR_STROKE],
      valuesByMode: { default: '#F8FAFC' }
    });
    primitives.addVariable({
      id: 'space.4',
      name: 'Space / 4',
      type: 'FLOAT',
      scopes: [VariableScope.SPACING_PADDING, VariableScope.SPACING_GAP],
      valuesByMode: { default: 16 }
    });
    primitives.addVariable({
      id: 'radius.md',
      name: 'Radius / Medium',
      type: 'FLOAT',
      scopes: [VariableScope.CORNER_RADIUS],
      valuesByMode: { default: 8 }
    });
    this.collections[primitives.id] = primitives;
    this.activeModesByCollection[primitives.id] = 'default';

    // 2. Semantic Collection (with Light / Dark modes)
    const semantic = new VariableCollection('col_semantic', 'Semantic Tokens', ['Light', 'Dark'], 'Light');
    semantic.addVariable({
      id: 'semantic.bg.surface',
      name: 'Background / Surface',
      type: 'COLOR',
      scopes: [VariableScope.COLOR_FILL],
      valuesByMode: {
        Light: '{color.gray.50}',
        Dark: '{color.gray.900}'
      }
    });
    semantic.addVariable({
      id: 'semantic.action.primary',
      name: 'Action / Primary',
      type: 'COLOR',
      scopes: [VariableScope.COLOR_FILL, VariableScope.COLOR_STROKE],
      valuesByMode: {
        Light: '{color.blue.500}',
        Dark: '{color.blue.600}'
      }
    });
    this.collections[semantic.id] = semantic;
    this.activeModesByCollection[semantic.id] = 'Light';
  }

  setCollectionMode(collectionId, modeId) {
    if (this.collections[collectionId]) {
      this.activeModesByCollection[collectionId] = modeId;
    }
  }

  getActiveMode(collectionId) {
    return this.activeModesByCollection[collectionId] || this.collections[collectionId]?.defaultModeId || 'default';
  }

  findVariable(variableId) {
    for (const col of Object.values(this.collections)) {
      if (col.variables[variableId]) {
        return { variable: col.variables[variableId], collection: col };
      }
    }
    return null;
  }

  /**
   * Resolves a variable token or alias recursively.
   * Prevents circular reference lockups with recursion detection.
   */
  resolve(variableIdOrAlias, modeOverride = null, visited = new Set()) {
    if (!variableIdOrAlias) return null;

    let varId = String(variableIdOrAlias).trim();
    // Handle curly syntax: "{color.blue.500}" -> "color.blue.500"
    if (varId.startsWith('{') && varId.endsWith('}')) {
      varId = varId.slice(1, -1).trim();
    }

    if (visited.has(varId)) {
      throw new Error(`Circular reference detected in design token alias: ${varId}`);
    }
    visited.add(varId);

    const match = this.findVariable(varId);
    if (!match) {
      // If not a known variable ID, could be raw literal
      return variableIdOrAlias;
    }

    const { variable, collection } = match;
    const mode = modeOverride || this.getActiveMode(collection.id);
    let val = variable.valuesByMode[mode];

    if (val === undefined) {
      val = variable.valuesByMode[collection.defaultModeId];
    }

    // If value references another token (alias)
    if (typeof val === 'string' && val.startsWith('{') && val.endsWith('}')) {
      return this.resolve(val, modeOverride, visited);
    }

    return val;
  }

  /**
   * Filter available variables matching a given property scope
   */
  getVariablesForScope(targetScope) {
    const results = [];
    for (const col of Object.values(this.collections)) {
      const mode = this.getActiveMode(col.id);
      for (const v of Object.values(col.variables)) {
        const isAllowed = v.scopes.includes(VariableScope.ALL) || v.scopes.includes(targetScope);
        if (isAllowed) {
          const resolvedVal = this.resolve(v.id, mode);
          results.push({
            id: v.id,
            name: v.name,
            collectionName: col.name,
            collectionId: col.id,
            type: v.type,
            activeMode: mode,
            rawModeValue: v.valuesByMode[mode] || v.valuesByMode[col.defaultModeId],
            resolvedValue: resolvedVal
          });
        }
      }
    }
    return results;
  }
}
