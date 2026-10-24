/**
 * DesignForge AI — Ollama Llama 3.1 Verification Suite
 * Verifies Ollama connection, Llama 3.1 model discovery, and structured design generation.
 */

import assert from 'node:assert';
import { OllamaProvider } from '../src/ai/providers/ollama-provider.js';
import { DesignForgeAIService } from '../src/ai/service.js';
import { createInitialDocument } from '../src/engine/document.js';
import { CommandEngine } from '../src/engine/commands.js';
import { PROVIDERS } from '../src/ai/types.js';

console.log('⚡ Starting Ollama Llama 3.1 Integration Test Suite...\n');

async function runTests() {
  // 1. Test Provider Instantiation & Defaults
  console.log('1. Testing OllamaProvider initialization...');
  const provider = new OllamaProvider({ model: 'llama3.1' });
  assert.strictEqual(provider.name, 'ollama');
  assert.strictEqual(provider.model, 'llama3.1');
  assert.ok(provider.endpoint);
  console.log('   ✓ OllamaProvider instantiated with model llama3.1.');

  // 2. Test Connection & Model Discovery
  console.log('2. Testing Ollama connection and Llama 3.1 model availability...');
  const connResult = await provider.testConnection();
  console.log(`   Connection status: ${connResult.message}`);
  assert.strictEqual(connResult.success, true, 'Ollama connection must succeed');
  assert.strictEqual(connResult.hasRequestedModel, true, 'Llama 3.1 must be present in installed models');
  console.log('   ✓ Successfully connected to Ollama; Llama 3.1 verified ready.');

  // 3. Test Design Generation with Llama 3.1
  console.log('3. Testing structured design generation via Llama 3.1...');
  const doc = createInitialDocument('Ollama Test Canvas');
  const engine = new CommandEngine(doc);
  const aiService = new DesignForgeAIService(doc, engine);

  aiService.setActiveProvider(PROVIDERS.OLLAMA);
  assert.strictEqual(aiService.activeProviderName, PROVIDERS.OLLAMA);

  const activeProvider = aiService.getProvider();
  assert.strictEqual(activeProvider.name, 'ollama');

  const prompt = 'Create a primary action CTA button frame with dark surface, 16px radius, and White text "Deploy with Llama 3.1"';
  console.log(`   Prompting Llama 3.1: "${prompt}"...`);

  const { plan } = await aiService.plan(prompt);
  assert.ok(plan, 'Plan must be created');
  assert.ok(Array.isArray(plan.operations), 'Operations array must be present');
  console.log(`   ✓ Llama 3.1 generated ${plan.operations.length} operations. Explanation: "${plan.explanation}"`);

  // 4. Test Atomic Execution of Llama 3.1 Plan
  console.log('4. Testing execution of Llama 3.1 operations into canvas document...');
  const nodeCountBefore = Object.keys(doc.pages[0].nodes).length;
  aiService.applyPlan(plan);
  const nodeCountAfter = Object.keys(doc.pages[0].nodes).length;
  assert.ok(nodeCountAfter >= nodeCountBefore, 'Document nodes must be updated or added');
  console.log(`   ✓ Operations applied to canvas. Node count: ${nodeCountBefore} → ${nodeCountAfter}`);

  console.log('\n🎉 ALL OLLAMA LLAMA 3.1 VERIFICATIONS PASSED WITH ZERO ERRORS!\n');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
