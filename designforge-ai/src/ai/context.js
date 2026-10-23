/**
 * DesignForge AI - Design-Aware Context Manager
 * Builds compact, token-budgeted, and privacy-filtered document context snapshots
 */

import { PRIVACY_MODES } from './types.js';

export class ContextManager {
  constructor(document, commandEngine) {
    this.doc = document;
    this.engine = commandEngine;
    this.privacyMode = PRIVACY_MODES.ALLOW_HOSTED;
    this.maxContextChars = 14000; // ~3,500 tokens
  }

  setPrivacyMode(mode) {
    this.privacyMode = mode;
  }

  /**
   * Generates a compact JSON-serializable design context payload
   */
  buildContext(options = {}) {
    const page = this.engine.getActivePage();
    const selectedIds = this.engine.getSelection();
    const selectedNodes = selectedIds.map(id => page.nodes[id]).filter(Boolean);

    const context = {
      project: {
        name: this.doc.name,
        schemaVersion: this.doc.schemaVersion,
        exportProfile: this.doc.exportProfile?.framework || 'react-vite-cssmodules'
      },
      page: {
        id: page.id,
        name: page.name,
        route: page.route || '/',
        totalNodesCount: Object.keys(page.nodes).length,
        rootFrames: page.rootIds.map(id => {
          const n = page.nodes[id];
          return n ? { id: n.id, name: n.name, width: n.transform?.width, height: n.transform?.height } : null;
        }).filter(Boolean)
      },
      selection: selectedNodes.map(node => this.summarizeNode(node, page)),
      designTokens: this.summarizeTokens(),
      availableComponents: (this.doc.components || []).map(c => ({
        id: c.id,
        name: c.name,
        variants: c.variants?.map(v => v.name) || []
      }))
    };

    // If a single node is selected, include its parent and immediate siblings for context
    if (selectedNodes.length === 1) {
      const target = selectedNodes[0];
      if (target.parentId && page.nodes[target.parentId]) {
        const parent = page.nodes[target.parentId];
        context.parentContainer = {
          id: parent.id,
          name: parent.name,
          layout: parent.layout,
          siblingCount: parent.childIds.length
        };
      }
    }

    // Apply privacy filtering
    if (this.privacyMode === PRIVACY_MODES.REDACT_TEXT) {
      this.redactTextInContext(context);
    }

    // Enforce token budget by trimming
    const serialized = JSON.stringify(context, null, 2);
    if (serialized.length > this.maxContextChars) {
      context.designTokens = context.designTokens.slice(0, 10);
      context.availableComponents = context.availableComponents.slice(0, 5);
    }

    return context;
  }

  summarizeNode(node, page) {
    if (!node) return null;
    const summary = {
      id: node.id,
      name: node.name,
      type: node.type,
      bounds: {
        x: Math.round(node.transform?.x || 0),
        y: Math.round(node.transform?.y || 0),
        width: Math.round(node.transform?.width || 0),
        height: Math.round(node.transform?.height || 0)
      },
      layout: node.layout?.mode !== 'none' ? {
        mode: node.layout.mode,
        gap: node.layout.gap,
        padding: [node.layout.paddingTop, node.layout.paddingRight, node.layout.paddingBottom, node.layout.paddingLeft],
        align: node.layout.alignItems,
        justify: node.layout.justifyContent
      } : { mode: 'none' },
      semanticTag: node.semanticTag,
      childCount: node.childIds?.length || 0
    };

    if (node.style?.fills?.length > 0) {
      summary.fill = node.style.fills[0].color;
    }
    if (node.style?.cornerRadius) {
      summary.cornerRadius = node.style.cornerRadius;
    }

    if (node.type === 'text' && node.text) {
      summary.text = {
        content: this.privacyMode === PRIVACY_MODES.REDACT_TEXT ? '[REDACTED]' : node.text.content,
        fontSize: node.text.fontSize,
        fontWeight: node.text.fontWeight,
        color: node.text.color
      };
    }

    return summary;
  }

  summarizeTokens() {
    const list = [];
    for (const group of this.doc.tokens || []) {
      for (const t of group.tokens || []) {
        list.push({
          id: t.id,
          name: t.name,
          type: t.type,
          value: t.value
        });
      }
    }
    return list;
  }

  redactTextInContext(obj) {
    if (!obj || typeof obj !== 'object') return;
    for (const key of Object.keys(obj)) {
      if (key === 'content' && typeof obj[key] === 'string') {
        obj[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object') {
        this.redactTextInContext(obj[key]);
      }
    }
  }

  /**
   * Formats context into a concise system prompt snippet for LLMs
   */
  toSystemContextString() {
    const ctx = this.buildContext();
    return `Active Project: "${ctx.project.name}" (Page: ${ctx.page.name}, Route: ${ctx.page.route}).
Selection: ${ctx.selection.length === 0 ? 'None (Document Canvas Level)' : ctx.selection.map(s => `[${s.type} '${s.name}' ${s.bounds.width}x${s.bounds.height}]`).join(', ')}.
Available Design Tokens: ${ctx.designTokens.map(t => `${t.name}: ${t.value}`).slice(0, 15).join(', ')}.
Output Format: Emit validated JSON tool calls only. Never output raw markdown or arbitrary code without calling the tool.`;
  }
}
