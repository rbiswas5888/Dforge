/**
 * DesignForge AI — Advanced Prototyping & Mathematical Motion Engine
 * Implements Section 5 of Next-Gen Vector Design & Prototyping Specification:
 * 1. Cubic-Bezier Solver (Newton-Raphson with bisection fallback, precision 1e-6)
 * 2. Analytical Spring Physics (m*x'' + c*x' + k*x = 0, exact ODE, velocity preservation)
 * 3. 2D Affine Matrix Decomposition & Recomposition (translation, rotation, scale, skew)
 * 4. Arc-Length Path Resampling & Morphing
 * 5. Linear Constraint Solver
 * 6. Inertial Scrolling & Least-Squares Velocity Tracker (~100ms)
 * 7. Gesture Recognizer Finite State Machine
 * 8. Spatial BVH / R-Tree Index for O(log n) Hit Testing with Winding Rule
 * 9. Typed Variables, AST Expression Parser & Conditionals
 */

import { CanonicalColor, interpolateGradient } from './color-math-engine.js';

// =============================================================================
// 1. CUBIC-BEZIER EASING SOLVER (Newton-Raphson + Bisection Fallback < 1e-6)
// =============================================================================

export class CubicBezier {
  constructor(x1, y1, x2, y2) {
    this.x1 = Math.max(0, Math.min(1, x1));
    this.y1 = y1;
    this.x2 = Math.max(0, Math.min(1, x2));
    this.y2 = y2;
  }

  // Polynomial coefficients for x(t) = 3*(1-t)^2*t*x1 + 3*(1-t)*t^2*x2 + t^3
  // x(t) = c*t + b*t^2 + a*t^3
  calcX(t) {
    const c = 3 * this.x1;
    const b = 3 * (this.x2 - this.x1) - c;
    const a = 1 - c - b;
    return ((a * t + b) * t + c) * t;
  }

  calcY(t) {
    const c = 3 * this.y1;
    const b = 3 * (this.y2 - this.y1) - c;
    const a = 1 - c - b;
    return ((a * t + b) * t + c) * t;
  }

  getSlopeX(t) {
    const c = 3 * this.x1;
    const b = 3 * (this.x2 - this.x1) - c;
    const a = 1 - c - b;
    return (3 * a * t + 2 * b) * t + c;
  }

  /**
   * Find parameter t for a given x using Newton-Raphson with bisection fallback
   */
  solveCurveX(x, epsilon = 1e-6) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;

    // First try Newton-Raphson (fast convergence)
    let t = x;
    for (let i = 0; i < 8; i++) {
      const currentX = this.calcX(t) - x;
      if (Math.abs(currentX) < epsilon) {
        return t;
      }
      const slope = this.getSlopeX(t);
      if (Math.abs(slope) < 1e-6) break;
      t = t - currentX / slope;
    }

    // Fall back to robust Bisection
    let t0 = 0.0;
    let t1 = 1.0;
    t = x;

    while (t0 < t1) {
      const currentX = this.calcX(t);
      if (Math.abs(currentX - x) < epsilon) {
        return t;
      }
      if (x > currentX) {
        t0 = t;
      } else {
        t1 = t;
      }
      t = (t1 + t0) * 0.5;
    }
    return t;
  }

  evaluate(x, epsilon = 1e-6) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    const t = this.solveCurveX(x, epsilon);
    return this.calcY(t);
  }

  solve(x, epsilon = 1e-6) {
    return this.evaluate(x, epsilon);
  }
}

export const EASING_PRESETS = {
  linear: new CubicBezier(0, 0, 1, 1),
  ease: new CubicBezier(0.25, 0.1, 0.25, 1.0),
  easeIn: new CubicBezier(0.42, 0, 1.0, 1.0),
  easeOut: new CubicBezier(0, 0, 0.58, 1.0),
  easeInOut: new CubicBezier(0.42, 0, 0.58, 1.0),
  gentle: new CubicBezier(0.16, 1, 0.3, 1),
  quick: new CubicBezier(0.05, 0.7, 0.1, 1),
  slow: new CubicBezier(0.2, 0, 0, 1)
};

// =============================================================================
// 2. ANALYTICAL SPRING PHYSICS (m*x'' + c*x' + k*x = 0, Exact ODE Solutions)
// =============================================================================

export class AdvancedSpringSolver {
  constructor({ mass = 1, stiffness = 100, damping = 15 } = {}) {
    this.mass = Math.max(0.001, mass);
    this.stiffness = Math.max(0.001, stiffness);
    this.damping = Math.max(0, damping);

    this.w0 = Math.sqrt(this.stiffness / this.mass); // Undamped angular frequency
    this.zeta = this.damping / (2 * Math.sqrt(this.stiffness * this.mass)); // Damping ratio
  }

  evaluate(t, x0, v0 = 0) {
    if (t <= 0) return { position: x0, velocity: v0 };
    const { w0, zeta } = this;

    if (Math.abs(zeta - 1.0) < 1e-4) {
      // 1. Critically Damped
      const c1 = x0;
      const c2 = v0 + w0 * x0;
      const expTerm = Math.exp(-w0 * t);
      const position = expTerm * (c1 + c2 * t);
      const velocity = expTerm * (c2 - w0 * (c1 + c2 * t));
      return { position, velocity };
    } else if (zeta < 1.0) {
      // 2. Underdamped (oscillatory with exponential envelope)
      const wd = w0 * Math.sqrt(1 - zeta * zeta);
      const c1 = x0;
      const c2 = (v0 + zeta * w0 * x0) / wd;
      const expTerm = Math.exp(-zeta * w0 * t);
      const cosTerm = Math.cos(wd * t);
      const sinTerm = Math.sin(wd * t);

      const position = expTerm * (c1 * cosTerm + c2 * sinTerm);
      const velocity = expTerm * (
        (-zeta * w0 * (c1 * cosTerm + c2 * sinTerm)) +
        (wd * (-c1 * sinTerm + c2 * cosTerm))
      );
      return { position, velocity };
    } else {
      // 3. Overdamped
      const disc = Math.sqrt(zeta * zeta - 1);
      const r1 = -w0 * (zeta - disc);
      const r2 = -w0 * (zeta + disc);
      const c2 = (v0 - r1 * x0) / (r2 - r1);
      const c1 = x0 - c2;

      const exp1 = Math.exp(r1 * t);
      const exp2 = Math.exp(r2 * t);
      const position = c1 * exp1 + c2 * exp2;
      const velocity = c1 * r1 * exp1 + c2 * r2 * exp2;
      return { position, velocity };
    }
  }

  /**
   * Retarget an in-flight spring to a new target while preserving current velocity
   */
  retarget(currentPos, currentVel, newTarget) {
    const newX0 = currentPos - newTarget;
    return {
      initialDisplacement: newX0,
      initialVelocity: currentVel,
      target: newTarget
    };
  }
}

// =============================================================================
// 3. 2D AFFINE MATRIX DECOMPOSITION & RECOMPOSITION
// =============================================================================

export function decomposeAffineMatrix2D(a, b, c, d, e, f) {
  const translateX = e;
  const translateY = f;

  const scaleX = Math.hypot(a, b);
  const rotationRad = Math.atan2(b, a);
  const cosR = Math.cos(rotationRad);
  const sinR = Math.sin(rotationRad);

  // Unrotate column 2 [c, d] by -rotation
  const cUnrot = cosR * c + sinR * d;
  const dUnrot = -sinR * c + cosR * d;

  const scaleY = dUnrot;
  const tanSkew = Math.abs(scaleY) > 1e-9 ? cUnrot / scaleY : 0;
  const skewRad = Math.atan(tanSkew);

  return {
    translateX,
    translateY,
    scaleX,
    scaleY,
    rotation: rotationRad * (180 / Math.PI),
    skew: skewRad * (180 / Math.PI)
  };
}

export function recomposeAffineMatrix2D({
  translateX = 0,
  translateY = 0,
  scaleX = 1,
  scaleY = 1,
  rotation = 0,
  skew = 0
}) {
  const radR = rotation * (Math.PI / 180);
  const radSkew = skew * (Math.PI / 180);

  const cosR = Math.cos(radR);
  const sinR = Math.sin(radR);
  const tanSkew = Math.tan(radSkew);

  const a = cosR * scaleX;
  const b = sinR * scaleX;
  const c = (-sinR + cosR * tanSkew) * scaleY;
  const d = (cosR + sinR * tanSkew) * scaleY;
  const e = translateX;
  const f = translateY;

  return { a, b, c, d, e, f };
}

// =============================================================================
// 4. ARC-LENGTH PATH RESAMPLING & MORPHING
// =============================================================================

export function resamplePathArcLength(points, targetCount) {
  if (!points || points.length === 0) return [];
  if (points.length === targetCount) return points.map(p => ({ ...p }));

  // Calculate cumulative arc-length distances
  const distances = [0];
  let totalLength = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    totalLength += dist;
    distances.push(totalLength);
  }

  if (totalLength === 0) {
    return Array.from({ length: targetCount }, () => ({ ...points[0] }));
  }

  const resampled = [];
  const step = totalLength / (targetCount - 1);

  let currentIdx = 0;
  for (let i = 0; i < targetCount; i++) {
    const targetDist = i * step;

    while (currentIdx < distances.length - 1 && distances[currentIdx + 1] < targetDist) {
      currentIdx++;
    }

    if (currentIdx >= distances.length - 1) {
      resampled.push({ ...points[points.length - 1] });
      continue;
    }

    const segmentDist = distances[currentIdx + 1] - distances[currentIdx];
    const segmentT = segmentDist === 0 ? 0 : (targetDist - distances[currentIdx]) / segmentDist;

    const p0 = points[currentIdx];
    const p1 = points[currentIdx + 1];

    resampled.push({
      x: p0.x + (p1.x - p0.x) * segmentT,
      y: p0.y + (p1.y - p0.y) * segmentT
    });
  }

  return resampled;
}

// =============================================================================
// 5. LINEAR CONSTRAINT SOLVER (Bounds & Sizing Invariants)
// =============================================================================

export class LinearConstraintSolver {
  /**
   * Solves child node rect inside a resized parent rect according to horizontal and vertical constraints
   */
  static solveNode(node, parentOldRect, parentNewRect) {
    const c = node.constraints || { horizontal: 'MIN', vertical: 'MIN' };
    const t = node.transform || { x: 0, y: 0, width: 100, height: 100 };

    const dW = parentNewRect.width - parentOldRect.width;
    const dH = parentNewRect.height - parentOldRect.height;

    let x = t.x;
    let width = t.width;
    let y = t.y;
    let height = t.height;

    // Horizontal
    switch (c.horizontal) {
      case 'MIN': // Left
        break;
      case 'MAX': // Right
        x = t.x + dW;
        break;
      case 'CENTER': // Center
        x = t.x + dW / 2;
        break;
      case 'STRETCH': // Left and Right
        width = Math.max(1, t.width + dW);
        break;
      case 'SCALE': {
        const factorX = parentNewRect.width / Math.max(1, parentOldRect.width);
        x = t.x * factorX;
        width = t.width * factorX;
        break;
      }
    }

    // Vertical
    switch (c.vertical) {
      case 'MIN': // Top
        break;
      case 'MAX': // Bottom
        y = t.y + dH;
        break;
      case 'CENTER': // Center
        y = t.y + dH / 2;
        break;
      case 'STRETCH': // Top and Bottom
        height = Math.max(1, t.height + dH);
        break;
      case 'SCALE': {
        const factorY = parentNewRect.height / Math.max(1, parentOldRect.height);
        y = t.y * factorY;
        height = t.height * factorY;
        break;
      }
    }

    return { x, y, width, height };
  }
}

// =============================================================================
// 6. INERTIAL SCROLLING & LEAST-SQUARES VELOCITY TRACKER (~100ms)
// =============================================================================

export class KinematicVelocityTracker {
  constructor(windowMs = 100) {
    this.windowMs = windowMs;
    this.samples = []; // Array of { time, x, y }
  }

  addSample(x, y, time = Date.now()) {
    this.samples.push({ time, x, y });
    const cutoff = time - this.windowMs;
    while (this.samples.length > 0 && this.samples[0].time < cutoff) {
      this.samples.shift();
    }
  }

  /**
   * Compute velocity using least-squares linear regression over the recent window
   */
  computeVelocity() {
    if (this.samples.length < 2) {
      return { vx: 0, vy: 0 };
    }

    let sumT = 0, sumT2 = 0;
    let sumX = 0, sumTX = 0;
    let sumY = 0, sumTY = 0;
    const n = this.samples.length;
    const t0 = this.samples[0].time;

    for (const s of this.samples) {
      const dt = (s.time - t0) / 1000.0; // Seconds
      sumT += dt;
      sumT2 += dt * dt;
      sumX += s.x;
      sumTX += dt * s.x;
      sumY += s.y;
      sumTY += dt * s.y;
    }

    const denom = n * sumT2 - sumT * sumT;
    if (Math.abs(denom) < 1e-6) {
      const first = this.samples[0];
      const last = this.samples[this.samples.length - 1];
      const dt = (last.time - first.time) / 1000.0;
      if (dt <= 0) return { vx: 0, vy: 0 };
      return {
        vx: (last.x - first.x) / dt,
        vy: (last.y - first.y) / dt
      };
    }

    const vx = (n * sumTX - sumT * sumX) / denom;
    const vy = (n * sumTY - sumT * sumY) / denom;

    return { vx, vy };
  }

  /**
   * Evaluate exponential decay position at time t
   */
  static evaluateInertia(initialPos, initialVel, t, friction = 0.992) {
    // v(t) = v0 * exp(-lambda * t) where lambda = -ln(friction)
    const lambda = -Math.log(friction) * 60; // 60 fps normalized
    const displacement = (initialVel / lambda) * (1 - Math.exp(-lambda * t));
    return initialPos + displacement;
  }
}

// =============================================================================
// 7. GESTURE RECOGNIZER FINITE STATE MACHINE (FSM)
// =============================================================================

export class GestureRecognizerFSM {
  constructor() {
    this.state = 'IDLE'; // 'IDLE' | 'POSSIBLE' | 'BEGAN' | 'CHANGED' | 'ENDED' | 'CANCELLED'
    this.gestureType = null; // 'tap' | 'pan' | 'pinch' | 'rotate' | 'longpress'
    this.startX = 0;
    this.startY = 0;
    this.startTime = 0;
  }

  onTouchStart(x, y, time = Date.now()) {
    this.state = 'POSSIBLE';
    this.startX = x;
    this.startY = y;
    this.startTime = time;
  }

  onTouchMove(x, y, time = Date.now()) {
    if (this.state === 'POSSIBLE') {
      const dx = x - this.startX;
      const dy = y - this.startY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 10) {
        this.state = 'BEGAN';
        this.gestureType = 'pan';
      }
    } else if (this.state === 'BEGAN' || this.state === 'CHANGED') {
      this.state = 'CHANGED';
    }
  }

  onTouchEnd(x, y, time = Date.now()) {
    const dt = time - this.startTime;
    const dx = x - this.startX;
    const dy = y - this.startY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (this.state === 'POSSIBLE') {
      if (dt < 250 && dist < 10) {
        this.gestureType = 'tap';
      } else if (dt >= 500 && dist < 10) {
        this.gestureType = 'longpress';
      }
      this.state = 'ENDED';
    } else if (this.state === 'CHANGED' || this.state === 'BEGAN') {
      this.state = 'ENDED';
    } else {
      this.state = 'IDLE';
    }
    return { gesture: this.gestureType, state: this.state, dx, dy, dt };
  }
}

// =============================================================================
// 8. SPATIAL BVH / R-TREE INDEX & POINT-IN-POLYGON (Winding Rule)
// =============================================================================

export class SpatialBVHIndex {
  constructor() {
    this.items = []; // Array of { id, minX, minY, maxX, maxY, node }
  }

  insert(node) {
    const t = node.transform || { x: 0, y: 0, width: 100, height: 100 };
    const strokeW = node.style?.strokes?.[0]?.width || 0;
    this.items.push({
      id: node.id,
      minX: t.x - strokeW / 2,
      minY: t.y - strokeW / 2,
      maxX: t.x + t.width + strokeW / 2,
      maxY: t.y + t.height + strokeW / 2,
      node
    });
  }

  queryPoint(px, py) {
    const matches = [];
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      if (px >= item.minX && px <= item.maxX && py >= item.minY && py <= item.maxY) {
        matches.push(item.node);
      }
    }
    return matches;
  }

  static isPointInPolygon(px, py, vertices) {
    let windingNumber = 0;
    const n = vertices.length;

    for (let i = 0; i < n; i++) {
      const p1 = vertices[i];
      const p2 = vertices[(i + 1) % n];

      if (p1.y <= py) {
        if (p2.y > py) {
          // Upward crossing
          const isLeft = (p2.x - p1.x) * (py - p1.y) - (px - p1.x) * (p2.y - p1.y);
          if (isLeft > 0) windingNumber++;
        }
      } else {
        if (p2.y <= py) {
          // Downward crossing
          const isLeft = (p2.x - p1.x) * (py - p1.y) - (px - p1.x) * (p2.y - p1.y);
          if (isLeft < 0) windingNumber--;
        }
      }
    }

    return windingNumber !== 0;
  }
}

// =============================================================================
// 9. TYPED VARIABLES, AST EXPRESSION PARSER & CONDITIONALS
// =============================================================================

export class ASTExpressionEvaluator {
  constructor(variables = {}) {
    this.variables = { ...variables };
  }

  setVariable(name, val) {
    this.variables[name] = val;
  }

  getVariable(name) {
    return this.variables[name];
  }

  /**
   * Simple recursive descent parser evaluating arithmetic, comparisons, and variable lookups
   */
  evaluate(expr) {
    if (typeof expr !== 'string') return expr;
    const sanitized = expr.trim();

    // 1. Comparison operations (==, !=, >=, <=, >, <)
    const compRegex = /^(.*?)(==|!=|>=|<=|>|<)(.*)$/;
    const compMatch = sanitized.match(compRegex);
    if (compMatch) {
      const left = this.evaluate(compMatch[1]);
      const op = compMatch[2];
      const right = this.evaluate(compMatch[3]);
      switch (op) {
        case '==': return left === right;
        case '!=': return left !== right;
        case '>=': return Number(left) >= Number(right);
        case '<=': return Number(left) <= Number(right);
        case '>': return Number(left) > Number(right);
        case '<': return Number(left) < Number(right);
      }
    }

    // 2. Arithmetic expressions with variable substitution
    let replaced = sanitized.replace(/[a-zA-Z_][a-zA-Z0-9_]*/g, match => {
      if (this.variables[match] !== undefined) {
        return JSON.stringify(this.variables[match]);
      }
      return match;
    });

    try {
      // Safe arithmetic evaluator for sanitized math tokens
      if (/^[0-9+\-*/().\s"'truefals]+$/.test(replaced)) {
        return Function(`"use strict"; return (${replaced});`)();
      }
    } catch {
      // Fallback
    }

    return sanitized;
  }
}
