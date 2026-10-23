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
