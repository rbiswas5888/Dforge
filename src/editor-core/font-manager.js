/**
 * DesignForge AI — Font Management & System Typography Detection Engine
 * 
 * Capabilities:
 * - Reads and enumerates all local typography installed on the system (via Local Font Access API + Canvas probing)
 * - Detects missing fonts across documents and text layers (matching Figma's missing fonts workflow)
 * - Provides interactive missing font replacement with atomic undo/redo transactions
 * - Supports skip / keep missing options so users can preserve original font family names
 * - Integrates with Typography inspector panel and standalone Missing Fonts dialog
 */

export const SYSTEM_FONTS_CATALOG = [
  // macOS / iOS System Fonts
  'SF Pro',
  'SF Pro Display',
  'SF Pro Text',
  'San Francisco',
  'Helvetica Neue',
  'Helvetica',
  'Arial',
  'Arial Black',
  'Avenir',
  'Avenir Next',
  'Futura',
  'Optima',
  'Gill Sans',
  'Baskerville',
  'Didot',
  'Palatino',
  'Times New Roman',
  'Times',
  'Monaco',
  'Menlo',
  'Courier New',
  'Courier',
  'Apple Color Emoji',

  // Windows System Fonts
  'Segoe UI',
  'Calibri',
  'Cambria',
  'Candara',
  'Consolas',
  'Constantia',
  'Corbel',
  'Franklin Gothic Medium',
  'Comic Sans MS',
  'Impact',
  'Georgia',
  'Tahoma',
  'Trebuchet MS',
  'Verdana',
  'Microsoft Sans Serif',

  // Linux / Cross-Platform Fonts
  'Ubuntu',
  'Cantarell',
  'DejaVu Sans',
  'Liberation Sans',
  'FreeSans',
  'Noto Sans',
  'Droid Sans'
];

export const WEB_FONTS_CATALOG = [
  'Inter',
  'Outfit',
  'Roboto',
  'Plus Jakarta Sans',
  'Poppins',
  'Montserrat',
  'Open Sans',
  'Lato',
  'Raleway',
  'JetBrains Mono',
  'Fira Code',
  'Source Code Pro',
  'Playfair Display',
  'Merriweather',
  'DM Sans',
  'Geist'
];

export class FontManager {
  constructor(options = {}) {
    this.installedFonts = new Set();
    this.webFonts = new Set(WEB_FONTS_CATALOG);
    this.skippedFonts = new Set();
    this.testMocks = new Map(); // For unit tests: fontName -> boolean
    this.hasScannedSystem = false;
    this.canvasProbeCtx = null;

    // Pre-populate with standard safe fonts
    this.prepopulateSafeFonts();

    // Run background probe if in browser
    if (typeof window !== 'undefined') {
      this.initBrowserProbing();
    }
  }

  prepopulateSafeFonts() {
    // Add default fallbacks that are virtually universal
    ['Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana', 'Inter', 'Roboto'].forEach(f => {
      this.installedFonts.add(f);
    });
  }

  initBrowserProbing() {
    // Run an initial quick canvas probe of the standard catalog
    try {
      this.detectInstalledFontsSync();
    } catch (e) {
      // Ignore in non-DOM or restricted environments
    }
  }

  /**
   * Cleans a font family string, stripping quotes and fallback lists
   * e.g. "'Outfit', sans-serif" -> "Outfit"
   * e.g. "Inter, -apple-system, sans-serif" -> "Inter"
   */
  static cleanFontFamily(rawFamily) {
    if (!rawFamily || typeof rawFamily !== 'string') return 'Inter';
    const firstPart = rawFamily.split(',')[0].trim();
    return firstPart.replace(/^['"]+|['"]+$/g, '').trim();
  }

  cleanFontFamily(rawFamily) {
    return FontManager.cleanFontFamily(rawFamily);
  }

  /**
   * Lazily initializes a 2D canvas context for text metrics probing
   */
  getCanvasProbeContext() {
    if (this.canvasProbeCtx) return this.canvasProbeCtx;
    if (typeof document !== 'undefined') {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        this.canvasProbeCtx = canvas.getContext('2d');
      } catch (e) {
        this.canvasProbeCtx = null;
      }
    }
    return this.canvasProbeCtx;
  }

  /**
   * Checks whether a specific font family is installed or available
   */
  isFontAvailable(fontFamily) {
    if (!fontFamily) return true;
    const clean = this.cleanFontFamily(fontFamily);

    // 1. Check unit test mocks if registered
    if (this.testMocks.has(clean)) {
      return Boolean(this.testMocks.get(clean));
    }

    // 2. Check cached installed or web fonts
    if (this.installedFonts.has(clean) || this.webFonts.has(clean)) {
      return true;
    }

    // 3. In browser environment, perform canvas probing and document.fonts.check
    if (typeof document !== 'undefined') {
      // First check document.fonts if available
      try {
        if (document.fonts && typeof document.fonts.check === 'function') {
          if (document.fonts.check(`16px "${clean}"`)) {
            this.installedFonts.add(clean);
            return true;
          }
        }
      } catch (e) {
        // Fall through to canvas probe
      }

      // Canvas probe: Compare candidate against generic monospace / sans-serif baselines
      const ctx = this.getCanvasProbeContext();
      if (ctx) {
        const testStr = 'mmmmmmmmmmlli100!@#$';
        const fontSize = '72px';

        ctx.font = `${fontSize} monospace`;
        const monoBaseline = ctx.measureText(testStr).width;

        ctx.font = `${fontSize} sans-serif`;
        const sansBaseline = ctx.measureText(testStr).width;

        ctx.font = `${fontSize} serif`;
        const serifBaseline = ctx.measureText(testStr).width;

        // Measure with font applied before fallbacks
        ctx.font = `${fontSize} "${clean}", monospace`;
        const withMono = ctx.measureText(testStr).width;

        ctx.font = `${fontSize} "${clean}", sans-serif`;
        const withSans = ctx.measureText(testStr).width;

        ctx.font = `${fontSize} "${clean}", serif`;
        const withSerif = ctx.measureText(testStr).width;

        const isAvailable = (withMono !== monoBaseline) || (withSans !== sansBaseline) || (withSerif !== serifBaseline);
        if (isAvailable) {
          this.installedFonts.add(clean);
          return true;
        }
        return false;
      }
    }

    // 4. In headless/Node test environments, check known catalog sets
    const inCatalog = SYSTEM_FONTS_CATALOG.includes(clean) || WEB_FONTS_CATALOG.includes(clean);
    return inCatalog;
  }

  /**
   * Synchronously probes standard system catalog using canvas metrics
   */
  detectInstalledFontsSync() {
    const ctx = this.getCanvasProbeContext();
    if (!ctx) return;

    for (const font of SYSTEM_FONTS_CATALOG) {
      if (this.isFontAvailable(font)) {
        this.installedFonts.add(font);
      }
    }
  }

  /**
   * Asynchronously reads system fonts using the Local Font Access API (window.queryLocalFonts)
   * with fallback to catalog probing.
   */
  async scanSystemFonts({ requestPermission = false } = {}) {
    let nativeCount = 0;

    if (typeof window !== 'undefined' && 'queryLocalFonts' in window) {
      try {
        const localFonts = await window.queryLocalFonts();
        if (Array.isArray(localFonts)) {
          for (const f of localFonts) {
            if (f && f.family) {
              const clean = this.cleanFontFamily(f.family);
              this.installedFonts.add(clean);
              nativeCount++;
            }
          }
        }
      } catch (err) {
        console.warn('[FontManager] queryLocalFonts permission or access error:', err);
      }
    }

    // Always run canvas-based probing for standard catalog fonts
    this.detectInstalledFontsSync();
    this.hasScannedSystem = true;

    return {
      success: true,
      nativeCount,
      totalInstalled: this.installedFonts.size,
      fonts: this.getAvailableFonts()
    };
  }

  /**
   * Returns lists of available fonts categorized for UI selectors
   */
  getAvailableFonts() {
    const system = Array.from(this.installedFonts).sort((a, b) => a.localeCompare(b));
    const web = Array.from(this.webFonts).sort((a, b) => a.localeCompare(b));
    const all = Array.from(new Set([...system, ...web])).sort((a, b) => a.localeCompare(b));

    return {
      systemFonts: system,
      webFonts: web,
      all
    };
  }

  /**
   * Scans a document or active page for missing fonts
   * 
   * Returns:
   * {
   *   hasMissingFonts: boolean,
   *   hasUnskippedMissingFonts: boolean,
   *   missingFonts: Array<{
   *     fontFamily: string,
   *     count: number,
   *     nodes: Array<{ id, name, content, pageId }>,
   *     isSkipped: boolean,
   *     suggestedReplacement: string
   *   }>,
   *   totalMissingLayers: number
   * }
   */
  scanDocumentForMissingFonts(doc, activePageId = null) {
    if (!doc || !doc.pages) {
      return {
        hasMissingFonts: false,
        hasUnskippedMissingFonts: false,
        missingFonts: [],
        totalMissingLayers: 0
      };
    }

    const pages = activePageId
      ? doc.pages.filter(p => p.id === activePageId)
      : doc.pages;

    const missingMap = new Map();

    for (const page of pages) {
      if (!page || !page.nodes) continue;

      for (const node of Object.values(page.nodes)) {
        // Only inspect text nodes or nodes containing text
        if (!node) continue;
        const isText = node.type === 'text' || (node.text && typeof node.text.content === 'string');
        if (!isText) continue;

        const rawFont = node.text?.fontFamily || 'Inter';
        const cleanFont = this.cleanFontFamily(rawFont);

        if (!this.isFontAvailable(cleanFont)) {
          if (!missingMap.has(cleanFont)) {
            missingMap.set(cleanFont, {
              fontFamily: cleanFont,
              count: 0,
              nodes: [],
              isSkipped: this.isFontSkipped(cleanFont),
              suggestedReplacement: this.suggestReplacement(cleanFont)
            });
          }
          const entry = missingMap.get(cleanFont);
          entry.count++;
          entry.nodes.push({
            id: node.id,
            name: node.name || 'Text Layer',
            content: (node.text?.content || '').slice(0, 40),
            pageId: page.id
          });
        }
      }
    }

    const missingFonts = Array.from(missingMap.values());
    const totalMissingLayers = missingFonts.reduce((acc, curr) => acc + curr.count, 0);
    const hasUnskipped = missingFonts.some(m => !m.isSkipped);

    return {
      hasMissingFonts: missingFonts.length > 0,
      hasUnskippedMissingFonts: hasUnskipped,
      missingFonts,
      totalMissingLayers
    };
  }

  /**
   * Heuristically suggests a replacement font based on font classification
   */
  suggestReplacement(missingFontFamily) {
    const lower = (missingFontFamily || '').toLowerCase();

    // Monospace
    if (lower.includes('mono') || lower.includes('code') || lower.includes('courier') || lower.includes('console')) {
      if (this.isFontAvailable('JetBrains Mono')) return 'JetBrains Mono';
      if (this.isFontAvailable('Consolas')) return 'Consolas';
      return 'Courier New';
    }

    // Serif
    if (lower.includes('serif') || lower.includes('times') || lower.includes('georgia') || lower.includes('display') || lower.includes('baskerville') || lower.includes('didot')) {
      if (this.isFontAvailable('Playfair Display')) return 'Playfair Display';
      if (this.isFontAvailable('Georgia')) return 'Georgia';
      return 'Times New Roman';
    }

    // Sans-serif default
    if (this.isFontAvailable('Inter')) return 'Inter';
    if (this.isFontAvailable('SF Pro')) return 'SF Pro';
    if (this.isFontAvailable('Roboto')) return 'Roboto';
    if (this.isFontAvailable('Segoe UI')) return 'Segoe UI';
    return 'Arial';
  }

  /**
   * Replaces a missing font across all matching text layers in the document
   * Uses CommandEngine.updateNodes or updateNode for single-transaction undo/redo
   */
  replaceMissingFont(engine, missingFontFamily, replacementFontFamily, options = {}) {
    if (!engine || !missingFontFamily || !replacementFontFamily) {
      return { success: false, replacedCount: 0, updatedNodeIds: [] };
    }

    const targetMissing = this.cleanFontFamily(missingFontFamily);
    const activePage = engine.getActivePage();
    if (!activePage || !activePage.nodes) {
      return { success: false, replacedCount: 0, updatedNodeIds: [] };
    }

    const updates = [];
    for (const node of Object.values(activePage.nodes)) {
      if (!node) continue;
      const isText = node.type === 'text' || (node.text && typeof node.text.content === 'string');
      if (!isText) continue;

      const nodeFont = this.cleanFontFamily(node.text?.fontFamily);
      if (nodeFont === targetMissing) {
        updates.push({
          nodeId: node.id,
          patch: {
            text: {
              ...(node.text || {}),
              fontFamily: replacementFontFamily
            }
          }
        });
      }
    }

    if (updates.length === 0) {
      return { success: true, replacedCount: 0, updatedNodeIds: [] };
    }

    const description = options.description || `Replace missing font "${targetMissing}" with "${replacementFontFamily}" (${updates.length} layers)`;
    
    if (typeof engine.updateNodes === 'function') {
      engine.updateNodes(updates, description);
    } else {
      for (const update of updates) {
        engine.updateNode(update.nodeId, update.patch, description);
      }
    }

    // Remove from skipped set since it has been replaced
    this.skippedFonts.delete(targetMissing);

    return {
      success: true,
      replacedCount: updates.length,
      updatedNodeIds: updates.map(u => u.nodeId)
    };
  }

  /**
   * Marks a missing font as skipped so the user is not prompted again during this session
   */
  skipMissingFont(fontFamily) {
    const clean = this.cleanFontFamily(fontFamily);
    this.skippedFonts.add(clean);
    return true;
  }

  /**
   * Checks whether a font is marked as skipped
   */
  isFontSkipped(fontFamily) {
    const clean = this.cleanFontFamily(fontFamily);
    return this.skippedFonts.has(clean);
  }

  /**
   * Resets skipped fonts cache
   */
  resetSkippedFonts() {
    this.skippedFonts.clear();
  }

  // --- Testing Helper Methods ---
  mockSetFontAvailability(fontFamily, isAvailable) {
    const clean = this.cleanFontFamily(fontFamily);
    this.testMocks.set(clean, Boolean(isAvailable));
  }

  mockClearAvailability() {
    this.testMocks.clear();
  }
}

export const defaultFontManager = new FontManager();
