import { createCIRDocument, createCIRPage, createCIRNode } from './types.js';

const BLOCK_TAGS = new Set([
  'article', 'aside', 'blockquote', 'button', 'div', 'footer', 'form', 'header',
  'li', 'main', 'nav', 'ol', 'section', 'ul'
]);
const TEXT_TAGS = new Set([
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'label', 'p', 'span', 'strong', 'em', 'small'
]);
const VOID_TAGS = new Set(['br', 'hr', 'img', 'input']);
const SUPPORTED_INLINE_STYLES = new Set([
  'alignItems', 'background', 'backgroundColor', 'borderRadius', 'color',
  'display', 'flexDirection', 'fontFamily', 'fontSize', 'fontWeight',
  'gap', 'height', 'justifyContent', 'letterSpacing', 'lineHeight', 'padding',
  'textAlign', 'width'
]);
const TAG_SIZES = {
  h1: [40, 48, 700], h2: [32, 40, 700], h3: [24, 32, 600], h4: [20, 28, 600],
  h5: [16, 24, 600], h6: [14, 20, 600], p: [16, 24, 400], button: [14, 40, 600]
};

function parseStaticValue(value) {
  const text = value.trim();
  if (text.startsWith('"') || text.startsWith("'")) return text.slice(1, -1);
  if (/^-?\d+(?:\.\d+)?(?:px|%|rem|em)$/.test(text)) return text;
  if (/^-?\d+(?:\.\d+)?$/.test(text)) return Number.parseFloat(text);
  if (/^(true|false)$/.test(text)) return text === 'true';
  return null;
}

function parseStyleExpression(expression) {
  const style = {};
  const body = expression.trim().replace(/^\{\s*/, '').replace(/\s*\}$/, '');
  const propertyPattern = /([\w$]+)\s*:\s*("[^"]*"|'[^']*'|#[\da-fA-F]{3,8}\b|rgba?\([^)]*\)|-?\d+(?:\.\d+)?(?:px|%)?|true|false)(?=\s*(?:[,}]|$))/g;
  let match;
  while ((match = propertyPattern.exec(body))) {
    const key = match[1];
    const raw = match[2];
    style[key] = raw.startsWith('#') || raw.startsWith('rgb')
      ? raw
      : parseStaticValue(raw);
  }
  return style;
}

function parseAttributes(source) {
  const attributes = {};
  const attributesSource = source.replace(/\bstyle\s*=\s*\{\{([\s\S]*?)\}\}/, (whole, body) => {
    attributes.style = parseStyleExpression(body);
    return '';
  });
  const expression = /([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|\{([^{}]*)\})/g;
  let match;
  while ((match = expression.exec(attributesSource))) {
    attributes[match[1]] = match[4] !== undefined
      ? (match[1] === 'style' ? parseStyleExpression(match[4]) : parseStaticValue(match[4]))
      : (match[2] ?? match[3]);
  }
  return attributes;
}

function toPixels(value, fallback) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const match = value.match(/^-?\d+(?:\.\d+)?/);
    if (match) return Number(match[0]);
  }
  return fallback;
}

export class ReactSourceImportAdapter {
  constructor() {
    this.name = 'react';
  }

  canParse(data) {
    return typeof data === 'string' && /<\s*(?:[A-Za-z][\w.-]*|\/>)/.test(data);
  }

  parse(source, options = {}) {
    const componentName = options.fileName?.replace(/\.(?:jsx?|tsx?)$/i, '') || 'React Component';
    const returnMatch = source.match(/\breturn\s*\(?\s*(?=<[A-Za-z])/);
    const arrowMatch = source.match(/=>\s*\(?\s*(?=<[A-Za-z])/);
    const jsxStart = returnMatch
      ? returnMatch.index + returnMatch[0].length
      : arrowMatch?.index + arrowMatch[0].length;
    if (jsxStart === undefined) {
      throw new Error('No static JSX returned from a React component. Export or return a JSX element to import it.');
    }

    const jsx = source.slice(jsxStart);
    const jsxRootTag = jsx.match(/^<([\w.-]+)/)?.[1]?.toLowerCase();
    const tokens = jsx.match(/<\/?[A-Za-z][\w.-]*\b[^>]*>|[^<]+/g) || [];
    const cir = createCIRDocument({
      sourceApplication: 'react',
      projectName: componentName,
      originalFileName: options.fileName || 'react-component.jsx'
    });
    const page = createCIRPage('Imported React');
    const root = createCIRNode('frame', {
      name: componentName,
      transform: { x: 0, y: 0, width: 1440, height: 900 },
      layout: { mode: 'stack-vertical', gap: 0 },
      style: { fills: [{ type: 'solid', color: '#0f172a', opacity: 1 }], cornerRadius: 0 }
    });
    page.nodes[root.id] = root;
    page.rootNodeIds.push(root.id);
    const stack = [{ id: root.id, tag: 'root', width: 1440 }];
    const warnings = new Set();
    let nodeCount = 1;

    for (const token of tokens) {
      if (token.startsWith('</')) {
        const closingTag = token.match(/^<\/([\w.-]+)/)?.[1]?.toLowerCase();
        const stackIndex = stack.map(item => item.tag).lastIndexOf(closingTag);
        if (stackIndex > 0) stack.length = stackIndex;
        if (stack.length === 1 && closingTag === jsxRootTag) break;
        continue;
      }

      if (token.startsWith('<')) {
        const match = token.match(/^<([\w.-]+)([\s\S]*?)\/?>$/);
        if (!match) continue;
        const tag = match[1].toLowerCase();
        if (/\w+=\{(?!\s*\{)/.test(match[2])) {
          warnings.add('Dynamic JSX attributes were omitted; only static attributes and styles are imported.');
        }
        if (tag.includes('.')) {
          warnings.add(`Custom component <${match[1]}> imported as a styled container; its implementation is not executed.`);
        }
        const parent = stack[stack.length - 1];
        const attrs = parseAttributes(match[2]);
        if (attrs.className || attrs.class) {
          warnings.add('External CSS classes were not loaded; add supported styles inline before importing.');
        }
        const style = attrs.style || {};
        if (Object.keys(style).some(key => !SUPPORTED_INLINE_STYLES.has(key))) {
          warnings.add('Some inline CSS properties are not represented in the canvas import.');
        }
        const isText = TEXT_TAGS.has(tag) || tag === 'textarea';
        const isImage = tag === 'img';
        const isFrame = !isText;
        const defaults = TAG_SIZES[tag] || [16, isFrame ? 48 : 24, 400];
        const padding = toPixels(style.padding, 0);
        const width = style.width === '100%'
          ? parent.width
          : toPixels(style.width, isFrame ? Math.max(80, parent.width - padding * 2) : parent.width - padding * 2);
        const height = toPixels(style.height, defaults[1]);
        const fill = style.backgroundColor || style.background;
        const fillColor = typeof fill === 'string' ? fill : (tag === 'button' ? '#2563eb' : (isFrame ? 'transparent' : null));
        const fills = fillColor && fillColor !== 'transparent'
          ? [{ type: 'solid', color: fillColor, opacity: 1 }]
          : [];
        const node = createCIRNode(isImage ? 'image' : isText ? 'text' : 'frame', {
          name: String(attrs['aria-label'] || attrs.title || attrs.id || tag),
          parentId: parent.id,
          transform: {
            x: padding,
            y: 0,
            width: Math.max(1, width),
            height: Math.max(1, height)
          },
          layout: {
            mode: isFrame && BLOCK_TAGS.has(tag)
              ? (style.flexDirection === 'row' ? 'stack-horizontal' : 'stack-vertical')
              : 'none',
            paddingTop: padding,
            paddingRight: padding,
            paddingBottom: padding,
            paddingLeft: padding,
            gap: toPixels(style.gap, 8),
            alignItems: style.alignItems === 'center' ? 'center' :
              ['end', 'flex-end'].includes(style.alignItems) ? 'end' : 'start',
            justifyContent: style.justifyContent === 'space-between' ? 'space-between' :
              style.justifyContent === 'center' ? 'center' : 'start',
            sizingHorizontal: style.width === '100%' ? 'fill' : 'fixed'
          },
          style: {
            fills,
            strokes: [],
            cornerRadius: toPixels(style.borderRadius, tag === 'button' ? 8 : 0)
          },
          text: isText ? {
            content: '',
            fontFamily: style.fontFamily || 'Inter, -apple-system, sans-serif',
            fontSize: toPixels(style.fontSize, defaults[0]),
            fontWeight: String(style.fontWeight || defaults[2]),
            lineHeight: toPixels(style.lineHeight, 1.4),
            letterSpacing: toPixels(style.letterSpacing, 0),
            textAlign: style.textAlign || 'left',
            color: style.color || '#f8fafc'
          } : null,
          semanticTag: tag
        });
        if (isImage && typeof attrs.src === 'string') node.style.fills = [{ type: 'image', url: attrs.src }];
        if (node.type === 'frame') node.style.cornerRadius = toPixels(style.borderRadius, 0);
        page.nodes[node.id] = node;
        page.nodes[parent.id].childIds.push(node.id);
        nodeCount++;

        if (!isImage && !VOID_TAGS.has(tag) && !token.endsWith('/>')) {
          stack.push({ id: node.id, tag, width: Math.max(1, width - padding * 2) });
        }
        continue;
      }

      if (token.includes('{')) {
        warnings.add('Dynamic JSX expressions were omitted; only static text and styles are imported.');
      }
      const text = token.replace(/\{[^{}]*\}/g, '').replace(/\s+/g, ' ').trim();
      if (!text) {
        continue;
      }
      const parent = stack[stack.length - 1];
      const parentNode = page.nodes[parent.id];
      if (parentNode.type === 'text' && parentNode.text) {
        parentNode.text.content = [parentNode.text.content, text].filter(Boolean).join(' ');
        continue;
      }
      const textNode = createCIRNode('text', {
        name: text.slice(0, 40),
        parentId: parent.id,
        transform: { x: 0, y: 0, width: parent.width, height: 24 },
        text: { content: text, fontSize: 16, fontWeight: '400', color: '#f8fafc' }
      });
      page.nodes[textNode.id] = textNode;
      page.nodes[parent.id].childIds.push(textNode.id);
      nodeCount++;
    }

    cir.pages.push(page);
    cir.metadata.warnings = Array.from(warnings);
    cir.metadata.importedNodeCount = nodeCount;
    return cir;
  }
}
