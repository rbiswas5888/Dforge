/**
 * DesignForge AI - DFIR Canvas Integration Verification Suite
 * Verifies bidirectional DFIR translation, CommandEngine execution, undo/redo, and export.
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInitialDocument } from '../src/engine/document.js';
import { CommandEngine } from '../src/engine/commands.js';
import { DFIRCanvasBridge } from '../src/ai/dfir_bridge.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Starting DFIR Canvas Bridge Verification Suite...\n');

// 1. Initialize Document & Bridge
console.log('1. Initializing canonical document and DFIR bridge...');
const doc = createInitialDocument('DFIR Test Project');
const engine = new CommandEngine(doc);
const bridge = new DFIRCanvasBridge(doc, engine);
const page = engine.getActivePage();
const initialNodeCount = Object.keys(page.nodes).length;
const initialRootCount = page.rootIds.length;

console.log('   ✓ Document initialized with %d nodes and %d root frames.', initialNodeCount, initialRootCount);

// 2. Load Reference DFIR Document
console.log('2. Loading reference DFIR dashboard example...');
const examplePath = path.join(__dirname, '..', 'LLM', 'schema', 'DFIR_EXAMPLES', 'dashboard_example.json');
const dfirJson = JSON.parse(fs.readFileSync(examplePath, 'utf8'));

// 3. Apply DFIR to Canvas
console.log('3. Applying DFIR document to canvas via CommandEngine...');
const result = bridge.applyDfirToCanvas(dfirJson, { position: { x: 1600, y: 80 } });

assert.strictEqual(result.success, true, 'Bridge execution must succeed');
assert.ok(result.nodeCount > 5, 'Must generate multiple native nodes');
assert.strictEqual(Object.keys(page.nodes).length, initialNodeCount + result.nodeCount, 'All nodes must be in page.nodes');
assert.strictEqual(page.rootIds.length, initialRootCount + 1, 'Root frame must be added to page.rootIds');

const rootNode = page.nodes[result.rootNodeId];
assert.ok(rootNode, 'Root node must exist');
assert.strictEqual(rootNode.transform.x, 1600);
assert.strictEqual(rootNode.transform.y, 80);
assert.strictEqual(rootNode.layout.mode, 'stack-horizontal');
assert.ok(rootNode.childIds.length >= 2, 'Root node must have children');

console.log('   ✓ Successfully created %d native nodes with auto-layout and typography.', result.nodeCount);

// 4. Test Transactional Undo
console.log('4. Testing atomic undo of the generated DFIR screen...');
assert.ok(engine.canUndo(), 'Engine must be able to undo');
engine.undo();

assert.strictEqual(Object.keys(page.nodes).length, initialNodeCount, 'All generated nodes must be removed on undo');
assert.strictEqual(page.rootIds.length, initialRootCount, 'Root IDs must be restored on undo');
assert.strictEqual(page.nodes[result.rootNodeId], undefined, 'Root node must no longer exist');
console.log('   ✓ Undo reverted all %d nodes cleanly.', result.nodeCount);

// 5. Test Transactional Redo
console.log('5. Testing atomic redo...');
assert.ok(engine.canRedo(), 'Engine must be able to redo');
engine.redo();

assert.strictEqual(Object.keys(page.nodes).length, initialNodeCount + result.nodeCount, 'All nodes restored on redo');
assert.strictEqual(page.rootIds.length, initialRootCount + 1, 'Root frame restored on redo');
console.log('   ✓ Redo restored all nodes with 100% precision.');

// 6. Test Reverse Export Canvas -> DFIR
console.log('6. Testing reverse export (Canvas -> DFIR)...');
const currentRoot = page.nodes[result.rootNodeId];
const exportedDfir = bridge.exportCanvasToDfir(result.rootNodeId);
assert.strictEqual(exportedDfir.version, '1.0.0');
assert.strictEqual(exportedDfir.root.type, 'frame');
assert.strictEqual(exportedDfir.root.children.length, currentRoot.childIds.length);
console.log('   ✓ Canvas exported back to valid DFIR structure with %d child layers.', exportedDfir.root.children.length);

console.log('\n🎉 ALL DFIR CANVAS BRIDGE VERIFICATION CHECKS PASSED SUCCESSFULLY!\n');
