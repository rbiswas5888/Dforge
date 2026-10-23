import assert from 'assert';
import {
  DEVICE_PRESET_CATALOG,
  queryDevicePresets,
  CustomFrameEngine,
  hexToRgb,
  rgbToHex,
  rgbToHsv,
  hsvToRgb,
  ColorPickerPopover
} from '../src/editor-core/index.js';

console.log('📱 Testing Device Presets Catalog & Search...');

// 1. Device presets catalog length and categories
assert(DEVICE_PRESET_CATALOG.length >= 10, 'Catalog should contain device presets');
const phones = queryDevicePresets({ category: 'phone' });
assert(phones.length > 0, 'Should find phone presets');
const tablets = queryDevicePresets({ category: 'tablet' });
assert(tablets.length > 0, 'Should find tablet presets');
const desktops = queryDevicePresets({ category: 'desktop' });
assert(desktops.length > 0, 'Should find desktop presets');

const iphone16 = queryDevicePresets({ query: 'iPhone 16' });
assert(iphone16.length > 0, 'Should find iPhone 16');
const match = iphone16.find(p => p.name.includes('16'));
assert(match, 'Should find preset containing 16');
assert.strictEqual(match.width, 393);
assert.strictEqual(match.height, 852);

// 2. Custom Frame Engine
const engine = new CustomFrameEngine();
const customFrame = engine.createCustomFrame({ width: 1440, height: 900 });
assert.strictEqual(customFrame.aspectRatio, 1440 / 900);
const portrait = engine.toggleOrientation(customFrame);
assert.strictEqual(portrait.dimensions.width, 900);
assert.strictEqual(portrait.dimensions.height, 1440);

console.log('✓ Device presets catalog, search, and custom frame engine passed.');

console.log('🎨 Testing Color Math & Conversions...');
const rgb = hexToRgb('#3B82F6');
assert.strictEqual(rgb.r, 59);
assert.strictEqual(rgb.g, 130);
assert.strictEqual(rgb.b, 246);
assert.strictEqual(rgb.a, 1);

const hex = rgbToHex(59, 130, 246);
assert.strictEqual(hex.toUpperCase(), '#3B82F6');

const hsv = rgbToHsv(59, 130, 246);
const backRgb = hsvToRgb(hsv.h, hsv.s, hsv.v);
assert(Math.abs(backRgb.r - rgb.r) <= 1);
assert(Math.abs(backRgb.g - rgb.g) <= 1);
assert(Math.abs(backRgb.b - rgb.b) <= 1);

console.log('✓ Color math round-trip verified.');

console.log('🎯 Testing ColorPickerPopover callback delegation...');
const picker = new ColorPickerPopover();
let liveUpdates = [];
let committed = null;

picker.open({
  anchorEl: null,
  color: '#3B82F6',
  onChange: (c) => liveUpdates.push(c),
  onCommit: (c) => { committed = c; }
});

assert.strictEqual(typeof picker.onInputCallback, 'function', 'onInputCallback should be wired to onChange (live)');
assert.strictEqual(typeof picker.onChangeCallback, 'function', 'onChangeCallback should be wired to onCommit (final)');

picker.notifyInput();
assert.strictEqual(liveUpdates.length, 1, 'Live update should be called');

picker.notifyChange();
assert.strictEqual(committed, '#3B82F6', 'onCommit should be called with final hex');

picker.close();
assert.strictEqual(picker.isOpen, false);

console.log('✓ ColorPickerPopover callback delegation passed.');

console.log('🎉 ALL DEVICE PRESET & COLOR PICKER TESTS PASSED 100%!');
