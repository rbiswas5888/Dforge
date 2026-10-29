import assert from 'node:assert/strict';
import { CommandEngine } from '../src/engine/commands.js';
import { buildSelectionColorUpdates, collectSelectionColors } from '../src/editor-core/selection-colors.js';

const page = {
  id: 'page-selection-colors',
  nodes: {
    parent: {
      id: 'parent',
      type: 'group',
      visible: true,
      childIds: ['child', 'hidden'],
      style: {
        fills: [
          { type: 'solid', color: '#112233' },
          { type: 'linear-gradient', stops: [{ color: '#445566' }, { color: '#778899' }] }
        ],
        strokes: [
          { color: '#112233', width: 3 },
          { type: 'gradient', stops: [{ color: '#8899AA' }, { color: '#AABBCC' }] }
        ]
      }
    },
    child: {
      id: 'child',
      type: 'text',
      parentId: 'parent',
      visible: true,
      childIds: [],
      text: { content: 'Label', color: '#112233' },
      style: {
        fills: [{ type: 'solid', color: '#0000ff', tokenId: 'tok-blue', tokenName: 'Brand Blue' }],
        strokes: []
      },
      tokenBindings: { 'fills.0.color': 'tok-blue' }
    },
    unresolved: {
      id: 'unresolved',
      type: 'rectangle',
      visible: true,
      childIds: [],
      style: { fills: [{ type: 'solid', color: '#112233', tokenName: 'Removed Token' }], strokes: [] }
    },
    hidden: {
      id: 'hidden',
      type: 'rectangle',
      parentId: 'parent',
      visible: false,
      childIds: [],
      style: { fills: [{ type: 'solid', color: '#ff00ff' }], strokes: [] }
    }
  },
  rootIds: ['parent']
};
const document = { pages: [page] };
const engine = new CommandEngine(document, page.id);
const colors = collectSelectionColors(page, ['parent', 'child', 'unresolved'], [{ id: 'tok-blue', name: 'Brand Blue' }]);

assert.equal(colors.find(color => color.key === 'plain:#112233').count, 3);
assert.equal(colors.find(color => color.key === 'plain:#445566').kinds[0], 'gradient stop');
assert.equal(colors.find(color => color.key === 'plain:#8899AA').kinds[0], 'gradient stop');
assert.equal(colors.find(color => color.key === 'token:tok-blue').tokenName, 'Brand Blue');
assert.equal(colors.some(color => color.color === '#FF00FF'), false);
assert.equal(colors.find(color => color.key === 'plain:#112233').count, 3);
assert.equal(colors.find(color => color.key.startsWith('unresolved:')).unresolved, true);

const tokenColor = colors.find(color => color.key === 'token:tok-blue');
const updates = buildSelectionColorUpdates(page, tokenColor.targets, '#abcdef', { detachBindings: true });
assert.equal(engine.updateNodes(updates, 'Recolor Selection'), true);
assert.equal(engine.undoStack.length, 1, 'Bulk recoloring is one undoable command');
assert.equal(page.nodes.child.style.fills[0].color, '#ABCDEF');
assert.equal(page.nodes.child.style.fills[0].tokenId, undefined);
assert.equal(page.nodes.child.tokenBindings['fills.0.color'], undefined);
assert.equal(engine.undo(), true);
assert.equal(page.nodes.child.style.fills[0].color, '#0000ff');
assert.equal(page.nodes.child.style.fills[0].tokenId, 'tok-blue');
assert.equal(page.nodes.child.tokenBindings['fills.0.color'], 'tok-blue');
assert.equal(engine.redo(), true);
assert.equal(page.nodes.child.style.fills[0].color, '#ABCDEF');

const plainColor = colors.find(color => color.key === 'plain:#112233');
const plainUpdates = buildSelectionColorUpdates(page, plainColor.targets, '#fedcba');
engine.updateNodes(plainUpdates, 'Recolor Selection');
assert.equal(page.nodes.parent.style.fills[0].color, '#FEDCBA');
assert.equal(page.nodes.parent.style.strokes[0].color, '#FEDCBA');
assert.equal(page.nodes.child.text.color, '#FEDCBA');
assert.equal(page.nodes.parent.style.strokes[0].width, 3, 'Unrelated stroke geometry remains unchanged');
engine.undo();
assert.equal(page.nodes.parent.style.fills[0].color, '#112233');
assert.equal(page.nodes.parent.style.strokes[0].color, '#112233');
assert.equal(page.nodes.child.text.color, '#112233');

console.log('✓ Selection colors summarize visible fills, strokes, text, gradient stops, and linked colors; bulk recoloring detaches and undoes atomically.');
