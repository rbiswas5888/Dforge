import assert from 'node:assert/strict';
import { createInitialDocument, createNode } from '../src/engine/document.js';
import { CommandEngine } from '../src/engine/commands.js';
import { CanvasRenderer } from '../src/engine/renderer.js';

console.log('⚡ Starting Transform Pivot & Reference Point Test Suite...\n');

// 1. Setup document & command engine
const doc = createInitialDocument('Pivot Test');
const page = doc.pages[0];
page.nodes = {};
page.rootIds = [];

const node1 = createNode('rectangle', {
  id: 'box1',
  name: 'Box 1',
  transform: { x: 100, y: 100, width: 200, height: 100, rotation: 0, pivot: { x: 0.5, y: 0.5 } }
});
page.nodes[node1.id] = node1;
page.rootIds.push(node1.id);

const engine = new CommandEngine(doc);

// Mock canvas and CanvasRenderer
const mockCanvas = {
  width: 800,
  height: 600,
  getContext: () => ({
    save: () => {},
    restore: () => {},
    translate: () => {},
    rotate: () => {},
    scale: () => {},
    beginPath: () => {},
    closePath: () => {},
    rect: () => {},
    roundRect: () => {},
    arc: () => {},
    fill: () => {},
    stroke: () => {},
    moveTo: () => {},
    lineTo: () => {},
    setLineDash: () => {},
    clearRect: () => {}
  })
};
const renderer = new CanvasRenderer(mockCanvas, engine);

console.log('1. Testing Default Pivot Point (Center: 0.5, 0.5)...');
assert.equal(node1.transform.pivot.x, 0.5, 'Default pivot X is 0.5');
assert.equal(node1.transform.pivot.y, 0.5, 'Default pivot Y is 0.5');
console.log('   ✓ Default pivot point verified.');

console.log('2. Testing 9-Point Cardinal & Corner Reference Matrix...');
const cardinalPoints = [
  { x: 0, y: 0, name: 'Top-Left' },
  { x: 0.5, y: 0, name: 'Top-Center' },
  { x: 1, y: 0, name: 'Top-Right' },
  { x: 0, y: 0.5, name: 'Center-Left' },
  { x: 0.5, y: 0.5, name: 'Center' },
  { x: 1, y: 0.5, name: 'Center-Right' },
  { x: 0, y: 1, name: 'Bottom-Left' },
  { x: 0.5, y: 1, name: 'Bottom-Center' },
  { x: 1, y: 1, name: 'Bottom-Right' }
];

cardinalPoints.forEach(pt => {
  engine.updateNode(node1.id, { transform: { pivot: { x: pt.x, y: pt.y } } }, `Set Pivot to ${pt.name}`);
  assert.equal(page.nodes[node1.id].transform.pivot.x, pt.x, `Pivot X matches ${pt.name}`);
  assert.equal(page.nodes[node1.id].transform.pivot.y, pt.y, `Pivot Y matches ${pt.name}`);
});
console.log('   ✓ All 9 matrix reference points update and persist correctly.');

console.log('3. Testing Hit-Testing for On-Canvas Pivot Marker...');
// Node at (100, 100), width 200, height 100.
// Let pivot be at (0.25, 0.75):
// pivot canvas X = 100 + 200 * 0.25 = 150
// pivot canvas Y = 100 + 100 * 0.75 = 175
engine.updateNode(node1.id, { transform: { pivot: { x: 0.25, y: 0.75 } } }, 'Custom Pivot Position');
const bounds = { x: 100, y: 100, width: 200, height: 100 };

assert.equal(renderer.hitTestPivot(150, 175, bounds, node1), true, 'Direct hit on pivot marker at (150, 175)');
assert.equal(renderer.hitTestPivot(155, 172, bounds, node1), true, 'Hit within 10px marker hit-radius');
assert.equal(renderer.hitTestPivot(200, 200, bounds, node1), false, 'Miss on distant canvas point');
console.log('   ✓ On-canvas draggable pivot marker hit-testing works with radius tolerance.');

console.log('4. Testing Pivot Undo and Redo History...');
engine.undo(); // Undoes Custom Pivot (reverts to Bottom-Right from step 2)
assert.equal(page.nodes[node1.id].transform.pivot.x, 1, 'Undo restored previous pivot X');
assert.equal(page.nodes[node1.id].transform.pivot.y, 1, 'Undo restored previous pivot Y');

engine.redo(); // Redoes Custom Pivot
assert.equal(page.nodes[node1.id].transform.pivot.x, 0.25, 'Redo reapplied custom pivot X');
assert.equal(page.nodes[node1.id].transform.pivot.y, 0.75, 'Redo reapplied custom pivot Y');
console.log('   ✓ Pivot updates support full transactional Undo / Redo.');

console.log('\n✅ All Transform Pivot & Reference Point tests PASSED!\n');
