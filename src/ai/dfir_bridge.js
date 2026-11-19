/**
 * DesignForge AI - DFIR Canvas Bridge
 * Bidirectional translation between DFIR (DesignForge Intermediate Representation)
 * and the canonical DesignForge document model and CommandEngine.
 */

import { createNode, generateId } from '../engine/document.js';
import { OPERATIONS } from './types.js';
import { calculateNonOverlappingRootPosition } from '../engine/layout.js';

export class DFIRCanvasBridge {
  constructor(document, commandEngine) {
    this.doc = document;
    this.engine = commandEngine;
  }

  /**
   * Translates a DFIR document into atomic native operations and applies them via CommandEngine.
   * @param {Object} dfir - Validated DFIR document
   * @param {Object} options - { position: { x, y }, parentId: string|null, selectAfter: boolean }
   * @returns {Object} { rootNodeId, nodeCount, createdNodeIds }
   */
  applyDfirToCanvas(dfir, options = {}) {
    if (!dfir || !dfir.root) {
      throw new Error('Invalid DFIR document: Missing root node.');
    }

    const page = this.engine.getActivePage();
    const createdNodes = [];
    const idMap = new Map(); // DFIR id -> Native Canonical id

    // Auto-calculate non-overlapping root position if canvas already has designs
    if (!options.position && page && Array.isArray(page.rootIds) && page.rootIds.length > 0) {
      options.position = calculateNonOverlappingRootPosition(page, dfir.root?.transform?.width || 1440, 80);
    }

    // 1. Synchronize Design Tokens if present
    if (dfir.tokens && dfir.tokens.colors) {
      this._mergeTokens(dfir.tokens);
    }

    // 2. Recursively convert DFIR tree into Canonical Document nodes
    const rootCanonicalNode = this._convertDfirNode(dfir.root, null, idMap, createdNodes, options);

    // 3. Build atomic undoable transaction command
    const description = `AI Generate: ${dfir.metadata?.title || 'UI Screen'}`;
    const createBatchCommand = (nodesList) => ({
      type: 'dfir-batch-create',
      description,
      execute: (eng) => {
        const p = eng.getActivePage();
        for (const node of nodesList) {
          p.nodes[node.id] = JSON.parse(JSON.stringify(node));
          if (node.parentId && p.nodes[node.parentId]) {
            if (!p.nodes[node.parentId].childIds.includes(node.id)) {
              p.nodes[node.parentId].childIds.push(node.id);
            }
          } else if (!node.parentId) {
            if (!p.rootIds.includes(node.id)) {
              p.rootIds.push(node.id);
            }
          }
        }
        if (eng.notify) {
          eng.notify('document-change', { description });
        }

        return {
          type: 'dfir-batch-delete',
          description: `Undo ${description}`,
          execute: (inverseEng) => {
            const pg = inverseEng.getActivePage();
            for (let i = nodesList.length - 1; i >= 0; i--) {
              const node = nodesList[i];
              delete pg.nodes[node.id];
              if (node.parentId && pg.nodes[node.parentId]) {
                pg.nodes[node.parentId].childIds = pg.nodes[node.parentId].childIds.filter(id => id !== node.id);
              } else if (!node.parentId) {
                pg.rootIds = pg.rootIds.filter(id => id !== node.id);
              }
            }
            if (inverseEng.notify) {
              inverseEng.notify('document-change', { description: `Undo ${description}` });
            }
            return createBatchCommand(nodesList);
          }
        };
      }
    });

    this.engine.execute(createBatchCommand(createdNodes));

    return {
      success: true,
      rootNodeId: rootCanonicalNode.id,
      nodeCount: createdNodes.length,
      createdNodeIds: createdNodes.map(n => n.id)
    };
  }

  /**
   * Recursively maps a DFIR node to a native DesignForge node
   */
  _convertDfirNode(dfirNode, parentId, idMap, createdNodes, options = {}) {
    const nativeType = dfirNode.type || 'frame';
    const canonicalId = generateId(nativeType);
    idMap.set(dfirNode.id, canonicalId);

    // Calculate position
    let x = dfirNode.transform?.x || 0;
    let y = dfirNode.transform?.y || 0;
    if (!parentId && options.position) {
      x = options.position.x;
      y = options.position.y;
    }

    // Construct native node parameters
    const nodeOverrides = {
      id: canonicalId,
      name: dfirNode.name || (nativeType.charAt(0).toUpperCase() + nativeType.slice(1)),
      parentId: parentId,
      childIds: [],
      visible: dfirNode.visible !== undefined ? dfirNode.visible : true,
      locked: dfirNode.locked !== undefined ? dfirNode.locked : false,
      opacity: dfirNode.opacity !== undefined ? dfirNode.opacity : 1,
      transform: {
        x: x,
        y: y,
        width: dfirNode.transform?.width || 100,
        height: dfirNode.transform?.height || 100,
        rotation: dfirNode.transform?.rotation || 0,
        scaleX: dfirNode.transform?.scaleX || 1,
        scaleY: dfirNode.transform?.scaleY || 1
      },
      layout: {
        mode: dfirNode.layout?.mode || 'none',
        wrap: dfirNode.layout?.wrap || 'no_wrap',
        paddingTop: dfirNode.layout?.paddingTop || 0,
        paddingRight: dfirNode.layout?.paddingRight || 0,
        paddingBottom: dfirNode.layout?.paddingBottom || 0,
        paddingLeft: dfirNode.layout?.paddingLeft || 0,
        gap: dfirNode.layout?.gap || 0,
        alignItems: dfirNode.layout?.alignItems || 'start',
        justifyContent: dfirNode.layout?.justifyContent || 'start',
        sizingHorizontal: dfirNode.layout?.sizingHorizontal || 'fixed',
        sizingVertical: dfirNode.layout?.sizingVertical || 'fixed'
      },
      style: {
        fills: dfirNode.style?.fills ? JSON.parse(JSON.stringify(dfirNode.style.fills)) : [],
        strokes: dfirNode.style?.strokes ? JSON.parse(JSON.stringify(dfirNode.style.strokes)) : [],
        cornerRadius: dfirNode.style?.cornerRadius || 0,
        shadows: dfirNode.style?.shadows ? JSON.parse(JSON.stringify(dfirNode.style.shadows)) : []
      },
      semanticTag: dfirNode.accessibility?.semanticTag || null
    };

    if (dfirNode.text) {
      nodeOverrides.text = {
        content: dfirNode.text.content || '',
        fontFamily: dfirNode.text.fontFamily || 'Inter',
        fontSize: dfirNode.text.fontSize || 14,
        fontWeight: String(dfirNode.text.fontWeight || '400'),
        color: dfirNode.text.color || '#F8FAFC',
        textAlign: dfirNode.text.textAlign || 'left'
      };
    }

    const canonicalNode = createNode(nativeType, nodeOverrides);
    createdNodes.push(canonicalNode);

    // Recursively convert children
    if (dfirNode.children && Array.isArray(dfirNode.children)) {
      for (const childDfir of dfirNode.children) {
        const childCanonical = this._convertDfirNode(childDfir, canonicalNode.id, idMap, createdNodes, options);
        canonicalNode.childIds.push(childCanonical.id);
      }
    }

    return canonicalNode;
  }

  /**
   * Merges generated tokens into document token sets
   */
  _mergeTokens(dfirTokens) {
    if (!this.doc.tokens) this.doc.tokens = [];
    let colorCollection = this.doc.tokens.find(c => c.id === 'tokens_colors');
    if (!colorCollection) {
      colorCollection = { id: 'tokens_colors', name: 'Colors', tokens: [] };
      this.doc.tokens.push(colorCollection);
    }

    for (const [key, val] of Object.entries(dfirTokens.colors || {})) {
      const existing = colorCollection.tokens.find(t => t.id === `token_${key}` || t.name === key);
      if (!existing) {
        colorCollection.tokens.push({
          id: `token_${key}`,
          name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          type: 'color',
          value: val
        });
      }
    }
  }

  /**
   * Extracts a valid DFIR document from the current canvas selection or page
   * @param {string|null} nodeId - Root node ID to export (or null for active page)
   * @returns {Object} Exported DFIR document
   */
  exportCanvasToDfir(nodeId = null) {
    const page = this.engine.getActivePage();
    let rootNode;

    if (nodeId && page.nodes[nodeId]) {
      rootNode = page.nodes[nodeId];
    } else if (page.rootIds.length > 0) {
      rootNode = page.nodes[page.rootIds[0]];
    } else {
      throw new Error('Canvas has no nodes to export.');
    }

    const dfirRoot = this._convertCanonicalToDfir(rootNode, page);

    return {
      $schema: 'https://designforge.ai/schemas/dfir-v1.json',
      version: '1.0.0',
      metadata: {
        title: rootNode.name,
        platform: rootNode.transform.width < 500 ? 'mobile' : 'desktop',
        viewport: { width: rootNode.transform.width, height: rootNode.transform.height },
        createdAt: new Date().toISOString(),
        author: 'DesignForge AI Canvas Export'
      },
      tokens: {
        colors: this._extractColorTokens()
      },
      root: dfirRoot
    };
  }

  _convertCanonicalToDfir(node, page) {
    const dfirNode = {
      id: node.id,
      type: node.type,
      name: node.name,
      transform: { ...node.transform },
      layout: { ...node.layout },
      style: {
        fills: node.style?.fills || [],
        strokes: node.style?.strokes || [],
        cornerRadius: node.style?.cornerRadius || 0,
        shadows: node.style?.shadows || []
      },
      children: []
    };

    if (node.text) {
      dfirNode.text = { ...node.text };
    }

    if (node.childIds && Array.isArray(node.childIds)) {
      for (const cid of node.childIds) {
        const child = page.nodes[cid];
        if (child) {
          dfirNode.children.push(this._convertCanonicalToDfir(child, page));
        }
      }
    }

    return dfirNode;
  }

  _extractColorTokens() {
    const tokens = {};
    const colorCollection = this.doc.tokens?.find(c => c.id === 'tokens_colors');
    if (colorCollection) {
      for (const t of colorCollection.tokens) {
        tokens[t.name.toLowerCase().replace(/[\s\/]+/g, '_')] = t.value;
      }
    }
    return tokens;
  }
}
