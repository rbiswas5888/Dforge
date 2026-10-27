/**
 * DesignForge AI — External Design Import Engine
 * Import Manager Pipeline (Stages 1 through 7)
 * Conforms to Sections 6 & 16 of MD/Design.md Specification
 */

import { IMPORT_MODES, SOURCE_CAPABILITY_REGISTRY } from './types.js';
import { SketchImportAdapter } from './sketch_adapter.js';
import { FigmaImportAdapter } from './figma_adapter.js';
import { SvgImportAdapter } from './svg_adapter.js';
import { ReactSourceImportAdapter } from './react_adapter.js';
import { readSketchArchive } from './sketch_archive.js';
import { ImportFidelityEngine } from './fidelity_reporter.js';
import { createNode, createDefaultTokens, SCHEMA_VERSION } from '../document.js';

export class ImportManager {
  constructor(app = null) {
    this.app = app;
    this.adapters = [
      new SketchImportAdapter(),
      new FigmaImportAdapter(),
      new SvgImportAdapter(),
      new ReactSourceImportAdapter()
    ];
    this.fidelityEngine = new ImportFidelityEngine();
  }

  /**
   * Stage 1: Detect source format from raw input and filename
   */
  detectFormat(input, fileName = '') {
    const name = fileName.toLowerCase();

    if (name.endsWith('.sketch.json') || name.endsWith('.sketch')) return 'sketch';
    if (name.endsWith('.figma.json')) return 'figma';
    if (name.endsWith('.fig')) return 'fig-binary';
    if (name.endsWith('.jam')) return 'figjam-binary';
    if (name.endsWith('.deck')) return 'figma-slides-binary';
    if (name.endsWith('.buzz')) return 'figma-buzz-binary';
    if (name.endsWith('.site')) return 'figma-sites-binary';
    if (name.endsWith('.make')) return 'figma-make-binary';
    if (name.endsWith('.xd.json')) return 'xd-json';
    if (name.endsWith('.xd')) return 'xd-binary';
    if (name.endsWith('.svg')) return 'svg';
    if (name.endsWith('.dforge')) return 'dforge';
    if (/\.(?:jsx?|tsx?)$/.test(name)) return 'react';

    if (typeof input === 'string') {
      const trimmed = input.trim();
      if (trimmed.startsWith('<svg') || trimmed.includes('<svg')) return 'svg';
      try {
        const parsed = JSON.parse(trimmed);
        const format = this.detectJsonFormat(parsed);
        return format === 'unknown' && /(?:react|jsx|tsx)/i.test(trimmed) ? 'react' : format;
      } catch (e) {
        // Not JSON
      }
    } else if (typeof input === 'object' && input !== null) {
      return this.detectJsonFormat(input);
    }

    return 'unknown';
  }

  detectJsonFormat(obj) {
    if (obj.schemaVersion && obj.pages && obj.tokens) return 'dforge';
    if (obj._class === 'document' || obj._class === 'page') return 'sketch';
    if (obj.document && obj.document.type === 'DOCUMENT') return 'figma';
    if (obj.type === 'CANVAS' || (obj.nodes && typeof obj.nodes === 'object')) return 'figma';
    const hasDtcgValue = (value, depth = 0) => {
      if (!value || typeof value !== 'object' || depth > 12) return false;
      if (Object.prototype.hasOwnProperty.call(value, '$value')) return true;
      return Object.values(value).some(child => hasDtcgValue(child, depth + 1));
    };
    if (hasDtcgValue(obj) || ['colors', 'spacing', 'typography'].some(key => obj[key])) return 'tokens';
    return 'unknown';
  }

  /**
   * Stage 2: Capability check
   */
  getCapabilityInfo(formatKey) {
    const formatAliases = {
      'fig-binary': 'figma',
      'figjam-binary': 'figjam',
      'figma-slides-binary': 'figmaSlides',
      'figma-buzz-binary': 'figmaBuzz',
      'figma-sites-binary': 'figmaSites',
      'figma-make-binary': 'figmaMake',
      'xd-binary': 'xd'
    };
    return SOURCE_CAPABILITY_REGISTRY[formatAliases[formatKey] || formatKey] || {
      name: 'Generic / Unknown Format',
      feasibility: 'Experimental',
      capabilities: {},
      limitations: ['Unknown format structure']
    };
  }

  /**
   * Executes the full import pipeline (Stages 1-7)
   */
  async processImport(rawInput, options = {}) {
    const fileName = options.fileName || 'untitled';
    const detectedFormat = options.format || this.detectFormat(rawInput, fileName);

    const binaryFormatHelp = {
      'fig-binary': 'Figma .fig files are binary. Export the file as Figma REST/API JSON (.figma.json) to import its editable layers.',
      'figjam-binary': 'FigJam .jam files are binary and are not currently decoded. Export the board as SVG or supported JSON.',
      'figma-slides-binary': 'Figma Slides .deck files are binary and are not currently decoded. Export slide content as supported JSON or SVG.',
      'figma-buzz-binary': 'Figma Buzz .buzz files are binary and are not currently decoded. Export supported JSON or SVG.',
      'figma-sites-binary': 'Figma Sites .site files are binary and are not currently decoded. Export supported JSON or SVG.',
      'figma-make-binary': 'Figma Make .make files are binary and are not currently decoded. Export supported JSON or SVG.',
      'xd-binary': 'Adobe XD .xd files are binary and are not currently decoded. Export a supported JSON or SVG interchange file.',
      'xd-json': 'Adobe XD JSON interchange is not supported yet. Export the design as SVG or a supported Sketch/Figma JSON interchange file.',
      tokens: 'This file contains design tokens, not a canvas design. Import it from Design System → Import System to add its tokens to the registry.'
    };
    if (binaryFormatHelp[detectedFormat]) throw new Error(binaryFormatHelp[detectedFormat]);

    // If native .dforge project file, parse directly
    if (detectedFormat === 'dforge') {
      const dforgeDoc = typeof rawInput === 'string' ? JSON.parse(rawInput) : rawInput;
      const cirMock = {
        sourceApplication: 'dforge',
        projectName: dforgeDoc.name || 'DesignForge Project',
        pages: dforgeDoc.pages,
        components: {},
        tokens: dforgeDoc.tokens || []
      };
      const report = this.fidelityEngine.generateReport(cirMock, dforgeDoc);
      return {
        success: true,
        format: 'dforge',
        document: dforgeDoc,
        fidelityReport: report
      };
    }

    // Match adapter
    const adapter = this.adapters.find(a => a.name === detectedFormat) ||
                    this.adapters.find(a => a.canParse(rawInput));

    if (!adapter) {
      throw new Error(`Unsupported or unrecognized design format "${detectedFormat}". Supported imports: Sketch (.sketch/.sketch.json), Figma interchange JSON (.figma.json), SVG, React JSX/TSX, and .dforge.`);
    }

    // Stage 3 & 4: Source Parsing & CIR Normalization
    let parsedInput = rawInput;
    if (detectedFormat === 'sketch' && (rawInput instanceof ArrayBuffer || rawInput instanceof Uint8Array)) {
      parsedInput = await readSketchArchive(rawInput);
    }
    if (typeof rawInput === 'string' && !['svg', 'react'].includes(detectedFormat)) {
      try {
        parsedInput = JSON.parse(rawInput);
      } catch (e) {
        throw new Error(`Failed to parse ${detectedFormat.toUpperCase()} input: invalid JSON structure.`);
      }
    }

    const cirDoc = adapter.parse(parsedInput, { fileName, ...options });

    // Stage 5: DesignForge Document Generation
    const dforgeDoc = this.cirToDesignForgeDocument(cirDoc);

    // Stage 6: Validation & Normalization
    this.validateAndNormalizeDocument(dforgeDoc);

    // Stage 7: Import Fidelity Report
    const fidelityReport = this.fidelityEngine.generateReport(cirDoc, dforgeDoc);

    return {
      success: true,
      format: detectedFormat,
      cir: cirDoc,
      document: dforgeDoc,
      fidelityReport
    };
  }

  /**
   * Converts Canonical Intermediate Representation (CIR) into DesignForge Document
   */
  cirToDesignForgeDocument(cirDoc) {
    const doc = {
      schemaVersion: SCHEMA_VERSION,
      name: cirDoc.projectName || 'Imported Design',
      tokens: cirDoc.tokens && cirDoc.tokens.length > 0 ? cirDoc.tokens : createDefaultTokens(),
      pages: [],
      metadata: {
        importedFrom: cirDoc.sourceApplication,
        importedAt: new Date().toISOString(),
        originalFileName: cirDoc.metadata?.originalFileName || 'imported_file',
        importWarnings: cirDoc.metadata?.warnings || []
      }
    };

    for (const cirPage of cirDoc.pages) {
      const page = {
        id: cirPage.id,
        name: cirPage.name || 'Imported Page',
        route: `/${cirPage.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        rootIds: [...cirPage.rootNodeIds],
        nodes: {}
      };

      for (const [nodeId, cirNode] of Object.entries(cirPage.nodes)) {
        const dNode = createNode(cirNode.type, {
          id: cirNode.id,
          name: cirNode.name,
          parentId: cirNode.parentId,
          childIds: [...cirNode.childIds],
          visible: cirNode.visible,
          locked: cirNode.locked,
          opacity: cirNode.opacity,
          transform: { ...cirNode.transform },
          layout: { ...cirNode.layout },
          style: { ...cirNode.style },
          text: cirNode.text ? { ...cirNode.text } : null,
          semanticTag: cirNode.semanticTag,
          accessibilityLabel: cirNode.accessibilityLabel,
          interactions: cirNode.interactions || [],
          tokenBindings: cirNode.tokenBindings || {},
          metadata: {
            sourceId: cirNode.sourceId,
            sourceApp: cirDoc.sourceApplication
          }
        });

        if (cirNode.vectorData) {
          dNode.vectorData = cirNode.vectorData;
        }

        page.nodes[nodeId] = dNode;
      }

      // If no root frames were flagged, designate top-level nodes as roots
      if (page.rootIds.length === 0) {
        for (const [nodeId, node] of Object.entries(page.nodes)) {
          if (!node.parentId) {
            page.rootIds.push(nodeId);
          }
        }
      }

      doc.pages.push(page);
    }

    if (doc.pages.length === 0) {
      doc.pages.push({
        id: 'page_main',
        name: 'Canvas 1',
        route: '/',
        rootIds: [],
        nodes: {}
      });
    }

    return doc;
  }

  /**
   * Validates parent-child relationships and transforms
   */
  validateAndNormalizeDocument(doc) {
    for (const page of doc.pages) {
      for (const [nodeId, node] of Object.entries(page.nodes)) {
        // Ensure childIds only reference existing nodes
        node.childIds = node.childIds.filter(cid => page.nodes[cid]);

        // Ensure parentId is valid
        if (node.parentId && !page.nodes[node.parentId]) {
          node.parentId = null;
          if (!page.rootIds.includes(nodeId)) {
            page.rootIds.push(nodeId);
          }
        }
      }
    }
  }
}
