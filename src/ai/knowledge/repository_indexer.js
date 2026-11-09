/**
 * DesignForge AI — Design System Repository Indexer & Context Retriever
 * Conforms to Master Specification (Part C: Design System Repository Intelligence)
 * Indexes tokens, variables, component catalogs (Material UI + RNEUI + Custom),
 * and guidelines, providing targeted RAG context to LLMs without full-repo dumps.
 */

import { MUI_COMPONENT_CATALOG, MUI_DESIGN_TOKENS } from '../../engine/design_system/mui_catalog.js';
import { RNEUI_COMPONENT_CATALOG } from '../../engine/design_system/rneui_catalog.js';

export class DesignSystemRepositoryIndexer {
  constructor(registry = null, doc = null) {
    this.registry = registry;
    this.doc = doc;
    this.index = {
      components: [],
      tokens: [],
      variables: [],
      guidelines: [],
      lastIndexed: null
    };
    this.reindex();
  }

  setRegistryAndDoc(registry, doc) {
    this.registry = registry;
    this.doc = doc;
    this.reindex();
  }

  /**
   * 6.2 Repository Indexing
   * Parses and structures all available components, tokens, variables, and guidelines
   */
  reindex() {
    const components = [];

    // 1. Index Material UI components
    for (const muiComp of MUI_COMPONENT_CATALOG) {
      components.push({
        id: muiComp.id,
        name: muiComp.name,
        catalog: '@mui/material',
        platform: 'react-web',
        category: muiComp.category,
        description: muiComp.description,
        defaultSize: muiComp.defaultSize,
        properties: muiComp.properties.map(p => ({
          name: p.name,
          type: p.type,
          defaultValue: p.defaultValue,
          options: p.options || null
        })),
        keywords: [
          muiComp.id,
          muiComp.name.toLowerCase(),
          muiComp.category.toLowerCase(),
          'material',
          'mui',
          'react',
          ...muiComp.description.toLowerCase().split(/\s+/)
        ]
      });
    }

    // 2. Index React Native Elements
    for (const rneuiComp of RNEUI_COMPONENT_CATALOG) {
      components.push({
        id: `rneui_${rneuiComp.id}`,
        name: `RNEUI ${rneuiComp.name}`,
        catalog: '@rneui/themed',
        platform: 'react-native',
        category: rneuiComp.category,
        description: rneuiComp.description,
        properties: rneuiComp.properties,
        keywords: [
          rneuiComp.id,
          rneuiComp.name.toLowerCase(),
          rneuiComp.category.toLowerCase(),
          'mobile',
          'react-native'
        ]
      });
    }

    // 3. Index Active Document / Custom Registered Components
    if (this.registry) {
      const customComps = this.registry.getAllComponents();
      for (const comp of customComps) {
        if (!components.some(c => c.id === comp.id)) {
          components.push({
            id: comp.id,
            name: comp.name,
            catalog: comp.sourceMetadata?.package || 'custom',
            platform: comp.sourceMetadata?.platform || 'web',
            category: comp.category || 'General',
            description: comp.description || '',
            properties: comp.properties || [],
            keywords: [comp.name.toLowerCase(), 'custom', 'component']
          });
        }
      }
    }

    // 4. Index Design Tokens
    const tokens = [];
    if (this.registry) {
      const regTokens = this.registry.getAllTokens();
      for (const tok of regTokens) {
        tokens.push({
          id: tok.id,
          name: tok.name,
          category: tok.category,
          value: tok.value,
          keywords: [tok.name.toLowerCase(), tok.category.toLowerCase()]
        });
      }
    } else if (this.doc?.tokens) {
      for (const group of this.doc.tokens) {
        for (const tok of group.tokens || []) {
          tokens.push({
            id: tok.id,
            name: tok.name,
            category: group.category || tok.type,
            value: tok.value,
            keywords: [tok.name.toLowerCase()]
          });
        }
      }
    }

    // 5. Index Material UI Design Tokens
    tokens.push(
      { id: 'mui_primary', name: 'Material Primary', category: 'color', value: MUI_DESIGN_TOKENS.palette.primary.main, keywords: ['primary', 'blue', 'accent', 'brand'] },
      { id: 'mui_secondary', name: 'Material Secondary', category: 'color', value: MUI_DESIGN_TOKENS.palette.secondary.main, keywords: ['secondary', 'purple'] },
      { id: 'mui_error', name: 'Material Error', category: 'color', value: MUI_DESIGN_TOKENS.palette.error.main, keywords: ['error', 'danger', 'red'] },
      { id: 'mui_success', name: 'Material Success', category: 'color', value: MUI_DESIGN_TOKENS.palette.success.main, keywords: ['success', 'green', 'confirm'] },
      { id: 'mui_spacing_8', name: 'Material Spacing Base', category: 'spacing', value: '8px', keywords: ['spacing', 'gap', 'padding', 'grid'] },
      { id: 'mui_radius_4', name: 'Material Shape Radius', category: 'radius', value: '4px', keywords: ['radius', 'corner', 'round'] }
    );

    // 6. Index Design System Variables
    const variables = [];
    if (this.registry) {
      const regVars = Object.values(this.registry.system.variables || {});
      for (const v of regVars) {
        variables.push({
          id: v.id,
          name: v.name,
          type: v.type,
          value: v.value,
          keywords: [v.name.toLowerCase(), v.type.toLowerCase()]
        });
      }
    }

    // 7. Index Guidelines & Best Practices
    const guidelines = [
      { topic: 'grid', rule: 'Use 8px base spacing grid (8, 16, 24, 32, 48px) for consistent rhythm.' },
      { topic: 'responsive', rule: 'Support Desktop (1440px), Tablet (768px), and Mobile (375px) artboards.' },
      { topic: 'autolayout', rule: 'Wrap elements in horizontal or vertical auto-layout stacks rather than fixed positioning.' },
      { topic: 'accessibility', rule: 'Maintain WCAG AA minimum 4.5:1 contrast for normal text and 3:1 for large text.' },
      { topic: 'tokens', rule: 'Bind colors, typography scales, and corner radii to design system tokens instead of arbitrary literals.' }
    ];

    this.index = {
      components,
      tokens,
      variables,
      guidelines,
      lastIndexed: new Date().toISOString()
    };

    return this.index;
  }

  /**
   * 6.3 Retrieval-Augmented Design Generation (RAG)
   * Retrieves relevant components, tokens, variables, and guidelines for a query
   * without sending unnecessary or private repository data to LLMs.
   */
  retrieveRelevantContext(query, options = {}) {
    const limit = options.limit || 8;
    const lowerQuery = (query || '').toLowerCase();
    const queryTokens = lowerQuery.split(/[\s,.-]+/).filter(t => t.length > 2);

    // Score and filter components
    const scoredComponents = this.index.components.map(comp => {
      let score = 0;
      for (const qt of queryTokens) {
        if (comp.id.includes(qt)) score += 5;
        if (comp.name.toLowerCase().includes(qt)) score += 4;
        if (comp.category.toLowerCase().includes(qt)) score += 3;
        if (comp.keywords.some(k => k.includes(qt))) score += 2;
      }
      return { comp, score };
    });

    // Sort by relevance score
    const topComponents = scoredComponents
      .filter(sc => sc.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(sc => sc.comp);

    // If query didn't match specific components, provide core default foundational components
    const finalComponents = topComponents.length > 0
      ? topComponents
      : this.index.components.filter(c => ['button', 'card', 'textfield', 'appbar'].includes(c.id));

    // Match relevant tokens (colors, spacing)
    const relevantTokens = this.index.tokens.filter(tok => {
      return queryTokens.some(qt => tok.keywords.some(k => k.includes(qt))) || ['color', 'spacing'].includes(tok.category);
    }).slice(0, 10);

    // Match relevant variables
    const relevantVariables = this.index.variables.slice(0, 8);

    // Compile provenance citations
    const citations = [
      ...finalComponents.map(c => `${c.catalog} ${c.name}`),
      ...relevantTokens.slice(0, 4).map(t => `Token: ${t.name} (${t.value})`)
    ];

    return {
      query,
      retrievedComponents: finalComponents.map(c => ({
        id: c.id,
        name: c.name,
        category: c.category,
        catalog: c.catalog,
        description: c.description,
        properties: c.properties
      })),
      retrievedTokens: relevantTokens.map(t => ({
        name: t.name,
        category: t.category,
        value: t.value
      })),
      retrievedVariables: relevantVariables.map(v => ({
        name: v.name,
        type: v.type,
        value: v.value
      })),
      guidelines: this.index.guidelines,
      citations,
      contextPrompt: this.formatRAGPromptSnippet(finalComponents, relevantTokens)
    };
  }

  /**
   * Formats a compact, highly structured prompt context for ChatGPT and Gemini
   */
  formatRAGPromptSnippet(components, tokens) {
    const compList = components.map(c => `• ${c.name} (id: "${c.id}", category: "${c.category}"): ${c.description}`).join('\n');
    const tokList = tokens.map(t => `• ${t.name}: ${t.value} [${t.category}]`).join('\n');

    return `### Discovered Design System Components:
${compList}

### Discovered Design Tokens:
${tokList}

INSTRUCTION: You must strictly reuse these discovered component IDs and tokens in your design operations rather than inventing new names.`;
  }
}
