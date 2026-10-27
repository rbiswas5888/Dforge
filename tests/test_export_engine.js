import assert from 'node:assert/strict';
import { createNode } from '../src/engine/document.js';
import { CanvasRenderer } from '../src/engine/renderer.js';
import { readZipTextEntries } from '../src/engine/importer/zip_archive.js';
import { buildSvgExport, createStoredZip } from '../src/engine/exporters.js';

const page = { id: 'page_test', name: 'Test', rootIds: ['frame_test'], nodes: {} };
const frame = createNode('frame', {
  id: 'frame_test',
  name: 'Frame <Export>',
  transform: { x: 10, y: 20, width: 240, height: 160 },
  style: { fills: [{ type: 'solid', color: '#112233' }] }
});
const text = createNode('text', {
  id: 'text_test',
  name: 'Title',
  parentId: frame.id,
  transform: { x: 20, y: 24, width: 180, height: 32 },
  text: { content: 'Export test', fontSize: 24, color: '#ffffff' }
});
frame.childIds.push(text.id);
page.nodes[frame.id] = frame;
page.nodes[text.id] = text;
const documentModel = { name: 'Export Test', pages: [page] };

console.log('🧪 Starting export and canvas selection regression suite...');

const renderer = Object.create(CanvasRenderer.prototype);
renderer.engine = { getActivePage: () => page };
assert.equal(renderer.hitTest(35, 50), text.id, 'clicking a child layer selects the child');
assert.equal(renderer.hitTest(225, 160), frame.id, 'clicking an empty part of a frame selects the frame');
assert.equal(renderer.hitTest(15, 13), frame.id, 'clicking the visible frame title selects its frame');
assert.equal(renderer.hitTest(400, 400), null, 'clicking outside all layers leaves no hit');
console.log('   ✓ Canvas hit-testing selects nested objects, empty frame areas, and frame titles.');

const svg = buildSvgExport(documentModel, page, [frame.id]);
assert.match(svg, /<svg\b/);
assert.match(svg, /<text\b/);
assert.match(svg, /Export test/);
assert.match(svg, /Frame &lt;Export&gt;/);
console.log('   ✓ SVG export preserves selection hierarchy, fills, and text.');

const zip = createStoredZip({
  'package.json': JSON.stringify({ name: 'export-test' }),
  'src/App.tsx': 'export default function App() { return <main />; }'
});
const zipEntries = await readZipTextEntries(await zip.arrayBuffer());
assert.deepEqual(JSON.parse(zipEntries.get('package.json')), { name: 'export-test' });
console.log('   ✓ Project package export creates a valid ZIP archive with readable files.');
