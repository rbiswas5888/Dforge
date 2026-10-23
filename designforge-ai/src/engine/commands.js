/**
 * DesignForge AI - Command & Transaction Engine
 * Deterministic mutations, undo/redo history, and change dispatch
 */

import { createNode, generateId } from './document.js';

export class CommandEngine {
  constructor(document, activePageId) {
    this.doc = document;
    this.activePageId = activePageId || (document.pages[0]?.id ?? null);
    this.undoStack = [];
    this.redoStack = [];
    this.listeners = new Set();
    this.selectedIds = new Set();
    this.maxHistory = 100;
  }

  getActivePage() {
    return this.doc.pages.find(p => p.id === this.activePageId) || this.doc.pages[0];
  }

  setActivePage(pageId) {
    if (this.doc.pages.some(p => p.id === pageId)) {
      this.activePageId = pageId;
      this.selectedIds.clear();
      this.notify('page-change');
    }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(eventType = 'document-change', detail = {}) {
    this.doc.updatedAt = new Date().toISOString();
    for (const listener of this.listeners) {
      try {
        listener(eventType, { doc: this.doc, selectedIds: Array.from(this.selectedIds), ...detail });
      } catch (err) {
        console.error('Error in command listener:', err);
      }
    }
  }

  getSelection() {
    return Array.from(this.selectedIds);
  }

  setSelection(nodeIds) {
    this.selectedIds = new Set(Array.isArray(nodeIds) ? nodeIds : [nodeIds].filter(Boolean));
    this.notify('selection-change');
  }

  selectAdd(nodeId) {
    if (!nodeId) return;
    this.selectedIds.add(nodeId);
    this.notify('selection-change');
  }

  selectToggle(nodeId) {
    if (this.selectedIds.has(nodeId)) {
      this.selectedIds.delete(nodeId);
    } else {
      this.selectedIds.add(nodeId);
    }
    this.notify('selection-change');
  }

  clearSelection() {
    this.selectedIds.clear();
    this.notify('selection-change');
  }

  getNode(nodeId) {
    const page = this.getActivePage();
    return page?.nodes?.[nodeId] || null;
  }

  /**
   * Execute a command with undo/redo capability
   */
  execute(command) {
    const inverse = command.execute(this);
    if (inverse) {
      this.undoStack.push(inverse);
      this.redoStack = []; // Clear redo stack on new action
      if (this.undoStack.length > this.maxHistory) {
        this.undoStack.shift();
      }
    }
    this.notify(command.type || 'document-change', { description: command.description });
    return true;
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  undo() {
    if (!this.canUndo()) return false;
    const command = this.undoStack.pop();
    const inverse = command.execute(this);
    if (inverse) {
      this.redoStack.push(inverse);
    }
    this.notify('undo', { description: command.description });
    return true;
  }

  redo() {
    if (!this.canRedo()) return false;
    const command = this.redoStack.pop();
    const inverse = command.execute(this);
    if (inverse) {
      this.undoStack.push(inverse);
    }
    this.notify('redo', { description: command.description });
    return true;
  }

  // --- Common Helper Commands ---

  updateNode(nodeId, patch, description = 'Update Properties') {
    const page = this.getActivePage();
    const target = page.nodes[nodeId];
    if (!target) return;

    // Snapshot existing values for inverse
    const original = JSON.parse(JSON.stringify(target));

    this.execute({
      type: 'update-node',
      description,
      execute: (engine) => {
        const p = engine.getActivePage();
        const curr = p.nodes[nodeId];
        if (!curr) return null;

        // Apply deep/shallow patch
        function deepMerge(dest, src) {
          for (const key of Object.keys(src)) {
            if (src[key] !== null && typeof src[key] === 'object' && !Array.isArray(src[key])) {
              if (!dest[key]) dest[key] = {};
              deepMerge(dest[key], src[key]);
            } else {
              dest[key] = src[key];
            }
          }
        }
        deepMerge(curr, patch);

        // Return inverse command
        return {
          type: 'update-node',
          description: `Undo ${description}`,
          execute: (eng) => {
            const pg = eng.getActivePage();
            pg.nodes[nodeId] = JSON.parse(JSON.stringify(original));
            return this.updateNodeCommand(nodeId, patch, description);
          }
        };
      }
    });
  }

  updateNodeCommand(nodeId, patch, description) {
    return {
      type: 'update-node',
      description,
      execute: (engine) => {
        const p = engine.getActivePage();
        const curr = p.nodes[nodeId];
        if (!curr) return null;
        const prev = JSON.parse(JSON.stringify(curr));
        for (const k of Object.keys(patch)) {
          if (typeof patch[k] === 'object' && !Array.isArray(patch[k])) {
            curr[k] = { ...curr[k], ...patch[k] };
          } else {
            curr[k] = patch[k];
          }
        }
        return this.updateNodeCommand(nodeId, prev, `Undo ${description}`);
      }
    };
  }

  addNode(node, parentId = null, description = 'Add Node') {
    const page = this.getActivePage();
    node.parentId = parentId;

    this.execute({
      type: 'add-node',
      description,
      execute: (engine) => {
        const p = engine.getActivePage();
        p.nodes[node.id] = JSON.parse(JSON.stringify(node));
        if (parentId && p.nodes[parentId]) {
          p.nodes[parentId].childIds.push(node.id);
        } else {
          p.rootIds.push(node.id);
        }
        engine.setSelection([node.id]);

        return {
          type: 'delete-node',
          description: `Undo ${description}`,
          execute: (eng) => {
            const pg = eng.getActivePage();
            delete pg.nodes[node.id];
            if (parentId && pg.nodes[parentId]) {
              pg.nodes[parentId].childIds = pg.nodes[parentId].childIds.filter(id => id !== node.id);
            } else {
              pg.rootIds = pg.rootIds.filter(id => id !== node.id);
            }
            eng.clearSelection();
            return this.addNodeCommand(node, parentId, description);
          }
        };
      }
    });
  }

  addNodeCommand(node, parentId, description) {
    return {
      type: 'add-node',
      description,
      execute: (engine) => {
        const p = engine.getActivePage();
        p.nodes[node.id] = JSON.parse(JSON.stringify(node));
        if (parentId && p.nodes[parentId]) {
          p.nodes[parentId].childIds.push(node.id);
        } else {
          p.rootIds.push(node.id);
        }
        return {
          type: 'delete-node',
          description: `Undo ${description}`,
          execute: (eng) => {
            const pg = eng.getActivePage();
            delete pg.nodes[node.id];
            if (parentId && pg.nodes[parentId]) {
              pg.nodes[parentId].childIds = pg.nodes[parentId].childIds.filter(id => id !== node.id);
            } else {
              pg.rootIds = pg.rootIds.filter(id => id !== node.id);
            }
            return this.addNodeCommand(node, parentId, description);
          }
        };
      }
    };
  }

  deleteNodes(nodeIds, description = 'Delete Objects') {
    const page = this.getActivePage();
    if (!nodeIds || nodeIds.length === 0) return;

    // Collect snapshots of nodes and their recursive children
    const savedNodes = {};
    const rootRemovals = [];
    const parentRemovals = {};

    const collectRecursive = (id) => {
      const n = page.nodes[id];
      if (!n) return;
      savedNodes[id] = JSON.parse(JSON.stringify(n));
      if (n.childIds) {
        for (const cid of n.childIds) collectRecursive(cid);
      }
    };

    for (const id of nodeIds) {
      const n = page.nodes[id];
      if (!n) continue;
      collectRecursive(id);
      if (n.parentId && page.nodes[n.parentId]) {
        if (!parentRemovals[n.parentId]) parentRemovals[n.parentId] = [];
        parentRemovals[n.parentId].push(id);
      } else {
        rootRemovals.push(id);
      }
    }

    this.execute({
      type: 'delete-nodes',
      description,
      execute: (engine) => {
        const p = engine.getActivePage();
        for (const id of Object.keys(savedNodes)) {
          delete p.nodes[id];
        }
        p.rootIds = p.rootIds.filter(id => !rootRemovals.includes(id));
        for (const pid of Object.keys(parentRemovals)) {
          if (p.nodes[pid]) {
            p.nodes[pid].childIds = p.nodes[pid].childIds.filter(id => !parentRemovals[pid].includes(id));
          }
        }
        engine.clearSelection();

        return {
          type: 'restore-nodes',
          description: `Undo ${description}`,
          execute: (eng) => {
            const pg = eng.getActivePage();
            for (const [id, node] of Object.entries(savedNodes)) {
              pg.nodes[id] = JSON.parse(JSON.stringify(node));
            }
            for (const id of rootRemovals) {
              if (!pg.rootIds.includes(id)) pg.rootIds.push(id);
            }
            for (const [pid, ids] of Object.entries(parentRemovals)) {
              if (pg.nodes[pid]) {
                pg.nodes[pid].childIds.push(...ids);
              }
            }
            eng.setSelection(nodeIds);
            return this.deleteNodesCommand(nodeIds, description);
          }
        };
      }
    });
  }

  deleteNodesCommand(nodeIds, description) {
    return {
      type: 'delete-nodes',
      description,
      execute: (engine) => {
        engine.deleteNodes(nodeIds, description);
        return null;
      }
    };
  }

  moveNodes(nodeIds, deltaX, deltaY, description = 'Move Objects') {
    if (deltaX === 0 && deltaY === 0) return;
    const page = this.getActivePage();

    this.execute({
      type: 'move-nodes',
      description,
      execute: (engine) => {
        const p = engine.getActivePage();
        for (const id of nodeIds) {
          const n = p.nodes[id];
          if (n && n.transform) {
            n.transform.x += deltaX;
            n.transform.y += deltaY;
          }
        }

        return {
          type: 'move-nodes',
          description: `Undo ${description}`,
          execute: (eng) => {
            const pg = eng.getActivePage();
            for (const id of nodeIds) {
              const n = pg.nodes[id];
              if (n && n.transform) {
                n.transform.x -= deltaX;
                n.transform.y -= deltaY;
              }
            }
            return this.moveNodesCommand(nodeIds, deltaX, deltaY, description);
          }
        };
      }
    });
  }

  moveNodesCommand(nodeIds, deltaX, deltaY, description) {
    return {
      type: 'move-nodes',
      description,
      execute: (engine) => {
        engine.moveNodes(nodeIds, deltaX, deltaY, description);
        return null;
      }
    };
  }

  reorderNode(nodeId, direction) {
    const page = this.getActivePage();
    const node = page.nodes[nodeId];
    if (!node) return;

    const list = node.parentId && page.nodes[node.parentId] ? page.nodes[node.parentId].childIds : page.rootIds;
    const idx = list.indexOf(nodeId);
    if (idx === -1) return;

    let targetIdx = idx;
    if (direction === 'up' && idx < list.length - 1) targetIdx = idx + 1;
    else if (direction === 'down' && idx > 0) targetIdx = idx - 1;
    else if (direction === 'top') targetIdx = list.length - 1;
    else if (direction === 'bottom') targetIdx = 0;

    if (targetIdx === idx) return;

    const prevList = [...list];
    list.splice(idx, 1);
    list.splice(targetIdx, 0, nodeId);

    this.execute({
      type: 'reorder-node',
      description: `Reorder ${node.name}`,
      execute: (engine) => {
        return {
          type: 'reorder-node',
          description: 'Undo Reorder',
          execute: (eng) => {
            const p = eng.getActivePage();
            const l = node.parentId && p.nodes[node.parentId] ? p.nodes[node.parentId].childIds : p.rootIds;
            l.length = 0;
            l.push(...prevList);
            return null;
          }
        };
      }
    });
  }

  duplicateNodes(nodeIds) {
    const page = this.getActivePage();
    if (!nodeIds || nodeIds.length === 0) return [];
    const newIds = [];
    const createdNodes = [];

    for (const id of nodeIds) {
      const src = page.nodes[id];
      if (!src) continue;
      const clone = JSON.parse(JSON.stringify(src));
      const freshId = generateId(src.type || 'node');
      clone.id = freshId;
      clone.name = `${src.name} (Copy)`;
      clone.transform.x += 24;
      clone.transform.y += 24;
      
      // Remap children if any
      if (clone.childIds && clone.childIds.length > 0) {
        const oldChildren = [...clone.childIds];
        clone.childIds = [];
        for (const cid of oldChildren) {
          const cNode = page.nodes[cid];
          if (cNode) {
            const cClone = JSON.parse(JSON.stringify(cNode));
            cClone.id = generateId(cNode.type || 'node');
            cClone.parentId = freshId;
            page.nodes[cClone.id] = cClone;
            clone.childIds.push(cClone.id);
          }
        }
      }

      createdNodes.push({ node: clone, parentId: src.parentId });
      newIds.push(freshId);
    }

    if (createdNodes.length === 0) return [];

    this.execute({
      type: 'duplicate-nodes',
      description: `Duplicate ${createdNodes.length} object(s)`,
      execute: (engine) => {
        const p = engine.getActivePage();
        for (const item of createdNodes) {
          p.nodes[item.node.id] = item.node;
          if (item.parentId && p.nodes[item.parentId]) {
            p.nodes[item.parentId].childIds.push(item.node.id);
          } else {
            p.rootIds.push(item.node.id);
          }
        }
        engine.setSelection(newIds);

        return {
          type: 'undo-duplicate',
          description: 'Undo Duplicate',
          execute: (eng) => {
            const pg = eng.getActivePage();
            for (const item of createdNodes) {
              delete pg.nodes[item.node.id];
              if (item.parentId && pg.nodes[item.parentId]) {
                pg.nodes[item.parentId].childIds = pg.nodes[item.parentId].childIds.filter(i => i !== item.node.id);
              } else {
                pg.rootIds = pg.rootIds.filter(i => i !== item.node.id);
              }
            }
            eng.setSelection(nodeIds);
            return null;
          }
        };
      }
    });

    return newIds;
  }

  groupNodes(nodeIds, groupName = 'Group') {
    const page = this.getActivePage();
    if (!nodeIds || nodeIds.length < 2) return null;
    const nodes = nodeIds.map(id => page.nodes[id]).filter(Boolean);
    if (nodes.length < 2) return null;

    // Calculate bounding box of nodes
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const n of nodes) {
      minX = Math.min(minX, n.transform.x);
      minY = Math.min(minY, n.transform.y);
      maxX = Math.max(maxX, n.transform.x + n.transform.width);
      maxY = Math.max(maxY, n.transform.y + n.transform.height);
    }

    const parentId = nodes[0].parentId;
    const groupNode = createNode('group', {
      name: groupName,
      parentId,
      transform: {
        x: minX,
        y: minY,
        width: Math.max(maxX - minX, 10),
        height: Math.max(maxY - minY, 10)
      },
      childIds: nodeIds
    });

    // Adjust child positions relative to group
    const originalPositions = nodes.map(n => ({ id: n.id, x: n.transform.x, y: n.transform.y, parentId: n.parentId }));

    this.execute({
      type: 'group-nodes',
      description: `Group ${nodeIds.length} objects`,
      execute: (engine) => {
        const p = engine.getActivePage();
        p.nodes[groupNode.id] = groupNode;
        if (parentId && p.nodes[parentId]) {
          p.nodes[parentId].childIds = p.nodes[parentId].childIds.filter(id => !nodeIds.includes(id));
          p.nodes[parentId].childIds.push(groupNode.id);
        } else {
          p.rootIds = p.rootIds.filter(id => !nodeIds.includes(id));
          p.rootIds.push(groupNode.id);
        }

        for (const n of nodes) {
          n.parentId = groupNode.id;
          n.transform.x -= minX;
          n.transform.y -= minY;
        }

        engine.setSelection([groupNode.id]);

        return {
          type: 'ungroup-nodes',
          description: 'Undo Group',
          execute: (eng) => {
            const pg = eng.getActivePage();
            delete pg.nodes[groupNode.id];
            if (parentId && pg.nodes[parentId]) {
              pg.nodes[parentId].childIds = pg.nodes[parentId].childIds.filter(id => id !== groupNode.id);
              pg.nodes[parentId].childIds.push(...nodeIds);
            } else {
              pg.rootIds = pg.rootIds.filter(id => id !== groupNode.id);
              pg.rootIds.push(...nodeIds);
            }
            for (const pos of originalPositions) {
              const item = pg.nodes[pos.id];
              if (item) {
                item.parentId = pos.parentId;
                item.transform.x = pos.x;
                item.transform.y = pos.y;
              }
            }
            eng.setSelection(nodeIds);
            return null;
          }
        };
      }
    });

    return groupNode.id;
  }

  ungroupNode(groupId) {
    const page = this.getActivePage();
    const group = page.nodes[groupId];
    if (!group || (!group.childIds || group.childIds.length === 0)) return false;

    const childIds = [...group.childIds];
    const parentId = group.parentId;
    const groupX = group.transform.x;
    const groupY = group.transform.y;

    this.execute({
      type: 'ungroup-node',
      description: `Ungroup ${group.name}`,
      execute: (engine) => {
        const p = engine.getActivePage();
        for (const cid of childIds) {
          const child = p.nodes[cid];
          if (child) {
            child.parentId = parentId;
            child.transform.x += groupX;
            child.transform.y += groupY;
          }
        }

        if (parentId && p.nodes[parentId]) {
          p.nodes[parentId].childIds = p.nodes[parentId].childIds.filter(id => id !== groupId);
          p.nodes[parentId].childIds.push(...childIds);
        } else {
          p.rootIds = p.rootIds.filter(id => id !== groupId);
          p.rootIds.push(...childIds);
        }

        delete p.nodes[groupId];
        engine.setSelection(childIds);

        return {
          type: 'restore-group',
          description: 'Undo Ungroup',
          execute: (eng) => {
            const pg = eng.getActivePage();
            pg.nodes[groupId] = group;
            if (parentId && pg.nodes[parentId]) {
              pg.nodes[parentId].childIds = pg.nodes[parentId].childIds.filter(id => !childIds.includes(id));
              pg.nodes[parentId].childIds.push(groupId);
            } else {
              pg.rootIds = pg.rootIds.filter(id => !childIds.includes(id));
              pg.rootIds.push(groupId);
            }
            for (const cid of childIds) {
              const child = pg.nodes[cid];
              if (child) {
                child.parentId = groupId;
                child.transform.x -= groupX;
                child.transform.y -= groupY;
              }
            }
            eng.setSelection([groupId]);
            return null;
          }
        };
      }
    });

    return true;
  }

  alignNodes(nodeIds, alignment) {
    const page = this.getActivePage();
    if (!nodeIds || nodeIds.length < 2) return;
    const nodes = nodeIds.map(id => page.nodes[id]).filter(Boolean);
    if (nodes.length < 2) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const n of nodes) {
      minX = Math.min(minX, n.transform.x);
      minY = Math.min(minY, n.transform.y);
      maxX = Math.max(maxX, n.transform.x + n.transform.width);
      maxY = Math.max(maxY, n.transform.y + n.transform.height);
    }

    const prevPositions = nodes.map(n => ({ id: n.id, x: n.transform.x, y: n.transform.y }));

    this.execute({
      type: 'align-nodes',
      description: `Align ${alignment}`,
      execute: (engine) => {
        const p = engine.getActivePage();
        for (const n of nodes) {
          const item = p.nodes[n.id];
          if (!item) continue;
          switch (alignment) {
            case 'left':
              item.transform.x = minX;
              break;
            case 'center':
              item.transform.x = minX + (maxX - minX - item.transform.width) / 2;
              break;
            case 'right':
              item.transform.x = maxX - item.transform.width;
              break;
            case 'top':
              item.transform.y = minY;
              break;
            case 'middle':
              item.transform.y = minY + (maxY - minY - item.transform.height) / 2;
              break;
            case 'bottom':
              item.transform.y = maxY - item.transform.height;
              break;
          }
        }

        return {
          type: 'undo-align',
          description: 'Undo Alignment',
          execute: (eng) => {
            const pg = eng.getActivePage();
            for (const pos of prevPositions) {
              const it = pg.nodes[pos.id];
              if (it) {
                it.transform.x = pos.x;
                it.transform.y = pos.y;
              }
            }
            return null;
          }
        };
      }
    });
  }

  distributeNodes(nodeIds, axis = 'horizontal') {
    const page = this.getActivePage();
    if (!nodeIds || nodeIds.length < 3) return;
    const nodes = nodeIds.map(id => page.nodes[id]).filter(Boolean);
    if (nodes.length < 3) return;

    const prevPositions = nodes.map(n => ({ id: n.id, x: n.transform.x, y: n.transform.y }));

    if (axis === 'horizontal') {
      nodes.sort((a, b) => a.transform.x - b.transform.x);
      const minX = nodes[0].transform.x;
      const last = nodes[nodes.length - 1];
      const maxX = last.transform.x + last.transform.width;
      const totalElementsWidth = nodes.reduce((acc, n) => acc + n.transform.width, 0);
      const gap = Math.max(0, (maxX - minX - totalElementsWidth) / (nodes.length - 1));

      this.execute({
        type: 'distribute-nodes',
        description: 'Distribute Horizontal Spacing',
        execute: (engine) => {
          const p = engine.getActivePage();
          let currentX = minX;
          for (let i = 0; i < nodes.length; i++) {
            const item = p.nodes[nodes[i].id];
            if (item) {
              item.transform.x = currentX;
              currentX += item.transform.width + gap;
            }
          }
          return {
            type: 'undo-distribute',
            description: 'Undo Distribute',
            execute: (eng) => {
              const pg = eng.getActivePage();
              for (const pos of prevPositions) {
                const it = pg.nodes[pos.id];
                if (it) {
                  it.transform.x = pos.x;
                  it.transform.y = pos.y;
                }
              }
              return null;
            }
          };
        }
      });
    } else {
      nodes.sort((a, b) => a.transform.y - b.transform.y);
      const minY = nodes[0].transform.y;
      const last = nodes[nodes.length - 1];
      const maxY = last.transform.y + last.transform.height;
      const totalElementsHeight = nodes.reduce((acc, n) => acc + n.transform.height, 0);
      const gap = Math.max(0, (maxY - minY - totalElementsHeight) / (nodes.length - 1));

      this.execute({
        type: 'distribute-nodes',
        description: 'Distribute Vertical Spacing',
        execute: (engine) => {
          const p = engine.getActivePage();
          let currentY = minY;
          for (let i = 0; i < nodes.length; i++) {
            const item = p.nodes[nodes[i].id];
            if (item) {
              item.transform.y = currentY;
              currentY += item.transform.height + gap;
            }
          }
          return {
            type: 'undo-distribute',
            description: 'Undo Distribute',
            execute: (eng) => {
              const pg = eng.getActivePage();
              for (const pos of prevPositions) {
                const it = pg.nodes[pos.id];
                if (it) {
                  it.transform.x = pos.x;
                  it.transform.y = pos.y;
                }
              }
              return null;
            }
          };
        }
      });
    }
  }

  toggleLock(nodeId) {
    const node = this.getNode(nodeId);
    if (!node) return;
    this.updateNode(nodeId, { locked: !node.locked }, node.locked ? 'Unlock Layer' : 'Lock Layer');
  }

  toggleVisibility(nodeId) {
    const node = this.getNode(nodeId);
    if (!node) return;
    this.updateNode(nodeId, { visible: !node.visible }, node.visible ? 'Hide Layer' : 'Show Layer');
  }

  addAutoLayout(nodeId, direction = 'stack-vertical') {
    const node = this.getNode(nodeId);
    if (!node) return;
    this.updateNode(nodeId, {
      layout: {
        mode: direction,
        paddingTop: 16,
        paddingRight: 16,
        paddingBottom: 16,
        paddingLeft: 16,
        gap: 12,
        alignItems: 'stretch',
        justifyContent: 'flex-start'
      }
    }, 'Add Auto Layout');
  }

  removeAutoLayout(nodeId) {
    const node = this.getNode(nodeId);
    if (!node) return;
    this.updateNode(nodeId, { layout: { mode: 'none' } }, 'Remove Auto Layout');
  }

  createComponent(nodeId, name = null) {
    const compId = this.createComponentFromNode(nodeId, name);
    return this.doc.components?.find(c => c.id === compId) || compId;
  }

  createComponentFromNode(nodeId, name = null) {
    const node = this.getNode(nodeId);
    if (!node) return null;
    const compId = generateId('comp');
    const compDef = {
      id: compId,
      name: name || node.name,
      description: 'Custom component from canvas selection',
      defaultVariantId: 'var_default',
      variants: [{ id: 'var_default', name: 'Default', properties: {}, rootNode: JSON.parse(JSON.stringify(node)) }],
      rootNode: JSON.parse(JSON.stringify(node))
    };
    if (!this.doc.components) this.doc.components = [];
    this.doc.components.push(compDef);
    this.updateNode(nodeId, { type: 'instance', componentId: compId }, 'Create Component');
    return compId;
  }

  detachInstance(nodeId) {
    const node = this.getNode(nodeId);
    if (!node || node.type !== 'instance') return false;
    const comp = this.doc.components?.find(c => c.id === node.componentId);
    const fallbackName = comp ? comp.name : 'Detached Frame';
    this.updateNode(nodeId, {
      type: 'frame',
      componentId: null,
      name: `${node.name || fallbackName} (Detached)`
    }, 'Detach Component Instance');
    return true;
  }

  resetOverrides(nodeId) {
    const node = this.getNode(nodeId);
    if (!node || node.type !== 'instance') return false;
    const comp = this.doc.components?.find(c => c.id === node.componentId);
    if (!comp || !comp.rootNode) return false;
    this.updateNode(nodeId, {
      text: comp.rootNode.text ? { ...comp.rootNode.text } : undefined,
      style: comp.rootNode.style ? JSON.parse(JSON.stringify(comp.rootNode.style)) : undefined,
      layout: comp.rootNode.layout ? JSON.parse(JSON.stringify(comp.rootNode.layout)) : undefined
    }, 'Reset Component Overrides');
    return true;
  }

  addComponentVariant(componentId, variantName, variantOverrides = {}) {
    const comp = this.doc.components?.find(c => c.id === componentId);
    if (!comp) return null;
    const varId = generateId('var');
    const baseNode = comp.variants?.[0]?.rootNode || comp.rootNode;
    const clonedRoot = JSON.parse(JSON.stringify(baseNode));
    if (variantOverrides.style) {
      clonedRoot.style = { ...(clonedRoot.style || {}), ...variantOverrides.style };
    }
    if (variantOverrides.text) {
      clonedRoot.text = { ...(clonedRoot.text || {}), ...variantOverrides.text };
    }
    const newVariant = {
      id: varId,
      name: variantName,
      properties: { State: variantName, ...(variantOverrides.properties || {}) },
      rootNode: clonedRoot
    };
    if (!comp.variants) {
      comp.variants = [{ id: comp.defaultVariantId || 'var_default', name: 'Default', properties: { State: 'Default' }, rootNode: JSON.parse(JSON.stringify(comp.rootNode)) }];
    }
    comp.variants.push(newVariant);
    this.notify('document-change', { description: `Add Variant ${variantName}` });
    return newVariant;
  }

  setInstanceVariant(nodeId, variantId) {
    const node = this.getNode(nodeId);
    if (!node || node.type !== 'instance') return false;
    const comp = this.doc.components?.find(c => c.id === node.componentId);
    if (!comp) return false;
    const variant = comp.variants?.find(v => v.id === variantId) || comp.variants?.[0];
    if (!variant || !variant.rootNode) return false;

    const patch = {
      variantId,
      style: JSON.parse(JSON.stringify(variant.rootNode.style || {}))
    };
    if (variant.rootNode.text && (!node.overrides || !node.overrides.text)) {
      patch.text = JSON.parse(JSON.stringify(variant.rootNode.text));
    }
    this.updateNode(nodeId, patch, `Change Variant to ${variant.name}`);
    return true;
  }

  createInstance(componentId, overrides = {}) {
    const comp = this.doc.components?.find(c => c.id === componentId);
    if (!comp) return null;
    const page = this.getActivePage();
    const sourceNode = comp.variants?.[0]?.rootNode || comp.rootNode;
    const instanceId = generateId('inst');
    const defaultVariantId = comp.variants?.[0]?.id || comp.defaultVariantId || 'var_default';

    const instNode = createNode('instance', {
      id: instanceId,
      name: overrides.name || `${comp.name} Instance`,
      componentId,
      variantId: overrides.variantId || defaultVariantId,
      transform: {
        x: overrides.x !== undefined ? overrides.x : 200,
        y: overrides.y !== undefined ? overrides.y : 200,
        width: sourceNode?.transform?.width || 140,
        height: sourceNode?.transform?.height || 44
      },
      layout: sourceNode?.layout ? JSON.parse(JSON.stringify(sourceNode.layout)) : undefined,
      style: sourceNode?.style ? JSON.parse(JSON.stringify(sourceNode.style)) : undefined,
      text: sourceNode?.text ? JSON.parse(JSON.stringify(sourceNode.text)) : undefined,
      semanticTag: sourceNode?.semanticTag || 'div'
    });

    if (sourceNode?.childIds && sourceNode.childIds.length > 0) {
      for (const cid of sourceNode.childIds) {
        const cNode = page.nodes[cid];
        if (cNode) {
          const childClone = JSON.parse(JSON.stringify(cNode));
          childClone.id = generateId(cNode.type || 'node');
          childClone.parentId = instNode.id;
          page.nodes[childClone.id] = childClone;
          instNode.childIds.push(childClone.id);
        }
      }
    }

    this.addNode(instNode, overrides.parentId || null, `Insert Component ${comp.name}`);
    return this.getNode(instNode.id) || instNode;
  }

  combineAsVariants(nodeIds, componentSetName = 'Component Set') {
    const page = this.getActivePage();
    if (!nodeIds || nodeIds.length < 2) return null;
    const nodes = nodeIds.map(id => page.nodes[id]).filter(Boolean);
    if (nodes.length < 2) return null;

    const compId = generateId('comp');
    const variants = nodes.map((n, idx) => ({
      id: `var_${idx}_${Date.now()}`,
      name: n.name || `Variant ${idx + 1}`,
      properties: { State: n.name || `Variant ${idx + 1}` },
      rootNode: JSON.parse(JSON.stringify(n))
    }));

    const compDef = {
      id: compId,
      name: componentSetName,
      description: 'Component Set with multiple variants',
      defaultVariantId: variants[0].id,
      variants,
      rootNode: JSON.parse(JSON.stringify(nodes[0]))
    };

    if (!this.doc.components) this.doc.components = [];
    this.doc.components.push(compDef);

    const setId = this.groupNodes(nodeIds, componentSetName);
    if (setId) {
      const setNode = page.nodes[setId];
      if (setNode) {
        setNode.type = 'component_set';
        setNode.componentId = compId;
        setNode.style.strokes = [{ color: 'rgba(168, 85, 247, 0.5)', width: 1, style: 'dashed' }];
        setNode.style.fills = [{ type: 'solid', color: 'rgba(168, 85, 247, 0.04)', opacity: 1 }];
      }
    }
    this.notify('document-change', { description: 'Combine as Variants' });
    return compId;
  }

  addVariable(variableOrCollection, name = null, type = 'color', value = '#3b82f6') {
    if (!this.doc.variables) this.doc.variables = [];
    let varObj;
    if (typeof variableOrCollection === 'object' && variableOrCollection !== null) {
      const v = variableOrCollection;
      const varId = v.id || generateId('var');
      varObj = {
        id: varId,
        name: v.name || 'New Variable',
        type: v.type || 'color',
        collectionId: v.collectionId || 'col_theme',
        values: v.values || {
          default: v.value !== undefined ? v.value : '#3b82f6',
          light: v.value !== undefined ? v.value : '#3b82f6',
          dark: v.value !== undefined ? v.value : '#3b82f6'
        }
      };
    } else {
      const varId = generateId('var');
      const val = value !== undefined ? value : '#3b82f6';
      varObj = {
        id: varId,
        name: name || 'New Variable',
        type: type || 'color',
        collectionId: variableOrCollection || 'col_theme',
        values: { default: val, light: val, dark: val }
      };
    }
    this.doc.variables.push(varObj);
    this.notify('document-change', { description: `Add Variable ${varObj.name}` });
    return varObj;
  }

  updateVariable(varId, newValue, mode = null) {
    if (!this.doc.variables) return false;
    const v = this.doc.variables.find(item => item.id === varId);
    if (!v) return false;
    if (mode) {
      v.values[mode] = newValue;
    } else {
      v.values.default = newValue;
      v.values.dark = newValue;
      v.values.light = newValue;
    }

    const activeMode = this.doc.themeMode || 'dark';
    const effectiveVal = v.values[activeMode] !== undefined ? v.values[activeMode] : v.values.default;

    for (const page of this.doc.pages) {
      for (const [, node] of Object.entries(page.nodes || {})) {
        if (!node.variableBindings) continue;
        for (const [propPath, boundVarId] of Object.entries(node.variableBindings)) {
          if (boundVarId === varId) {
            this.setDeepProperty(node, propPath, effectiveVal);
          }
        }
      }
    }
    this.notify('document-change', { description: `Update Variable ${v.name}` });
    return true;
  }

  bindVariable(nodeId, propPath, varId) {
    const node = this.getNode(nodeId);
    if (!node) return false;
    if (!node.variableBindings) node.variableBindings = {};
    node.variableBindings[propPath] = varId;

    const v = this.doc.variables?.find(item => item.id === varId);
    if (v) {
      const mode = this.doc.themeMode || 'dark';
      const val = v.values[mode] !== undefined ? v.values[mode] : v.values.default;
      this.setDeepProperty(node, propPath, val);
    }
    this.notify('document-change', { description: `Bind variable to ${propPath}` });
    return true;
  }

  unbindVariable(nodeId, propPath) {
    const node = this.getNode(nodeId);
    if (!node || !node.variableBindings) return false;
    delete node.variableBindings[propPath];
    this.notify('document-change', { description: `Unbind variable on ${propPath}` });
    return true;
  }

  setDeepProperty(obj, path, value) {
    const parts = path.replace(/\[(\w+)\]/g, '.$1').split('.');
    let curr = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      const p = parts[i];
      const nextKey = parts[i + 1];
      if (!curr[p] || typeof curr[p] !== 'object') {
        curr[p] = /^\d+$/.test(nextKey) ? [] : {};
      }
      curr = curr[p];
    }
    curr[parts[parts.length - 1]] = value;
  }

  tidyUp(nodeIds) {
    const page = this.getActivePage();
    if (!nodeIds || nodeIds.length < 2) return;
    const nodes = nodeIds.map(id => page.nodes[id]).filter(Boolean);
    if (nodes.length < 2) return;

    const prevPositions = nodes.map(n => ({ id: n.id, x: n.transform.x, y: n.transform.y }));
    nodes.sort((a, b) => a.transform.y - b.transform.y || a.transform.x - b.transform.x);
    const avgW = nodes.reduce((sum, n) => sum + n.transform.width, 0) / nodes.length;
    const avgH = nodes.reduce((sum, n) => sum + n.transform.height, 0) / nodes.length;
    const spacing = 16;
    const cols = Math.ceil(Math.sqrt(nodes.length));
    const startX = Math.min(...nodes.map(n => n.transform.x));
    const startY = Math.min(...nodes.map(n => n.transform.y));

    this.execute({
      type: 'tidy-up',
      description: 'Tidy Up Objects',
      execute: (engine) => {
        const p = engine.getActivePage();
        nodes.forEach((n, idx) => {
          const row = Math.floor(idx / cols);
          const col = idx % cols;
          const it = p.nodes[n.id];
          if (it) {
            it.transform.x = startX + col * (avgW + spacing);
            it.transform.y = startY + row * (avgH + spacing);
          }
        });
        return {
          type: 'undo-tidy-up',
          description: 'Undo Tidy Up',
          execute: (eng) => {
            const pg = eng.getActivePage();
            for (const pos of prevPositions) {
              const it = pg.nodes[pos.id];
              if (it) {
                it.transform.x = pos.x;
                it.transform.y = pos.y;
              }
            }
            return null;
          }
        };
      }
    });
  }

  commitMove(moves, description = 'Move Objects') {
    if (!moves || moves.length === 0) return;
    const actualMoves = moves.filter(m => m.startX !== m.endX || m.startY !== m.endY);
    if (actualMoves.length === 0) return;

    this.execute({
      type: 'commit-move',
      description,
      execute: (engine) => {
        const p = engine.getActivePage();
        for (const m of actualMoves) {
          const n = p.nodes[m.id];
          if (n?.transform) {
            n.transform.x = m.endX;
            n.transform.y = m.endY;
          }
        }
        return {
          type: 'undo-move',
          description: `Undo ${description}`,
          execute: (eng) => {
            const pg = eng.getActivePage();
            for (const m of actualMoves) {
              const n = pg.nodes[m.id];
              if (n?.transform) {
                n.transform.x = m.startX;
                n.transform.y = m.startY;
              }
            }
            return null;
          }
        };
      }
    });
  }

  commitResize(nodeId, startTransform, endTransform, description = 'Resize Object') {
    if (!nodeId || !startTransform || !endTransform) return;
    if (startTransform.width === endTransform.width && startTransform.height === endTransform.height &&
        startTransform.x === endTransform.x && startTransform.y === endTransform.y) return;

    this.execute({
      type: 'commit-resize',
      description,
      execute: (engine) => {
        const p = engine.getActivePage();
        const n = p.nodes[nodeId];
        if (n?.transform) {
          n.transform = { ...n.transform, ...endTransform };
        }
        return {
          type: 'undo-resize',
          description: `Undo ${description}`,
          execute: (eng) => {
            const pg = eng.getActivePage();
            const it = pg.nodes[nodeId];
            if (it?.transform) {
              it.transform = { ...it.transform, ...startTransform };
            }
            return null;
          }
        };
      }
    });
  }

  booleanGroup(nodeIds, operation = 'union') {
    const page = this.getActivePage();
    if (!nodeIds || nodeIds.length < 2) return null;
    const nodes = nodeIds.map(id => page.nodes[id]).filter(Boolean);
    if (nodes.length < 2) return null;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const n of nodes) {
      minX = Math.min(minX, n.transform.x);
      minY = Math.min(minY, n.transform.y);
      maxX = Math.max(maxX, n.transform.x + n.transform.width);
      maxY = Math.max(maxY, n.transform.y + n.transform.height);
    }

    const opNames = {
      union: 'Union Selection',
      subtract: 'Subtract Selection',
      intersect: 'Intersect Selection',
      exclude: 'Exclude Selection'
    };

    const parentId = nodes[0].parentId;
    const booleanNode = createNode('boolean_group', {
      name: opNames[operation] || 'Boolean Group',
      parentId,
      booleanOperation: operation,
      transform: {
        x: minX,
        y: minY,
        width: Math.max(maxX - minX, 10),
        height: Math.max(maxY - minY, 10)
      },
      childIds: nodeIds
    });

    for (const n of nodes) {
      n.parentId = booleanNode.id;
      n.transform.x -= minX;
      n.transform.y -= minY;
    }

    page.nodes[booleanNode.id] = booleanNode;
    if (parentId && page.nodes[parentId]) {
      page.nodes[parentId].childIds = page.nodes[parentId].childIds.filter(id => !nodeIds.includes(id));
      page.nodes[parentId].childIds.push(booleanNode.id);
    } else {
      page.rootIds = page.rootIds.filter(id => !nodeIds.includes(id));
      page.rootIds.push(booleanNode.id);
    }

    this.setSelection([booleanNode.id]);
    this.notify('document-change');
    return booleanNode.id;
  }

  setThemeMode(mode = 'dark') {
    if (!this.doc.tokens) return;
    this.doc.themeMode = mode;
    if (Array.isArray(this.doc.tokens)) {
      const colorCat = this.doc.tokens.find(c => c.id === 'tokens_colors' || c.name === 'Colors');
      if (colorCat && colorCat.tokens) {
        const bgToken = colorCat.tokens.find(t => t.id === 'token_bg_main');
        const surfaceToken = colorCat.tokens.find(t => t.id === 'token_bg_surface');
        const textToken = colorCat.tokens.find(t => t.id === 'token_text_primary');
        if (mode === 'light') {
          if (bgToken) bgToken.value = '#f8fafc';
          if (surfaceToken) surfaceToken.value = '#ffffff';
          if (textToken) textToken.value = '#0f172a';
        } else {
          if (bgToken) bgToken.value = '#0f172a';
          if (surfaceToken) surfaceToken.value = '#1e293b';
          if (textToken) textToken.value = '#f8fafc';
        }
      }
    } else if (this.doc.tokens.colors) {
      const colors = this.doc.tokens.colors;
      if (mode === 'light') {
        colors.background = '#f8fafc';
        colors.surface = '#ffffff';
        colors.text = '#0f172a';
      } else {
        colors.background = '#0f172a';
        colors.surface = '#1e293b';
        colors.text = '#f8fafc';
      }
    }
    this.notify('document-change', { themeMode: mode });
  }
}


