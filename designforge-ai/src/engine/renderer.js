/**
 * DesignForge AI - Canvas 2D Infinite Workspace Renderer
 * 60fps high performance rendering, viewport culling, guides, handles & hit-testing
 */

import { computeWorldBounds, computeGroupBounds } from './layout.js';
import { getRectangleCornerHandles } from '../editor-core/vector-engine.js';

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
    this.creationPreview = null; // { tool, startX, startY, currentX, currentY }
    this.dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;

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

  zoomToSelection() {
    const selectedIds = this.engine.getSelection();
    if (!selectedIds || selectedIds.length === 0) return;
    const page = this.engine.getActivePage();
    if (!page) return;

    const bounds = computeGroupBounds(page, selectedIds);
    if (!bounds || bounds.width === 0 || bounds.height === 0) return;

    const rect = this.canvas.getBoundingClientRect();
    const padding = 100;
    const availW = Math.max(50, rect.width - padding * 2);
    const availH = Math.max(50, rect.height - padding * 2);

    const scaleX = availW / bounds.width;
    const scaleY = availH / bounds.height;
    const fitZoom = Math.min(Math.min(scaleX, scaleY), 4.0);

    this.zoom = Math.max(0.1, Math.min(fitZoom, 8.0));
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
    ctx.fillStyle = '#14171f';
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

    // 7.2 Render Vector Edit Mode Overlay (§11.6–§11.10)
    if (this.vectorEdit) {
      this.drawVectorEdit(ctx, page);
    }

    // 7.5 Render Distance Measurements (Alt/Option measurement mode)
    this.drawDistanceMeasurement(ctx, page, boundsCache);

    // 8. Render Collaborative / Review Comments
    this.drawComments(ctx);

    // 9. Draw Marquee Box if active
    if (this.marquee) {
      this.drawMarquee(ctx);
    }

    // 10. Draw Live Creation Preview Box if drawing a new shape
    if (this.creationPreview) {
      this.drawCreationPreview(ctx);
    }

    // 11. Draw Live Freehand Pencil Stroke
    if (this.pencilPreview && this.pencilPreview.length > 1) {
      this.drawPencilPreview(ctx);
    }

    // 12. Draw Live Pen Vector Path
    if (this.penPreview) {
      this.drawPenPreview(ctx);
    }

    ctx.restore();
    ctx.restore();
  }


  drawGrid(ctx, w, h) {
    const gridSize = 20 * this.zoom;
    if (gridSize < 8) return; // Don't draw if too dense

    const offsetX = (this.panX % gridSize + gridSize) % gridSize;
    const offsetY = (this.panY % gridSize + gridSize) % gridSize;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
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
    const isLineLike = node.type === 'line' || node.type === 'arrow';
    if (!bounds || bounds.width <= 0 || (!isLineLike && bounds.height <= 0)) return;

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

    // Check if Frame or Section requires title header rendered above it
    if (node.type === 'frame' && !node.parentId) {
      this.drawFrameHeader(ctx, node, bounds);
    } else if (node.type === 'section') {
      this.drawSectionHeader(ctx, node, bounds);
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
    if (this.vectorEdit && this.vectorEdit.nodeId === nodeId && this.vectorEdit.anchors?.length > 0) {
      // Live Vector Edit Mode: render deformed shape directly from active anchors
      this.drawVectorPathFromAnchors(ctx, bounds, this.vectorEdit.anchors, node.type !== 'line' && node.type !== 'arrow');
    } else if (node.type === 'ellipse') {
      const cx = bounds.x + bounds.width / 2;
      const cy = bounds.y + bounds.height / 2;
      const rx = bounds.width / 2;
      const ry = bounds.height / 2;
      const sweep = node.arcSweep !== undefined ? (node.arcSweep * Math.PI) / 180 : Math.PI * 2;
      const ratio = node.arcRatio || 0;
      if (ratio > 0 && ratio < 1) {
        ctx.ellipse(cx, cy, rx, ry, 0, 0, sweep);
        ctx.ellipse(cx, cy, rx * (1 - ratio), ry * (1 - ratio), 0, sweep, 0, true);
        ctx.closePath();
      } else if (sweep < Math.PI * 2) {
        ctx.moveTo(cx, cy);
        ctx.ellipse(cx, cy, rx, ry, 0, 0, sweep);
        ctx.closePath();
      } else {
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      }
    } else if (node.type === 'star') {
      const cx = bounds.x + bounds.width / 2;
      const cy = bounds.y + bounds.height / 2;
      const outerR = Math.min(bounds.width, bounds.height) / 2;
      const points = node.starPoints || 5;
      const innerR = outerR * (node.starRatio !== undefined ? node.starRatio : 0.45);
      this.drawStarPath(ctx, cx, cy, points, outerR, innerR);
    } else if (node.type === 'polygon') {
      const cx = bounds.x + bounds.width / 2;
      const cy = bounds.y + bounds.height / 2;
      const r = Math.min(bounds.width, bounds.height) / 2;
      const sides = node.polygonSides || 3;
      this.drawPolygonPath(ctx, cx, cy, sides, r);
    } else if (node.type === 'line' || node.type === 'arrow') {
      ctx.moveTo(bounds.x, bounds.y + bounds.height / 2);
      ctx.lineTo(bounds.x + bounds.width, bounds.y + bounds.height / 2);
    } else if (node.type === 'vector' && node.vectorPath) {
      this.drawVectorPath(ctx, bounds, node.vectorPath);
    } else if (radius > 0 || (typeof radius === 'object' && radius !== null)) {
      this.roundRectPath(ctx, bounds.x, bounds.y, bounds.width, bounds.height, radius);
    } else {
      ctx.rect(bounds.x, bounds.y, bounds.width, bounds.height);
    }

    // Fills (Solid & Linear Gradient) or Outline Mode (Cmd+Y)
    if (this.outlineMode) {
      ctx.strokeStyle = '#0d99ff';
      ctx.lineWidth = 1 / this.zoom;
      ctx.stroke();
    } else if (node.style?.fills && node.style.fills.length > 0) {
      for (const fill of node.style.fills) {
        if (fill.visible === false) continue;
        if (fill.type === 'image' && fill.url) {
          if (!this.imageCache) this.imageCache = new Map();
          let img = this.imageCache.get(fill.url);
          if (!img && typeof Image !== 'undefined') {
            img = new Image();
            img.src = fill.url;
            img.onload = () => { this.render(); };
            this.imageCache.set(fill.url, img);
          }
          if (img && img.complete && img.naturalWidth > 0) {
            ctx.save();
            ctx.clip();
            const scale = Math.max(bounds.width / img.naturalWidth, bounds.height / img.naturalHeight);
            const w = img.naturalWidth * scale;
            const h = img.naturalHeight * scale;
            const x = bounds.x + (bounds.width - w) / 2;
            const y = bounds.y + (bounds.height - h) / 2;
            ctx.drawImage(img, x, y, w, h);
            ctx.restore();
          } else {
            ctx.fillStyle = '#334155';
            ctx.fill();
          }
        } else if (fill.type === 'linear-gradient' || fill.type === 'gradient') {
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

    // Arrowheads for Arrow Nodes
    if (node.type === 'arrow') {
      const firstStroke = node.style?.strokes?.[0] || { color: '#38bdf8', width: 2 };
      const endMarker = node.arrowheadEnd || node.arrowEnd || 'triangle';
      const startMarker = node.arrowheadStart || node.arrowStart;
      if (endMarker && endMarker !== 'none') {
        this.drawArrowhead(ctx, bounds, firstStroke.color, firstStroke.width, endMarker);
      }
      if (startMarker && startMarker !== 'none') {
        this.drawArrowheadStart(ctx, bounds, firstStroke.color, firstStroke.width, startMarker);
      }
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
    const fillCol = (node.style?.fills && node.style.fills[0]?.color) || t.color || '#f8fafc';
    ctx.fillStyle = fillCol;
    const fontStyle = t.fontStyle === 'italic' ? 'italic ' : '';
    const weight = t.fontWeight || '400';
    const size = t.fontSize || 16;
    const family = t.fontFamily || 'Inter, sans-serif';
    ctx.font = `${fontStyle}${weight} ${size}px ${family}`;
    ctx.textAlign = t.textAlign || 'left';
    ctx.textBaseline = 'top';

    if (t.letterSpacing) {
      try {
        ctx.letterSpacing = `${t.letterSpacing}px`;
      } catch (_) { }
    }

    const textX = t.textAlign === 'center' ? bounds.x + bounds.width / 2 :
      t.textAlign === 'right' ? bounds.x + bounds.width : bounds.x;

    let lines = String(t.content || '').split('\n');
    if (t.textCase === 'uppercase') {
      lines = lines.map(l => l.toUpperCase());
    } else if (t.textCase === 'lowercase') {
      lines = lines.map(l => l.toLowerCase());
    } else if (t.textCase === 'capitalize') {
      lines = lines.map(l => l.replace(/\b\w/g, c => c.toUpperCase()));
    }

    const lhMultiplier = typeof t.lineHeight === 'number' ? (t.lineHeight > 3 ? t.lineHeight / size : t.lineHeight) : 1.3;
    const lineHeight = size * lhMultiplier;
    const totalTextH = lines.length * lineHeight;

    let textY = bounds.y;
    if (t.verticalAlign === 'middle') {
      textY = bounds.y + Math.max(0, (bounds.height - totalTextH) / 2);
    } else if (t.verticalAlign === 'bottom') {
      textY = bounds.y + Math.max(0, bounds.height - totalTextH);
    }

    for (let i = 0; i < lines.length; i++) {
      const lineStr = lines[i];
      const curY = textY + i * lineHeight;
      ctx.fillText(lineStr, textX, curY);

      if (t.textDecoration) {
        const textMetrics = ctx.measureText(lineStr);
        let startX = textX;
        if (t.textAlign === 'center') startX = textX - textMetrics.width / 2;
        else if (t.textAlign === 'right') startX = textX - textMetrics.width;

        ctx.strokeStyle = fillCol;
        ctx.lineWidth = Math.max(1, size / 16);

        if (t.textDecoration.includes('underline')) {
          ctx.beginPath();
          ctx.moveTo(startX, curY + size + 2);
          ctx.lineTo(startX + textMetrics.width, curY + size + 2);
          ctx.stroke();
        }
        if (t.textDecoration.includes('line-through') || t.textDecoration.includes('strikethrough')) {
          ctx.beginPath();
          ctx.moveTo(startX, curY + size * 0.55);
          ctx.lineTo(startX + textMetrics.width, curY + size * 0.55);
          ctx.stroke();
        }
      }
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

  drawSectionHeader(ctx, node, bounds) {
    ctx.save();
    ctx.font = `600 ${Math.max(12 / this.zoom, 10)}px Inter, sans-serif`;
    const title = node.sectionTitle || node.name || 'Section';
    const textW = ctx.measureText(title).width;
    const badgeW = textW + 18 / this.zoom;
    const badgeH = 22 / this.zoom;
    const badgeX = bounds.x;
    const badgeY = bounds.y - badgeH - 6 / this.zoom;

    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1 / this.zoom;
    ctx.beginPath();
    this.roundRectPath(ctx, badgeX, badgeY, badgeW, badgeH, 4 / this.zoom);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, badgeX + 8 / this.zoom, badgeY + badgeH / 2);

    if (node.devStatus) {
      const statusText = node.devStatus === 'ready' ? 'Ready for dev' : 'In progress';
      const statusColor = node.devStatus === 'ready' ? '#10b981' : '#f59e0b';
      ctx.font = `500 ${Math.max(10 / this.zoom, 8)}px Inter, sans-serif`;
      const sW = ctx.measureText(statusText).width;
      const sBadgeX = badgeX + badgeW + 8 / this.zoom;
      ctx.fillStyle = node.devStatus === 'ready' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)';
      ctx.beginPath();
      this.roundRectPath(ctx, sBadgeX, badgeY, sW + 12 / this.zoom, badgeH, 4 / this.zoom);
      ctx.fill();
      ctx.fillStyle = statusColor;
      ctx.fillText(statusText, sBadgeX + 6 / this.zoom, badgeY + badgeH / 2);
    }
    ctx.restore();
  }

  drawArrowhead(ctx, bounds, color = '#38bdf8', width = 2, type = 'triangle') {
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    const endX = bounds.x + bounds.width;
    const endY = bounds.y + bounds.height / 2;
    const arrowSize = Math.max(8, width * 3.5);

    if (type === 'circle') {
      ctx.beginPath();
      ctx.arc(endX - arrowSize * 0.3, endY, arrowSize * 0.35, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'square') {
      const sz = arrowSize * 0.6;
      ctx.fillRect(endX - sz, endY - sz / 2, sz, sz);
    } else if (type === 'diamond') {
      const sz = arrowSize * 0.5;
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(endX - sz, endY - sz);
      ctx.lineTo(endX - sz * 2, endY);
      ctx.lineTo(endX - sz, endY + sz);
      ctx.closePath();
      ctx.fill();
    } else if (type === 'stealth' || type === 'open') {
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(endX - arrowSize, endY - arrowSize * 0.5);
      ctx.lineTo(endX, endY);
      ctx.lineTo(endX - arrowSize, endY + arrowSize * 0.5);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(endX - arrowSize, endY - arrowSize * 0.45);
      ctx.lineTo(endX - arrowSize * 0.75, endY);
      ctx.lineTo(endX - arrowSize, endY + arrowSize * 0.45);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  drawArrowheadStart(ctx, bounds, color = '#38bdf8', width = 2, type = 'none') {
    if (!type || type === 'none') return;
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    const startX = bounds.x;
    const startY = bounds.y + bounds.height / 2;
    const arrowSize = Math.max(8, width * 3.5);

    if (type === 'circle') {
      ctx.beginPath();
      ctx.arc(startX + arrowSize * 0.3, startY, arrowSize * 0.35, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'square') {
      const sz = arrowSize * 0.6;
      ctx.fillRect(startX, startY - sz / 2, sz, sz);
    } else if (type === 'diamond') {
      const sz = arrowSize * 0.5;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(startX + sz, startY - sz);
      ctx.lineTo(startX + sz * 2, startY);
      ctx.lineTo(startX + sz, startY + sz);
      ctx.closePath();
      ctx.fill();
    } else if (type === 'stealth' || type === 'open') {
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(startX + arrowSize, startY - arrowSize * 0.5);
      ctx.lineTo(startX, startY);
      ctx.lineTo(startX + arrowSize, startY + arrowSize * 0.5);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(startX + arrowSize, startY - arrowSize * 0.45);
      ctx.lineTo(startX + arrowSize * 0.75, startY);
      ctx.lineTo(startX + arrowSize, startY + arrowSize * 0.45);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  drawVectorPath(ctx, bounds, pathData) {
    if (!Array.isArray(pathData) || pathData.length === 0) return;
    for (const cmd of pathData) {
      if (cmd.type === 'M') {
        ctx.moveTo(bounds.x + cmd.x, bounds.y + cmd.y);
      } else if (cmd.type === 'L') {
        ctx.lineTo(bounds.x + cmd.x, bounds.y + cmd.y);
      } else if (cmd.type === 'C') {
        ctx.bezierCurveTo(
          bounds.x + cmd.cp1x, bounds.y + cmd.cp1y,
          bounds.x + cmd.cp2x, bounds.y + cmd.cp2y,
          bounds.x + cmd.x, bounds.y + cmd.y
        );
      } else if (cmd.type === 'Z') {
        ctx.closePath();
      }
    }
  }

  drawVectorPathFromAnchors(ctx, bounds, anchors, closed = true) {
    if (!Array.isArray(anchors) || anchors.length === 0) return;
    ctx.moveTo(bounds.x + anchors[0].x, bounds.y + anchors[0].y);
    for (let i = 1; i < anchors.length; i++) {
      const prev = anchors[i - 1];
      const curr = anchors[i];
      const hasPrevOut = prev.handleOut && (prev.handleOut.x !== 0 || prev.handleOut.y !== 0);
      const hasCurrIn = curr.handleIn && (curr.handleIn.x !== 0 || curr.handleIn.y !== 0);
      if (hasPrevOut || hasCurrIn) {
        ctx.bezierCurveTo(
          bounds.x + prev.x + (prev.handleOut?.x || 0), bounds.y + prev.y + (prev.handleOut?.y || 0),
          bounds.x + curr.x + (curr.handleIn?.x || 0), bounds.y + curr.y + (curr.handleIn?.y || 0),
          bounds.x + curr.x, bounds.y + curr.y
        );
      } else {
        ctx.lineTo(bounds.x + curr.x, bounds.y + curr.y);
      }
    }
    if (closed && anchors.length > 2) {
      const last = anchors[anchors.length - 1];
      const first = anchors[0];
      const hasLastOut = last.handleOut && (last.handleOut.x !== 0 || last.handleOut.y !== 0);
      const hasFirstIn = first.handleIn && (first.handleIn.x !== 0 || first.handleIn.y !== 0);
      if (hasLastOut || hasFirstIn) {
        ctx.bezierCurveTo(
          bounds.x + last.x + (last.handleOut?.x || 0), bounds.y + last.y + (last.handleOut?.y || 0),
          bounds.x + first.x + (first.handleIn?.x || 0), bounds.y + first.y + (first.handleIn?.y || 0),
          bounds.x + first.x, bounds.y + first.y
        );
      }
      ctx.closePath();
    }
  }

  drawPrototypeLinks(ctx, page, boundsCache) {
    if (!this.showPrototypeLinks) return;

    // Draw Flow Starting Point Badges above eligible frames
    for (const id in page.nodes) {
      const node = page.nodes[id];
      if (node && node.isFlowStart) {
        const bounds = computeWorldBounds(page, id, boundsCache);
        if (bounds) {
          ctx.save();
          const badgeX = bounds.x;
          const badgeY = bounds.y - 28 / this.zoom;
          const badgeW = 68 / this.zoom;
          const badgeH = 20 / this.zoom;

          ctx.fillStyle = '#0284c7';
          ctx.beginPath();
          this.roundRectPath(ctx, badgeX, badgeY, badgeW, badgeH, 4 / this.zoom);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = `700 ${Math.max(10 / this.zoom, 8)}px Inter, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('▶ Flow 1', badgeX + badgeW / 2, badgeY + badgeH / 2);
          ctx.restore();
        }
      }
    }

    // Draw Existing Connections
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
        const endY = targetBounds.y + Math.min(80, targetBounds.height / 2);

        ctx.save();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2 / this.zoom;
        ctx.fillStyle = '#38bdf8';

        // Start circle
        ctx.beginPath();
        ctx.arc(startX, startY, 4 / this.zoom, 0, Math.PI * 2);
        ctx.fill();

        // Bezier wire
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        const dx = Math.max(60, (endX - startX) / 2);
        ctx.bezierCurveTo(startX + dx, startY, endX - dx, endY, endX, endY);
        ctx.stroke();

        // Arrowhead
        ctx.beginPath();
        ctx.arc(endX, endY, 4 / this.zoom, 0, Math.PI * 2);
        ctx.fill();

        // Trigger pill on wire
        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1 / this.zoom;
        const pillW = 20 / this.zoom;
        const pillH = 14 / this.zoom;
        ctx.beginPath();
        this.roundRectPath(ctx, midX - pillW / 2, midY - pillH / 2, pillW, pillH, 3 / this.zoom);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.font = `600 ${Math.max(9 / this.zoom, 7)}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const triggerIcon = interaction.trigger === 'hover' ? '⚡' : interaction.trigger === 'delay' ? '⏱' : '👆';
        ctx.fillText(triggerIcon, midX, midY);

        ctx.restore();
      }
    }

    // Active Wire Drag Preview
    if (this.connectionDrag) {
      const { startX, startY, currentX, currentY } = this.connectionDrag;
      ctx.save();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5 / this.zoom;
      ctx.setLineDash([4 / this.zoom, 3 / this.zoom]);

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      const dx = Math.max(40, (currentX - startX) / 2);
      ctx.bezierCurveTo(startX + dx, startY, currentX - dx, currentY, currentX, currentY);
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(currentX, currentY, 5 / this.zoom, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw connection handle on right edge of selected node
    const selectedIds = this.engine.getSelection();
    if (selectedIds.length === 1) {
      const selNode = page.nodes[selectedIds[0]];
      const selBounds = computeWorldBounds(page, selectedIds[0], boundsCache);
      if (selNode && selBounds) {
        const handleX = selBounds.x + selBounds.width;
        const handleY = selBounds.y + selBounds.height / 2;
        const radius = 7 / this.zoom;

        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#0d99ff';
        ctx.lineWidth = 2 / this.zoom;
        ctx.beginPath();
        ctx.arc(handleX, handleY, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#0d99ff';
        ctx.font = `bold ${Math.max(11 / this.zoom, 8)}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('+', handleX, handleY);
        ctx.restore();
      }
    }
  }

  hitTestConnectionHandle(canvasX, canvasY, bounds) {
    if (!bounds) return false;
    const handleX = bounds.x + bounds.width;
    const handleY = bounds.y + bounds.height / 2;
    const threshold = 14 / this.zoom;
    return Math.hypot(canvasX - handleX, canvasY - handleY) <= threshold;
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
      // In Vector Edit Mode, suppress standard selection bounding box & 8 resize handles
      if (this.vectorEdit && this.vectorEdit.nodeId === id) {
        continue;
      }
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

      // Draw 8 Resize Handles
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

      // Draw 4 Corner Radius Circular Handles for Rectangles (§11.11)
      if (node.type === 'rectangle' && !this.vectorEdit) {
        const cornerRadius = node.style?.cornerRadius || 0;
        const cornerRadii = node.style?.cornerRadii || null;
        const radiusHandles = getRectangleCornerHandles(bounds, cornerRadius, cornerRadii);
        const crHandleRadius = 3.5 / this.zoom;

        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#0d99ff';
        ctx.lineWidth = 1.5 / this.zoom;

        for (const rh of radiusHandles) {
          ctx.beginPath();
          ctx.arc(rh.x, rh.y, crHandleRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
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

  drawCreationPreview(ctx) {
    if (!this.creationPreview) return;
    const { tool, startX, startY, currentX, currentY } = this.creationPreview;
    const x = Math.min(startX, currentX);
    const y = Math.min(startY, currentY);
    const w = Math.max(1, Math.abs(currentX - startX));
    const h = Math.max(1, Math.abs(currentY - startY));

    ctx.save();
    if (tool === 'ellipse') {
      ctx.fillStyle = 'rgba(13, 153, 255, 0.15)';
      ctx.strokeStyle = '#0d99ff';
      ctx.lineWidth = 1.5 / this.zoom;
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (tool === 'arrow') {
      ctx.strokeStyle = '#0d99ff';
      ctx.fillStyle = '#0d99ff';
      ctx.lineWidth = 2 / this.zoom;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(currentX, currentY);
      ctx.stroke();
      const angle = Math.atan2(currentY - startY, currentX - startX);
      const headLen = 14 / this.zoom;
      ctx.beginPath();
      ctx.moveTo(currentX, currentY);
      ctx.lineTo(currentX - headLen * Math.cos(angle - Math.PI / 6), currentY - headLen * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(currentX - headLen * Math.cos(angle + Math.PI / 6), currentY - headLen * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();
    } else if (tool === 'star') {
      ctx.fillStyle = 'rgba(13, 153, 255, 0.15)';
      ctx.strokeStyle = '#0d99ff';
      ctx.lineWidth = 1.5 / this.zoom;
      const cx = x + w / 2;
      const cy = y + h / 2;
      const outerR = Math.min(w, h) / 2;
      const innerR = outerR * 0.4;
      const points = 5;
      ctx.beginPath();
      for (let i = 0; i < points * 2; i++) {
        const r = (i % 2 === 0) ? outerR : innerR;
        const angle = -Math.PI / 2 + (i * Math.PI) / points;
        const px = cx + r * Math.cos(angle);
        const py = cy + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (tool === 'polygon') {
      ctx.fillStyle = 'rgba(13, 153, 255, 0.15)';
      ctx.strokeStyle = '#0d99ff';
      ctx.lineWidth = 1.5 / this.zoom;
      const cx = x + w / 2;
      const cy = y + h / 2;
      const r = Math.min(w, h) / 2;
      const sides = 6;
      ctx.beginPath();
      for (let i = 0; i < sides; i++) {
        const angle = -Math.PI / 2 + (i * 2 * Math.PI) / sides;
        const px = cx + r * Math.cos(angle);
        const py = cy + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (tool === 'line') {
      ctx.strokeStyle = '#0d99ff';
      ctx.lineWidth = 2 / this.zoom;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(currentX, currentY);
      ctx.stroke();
    } else if (tool === 'text') {
      ctx.fillStyle = 'rgba(13, 153, 255, 0.08)';
      ctx.strokeStyle = '#0d99ff';
      ctx.lineWidth = 1 / this.zoom;
      ctx.setLineDash([3 / this.zoom, 3 / this.zoom]);
      ctx.strokeRect(x, y, w, h);
      ctx.fillRect(x, y, w, h);
      ctx.setLineDash([]);
      ctx.font = `${Math.max(12 / this.zoom, 9)}px Inter, sans-serif`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fillText('Type text...', x + 4 / this.zoom, y + 14 / this.zoom);
    } else {
      ctx.fillStyle = tool === 'section' ? 'rgba(99, 102, 241, 0.12)' : 'rgba(13, 153, 255, 0.12)';
      ctx.strokeStyle = tool === 'section' ? '#6366f1' : '#0d99ff';
      ctx.lineWidth = 1.5 / this.zoom;
      ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x, y, w, h);
    }

    // Dimensions HUD badge (e.g. 320 × 240)
    ctx.font = `600 ${Math.max(11 / this.zoom, 9)}px Inter, sans-serif`;
    const label = `${Math.round(w)} × ${Math.round(h)}`;
    const textMetrics = ctx.measureText(label);
    const badgeW = textMetrics.width + 12 / this.zoom;
    const badgeH = 18 / this.zoom;
    const badgeX = x + w / 2 - badgeW / 2;
    const badgeY = y + h + 8 / this.zoom;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    this.roundRectPath(ctx, badgeX, badgeY, badgeW, badgeH, 4 / this.zoom);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + w / 2, badgeY + badgeH / 2);

    ctx.restore();
  }

  drawPencilPreview(ctx) {
    if (!this.pencilPreview || this.pencilPreview.length < 2) return;
    ctx.save();
    ctx.strokeStyle = '#0d99ff';
    ctx.lineWidth = 2.5 / this.zoom;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(this.pencilPreview[0].x, this.pencilPreview[0].y);
    for (let i = 1; i < this.pencilPreview.length; i++) {
      ctx.lineTo(this.pencilPreview[i].x, this.pencilPreview[i].y);
    }
    ctx.stroke();
    ctx.restore();
  }

  drawPenPreview(ctx) {
    if (!this.penPreview) return;
    const { points, current } = this.penPreview;
    if (!points || points.length === 0) return;
    ctx.save();
    ctx.strokeStyle = '#0d99ff';
    ctx.lineWidth = 1.5 / this.zoom;
    ctx.setLineDash([4 / this.zoom, 4 / this.zoom]);
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    if (current) {
      ctx.lineTo(current.x, current.y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw vertex anchors
    const anchorR = 3.5 / this.zoom;
    for (const pt of points) {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#0d99ff';
      ctx.lineWidth = 1.5 / this.zoom;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, anchorR, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    if (current) {
      ctx.fillStyle = 'rgba(13, 153, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(current.x, current.y, anchorR, 0, Math.PI * 2);
      ctx.fill();
    }
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

  /**
   * Section 11.11: Hit test for corner radius handles on rectangles
   */
  hitTestCornerRadiusHandle(canvasX, canvasY, bounds, cornerRadius = 0, cornerRadii = null) {
    if (!bounds) return null;
    const handles = getRectangleCornerHandles(bounds, cornerRadius, cornerRadii);
    const threshold = 10 / this.zoom;
    for (const h of handles) {
      if (Math.hypot(canvasX - h.x, canvasY - h.y) <= threshold) {
        return h.key;
      }
    }
    return null;
  }

  /**
   * Section 11.6 & 11.8: Hit test for vector anchors
   */
  hitTestVectorAnchor(canvasX, canvasY, bounds, anchors) {
    if (!bounds || !Array.isArray(anchors)) return -1;
    const threshold = 12 / this.zoom;
    for (let i = 0; i < anchors.length; i++) {
      const ax = bounds.x + anchors[i].x;
      const ay = bounds.y + anchors[i].y;
      if (Math.hypot(canvasX - ax, canvasY - ay) <= threshold) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Section 11.9: Hit test for Bézier tangent handles of selected anchors
   */
  hitTestVectorHandle(canvasX, canvasY, bounds, anchors, selectedIndices) {
    if (!bounds || !Array.isArray(anchors)) return null;
    const indicesSet = selectedIndices instanceof Set ? selectedIndices : new Set(selectedIndices || []);
    const threshold = 12 / this.zoom;

    for (const idx of indicesSet) {
      const a = anchors[idx];
      if (!a) continue;
      const ax = bounds.x + a.x;
      const ay = bounds.y + a.y;

      if (a.handleOut && (a.handleOut.x !== 0 || a.handleOut.y !== 0)) {
        const hx = ax + a.handleOut.x;
        const hy = ay + a.handleOut.y;
        if (Math.hypot(canvasX - hx, canvasY - hy) <= threshold) {
          return { anchorIndex: idx, which: 'out' };
        }
      }

      if (a.handleIn && (a.handleIn.x !== 0 || a.handleIn.y !== 0)) {
        const hx = ax + a.handleIn.x;
        const hy = ay + a.handleIn.y;
        if (Math.hypot(canvasX - hx, canvasY - hy) <= threshold) {
          return { anchorIndex: idx, which: 'in' };
        }
      }
    }
    return null;
  }

  /**
   * Hit test vector path segments to add an anchor point (Figma click-to-add vector behavior)
   */
  hitTestVectorSegment(canvasX, canvasY, bounds, anchors, closed = true) {
    if (!bounds || !Array.isArray(anchors) || anchors.length < 2) return null;
    const threshold = 8 / this.zoom;

    function distToSegment(px, py, x1, y1, x2, y2) {
      const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
      if (l2 === 0) return { dist: Math.hypot(px - x1, py - y1), t: 0, projX: x1, projY: y1 };
      let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
      t = Math.max(0, Math.min(1, t));
      const projX = x1 + t * (x2 - x1);
      const projY = y1 + t * (y2 - y1);
      return { dist: Math.hypot(px - projX, py - projY), t, projX, projY };
    }

    const totalSegs = closed ? anchors.length : anchors.length - 1;
    for (let i = 0; i < totalSegs; i++) {
      const a1 = anchors[i];
      const a2 = anchors[(i + 1) % anchors.length];
      const x1 = bounds.x + a1.x;
      const y1 = bounds.y + a1.y;
      const x2 = bounds.x + a2.x;
      const y2 = bounds.y + a2.y;

      const res = distToSegment(canvasX, canvasY, x1, y1, x2, y2);
      if (res.dist <= threshold && res.t > 0.05 && res.t < 0.95) {
        return {
          insertIndex: i + 1,
          x: res.projX - bounds.x,
          y: res.projY - bounds.y
        };
      }
    }
    return null;
  }

  /**
   * Section 11.6–11.10: Render Vector Edit Mode overlay on active path
   */
  drawVectorEdit(ctx, page) {
    if (!this.vectorEdit) return;
    const { nodeId, anchors, selectedIndices, bounds } = this.vectorEdit;
    if (!anchors || anchors.length === 0) return;

    ctx.save();
    const handleSize = 7 / this.zoom;
    const halfSize = handleSize / 2;
    const handleRadius = 3.5 / this.zoom;

    // 1. Draw connecting path outline
    ctx.strokeStyle = '#0d99ff';
    ctx.lineWidth = 1.5 / this.zoom;
    ctx.beginPath();
    ctx.moveTo(bounds.x + anchors[0].x, bounds.y + anchors[0].y);
    for (let i = 1; i < anchors.length; i++) {
      const prev = anchors[i - 1];
      const curr = anchors[i];
      const hasPrevOut = prev.handleOut && (prev.handleOut.x !== 0 || prev.handleOut.y !== 0);
      const hasCurrIn = curr.handleIn && (curr.handleIn.x !== 0 || curr.handleIn.y !== 0);
      if (hasPrevOut || hasCurrIn) {
        ctx.bezierCurveTo(
          bounds.x + prev.x + (prev.handleOut?.x || 0), bounds.y + prev.y + (prev.handleOut?.y || 0),
          bounds.x + curr.x + (curr.handleIn?.x || 0), bounds.y + curr.y + (curr.handleIn?.y || 0),
          bounds.x + curr.x, bounds.y + curr.y
        );
      } else {
        ctx.lineTo(bounds.x + curr.x, bounds.y + curr.y);
      }
    }
    if (anchors.length > 2) {
      const last = anchors[anchors.length - 1];
      const first = anchors[0];
      const hasLastOut = last.handleOut && (last.handleOut.x !== 0 || last.handleOut.y !== 0);
      const hasFirstIn = first.handleIn && (first.handleIn.x !== 0 || first.handleIn.y !== 0);
      if (hasLastOut || hasFirstIn) {
        ctx.bezierCurveTo(
          bounds.x + last.x + (last.handleOut?.x || 0), bounds.y + last.y + (last.handleOut?.y || 0),
          bounds.x + first.x + (first.handleIn?.x || 0), bounds.y + first.y + (first.handleIn?.y || 0),
          bounds.x + first.x, bounds.y + first.y
        );
      }
      ctx.closePath();
    }
    ctx.stroke();

    const indicesSet = selectedIndices instanceof Set ? selectedIndices : new Set(selectedIndices || []);

    // 2. Draw Bézier tangent handle bars and circles for selected anchors
    for (let i = 0; i < anchors.length; i++) {
      if (!indicesSet.has(i)) continue;
      const a = anchors[i];
      const ax = bounds.x + a.x;
      const ay = bounds.y + a.y;

      // Handle Out
      if (a.handleOut && (a.handleOut.x !== 0 || a.handleOut.y !== 0)) {
        const hx = ax + a.handleOut.x;
        const hy = ay + a.handleOut.y;
        ctx.strokeStyle = '#0d99ff';
        ctx.lineWidth = 1 / this.zoom;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(hx, hy);
        ctx.stroke();

        ctx.fillStyle = '#0d99ff';
        ctx.beginPath();
        ctx.arc(hx, hy, handleRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Handle In
      if (a.handleIn && (a.handleIn.x !== 0 || a.handleIn.y !== 0)) {
        const hx = ax + a.handleIn.x;
        const hy = ay + a.handleIn.y;
        ctx.strokeStyle = '#0d99ff';
        ctx.lineWidth = 1 / this.zoom;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(hx, hy);
        ctx.stroke();

        ctx.fillStyle = '#0d99ff';
        ctx.beginPath();
        ctx.arc(hx, hy, handleRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 3. Draw All Anchor Points (Section 11.6: All visible on entry; distinct style for selected vs unselected)
    for (let i = 0; i < anchors.length; i++) {
      const a = anchors[i];
      const ax = bounds.x + a.x;
      const ay = bounds.y + a.y;
      const isSelected = indicesSet.has(i);

      if (isSelected) {
        ctx.fillStyle = '#0d99ff';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2 / this.zoom;
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#0d99ff';
        ctx.lineWidth = 1.5 / this.zoom;
      }

      ctx.fillRect(ax - halfSize, ay - halfSize, handleSize, handleSize);
      ctx.strokeRect(ax - halfSize, ay - halfSize, handleSize, handleSize);
    }

    ctx.restore();
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

