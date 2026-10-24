/**
 * DesignForge AI — External Design Import Engine
 * Sketch Format Adapter (.sketch / JSON interchange)
 * Conforms to Section 4.2 of MD/Design.md Specification
 */

import { createCIRDocument, createCIRPage, createCIRNode } from './types.js';

export class SketchImportAdapter {
  constructor() {
    this.name = 'sketch';
  }

  /**
   * Can parse Sketch JSON export or extracted .sketch document bundle
   */
  canParse(data) {
    if (!data) return false;
    if (typeof data === 'object') {
      return data._class === 'document' ||
             data._class === 'page' ||
             Array.isArray(data.pages) ||
             (data.document && data.document._class === 'document');
    }
    return false;
  }

  /**
   * Parses Sketch data into Canonical Intermediate Representation (CIR)
   */
  parse(sourceData, options = {}) {
    const cir = createCIRDocument({
      sourceApplication: 'sketch',
      sourceFormatVersion: sourceData.version || 'Sketch v95+',
      projectName: options.fileName?.replace(/\.sketch$/i, '') || 'Imported Sketch Project',
      originalFileName: options.fileName || 'design.sketch'
    });

    // Extract pages from document bundle or single page
    let rawPages = [];
    if (sourceData.pages && Array.isArray(sourceData.pages)) {
      rawPages = sourceData.pages;
    } else if (sourceData._class === 'page') {
      rawPages = [sourceData];
    } else if (sourceData.document && sourceData.document.pages) {
      rawPages = sourceData.document.pages;
    } else {
      rawPages = [{ name: 'Page 1', layers: sourceData.layers || [] }];
    }

    // Convert each Sketch page to CIR page
    for (const rawPage of rawPages) {
      const pageName = rawPage.name || `Page ${cir.pages.length + 1}`;
      const cirPage = createCIRPage(pageName);

      if (rawPage.layers && Array.isArray(rawPage.layers)) {
        for (const layer of rawPage.layers) {
          const rootNode = this.convertLayer(layer, null, cirPage, cir);
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
   * Recursively converts a Sketch layer into CIR node
   */
  convertLayer(layer, parentId, cirPage, cir) {
    if (!layer || layer.isVisible === false) {
      // In structure-preserving mode, preserve hidden layers with visible=false
    }

    const sketchClass = layer._class || 'layer';
    let nodeType = 'rectangle';

    if (sketchClass === 'artboard') {
      nodeType = 'frame';
    } else if (sketchClass === 'group') {
      nodeType = 'group';
    } else if (sketchClass === 'oval') {
      nodeType = 'ellipse';
    } else if (sketchClass === 'rectangle') {
      nodeType = 'rectangle';
    } else if (sketchClass === 'text') {
      nodeType = 'text';
    } else if (sketchClass === 'shapePath' || sketchClass === 'shapeGroup') {
      nodeType = 'vector';
    } else if (sketchClass === 'bitmap') {
      nodeType = 'image';
    } else if (sketchClass === 'symbolMaster') {
      nodeType = 'component';
    } else if (sketchClass === 'symbolInstance') {
      nodeType = 'instance';
    }

    // Geometry normalization
    const f = layer.frame || { x: 0, y: 0, width: 100, height: 100 };
    const transform = {
      x: Math.round(f.x || 0),
      y: Math.round(f.y || 0),
      width: Math.max(1, Math.round(f.width || 100)),
      height: Math.max(1, Math.round(f.height || 100)),
      rotation: layer.rotation || 0
    };

    // Styling normalization
    const fills = [];
    const strokes = [];
    const shadows = [];
    let cornerRadius = 0;

    // Corner radius
    if (layer.fixedRadius !== undefined) {
      cornerRadius = layer.fixedRadius;
    } else if (layer.cornerRadius !== undefined) {
      cornerRadius = layer.cornerRadius;
    } else if (layer.points && layer.points[0]?.cornerRadius) {
      cornerRadius = layer.points[0].cornerRadius;
    }

    // Artboard background fill
    if (sketchClass === 'artboard' && layer.hasBackgroundColor && layer.backgroundColor) {
      fills.push({
        type: 'solid',
        color: this.convertSketchColor(layer.backgroundColor),
        opacity: layer.backgroundColor.alpha ?? 1
      });
    }

    // Layer style fills & strokes
    if (layer.style) {
      if (layer.style.fills && Array.isArray(layer.style.fills)) {
        for (const fill of layer.style.fills) {
          if (fill.isEnabled !== false) {
            if (fill.fillType === 0 && fill.color) { // Solid
              fills.push({
                type: 'solid',
                color: this.convertSketchColor(fill.color),
                opacity: fill.color.alpha ?? 1
              });
            } else if (fill.fillType === 1 && fill.gradient) { // Linear gradient
              const stops = (fill.gradient.stops || []).map(s => ({
                offset: s.position,
                color: this.convertSketchColor(s.color)
              }));
              fills.push({
                type: 'linear-gradient',
                stops: stops.length > 0 ? stops : [{ offset: 0, color: '#3b82f6' }, { offset: 1, color: '#8b5cf6' }]
              });
            }
          }
        }
      }

      if (layer.style.borders && Array.isArray(layer.style.borders)) {
        for (const border of layer.style.borders) {
          if (border.isEnabled !== false && border.color) {
            strokes.push({
              color: this.convertSketchColor(border.color),
              width: border.thickness || 1,
              align: border.position === 1 ? 'inside' : border.position === 2 ? 'outside' : 'center',
              style: 'solid'
            });
          }
        }
      }

      if (layer.style.shadows && Array.isArray(layer.style.shadows)) {
        for (const shadow of layer.style.shadows) {
          if (shadow.isEnabled !== false) {
            shadows.push({
              x: shadow.offsetX || 0,
              y: shadow.offsetY || 4,
              blur: shadow.blurRadius || 8,
              color: this.convertSketchColor(shadow.color)
            });
          }
        }
      }
    }

    // Default fill if empty for shape/artboard
    if (fills.length === 0 && (nodeType === 'frame' || nodeType === 'rectangle' || nodeType === 'ellipse')) {
      fills.push({
        type: 'solid',
        color: nodeType === 'frame' ? '#0f172a' : '#334155',
        opacity: 1
      });
    }

    // Text properties
    let textData = null;
    if (nodeType === 'text') {
      const rawText = layer.attributedString?.string || layer.text || layer.name || 'Text';
      const fontAttrs = layer.style?.textStyle?.encodedAttributes?.MSAttributedStringFontAttribute?.attributes || {};
      const colorAttr = layer.style?.textStyle?.encodedAttributes?.MSAttributedStringColorAttribute || {};

      textData = {
        content: rawText,
        fontFamily: fontAttrs.name || 'Inter, -apple-system, sans-serif',
        fontSize: fontAttrs.size || 16,
        fontWeight: fontAttrs.name?.includes('Bold') ? '700' : '400',
        color: colorAttr.red !== undefined ? this.convertSketchColor(colorAttr) : '#f8fafc',
        textAlign: 'left'
      };
    }

    const cirNode = createCIRNode(nodeType, {
      sourceId: layer.do_objectID || layer.id,
      name: layer.name || `${nodeType}`,
      parentId,
      visible: layer.isVisible !== false,
      locked: layer.isLocked === true,
      opacity: layer.style?.contextSettings?.opacity ?? 1,
      transform,
      style: {
        fills,
        strokes,
        shadows,
        cornerRadius
      },
      text: textData
    });

    // Record components
    if (sketchClass === 'symbolMaster') {
      cir.components[cirNode.id] = {
        id: cirNode.id,
        name: cirNode.name,
        symbolID: layer.symbolID || cirNode.id
      };
    } else if (sketchClass === 'symbolInstance') {
      cirNode.componentRef = layer.symbolID || null;
    }

    cirPage.nodes[cirNode.id] = cirNode;

    // Recursively process child layers
    if (layer.layers && Array.isArray(layer.layers)) {
      for (const childLayer of layer.layers) {
        const childNode = this.convertLayer(childLayer, cirNode.id, cirPage, cir);
        if (childNode) {
          cirNode.childIds.push(childNode.id);
        }
      }
    }

    return cirNode;
  }

  /**
   * Helper: converts Sketch RGBA color object {red: 0..1, green: 0..1, blue: 0..1, alpha: 0..1}
   * to hex or rgba() string
   */
  convertSketchColor(color) {
    if (!color) return '#000000';
    const r = Math.round((color.red ?? 0) * 255);
    const g = Math.round((color.green ?? 0) * 255);
    const b = Math.round((color.blue ?? 0) * 255);
    const a = color.alpha ?? 1;

    if (a < 1) {
      return `rgba(${r}, ${g}, ${b}, ${Math.round(a * 100) / 100})`;
    }
    const toHex = (n) => n.toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }
}
