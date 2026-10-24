/**
 * DesignForge AI — External Design Import Engine
 * SVG / Adobe Illustrator Interchange Adapter
 * Conforms to Section 4.4 of MD/Design.md Specification
 */

import { createCIRDocument, createCIRPage, createCIRNode } from './types.js';

export class SvgImportAdapter {
  constructor() {
    this.name = 'svg';
  }

  canParse(data) {
    if (typeof data === 'string') {
      const trimmed = data.trim();
      return trimmed.startsWith('<svg') || trimmed.includes('<svg');
    }
    return false;
  }

  parse(svgString, options = {}) {
    const cir = createCIRDocument({
      sourceApplication: 'svg',
      sourceFormatVersion: 'SVG 1.1 / W3C',
      projectName: options.fileName?.replace(/\.svg$/i, '') || 'Imported Vector Graphic',
      originalFileName: options.fileName || 'graphic.svg'
    });

    const cirPage = createCIRPage('Vector Artboard');

    // Extract viewBox or width/height
    const viewBoxMatch = svgString.match(/viewBox=["']([0-9.\s-]+)["']/i);
    const widthMatch = svgString.match(/width=["']([0-9.]+)(?:px)?["']/i);
    const heightMatch = svgString.match(/height=["']([0-9.]+)(?:px)?["']/i);

    let docW = 800;
    let docH = 600;

    if (viewBoxMatch) {
      const parts = viewBoxMatch[1].trim().split(/[\s,]+/).map(parseFloat);
      if (parts.length >= 4) {
        docW = Math.round(parts[2]);
        docH = Math.round(parts[3]);
      }
    } else if (widthMatch && heightMatch) {
      docW = Math.round(parseFloat(widthMatch[1]));
      docH = Math.round(parseFloat(heightMatch[1]));
    }

    // Root artboard frame
    const artboard = createCIRNode('frame', {
      name: options.fileName ? options.fileName.replace(/\.svg$/i, '') : 'SVG Canvas',
      transform: { x: 100, y: 100, width: docW, height: docH },
      style: {
        fills: [{ type: 'solid', color: '#1e293b', opacity: 1 }],
        cornerRadius: 8
      }
    });

    cirPage.nodes[artboard.id] = artboard;
    cirPage.rootNodeIds.push(artboard.id);

    // Extract shapes using robust regex tag parsing (runs identically in Node & Browser)
    const elementRegex = /<(rect|circle|ellipse|line|path|text|polygon)\s+([^>]*?)(\/?>|>[\s\S]*?<\/\1>)/gi;
    let match;
    let index = 0;

    while ((match = elementRegex.exec(svgString)) !== null) {
      index++;
      const tag = match[1].toLowerCase();
      const rawAttrs = match[2];
      const innerContent = match[3] || '';

      const attrs = this.parseAttributes(rawAttrs);
      const node = this.convertSvgElementToNode(tag, attrs, innerContent, artboard.id, index);
      if (node) {
        cirPage.nodes[node.id] = node;
        artboard.childIds.push(node.id);
      }
    }

    // If no child shapes extracted, create sample representative graphic node
    if (artboard.childIds.length === 0) {
      const fallbackNode = createCIRNode('rectangle', {
        parentId: artboard.id,
        name: 'SVG Graphic Shape',
        transform: { x: 20, y: 20, width: Math.max(50, docW - 40), height: Math.max(50, docH - 40) },
        style: {
          fills: [{ type: 'solid', color: '#38bdf8', opacity: 1 }]
        }
      });
      cirPage.nodes[fallbackNode.id] = fallbackNode;
      artboard.childIds.push(fallbackNode.id);
    }

    cir.pages.push(cirPage);
    return cir;
  }

  parseAttributes(attrString) {
    const attrs = {};
    const attrRegex = /([a-zA-Z0-9:-]+)=["']([^"']*)["']/g;
    let m;
    while ((m = attrRegex.exec(attrString)) !== null) {
      attrs[m[1]] = m[2];
    }
    return attrs;
  }

  convertSvgElementToNode(tag, attrs, innerContent, parentId, index) {
    let type = 'rectangle';
    let x = parseFloat(attrs.x || '0');
    let y = parseFloat(attrs.y || '0');
    let width = parseFloat(attrs.width || '100');
    let height = parseFloat(attrs.height || '100');
    let cornerRadius = parseFloat(attrs.rx || attrs.ry || '0');
    let textData = null;
    let vectorData = null;

    if (tag === 'rect') {
      type = 'rectangle';
    } else if (tag === 'circle') {
      type = 'ellipse';
      const r = parseFloat(attrs.r || '25');
      const cx = parseFloat(attrs.cx || String(r));
      const cy = parseFloat(attrs.cy || String(r));
      x = cx - r;
      y = cy - r;
      width = r * 2;
      height = r * 2;
      cornerRadius = 9999;
    } else if (tag === 'ellipse') {
      type = 'ellipse';
      const rx = parseFloat(attrs.rx || '30');
      const ry = parseFloat(attrs.ry || '20');
      const cx = parseFloat(attrs.cx || String(rx));
      const cy = parseFloat(attrs.cy || String(ry));
      x = cx - rx;
      y = cy - ry;
      width = rx * 2;
      height = ry * 2;
      cornerRadius = 9999;
    } else if (tag === 'line') {
      type = 'line';
      const x1 = parseFloat(attrs.x1 || '0');
      const y1 = parseFloat(attrs.y1 || '0');
      const x2 = parseFloat(attrs.x2 || '100');
      const y2 = parseFloat(attrs.y2 || '0');
      x = Math.min(x1, x2);
      y = Math.min(y1, y2);
      width = Math.max(1, Math.abs(x2 - x1));
      height = Math.max(1, Math.abs(y2 - y1));
    } else if (tag === 'path') {
      type = 'vector';
      vectorData = attrs.d || '';
      // Approximate bounding box from path if possible
      width = 120;
      height = 120;
    } else if (tag === 'text') {
      type = 'text';
      const content = innerContent.replace(/<[^>]*>/g, '').trim() || 'Text';
      textData = {
        content,
        fontFamily: attrs['font-family'] || 'Inter, sans-serif',
        fontSize: parseFloat(attrs['font-size'] || '16'),
        fontWeight: attrs['font-weight'] || '400',
        color: attrs.fill || '#f8fafc',
        textAlign: 'left'
      };
      width = Math.max(80, content.length * 9);
      height = 28;
    }

    const fills = [];
    const rawFill = attrs.fill || 'currentColor';
    if (rawFill !== 'none' && rawFill !== 'transparent') {
      fills.push({
        type: 'solid',
        color: rawFill === 'currentColor' ? '#38bdf8' : rawFill,
        opacity: parseFloat(attrs['fill-opacity'] || attrs.opacity || '1')
      });
    }

    const strokes = [];
    if (attrs.stroke && attrs.stroke !== 'none') {
      strokes.push({
        color: attrs.stroke,
        width: parseFloat(attrs['stroke-width'] || '1'),
        align: 'center',
        style: attrs['stroke-dasharray'] ? 'dashed' : 'solid'
      });
    }

    return createCIRNode(type, {
      name: attrs.id || `${tag.charAt(0).toUpperCase() + tag.slice(1)} ${index}`,
      parentId,
      transform: {
        x: Math.round(x),
        y: Math.round(y),
        width: Math.max(1, Math.round(width)),
        height: Math.max(1, Math.round(height))
      },
      style: {
        fills: fills.length > 0 ? fills : (type === 'line' ? [] : [{ type: 'solid', color: '#64748b', opacity: 1 }]),
        strokes,
        cornerRadius
      },
      text: textData,
      vectorData
    });
  }
}
