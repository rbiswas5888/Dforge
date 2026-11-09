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
  DIMENSION: 'dimension',
  TIMING: 'timing',
  EASING: 'easing'
};

export const STYLE_CATEGORIES = {
  COLOR: 'color',
  TYPOGRAPHY: 'typography',
  EFFECT: 'effect',
  GRID: 'grid',
  ANIMATION: 'animation'
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
  MATERIAL: 'material',
  HEALTHCARE: 'healthcare',
  EDUCATION: 'education'
};

export const TOKEN_TIERS = {
  PRIMITIVE: 'primitive',   // Raw values (e.g. #2563eb, 16px) - Tier 1
  SEMANTIC: 'semantic',     // Purpose-bound aliases (e.g. color.action.primary) - Tier 2
  COMPONENT: 'component'    // Component-specific bindings (e.g. button.primary.bg) - Tier 3
};

export const VARIABLE_SCOPES = {
  ALL: 'all',
  FRAME_FILL: 'frame_fill',
  SHAPE_FILL: 'shape_fill',
  TEXT_FILL: 'text_fill',
  STROKE: 'stroke',
  CORNER_RADIUS: 'corner_radius',
  GAP: 'gap',
  PADDING: 'padding',
  WIDTH_HEIGHT: 'width_height',
  OPACITY: 'opacity'
};

export const COMPONENT_PROPERTY_TYPES = {
  VARIANT: 'variant',             // Select variant in a component set
  BOOLEAN: 'boolean',             // Show or hide layers
  TEXT: 'text',                   // Editable string override
  INSTANCE_SWAP: 'instance_swap'  // Swap nested icons or component instances
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
  const isSemantic = Boolean(options.isSemantic || options.refId);
  const tier = options.tier || (isSemantic ? TOKEN_TIERS.SEMANTIC : (options.componentId ? TOKEN_TIERS.COMPONENT : TOKEN_TIERS.PRIMITIVE));
  const normalizedName = String(name || '').toLowerCase().replace(/[\s\/]+/g, '-');
  return {
    id: options.id || generateDSId('tok'),
    name,
    category,
    value,
    type: options.type || category,
    tier,
    description: options.description || '',
    collectionId: options.collectionId || 'collection_default',
    isSemantic,
    refId: options.refId || null, // For semantic aliases pointing to a primitive token ID
    modeOverrides: options.modeOverrides || {}, // { [mode]: valueOrRefId }
    responsiveOverrides: options.responsiveOverrides || {}, // { [device]: valueOrRefId }
    codeSyntax: options.codeSyntax || {
      css: `var(--${normalizedName})`,
      tailwind: normalizedName.replace(/^color-/, ''),
      react: `theme.${category}.${normalizedName.replace(/-/g, '_')}`
    },
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
  const normalizedName = String(name || '').toLowerCase().replace(/[\s\/]+/g, '-');
  return {
    id: options.id || generateDSId('var'),
    name,
    type,
    value,
    description: options.description || '',
    collectionId: options.collectionId || 'collection_default',
    modeOverrides: options.modeOverrides || {},
    linkedTokenId: options.linkedTokenId || null, // Direct 1-to-1 sync with a token
    scopes: options.scopes || [VARIABLE_SCOPES.ALL],
    codeSyntax: options.codeSyntax || {
      css: `var(--${normalizedName})`,
      tailwind: normalizedName,
      react: `vars.${normalizedName.replace(/-/g, '_')}`
    },
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

/**
 * Creates a reusable Style Definition (Figma 5 Native Style Categories)
 * - Color Styles: solid, gradient, image paints stacked
 * - Typography Styles: fontFamily, fontSize, fontWeight, lineHeight, letterSpacing
 * - Effect Styles: drop shadow, inner shadow, layer blur, background blur
 * - Layout Grid Styles: columns, rows, grid
 * - Animation Styles: duration, easing curve, spring config
 */
export function createStyleDef(name, category, properties = {}, options = {}) {
  return {
    id: options.id || generateDSId('stl'),
    name,
    category: category || STYLE_CATEGORIES.COLOR,
    description: options.description || '',
    properties: { ...properties },
    modeOverrides: options.modeOverrides || {},
    codeSyntax: options.codeSyntax || {
      css: `/* ${name} */`,
      tailwind: String(name).toLowerCase().replace(/[\s\/]+/g, '-')
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Converts DesignForge tokens into DTCG (Design Tokens Community Group) specification format
 * Outputs standard $value, $type, $description, and $extensions fields.
 */
export function exportToDTCGFormat(registry) {
  const root = {
    $description: registry.description || 'DesignForge AI Token Export',
    $version: registry.version || '1.0.0'
  };

  const tokens = typeof registry.getAllTokens === 'function' ? registry.getAllTokens() : Object.values(registry.tokens || {});
  for (const token of tokens) {
    const parts = (token.name || token.id).split(/[\/\.]/);
    let curr = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i].trim();
      if (!curr[part]) curr[part] = {};
      curr = curr[part];
    }
    const leafKey = parts[parts.length - 1].trim();
    
    let dtcgValue = token.value;
    if (token.isSemantic && token.refId) {
      const target = typeof registry.getToken === 'function' ? registry.getToken(token.refId) : null;
      dtcgValue = target ? `{${target.name.replace(/[\/]/g, '.')}}` : `{${token.refId}}`;
    }

    curr[leafKey] = {
      $value: dtcgValue,
      $type: token.type || token.category,
      $description: token.description || '',
      $extensions: {
        'com.designforge': {
          id: token.id,
          tier: token.tier || 'primitive',
          codeSyntax: token.codeSyntax || {},
          collectionId: token.collectionId || 'collection_default'
        }
      }
    };
  }

  const styles = typeof registry.getAllStyles === 'function' ? registry.getAllStyles() : Object.values(registry.styles || {});
  if (styles.length > 0) {
    root.styles = {};
    for (const style of styles) {
      root.styles[style.name] = {
        $type: style.category || 'style',
        $description: style.description || '',
        $value: style.properties?.value || style.properties || {},
        $extensions: {
          'com.designforge': {
            id: style.id,
            category: style.category,
            properties: style.properties,
            modeOverrides: style.modeOverrides,
            codeSyntax: style.codeSyntax
          }
        }
      };
    }
  }

  return root;
}

/**
 * Parses and imports DTCG (Design Tokens Community Group) standard token format
 */
export function importFromDTCGFormat(dtcgJson) {
  const importedTokens = [];

  function traverse(obj, path = []) {
    if (!obj || typeof obj !== 'object') return;
    
    // Check if leaf token definition
    if (obj.hasOwnProperty('$value')) {
      const name = path.join('.');
      const type = obj.$type || 'color';
      const desc = obj.$description || '';
      const extensions = obj.$extensions?.['com.designforge'] || {};
      
      let val = obj.$value;
      let refId = null;
      let isSemantic = false;

      // Handle DTCG alias reference e.g. {color.brand.primary}
      if (typeof val === 'string' && val.startsWith('{') && val.endsWith('}')) {
        isSemantic = true;
        refId = val.slice(1, -1);
      }

      importedTokens.push(createToken(type, name, val, {
        description: desc,
        tier: extensions.tier || (isSemantic ? TOKEN_TIERS.SEMANTIC : TOKEN_TIERS.PRIMITIVE),
        isSemantic,
        refId,
        codeSyntax: extensions.codeSyntax
      }));
      return;
    }

    for (const [key, val] of Object.entries(obj)) {
      if (key.startsWith('$')) continue;
      traverse(val, [...path, key]);
    }
  }

  traverse(dtcgJson);
  return importedTokens;
}
