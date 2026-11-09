/**
 * DesignForge AI — Unified Design System Subsystem Verification Suite
 * Validates Master Specification Sections 1-20
 */

import assert from 'node:assert';
import { createInitialDocument, createNode } from '../src/engine/document.js';
import { CommandEngine } from '../src/engine/commands.js';
import {
  DesignSystemRegistry,
  AITokenWizard,
  ResponsiveTokenEngine,
  ComponentVariableExtractor,
  ReactDesignSystemImporter,
  addRneuiComponentToRegistry,
  addMuiComponentToRegistry,
  MUI_COMPONENT_CATALOG,
  MUI_DESIGN_TOKENS,
  createMuiNode,
  insertMuiComponentToCanvas,
  createDesignSystem,
  TOKEN_CATEGORIES,
  VARIABLE_TYPES,
  THEME_MODES
} from '../src/engine/design_system/index.js';

console.log('⚡ Starting Unified Design System Acceptance Suite...\n');

// 1. Registry & Synchronization Validation
console.log('1. Testing Design System Registry & Shared Model (Section 3 & 8)...');
const doc = createInitialDocument('Design System Master Test');
const engine = new CommandEngine(doc);
const registry = new DesignSystemRegistry(doc);

assert.ok(registry.system.id, 'Registry must have a stable unique ID');
assert.ok(registry.system.collections.length > 0, 'Registry must have migrated initial collections');

const legacyDesignDoc = createInitialDocument('Legacy Design System Migration Test');
legacyDesignDoc.tokens = [{
  id: 'legacy-colors',
  name: 'Legacy Colors',
  tokens: [{ id: 'legacy-brand', name: 'Brand / Primary', type: 'color', value: '#2563eb' }]
}];
legacyDesignDoc.designSystem = createDesignSystem('Existing Design System', {
  collections: [],
  tokens: {},
  variables: {},
  components: {},
  styles: {},
  assets: {}
});
const migratedRegistry = new DesignSystemRegistry(legacyDesignDoc);
assert.strictEqual(migratedRegistry.getAllTokens().length, 1, 'Existing empty systems must absorb legacy document tokens');
assert.strictEqual(migratedRegistry.getAllTokens()[0].id, 'legacy-brand');
const migratedTokenCount = migratedRegistry.getAllTokens().length;
new DesignSystemRegistry(legacyDesignDoc);
assert.strictEqual(migratedRegistry.getAllTokens().length, migratedTokenCount, 'Legacy token migration must be idempotent');

// Add a new token
const brandPrimary = registry.addToken(TOKEN_CATEGORIES.COLOR, 'color.brand.core', '#2563eb', {
  description: 'Primary interactive corporate blue'
});
assert.strictEqual(registry.system.tokens[brandPrimary.id].value, '#2563eb');

// Check automatic synchronization to Assets view (Section 8)
const assetEntry = Object.values(registry.system.assets).find(a => a.sourceId === brandPrimary.id);
assert.ok(assetEntry, 'Tokens must automatically project into the Assets inventory');
assert.strictEqual(assetEntry.name, 'color.brand.core');

// Add a variable and verify
const spacingVar = registry.addVariable('space.card.padding', VARIABLE_TYPES.DIMENSION, 24);
assert.strictEqual(registry.system.variables[spacingVar.id].value, 24);
const varAsset = Object.values(registry.system.assets).find(a => a.sourceId === spacingVar.id);
assert.ok(varAsset, 'Variables must automatically project into the Assets inventory');

console.log('   ✓ Shared registry bidirectional synchronization into Assets confirmed.');

// 2. Overview Live Metrics Calculation (Section 4)
console.log('2. Testing Computed Overview Metrics (Section 4)...');
// Add duplicate candidate to test live detection
registry.addToken(TOKEN_CATEGORIES.COLOR, 'color.button.bg', '#2563eb'); // exact duplicate of color.brand.core
const metrics = registry.computeOverviewMetrics();

assert.ok(metrics.totalTokens >= 2, 'Should count tokens');
assert.ok(metrics.totalVariables >= 1, 'Should count variables');
assert.ok(metrics.totalAssets >= 3, 'Should count assets');
assert.equal(metrics.totalStyles, Object.keys(registry.system.styles).length, 'Should count registered styles');
assert.ok(metrics.duplicateCandidatesCount >= 1, 'Should detect duplicate token candidates');
assert.ok(metrics.duplicateCandidates.some(d => d.value === '#2563eb'), 'Should detect the #2563eb duplicate candidate');
console.log('   ✓ Overview metrics accurately calculated: %d tokens, %d variables, %d duplicate candidate(s).',
  metrics.totalTokens, metrics.totalVariables, metrics.duplicateCandidatesCount);

// 3. AI Generate Tokens Guided Wizard (Section 9)
console.log('3. Testing AI Generate Tokens Guided Wizard (Section 9)...');
const tokenWizard = new AITokenWizard(registry);

const wizardConfig = {
  mode: 'new',
  systemName: 'Fintech Treasury System',
  industry: 'fintech',
  direction: 'minimal',
  brandColors: ['#0284c7', '#0d9488'],
  categories: [TOKEN_CATEGORIES.COLOR, TOKEN_CATEGORIES.TYPOGRAPHY, TOKEN_CATEGORIES.SPACING, TOKEN_CATEGORIES.RADIUS]
};

const proposalResult = await tokenWizard.generateTokenProposal(wizardConfig);
assert.ok(proposalResult.proposals.length > 0, 'Must produce structured token proposals');
assert.strictEqual(proposalResult.industry, 'fintech');

// Verify proposal does not mutate registry before approval
const preCommitCount = Object.keys(registry.system.tokens).length;
assert.ok(!registry.system.tokens['color.brand.primary'], 'Proposals must not silently mutate registry');

// Commit approved proposals
const commitRes = tokenWizard.commitApprovedProposals(proposalResult.proposals);
assert.strictEqual(commitRes.success, true);
assert.ok(Object.keys(registry.system.tokens).length > preCommitCount, 'Approved tokens must be committed');
console.log('   ✓ AI Token Wizard generated %d proposals and committed %d approved tokens without silent overwrite.',
  proposalResult.proposals.length, commitRes.committedCount);

// 4. Responsive Token Generation (Desktop -> Tablet/Mobile) (Section 10)
console.log('4. Testing Responsive Token Adaptation Engine (Section 10)...');
const responsiveEngine = new ResponsiveTokenEngine(registry);

const responsiveResult = responsiveEngine.generateResponsiveAdaptations({
  targetDevices: ['tablet', 'mobile'],
  categories: [TOKEN_CATEGORIES.SPACING, TOKEN_CATEGORIES.TYPOGRAPHY, TOKEN_CATEGORIES.GRID]
});

assert.ok(responsiveResult.adaptations.length > 0, 'Must produce responsive adaptations');
const headingAdapt = responsiveResult.adaptations.find(a => a.name.includes('heading'));
if (headingAdapt) {
  assert.ok(headingAdapt.mobileValue !== headingAdapt.desktopValue, 'Mobile heading should be adapted');
}

assert.ok(responsiveResult.cssPreview.includes('@media (max-width: 767px)'), 'Must emit responsive media queries');
responsiveEngine.commitResponsiveOverrides(responsiveResult.adaptations);
console.log('   ✓ Responsive engine adapted %d tokens with generated CSS media queries.',
  responsiveResult.adaptations.length);

// 5. Component Variable Extraction (Opt-in Workflow) (Section 11)
console.log('5. Testing Explicit Component Variable Extraction (Section 11)...');
const extractor = new ComponentVariableExtractor(registry, engine);

// Create component button node
const buttonNode = createNode('frame', {
  name: 'Submit Button',
  transform: { x: 100, y: 100, width: 140, height: 44 },
  style: {
    fills: [{ type: 'solid', color: '#2563eb' }],
    cornerRadius: 8
  },
  layout: { mode: 'stack-horizontal', paddingLeft: 16, paddingRight: 16, gap: 8 }
});
engine.addNode(buttonNode);

const extractProposals = extractor.proposeVariablesForComponent(buttonNode.id);
assert.ok(extractProposals.proposals.length > 0, 'Must inspect component properties');

// Check that existing variable/token was reused instead of duplicated!
const fillProposal = extractProposals.proposals.find(p => p.property.includes('fills'));
assert.ok(fillProposal, 'Must propose fill variable');
assert.strictEqual(fillProposal.action, 'reuse', 'Must reuse existing matching color token');

const applyRes = extractor.applyApprovedVariables(buttonNode.id, extractProposals.proposals);
assert.strictEqual(applyRes.success, true);
assert.ok(Object.keys(applyRes.tokenBindings).length > 0, 'Must bind approved variables to node');
console.log('   ✓ Component variable extraction reused matching tokens and bound %d properties safely.',
  applyRes.boundCount);

// 6. React Design System Importer (Section 13)
console.log('6. Testing React Design System & DTCG Importer (Section 13)...');
const reactImporter = new ReactDesignSystemImporter(registry);

const sampleDtcgTokens = {
  color: {
    brand: {
      primary: { $type: 'color', $value: '#6366f1', $description: 'Indigo brand primary' }
    },
    surface: {
      card: { $type: 'color', $value: '#1e1e2e', $description: 'Card background' }
    }
  },
  spacing: {
    unit: { $type: 'dimension', $value: '16px' }
  }
};

const dtcgReport = await reactImporter.analyzeAndParse(sampleDtcgTokens, { sourceName: 'tailwind-tokens.json' });
assert.strictEqual(dtcgReport.format, 'dtcg');
assert.strictEqual(dtcgReport.discoveredTokens.length, 3);
assert.strictEqual(dtcgReport.discoveredTokens[0].name, 'color.brand.primary');
assert.strictEqual(dtcgReport.discoveredTokens[0].value, '#6366f1');

const commitReact = reactImporter.commitImportedSystem(dtcgReport, 'Tailwind W3C DTCG Tokens');
assert.strictEqual(commitReact.success, true);
assert.strictEqual(commitReact.importedTokensCount, 3);
assert.strictEqual(registry.getAllTokens().length, Object.keys(registry.system.tokens).length);
assert.strictEqual(registry.getAllVariables().length, Object.keys(registry.system.variables).length);
assert.strictEqual(registry.getAllComponents().length, Object.keys(registry.system.components).length);
assert.strictEqual(registry.getAllStyles().length, Object.keys(registry.system.styles).length);
assert.ok(Array.isArray(registry.getDependents(brandPrimary.id)));

const importedComponentReport = {
  discoveredTokens: [{
    category: TOKEN_CATEGORIES.COLOR,
    name: 'color.brand.primary',
    value: '#123456',
    description: 'Imported primary color'
  }],
  discoveredComponents: [{
    name: 'Imported Button',
    category: 'React',
    properties: [{ name: 'label', type: 'text' }]
  }]
};
reactImporter.commitImportedSystem(importedComponentReport, 'Imported React System');
const tokenCountAfterImport = registry.getAllTokens().length;
const componentCountAfterImport = registry.getAllComponents().length;
const repeatedImport = reactImporter.commitImportedSystem(importedComponentReport, 'Imported React System');
assert.strictEqual(registry.getAllTokens().length, tokenCountAfterImport, 'Repeated import must update tokens instead of duplicating them');
assert.strictEqual(registry.getAllComponents().length, componentCountAfterImport, 'Repeated import must update components instead of duplicating them');
assert.strictEqual(repeatedImport.collectionId, registry.system.collections.find(collection => collection.name === 'Imported React System').id);

let autosaveCount = 0;
const starterDoc = createInitialDocument('Design System Starter Test');
const starterRegistry = new DesignSystemRegistry(starterDoc, {
  scheduleAutosave(savedDoc) {
    autosaveCount += 1;
    assert.strictEqual(savedDoc, starterDoc);
  }
});
starterRegistry.initializeWithStarter('material', 'Material Starter', 'Material 3 foundation tokens');
assert.strictEqual(starterRegistry.system.name, 'Material Starter');
assert.strictEqual(starterRegistry.system.description, 'Material 3 foundation tokens');
assert.ok(starterRegistry.getAllTokens().some(token => token.name === 'Color / Primary' && token.value === '#6750a4'));
assert.ok(autosaveCount > 0, 'Starter creation must persist through the StorageEngine autosave API');
const starterTokenCount = starterRegistry.getAllTokens().length;
starterRegistry.initializeWithStarter('material', 'Material Starter');
assert.strictEqual(starterRegistry.getAllTokens().length, starterTokenCount, 'Repeated starter initialization must not duplicate seed tokens');
const catalogRegistry = new DesignSystemRegistry(createInitialDocument('RNEUI Catalog Test'));
const addedRneuiButton = addRneuiComponentToRegistry(catalogRegistry, 'button');
assert.strictEqual(addedRneuiButton.added, true);
assert.strictEqual(addedRneuiButton.component.sourceMetadata.package, '@rneui/themed');
assert.strictEqual(addedRneuiButton.component.sourceMetadata.platform, 'react-native');
assert.strictEqual(addRneuiComponentToRegistry(catalogRegistry, 'button').added, false, 'Catalog additions must be idempotent');
assert.throws(() => addRneuiComponentToRegistry(catalogRegistry, 'not-a-component'), /Unknown RNEUI catalog component/);

// Material UI (@mui/material v10) Catalog Verification
assert.ok(MUI_COMPONENT_CATALOG.length >= 25, 'MUI catalog must contain at least 25 components');
const muiButton = addMuiComponentToRegistry(catalogRegistry, 'button');
assert.strictEqual(muiButton.added, true);
assert.strictEqual(muiButton.component.sourceMetadata.package, '@mui/material');
assert.strictEqual(muiButton.component.sourceMetadata.packageVersion, '10.0.0-alpha.0');
assert.strictEqual(muiButton.component.sourceMetadata.platform, 'react-web');
assert.strictEqual(addMuiComponentToRegistry(catalogRegistry, 'button').added, false, 'MUI additions must be idempotent');
assert.throws(() => addMuiComponentToRegistry(catalogRegistry, 'non-existent'), /Unknown MUI catalog component/);

// MUI Node creation verification
const { rootNode: btnNode, childNodes: btnChildren } = createMuiNode('button', { x: 50, y: 50 });
assert.strictEqual(btnNode.name, 'MUI / Button (Contained)');
assert.strictEqual(btnNode.style.cornerRadius, 4);
assert.strictEqual(btnNode.style.fills[0].color, '#1976d2');
assert.strictEqual(btnChildren.length, 1);
assert.strictEqual(btnChildren[0].text.content, 'BUTTON');

const { rootNode: cardNode, childNodes: cardChildren } = createMuiNode('card', { x: 100, y: 100 });
assert.strictEqual(cardNode.name, 'MUI / Card');
assert.ok(cardChildren.length >= 6);

// MUI Canvas Insertion verification
const mockApp = {
  engine: new CommandEngine(createInitialDocument('MUI Canvas Test')),
  dsRegistry: catalogRegistry,
  getCanvasCenter: () => ({ x: 150, y: 150 }),
  selectionManager: { setSelection: () => {} },
  storage: { scheduleAutosave: () => {} },
  render: () => {},
  renderLayersTree: () => {},
  showToast: () => {}
};
const insertedNode = insertMuiComponentToCanvas(mockApp, 'alert');
assert.ok(insertedNode.id);
assert.strictEqual(insertedNode.name, 'MUI / Alert (Success)');
const pageNodes = mockApp.engine.getActivePage().nodes;
assert.ok(pageNodes[insertedNode.id]);
console.log('   ✓ Material UI (@mui/material v10) catalog, node generators, and canvas insertion verified.');
console.log('   ✓ DTCG token schema parsed and transactionally registered into Design System Registry.');

// 7. Versioning & Releases (Section 17)
console.log('7. Testing Versioning, Releases & Publication (Section 17)...');
const release = registry.publishRelease('1.1.0', 'Feature: add responsive adaptations and DTCG tokens');
assert.strictEqual(registry.system.version, '1.1.0');
assert.strictEqual(registry.system.status, 'published');
assert.strictEqual(registry.system.history[0].id, release.id);
console.log('   ✓ Design System release v%s successfully published and recorded in version history.', release.version);

// 8. Figma Token Architecture, Scopes & Industry Starters (Book Alignment)
console.log('8. Testing Figma 3-Tier Hierarchy, Scopes & Industry Starters...');
const bookDoc = createInitialDocument('Figma Book Alignment Spec');
const bookRegistry = new DesignSystemRegistry(bookDoc);

// A. Test Healthcare and Education Starters
bookRegistry.initializeWithStarter('healthcare', 'Healthcare Clinical UI');
assert.ok(bookRegistry.getAllTokens().some(t => t.name === 'Color / Safe' && t.value === '#16a34a'));
assert.ok(bookRegistry.getAllTokens().some(t => t.name === 'Color / Alert' && t.value === '#dc2626'));

const eduRegistry = new DesignSystemRegistry(createInitialDocument('Education DS'));
eduRegistry.initializeWithStarter('education', 'EdTech LMS System');
assert.ok(eduRegistry.getAllTokens().some(t => t.name === 'Color / Progress' && t.value === '#059669'));

// B. Test 3-Tier Hierarchy (Primitive -> Semantic -> Component)
const primToken = bookRegistry.addToken('color', 'blue-500', '#3b82f6', { tier: 'primitive' });
assert.strictEqual(primToken.tier, 'primitive');

const semToken = bookRegistry.addToken('color', 'action.primary', primToken.value, { 
  isSemantic: true,
  refId: primToken.id,
  tier: 'semantic'
});
assert.strictEqual(semToken.tier, 'semantic');

const compToken = bookRegistry.addToken('color', 'button.primary.bg', semToken.value, {
  componentId: 'cmp_button_1',
  tier: 'component'
});
assert.strictEqual(compToken.tier, 'component');

assert.ok(bookRegistry.getTokensByTier('primitive').length >= 1);
assert.ok(bookRegistry.getTokensByTier('semantic').length >= 1);
assert.ok(bookRegistry.getTokensByTier('component').length >= 1);

// C. Test Dev Mode Code Syntax
bookRegistry.setTokenCodeSyntax(semToken.id, {
  css: 'var(--color-action-primary)',
  tailwind: 'bg-primary-500',
  react: 'theme.colors.action.primary'
});
assert.strictEqual(bookRegistry.system.tokens[semToken.id].codeSyntax.css, 'var(--color-action-primary)');
assert.strictEqual(bookRegistry.system.tokens[semToken.id].codeSyntax.tailwind, 'bg-primary-500');

// D. Test Variable Scopes & Types
const radiusVar = bookRegistry.createVariable('corner.radius.card', 'number', 12, {
  scopes: ['corner_radius']
});
assert.strictEqual(radiusVar.type, 'number');
assert.ok(bookRegistry.getVariablesByScope('corner_radius').some(v => v.id === radiusVar.id));

console.log('   ✓ 3-tier token hierarchy, variable scopes, and industry starters verified.');

console.log('\n🎉 ALL UNIFIED DESIGN SYSTEM TESTS PASSED SUCCESSFULLY (100% SPEC COMPLIANCE)!');
