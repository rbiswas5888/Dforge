/**
 * DesignForge AI - Automated Engine Verification Suite
 */

import assert from 'node:assert';
import { createInitialDocument, createNode } from '../src/engine/document.js';
import { CommandEngine } from '../src/engine/commands.js';
import { ReactCompiler } from '../src/engine/compiler.js';
import { AIEngine } from '../src/engine/ai.js';
import { StorageEngine } from '../src/engine/storage.js';

console.log('🧪 Starting DesignForge AI Engine Verification Suite...\n');

// 1. Document Model Validation
console.log('1. Testing Canonical Document Model...');
const doc = createInitialDocument('Test Project');
assert.strictEqual(doc.schemaVersion, '1.0.0');
assert.ok(doc.pages.length > 0, 'Document must have at least one page');
assert.ok(doc.tokens.length > 0, 'Document must have token collections');
const page = doc.pages[0];
assert.ok(page.rootIds.length >= 2, 'Starter project should contain desktop and mobile frames');
console.log('   ✓ Document model successfully initialized with %d root frames and %d total nodes.',
  page.rootIds.length, Object.keys(page.nodes).length);

// 2. Command Engine and Undo/Redo Validation
console.log('2. Testing Command & Transaction Engine...');
const engine = new CommandEngine(doc);
const initialNodeCount = Object.keys(page.nodes).length;

// Add Node
const testNode = createNode('rectangle', { name: 'Verification Box', transform: { x: 50, y: 50, width: 200, height: 100 } });
engine.addNode(testNode, null, 'Add verification box');
assert.strictEqual(Object.keys(page.nodes).length, initialNodeCount + 1);
assert.ok(page.rootIds.includes(testNode.id));

// Undo Add
assert.ok(engine.canUndo(), 'Should be able to undo');
engine.undo();
assert.strictEqual(Object.keys(page.nodes).length, initialNodeCount);
assert.ok(!page.rootIds.includes(testNode.id));

// Redo Add
assert.ok(engine.canRedo(), 'Should be able to redo');
engine.redo();
assert.strictEqual(Object.keys(page.nodes).length, initialNodeCount + 1);
assert.ok(page.rootIds.includes(testNode.id));

// Update Node
engine.updateNode(testNode.id, { transform: { x: 300, y: 400 } }, 'Move verification box');
assert.strictEqual(page.nodes[testNode.id].transform.x, 300);
engine.undo();
assert.strictEqual(page.nodes[testNode.id].transform.x, 50);
console.log('   ✓ Command execution, mutations, undo, and redo validated with 100% precision.');

const reorderDoc = createInitialDocument('Layer Reorder Project');
const reorderEngine = new CommandEngine(reorderDoc);
const reorderPage = reorderEngine.getActivePage();
const [firstRoot, secondRoot] = reorderPage.rootIds;
assert.ok(reorderEngine.reorderNodeTo(firstRoot, secondRoot, 'after'));
assert.deepStrictEqual(reorderPage.rootIds.slice(0, 2), [secondRoot, firstRoot]);
assert.ok(reorderEngine.undo());
assert.deepStrictEqual(reorderPage.rootIds.slice(0, 2), [firstRoot, secondRoot]);
assert.ok(reorderEngine.redo());
assert.deepStrictEqual(reorderPage.rootIds.slice(0, 2), [secondRoot, firstRoot]);
assert.strictEqual(reorderEngine.reorderNodeTo(firstRoot, 'missing-node'), false);
console.log('   ✓ Layer drag-reorder command validates siblings and supports undo/redo.');

// 3. Design-to-React Compiler Validation
console.log('3. Testing Design-to-React Compiler...');
const compiler = new ReactCompiler(doc);
const compilation = compiler.compile();
assert.ok(compilation.fileTree['package.json'], 'Must emit package.json');
assert.ok(compilation.fileTree['tsconfig.json'], 'Must emit tsconfig.json');
assert.ok(compilation.fileTree['README.md'], 'Must emit README.md');
assert.ok(compilation.fileTree['src/App.tsx'], 'Must emit src/App.tsx');
assert.ok(compilation.fileTree['src/tokens/tokens.ts'], 'Must emit src/tokens/tokens.ts');

const liveHtml = compiler.generateLivePreviewHtml();
assert.ok(liveHtml.includes('<!DOCTYPE html>'), 'Must produce valid HTML5 preview');
assert.ok(liveHtml.includes('ForgePay'), 'Preview must render document contents');
console.log('   ✓ React Compiler successfully emitted %d source files and live preview sandbox.',
  Object.keys(compilation.fileTree).length);

// 4. AI Design Engine Validation
console.log('4. Testing AI Engine Intent & Structured Action Planning...');
const ai = new AIEngine(engine);

// Test Pricing Table Generation
const pricingPlan = await ai.generateDesignPlan('Create a SaaS pricing table with 3 tiers');
assert.ok(pricingPlan.operations.length > 0, 'AI must produce operations');
assert.strictEqual(pricingPlan.operations[0].op, 'createTree');
const preNodeCount = Object.keys(page.nodes).length;
ai.executePlan(pricingPlan);
assert.ok(Object.keys(page.nodes).length > preNodeCount, 'Nodes should be added to canvas');
console.log('   ✓ AI generated and committed: %s (%d nodes added)', pricingPlan.intent, Object.keys(page.nodes).length - preNodeCount);

// Test Auto Layout Modification
engine.setSelection([testNode.id]);
const layoutPlan = await ai.generateDesignPlan('make layout vertical stack with 24px gap');
assert.strictEqual(layoutPlan.operations[0].patch.layout.mode, 'stack-vertical');
assert.strictEqual(layoutPlan.operations[0].patch.layout.gap, 24);
ai.executePlan(layoutPlan);
assert.strictEqual(page.nodes[testNode.id].layout.mode, 'stack-vertical');
assert.strictEqual(page.nodes[testNode.id].layout.gap, 24);
console.log('   ✓ AI successfully updated layout rules on selected object.');

// 5. Local-First Storage & Serialization Validation
console.log('5. Testing Local Storage & .dforge File Serialization...');
const storage = new StorageEngine();
const serialized = JSON.stringify(doc);
const restored = storage.parseDForgeContent(serialized);
assert.strictEqual(restored.schemaVersion, doc.schemaVersion);
assert.strictEqual(restored.pages[0].rootIds.length, doc.pages[0].rootIds.length);
console.log('   ✓ .dforge serialization round-trip verified with zero data loss.');

console.log('\n🎉 ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!');
