/**
 * DesignForge AI - Canvas 2D Infinite Workspace Renderer
 * 60fps high performance rendering, viewport culling, guides, handles & hit-testing
 */

import { computeWorldBounds, computeGroupBounds } from './layout.js';

export class CanvasRenderer {
  constructor(canvasElement, commandEngine) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.engine = commandEngine;

    // Viewport transform
    this.panX = 140;
    this.panY = 90;
    this.zoom = 0.85;
    this.minZoom = 0.05;
    this.maxZoom = 32.0;

    // Direct interaction states
    this.hoveredNodeId = null;
    this.snapGuides = [];
    this.marquee = null; // { startX, startY, currentX, currentY }
    this.dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
    this.outlineViewOnly = false; // Figma Cmd+Y wireframe mode
    this.showPixelGrid = false;   // Figma Shift+' pixel grid mode
    this.isVectorEditMode = false; // Figma Enter / P vector point editing mode

    if (typeof window !== 'undefined') {
      this.setupResizeListener();
    }
  }

  setupResizeListener() {
    this.resize = () => {
      const parent = this.canvas?.parentElement;
      const rect = parent ? parent.getBoundingClientRect() : (this.canvas?.getBoundingClientRect?.() || { width: 800, height: 600 });
      this.canvas.width = rect.width * this.dpr;
      this.canvas.height = rect.height * this.dpr;
      if (this.canvas.style) {
        this.canvas.style.width = `${rect.width}px`;
        this.canvas.style.height = `${rect.height}px`;
      }
      this.render();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.resize);
      this.resize();
    }
  }

  screenToCanvas(screenX, screenY) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (screenX - rect.left - this.panX) / this.zoom;
    const y = (screenY - rect.top - this.panY) / this.zoom;
    return { x, y };
  }

  canvasToScreen(canvasX, canvasY) {
    const rect = this.canvas.getBoundingClientRect();
    const x = canvasX * this.zoom + this.panX + rect.left;
    const y = canvasY * this.zoom + this.panY + rect.top;
    return { x, y };
  }

  setZoom(newZoom, centerScreenX, centerScreenY) {
    const targetZoom = Math.min(Math.max(newZoom, this.minZoom), this.maxZoom);
    if (centerScreenX !== undefined && centerScreenY !== undefined) {
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = centerScreenX - rect.left;
      const mouseY = centerScreenY - rect.top;
      this.panX = mouseX - (mouseX - this.panX) * (targetZoom / this.zoom);
      this.panY = mouseY - (mouseY - this.panY) * (targetZoom / this.zoom);
    }
    this.zoom = targetZoom;
    this.render();
  }

  panBy(dx, dy) {
    this.panX += dx;
    this.panY += dy;
    this.render();
  }

  zoomToFit() {
    const page = this.engine.getActivePage();
    if (!page || page.rootIds.length === 0) return;

    const bounds = computeGroupBounds(page, page.rootIds);
    if (!bounds) return;

    const rect = this.canvas.getBoundingClientRect();
    const padding = 80;
    const availW = rect.width - padding * 2;
    const availH = rect.height - padding * 2;

    const scaleX = availW / bounds.width;
    const scaleY = availH / bounds.height;
    const fitZoom = Math.min(Math.min(scaleX, scaleY), 1.2);

    this.zoom = Math.max(fitZoom, 0.2);
    this.panX = (rect.width - bounds.width * this.zoom) / 2 - bounds.x * this.zoom;
    this.panY = (rect.height - bounds.height * this.zoom) / 2 - bounds.y * this.zoom;
    this.render();
  }

  render() {
    const { ctx, canvas, zoom, panX, panY, dpr } = this;
    const page = this.engine.getActivePage();
    if (!ctx || !canvas || !page) return;

    ctx.save();
    ctx.scale(dpr, dpr);
    const viewW = canvas.width / dpr;
    const viewH = canvas.height / dpr;

    // 1. Clear background
    const isLight = (this.engine.doc?.themeMode === 'light') || 
      (typeof document !== 'undefined' && (document.body.classList.contains('theme-axiom-light') || document.body.classList.contains('theme-light')));
    const isHighContrast = (this.engine.doc?.themeMode === 'high-contrast') || 
      (typeof document !== 'undefined' && document.body.classList.contains('theme-high-contrast'));

    ctx.fillStyle = isHighContrast ? '#000000' : (isLight ? '#E4E4E7' : '#0D0D0F');
    ctx.fillRect(0, 0, viewW, viewH);

    // 2. Draw Subtle Infinite Dot Grid
    this.drawGrid(ctx, viewW, viewH);

    // Apply Camera Transform
    ctx.save();
    ctx.translate(panX, panY);
    ctx.scale(zoom, zoom);

    // 3. Render Nodes Recursively starting from Page Root IDs
    const boundsCache = new Map();
    for (const rootId of page.rootIds) {
      this.renderNodeRecursive(ctx, page, rootId, boundsCache);
    }

    // 4. Render 12-Column Layout Grid (if enabled)
    this.drawLayoutGrid(ctx, page);

    // 5. Render Prototype Interaction Connectors
    this.drawPrototypeLinks(ctx, page, boundsCache);

    // 6. Render Smart Snap Alignment Guides
    this.drawSnapGuides(ctx);

    // 7. Render Selection Overlays, Bounding Boxes & Resize Handles
    this.drawSelection(ctx, page, boundsCache);

    // 7.5 Render Distance Measurements (Alt/Option measurement mode)
    this.drawDistanceMeasurement(ctx, page, boundsCache);

    // 8. Render Collaborative / Review Comments
    this.drawComments(ctx);

    // 9. Draw Marquee Box if active
    if (this.marquee) {
      this.drawMarquee(ctx);
    }

    ctx.restore();
    ctx.restore();
  }


  drawGrid(ctx, w, h) {
    // 1px Pixel Grid (Figma Shift+') when zoomed in
    if (this.showPixelGrid && this.zoom >= 4) {
      const pxSize = this.zoom;
      const pxOffsetX = (this.panX % pxSize + pxSize) % pxSize;
      const pxOffsetY = (this.panY % pxSize + pxSize) % pxSize;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      for (let x = pxOffsetX; x < w; x += pxSize) {
        ctx.moveTo(x, 0); ctx.lineTo(x, h);
      }
      for (let y = pxOffsetY; y < h; y += pxSize) {
        ctx.moveTo(0, y); ctx.lineTo(w, y);
      }
      ctx.stroke();
    }

    const gridSize = 20 * this.zoom;
    if (gridSize < 8) return; // Don't draw if too dense

    const offsetX = (this.panX % gridSize + gridSize) % gridSize;
    const offsetY = (this.panY % gridSize + gridSize) % gridSize;

    const isLight = (this.engine.doc?.themeMode === 'light') || 
      (typeof document !== 'undefined' && (document.body.classList.contains('theme-axiom-light') || document.body.classList.contains('theme-light')));
    const isHighContrast = (this.engine.doc?.themeMode === 'high-contrast') || 
      (typeof document !== 'undefined' && document.body.classList.contains('theme-high-contrast'));

    ctx.fillStyle = isHighContrast 
      ? 'rgba(255, 255, 255, 0.22)' 
      : (isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.08)');
    for (let x = offsetX; x < w; x += gridSize) {
      for (let y = offsetY; y < h; y += gridSize) {
        ctx.fillRect(Math.floor(x), Math.floor(y), 1.5, 1.5);
      }
    }
  }

  renderNodeRecursive(ctx, page, nodeId, boundsCache) {
    const node = page.nodes[nodeId];
    if (!node || !node.visible) return;

    const bounds = computeWorldBounds(page, nodeId, boundsCache);
    if (!bounds || bounds.width <= 0 || bounds.height <= 0) return;

    ctx.save();
    ctx.globalAlpha = (node.opacity !== undefined ? node.opacity : (node.style?.opacity !== undefined ? node.style.opacity : 1));

    // Rotation around center
    if (node.transform?.rotation) {
      const cx = bounds.x + bounds.width / 2;
      const cy = bounds.y + bounds.height / 2;
      ctx.translate(cx, cy);
      ctx.rotate((node.transform.rotation * Math.PI) / 180);
      ctx.translate(-cx, -cy);
    }

    // Blend mode
    if (node.style?.blendMode && node.style.blendMode !== 'normal') {
      ctx.globalCompositeOperation = node.style.blendMode;
    }

    // Check if Frame requires title header rendered above it
    if (node.type === 'frame' && !node.parentId) {
      this.drawFrameHeader(ctx, node, bounds);
    }

    // Shadows
    if (node.style?.shadows && node.style.shadows.length > 0) {
      for (const shadow of node.style.shadows) {
        ctx.shadowColor = shadow.color || 'rgba(0,0,0,0.4)';
        ctx.shadowBlur = shadow.blur || 12;
        ctx.shadowOffsetX = shadow.x || 0;
        ctx.shadowOffsetY = shadow.y || 4;
      }
    }

    // Draw Shape Geometry / Fill / Corner Radius
    const radius = node.style?.cornerRadius !== undefined ? node.style.cornerRadius : 0;
    ctx.beginPath();
    if (node.type === 'ellipse') {
      ctx.ellipse(
        bounds.x + bounds.width / 2,
        bounds.y + bounds.height / 2,
        bounds.width / 2,
        bounds.height / 2,
        0, 0, Math.PI * 2
      );
    } else if (node.type === 'star') {
      const cx = bounds.x + bounds.width / 2;
      const cy = bounds.y + bounds.height / 2;
      const outerR = Math.min(bounds.width, bounds.height) / 2;
      const innerR = outerR * 0.45;
      this.drawStarPath(ctx, cx, cy, 5, outerR, innerR);
    } else if (node.type === 'polygon') {
      const cx = bounds.x + bounds.width / 2;
      const cy = bounds.y + bounds.height / 2;
      const r = Math.min(bounds.width, bounds.height) / 2;
      this.drawPolygonPath(ctx, cx, cy, 3, r);
    } else if (node.type === 'line' || node.type === 'arrow') {
      ctx.moveTo(bounds.x, bounds.y + bounds.height / 2);
      ctx.lineTo(bounds.x + bounds.width, bounds.y + bounds.height / 2);
    } else if (radius > 0 || (typeof radius === 'object' && radius !== null)) {
      this.roundRectPath(ctx, bounds.x, bounds.y, bounds.width, bounds.height, radius);
    } else {
      ctx.rect(bounds.x, bounds.y, bounds.width, bounds.height);
    }

    // Outline View Mode (Figma Cmd+Y): skip fills and render wireframe stroke
    if (this.outlineViewOnly) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = Math.max(0.75, 1 / (this.zoom || 1));
      ctx.setLineDash([]);
      ctx.stroke();
    } else {
      // Fills (Solid & Linear Gradient)
      if (node.style?.fills && node.style.fills.length > 0) {
        for (const fill of node.style.fills) {
          if (fill.visible === false) continue;
          if (fill.type === 'linear-gradient' || fill.type === 'gradient') {
            const grad = ctx.createLinearGradient(bounds.x, bounds.y, bounds.x + bounds.width, bounds.y + bounds.height);
            const stops = fill.stops || [{ offset: 0, color: fill.color || '#3b82f6' }, { offset: 1, color: '#8b5cf6' }];
            for (const s of stops) {
              grad.addColorStop(s.offset, s.color);
            }
            ctx.fillStyle = grad;
            ctx.fill();
          } else {
            ctx.fillStyle = fill.color || '#334155';
            ctx.fill();
          }
        }
      }
    }

    // Reset shadow before stroke/clipping
    ctx.shadowColor = 'transparent';

    // Strokes
    if (node.style?.strokes && node.style.strokes.length > 0) {
      for (const stroke of node.style.strokes) {
        if (stroke.visible === false) continue;
        ctx.strokeStyle = stroke.color || '#3b82f6';
        ctx.lineWidth = stroke.width || 1;
        if (stroke.style === 'dashed' || stroke.dash) {
          ctx.setLineDash(Array.isArray(stroke.dash) ? stroke.dash : [6, 4]);
        } else {
          ctx.setLineDash([]);
        }
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }

    // Text rendering
    if (node.type === 'text' && node.text) {
      this.drawTextNode(ctx, node, bounds);
    }

    // Clip children inside frames
    const shouldClip = node.type === 'frame' && node.clipContent !== false;
    if (shouldClip && (radius > 0 || typeof radius === 'object')) {
      ctx.save();
      ctx.beginPath();
      this.roundRectPath(ctx, bounds.x, bounds.y, bounds.width, bounds.height, radius);
      ctx.clip();
    }

    // Render Children
    if (node.childIds && node.childIds.length > 0) {
      for (const childId of node.childIds) {
        this.renderNodeRecursive(ctx, page, childId, boundsCache);
      }
    }

    if (shouldClip && (radius > 0 || typeof radius === 'object')) {
      ctx.restore();
    }

    ctx.restore();
  }

  drawFrameHeader(ctx, node, bounds) {
    ctx.save();
    ctx.fillStyle = '#64748b';
    ctx.font = '500 11px Inter, sans-serif';
    ctx.fillText(node.name || 'Frame', bounds.x, bounds.y - 7);
    ctx.restore();
  }

  drawTextNode(ctx, node, bounds) {
    const t = node.text;
    ctx.save();
    ctx.fillStyle = t.color || '#f8fafc';
    const weight = t.fontWeight || '400';
    const size = t.fontSize || 16;
    const family = t.fontFamily || 'Inter, sans-serif';
    ctx.font = `${weight} ${size}px ${family}`;
    ctx.textAlign = t.textAlign || 'left';
    ctx.textBaseline = 'top';

    const textX = t.textAlign === 'center' ? bounds.x + bounds.width / 2 :
                  t.textAlign === 'right' ? bounds.x + bounds.width : bounds.x;
    const textY = bounds.y;

    // Handle single or multiline text
    const lines = String(t.content || '').split('\n');
    const lineHeight = size * (t.lineHeight || 1.3);
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], textX, textY + i * lineHeight);
    }
    ctx.restore();
  }

  roundRectPath(ctx, x, y, w, h, r) {
    let tl = 0, tr = 0, br = 0, bl = 0;
    if (typeof r === 'number') {
      tl = tr = br = bl = r;
    } else if (Array.isArray(r)) {
      [tl = 0, tr = 0, br = 0, bl = 0] = r;
    } else if (r && typeof r === 'object') {
      tl = r.topLeft || r.tl || 0;
      tr = r.topRight || r.tr || 0;
      br = r.bottomRight || r.br || 0;
      bl = r.bottomLeft || r.bl || 0;
    }
    const maxR = Math.min(w / 2, h / 2);
    tl = Math.max(0, Math.min(tl, maxR));
    tr = Math.max(0, Math.min(tr, maxR));
    br = Math.max(0, Math.min(br, maxR));
    bl = Math.max(0, Math.min(bl, maxR));

    ctx.moveTo(x + tl, y);
    ctx.lineTo(x + w - tr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + tr);
    ctx.lineTo(x + w, y + h - br);
    ctx.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
    ctx.lineTo(x + bl, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - bl);
    ctx.lineTo(x, y + tl);
    ctx.quadraticCurveTo(x, y, x + tl, y);
    ctx.closePath();
  }

  drawStarPath(ctx, cx, cy, spikes = 5, outerRadius = 40, innerRadius = 18) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;
      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
  }

  drawPolygonPath(ctx, cx, cy, sides = 3, radius = 40) {
    ctx.moveTo(cx + radius * Math.cos(0), cy + radius * Math.sin(0));
    for (let i = 1; i <= sides; i++) {
      ctx.lineTo(cx + radius * Math.cos(i * 2 * Math.PI / sides), cy + radius * Math.sin(i * 2 * Math.PI / sides));
    }
    ctx.closePath();
  }

  drawDistanceMeasurement(ctx, page, boundsCache) {
    if (!this.altMeasureActive || !this.hoveredNodeId) return;
    const selectedIds = this.engine.getSelection();
    if (selectedIds.length === 0) return;
    const selectedId = selectedIds[0];
    if (selectedId === this.hoveredNodeId) return;

    const sel = computeWorldBounds(page, selectedId, boundsCache);
    const hov = computeWorldBounds(page, this.hoveredNodeId, boundsCache);
    if (!sel || !hov) return;

    ctx.save();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1 / this.zoom;
    ctx.setLineDash([3 / this.zoom, 3 / this.zoom]);

    if (hov.x > sel.x + sel.width) {
      const gap = Math.round(hov.x - (sel.x + sel.width));
      const midY = (Math.max(sel.y, hov.y) + Math.min(sel.y + sel.height, hov.y + hov.height)) / 2;
      ctx.beginPath();
      ctx.moveTo(sel.x + sel.width, midY);
      ctx.lineTo(hov.x, midY);
      ctx.stroke();
      this.drawMeasurementBadge(ctx, (sel.x + sel.width + hov.x) / 2, midY, `${gap}`);
    } else if (sel.x > hov.x + hov.width) {
      const gap = Math.round(sel.x - (hov.x + hov.width));
      const midY = (Math.max(sel.y, hov.y) + Math.min(sel.y + sel.height, hov.y + hov.height)) / 2;
      ctx.beginPath();
      ctx.moveTo(hov.x + hov.width, midY);
      ctx.lineTo(sel.x, midY);
      ctx.stroke();
      this.drawMeasurementBadge(ctx, (hov.x + hov.width + sel.x) / 2, midY, `${gap}`);
    }

    if (hov.y > sel.y + sel.height) {
      const gap = Math.round(hov.y - (sel.y + sel.height));
      const midX = (Math.max(sel.x, hov.x) + Math.min(sel.x + sel.width, hov.x + hov.width)) / 2;
      ctx.beginPath();
      ctx.moveTo(midX, sel.y + sel.height);
      ctx.lineTo(midX, hov.y);
      ctx.stroke();
      this.drawMeasurementBadge(ctx, midX, (sel.y + sel.height + hov.y) / 2, `${gap}`);
    } else if (sel.y > hov.y + hov.height) {
      const gap = Math.round(sel.y - (hov.y + hov.height));
      const midX = (Math.max(sel.x, hov.x) + Math.min(sel.x + sel.width, hov.x + hov.width)) / 2;
      ctx.beginPath();
      ctx.moveTo(midX, hov.y + hov.height);
      ctx.lineTo(midX, sel.y);
      ctx.stroke();
      this.drawMeasurementBadge(ctx, midX, (hov.y + hov.height + sel.y) / 2, `${gap}`);
    }

    ctx.restore();
  }

  drawMeasurementBadge(ctx, x, y, text) {
    ctx.save();
    ctx.font = `600 ${Math.max(10 / this.zoom, 9)}px Inter, sans-serif`;
    const textW = ctx.measureText(text).width;
    const badgeW = textW + 10 / this.zoom;
    const badgeH = 16 / this.zoom;

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    this.roundRectPath(ctx, x - badgeW / 2, y - badgeH / 2, badgeW, badgeH, 3 / this.zoom);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  drawLayoutGrid(ctx, page) {
    if (!this.showLayoutGrid) return;
    for (const rootId of page.rootIds) {
      const node = page.nodes[rootId];
      if (!node || node.type !== 'frame') continue;
      const t = node.transform || { x: 0, y: 0, width: 1440, height: 900 };
      const columns = 12;
      const margin = 32;
      const gutter = 20;
      const availW = t.width - margin * 2;
      const colW = (availW - (columns - 1) * gutter) / columns;
      if (colW <= 0) continue;

      ctx.save();
      ctx.fillStyle = 'rgba(239, 68, 68, 0.08)'; // Figma translucent red grid column
      for (let c = 0; c < columns; c++) {
        const colX = t.x + margin + c * (colW + gutter);
        ctx.fillRect(colX, t.y, colW, t.height);
      }
      ctx.restore();
    }
  }

  drawPrototypeLinks(ctx, page, boundsCache) {
    if (!this.showPrototypeLinks) return;
    for (const id in page.nodes) {
      const node = page.nodes[id];
      if (!node || !node.interactions || node.interactions.length === 0) continue;
      const srcBounds = computeWorldBounds(page, id, boundsCache);
      if (!srcBounds) continue;

      for (const interaction of node.interactions) {
        if (!interaction.targetId || !page.nodes[interaction.targetId]) continue;
        const targetBounds = computeWorldBounds(page, interaction.targetId, boundsCache);
        if (!targetBounds) continue;

        const startX = srcBounds.x + srcBounds.width;
        const startY = srcBounds.y + srcBounds.height / 2;
        const endX = targetBounds.x;
        const endY = targetBounds.y + 40;

        ctx.save();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2 / this.zoom;
        ctx.fillStyle = '#38bdf8';

        // Draw start circle
        ctx.beginPath();
        ctx.arc(startX, startY, 4 / this.zoom, 0, Math.PI * 2);
        ctx.fill();

        // Draw bezier connector
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        const dx = Math.max(60, (endX - startX) / 2);
        ctx.bezierCurveTo(startX + dx, startY, endX - dx, endY, endX, endY);
        ctx.stroke();

        // Draw arrow tip
        ctx.beginPath();
        ctx.arc(endX, endY, 4 / this.zoom, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  drawSnapGuides(ctx) {
    if (!this.snapGuides || this.snapGuides.length === 0) return;
    ctx.save();
    ctx.strokeStyle = '#ec4899'; // Vibrant magenta guide line
    ctx.lineWidth = 1 / this.zoom;
    ctx.setLineDash([4 / this.zoom, 4 / this.zoom]);

    for (const guide of this.snapGuides) {
      ctx.beginPath();
      if (guide.type === 'vertical') {
        ctx.moveTo(guide.x, -5000);
        ctx.lineTo(guide.x, 10000);
      } else {
        ctx.moveTo(-5000, guide.y);
        ctx.lineTo(10000, guide.y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  drawSelection(ctx, page, boundsCache) {
    const selectedIds = this.engine.getSelection();
    if (selectedIds.length === 0) return;

    for (const id of selectedIds) {
      const bounds = computeWorldBounds(page, id, boundsCache);
      const node = page.nodes[id];
      if (!bounds || !node) continue;

      ctx.save();
      // Blue selection outline
      ctx.strokeStyle = '#0d99ff';
      ctx.lineWidth = 1.5 / this.zoom;
      ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);

      // Dimension badge on hover/drag
      this.drawDimensionBadge(ctx, bounds, Math.round(bounds.width), Math.round(bounds.height));

      // Draw Handles (Circular anchor points in Vector Edit Mode, 8-point resize box in Object Mode)
      if (this.isVectorEditMode) {
        // Vector Edit Mode (Figma P / Enter on vector)
        const pointRadius = 4 / this.zoom;
        const vertices = [
          { x: bounds.x, y: bounds.y },
          { x: bounds.x + bounds.width, y: bounds.y },
          { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
          { x: bounds.x, y: bounds.y + bounds.height }
        ];
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 1 / this.zoom;
        ctx.fillStyle = '#ffffff';
        for (const v of vertices) {
          ctx.beginPath();
          ctx.arc(v.x, v.y, pointRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      } else {
        // Standard Object Mode 8 Resize Handles
        const handleSize = 7 / this.zoom;
        const halfSize = handleSize / 2;
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#0d99ff';
        ctx.lineWidth = 1.5 / this.zoom;

        const corners = [
          { x: bounds.x, y: bounds.y }, // nw
          { x: bounds.x + bounds.width / 2, y: bounds.y }, // n
          { x: bounds.x + bounds.width, y: bounds.y }, // ne
          { x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2 }, // e
          { x: bounds.x + bounds.width, y: bounds.y + bounds.height }, // se
          { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height }, // s
          { x: bounds.x, y: bounds.y + bounds.height }, // sw
          { x: bounds.x, y: bounds.y + bounds.height / 2 } // w
        ];

        for (const c of corners) {
          ctx.fillRect(c.x - halfSize, c.y - halfSize, handleSize, handleSize);
          ctx.strokeRect(c.x - halfSize, c.y - halfSize, handleSize, handleSize);
        }
      }

      ctx.restore();
    }
  }

  drawDimensionBadge(ctx, bounds, w, h) {
    ctx.save();
    const text = `${w} × ${h}`;
    ctx.font = `${Math.max(10 / this.zoom, 9)}px Inter, sans-serif`;
    const textWidth = ctx.measureText(text).width;
    const badgeW = textWidth + 12 / this.zoom;
    const badgeH = 18 / this.zoom;
    const badgeX = bounds.x + (bounds.width - badgeW) / 2;
    const badgeY = bounds.y + bounds.height + 8 / this.zoom;

    ctx.fillStyle = '#0d99ff';
    ctx.beginPath();
    this.roundRectPath(ctx, badgeX, badgeY, badgeW, badgeH, 4 / this.zoom);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, badgeX + badgeW / 2, badgeY + badgeH / 2);
    ctx.restore();
  }

  drawMarquee(ctx) {
    const { startX, startY, currentX, currentY } = this.marquee;
    const x = Math.min(startX, currentX);
    const y = Math.min(startY, currentY);
    const w = Math.abs(currentX - startX);
    const h = Math.abs(currentY - startY);

    ctx.save();
    ctx.fillStyle = 'rgba(13, 153, 255, 0.12)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#0d99ff';
    ctx.lineWidth = 1 / this.zoom;
    ctx.strokeRect(x, y, w, h);
    ctx.restore();
  }

  /**
   * Hit test to find node at canvas (x, y) coordinates
   */
  hitTest(canvasX, canvasY) {
    const page = this.engine.getActivePage();
    if (!page) return null;

    // Search backwards from front-most root nodes down their hierarchies
    for (let i = page.rootIds.length - 1; i >= 0; i--) {
      const rootId = page.rootIds[i];
      const match = this.hitTestRecursive(page, rootId, canvasX, canvasY);
      if (match) return match;
    }
    return null;
  }

  hitTestRecursive(page, nodeId, cx, cy) {
    const node = page.nodes[nodeId];
    if (!node || !node.visible || node.locked) return null;

    const bounds = computeWorldBounds(page, nodeId);
    const inside = cx >= bounds.x && cx <= bounds.x + bounds.width &&
                   cy >= bounds.y && cy <= bounds.y + bounds.height;

    // Check children first (topmost child takes precedence)
    if (node.childIds && node.childIds.length > 0) {
      for (let i = node.childIds.length - 1; i >= 0; i--) {
        const childMatch = this.hitTestRecursive(page, node.childIds[i], cx, cy);
        if (childMatch) return childMatch;
      }
    }

    return inside ? node.id : null;
  }

  /**
   * Hit test for resize handles of the selected node
   */
  hitTestHandle(canvasX, canvasY, bounds) {
    if (!bounds) return null;
    const handleThreshold = 10 / this.zoom;

    const handles = {
      nw: { x: bounds.x, y: bounds.y },
      n: { x: bounds.x + bounds.width / 2, y: bounds.y },
      ne: { x: bounds.x + bounds.width, y: bounds.y },
      e: { x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2 },
      se: { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
      s: { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height },
      sw: { x: bounds.x, y: bounds.y + bounds.height },
      w: { x: bounds.x, y: bounds.y + bounds.height / 2 }
    };

    for (const [handleKey, pos] of Object.entries(handles)) {
      if (Math.abs(canvasX - pos.x) <= handleThreshold && Math.abs(canvasY - pos.y) <= handleThreshold) {
        return handleKey;
      }
    }
    return null;
  }

  drawComments(ctx) {
    const comments = this.engine.doc?.comments;
    if (!comments || comments.length === 0) return;
    const pageId = this.engine.getActivePage()?.id;

    ctx.save();
    for (let i = 0; i < comments.length; i++) {
      const c = comments[i];
      if (c.pageId && c.pageId !== pageId) continue;

      const size = 26 / this.zoom;
      const x = c.x;
      const y = c.y;

      // Pin shadow
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = 8 / this.zoom;
      ctx.shadowOffsetY = 4 / this.zoom;

      // Pin circle
      ctx.fillStyle = c.resolved ? '#10b981' : '#f59e0b';
      ctx.beginPath();
      ctx.arc(x, y, size / 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2 / this.zoom;
      ctx.stroke();

      // Pin Number/Icon
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = '#ffffff';
      ctx.font = `600 ${Math.max(11 / this.zoom, 8)}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(c.resolved ? '✓' : `${i + 1}`, x, y);
    }
    ctx.restore();
  }

  hitTestComment(canvasX, canvasY) {
    const comments = this.engine.doc?.comments;
    if (!comments) return null;
    const pageId = this.engine.getActivePage()?.id;
    const radius = 16 / this.zoom;

    for (const c of comments) {
      if (c.pageId && c.pageId !== pageId) continue;
      const dist = Math.hypot(canvasX - c.x, canvasY - c.y);
      if (dist <= radius) {
        return c;
      }
    }
    return null;
  }
}

