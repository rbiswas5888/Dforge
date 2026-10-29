import { parseColorString, rgbToHex } from './color-picker.js';

const HEX_COLOR_PATTERN = /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

function normalizeHexColor(value) {
  const color = String(value ?? '').trim();
  if (HEX_COLOR_PATTERN.test(color) && color.length === 4) {
    return `#${[...color.slice(1)].map(channel => channel + channel).join('')}`.toUpperCase();
  }
  if (HEX_COLOR_PATTERN.test(color) && color.length === 5) {
    return `#${[...color.slice(1)].map(channel => channel + channel).join('')}`.toUpperCase();
  }
  if (HEX_COLOR_PATTERN.test(color)) return color.toUpperCase();
  const parsed = parseColorString(color);
  return parsed ? rgbToHex(parsed.r, parsed.g, parsed.b, parsed.a) : null;
}

export function collectDocumentColors(document) {
  const colors = new Set();
  const addColor = value => {
    const color = normalizeHexColor(value);
    if (color) colors.add(color);
  };
  const addPaint = paint => {
    if (!paint || typeof paint !== 'object') return;
    if (paint.type !== 'image') addColor(paint.color);
    for (const stop of paint.stops || []) addColor(stop?.color);
  };

  for (const group of Array.isArray(document?.tokens) ? document.tokens : []) {
    for (const token of Array.isArray(group?.tokens) ? group.tokens : []) {
      if (token?.type === 'color') addColor(token.value);
    }
  }

  for (const page of Array.isArray(document?.pages) ? document.pages : []) {
    addColor(page?.background);
    const nodes = page?.nodes && typeof page.nodes === 'object' ? Object.values(page.nodes) : [];
    for (const node of nodes) {
      addColor(node?.text?.color);
      for (const paint of Array.isArray(node?.style?.fills) ? node.style.fills : []) addPaint(paint);
      for (const paint of Array.isArray(node?.style?.strokes) ? node.style.strokes : []) addPaint(paint);
    }
  }

  return [...colors];
}
