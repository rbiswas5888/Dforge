/**
 * DesignForge AI - Layout & Geometry Engine
 * Auto Layout computation, recursive bounds resolution, and smart snapping
 */

/**
 * Calculates absolute world bounds for a node, taking into account parent offsets
 * and auto-layout rules.
 */
export function computeWorldBounds(page, nodeId, cache = new Map()) {
  if (cache.has(nodeId)) return cache.get(nodeId);

  const node = page.nodes[nodeId];
  if (!node || !node.transform) {
    const fallback = { x: 0, y: 0, width: 0, height: 0 };
    cache.set(nodeId, fallback);
    return fallback;
  }

  let worldX = node.transform.x;
  let worldY = node.transform.y;

  if (node.parentId && page.nodes[node.parentId]) {
    const parentBounds = computeWorldBounds(page, node.parentId, cache);
    const parent = page.nodes[node.parentId];

    if (parent.layout && parent.layout.mode !== 'none') {
      // Auto-layout computed relative position
      const offset = computeAutoLayoutChildOffset(parent, node, page);
      worldX = parentBounds.x + offset.x;
      worldY = parentBounds.y + offset.y;
    } else {
      // Standard nested absolute coordinate
      worldX = parentBounds.x + node.transform.x;
      worldY = parentBounds.y + node.transform.y;
    }
  }

  const bounds = {
    x: worldX,
    y: worldY,
    width: node.transform.width,
    height: node.transform.height
  };

  cache.set(nodeId, bounds);
  return bounds;
}

/**
 * Computes relative (x, y) offset for a child inside an auto-layout parent container
 */
export function computeAutoLayoutChildOffset(parent, child, page) {
  const mode = parent.layout.mode;
  const pTop = parent.layout.paddingTop || 0;
  const pLeft = parent.layout.paddingLeft || 0;
  const pRight = parent.layout.paddingRight || 0;
  const pBottom = parent.layout.paddingBottom || 0;
  const gap = parent.layout.gap || 0;
  const alignItems = parent.layout.alignItems || 'start';
  const justifyContent = parent.layout.justifyContent || 'start';

  const childIndex = parent.childIds.indexOf(child.id);
  if (childIndex === -1) return { x: child.transform.x, y: child.transform.y };

  if (mode === 'stack-horizontal') {
    // Calculate total children width for justification
    let accumulatedX = pLeft;
    for (let i = 0; i < childIndex; i++) {
      const prevChild = page.nodes[parent.childIds[i]];
      if (prevChild && prevChild.transform) {
        accumulatedX += prevChild.transform.width + gap;
      }
    }

    // Y position based on alignItems
    const availableHeight = parent.transform.height - pTop - pBottom;
    let y = pTop;
    if (alignItems === 'center') {
      y = pTop + Math.max(0, (availableHeight - child.transform.height) / 2);
    } else if (alignItems === 'end') {
      y = parent.transform.height - pBottom - child.transform.height;
    }

    // Handle space-between if specified
    if (justifyContent === 'space-between' && parent.childIds.length > 1) {
      let totalChildrenWidth = 0;
      parent.childIds.forEach(cid => {
        const c = page.nodes[cid];
        if (c?.transform) totalChildrenWidth += c.transform.width;
      });
      const dynamicGap = Math.max(gap, (parent.transform.width - pLeft - pRight - totalChildrenWidth) / (parent.childIds.length - 1));
      let dynX = pLeft;
      for (let i = 0; i < childIndex; i++) {
        const prevChild = page.nodes[parent.childIds[i]];
        if (prevChild?.transform) {
          dynX += prevChild.transform.width + dynamicGap;
        }
      }
      return { x: dynX, y };
    }

    return { x: accumulatedX, y };
  } else if (mode === 'stack-vertical') {
    let accumulatedY = pTop;
    for (let i = 0; i < childIndex; i++) {
      const prevChild = page.nodes[parent.childIds[i]];
      if (prevChild && prevChild.transform) {
        accumulatedY += prevChild.transform.height + gap;
      }
    }

    // X position based on alignItems
    const availableWidth = parent.transform.width - pLeft - pRight;
    let x = pLeft;
    if (alignItems === 'center') {
      x = pLeft + Math.max(0, (availableWidth - child.transform.width) / 2);
    } else if (alignItems === 'end') {
      x = parent.transform.width - pRight - child.transform.width;
    }

    return { x, y: accumulatedY };
  }

  return { x: child.transform.x, y: child.transform.y };
}

/**
 * Computes bounding box enclosing multiple node IDs
 */
export function computeGroupBounds(page, nodeIds) {
  if (!nodeIds || nodeIds.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const id of nodeIds) {
    const b = computeWorldBounds(page, id);
    if (b) {
      minX = Math.min(minX, b.x);
      minY = Math.min(minY, b.y);
      maxX = Math.max(maxX, b.x + b.width);
      maxY = Math.max(maxY, b.y + b.height);
    }
  }

  if (minX === Infinity) return null;
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}

/**
 * Calculates smart snapping guides between dragging bounds and other root/sibling objects
 */
export function findSnapGuides(page, activeBounds, activeIds = [], threshold = 6) {
  const guides = [];
  let snapX = null;
  let snapY = null;
  let minDiffX = threshold;
  let minDiffY = threshold;

  const targetEdgesX = [activeBounds.x, activeBounds.x + activeBounds.width / 2, activeBounds.x + activeBounds.width];
  const targetEdgesY = [activeBounds.y, activeBounds.y + activeBounds.height / 2, activeBounds.y + activeBounds.height];

  for (const id of page.rootIds) {
    if (activeIds.includes(id)) continue;
    const b = computeWorldBounds(page, id);
    if (!b) continue;

    const otherEdgesX = [b.x, b.x + b.width / 2, b.x + b.width];
    const otherEdgesY = [b.y, b.y + b.height / 2, b.y + b.height];

    // Check X snap
    for (const tx of targetEdgesX) {
      for (const ox of otherEdgesX) {
        const diff = Math.abs(tx - ox);
        if (diff < minDiffX) {
          minDiffX = diff;
          snapX = ox - (tx - activeBounds.x);
          guides.push({ type: 'vertical', x: ox });
        }
      }
    }

    // Check Y snap
    for (const ty of targetEdgesY) {
      for (const oy of otherEdgesY) {
        const diff = Math.abs(ty - oy);
        if (diff < minDiffY) {
          minDiffY = diff;
          snapY = oy - (ty - activeBounds.y);
          guides.push({ type: 'horizontal', y: oy });
        }
      }
    }
  }

  return { snapX, snapY, guides };
}
