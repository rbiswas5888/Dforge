/**
 * Test Suite: DF-UX Intelligence Native Local LLM Provider Integration
 * Verifies that DFUXProvider is registered, active by default, connects to backend,
 * generates DFIR, and applies native canvas nodes with atomic undo/redo.
 */

import assert from 'node:assert';
import { createInitialDocument, createNode } from '../src/engine/document.js';
import { CommandEngine } from '../src/engine/commands.js';
import { DesignForgeAIService } from '../src/ai/service.js';
import { PROVIDERS } from '../src/ai/types.js';
import { DFUXProvider } from '../src/ai/providers/dfux-provider.js';

console.log('🧪 Starting DF-UX Provider Integration Tests...');

// 1. Instantiation and Registration
const doc = createInitialDocument();
const engine = new CommandEngine(doc);
const aiService = new DesignForgeAIService(doc, engine);

assert.ok(aiService.providers.has(PROVIDERS.DFUX), 'DFUX provider should be registered in AIService');
const dfux = aiService.providers.get(PROVIDERS.DFUX);
assert.strictEqual(dfux.name, 'dfux');
assert.strictEqual(dfux.model, 'qwen3-32b-ux');
console.log('  ✓ DFUXProvider registered and configured with model qwen3-32b-ux');

// 2. Test Connection
console.log('  Testing connection to local backend...');
const connResult = await dfux.testConnection();
console.log('  Connection result:', connResult);
assert.strictEqual(connResult.success, true, 'Backend connection should succeed');
assert.ok(connResult.message.includes('DF-UX Intelligence'), 'Message should confirm DF-UX Intelligence connection');
console.log('  ✓ testConnection() returned success with active model info');

// 3. Test Generate
console.log('  Testing generation with prompt...');
const genResult = await dfux.generate('Create an enterprise analytics dashboard with revenue charts and KPI cards', {});
assert.ok(genResult.intent, 'Generation should have an intent');
assert.ok(genResult.dfir, 'Generation should include validated DFIR');
assert.ok(Array.isArray(genResult.operations), 'Generation should include atomic operations');
assert.ok(genResult.operations.length > 0, 'Operations should have nodes');
console.log(`  ✓ generate() succeeded: Intent="${genResult.intent}", Operations=${genResult.operations.length}, RootNode="${genResult.dfir.root.name}"`);

// 4. Test apply via AIService
const initialCount = Object.keys(engine.getActivePage().nodes).length;
const planResult = await aiService.applyPlan(genResult, true);
const afterCount = Object.keys(engine.getActivePage().nodes).length;
assert.ok(afterCount > initialCount, `Nodes should be added to the canvas page (before: ${initialCount}, after: ${afterCount})`);
console.log(`  ✓ applyPlan() added ${afterCount - initialCount} native nodes to the canvas`);

// 5. Test undo
engine.undo();
const undoCount = Object.keys(engine.getActivePage().nodes).length;
assert.strictEqual(undoCount, initialCount, 'Undo should restore previous layer count');
console.log('  ✓ Atomic undo reverted generated nodes cleanly');

console.log('\n🎉 ALL DF-UX PROVIDER INTEGRATION TESTS PASSED!');
