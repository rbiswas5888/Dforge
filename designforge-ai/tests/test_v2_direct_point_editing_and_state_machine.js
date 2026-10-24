/**
 * DesignForge AI — Revision v2 Precision Verification Suite
 * Tests Direct Point Editing, Double-Click State Machine, Corner Radius Handles,
 * Path Topology, Multi-Point Selection, Bézier Handles & Gesture-Safety Operations
 */

import assert from 'node:assert';
import {
  EDITING_STATES,
  HANDLE_MODES,
  ENTRY_SELECTION_POLICIES,
  routeDoubleClick,
  extractNodeAnchors,
  anchorsToVectorPath,
  applyEntrySelectionPolicy,
  deleteSelectedAnchors,
  nudgeAnchors,
  convertAnchorHandleMode,
  updateBezierHandle,
  getRectangleCornerHandles,
  calculateCornerRadiusFromDrag
} from '../src/editor-core/vector-engine.js';
import { CentralInputRouter } from '../src/editor-core/input-router.js';

console.log('⚡ Starting DesignForge AI — Revision v2 Precision Verification Suite...\n');

// -----------------------------------------------------------------------------
// 1. Double-Click Routing Table (§11.6, §11.7)
// -----------------------------------------------------------------------------
console.log('1. Testing Double-Click Routing State Machine (§11.7)...');

// Shapes/Vectors -> VECTOR_EDIT
const rectNode = { id: 'rect1', type: 'rectangle', name: 'Card Background', locked: false };
const starNode = { id: 'star1', type: 'star', name: 'Rating Star', locked: false };
const polyNode = { id: 'poly1', type: 'polygon', name: 'Badge Hexagon', locked: false };
const vectorNode = { id: 'vec1', type: 'vector', name: 'Wave Path', locked: false };

assert.strictEqual(routeDoubleClick(rectNode).state, EDITING_STATES.VECTOR_EDIT);
assert.strictEqual(routeDoubleClick(starNode).state, EDITING_STATES.VECTOR_EDIT);
assert.strictEqual(routeDoubleClick(polyNode).state, EDITING_STATES.VECTOR_EDIT);
assert.strictEqual(routeDoubleClick(vectorNode).state, EDITING_STATES.VECTOR_EDIT);

// Text -> TEXT_EDIT
const textNode = { id: 'text1', type: 'text', name: 'Heading', locked: false };
assert.strictEqual(routeDoubleClick(textNode).state, EDITING_STATES.TEXT_EDIT);

// Image -> IMAGE_CROP
const imgNode = { id: 'img1', type: 'image', name: 'Hero Photo', locked: false };
assert.strictEqual(routeDoubleClick(imgNode).state, EDITING_STATES.IMAGE_CROP);

// Group/Frame -> GROUP_DEEP_SELECT
const groupNode = { id: 'grp1', type: 'group', name: 'Nav Group', locked: false };
assert.strictEqual(routeDoubleClick(groupNode).state, EDITING_STATES.GROUP_DEEP_SELECT);

// Instance -> COMPONENT_INSTANCE_EDIT
const instNode = { id: 'inst1', type: 'instance', name: 'Primary Button', locked: false };
assert.strictEqual(routeDoubleClick(instNode).state, EDITING_STATES.COMPONENT_INSTANCE_EDIT);

// Locked -> LOCKED (Safe notification, no silent mutation)
const lockedNode = { id: 'locked1', type: 'rectangle', name: 'Watermark', locked: true };
const lockedRoute = routeDoubleClick(lockedNode);
assert.strictEqual(lockedRoute.state, 'LOCKED');
assert.ok(lockedRoute.message.includes('locked'));

console.log('   ✓ Double-click routing validated across shapes, text, images, groups, instances & locked layers.');

// -----------------------------------------------------------------------------
// 2. Vector Edit Entry Selection Policy (§11.6)
// -----------------------------------------------------------------------------
console.log('2. Testing Vector Edit Entry Selection Policy (underPointer, none, all)...');

const rectangle = {
  id: 'r1',
  type: 'rectangle',
  transform: { x: 100, y: 100, width: 200, height: 100 }
};
const bounds = { x: 100, y: 100, width: 200, height: 100 };

// 'all' policy: every anchor selected
const anchorsAll = extractNodeAnchors(rectangle);
applyEntrySelectionPolicy(anchorsAll, ENTRY_SELECTION_POLICIES.ALL);
assert.strictEqual(anchorsAll.length, 4);
assert.ok(anchorsAll.every(a => a.selected === true));

// 'none' policy: every anchor unselected
const anchorsNone = extractNodeAnchors(rectangle);
applyEntrySelectionPolicy(anchorsNone, ENTRY_SELECTION_POLICIES.NONE);
assert.ok(anchorsNone.every(a => a.selected === false));

// 'underPointer' policy: click near top-right corner (300, 100)
const anchorsPointer = extractNodeAnchors(rectangle);
applyEntrySelectionPolicy(anchorsPointer, ENTRY_SELECTION_POLICIES.UNDER_POINTER, { x: 298, y: 102 }, bounds);
assert.strictEqual(anchorsPointer[1].selected, true); // (w, 0) top-right anchor
assert.strictEqual(anchorsPointer[0].selected, false);
assert.strictEqual(anchorsPointer[2].selected, false);
assert.strictEqual(anchorsPointer[3].selected, false);

console.log('   ✓ Entry selection policies (underPointer, none, all) validated with coordinate hit precision.');

// -----------------------------------------------------------------------------
// 3. Multi-Point Selection & Nudge (§11.8)
// -----------------------------------------------------------------------------
console.log('3. Testing Multi-Point Selection & Nudge Delta Translation (§11.8)...');

const testAnchors = extractNodeAnchors(rectangle);
// Select anchors 0 and 1 (top edge)
testAnchors[0].selected = true;
testAnchors[1].selected = true;

nudgeAnchors(testAnchors, [0, 1], 15, -10);

assert.strictEqual(testAnchors[0].x, 15);
assert.strictEqual(testAnchors[0].y, -10);
assert.strictEqual(testAnchors[1].x, 215);
assert.strictEqual(testAnchors[1].y, -10);
// Bottom anchors remain untouched
assert.strictEqual(testAnchors[2].x, 200);
assert.strictEqual(testAnchors[2].y, 100);
assert.strictEqual(testAnchors[3].x, 0);
assert.strictEqual(testAnchors[3].y, 100);

console.log('   ✓ Multi-point nudge translated target anchors while preserving unselected topology.');

// -----------------------------------------------------------------------------
// 4. Bézier Handle Modes & Tangents (§11.9)
// -----------------------------------------------------------------------------
console.log('4. Testing Bézier Handle Modes (Corner, Smooth, Symmetric, Aligned) (§11.9)...');

const bezierAnchor = {
  x: 50,
  y: 50,
  handleIn: { x: -20, y: 0 },
  handleOut: { x: 20, y: 0 },
  type: HANDLE_MODES.CORNER
};

// Convert to corner: zeroes out handles
convertAnchorHandleMode(bezierAnchor, HANDLE_MODES.CORNER);
assert.strictEqual(bezierAnchor.handleIn.x, 0);
assert.strictEqual(bezierAnchor.handleOut.x, 0);

// Convert to symmetric: provides equal collinear handles
convertAnchorHandleMode(bezierAnchor, HANDLE_MODES.SYMMETRIC);
assert.strictEqual(bezierAnchor.handleOut.x, 20);
assert.strictEqual(bezierAnchor.handleIn.x, -20);

// Drag handleOut in symmetric mode: handleIn automatically mirrors opposite
updateBezierHandle(bezierAnchor, 'out', 30, 15, HANDLE_MODES.SYMMETRIC);
assert.strictEqual(bezierAnchor.handleOut.x, 30);
assert.strictEqual(bezierAnchor.handleOut.y, 15);
assert.strictEqual(bezierAnchor.handleIn.x, -30);
assert.strictEqual(bezierAnchor.handleIn.y, -15);

console.log('   ✓ Bézier handle tangents & symmetric reflection validated.');

// -----------------------------------------------------------------------------
// 5. Path Topology & Anchor Deletion (§11.10)
// -----------------------------------------------------------------------------
console.log('5. Testing Path Topology & Anchor Deletion Safety (§11.10)...');

const quadAnchors = extractNodeAnchors(rectangle);
// Delete 1 point from 4-point closed contour: valid (3 points remain)
const delRes1 = deleteSelectedAnchors(quadAnchors, [0], true);
assert.strictEqual(delRes1.success, true);
assert.strictEqual(delRes1.remaining.length, 3);

// Delete 2 points from 3-point closed contour: safely rejected to protect minimum contour topology
const delRes2 = deleteSelectedAnchors(delRes1.remaining, [0, 1], true);
assert.strictEqual(delRes2.success, false);
assert.ok(delRes2.message.includes('at least 3 points'));

console.log('   ✓ Topology safety rules protect minimum closed/open path contour constraints.');

// -----------------------------------------------------------------------------
// 6. Parametric Shape Corner Handles for Rectangles (§11.11)
// -----------------------------------------------------------------------------
console.log('6. Testing Parametric Shape Corner Handles & Direct Drag (§11.11)...');

const rectBounds = { x: 50, y: 50, width: 200, height: 120 };
const cornerHandles = getRectangleCornerHandles(rectBounds, 16);

assert.strictEqual(cornerHandles.length, 4);
assert.strictEqual(cornerHandles[0].key, 'nw');
assert.strictEqual(cornerHandles[0].x, 50 + 16);
assert.strictEqual(cornerHandles[0].y, 50 + 16);

assert.strictEqual(cornerHandles[2].key, 'se');
assert.strictEqual(cornerHandles[2].x, 50 + 200 - 16);
assert.strictEqual(cornerHandles[2].y, 50 + 120 - 16);

// Dragging 'nw' corner handle inward
const newRadius = calculateCornerRadiusFromDrag('nw', { x: 74, y: 74 }, rectBounds);
assert.strictEqual(newRadius, 24);

console.log('   ✓ Rectangle corner radius handles & drag calculation validated.');

// -----------------------------------------------------------------------------
// 7. Input Router Keyboard Routing (§11.6, §11.7)
// -----------------------------------------------------------------------------
console.log('7. Testing Input Router Scoped Hotkeys (Escape, Enter, Scoped Cmd+A)...');

let vectorEditExited = false;
let allAnchorsSelected = false;
let anchorsDeleted = false;
let vectorEditEntered = false;

const mockApp = {
  editingState: 'VECTOR_EDIT',
  engine: {
    getSelection: () => ['rect1'],
    getNode: (id) => ({ id, type: 'rectangle', locked: false }),
    setSelection: () => {}
  },
  exitVectorEdit: () => { vectorEditExited = true; },
  selectAllAnchors: () => { allAnchorsSelected = true; },
  deleteSelectedAnchors: () => { anchorsDeleted = true; },
  enterVectorEdit: () => { vectorEditEntered = true; }
};

const router = new CentralInputRouter(mockApp);

// Escape exits Vector Edit Mode
router.handleKeyDown({ key: 'Escape', preventDefault: () => {} });
assert.strictEqual(vectorEditExited, true);

// Cmd+A in Vector Edit Mode selects all anchors in active path, not canvas
router.handleKeyDown({ key: 'a', metaKey: true, preventDefault: () => {} });
assert.strictEqual(allAnchorsSelected, true);

// Delete deletes selected points
router.handleKeyDown({ key: 'Delete', preventDefault: () => {} });
assert.strictEqual(anchorsDeleted, true);

// Enter in VECTOR_EDIT commits and exits Vector Edit Mode
vectorEditExited = false;
mockApp.editingState = 'VECTOR_EDIT';
router.handleKeyDown({ key: 'Enter', preventDefault: () => {} });
assert.strictEqual(vectorEditExited, true, 'Enter in VECTOR_EDIT must commit and exit vector edit mode');

// In OBJECT_SELECT, Enter enters Vector Edit Mode
mockApp.editingState = 'OBJECT_SELECT';
router.handleKeyDown({ key: 'Enter', preventDefault: () => {} });
assert.strictEqual(vectorEditEntered, true);

console.log('   ✓ Scoped Cmd/Ctrl+A, Escape, Delete & Enter keyboard dispatch verified.');

// -----------------------------------------------------------------------------
// 8. Live Vector Path Rendering & Segment Hit-Testing (Figma Click-to-Add)
// -----------------------------------------------------------------------------
console.log('8. Testing Live Vector Path Rendering & Segment Hit-Testing...');

import('../src/engine/renderer.js').then(({ CanvasRenderer }) => {
  const dummyCanvas = { getContext: () => ({ moveTo: () => {}, lineTo: () => {}, bezierCurveTo: () => {}, closePath: () => {} }) };
  const renderer = new CanvasRenderer(dummyCanvas, {});
  renderer.zoom = 1.0;

  const rectBounds = { x: 100, y: 100, width: 120, height: 80 };
  const rectAnchors = [
    { x: 0, y: 0, handleIn: { x: 0, y: 0 }, handleOut: { x: 0, y: 0 } },
    { x: 120, y: 0, handleIn: { x: 0, y: 0 }, handleOut: { x: 0, y: 0 } },
    { x: 120, y: 80, handleIn: { x: 0, y: 0 }, handleOut: { x: 0, y: 0 } },
    { x: 0, y: 80, handleIn: { x: 0, y: 0 }, handleOut: { x: 0, y: 0 } }
  ];

  // Click on top edge segment at (160, 100) -> should detect segment 0-1 and insert at index 1
  const segHit = renderer.hitTestVectorSegment(160, 100, rectBounds, rectAnchors, true);
  assert(segHit !== null, 'Clicking on top edge segment should hit vector segment');
  assert.strictEqual(segHit.insertIndex, 1, 'Insertion index should be between anchor 0 and anchor 1');
  assert.strictEqual(Math.round(segHit.x), 60, 'Relative x coordinate should be 60');
  assert.strictEqual(Math.round(segHit.y), 0, 'Relative y coordinate should be 0');

  // Verify drawVectorPathFromAnchors doesn't crash on canvas mock
  const mockCtx = {
    ops: [],
    moveTo(x, y) { this.ops.push(`M ${x} ${y}`); },
    lineTo(x, y) { this.ops.push(`L ${x} ${y}`); },
    bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y) { this.ops.push(`C ${x} ${y}`); },
    closePath() { this.ops.push('Z'); }
  };
  renderer.drawVectorPathFromAnchors(mockCtx, rectBounds, rectAnchors, true);
  assert.strictEqual(mockCtx.ops[0], 'M 100 100');
  assert.strictEqual(mockCtx.ops[mockCtx.ops.length - 1], 'Z');

  console.log('   ✓ Vector segment hit-testing (click-to-add) & anchor-to-path renderer verified.');
  console.log('\n🎉 ALL REVISION V2 DIRECT EDITING & STATE MACHINE TESTS PASSED 100%!\n');
});
