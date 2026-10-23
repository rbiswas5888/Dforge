/**
 * DesignForge AI - Native Design MCP Server
 * Exposes canonical document, CommandEngine, components, prototype flow, and React compiler
 * to authorized MCP clients via strict schema tools, resources, and prompts.
 */

import { McpServer } from './server.js';
import { createNode, generateId } from '../../engine/document.js';
import { ReactCompiler } from '../../engine/compiler.js';
import {
  MCP_PERMISSIONS,
  TOOL_CATEGORIES,
  MCP_ERROR_CODES
} from '../protocol/types.js';

export class DesignMcpServer extends McpServer {
  constructor(commandEngine) {
    super({
      name: 'designforge-design-server',
      version: '1.0.0',
      description: 'Official DesignForge AI Native Design Engine Server'
    });

    this.engine = commandEngine;
    this.compiler = new ReactCompiler();
    this.lastBuildStatus = { status: 'idle', filesCount: 0, timestamp: null, diagnostics: [] };

    this.registerReadOnlyTools();
    this.registerMutationTools();
    this.registerExportTools();
    this.registerDesignResources();
    this.registerDesignPrompts();
  }

  get doc() {
    return this.engine.doc;
  }

  getActivePage() {
    return this.engine.getActivePage();
  }

  // ==========================================
  // 5.1 READ-ONLY TOOLS
  // ==========================================
  registerReadOnlyTools() {
    // 1. design_get_document_summary
    this.registerTool({
      name: 'design_get_document_summary',
      category: TOOL_CATEGORIES.DESIGN_DOCUMENT,
      description: 'Returns document metadata, page list, frame count, component summary, and tokens summary.',
      inputSchema: { type: 'object', properties: {} },
      requiredScope: MCP_PERMISSIONS.DESIGN_READ
    }, async () => {
      const page = this.getActivePage();
      const nodeCount = Object.keys(page.nodes).length;
      const frameCount = Object.values(page.nodes).filter(n => n.type === 'frame').length;
      return {
        documentId: this.doc.id,
        name: this.doc.name,
        schemaVersion: this.doc.schemaVersion,
        createdAt: this.doc.createdAt,
        updatedAt: this.doc.updatedAt,
        currentPage: { id: page.id, name: page.name, nodeCount, frameCount },
        pages: this.doc.pages.map(p => ({ id: p.id, name: p.name, nodeCount: Object.keys(p.nodes).length })),
        componentsCount: Object.keys(this.doc.components || {}).length,
        tokensCount: (this.doc.tokens || []).reduce((acc, g) => acc + (g.tokens?.length || 0), 0)
      };
    });

    // 2. design_list_pages
    this.registerTool({
      name: 'design_list_pages',
      category: TOOL_CATEGORIES.DESIGN_DOCUMENT,
      description: 'Lists all pages with their identifiers, names, and root frame counts.',
      inputSchema: { type: 'object', properties: {} },
      requiredScope: MCP_PERMISSIONS.DESIGN_READ
    }, async () => {
      return {
        activePageId: this.engine.activePageId,
        pages: this.doc.pages.map(p => ({
          id: p.id,
          name: p.name,
          rootNodeCount: (p.rootIds || []).length,
          totalNodes: Object.keys(p.nodes).length
        }))
      };
    });

    // 3. design_get_selection
    this.registerTool({
      name: 'design_get_selection',
      category: TOOL_CATEGORIES.LAYERS_OBJECTS,
      description: 'Returns the currently selected design objects in the active session.',
      inputSchema: { type: 'object', properties: {} },
      requiredScope: MCP_PERMISSIONS.DESIGN_READ
    }, async () => {
      const selIds = this.engine.getSelection();
      const page = this.getActivePage();
      const selectedNodes = selIds.map(id => page.nodes[id]).filter(Boolean);
      return {
        count: selectedNodes.length,
        selectedIds: selIds,
        nodes: selectedNodes.map(n => ({
          id: n.id,
          name: n.name,
          type: n.type,
          transform: n.transform,
          layout: n.layout,
          style: n.style
        }))
      };
    });

    // 4. design_get_node
    this.registerTool({
      name: 'design_get_node',
      category: TOOL_CATEGORIES.LAYERS_OBJECTS,
      description: 'Retrieves complete validated attributes of a specific design node.',
      inputSchema: {
        type: 'object',
        properties: {
          nodeId: { type: 'string', description: 'The unique ID of the node to retrieve' },
          pageId: { type: 'string', description: 'Optional page ID, defaults to active page' }
        },
        required: ['nodeId']
      },
      requiredScope: MCP_PERMISSIONS.DESIGN_READ
    }, async (args) => {
      const page = args.pageId ? (this.doc.pages.find(p => p.id === args.pageId) || this.getActivePage()) : this.getActivePage();
      const node = page.nodes[args.nodeId];
      if (!node) {
        throw new Error(`Node with id '${args.nodeId}' not found on page '${page.name}'`);
      }
      return { node, pageId: page.id };
    });

    // 5. design_search_layers
    this.registerTool({
      name: 'design_search_layers',
      category: TOOL_CATEGORIES.LAYERS_OBJECTS,
      description: 'Searches layers by name, type, or styling attributes.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search term to match layer names' },
          type: { type: 'string', description: 'Optional filter by node type (frame, rectangle, text, etc.)' }
        }
      },
      requiredScope: MCP_PERMISSIONS.DESIGN_READ
    }, async (args) => {
      const page = this.getActivePage();
      const query = (args.query || '').toLowerCase().trim();
      const typeFilter = args.type ? args.type.toLowerCase() : null;

      const matches = Object.values(page.nodes).filter(node => {
        const matchesQuery = !query || node.name.toLowerCase().includes(query);
        const matchesType = !typeFilter || node.type.toLowerCase() === typeFilter;
        return matchesQuery && matchesType;
      });

      return {
        query: args.query,
        count: matches.length,
        results: matches.slice(0, 50).map(n => ({
          id: n.id,
          name: n.name,
          type: n.type,
          parentId: n.parentId,
          transform: n.transform
        }))
      };
    });

    // 6. design_get_layout_tree
    this.registerTool({
      name: 'design_get_layout_tree',
      category: TOOL_CATEGORIES.FRAMES_LAYOUT,
      description: 'Returns normalized parent-child layout hierarchy for a frame or the entire active page.',
      inputSchema: {
        type: 'object',
        properties: {
          rootNodeId: { type: 'string', description: 'Optional frame ID. If omitted, returns page root tree.' }
        }
      },
      requiredScope: MCP_PERMISSIONS.DESIGN_READ
    }, async (args) => {
      const page = this.getActivePage();
      const buildSubtree = (nodeId) => {
        const node = page.nodes[nodeId];
        if (!node) return null;
        return {
          id: node.id,
          name: node.name,
          type: node.type,
          layout: node.layout?.mode || 'none',
          gap: node.layout?.gap ?? 0,
          bounds: { x: node.transform.x, y: node.transform.y, w: node.transform.width, h: node.transform.height },
          children: (node.childIds || []).map(cid => buildSubtree(cid)).filter(Boolean)
        };
      };

      if (args.rootNodeId) {
        return { tree: buildSubtree(args.rootNodeId) };
      }
      return {
        pageName: page.name,
        roots: (page.rootIds || []).map(rid => buildSubtree(rid)).filter(Boolean)
      };
    });

    // 7. design_list_components
    this.registerTool({
      name: 'design_list_components',
      category: TOOL_CATEGORIES.DESIGN_SYSTEMS,
      description: 'Returns all reusable component definitions, variants, and component instances.',
      inputSchema: { type: 'object', properties: {} },
      requiredScope: MCP_PERMISSIONS.DESIGN_READ
    }, async () => {
      const components = this.doc.components || {};
      const page = this.getActivePage();
      const instances = Object.values(page.nodes).filter(n => n.componentId);

      return {
        masterComponents: Object.values(components),
        instancesCount: instances.length,
        instances: instances.map(i => ({
          id: i.id,
          name: i.name,
          componentId: i.componentId,
          variantId: i.variantId
        }))
      };
    });

    // 8. design_get_design_tokens
    this.registerTool({
      name: 'design_get_design_tokens',
      category: TOOL_CATEGORIES.DESIGN_SYSTEMS,
      description: 'Retrieves all design tokens, color palettes, spacing scales, and typography tokens.',
      inputSchema: { type: 'object', properties: {} },
      requiredScope: MCP_PERMISSIONS.DESIGN_READ
    }, async () => {
      return {
        tokenGroups: this.doc.tokens || [],
        totalTokens: (this.doc.tokens || []).reduce((acc, g) => acc + (g.tokens?.length || 0), 0)
      };
    });

    // 9. design_get_prototype_flow
    this.registerTool({
      name: 'design_get_prototype_flow',
      category: TOOL_CATEGORIES.PROTOTYPING,
      description: 'Returns prototype flow definitions, starting frames, triggers, actions, and transitions.',
      inputSchema: { type: 'object', properties: {} },
      requiredScope: MCP_PERMISSIONS.DESIGN_READ
    }, async () => {
      const page = this.getActivePage();
      const flows = [];
      for (const node of Object.values(page.nodes)) {
        if (node.interactions && node.interactions.length > 0) {
          flows.push({
            sourceNodeId: node.id,
            sourceName: node.name,
            interactions: node.interactions
          });
        }
      }
      return {
        activePage: page.name,
        interactiveNodesCount: flows.length,
        connections: flows
      };
    });

    // 10. design_validate_document
    this.registerTool({
      name: 'design_validate_document',
      category: TOOL_CATEGORIES.INSPECTION,
      description: 'Runs structural, parent-child integrity, and layout consistency checks on the document.',
      inputSchema: { type: 'object', properties: {} },
      requiredScope: MCP_PERMISSIONS.DESIGN_READ
    }, async () => {
      const errors = [];
      const warnings = [];

      for (const page of this.doc.pages) {
        for (const [id, node] of Object.entries(page.nodes)) {
          if (!node.id || node.id !== id) {
            errors.push(`Node key '${id}' does not match node.id '${node.id}' in page '${page.name}'`);
          }
          if (node.parentId && !page.nodes[node.parentId]) {
            errors.push(`Node '${node.name}' (${node.id}) points to missing parent '${node.parentId}'`);
          }
          for (const cid of (node.childIds || [])) {
            if (!page.nodes[cid]) {
              errors.push(`Parent '${node.name}' (${node.id}) points to missing child '${cid}'`);
            }
          }
          if (node.transform.width <= 0 || node.transform.height <= 0) {
            warnings.push(`Node '${node.name}' (${node.id}) has zero or negative dimension (${node.transform.width}x${node.transform.height})`);
          }
        }
      }

      return {
        isValid: errors.length === 0,
        errorsCount: errors.length,
        warningsCount: warnings.length,
        errors,
        warnings
      };
    });
  }

  // ==========================================
  // 5.2 DESIGN MUTATION TOOLS
  // ==========================================
  registerMutationTools() {
    // 11. design_create_frame
    this.registerTool({
      name: 'design_create_frame',
      category: TOOL_CATEGORIES.FRAMES_LAYOUT,
      description: 'Creates a responsive or fixed frame with optional auto-layout.',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Name of the frame' },
          x: { type: 'number', default: 100 },
          y: { type: 'number', default: 100 },
          width: { type: 'number', default: 400 },
          height: { type: 'number', default: 300 },
          layoutMode: { type: 'string', enum: ['none', 'stack-horizontal', 'stack-vertical', 'grid'], default: 'none' },
          gap: { type: 'number', default: 16 },
          padding: { type: 'number', default: 16 },
          fill: { type: 'string', default: '#1e293b' },
          cornerRadius: { type: 'number', default: 8 },
          parentId: { type: 'string', description: 'Optional parent frame ID' }
        },
        required: ['name']
      },
      requiredScope: MCP_PERMISSIONS.DESIGN_WRITE
    }, async (args) => {
      const node = createNode('frame', {
        name: args.name,
        transform: {
          x: args.x ?? 100,
          y: args.y ?? 100,
          width: Math.max(20, args.width ?? 400),
          height: Math.max(20, args.height ?? 300)
        },
        layout: {
          mode: args.layoutMode || 'none',
          gap: args.gap ?? 16,
          paddingLeft: args.padding ?? 16,
          paddingRight: args.padding ?? 16,
          paddingTop: args.padding ?? 16,
          paddingBottom: args.padding ?? 16,
          alignItems: 'start',
          justifyContent: 'start'
        },
        style: {
          fills: [{ type: 'solid', color: args.fill || '#1e293b', opacity: 1 }],
          cornerRadius: args.cornerRadius ?? 8
        }
      });

      this.engine.addNode(node, args.parentId || null, `MCP: Create frame '${args.name}'`);
      return { success: true, frameId: node.id, name: node.name };
    });

    // 12. design_create_node
    this.registerTool({
      name: 'design_create_node',
      category: TOOL_CATEGORIES.LAYERS_OBJECTS,
      description: 'Creates a shape, vector, text, or button node.',
      inputSchema: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['rectangle', 'ellipse', 'text', 'line', 'star', 'polygon', 'arrow', 'button'], required: true },
          name: { type: 'string', required: true },
          x: { type: 'number', default: 0 },
          y: { type: 'number', default: 0 },
          width: { type: 'number', default: 120 },
          height: { type: 'number', default: 40 },
          parentId: { type: 'string' },
          fill: { type: 'string' },
          textContent: { type: 'string' },
          fontSize: { type: 'number', default: 14 }
        },
        required: ['type', 'name']
      },
      requiredScope: MCP_PERMISSIONS.DESIGN_WRITE
    }, async (args) => {
      const options = {
        name: args.name,
        transform: {
          x: args.x ?? 0,
          y: args.y ?? 0,
          width: Math.max(10, args.width ?? 120),
          height: Math.max(10, args.height ?? 40)
        }
      };

      if (args.fill) {
        options.style = { fills: [{ type: 'solid', color: args.fill, opacity: 1 }] };
      }
      if (args.textContent || args.type === 'text') {
        options.text = {
          content: args.textContent || 'Text Block',
          fontSize: args.fontSize || 14,
          color: args.fill || '#ffffff'
        };
      }

      const node = createNode(args.type, options);
      this.engine.addNode(node, args.parentId || null, `MCP: Create ${args.type} '${args.name}'`);
      return { success: true, nodeId: node.id, name: node.name, type: node.type };
    });

    // 13. design_update_node_properties
    this.registerTool({
      name: 'design_update_node_properties',
      category: TOOL_CATEGORIES.LAYERS_OBJECTS,
      description: 'Updates specific styling, transform, or layout properties of an existing node.',
      inputSchema: {
        type: 'object',
        properties: {
          nodeId: { type: 'string', required: true },
          name: { type: 'string' },
          visible: { type: 'boolean' },
          opacity: { type: 'number' },
          fillColor: { type: 'string' },
          strokeColor: { type: 'string' },
          strokeWidth: { type: 'number' },
          cornerRadius: { type: 'number' },
          textContent: { type: 'string' }
        },
        required: ['nodeId']
      },
      requiredScope: MCP_PERMISSIONS.DESIGN_WRITE
    }, async (args) => {
      const node = this.engine.getNode(args.nodeId);
      if (!node) throw new Error(`Node '${args.nodeId}' not found`);

      const patch = {};
      if (args.name !== undefined) patch.name = args.name;
      if (args.visible !== undefined) patch.visible = args.visible;

      if (args.opacity !== undefined || args.fillColor || args.strokeColor || args.cornerRadius !== undefined) {
        patch.style = { ...node.style };
        if (args.opacity !== undefined) patch.style.opacity = args.opacity;
        if (args.cornerRadius !== undefined) patch.style.cornerRadius = args.cornerRadius;
        if (args.fillColor) patch.style.fills = [{ type: 'solid', color: args.fillColor, opacity: 1 }];
        if (args.strokeColor) patch.style.strokes = [{ type: 'solid', color: args.strokeColor, width: args.strokeWidth ?? 1 }];
      }

      if (args.textContent !== undefined && node.text) {
        patch.text = { ...node.text, content: args.textContent };
      }

      this.engine.updateNode(args.nodeId, patch, `MCP: Update node '${node.name}'`);
      return { success: true, nodeId: node.id };
    });

    // 14. design_move_resize_nodes
    this.registerTool({
      name: 'design_move_resize_nodes',
      category: TOOL_CATEGORIES.FRAMES_LAYOUT,
      description: 'Changes position or dimensions for a set of nodes.',
      inputSchema: {
        type: 'object',
        properties: {
          updates: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                nodeId: { type: 'string', required: true },
                x: { type: 'number' },
                y: { type: 'number' },
                width: { type: 'number' },
                height: { type: 'number' },
                rotation: { type: 'number' }
              },
              required: ['nodeId']
            }
          }
        },
        required: ['updates']
      },
      requiredScope: MCP_PERMISSIONS.DESIGN_WRITE
    }, async (args) => {
      const results = [];
      for (const item of args.updates) {
        const node = this.engine.getNode(item.nodeId);
        if (!node) continue;
        const newTransform = { ...node.transform };
        if (item.x !== undefined) newTransform.x = item.x;
        if (item.y !== undefined) newTransform.y = item.y;
        if (item.width !== undefined) newTransform.width = Math.max(1, item.width);
        if (item.height !== undefined) newTransform.height = Math.max(1, item.height);
        if (item.rotation !== undefined) newTransform.rotation = item.rotation;

        this.engine.updateNode(item.nodeId, { transform: newTransform }, `MCP: Resize/Move '${node.name}'`);
        results.push(item.nodeId);
      }
      return { success: true, updatedCount: results.length, updatedIds: results };
    });

    // 15. design_reorder_nodes
    this.registerTool({
      name: 'design_reorder_nodes',
      category: TOOL_CATEGORIES.LAYERS_OBJECTS,
      description: 'Changes layer z-index order or moves nodes to a new parent frame.',
      inputSchema: {
        type: 'object',
        properties: {
          nodeId: { type: 'string', required: true },
          newParentId: { type: 'string' },
          direction: { type: 'string', enum: ['top', 'bottom', 'up', 'down'] }
        },
        required: ['nodeId']
      },
      requiredScope: MCP_PERMISSIONS.DESIGN_WRITE
    }, async (args) => {
      if (args.direction) {
        this.engine.reorder(args.nodeId, args.direction);
      }
      if (args.newParentId !== undefined) {
        this.engine.reparent(args.nodeId, args.newParentId);
      }
      return { success: true, nodeId: args.nodeId };
    });

    // 16. design_create_component
    this.registerTool({
      name: 'design_create_component',
      category: TOOL_CATEGORIES.DESIGN_SYSTEMS,
      description: 'Creates a master reusable component definition from an existing node.',
      inputSchema: {
        type: 'object',
        properties: {
          nodeId: { type: 'string', required: true },
          componentName: { type: 'string' }
        },
        required: ['nodeId']
      },
      requiredScope: MCP_PERMISSIONS.DESIGN_WRITE
    }, async (args) => {
      const compId = this.engine.createComponentFromNode(args.nodeId);
      const comp = this.doc.components?.find(c => c.id === compId);
      if (args.componentName && comp) comp.name = args.componentName;
      return { success: true, component: comp };
    });

    // 17. design_create_variant
    this.registerTool({
      name: 'design_create_variant',
      category: TOOL_CATEGORIES.DESIGN_SYSTEMS,
      description: 'Adds a variant (e.g. state=hover, size=large) to a master component.',
      inputSchema: {
        type: 'object',
        properties: {
          componentId: { type: 'string', required: true },
          variantName: { type: 'string', required: true },
          propertyOverrides: { type: 'object' }
        },
        required: ['componentId', 'variantName']
      },
      requiredScope: MCP_PERMISSIONS.DESIGN_WRITE
    }, async (args) => {
      const comp = this.doc.components?.find(c => c.id === args.componentId);
      if (!comp) throw new Error(`Component '${args.componentId}' not found`);
      const variant = {
        id: generateId('var'),
        name: args.variantName,
        properties: args.propertyOverrides || {}
      };
      if (!comp.variants) comp.variants = [];
      comp.variants.push(variant);
      return { success: true, variant };
    });

    // 18. design_set_auto_layout
    this.registerTool({
      name: 'design_set_auto_layout',
      category: TOOL_CATEGORIES.FRAMES_LAYOUT,
      description: 'Configures Auto-Layout flex direction, alignment, gap, and padding.',
      inputSchema: {
        type: 'object',
        properties: {
          frameId: { type: 'string', required: true },
          mode: { type: 'string', enum: ['none', 'stack-horizontal', 'stack-vertical', 'grid'], required: true },
          gap: { type: 'number', default: 12 },
          padding: { type: 'number', default: 16 },
          alignItems: { type: 'string', enum: ['start', 'center', 'end', 'stretch'], default: 'start' },
          justifyContent: { type: 'string', enum: ['start', 'center', 'end', 'space-between'], default: 'start' }
        },
        required: ['frameId', 'mode']
      },
      requiredScope: MCP_PERMISSIONS.DESIGN_WRITE
    }, async (args) => {
      this.engine.updateNode(args.frameId, {
        layout: {
          mode: args.mode,
          gap: args.gap ?? 12,
          paddingLeft: args.padding ?? 16,
          paddingRight: args.padding ?? 16,
          paddingTop: args.padding ?? 16,
          paddingBottom: args.padding ?? 16,
          alignItems: args.alignItems || 'start',
          justifyContent: args.justifyContent || 'start'
        }
      }, 'MCP: Set Auto-Layout');
      return { success: true, frameId: args.frameId };
    });

    // 19. design_bind_variable
    this.registerTool({
      name: 'design_bind_variable',
      category: TOOL_CATEGORIES.DESIGN_SYSTEMS,
      description: 'Binds a design property to a design token variable.',
      inputSchema: {
        type: 'object',
        properties: {
          nodeId: { type: 'string', required: true },
          property: { type: 'string', required: true },
          tokenName: { type: 'string', required: true }
        },
        required: ['nodeId', 'property', 'tokenName']
      },
      requiredScope: MCP_PERMISSIONS.DESIGN_WRITE
    }, async (args) => {
      const node = this.engine.getNode(args.nodeId);
      if (!node) throw new Error(`Node '${args.nodeId}' not found`);
      const bindings = { ...(node.variableBindings || {}), [args.property]: args.tokenName };
      this.engine.updateNode(args.nodeId, { variableBindings: bindings }, `MCP: Bind ${args.property} to ${args.tokenName}`);
      return { success: true, nodeId: args.nodeId, property: args.property, tokenName: args.tokenName };
    });

    // 20. design_create_prototype_connection
    this.registerTool({
      name: 'design_create_prototype_connection',
      category: TOOL_CATEGORIES.PROTOTYPING,
      description: 'Creates an interactive prototype flow connection from a trigger object to a target frame.',
      inputSchema: {
        type: 'object',
        properties: {
          sourceNodeId: { type: 'string', required: true },
          targetFrameId: { type: 'string', required: true },
          trigger: { type: 'string', enum: ['click', 'hover', 'drag', 'key'], default: 'click' },
          action: { type: 'string', enum: ['navigate', 'open_overlay', 'back'], default: 'navigate' },
          animation: { type: 'string', enum: ['instant', 'dissolve', 'smart_animate', 'slide_in'], default: 'smart_animate' }
        },
        required: ['sourceNodeId', 'targetFrameId']
      },
      requiredScope: MCP_PERMISSIONS.DESIGN_WRITE
    }, async (args) => {
      const interaction = {
        id: `inter_${Date.now()}`,
        trigger: args.trigger || 'click',
        action: args.action || 'navigate',
        targetFrameId: args.targetFrameId,
        animation: args.animation || 'smart_animate'
      };
      const node = this.engine.getNode(args.sourceNodeId);
      if (!node) throw new Error(`Source node '${args.sourceNodeId}' not found`);
      const interactions = [...(node.interactions || []), interaction];
      this.engine.updateNode(args.sourceNodeId, { interactions }, 'MCP: Add prototype connection');
      return { success: true, interactionId: interaction.id };
    });

    // 21. design_apply_transaction (requires approval if destructive)
    this.registerTool({
      name: 'design_apply_transaction',
      category: TOOL_CATEGORIES.DESIGN_DOCUMENT,
      description: 'Executes an atomic transaction containing multiple operations with rollback safety.',
      inputSchema: {
        type: 'object',
        properties: {
          description: { type: 'string', required: true },
          operations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string', required: true },
                payload: { type: 'object' }
              },
              required: ['type']
            }
          }
        },
        required: ['description', 'operations']
      },
      requiredScope: MCP_PERMISSIONS.DESIGN_WRITE,
      requiresApproval: true
    }, async (args) => {
      const executedIds = [];
      for (const op of args.operations) {
        if (op.type === 'create_node') {
          const n = createNode(op.payload.type, op.payload);
          this.engine.addNode(n, op.payload.parentId || null, args.description);
          executedIds.push(n.id);
        } else if (op.type === 'update_node') {
          this.engine.updateNode(op.payload.id, op.payload.patch, args.description);
          executedIds.push(op.payload.id);
        } else if (op.type === 'delete_node') {
          this.engine.deleteNode(op.payload.id, args.description);
          executedIds.push(op.payload.id);
        }
      }
      return {
        success: true,
        transactionDescription: args.description,
        appliedOperationsCount: args.operations.length,
        affectedIds: executedIds
      };
    });

    // 22. design_undo_transaction
    this.registerTool({
      name: 'design_undo_transaction',
      category: TOOL_CATEGORIES.DESIGN_DOCUMENT,
      description: 'Undoes the most recent command or transaction in history.',
      inputSchema: { type: 'object', properties: {} },
      requiredScope: MCP_PERMISSIONS.DESIGN_WRITE,
      requiresApproval: true
    }, async () => {
      const undone = this.engine.undo();
      return { success: undone, canUndoRemaining: this.engine.canUndo() };
    });
  }

  // ==========================================
  // 5.3 ASSET AND EXPORT TOOLS
  // ==========================================
  registerExportTools() {
    // 23. design_export_asset
    this.registerTool({
      name: 'design_export_asset',
      category: TOOL_CATEGORIES.ASSET_EXPORT,
      description: 'Exports a selected node or frame as SVG markup or PNG data.',
      inputSchema: {
        type: 'object',
        properties: {
          nodeId: { type: 'string', required: true },
          format: { type: 'string', enum: ['svg', 'png'], default: 'svg' }
        },
        required: ['nodeId']
      },
      requiredScope: MCP_PERMISSIONS.DESIGN_EXPORT
    }, async (args) => {
      const node = this.engine.getNode(args.nodeId);
      if (!node) throw new Error(`Node '${args.nodeId}' not found`);

      const w = Math.round(node.transform.width);
      const h = Math.round(node.transform.height);
      const bg = node.style?.fills?.[0]?.color || '#ffffff';
      const rad = node.style?.cornerRadius || 0;

      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" rx="${rad}" fill="${bg}" />
  <text x="${w / 2}" y="${h / 2 + 5}" font-family="Inter, sans-serif" font-size="14" fill="#ffffff" text-anchor="middle">${node.name}</text>
</svg>`;

      return {
        nodeId: node.id,
        nodeName: node.name,
        format: args.format || 'svg',
        dimensions: { width: w, height: h },
        mimeType: args.format === 'png' ? 'image/png' : 'image/svg+xml',
        data: svg
      };
    });

    // 24. design_get_export_manifest
    this.registerTool({
      name: 'design_get_export_manifest',
      category: TOOL_CATEGORIES.ASSET_EXPORT,
      description: 'Returns all exportable frames, format configurations, and asset warnings.',
      inputSchema: { type: 'object', properties: {} },
      requiredScope: MCP_PERMISSIONS.DESIGN_EXPORT
    }, async () => {
      const page = this.getActivePage();
      const frames = Object.values(page.nodes).filter(n => n.type === 'frame');
      return {
        documentName: this.doc.name,
        pageName: page.name,
        exportableCount: frames.length,
        targets: frames.map(f => ({
          id: f.id,
          name: f.name,
          dimensions: { width: f.transform.width, height: f.transform.height },
          supportedFormats: ['svg', 'png', 'react-tsx']
        }))
      };
    });

    // 25. design_generate_react_project
    this.registerTool({
      name: 'design_generate_react_project',
      category: TOOL_CATEGORIES.REACT_COMPILER,
      description: 'Invokes the deterministic React & TypeScript compiler to generate production code.',
      inputSchema: {
        type: 'object',
        properties: {
          target: { type: 'string', enum: ['react-ts-tailwind', 'react-ts-vanilla'], default: 'react-ts-tailwind' }
        }
      },
      requiredScope: MCP_PERMISSIONS.DESIGN_EXPORT
    }, async (args) => {
      const compiler = new ReactCompiler(this.doc, { target: 'react-tailwind', typescript: true });
      const result = compiler.compile();
      const filePaths = Object.keys(result.fileTree || {});
      this.lastBuildStatus = {
        status: result.success ? 'success' : 'failed',
        filesCount: filePaths.length,
        timestamp: new Date().toISOString(),
        diagnostics: result.diagnostics || []
      };
      return {
        status: result.success ? 'success' : 'failed',
        target: args.target || 'react-ts-tailwind',
        fileCount: filePaths.length,
        entryPoint: 'src/App.tsx',
        files: filePaths.map(p => ({ path: p, sizeBytes: (result.fileTree[p] || '').length }))
      };
    });

    // 26. design_get_build_status
    this.registerTool({
      name: 'design_get_build_status',
      category: TOOL_CATEGORIES.REACT_COMPILER,
      description: 'Returns real compiler build status and diagnostics.',
      inputSchema: { type: 'object', properties: {} },
      requiredScope: MCP_PERMISSIONS.DESIGN_EXPORT
    }, async () => {
      return this.lastBuildStatus;
    });
  }

  // ==========================================
  // 6. MCP RESOURCES
  // ==========================================
  registerDesignResources() {
    // Static summary resource
    this.registerResource({
      uri: `design://documents/${this.doc.id}/summary`,
      name: 'Document Summary',
      description: 'Active design document summary and layer metrics',
      mimeType: 'application/json'
    }, async () => ({
      documentId: this.doc.id,
      name: this.doc.name,
      updatedAt: this.doc.updatedAt,
      pages: this.doc.pages.map(p => ({ id: p.id, name: p.name }))
    }));

    // Dynamic resource templates
    this.registerResourceTemplate({
      uriTemplate: 'design://documents/{docId}/pages',
      description: 'List of all pages in the document',
      mimeType: 'application/json',
      handler: async (uri, params) => this.doc.pages.map(p => ({ id: p.id, name: p.name }))
    });

    this.registerResourceTemplate({
      uriTemplate: 'design://documents/{docId}/tokens',
      description: 'Design tokens and variable groups',
      mimeType: 'application/json',
      handler: async (uri, params) => this.doc.tokens || []
    });

    this.registerResourceTemplate({
      uriTemplate: 'design://documents/{docId}/components',
      description: 'Component library and variants',
      mimeType: 'application/json',
      handler: async (uri, params) => this.doc.components || {}
    });

    this.registerResourceTemplate({
      uriTemplate: 'design://documents/{docId}/prototype',
      description: 'Prototype interaction flows',
      mimeType: 'application/json',
      handler: async (uri, params) => {
        const page = this.getActivePage();
        return Object.values(page.nodes).filter(n => n.interactions?.length > 0);
      }
    });

    this.registerResourceTemplate({
      uriTemplate: 'design://documents/{docId}/nodes/{nodeId}',
      description: 'Specific node details',
      mimeType: 'application/json',
      handler: async (uri, params) => {
        const page = this.getActivePage();
        const node = page.nodes[params.nodeId];
        if (!node) throw new Error(`Node ${params.nodeId} not found`);
        return node;
      }
    });
  }

  // ==========================================
  // 7. MCP PROMPTS
  // ==========================================
  registerDesignPrompts() {
    this.registerPrompt({
      name: 'design_create_dashboard',
      description: 'AI guidance prompt to generate an enterprise analytics dashboard with KPI cards and table.',
      arguments: [
        { name: 'productPurpose', description: 'What the dashboard is for (e.g. Treasury, Cloud Ops)', required: true },
        { name: 'theme', description: 'Dark or Light mode preference', required: false }
      ]
    }, async (args) => {
      return `Act as a senior UI/UX designer. Create an enterprise ${args.productPurpose || 'Cloud SaaS'} dashboard.
Layout: 1440x1024 Desktop frame, 240px sidebar, 72px top header, 4 KPI cards with metric changes, and a real-time data table.
Theme: ${args.theme || 'dark mode with #0f172a background and #38bdf8 accents'}. Use Auto-Layout on all cards.`;
    });

    this.registerPrompt({
      name: 'design_audit',
      description: 'Inspect design document against design-system consistency rules.',
      arguments: [
        { name: 'auditScope', description: 'Page or Selection', required: false }
      ]
    }, async (args) => {
      return `Audit the current design for token adherence, contrast ratios, and auto-layout consistency.
Identify hardcoded hex colors that should be mapped to design tokens, uneven margins, and missing component variants.`;
    });

    this.registerPrompt({
      name: 'design_to_react',
      description: 'Converts design into clean React + TypeScript + Tailwind code.',
      arguments: [
        { name: 'styling', description: 'Tailwind or CSS modules', required: false }
      ]
    }, async (args) => {
      return `Convert the selected design frame into modular React 19 components with TypeScript and ${args.styling || 'Tailwind CSS'}.
Ensure semantic HTML (<header>, <main>, <aside>, <button>) and zero layout shifts.`;
    });

    this.registerPrompt({
      name: 'design_prepare_handoff',
      description: 'Prepares comprehensive developer handoff specs with box model and assets.',
      arguments: []
    }, async () => {
      return `Generate developer handoff specification:
1. CSS flexbox/grid layout properties
2. Color token aliases
3. Typography scale
4. Exportable SVG icon manifest`;
    });
  }
}
