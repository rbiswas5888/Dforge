import assert from 'node:assert/strict';
import { collectDocumentColors } from '../src/editor-core/document-colors.js';

const colors = collectDocumentColors({
  tokens: [
    { tokens: [{ type: 'color', value: '#abc' }, { type: 'dimension', value: 8 }] }
  ],
  pages: [
    {
      background: '#112233',
      nodes: {
        shape: {
          style: {
            fills: [
              { type: 'solid', color: '#AABBCC' },
              { type: 'gradient', stops: [{ color: '#445566' }, { color: '#778899AA' }] },
              { type: 'image', color: '#FFFFFF' }
            ],
            strokes: [{ color: '#112233' }]
          },
          text: { color: '#DDEEFF' }
        }
      }
    }
  ]
});

assert.deepEqual(colors, [
  '#AABBCC',
  '#112233',
  '#DDEEFF',
  '#445566',
  '#778899AA'
]);
assert.deepEqual(collectDocumentColors(null), []);
console.log('✓ Document color palette includes normalized token, page, text, fill, stroke, and gradient colors.');
