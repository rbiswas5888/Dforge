/**
 * DesignForge AI — Component Variants & Sketch-Style Overrides Engine
 * - Master Components & Variant Sets (COMPONENT_SET)
 * - Sketch-Style Nested Override Tree: Record<SubNodePath, NodeOverrideDelta>
 * - Deep nested overrides, variant switching, and override reset/detach
 */

export class ComponentOverridesEngine {
  constructor() {
    this.definitions = {}; // componentId -> ComponentDefinition
  }

  registerComponent(componentId, definition) {
    this.definitions[componentId] = {
      id: componentId,
      name: definition.name,
      variantProperties: definition.variantProperties || {}, // { "State": ["Default", "Hover"], "Size": ["Sm", "Lg"] }
      defaultVariant: definition.defaultVariant || {},
      rootNodeId: definition.rootNodeId
    };
  }

  /**
   * Resolve an instance node by overlaying master component structure with instance overrides.
   */
  resolveInstance(masterNode, instanceOverrides = {}, subPath = '') {
    if (!masterNode) return null;

    const currentPath = subPath ? `${subPath}/${masterNode.name}` : masterNode.name;
    const resolved = { ...masterNode };

    // Apply path-keyed override if present
    if (instanceOverrides[currentPath]) {
      const delta = instanceOverrides[currentPath];
      for (const [prop, val] of Object.entries(delta)) {
        resolved[prop] = val;
      }
    }

    return resolved;
  }

  /**
   * Set a nested override on an instance
   */
  setOverride(instanceNode, subPath, propertyName, value) {
    if (!instanceNode.overrides) {
      instanceNode.overrides = {};
    }
    if (!instanceNode.overrides[subPath]) {
      instanceNode.overrides[subPath] = {};
    }
    instanceNode.overrides[subPath][propertyName] = value;
    return instanceNode;
  }

  /**
   * Reset all overrides for a subpath or the entire instance
   */
  resetOverrides(instanceNode, subPath = null) {
    if (!instanceNode.overrides) return;
    if (subPath) {
      delete instanceNode.overrides[subPath];
    } else {
      instanceNode.overrides = {};
    }
  }

  /**
   * Detach instance into an independent group or frame
   */
  detachInstance(instanceNode) {
    const detached = {
      ...instanceNode,
      type: 'frame',
      name: `${instanceNode.name} (Detached)`,
      componentId: null,
      overrides: null
    };
    return detached;
  }
}
