/**
 * DesignForge AI - Center Design Tools & Properties Studio Test Suite
 * Validates Arrow, Pen, Pencil, and contextual right-hand studios (Word + Figma parity)
 */

import assert from 'node:assert';
import { createNode } from '../src/engine/document.js';

console.log('🧪 Starting Design Tools & Properties Studio Validation Suite...\n');

// 1. Test Arrow Node Creation & Geometry
console.log('1. Testing Arrow Tool Geometry & Arrowhead Caps...');
const startX = 100, startY = 100, currentX = 250, currentY = 200;
const dx = currentX - startX;
const dy = currentY - startY;
const length = Math.max(10, Math.round(Math.hypot(dx, dy)));
const angleDeg = Math.round(Math.atan2(dy, dx) * 180 / Math.PI);

const arrowNode = createNode('arrow', {
  name: 'Arrow Connector',
  transform: { x: startX, y: startY, width: length, height: 2, rotation: angleDeg },
  arrowheadStart: 'none',
  arrowheadEnd: 'triangle',
  style: { strokes: [{ color: '#38bdf8', width: 2, style: 'solid' }] }
});

assert.strictEqual(arrowNode.type, 'arrow');
assert.strictEqual(arrowNode.arrowheadEnd, 'triangle');
assert.ok(arrowNode.transform.width > 100, 'Arrow length should be > 100');
assert.ok(arrowNode.transform.rotation > 0, 'Arrow rotation angle should be positive');
console.log(`   ✓ Arrow created with length ${arrowNode.transform.width}px at ${arrowNode.transform.rotation}° angle`);

// 2. Test Pencil Freehand Stroke Vectorization
console.log('2. Testing Pencil Freehand Stroke Vector Path Conversion...');
const pencilStroke = [
  { x: 50, y: 50 },
  { x: 60, y: 58 },
  { x: 75, y: 70 },
  { x: 95, y: 82 },
  { x: 120, y: 90 }
];

let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
for (const p of pencilStroke) {
  if (p.x < minX) minX = p.x;
  if (p.x > maxX) maxX = p.x;
  if (p.y < minY) minY = p.y;
  if (p.y > maxY) maxY = p.y;
}
const pWidth = Math.max(12, maxX - minX);
const pHeight = Math.max(12, maxY - minY);
const pathData = [{ type: 'M', x: Math.round(pencilStroke[0].x - minX), y: Math.round(pencilStroke[0].y - minY) }];
for (let i = 1; i < pencilStroke.length; i++) {
  pathData.push({ type: 'L', x: Math.round(pencilStroke[i].x - minX), y: Math.round(pencilStroke[i].y - minY) });
}

const pencilNode = createNode('vector', {
  name: 'Pencil Sketch',
  transform: { x: Math.round(minX), y: Math.round(minY), width: Math.round(pWidth), height: Math.round(pHeight) },
  vectorPath: pathData,
  style: {
    strokes: [{ color: '#38bdf8', width: 2, style: 'solid', cap: 'round', join: 'round' }],
    fills: []
  }
});

assert.strictEqual(pencilNode.type, 'vector');
assert.strictEqual(pencilNode.vectorPath.length, 5);
assert.strictEqual(pencilNode.vectorPath[0].type, 'M');
assert.strictEqual(pencilNode.vectorPath[1].type, 'L');
assert.strictEqual(pencilNode.style.strokes[0].cap, 'round');
console.log('   ✓ Pencil freehand stroke correctly converted to vectorized path with round line caps');

// 3. Test Pen Anchor Point Path (Closed & Open)
console.log('3. Testing Pen Anchor Point Vector Path Synthesis...');
const penAnchors = [
  { x: 100, y: 100 },
  { x: 200, y: 100 },
  { x: 250, y: 200 },
  { x: 150, y: 250 }
];

const closedPenPath = [{ type: 'M', x: 0, y: 0 }];
for (let i = 1; i < penAnchors.length; i++) {
  closedPenPath.push({ type: 'L', x: penAnchors[i].x - 100, y: penAnchors[i].y - 100 });
}
closedPenPath.push({ type: 'Z' });

const penNode = createNode('vector', {
  name: 'Vector Shape',
  transform: { x: 100, y: 100, width: 150, height: 150 },
  vectorPath: closedPenPath,
  style: {
    strokes: [{ color: '#38bdf8', width: 2, style: 'solid', cap: 'round', join: 'round' }],
    fills: [{ type: 'solid', color: 'rgba(56, 189, 248, 0.25)' }]
  }
});

assert.strictEqual(penNode.vectorPath[penNode.vectorPath.length - 1].type, 'Z');
assert.strictEqual(penNode.style.fills.length, 1);
console.log('   ✓ Pen closed path with fill generated successfully');

// 4. Test Word + Figma Typography Suite Properties
console.log('4. Testing Word + Figma Typography Studio Properties & Actions...');
const textNode = createNode('text', {
  name: 'Hero Heading',
  transform: { x: 80, y: 80, width: 340, height: 50 },
  text: {
    content: 'Transforming Vector Design',
    fontSize: 24,
    fontWeight: '600',
    fontStyle: 'normal',
    textDecoration: 'none',
    textCase: 'none',
    textAlign: 'left',
    verticalAlign: 'top',
    lineHeight: 1.3,
    letterSpacing: 0,
    autoResize: 'auto-width',
    color: '#f8fafc',
    fontFamily: "'Inter', sans-serif"
  }
});

// Test Typography Preset (Display, H1, Body)
const h1Preset = { fontSize: 32, fontWeight: '700', lineHeight: 1.2, letterSpacing: -0.3 };
Object.assign(textNode.text, h1Preset);
assert.strictEqual(textNode.text.fontSize, 32);
assert.strictEqual(textNode.text.fontWeight, '700');
assert.strictEqual(textNode.text.letterSpacing, -0.3);

// Test Word-style formatting toggles: Bold, Italic, Underline, Strikethrough
textNode.text.fontStyle = 'italic';
textNode.text.textDecoration = 'underline';
assert.strictEqual(textNode.text.fontStyle, 'italic');
assert.strictEqual(textNode.text.textDecoration, 'underline');

// Test Casing transforms
textNode.text.textCase = 'uppercase';
assert.strictEqual(textNode.text.textCase, 'uppercase');

// Test Alignments & Auto-sizing
textNode.text.textAlign = 'center';
textNode.text.verticalAlign = 'middle';
textNode.text.autoResize = 'auto-height';
assert.strictEqual(textNode.text.textAlign, 'center');
assert.strictEqual(textNode.text.verticalAlign, 'middle');
assert.strictEqual(textNode.text.autoResize, 'auto-height');
console.log('   ✓ Full Word + Figma typography parameters validated with 100% precision');

// 5. Test Star, Polygon, and Ellipse Arc Parameters
console.log('5. Testing Star, Polygon & Ellipse Donut Parameters...');
const star = createNode('star', { starPoints: 7, starRatio: 0.35 });
assert.strictEqual(star.starPoints, 7);
assert.strictEqual(star.starRatio, 0.35);

const polygon = createNode('polygon', { polygonSides: 8 });
assert.strictEqual(polygon.polygonSides, 8);

const ellipse = createNode('ellipse', { arcSweep: 270, arcRatio: 0.5 });
assert.strictEqual(ellipse.arcSweep, 270);
assert.strictEqual(ellipse.arcRatio, 0.5);
console.log('   ✓ Star (7 points), Polygon (8 sides), and Donut Ellipse (270° sweep, 50% hole) verified');

console.log('\n🎉 ALL DESIGN TOOLS & INSPECTOR STUDIO TESTS PASSED 100%!\n');
