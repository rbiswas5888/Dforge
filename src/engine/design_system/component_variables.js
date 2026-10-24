/**
 * DesignForge AI — Unified Design System Subsystem
 * Component Variable Extraction Engine (Opt-in Explicit Workflow)
 * Conforms to Master Specification Section 11
 */

import { VARIABLE_TYPES } from './types.js';

export class ComponentVariableExtractor {
  constructor(registry, commandEngine) {
    this.registry = registry;
    this.engine = commandEngine;
  }

  /**
   * Analyzes selected component node and proposes variable bindings
   * Strictly explicit and opt-in.
   */
  proposeVariablesForComponent(nodeId) {
    const page = this.engine.getActivePage();
    const node = page.nodes[nodeId];
    if (!node) {
      throw new Error(`Node ${nodeId} not found.`);
    }

    const proposals = [];
    const existingVariables = Object.values(this.registry.system.variables);
    const existingTokens = Object.values(this.registry.system.tokens);

    const compSlug = (node.name || 'component').toLowerCase().replace(/[^a-z0-9]+/g, '.');

    // 1. Inspect Fills (Color Variable)
    if (node.style?.fills && node.style.fills.length > 0) {
      const fill = node.style.fills[0];
      if (fill.color && fill.type === 'solid') {
        const matchingVar = existingVariables.find(v => v.type === 'color' && v.value.toLowerCase() === fill.color.toLowerCase());
        const matchingTok = existingTokens.find(t => t.type === 'color' && t.value.toLowerCase() === fill.color.toLowerCase());

        proposals.push({
          id: `var_prop_fill_${nodeId}`,
          property: 'style.fills.0.color',
          label: 'Background Fill',
          proposedName: matchingVar ? matchingVar.name : (matchingTok ? matchingTok.name : `${compSlug}.bg`),
          type: VARIABLE_TYPES.COLOR,
          value: fill.color,
          action: matchingVar || matchingTok ? 'reuse' : 'create',
          existingRefId: matchingVar ? matchingVar.id : (matchingTok ? matchingTok.id : null),
          reason: matchingVar ? `Matches variable ${matchingVar.name}` : (matchingTok ? `Matches token ${matchingTok.name}` : 'Reusable component surface color'),
          approved: true
        });
      }
    }

    // 2. Inspect Text Color & Typography
    if (node.type === 'text' && node.text) {
      if (node.text.color) {
        const matchingVar = existingVariables.find(v => v.type === 'color' && v.value.toLowerCase() === node.text.color.toLowerCase());
        proposals.push({
          id: `var_prop_text_color_${nodeId}`,
          property: 'text.color',
          label: 'Text Foreground',
          proposedName: matchingVar ? matchingVar.name : `${compSlug}.text.color`,
          type: VARIABLE_TYPES.COLOR,
          value: node.text.color,
          action: matchingVar ? 'reuse' : 'create',
          existingRefId: matchingVar ? matchingVar.id : null,
          reason: matchingVar ? `Matches existing variable ${matchingVar.name}` : 'Typography foreground color',
          approved: true
        });
      }

      if (node.text.fontSize) {
        proposals.push({
          id: `var_prop_text_size_${nodeId}`,
          property: 'text.fontSize',
          label: 'Font Size',
          proposedName: `${compSlug}.font.size`,
          type: VARIABLE_TYPES.NUMBER,
          value: node.text.fontSize,
          action: 'create',
          reason: 'Component typography scale',
          approved: true
        });
      }
    }

    // 3. Inspect Corner Radius
    if (node.style?.cornerRadius > 0) {
      const radiusVal = node.style.cornerRadius;
      const matchingVar = existingVariables.find(v => v.value === radiusVal && (v.name.includes('radius') || v.type === 'dimension'));
      proposals.push({
        id: `var_prop_radius_${nodeId}`,
        property: 'style.cornerRadius',
        label: 'Corner Radius',
        proposedName: matchingVar ? matchingVar.name : `${compSlug}.radius`,
        type: VARIABLE_TYPES.DIMENSION,
        value: radiusVal,
        action: matchingVar ? 'reuse' : 'create',
        existingRefId: matchingVar ? matchingVar.id : null,
        reason: matchingVar ? `Reuses ${matchingVar.name}` : 'Component container corner radius',
        approved: true
      });
    }

    // 4. Inspect Auto-Layout Padding & Gap
    if (node.layout && node.layout.mode !== 'none') {
      if (node.layout.gap > 0) {
        const gapVal = node.layout.gap;
        const matchingVar = existingVariables.find(v => v.value === gapVal && v.name.includes('space'));
        proposals.push({
          id: `var_prop_gap_${nodeId}`,
          property: 'layout.gap',
          label: 'Item Gap',
          proposedName: matchingVar ? matchingVar.name : `${compSlug}.gap`,
          type: VARIABLE_TYPES.DIMENSION,
          value: gapVal,
          action: matchingVar ? 'reuse' : 'create',
          existingRefId: matchingVar ? matchingVar.id : null,
          reason: matchingVar ? `Reuses spacing variable ${matchingVar.name}` : 'Flex item spacing',
          approved: true
        });
      }

      if (node.layout.paddingLeft > 0) {
        const padVal = node.layout.paddingLeft;
        const matchingVar = existingVariables.find(v => v.value === padVal && v.name.includes('space'));
        proposals.push({
          id: `var_prop_pad_${nodeId}`,
          property: 'layout.paddingLeft',
          label: 'Horizontal Padding',
          proposedName: matchingVar ? matchingVar.name : `${compSlug}.padding.x`,
          type: VARIABLE_TYPES.DIMENSION,
          value: padVal,
          action: matchingVar ? 'reuse' : 'create',
          existingRefId: matchingVar ? matchingVar.id : null,
          reason: matchingVar ? `Reuses spacing variable ${matchingVar.name}` : 'Component horizontal padding',
          approved: true
        });
      }
    }

    return {
      nodeId,
      componentName: node.name,
      proposals
    };
  }

  /**
   * Commits approved variable proposals and binds them to the component properties
   */
  applyApprovedVariables(nodeId, proposals) {
    const page = this.engine.getActivePage();
    const node = page.nodes[nodeId];
    if (!node) return { success: false };

    const boundTokens = { ...(node.tokenBindings || {}) };
    let createdCount = 0;
    let boundCount = 0;

    for (const prop of proposals) {
      if (!prop.approved || prop.action === 'skip') continue;

      let varId = prop.existingRefId;

      if (prop.action === 'create' || !varId) {
        const createdVar = this.registry.addVariable(prop.proposedName, prop.type, prop.value, {
          description: `Extracted from ${node.name}`
        });
        varId = createdVar.id;
        createdCount++;
      }

      // Bind variable/token ID to node property
      boundTokens[prop.property] = varId;
      boundCount++;
    }

    // Apply update to node via CommandEngine to keep transaction and undo intact
    this.engine.updateNode(nodeId, { tokenBindings: boundTokens }, `Bind AI Variables to ${node.name}`);

    return {
      success: true,
      createdCount,
      boundCount,
      tokenBindings: boundTokens
    };
  }
}
