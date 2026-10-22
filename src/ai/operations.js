/**
 * DesignForge AI - Operation Executor
 * Executes validated design operations as atomic, undoable transactions on the shared CommandEngine
 */

import { OPERATIONS } from './types.js';
import { createNode } from '../engine/document.js';

export class OperationExecutor {
  constructor(commandEngine) {
    this.engine = commandEngine;
  }

  /**
   * Executes a list of validated operations as a single undoable transaction
   */
  execute(operations, description = 'AI Design Modification') {
    const list = Array.isArray(operations) ? operations : [operations];
    const page = this.engine.getActivePage();

    const report = {
      description,
      timestamp: new Date().toISOString(),
      createdNodeIds: [],
      updatedNodeIds: [],
      deletedNodeIds: [],
      affectedTokensCount: 0
    };

    // Snapshot state for atomic undo/redo of the entire batch
    const priorNodesSnapshot = JSON.parse(JSON.stringify(page.nodes));
    const priorRootIdsSnapshot = [...page.rootIds];
    const priorTokensSnapshot = JSON.parse(JSON.stringify(this.engine.doc.tokens));

    for (const op of list) {
      const opType = op.type || op.op;

      switch (opType) {
        case OPERATIONS.CREATE_NODE:
        case 'createNode': {
          const raw = op.node || op.payload || op;
          const node = createNode(raw.type, {
            name: raw.name,
            parentId: raw.parentId || null,
            transform: raw.transform,
            layout: raw.layout,
            style: raw.style,
            text: raw.text,
            semanticTag: raw.semanticTag
          });

          page.nodes[node.id] = node;
          if (node.parentId && page.nodes[node.parentId]) {
            page.nodes[node.parentId].childIds.push(node.id);
          } else {
            page.rootIds.push(node.id);
          }
          report.createdNodeIds.push(node.id);
          break;
        }

        case OPERATIONS.UPDATE_NODE:
        case 'updateNode': {
          const nodeId = op.nodeId;
          const patch = op.patch || op.payload || {};
          const target = page.nodes[nodeId];
          if (target) {
            this.deepMerge(target, patch);
            report.updatedNodeIds.push(nodeId);
          }
          break;
        }

        case OPERATIONS.DELETE_NODE:
        case 'deleteNode': {
          const nodeId = op.nodeId;
          const target = page.nodes[nodeId];
          if (target) {
            delete page.nodes[nodeId];
            if (target.parentId && page.nodes[target.parentId]) {
              page.nodes[target.parentId].childIds = page.nodes[target.parentId].childIds.filter(id => id !== nodeId);
            } else {
              page.rootIds = page.rootIds.filter(id => id !== nodeId);
            }
            report.deletedNodeIds.push(nodeId);
          }
          break;
        }

        case OPERATIONS.APPLY_LAYOUT:
        case 'applyLayout': {
          const nodeId = op.nodeId;
          const target = page.nodes[nodeId];
          if (target) {
            if (!target.layout) target.layout = {};
            target.layout.mode = op.mode || target.layout.mode || 'stack-vertical';
            if (op.gap !== undefined) target.layout.gap = op.gap;
            if (op.padding !== undefined) {
              target.layout.paddingTop = op.padding;
              target.layout.paddingRight = op.padding;
              target.layout.paddingBottom = op.padding;
              target.layout.paddingLeft = op.padding;
            }
            if (op.alignItems) target.layout.alignItems = op.alignItems;
            if (op.justifyContent) target.layout.justifyContent = op.justifyContent;
            report.updatedNodeIds.push(nodeId);
          }
          break;
        }

        case OPERATIONS.UPDATE_TOKENS: {
          const { collectionId, tokenUpdates } = op;
          const col = this.engine.doc.tokens.find(c => c.id === collectionId);
          if (col && tokenUpdates) {
            for (const upd of tokenUpdates) {
              const t = col.tokens.find(item => item.id === upd.tokenId);
              if (t) {
                t.value = upd.value;
                report.affectedTokensCount++;
              }
            }
          }
          break;
        }

        case 'createTree': {
          // Bulk subtree injection
          const allNodes = op.allNodes || [];
          for (const n of allNodes) {
            page.nodes[n.id] = JSON.parse(JSON.stringify(n));
            report.createdNodeIds.push(n.id);
          }
          if (op.rootNode && !page.rootIds.includes(op.rootNode.id)) {
            page.rootIds.push(op.rootNode.id);
          }
          break;
        }
      }
    }

    // Register with Command Engine's undo stack as an atomic inverse action
    this.engine.undoStack.push({
      type: 'ai-transaction',
      description: `Undo ${description}`,
      execute: (eng) => {
        const p = eng.getActivePage();
        p.nodes = JSON.parse(JSON.stringify(priorNodesSnapshot));
        p.rootIds = [...priorRootIdsSnapshot];
        eng.doc.tokens = JSON.parse(JSON.stringify(priorTokensSnapshot));
        eng.clearSelection();
        return {
          type: 'ai-transaction',
          description: `Redo ${description}`,
          execute: (e) => {
            return this.execute(operations, description);
          }
        };
      }
    });

    // Select the first created node if any
    if (report.createdNodeIds.length > 0) {
      this.engine.setSelection([report.createdNodeIds[0]]);
    }

    this.engine.notify('document-change', { description, report });
    return report;
  }

  deepMerge(dest, src) {
    for (const key of Object.keys(src)) {
      if (src[key] !== null && typeof src[key] === 'object' && !Array.isArray(src[key])) {
        if (!dest[key]) dest[key] = {};
        this.deepMerge(dest[key], src[key]);
      } else {
        dest[key] = src[key];
      }
    }
  }
}
