/**
 * DesignForge AI - Design Intelligence & Diagnostic Engine
 * Deterministic design linting: WCAG contrast, spacing harmony, layout overflow, and component duplication
 */

import { computeWorldBounds } from '../engine/layout.js';

export class DesignIntelligenceAnalyzer {
  constructor(document, commandEngine) {
    this.doc = document;
    this.engine = commandEngine;
  }

  /**
   * Performs a comprehensive diagnostic audit of the active page and document
   */
  audit() {
    const page = this.engine.getActivePage();
    const findings = [];

    // 1. Audit Layout Overflow
    this.auditLayoutOverflow(page, findings);

    // 2. Audit Contrast & WCAG Accessibility
    this.auditContrast(page, findings);

    // 3. Audit Spacing & Token Consistency
    this.auditSpacing(page, findings);

    // 4. Audit Typography Hierarchy
    this.auditTypography(page, findings);

    // 5. Audit Component Duplication / Repeated Patterns
    this.auditComponentDuplication(page, findings);

    // 6. Audit Responsive Breakpoints
    this.auditResponsiveCoverage(page, findings);

    const summary = {
      timestamp: new Date().toISOString(),
      totalFindings: findings.length,
      errorsCount: findings.filter(f => f.severity === 'error').length,
      warningsCount: findings.filter(f => f.severity === 'warning').length,
      suggestionsCount: findings.filter(f => f.severity === 'info').length,
      findings
    };

    return summary;
  }

  auditLayoutOverflow(page, findings) {
    const boundsCache = new Map();

    for (const [id, node] of Object.entries(page.nodes)) {
      if (!node.childIds || node.childIds.length === 0) continue;

      const parentBounds = computeWorldBounds(page, id, boundsCache);
      if (!parentBounds || parentBounds.width <= 0 || parentBounds.height <= 0) continue;

      for (const childId of node.childIds) {
        const child = page.nodes[childId];
        if (!child || !child.visible) continue;

        const childBounds = computeWorldBounds(page, childId, boundsCache);
        if (!childBounds) continue;

        // Check if child extends past right or bottom boundaries
        const overflowX = (childBounds.x + childBounds.width) - (parentBounds.x + parentBounds.width);
        const overflowY = (childBounds.y + childBounds.height) - (parentBounds.y + parentBounds.height);

        if (overflowX > 4 || overflowY > 4) {
          findings.push({
            id: `overflow_${childId}`,
            category: 'Layout Overflow',
            severity: 'error',
            nodeId: child.id,
            nodeName: child.name,
            message: `Element '${child.name}' overflows container '${node.name}' by ${Math.round(Math.max(overflowX, overflowY))}px.`,
            suggestion: 'Adjust child width or enable Auto Layout with flex wrap.',
            fix: {
              op: 'updateNode',
              nodeId: child.id,
              patch: { transform: { width: Math.min(child.transform.width, parentBounds.width - 24) } }
            }
          });
        }
      }
    }
  }

  auditContrast(page, findings) {
    for (const [id, node] of Object.entries(page.nodes)) {
      if (node.type !== 'text' || !node.text) continue;

      const textColor = node.text.color || '#ffffff';
      // Find parent or container background fill
      let bgColor = '#090d16'; // Default dark page background
      if (node.parentId && page.nodes[node.parentId]) {
        const parent = page.nodes[node.parentId];
        if (parent.style?.fills?.length > 0 && parent.style.fills[0].color) {
          bgColor = parent.style.fills[0].color;
        }
      }

      const ratio = this.calculateContrastRatio(textColor, bgColor);
      const isLarge = (node.text.fontSize || 16) >= 18 || ((node.text.fontSize || 16) >= 14 && (node.text.fontWeight === '700' || node.text.fontWeight === '800'));
      const requiredRatio = isLarge ? 3.0 : 4.5;

      if (ratio < requiredRatio) {
        findings.push({
          id: `contrast_${id}`,
          category: 'Accessibility',
          severity: 'warning',
          nodeId: node.id,
          nodeName: node.name,
          message: `Text contrast ratio is ${ratio.toFixed(2)}:1 (WCAG AA requires ${requiredRatio}:1 against background ${bgColor}).`,
          suggestion: 'Increase luminance contrast to meet WCAG AA requirements.',
          fix: {
            op: 'updateNode',
            nodeId: node.id,
            patch: { text: { color: ratio < 2 ? '#f8fafc' : '#ffffff' } }
          }
        });
      }
    }
  }

  auditSpacing(page, findings) {
    const validTokenSpacings = [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64];

    for (const [id, node] of Object.entries(page.nodes)) {
      if (!node.layout || node.layout.mode === 'none') continue;

      const gap = node.layout.gap || 0;
      if (gap > 0 && !validTokenSpacings.includes(gap)) {
        // Nearest token
        const nearest = validTokenSpacings.reduce((prev, curr) => Math.abs(curr - gap) < Math.abs(prev - gap) ? curr : prev);
        findings.push({
          id: `spacing_${id}`,
          category: 'Design System Harmony',
          severity: 'info',
          nodeId: node.id,
          nodeName: node.name,
          message: `Gap of ${gap}px does not conform to the 4px/8px spacing token system.`,
          suggestion: `Normalize gap to ${nearest}px to align with design tokens.`,
          fix: {
            op: 'updateNode',
            nodeId: node.id,
            patch: { layout: { gap: nearest } }
          }
        });
      }
    }
  }

  auditTypography(page, findings) {
    const standardSizes = [11, 12, 13, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64];

    for (const [id, node] of Object.entries(page.nodes)) {
      if (node.type !== 'text' || !node.text) continue;
      const size = Math.round(node.text.fontSize || 16);
      if (!standardSizes.includes(size)) {
        const nearest = standardSizes.reduce((prev, curr) => Math.abs(curr - size) < Math.abs(prev - size) ? curr : prev);
        findings.push({
          id: `typo_${id}`,
          category: 'Typography Scale',
          severity: 'info',
          nodeId: node.id,
          nodeName: node.name,
          message: `Font size ${size}px deviates from standardized type scale.`,
          suggestion: `Adjust to nearest scale step (${nearest}px).`,
          fix: {
            op: 'updateNode',
            nodeId: node.id,
            patch: { text: { fontSize: nearest } }
          }
        });
      }
    }
  }

  auditComponentDuplication(page, findings) {
    // Detect repeated sibling structures with identical child count and similar dimensions
    const containers = Object.values(page.nodes).filter(n => n.type === 'frame' && n.childIds && n.childIds.length >= 2);
    const signatureMap = new Map();

    for (const c of containers) {
      const sig = `${c.childIds.length}_${Math.round(c.transform.width / 40)}_${c.layout?.mode || 'none'}`;
      if (!signatureMap.has(sig)) signatureMap.set(sig, []);
      signatureMap.get(sig).push(c);
    }

    for (const [sig, items] of signatureMap.entries()) {
      if (items.length >= 3) {
        findings.push({
          id: `duplicate_${sig}`,
          category: 'Component Architecture',
          severity: 'info',
          nodeId: items[0].id,
          nodeName: items[0].name,
          message: `Found ${items.length} repeated elements with identical structural signature (${items.map(i => `'${i.name}'`).slice(0, 3).join(', ')}).`,
          suggestion: 'Refactor repeated pattern into a reusable Design Component to improve maintainability.',
          fix: null
        });
      }
    }
  }

  auditResponsiveCoverage(page, findings) {
    const rootFrames = page.rootIds.map(id => page.nodes[id]).filter(Boolean);
    const hasDesktop = rootFrames.some(f => f.transform.width >= 1024);
    const hasMobile = rootFrames.some(f => f.transform.width <= 480);

    if (hasDesktop && !hasMobile) {
      findings.push({
        id: 'missing_mobile_breakpoint',
        category: 'Responsive Coverage',
        severity: 'warning',
        nodeId: rootFrames[0].id,
        nodeName: rootFrames[0].name,
        message: 'Project contains a Desktop layout but lacks an adaptive Mobile screen (375px).',
        suggestion: 'Generate a mobile viewport frame with stacked single-column layout.',
        fix: null
      });
    }
  }

  /**
   * Computes WCAG 2.1 relative luminance and contrast ratio between two hex/rgb colors
   */
  calculateContrastRatio(foreground, background) {
    const l1 = this.getLuminance(foreground);
    const l2 = this.getLuminance(background);
    const brightest = Math.max(l1, l2);
    const darkest = Math.min(l1, l2);
    return (brightest + 0.05) / (darkest + 0.05);
  }

  getLuminance(colorStr) {
    const rgb = this.parseRgb(colorStr);
    const [r, g, b] = [rgb.r / 255, rgb.g / 255, rgb.b / 255].map(v => {
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  parseRgb(colorStr) {
    if (!colorStr) return { r: 255, g: 255, b: 255 };
    if (colorStr.startsWith('#')) {
      let hex = colorStr.slice(1);
      if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
      return {
        r: parseInt(hex.slice(0, 2), 16) || 0,
        g: parseInt(hex.slice(2, 4), 16) || 0,
        b: parseInt(hex.slice(4, 6), 16) || 0
      };
    }
    const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      return { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]) };
    }
    return { r: 255, g: 255, b: 255 };
  }
}
