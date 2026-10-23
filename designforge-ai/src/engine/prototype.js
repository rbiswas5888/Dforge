/**
 * DesignForge AI - Prototype & Interactive Experience Engine
 * Professional Prototype Runtime, Interactive Component State Machine,
 * Multi-Trigger Event Graph, Overlays, Smart Animate, and Presentation Player
 */

import { computeWorldBounds } from './layout.js';
import {
  AnalyticalSpring,
  decomposeMatrix2D,
  interpolateTransforms,
  matchNodesForSmartAnimate,
  resamplePathByArcLength,
  KinematicGestureTracker,
  PrototypingHFSM
} from '../editor-core/index.js';

export class PrototypeEngine {
  constructor(document) {
    this.doc = document;
    this.currentDevice = 'desktop'; // 'desktop' (1440px) | 'tablet' (768px) | 'mobile' (375px) | 'responsive'
    this.currentFrameId = null;
    this.navigationHistory = [];
    this.activeOverlays = []; // Stack of { frameId, options }
    this.instanceVariants = new Map(); // nodeId -> variantId
    this.prototypeVariables = new Map(); // varId -> value
    this.delayedTimers = [];
    this.hfsm = new PrototypingHFSM();
    this.gestureTracker = new KinematicGestureTracker();
    this.initVariables();
  }

  initVariables() {
    this.prototypeVariables.clear();
    if (this.doc?.variables) {
      const mode = this.doc.themeMode || 'dark';
      for (const v of this.doc.variables) {
        const val = v.values?.[mode] !== undefined ? v.values[mode] : v.values?.default;
        this.prototypeVariables.set(v.id, val);
      }
    }
  }

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
      this.scheduleDelayActions(targetId);
    }
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

  startRuntime(pageId = null, initialFrameId = null) {
    this.startFlow(initialFrameId);
    return this;
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

  cancelDelayedActions() {
    for (const t of this.delayedTimers) {
      clearTimeout(t);
    }
    this.delayedTimers = [];
  }

  scheduleDelayActions(frameId) {
    this.cancelDelayedActions();
    for (const page of this.doc.pages || []) {
      const frame = page.nodes?.[frameId];
      if (!frame) continue;

      const scanForDelay = (nodeId) => {
        const node = page.nodes[nodeId];
        if (!node) return;
        if (node.interactions && node.interactions.length > 0) {
          for (const inter of node.interactions) {
            if (inter.trigger === 'delay' || inter.trigger === 'after-delay') {
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
  }

  handleEvent(sourceNodeId, eventType = 'click', eventData = {}) {
    for (const page of this.doc.pages || []) {
      const node = page.nodes?.[sourceNodeId];
      if (!node || !node.interactions || node.interactions.length === 0) continue;

      // Match trigger
      const match = node.interactions.find(i => {
        const tr = i.trigger || 'click';
        if (eventType === 'click' && (tr === 'click' || tr === 'tap')) return true;
        if (eventType === 'tap' && (tr === 'tap' || tr === 'click')) return true;
        if (eventType === 'hover' && (tr === 'hover' || tr === 'enter' || tr === 'mouse_enter')) return true;
        if (eventType === 'leave' && (tr === 'leave' || tr === 'mouse_leave')) return true;
        if (eventType === 'press' && (tr === 'press' || tr === 'down' || tr === 'mouse_down')) return true;
        if (eventType === 'drag' && tr === 'drag') return true;
        if (eventType === 'key' && (tr === 'key' || tr === 'keyboard') && (!i.key || i.key === eventData.key)) return true;
        return tr === eventType;
      });

      if (match) {
        return this.executeAction(match, sourceNodeId);
      }
    }
    return { success: false, reason: 'No matching interaction found' };
  }

  executeAction(interaction, sourceNodeId = null) {
    const action = interaction.action || 'navigate';

    // 1. Navigation
    if (action === 'navigate' && interaction.targetId) {
      // Validate target exists
      const targetFrame = this.findNode(interaction.targetId);
      if (!targetFrame) {
        return { success: false, error: `Target frame ${interaction.targetId} not found` };
      }
      this.cancelDelayedActions();
      this.currentFrameId = interaction.targetId;
      this.navigationHistory.push(interaction.targetId);
      this.scheduleDelayActions(interaction.targetId);
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

    // 3. Change Variant (Interactive Component State)
    if (action === 'change_variant' || action === 'change-variant') {
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

    // 4. Overlays
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

    // 5. Variables & Conditions (HFSM State Machine)
    if (action === 'set_variable' && interaction.variableUpdate) {
      const { varId, value, expr } = interaction.variableUpdate;
      if (expr) {
        this.hfsm.executeMutation(expr);
        const resolved = this.hfsm.getVariable(varId);
        this.prototypeVariables.set(varId, resolved);
        return { success: true, action: 'set_variable', varId, value: resolved };
      } else {
        this.prototypeVariables.set(varId, value);
        this.hfsm.setVariable(varId, value);
        return { success: true, action: 'set_variable', varId, value };
      }
    }

    if (action === 'conditional' && (interaction.condition || interaction.predicate)) {
      let passed = false;
      if (interaction.predicate) {
        passed = this.hfsm.evaluatePredicate(interaction.predicate);
      } else if (interaction.condition) {
        const { varId, op, val } = interaction.condition;
        const currentVal = this.prototypeVariables.get(varId);
        if (op === '==') passed = currentVal == val;
        else if (op === '!=') passed = currentVal != val;
        else if (op === '>') passed = currentVal > val;
        else if (op === '<') passed = currentVal < val;
        else if (op === '>=') passed = currentVal >= val;
        else if (op === '<=') passed = currentVal <= val;
      }

      if (passed && interaction.thenAction) {
        return this.executeAction(interaction.thenAction, sourceNodeId);
      } else if (!passed && (interaction.elseAction || interaction.condition?.elseAction)) {
        return this.executeAction(interaction.elseAction || interaction.condition.elseAction, sourceNodeId);
      }
      return { success: true, action: 'conditional', passed };
    }

    // 6. External URL
    if (action === 'url' && interaction.url) {
      return { success: true, action: 'url', url: interaction.url };
    }

    // 7. Scroll To
    if (action === 'scroll_to' && interaction.targetId) {
      return { success: true, action: 'scroll_to', targetId: interaction.targetId };
    }

    return { success: true, action };
  }

  findNode(nodeId) {
    for (const page of this.doc.pages || []) {
      if (page.nodes?.[nodeId]) return page.nodes[nodeId];
    }
    return null;
  }

  /**
   * Smart Animate Layer Matcher: compares source frame and target frame
   * finds identical IDs or matching names and hierarchic roles
   */
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

  /**
   * Generates a fully autonomous presentation player HTML package
   * with full interactive state machine, variant switching, overlays,
   * smooth transitions, smart animate, and error diagnostics.
   */
  generateStandalonePlayer(pageId = null) {
    return this.generatePrototypeHtml();
  }

  generatePrototypeHtml() {
    const page = this.doc.pages?.[0];
    if (!page) return '<div>No active design document found.</div>';

    const frames = (page.rootIds || [])
      .map(rid => page.nodes[rid])
      .filter(n => n && n.type === 'frame');

    const initialFrameId = this.currentFrameId || frames.find(f => f.isFlowStart)?.id || frames[0]?.id || null;

    // Serialize document data for client runtime
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
  <title>${this.escapeHtml(this.doc.name)} — Prototype Player</title>
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
      padding: 5px 12px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
    }
    .btn-player:hover {
      background: #334155;
      border-color: #38bdf8;
    }
    .flow-badge {
      font-size: 11px;
      font-weight: 700;
      color: #38bdf8;
      background: rgba(56, 189, 248, 0.12);
      padding: 3px 8px;
      border-radius: 4px;
    }
    #viewportStage {
      flex: 1;
      width: 100%;
      height: calc(100% - 44px);
      position: relative;
      overflow: auto;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #090d16;
    }
    .frame-wrapper {
      position: relative;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6);
      transition: opacity 0.25s ease, transform 0.25s ease;
      background: #0f172a;
    }
    .transition-slide-left {
      animation: slideLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes slideLeft {
      from { transform: translateX(60px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    .transition-dissolve {
      animation: dissolve 0.25s ease forwards;
    }
    @keyframes dissolve {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    /* Modal Overlay Backdrop */
    .overlay-backdrop {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.65);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 50;
      animation: dissolve 0.2s ease;
    }
    .interactive-element {
      cursor: pointer !important;
      transition: filter 0.15s ease, transform 0.15s ease;
    }
    .interactive-element:hover {
      filter: brightness(1.1);
    }
    .interactive-element:active {
      transform: scale(0.98);
    }
    /* Diagnostics Banner */
    #diagnosticsBanner {
      display: none;
      position: absolute;
      bottom: 16px;
      left: 50%;
      transform: translateX(-50%);
      background: #ef4444;
      color: #ffffff;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      box-shadow: 0 10px 20px rgba(0,0,0,0.4);
      z-index: 1000;
    }
  </style>
</head>
<body>
  <div id="playerContainer">
    <div id="playerToolbar">
      <div class="tool-group">
        <span class="flow-badge">▶ Flow 1</span>
        <span id="currentFrameName" style="font-size: 12px; font-weight: 600; color: #cbd5e1;"></span>
      </div>
      <div class="tool-group">
        <button class="btn-player" id="btnPlayerBack" title="Go Back">← Back</button>
        <button class="btn-player" id="btnPlayerRestart" title="Restart Prototype">↺ Restart</button>
        <button class="btn-player" id="btnPlayerResetVars" title="Reset Variables">⚡ Reset State</button>
      </div>
    </div>

    <div id="viewportStage" class="proto-bezel">
      <div id="screenMount"></div>
      <div id="overlayMount" style="display: none;" class="overlay-backdrop"></div>
    </div>

    <div id="diagnosticsBanner"></div>
  </div>

  <script>
    const PROJECT = ${docDataJson};
    let currentFrameId = PROJECT.initialFrameId;
    let historyStack = [currentFrameId];
    let activeOverlay = null;
    let instanceVariants = new Map();
    let runtimeVariables = new Map();
    let delayTimer = null;

    // Initialize Variables
    function initVars() {
      runtimeVariables.clear();
      (PROJECT.variables || []).forEach(v => {
        runtimeVariables.set(v.id, v.values?.default ?? v.values?.dark ?? '#3b82f6');
      });
    }
    initVars();

    function showDiagnostic(msg) {
      const b = document.getElementById('diagnosticsBanner');
      b.textContent = msg;
      b.style.display = 'block';
      setTimeout(() => { b.style.display = 'none'; }, 3500);
    }

    function findNode(id) {
      for (const p of PROJECT.pages || []) {
        if (p.nodes?.[id]) return p.nodes[id];
      }
      return null;
    }

    function renderNodeToHtml(nodeId, page) {
      const node = page.nodes[nodeId];
      if (!node || node.visible === false) return '';

      // Check instance variant override
      let effectiveNode = node;
      if (node.type === 'instance' && node.componentId) {
        const comp = (PROJECT.components || []).find(c => c.id === node.componentId);
        if (comp) {
          const varId = instanceVariants.get(node.id) || node.variantId || comp.defaultVariantId;
          const vDef = (comp.variants || []).find(v => v.id === varId);
          if (vDef?.rootNode) {
            effectiveNode = {
              ...node,
              style: { ...(vDef.rootNode.style || {}), ...(node.overrides?.style || {}) },
              text: node.text || vDef.rootNode.text
            };
          }
        }
      }

      const t = effectiveNode.transform || { x: 0, y: 0, width: 100, height: 100 };
      const s = effectiveNode.style || {};
      const l = effectiveNode.layout || { mode: 'none' };
      const rad = s.cornerRadius || 0;

      let styles = [
        \`width:\${t.width}px\`,
        \`height:\${t.height}px\`,
        \`position:relative\`
      ];

      // Fills
      if (s.fills && s.fills.length > 0) {
        const f = s.fills[0];
        if (f.type === 'image' && (f.url || node.image?.url)) {
          styles.push(\`background-image:url('\${f.url || node.image?.url}')\`, \`background-size:cover\`, \`background-position:center\`);
        } else {
          styles.push(\`background-color:\${f.color || '#334155'}\`);
        }
      }

      // Strokes
      if (s.strokes && s.strokes.length > 0) {
        const st = s.strokes[0];
        styles.push(\`border:\${st.width || 1}px \${st.style || 'solid'} \${st.color || '#3b82f6'}\`);
      }

      // Radius
      if (typeof rad === 'object' && rad !== null) {
        styles.push(\`border-radius:\${rad.topLeft || 0}px \${rad.topRight || 0}px \${rad.bottomRight || 0}px \${rad.bottomLeft || 0}px\`);
      } else if (rad > 0) {
        styles.push(\`border-radius:\${rad}px\`);
      }

      // Flex Layout
      if (l.mode && l.mode !== 'none') {
        styles.push('display:flex', \`flex-direction:\${l.mode === 'stack-vertical' ? 'column' : 'row'}\`);
        styles.push(\`padding:\${l.paddingTop || 0}px \${l.paddingRight || 0}px \${l.paddingBottom || 0}px \${l.paddingLeft || 0}px\`);
        styles.push(\`gap:\${l.gap || 0}px\`);
        if (l.alignItems === 'center') styles.push('align-items:center');
        else if (l.alignItems === 'end') styles.push('align-items:flex-end');
        else styles.push('align-items:flex-start');
        if (l.justifyContent === 'space-between') styles.push('justify-content:space-between');
        else if (l.justifyContent === 'center') styles.push('justify-content:center');
      }

      // Opacity
      if (effectiveNode.opacity !== undefined && effectiveNode.opacity < 1) {
        styles.push(\`opacity:\${effectiveNode.opacity}\`);
      }

      const hasInteractions = effectiveNode.interactions && effectiveNode.interactions.length > 0;
      const interactiveCls = hasInteractions ? 'interactive-element' : '';

      if (effectiveNode.type === 'text') {
        const txt = effectiveNode.text || {};
        styles.push(
          \`color:\${txt.color || '#f8fafc'}\`,
          \`font-size:\${txt.fontSize || 14}px\`,
          \`font-weight:\${txt.fontWeight || '400'}\`,
          \`line-height:\${txt.lineHeight || 1.4}\`,
          \`text-align:\${txt.textAlign || 'left'}\`,
          'margin:0',
          'word-break:break-word'
        );
        return \`<p id="node_\${node.id}" class="\${interactiveCls}" style="\${styles.join(';')};" data-node-id="\${node.id}">\${escapeHtml(txt.content || '')}</p>\`;
      }

      const childrenHtml = (effectiveNode.childIds || []).map(cid => renderNodeToHtml(cid, page)).join('\\n');
      return \`<div id="node_\${node.id}" class="\${interactiveCls}" style="\${styles.join(';')};" data-node-id="\${node.id}">\${childrenHtml}</div>\`;
    }

    function escapeHtml(s) {
      return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function renderScreen(frameId, transitionType = 'instant') {
      const page = PROJECT.pages[0];
      const frame = page?.nodes[frameId];
      const mount = document.getElementById('screenMount');
      const title = document.getElementById('currentFrameName');

      if (!frame) {
        showDiagnostic('Invalid destination frame link: ' + frameId);
        return;
      }

      if (title) title.textContent = frame.name || 'Frame';
      currentFrameId = frameId;

      if (delayTimer) clearTimeout(delayTimer);

      const html = renderNodeToHtml(frameId, page);
      mount.innerHTML = \`<div class="frame-wrapper transition-\${transitionType}">\${html}</div>\`;

      attachInteractions(frame, page);
    }

    function attachInteractions(frameNode, page) {
      const scanAndBind = (nodeId) => {
        const n = page.nodes[nodeId];
        if (!n) return;
        const el = document.getElementById('node_' + nodeId);

        if (el && n.interactions && n.interactions.length > 0) {
          n.interactions.forEach(inter => {
            const tr = inter.trigger || 'click';

            if (tr === 'click' || tr === 'tap') {
              el.addEventListener('click', (e) => {
                e.stopPropagation();
                dispatchAction(inter, n);
              });
            } else if (tr === 'hover' || tr === 'enter') {
              el.addEventListener('mouseenter', (e) => {
                dispatchAction(inter, n);
              });
              if (inter.action === 'change_variant') {
                el.addEventListener('mouseleave', () => {
                  instanceVariants.delete(n.id);
                  renderScreen(currentFrameId, 'instant');
                });
              }
            } else if (tr === 'press') {
              el.addEventListener('mousedown', () => dispatchAction(inter, n));
              if (inter.action === 'change_variant') {
                window.addEventListener('mouseup', () => {
                  instanceVariants.delete(n.id);
                  renderScreen(currentFrameId, 'instant');
                }, { once: true });
              }
            } else if (tr === 'delay' || tr === 'after-delay') {
              const delay = inter.delayMs || 1000;
              delayTimer = setTimeout(() => {
                dispatchAction(inter, n);
              }, delay);
            }
          });
        }

        if (n.childIds) {
          n.childIds.forEach(scanAndBind);
        }
      };

      scanAndBind(frameNode.id);
    }

    function dispatchAction(inter, sourceNode) {
      const act = inter.action || 'navigate';

      if (act === 'navigate' && inter.targetId) {
        const anim = inter.animation || 'slide-left';
        historyStack.push(inter.targetId);
        renderScreen(inter.targetId, anim);
      } else if (act === 'back') {
        if (historyStack.length > 1) {
          historyStack.pop();
          const prev = historyStack[historyStack.length - 1];
          renderScreen(prev, 'dissolve');
        } else {
          showDiagnostic('Already at beginning of prototype flow');
        }
      } else if (act === 'change_variant') {
        const varId = inter.targetVariantId || inter.variantId;
        if (varId) {
          instanceVariants.set(sourceNode.id, varId);
          renderScreen(currentFrameId, 'instant');
        }
      } else if (act === 'overlay' || act === 'open_overlay') {
        openOverlay(inter.targetId, inter.overlayOptions);
      } else if (act === 'close_overlay') {
        closeOverlay();
      } else if (act === 'conditional') {
        let passed = false;
        if (inter.predicate) {
          try {
            const ctx = Object.fromEntries(runtimeVariables);
            const fn = new Function(...Object.keys(ctx), 'return Boolean(' + inter.predicate + ');');
            passed = Boolean(fn(...Object.values(ctx)));
          } catch { passed = false; }
        } else if (inter.condition) {
          const { varId, op, val } = inter.condition;
          const cur = runtimeVariables.get(varId);
          if (op === '==') passed = cur == val;
          else if (op === '!=') passed = cur != val;
          else if (op === '>') passed = cur > val;
          else if (op === '<') passed = cur < val;
          else if (op === '>=') passed = cur >= val;
          else if (op === '<=') passed = cur <= val;
        }
        if (passed && inter.thenAction) {
          dispatchAction(inter.thenAction, sourceNode);
        } else if (!passed && (inter.elseAction || inter.condition?.elseAction)) {
          dispatchAction(inter.elseAction || inter.condition.elseAction, sourceNode);
        }
      } else if (act === 'set_variable' && inter.variableUpdate) {
        const { varId, value, expr } = inter.variableUpdate;
        if (expr) {
          try {
            const match = expr.match(/^([a-zA-Z0-9_]+)\s*(\+=|-=|\*=|\/=|=)\s*(.+)$/);
            if (match) {
              const [, vName, op, rawRhs] = match;
              const cur = runtimeVariables.get(vName) !== undefined ? runtimeVariables.get(vName) : 0;
              const rhs = Number(rawRhs) || rawRhs.replace(/['"]/g, '');
              let nextVal = rhs;
              if (op === '+=') nextVal = Number(cur) + Number(rhs);
              else if (op === '-=') nextVal = Number(cur) - Number(rhs);
              else if (op === '*=') nextVal = Number(cur) * Number(rhs);
              else if (op === '/=') nextVal = Number(cur) / (Number(rhs) || 1);
              runtimeVariables.set(vName, nextVal);
            }
          } catch (e) {}
        } else {
          runtimeVariables.set(varId, value);
        }
        showDiagnostic('Updated variable: ' + (varId || 'state'));
      } else if (act === 'url' && inter.url) {
        window.open(inter.url, '_blank');
      }
    }

    function openOverlay(frameId, options = {}) {
      const page = PROJECT.pages[0];
      const target = page?.nodes[frameId];
      if (!target) {
        showDiagnostic('Overlay frame not found: ' + frameId);
        return;
      }
      activeOverlay = frameId;
      const overlayMount = document.getElementById('overlayMount');
      overlayMount.innerHTML = \`<div class="frame-wrapper" style="box-shadow: 0 30px 80px rgba(0,0,0,0.8);">\${renderNodeToHtml(frameId, page)}</div>\`;
      overlayMount.style.display = 'flex';

      // Outside click dismiss
      overlayMount.onclick = (e) => {
        if (e.target === overlayMount) closeOverlay();
      };
    }

    function closeOverlay() {
      activeOverlay = null;
      const overlayMount = document.getElementById('overlayMount');
      overlayMount.style.display = 'none';
      overlayMount.innerHTML = '';
    }

    // Escape Key Dismissal
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && activeOverlay) {
        closeOverlay();
      }
    });

    // Toolbar Controls
    document.getElementById('btnPlayerBack')?.addEventListener('click', () => {
      if (historyStack.length > 1) {
        historyStack.pop();
        renderScreen(historyStack[historyStack.length - 1], 'dissolve');
      }
    });

    document.getElementById('btnPlayerRestart')?.addEventListener('click', () => {
      instanceVariants.clear();
      initVars();
      historyStack = [PROJECT.initialFrameId];
      renderScreen(PROJECT.initialFrameId, 'dissolve');
    });

    document.getElementById('btnPlayerResetVars')?.addEventListener('click', () => {
      initVars();
      showDiagnostic('Reset prototype variables to defaults');
    });

    // Boot initial frame
    if (initialFrameId) {
      renderScreen(initialFrameId, 'dissolve');
    }
  </script>
</body>
</html>`;
  }

  escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}
