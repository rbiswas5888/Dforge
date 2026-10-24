/**
 * DesignForge AI — External Design Import Engine
 * Import Manager Pipeline (Stages 1 through 7)
 * Conforms to Sections 6 & 16 of MD/Design.md Specification
 */

import { IMPORT_MODES, SOURCE_CAPABILITY_REGISTRY } from './types.js';
import { SketchImportAdapter } from './sketch_adapter.js';
import { FigmaImportAdapter } from './figma_adapter.js';
import { SvgImportAdapter } from './svg_adapter.js';
import { ImportFidelityEngine } from './fidelity_reporter.js';
import { createNode, createDefaultTokens, SCHEMA_VERSION } from '../document.js';

export class ImportManager {
  constructor(app = null) {
    this.app = app;
    this.adapters = [
      new SketchImportAdapter(),
      new FigmaImportAdapter(),
      new SvgImportAdapter()
    ];
    this.fidelityEngine = new ImportFidelityEngine();
  }

  /**
   * Stage 1: Detect source format from raw input and filename
   */
  detectFormat(input, fileName = '') {
    const ext = fileName ? fileName.slice(fileName.lastIndexOf('.')).toLowerCase() : '';

    if (ext === '.sketch' || ext === '.sketch.json') return 'sketch';
    if (ext === '.fig' || ext === '.figma.json') return 'figma';
    if (ext === '.svg') return 'svg';
    if (ext === '.xd' || ext === '.xd.json') return 'xd';
    if (ext === '.dforge') return 'dforge';

    if (typeof input === 'string') {
      const trimmed = input.trim();
      if (trimmed.startsWith('<svg') || trimmed.includes('<svg')) return 'svg';
      try {
        const parsed = JSON.parse(trimmed);
        return this.detectJsonFormat(parsed);
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
    return 'unknown';
  }

  /**
   * Stage 2: Capability check
   */
  getCapabilityInfo(formatKey) {
    return SOURCE_CAPABILITY_REGISTRY[formatKey] || {
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
      throw new Error(`Unsupported or unrecognized design format "${detectedFormat}". Supported: Sketch (.sketch), Figma JSON (.fig), SVG (.svg), and .dforge.`);
    }

    // Stage 3 & 4: Source Parsing & CIR Normalization
    let parsedInput = rawInput;
    if (typeof rawInput === 'string' && detectedFormat !== 'svg') {
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
        originalFileName: cirDoc.metadata?.originalFileName || 'imported_file'
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
