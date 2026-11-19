/**
 * DesignForge AI — Multi-User Collaboration & Real-Time WebSocket Acceptance Suite
 * Conforms to Master Prompt Section 7.7
 */

import assert from 'node:assert';
import http from 'node:http';
import { WebSocket } from 'ws';

console.log('🧪 Starting DesignForge AI Multi-User Real-Time Collaboration Acceptance Suite...\n');

const PROJECT_ID = 'test-collab-project-' + Date.now();
const WS_URL = 'ws://127.0.0.1:3001/ws/collab';
const API_URL = 'http://127.0.0.1:3001';

async function fetchJson(endpoint, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, API_URL);
    const req = http.request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

function createClientSession(name, role, email) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL);
    const messages = [];

    ws.on('open', () => {
      ws.send(JSON.stringify({
        type: 'join',
        projectId: PROJECT_ID,
        user: {
          id: `user_${name.toLowerCase()}`,
          name,
          email,
          role
        }
      }));
    });

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        messages.push(msg);
      } catch (e) {}
    });

    ws.on('error', reject);

    // Wait for init
    const checkInit = setInterval(() => {
      const initMsg = messages.find(m => m.type === 'init');
      if (initMsg) {
        clearInterval(checkInit);
        resolve({ ws, messages, initMsg });
      }
    }, 50);

    setTimeout(() => {
      clearInterval(checkInit);
      reject(new Error(`Timeout waiting for init message for ${name}`));
    }, 4000);
  });
}

// 1. Dynamic Environment-Aware Share Link Generation
console.log('1. Testing Environment-Aware Share Link Generation (No Hardcoded 3000)...');
const shareRes = await fetchJson(`/api/collab/project/${PROJECT_ID}/share-link`, {
  method: 'POST',
  body: { role: 'editor', ttlHours: 48 }
});

assert.strictEqual(shareRes.status, 200, 'Share link API should return 200 OK');
assert.strictEqual(shareRes.body.success, true, 'Share link creation should succeed');
assert.ok(shareRes.body.shareUrl.includes('127.0.0.1:3001') || shareRes.body.shareUrl.includes('localhost:3001'), 'Share URL must use active host origin (not 3000)');
assert.ok(!shareRes.body.shareUrl.includes('3000'), 'Share URL must NOT contain obsolete port 3000');
assert.ok(shareRes.body.shareUrl.includes(PROJECT_ID), 'Share URL must contain valid projectId');
assert.ok(shareRes.body.token, 'Share URL must include secure token');
console.log(`   ✓ Share link generated: ${shareRes.body.shareUrl}`);

// 2. Multi-Session Connection (3 Independent Collaborators)
console.log('\n2. Connecting 3 Independent Client Sessions (Alice=Owner, Bob=Editor, Charlie=Viewer)...');
const alice = await createClientSession('Alice', 'owner', 'alice@designforge.ai');
assert.ok(alice.initMsg.clientId, 'Alice should receive unique clientId');
assert.strictEqual(alice.initMsg.role, 'owner', 'Alice should be initialized with Owner role');

const bob = await createClientSession('Bob', 'editor', 'bob@designforge.ai');
assert.ok(bob.initMsg.clientId, 'Bob should receive unique clientId');
assert.strictEqual(bob.initMsg.role, 'editor', 'Bob should be initialized with Editor role');
assert.ok(bob.initMsg.peers.some(p => p.user.name === 'Alice'), 'Bob should see Alice in peer list on join');

const charlie = await createClientSession('Charlie', 'viewer', 'charlie@clientcorp.com');
assert.ok(charlie.initMsg.clientId, 'Charlie should receive unique clientId');
assert.strictEqual(charlie.initMsg.role, 'viewer', 'Charlie should be initialized with Viewer role');
assert.strictEqual(charlie.initMsg.peers.length, 2, 'Charlie should see both Alice and Bob in peer list');
console.log('   ✓ All 3 independent client sessions successfully joined room.');

// 3. Real-Time Presence & Cursor Movement Synchronization
console.log('\n3. Testing Real-Time Cursor Movement Synchronization...');
alice.ws.send(JSON.stringify({
  type: 'presence',
  projectId: PROJECT_ID,
  cursor: { x: 450, y: 320 },
  selection: ['card_layer_1'],
  viewport: { panX: 0, panY: 0, zoom: 1 }
}));

await new Promise(r => setTimeout(r, 150));

const bobReceivedPresence = bob.messages.find(m => m.type === 'presence_update' && m.user?.name === 'Alice');
assert.ok(bobReceivedPresence, 'Bob should receive presence_update from Alice');
assert.strictEqual(bobReceivedPresence.cursor.x, 450, 'Bob should see exact cursor X coordinate');
assert.strictEqual(bobReceivedPresence.cursor.y, 320, 'Bob should see exact cursor Y coordinate');
assert.deepStrictEqual(bobReceivedPresence.selection, ['card_layer_1'], 'Bob should see Alice selection');

const charlieReceivedPresence = charlie.messages.find(m => m.type === 'presence_update' && m.user?.name === 'Alice');
assert.ok(charlieReceivedPresence, 'Charlie (Viewer) should also receive presence_update from Alice');
console.log('   ✓ Live cursor and selection synchronized across all clients.');

// 4. Document Operation Mutation & Broadcast
console.log('\n4. Testing Transactional Operation Broadcast (Alice edits -> Bob receives)...');
alice.ws.send(JSON.stringify({
  type: 'operation',
  projectId: PROJECT_ID,
  opId: 'op_edit_header_1',
  opType: 'update_node',
  commandName: 'Update Frame Dimensions',
  targetNodeId: 'hero_frame_1',
  payload: { bounds: { x: 0, y: 0, width: 1440, height: 800 } }
}));

await new Promise(r => setTimeout(r, 150));

const aliceAck = alice.messages.find(m => m.type === 'operation_ack' && m.opId === 'op_edit_header_1');
assert.ok(aliceAck, 'Alice should receive operation_ack with status committed');
assert.strictEqual(aliceAck.status, 'committed');

const bobReceivedOp = bob.messages.find(m => m.type === 'operation_broadcast' && m.opId === 'op_edit_header_1');
assert.ok(bobReceivedOp, 'Bob should receive operation_broadcast from Alice');
assert.strictEqual(bobReceivedOp.targetNodeId, 'hero_frame_1');
assert.strictEqual(bobReceivedOp.user.name, 'Alice');
console.log('   ✓ Transactional operation successfully committed and broadcasted to peers.');

// 5. Server-Side RBAC Enforcement (Viewer Modification Rejected)
console.log('\n5. Testing Server-Side RBAC Enforcement (Viewer mutation rejection)...');
charlie.ws.send(JSON.stringify({
  type: 'operation',
  projectId: PROJECT_ID,
  opId: 'op_unauthorized_edit',
  opType: 'delete_node',
  commandName: 'Malicious Delete',
  targetNodeId: 'hero_frame_1',
  payload: {}
}));

await new Promise(r => setTimeout(r, 150));

const charlieRejected = charlie.messages.find(m => m.type === 'operation_rejected' && m.opId === 'op_unauthorized_edit');
assert.ok(charlieRejected, 'Charlie (Viewer) MUST receive operation_rejected');
assert.ok(charlieRejected.reason.includes('read-only'), 'Rejection reason should indicate read-only access');

const bobDidNotReceive = bob.messages.find(m => m.opId === 'op_unauthorized_edit');
assert.strictEqual(bobDidNotReceive, undefined, 'Unauthorized operation MUST NOT be broadcasted to other clients');
console.log('   ✓ Server-side RBAC enforced: Viewer edit strictly rejected and quarantined.');

// 6. Soft Object Lease Manager (Concurrent Conflict Prevention)
console.log('\n6. Testing Soft Object Lease Management...');
bob.ws.send(JSON.stringify({
  type: 'request_lease',
  projectId: PROJECT_ID,
  nodeId: 'card_pricing_node',
  ttlMs: 5000
}));

await new Promise(r => setTimeout(r, 150));

const bobLeaseResponse = bob.messages.find(m => m.type === 'lease_response' && m.nodeId === 'card_pricing_node');
assert.ok(bobLeaseResponse, 'Bob should receive lease response');
assert.strictEqual(bobLeaseResponse.granted, true, 'Bob should be granted lease on node');

// Alice attempts to edit node while leased to Bob
alice.ws.send(JSON.stringify({
  type: 'operation',
  projectId: PROJECT_ID,
  opId: 'op_conflict_edit',
  opType: 'update_node',
  targetNodeId: 'card_pricing_node',
  payload: { transform: { x: 500, y: 500 } }
}));

await new Promise(r => setTimeout(r, 150));

const aliceLeaseConflict = alice.messages.find(m => m.type === 'operation_rejected' && m.opId === 'op_conflict_edit');
assert.ok(aliceLeaseConflict, 'Alice should be blocked while node is leased to Bob');
console.log('   ✓ Soft object lease prevents concurrent conflicting modifications.');

// 7. Clean Disconnection & Peer Left Notification
console.log('\n7. Testing Clean Disconnection & Real-Time Roster Departure...');
bob.ws.close();

await new Promise(r => setTimeout(r, 200));

const aliceReceivedDeparture = alice.messages.find(m => m.type === 'peer_left' && m.clientId === bob.initMsg.clientId);
assert.ok(aliceReceivedDeparture, 'Alice should receive peer_left notification when Bob disconnects');

const charlieReceivedDeparture = charlie.messages.find(m => m.type === 'peer_left' && m.clientId === bob.initMsg.clientId);
assert.ok(charlieReceivedDeparture, 'Charlie should receive peer_left notification when Bob disconnects');
console.log('   ✓ Real-time departure notifications verified on peer disconnect.');

// Cleanup
alice.ws.close();
charlie.ws.close();

console.log('\n🎉 ALL MULTI-USER COLLABORATION ACCEPTANCE TESTS PASSED (100% SPEC COMPLIANCE)!');
process.exit(0);
