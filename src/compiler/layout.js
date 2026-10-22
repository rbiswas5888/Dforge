/**
 * DesignForge AI - Layout & Style Transformer
 * Converts scene graph geometry, Auto-Layout, and visual styling into CSS / CSS Modules / Tailwind
 */

export class LayoutTransformer {
  constructor(options = {}) {
    this.target = options.target || 'react-cssmodules'; // 'react-cssmodules' | 'react-css' | 'react-tailwind'
    this.tokenMap = options.tokenMap || new Map();
  }

  /**
   * Transforms node properties into a CSS style object
   */
  transformNodeToStyles(node) {
    const s = {};

    // Sizing & Positioning
    if (node.transform) {
      if (node.layout?.sizingHorizontal === 'fill') {
        s['width'] = '100%';
        s['flex'] = '1';
      } else if (node.layout?.sizingHorizontal === 'hug') {
        s['width'] = 'fit-content';
      } else if (node.transform.width > 0) {
        s['width'] = `${Math.round(node.transform.width)}px`;
      }

      if (node.layout?.sizingVertical === 'fill') {
        s['height'] = '100%';
      } else if (node.layout?.sizingVertical === 'hug') {
        s['height'] = 'fit-content';
      } else if (node.transform.height > 0) {
        s['height'] = `${Math.round(node.transform.height)}px`;
      }
    }

    // Auto Layout (Flexbox)
    if (node.layout && node.layout.mode !== 'none') {
      s['display'] = 'flex';
      s['flex-direction'] = node.layout.mode === 'stack-horizontal' ? 'row' : 'column';

      if (node.layout.gap) {
        s['gap'] = `${node.layout.gap}px`;
      }

      if (node.layout.alignItems) {
        const alignMap = { start: 'flex-start', center: 'center', end: 'flex-end', stretch: 'stretch' };
        s['align-items'] = alignMap[node.layout.alignItems] || node.layout.alignItems;
      }

      if (node.layout.justifyContent) {
        const justMap = { start: 'flex-start', center: 'center', end: 'flex-end', 'space-between': 'space-between' };
        s['justify-content'] = justMap[node.layout.justifyContent] || node.layout.justifyContent;
      }

      const pTop = node.layout.paddingTop || 0;
      const pRight = node.layout.paddingRight || 0;
      const pBottom = node.layout.paddingBottom || 0;
      const pLeft = node.layout.paddingLeft || 0;
      if (pTop || pRight || pBottom || pLeft) {
        s['padding'] = `${pTop}px ${pRight}px ${pBottom}px ${pLeft}px`;
      }
      s['box-sizing'] = 'border-box';
    }

    // Fills & Background
    if (node.style?.fills && node.style.fills.length > 0) {
      const fill = node.style.fills[0];
      if (fill.type === 'solid' && fill.color) {
        // Resolve token binding if available
        const tokenRef = node.tokenBindings?.['fills.0.color'];
        if (tokenRef && this.tokenMap.has(tokenRef)) {
          s['background-color'] = `var(${this.tokenMap.get(tokenRef)})`;
        } else {
          s['background-color'] = fill.color;
        }
      }
    }

    // Corner Radius
    if (node.style?.cornerRadius) {
      s['border-radius'] = `${node.style.cornerRadius}px`;
    }

    // Strokes (Borders)
    if (node.style?.strokes && node.style.strokes.length > 0) {
      const stroke = node.style.strokes[0];
      const w = stroke.width || 1;
      const c = stroke.color || '#3b82f6';
      s['border'] = `${w}px solid ${c}`;
    }

    // Drop Shadows
    if (node.style?.shadows && node.style.shadows.length > 0) {
      const sh = node.style.shadows[0];
      s['box-shadow'] = `${sh.x || 0}px ${sh.y || 4}px ${sh.blur || 12}px ${sh.color || 'rgba(0,0,0,0.3)'}`;
    }

    // Typography
    if (node.type === 'text' && node.text) {
      s['font-size'] = `${node.text.fontSize || 16}px`;
      s['font-weight'] = node.text.fontWeight || '400';
      s['color'] = node.text.color || '#f8fafc';
      s['line-height'] = node.text.lineHeight || 1.4;
      s['margin'] = '0';
      if (node.text.textAlign) {
        s['text-align'] = node.text.textAlign;
      }
    }

    // Overflow clipping on frames
    if (node.type === 'frame') {
      s['overflow'] = 'hidden';
    }

    // Opacity
    if (node.opacity !== undefined && node.opacity < 1) {
      s['opacity'] = node.opacity;
    }

    return s;
  }

  /**
   * Generates Tailwind utility classes when target is 'react-tailwind'
   */
  generateTailwindClasses(node) {
    const classes = [];

    if (node.layout && node.layout.mode !== 'none') {
      classes.push('flex');
      classes.push(node.layout.mode === 'stack-horizontal' ? 'flex-row' : 'flex-col');
      if (node.layout.alignItems === 'center') classes.push('items-center');
      if (node.layout.justifyContent === 'center') classes.push('justify-center');
      if (node.layout.justifyContent === 'space-between') classes.push('justify-between');
    }

    if (node.style?.cornerRadius) {
      const r = node.style.cornerRadius;
      if (r <= 6) classes.push('rounded-md');
      else if (r <= 12) classes.push('rounded-xl');
      else if (r <= 20) classes.push('rounded-2xl');
      else classes.push('rounded-full');
    }

    if (node.type === 'frame') {
      classes.push('overflow-hidden');
    }

    return classes.join(' ');
  }
}
