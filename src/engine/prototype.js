/**
 * DesignForge AI — Unified Prototyping Logic Engine
 * Implements Technical Specification: "DesignForge AI: Prototyping Logic Engine Spec.md"
 *
 * Full application runtime for prototypes:
 * - Flows & starting points
 * - Typed reactive runtime variables (boolean, number, string, color, enum, datetime, list, object)
 * - Pure sandboxed expression language (math, text, list, date, logic, validation)
 * - Multi-trigger matrix (pointer, keyboard, lifecycle, reactive, environment, data)
 * - Condition & guard evaluator
 * - Action dispatcher (navigation, overlays, variables, component states, mock data, feedback, assertions)
 * - Component state machines with regions & transitions
 * - In-memory collections & mock REST endpoints
 * - Deterministic virtual clock, event sourcing & time travel
 * - Motion physics (analytical springs & cubic-bezier easing)
 * - Smart Animate matching
 * - Diagnostics & automated test assertions
 */

import { computeWorldBounds } from './layout.js';
import {
  AnalyticalSpring,
  CubicBezier,
  decomposeMatrix2D,
  interpolateTransforms,
  matchNodesForSmartAnimate,
  resamplePathByArcLength,
  KinematicGestureTracker,
  PrototypingHFSM,
  PrototypeDiagnosticsEngine
} from '../editor-core/index.js';
import { ExpressionEvaluator } from './prototype/expressions.js';
import { ComponentStateMachine } from './prototype/state_machine.js';
import { PrototypeDataLayer } from './prototype/data_layer.js';

export class PrototypeEngine {
  constructor(document) {
    this.doc = document;

    // Device & Viewport presets
    this.currentDevice = 'desktop'; // 'desktop' | 'tablet' | 'mobile' | 'responsive'
    this.currentFrameId = null;
    this.navigationHistory = [];
    this.activeOverlays = []; // Stack of { frameId, options }
    this.instanceVariants = new Map(); // nodeId -> variantId

    // 1. Reactive Variables Store (Section 6.2)
    this.variables = new Map(); // varName -> value
    this.variableScopes = new Map(); // varName -> scope ('global' | 'flow' | 'frame' | 'component' | 'session')
    this.computedVariables = new Map(); // varName -> expressionString

    // Subsystems
    this.evaluator = new ExpressionEvaluator();
    this.dataLayer = new PrototypeDataLayer();
    this.stateMachines = new Map(); // componentId/nodeId -> ComponentStateMachine
    this.diagnostics = new PrototypeDiagnosticsEngine(document);
    this.hfsm = new PrototypingHFSM();
    this.gestureTracker = new KinematicGestureTracker();

    // 2. Deterministic Virtual Clock & Event Sourcing (Section 7.1 - 7.3)
    this.virtualTimeMs = 0;
    this.isPaused = false;
    this.timeScale = 1.0;
    this.eventLog = []; // [{ id, timestamp, trigger, sourceNodeId, actions, stateSnapshot }]
    this.snapshots = []; // Historical state snapshots for time-travel
    this.delayedTimers = [];

    // Environment Simulation (Section 6.11)
    this.environment = {
      orientation: 'portrait',
      theme: 'dark',
      network: 'online', // 'online' | 'slow' | 'offline'
      keyboardVisible: false,
      reducedMotion: false
    };

    // Initialize state
    this.initVariables();
    this.recordSnapshot('initial');
  }

  // =========================================================================
  // 1. VARIABLES & EXPRESSIONS (Section 6.2 & 6.6)
  // =========================================================================

  initVariables() {
    this.variables.clear();
    this.variableScopes.clear();
    this.computedVariables.clear();

    // Ingest variables from document
    if (this.doc?.variables) {
      const mode = this.doc.themeMode || 'dark';
      for (const v of this.doc.variables) {
        const val = v.values?.[mode] !== undefined ? v.values[mode] : v.values?.default;
        this.setVariable(v.name || v.id, val, v.scope || 'global');
      }
    }

    // Backwards compatibility alias
    this.prototypeVariables = this.variables;
  }

  setVariable(name, value, scope = 'global') {
    this.variables.set(name, value);
    this.variableScopes.set(name, scope);
    this.hfsm.setVariable(name, value);

    // Recompute dependent computed variables
    this.recomputeVariables();

    // Trigger reactive listeners
    this.handleReactiveEvent('variable_changed', { variable: name, value });
    return value;
  }

  getVariable(name, fallback = null) {
    if (this.variables.has(name)) {
      return this.variables.get(name);
    }
    return fallback;
  }

  defineComputedVariable(name, expression) {
    this.computedVariables.set(name, expression);
    this.recomputeVariables();
  }

  recomputeVariables() {
    const context = this.getVariablesSnapshot();
    for (const [name, expr] of this.computedVariables.entries()) {
      try {
        const result = this.evaluator.evaluate(expr, context);
        this.variables.set(name, result);
        this.hfsm.setVariable(name, result);
      } catch (err) {
        console.warn(`Error computing variable ${name}:`, err);
      }
    }
  }

  getVariablesSnapshot() {
    const snap = {};
    for (const [k, v] of this.variables.entries()) {
      snap[k] = v;
    }
    return snap;
  }

  evaluateExpression(expr, additionalContext = {}) {
    const context = {
      ...this.getVariablesSnapshot(),
      ...additionalContext
    };
    return this.evaluator.evaluate(expr, context);
  }

  evaluatePredicate(predicate, additionalContext = {}) {
    const context = {
      ...this.getVariablesSnapshot(),
      ...additionalContext
    };
    return this.evaluator.evaluatePredicate(predicate, context);
  }

  // =========================================================================
  // 2. FLOWS & NAVIGATION (Section 6.1 & 6.10)
  // =========================================================================

  setDevice(device) {
    this.currentDevice = device;
  }

  getDeviceDimensions() {
    switch (this.currentDevice) {
      case 'mobile':
        return { width: 375, height: 812, label: 'iPhone 15 Pro (375 × 812)' };
      case 'tablet':
        return { width: 768, height: 1024, label: 'iPad Mini (768 × 1024)' };
      case 'desktop':
        return { width: 1440, height: 900, label: 'Desktop MacBook (1440 × 900)' };
      case 'responsive':
      default:
        return { width: '100%', height: '100%', label: 'Fluid Responsive' };
    }
  }

  getFlows() {
    const flows = [];
    for (const page of this.doc.pages || []) {
      for (const rid of page.rootIds || []) {
        const node = page.nodes[rid];
        if (node?.isFlowStart && node.type === 'frame') {
          flows.push({
            id: `flow_${node.id}`,
            name: node.flowName || node.name || 'Main Flow',
            startingFrameId: node.id,
            description: node.flowDescription || 'User journey starting point'
          });
        }
      }
    }
    return flows;
  }

  startFlow(frameId = null) {
    this.cancelDelayedActions();
    this.activeOverlays = [];
    this.instanceVariants.clear();
    this.initVariables();

    let targetId = frameId;
    if (!targetId) {
      // Find marked flow starting frame or first top-level frame
      for (const page of this.doc.pages || []) {
        for (const rid of page.rootIds || []) {
          const n = page.nodes[rid];
          if (n?.isFlowStart && n.type === 'frame') {
            targetId = rid;
            break;
          }
        }
        if (targetId) break;
      }
      if (!targetId) {
        const firstPage = this.doc.pages?.[0];
        targetId = firstPage?.rootIds?.find(id => firstPage.nodes[id]?.type === 'frame') || null;
      }
    }

    this.currentFrameId = targetId;
    this.navigationHistory = targetId ? [targetId] : [];
    if (targetId) {
      this.handleLifecycleEvent('on_load', targetId);
      this.scheduleDelayActions(targetId);
    }

    this.logEvent('start_flow', null, [{ action: 'start_flow', targetId }]);
    return targetId;
  }

  restart() {
    const initialFrame = this.navigationHistory[0] || null;
    return this.startFlow(initialFrame);
  }

  getCurrentFrame() {
    if (!this.currentFrameId) return null;
    for (const page of this.doc.pages || []) {
      if (page.nodes?.[this.currentFrameId]) {
        return page.nodes[this.currentFrameId];
      }
    }
    return null;
  }

  getHistory() {
    return [...this.navigationHistory];
  }

  goBack() {
    return this.executeAction({ action: 'back' });
  }

  getActiveOverlay() {
    if (this.activeOverlays.length === 0) return null;
    const top = this.activeOverlays[this.activeOverlays.length - 1];
    return this.findNode(top.frameId);
  }

  // =========================================================================
  // 3. EVENT DISPATCHER & TRIGGERS (Section 6.3 & 6.4)
  // =========================================================================

  /**
   * Main dispatch entry for all triggers: pointer, keyboard, lifecycle, reactive, data
   */
  handleEvent(sourceNodeId, eventType = 'click', eventData = {}) {
    const node = this.findNode(sourceNodeId);
    if (!node || !node.interactions || node.interactions.length === 0) {
      return { success: false, reason: 'No interactions on node' };
    }

    // Match trigger against trigger matrix
    const matchingInteractions = node.interactions.filter(i => {
      const tr = (i.trigger || 'click').toLowerCase();
      const ev = (eventType || 'click').toLowerCase();

      // Pointer triggers
      if ((ev === 'click' || ev === 'tap') && (tr === 'click' || tr === 'tap')) return true;
      if (ev === 'double_tap' && (tr === 'double_tap' || tr === 'doubleclick')) return true;
      if (ev === 'long_press' && tr === 'long_press') return true;
      if (ev === 'hover' && (tr === 'hover' || tr === 'enter' || tr === 'hover_enter' || tr === 'mouse_enter')) return true;
      if (ev === 'leave' && (tr === 'leave' || tr === 'hover_leave' || tr === 'mouse_leave')) return true;
      if (ev === 'press' && (tr === 'press' || tr === 'press_down' || tr === 'mouse_down')) return true;
      if (ev === 'drag' && (tr === 'drag' || tr === 'drag_start' || tr === 'drag_move')) return true;
      if (ev.startsWith('swipe_') && tr === ev) return true;

      // Keyboard triggers
      if (ev === 'key' && (tr === 'key' || tr === 'keyboard')) {
        if (!i.key) return true;
        return String(i.key).toLowerCase() === String(eventData.key || '').toLowerCase();
      }

      // Lifecycle triggers
      if (ev === 'delay' && (tr === 'delay' || tr === 'after_delay' || tr === 'after-delay')) return true;
      if (ev === 'load' && (tr === 'load' || tr === 'on_load')) return true;

      return tr === ev;
    });

    if (matchingInteractions.length === 0) {
      return { success: false, reason: 'No matching trigger found' };
    }

    const executedResults = [];
    for (const inter of matchingInteractions) {
      // Evaluate Conditions & Guards (Section 6.4)
      if (inter.condition || inter.guard || inter.predicate) {
        const condExpr = inter.guard || inter.predicate || inter.condition;
        let guardPassed = false;

        if (typeof condExpr === 'string') {
          guardPassed = this.evaluatePredicate(condExpr, eventData);
        } else if (typeof condExpr === 'object') {
          const { varId, op, val } = condExpr;
          const currentVal = this.getVariable(varId);
          if (op === '==') guardPassed = currentVal == val;
          else if (op === '!=') guardPassed = currentVal != val;
          else if (op === '>') guardPassed = currentVal > val;
          else if (op === '<') guardPassed = currentVal < val;
          else if (op === '>=') guardPassed = currentVal >= val;
          else if (op === '<=') guardPassed = currentVal <= val;
        }

        if (!guardPassed) {
          if (inter.elseAction) {
            executedResults.push(this.executeAction(inter.elseAction, sourceNodeId, eventData));
          }
          continue; // Guard blocked
        }
      }

      const res = this.executeAction(inter, sourceNodeId, eventData);
      executedResults.push(res);
    }

    this.logEvent(eventType, sourceNodeId, executedResults);
    return executedResults.length > 0 ? executedResults[0] : { success: true };
  }

  handleLifecycleEvent(triggerName, frameId) {
    const frame = this.findNode(frameId);
    if (!frame) return;

    const scanAndTrigger = (nodeId) => {
      const node = this.findNode(nodeId);
      if (!node) return;
      if (node.interactions) {
        for (const inter of node.interactions) {
          if (inter.trigger === triggerName) {
            this.executeAction(inter, node.id);
          }
        }
      }
      if (node.childIds) {
        for (const cid of node.childIds) scanAndTrigger(cid);
      }
    };

    scanAndTrigger(frameId);
  }

  handleReactiveEvent(eventType, data = {}) {
    // Check state machines for reactive triggers
    for (const [id, sm] of this.stateMachines.entries()) {
      sm.send(eventType, { ...this.getVariablesSnapshot(), ...data }, this.evaluator);
    }
  }

  // =========================================================================
  // 4. ACTION DISPATCHER (Section 6.5)
  // =========================================================================

  executeAction(interaction, sourceNodeId = null, eventData = {}) {
    const action = interaction.action || 'navigate';

    // 1. Navigation
    if (action === 'navigate' && interaction.targetId) {
      const targetFrame = this.findNode(interaction.targetId);
      if (!targetFrame) {
        return { success: false, error: `Target frame ${interaction.targetId} not found` };
      }
      this.cancelDelayedActions();
      this.currentFrameId = interaction.targetId;
      this.navigationHistory.push(interaction.targetId);
      this.scheduleDelayActions(interaction.targetId);
      this.handleLifecycleEvent('on_load', interaction.targetId);

      return {
        success: true,
        action: 'navigate',
        targetId: interaction.targetId,
        animation: interaction.animation || 'smart-animate',
        duration: interaction.duration || 300,
        easing: interaction.easing || 'ease-in-out'
      };
    }

    // 2. Go Back
    if (action === 'back') {
      if (this.navigationHistory.length > 1) {
        this.navigationHistory.pop();
        const prevId = this.navigationHistory[this.navigationHistory.length - 1];
        this.cancelDelayedActions();
        this.currentFrameId = prevId;
        this.scheduleDelayActions(prevId);
        return { success: true, action: 'back', targetId: prevId };
      }
      return { success: false, reason: 'Already at flow start' };
    }

    // 3. Variant & Component State Changes
    if (action === 'change_variant' || action === 'change-variant' || action === 'set_variant') {
      const targetVariantId = interaction.targetVariantId || interaction.variantId;
      const targetNodeId = interaction.targetNodeId || sourceNodeId;
      if (targetNodeId && targetVariantId) {
        this.instanceVariants.set(targetNodeId, targetVariantId);
        return {
          success: true,
          action: 'change_variant',
          nodeId: targetNodeId,
          variantId: targetVariantId,
          animation: interaction.animation || 'instant'
        };
      }
    }

    // 4. Overlays Stack
    if (action === 'overlay' || action === 'open_overlay') {
      const targetFrame = this.findNode(interaction.targetId);
      if (!targetFrame) {
        return { success: false, error: `Overlay target ${interaction.targetId} not found` };
      }
      const opts = interaction.overlayOptions || {
        position: 'center',
        closeOnClickOutside: true,
        closeOnEscape: true,
        dimBackground: true
      };
      this.activeOverlays.push({ frameId: interaction.targetId, options: opts });
      return { success: true, action: 'open_overlay', targetId: interaction.targetId, options: opts };
    }

    if (action === 'close_overlay') {
      if (this.activeOverlays.length > 0) {
        const closed = this.activeOverlays.pop();
        return { success: true, action: 'close_overlay', targetId: closed.frameId };
      }
      return { success: true, action: 'close_overlay' };
    }

    if (action === 'swap_overlay') {
      if (this.activeOverlays.length > 0) {
        this.activeOverlays.pop();
      }
      const opts = interaction.overlayOptions || { position: 'center', dimBackground: true };
      this.activeOverlays.push({ frameId: interaction.targetId, options: opts });
      return { success: true, action: 'swap_overlay', targetId: interaction.targetId };
    }

    // 5. Variables & State Mutations
    if (action === 'set_variable') {
      const varId = interaction.varId || interaction.variable || interaction.variableUpdate?.varId;
      let val = interaction.value !== undefined ? interaction.value : interaction.variableUpdate?.value;
      const expr = interaction.expr || interaction.expression || interaction.variableUpdate?.expr;

      if (expr) {
        val = this.evaluateExpression(expr, eventData);
      }
      this.setVariable(varId, val);
      return { success: true, action: 'set_variable', varId, value: val };
    }

    if (action === 'toggle' || action === 'toggle_variable') {
      const varId = interaction.varId || interaction.variable;
      const current = Boolean(this.getVariable(varId, false));
      this.setVariable(varId, !current);
      return { success: true, action: 'toggle', varId, value: !current };
    }

    if (action === 'increment' || action === 'increment_variable') {
      const varId = interaction.varId || interaction.variable;
      const step = Number(interaction.step || 1);
      const current = Number(this.getVariable(varId, 0));
      this.setVariable(varId, current + step);
      return { success: true, action: 'increment', varId, value: current + step };
    }

    // 6. Component State Machine Event
    if (action === 'send_event') {
      const targetId = interaction.targetNodeId || sourceNodeId;
      const sm = this.stateMachines.get(targetId);
      if (sm) {
        const res = sm.send(interaction.event, this.getVariablesSnapshot(), this.evaluator);
        return { success: true, action: 'send_event', ...res };
      }
    }

    // 7. Mock Data Endpoint (Section 6.8)
    if (action === 'fetch_mock' || action === 'fetch') {
      const method = interaction.method || 'GET';
      const path = interaction.path || '/api/data';
      const payload = interaction.payload || eventData;
      this.dataLayer.fetchMock(method, path, payload, this.getVariablesSnapshot()).then(res => {
        if (res.ok && interaction.onSuccess) {
          this.executeAction(interaction.onSuccess, sourceNodeId, { response: res.data });
        } else if (!res.ok && interaction.onError) {
          this.executeAction(interaction.onError, sourceNodeId, { error: res.error });
        }
      });
      return { success: true, action: 'fetch_mock', path };
    }

    // 8. Test Assertion (Section 6.5 & 7.2)
    if (action === 'assert') {
      const expr = interaction.expression || interaction.predicate;
      const message = interaction.message || `Assertion failed: ${expr}`;
      const passed = this.evaluatePredicate(expr, eventData);
      if (!passed) {
        throw new Error(message);
      }
      return { success: true, action: 'assert', passed: true, message };
    }

    // 9. Scroll To & External URL
    if (action === 'scroll_to' && interaction.targetId) {
      return { success: true, action: 'scroll_to', targetId: interaction.targetId };
    }

    if (action === 'url' && interaction.url) {
      return { success: true, action: 'url', url: interaction.url };
    }

    return { success: true, action };
  }

  // =========================================================================
  // 5. TIMERS, DELAYS & TIMETRAVEL (Section 7.1 - 7.3)
  // =========================================================================

  cancelDelayedActions() {
    for (const t of this.delayedTimers) {
      clearTimeout(t);
    }
    this.delayedTimers = [];
  }

  scheduleDelayActions(frameId) {
    this.cancelDelayedActions();
    const frame = this.findNode(frameId);
    if (!frame) return;

    const scanForDelay = (nodeId) => {
      const node = this.findNode(nodeId);
      if (!node) return;
      if (node.interactions && node.interactions.length > 0) {
        for (const inter of node.interactions) {
          const tr = inter.trigger;
          if (tr === 'delay' || tr === 'after_delay' || tr === 'after-delay') {
            const delay = inter.delayMs || inter.delay || 1000;
            const timer = setTimeout(() => {
              this.executeAction(inter, node.id);
            }, delay);
            if (timer && typeof timer.unref === 'function') timer.unref();
            this.delayedTimers.push(timer);
          }
        }
      }
      if (node.childIds) {
        for (const cid of node.childIds) scanForDelay(cid);
      }
    };

    scanForDelay(frameId);
  }

  logEvent(trigger, sourceNodeId, actions) {
    const entry = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: Date.now(),
      virtualTime: this.virtualTimeMs,
      trigger,
      sourceNodeId,
      currentFrameId: this.currentFrameId,
      actions,
      stateSnapshot: this.getVariablesSnapshot()
    };
    this.eventLog.push(entry);
    this.recordSnapshot(`event_${trigger}`);
    return entry;
  }

  recordSnapshot(label = 'manual') {
    this.snapshots.push({
      timestamp: Date.now(),
      label,
      currentFrameId: this.currentFrameId,
      navigationHistory: [...this.navigationHistory],
      variables: this.getVariablesSnapshot(),
      activeOverlays: [...this.activeOverlays]
    });
    if (this.snapshots.length > 50) this.snapshots.shift();
  }

  timeTravelTo(index) {
    if (index >= 0 && index < this.snapshots.length) {
      const snap = this.snapshots[index];
      this.currentFrameId = snap.currentFrameId;
      this.navigationHistory = [...snap.navigationHistory];
      this.activeOverlays = [...snap.activeOverlays];
      this.variables.clear();
      for (const [k, v] of Object.entries(snap.variables)) {
        this.setVariable(k, v);
      }
      return true;
    }
    return false;
  }

  // =========================================================================
  // 6. MOTION & SMART ANIMATE (Section 8)
  // =========================================================================

  createSpring(mass = 1, stiffness = 100, damping = 10) {
    return new AnalyticalSpring({ mass, stiffness, damping });
  }

  createCubicBezier(x1, y1, x2, y2) {
    return new CubicBezier(x1, y1, x2, y2);
  }

  matchLayers(sourceFrameId, targetFrameId) {
    const srcFrame = this.findNode(sourceFrameId);
    const tgtFrame = this.findNode(targetFrameId);
    if (!srcFrame || !tgtFrame) return [];

    const matches = [];
    const collectNodes = (node, acc = []) => {
      acc.push(node);
      if (node.childIds) {
        for (const cid of node.childIds) {
          const c = this.findNode(cid);
          if (c) collectNodes(c, acc);
        }
      }
      return acc;
    };

    const srcNodes = collectNodes(srcFrame);
    const tgtNodes = collectNodes(tgtFrame);

    for (const s of srcNodes) {
      const directMatch = tgtNodes.find(t => t.id === s.id);
      if (directMatch) {
        matches.push({ source: s, target: directMatch, matchType: 'id' });
        continue;
      }
      const nameMatch = tgtNodes.find(t => t.name === s.name && t.type === s.type);
      if (nameMatch) {
        matches.push({ source: s, target: nameMatch, matchType: 'name' });
      }
    }

    return matches;
  }

  // =========================================================================
  // 7. HELPER UTILS & PRESENTATION HTML (Section 12)
  // =========================================================================

  findNode(nodeId) {
    for (const page of this.doc.pages || []) {
      if (page.nodes?.[nodeId]) return page.nodes[nodeId];
    }
    return null;
  }

  escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  generatePrototypeHtml() {
    const page = this.doc.pages?.[0];
    if (!page) return '<div>No active design document found.</div>';

    const frames = (page.rootIds || [])
      .map(rid => page.nodes[rid])
      .filter(n => n && n.type === 'frame');

    const initialFrameId = this.currentFrameId || frames.find(f => f.isFlowStart)?.id || frames[0]?.id || null;

    const docDataJson = JSON.stringify({
      name: this.doc.name,
      pages: this.doc.pages,
      components: this.doc.components || [],
      variables: this.doc.variables || [],
      tokens: this.doc.tokens || [],
      initialFrameId
    });

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${this.escapeHtml(this.doc.name)} — Prototype Presentation</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; }
    body, html {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background: #090d16;
      font-family: 'Inter', -apple-system, sans-serif;
      color: #f8fafc;
      overflow: hidden;
      user-select: none;
    }
    #playerContainer {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      position: relative;
    }
    #playerToolbar {
      height: 44px;
      background: #0f172a;
      border-bottom: 1px solid #1e293b;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      z-index: 100;
    }
    .tool-group {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .btn-player {
      background: #1e293b;
      color: #f8fafc;
      border: 1px solid #334155;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      padding: 4px 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
    }
    .btn-player:hover {
      background: #334155;
      border-color: #0d99ff;
    }
    #viewportWrapper {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      background: radial-gradient(circle at center, #131b2e 0%, #090d16 100%);
      overflow: auto;
    }
    .device-bezel {
      border: 12px solid #1e293b;
      border-radius: 40px;
      box-shadow: 0 25px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05);
      position: relative;
      overflow: hidden;
      background: #000;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .device-screen {
      width: 100%;
      height: 100%;
      overflow-y: auto;
      overflow-x: hidden;
      position: relative;
    }
  </style>
</head>
<body>
  <div id="playerContainer">
    <div id="playerToolbar">
      <div class="tool-group">
        <span style="font-weight: 700; color: #0d99ff; font-size: 13px;">⚡ DesignForge Runtime</span>
        <span id="activeFlowLabel" style="font-size: 11px; color: #94a3b8;">Flow: Main</span>
      </div>
      <div class="tool-group">
        <button class="btn-player" id="btnRestart">↺ Restart (R)</button>
        <button class="btn-player" id="btnStep">⏭ Step</button>
        <button class="btn-player" id="btnToggleLog">📜 Event Log</button>
      </div>
    </div>
    <div id="viewportWrapper">
      <div class="device-bezel" id="activeDeviceBezel" style="width: 375px; height: 812px;">
        <div class="device-screen" id="deviceScreen">
          <!-- Interactive DOM Elements dynamically mounted -->
        </div>
      </div>
    </div>
  </div>
  <script>
    window.__DFORGE_DOC__ = ${docDataJson};
  </script>
</body>
</html>`;
  }
}
