import { parseColorString, rgbToHex } from './color-picker.js';

function normalizeColor(value) {
  const parsed = parseColorString(value);
  return parsed ? rgbToHex(parsed.r, parsed.g, parsed.b, parsed.a) : null;
}

function getSelectedRoots(selectedIds, nodes) {
  const selected = new Set(selectedIds);
  return [...selected].filter(nodeId => {
    let node = nodes[nodeId];
    const visited = new Set();
    while (node?.parentId && !visited.has(node.parentId)) {
      if (selected.has(node.parentId)) return false;
      visited.add(node.parentId);
      node = nodes[node.parentId];
    }
    return true;
  });
}

export function collectSelectionColors(page, selectedIds, tokens = []) {
  const nodes = page?.nodes && typeof page.nodes === 'object' ? page.nodes : {};
  const tokenNames = new Map(tokens.map(token => [token.id, token.name]));
  const tokenIdsByName = new Map(tokens.map(token => [String(token.name).toLowerCase(), token.id]));
  const entries = new Map();
  const visited = new Set();

  const add = (node, color, target, embeddedTokenId, embeddedTokenName) => {
    const normalized = normalizeColor(color);
    if (!normalized) return;
    const bindingId = embeddedTokenId || node.tokenBindings?.[target.bindingPath] || null;
    const tokenName = embeddedTokenName || tokenNames.get(bindingId) || null;
    const tokenId = bindingId || (tokenName ? tokenIdsByName.get(tokenName.toLowerCase()) : null) || null;
    const unresolved = (Boolean(bindingId) && !tokenNames.has(bindingId)) || (Boolean(tokenName) && !tokenId);
    const key = tokenId
      ? `token:${tokenId}`
      : unresolved
        ? `unresolved:${String(tokenName || bindingId).toLowerCase()}:${normalized}`
        : `plain:${normalized}`;
    const entry = entries.get(key) || {
      key,
      color: normalized,
      count: 0,
      tokenId,
      tokenName: tokenName || (bindingId ? `Missing token (${bindingId})` : null),
      unresolved,
      kinds: new Set(),
      targets: [],
      nodeIds: new Set()
    };
    entry.count += 1;
    entry.kinds.add(target.kind);
    entry.targets.push({ nodeId: node.id, ...target, tokenId, tokenName, unresolved });
    entry.nodeIds.add(node.id);
    entries.set(key, entry);
  };

  const visit = nodeId => {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    const node = nodes[nodeId];
    if (!node || node.visible === false) return;

    for (const [index, fill] of (Array.isArray(node.style?.fills) ? node.style.fills : []).entries()) {
      if (!fill || fill.visible === false || fill.type === 'image' || fill.type === 'video') continue;
      if (Array.isArray(fill.stops) && fill.stops.length > 0) {
        for (const [stopIndex, stop] of fill.stops.entries()) {
          if (!stop || stop.visible === false) continue;
          add(node, stop.color, {
            kind: 'gradient stop',
            bindingPath: `fills.${index}.stops.${stopIndex}.color`,
            fillIndex: index,
            stopIndex
          }, stop.tokenId || fill.tokenId, stop.tokenName || fill.tokenName);
        }
      } else {
        add(node, fill.color, {
          kind: 'fill',
          bindingPath: `fills.${index}.color`,
          fillIndex: index
        }, fill.tokenId, fill.tokenName);
      }
    }

    for (const [index, stroke] of (Array.isArray(node.style?.strokes) ? node.style.strokes : []).entries()) {
      if (!stroke || stroke.visible === false) continue;
      if (Array.isArray(stroke.stops) && stroke.stops.length > 0) {
        for (const [stopIndex, stop] of stroke.stops.entries()) {
          if (!stop || stop.visible === false) continue;
          add(node, stop.color, {
            kind: 'gradient stop',
            bindingPath: `strokes.${index}.stops.${stopIndex}.color`,
            strokeIndex: index,
            stopIndex
          }, stop.tokenId || stroke.tokenId, stop.tokenName || stroke.tokenName);
        }
      } else {
        add(node, stroke.color, {
          kind: 'stroke',
          bindingPath: `strokes.${index}.color`,
          strokeIndex: index
        }, stroke.tokenId, stroke.tokenName);
      }
    }

    if (node.type === 'text' && node.text?.visible !== false) {
      add(node, node.text?.color, {
        kind: 'text',
        bindingPath: 'text.color'
      }, node.text?.tokenId, node.text?.tokenName);
    }

    for (const childId of Array.isArray(node.childIds) ? node.childIds : []) visit(childId);
  };

  for (const nodeId of getSelectedRoots(selectedIds, nodes)) visit(nodeId);
  return [...entries.values()].map(entry => ({
    ...entry,
    kinds: [...entry.kinds],
    nodeIds: [...entry.nodeIds]
  }));
}

export function buildSelectionColorUpdates(page, targets, color, { detachBindings = false } = {}) {
  const normalized = normalizeColor(color);
  if (!normalized) throw new Error(`Invalid color value: ${color}`);

  const updates = new Map();
  for (const target of targets) {
    if ((target.tokenId || target.tokenName || target.unresolved) && !detachBindings) {
      throw new Error('Changing a token-bound color requires explicit detachment.');
    }
    const node = page?.nodes?.[target.nodeId];
    if (!node) continue;
    const patch = updates.get(node.id) || {};

    if (target.kind === 'fill' || (target.kind === 'gradient stop' && target.fillIndex !== undefined)) {
      const fills = patch.style?.fills || JSON.parse(JSON.stringify(node.style?.fills || []));
      const fill = fills[target.fillIndex];
      if (!fill) continue;
      if (target.kind === 'gradient stop') {
        const stop = fill.stops?.[target.stopIndex];
        if (!stop) continue;
        stop.color = normalized;
        if (detachBindings) {
          delete stop.tokenId;
          delete stop.tokenName;
        }
      } else {
        fill.color = normalized;
        if (detachBindings) {
          delete fill.tokenId;
          delete fill.tokenName;
        }
      }
      patch.style = { ...(patch.style || {}), fills };
    } else if (target.kind === 'gradient stop' && target.strokeIndex !== undefined) {
      const strokes = patch.style?.strokes || JSON.parse(JSON.stringify(node.style?.strokes || []));
      const stroke = strokes[target.strokeIndex];
      const stop = stroke?.stops?.[target.stopIndex];
      if (!stop) continue;
      stop.color = normalized;
      if (detachBindings) {
        delete stop.tokenId;
        delete stop.tokenName;
      }
      patch.style = { ...(patch.style || {}), strokes };
    } else if (target.kind === 'stroke') {
      const strokes = patch.style?.strokes || JSON.parse(JSON.stringify(node.style?.strokes || []));
      const stroke = strokes[target.strokeIndex];
      if (!stroke) continue;
      stroke.color = normalized;
      if (detachBindings) {
        delete stroke.tokenId;
        delete stroke.tokenName;
      }
      patch.style = { ...(patch.style || {}), strokes };
    } else if (target.kind === 'text') {
      patch.text = { ...(patch.text || node.text || {}), color: normalized };
      if (detachBindings) {
        delete patch.text.tokenId;
        delete patch.text.tokenName;
      }
    } else {
      continue;
    }

    const bindingPath = target.bindingPath;
    if (detachBindings && bindingPath && node.tokenBindings?.[bindingPath]) {
      const tokenBindings = { ...(patch.tokenBindings || node.tokenBindings) };
      delete tokenBindings[bindingPath];
      patch.tokenBindings = tokenBindings;
    }
    updates.set(node.id, patch);
  }

  return [...updates].map(([nodeId, patch]) => ({ nodeId, patch }));
}
