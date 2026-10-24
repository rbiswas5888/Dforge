import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  SKETCH_FACES,
  SKETCH_TILES,
  SKETCH_GEMSTONES,
  SKETCH_GRADIENTS,
  initializeSketchData,
  getNextAvatarUrl,
  getNextTileUrl,
  getNextName,
  getNextCity,
  getNextProfile,
  applySketchDataSupplier,
  insertSketchUserProfileCard
} from '../src/editor-core/sketch-data-suppliers.js';
import { OFFICIAL_DOCS } from '../src/engine/learning.js';
import { createInitialDocument, createNode } from '../src/engine/document.js';
import { CommandEngine } from '../src/engine/commands.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

console.log('💎 1. Testing Sketch Filesystem Resources...');

// 1.1 Verify avatar images exist
const facesDir = path.join(projectRoot, 'assets/sketch-data/Faces');
assert(fs.existsSync(facesDir), 'Faces directory must exist');
const faceFiles = fs.readdirSync(facesDir).filter(f => f.endsWith('.jpg'));
assert.strictEqual(faceFiles.length, 125, 'Must contain exactly 125 face avatars from Sketch built-in data');

// 1.2 Verify texture tiles exist
const tilesDir = path.join(projectRoot, 'assets/sketch-data/Tiles');
assert(fs.existsSync(tilesDir), 'Tiles directory must exist');
const tileFiles = fs.readdirSync(tilesDir).filter(f => f.endsWith('.png'));
assert.strictEqual(tileFiles.length, 18, 'Must contain 18 pattern tiles from Sketch built-in data');

// 1.3 Verify presets and metadata
const presetsPath = path.join(projectRoot, 'assets/sketch-data/sketch-presets.json');
assert(fs.existsSync(presetsPath), 'sketch-presets.json must exist');
const presets = JSON.parse(fs.readFileSync(presetsPath, 'utf8'));
assert(presets.colors.length >= 16, 'Must contain 16 Sketch gemstone colors');
assert(presets.gradients.length >= 4, 'Must contain 4 Sketch gradient presets');

const namesPath = path.join(projectRoot, 'assets/sketch-data/names.json');
assert(fs.existsSync(namesPath), 'names.json must exist');
const names = JSON.parse(fs.readFileSync(namesPath, 'utf8'));
assert.strictEqual(names.length, 605, 'Must contain 605 human names from Sketch built-in data');

const citiesPath = path.join(projectRoot, 'assets/sketch-data/cities.json');
assert(fs.existsSync(citiesPath), 'cities.json must exist');
const cities = JSON.parse(fs.readFileSync(citiesPath, 'utf8'));
assert.strictEqual(cities.length, 251, 'Must contain 251 world cities from Sketch built-in data');

const profilesPath = path.join(projectRoot, 'assets/sketch-data/user-profiles.json');
assert(fs.existsSync(profilesPath), 'user-profiles.json must exist');
const profiles = JSON.parse(fs.readFileSync(profilesPath, 'utf8'));
assert.strictEqual(profiles.length, 10, 'Must contain 10 structured user profiles');

// 1.4 Verify Sketch MCP Documentation Guides
const docsDir = path.join(projectRoot, 'docs/sketch-mcp-guides');
assert(fs.existsSync(docsDir), 'Sketch MCP Guides directory must exist');
const docFiles = fs.readdirSync(docsDir).filter(f => f.endsWith('.md'));
assert.strictEqual(docFiles.length, 8, 'Must contain all 8 Sketch MCP documentation guides');
['mcp.md', 'layout.md', 'symbols.md', 'styling.md', 'prototyping.md', 'assets.md', 'use.md', 'troubleshooting.md'].forEach(g => {
  assert(fs.existsSync(path.join(docsDir, g)), `Guide ${g} must exist`);
});

console.log('✓ All Sketch filesystem assets, presets, and guides verified.');

console.log('⚡ 2. Testing Sketch Data Suppliers Engine...');

// Initialize data in Node.js environment
initializeSketchData();

// 2.1 Avatars rotation
const face1 = getNextAvatarUrl();
const face2 = getNextAvatarUrl();
assert(face1 && face1.startsWith('assets/sketch-data/Faces/'), 'Must return valid avatar path');
assert.notStrictEqual(face1, face2, 'Consecutive calls should rotate to next avatar');

// 2.2 Tiles rotation
const tile1 = getNextTileUrl();
const tile2 = getNextTileUrl();
assert(tile1 && tile1.startsWith('assets/sketch-data/Tiles/'), 'Must return valid tile path');
assert.notStrictEqual(tile1, tile2, 'Consecutive calls should rotate to next tile');

// 2.3 Names and Cities rotation
const name1 = getNextName();
const name2 = getNextName();
assert(name1 && typeof name1 === 'string' && name1.length > 0, 'Must return non-empty name');
assert.notStrictEqual(name1, name2, 'Consecutive calls should rotate to next name');

const city1 = getNextCity();
const city2 = getNextCity();
assert(city1 && typeof city1 === 'string' && city1.length > 0, 'Must return non-empty city');
assert.notStrictEqual(city1, city2, 'Consecutive calls should rotate to next city');

// 2.4 Profile record
const profile = getNextProfile();
assert(profile.name && profile.location && profile.handle && profile.avatar, 'User profile must have complete fields');

console.log('✓ Sketch Data Suppliers engine rotation verified.');

console.log('🛠️ 3. Testing CommandEngine Integration with Data Suppliers...');

const doc = createInitialDocument('Sketch Integration Test');
const engine = new CommandEngine(doc);

// 3.1 Applying avatar fill to a rectangle node
const rect = createNode('rectangle', { name: 'User Avatar Shape', transform: { x: 50, y: 50, width: 80, height: 80 } });
engine.addNode(rect, null);
engine.setSelection([rect.id]);

const faceApplied = applySketchDataSupplier(engine, 'faces');
assert.strictEqual(faceApplied.success, true);
assert.strictEqual(faceApplied.count, 1, 'Should apply face to 1 selected node');
const updatedRect = engine.getNode(rect.id);
assert(updatedRect.style.fills && updatedRect.style.fills.length > 0, 'Node must have fills');
assert.strictEqual(updatedRect.style.fills[0].type, 'image', 'Fill type must be image');
assert(updatedRect.style.fills[0].url.includes('Faces/'), 'Fill url must reference Sketch faces');

// 3.2 Applying tile fill to a frame node
const frame = createNode('frame', { name: 'Card Container', transform: { x: 200, y: 50, width: 300, height: 200 } });
engine.addNode(frame, null);
engine.setSelection([frame.id]);

const tileApplied = applySketchDataSupplier(engine, 'tiles');
assert.strictEqual(tileApplied.success, true);
assert.strictEqual(tileApplied.count, 1, 'Should apply tile to 1 selected node');
const updatedFrame = engine.getNode(frame.id);
assert.strictEqual(updatedFrame.style.fills[0].type, 'image', 'Fill type must be image');
assert.strictEqual(updatedFrame.style.fills[0].scaleMode, 'tile', 'Tile scaleMode must be tile');

// 3.3 Applying human name to a text layer
const textNode = createNode('text', { name: 'User Label', text: { content: 'Sample Placeholder' } });
engine.addNode(textNode, null);
engine.setSelection([textNode.id]);

const nameApplied = applySketchDataSupplier(engine, 'names');
assert.strictEqual(nameApplied.success, true);
assert.strictEqual(nameApplied.count, 1, 'Should apply name to text node');
const updatedText = engine.getNode(textNode.id);
assert.notStrictEqual(updatedText.text.content, 'Sample Placeholder', 'Text content should be updated');
assert(names.includes(updatedText.text.content), 'Content should be one of the official 605 Sketch names');

// 3.4 Inserting complete Sketch User Profile Auto-Layout Card
const cardId = insertSketchUserProfileCard(engine, 100, 100);
assert(cardId, 'Card must be created and returned');
const cardNode = engine.getNode(cardId);
assert(cardNode, 'Card node must exist in document');
assert.strictEqual(cardNode.type, 'frame');
assert.strictEqual(cardNode.layout.mode, 'vertical', 'Card must have vertical Auto Layout');
assert(cardNode.childIds && cardNode.childIds.length >= 2, 'Card must have childIds (avatar, text info)');

// Verify avatar inside card
const avatarChild = engine.getNode(cardNode.childIds[0]);
assert(avatarChild, 'Card must contain avatar child');
assert.strictEqual(avatarChild.type, 'ellipse', 'Avatar should be circular ellipse');
assert.strictEqual(avatarChild.style.fills[0].type, 'image');

console.log('✓ CommandEngine and Document mutations with Sketch data suppliers verified.');

console.log('📚 4. Testing Learning Center Official Docs Integration...');

const sketchDocs = OFFICIAL_DOCS.filter(d => d.section.startsWith('Sketch'));
assert.strictEqual(sketchDocs.length, 8, 'Learning Center must register all 8 Sketch architecture guides');
const mcpGuide = sketchDocs.find(d => d.title.includes('MCP') && d.title.includes('Protocol'));
assert(mcpGuide, 'Should find Sketch MCP Protocol Guide');
assert.strictEqual(mcpGuide.url, 'docs/sketch-mcp-guides/mcp.md');

console.log('✓ Learning Center documentation integration verified.');

console.log('💎 5. Testing Sketch Gemstones & Presets...');

assert(SKETCH_GEMSTONES.length >= 12, 'Must export at least 12 gemstone swatches');
const ruby = SKETCH_GEMSTONES.find(g => g.name === 'Ruby');
assert(ruby, 'Ruby gemstone swatch must exist');
assert.strictEqual(ruby.hex.toLowerCase(), '#e02020');

const emerald = SKETCH_GEMSTONES.find(g => g.name === 'Emerald');
assert(emerald, 'Emerald gemstone swatch must exist');
assert.strictEqual(emerald.hex.toLowerCase(), '#6dd400');

assert(SKETCH_GRADIENTS.length >= 4, 'Must export at least 4 gradient presets');
const diorite = SKETCH_GRADIENTS.find(g => g.name === 'Diorite');
assert(diorite, 'Diorite gradient must exist');
assert.strictEqual(diorite.stops.length, 2);

console.log('✓ Sketch gemstones and gradients verified.');

console.log('🏛️ 6. Testing Embedded Sketch Frameworks & Binaries Bridge...');

const {
  isSketchBridgeAvailable,
  getEmbeddedFrameworks,
  getSketchToolVersion,
  parseSketchDefaultKeyBindings,
  SKETCH_FRAMEWORKS_DIR,
  SKETCH_BIN_DIR
} = await import('../src/editor-core/sketch-cli-bridge.js');

// 6.1 Bridge availability
assert.strictEqual(await isSketchBridgeAvailable(), true, 'Sketch bridge must be available with embedded binaries and frameworks');

// 6.2 Frameworks verification
const frameworks = await getEmbeddedFrameworks();
assert(frameworks.length >= 35, `Must find all embedded frameworks in assets/sketch/Frameworks (found ${frameworks.length})`);
assert(frameworks.includes('BCFoundation.framework'), 'BCFoundation.framework must be embedded');
assert(frameworks.includes('SketchModel.framework'), 'SketchModel.framework must be embedded');
assert(frameworks.includes('SketchRendering.framework'), 'SketchRendering.framework must be embedded');
assert(frameworks.includes('SketchSVG.framework'), 'SketchSVG.framework must be embedded');
assert(frameworks.includes('SketchPrototyping.framework'), 'SketchPrototyping.framework must be embedded');

// 6.3 Embedded sketchtool CLI execution
const version = await getSketchToolVersion();
assert(version && version.includes('sketchtool Version'), 'sketchtool must execute and report valid version');
console.log(`   ✓ Embedded sketchtool executed successfully: "${version}"`);

// 6.4 KeyBindings parsing
const keybindings = await parseSketchDefaultKeyBindings();
assert(Object.keys(keybindings).length >= 10, 'Must parse at least 10 default Sketch keybindings');
assert.strictEqual(keybindings['Sketch.MSRectangleShapeAction']?.primary, 'r', 'Rectangle shortcut must be r');
assert.strictEqual(keybindings['Sketch.MSOvalShapeAction']?.primary, 'o', 'Oval shortcut must be o');
assert.strictEqual(keybindings['Sketch.MSInsertTextLayerAction']?.primary, 't', 'Text shortcut must be t');
assert.strictEqual(keybindings['Sketch.MSInsertVectorAction']?.primary, 'v', 'Vector shortcut must be v');
assert.strictEqual(keybindings['Sketch.MSInsertFrameAction']?.primary, 'f', 'Frame shortcut must be f');

console.log('✓ Embedded Frameworks, binaries, and KeyBindings verified.');

console.log('🛡️ 7. Testing Complete Autonomous Independence from External ../sketch...');

// Verify that all assets referenced in application exist internally
const internalSketchDir = path.join(projectRoot, 'assets/sketch');
assert(fs.existsSync(internalSketchDir), 'assets/sketch must exist inside designforge-ai');
assert(fs.existsSync(path.join(internalSketchDir, 'Frameworks')), 'Frameworks must exist inside designforge-ai');
assert(fs.existsSync(path.join(internalSketchDir, 'Resources')), 'Resources must exist inside designforge-ai');
assert(fs.existsSync(path.join(internalSketchDir, 'bin/sketchtool')), 'sketchtool must exist inside designforge-ai');
assert(fs.existsSync(path.join(internalSketchDir, 'bin/fig2sketch')), 'fig2sketch must exist inside designforge-ai');

// Ensure no source file in src/ contains a hardcoded path pointing outside to ../sketch
const srcFiles = fs.readdirSync(path.join(projectRoot, 'src'), { recursive: true })
  .filter(f => typeof f === 'string' && f.endsWith('.js'));

for (const relFile of srcFiles) {
  const fullPath = path.join(projectRoot, 'src', relFile);
  const code = fs.readFileSync(fullPath, 'utf8');
  assert(!code.includes('../sketch/'), `File src/${relFile} should not contain hardcoded ../sketch/ paths`);
}

console.log('✓ Complete autonomous independence verified (no external ../sketch dependencies).');

console.log('\n🎉 ALL SKETCH RESOURCE & AUTONOMY TESTS PASSED CLEANLY! (100% SUCCESS)\n');

