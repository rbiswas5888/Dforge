import { computeGroupBounds, computeWorldBounds } from './layout.js';

const encoder = new TextEncoder();

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function write16(view, offset, value) {
  view.setUint16(offset, value, true);
}

function write32(view, offset, value) {
  view.setUint32(offset, value, true);
}

export function createStoredZip(fileEntries) {
  const entries = Object.entries(fileEntries).map(([path, value]) => {
    const normalizedPath = path.replaceAll('\\', '/');
    if (!normalizedPath || normalizedPath.startsWith('/') ||
        normalizedPath.split('/').some(part => part === '..')) {
      throw new Error(`Unsafe export path: ${path}`);
    }
    const name = encoder.encode(normalizedPath);
    const data = typeof value === 'string' ? encoder.encode(value) : new Uint8Array(value);
    if (name.length > 0xffff || data.length > 0xffffffff) {
      throw new Error(`Export entry is too large: ${path}`);
    }
    return { name, data, crc: crc32(data) };
  });
  if (entries.length > 0xffff) throw new Error('Export contains too many files for a ZIP archive.');

  const localParts = [];
  const centralParts = [];
  let localOffset = 0;
  for (const entry of entries) {
    const localHeader = new Uint8Array(30 + entry.name.length);
    const localView = new DataView(localHeader.buffer);
    write32(localView, 0, 0x04034b50);
    write16(localView, 4, 20);
    write16(localView, 6, 0x0800);
    write16(localView, 8, 0);
    write32(localView, 14, entry.crc);
    write32(localView, 18, entry.data.length);
    write32(localView, 22, entry.data.length);
    write16(localView, 26, entry.name.length);
    localHeader.set(entry.name, 30);
    localParts.push(localHeader, entry.data);

    const centralHeader = new Uint8Array(46 + entry.name.length);
    const centralView = new DataView(centralHeader.buffer);
    write32(centralView, 0, 0x02014b50);
    write16(centralView, 4, 20);
    write16(centralView, 6, 20);
    write16(centralView, 8, 0x0800);
    write16(centralView, 10, 0);
    write32(centralView, 16, entry.crc);
    write32(centralView, 20, entry.data.length);
    write32(centralView, 24, entry.data.length);
    write16(centralView, 28, entry.name.length);
    write32(centralView, 42, localOffset);
    centralHeader.set(entry.name, 46);
    centralParts.push(centralHeader);
    localOffset += localHeader.length + entry.data.length;
  }

  const centralSize = centralParts.reduce((size, part) => size + part.length, 0);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  write32(endView, 0, 0x06054b50);
  write16(endView, 8, entries.length);
  write16(endView, 10, entries.length);
  write32(endView, 12, centralSize);
  write32(endView, 16, localOffset);

  return new Blob([...localParts, ...centralParts, end], { type: 'application/zip' });
}

function escapeXml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
  })[character]);
}

function colorToSvg(fill, id) {
  if (fill.type === 'linear-gradient' || fill.type === 'gradient') {
    const stops = fill.stops?.length
      ? fill.stops
      : [{ offset: 0, color: fill.color || '#3b82f6' }, { offset: 1, color: '#8b5cf6' }];
    return {
      definition: `<linearGradient id="${id}" x1="0%" y1="0%" x2="100%" y2="100%">${stops.map(stop =>
        `<stop offset="${Math.max(0, Math.min(1, Number(stop.offset) || 0)) * 100}%" stop-color="${escapeXml(stop.color)}"/>`
      ).join('')}</linearGradient>`,
      paint: `url(#${id})`
    };
  }
  return { definition: '', paint: escapeXml(fill.color || '#334155') };
}

function collectSelectedRoots(page, nodeIds) {
  const selected = new Set(nodeIds.filter(id => page.nodes[id]));
  return [...selected].filter(id => {
    let parentId = page.nodes[id]?.parentId;
    while (parentId) {
      if (selected.has(parentId)) return false;
      parentId = page.nodes[parentId]?.parentId;
    }
    return true;
  });
}

export function buildSvgExport(document, page, nodeIds) {
  const roots = collectSelectedRoots(page, nodeIds);
  if (!roots.length) throw new Error('Select at least one layer to export.');
  const bounds = computeGroupBounds(page, roots);
  if (!bounds || bounds.width <= 0 || bounds.height <= 0) {
    throw new Error('The selected layers do not have exportable dimensions.');
  }

  const definitions = [];
  let fillIndex = 0;
  const renderNode = (nodeId) => {
    const node = page.nodes[nodeId];
    if (!node || !node.visible) return '';
    const box = computeWorldBounds(page, nodeId);
    const x = box.x - bounds.x;
    const y = box.y - bounds.y;
    const opacity = Math.max(0, Math.min(1, Number(node.opacity ?? 1)));
    const paints = (node.style?.fills || []).filter(fill => fill.visible !== false).map(fill => {
      if (fill.type === 'image' || fill.type === 'video') {
        return fill.url
          ? `<image x="${x}" y="${y}" width="${box.width}" height="${box.height}" href="${escapeXml(fill.url)}" preserveAspectRatio="xMidYMid slice"/>`
          : '';
      }
      const { definition, paint } = colorToSvg(fill, `fill-${fillIndex++}`);
      if (definition) definitions.push(definition);
      return `<rect x="${x}" y="${y}" width="${box.width}" height="${box.height}" rx="${Number(node.style?.cornerRadius) || 0}" fill="${paint}" fill-opacity="${Math.max(0, Math.min(1, Number(fill.opacity ?? 1)))}"/>`;
    }).join('');

    let geometry = paints;
    if (node.type === 'ellipse') {
      geometry = (node.style?.fills || []).filter(fill => fill.visible !== false).map(fill => {
        const { definition, paint } = colorToSvg(fill, `fill-${fillIndex++}`);
        if (definition) definitions.push(definition);
        return `<ellipse cx="${x + box.width / 2}" cy="${y + box.height / 2}" rx="${box.width / 2}" ry="${box.height / 2}" fill="${paint}" fill-opacity="${Math.max(0, Math.min(1, Number(fill.opacity ?? 1)))}"/>`;
      }).join('');
    } else if (node.type === 'text' && node.text) {
      const text = escapeXml(node.text.content).split('\n').map((line, index) =>
        `<tspan x="${x}" dy="${index === 0 ? 0 : Number(node.text.lineHeight || 1.4) * Number(node.text.fontSize || 16)}">${line}</tspan>`
      ).join('');
      geometry = `<text x="${x}" y="${y + Number(node.text.fontSize || 16)}" fill="${escapeXml(node.text.color || '#f8fafc')}" font-family="${escapeXml(node.text.fontFamily || 'sans-serif')}" font-size="${Number(node.text.fontSize || 16)}" font-weight="${escapeXml(node.text.fontWeight || '400')}" text-anchor="${node.text.textAlign === 'center' ? 'middle' : node.text.textAlign === 'right' ? 'end' : 'start'}">${text}</text>`;
    } else if (node.type === 'line' || node.type === 'arrow') {
      const stroke = node.style?.strokes?.[0];
      geometry = stroke ? `<line x1="${x}" y1="${y + box.height / 2}" x2="${x + box.width}" y2="${y + box.height / 2}" stroke="${escapeXml(stroke.color || '#3b82f6')}" stroke-width="${Number(stroke.width || 1)}"/>` : '';
    }

    const children = (node.childIds || []).map(renderNode).join('');
    return `<g opacity="${opacity}" aria-label="${escapeXml(node.name)}">${geometry}${children}</g>`;
  };

  const content = roots.map(renderNode).join('');
  const title = escapeXml(document.name || 'DesignForge export');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${bounds.width}" height="${bounds.height}" viewBox="0 0 ${bounds.width} ${bounds.height}"><title>${title}</title><defs>${definitions.join('')}</defs>${content}</svg>`;
}
