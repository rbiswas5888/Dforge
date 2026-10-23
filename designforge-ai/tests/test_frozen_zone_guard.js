/**
 * DesignForge AI - Frozen Zone Integrity Guard CI Test
 * Verifies that zero files within the frozen zone (MCP, AI Engine, Providers, Security)
 * have been modified, renamed, moved, or corrupted.
 */

import assert from 'node:assert';
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🔒 Running Frozen Zone Cryptographic Hash Integrity Audit...\n');

// Master hash table matching docs/frozen-zone.md
const FROZEN_MANIFEST = {
  'src/mcp/client/client.js': 'a1d1e82401f30e7a630975d4e6517663e4f1f3240db9ac14dde37163e351171b',
  'src/mcp/client/manager.js': '05156b3ab01a0642ff22efa8f21a855677699743118962fb7c2c2afbb26170d8',
  'src/mcp/connectors/doc_server.js': '909b5f836901c5c23ffc269774b3bb6012404dd54f300a04eca87784edee62cd',
  'src/mcp/connectors/filesystem_server.js': '611fd0bcfd63077efdaea354d5ed9bdc9951f0d01c3d5aee45d616b3972a44b8',
  'src/mcp/connectors/git_server.js': '1f1422fffb7d1b3d12bee99df9a3f70162b376fb6e987eec4d4d2c95b67dd562',
  'src/mcp/index.js': '2368d89a3157e7f17c645e5f9e37626040e74d3a02623f44848117ceaea6da2d',
  'src/mcp/orchestrator/workflows.js': 'be59577dcbfc4a64029653b03b7e71c388b53fa046a439d0d46e0780d4341be2',
  'src/mcp/protocol/connection.js': '0df62298ccde88b9fb77386dc60a0120c26c8e3edf9641c53005446e466536dc',
  'src/mcp/protocol/transport.js': '0557603febfc2f7c185f94b0a1ccc3a11c47f4a9a5b103f2ac45a82cf34e4424',
  'src/mcp/protocol/types.js': '8bb61659a91e880888bac6a37593b87a61a1f988e2737377992c420b957a529d',
  'src/mcp/security/audit.js': '80f99d8fa393c30a460b8ac1cf8c888eb955c714f95177382f40bcef46ab3ecf',
  'src/mcp/security/permissions.js': 'c45b26706614bd146667c7822b1583abb9515f8513388815853090610f9ca580',
  'src/mcp/server/design_server.js': 'a335c60cc04e0b4ab71e783ba7698b80e682bff9c2de3766063627c29bc3975a',
  'src/mcp/server/server.js': 'b675aa7188f68a41f110c508ba106ef093045317d973de42743ecd4c5ae86d9f',
  'src/mcp/ui/hub.js': '0bde8eb505c9c64064f9292655fbf6c8dda409d947477efea0bf9ac7fe7c70de',
  'src/ai/context.js': '53cc5c2ac98d3288b7c33f13b85fdd8371e686d881789983c97ca121bb0448ca',
  'src/ai/intelligence.js': 'f0bfb581a67c26d8e604c31a06996fc2215ae943fce097a2e5a902480c7da463',
  'src/ai/markdown_parser.js': '6f98ef8543544cb37777d96e433822d44aa7e0eb13078c880b38af1f991ab1ee',
  'src/ai/operations.js': '2c7ec218d5c3d25bddfa31c9ccbf5dc4bd93db98538c99e5fc1d7a0bf5bc4965',
  'src/ai/providers/gemini-provider.js': 'e366da12dd601385245a8d5e595cbe363571e1435f80bda17a7039cba7c9ddb1',
  'src/ai/providers/local-provider.js': 'dc1be4ab290c0dcbb9b987ebce718daab496220c3834c59de572c8451d118492',
  'src/ai/providers/openai-provider.js': '0cd329be75308bf7d6aa304471d42e63d3adb5709e9277133a845303da0222cf',
  'src/ai/providers/provider-base.js': '27b493be1fb668445eb7890ce5cfef3da37a2075bd0717591621b14c47772190',
  'src/ai/service.js': '05532775ed3e63bbbaef0d34b1f7864eec9c5f155baf97193554387ae2cce731',
  'src/ai/types.js': '059fae7f135dfdef1c9c13018eaf7649d698cbdf473013cfc59e8f7616725824',
  'src/ai/validator.js': '2504222bdbe2f1895024ac1436ca8df4ba0932c0265bc849319d61225fbee5f0',
  'src/engine/ai.js': 'b4bf1e8837b9161948d1194623be7701bb03ebbc6ff421ba7bec507f7cb1e3e8'
};

let checkedCount = 0;
for (const [relPath, expectedHash] of Object.entries(FROZEN_MANIFEST)) {
  const fullPath = path.join(rootDir, relPath);
  assert.ok(fs.existsSync(fullPath), `Frozen file missing: ${relPath}`);
  const content = fs.readFileSync(fullPath);
  const actualHash = crypto.createHash('sha256').update(content).digest('hex');
  assert.strictEqual(
    actualHash,
    expectedHash,
    `FROZEN ZONE VIOLATION: Content of ${relPath} has been altered! Expected ${expectedHash}, got ${actualHash}`
  );
  checkedCount++;
}

console.log(`✅ All ${checkedCount} Frozen Zone files verified unchanged (100% SHA-256 match).\n`);
process.exit(0);
