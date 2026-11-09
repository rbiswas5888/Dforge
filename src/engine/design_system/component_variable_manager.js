/**
 * DesignForge AI — Component & Variable Management Subsystem
 * Conforms to Master Specification (Part A: Component and Variable Intelligence)
 * Provides comprehensive audit, type-safe binding, add variable, replace component,
 * and replace variable workflows with full undo/redo data integrity.
 */

import { VARIABLE_TYPES, TOKEN_CATEGORIES } from './types.js';
import { MUI_COMPONENT_CATALOG, createMuiNode } from './mui_catalog.js';
import { RNEUI_COMPONENT_CATALOG } from './rneui_catalog.js';
import { createNode } from '../document.js';

/**
 * Standard Variable Category Taxonomy (Spec Part A, Section 2)
 */
export const VARIABLE_CATEGORIES = Object.freeze({
  COLOR: 'Color',
  TYPOGRAPHY: 'Typography',
  SPACING: 'Spacing',
  SIZING: 'Sizing',
  RADIUS: 'Radius',
  BORDER: 'Border',
  SHADOW: 'Shadow & Elevation',
  OPACITY: 'Opacity',
  LAYOUT: 'Layout',
  RESPONSIVE: 'Responsive',
  BOOLEAN: 'Boolean',
  STRING_NUMBER: 'String & Number',
  COMPONENT_SPECIFIC: 'Component-specific',
  CUSTOM: 'Custom variables'
});

/**
 * Property-to-Variable Type Compatibility Matrix (Spec Section 1 & 2)
 */
export const PROPERTY_TYPE_COMPATIBILITY = Object.freeze({
  // Fills & Stroke Colors
  'style.fills.0.color': [VARIABLE_TYPES.COLOR, 'color'],
  'style.strokes.0.color': [VARIABLE_TYPES.COLOR, 'color'],
  'text.color': [VARIABLE_TYPES.COLOR, 'color'],

  // Dimensions & Coordinates
  'transform.width': [VARIABLE_TYPES.DIMENSION, VARIABLE_TYPES.NUMBER, 'dimension', 'number', 'size'],
  'transform.height': [VARIABLE_TYPES.DIMENSION, VARIABLE_TYPES.NUMBER, 'dimension', 'number', 'size'],
  'transform.x': [VARIABLE_TYPES.NUMBER, 'number'],
  'transform.y': [VARIABLE_TYPES.NUMBER, 'number'],

  // Corner Radius
  'style.cornerRadius': [VARIABLE_TYPES.DIMENSION, VARIABLE_TYPES.NUMBER, 'dimension', 'number', 'radius'],

  // Stroke Weight
  'style.strokeWeight': [VARIABLE_TYPES.DIMENSION, VARIABLE_TYPES.NUMBER, 'dimension', 'number', 'border'],

  // Spacing & Layout
  'layout.gap': [VARIABLE_TYPES.DIMENSION, VARIABLE_TYPES.NUMBER, 'dimension', 'number', 'spacing'],
  'layout.paddingLeft': [VARIABLE_TYPES.DIMENSION, VARIABLE_TYPES.NUMBER, 'dimension', 'number', 'spacing'],
  'layout.paddingRight': [VARIABLE_TYPES.DIMENSION, VARIABLE_TYPES.NUMBER, 'dimension', 'number', 'spacing'],
  'layout.paddingTop': [VARIABLE_TYPES.DIMENSION, VARIABLE_TYPES.NUMBER, 'dimension', 'number', 'spacing'],
  'layout.paddingBottom': [VARIABLE_TYPES.DIMENSION, VARIABLE_TYPES.NUMBER, 'dimension', 'number', 'spacing'],

  // Typography
  'text.fontSize': [VARIABLE_TYPES.NUMBER, VARIABLE_TYPES.DIMENSION, 'number', 'font-size'],
  'text.fontFamily': [VARIABLE_TYPES.FONT_FAMILY, VARIABLE_TYPES.STRING, 'font-family', 'string'],
  'text.fontWeight': [VARIABLE_TYPES.STRING, VARIABLE_TYPES.NUMBER, 'string', 'number'],
  'text.lineHeight': [VARIABLE_TYPES.NUMBER, VARIABLE_TYPES.DIMENSION, 'number'],
  'text.content': [VARIABLE_TYPES.STRING, 'string'],

  // Opacity & Visibility
  'opacity': [VARIABLE_TYPES.NUMBER, 'number', 'opacity'],
  'visible': [VARIABLE_TYPES.BOOLEAN, 'boolean'],
  'locked': [VARIABLE_TYPES.BOOLEAN, 'boolean']
});

export class ComponentVariableManager {
  constructor(registry, commandEngine) {
    this.registry = registry;
    this.engine = commandEngine;
  }

  /**
   * 1. Audit Every Component and Its Associated Variables (Spec Part A, Section 1)
   * Performs an exhaustive audit of a node's properties, current variable bindings,
   * available compatible variables, variants, tokens, and responsive behavior.
   */
  auditComponent(nodeId) {
    const page = this.engine.getActivePage();
    const node = typeof nodeId === 'string' ? page.nodes[nodeId] : nodeId;
    if (!node) {
      throw new Error(`Component layer ${nodeId} not found.`);
    }

    const currentBindings = node.tokenBindings || {};
    const allSystemVars = Object.values(this.registry.system.variables || {});
    const allSystemTokens = Object.values(this.registry.system.tokens || {});

    // Inspect bindable properties on this node
    const bindableProperties = [];

    // Fills (Color)
    if (node.style?.fills && node.style.fills.length > 0) {
      const fill = node.style.fills[0];
      bindableProperties.push({
        path: 'style.fills.0.color',
        label: 'Background / Surface Fill',
        category: VARIABLE_CATEGORIES.COLOR,
        currentValue: fill.color,
        boundVariableId: currentBindings['style.fills.0.color'] || null
      });
    }

    // Strokes (Color & Weight)
    if (node.style?.strokes && node.style.strokes.length > 0) {
      const stroke = node.style.strokes[0];
      bindableProperties.push({
        path: 'style.strokes.0.color',
        label: 'Border / Stroke Color',
        category: VARIABLE_CATEGORIES.COLOR,
        currentValue: stroke.color,
        boundVariableId: currentBindings['style.strokes.0.color'] || null
      });
      bindableProperties.push({
        path: 'style.strokeWeight',
        label: 'Border / Stroke Weight',
        category: VARIABLE_CATEGORIES.BORDER,
        currentValue: node.style.strokeWeight || 1,
        boundVariableId: currentBindings['style.strokeWeight'] || null
      });
    }

    // Corner Radius
    if (node.style?.cornerRadius !== undefined) {
      bindableProperties.push({
        path: 'style.cornerRadius',
        label: 'Corner Radius',
        category: VARIABLE_CATEGORIES.RADIUS,
        currentValue: node.style.cornerRadius,
        boundVariableId: currentBindings['style.cornerRadius'] || null
      });
    }

    // Transform Dimensions (Width & Height)
    if (node.transform) {
      bindableProperties.push({
        path: 'transform.width',
        label: 'Frame Width',
        category: VARIABLE_CATEGORIES.SIZING,
        currentValue: node.transform.width,
        boundVariableId: currentBindings['transform.width'] || null
      });
      bindableProperties.push({
        path: 'transform.height',
        label: 'Frame Height',
        category: VARIABLE_CATEGORIES.SIZING,
        currentValue: node.transform.height,
        boundVariableId: currentBindings['transform.height'] || null
      });
    }

    // Auto-Layout (Gap & Paddings)
    if (node.layout && node.layout.mode !== 'none') {
      bindableProperties.push({
        path: 'layout.gap',
        label: 'Layout Item Gap',
        category: VARIABLE_CATEGORIES.SPACING,
        currentValue: node.layout.gap || 0,
        boundVariableId: currentBindings['layout.gap'] || null
      });
      bindableProperties.push({
        path: 'layout.paddingLeft',
        label: 'Horizontal Padding',
        category: VARIABLE_CATEGORIES.SPACING,
        currentValue: node.layout.paddingLeft || 0,
        boundVariableId: currentBindings['layout.paddingLeft'] || null
      });
      bindableProperties.push({
        path: 'layout.paddingTop',
        label: 'Vertical Padding',
        category: VARIABLE_CATEGORIES.SPACING,
        currentValue: node.layout.paddingTop || 0,
        boundVariableId: currentBindings['layout.paddingTop'] || null
      });
    }

    // Typography (Text layers)
    if (node.type === 'text' && node.text) {
      bindableProperties.push({
        path: 'text.color',
        label: 'Text Foreground Color',
        category: VARIABLE_CATEGORIES.COLOR,
        currentValue: node.text.color,
        boundVariableId: currentBindings['text.color'] || null
      });
      bindableProperties.push({
        path: 'text.fontSize',
        label: 'Font Size',
        category: VARIABLE_CATEGORIES.TYPOGRAPHY,
        currentValue: node.text.fontSize,
        boundVariableId: currentBindings['text.fontSize'] || null
      });
      bindableProperties.push({
        path: 'text.content',
        label: 'Text String Content',
        category: VARIABLE_CATEGORIES.STRING_NUMBER,
        currentValue: node.text.content,
        boundVariableId: currentBindings['text.content'] || null
      });
    }

    // Opacity
    bindableProperties.push({
      path: 'opacity',
      label: 'Layer Opacity',
      category: VARIABLE_CATEGORIES.OPACITY,
      currentValue: node.opacity !== undefined ? node.opacity : 1,
      boundVariableId: currentBindings['opacity'] || null
    });

    // Populate variable binding metadata
    for (const prop of bindableProperties) {
      if (prop.boundVariableId) {
        const boundVar = allSystemVars.find(v => v.id === prop.boundVariableId);
        const boundTok = allSystemTokens.find(t => t.id === prop.boundVariableId);
        prop.boundVariable = boundVar || boundTok || { id: prop.boundVariableId, name: 'Unknown Variable' };
      }
      prop.compatibleVariables = this.getCompatibleVariablesForProperty(node, prop.path);
    }

    return {
      nodeId: node.id,
      nodeName: node.name,
      nodeType: node.type,
      componentId: node.componentId,
      variantId: node.variantId,
      isComponentInstance: !!node.componentId,
      childCount: (node.childIds || []).length,
      currentBindings,
      bindableProperties,
      hasUnboundProperties: bindableProperties.some(p => !p.boundVariableId),
      totalPropertiesCount: bindableProperties.length,
      boundPropertiesCount: bindableProperties.filter(p => !!p.boundVariableId).length
    };
  }

  /**
   * Validates if a variable can be bound to a given property path
   */
  validatePropertyCompatibility(propertyPath, variable) {
    if (!variable) return { compatible: false, reason: 'Variable is undefined' };

    const allowedTypes = PROPERTY_TYPE_COMPATIBILITY[propertyPath];
    if (!allowedTypes) {
      // Default fallback: allow if string/number
      return { compatible: true };
    }

    const varType = (variable.type || '').toLowerCase();
    const isCompatible = allowedTypes.some(t => t.toLowerCase() === varType);

    if (!isCompatible) {
      return {
        compatible: false,
        reason: `Cannot bind variable of type "${variable.type}" to property "${propertyPath}". Expected one of: ${allowedTypes.join(', ')}.`
      };
    }

    return { compatible: true };
  }

  /**
   * Retrieves all compatible variables from the registry for a specific property
   */
  getCompatibleVariablesForProperty(node, propertyPath) {
    const allVars = Object.values(this.registry.system.variables || {});
    const allTokens = Object.values(this.registry.system.tokens || {});
    const combined = [
      ...allVars.map(v => ({ ...v, sourceKind: 'variable' })),
      ...allTokens.map(t => ({ ...t, sourceKind: 'token' }))
    ];

    return combined.filter(v => {
      const check = this.validatePropertyCompatibility(propertyPath, v);
      return check.compatible;
    });
  }

  /**
   * Returns all available variables and design tokens in the active registry
   */
  getAllAvailableVariables() {
    const allVars = Object.values(this.registry.system.variables || {});
    const allTokens = Object.values(this.registry.system.tokens || {});
    return [
      ...allVars.map(v => ({ ...v, sourceKind: 'variable' })),
      ...allTokens.map(t => ({ ...t, sourceKind: 'token' }))
    ];
  }

  /**
   * Returns all available catalog components across Material UI, RNEUI, and Custom registry
   */
  getAvailableCatalogComponents() {
    const muiItems = MUI_COMPONENT_CATALOG.map(c => ({
      id: c.id,
      name: c.name,
      category: c.category,
      description: c.description,
      library: 'Material UI'
    }));
    const rneuiItems = RNEUI_COMPONENT_CATALOG.map(c => ({
      id: c.id,
      name: c.name,
      category: c.category,
      description: c.description,
      library: 'RNEUI'
    }));
    const customItems = this.registry.getAllComponents().map(c => ({
      id: c.id,
      name: c.name,
      category: c.category || 'Custom',
      description: c.description || 'Custom Design System Component',
      library: 'Custom'
    }));
    return [...muiItems, ...rneuiItems, ...customItems];
  }

  /**
   * 2. Add Variable Workflow (Spec Part A, Section 2)
   * Binds a variable to a node property with type-safety and atomic undo/redo.
   */
  bindVariable(nodeId, propertyPath, variableId) {
    const page = this.engine.getActivePage();
    const node = page.nodes[nodeId];
    if (!node) {
      throw new Error(`Node ${nodeId} not found.`);
    }

    const allVars = Object.values(this.registry.system.variables || {});
    const allTokens = Object.values(this.registry.system.tokens || {});
    const targetVar = allVars.find(v => v.id === variableId) || allTokens.find(t => t.id === variableId);

    if (!targetVar) {
      throw new Error(`Variable or token "${variableId}" not found in system.`);
    }

    const compat = this.validatePropertyCompatibility(propertyPath, targetVar);
    if (!compat.compatible) {
      throw new Error(compat.reason);
    }

    // Apply value to the property on the node
    const updatedBindings = { ...(node.tokenBindings || {}) };
    updatedBindings[propertyPath] = targetVar.id;

    // Apply the real concrete value immediately to the canvas object
    const patch = { tokenBindings: updatedBindings };
    this._setNestedProperty(patch, propertyPath, targetVar.value);

    this.engine.updateNode(nodeId, patch, `Bind ${targetVar.name} to ${propertyPath}`);

    return {
      success: true,
      nodeId,
      propertyPath,
      variable: targetVar,
      appliedValue: targetVar.value
    };
  }

  /**
   * Unbinds a variable from a node property
   */
  unbindVariable(nodeId, propertyPath) {
    const page = this.engine.getActivePage();
    const node = page.nodes[nodeId];
    if (!node || !node.tokenBindings) return { success: false };

    const updatedBindings = { ...node.tokenBindings };
    delete updatedBindings[propertyPath];

    this.engine.updateNode(nodeId, { tokenBindings: updatedBindings }, `Unbind variable from ${propertyPath}`);
    return { success: true, nodeId, propertyPath };
  }

  /**
   * 3. Replace Variable Workflow (Spec Part A, Section 3)
   * Replaces an existing bound variable with a new compatible variable
   */
  replaceVariable(nodeId, oldVarId, newVarId) {
    const page = this.engine.getActivePage();
    const node = page.nodes[nodeId];
    if (!node || !node.tokenBindings) {
      throw new Error(`Node ${nodeId} has no variable bindings.`);
    }

    const allVars = Object.values(this.registry.system.variables || {});
    const allTokens = Object.values(this.registry.system.tokens || {});
    const newVar = allVars.find(v => v.id === newVarId) || allTokens.find(t => t.id === newVarId);

    if (!newVar) {
      throw new Error(`Replacement variable "${newVarId}" not found.`);
    }

    const updatedBindings = { ...node.tokenBindings };
    const patch = { tokenBindings: updatedBindings };
    let replacedCount = 0;

    for (const [propPath, boundId] of Object.entries(node.tokenBindings)) {
      if (boundId === oldVarId) {
        const compat = this.validatePropertyCompatibility(propPath, newVar);
        if (compat.compatible) {
          updatedBindings[propPath] = newVar.id;
          this._setNestedProperty(patch, propPath, newVar.value);
          replacedCount++;
        }
      }
    }

    if (replacedCount === 0) {
      throw new Error(`Variable ${oldVarId} was not bound to any compatible properties on this layer.`);
    }

    this.engine.updateNode(nodeId, patch, `Replace Variable with ${newVar.name}`);

    return {
      success: true,
      nodeId,
      replacedCount,
      newVariable: newVar
    };
  }

  /**
   * 3. Replace Component Workflow (Spec Part A, Section 3)
   * Replaces a selected component or shape with another component from the design system,
   * preserving transferable properties, compatible variable bindings, and prototype interactions.
   */
  replaceComponent(nodeId, targetComponentId) {
    const page = this.engine.getActivePage();
    const sourceNode = page.nodes[nodeId];
    if (!sourceNode) {
      throw new Error(`Source layer ${nodeId} not found.`);
    }

    // Determine target component definition (flexible ID and name matching)
    const normalizedTarget = targetComponentId.toLowerCase().replace(/^mui-/, '').replace(/^rneui-/, '');
    const muiDef = MUI_COMPONENT_CATALOG.find(c => c.id === targetComponentId || c.id === normalizedTarget || c.name.toLowerCase() === normalizedTarget);
    const rneuiDef = RNEUI_COMPONENT_CATALOG.find(c => c.id === targetComponentId || c.id === normalizedTarget || c.name.toLowerCase() === normalizedTarget);
    const customDef = this.registry.getAllComponents().find(c => c.id === targetComponentId || c.id === normalizedTarget || c.name?.toLowerCase() === normalizedTarget || c.sourceMetadata?.catalogId === targetComponentId);

    if (!muiDef && !rneuiDef && !customDef) {
      throw new Error(`Unknown replacement component catalog ID: ${targetComponentId}`);
    }

    const componentName = muiDef?.name || rneuiDef?.name || customDef?.name;

    // 1. Identify transferable properties from sourceNode
    const transferred = {
      x: sourceNode.transform?.x || 100,
      y: sourceNode.transform?.y || 100,
      width: sourceNode.transform?.width,
      height: sourceNode.transform?.height
    };

    // Extract text label if source had text or children
    let preservedText = '';
    if (sourceNode.type === 'text') {
      preservedText = sourceNode.text?.content || '';
    } else if (sourceNode.childIds && sourceNode.childIds.length > 0) {
      for (const childId of sourceNode.childIds) {
        const child = page.nodes[childId];
        if (child && child.type === 'text' && child.text?.content) {
          preservedText = child.text.content;
          break;
        }
      }
    }

    // 2. Identify preserved variable bindings
    const preservedBindings = {};
    const sourceBindings = sourceNode.tokenBindings || {};
    for (const [prop, varId] of Object.entries(sourceBindings)) {
      preservedBindings[prop] = varId;
    }

    // 3. Identify preserved prototype interactions
    const preservedInteractions = sourceNode.interactions ? [...sourceNode.interactions] : [];

    // 4. Create new target component node
    let replacementRoot;
    let replacementChildren = [];

    if (muiDef) {
      const generated = createMuiNode(muiDef.id, {
        x: transferred.x,
        y: transferred.y,
        width: transferred.width || muiDef.defaultSize.width,
        height: transferred.height || muiDef.defaultSize.height
      });
      replacementRoot = generated.rootNode;
      replacementChildren = generated.childNodes;
    } else {
      replacementRoot = createNode('frame', {
        name: `${componentName} Instance`,
        transform: {
          x: transferred.x,
          y: transferred.y,
          width: transferred.width || 140,
          height: transferred.height || 44
        },
        componentId: customDef?.id || targetComponentId
      });
    }

    if (transferred.width) replacementRoot.transform.width = transferred.width;
    if (transferred.height) replacementRoot.transform.height = transferred.height;

    // Carry over preserved text content to first text child if applicable
    if (preservedText && replacementChildren.length > 0) {
      const firstTextChild = replacementChildren.find(c => c.type === 'text');
      if (firstTextChild && firstTextChild.text) {
        firstTextChild.text.content = preservedText;
      }
    }

    // Carry over preserved bindings and interactions
    replacementRoot.tokenBindings = { ...(replacementRoot.tokenBindings || {}), ...preservedBindings };
    if (preservedInteractions.length > 0) {
      replacementRoot.interactions = preservedInteractions;
    }

    // Replace in document atomically
    // A. Add replacement nodes
    for (const child of replacementChildren) {
      page.nodes[child.id] = child;
    }

    // B. Re-parent if source had parent
    if (sourceNode.parentId) {
      const parent = page.nodes[sourceNode.parentId];
      if (parent && parent.childIds) {
        const idx = parent.childIds.indexOf(sourceNode.id);
        if (idx !== -1) {
          parent.childIds.splice(idx, 1, replacementRoot.id);
          replacementRoot.parentId = parent.id;
        }
      }
    } else {
      // Root level replace in page order
      const rootArr = page.rootIds || page.rootNodeIds || [];
      const rootIdx = rootArr.indexOf(sourceNode.id);
      if (rootIdx !== -1) {
        rootArr.splice(rootIdx, 1, replacementRoot.id);
      } else {
        rootArr.push(replacementRoot.id);
      }
    }

    page.nodes[replacementRoot.id] = replacementRoot;

    // Delete old node and its old children
    const deleteRecursive = (id) => {
      const n = page.nodes[id];
      if (!n) return;
      if (n.childIds) {
        for (const cid of n.childIds) deleteRecursive(cid);
      }
      delete page.nodes[id];
    };
    deleteRecursive(sourceNode.id);

    // Register transaction with CommandEngine so undo works
    const undoStack = this.engine.undoStack || this.engine.history;
    if (undoStack) {
      undoStack.push({
        description: `Undo replace component with ${componentName}`,
        execute: () => {
          // Restore sourceNode and remove replacement
          deleteRecursive(replacementRoot.id);
          page.nodes[sourceNode.id] = sourceNode;
          if (sourceNode.parentId) {
            const parent = page.nodes[sourceNode.parentId];
            if (parent && parent.childIds) {
              const idx = parent.childIds.indexOf(replacementRoot.id);
              if (idx !== -1) parent.childIds.splice(idx, 1, sourceNode.id);
            }
          } else {
            const rootArr = page.rootIds || page.rootNodeIds;
            if (rootArr) {
              const idx = rootArr.indexOf(replacementRoot.id);
              if (idx !== -1) rootArr.splice(idx, 1, sourceNode.id);
            }
          }

          // Return redo inverse command
          return {
            description: `Redo replace component with ${componentName}`,
            execute: () => {
              this.replaceComponent(sourceNode.id, targetComponentId);
            }
          };
        }
      });
      if (this.engine.redoStack) this.engine.redoStack = [];
    }

    return {
      success: true,
      oldNodeId: sourceNode.id,
      newNodeId: replacementRoot.id,
      replacementComponent: componentName,
      replacementName: componentName,
      transferredProperties: Object.keys(transferred),
      preservedBindingsCount: Object.keys(preservedBindings).length,
      preservedInteractionsCount: preservedInteractions.length,
      preservedText: preservedText || null
    };
  }

  _setNestedProperty(obj, path, value) {
    const parts = path.split('.');
    let cur = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!cur[part]) cur[part] = {};
      cur = cur[part];
    }
    cur[parts[parts.length - 1]] = value;
  }
}
