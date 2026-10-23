/**
 * DesignForge AI — Prototyping & Motion Engineering Module Verification Suite
 * Mathematical & Algorithmic Validation
 */

import assert from 'assert';
import {
  AnalyticalSpring,
  decomposeMatrix2D,
  interpolateTransforms,
  matchNodesForSmartAnimate,
  resamplePathByArcLength,
  KinematicGestureTracker,
  PrototypingHFSM
} from '../src/editor-core/index.js';
import { PrototypeEngine } from '../src/engine/prototype.js';

console.log('⚡ Starting Prototyping & Motion Mathematical Verification Suite...\n');

// ---------------------------------------------------------------------
// 1. Hierarchical Finite State Machine (HFSM) & Variable Logic Engine
// ---------------------------------------------------------------------
console.log('1. Testing Hierarchical Finite State Machine (HFSM) & Variable Logic...');
const hfsm = new PrototypingHFSM({
  cart_count: 0,
  is_authenticated: false,
  active_tab: 0,
  user_tier: 'FREE'
});

// Evaluate initial predicates
assert.strictEqual(hfsm.evaluatePredicate('cart_count == 0 && !is_authenticated'), true);
assert.strictEqual(hfsm.evaluatePredicate('cart_count > 0'), false);

// Execute arithmetic mutations
hfsm.executeMutation('cart_count += 3');
assert.strictEqual(hfsm.getVariable('cart_count'), 3, 'cart_count should be 3');

hfsm.executeMutation('cart_count -= 1');
assert.strictEqual(hfsm.getVariable('cart_count'), 2, 'cart_count should be 2');

hfsm.executeMutation('cart_count *= 4');
assert.strictEqual(hfsm.getVariable('cart_count'), 8, 'cart_count should be 8');

hfsm.executeMutation('cart_count /= 2');
assert.strictEqual(hfsm.getVariable('cart_count'), 4, 'cart_count should be 4');

// State transition with boolean predicates
hfsm.setVariable('is_authenticated', true);
hfsm.setVariable('user_tier', 'PRO');
assert.strictEqual(hfsm.evaluatePredicate('is_authenticated == true && user_tier == "PRO" && cart_count == 4'), true);
console.log('   ✓ HFSM variables, arithmetic mutations, and boolean predicates validated.\n');

// ---------------------------------------------------------------------
// 2. Analytical Spring-Mass-Damper Physics Engine
// ---------------------------------------------------------------------
console.log('2. Testing Analytical Spring Physics (m*x\'\' + c*x\' + k*x = 0)...');

// 2a. Underdamped (zeta < 1): Oscillates while decaying
const underdamped = new AnalyticalSpring({ mass: 1, stiffness: 100, damping: 6 });
assert.ok(underdamped.zeta < 1, 'zeta must be < 1 for underdamped');
const u0 = underdamped.evaluate(0, 100, 0);
assert.strictEqual(u0.position, 100);
assert.strictEqual(u0.velocity, 0);

// Mid-flight evaluation shows decay
const uMid = underdamped.evaluate(0.3, 100, 0);
assert.ok(uMid.position < 100, 'Position must decay');
assert.ok(typeof uMid.velocity === 'number');

// 2b. Critically Damped (zeta = 1): Fastest decay without oscillation
// zeta = c / (2 * sqrt(m * k)) -> for m = 1, k = 100, c = 20 gives zeta = 1.0
const criticallyDamped = new AnalyticalSpring({ mass: 1, stiffness: 100, damping: 20 });
assert.strictEqual(Math.round(criticallyDamped.zeta), 1);
const cAtZero = criticallyDamped.evaluate(0, 100, 0);
assert.strictEqual(cAtZero.position, 100);
const cAtOneSec = criticallyDamped.evaluate(1.0, 100, 0);
assert.ok(cAtOneSec.position < 0.1, 'Critically damped position approaches 0 asymptotically');

// 2c. Overdamped (zeta > 1): Sluggish decay
const overdamped = new AnalyticalSpring({ mass: 1, stiffness: 50, damping: 30 });
assert.ok(overdamped.zeta > 1, 'zeta must be > 1 for overdamped');
const oAtHalfSec = overdamped.evaluate(0.5, 100, 0);
assert.ok(oAtHalfSec.position > 0 && oAtHalfSec.position < 100);

// 2d. Velocity Inheritance on Interruption
// Interrupted at t0 with displacement 40 and non-zero velocity -350 px/s
const inherited = underdamped.evaluate(0.05, 40, -350);
assert.ok(typeof inherited.position === 'number' && typeof inherited.velocity === 'number');
assert.ok(inherited.position < 40, 'Position must move in direction of negative velocity');

// 2e. Non-linear Rubber-Banding Resistance: F = -k * x^1.5
const fResistSmall = underdamped.calculateRubberBandResistance(10);
const fResistLarge = underdamped.calculateRubberBandResistance(100);
assert.ok(fResistSmall < 0 && fResistLarge < 0, 'Resistance must oppose displacement');
assert.ok(Math.abs(fResistLarge) > Math.abs(fResistSmall) * 10, 'Non-linear x^1.5 growth must exceed linear');
console.log('   ✓ Analytical ODE solver, damping regimes, velocity inheritance & rubber-banding verified.\n');

// ---------------------------------------------------------------------
// 3. Advanced Smart Animate: Bipartite Matching & Matrix Decomposition
// ---------------------------------------------------------------------
console.log('3. Testing Smart Animate: Bipartite Matching & Matrix Decomposition...');

// 3a. Bipartite Matching
const sourceNodes = [
  { id: 'btn_submit', name: 'Submit Button', type: 'frame', x: 50, y: 300, width: 200, height: 48 },
  { id: 'hero_img', name: 'Hero Image', type: 'rectangle', x: 20, y: 40, width: 335, height: 200 },
  { id: 'txt_heading', name: 'Heading', type: 'text', x: 20, y: 260, width: 200, height: 24 }
];

// Target frame has same visual elements but with new IDs and transformed geometry
const targetNodes = [
  { id: 'new_hero', name: 'Hero Image', type: 'rectangle', x: 0, y: 0, width: 375, height: 280 },
  { id: 'new_btn', name: 'Submit Button', type: 'frame', x: 20, y: 600, width: 335, height: 56 },
  { id: 'new_txt', name: 'Heading', type: 'text', x: 20, y: 310, width: 335, height: 32 }
];

const matching = matchNodesForSmartAnimate(sourceNodes, targetNodes);
assert.strictEqual(matching.matchedPairs.length, 3, 'All 3 layers must be matched via bipartite graph');
assert.strictEqual(matching.unmatchedSource.length, 0);
assert.strictEqual(matching.unmatchedTarget.length, 0);

// 3b. 2D Affine Matrix Polar/QR Decomposition
// Matrix for Translation (120, 80), Rotation 45deg (0.707), Scale (2, 3)
const angle = Math.PI / 4;
const sx = 2, sy = 3;
const a = Math.cos(angle) * sx;
const b = Math.sin(angle) * sx;
const c = -Math.sin(angle) * sy;
const d = Math.cos(angle) * sy;
const tx = 120, ty = 80;

const decomposed = decomposeMatrix2D(a, b, c, d, tx, ty);
assert.strictEqual(Math.round(decomposed.translateX), 120);
assert.strictEqual(Math.round(decomposed.translateY), 80);
assert.strictEqual(Math.round(decomposed.scaleX), 2);
assert.strictEqual(Math.round(decomposed.scaleY), 3);
assert.strictEqual(Math.round(decomposed.rotation * 1000) / 1000, Math.round(angle * 1000) / 1000);

// Transform interpolation
const tA = { translateX: 0, translateY: 0, rotation: 0, scaleX: 1, scaleY: 1, skew: 0 };
const tB = { translateX: 100, translateY: 200, rotation: Math.PI, scaleX: 2, scaleY: 2, skew: 0 };
const tMid = interpolateTransforms(tA, tB, 0.5);
assert.strictEqual(tMid.translateX, 50);
assert.strictEqual(tMid.translateY, 100);
assert.strictEqual(tMid.scaleX, 1.5);
assert.strictEqual(tMid.rotation, Math.PI / 2);

// 3c. Arc-Length Reparameterization for Path Morphing
const triangle = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 50, y: 86.6 }, { x: 0, y: 0 }];
const resampledTriangle = resamplePathByArcLength(triangle, 10);
assert.strictEqual(resampledTriangle.length, 10, 'Subdivided path must have exactly 10 vertices');
console.log('   ✓ Bipartite graph matching, matrix decomposition & path resampling verified.\n');

// ---------------------------------------------------------------------
// 4. Kinematic Gesture Tracking & Inertial Scrolling Physics
// ---------------------------------------------------------------------
console.log('4. Testing Kinematic Gesture Tracking & Inertial Momentum...');

const gesture = new KinematicGestureTracker(0.0035);
// Simulate finger drag: moves 120px in 50ms
gesture.addPoint(100, 200, 1000);
gesture.addPoint(150, 200, 1025);
gesture.addPoint(220, 200, 1050);

const vRelease = gesture.computeReleaseVelocity();
assert.strictEqual(vRelease.vx, 2400, 'Velocity should be 120px / 0.05s = 2400 px/sec');

// Inertial motion over time
const p0 = 220;
const inertialAtHalfSec = gesture.evaluateInertialPosition(p0, vRelease.vx, 0.5);
assert.ok(inertialAtHalfSec.position > p0, 'Inertial position must advance forward');
assert.ok(inertialAtHalfSec.velocity < vRelease.vx, 'Inertial velocity must exponentially decay');
console.log('   ✓ Kinematic velocity vector & exponential decay momentum verified.\n');

console.log('🎉 ALL PROTOTYPING & MOTION MATHEMATICAL ALGORITHMS PASSED 100%!');
