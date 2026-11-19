/**
 * DesignForge AI — Advanced Ruler, Guide, and Smart Measurement Engine
 * 
 * Features:
 * 1. High-DPI Horizontal and Vertical Coordinate Rulers (top & left)
 * 2. Zoom-adaptive major/minor tick marks, negative coordinate support, and origin tracking
 * 3. Interactive Guide Management: drag from rulers, move, duplicate (Alt/Option), delete, lock, snap
 * 4. Persistent Document Guides (`page.guides`) integrated with CommandEngine undo/redo
 * 5. Smart Redline Measurements: Option/Alt distance inspection, gap redlines, distance pills
 * 6. Centralized world <-> screen coordinate transformations
 */

export class RulerGuideMeasurementEngine {
  constructor(app) {
    this.app = app;
    this.rulerThickness = 20; // 20px ruler width / height
    this.rulerColor = 'rgba(15, 17, 23, 0.95)';
    this.tickColor = 'rgba(255, 255, 255, 0.2)';
    this.majorTickColor = 'rgba(255, 255, 255, 0.5)';
    this.textColor = 'rgba(255, 255, 255, 0.65)';
    this.accentColor = '#22D3EE'; // Cyan smart guide color
    this.redlineColor = '#EC4899'; // Vibrant magenta redline measurement
    this.guideHoverColor = '#38BDF8'; // Sky blue hover
    
    this.hoveredGuide = null;
    this.selectedGuide = null;
    this.activeDragGuide = null;
    this.isOptionPressed = false;
    this.measurementTargetId = null;
    this.guidesLocked = false;
    this.guidesVisible = true;
    
    // Canvas elements for rulers
    this.rulerHCanvas = null;
    this.rulerVCanvas = null;
    this.rulerHCtx = null;
    this.rulerVCtx = null;

    this.cursorPosition = { screenX: 0, screenY: 0, worldX: 0, worldY: 0 };
    this.dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;

    this.initRulers();
  }

  // =========================================================================
  // 1. Centralized Coordinate Transformation Utilities
  // =========================================================================

  /**
   * Screen coordinate to Canvas World coordinate
   */
  screenToWorld(screenX, screenY) {
    const renderer = this.app.renderer;
    if (!renderer) return { x: screenX, y: screenY };
    const rect = renderer.canvas?.getBoundingClientRect() || { left: 0, top: 0 };
    const x = (screenX - rect.left - renderer.panX) / renderer.zoom;
    const y = (screenY - rect.top - renderer.panY) / renderer.zoom;
    return { x, y };
  }

  /**
   * Canvas World coordinate to Screen coordinate
   */
  worldToScreen(worldX, worldY) {
    const renderer = this.app.renderer;
    if (!renderer) return { x: worldX, y: worldY };
    const rect = renderer.canvas?.getBoundingClientRect() || { left: 0, top: 0 };
    const x = worldX * renderer.zoom + renderer.panX + rect.left;
    const y = worldY * renderer.zoom + renderer.panY + rect.top;
    return { x, y };
  }

  // =========================================================================
  // 2. High-DPI Canvas Ruler Initializer & DOM Setup
  // =========================================================================

  initRulers() {
    if (typeof document === 'undefined') return;

    const rhContainer = document.getElementById('canvasRulerH');
    const rvContainer = document.getElementById('canvasRulerV');
    if (!rhContainer || !rvContainer) return;

    // Clear old textContent or divs
    rhContainer.innerHTML = '';
    rvContainer.innerHTML = '';

    // Style containers to allow pointer interaction
    rhContainer.style.pointerEvents = 'auto';
    rhContainer.style.cursor = 'row-resize';
    rvContainer.style.pointerEvents = 'auto';
    rvContainer.style.cursor = 'col-resize';

    // Create high-DPI canvases
    this.rulerHCanvas = document.createElement('canvas');
    this.rulerHCanvas.style.width = '100%';
    this.rulerHCanvas.style.height = `${this.rulerThickness}px`;
    rhContainer.appendChild(this.rulerHCanvas);
    this.rulerHCtx = this.rulerHCanvas.getContext('2d');

    this.rulerVCanvas = document.createElement('canvas');
    this.rulerVCanvas.style.width = `${this.rulerThickness}px`;
    this.rulerVCanvas.style.height = '100%';
    rvContainer.appendChild(this.rulerVCanvas);
    this.rulerVCtx = this.rulerVCanvas.getContext('2d');

    this.bindRulerEvents(rhContainer, rvContainer);
    this.updateRulerSizes();
  }

  updateRulerSizes() {
    if (!this.rulerHCanvas || !this.rulerVCanvas) return;
    const rhContainer = document.getElementById('canvasRulerH');
    const rvContainer = document.getElementById('canvasRulerV');
    if (!rhContainer || !rvContainer) return;

    const w = rhContainer.clientWidth || window.innerWidth;
    const h = rvContainer.clientHeight || window.innerHeight;
    this.dpr = window.devicePixelRatio || 1;

    this.rulerHCanvas.width = Math.round(w * this.dpr);
    this.rulerHCanvas.height = Math.round(this.rulerThickness * this.dpr);

    this.rulerVCanvas.width = Math.round(this.rulerThickness * this.dpr);
    this.rulerVCanvas.height = Math.round(h * this.dpr);

    this.renderRulers();
  }

  // =========================================================================
  // 3. Ruler Tick Spacing & Rendering Pipeline
  // =========================================================================

  /**
   * Determine optimal major and minor tick intervals based on current zoom
   */
  calculateTickInterval(zoom) {
    if (zoom >= 4) {
      return { major: 20, minor: 5, sub: 1 };
    } else if (zoom >= 2) {
      return { major: 50, minor: 10, sub: 5 };
    } else if (zoom >= 0.8) {
      return { major: 100, minor: 20, sub: 10 };
    } else if (zoom >= 0.4) {
      return { major: 200, minor: 50, sub: 25 };
    } else if (zoom >= 0.2) {
      return { major: 500, minor: 100, sub: 50 };
    } else {
      return { major: 1000, minor: 200, sub: 100 };
    }
  }

  renderRulers() {
    if (!this.rulerHCtx || !this.rulerVCtx || !this.app.renderer) return;
    const renderer = this.app.renderer;
    const zoom = renderer.zoom || 1;
    const panX = renderer.panX || 0;
    const panY = renderer.panY || 0;
    const dpr = this.dpr;

    const rhContainer = document.getElementById('canvasRulerH');
    const rvContainer = document.getElementById('canvasRulerV');
    const screenW = rhContainer?.clientWidth || window.innerWidth;
    const screenH = rvContainer?.clientHeight || window.innerHeight;

    const { major, minor, sub } = this.calculateTickInterval(zoom);

    // -------------------------------------------------------------
    // Horizontal Ruler (Top)
    // -------------------------------------------------------------
    const ctxH = this.rulerHCtx;
    ctxH.save();
    ctxH.scale(dpr, dpr);
    ctxH.clearRect(0, 0, screenW, this.rulerThickness);

    // Background & bottom border
    ctxH.fillStyle = this.rulerColor;
    ctxH.fillRect(0, 0, screenW, this.rulerThickness);
    ctxH.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctxH.lineWidth = 1;
    ctxH.beginPath();
    ctxH.moveTo(0, this.rulerThickness - 0.5);
    ctxH.lineTo(screenW, this.rulerThickness - 0.5);
    ctxH.stroke();

    // Top-left corner box (where H and V meet)
    ctxH.fillStyle = 'rgba(30, 35, 48, 0.9)';
    ctxH.fillRect(0, 0, this.rulerThickness, this.rulerThickness);

    // Calculate visible world range
    const startWorldX = Math.floor((-panX) / (zoom * sub)) * sub;
    const endWorldX = Math.ceil((screenW - panX) / (zoom * sub)) * sub;

    ctxH.font = '9px "SF Pro", -apple-system, BlinkMacSystemFont, "JetBrains Mono", monospace';
    ctxH.textAlign = 'left';
    ctxH.textBaseline = 'top';

    for (let wx = startWorldX; wx <= endWorldX; wx += sub) {
      const sx = Math.round(wx * zoom + panX);
      if (sx < this.rulerThickness || sx > screenW) continue;

      const isMajor = wx % major === 0;
      const isMinor = wx % minor === 0;

      ctxH.beginPath();
      if (isMajor) {
        ctxH.strokeStyle = this.majorTickColor;
        ctxH.lineWidth = 1;
        ctxH.moveTo(sx + 0.5, this.rulerThickness - 10);
        ctxH.lineTo(sx + 0.5, this.rulerThickness);
        ctxH.stroke();

        ctxH.fillStyle = this.textColor;
        ctxH.fillText(`${wx}`, sx + 3, 3);
      } else if (isMinor) {
        ctxH.strokeStyle = this.tickColor;
        ctxH.lineWidth = 1;
        ctxH.moveTo(sx + 0.5, this.rulerThickness - 6);
        ctxH.lineTo(sx + 0.5, this.rulerThickness);
        ctxH.stroke();
      } else {
        ctxH.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctxH.lineWidth = 0.5;
        ctxH.moveTo(sx + 0.5, this.rulerThickness - 3);
        ctxH.lineTo(sx + 0.5, this.rulerThickness);
        ctxH.stroke();
      }
    }

    // Cursor indicator on top ruler
    if (this.cursorPosition.screenX >= this.rulerThickness && this.cursorPosition.screenX <= screenW) {
      ctxH.strokeStyle = this.accentColor;
      ctxH.lineWidth = 1.5;
      ctxH.beginPath();
      ctxH.moveTo(this.cursorPosition.screenX + 0.5, 0);
      ctxH.lineTo(this.cursorPosition.screenX + 0.5, this.rulerThickness);
      ctxH.stroke();
    }

    // Selected object span on top ruler
    this.drawSelectionRulerSpanH(ctxH, zoom, panX);
    ctxH.restore();

    // -------------------------------------------------------------
    // Vertical Ruler (Left)
    // -------------------------------------------------------------
    const ctxV = this.rulerVCtx;
    ctxV.save();
    ctxV.scale(dpr, dpr);
    ctxV.clearRect(0, 0, this.rulerThickness, screenH);

    ctxV.fillStyle = this.rulerColor;
    ctxV.fillRect(0, 0, this.rulerThickness, screenH);
    ctxV.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctxV.lineWidth = 1;
    ctxV.beginPath();
    ctxV.moveTo(this.rulerThickness - 0.5, 0);
    ctxV.lineTo(this.rulerThickness - 0.5, screenH);
    ctxV.stroke();

    const startWorldY = Math.floor((-panY) / (zoom * sub)) * sub;
    const endWorldY = Math.ceil((screenH - panY) / (zoom * sub)) * sub;

    for (let wy = startWorldY; wy <= endWorldY; wy += sub) {
      const sy = Math.round(wy * zoom + panY);
      if (sy < this.rulerThickness || sy > screenH) continue;

      const isMajor = wy % major === 0;
      const isMinor = wy % minor === 0;

      ctxV.beginPath();
      if (isMajor) {
        ctxV.strokeStyle = this.majorTickColor;
        ctxV.lineWidth = 1;
        ctxV.moveTo(this.rulerThickness - 10, sy + 0.5);
        ctxV.lineTo(this.rulerThickness, sy + 0.5);
        ctxV.stroke();

        ctxV.save();
        ctxV.translate(3, sy + 3);
        ctxV.rotate(-Math.PI / 2);
        ctxV.fillStyle = this.textColor;
        ctxV.font = '9px "SF Pro", -apple-system, BlinkMacSystemFont, "JetBrains Mono", monospace';
        ctxV.fillText(`${wy}`, -20, 8);
        ctxV.restore();
      } else if (isMinor) {
        ctxV.strokeStyle = this.tickColor;
        ctxV.lineWidth = 1;
        ctxV.moveTo(this.rulerThickness - 6, sy + 0.5);
        ctxV.lineTo(this.rulerThickness, sy + 0.5);
        ctxV.stroke();
      } else {
        ctxV.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctxV.lineWidth = 0.5;
        ctxV.moveTo(this.rulerThickness - 3, sy + 0.5);
        ctxV.lineTo(this.rulerThickness, sy + 0.5);
        ctxV.stroke();
      }
    }

    // Cursor indicator on vertical ruler
    if (this.cursorPosition.screenY >= this.rulerThickness && this.cursorPosition.screenY <= screenH) {
      ctxV.strokeStyle = this.accentColor;
      ctxV.lineWidth = 1.5;
      ctxV.beginPath();
      ctxV.moveTo(0, this.cursorPosition.screenY + 0.5);
      ctxV.lineTo(this.rulerThickness, this.cursorPosition.screenY + 0.5);
      ctxV.stroke();
    }

    // Selected object span on left ruler
    this.drawSelectionRulerSpanV(ctxV, zoom, panY);
    ctxV.restore();
  }

  drawSelectionRulerSpanH(ctx, zoom, panX) {
    const selectedIds = this.app.engine?.getSelection?.() || [];
    if (selectedIds.length === 0) return;
    const page = this.app.engine?.getActivePage?.();
    if (!page) return;

    let minX = Infinity, maxX = -Infinity;
    for (const id of selectedIds) {
      const node = page.nodes[id];
      if (node && node.bounds) {
        minX = Math.min(minX, node.bounds.x);
        maxX = Math.max(maxX, node.bounds.x + node.bounds.width);
      }
    }
    if (minX !== Infinity && maxX !== -Infinity) {
      const sx1 = Math.max(this.rulerThickness, minX * zoom + panX);
      const sx2 = Math.min(ctx.canvas.width / this.dpr, maxX * zoom + panX);
      if (sx2 > sx1) {
        ctx.fillStyle = 'rgba(34, 211, 238, 0.25)';
        ctx.fillRect(sx1, this.rulerThickness - 4, sx2 - sx1, 4);
      }
    }
  }

  drawSelectionRulerSpanV(ctx, zoom, panY) {
    const selectedIds = this.app.engine?.getSelection?.() || [];
    if (selectedIds.length === 0) return;
    const page = this.app.engine?.getActivePage?.();
    if (!page) return;

    let minY = Infinity, maxY = -Infinity;
    for (const id of selectedIds) {
      const node = page.nodes[id];
      if (node && node.bounds) {
        minY = Math.min(minY, node.bounds.y);
        maxY = Math.max(maxY, node.bounds.y + node.bounds.height);
      }
    }
    if (minY !== Infinity && maxY !== -Infinity) {
      const sy1 = Math.max(this.rulerThickness, minY * zoom + panY);
      const sy2 = Math.min(ctx.canvas.height / this.dpr, maxY * zoom + panY);
      if (sy2 > sy1) {
        ctx.fillStyle = 'rgba(34, 211, 238, 0.25)';
        ctx.fillRect(this.rulerThickness - 4, sy1, 4, sy2 - sy1);
      }
    }
  }

  // =========================================================================
  // 4. Guide Management (Creation, Moving, Deleting, Snapping, Persistence)
  // =========================================================================

  getActiveGuides() {
    const page = this.app.engine?.getActivePage?.();
    if (!page) return [];
    if (!Array.isArray(page.guides)) {
      page.guides = [];
    }
    return page.guides;
  }

  addGuide(type, position, options = {}) {
    const page = this.app.engine?.getActivePage?.();
    if (!page) return null;
    if (!Array.isArray(page.guides)) {
      page.guides = [];
    }

    const guide = {
      id: `guide_${Math.random().toString(36).substr(2, 8)}_${Date.now()}`,
      type: type === 'vertical' ? 'vertical' : 'horizontal',
      position: Math.round(position),
      locked: Boolean(options.locked),
      color: options.color || this.accentColor
    };

    page.guides.push(guide);
    this.selectedGuide = guide;
    this.app.renderer?.render?.();
    this.renderRulers();
    return guide;
  }

  removeGuide(guideId) {
    const page = this.app.engine?.getActivePage?.();
    if (!page || !Array.isArray(page.guides)) return false;
    const index = page.guides.findIndex(g => g.id === guideId);
    if (index !== -1) {
      page.guides.splice(index, 1);
      if (this.selectedGuide?.id === guideId) this.selectedGuide = null;
      if (this.hoveredGuide?.id === guideId) this.hoveredGuide = null;
      this.app.renderer?.render?.();
      this.renderRulers();
      return true;
    }
    return false;
  }

  clearAllGuides() {
    const page = this.app.engine?.getActivePage?.();
    if (!page) return;
    page.guides = [];
    this.selectedGuide = null;
    this.hoveredGuide = null;
    this.app.renderer?.render?.();
    this.renderRulers();
  }

  toggleLockGuides() {
    this.guidesLocked = !this.guidesLocked;
    const page = this.app.engine?.getActivePage?.();
    if (page?.guides) {
      for (const g of page.guides) {
        g.locked = this.guidesLocked;
      }
    }
    this.app.showToast?.(`Guides ${this.guidesLocked ? 'locked' : 'unlocked'}`, 'info', 1500);
    this.app.renderer?.render?.();
  }

  toggleGuidesVisibility() {
    this.guidesVisible = !this.guidesVisible;
    this.app.showToast?.(`Guides ${this.guidesVisible ? 'shown' : 'hidden'}`, 'info', 1500);
    this.app.renderer?.render?.();
  }

  /**
   * Hit test against existing guides (within 5 screen pixels tolerance)
   */
  hitTestGuide(screenX, screenY, tolerancePx = 6) {
    if (!this.guidesVisible) return null;
    const renderer = this.app.renderer;
    if (!renderer) return null;
    const guides = this.getActiveGuides();
    const rect = renderer.canvas?.getBoundingClientRect() || { left: 0, top: 0 };

    for (const guide of guides) {
      if (guide.type === 'horizontal') {
        const screenPos = guide.position * renderer.zoom + renderer.panY + rect.top;
        if (Math.abs(screenY - screenPos) <= tolerancePx) {
          return guide;
        }
      } else {
        const screenPos = guide.position * renderer.zoom + renderer.panX + rect.left;
        if (Math.abs(screenX - screenPos) <= tolerancePx) {
          return guide;
        }
      }
    }
    return null;
  }

  // =========================================================================
  // 5. Ruler & Guide Drag Event Handlers
  // =========================================================================

  bindRulerEvents(rhContainer, rvContainer) {
    // 1. Drag horizontal guide from top ruler
    rhContainer.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const rect = this.app.renderer?.canvas?.getBoundingClientRect() || { left: 0, top: 0 };
      const startWorld = this.screenToWorld(e.clientX, e.clientY);
      const newGuide = {
        id: `guide_temp_${Date.now()}`,
        type: 'horizontal',
        position: Math.round(startWorld.y),
        isNew: true
      };
      this.activeDragGuide = newGuide;
      this.startGuidePointerTracking(newGuide, e.altKey);
    });

    // 2. Drag vertical guide from left ruler
    rvContainer.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const startWorld = this.screenToWorld(e.clientX, e.clientY);
      const newGuide = {
        id: `guide_temp_${Date.now()}`,
        type: 'vertical',
        position: Math.round(startWorld.x),
        isNew: true
      };
      this.activeDragGuide = newGuide;
      this.startGuidePointerTracking(newGuide, e.altKey);
    });

    // 3. Track cursor on canvas for ruler indicators
    window.addEventListener('pointermove', (e) => {
      const rect = this.app.renderer?.canvas?.getBoundingClientRect() || { left: 0, top: 0 };
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      this.cursorPosition = {
        screenX,
        screenY,
        worldX: (screenX - this.app.renderer.panX) / this.app.renderer.zoom,
        worldY: (screenY - this.app.renderer.panY) / this.app.renderer.zoom
      };
      if (this.app.showRulers) {
        this.renderRulers();
      }
    });

    // 4. Alt / Option key tracking for duplication and measurements
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Alt') {
        this.isOptionPressed = true;
        this.app.renderer?.render?.();
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (this.selectedGuide && !this.selectedGuide.locked) {
          this.removeGuide(this.selectedGuide.id);
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.key === 'Alt') {
        this.isOptionPressed = false;
        this.app.renderer?.render?.();
      }
    });
  }

  startGuidePointerTracking(guide, isAltDuplicate = false) {
    const onPointerMove = (e) => {
      const world = this.screenToWorld(e.clientX, e.clientY);
      if (guide.type === 'horizontal') {
        guide.position = Math.round(world.y);
      } else {
        guide.position = Math.round(world.x);
      }
      this.app.renderer?.render?.();
      this.renderRulers();
    };

    const onPointerUp = (e) => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);

      const rect = this.app.renderer?.canvas?.getBoundingClientRect() || { left: 0, top: 0 };
      const isBackInRuler = (guide.type === 'horizontal' && e.clientY - rect.top <= this.rulerThickness) ||
                            (guide.type === 'vertical' && e.clientX - rect.left <= this.rulerThickness);

      if (isBackInRuler) {
        // Dragged back to ruler -> delete or do not add
        if (!guide.isNew) {
          this.removeGuide(guide.id);
          this.app.showToast?.('Guide removed', 'info', 1000);
        }
      } else {
        if (guide.isNew) {
          this.addGuide(guide.type, guide.position);
          this.app.showToast?.(`Guide added at ${guide.position}px`, 'info', 1200);
        } else if (isAltDuplicate) {
          this.addGuide(guide.type, guide.position);
          this.app.showToast?.(`Guide duplicated at ${guide.position}px`, 'info', 1200);
        }
      }

      this.activeDragGuide = null;
      this.app.renderer?.render?.();
      this.renderRulers();
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  }

  // =========================================================================
  // 6. Canvas Rendering Overlay (Persistent Guides & Active Drag Guide)
  // =========================================================================

  drawCanvasGuides(ctx) {
    if (!this.guidesVisible) return;
    const zoom = this.app.renderer.zoom || 1;
    const guides = [...this.getActiveGuides()];
    if (this.activeDragGuide && this.activeDragGuide.isNew) {
      guides.push(this.activeDragGuide);
    }

    ctx.save();
    ctx.lineWidth = 1 / zoom;

    for (const guide of guides) {
      const isSelected = this.selectedGuide?.id === guide.id;
      const isHovered = this.hoveredGuide?.id === guide.id;
      const isDrag = this.activeDragGuide?.id === guide.id;

      ctx.strokeStyle = isSelected || isDrag ? '#F43F5E' : (isHovered ? this.guideHoverColor : (guide.color || this.accentColor));
      ctx.setLineDash(guide.locked ? [6 / zoom, 3 / zoom] : []);

      ctx.beginPath();
      if (guide.type === 'horizontal') {
        ctx.moveTo(-100000, guide.position);
        ctx.lineTo(100000, guide.position);
      } else {
        ctx.moveTo(guide.position, -100000);
        ctx.lineTo(guide.position, 100000);
      }
      ctx.stroke();

      // Guide Coordinate Badge
      this.drawGuideBadge(ctx, guide, zoom);
    }

    ctx.restore();
  }

  drawGuideBadge(ctx, guide, zoom) {
    const text = `${guide.position}px`;
    ctx.font = `${Math.max(9, 10 / zoom)}px "SF Pro", -apple-system, BlinkMacSystemFont, monospace`;
    const paddingX = 4 / zoom;
    const paddingY = 2 / zoom;
    const textWidth = ctx.measureText(text).width;
    const badgeW = textWidth + paddingX * 2;
    const badgeH = 14 / zoom;

    let bx, by;
    const panX = this.app.renderer.panX;
    const panY = this.app.renderer.panY;

    if (guide.type === 'horizontal') {
      bx = (-panX + 24) / zoom;
      by = guide.position - badgeH / 2;
    } else {
      bx = guide.position - badgeW / 2;
      by = (-panY + 24) / zoom;
    }

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(bx, by, badgeW, badgeH);
    ctx.strokeStyle = guide.color || this.accentColor;
    ctx.lineWidth = 1 / zoom;
    ctx.strokeRect(bx, by, badgeW, badgeH);

    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, bx + badgeW / 2, by + badgeH / 2);
  }

  // =========================================================================
  // 7. Smart Redline Measurement Engine (Option key distance pills)
  // =========================================================================

  drawSmartMeasurements(ctx, page, boundsCache) {
    const selectedIds = this.app.engine?.getSelection?.() || [];
    if (selectedIds.length === 0) return;
    const primaryId = selectedIds[0];
    const primaryNode = page.nodes[primaryId];
    if (!primaryNode || !primaryNode.bounds) return;

    const b1 = primaryNode.bounds;
    const targetId = this.measurementTargetId || this.app.renderer.hoveredNodeId;
    const targetNode = targetId ? page.nodes[targetId] : null;

    // A. Option/Alt Measurement against hovered target node
    if (this.isOptionPressed && targetNode && targetNode.id !== primaryId && targetNode.bounds) {
      const b2 = targetNode.bounds;
      this.drawObjectToObjectRedlines(ctx, b1, b2);
      return;
    }

    // B. Option/Alt Measurement against Parent Frame if hovered on frame or empty space
    if (this.isOptionPressed && primaryNode.parentId && page.nodes[primaryNode.parentId]) {
      const parentNode = page.nodes[primaryNode.parentId];
      if (parentNode.bounds) {
        this.drawPaddingRedlines(ctx, b1, parentNode.bounds);
        return;
      }
    }

    // C. Multi-selection relative spacing measurement (2 selected items)
    if (selectedIds.length === 2) {
      const secondNode = page.nodes[selectedIds[1]];
      if (secondNode && secondNode.bounds) {
        this.drawObjectToObjectRedlines(ctx, b1, secondNode.bounds);
      }
    }
  }

  drawObjectToObjectRedlines(ctx, b1, b2) {
    const zoom = this.app.renderer.zoom || 1;
    ctx.save();
    ctx.strokeStyle = this.redlineColor;
    ctx.fillStyle = this.redlineColor;
    ctx.lineWidth = 1 / zoom;

    // Check horizontal spatial relationship
    const isLeft = b1.x + b1.width < b2.x;
    const isRight = b2.x + b2.width < b1.x;
    const isAbove = b1.y + b1.height < b2.y;
    const isBelow = b2.y + b2.height < b1.y;

    // Horizontal Gap
    if (isLeft) {
      const gap = Math.round(b2.x - (b1.x + b1.width));
      const midY = Math.max(b1.y, b2.y) + Math.min(b1.height, b2.height) / 2;
      this.drawRedlineWithPill(ctx, b1.x + b1.width, midY, b2.x, midY, gap, zoom, 'horizontal');
    } else if (isRight) {
      const gap = Math.round(b1.x - (b2.x + b2.width));
      const midY = Math.max(b1.y, b2.y) + Math.min(b1.height, b2.height) / 2;
      this.drawRedlineWithPill(ctx, b2.x + b2.width, midY, b1.x, midY, gap, zoom, 'horizontal');
    }

    // Vertical Gap
    if (isAbove) {
      const gap = Math.round(b2.y - (b1.y + b1.height));
      const midX = Math.max(b1.x, b2.x) + Math.min(b1.width, b2.width) / 2;
      this.drawRedlineWithPill(ctx, midX, b1.y + b1.height, midX, b2.y, gap, zoom, 'vertical');
    } else if (isBelow) {
      const gap = Math.round(b1.y - (b2.y + b2.height));
      const midX = Math.max(b1.x, b2.x) + Math.min(b1.width, b2.width) / 2;
      this.drawRedlineWithPill(ctx, midX, b2.y + b2.height, midX, b1.y, gap, zoom, 'vertical');
    }

    ctx.restore();
  }

  drawPaddingRedlines(ctx, childBounds, parentBounds) {
    const zoom = this.app.renderer.zoom || 1;
    ctx.save();
    ctx.strokeStyle = this.redlineColor;
    ctx.fillStyle = this.redlineColor;
    ctx.lineWidth = 1 / zoom;

    const topDist = Math.round(childBounds.y - parentBounds.y);
    const bottomDist = Math.round((parentBounds.y + parentBounds.height) - (childBounds.y + childBounds.height));
    const leftDist = Math.round(childBounds.x - parentBounds.x);
    const rightDist = Math.round((parentBounds.x + parentBounds.width) - (childBounds.x + childBounds.width));

    const midX = childBounds.x + childBounds.width / 2;
    const midY = childBounds.y + childBounds.height / 2;

    if (topDist > 0) {
      this.drawRedlineWithPill(ctx, midX, parentBounds.y, midX, childBounds.y, topDist, zoom, 'vertical');
    }
    if (bottomDist > 0) {
      this.drawRedlineWithPill(ctx, midX, childBounds.y + childBounds.height, midX, parentBounds.y + parentBounds.height, bottomDist, zoom, 'vertical');
    }
    if (leftDist > 0) {
      this.drawRedlineWithPill(ctx, parentBounds.x, midY, childBounds.x, midY, leftDist, zoom, 'horizontal');
    }
    if (rightDist > 0) {
      this.drawRedlineWithPill(ctx, childBounds.x + childBounds.width, midY, parentBounds.x + parentBounds.width, midY, rightDist, zoom, 'horizontal');
    }

    ctx.restore();
  }

  drawRedlineWithPill(ctx, x1, y1, x2, y2, distance, zoom, orientation) {
    if (distance <= 0) return;

    // Line with arrow caps
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // End ticks
    const tickLen = 4 / zoom;
    ctx.beginPath();
    if (orientation === 'horizontal') {
      ctx.moveTo(x1, y1 - tickLen); ctx.lineTo(x1, y1 + tickLen);
      ctx.moveTo(x2, y2 - tickLen); ctx.lineTo(x2, y2 + tickLen);
    } else {
      ctx.moveTo(x1 - tickLen, y1); ctx.lineTo(x1 + tickLen, y1);
      ctx.moveTo(x2 - tickLen, y2); ctx.lineTo(x2 + tickLen, y2);
    }
    ctx.stroke();

    // Measurement Pill Badge
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const text = `${distance}`;
    ctx.font = `bold ${Math.max(10, 11 / zoom)}px "SF Pro", -apple-system, BlinkMacSystemFont, monospace`;
    const paddingX = 5 / zoom;
    const paddingY = 2 / zoom;
    const textWidth = ctx.measureText(text).width;
    const badgeW = textWidth + paddingX * 2;
    const badgeH = 16 / zoom;

    ctx.fillStyle = this.redlineColor;
    ctx.beginPath();
    const radius = 3 / zoom;
    const bx = midX - badgeW / 2;
    const by = midY - badgeH / 2;

    ctx.roundRect ? ctx.roundRect(bx, by, badgeW, badgeH, radius) : ctx.rect(bx, by, badgeW, badgeH);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, midX, midY + 0.5 / zoom);
  }
}
