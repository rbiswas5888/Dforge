/**
 * DesignForge AI — Flagship Systems & Prototyping Engine Verification Suite
 * Exhaustively tests:
 * 1. Normalized Scene Graph, Section hierarchy invariants & MIXED Sentinel Reducer
 * 2. Variables, Design Tokens, Multi-Mode Engine & Circular Alias Detection
 * 3. Hybrid Vector Engine, Curvature Splines, Planar Face Extraction & Variable Width Outlining
 * 4. Typography, OpenType & Text Engine
 * 5. Analytical Spring-Mass-Damper Physics Engine, Velocity Inheritance & Bipartite Matching
 * 6. Component Variants & Sketch-Style Override Tree
 * 7. Multiplayer LWW-CRDT & Presence Broadcasting
 * 8. Sandboxed Plugin Runtime
 * 9. Developer Handoff (SVG, SwiftUI, Jetpack Compose)
 * 10. Inspector Ergonomics & Math Expression Evaluator
 */

import assert from 'assert';
import {
  NormalizedSceneGraph,
  reduceMixedProperty,
  Bindable,
  MIXED_SENTINEL,
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

console.log('🏛 Starting Flagship Architecture & Mathematical Verification Suite...\n');

// ----------------------------------------------------
// 1. Normalized Scene Graph & Hierarchy Rules
// ----------------------------------------------------
console.log('1. Testing Normalized Scene Graph & Hierarchy Rules...');
const graph = new NormalizedSceneGraph('page_test');

// Add Section (must live on root)
const section = graph.addNode({
  id: 'sec_1',
  type: 'section',
  name: 'Auth Section',
  x: 100,
  y: 100,
  width: 800,
  height: 600
});
assert.strictEqual(section.parentId, null, 'Section must have parentId = null');
assert.ok(graph.rootIds.includes('sec_1'), 'Section must reside in rootIds');

// Try reparenting section into a frame (must be rejected)
const frameA = graph.addNode({
  id: 'frame_a',
  type: 'frame',
  name: 'Screen A',
  x: 150,
  y: 150,
  width: 375,
  height: 812
});
const reparentSectionRes = graph.reparent('sec_1', 'frame_a');
assert.strictEqual(reparentSectionRes, false, 'Reparenting section into frame must be rejected');

// Reparent Frame into Section with World Coordinate Preservation
// Frame starts at world (150, 150). Section is at (100, 100).
// In Section local space, frame should become (50, 50).
const reparentFrameRes = graph.reparent('frame_a', 'sec_1');
assert.strictEqual(reparentFrameRes, true, 'Reparenting frame into section must succeed');
const updatedFrame = graph.getNode('frame_a');
assert.strictEqual(updatedFrame.parentId, 'sec_1');
assert.strictEqual(updatedFrame.x, 50, 'Local X must convert to 50');
assert.strictEqual(updatedFrame.y, 50, 'Local Y must convert to 50');
const worldPos = graph.getWorldTransform('frame_a');
assert.strictEqual(worldPos.x, 150, 'World X must remain 150');
assert.strictEqual(worldPos.y, 150, 'World Y must remain 150');

// Section Containment Detection
const containingSecId = graph.findContainingSection('frame_a');
assert.strictEqual(containingSecId, 'sec_1', 'Frame center should be detected inside sec_1');

// MIXED Sentinel Reducer
const node1 = { fill: '#3B82F6', opacity: 1 };
const node2 = { fill: '#3B82F6', opacity: 0.5 };
const node3 = { fill: '#EF4444', opacity: 0.5 };
assert.strictEqual(reduceMixedProperty([node1, node2], 'fill'), '#3B82F6', 'Identical fill should return value');
assert.strictEqual(reduceMixedProperty([node1, node3], 'fill'), MIXED_SENTINEL, 'Differing fill should return MIXED');
assert.strictEqual(reduceMixedProperty([node2, node3], 'opacity'), 0.5, 'Identical opacity should return 0.5');

// Bindable<T> wrapper
const bindableProp = new Bindable(16);
assert.strictEqual(bindableProp.resolve(), 16);
bindableProp.bind('space.4');
assert.strictEqual(bindableProp.isBound(), true);
const resolvedFromEngine = bindableProp.resolve((id) => id === 'space.4' ? 16 : 0);
assert.strictEqual(resolvedFromEngine, 16);
console.log('   ✓ Normalized Scene Graph, Section hierarchy & MIXED reducer verified.\n');

// ----------------------------------------------------
// 2. Variables & Multi-Mode Engine
// ----------------------------------------------------
console.log('2. Testing Variables, Multi-Mode Engine & Aliasing...');
const varsEngine = new VariablesEngine();

// Check default primitive resolution
const blue500 = varsEngine.resolve('color.blue.500');
assert.strictEqual(blue500, '#3B82F6', 'Primitive blue.500 should resolve');

// Check semantic mode resolution (Light vs Dark)
const lightSurface = varsEngine.resolve('semantic.bg.surface', 'Light');
assert.strictEqual(lightSurface, '#F8FAFC', 'Light mode surface should resolve to gray.50');
const darkSurface = varsEngine.resolve('semantic.bg.surface', 'Dark');
assert.strictEqual(darkSurface, '#0F172A', 'Dark mode surface should resolve to gray.900');

// Scoped variables list
const fillVars = varsEngine.getVariablesForScope(VariableScope.COLOR_FILL);
assert.ok(fillVars.length >= 3, 'Should list color tokens for COLOR_FILL scope');
assert.ok(fillVars.some(v => v.id === 'semantic.action.primary'), 'Action primary should be available for fills');

// Circular reference detection
const testCol = varsEngine.collections['col_primitives'];
testCol.addVariable({ id: 'circ.a', type: 'COLOR', scopes: [VariableScope.ALL], valuesByMode: { default: '{circ.b}' } });
testCol.addVariable({ id: 'circ.b', type: 'COLOR', scopes: [VariableScope.ALL], valuesByMode: { default: '{circ.a}' } });
assert.throws(() => {
  varsEngine.resolve('circ.a');
}, /Circular reference detected/, 'Circular aliases must throw descriptive error');
console.log('   ✓ Variable scoping, Light/Dark modes & alias cycle detection verified.\n');

// ----------------------------------------------------
// 3. Hybrid Vector Engine & Geometry Algorithms
// ----------------------------------------------------
console.log('3. Testing Hybrid Vector Engine (Networks, Curvature, Face Extraction, Variable Width)...');

// Vector Network (3-way junction)
const net = new VectorNetwork();
const v0 = net.addVertex(0, 0);
const v1 = net.addVertex(100, 0);
const v2 = net.addVertex(0, 100);
const v3 = net.addVertex(100, 100);
net.addSegment(v0, v1);
net.addSegment(v0, v2);
net.addSegment(v0, v3);
assert.strictEqual(net.getVertexDegree(v0), 3, 'Vertex v0 should have degree 3 (multi-way junction)');
const svgPath = net.toSVGPath();
assert.ok(svgPath.includes('M 0 0 L 100 0'), 'SVG Path output contains segment v0-v1');

// Curvature Spline Generator
const splineCurves = computeCurvatureSpline([{ x: 0, y: 0 }, { x: 50, y: 100 }, { x: 100, y: 0 }]);
assert.strictEqual(splineCurves.length, 2, 'Should generate 2 smooth Bezier segments');
assert.ok(splineCurves[0].cp1 && splineCurves[0].cp2, 'Curve should have Bezier control points');

// Planar Graph Face Extraction (Illustrator Shape Builder)
// 4 intersecting lines forming an internal square: [0,0]->[10,0], [10,0]->[10,10], [10,10]->[0,10], [0,10]->[0,0]
const boxSegments = [
  { p1: { x: 0, y: 0 }, p2: { x: 100, y: 0 } },
  { p1: { x: 100, y: 0 }, p2: { x: 100, y: 100 } },
  { p1: { x: 100, y: 100 }, p2: { x: 0, y: 100 } },
  { p1: { x: 0, y: 100 }, p2: { x: 0, y: 0 } },
  // Diagonal dividing line through the middle
  { p1: { x: 0, y: 0 }, p2: { x: 100, y: 100 } }
];
const faces = extractPlanarFaces(boxSegments);
assert.ok(faces.length >= 1, 'Should extract enclosed planar faces');
console.log(`   ✓ Planar face extraction extracted ${faces.length} interior region(s).`);

// Variable Width Stroke Outlining (Shift + W)
const spine = [{ x: 0, y: 0 }, { x: 50, y: 0 }, { x: 100, y: 0 }];
const widthProfile = [{ s: 0, w: 4 }, { s: 0.5, w: 20 }, { s: 1, w: 4 }];
const strokePolygon = outlineVariableWidthStroke(spine, widthProfile);
assert.strictEqual(strokePolygon.length, 6, 'Should generate closed polygon contour (3 left + 3 right)');
// At s = 0.5, x = 50, y should be offset by +/- 10
const midLeft = strokePolygon[1];
assert.strictEqual(midLeft.x, 50);
assert.strictEqual(midLeft.y, 10, 'Normal offset at s=0.5 should be +10');
console.log('   ✓ Vector networks, curvature splines, planar extraction & variable stroke verified.\n');

// ----------------------------------------------------
// 4. Typography & OpenType Features
// ----------------------------------------------------
console.log('4. Testing Typography & OpenType Feature Flags...');
const otCSS = TypographyEngine.formatOpenTypeFeatures({ liga: true, tnum: true, frac: false });
assert.strictEqual(otCSS, '"liga" 1, "tnum" 1, "frac" 0', 'OpenType feature settings string formatted');

const upperText = TypographyEngine.applyTextCase('designforge ai', 'UPPER');
assert.strictEqual(upperText, 'DESIGNFORGE AI');
const titleText = TypographyEngine.applyTextCase('hello world', 'TITLE');
assert.strictEqual(titleText, 'Hello World');
console.log('   ✓ Typography engine & OpenType feature flags verified.\n');

// ----------------------------------------------------
// 5. Analytical Spring Physics & Prototyping Motion Engine
// ----------------------------------------------------
console.log('5. Testing Analytical Spring Physics & Motion Engine...');

// Underdamped Spring (zeta < 1)
const underdamped = new AnalyticalSpring({ mass: 1, stiffness: 100, damping: 5 });
assert.ok(underdamped.zeta < 1, 'Spring should be underdamped');
const eval0 = underdamped.evaluate(0, 100, 0);
assert.strictEqual(eval0.position, 100);
const evalMid = underdamped.evaluate(0.2, 100, 0);
assert.ok(evalMid.position < 100, 'Position should decay towards 0');

// Critically Damped Spring (zeta = 1)
// zeta = c / (2 * sqrt(m * k)) -> c = 2 * sqrt(1 * 100) = 20
const critical = new AnalyticalSpring({ mass: 1, stiffness: 100, damping: 20 });
assert.strictEqual(Math.round(critical.zeta), 1, 'Spring should be critically damped');
const critEval = critical.evaluate(0.5, 100, 0);
assert.ok(critEval.position > 0 && critEval.position < 5, 'Critically damped motion should reach near 0 without oscillation');

// Velocity Inheritance on interruption
const interruptedEval = underdamped.evaluate(0.1, 50, -120);
assert.ok(typeof interruptedEval.position === 'number' && typeof interruptedEval.velocity === 'number');

// Non-linear rubber-band resistance
const rubberResist = underdamped.calculateRubberBandResistance(40);
assert.ok(rubberResist < 0, 'Resistance must oppose displacement');
assert.strictEqual(Math.round(rubberResist), -139);

// 2D Affine Matrix Polar/QR Decomposition
const decomp = decomposeMatrix2D(1, 0, 0, 1, 50, 80);
assert.strictEqual(decomp.translateX, 50);
assert.strictEqual(decomp.translateY, 80);
assert.strictEqual(decomp.rotation, 0);
assert.strictEqual(decomp.scaleX, 1);
assert.strictEqual(decomp.scaleY, 1);

// Smart Animate Node Matching
const sNodes = [{ id: 'hero_img', name: 'Image', type: 'rectangle', x: 20, y: 40, width: 200, height: 200 }];
const tNodes = [{ id: 'hero_img', name: 'Image', type: 'rectangle', x: 20, y: 100, width: 300, height: 300 }];
const matchResult = matchNodesForSmartAnimate(sNodes, tNodes);
assert.strictEqual(matchResult.matchedPairs.length, 1);
assert.strictEqual(matchResult.matchedPairs[0].confidence, 1.0, 'Exact ID match has 1.0 confidence');

// Arc-length reparameterization for path morphing
const origPath = [{ x: 0, y: 0 }, { x: 100, y: 0 }];
const resampled = resamplePathByArcLength(origPath, 5);
assert.strictEqual(resampled.length, 5, 'Resampled path should have exactly 5 vertices');
assert.strictEqual(resampled[2].x, 50, 'Midpoint should be at x = 50');

// Kinematic Gesture Release Velocity
const tracker = new KinematicGestureTracker();
tracker.addPoint(100, 100, 1000);
tracker.addPoint(150, 100, 1050);
const relVel = tracker.computeReleaseVelocity();
assert.strictEqual(relVel.vx, 1000, '50px over 50ms = 1000 px/sec');

// Prototyping HFSM
const hfsm = new PrototypingHFSM({ cart_count: 0, is_auth: true });
assert.strictEqual(hfsm.evaluatePredicate('cart_count == 0 && is_auth == true'), true);
hfsm.executeMutation('cart_count += 1');
assert.strictEqual(hfsm.getVariable('cart_count'), 1);
assert.strictEqual(hfsm.evaluatePredicate('cart_count > 0'), true);
console.log('   ✓ Analytical spring physics, matrix decomposition, Smart Animate & HFSM verified.\n');

// ----------------------------------------------------
// 6. Component Variants & Sketch-Style Overrides
// ----------------------------------------------------
console.log('6. Testing Component Variants & Nested Overrides...');
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
assert.strictEqual(resolvedInstance.characters, 'Add to Cart', 'Instance text override applied');
assert.strictEqual(resolvedInstance.fill, '#10B981', 'Instance fill override applied');

const detached = compEngine.detachInstance(resolvedInstance);
assert.strictEqual(detached.type, 'frame');
assert.ok(detached.name.includes('(Detached)'));
console.log('   ✓ Component variants and Sketch-style nested overrides verified.\n');

// ----------------------------------------------------
// 7. Multiplayer LWW-CRDT & Presence
// ----------------------------------------------------
console.log('7. Testing Multiplayer LWW-CRDT & Presence...');
const reg = new LWWRegister('Initial Title', 100, 'client_A');
// Incoming older timestamp: should reject
const mergeOld = reg.merge('Stale Title', 90, 'client_B');
assert.strictEqual(mergeOld, false);
assert.strictEqual(reg.value, 'Initial Title');
// Incoming newer timestamp: should accept
const mergeNew = reg.merge('Updated Title', 110, 'client_B');
assert.strictEqual(mergeNew, true);
assert.strictEqual(reg.value, 'Updated Title');
// Tie-breaker on identical timestamp
const mergeTie = reg.merge('Client C Title', 110, 'client_C');
assert.strictEqual(mergeTie, true, 'Higher client ID should win tie-break');
assert.strictEqual(reg.value, 'Client C Title');

// Presence broadcaster
const broadcaster = new PresenceBroadcaster('client_local', { name: 'Lead Architect' });
const payload = broadcaster.createPresencePayload(250, 420, ['sec_1'], { panX: 0, panY: 0, zoom: 1 });
assert.strictEqual(payload.cursor.x, 250);
broadcaster.receivePeerPresence({
  clientId: 'peer_1',
  user: { name: 'Peer Designer', color: '#EF4444' },
  cursor: { x: 300, y: 500 },
  selection: [],
  viewport: { panX: 0, panY: 0, zoom: 1 },
  timestamp: Date.now()
});
assert.strictEqual(broadcaster.getActivePeers().length, 1);
console.log('   ✓ LWW-CRDT conflict-free resolution & presence broadcaster verified.\n');

// ----------------------------------------------------
// 8. Sandboxed Plugin Runtime
// ----------------------------------------------------
console.log('8. Testing Sandboxed Plugin Runtime...');
const mockEngine = {
  getActivePage: () => ({ id: 'page_1', rootIds: [] }),
  getSelection: () => [],
  setSelection: () => {},
  addNode: (node) => ({ ...node, id: 'node_new' }),
  getNode: () => null
};
const pluginRuntime = new PluginRuntime(mockEngine);
const script = `
  const frame = forge.createFrame({ name: 'Plugin Frame', width: 400, height: 300 });
  forge.ui.postMessage({ type: 'CREATED', frameId: frame.id });
  return frame.name;
`;
let postedMessage = null;
const execResult = await pluginRuntime.executePluginCode('plugin_test', script, (msg) => {
  postedMessage = msg;
});
assert.strictEqual(execResult.success, true);
assert.strictEqual(execResult.result, 'Plugin Frame');
assert.strictEqual(postedMessage.type, 'CREATED');
console.log('   ✓ Sandboxed plugin runtime & forge API verified.\n');

// ----------------------------------------------------
// 9. Inspector Ergonomics & Math Evaluator
// ----------------------------------------------------
console.log('9. Testing Inspector Ergonomics & Math Expression Evaluator...');
assert.strictEqual(MathExpressionEvaluator.evaluate('240+32', 0), 272);
assert.strictEqual(MathExpressionEvaluator.evaluate('100/3', 0), 33.33);
assert.strictEqual(MathExpressionEvaluator.evaluate('+20%', 200), 240);
assert.strictEqual(MathExpressionEvaluator.evaluate('-10%', 200), 180);
assert.strictEqual(MathExpressionEvaluator.evaluate('50%', 150), 75);

// Scrubby input delta
const stepDefault = ScrubbyInputController.calculateDelta(15, { baseStep: 1 });
assert.strictEqual(stepDefault, 5, '15px drag = 5 steps');
const stepShift = ScrubbyInputController.calculateDelta(15, { shiftKey: true, baseStep: 1 });
assert.strictEqual(stepShift, 50, 'Shift key gives 10x multiplier');
const stepAlt = ScrubbyInputController.calculateDelta(15, { altKey: true, baseStep: 1 });
assert.strictEqual(Math.round(stepAlt * 10) / 10, 0.5, 'Alt key gives 0.1x multiplier');
console.log('   ✓ Inline math expressions & scrubby input physics verified.\n');

// ----------------------------------------------------
// 10. Developer Handoff Exporters
// ----------------------------------------------------
console.log('10. Testing Multi-Platform Developer Handoff (SVG, SwiftUI, Compose)...');
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
assert.ok(swiftOut.includes('VStack(spacing: 12)'), 'SwiftUI must include VStack with spacing');
assert.ok(swiftOut.includes('.cornerRadius(12)'), 'SwiftUI must include cornerRadius');
const composeOut = ExportHandoffEngine.generateJetpackCompose(sampleFrame);
assert.ok(composeOut.includes('Column('), 'Jetpack Compose must include Column');
assert.ok(composeOut.includes('RoundedCornerShape(12.dp)'), 'Jetpack Compose must include RoundedCornerShape');
console.log('   ✓ Developer handoff (SVG, SwiftUI, Jetpack Compose) verified.\n');

// ----------------------------------------------------
// 11. Central Input Router (Section 27.1)
// ----------------------------------------------------
console.log('11. Testing Central Input Router (Priority-Based Handling)...');
const mockApp = {
  engine: {
    setSelection: () => {},
    getSelection: () => ['node_1'],
    deleteNodes: () => {},
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
assert.strictEqual(router.isTextInputActive({ target: { tagName: 'INPUT' } }), true);
assert.strictEqual(router.isTextInputActive({ target: { tagName: 'DIV' } }), false);
router.handleKeyDown({ key: 'r', preventDefault: () => {} });
assert.strictEqual(mockApp.activeTool, 'rectangle', 'Pressing R activates rectangle tool');
router.handleKeyDown({ key: 'Escape', preventDefault: () => {} });
assert.strictEqual(mockApp.activeTool, 'select', 'Pressing Escape returns to select tool');
console.log('   ✓ Priority-based Central Input Router verified.\n');

// ----------------------------------------------------
// 12. Prototype Diagnostics & Flow Coverage (Section 37)
// ----------------------------------------------------
console.log('12. Testing Prototype Diagnostics & Flow Graph Validator...');
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
assert.strictEqual(audit.totalFrames, 3, 'Total frames should be 3');
assert.strictEqual(audit.reachableFrames, 2, 'Reachable frames from flow start should be 2');
assert.strictEqual(audit.coveragePct, 67, 'Coverage should be 67% (2/3)');
assert.strictEqual(audit.brokenLinks.length, 1, 'Should detect 1 broken link to deleted_screen');
assert.strictEqual(audit.deadEnds.length, 1, 'screen_2 is a dead-end with no outgoing connections');

// Test auto-repair
let repairedPatch = null;
const mockCmdEngine = {
  updateNode: (id, patch) => { repairedPatch = patch; }
};
const repairedCount = diag.repairBrokenLinks('page_1', mockCmdEngine);
assert.strictEqual(repairedCount, 1, 'Should repair 1 broken link');
assert.strictEqual(repairedPatch.interactions.length, 1, 'Repaired node has only 1 valid interaction left');
console.log('   ✓ Prototype flow diagnostics, broken link detection & repair verified.\n');

console.log('🎉 ALL 12 FLAGSHIP SYSTEMS & LOGICAL SPECIFICATIONS PASSED 100%!');
