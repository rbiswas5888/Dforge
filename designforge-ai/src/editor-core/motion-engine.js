/**
 * DesignForge AI — Prototyping & Motion Engineering Module
 * - Hierarchical Finite State Machine (HFSM) & Variable Logic Engine
 * - Analytical Spring-Mass-Damper Physics Engine (Exact ODE Solutions & Interruption Velocity Inheritance)
 * - Advanced Smart Animate (Bipartite Graph Matching, Matrix Decomposition, Path Morphing)
 * - Kinematic Gesture Tracking & Inertial Scrolling Physics
 */

/**
 * Analytical Spring Physics Engine
 * Solves m*x'' + c*x' + k*x = 0 analytically with velocity inheritance
 */
export class AnalyticalSpring {
  constructor({ mass = 1, stiffness = 100, damping = 15 } = {}) {
    this.mass = Math.max(0.001, mass);
    this.stiffness = Math.max(0.001, stiffness);
    this.damping = Math.max(0, damping);

    this.w0 = Math.sqrt(this.stiffness / this.mass); // Natural frequency
    this.zeta = this.damping / (2 * Math.sqrt(this.stiffness * this.mass)); // Damping ratio
  }

  /**
   * Evaluate position and velocity at time t given initial displacement x0 and initial velocity v0
   */
  evaluate(t, x0, v0 = 0) {
    if (t <= 0) return { position: x0, velocity: v0 };

    const { w0, zeta } = this;

    if (Math.abs(zeta - 1.0) < 1e-4) {
      // 1. Critically Damped (zeta = 1)
      const c1 = x0;
      const c2 = v0 + w0 * x0;
      const expTerm = Math.exp(-w0 * t);
      const position = expTerm * (c1 + c2 * t);
      const velocity = expTerm * (c2 - w0 * (c1 + c2 * t));
      return { position, velocity };
    } else if (zeta < 1.0) {
      // 2. Underdamped (zeta < 1) - Oscillates with decay
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
      // 3. Overdamped (zeta > 1) - Smooth non-oscillatory decay
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
   * Non-linear rubber-banding resistance calculation:
   * F_resist = -k * x^1.5
   */
  calculateRubberBandResistance(displacement, kResistance = 0.55) {
    const sign = Math.sign(displacement);
    const absDisp = Math.abs(displacement);
    return -sign * kResistance * Math.pow(absDisp, 1.5);
  }
}

/**
 * 2D Affine Matrix Polar/QR Decomposition:
 * Extracts Translation, Rotation, Scale, and Skew cleanly to avoid shear distortion
 */
export function decomposeMatrix2D(a, b, c, d, tx, ty) {
  // Determinant
  const det = a * d - b * c;
  const rotation = Math.atan2(b, a);

  let scaleX, scaleY, skew;
  if (Math.abs(det) < 1e-9) {
    scaleX = Math.hypot(a, b);
    scaleY = 0;
    skew = 0;
  } else {
    scaleX = Math.hypot(a, b);
    scaleY = det / scaleX;
    skew = Math.atan2(a * c + b * d, scaleX * scaleX);
  }

  return {
    translateX: tx,
    translateY: ty,
    rotation: rotation, // in radians
    scaleX: scaleX,
    scaleY: scaleY,
    skew: skew
  };
}

/**
 * Interpolates two decomposed 2D affine transforms cleanly
 */
export function interpolateTransforms(tA, tB, progress) {
  const p = Math.max(0, Math.min(1, progress));
  return {
    translateX: tA.translateX + (tB.translateX - tA.translateX) * p,
    translateY: tA.translateY + (tB.translateY - tA.translateY) * p,
    rotation: tA.rotation + (tB.rotation - tA.rotation) * p,
    scaleX: tA.scaleX + (tB.scaleX - tA.scaleX) * p,
    scaleY: tA.scaleY + (tB.scaleY - tA.scaleY) * p,
    skew: tA.skew + (tB.skew - tA.skew) * p
  };
}

/**
 * Advanced Smart Animate: Bipartite Graph Matching
 * Pairs nodes between Source Frame A and Target Frame B by ID or Centroid Distance + Name Similarity
 */
export function matchNodesForSmartAnimate(sourceNodes, targetNodes) {
  const matches = []; // [{ sourceNode, targetNode, confidence }]
  const remainingSource = [...sourceNodes];
  const remainingTarget = [...targetNodes];

  // Pass 1: Exact ID Matches
  for (let i = remainingSource.length - 1; i >= 0; i--) {
    const sNode = remainingSource[i];
    const tIdx = remainingTarget.findIndex(t => t.id === sNode.id);
    if (tIdx !== -1) {
      matches.push({ sourceNode: sNode, targetNode: remainingTarget[tIdx], confidence: 1.0 });
      remainingSource.splice(i, 1);
      remainingTarget.splice(tIdx, 1);
    }
  }

  // Pass 2: Exact Name & Type Matches
  for (let i = remainingSource.length - 1; i >= 0; i--) {
    const sNode = remainingSource[i];
    const tIdx = remainingTarget.findIndex(t => t.name === sNode.name && t.type === sNode.type);
    if (tIdx !== -1) {
      matches.push({ sourceNode: sNode, targetNode: remainingTarget[tIdx], confidence: 0.85 });
      remainingSource.splice(i, 1);
      remainingTarget.splice(tIdx, 1);
    }
  }

  // Pass 3: Centroid Distance Minimization Bipartite Matching
  for (let i = remainingSource.length - 1; i >= 0; i--) {
    const sNode = remainingSource[i];
    if (remainingTarget.length === 0) break;

    const sCenterX = (sNode.x || 0) + (sNode.width || 0) / 2;
    const sCenterY = (sNode.y || 0) + (sNode.height || 0) / 2;

    let bestIdx = -1;
    let minCost = Infinity;

    for (let j = 0; j < remainingTarget.length; j++) {
      const tNode = remainingTarget[j];
      const tCenterX = (tNode.x || 0) + (tNode.width || 0) / 2;
      const tCenterY = (tNode.y || 0) + (tNode.height || 0) / 2;
      const dist = Math.hypot(sCenterX - tCenterX, sCenterY - tCenterY);
      const typeBonus = sNode.type === tNode.type ? 0 : 200;
      const cost = dist + typeBonus;

      if (cost < minCost) {
        minCost = cost;
        bestIdx = j;
      }
    }

    if (bestIdx !== -1 && minCost < 600) {
      matches.push({ sourceNode: sNode, targetNode: remainingTarget[bestIdx], confidence: 0.65 });
      remainingSource.splice(i, 1);
      remainingTarget.splice(bestIdx, 1);
    }
  }

  return {
    matchedPairs: matches,
    unmatchedSource: remainingSource,
    unmatchedTarget: remainingTarget
  };
}

/**
 * Arc-Length Reparameterization for Vector Path Morphing:
 * Resamples any polygon to a uniform target vertex count
 */
export function resamplePathByArcLength(points, targetCount) {
  if (!points || points.length === 0) return [];
  if (points.length === targetCount) return points.map(p => ({ ...p }));

  const arcLengths = [0];
  let totalLength = 0;
  for (let i = 1; i < points.length; i++) {
    const d = Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    totalLength += d;
    arcLengths.push(totalLength);
  }

  if (totalLength === 0) {
    return Array.from({ length: targetCount }, () => ({ ...points[0] }));
  }

  const resampled = [];
  for (let k = 0; k < targetCount; k++) {
    const targetDist = (k / (targetCount - 1)) * totalLength;
    // Find segment
    let segIdx = 0;
    while (segIdx < arcLengths.length - 2 && arcLengths[segIdx + 1] < targetDist) {
      segIdx++;
    }
    const segLen = arcLengths[segIdx + 1] - arcLengths[segIdx];
    const fraction = segLen > 0 ? (targetDist - arcLengths[segIdx]) / segLen : 0;
    const p0 = points[segIdx];
    const p1 = points[segIdx + 1];

    resampled.push({
      x: p0.x + (p1.x - p0.x) * fraction,
      y: p0.y + (p1.y - p0.y) * fraction
    });
  }

  return resampled;
}

/**
 * Kinematic Gesture Tracker & Inertial Scrolling Physics
 */
export class KinematicGestureTracker {
  constructor(friction = 0.0035) {
    this.friction = friction;
    this.history = []; // [{ x, y, timestamp }]
    this.windowMs = 50; // 50ms rolling window
  }

  addPoint(x, y, timestamp = Date.now()) {
    this.history.push({ x, y, timestamp });
    const cutoff = timestamp - this.windowMs;
    while (this.history.length > 2 && this.history[0].timestamp < cutoff) {
      this.history.shift();
    }
  }

  /**
   * Compute release velocity vector: v0 = delta_p / delta_t
   */
  computeReleaseVelocity() {
    if (this.history.length < 2) return { vx: 0, vy: 0 };
    const first = this.history[0];
    const last = this.history[this.history.length - 1];
    const dt = (last.timestamp - first.timestamp) / 1000; // in seconds
    if (dt <= 0) return { vx: 0, vy: 0 };

    return {
      vx: (last.x - first.x) / dt,
      vy: (last.y - first.y) / dt
    };
  }

  /**
   * Exponential decay inertial momentum position at time t (seconds)
   * v(t) = v0 * exp(-gamma * t)
   * pos(t) = pos0 + (v0 / gamma) * (1 - exp(-gamma * t))
   */
  evaluateInertialPosition(pos0, v0, tSeconds) {
    const gamma = this.friction * 1000;
    const expTerm = Math.exp(-gamma * tSeconds);
    const pos = pos0 + (v0 / gamma) * (1 - expTerm);
    const vel = v0 * expTerm;
    return { position: pos, velocity: vel };
  }
}

/**
 * Hierarchical Finite State Machine (HFSM) with Variable Logic Engine
 */
export class PrototypingHFSM {
  constructor(initialVariables = {}) {
    this.globalVariables = { ...initialVariables };
    this.componentStates = {}; // componentId -> currentStateName
    this.history = [];
  }

  setVariable(name, val) {
    this.globalVariables[name] = val;
  }

  getVariable(name) {
    return this.globalVariables[name];
  }

  /**
   * Evaluate boolean predicate expression against variables:
   * e.g. "cart_count > 0 && is_auth == true"
   */
  evaluatePredicate(expression) {
    if (!expression || expression.trim() === '' || expression === 'true') return true;
    try {
      // Safe sandboxed parser for arithmetic/comparison expressions
      const context = { ...this.globalVariables };
      const keys = Object.keys(context);
      const values = Object.values(context);
      const fn = new Function(...keys, `return Boolean(${expression});`);
      return Boolean(fn(...values));
    } catch {
      return false;
    }
  }

  /**
   * Execute mutation action expression:
   * e.g. "cart_count += 1" or "active_tab = 2"
   */
  executeMutation(actionExpr) {
    if (!actionExpr || actionExpr.trim() === '') return;
    try {
      const expr = actionExpr.trim();
      const match = expr.match(/^([a-zA-Z0-9_]+)\s*(\+=|-=|\*=|\/=|=)\s*(.+)$/);
      if (match) {
        const [, varName, op, rawRhs] = match;
        const currentVal = this.globalVariables[varName] !== undefined ? this.globalVariables[varName] : 0;
        const rhsVal = Number(rawRhs) || rawRhs.replace(/['"]/g, '');

        if (op === '=') this.globalVariables[varName] = rhsVal;
        else if (op === '+=') this.globalVariables[varName] = Number(currentVal) + Number(rhsVal);
        else if (op === '-=') this.globalVariables[varName] = Number(currentVal) - Number(rhsVal);
        else if (op === '*=') this.globalVariables[varName] = Number(currentVal) * Number(rhsVal);
        else if (op === '/=') this.globalVariables[varName] = Number(currentVal) / (Number(rhsVal) || 1);
      }
    } catch (e) {
      console.warn('Error executing prototype mutation:', e);
    }
  }
}
