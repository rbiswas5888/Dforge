/**
 * DesignForge AI — Normalized Scene Graph & Entity Store
 * High-performance flat map (Record<NodeID, SceneNode>) with parent/child pointers,
 * MIXED sentinel reducer, Bindable<T> reactive property wrapper, and Section hierarchy rules.
 */

export const MIXED_SENTINEL = 'MIXED';

/**
 * Reactive property wrapper supporting literal values and design token variable bindings
 */
export class Bindable {
  constructor(value, tokenVariableId = null) {
    this.value = value;
    this.tokenVariableId = tokenVariableId; // e.g. "color.brand.primary" or "var_123"
  }

  isBound() {
    return Boolean(this.tokenVariableId);
  }

  bind(tokenVariableId) {
    this.tokenVariableId = tokenVariableId;
    return this;
  }

  unbind() {
    this.tokenVariableId = null;
    return this;
  }

  setLiteral(val) {
    this.value = val;
    this.tokenVariableId = null;
    return this;
  }

  resolve(variableResolver = null, mode = 'default') {
    if (this.tokenVariableId && variableResolver) {
      const resolved = variableResolver(this.tokenVariableId, mode);
      if (resolved !== undefined && resolved !== null) {
        return resolved;
      }
    }
    return this.value;
  }

  toJSON() {
    return {
      value: this.value,
      tokenVariableId: this.tokenVariableId
    };
  }

  static from(raw) {
    if (raw instanceof Bindable) return raw;
    if (raw && typeof raw === 'object' && ('value' in raw || 'tokenVariableId' in raw)) {
      return new Bindable(raw.value, raw.tokenVariableId);
    }
    return new Bindable(raw, null);
  }
}

/**
 * Reducer that computes multi-selection property states across nodes.
 * Returns shared value if all nodes match, or MIXED_SENTINEL ('MIXED') if differing.
 */
export function reduceMixedProperty(nodes, propertyGetter) {
  if (!nodes || nodes.length === 0) return undefined;
  if (nodes.length === 1) {
    return typeof propertyGetter === 'function' ? propertyGetter(nodes[0]) : nodes[0][propertyGetter];
  }

  let firstValue = undefined;
  let initialized = false;

  for (const node of nodes) {
    const val = typeof propertyGetter === 'function' ? propertyGetter(node) : node[propertyGetter];
    const normalizedVal = (val instanceof Bindable) ? val.value : val;

    if (!initialized) {
      firstValue = normalizedVal;
      initialized = true;
    } else {
      if (JSON.stringify(firstValue) !== JSON.stringify(normalizedVal)) {
        return MIXED_SENTINEL;
      }
    }
  }

  return firstValue;
}

/**
 * Normalized Scene Graph Store
 */
export class NormalizedSceneGraph {
  constructor(pageId = 'page_1') {
    this.pageId = pageId;
    this.nodes = {}; // Record<NodeID, SceneNode>
    this.rootIds = []; // NodeIDs sitting directly on page canvas
  }

  /**
   * Look up a node in O(1)
   */
  getNode(id) {
    return this.nodes[id] || null;
  }

  hasNode(id) {
    return Boolean(this.nodes[id]);
  }

  /**
   * Get all immediate children of a node in order
   */
  getChildren(id) {
    const node = this.getNode(id);
    if (!node || !node.childIds) return [];
    return node.childIds.map(cid => this.nodes[cid]).filter(Boolean);
  }

  /**
   * Compute absolute canvas world position by traversing ancestor tree
   */
  getWorldTransform(id) {
    let x = 0;
    let y = 0;
    let curr = this.getNode(id);

    while (curr) {
      x += (curr.x || 0);
      y += (curr.y || 0);
      curr = curr.parentId ? this.getNode(curr.parentId) : null;
    }

    return { x, y };
  }

  /**
   * Add a node to the store.
   * Enforces Section hierarchy rules:
   * - Section MUST sit directly on the Page rootIds
   * - Section CANNOT be a child of another Section, Frame, or Group
   */
  addNode(node, targetParentId = null, index = null) {
    if (!node || !node.id) {
      throw new Error('SceneNode must have a valid id');
    }

    const n = {
      ...node,
      parentId: targetParentId,
      childIds: node.childIds ? [...node.childIds] : []
    };

    // Hierarchy rule check
    if (n.type === 'section') {
      n.parentId = null; // Sections always live on root page canvas
    }

    this.nodes[n.id] = n;

    if (n.parentId) {
      const parent = this.getNode(n.parentId);
      if (parent) {
        if (!parent.childIds) parent.childIds = [];
        if (index !== null && index >= 0 && index <= parent.childIds.length) {
          parent.childIds.splice(index, 0, n.id);
        } else {
          parent.childIds.push(n.id);
        }
      }
    } else {
      if (index !== null && index >= 0 && index <= this.rootIds.length) {
        this.rootIds.splice(index, 0, n.id);
      } else {
        this.rootIds.push(n.id);
      }
    }

    return n;
  }

  /**
   * Update properties on a node with optional Bindable wrapper handling
   */
  updateNode(id, patch) {
    const node = this.getNode(id);
    if (!node) return null;

    for (const [key, val] of Object.entries(patch)) {
      node[key] = val;
    }
    return node;
  }

  /**
   * Reparent a node while strictly preserving its absolute canvas world coordinates
   */
  reparent(nodeId, newParentId, targetIndex = null) {
    const node = this.getNode(nodeId);
    if (!node) return false;

    // Sections cannot be reparented into another container
    if (node.type === 'section') {
      return false;
    }

    // Prevent reparenting into self or one of self's descendants
    if (newParentId === nodeId || this.isDescendant(newParentId, nodeId)) {
      return false;
    }

    const currentWorld = this.getWorldTransform(nodeId);
    const newParentWorld = newParentId ? this.getWorldTransform(newParentId) : { x: 0, y: 0 };

    // Remove from current parent
    if (node.parentId) {
      const oldParent = this.getNode(node.parentId);
      if (oldParent && oldParent.childIds) {
        oldParent.childIds = oldParent.childIds.filter(id => id !== nodeId);
      }
    } else {
      this.rootIds = this.rootIds.filter(id => id !== nodeId);
    }

    // Attach to new parent
    node.parentId = newParentId;
    node.x = currentWorld.x - newParentWorld.x;
    node.y = currentWorld.y - newParentWorld.y;

    if (newParentId) {
      const parent = this.getNode(newParentId);
      if (parent) {
        if (!parent.childIds) parent.childIds = [];
        if (targetIndex !== null && targetIndex >= 0 && targetIndex <= parent.childIds.length) {
          parent.childIds.splice(targetIndex, 0, nodeId);
        } else {
          parent.childIds.push(nodeId);
        }
      }
    } else {
      if (targetIndex !== null && targetIndex >= 0 && targetIndex <= this.rootIds.length) {
        this.rootIds.splice(targetIndex, 0, nodeId);
      } else {
        this.rootIds.push(nodeId);
      }
    }

    return true;
  }

  /**
   * Check if candidateId is a descendant of ancestorId
   */
  isDescendant(candidateId, ancestorId) {
    if (!candidateId || !ancestorId) return false;
    let curr = this.getNode(candidateId);
    while (curr && curr.parentId) {
      if (curr.parentId === ancestorId) return true;
      curr = this.getNode(curr.parentId);
    }
    return false;
  }

  /**
   * Automatic Section containment algorithm.
   * Checks if a frame/object's center point falls within any Section bounding box on the page.
   */
  findContainingSection(nodeId) {
    const node = this.getNode(nodeId);
    if (!node || node.type === 'section') return null;

    const nodeWorld = this.getWorldTransform(nodeId);
    const centerX = nodeWorld.x + (node.width || 0) / 2;
    const centerY = nodeWorld.y + (node.height || 0) / 2;

    for (const rootId of this.rootIds) {
      const rootNode = this.getNode(rootId);
      if (rootNode && rootNode.type === 'section') {
        const sx = rootNode.x || 0;
        const sy = rootNode.y || 0;
        const sw = rootNode.width || 0;
        const sh = rootNode.height || 0;

        if (centerX >= sx && centerX <= sx + sw && centerY >= sy && centerY <= sy + sh) {
          return rootNode.id;
        }
      }
    }

    return null;
  }

  /**
   * Remove a node and all of its descendants recursively
   */
  removeNode(id) {
    const node = this.getNode(id);
    if (!node) return false;

    // Remove from parent
    if (node.parentId) {
      const parent = this.getNode(node.parentId);
      if (parent && parent.childIds) {
        parent.childIds = parent.childIds.filter(cid => cid !== id);
      }
    } else {
      this.rootIds = this.rootIds.filter(rid => rid !== id);
    }

    // Recursively delete children
    const deleteRecursive = (targetId) => {
      const target = this.getNode(targetId);
      if (target && target.childIds) {
        for (const cid of target.childIds) {
          deleteRecursive(cid);
        }
      }
      delete this.nodes[targetId];
    };

    deleteRecursive(id);
    return true;
  }

  /**
   * Serialize flat store into canonical document page structure
   */
  serialize() {
    return {
      id: this.pageId,
      rootIds: [...this.rootIds],
      nodes: JSON.parse(JSON.stringify(this.nodes))
    };
  }

  /**
   * Load from canonical document page structure
   */
  static deserialize(pageData) {
    const graph = new NormalizedSceneGraph(pageData.id || 'page_1');
    graph.rootIds = pageData.rootIds ? [...pageData.rootIds] : [];
    graph.nodes = pageData.nodes ? JSON.parse(JSON.stringify(pageData.nodes)) : {};
    return graph;
  }
}
