/**
 * DesignForge AI - JSX & TSX Code Generator
 * Deterministically emits structured, semantic, and maintainable React/TypeScript components
 */

import { LayoutTransformer } from './layout.js';

export class JsxGenerator {
  constructor(options = {}) {
    this.target = options.target || 'react-cssmodules'; // 'react-cssmodules' | 'react-css' | 'react-tailwind'
    this.typescript = options.typescript !== false;
    this.layoutTransformer = new LayoutTransformer(options);
  }

  /**
   * Generates a complete standalone React component file string
   */
  generateComponent(node, page, subComponents = []) {
    const compName = this.toPascalCase(node.name || 'Component');
    const hasInteractions = this.hasInteractiveElements(node, page);

    const imports = ["import React from 'react';"];
    if (hasInteractions) {
      imports[0] = "import React, { useState } from 'react';";
    }

    if (this.target === 'react-cssmodules') {
      imports.push(`import styles from './${compName}.module.css';`);
    }

    // Subcomponents imports
    for (const sub of subComponents) {
      imports.push(`import { ${sub} } from './${sub}';`);
    }

    const { jsx, cssRules } = this.renderNodeTree(node, page, 0);

    const propsInterface = this.typescript ? `
export interface ${compName}Props {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}
` : '';

    const propsSignature = this.typescript ? `({ className = '', style, children }: ${compName}Props)` : `({ className = '', style, children })`;

    const code = `${imports.join('\n')}
${propsInterface}
export const ${compName}: React.FC${this.typescript ? `<${compName}Props>` : ''} = ${propsSignature} => {
${hasInteractions ? '  const [isActive, setIsActive] = useState(false);\n' : ''}  return (
${jsx}
  );
};

export default ${compName};
`;

    return {
      name: compName,
      code,
      cssRules,
      rootNodeId: node.id
    };
  }

  renderNodeTree(node, page, depth = 0) {
    const indent = '  '.repeat(depth + 2);
    const tag = this.determineSemanticTag(node);
    const styleObj = this.layoutTransformer.transformNodeToStyles(node);

    // CSS styling attribute
    const styleAttr = Object.keys(styleObj).length > 0 ? ` style={${JSON.stringify(styleObj)}}` : '';
    const accessibility = node.accessibilityLabel ? ` aria-label="${node.accessibilityLabel}"` : '';
    const nodeIdAttr = node.id ? ` data-node-id="${node.id}"` : '';

    // Handle interactive click triggers
    let interactionProps = '';
    if (node.interactions && node.interactions.length > 0) {
      interactionProps = ` onClick={() => { /* Interaction: ${node.interactions[0].action} */ }}`;
    }

    if (node.type === 'text') {
      const text = this.escapeJsx(node.text?.content || '');
      return {
        jsx: `${indent}<${tag}${nodeIdAttr}${styleAttr}${accessibility}${interactionProps}>${text}</${tag}>`,
        cssRules: []
      };
    }

    if (!node.childIds || node.childIds.length === 0) {
      return {
        jsx: `${indent}<${tag}${nodeIdAttr}${styleAttr}${accessibility}${interactionProps} />`,
        cssRules: []
      };
    }

    const childrenJsx = [];
    for (const cid of node.childIds) {
      const child = page.nodes[cid];
      if (child && child.visible) {
        const res = this.renderNodeTree(child, page, depth + 1);
        childrenJsx.push(res.jsx);
      }
    }

    return {
      jsx: `${indent}<${tag}${nodeIdAttr}${styleAttr}${accessibility}${interactionProps}>\n${childrenJsx.join('\n')}\n${indent}</${tag}>`,
      cssRules: []
    };
  }

  determineSemanticTag(node) {
    if (node.semanticTag) return node.semanticTag;
    if (node.type === 'text') {
      const size = node.text?.fontSize || 16;
      if (size >= 32) return 'h1';
      if (size >= 24) return 'h2';
      if (size >= 20) return 'h3';
      return 'p';
    }
    if (node.type === 'frame') {
      const n = (node.name || '').toLowerCase();
      if (n.includes('nav') || n.includes('sidebar')) return 'nav';
      if (n.includes('header')) return 'header';
      if (n.includes('footer')) return 'footer';
      if (n.includes('button') || n.includes('cta')) return 'button';
      if (n.includes('section')) return 'section';
      return 'div';
    }
    return 'div';
  }

  hasInteractiveElements(node, page) {
    if (node.interactions && node.interactions.length > 0) return true;
    if (node.childIds) {
      for (const cid of node.childIds) {
        if (page.nodes[cid] && this.hasInteractiveElements(page.nodes[cid], page)) {
          return true;
        }
      }
    }
    return false;
  }

  toPascalCase(str) {
    return str
      .replace(/[^a-zA-Z0-9]+/g, ' ')
      .trim()
      .split(' ')
      .filter(Boolean)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join('') || 'Component';
  }

  escapeJsx(str) {
    return String(str).replace(/([{}])/g, '{\'$1\'}');
  }
}
