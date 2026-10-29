import assert from 'node:assert/strict';
import { ColorPickerPopover } from '../src/editor-core/color-picker.js';

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
console.log('✓ Color picker recent colors persist, deduplicate, and cap at 14 entries.');
