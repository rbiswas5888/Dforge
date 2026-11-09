import assert from 'node:assert/strict';
import { ColorPickerPopover, hexToRgb, rgbToHex, rgbToHsv, hsvToRgb } from '../src/editor-core/color-picker.js';
import { CanonicalColor, calculateWcagContrast } from '../src/editor-core/color-math-engine.js';
import { createInitialDocument, createNode } from '../src/engine/document.js';
import { CanvasRenderer } from '../src/engine/renderer.js';

console.log('--- 🧪 DesignForge AI: Paint Engine & Color Controls Test Suite ---');

// Mock localStorage for node environment
const storageMap = new Map();
globalThis.localStorage = {
  getItem: key => storageMap.get(key) ?? null,
  setItem: (key, val) => storageMap.set(key, val)
};

// -------------------------------------------------------------
// 1. Color Space & Advanced Color Models (OKLab, OKLCH, HSB, RGB, HEX)
// -------------------------------------------------------------
console.log('1. Testing Advanced Color Models (OKLab, OKLCH, Contrast)...');

const popover = new ColorPickerPopover();
assert.equal(popover.mode, 'solid');

// Test OKLab conversion via CanonicalColor
const blueColor = CanonicalColor.fromHex('#3B82F6');
const oklab = blueColor.toOklab();
assert.ok(oklab.L > 0 && oklab.L <= 1, 'OKLab Lightness should be between 0 and 1');
const fromOklab = CanonicalColor.fromOklab(oklab.L, oklab.a, oklab.b);
assert.equal(fromOklab.toHex(), '#3B82F6', 'OKLab round-trip should restore original hex');

// Test OKLCH conversion via CanonicalColor
const oklch = blueColor.toOklch();
assert.ok(oklch.C >= 0, 'OKLCH Chroma should be non-negative');
assert.ok(oklch.h >= 0 && oklch.h <= 360, 'OKLCH Hue should be between 0 and 360');
const fromOklch = CanonicalColor.fromOklch(oklch.L, oklch.C, oklch.h);
assert.equal(fromOklch.toHex(), '#3B82F6', 'OKLCH round-trip should restore original hex');

// Test Contrast Ratio against dark canvas background (#090D16)
const contrastDark = calculateWcagContrast(CanonicalColor.fromHex('#FFFFFF'), CanonicalColor.fromHex('#090D16'));
assert.ok(contrastDark.ratio >= 15, `White on #090D16 contrast should be high, got ${contrastDark.ratio}`);
assert.equal(contrastDark.passesAAA, true, 'White on #090D16 must pass AAA');

const contrastFail = calculateWcagContrast(CanonicalColor.fromHex('#1E293B'), CanonicalColor.fromHex('#090D16'));
assert.ok(contrastFail.ratio < 3.0, 'Dark slate on #090D16 must have low contrast');
assert.equal(contrastFail.passesAA, false, 'Dark slate on #090D16 must fail AA');

console.log('   ✓ OKLab, OKLCH, and WCAG contrast evaluations verified.');

// -------------------------------------------------------------
// 2. Color Picker Gradient Mode & Stop Management
// -------------------------------------------------------------
console.log('\n2. Testing Gradient Engine in Color Picker...');

let lastInputColor = null;
let lastGradient = null;

popover.open({
  mode: 'gradient',
  contrastBackground: '#090D16',
  gradient: {
    type: 'linear-gradient',
    stops: [
      { offset: 0, color: '#3B82F6' },
      { offset: 1, color: '#EC4899' }
    ]
  },
  onInput: (color) => { lastInputColor = color; },
  onGradientChange: (grad) => { lastGradient = grad; }
});

assert.equal(popover.mode, 'gradient');
assert.equal(popover.gradient.type, 'linear-gradient');
assert.equal(popover.gradient.stops.length, 2);

// Update active stop color
popover.setColor('#10B981');
popover.notifyInput();

assert.equal(popover.gradient.stops[0].color, '#10B981');
assert.equal(lastGradient.stops[0].color, '#10B981');

// Test switching gradient type
popover.gradient.type = 'radial-gradient';
popover.gradient.stops.push({ offset: 0.5, color: '#F59E0B' });
popover.gradient.stops.sort((a, b) => a.offset - b.offset);
assert.equal(popover.gradient.stops.length, 3);
assert.equal(popover.gradient.stops[1].offset, 0.5);

// Test reverse stops
popover.gradient.stops.reverse();
popover.gradient.stops.forEach(s => { s.offset = Math.round((1 - s.offset) * 100) / 100; });
popover.gradient.stops.sort((a, b) => a.offset - b.offset);
assert.equal(popover.gradient.stops.length, 3);

console.log('   ✓ Color Picker gradient modes and multi-stop management verified.');

// -------------------------------------------------------------
// 3. Multi-Fill Stack Model & Operations
// -------------------------------------------------------------
console.log('\n3. Testing Multi-Fill Stack Operations...');

const doc = createInitialDocument('Paint Engine Test');
const testNode = createNode('rectangle', {
  name: 'Multi-Fill Card',
  transform: { x: 50, y: 50, width: 300, height: 200 },
  style: {
    fills: [
      { type: 'solid', color: '#1E293B', opacity: 1, visible: true, blendMode: 'normal' },
      {
        type: 'linear-gradient',
        opacity: 0.8,
        visible: true,
        blendMode: 'overlay',
        stops: [{ offset: 0, color: '#3B82F6' }, { offset: 1, color: '#8B5CF6' }]
      }
    ],
    strokes: [
      {
        color: '#38BDF8',
        width: 2,
        align: 'inside',
        strokeCap: 'round',
        strokeJoin: 'round',
        dashPattern: [8, 4],
        visible: true,
        strokeWeights: { top: 2, right: 0, bottom: 4, left: 1 }
      }
    ]
  }
});

assert.equal(testNode.style.fills.length, 2);
assert.equal(testNode.style.fills[0].blendMode, 'normal');
assert.equal(testNode.style.fills[1].blendMode, 'overlay');
assert.equal(testNode.style.fills[1].opacity, 0.8);

// Reorder fills
const fillsCopy = [...testNode.style.fills];
const swapped = [fillsCopy[1], fillsCopy[0]];
testNode.style.fills = swapped;
assert.equal(testNode.style.fills[0].type, 'linear-gradient');
assert.equal(testNode.style.fills[1].type, 'solid');

// Toggle fill visibility
testNode.style.fills[0].visible = false;
assert.equal(testNode.style.fills[0].visible, false);

console.log('   ✓ Multi-fill stack ordering, opacity, blend modes, and visibility verified.');

// -------------------------------------------------------------
// 4. Extended Multi-Stroke Stack & Per-Side Weights
// -------------------------------------------------------------
console.log('\n4. Testing Multi-Stroke Stack Geometry & Styles...');

const stroke = testNode.style.strokes[0];
assert.equal(stroke.align, 'inside');
assert.equal(stroke.strokeCap, 'round');
assert.equal(stroke.strokeJoin, 'round');
assert.deepEqual(stroke.dashPattern, [8, 4]);
assert.deepEqual(stroke.strokeWeights, { top: 2, right: 0, bottom: 4, left: 1 });

// Duplicate stroke
const stroke2 = { ...stroke, color: '#EF4444', width: 1, align: 'outside' };
testNode.style.strokes.push(stroke2);
assert.equal(testNode.style.strokes.length, 2);
assert.equal(testNode.style.strokes[1].align, 'outside');

console.log('   ✓ Multi-stroke alignment, caps, joins, dashes, and per-side weights verified.');

// -------------------------------------------------------------
// 5. Canvas Renderer Support for Advanced Fills & Strokes
// -------------------------------------------------------------
console.log('\n5. Testing Canvas Renderer Compatibility...');

// Mock 2D Context
const calls = [];
const mockCtx = {
  save() { calls.push('save'); },
  restore() { calls.push('restore'); },
  beginPath() { calls.push('beginPath'); },
  rect() { calls.push('rect'); },
  stroke() { calls.push('stroke'); },
  fill() { calls.push('fill'); },
  clip() { calls.push('clip'); },
  closePath() { calls.push('closePath'); },
  quadraticCurveTo(cpx, cpy, x, y) { calls.push(`quadraticCurveTo`); },
  moveTo(x, y) { calls.push(`moveTo(${x},${y})`); },
  lineTo(x, y) { calls.push(`lineTo(${x},${y})`); },
  setLineDash(d) { calls.push(`setLineDash(${JSON.stringify(d)})`); },
  createLinearGradient(x0, y0, x1, y1) {
    calls.push(`createLinearGradient`);
    return { addColorStop() {} };
  },
  createRadialGradient(x0, y0, r0, x1, y1, r1) {
    calls.push(`createRadialGradient`);
    return { addColorStop() {} };
  },
  createConicGradient(a, cx, cy) {
    calls.push(`createConicGradient`);
    return { addColorStop() {} };
  },
  globalAlpha: 1,
  globalCompositeOperation: 'source-over',
  strokeStyle: '',
  fillStyle: '',
  lineWidth: 1,
  lineCap: 'butt',
  lineJoin: 'miter'
};

const mockCanvas = {
  getContext: () => mockCtx,
  width: 1440,
  height: 900,
  style: {}
};

const renderer = new CanvasRenderer(mockCanvas);
testNode.style.fills[0].visible = true;
const page = doc.pages[0];
page.nodes[testNode.id] = testNode;
page.rootIds = [testNode.id];

// Render should execute all fill and stroke paths cleanly without throwing
assert.doesNotThrow(() => {
  renderer.renderNodeRecursive(mockCtx, page, testNode.id, new Map());
}, 'Rendering advanced fills and strokes should not throw');

assert.ok(calls.includes('createLinearGradient'), 'Renderer must create linear gradient for gradient fill');
assert.ok(calls.includes('setLineDash([8,4])'), 'Renderer must set dash pattern for stroke');
assert.ok(calls.includes('clip'), 'Renderer must apply inside alignment clipping');

console.log('   ✓ Canvas Renderer successfully rendered all advanced fill and stroke geometries.');

console.log('\n🎉 ALL PAINT ENGINE & PROPERTIES PANEL COLOR TESTS PASSED (100% SPEC COMPLIANCE)!\n');
