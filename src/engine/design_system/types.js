/**
 * DesignForge AI — Unified Design System Subsystem
 * Data Models, Schema Definitions & Enums
 * Conforms to Master Specification Section 3, 5, 6, 7
 */

export const TOKEN_CATEGORIES = {
  COLOR: 'color',
  TYPOGRAPHY: 'typography',
  SPACING: 'spacing',
  DIMENSION: 'dimension',
  BORDER: 'border',
  RADIUS: 'radius',
  SHADOW: 'shadow',
  OPACITY: 'opacity',
  GRID: 'grid',
  MOTION: 'motion',
  ZINDEX: 'zindex',
  ICON: 'icon',
  DATAVIZ: 'dataviz',
  CUSTOM: 'custom'
};

export const VARIABLE_TYPES = {
  COLOR: 'color',
  NUMBER: 'number',
  STRING: 'string',
  BOOLEAN: 'boolean',
  DIMENSION: 'dimension'
};

export const THEME_MODES = {
  LIGHT: 'light',
  DARK: 'dark',
  HIGH_CONTRAST: 'high-contrast'
};

export const DESIGN_SYSTEM_STARTERS = {
  BLANK: 'blank',
  MINIMAL: 'minimal',
  ENTERPRISE: 'enterprise',
  FINTECH: 'fintech',
  ECOMMERCE: 'ecommerce',
  MATERIAL: 'material'
};

export function generateDSId(prefix = 'ds') {
  return `${prefix}_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
}

/**
 * Creates a normalized Design System Container
 */
export function createDesignSystem(name = 'Core Design System', options = {}) {
  return {
    id: options.id || generateDSId('ds'),
    name,
    description: options.description || 'Primary source-of-truth design system and component library',
    version: options.version || '1.0.0',
    status: options.status || 'published', // 'draft' | 'published' | 'deprecated'
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    modes: options.modes || [THEME_MODES.LIGHT, THEME_MODES.DARK],
    activeMode: options.activeMode || THEME_MODES.DARK,
    collections: options.collections || [],
    tokens: options.tokens || {},
    variables: options.variables || {},
    components: options.components || {},
    styles: options.styles || {},
    assets: options.assets || {},
    history: options.history || [],
    importJobs: options.importJobs || [],
    responsiveProfiles: options.responsiveProfiles || {
      desktop: { minWidth: 1025, name: 'Desktop' },
      tablet: { minWidth: 768, maxWidth: 1024, name: 'Tablet' },
      mobile: { maxWidth: 767, name: 'Mobile' }
    }
  };
}

/**
 * Creates a Token Definition
 */
export function createToken(category, name, value, options = {}) {
  return {
    id: options.id || generateDSId('tok'),
    name,
    category,
    value,
    type: options.type || category,
    description: options.description || '',
    collectionId: options.collectionId || 'collection_default',
    isSemantic: options.isSemantic || false,
    refId: options.refId || null, // For semantic aliases pointing to a primitive token ID
    modeOverrides: options.modeOverrides || {}, // { [mode]: valueOrRefId }
    responsiveOverrides: options.responsiveOverrides || {}, // { [device]: valueOrRefId }
    deprecated: options.deprecated || false,
    usageCount: options.usageCount || 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Creates a Typed Variable
 */
export function createVariable(name, type, value, options = {}) {
  return {
    id: options.id || generateDSId('var'),
    name,
    type,
    value,
    description: options.description || '',
    collectionId: options.collectionId || 'collection_default',
    modeOverrides: options.modeOverrides || {},
    linkedTokenId: options.linkedTokenId || null, // Direct 1-to-1 sync with a token
    scopes: options.scopes || ['all'], // 'fill' | 'stroke' | 'text' | 'spacing' | 'radius' | 'all'
    usageCount: options.usageCount || 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Creates a Component Definition
 */
export function createComponentDef(name, options = {}) {
  return {
    id: options.id || generateDSId('cmp'),
    name,
    category: options.category || 'General',
    description: options.description || '',
    rootNodeId: options.rootNodeId || null,
    properties: options.properties || [
      { id: 'prop_variant', name: 'variant', type: 'variant', defaultValue: 'primary', options: ['primary', 'secondary', 'ghost'] },
      { id: 'prop_size', name: 'size', type: 'variant', defaultValue: 'md', options: ['sm', 'md', 'lg'] },
      { id: 'prop_disabled', name: 'disabled', type: 'boolean', defaultValue: false },
      { id: 'prop_label', name: 'label', type: 'text', defaultValue: name }
    ],
    variants: options.variants || [
      { id: 'var_primary_md', properties: { variant: 'primary', size: 'md', disabled: false }, nodeOverrides: {} }
    ],
    instances: options.instances || [],
    status: options.status || 'published',
    sourceMetadata: options.sourceMetadata || { origin: 'native' }, // or { origin: 'imported-react', package: '@radix-ui/react' }
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Creates a Unified Asset Record
 */
export function createAssetRecord(type, name, options = {}) {
  return {
    id: options.id || generateDSId('asset'),
    name,
    type, // 'token' | 'variable' | 'component' | 'style' | 'icon' | 'image' | 'imported'
    sourceId: options.sourceId || null, // ID in tokens/variables/components table
    category: options.category || 'General',
    previewUrl: options.previewUrl || null,
    provenance: options.provenance || 'native',
    tags: options.tags || [],
    createdAt: new Date().toISOString()
  };
}
