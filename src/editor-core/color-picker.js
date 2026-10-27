/**
 * DesignForge AI — Professional Photoshop & Figma-Identical Color Picker
 * Provides an interactive 2D Saturation/Value gradient canvas, 1D Hue rainbow slider,
 * 1D Alpha opacity slider, Hex / RGB / HSL inputs, EyeDropper sampler,
 * and Document / Theme color palettes.
 */

// --- Color Space Conversion Math ---

export function hexToRgb(hex) {
  let c = String(hex || '').trim().replace(/^#/, '');
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  }
  if (c.length === 6) {
    const num = parseInt(c, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255,
      a: 1
    };
  }
  if (c.length === 8) {
    const num = parseInt(c, 16);
    return {
      r: (num >> 24) & 255,
      g: (num >> 16) & 255,
      b: (num >> 8) & 255,
      a: Math.round(((num & 255) / 255) * 100) / 100
    };
  }
  return { r: 59, g: 130, b: 246, a: 1 }; // Default #3B82F6 fallback
}

export function rgbToHex(r, g, b, a = 1) {
  const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
  const toHex = (v) => clamp(v).toString(16).padStart(2, '0').toUpperCase();
  const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  if (a !== undefined && a < 0.999) {
    const alphaHex = clamp(a * 255).toString(16).padStart(2, '0').toUpperCase();
    return `${hex}${alphaHex}`;
  }
  return hex;
}

export function rgbToHsv(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (max !== min) {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return {
    h: h * 360,
    s: s * 100,
    v: v * 100
  };
}

export function hsvToRgb(h, s, v) {
  h = (h % 360) / 360;
  s = s / 100;
  v = v / 100;

  let r = 0, g = 0, b = 0;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

export class ColorPickerPopover {
  constructor() {
    this.isOpen = false;
    this.currentColor = '#3B82F6';
    this.initialColor = '#3B82F6';
    this.h = 217;
    this.s = 76;
    this.v = 96;
    this.a = 1;
    this.format = 'HEX'; // 'HEX' | 'RGB'
    this.onInputCallback = null;
    this.onChangeCallback = null;
    this.documentColors = [];

    this.container = null;
    this.sbCanvas = null;
    this.sbCtx = null;
    this.hueSlider = null;
    this.alphaSlider = null;
    this.isDraggingSB = false;
    this.isDraggingHue = false;
    this.isDraggingAlpha = false;

    if (typeof document !== 'undefined') {
      this.initDOM();
    }
  }

  initDOM() {
    let el = document.getElementById('colorPickerPopover');
    if (!el) {
      el = document.createElement('div');
      el.id = 'colorPickerPopover';
      el.className = 'color-picker-popover';
      el.style.display = 'none';
      document.body.appendChild(el);
    }
    this.container = el;
    this.bindEvents();
  }

  render() {
    if (!this.container) return;

    const rgb = hsvToRgb(this.h, this.s, this.v);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b, this.a);

    this.container.innerHTML = `
      <div class="cp-header">
        <div class="cp-tabs">
          <button class="cp-tab-btn active" data-tab="solid">Solid</button>
        </div>
        <div class="cp-header-actions">
          ${typeof window !== 'undefined' && 'EyeDropper' in window ? `
          <button class="cp-icon-btn" id="cpBtnEyedropper" title="Pick color from screen">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m2 22 1-1h3l9-9"/><path d="M14 6l4 4"/><path d="m19 9 2-2a2.828 2.828 0 1 0-4-4l-2 2"/></svg>
          </button>` : ''}
          <button class="cp-icon-btn" id="cpBtnClose" title="Close">✕</button>
        </div>
      </div>

      <!-- 2D Saturation / Value Gradient Canvas -->
      <div class="cp-sb-container">
        <canvas class="cp-sb-canvas" id="cpSbCanvas" width="240" height="150"></canvas>
        <div class="cp-sb-thumb" id="cpSbThumb"></div>
      </div>

      <!-- Hue & Alpha Sliders -->
      <div class="cp-sliders-section">
        <div class="cp-slider-row">
          <div class="cp-slider-track cp-hue-track" id="cpHueTrack">
            <div class="cp-slider-thumb" id="cpHueThumb"></div>
          </div>
        </div>
        <div class="cp-slider-row">
          <div class="cp-slider-track cp-alpha-track" id="cpAlphaTrack">
            <div class="cp-alpha-gradient" id="cpAlphaGradient"></div>
            <div class="cp-slider-thumb" id="cpAlphaThumb"></div>
          </div>
        </div>
      </div>

      <!-- Color Preview & Format Inputs -->
      <div class="cp-inputs-section">
        <div class="cp-preview-box">
          <div class="cp-preview-swatch-current" id="cpPreviewCurrent" style="background: ${hex};" title="New Color"></div>
          <div class="cp-preview-swatch-original" id="cpPreviewOriginal" style="background: ${this.initialColor};" title="Original Color (Click to Revert)"></div>
        </div>

        <div class="cp-field-group">
          <div class="cp-input-row">
            <div class="cp-input-wrapper" style="flex: 1.5;">
              <span class="cp-input-label">HEX</span>
              <input type="text" class="cp-text-input" id="cpHexInput" value="${hex}">
            </div>
            <div class="cp-input-wrapper" style="flex: 1;">
              <span class="cp-input-label">%</span>
              <input type="number" class="cp-text-input" id="cpOpacityInput" value="${Math.round(this.a * 100)}" min="0" max="100">
            </div>
          </div>

          <div class="cp-rgb-row" style="display: flex; gap: 4px; margin-top: 4px;">
            <div class="cp-input-wrapper"><span class="cp-input-label">R</span><input type="number" class="cp-text-input cp-rgb-input" id="cpRInput" value="${rgb.r}" min="0" max="255"></div>
            <div class="cp-input-wrapper"><span class="cp-input-label">G</span><input type="number" class="cp-text-input cp-rgb-input" id="cpGInput" value="${rgb.g}" min="0" max="255"></div>
            <div class="cp-input-wrapper"><span class="cp-input-label">B</span><input type="number" class="cp-text-input cp-rgb-input" id="cpBInput" value="${rgb.b}" min="0" max="255"></div>
          </div>
        </div>
      </div>

      <!-- Document & Theme Preset Swatches -->
      <div class="cp-palette-section">
        <div class="cp-palette-title">Document Colors</div>
        <div class="cp-swatches-grid" id="cpDocSwatches">
          ${this.documentColors.slice(0, 14).map(c => `
            <div class="cp-palette-swatch" data-color="${c}" style="background: ${c};" title="${c}"></div>
          `).join('')}
        </div>

        <div class="cp-palette-title" style="margin-top: 8px;">Sketch Gemstones & Minerals</div>
        <div class="cp-swatches-grid">
          ${[
            { name: 'Ruby', hex: '#e02020' },
            { name: 'Amber', hex: '#fa6400' },
            { name: 'Citrine', hex: '#f7b500' },
            { name: 'Emerald', hex: '#6dd400' },
            { name: 'Amazonite', hex: '#44d7b6' },
            { name: 'Apatite', hex: '#32c5ff' },
            { name: 'Sapphire', hex: '#0091ff' },
            { name: 'Iolite', hex: '#6236ff' },
            { name: 'Amethyst', hex: '#b620e0' },
            { name: 'Graphite', hex: '#6d7278' },
            { name: 'Calcite', hex: '#ffffff' },
            { name: 'Obsidian', hex: '#111827' }
          ].map(s => `
            <div class="cp-palette-swatch" data-color="${s.hex}" style="background: ${s.hex};" title="Sketch ${s.name} (${s.hex})"></div>
          `).join('')}
        </div>

        <div class="cp-palette-title" style="margin-top: 8px;">Standard Palette</div>
        <div class="cp-swatches-grid">
          ${[
            '#000000', '#ffffff', '#64748b', '#ef4444',
            '#f97316', '#f59e0b', '#10b981', '#06b6d4',
            '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899',
            '#1e293b', '#0f172a'
          ].map(c => `
            <div class="cp-palette-swatch" data-color="${c}" style="background: ${c};" title="${c}"></div>
          `).join('')}
        </div>
      </div>
    `;

    this.sbCanvas = document.getElementById('cpSbCanvas');
    if (this.sbCanvas) {
      this.sbCtx = this.sbCanvas.getContext('2d');
    }

    this.drawSBCanvas();
    this.updateThumbPositions();
    this.attachInteractiveListeners();
  }

  drawSBCanvas() {
    if (!this.sbCtx || !this.sbCanvas) return;
    const ctx = this.sbCtx;
    const w = this.sbCanvas.width;
    const h = this.sbCanvas.height;

    // 1. Fill with base Hue
    const baseRgb = hsvToRgb(this.h, 100, 100);
    ctx.fillStyle = `rgb(${baseRgb.r}, ${baseRgb.g}, ${baseRgb.b})`;
    ctx.fillRect(0, 0, w, h);

    // 2. Horizontal gradient: white to transparent
    const whiteGrad = ctx.createLinearGradient(0, 0, w, 0);
    whiteGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    whiteGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = whiteGrad;
    ctx.fillRect(0, 0, w, h);

    // 3. Vertical gradient: transparent to black
    const blackGrad = ctx.createLinearGradient(0, 0, 0, h);
    blackGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    blackGrad.addColorStop(1, 'rgba(0, 0, 0, 1)');
    ctx.fillStyle = blackGrad;
    ctx.fillRect(0, 0, w, h);
  }

  updateThumbPositions() {
    const sbThumb = document.getElementById('cpSbThumb');
    const hueThumb = document.getElementById('cpHueThumb');
    const alphaThumb = document.getElementById('cpAlphaThumb');
    const alphaGrad = document.getElementById('cpAlphaGradient');

    if (sbThumb && this.sbCanvas) {
      const x = (this.s / 100) * this.sbCanvas.offsetWidth;
      const y = (1 - this.v / 100) * this.sbCanvas.offsetHeight;
      sbThumb.style.left = `${x}px`;
      sbThumb.style.top = `${y}px`;
    }

    if (hueThumb) {
      const hPct = (this.h / 360) * 100;
      hueThumb.style.left = `${hPct}%`;
    }

    if (alphaThumb) {
      const aPct = this.a * 100;
      alphaThumb.style.left = `${aPct}%`;
    }

    if (alphaGrad) {
      const rgb = hsvToRgb(this.h, this.s, this.v);
      alphaGrad.style.background = `linear-gradient(to right, transparent, rgb(${rgb.r}, ${rgb.g}, ${rgb.b}))`;
    }
  }

  notifyInput() {
    const rgb = hsvToRgb(this.h, this.s, this.v);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b, this.a);
    this.currentColor = hex;

    if (typeof document !== 'undefined') {
      const prevCurrent = document.getElementById('cpPreviewCurrent');
      if (prevCurrent) prevCurrent.style.background = hex;

      const hexInp = document.getElementById('cpHexInput');
      if (hexInp && document.activeElement !== hexInp) hexInp.value = hex;

      const opInp = document.getElementById('cpOpacityInput');
      if (opInp && document.activeElement !== opInp) opInp.value = Math.round(this.a * 100);

      const rInp = document.getElementById('cpRInput');
      const gInp = document.getElementById('cpGInput');
      const bInp = document.getElementById('cpBInput');
      if (rInp && document.activeElement !== rInp) rInp.value = rgb.r;
      if (gInp && document.activeElement !== gInp) gInp.value = rgb.g;
      if (bInp && document.activeElement !== bInp) bInp.value = rgb.b;

      this.updateThumbPositions();
    }

    if (this.onInputCallback) {
      this.onInputCallback(hex, { r: rgb.r, g: rgb.g, b: rgb.b, a: this.a });
    }
  }

  notifyChange() {
    const hex = this.currentColor;
    const rgb = hexToRgb(hex);
    if (this.onChangeCallback) {
      this.onChangeCallback(hex, { r: rgb.r, g: rgb.g, b: rgb.b, a: this.a });
    }
  }

  attachInteractiveListeners() {
    const sbContainer = this.container.querySelector('.cp-sb-container');
    const hueTrack = document.getElementById('cpHueTrack');
    const alphaTrack = document.getElementById('cpAlphaTrack');

    // 1. SB 2D Canvas Drag
    if (sbContainer) {
      const updateSB = (e) => {
        const rect = sbContainer.getBoundingClientRect();
        const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0].clientX);
        const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0].clientY);
        const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
        const y = Math.max(0, Math.min(rect.height, clientY - rect.top));

        this.s = Math.round((x / rect.width) * 100);
        this.v = Math.round((1 - y / rect.height) * 100);
        this.notifyInput();
      };

      sbContainer.onmousedown = (e) => {
        e.preventDefault();
        this.isDraggingSB = true;
        updateSB(e);

        const onMove = (me) => {
          if (this.isDraggingSB) updateSB(me);
        };
        const onUp = () => {
          if (this.isDraggingSB) {
            this.isDraggingSB = false;
            this.notifyChange();
          }
          window.removeEventListener('mousemove', onMove);
          window.removeEventListener('mouseup', onUp);
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
      };
    }

    // 2. Hue Slider Track Drag
    if (hueTrack) {
      const updateHue = (e) => {
        const rect = hueTrack.getBoundingClientRect();
        const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0].clientX);
        const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
        this.h = Math.round((x / rect.width) * 360);
        this.drawSBCanvas();
        this.notifyInput();
      };

      hueTrack.onmousedown = (e) => {
        e.preventDefault();
        this.isDraggingHue = true;
        updateHue(e);

        const onMove = (me) => {
          if (this.isDraggingHue) updateHue(me);
        };
        const onUp = () => {
          if (this.isDraggingHue) {
            this.isDraggingHue = false;
            this.notifyChange();
          }
          window.removeEventListener('mousemove', onMove);
          window.removeEventListener('mouseup', onUp);
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
      };
    }

    // 3. Alpha Slider Track Drag
    if (alphaTrack) {
      const updateAlpha = (e) => {
        const rect = alphaTrack.getBoundingClientRect();
        const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0].clientX);
        const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
        this.a = Math.round((x / rect.width) * 100) / 100;
        this.notifyInput();
      };

      alphaTrack.onmousedown = (e) => {
        e.preventDefault();
        this.isDraggingAlpha = true;
        updateAlpha(e);

        const onMove = (me) => {
          if (this.isDraggingAlpha) updateAlpha(me);
        };
        const onUp = () => {
          if (this.isDraggingAlpha) {
            this.isDraggingAlpha = false;
            this.notifyChange();
          }
          window.removeEventListener('mousemove', onMove);
          window.removeEventListener('mouseup', onUp);
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
      };
    }

    // 4. Hex Input manual typing
    const hexInp = document.getElementById('cpHexInput');
    if (hexInp) {
      hexInp.onchange = (e) => {
        const val = e.target.value.trim();
        const rgb = hexToRgb(val);
        const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
        this.h = hsv.h;
        this.s = hsv.s;
        this.v = hsv.v;
        this.a = rgb.a !== undefined ? rgb.a : 1;
        this.drawSBCanvas();
        this.notifyInput();
        this.notifyChange();
      };
    }

    // 5. Opacity Input
    const opInp = document.getElementById('cpOpacityInput');
    if (opInp) {
      opInp.onchange = (e) => {
        const val = Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 100));
        this.a = val / 100;
        this.notifyInput();
        this.notifyChange();
      };
    }

    // 6. RGB Inputs
    const rInp = document.getElementById('cpRInput');
    const gInp = document.getElementById('cpGInput');
    const bInp = document.getElementById('cpBInput');
    const onRgbChange = () => {
      const r = Math.max(0, Math.min(255, parseInt(rInp.value, 10) || 0));
      const g = Math.max(0, Math.min(255, parseInt(gInp.value, 10) || 0));
      const b = Math.max(0, Math.min(255, parseInt(bInp.value, 10) || 0));
      const hsv = rgbToHsv(r, g, b);
      this.h = hsv.h;
      this.s = hsv.s;
      this.v = hsv.v;
      this.drawSBCanvas();
      this.notifyInput();
      this.notifyChange();
    };
    if (rInp) rInp.onchange = onRgbChange;
    if (gInp) gInp.onchange = onRgbChange;
    if (bInp) bInp.onchange = onRgbChange;

    // 7. Swatches Click
    this.container.querySelectorAll('.cp-palette-swatch').forEach(sw => {
      sw.onclick = () => {
        const col = sw.dataset.color;
        this.setColor(col);
        this.notifyInput();
        this.notifyChange();
      };
    });

    // 8. Original Color Swatch Revert
    const prevOriginal = document.getElementById('cpPreviewOriginal');
    if (prevOriginal) {
      prevOriginal.onclick = () => {
        this.setColor(this.initialColor);
        this.notifyInput();
        this.notifyChange();
      };
    }

    // 9. EyeDropper Screen Sampler API
    const btnEyedropper = document.getElementById('cpBtnEyedropper');
    if (btnEyedropper && typeof window !== 'undefined' && 'EyeDropper' in window) {
      btnEyedropper.onclick = async () => {
        try {
          const eyeDropper = new window.EyeDropper();
          const result = await eyeDropper.open();
          if (result && result.sRGBHex) {
            this.setColor(result.sRGBHex);
            this.notifyInput();
            this.notifyChange();
          }
        } catch (err) {
          console.warn('EyeDropper cancelled or unsupported:', err);
        }
      };
    }

    // 10. Close Button
    const btnClose = document.getElementById('cpBtnClose');
    if (btnClose) {
      btnClose.onclick = () => this.close();
    }
  }

  bindEvents() {
    // Escape or click outside closes popover
    if (typeof window !== 'undefined') {
      window.addEventListener('mousedown', (e) => {
        if (!this.isOpen) return;
        if (this.container && !this.container.contains(e.target) && !e.target.closest('.color-swatch-box')) {
          this.close();
        }
      });
    }
  }

  setColor(colorStr) {
    const rgb = hexToRgb(colorStr);
    const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    this.h = hsv.h;
    this.s = hsv.s;
    this.v = hsv.v;
    this.a = rgb.a !== undefined ? rgb.a : 1;
    this.currentColor = String(colorStr).startsWith('#') ? colorStr.toUpperCase() : rgbToHex(rgb.r, rgb.g, rgb.b, this.a);
    if (this.isOpen) {
      this.drawSBCanvas();
      this.updateThumbPositions();
    }
  }

  open(options = {}) {
    const targetElement = options.targetElement || options.anchorEl;
    const initialColor = options.initialColor || options.color || '#3B82F6';
    const onInput = options.onInput || (options.onCommit ? options.onChange : null) || options.onChange;
    const onChange = options.onCommit || options.onChange || options.onInput;
    const documentColors = options.documentColors || options.palette || [];

    this.initialColor = initialColor;
    this.setColor(this.initialColor);
    this.onInputCallback = onInput;
    this.onChangeCallback = onChange;
    this.documentColors = documentColors;

    this.render();

    // Position popover intelligently relative to targetElement
    if (this.container) {
      this.container.style.display = 'block';
      const bounds = this.container.getBoundingClientRect();
      const popoverW = bounds.width || 264;
      const popoverH = bounds.height || 410;
      let left = window.innerWidth - popoverW - 16;
      let top = 80;

      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        left = rect.left - popoverW - 12;
        top = rect.top - 20;

        if (left < 10 && rect.right + popoverW + 12 <= window.innerWidth - 10) {
          left = rect.right + 12;
        }
      }

      left = Math.max(10, Math.min(left, window.innerWidth - popoverW - 10));
      top = Math.min(top, window.innerHeight - Math.min(popoverH, window.innerHeight - 20) - 10);
      if (top < 10) top = 10;

      this.container.style.left = `${Math.round(left)}px`;
      this.container.style.top = `${Math.round(top)}px`;
    }

    if (this.container) {
      this.container.style.display = 'block';
    }
    this.isOpen = true;
  }

  close() {
    if (!this.isOpen) return;
    this.notifyChange();
    if (this.container) {
      this.container.style.display = 'none';
    }
    this.isOpen = false;
  }
}
