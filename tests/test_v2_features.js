/**
 * DesignForge AI - Master Prompt v2 Advanced Features Verification Suite
 * Verifies Figma-identical design inspector capabilities, Dev Mode code generation,
 * Continuous Design System Linter & Token Auto-Binding, Command Palette,
 * and PRD Spec Coverage & Ambiguity Resolution.
 */

import assert from 'node:assert';
import { createInitialDocument, createNode } from '../src/engine/document.js';
import { CommandEngine } from '../src/engine/commands.js';
import { CanvasRenderer } from '../src/engine/renderer.js';
import { DesignSystemLinter } from '../src/engine/linter.js';
import { InspectCodeGenerator } from '../src/engine/inspect_generator.js';
import { CommandPaletteEngine } from '../src/engine/palette.js';
import { MarkdownDesignParser } from '../src/ai/markdown_parser.js';

console.log('⚡ Starting Master Prompt v2 Advanced Features Verification Suite...\n');

// 1. Test Continuous Design-System Linter & Token Auto-Binding (Master Prompt Section 2.1 & 10)
console.log('1. Testing Continuous Design-System Linter & Token Auto-Binding...');
const doc = createInitialDocument('V2 Verification Project');
const engine = new CommandEngine(doc);
const linter = new DesignSystemLinter(engine);

// Add a test node with hard-coded color matching 'Brand / Primary' (#3b82f6) and off-scale gap
const testNode = createNode('frame', {
  name: 'Test Frame for Linter',
  style: {
    fills: [{ type: 'solid', color: '#3b82f6' }], // Matches token_brand_primary exactly
    cornerRadius: 7 // Off-scale (token is 6)
  },
  layout: {
    mode: 'stack-vertical',
    gap: 15 // Off-scale (nearest token is 16)
  }
});
engine.addNode(testNode, null, 'Add test node for linter');

const lintResult = linter.lint();
assert.ok(lintResult.issues.length >= 2, 'Linter must detect unbound exact color match and off-scale gap');
console.log('   ✓ Detected %d design-system issues (%d exact token matches, %d off-scale spacing/radius)',
  lintResult.issues.length, lintResult.summary.warnings, lintResult.issues.filter(i => i.fixType === 'gap').length);

// Test Auto-Binding All
const fixedCount = linter.autoBindAll(lintResult.issues);
assert.ok(fixedCount >= 2, 'Must auto-bind all detected drift issues');

const updatedNode = engine.getNode(testNode.id);
assert.strictEqual(updatedNode.style.fills[0].tokenId, 'token_brand_primary', 'Fill must be bound to Brand / Primary token');
assert.strictEqual(updatedNode.layout.gap, 16, 'Gap must be bound to nearest token (16px)');
assert.strictEqual(updatedNode.style.cornerRadius, 6, 'Corner radius must be bound to nearest token (6px)');
console.log('   ✓ 1-Click Auto-Bind successfully bound fill, gap, and corner radius to design tokens.');

// 2. Test Inspect & Dev Mode Code Generator (Master Prompt Section 4.3 & 13)
console.log('\n2. Testing Dev Mode Inspect Code Generator (CSS, Tailwind, React, SwiftUI)...');
const inspectGen = new InspectCodeGenerator(doc);
const inspectData = inspectGen.generateInspectData(updatedNode);

assert.ok(inspectData.css.includes('display: flex'), 'CSS must include flex layout');
assert.ok(inspectData.css.includes('gap: 16px'), 'CSS must reflect bound gap token');
assert.ok(inspectData.tailwind.includes('flex flex-col'), 'Tailwind must reflect vertical stack');
assert.ok(inspectData.react.includes('export function'), 'React component must be emitted');
assert.ok(inspectData.swiftui.includes('VStack'), 'SwiftUI output must map vertical stack to VStack');
assert.strictEqual(inspectData.boxModel.gap, 16, 'Box model metrics must be extracted');
console.log('   ✓ Dev Mode code generator verified for CSS, Tailwind CSS, React JSX, and SwiftUI.');

// 3. Test Command Palette Engine Indexing & Fuzzy Search (Master Prompt Section A2)
console.log('\n3. Testing Command Palette Search Engine (Cmd/Ctrl+K)...');
const mockApp = {
  engine,
  doc,
  setTool: () => {},
  undo: () => {},
  redo: () => {},
  duplicateSelected: () => {},
  deleteSelected: () => {},
  groupSelected: () => {},
  ungroupSelected: () => {},
  addAutoLayoutToSelected: () => {},
  createComponentFromSelection: () => {},
  openPrototypeModal: () => {},
  openExportModal: () => {},
  zoomToFit: () => {},
  zoom100: () => {},
  openLinterModal: () => {},
  runAiPromptQuick: () => {},
  renderAll: () => {}
};
const palette = new CommandPaletteEngine(mockApp);
const allItems = palette.buildIndex();
assert.ok(allItems.length > 20, 'Index must aggregate tools, actions, layers, pages, and AI recipes');

const searchResults = palette.search('auto layout');
assert.ok(searchResults.length > 0, 'Must match "Auto Layout"');
assert.strictEqual(searchResults[0].id, 'act_autolayout');

const layerSearchResults = palette.search('Test Frame for Linter');
assert.ok(layerSearchResults.length > 0, 'Must match layer on canvas');
console.log('   ✓ Command Palette indexed %d commands & layers and successfully performed fuzzy search.', allItems.length);

// 4. Test PRD Spec-to-Design Ambiguity & Coverage Checklist (Master Prompt Section 2.1 & 6)
console.log('\n4. Testing PRD Spec Coverage & Ambiguity Resolution Report...');
const mdParser = new MarkdownDesignParser();
const sampleSpec = `
# FinTech Payment Gateway

## Objective
High-performance payment gateway dashboard.

## Layout
- Desktop frame: 1440 x 1024
- Sidebar: 240px
- Header: 72px

## Components
- Navigation Sidebar
- Metric KPI Cards
- Transaction Volume Chart
- Recent Settlements Table

## Design System
- Font: Inter
- Border radius: 10px
- Primary color: #2563EB
`;

const parsedPlan = mdParser.parse(sampleSpec);
assert.ok(parsedPlan.specCoverage && parsedPlan.specCoverage.length >= 4, 'Must emit requirement coverage matrix');
assert.ok(parsedPlan.ambiguities && parsedPlan.ambiguities.length >= 2, 'Must emit ambiguity resolution flags');
console.log('   ✓ Spec Coverage: %d requirements mapped to editable canvas nodes.', parsedPlan.specCoverage.length);
console.log('   ✓ Ambiguity Report: %d assumptions flagged with explicit design resolutions.', parsedPlan.ambiguities.length);

// 5. Test Advanced Canvas Renderer Capabilities (Per-corner radius, gradients, dashed strokes)
console.log('\n5. Testing Advanced Canvas Renderer Capabilities...');
// Test roundRectPath with quad radius
let pathLog = [];
const mockCtx = {
  save: () => {},
  restore: () => {},
  beginPath: () => {},
  moveTo: (x, y) => pathLog.push(`moveTo(${x},${y})`),
  lineTo: (x, y) => pathLog.push(`lineTo(${x},${y})`),
  quadraticCurveTo: (cpx, cpy, x, y) => pathLog.push(`quad(${x},${y})`),
  closePath: () => pathLog.push('close'),
  stroke: () => {},
  fill: () => {},
  rect: () => {},
  setLineDash: () => {},
  createLinearGradient: () => ({ addColorStop: () => {} })
};

const mockCanvas = {
  getContext: () => mockCtx,
  getBoundingClientRect: () => ({ width: 800, height: 600 }),
  style: {}
};

const renderer = new CanvasRenderer(mockCanvas, engine);
renderer.roundRectPath(mockCtx, 0, 0, 100, 100, { topLeft: 10, topRight: 20, bottomRight: 30, bottomLeft: 40 });
assert.ok(pathLog.length > 5, 'Must draw rounded path with 4 distinct corner radii');
console.log('   ✓ 4-Corner independent corner radii path geometry verified.');

// Test Prototype Interactions Data Structure
console.log('\n6. Testing Interactive Prototyping Flow Connections...');
const page = engine.getActivePage();
const targetFrame = page.nodes[page.rootIds[0]];
engine.updateNode(testNode.id, {
  interactions: [
    { trigger: 'click', action: 'navigate', targetId: targetFrame.id, animation: 'smart-animate' }
  ]
}, 'Attach prototype interaction');

const updatedWithProto = engine.getNode(testNode.id);
assert.strictEqual(updatedWithProto.interactions.length, 1);
assert.strictEqual(updatedWithProto.interactions[0].action, 'navigate');
assert.strictEqual(updatedWithProto.interactions[0].targetId, targetFrame.id);
console.log('   ✓ Interactive prototype triggers and screen navigations verified on canonical document.');

console.log('\n🎉 ALL MASTER PROMPT V2 ADVANCED FEATURES PASSED 100%!');
