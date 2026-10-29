import assert from 'node:assert/strict';
import { createInitialDocument, createNode } from '../src/engine/document.js';
import { CommandEngine } from '../src/engine/commands.js';
import { ShortcutRegistry } from '../src/engine/shortcuts.js';

console.log('⚡ Starting Interactive Shape Builder Tool Test Suite...\n');

// 1. Test Shortcut Registration
console.log('1. Testing Shape Builder Tool Shortcut (Shift+M)...');
const mockApp = {
  activeTool: 'select',
  setTool(tool) {
    this.activeTool = tool;
  }
};
const shortcuts = new ShortcutRegistry(mockApp);
const shapeBuilderShortcut = shortcuts.shortcuts.find(s => s.id === 'toolShapeBuilder');
assert.ok(shapeBuilderShortcut, 'toolShapeBuilder shortcut is registered');
assert.equal(shapeBuilderShortcut.category, 'Tools', 'Belongs to Tools category');
assert.equal(shapeBuilderShortcut.macKey, '⇧M', 'Shortcut is Shift+M');

// Simulate Shift+M match
const testEvent = {
  key: 'M',
  shiftKey: true,
  metaKey: false,
  ctrlKey: false,
  altKey: false,
  preventDefault: () => {}
};
const matched = shapeBuilderShortcut.match(testEvent);
assert.equal(matched, true, 'Shift+M was matched by toolShapeBuilder shortcut');
shapeBuilderShortcut.handler();
assert.equal(mockApp.activeTool, 'shape_builder', 'Active tool switched to shape_builder');
console.log('   ✓ Shift+M successfully triggers Shape Builder tool.');

// 2. Test Shape Builder Merge (Union) Transaction
console.log('2. Testing Drag-Across Merge (Union) Operation...');
const doc = createInitialDocument('Shape Builder Test');
const page = doc.pages[0];
page.nodes = {};
page.rootIds = [];

const circleA = createNode('ellipse', {
  id: 'circleA',
  name: 'Circle A',
  transform: { x: 50, y: 50, width: 100, height: 100 }
});
const circleB = createNode('ellipse', {
  id: 'circleB',
  name: 'Circle B',
  transform: { x: 100, y: 50, width: 100, height: 100 }
});
page.nodes[circleA.id] = circleA;
page.nodes[circleB.id] = circleB;
page.rootIds.push(circleA.id, circleB.id);

const engine = new CommandEngine(doc);

// Dragging across Circle A and Circle B in Add mode (no Alt)
const unionGroupId = engine.booleanGroup(['circleA', 'circleB'], 'union');
assert.ok(unionGroupId, 'Shape builder merge generated Boolean Union Group');
const unionNode = page.nodes[unionGroupId];
assert.equal(unionNode.type, 'boolean_group', 'Group node type is boolean_group');
assert.equal(unionNode.booleanOperation, 'union', 'Operation is union');
assert.deepEqual(unionNode.childIds, ['circleA', 'circleB'], 'Children included in union group');
console.log('   ✓ Shape builder Add mode creates union boolean group.');

// 3. Test Shape Builder Subtract Transaction
console.log('3. Testing Drag-Across Subtract (Alt / Option) Operation...');
// Revert union
engine.undo();
assert.equal(page.nodes[unionGroupId], undefined, 'Union group undone');
assert.equal(page.nodes['circleA'].parentId, null, 'circleA restored to root');

// Dragging across with Alt held down (Subtract mode)
const subtractGroupId = engine.booleanGroup(['circleA', 'circleB'], 'subtract');
assert.ok(subtractGroupId, 'Shape builder subtract generated Boolean Subtract Group');
const subtractNode = page.nodes[subtractGroupId];
assert.equal(subtractNode.type, 'boolean_group', 'Group node type is boolean_group');
assert.equal(subtractNode.booleanOperation, 'subtract', 'Operation is subtract');
console.log('   ✓ Shape builder Subtract mode creates subtract boolean group.');

// 4. Test Undo / Redo
console.log('4. Testing Undo / Redo for Shape Builder Action...');
engine.undo();
assert.equal(page.nodes[subtractGroupId], undefined, 'Subtract group undone');
engine.redo();
assert.ok(page.nodes[subtractGroupId], 'Subtract group restored on redo');
assert.equal(page.nodes[subtractGroupId].booleanOperation, 'subtract', 'Operation persists on redo');
console.log('   ✓ Full undo / redo capability verified for shape builder operations.');

console.log('\n✅ All Shape Builder Tool tests PASSED!\n');
