/**
 * DesignForge AI — External Design Import Engine
 * Canonical Intermediate Representation (CIR) & Source Capability Registry
 * Conforms to MD/Design.md Specification
 */

export const IMPORT_MODES = {
  STRUCTURE_PRESERVING: 'structure-preserving', // Default: preserves hierarchy, tokens, components, interactions
  MAXIMUM_EDITABLE: 'maximum-editable',         // Flatten complex effects to maximize direct vector/text manipulation
  VISUAL_REFERENCE: 'visual-reference'          // Embedded raster/SVG layers with layout boundaries
};

/**
 * Source Capability Registry (Section 5 of MD/Design.md)
 * Maps source file formats to supported conversion features and feasibility ratings.
 */
export const SOURCE_CAPABILITY_REGISTRY = {
  sketch: {
    name: 'Sketch',
    extensions: ['.sketch', '.sketch.json'],
    mimeType: 'application/x-sketch',
    feasibility: 'Native Direct Parsing',
    capabilities: {
      pages: 'full',
      artboards: 'full',
      hierarchy: 'full',
      shapes: 'full',
      vectors: 'full',
      text: 'full',
      images: 'full',
      symbols: 'full',
      symbolOverrides: 'partial',
      sharedStyles: 'full',
      colorVariables: 'full',
      autoLayout: 'partial',
      prototyping: 'partial',
      shadows: 'full',
      blurs: 'partial'
    },
    limitations: [
      'Prototyping logic mapped to standard push/slide transitions',
      'Sketch plugin-generated layers converted to static shapes'
    ]
  },
  figma: {
    name: 'Figma',
    extensions: ['.fig', '.figma.json'],
    mimeType: 'application/json',
    feasibility: 'REST API & Schema Normalization',
    capabilities: {
      pages: 'full',
      artboards: 'full',
      hierarchy: 'full',
      shapes: 'full',
      vectors: 'full',
      text: 'full',
      images: 'full',
      components: 'full',
      variants: 'full',
      variables: 'full',
      autoLayout: 'full',
      prototyping: 'full',
      shadows: 'full',
      blurs: 'full'
    },
    limitations: [
      'Binary .fig files require JSON schema export or Figma REST API access',
      'Complex smart-animate transitions approximated with cubic-bezier curves'
    ]
  },
  xd: {
    name: 'Adobe XD',
    extensions: ['.xd', '.xd.json'],
    mimeType: 'application/vnd.adobe.xd',
    feasibility: 'Archive & Interchange Conversion',
    capabilities: {
      pages: 'full',
      artboards: 'full',
      hierarchy: 'full',
      shapes: 'full',
      vectors: 'full',
      text: 'full',
      images: 'full',
      repeatGrid: 'partial',
      prototyping: 'partial',
      sharedAssets: 'full'
    },
    limitations: [
      'Repeat grid instances expanded into grouped flex stacks',
      'Voice triggers flagged as unsupported'
    ]
  },
  svg: {
    name: 'SVG / Adobe Illustrator Interchange',
    extensions: ['.svg'],
    mimeType: 'image/svg+xml',
    feasibility: 'Direct XML Vector Parsing',
    capabilities: {
      pages: 'single',
      artboards: 'full',
      hierarchy: 'full',
      shapes: 'full',
      vectors: 'full',
      text: 'partial',
      images: 'full',
      gradients: 'full',
      masks: 'partial',
      components: 'none',
      prototyping: 'none'
    },
    limitations: [
      'SVG text with custom font glyphs mapped to nearest available font',
      'No component or prototype metadata present in standard SVG'
    ]
  },
  penpot: {
    name: 'Penpot',
    extensions: ['.penpot', '.penpot.json'],
    mimeType: 'application/json',
    feasibility: 'Open Schema JSON Adapter',
    capabilities: {
      pages: 'full',
      artboards: 'full',
      hierarchy: 'full',
      shapes: 'full',
      vectors: 'full',
      text: 'full',
      components: 'full',
      tokens: 'full',
      flexLayout: 'full',
      prototyping: 'partial'
    },
    limitations: [
      'Path morphing interactions mapped to dissolve'
    ]
  },
  dforge: {
    name: 'DesignForge Native Project',
    extensions: ['.dforge', '.json'],
    mimeType: 'application/json',
    feasibility: 'Native 100% Lossless',
    capabilities: {
      pages: 'full',
      artboards: 'full',
      hierarchy: 'full',
      shapes: 'full',
      vectors: 'full',
      text: 'full',
      images: 'full',
      components: 'full',
      variants: 'full',
      variables: 'full',
      autoLayout: 'full',
      prototyping: 'full',
      shadows: 'full',
      blurs: 'full'
    },
    limitations: []
  }
};

/**
 * Creates a normalized CIR Document (Canonical Intermediate Representation)
 */
export function createCIRDocument(options = {}) {
  return {
    version: '1.0.0',
    sourceApplication: options.sourceApplication || 'unknown',
    sourceFormatVersion: options.sourceFormatVersion || '1.0',
    projectName: options.projectName || 'Imported Design Project',
    importMode: options.importMode || IMPORT_MODES.STRUCTURE_PRESERVING,
    metadata: {
      createdAt: new Date().toISOString(),
      originalFileName: options.originalFileName || 'untitled',
      author: options.author || 'External Author',
      ...(options.metadata || {})
    },
    tokens: options.tokens || [],
    components: options.components || {},
    pages: options.pages || [],
    assets: options.assets || {},
    prototypeFlows: options.prototypeFlows || []
  };
}

/**
 * Creates a normalized CIR Page
 */
export function createCIRPage(name = 'Page 1', id = null) {
  return {
    id: id || `cir_page_${Math.random().toString(36).substring(2, 9)}`,
    name,
    rootNodeIds: [],
    nodes: {}
  };
}

/**
 * Creates a normalized CIR Node
 */
export function createCIRNode(type, overrides = {}) {
  const id = overrides.id || `cir_${type}_${Math.random().toString(36).substring(2, 9)}`;
  return {
    id,
    sourceId: overrides.sourceId || id,
    type, // 'frame' | 'group' | 'rectangle' | 'ellipse' | 'line' | 'star' | 'polygon' | 'text' | 'image' | 'vector' | 'component' | 'instance'
    name: overrides.name || `${type.charAt(0).toUpperCase() + type.slice(1)}`,
    parentId: overrides.parentId || null,
    childIds: overrides.childIds || [],
    visible: overrides.visible !== undefined ? overrides.visible : true,
    locked: overrides.locked !== undefined ? overrides.locked : false,
    opacity: overrides.opacity !== undefined ? overrides.opacity : 1,
    transform: {
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      ...(overrides.transform || {})
    },
    layout: {
      mode: 'none', // 'none' | 'stack-horizontal' | 'stack-vertical' | 'grid'
      paddingTop: 0,
      paddingRight: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      gap: 0,
      alignItems: 'start',
      justifyContent: 'start',
      sizingHorizontal: 'fixed',
      sizingVertical: 'fixed',
      ...(overrides.layout || {})
    },
    style: {
      fills: overrides.style?.fills || [{ type: 'solid', color: '#334155', opacity: 1 }],
      strokes: overrides.style?.strokes || [],
      cornerRadius: overrides.style?.cornerRadius !== undefined ? overrides.style.cornerRadius : 0,
      shadows: overrides.style?.shadows || [],
      blur: overrides.style?.blur || null,
      blendMode: overrides.style?.blendMode || 'normal',
      ...(overrides.style || {})
    },
    text: overrides.text ? {
      content: overrides.text.content || '',
      fontFamily: overrides.text.fontFamily || 'Inter, sans-serif',
      fontSize: overrides.text.fontSize || 16,
      fontWeight: overrides.text.fontWeight || '400',
      lineHeight: overrides.text.lineHeight || 1.4,
      letterSpacing: overrides.text.letterSpacing || 0,
      textAlign: overrides.text.textAlign || 'left',
      color: overrides.text.color || '#f8fafc',
      ...(overrides.text || {})
    } : null,
    vectorData: overrides.vectorData || null, // For custom path topology, anchor points, SVG path strings
    componentRef: overrides.componentRef || null,
    interactions: overrides.interactions || [],
    tokenBindings: overrides.tokenBindings || {},
    unsupportedProps: overrides.unsupportedProps || []
  };
}
