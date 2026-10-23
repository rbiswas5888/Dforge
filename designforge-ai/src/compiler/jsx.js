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
      imports.push("import { useInteraction } from '../lib/interactions';");
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

    const interactionHooks = hasInteractions ? `  const { navigate, openModal, closeModal } = useInteraction();
  const [variantState, setVariantState] = useState('default');
` : '';

    const code = `${imports.join('\n')}
${propsInterface}
export const ${compName}: React.FC${this.typescript ? `<${compName}Props>` : ''} = ${propsSignature} => {
${interactionHooks}  return (
${jsx}
  );
};

export default ${compName};
`;

    return {
      name: compName,
      code,
      cssRules
    };
  }

  renderNodeTree(node, page, depth = 0) {
    const indent = '  '.repeat(depth + 2);
    const tag = this.determineSemanticTag(node);
    const styleObj = this.layoutTransformer.transformNodeToStyles(node);

    // CSS styling attribute
    const styleAttr = Object.keys(styleObj).length > 0 ? ` style={${JSON.stringify(styleObj)}}` : '';
    const accessibility = node.accessibilityLabel ? ` aria-label="${node.accessibilityLabel}"` : '';

    // Handle interactive triggers with actual React handlers
    let interactionProps = '';
    if (node.interactions && node.interactions.length > 0) {
      const handlers = [];
      for (const inter of node.interactions) {
        const trigger = inter.trigger || 'click';
        const action = inter.action || 'navigate';

        let actionCode = '';
        if (action === 'navigate' && inter.targetId) {
          actionCode = `navigate('${inter.targetId}')`;
        } else if (action === 'open_overlay' && inter.targetId) {
          actionCode = `openModal('${inter.targetId}')`;
        } else if (action === 'close_overlay') {
          actionCode = `closeModal()`;
        } else if (action === 'change_variant') {
          actionCode = `setVariantState('${inter.targetVariant || 'hover'}')`;
        } else if (action === 'back') {
          actionCode = `window.history.back()`;
        } else if (action === 'url' && inter.url) {
          actionCode = `window.open('${inter.url}', '_blank')`;
        } else {
          actionCode = `console.log('Action triggered:', '${action}')`;
        }

        if (trigger === 'click' || trigger === 'tap') {
          handlers.push(`onClick={() => { ${actionCode}; }}`);
        } else if (trigger === 'hover' || trigger === 'enter') {
          handlers.push(`onMouseEnter={() => { ${actionCode}; }}`);
          if (action === 'change_variant') {
            handlers.push(`onMouseLeave={() => { setVariantState('default'); }}`);
          }
        } else if (trigger === 'leave') {
          handlers.push(`onMouseLeave={() => { ${actionCode}; }}`);
        } else if (trigger === 'press') {
          handlers.push(`onMouseDown={() => { ${actionCode}; }}`);
          if (action === 'change_variant') {
            handlers.push(`onMouseUp={() => { setVariantState('default'); }}`);
          }
        }
      }
      if (handlers.length > 0) {
        interactionProps = ' ' + handlers.join(' ');
      }
    }

    if (node.type === 'text') {
      const text = this.escapeJsx(node.text?.content || '');
      return {
        jsx: `${indent}<${tag}${styleAttr}${accessibility}${interactionProps}>${text}</${tag}>`,
        cssRules: []
      };
    }

    if (!node.childIds || node.childIds.length === 0) {
      return {
        jsx: `${indent}<${tag}${styleAttr}${accessibility}${interactionProps} />`,
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
      jsx: `${indent}<${tag}${styleAttr}${accessibility}${interactionProps}>\n${childrenJsx.join('\n')}\n${indent}</${tag}>`,
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
