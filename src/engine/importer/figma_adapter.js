/**
 * DesignForge AI — External Design Import Engine
 * Figma Format Adapter (Figma REST JSON / Schema Interchange)
 * Conforms to Section 4.1 of MD/Design.md Specification
 */

import { createCIRDocument, createCIRPage, createCIRNode } from './types.js';

export class FigmaImportAdapter {
  constructor() {
    this.name = 'figma';
  }

  /**
   * Can parse Figma JSON format
   */
  canParse(data) {
    if (!data) return false;
    if (typeof data === 'object') {
      return (data.document && data.document.type === 'DOCUMENT') ||
             data.type === 'CANVAS' ||
             data.type === 'FRAME' ||
             (data.nodes && typeof data.nodes === 'object');
    }
    return false;
  }

  /**
   * Parses Figma JSON data into Canonical Intermediate Representation (CIR)
   */
  parse(sourceData, options = {}) {
    const cir = createCIRDocument({
      sourceApplication: 'figma',
      sourceFormatVersion: sourceData.schemaVersion || 'Figma UI3 (2026)',
      projectName: sourceData.name || options.fileName?.replace(/\.(fig|json)$/i, '') || 'Imported Figma Project',
      originalFileName: options.fileName || 'figma_project.json'
    });

    // Extract pages (Figma CANVAS nodes)
    let canvases = [];
    if (sourceData.document && sourceData.document.children) {
      canvases = sourceData.document.children.filter(c => c.type === 'CANVAS');
    } else if (sourceData.type === 'CANVAS') {
      canvases = [sourceData];
    } else if (sourceData.nodes) {
      // Figma API Get File Nodes response { nodes: { "1:2": { document: { ... } } } }
      for (const key of Object.keys(sourceData.nodes)) {
        const item = sourceData.nodes[key];
        if (item.document) canvases.push(item.document);
      }
    } else {
      canvases = [{ name: 'Page 1', children: [sourceData] }];
    }

    if (canvases.length === 0) {
      canvases = [{ name: 'Page 1', children: [] }];
    }

    for (const canvas of canvases) {
      const pageName = canvas.name || `Page ${cir.pages.length + 1}`;
      const cirPage = createCIRPage(pageName, canvas.id);

      if (canvas.children && Array.isArray(canvas.children)) {
        for (const child of canvas.children) {
          const rootNode = this.convertFigmaNode(child, null, cirPage, cir);
          if (rootNode) {
            cirPage.rootNodeIds.push(rootNode.id);
          }
        }
      }

      cir.pages.push(cirPage);
    }

    return cir;
  }

  /**
   * Recursively converts a Figma node into CIR node
   */
  convertFigmaNode(fNode, parentId, cirPage, cir) {
    if (!fNode) return null;

    let nodeType = 'rectangle';
    const fType = fNode.type;

    if (fType === 'FRAME' || fType === 'SECTION') {
      nodeType = 'frame';
    } else if (fType === 'GROUP') {
      nodeType = 'group';
    } else if (fType === 'RECTANGLE') {
      nodeType = 'rectangle';
    } else if (fType === 'ELLIPSE') {
      nodeType = 'ellipse';
    } else if (fType === 'LINE') {
      nodeType = 'line';
    } else if (fType === 'STAR') {
      nodeType = 'star';
    } else if (fType === 'REGULAR_POLYGON') {
      nodeType = 'polygon';
    } else if (fType === 'TEXT') {
      nodeType = 'text';
    } else if (fType === 'VECTOR' || fType === 'BOOLEAN_OPERATION') {
      nodeType = 'vector';
    } else if (fType === 'COMPONENT' || fType === 'COMPONENT_SET') {
      nodeType = 'component';
    } else if (fType === 'INSTANCE') {
      nodeType = 'instance';
    }

    // Geometry & bounding box
    const bbox = fNode.absoluteBoundingBox || { x: 0, y: 0, width: 100, height: 100 };
    const transform = {
      x: Math.round(bbox.x || 0),
      y: Math.round(bbox.y || 0),
      width: Math.max(1, Math.round(bbox.width || 100)),
      height: Math.max(1, Math.round(bbox.height || 100)),
      rotation: fNode.rotation ? Math.round((fNode.rotation * 180) / Math.PI) : 0
    };

    // Auto-layout mapping
    const layout = {
      mode: 'none',
      paddingTop: fNode.paddingTop || fNode.verticalPadding || 0,
      paddingRight: fNode.paddingRight || fNode.horizontalPadding || 0,
      paddingBottom: fNode.paddingBottom || fNode.verticalPadding || 0,
      paddingLeft: fNode.paddingLeft || fNode.horizontalPadding || 0,
      gap: fNode.itemSpacing || 0,
      alignItems: fNode.counterAxisAlignItems === 'CENTER' ? 'center' : fNode.counterAxisAlignItems === 'MAX' ? 'end' : 'start',
      justifyContent: fNode.primaryAxisAlignItems === 'CENTER' ? 'center' : fNode.primaryAxisAlignItems === 'SPACE_BETWEEN' ? 'space-between' : 'start',
      sizingHorizontal: fNode.layoutSizingHorizontal === 'FILL' ? 'fill' : fNode.layoutSizingHorizontal === 'HUG' ? 'hug' : 'fixed',
      sizingVertical: fNode.layoutSizingVertical === 'FILL' ? 'fill' : fNode.layoutSizingVertical === 'HUG' ? 'hug' : 'fixed'
    };

    if (fNode.layoutMode === 'HORIZONTAL') {
      layout.mode = 'stack-horizontal';
    } else if (fNode.layoutMode === 'VERTICAL') {
      layout.mode = 'stack-vertical';
    }

    // Styling
    const fills = [];
    const strokes = [];
    const shadows = [];
    const cornerRadius = fNode.cornerRadius || 0;

    if (fNode.fills && Array.isArray(fNode.fills)) {
      for (const fill of fNode.fills) {
        if (fill.visible !== false) {
          if (fill.type === 'SOLID' && fill.color) {
            fills.push({
              type: 'solid',
              color: this.convertFigmaColor(fill.color, fill.opacity),
              opacity: fill.opacity ?? 1
            });
          } else if (fill.type === 'GRADIENT_LINEAR' && fill.gradientStops) {
            const stops = fill.gradientStops.map(s => ({
              offset: s.position,
              color: this.convertFigmaColor(s.color)
            }));
            fills.push({
              type: 'linear-gradient',
              stops: stops.length > 0 ? stops : [{ offset: 0, color: '#3b82f6' }, { offset: 1, color: '#8b5cf6' }]
            });
          } else if (fill.type === 'IMAGE') {
            fills.push({
              type: 'image',
              url: fill.imageRef ? `image_ref://${fill.imageRef}` : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
              opacity: fill.opacity ?? 1
            });
          }
        }
      }
    }

    if (fNode.strokes && Array.isArray(fNode.strokes)) {
      for (const stroke of fNode.strokes) {
        if (stroke.visible !== false && stroke.color) {
          strokes.push({
            color: this.convertFigmaColor(stroke.color, stroke.opacity),
            width: fNode.strokeWeight || 1,
            align: fNode.strokeAlign ? fNode.strokeAlign.toLowerCase() : 'center',
            style: fNode.strokeDashes ? 'dashed' : 'solid'
          });
        }
      }
    }

    if (fNode.effects && Array.isArray(fNode.effects)) {
      for (const eff of fNode.effects) {
        if (eff.visible !== false && (eff.type === 'DROP_SHADOW' || eff.type === 'INNER_SHADOW')) {
          shadows.push({
            x: eff.offset?.x || 0,
            y: eff.offset?.y || 4,
            blur: eff.radius || 8,
            color: this.convertFigmaColor(eff.color)
          });
        }
      }
    }

    // Default fill for frames / shapes if none provided
    if (fills.length === 0 && (nodeType === 'frame' || nodeType === 'rectangle' || nodeType === 'ellipse')) {
      fills.push({
        type: 'solid',
        color: nodeType === 'frame' ? '#0f172a' : '#334155',
        opacity: 1
      });
    }

    // Text parsing
    let textData = null;
    if (nodeType === 'text') {
      const fontStyle = fNode.style || {};
      textData = {
        content: fNode.characters || fNode.name || 'Text',
        fontFamily: fontStyle.fontFamily || 'Inter, -apple-system, sans-serif',
        fontSize: fontStyle.fontSize || 16,
        fontWeight: fontStyle.fontWeight ? String(fontStyle.fontWeight) : '400',
        lineHeight: fontStyle.lineHeightPx ? Math.round((fontStyle.lineHeightPx / (fontStyle.fontSize || 16)) * 10) / 10 : 1.4,
        letterSpacing: fontStyle.letterSpacing || 0,
        textAlign: fontStyle.textAlignHorizontal ? fontStyle.textAlignHorizontal.toLowerCase() : 'left',
        color: fills[0]?.color || '#f8fafc'
      };
    }

    // Prototype interactions
    const interactions = [];
    if (fNode.transitionNodeID) {
      interactions.push({
        trigger: 'click',
        action: 'navigate',
        targetId: fNode.transitionNodeID,
        animation: fNode.transitionDuration ? 'slide-left' : 'instant',
        duration: fNode.transitionDuration || 200
      });
    }

    const cirNode = createCIRNode(nodeType, {
      sourceId: fNode.id,
      name: fNode.name || `${nodeType}`,
      parentId,
      visible: fNode.visible !== false,
      locked: fNode.locked === true,
      opacity: fNode.opacity ?? 1,
      transform,
      layout,
      style: {
        fills,
        strokes,
        shadows,
        cornerRadius
      },
      text: textData,
      interactions
    });

    if (fType === 'COMPONENT' || fType === 'COMPONENT_SET') {
      cir.components[cirNode.id] = {
        id: cirNode.id,
        name: cirNode.name,
        key: fNode.componentId || cirNode.id
      };
    } else if (fType === 'INSTANCE') {
      cirNode.componentRef = fNode.componentId || null;
    }

    cirPage.nodes[cirNode.id] = cirNode;

    // Recursively process child nodes
    if (fNode.children && Array.isArray(fNode.children)) {
      for (const child of fNode.children) {
        const childNode = this.convertFigmaNode(child, cirNode.id, cirPage, cir);
        if (childNode) {
          cirNode.childIds.push(childNode.id);
        }
      }
    }

    return cirNode;
  }

  /**
   * Helper: converts Figma color {r: 0..1, g: 0..1, b: 0..1, a: 0..1} to hex or rgba()
   */
  convertFigmaColor(color, overrideAlpha = null) {
    if (!color) return '#000000';
    const r = Math.round((color.r ?? 0) * 255);
    const g = Math.round((color.g ?? 0) * 255);
    const b = Math.round((color.b ?? 0) * 255);
    const a = overrideAlpha !== null ? overrideAlpha : (color.a ?? 1);

    if (a < 1) {
      return `rgba(${r}, ${g}, ${b}, ${Math.round(a * 100) / 100})`;
    }
    const toHex = (n) => n.toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }
}
