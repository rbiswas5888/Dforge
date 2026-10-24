/**
 * Test Suite: Figma Design Page Functional Map Verification
 * 
 * Tests the shortcuts and operations mapped in `figma-design-page-functional-map.md`:
 * - Shift+D: Dev Mode toggle
 * - Shift+Enter / Enter: Hierarchy drill-up (parent) and drill-down (children)
 * - Tab / Shift+Tab: Sibling selection navigation
 * - Shift+A: Add Auto Layout
 * - Shift+H / Shift+V: Flip Horizontal / Vertical
 * - Cmd+Alt+C / Cmd+Alt+V: Copy / Paste Properties
 * - Cmd+Shift+K: Place Image
 * - Cmd+Alt+K: Create Component
 * - Cmd+Y: Toggle Outline Wireframe Mode
 * - Shift+R / Cmd+': Rulers & Layout Grid toggles
 * - Shift+0 / Shift+1 / Shift+2: Zoom presets
 */

import { strict as assert } from 'node:assert';
import { CentralInputRouter } from '../src/editor-core/input-router.js';

console.log('⚡ Starting Figma Functional Map Automated Test Suite...\n');

// Mock App State
class MockFigmaApp {
  constructor() {
    this.editingState = 'OBJECT_SELECT';
    this.activeTool = 'select';
    this.calls = [];
    this.clipboardProperties = null;

    // Document tree
    this.nodes = {
      root: { id: 'root', type: 'page', children: ['frame1'] },
      frame1: { id: 'frame1', type: 'frame', parent: 'root', children: ['child1', 'child2', 'child3'], x: 0, y: 0, width: 400, height: 300 },
      child1: { id: 'child1', type: 'rectangle', parent: 'frame1', x: 10, y: 10, width: 50, height: 50, fills: [{ type: 'solid', color: '#ff0000' }], cornerRadius: 4, opacity: 0.8 },
      child2: { id: 'child2', type: 'rectangle', parent: 'frame1', x: 70, y: 10, width: 50, height: 50, fills: [{ type: 'solid', color: '#00ff00' }], cornerRadius: 0 },
      child3: { id: 'child3', type: 'rectangle', parent: 'frame1', x: 130, y: 10, width: 50, height: 50, fills: [{ type: 'solid', color: '#0000ff' }] }
    };
    this.selection = [];
    this.devMode = false;
    this.outlineMode = false;
    this.showRulers = true;
    this.showGrid = true;
    this.zoom = 1;

    this.engine = {
      getSelection: () => this.selection,
      setSelection: (ids) => { this.selection = [...ids]; },
      getNode: (id) => this.nodes[id]
    };
  }

  // Functional Map Actions
  toggleDevMode() {
    this.devMode = !this.devMode;
    this.calls.push(`toggleDevMode:${this.devMode}`);
  }

  selectParent() {
    if (this.selection.length === 0) return;
    const first = this.nodes[this.selection[0]];
    if (first && first.parent && first.parent !== 'root') {
      this.selection = [first.parent];
      this.calls.push(`selectParent:${first.parent}`);
    }
  }

  selectChildren() {
    if (this.selection.length === 0) return;
    const first = this.nodes[this.selection[0]];
    if (first && first.children && first.children.length > 0) {
      this.selection = [...first.children];
      this.calls.push(`selectChildren:${this.selection.join(',')}`);
    }
  }

  selectNextSibling() {
    if (this.selection.length === 0) return;
    const currId = this.selection[0];
    const currNode = this.nodes[currId];
    if (!currNode || !currNode.parent) return;
    const parent = this.nodes[currNode.parent];
    if (!parent || !parent.children) return;
    const idx = parent.children.indexOf(currId);
    const nextIdx = (idx + 1) % parent.children.length;
    this.selection = [parent.children[nextIdx]];
    this.calls.push(`selectNextSibling:${this.selection[0]}`);
  }

  selectPrevSibling() {
    if (this.selection.length === 0) return;
    const currId = this.selection[0];
    const currNode = this.nodes[currId];
    if (!currNode || !currNode.parent) return;
    const parent = this.nodes[currNode.parent];
    if (!parent || !parent.children) return;
    const idx = parent.children.indexOf(currId);
    const prevIdx = (idx - 1 + parent.children.length) % parent.children.length;
    this.selection = [parent.children[prevIdx]];
    this.calls.push(`selectPrevSibling:${this.selection[0]}`);
  }

  addAutoLayoutToSelected() {
    this.calls.push('addAutoLayoutToSelected');
  }

  flipHorizontal() {
    this.calls.push('flipHorizontal');
  }

  flipVertical() {
    this.calls.push('flipVertical');
  }

  copyProperties() {
    if (this.selection.length === 0) return;
    const node = this.nodes[this.selection[0]];
    this.clipboardProperties = { fills: node.fills, cornerRadius: node.cornerRadius, opacity: node.opacity };
    this.calls.push('copyProperties');
  }

  pasteProperties() {
    if (!this.clipboardProperties || this.selection.length === 0) return;
    for (const id of this.selection) {
      const node = this.nodes[id];
      if (node) {
        if (this.clipboardProperties.fills) node.fills = JSON.parse(JSON.stringify(this.clipboardProperties.fills));
        if (this.clipboardProperties.cornerRadius !== undefined) node.cornerRadius = this.clipboardProperties.cornerRadius;
        if (this.clipboardProperties.opacity !== undefined) node.opacity = this.clipboardProperties.opacity;
      }
    }
    this.calls.push('pasteProperties');
  }

  triggerPlaceImage() {
    this.calls.push('triggerPlaceImage');
  }

  createComponentFromSelection() {
    this.calls.push('createComponentFromSelection');
  }

  toggleOutlineMode() {
    this.outlineMode = !this.outlineMode;
    this.calls.push(`toggleOutlineMode:${this.outlineMode}`);
  }

  toggleRulers() {
    this.showRulers = !this.showRulers;
    this.calls.push(`toggleRulers:${this.showRulers}`);
  }

  toggleGrid() {
    this.showGrid = !this.showGrid;
    this.calls.push(`toggleGrid:${this.showGrid}`);
  }

  zoom100() {
    this.zoom = 1.0;
    this.calls.push('zoom100');
  }

  zoomToFit() {
    this.calls.push('zoomToFit');
  }

  zoomToSelection() {
    this.calls.push('zoomToSelection');
  }
}

// 1. Dev Mode Toggle (Shift+D)
console.log('1. Testing Dev Mode Toggle (Shift+D)...');
const app = new MockFigmaApp();
const router = new CentralInputRouter(app);

router.handleKeyDown({ key: 'D', shiftKey: true, metaKey: false, ctrlKey: false, altKey: false, preventDefault: () => {} });
assert.strictEqual(app.devMode, true, 'Shift+D should toggle Dev Mode on');
router.handleKeyDown({ key: 'd', shiftKey: true, metaKey: false, ctrlKey: false, altKey: false, preventDefault: () => {} });
assert.strictEqual(app.devMode, false, 'Shift+D should toggle Dev Mode off');
console.log('   ✓ Dev Mode Toggle (Shift+D) verified.');

// 2. Hierarchy Drill-in & Drill-up (Enter & Shift+Enter)
console.log('2. Testing Hierarchy Navigation (Enter / Shift+Enter)...');
app.selection = ['frame1'];
router.handleKeyDown({ key: 'Enter', shiftKey: false, metaKey: false, ctrlKey: false, altKey: false, preventDefault: () => {} });
assert.deepStrictEqual(app.selection, ['child1', 'child2', 'child3'], 'Enter on frame should drill into children');

app.selection = ['child2'];
router.handleKeyDown({ key: 'Enter', shiftKey: true, metaKey: false, ctrlKey: false, altKey: false, preventDefault: () => {} });
assert.deepStrictEqual(app.selection, ['frame1'], 'Shift+Enter on child should select parent frame');
console.log('   ✓ Hierarchy Drill-in and Drill-up verified.');

// 3. Sibling Navigation (Tab / Shift+Tab)
console.log('3. Testing Sibling Selection (Tab / Shift+Tab)...');
app.selection = ['child1'];
router.handleKeyDown({ key: 'Tab', shiftKey: false, metaKey: false, ctrlKey: false, altKey: false, preventDefault: () => {} });
assert.deepStrictEqual(app.selection, ['child2'], 'Tab should advance selection to next sibling');

router.handleKeyDown({ key: 'Tab', shiftKey: false, metaKey: false, ctrlKey: false, altKey: false, preventDefault: () => {} });
assert.deepStrictEqual(app.selection, ['child3'], 'Tab should advance selection to next sibling');

router.handleKeyDown({ key: 'Tab', shiftKey: true, metaKey: false, ctrlKey: false, altKey: false, preventDefault: () => {} });
assert.deepStrictEqual(app.selection, ['child2'], 'Shift+Tab should retreat selection to previous sibling');
console.log('   ✓ Sibling Selection Navigation (Tab / Shift+Tab) verified.');

// 4. Auto Layout (Shift+A) & Flipping (Shift+H / Shift+V)
console.log('4. Testing Auto Layout (Shift+A) & Flipping (Shift+H / Shift+V)...');
router.handleKeyDown({ key: 'A', shiftKey: true, metaKey: false, ctrlKey: false, altKey: false, preventDefault: () => {} });
assert(app.calls.includes('addAutoLayoutToSelected'), 'Shift+A should trigger addAutoLayoutToSelected');

router.handleKeyDown({ key: 'H', shiftKey: true, metaKey: false, ctrlKey: false, altKey: false, preventDefault: () => {} });
assert(app.calls.includes('flipHorizontal'), 'Shift+H should trigger flipHorizontal');

router.handleKeyDown({ key: 'V', shiftKey: true, metaKey: false, ctrlKey: false, altKey: false, preventDefault: () => {} });
assert(app.calls.includes('flipVertical'), 'Shift+V should trigger flipVertical');
console.log('   ✓ Auto Layout and Flipping shortcuts verified.');

// 5. Copy & Paste Properties (Cmd+Alt+C / Cmd+Alt+V)
console.log('5. Testing Copy / Paste Properties (Cmd+Alt+C / Cmd+Alt+V)...');
app.selection = ['child1'];
router.handleKeyDown({ key: 'c', shiftKey: false, metaKey: true, ctrlKey: false, altKey: true, preventDefault: () => {} });
assert.strictEqual(app.clipboardProperties.cornerRadius, 4, 'Copied properties should contain cornerRadius: 4');
assert.strictEqual(app.clipboardProperties.opacity, 0.8, 'Copied properties should contain opacity: 0.8');

app.selection = ['child2'];
router.handleKeyDown({ key: 'v', shiftKey: false, metaKey: true, ctrlKey: false, altKey: true, preventDefault: () => {} });
assert.strictEqual(app.nodes.child2.cornerRadius, 4, 'Pasted properties should transfer cornerRadius');
assert.strictEqual(app.nodes.child2.opacity, 0.8, 'Pasted properties should transfer opacity');
console.log('   ✓ Copy & Paste Properties verified.');

// 6. Component Creation (Cmd+Alt+K) & Place Image (Cmd+Shift+K)
console.log('6. Testing Component (Cmd+Alt+K) & Place Image (Cmd+Shift+K)...');
router.handleKeyDown({ key: 'k', shiftKey: true, metaKey: true, ctrlKey: false, altKey: false, preventDefault: () => {} });
assert(app.calls.includes('triggerPlaceImage'), 'Cmd+Shift+K should trigger Place Image');

router.handleKeyDown({ key: 'k', shiftKey: false, metaKey: true, ctrlKey: false, altKey: true, preventDefault: () => {} });
assert(app.calls.includes('createComponentFromSelection'), 'Cmd+Alt+K should trigger createComponentFromSelection');
console.log('   ✓ Component Creation and Place Image verified.');

// 7. Outline Mode (Cmd+Y), Rulers (Shift+R), Grid (Cmd+')
console.log('7. Testing View Modes (Cmd+Y, Shift+R, Cmd+\')...');
router.handleKeyDown({ key: 'y', shiftKey: false, metaKey: true, ctrlKey: false, altKey: false, preventDefault: () => {} });
assert.strictEqual(app.outlineMode, true, 'Cmd+Y should toggle Outline Mode');

router.handleKeyDown({ key: 'R', shiftKey: true, metaKey: false, ctrlKey: false, altKey: false, preventDefault: () => {} });
assert.strictEqual(app.showRulers, false, 'Shift+R should toggle Rulers');

router.handleKeyDown({ key: "'", shiftKey: false, metaKey: true, ctrlKey: false, altKey: false, preventDefault: () => {} });
assert.strictEqual(app.showGrid, false, 'Cmd+\' should toggle Grid');
console.log('   ✓ View Modes shortcuts verified.');

// 8. Zoom Shortcuts (Shift+0, Shift+1, Shift+2)
console.log('8. Testing Zoom Presets (Shift+0, Shift+1, Shift+2)...');
router.handleKeyDown({ key: '0', shiftKey: true, metaKey: false, ctrlKey: false, altKey: false, preventDefault: () => {} });
assert(app.calls.includes('zoom100'), 'Shift+0 should zoom to 100%');

router.handleKeyDown({ key: '1', shiftKey: true, metaKey: false, ctrlKey: false, altKey: false, preventDefault: () => {} });
assert(app.calls.includes('zoomToFit'), 'Shift+1 should zoom to fit');

router.handleKeyDown({ key: '2', shiftKey: true, metaKey: false, ctrlKey: false, altKey: false, preventDefault: () => {} });
assert(app.calls.includes('zoomToSelection'), 'Shift+2 should zoom to selection');
console.log('   ✓ Zoom Presets verified.');

console.log('\n🎉 ALL FIGMA FUNCTIONAL MAP SHORTCUT & LOGIC TESTS PASSED 100%!\n');
