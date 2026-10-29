import assert from 'node:assert/strict';
import { ColorPickerPopover, hslToRgb, parseColorString, rgbToHsl } from '../src/editor-core/color-picker.js';

const storedValues = new Map();
globalThis.localStorage = {
  getItem(key) {
    return storedValues.get(key) ?? null;
  },
  setItem(key, value) {
    storedValues.set(key, value);
  }
};

function commitColor(picker, color) {
  picker.setColor(color);
  picker.notifyInput();
  picker.notifyChange();
}

const picker = new ColorPickerPopover();
commitColor(picker, '#112233');
commitColor(picker, '#445566');
commitColor(picker, '#112233');
assert.deepEqual(picker.recentColors, ['#112233', '#445566']);
assert.deepEqual(JSON.parse(storedValues.get('designforge_recent_colors')), picker.recentColors);

for (let index = 0; index < 15; index += 1) {
  const color = `#${index.toString(16).padStart(6, '0')}`;
  commitColor(picker, color);
}
assert.equal(picker.recentColors.length, 14);
assert.equal(picker.recentColors[0], '#00000E');

const restoredPicker = new ColorPickerPopover();
assert.deepEqual(restoredPicker.recentColors, picker.recentColors);
picker.saveColorFormat('HSL');
assert.equal(new ColorPickerPopover().format, 'HSL');

assert.deepEqual(parseColorString('#f08c'), { r: 255, g: 0, b: 136, a: 0.8, hasAlpha: true });
assert.deepEqual(parseColorString('rgb(255, 0, 128)'), { r: 255, g: 0, b: 128, a: 1, hasAlpha: false });
assert.deepEqual(parseColorString('hsl(120, 100%, 50%)'), { r: 0, g: 255, b: 0, a: 1, hasAlpha: false });
assert.deepEqual(parseColorString('rgba(10, 20, 30, 50%)'), { r: 10, g: 20, b: 30, a: 0.5, hasAlpha: true });
assert.equal(parseColorString('rgb(1, invalid, 3)'), null);
assert.equal(parseColorString('rgb(1foo, 2, 3)'), null);
const hsl = rgbToHsl(14, 122, 231);
const roundTrip = hslToRgb(hsl.h, hsl.s, hsl.l);
assert.ok(Math.abs(roundTrip.r - 14) <= 1);
assert.ok(Math.abs(roundTrip.g - 122) <= 1);
assert.ok(Math.abs(roundTrip.b - 231) <= 1);

console.log('✓ Color picker recent colors, model preference, and HEX/RGB/HSL/CSS conversions are verified.');
