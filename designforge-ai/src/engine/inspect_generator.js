/**
 * DesignForge AI - Inspect & Dev Mode Code Generator
 * Generates live CSS, Tailwind CSS, React TSX, and SwiftUI snippets
 * for the selected canvas node conforming to Figma Dev Mode specifications.
 */

export class InspectCodeGenerator {
  constructor(doc) {
    this.doc = doc;
  }

  generateAll(node) {
    return this.generateInspectData(node);
  }

  generateInspectData(node) {
    if (!node) return null;

    const t = node.transform || { x: 0, y: 0, width: 100, height: 100, rotation: 0 };
    const l = node.layout || { mode: 'none', gap: 0, paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0 };
    const s = node.style || {};
    const text = node.text || {};

    const fill = s.fills?.[0]?.color || 'transparent';
    const stroke = s.strokes?.[0];
    const radius = s.cornerRadius || 0;
    const opacity = node.opacity !== undefined ? node.opacity : 1;

    return {
      css: this.generateCSS(node, t, l, s, text, fill, stroke, radius, opacity),
      tailwind: this.generateTailwind(node, t, l, s, text, fill, stroke, radius, opacity),
      react: this.generateReact(node, t, l, s, text, fill, stroke, radius, opacity),
      swiftui: this.generateSwiftUI(node, t, l, s, text, fill, stroke, radius, opacity),
      boxModel: {
        width: Math.round(t.width),
        height: Math.round(t.height),
        paddingTop: l.paddingTop || 0,
        paddingRight: l.paddingRight || 0,
        paddingBottom: l.paddingBottom || 0,
        paddingLeft: l.paddingLeft || 0,
        gap: l.gap || 0,
        borderWidth: stroke?.width || 0
      },
      tokens: {
        fill: s.fills?.[0]?.tokenName || null,
        fillHex: fill,
        radius: s.cornerRadiusTokenName || (radius ? `${radius}px` : null),
        font: text.fontFamily || null
      }
    };
  }

  _resolveParams(node, t, l, s, text, fill, stroke, radius, opacity) {
    const _t = t || node?.transform || { x: 0, y: 0, width: 100, height: 100, rotation: 0 };
    const _l = l || node?.layout || { mode: 'none', gap: 0, paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0 };
    const _s = s || node?.style || {};
    const _text = text || node?.text || {};
    const _fill = fill !== undefined ? fill : (_s.fills?.[0]?.color || 'transparent');
    const _stroke = stroke !== undefined ? stroke : _s.strokes?.[0];
    const _radius = radius !== undefined ? radius : (_s.cornerRadius || 0);
    const _opacity = opacity !== undefined ? opacity : (node?.opacity !== undefined ? node.opacity : 1);
    return { t: _t, l: _l, s: _s, text: _text, fill: _fill, stroke: _stroke, radius: _radius, opacity: _opacity };
  }

  generateCSS(node, t, l, s, text, fill, stroke, radius, opacity) {
    ({ t, l, s, text, fill, stroke, radius, opacity } = this._resolveParams(node, t, l, s, text, fill, stroke, radius, opacity));
    const lines = [];
    lines.push(`/* ${node.name} (${node.type}) */`);

    if (l.mode === 'stack-horizontal') {
      lines.push('display: flex;');
      lines.push('flex-direction: row;');
      if (l.alignItems) lines.push(`align-items: ${l.alignItems};`);
      if (l.justifyContent) lines.push(`justify-content: ${l.justifyContent};`);
      if (l.gap) lines.push(`gap: ${l.gap}px;`);
    } else if (l.mode === 'stack-vertical') {
      lines.push('display: flex;');
      lines.push('flex-direction: column;');
      if (l.alignItems) lines.push(`align-items: ${l.alignItems};`);
      if (l.justifyContent) lines.push(`justify-content: ${l.justifyContent};`);
      if (l.gap) lines.push(`gap: ${l.gap}px;`);
    }

    if (l.paddingTop || l.paddingRight || l.paddingBottom || l.paddingLeft) {
      lines.push(`padding: ${l.paddingTop}px ${l.paddingRight}px ${l.paddingBottom}px ${l.paddingLeft}px;`);
    }

    lines.push(`width: ${Math.round(t.width)}px;`);
    lines.push(`height: ${Math.round(t.height)}px;`);

    if (fill && fill !== 'transparent') {
      lines.push(`background: ${fill};`);
    }

    if (typeof radius === 'number' && radius > 0) {
      lines.push(`border-radius: ${radius}px;`);
    } else if (typeof radius === 'object' && radius !== null) {
      lines.push(`border-radius: ${radius.topLeft || 0}px ${radius.topRight || 0}px ${radius.bottomRight || 0}px ${radius.bottomLeft || 0}px;`);
    }

    if (stroke && stroke.color) {
      lines.push(`border: ${stroke.width || 1}px solid ${stroke.color};`);
    }

    if (opacity < 1) {
      lines.push(`opacity: ${opacity};`);
    }

    if (node.type === 'text') {
      if (text.fontFamily) lines.push(`font-family: ${text.fontFamily};`);
      if (text.fontSize) lines.push(`font-size: ${text.fontSize}px;`);
      if (text.fontWeight) lines.push(`font-weight: ${text.fontWeight};`);
      if (text.color) lines.push(`color: ${text.color};`);
      if (text.textAlign) lines.push(`text-align: ${text.textAlign};`);
    }

    return lines.join('\n');
  }

  generateTailwind(node, t, l, s, text, fill, stroke, radius, opacity) {
    ({ t, l, s, text, fill, stroke, radius, opacity } = this._resolveParams(node, t, l, s, text, fill, stroke, radius, opacity));
    const classes = [];

    if (l.mode === 'stack-horizontal') {
      classes.push('flex flex-row');
      if (l.alignItems === 'center') classes.push('items-center');
      if (l.alignItems === 'stretch') classes.push('items-stretch');
      if (l.justifyContent === 'center') classes.push('justify-center');
      if (l.justifyContent === 'space-between') classes.push('justify-between');
      if (l.gap) classes.push(`gap-[${l.gap}px]`);
    } else if (l.mode === 'stack-vertical') {
      classes.push('flex flex-col');
      if (l.alignItems === 'center') classes.push('items-center');
      if (l.gap) classes.push(`gap-[${l.gap}px]`);
    }

    if (l.paddingTop || l.paddingLeft) {
      classes.push(`p-[${l.paddingTop || 0}px]`);
    }

    classes.push(`w-[${Math.round(t.width)}px] h-[${Math.round(t.height)}px]`);

    if (fill && fill !== 'transparent') {
      classes.push(`bg-[${fill}]`);
    }

    if (typeof radius === 'number' && radius > 0) {
      classes.push(`rounded-[${radius}px]`);
    }

    if (stroke && stroke.color) {
      classes.push(`border border-[${stroke.color}]`);
    }

    if (node.type === 'text') {
      if (text.fontSize) classes.push(`text-[${text.fontSize}px]`);
      if (text.fontWeight >= 700) classes.push('font-bold');
      else if (text.fontWeight >= 600) classes.push('font-semibold');
      else if (text.fontWeight >= 500) classes.push('font-medium');
      if (text.color) classes.push(`text-[${text.color}]`);
    }

    return `className="${classes.join(' ')}"`;
  }

  generateReact(node, t, l, s, text, fill, stroke, radius, opacity) {
    ({ t, l, s, text, fill, stroke, radius, opacity } = this._resolveParams(node, t, l, s, text, fill, stroke, radius, opacity));
    const componentName = (node.name || 'Component').replace(/[^a-zA-Z0-9]/g, '');
    const tw = this.generateTailwind(node, t, l, s, text, fill, stroke, radius, opacity);

    if (node.type === 'text') {
      return `export function ${componentName}() {\n  return (\n    <p ${tw}>\n      ${text.content || 'Text'}\n    </p>\n  );\n}`;
    }

    return `export function ${componentName}() {\n  return (\n    <div ${tw}>\n      {/* Children */}\n    </div>\n  );\n}`;
  }

  generateSwiftUI(node, t, l, s, text, fill, stroke, radius, opacity) {
    ({ t, l, s, text, fill, stroke, radius, opacity } = this._resolveParams(node, t, l, s, text, fill, stroke, radius, opacity));
    const structName = (node.name || 'View').replace(/[^a-zA-Z0-9]/g, '');
    const isVStack = l.mode === 'stack-vertical';
    const isHStack = l.mode === 'stack-horizontal';

    const stack = isVStack ? `VStack(spacing: ${l.gap || 0})` :
                  isHStack ? `HStack(spacing: ${l.gap || 0})` : 'ZStack';

    return `struct ${structName}: View {\n    var body: some View {\n        ${stack} {\n            ${node.type === 'text' ? `Text("${text.content || 'Text'}")\n                .font(.system(size: ${text.fontSize || 16}))\n                .foregroundColor(Color(hex: "${text.color || '#ffffff'}"))` : '// Child views'}\n        }\n        .frame(width: ${Math.round(t.width)}, height: ${Math.round(t.height)})\n        ${fill !== 'transparent' ? `.background(Color(hex: "${fill}"))` : ''}\n        ${radius > 0 ? `.cornerRadius(${radius})` : ''}\n    }\n}`;
  }
}
