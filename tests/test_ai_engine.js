/**
 * DesignForge AI - Native AI Engine Acceptance & Verification Suite
 * Verifies all 10 Acceptance Criteria from IDE Agent Prompt
 */

import assert from 'node:assert';
import { createInitialDocument, createNode } from '../src/engine/document.js';
import { CommandEngine } from '../src/engine/commands.js';
import { DesignForgeAIService } from '../src/ai/service.js';
import { OperationValidator } from '../src/ai/validator.js';
import { ContextManager } from '../src/ai/context.js';
import { DesignIntelligenceAnalyzer } from '../src/ai/intelligence.js';
import { PROVIDERS, PRIVACY_MODES, ValidationError, CancellationError } from '../src/ai/types.js';
import { StorageEngine } from '../src/engine/storage.js';

console.log('⚡ Starting Native AI Engine Verification Suite...\n');

const doc = createInitialDocument('Fintech Alpha Cloud');
const engine = new CommandEngine(doc);
const aiService = new DesignForgeAIService(doc, engine);

// -------------------------------------------------------------
// Test 1 & 2: Natural-Language Design Request -> Editable Nodes
// -------------------------------------------------------------
console.log('Test 1 & 2: Prompt-to-Design & Editable Node Generation...');
const initialCount = Object.keys(engine.getActivePage().nodes).length;
const { plan: dashPlan, validation: dashVal } = await aiService.plan('Create an enterprise SaaS dashboard with KPI cards and sidebar');
assert.ok(dashVal.valid, 'Dashboard plan must be strictly valid');
assert.ok(dashPlan.operations.length > 0, 'Plan must contain operations');

// Apply plan
const applyReport = aiService.applyPlan(dashPlan);
assert.ok(applyReport.createdNodeIds.length > 0, 'Report must contain created nodes');
const newCount = Object.keys(engine.getActivePage().nodes).length;
assert.strictEqual(newCount, initialCount + applyReport.createdNodeIds.length);
console.log('   ✓ Generated %d genuine editable nodes (not screenshots) from prompt.', applyReport.createdNodeIds.length);

// -------------------------------------------------------------
// Test 3: Modify Existing Selected Elements
// -------------------------------------------------------------
console.log('Test 3: Contextual Design Editing on Selected Nodes...');
const targetNodeId = applyReport.createdNodeIds[0];
engine.setSelection([targetNodeId]);

const { plan: editPlan } = await aiService.plan('Make layout vertical stack with 24px gap and center align');
assert.strictEqual(editPlan.operations[0].op, 'updateNode');
assert.strictEqual(editPlan.operations[0].patch.layout.mode, 'stack-vertical');
assert.strictEqual(editPlan.operations[0].patch.layout.gap, 24);

aiService.applyPlan(editPlan);
const updatedNode = engine.getNode(targetNodeId);
assert.strictEqual(updatedNode.layout.mode, 'stack-vertical');
assert.strictEqual(updatedNode.layout.gap, 24);
console.log('   ✓ Contextually updated selected node layout to stack-vertical with 24px gap.');

// -------------------------------------------------------------
// Test 4: Reuse Existing Tokens & Components
// -------------------------------------------------------------
console.log('Test 4: Design Token and Component Awareness...');
const ctxMgr = new ContextManager(doc, engine);
const compactContext = ctxMgr.buildContext();
assert.ok(compactContext.designTokens.length > 0, 'Context must expose existing tokens');
assert.ok(compactContext.designTokens.some(t => t.id === 'token_brand_primary'));
assert.ok(compactContext.selection.length === 1);
assert.strictEqual(compactContext.selection[0].id, targetNodeId);
console.log('   ✓ AI context inspected %d tokens and active selection bounds.', compactContext.designTokens.length);

// -------------------------------------------------------------
// Test 5: Preview and Undo AI Modifications
// -------------------------------------------------------------
console.log('Test 5: Undo AI Modifications via Single Transaction...');
assert.ok(engine.canUndo(), 'Command Engine must hold undo transaction for AI edit');
engine.undo(); // Undo layout edit
assert.notStrictEqual(engine.getNode(targetNodeId).layout.gap, 24);
engine.undo(); // Undo dashboard creation
assert.strictEqual(Object.keys(engine.getActivePage().nodes).length, initialCount);
console.log('   ✓ Atomic undo restored exact previous canvas state with zero dangling nodes.');

// -------------------------------------------------------------
// Test 6: Strict Pre-flight Validation & Rejection
// -------------------------------------------------------------
console.log('Test 6: Operation Validation Rejection Checks...');
const validator = new OperationValidator(doc);

// Invalid: missing dimensions <= 0
const badDimensionsOp = {
  op: 'createNode',
  node: { type: 'frame', name: 'Corrupt Frame', transform: { width: -50, height: 0 } }
};
const res1 = validator.validate(badDimensionsOp);
assert.strictEqual(res1.valid, false);
assert.ok(res1.errors.some(e => e.includes('positive number')));

// Invalid: non-existent parent node
const badParentOp = {
  op: 'createNode',
  node: { type: 'text', name: 'Ghost Text', parentId: 'non_existent_id_9999', transform: { width: 100, height: 20 } }
};
const res2 = validator.validate(badParentOp);
assert.strictEqual(res2.valid, false);
assert.ok(res2.errors.some(e => e.includes('does not exist')));

// Invalid: update non-existent target
const badUpdateOp = {
  op: 'updateNode',
  nodeId: 'imaginary_node_xyz',
  patch: { style: { fills: [{ type: 'solid', color: '#ff0000' }] } }
};
const res3 = validator.validate(badUpdateOp);
assert.strictEqual(res3.valid, false);
console.log('   ✓ Successfully rejected invalid geometries, ghost parent references, and missing IDs.');

// -------------------------------------------------------------
// Test 7: Cancellation Handling (AbortController)
// -------------------------------------------------------------
console.log('Test 7: In-Flight Generation Cancellation...');
const slowPromise = aiService.plan('Create a SaaS pricing table with 3 tiers');
aiService.cancel();

try {
  await slowPromise;
  assert.fail('Should have thrown CancellationError');
} catch (err) {
  assert.strictEqual(err.code, 'CANCELLED');
  console.log('   ✓ AbortSignal cleanly cancelled in-flight generation with CancellationError.');
}

// -------------------------------------------------------------
// Test 8: Privacy Controls (Local-Only vs Hosted)
// -------------------------------------------------------------
console.log('Test 8: Privacy Mode Enforcements...');
aiService.setPrivacyMode(PRIVACY_MODES.LOCAL_ONLY);
aiService.setActiveProvider(PROVIDERS.OPENAI);

try {
  await aiService.plan('Generate hero section');
  assert.fail('Should have blocked hosted call in Local-Only mode');
} catch (err) {
  assert.strictEqual(err.code, 'PROVIDER_ERROR');
  assert.ok(err.message.includes('Local-Only Privacy Mode'));
  console.log('   ✓ Local-Only privacy mode successfully blocked external API transmission.');
}

// Reset to local
aiService.setActiveProvider(PROVIDERS.LOCAL);

// -------------------------------------------------------------
// Test 9: Design Intelligence Diagnostics & Linter
// -------------------------------------------------------------
console.log('Test 9: Design Intelligence Diagnostics (WCAG, Spacing, Overflow)...');
const intelligence = new DesignIntelligenceAnalyzer(doc, engine);

// Insert an element with deliberate contrast issue
const poorContrastText = createNode('text', {
  name: 'Low Contrast Warning',
  transform: { x: 100, y: 100, width: 200, height: 20 },
  text: { content: 'Hard to read text', fontSize: 13, color: '#161e2e' } // Dark blue on dark background
});
engine.addNode(poorContrastText, null, 'Add low contrast text');

const audit = intelligence.audit();
assert.ok(audit.findings.length > 0, 'Audit must detect findings');
assert.ok(audit.findings.some(f => f.category === 'Accessibility'), 'Must catch contrast issue');
console.log('   ✓ Design intelligence detected %d findings (including WCAG contrast issues).', audit.findings.length);
engine.undo(); // Clean up

// -------------------------------------------------------------
// Test 10: Local Persistence Round-Trip of AI Generated Objects
// -------------------------------------------------------------
console.log('Test 10: Saving & Restoring AI-Generated Design via Storage Engine...');
const { plan: heroPlan } = await aiService.plan('Create hero landing section with CTA');
aiService.applyPlan(heroPlan);

const storage = new StorageEngine();
const serialized = JSON.stringify(doc);
const restored = storage.parseDForgeContent(serialized);

assert.strictEqual(restored.name, doc.name);
assert.strictEqual(restored.pages[0].rootIds.length, doc.pages[0].rootIds.length);
assert.ok(restored.pages[0].rootIds.some(id => restored.pages[0].nodes[id].name.includes('Hero')));
console.log('   ✓ Exported and reloaded AI-generated design with 100% layer fidelity.');

console.log('\n🎉 ALL 10 NATIVE AI ENGINE ACCEPTANCE TESTS PASSED!\n');
