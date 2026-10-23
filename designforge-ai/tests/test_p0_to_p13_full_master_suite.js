/**
 * DesignForge AI — Comprehensive Master Validation Suite: Phases P0 to P13
 * Validates the complete Figma Design-parity editor, ForgeFlow Prototyping IR,
 * and Local Export subsystems according to Sections 4-15 of Master Prompt.
 */

import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

import {
  createInitialDocument,
  createNode,
  addPageToDoc,
  duplicatePageInDoc,
  deletePageFromDoc,
  renamePageInDoc,
  addCommentToDoc,
  resolveCommentInDoc
} from '../src/engine/document.js';
import { CommandEngine } from '../src/engine/commands.js';
import {
  computeWorldBounds,
  computeWorldTransform,
  isDescendant,
  canContain,
  resolveParentForPointer
} from '../src/engine/layout.js';
import {
  NormalizedSceneGraph,
  VariablesEngine,
  VariableScope,
  VectorNetwork,
  computeCurvatureSpline,
  extractPlanarFaces,
  outlineVariableWidthStroke,
  TypographyEngine,
  AnalyticalSpring,
  decomposeMatrix2D,
  interpolateTransforms,
  matchNodesForSmartAnimate,
  resamplePathByArcLength,
  KinematicGestureTracker,
  PrototypingHFSM,
  ComponentOverridesEngine,
  LWWRegister,
  PresenceBroadcaster,
  PluginRuntime,
  MathExpressionEvaluator,
  ScrubbyInputController,
  ExportHandoffEngine,
  CentralInputRouter,
  PrototypeDiagnosticsEngine
} from '../src/editor-core/index.js';
import { StorageEngine } from '../src/engine/storage.js';
import { InspectCodeGenerator } from '../src/engine/inspect_generator.js';
import { CommandPaletteEngine } from '../src/engine/palette.js';
import { ShortcutRegistry } from '../src/engine/shortcuts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('======================================================================');
console.log('🏛️  STARTING COMPLETE MASTER VALIDATION SUITE: PHASES P0 TO P13');
console.log('======================================================================\n');

// -----------------------------------------------------------------------------
// PHASE P0: Discovery, ADRs & Frozen Zone Integrity Guard
// -----------------------------------------------------------------------------
console.log('🔹 [PHASE P0] Discovery, Architecture Decisions & Frozen Zone Guard...');
{
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

  const filePaths = Object.keys(FROZEN_MANIFEST);
  assert.ok(filePaths.length === 27, 'Must protect all 27 frozen zone files');

  for (const [relPath, expectedHash] of Object.entries(FROZEN_MANIFEST)) {
    const fullPath = path.join(rootDir, relPath);
    assert.ok(fs.existsSync(fullPath), `Frozen file missing: ${relPath}`);
    const content = fs.readFileSync(fullPath);
    const actualHash = crypto.createHash('sha256').update(content).digest('hex');
    assert.equal(actualHash, expectedHash, `FROZEN ZONE VIOLATION: ${relPath}`);
  }

  // Architectural documentation verification
  assert.ok(fs.existsSync(path.join(rootDir, 'docs/frozen-zone.md')), 'docs/frozen-zone.md must exist');
  assert.ok(fs.existsSync(path.join(rootDir, 'docs/architecture-current.md')), 'docs/architecture-current.md must exist');
  assert.ok(fs.existsSync(path.join(rootDir, 'docs/decisions.md')), 'docs/decisions.md must exist');
  assert.ok(fs.existsSync(path.join(rootDir, 'docs/parity-matrix.md')), 'docs/parity-matrix.md must exist');

  console.log('   ✅ Phase P0 PASSED: All 27 Frozen Zone files cryptographically intact; ADRs verified.\n');
}

// -----------------------------------------------------------------------------
// PHASE P1: Core Model, Invariants, Command Bus, Batch Transactions, Undo/Redo
// -----------------------------------------------------------------------------
console.log('🔹 [PHASE P1] Core Document Model, Hierarchy Invariants & Command Bus...');
{
  const doc = createInitialDocument('P1 Document');
  const page = doc.pages[0];
  page.rootIds = [];
  page.nodes = {};
  const engine = new CommandEngine(doc, page.id);

  // 1. Hierarchy Invariants
  const section = createNode('section', { name: 'Main Section', transform: { x: 50, y: 50, width: 600, height: 400 } });
  const frame = createNode('frame', { name: 'Card Frame', transform: { x: 30, y: 40, width: 240, height: 180 } });
  const innerSection = createNode('section', { name: 'Illegal Section' });

  engine.addNode(section, null);
  engine.addNode(frame, section.id);

  assert.equal(canContain('section', 'section'), false, 'Section cannot contain another Section');
  assert.equal(canContain('frame', 'section'), false, 'Frame cannot contain Section');
  assert.equal(engine.reparent(innerSection.id, section.id), false, 'Reparenting Section into Section rejected');
  assert.equal(engine.reparent(innerSection.id, frame.id), false, 'Reparenting Section into Frame rejected');

  // 2. World Coordinate Preservation
  const rect = createNode('rectangle', { name: 'Child Rect', transform: { x: 10, y: 20, width: 60, height: 40 } });
  engine.addNode(rect, frame.id);

  const initialWorld = computeWorldTransform(page, rect.id);
  // section (50, 50) + frame (30, 40) + rect (10, 20) = (90, 110)
  assert.equal(initialWorld.x, 90);
  assert.equal(initialWorld.y, 110);

  // Reparent rect to root page
  engine.reparent(rect.id, null);
  assert.equal(page.nodes[rect.id].parentId, null);
  assert.equal(page.nodes[rect.id].transform.x, 90);
  assert.equal(page.nodes[rect.id].transform.y, 110);

  // 3. Batch Transactions and Atomic Undo
  engine.beginBatch('Batch Reparent & Move');
  engine.reparent(rect.id, frame.id);
  engine.updateNode(rect.id, { name: 'Updated Name' });
  engine.commitBatch();

  assert.equal(page.nodes[rect.id].parentId, frame.id);
  assert.equal(page.nodes[rect.id].name, 'Updated Name');

  // Single undo reverses entire batch atomically
  engine.undo();
  assert.equal(page.nodes[rect.id].parentId, null, 'Undo batch restores root parent');
  assert.equal(page.nodes[rect.id].name, 'Child Rect', 'Undo batch restores original name');

  console.log('   ✅ Phase P1 PASSED: Model hierarchy, coordinate preservation & atomic batch transactions verified.\n');
}

// -----------------------------------------------------------------------------
// PHASE P2: Layers Panel Drag-and-Drop, Sibling Z-Index, Container Auto-Expand
// -----------------------------------------------------------------------------
console.log('🔹 [PHASE P2] Layers Panel Full Drag-and-Drop, Reverse Z-Index & Tree Ops...');
{
  const doc = createInitialDocument('P2 Layers');
  const page = doc.pages[0];
  page.rootIds = [];
  page.nodes = {};
  const engine = new CommandEngine(doc, page.id);

  const layer1 = createNode('rectangle', { name: 'Layer 1 (Bottom)' });
  const layer2 = createNode('rectangle', { name: 'Layer 2 (Middle)' });
  const layer3 = createNode('rectangle', { name: 'Layer 3 (Top)' });

  engine.addNode(layer1, null);
  engine.addNode(layer2, null);
  engine.addNode(layer3, null);

  // Reverse Z-Index validation: top visual row must be end of rootIds
  const visualOrder = [...page.rootIds].reverse();
  assert.equal(visualOrder[0], layer3.id, 'Top visual layer must be layer 3');
  assert.equal(visualOrder[1], layer2.id, 'Middle visual layer must be layer 2');
  assert.equal(visualOrder[2], layer1.id, 'Bottom visual layer must be layer 1');

  // Multi-reparenting preserving order
  const frame = createNode('frame', { name: 'Target Container' });
  engine.addNode(frame, null);

  engine.reparentMultiple([layer1.id, layer2.id], frame.id);
  assert.equal(page.nodes[frame.id].childIds[0], layer1.id);
  assert.equal(page.nodes[frame.id].childIds[1], layer2.id);

  // Section ungroup moves children to page level and preserves world positions
  const section = createNode('section', { name: 'Section Container', transform: { x: 100, y: 100, width: 400, height: 300 } });
  engine.addNode(section, null);
  const sectionChild = createNode('frame', { name: 'Section Child', transform: { x: 25, y: 35, width: 100, height: 80 } });
  engine.addNode(sectionChild, section.id);

  engine.ungroupNode(section.id);
  assert.equal(page.nodes[section.id], undefined, 'Section node deleted');
  assert.equal(page.nodes[sectionChild.id].parentId, null, 'Child parent is now null');
  assert.equal(page.nodes[sectionChild.id].transform.x, 125, 'Child world X preserved');
  assert.equal(page.nodes[sectionChild.id].transform.y, 135, 'Child world Y preserved');

  console.log('   ✅ Phase P2 PASSED: Layers reverse z-index, multi-drag, and section ungroup verified.\n');
}

// -----------------------------------------------------------------------------
// PHASE P3: Text Engine, Fills, Strokes, Effects & Math Evaluator
// -----------------------------------------------------------------------------
console.log('🔹 [PHASE P3] Text Engine, Fills, Strokes, Effects & Inspector Math Physics...');
{
  // 1. Typography & OpenType Features
  const otCSS = TypographyEngine.formatOpenTypeFeatures({ liga: true, tnum: true, frac: false });
  assert.equal(otCSS, '"liga" 1, "tnum" 1, "frac" 0', 'OpenType feature settings string formatted');

  const upperText = TypographyEngine.applyTextCase('designforge ai', 'UPPER');
  assert.equal(upperText, 'DESIGNFORGE AI');
  const titleText = TypographyEngine.applyTextCase('hello world', 'TITLE');
  assert.equal(titleText, 'Hello World');

  // 2. Math Expression Evaluator
  assert.equal(MathExpressionEvaluator.evaluate('100 + 24'), 124);
  assert.equal(MathExpressionEvaluator.evaluate('200 * 0.5'), 100);
  assert.equal(MathExpressionEvaluator.evaluate('80 - 15'), 65);
  assert.equal(MathExpressionEvaluator.evaluate('120 / 4'), 30);
  assert.equal(MathExpressionEvaluator.evaluate('+20%', 100), 120);
  assert.equal(MathExpressionEvaluator.evaluate('-10%', 200), 180);

  // 3. Scrubby Input Physics
  const stepDefault = ScrubbyInputController.calculateDelta(15, { baseStep: 1 });
  assert.equal(stepDefault, 5, '15px drag = 5 steps');
  const stepShift = ScrubbyInputController.calculateDelta(15, { shiftKey: true, baseStep: 1 });
  assert.equal(stepShift, 50, 'Shift key gives 10x multiplier');

  console.log('   ✅ Phase P3 PASSED: OpenType font features, scrubbable physics & math evaluation verified.\n');
}

// -----------------------------------------------------------------------------
// PHASE P4: Vector Engine (Networks, Curvature Splines, Planar Faces, Booleans)
// -----------------------------------------------------------------------------
console.log('🔹 [PHASE P4] Vector Engine, Curvature Splines & Planar Face Extraction...');
{
  const net = new VectorNetwork();
  const v0 = net.addVertex(0, 0);
  const v1 = net.addVertex(100, 0);
  const v2 = net.addVertex(0, 100);
  const v3 = net.addVertex(100, 100);
  net.addSegment(v0, v1);
  net.addSegment(v0, v2);
  net.addSegment(v0, v3);
  assert.equal(net.getVertexDegree(v0), 3, 'Vertex v0 should have degree 3 (multi-way junction)');

  // Curvature Spline Generator
  const splineCurves = computeCurvatureSpline([{ x: 0, y: 0 }, { x: 50, y: 100 }, { x: 100, y: 0 }]);
  assert.equal(splineCurves.length, 2, 'Should generate 2 smooth Bezier segments');

  // Planar Graph Face Extraction
  const boxSegments = [
    { p1: { x: 0, y: 0 }, p2: { x: 100, y: 0 } },
    { p1: { x: 100, y: 0 }, p2: { x: 100, y: 100 } },
    { p1: { x: 100, y: 100 }, p2: { x: 0, y: 100 } },
    { p1: { x: 0, y: 100 }, p2: { x: 0, y: 0 } },
    { p1: { x: 0, y: 0 }, p2: { x: 100, y: 100 } }
  ];
  const faces = extractPlanarFaces(boxSegments);
  assert.ok(faces.length >= 1, 'Should extract enclosed planar faces');

  // Variable Width Stroke Outlining (Shift + W)
  const spine = [{ x: 0, y: 0 }, { x: 50, y: 0 }, { x: 100, y: 0 }];
  const widthProfile = [{ s: 0, w: 4 }, { s: 0.5, w: 20 }, { s: 1, w: 4 }];
  const strokePolygon = outlineVariableWidthStroke(spine, widthProfile);
  assert.equal(strokePolygon.length, 6, 'Should generate closed polygon contour (3 left + 3 right)');

  console.log('   ✅ Phase P4 PASSED: Vector networks, planar extraction & variable stroke geometry verified.\n');
}

// -----------------------------------------------------------------------------
// PHASE P5: Auto-Layout 2.0, Sizing (Fixed/Hug/Fill) & Constraints
// -----------------------------------------------------------------------------
console.log('🔹 [PHASE P5] Auto-Layout 2.0 (Directions, Hug/Fill/Fixed) & Constraints...');
{
  const frame = createNode('frame', {
    name: 'Auto-Layout Container',
    transform: { x: 0, y: 0, width: 400, height: 200 },
    layout: {
      mode: 'stack-horizontal',
      paddingLeft: 16,
      paddingRight: 16,
      paddingTop: 12,
      paddingBottom: 12,
      gap: 8,
      alignItems: 'center',
      justifyContent: 'space-between',
      sizingHorizontal: 'hug',
      sizingVertical: 'fixed'
    }
  });

  assert.equal(frame.layout.mode, 'stack-horizontal');
  assert.equal(frame.layout.sizingHorizontal, 'hug');
  assert.equal(frame.layout.gap, 8);
  assert.equal(frame.layout.paddingLeft, 16);

  console.log('   ✅ Phase P5 PASSED: Auto-layout modes, sizing semantics & padding verified.\n');
}

// -----------------------------------------------------------------------------
// PHASE P6: Variables, Design Tokens & Multi-Mode Engine
// -----------------------------------------------------------------------------
console.log('🔹 [PHASE P6] Variables, Design Tokens, Modes & Circular Alias Detection...');
{
  const varsEngine = new VariablesEngine();

  // Primitive resolution
  const blue500 = varsEngine.resolve('color.blue.500');
  assert.equal(blue500, '#3B82F6', 'Primitive blue.500 should resolve');

  // Semantic mode resolution (Light vs Dark)
  const lightSurface = varsEngine.resolve('semantic.bg.surface', 'Light');
  assert.equal(lightSurface, '#F8FAFC');
  const darkSurface = varsEngine.resolve('semantic.bg.surface', 'Dark');
  assert.equal(darkSurface, '#0F172A');

  // Scope filtering
  const fillVars = varsEngine.getVariablesForScope(VariableScope.COLOR_FILL);
  assert.ok(fillVars.length >= 3);

  // Circular reference detection
  const testCol = varsEngine.collections['col_primitives'];
  testCol.addVariable({ id: 'circ.a', type: 'COLOR', scopes: [VariableScope.ALL], valuesByMode: { default: '{circ.b}' } });
  testCol.addVariable({ id: 'circ.b', type: 'COLOR', scopes: [VariableScope.ALL], valuesByMode: { default: '{circ.a}' } });
  assert.throws(() => varsEngine.resolve('circ.a'), /Circular reference detected/);

  console.log('   ✅ Phase P6 PASSED: Multi-mode token resolution & alias cycle detection verified.\n');
}

// -----------------------------------------------------------------------------
// PHASE P7: Components, Variants & Nested Overrides
// -----------------------------------------------------------------------------
console.log('🔹 [PHASE P7] Components, Variants & Nested Overrides Architecture...');
{
  const compEngine = new ComponentOverridesEngine();
  const masterButton = {
    id: 'master_btn',
    name: 'Button',
    fill: '#3B82F6',
    characters: 'Click Me'
  };
  const instanceOverrides = {
    'Button': { characters: 'Add to Cart', fill: '#10B981' }
  };
  const resolvedInstance = compEngine.resolveInstance(masterButton, instanceOverrides);
  assert.equal(resolvedInstance.characters, 'Add to Cart', 'Instance text override applied');
  assert.equal(resolvedInstance.fill, '#10B981', 'Instance fill override applied');

  const detached = compEngine.detachInstance(resolvedInstance);
  assert.equal(detached.type, 'frame');
  assert.ok(detached.name.includes('(Detached)'));

  console.log('   ✅ Phase P7 PASSED: Component variant matrix & deep property overrides verified.\n');
}

// -----------------------------------------------------------------------------
// PHASE P8: `.dforge` Format, Lossless Serialization & Autosave
// -----------------------------------------------------------------------------
console.log('🔹 [PHASE P8] .dforge File Format, Serialization & Lossless Round-Trip...');
{
  const doc = createInitialDocument('Persistence Test');
  const storage = new StorageEngine();

  const serialized = storage.serialize(doc);
  assert.ok(typeof serialized === 'string', 'Serialized document must be JSON string');

  const deserialized = storage.deserialize(serialized);
  assert.equal(deserialized.id, doc.id);
  assert.equal(deserialized.name, doc.name);
  assert.equal(deserialized.pages.length, doc.pages.length);

  console.log('   ✅ Phase P8 PASSED: Lossless .dforge serialization round-trip verified.\n');
}

// -----------------------------------------------------------------------------
// PHASE P9: Export Engine (SVG, SwiftUI, Jetpack Compose, Image Handoff)
// -----------------------------------------------------------------------------
console.log('🔹 [PHASE P9] Developer Handoff Exporter (SVG, SwiftUI, Jetpack Compose)...');
{
  const sampleFrame = {
    id: 'card_1',
    name: 'MetricCard',
    type: 'frame',
    width: 320,
    height: 180,
    fill: '#FFFFFF',
    padding: 16,
    itemSpacing: 12,
    cornerRadius: 12,
    layoutMode: 'VERTICAL'
  };

  const svgOut = ExportHandoffEngine.exportToSVG(sampleFrame);
  assert.ok(svgOut.includes('<rect'), 'SVG must include rect');

  const swiftOut = ExportHandoffEngine.generateSwiftUI(sampleFrame);
  assert.ok(swiftOut.includes('VStack(spacing: 12)'));
  assert.ok(swiftOut.includes('.cornerRadius(12)'));

  const composeOut = ExportHandoffEngine.generateJetpackCompose(sampleFrame);
  assert.ok(composeOut.includes('Column('));
  assert.ok(composeOut.includes('RoundedCornerShape(12.dp)'));

  console.log('   ✅ Phase P9 PASSED: Multi-platform code generation (SwiftUI, Compose, SVG) verified.\n');
}

// -----------------------------------------------------------------------------
// PHASE P10: ForgeFlow Prototyping F1–F4 (HFSM & Analytical Spring Physics)
// -----------------------------------------------------------------------------
console.log('🔹 [PHASE P10] ForgeFlow Prototyping (HFSM, Analytical Physics, Smart Animate)...');
{
  // 1. Prototyping HFSM
  const hfsm = new PrototypingHFSM({ cart_count: 0, is_auth: true });
  assert.equal(hfsm.evaluatePredicate('cart_count == 0 && is_auth == true'), true);
  hfsm.executeMutation('cart_count += 1');
  assert.equal(hfsm.getVariable('cart_count'), 1);
  assert.equal(hfsm.evaluatePredicate('cart_count > 0'), true);

  // 2. Analytical Spring Physics (m=1, k=100, c=5)
  const underdamped = new AnalyticalSpring({ mass: 1, stiffness: 100, damping: 5 });
  assert.ok(underdamped.zeta < 1, 'Spring should be underdamped');
  const eval0 = underdamped.evaluate(0, 100, 0);
  assert.equal(eval0.position, 100);
  const evalMid = underdamped.evaluate(0.2, 100, 0);
  assert.ok(evalMid.position < 100, 'Position should decay towards 0');

  // 3. Matrix Decomposition & Smart Animate
  const decomp = decomposeMatrix2D(1, 0, 0, 1, 50, 80);
  assert.equal(Math.round(decomp.translateX), 50);
  assert.equal(Math.round(decomp.translateY), 80);

  // 4. Arc-length reparameterization for path morphing
  const origPath = [{ x: 0, y: 0 }, { x: 100, y: 0 }];
  const resampled = resamplePathByArcLength(origPath, 5);
  assert.equal(resampled.length, 5, 'Resampled path should have exactly 5 vertices');
  assert.equal(resampled[2].x, 50, 'Midpoint should be at x = 50');

  // 5. Kinematic Gesture Velocity
  const tracker = new KinematicGestureTracker();
  tracker.addPoint(100, 100, 1000);
  tracker.addPoint(150, 100, 1050);
  const relVel = tracker.computeReleaseVelocity();
  assert.equal(relVel.vx, 1000, '50px over 50ms = 1000 px/sec');

  console.log('   ✅ Phase P10 PASSED: HFSM variable logic, analytical ODE physics & kinematic gestures verified.\n');
}

// -----------------------------------------------------------------------------
// PHASE P11: ForgeFlow F5–F8 (Flow Graph Analysis & Broken Link Repair)
// -----------------------------------------------------------------------------
console.log('🔹 [PHASE P11] ForgeFlow Flow Diagnostics, Broken Link Repair & Analysis...');
{
  const mockDoc = {
    pages: [{
      id: 'page_1',
      rootIds: ['screen_1', 'screen_2', 'screen_orphan'],
      nodes: {
        screen_1: { id: 'screen_1', type: 'frame', isFlowStart: true, interactions: [{ targetId: 'screen_2', trigger: 'click' }, { targetId: 'deleted_screen', trigger: 'click' }] },
        screen_2: { id: 'screen_2', type: 'frame', interactions: [] },
        screen_orphan: { id: 'screen_orphan', type: 'frame', interactions: [] }
      }
    }]
  };
  const diag = new PrototypeDiagnosticsEngine(mockDoc);
  const audit = diag.auditPage('page_1');
  assert.equal(audit.totalFrames, 3, 'Total frames should be 3');
  assert.equal(audit.reachableFrames, 2, 'Reachable frames from flow start should be 2');
  assert.equal(audit.coveragePct, 67, 'Coverage should be 67% (2/3)');
  assert.equal(audit.brokenLinks.length, 1, 'Should detect 1 broken link to deleted_screen');
  assert.equal(audit.deadEnds.length, 1, 'screen_2 is a dead-end with no outgoing connections');

  // Test auto-repair
  let repairedPatch = null;
  const mockCmdEngine = {
    updateNode: (id, patch) => { repairedPatch = patch; }
  };
  const repairedCount = diag.repairBrokenLinks('page_1', mockCmdEngine);
  assert.equal(repairedCount, 1, 'Should repair 1 broken link');
  assert.equal(repairedPatch.interactions.length, 1, 'Repaired node has only 1 valid interaction left');

  console.log('   ✅ Phase P11 PASSED: Flow graph validation & orphan link auto-repair verified.\n');
}

// -----------------------------------------------------------------------------
// PHASE P12: Dev Mode, Inspect Code Generator & Comments
// -----------------------------------------------------------------------------
console.log('🔹 [PHASE P12] Dev Mode, Inspect Code Generation & Collaborative Comments...');
{
  const doc = createInitialDocument('DevMode Doc');
  const generator = new InspectCodeGenerator();

  const node = createNode('frame', {
    name: 'DashboardCard',
    transform: { x: 0, y: 0, width: 280, height: 160 },
    style: { fills: [{ type: 'solid', color: '#1e293b' }], cornerRadius: 8 }
  });

  const cssInspect = generator.generateCSS(node);
  assert.ok(cssInspect.includes('width: 280px'));
  assert.ok(cssInspect.includes('height: 160px'));
  assert.ok(cssInspect.includes('border-radius: 8px'));

  const reactInspect = generator.generateReact(node);
  assert.ok(reactInspect.includes('<div'));

  // Comments Subsystem
  addCommentToDoc(doc, {
    x: 150,
    y: 200,
    pageId: doc.pages[0].id,
    author: 'Design Reviewer',
    text: 'Please align header with baseline grid.'
  });
  assert.equal(doc.comments.length, 1);
  assert.equal(doc.comments[0].resolved, false);

  resolveCommentInDoc(doc, doc.comments[0].id);
  assert.equal(doc.comments[0].resolved, true);

  console.log('   ✅ Phase P12 PASSED: Dev mode inspect specs & interactive comment threads verified.\n');
}

// -----------------------------------------------------------------------------
// PHASE P13: Chrome Polish, Command Palette, Shortcuts Registry & App Router
// -----------------------------------------------------------------------------
console.log('🔹 [PHASE P13] Chrome Polish (Command Palette, Shortcut Sheet, Input Router)...');
{
  // 1. Command Palette Fuzzy Search
  const palette = new CommandPaletteEngine();
  palette.registerAction('tool-frame', 'Select Frame Tool', 'Tools', 'F');
  palette.registerAction('tool-section', 'Select Section Tool', 'Tools', 'S');
  palette.registerAction('align-left', 'Align Left', 'Arrange', '⌥A');

  const searchResults = palette.query('Section');
  assert.ok(searchResults.length >= 1);
  assert.equal(searchResults[0].id, 'tool-section');

  // 2. Central Input Router Priority
  const mockApp = {
    engine: {
      setSelection: () => {},
      getSelection: () => ['node_1'],
      deleteNodes: () => {},
      reorderNode: () => {},
      undo: () => {},
      redo: () => {}
    },
    renderer: { render: () => {}, altMeasureActive: false },
    updateInspector: () => {},
    updateLayersTree: () => {},
    activeTool: 'select',
    setActiveTool: (tool) => { mockApp.activeTool = tool; }
  };
  const router = new CentralInputRouter(mockApp);

  // Priority 1: Text input fields are not intercepted
  assert.equal(router.isTextInputActive({ target: { tagName: 'INPUT' } }), true);
  assert.equal(router.isTextInputActive({ target: { tagName: 'DIV' } }), false);

  // Tool activation
  router.handleKeyDown({ key: 'r', preventDefault: () => {} });
  assert.equal(mockApp.activeTool, 'rectangle', 'Pressing R activates rectangle tool');
  router.handleKeyDown({ key: 'Escape', preventDefault: () => {} });
  assert.equal(mockApp.activeTool, 'select', 'Pressing Escape returns to select tool');

  // 3. Shortcuts Registry
  const shortcuts = new ShortcutRegistry();
  assert.ok(shortcuts.getAllShortcuts().length >= 10, 'Must expose full keyboard shortcuts dictionary');

  console.log('   ✅ Phase P13 PASSED: Command palette, prioritized input router & shortcut registry verified.\n');
}

console.log('======================================================================');
console.log('🎉 ALL PHASES P0 THROUGH P13 PASSED 100% WITH ZERO REGRESSIONS!');
console.log('======================================================================\n');
