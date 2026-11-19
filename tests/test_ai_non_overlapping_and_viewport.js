/**
 * DesignForge AI - Test Suite for Non-Overlapping AI Generation & Live Viewports
 * Validates:
 * 1. AI designs never overlap existing designs and position cleanly to the right
 * 2. Generated designs bind design system tokens, variables, and components
 * 3. Live variable and component viewports render rich visual simulations
 */

import assert from 'assert';
import { createInitialDocument, createNode } from '../src/engine/document.js';
import { CommandEngine } from '../src/engine/commands.js';
import { calculateNonOverlappingRootPosition } from '../src/engine/layout.js';
import { OperationExecutor } from '../src/ai/operations.js';
import { LocalProvider } from '../src/ai/providers/local-provider.js';
import { DFIRCanvasBridge } from '../src/ai/dfir_bridge.js';
import { ComponentVariableManager } from '../src/engine/design_system/component_variable_manager.js';
import { DesignSystemUIController } from '../src/engine/design_system/ui_controller.js';

console.log('⚡ Starting AI Non-Overlapping Layout & Viewport Verification Suite...\n');

// Mock browser DOM environment for UI Controller tests
class MockElement {
  constructor(id = '', tagName = 'div') {
    this.id = id;
    this.tagName = tagName;
    this.style = {};
    this.innerHTML = '';
    this.textContent = '';
    this.children = [];
    this.listeners = {};
    this.dataset = {};
  }
  addEventListener(event, fn) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
  }
  querySelector() { return null; }
  querySelectorAll() { return []; }
}

const mockDomElements = {};
global.document = {
  getElementById: (id) => {
    if (!mockDomElements[id]) {
      mockDomElements[id] = new MockElement(id);
    }
    return mockDomElements[id];
  },
  createElement: (tag) => new MockElement('', tag)
};

// --- Test 1: Layout Position Calculation for Non-Overlapping Designs ---
console.log('1. Testing calculateNonOverlappingRootPosition()...');
const doc = createInitialDocument('Test Project');
const page = doc.pages[0];
page.nodes = {};
page.rootIds = [];

// Empty canvas returns standard origin (0, 0)
const initialPos = calculateNonOverlappingRootPosition(page, 1200, 80);
assert.strictEqual(initialPos.x, 0, 'Initial canvas placement starts at x: 0');
assert.strictEqual(initialPos.y, 0, 'Initial canvas placement starts at y: 0');

// Add an existing root frame at (80, 80) with width: 1200, height: 800
const existingFrame = createNode('frame', {
  name: 'Existing Frame 1',
  transform: { x: 80, y: 80, width: 1200, height: 800 }
});
page.nodes[existingFrame.id] = existingFrame;
page.rootIds.push(existingFrame.id);

// Next position must be to the right of the existing frame: 80 + 1200 + 80 = 1360
const nextPos = calculateNonOverlappingRootPosition(page, 1000, 80);
assert.strictEqual(nextPos.x, 1360, 'Next position shifts to the right (x: 1360) to avoid overlap');
assert.strictEqual(nextPos.y, 80, 'Next position aligns to top baseline (y: 80)');
console.log('   ✓ calculateNonOverlappingRootPosition accurately spaces root frames to the right.');

// --- Test 2: AI LocalProvider Execution With Non-Overlapping Placement ---
console.log('2. Testing AI LocalProvider Non-Overlapping Canvas Injection...');
const engine = new CommandEngine(doc);
const executor = new OperationExecutor(engine);
const localProvider = new LocalProvider();

// Generate a new SaaS dashboard using LocalProvider
const plan = await localProvider.generate('Create cloud SaaS dashboard', { selection: [] });
assert.ok(plan.operations && plan.operations.length > 0, 'Plan produces structured operations');

// Execute operations on the page which already has existingFrame at x: 80
const report = executor.execute(plan.operations, 'AI SaaS Dashboard');
assert.ok(report.success, 'Executor succeeded');
assert.ok(report.createdNodeIds.length > 0, 'New nodes were created');

// Locate newly created root node
const newRootId = page.rootIds.find(id => id !== existingFrame.id);
assert.ok(newRootId, 'New root frame was registered on canvas');
const newRoot = page.nodes[newRootId];

// Root must have shifted horizontally beyond existingFrame (>= 1360) so it does NOT overlap
assert.ok(newRoot.transform.x >= 1360, `New AI root frame position (x: ${newRoot.transform.x}) must be >= 1360 to prevent overlap`);
console.log(`   ✓ New AI design automatically shifted to x: ${newRoot.transform.x} (Zero overlap with existing design at x: 80).`);

// --- Test 3: Design System Tokens & Variable Bindings in Generated AI Nodes ---
console.log('3. Testing Design System Components & Variable Token Bindings in AI Design...');
const createdNodes = report.createdNodeIds.map(id => page.nodes[id]);

// Check that components have catalog identifiers
const buttons = createdNodes.filter(n => n.componentId === 'button');
const cards = createdNodes.filter(n => n.componentId === 'card');
const tables = createdNodes.filter(n => n.componentId === 'ag-grid-table');

assert.ok(buttons.length > 0, 'AI generated design contains Material UI Button components');
assert.ok(cards.length > 0, 'AI generated design contains Material UI Card components');
assert.ok(tables.length > 0, 'AI generated design contains AG Grid Table components');

// Check that tokens/variables are bound to style properties
const nodesWithTokenBindings = createdNodes.filter(n => Object.keys(n.tokenBindings || {}).length > 0);
assert.ok(nodesWithTokenBindings.length >= 4, `At least 4 nodes have active token bindings (found ${nodesWithTokenBindings.length})`);

// Verify specific tokens: brand primary, bg surface, text primary
const allBindings = nodesWithTokenBindings.flatMap(n => Object.values(n.tokenBindings));
assert.ok(allBindings.includes('token_brand_primary'), 'Design binds token_brand_primary');
assert.ok(allBindings.includes('token_bg_surface'), 'Design binds token_bg_surface');
console.log('   ✓ AI generated design uses authentic Design System components (MUI Button, Card, AG Grid) and token bindings.');

// --- Test 4: DFIRCanvasBridge Non-Overlapping Placement ---
console.log('4. Testing DFIRCanvasBridge Non-Overlapping Placement...');
const bridge = new DFIRCanvasBridge(doc, engine);
const sampleDfir = {
  metadata: { title: 'Fintech Mobile Shell' },
  root: {
    id: 'dfir_root',
    type: 'frame',
    name: 'Fintech Mobile Screen',
    componentId: 'card',
    tokenBindings: { 'style.fills.0.color': 'token_brand_primary' },
    transform: { x: 0, y: 0, width: 375, height: 812 },
    children: [
      {
        id: 'dfir_btn',
        type: 'frame',
        name: 'Transfer Button',
        componentId: 'button',
        tokenBindings: { 'style.fills.0.color': 'token_brand_primary' },
        transform: { x: 20, y: 20, width: 335, height: 48 },
        children: []
      }
    ]
  }
};

const bridgeResult = bridge.applyDfirToCanvas(sampleDfir);
assert.ok(bridgeResult.success, 'DFIR Bridge applied successfully');
const dfirRoot = page.nodes[bridgeResult.rootNodeId];
// Must be placed to the right of the previous roots
assert.ok(dfirRoot.transform.x >= 2560, `DFIR root frame placed at x: ${dfirRoot.transform.x} without collision`);
assert.strictEqual(dfirRoot.componentId, 'card', 'Component ID preserved by DFIR Bridge');
assert.strictEqual(dfirRoot.tokenBindings['style.fills.0.color'], 'token_brand_primary', 'Token binding preserved by DFIR Bridge');
console.log('   ✓ DFIRCanvasBridge auto-calculates non-overlapping coordinates and preserves component/token bindings.');

// --- Test 5: Live Variable Viewport Rendering ---
console.log('5. Testing Live Variable Viewport Box & Simulation...');
const mockApp = { compVarManager: new ComponentVariableManager(engine), showToast: () => {} };
const uiController = new DesignSystemUIController(mockApp);
uiController.activeCompNode = dfirRoot;

// Test Color Variable Viewport for both 'addVar' and 'replaceVar'
const sampleColorVar = {
  id: 'var_test_primary',
  name: 'Primary / Azure',
  type: 'color',
  category: 'color',
  value: '#0284C7'
};

uiController.renderVariableViewport(sampleColorVar, 'style.fills.0.color', 'addVar');
const addStage = global.document.getElementById('addVarViewportStage');
const addDetails = global.document.getElementById('addVarViewportDetails');
const addSimStage = global.document.getElementById('addVarCompSimStage');

assert.ok(addStage.innerHTML.includes('#0284C7'), 'Color hex code rendered in variable viewport');
assert.ok(addStage.innerHTML.includes('AA Pass'), 'WCAG contrast compliance pill rendered in viewport');
assert.ok(addDetails.innerHTML.includes('--token-primary---azure'), 'Token key code rendered in details');
assert.ok(addSimStage.innerHTML.includes('#0284C7'), 'Component live simulation updated with variable value');

// Test Replace Variable Viewport
uiController.renderVariableViewport(sampleColorVar, 'style.fills.0.color', 'replaceVar');
const repStage = global.document.getElementById('replaceVarViewportStage');
const repSimStage = global.document.getElementById('replaceVarCompSimStage');
assert.ok(repStage.innerHTML.includes('#0284C7'), 'Replace Variable modal viewport rendered hex swatch');
assert.ok(repSimStage.innerHTML.includes('Live Simulated on Target Node'), 'Replace Variable simulated on target node');
console.log('   ✓ Variable Viewport generates live color swatches, contrast badges, and component simulation.');

// --- Test 6: Live Replacement Component Viewport Rendering ---
console.log('6. Testing Live Replacement Component Viewport...');
const sampleMuiComp = {
  id: 'button',
  name: 'Button',
  category: 'Inputs',
  library: 'MUI',
  description: 'Material UI Elevated & Outlined Action Button'
};

uiController.renderReplacementComponentViewport(sampleMuiComp);
const compStage = global.document.getElementById('replaceCompViewportStage');
const compTag = global.document.getElementById('replaceCompPreviewTag');

assert.ok(compTag.textContent.includes('MUI COMPONENT'), 'Preview tag indicates library');
assert.ok(compStage.innerHTML.includes('Contained') && compStage.innerHTML.includes('Outlined'), 'Interactive button previews rendered in viewport');
console.log('   ✓ Component Replacement Viewport generates live interactive preview for catalog components.');

console.log('\n🎉 ALL NON-OVERLAPPING AI GENERATION & LIVE VIEWPORT TESTS PASSED (100% SPEC COMPLIANCE)!');
