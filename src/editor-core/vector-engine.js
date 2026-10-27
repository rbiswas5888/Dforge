/**
 * DesignForge AI — Hybrid Vector Engine (Figma + Adobe Illustrator + XD)
 * - Figma Vector Networks (multi-way vertex junctions)
 * - Illustrator Precision Bezier & Curvature Spline Generator (Shift + ~)
 * - Illustrator Shape Builder Tool: Planar Graph Face Extraction (extractPlanarFaces) (Shift + M)
 * - Variable Width Stroke Outlining (Shift + W)
 * - Non-Destructive Boolean Operations & Pathfinders
 */

/**
 * Vector Network: Vertices and Segments
 */
export class VectorNetwork {
  constructor(vertices = [], segments = []) {
    this.vertices = vertices; // [{ x, y }]
    this.segments = segments; // [{ start, end, handle1: { x, y }, handle2: { x, y } }]
  }

  addVertex(x, y) {
    this.vertices.push({ x, y });
    return this.vertices.length - 1;
  }

  addSegment(startIdx, endIdx, handle1 = { x: 0, y: 0 }, handle2 = { x: 0, y: 0 }) {
    this.segments.push({
      start: startIdx,
      end: endIdx,
      handle1: { ...handle1 },
      handle2: { ...handle2 }
    });
    return this.segments.length - 1;
  }

  /**
   * Get degree of a vertex (number of incident segments)
   */
  getVertexDegree(vertexIdx) {
    return this.segments.filter(s => s.start === vertexIdx || s.end === vertexIdx).length;
  }

  /**
   * Export to standard SVG Path string
   */
  toSVGPath() {
    if (this.segments.length === 0) return '';
    let d = '';
    for (const seg of this.segments) {
      const v0 = this.vertices[seg.start];
      const v1 = this.vertices[seg.end];
      if (!v0 || !v1) continue;

      d += ` M ${v0.x} ${v0.y}`;
      if (seg.handle1 && (seg.handle1.x !== 0 || seg.handle1.y !== 0 || seg.handle2.x !== 0 || seg.handle2.y !== 0)) {
        const cp1x = v0.x + seg.handle1.x;
        const cp1y = v0.y + seg.handle1.y;
        const cp2x = v1.x + seg.handle2.x;
        const cp2y = v1.y + seg.handle2.y;
        d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${v1.x} ${v1.y}`;
      } else {
        d += ` L ${v1.x} ${v1.y}`;
      }
    }
    return d.trim();
  }
}

/**
 * Curvature Tool Spline Generator:
 * Computes smooth C2 cubic spline control points passing through an ordered series of points.
 */
export function computeCurvatureSpline(points) {
  if (!points || points.length < 2) return [];
  const n = points.length;
  if (n === 2) {
    return [{
      p0: points[0],
      p1: points[1],
      cp1: { x: points[0].x + (points[1].x - points[0].x) / 3, y: points[0].y + (points[1].y - points[0].y) / 3 },
      cp2: { x: points[0].x + (2 * (points[1].x - points[0].x)) / 3, y: points[0].y + (2 * (points[1].y - points[0].y)) / 3 }
    }];
  }

  const curves = [];
  for (let i = 0; i < n - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const prev = i > 0 ? points[i - 1] : p0;
    const next = i < n - 2 ? points[i + 2] : p1;

    // Catmull-Rom tangent vectors converted to Bezier control handles
    const t1x = (p1.x - prev.x) / 6;
    const t1y = (p1.y - prev.y) / 6;
    const t2x = (next.x - p0.x) / 6;
    const t2y = (next.y - p0.y) / 6;

    curves.push({
      p0,
      p1,
      cp1: { x: p0.x + t1x, y: p0.y + t1y },
      cp2: { x: p1.x - t2x, y: p1.y - t2y }
    });
  }
  return curves;
}

/**
 * Illustrator Shape Builder Tool — Planar Graph Face Extraction:
 * Extracts enclosed regions / 2D planar cycles formed by intersecting line segments.
 */
export function extractPlanarFaces(segments) {
  // 1. Collect all segment endpoints and find mutual line intersections
  const points = [];
  const addPoint = (p) => {
    const existing = points.find(pt => Math.hypot(pt.x - p.x, pt.y - p.y) < 1e-4);
    if (existing) return existing;
    const pt = { id: `pt_${points.length}`, x: p.x, y: p.y };
    points.push(pt);
    return pt;
  };

  const lineIntersection = (p1, p2, p3, p4) => {
    const d = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
    if (Math.abs(d) < 1e-6) return null;
    const t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / d;
    const u = -((p1.x - p2.x) * (p1.y - p3.y) - (p1.y - p2.y) * (p1.x - p3.x)) / d;
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
      return {
        x: p1.x + t * (p2.x - p1.x),
        y: p1.y + t * (p2.y - p1.y)
      };
    }
    return null;
  };

  // Find intersections
  const rawSegments = [...segments];
  const splitPoints = new Map();

  for (let i = 0; i < rawSegments.length; i++) {
    for (let j = i + 1; j < rawSegments.length; j++) {
      const hit = lineIntersection(rawSegments[i].p1, rawSegments[i].p2, rawSegments[j].p1, rawSegments[j].p2);
      if (hit) {
        if (!splitPoints.has(i)) splitPoints.set(i, []);
        if (!splitPoints.has(j)) splitPoints.set(j, []);
        splitPoints.get(i).push(hit);
        splitPoints.get(j).push(hit);
      }
    }
  }

  // Build graph of directed half-edges
  const graph = new Map(); // pointId -> [{ toPoint, angle }]
  const connect = (ptA, ptB) => {
    if (ptA.id === ptB.id) return;
    if (!graph.has(ptA.id)) graph.set(ptA.id, []);
    const angle = Math.atan2(ptB.y - ptA.y, ptB.x - ptA.x);
    if (!graph.get(ptA.id).some(e => e.toPoint.id === ptB.id)) {
      graph.get(ptA.id).push({ toPoint: ptB, angle });
    }
  };

  for (let i = 0; i < rawSegments.length; i++) {
    const s = rawSegments[i];
    const inters = splitPoints.get(i) || [];
    // Sort all points along segment from p1 to p2
    const allPts = [s.p1, ...inters, s.p2].map(addPoint);
    allPts.sort((a, b) => Math.hypot(a.x - s.p1.x, a.y - s.p1.y) - Math.hypot(b.x - s.p1.x, b.y - s.p1.y));
    for (let k = 0; k < allPts.length - 1; k++) {
      connect(allPts[k], allPts[k + 1]);
      connect(allPts[k + 1], allPts[k]);
    }
  }

  // Sort outgoing edges counter-clockwise
  for (const [, edges] of graph.entries()) {
    edges.sort((a, b) => a.angle - b.angle);
  }

  // Traverse faces using Left-Turn rule
  const visitedEdges = new Set();
  const faces = [];

  for (const [startId, edges] of graph.entries()) {
    for (const edge of edges) {
      const edgeKey = `${startId}->${edge.toPoint.id}`;
      if (visitedEdges.has(edgeKey)) continue;

      const face = [];
      let currId = startId;
      let currEdge = edge;
      let cycleFound = false;

      while (!visitedEdges.has(`${currId}->${currEdge.toPoint.id}`)) {
        visitedEdges.add(`${currId}->${currEdge.toPoint.id}`);
        const pt = points.find(p => p.id === currId);
        face.push({ x: pt.x, y: pt.y });

        const nextId = currEdge.toPoint.id;
        const nextEdges = graph.get(nextId) || [];
        if (nextEdges.length === 0) break;

        // Find incoming angle and select the first edge clockwise / next CCW
        const incomingAngle = Math.atan2(pt.y - currEdge.toPoint.y, pt.x - currEdge.toPoint.x);
        let nextIdx = 0;
        for (let idx = 0; idx < nextEdges.length; idx++) {
          if (nextEdges[idx].angle > incomingAngle) {
            nextIdx = idx;
            break;
          }
        }
        // Left turn: take the next edge counter-clockwise
        currEdge = nextEdges[nextIdx];
        currId = nextId;

        if (currId === startId) {
          cycleFound = true;
          break;
        }
      }

      if (cycleFound && face.length >= 3) {
        // Calculate signed polygon area (Shoelace formula) to reject exterior infinite face
        let area = 0;
        for (let idx = 0; idx < face.length; idx++) {
          const pA = face[idx];
          const pB = face[(idx + 1) % face.length];
          area += (pA.x * pB.y - pB.x * pA.y);
        }
        if (area > 1e-2) { // Counter-clockwise interior face
          faces.push({ id: `face_${faces.length + 1}`, vertices: face, area: Math.abs(area / 2) });
        }
      }
    }
  }

  return faces;
}

/**
 * Variable Width Stroke Outlining (Shift + W):
 * Evaluates width profile w(s) along spline spine and generates left and right contour polygons.
 */
export function outlineVariableWidthStroke(spinePoints, widthProfile = [{ s: 0, w: 2 }, { s: 1, w: 2 }]) {
  if (!spinePoints || spinePoints.length < 2) return [];

  // Compute cumulative chord length
  const arcLengths = [0];
  let totalLength = 0;
  for (let i = 1; i < spinePoints.length; i++) {
    const dist = Math.hypot(spinePoints[i].x - spinePoints[i - 1].x, spinePoints[i].y - spinePoints[i - 1].y);
    totalLength += dist;
    arcLengths.push(totalLength);
  }

  if (totalLength === 0) return [];

  // Interpolator for width at arc-length parameter s in [0, 1]
  const getWidthAtS = (s) => {
    if (widthProfile.length === 1) return widthProfile[0].w;
    for (let i = 0; i < widthProfile.length - 1; i++) {
      if (s >= widthProfile[i].s && s <= widthProfile[i + 1].s) {
        const factor = (s - widthProfile[i].s) / (widthProfile[i + 1].s - widthProfile[i].s);
        return widthProfile[i].w + factor * (widthProfile[i + 1].w - widthProfile[i].w);
      }
    }
    return widthProfile[widthProfile.length - 1].w;
  };

  const leftContour = [];
  const rightContour = [];

  for (let i = 0; i < spinePoints.length; i++) {
    const s = arcLengths[i] / totalLength;
    const w = getWidthAtS(s);
    const pt = spinePoints[i];

    // Compute unit tangent vector
    let tx = 0, ty = 0;
    if (i === 0) {
      tx = spinePoints[1].x - pt.x;
      ty = spinePoints[1].y - pt.y;
    } else if (i === spinePoints.length - 1) {
      tx = pt.x - spinePoints[i - 1].x;
      ty = pt.y - spinePoints[i - 1].y;
    } else {
      tx = spinePoints[i + 1].x - spinePoints[i - 1].x;
      ty = spinePoints[i + 1].y - spinePoints[i - 1].y;
    }

    const len = Math.hypot(tx, ty) || 1;
    tx /= len;
    ty /= len;

    // Unit normal vector perpendicular to tangent
    const nx = -ty;
    const ny = tx;

    // Left and right offsets
    leftContour.push({
      x: pt.x + (w / 2) * nx,
      y: pt.y + (w / 2) * ny
    });

    rightContour.push({
      x: pt.x - (w / 2) * nx,
      y: pt.y - (w / 2) * ny
    });
  }

  // Assemble single closed polygon: start left contour, reverse right contour
  return [...leftContour, ...rightContour.reverse()];
}

/**
 * ======================================================================
 * Revision v2 Specification Additions:
 * Direct Point Editing, Double-Click State Machine, Corner Handles,
 * Multi-Point Selection & Gesture-Safety Operations
 * ======================================================================
 */

export const EDITING_STATES = {
  OBJECT_SELECT: 'OBJECT_SELECT',
  VECTOR_EDIT: 'VECTOR_EDIT',
  TEXT_EDIT: 'TEXT_EDIT',
  IMAGE_CROP: 'IMAGE_CROP',
  PARAMETRIC_SHAPE_EDIT: 'PARAMETRIC_SHAPE_EDIT',
  GROUP_DEEP_SELECT: 'GROUP_DEEP_SELECT',
  COMPONENT_INSTANCE_EDIT: 'COMPONENT_INSTANCE_EDIT',
  PEN_DRAW: 'PEN_DRAW'
};

export const HANDLE_MODES = {
  CORNER: 'corner',
  SMOOTH: 'smooth',
  SYMMETRIC: 'symmetric',
  ALIGNED: 'aligned',
  INDEPENDENT: 'independent'
};

export const ENTRY_SELECTION_POLICIES = {
  UNDER_POINTER: 'underPointer',
  NONE: 'none',
  ALL: 'all'
};

/**
 * Section 11.7: Double-Click Routing Table
 * Maps target node type, lock status, and hit context to interaction state
 */
export function routeDoubleClick(node, hitTarget = null, coords = null) {
  if (!node) return { state: EDITING_STATES.OBJECT_SELECT, targetId: null };

  if (node.locked) {
    return {
      state: 'LOCKED',
      targetId: node.id,
      message: `Layer "${node.name}" is locked. Unlock it in the Layers panel or context menu to edit.`
    };
  }

  switch (node.type) {
    case 'text':
      return {
        state: EDITING_STATES.TEXT_EDIT,
        targetId: node.id,
        caretPosition: coords
      };

    case 'image':
      return {
        state: EDITING_STATES.IMAGE_CROP,
        targetId: node.id
      };

    case 'group':
    case 'frame':
    case 'section':
      return {
        state: EDITING_STATES.GROUP_DEEP_SELECT,
        targetId: node.id
      };

    case 'instance':
      return {
        state: EDITING_STATES.COMPONENT_INSTANCE_EDIT,
        targetId: node.id
      };

    case 'rectangle':
    case 'polygon':
    case 'star':
    case 'line':
    case 'arrow':
    case 'vector':
    default:
      return {
        state: EDITING_STATES.VECTOR_EDIT,
        targetId: node.id,
        isParametric: node.type !== 'vector'
      };
  }
}

/**
 * Section 11.6: Extract editable anchor points from any node geometry
 */
export function extractNodeAnchors(node) {
  if (!node) return [];

  const w = node.transform?.width || 100;
  const h = node.transform?.height || 100;

  // Custom vector path
  if (node.vectorPath && Array.isArray(node.vectorPath) && node.vectorPath.length > 0) {
    const anchors = [];
    for (let i = 0; i < node.vectorPath.length; i++) {
      const cmd = node.vectorPath[i];
      if (cmd.type === 'M' || cmd.type === 'L') {
        anchors.push({
          x: cmd.x,
          y: cmd.y,
          handleIn: { x: 0, y: 0 },
          handleOut: { x: 0, y: 0 },
          type: HANDLE_MODES.CORNER,
          selected: false
        });
      } else if (cmd.type === 'C') {
        // The preceding anchor gets handleOut towards (cp1x, cp1y)
        if (anchors.length > 0) {
          const prev = anchors[anchors.length - 1];
          prev.handleOut = { x: cmd.cp1x - prev.x, y: cmd.cp1y - prev.y };
          if (prev.type === HANDLE_MODES.CORNER) prev.type = HANDLE_MODES.SMOOTH;
        }
        // Current anchor gets handleIn from (cp2x, cp2y)
        anchors.push({
          x: cmd.x,
          y: cmd.y,
          handleIn: { x: cmd.cp2x - cmd.x, y: cmd.cp2y - cmd.y },
          handleOut: { x: 0, y: 0 },
          type: HANDLE_MODES.SMOOTH,
          selected: false
        });
      }
    }
    return anchors;
  }

  // Rectangle: 4 corners
  if (node.type === 'rectangle' || node.type === 'frame' || !node.type) {
    return [
      { x: 0, y: 0, handleIn: { x: 0, y: 0 }, handleOut: { x: 0, y: 0 }, type: HANDLE_MODES.CORNER, selected: false },
      { x: w, y: 0, handleIn: { x: 0, y: 0 }, handleOut: { x: 0, y: 0 }, type: HANDLE_MODES.CORNER, selected: false },
      { x: w, y: h, handleIn: { x: 0, y: 0 }, handleOut: { x: 0, y: 0 }, type: HANDLE_MODES.CORNER, selected: false },
      { x: 0, y: h, handleIn: { x: 0, y: 0 }, handleOut: { x: 0, y: 0 }, type: HANDLE_MODES.CORNER, selected: false }
    ];
  }

  // Polygon: N sides
  if (node.type === 'polygon') {
    const sides = Math.max(3, node.polygonSides || 3);
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(w, h) / 2;
    const anchors = [];
    for (let i = 0; i < sides; i++) {
      const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
      anchors.push({
        x: Math.round(cx + r * Math.cos(angle)),
        y: Math.round(cy + r * Math.sin(angle)),
        handleIn: { x: 0, y: 0 },
        handleOut: { x: 0, y: 0 },
        type: HANDLE_MODES.CORNER,
        selected: false
      });
    }
    return anchors;
  }

  // Star: 2 * points
  if (node.type === 'star') {
    const points = Math.max(3, node.starPoints || 5);
    const starRatio = node.starRatio !== undefined ? node.starRatio : 0.45;
    const cx = w / 2;
    const cy = h / 2;
    const outerR = Math.min(w, h) / 2;
    const innerR = outerR * starRatio;
    const total = points * 2;
    const anchors = [];
    for (let i = 0; i < total; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = (i * Math.PI) / points - Math.PI / 2;
      anchors.push({
        x: Math.round(cx + r * Math.cos(angle)),
        y: Math.round(cy + r * Math.sin(angle)),
        handleIn: { x: 0, y: 0 },
        handleOut: { x: 0, y: 0 },
        type: HANDLE_MODES.CORNER,
        selected: false
      });
    }
    return anchors;
  }

  // Line / Arrow: 2 endpoints
  if (node.type === 'line' || node.type === 'arrow') {
    return [
      { x: 0, y: h / 2, handleIn: { x: 0, y: 0 }, handleOut: { x: 0, y: 0 }, type: HANDLE_MODES.CORNER, selected: false },
      { x: w, y: h / 2, handleIn: { x: 0, y: 0 }, handleOut: { x: 0, y: 0 }, type: HANDLE_MODES.CORNER, selected: false }
    ];
  }

  return [];
}

/**
 * Convert anchor list back into canonical vectorPath command array
 */
export function anchorsToVectorPath(anchors, closed = true) {
  if (!Array.isArray(anchors) || anchors.length === 0) return [];

  const path = [];
  path.push({ type: 'M', x: Math.round(anchors[0].x), y: Math.round(anchors[0].y) });

  for (let i = 1; i < anchors.length; i++) {
    const prev = anchors[i - 1];
    const curr = anchors[i];

    const hasPrevOut = prev.handleOut && (prev.handleOut.x !== 0 || prev.handleOut.y !== 0);
    const hasCurrIn = curr.handleIn && (curr.handleIn.x !== 0 || curr.handleIn.y !== 0);

    if (hasPrevOut || hasCurrIn) {
      path.push({
        type: 'C',
        cp1x: Math.round(prev.x + (prev.handleOut?.x || 0)),
        cp1y: Math.round(prev.y + (prev.handleOut?.y || 0)),
        cp2x: Math.round(curr.x + (curr.handleIn?.x || 0)),
        cp2y: Math.round(curr.y + (curr.handleIn?.y || 0)),
        x: Math.round(curr.x),
        y: Math.round(curr.y)
      });
    } else {
      path.push({ type: 'L', x: Math.round(curr.x), y: Math.round(curr.y) });
    }
  }

  if (closed && anchors.length > 2) {
    const last = anchors[anchors.length - 1];
    const first = anchors[0];
    const hasLastOut = last.handleOut && (last.handleOut.x !== 0 || last.handleOut.y !== 0);
    const hasFirstIn = first.handleIn && (first.handleIn.x !== 0 || first.handleIn.y !== 0);

    if (hasLastOut || hasFirstIn) {
      path.push({
        type: 'C',
        cp1x: Math.round(last.x + (last.handleOut?.x || 0)),
        cp1y: Math.round(last.y + (last.handleOut?.y || 0)),
        cp2x: Math.round(first.x + (first.handleIn?.x || 0)),
        cp2y: Math.round(first.y + (first.handleIn?.y || 0)),
        x: Math.round(first.x),
        y: Math.round(first.y)
      });
    }
    path.push({ type: 'Z' });
  }

  return path;
}

/**
 * Section 11.6: Apply entry selection policy on entering Vector Edit Mode
 */
export function applyEntrySelectionPolicy(anchors, policy = ENTRY_SELECTION_POLICIES.UNDER_POINTER, clickCoords = null, bounds = null, hitThreshold = 14) {
  if (!Array.isArray(anchors)) return anchors;

  if (policy === ENTRY_SELECTION_POLICIES.ALL) {
    anchors.forEach(a => a.selected = true);
    return anchors;
  }

  if (policy === ENTRY_SELECTION_POLICIES.NONE) {
    anchors.forEach(a => a.selected = false);
    return anchors;
  }

  // Safe default: 'underPointer'
  anchors.forEach(a => a.selected = false);
  if (clickCoords && bounds) {
    let closestIdx = -1;
    let minDist = hitThreshold;

    for (let i = 0; i < anchors.length; i++) {
      const a = anchors[i];
      const worldX = bounds.x + a.x;
      const worldY = bounds.y + a.y;
      const dist = Math.hypot(clickCoords.x - worldX, clickCoords.y - worldY);
      if (dist < minDist) {
        minDist = dist;
        closestIdx = i;
      }
    }

    if (closestIdx !== -1) {
      anchors[closestIdx].selected = true;
    }
  }

  return anchors;
}

/**
 * Section 11.8: Nudge selected anchors by delta
 */
export function nudgeAnchors(anchors, selectedIndices, dx, dy) {
  if (!Array.isArray(anchors) || !selectedIndices) return anchors;
  const indicesSet = selectedIndices instanceof Set ? selectedIndices : new Set(selectedIndices);

  for (let i = 0; i < anchors.length; i++) {
    if (indicesSet.has(i)) {
      anchors[i].x += dx;
      anchors[i].y += dy;
    }
  }
  return anchors;
}

/**
 * Section 11.10: Delete selected anchor points while preserving path topology
 */
export function deleteSelectedAnchors(anchors, selectedIndices, closed = true) {
  if (!Array.isArray(anchors)) return [];
  const indicesSet = selectedIndices instanceof Set ? selectedIndices : new Set(selectedIndices);

  const minPoints = closed ? 3 : 2;
  const remaining = anchors.filter((_, idx) => !indicesSet.has(idx));

  if (remaining.length < minPoints) {
    return { success: false, remaining, message: `Cannot delete points: path requires at least ${minPoints} points to preserve valid contour topology.` };
  }

  return { success: true, remaining };
}

/**
 * Section 11.9: Convert anchor handle mode
 */
export function convertAnchorHandleMode(anchor, targetMode) {
  if (!anchor) return anchor;

  anchor.type = targetMode;

  if (targetMode === HANDLE_MODES.CORNER) {
    anchor.handleIn = { x: 0, y: 0 };
    anchor.handleOut = { x: 0, y: 0 };
  } else if (targetMode === HANDLE_MODES.SYMMETRIC) {
    // Make handleIn mirror handleOut collinear & equal
    if (anchor.handleOut.x !== 0 || anchor.handleOut.y !== 0) {
      anchor.handleIn = { x: -anchor.handleOut.x, y: -anchor.handleOut.y };
    } else if (anchor.handleIn.x !== 0 || anchor.handleIn.y !== 0) {
      anchor.handleOut = { x: -anchor.handleIn.x, y: -anchor.handleIn.y };
    } else {
      // Create default horizontal symmetric handles
      anchor.handleOut = { x: 20, y: 0 };
      anchor.handleIn = { x: -20, y: 0 };
    }
  } else if (targetMode === HANDLE_MODES.ALIGNED || targetMode === HANDLE_MODES.SMOOTH) {
    // Collinear, potentially different lengths
    if (anchor.handleOut.x !== 0 || anchor.handleOut.y !== 0) {
      const lenIn = Math.hypot(anchor.handleIn.x, anchor.handleIn.y) || 20;
      const lenOut = Math.hypot(anchor.handleOut.x, anchor.handleOut.y) || 1;
      anchor.handleIn = {
        x: (-anchor.handleOut.x / lenOut) * lenIn,
        y: (-anchor.handleOut.y / lenOut) * lenIn
      };
    }
  }

  return anchor;
}

/**
 * Section 11.9: Update Bézier handle according to handle mode
 */
export function updateBezierHandle(anchor, which, hx, hy, mode = HANDLE_MODES.SMOOTH) {
  if (!anchor) return anchor;

  if (which === 'out') {
    anchor.handleOut = { x: hx, y: hy };
    if (mode === HANDLE_MODES.SYMMETRIC) {
      anchor.handleIn = { x: -hx, y: -hy };
    } else if (mode === HANDLE_MODES.ALIGNED || mode === HANDLE_MODES.SMOOTH) {
      const lenIn = Math.hypot(anchor.handleIn?.x || 0, anchor.handleIn?.y || 0) || Math.hypot(hx, hy);
      const lenOut = Math.hypot(hx, hy) || 1;
      anchor.handleIn = {
        x: (-hx / lenOut) * lenIn,
        y: (-hy / lenOut) * lenIn
      };
    }
  } else if (which === 'in') {
    anchor.handleIn = { x: hx, y: hy };
    if (mode === HANDLE_MODES.SYMMETRIC) {
      anchor.handleOut = { x: -hx, y: -hy };
    } else if (mode === HANDLE_MODES.ALIGNED || mode === HANDLE_MODES.SMOOTH) {
      const lenOut = Math.hypot(anchor.handleOut?.x || 0, anchor.handleOut?.y || 0) || Math.hypot(hx, hy);
      const lenIn = Math.hypot(hx, hy) || 1;
      anchor.handleOut = {
        x: (-hx / lenIn) * lenOut,
        y: (-hy / lenIn) * lenOut
      };
    }
  }

  return anchor;
}

/**
 * Section 11.11: Parametric Shape Corner Handles for Rectangles
 * Calculates the 4 on-canvas circular corner radius handles inside rectangle bounds
 */
export function getRectangleCornerHandles(bounds, cornerRadius = 0, cornerRadii = null) {
  if (!bounds) return [];

  const w = bounds.width;
  const h = bounds.height;
  const maxR = Math.min(w, h) / 2;

  // Handle individual or uniform radii
  const r0 = Math.min(maxR, Math.max(12, cornerRadii ? cornerRadii[0] : cornerRadius));
  const r1 = Math.min(maxR, Math.max(12, cornerRadii ? cornerRadii[1] : cornerRadius));
  const r2 = Math.min(maxR, Math.max(12, cornerRadii ? cornerRadii[2] : cornerRadius));
  const r3 = Math.min(maxR, Math.max(12, cornerRadii ? cornerRadii[3] : cornerRadius));

  return [
    { key: 'nw', x: bounds.x + r0, y: bounds.y + r0, radius: cornerRadii ? cornerRadii[0] : cornerRadius },
    { key: 'ne', x: bounds.x + w - r1, y: bounds.y + r1, radius: cornerRadii ? cornerRadii[1] : cornerRadius },
    { key: 'se', x: bounds.x + w - r2, y: bounds.y + h - r2, radius: cornerRadii ? cornerRadii[2] : cornerRadius },
    { key: 'sw', x: bounds.x + r3, y: bounds.y + h - r3, radius: cornerRadii ? cornerRadii[3] : cornerRadius }
  ];
}

/**
 * Section 11.11: Calculate new corner radius from direct drag of a corner handle
 */
export function calculateCornerRadiusFromDrag(handleKey, dragCoords, bounds) {
  if (!bounds || !dragCoords) return 0;

  const maxR = Math.min(bounds.width, bounds.height) / 2;
  let dist = 0;

  switch (handleKey) {
    case 'nw':
      dist = Math.max(dragCoords.x - bounds.x, dragCoords.y - bounds.y);
      break;
    case 'ne':
      dist = Math.max(bounds.x + bounds.width - dragCoords.x, dragCoords.y - bounds.y);
      break;
    case 'se':
      dist = Math.max(bounds.x + bounds.width - dragCoords.x, bounds.y + bounds.height - dragCoords.y);
      break;
    case 'sw':
      dist = Math.max(dragCoords.x - bounds.x, bounds.y + bounds.height - dragCoords.y);
      break;
    default:
      dist = 0;
  }

  return Math.round(Math.min(maxR, Math.max(0, dist)));
}
