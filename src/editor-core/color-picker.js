/**
 * DesignForge AI — Professional Photoshop & Figma-Identical Color Picker
 * Provides an interactive 2D Saturation/Value gradient canvas, 1D Hue rainbow slider,
 * 1D Alpha opacity slider, Hex / RGB / HSL inputs, EyeDropper sampler,
 * and Document / Theme color palettes.
 */

import { CanonicalColor, calculateWcagContrast } from './color-math-engine.js';

// --- Color Space Conversion Math ---

export function hexToRgb(hex) {
  let c = String(hex || '').trim().replace(/^#/, '');
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  } else if (c.length === 4) {
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

export function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const lightness = (max + min) / 2;
  let hue = 0;
  let saturation = 0;

  if (delta !== 0) {
    saturation = delta / (1 - Math.abs(2 * lightness - 1));
    switch (max) {
      case r: hue = ((g - b) / delta) % 6; break;
      case g: hue = (b - r) / delta + 2; break;
      default: hue = (r - g) / delta + 4; break;
    }
    hue *= 60;
    if (hue < 0) hue += 360;
  }

  return { h: hue, s: saturation * 100, l: lightness * 100 };
}

export function hslToRgb(h, s, l) {
  const hue = ((h % 360) + 360) % 360 / 360;
  const saturation = Math.max(0, Math.min(100, s)) / 100;
  const lightness = Math.max(0, Math.min(100, l)) / 100;
  const channel = offset => {
    const k = (offset + hue * 12) % 12;
    const a = saturation * Math.min(lightness, 1 - lightness);
    return lightness - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return {
    r: Math.round(channel(0) * 255),
    g: Math.round(channel(8) * 255),
    b: Math.round(channel(4) * 255)
  };
}

export function parseColorString(value) {
  const color = String(value ?? '').trim();
  if (/^#?(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(color)) {
    const channels = color.replace(/^#/, '');
    const rgb = hexToRgb(color);
    return { ...rgb, hasAlpha: channels.length === 4 || channels.length === 8 };
  }

  const match = color.match(/^(rgb|rgba|hsl|hsla)\((.*)\)$/i);
  if (!match) return null;
  const [, model, body] = match;
  const isHsl = model.toLowerCase().startsWith('hsl');
  const components = body.split('/');
  if (components.length > 2) return null;
  const values = components[0].includes(',')
    ? components[0].split(',').map(part => part.trim())
    : components[0].trim().split(/\s+/);
  let alphaValue = components[1]?.trim();
  if (!alphaValue && values.length === 4) alphaValue = values.pop();
  if (values.length !== 3 || (model.toLowerCase().endsWith('a') && !alphaValue)) return null;

  const parseComponent = part => {
    const component = String(part).trim().match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))(%?)$/);
    if (!component) return null;
    return { number: Number(component[1]), percent: component[2] === '%' };
  };
  const parsed = values.map(parseComponent);
  if (parsed.some(part => !part)) return null;

  let rgb;
  if (isHsl) {
    if (!parsed[1].percent || !parsed[2].percent) return null;
    rgb = hslToRgb(parsed[0].number, parsed[1].number, parsed[2].number);
  } else {
    const channel = part => Math.max(0, Math.min(255, Math.round(part.percent ? part.number * 2.55 : part.number)));
    rgb = {
      r: channel(parsed[0]),
      g: channel(parsed[1]),
      b: channel(parsed[2])
    };
  }
  const alphaParsed = alphaValue ? parseComponent(alphaValue) : null;
  if (alphaValue && !alphaParsed) return null;
  return {
    ...rgb,
    a: alphaParsed ? Math.max(0, Math.min(1, alphaParsed.percent ? alphaParsed.number / 100 : alphaParsed.number)) : 1,
    hasAlpha: Boolean(alphaParsed)
  };
}

function isValidHexColor(value) {
  return /^#?(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(String(value || '').trim());
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

export class ColorPickerPopover {
  constructor() {
    this.isOpen = false;
    this.mode = 'solid'; // 'solid' | 'gradient'
    this.gradient = null;
    this.activeStopIndex = 0;
    this.contrastBackground = '#090D16';
    this.currentColor = '#3B82F6';
    this.initialColor = '#3B82F6';
    this.h = 217;
    this.s = 76;
    this.v = 96;
    this.a = 1;
    this.format = this.loadColorFormat();
    this.onInputCallback = null;
    this.onChangeCallback = null;
    this.onGradientChangeCallback = null;
    this.documentColors = [];
    this.recentColors = this.loadRecentColors();
    this.hasPendingChange = false;
    this.designTokens = [];

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

  loadColorFormat() {
    try {
      const format = globalThis.localStorage?.getItem('designforge_color_format');
      return ['HEX', 'RGB', 'HSL', 'HSB', 'OKLab', 'OKLCH', 'CSS'].includes(format) ? format : 'HEX';
    } catch (error) {
      console.warn('Could not load color format preference:', error);
      return 'HEX';
    }
  }

  saveColorFormat(format) {
    try {
      globalThis.localStorage?.setItem('designforge_color_format', format);
    } catch (error) {
      console.warn('Could not save color format preference:', error);
    }
  }

  renderColorInputFields(rgb, hex) {
    const formatNumber = value => String(Math.round(value * 100) / 100);
    const numberInput = (id, label, value, min, max, step = 0.1) => `
      <div class="cp-input-wrapper">
        <span class="cp-input-label">${label}</span>
        <input type="number" class="cp-text-input cp-model-input" id="${id}" value="${formatNumber(value)}" min="${min}" max="${max}" step="${step}" aria-label="${label}" aria-describedby="cpColorInputError">
      </div>`;
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

    if (this.format === 'RGB') {
      return `<div class="cp-input-row cp-rgb-row">
        ${numberInput('cpRInput', 'R', rgb.r, 0, 255, 1)}
        ${numberInput('cpGInput', 'G', rgb.g, 0, 255, 1)}
        ${numberInput('cpBInput', 'B', rgb.b, 0, 255, 1)}
      </div>`;
    }
    if (this.format === 'HSL') {
      return `<div class="cp-input-row cp-rgb-row">
        ${numberInput('cpHslHInput', 'H', hsl.h, 0, 360, 1)}
        ${numberInput('cpHslSInput', 'S', hsl.s, 0, 100, 1)}
        ${numberInput('cpHslLInput', 'L', hsl.l, 0, 100, 1)}
      </div>`;
    }
    if (this.format === 'HSB') {
      return `<div class="cp-input-row cp-rgb-row">
        ${numberInput('cpHsbHInput', 'H', this.h, 0, 360, 1)}
        ${numberInput('cpHsbSInput', 'S', this.s, 0, 100, 1)}
        ${numberInput('cpHsbBInput', 'B', this.v, 0, 100, 1)}
      </div>`;
    }
    if (this.format === 'OKLab') {
      let oklab = { L: 0.6, a: 0, b: 0 };
      try {
        const c = CanonicalColor.fromHex(hex);
        oklab = c.toOklab();
      } catch (e) {}
      return `<div class="cp-input-row cp-rgb-row">
        ${numberInput('cpOklabLInput', 'L', oklab.L, 0, 1, 0.01)}
        ${numberInput('cpOklabAInput', 'a', oklab.a, -0.4, 0.4, 0.01)}
        ${numberInput('cpOklabBInput', 'b', oklab.b, -0.4, 0.4, 0.01)}
      </div>`;
    }
    if (this.format === 'OKLCH') {
      let oklch = { L: 0.6, C: 0.1, h: 0 };
      try {
        const c = CanonicalColor.fromHex(hex);
        oklch = c.toOklch();
      } catch (e) {}
      return `<div class="cp-input-row cp-rgb-row">
        ${numberInput('cpOklchLInput', 'L', oklch.L, 0, 1, 0.01)}
        ${numberInput('cpOklchCInput', 'C', oklch.C, 0, 0.4, 0.01)}
        ${numberInput('cpOklchHInput', 'H', oklch.h, 0, 360, 1)}
      </div>`;
    }

    const isCss = this.format === 'CSS';
    const value = isCss
      ? (this.a < 0.999 ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${this.a})` : `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`)
      : hex;
    return `<div class="cp-input-wrapper">
      <span class="cp-input-label">${isCss ? 'CSS' : 'HEX'}</span>
      <input type="text" class="cp-text-input cp-model-input" id="${isCss ? 'cpCssInput' : 'cpHexInput'}" value="${value}" aria-label="${isCss ? 'CSS color value' : 'HEX color value'}" aria-describedby="cpColorInputError">
    </div>`;
  }

  render() {
    if (!this.container) return;

    const rgb = hsvToRgb(this.h, this.s, this.v);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b, this.a);

    // Calculate contrast against canvas/background
    let contrastBadgeHtml = '';
    try {
      const fg = CanonicalColor.fromHex(hex);
      const bg = CanonicalColor.fromHex(this.contrastBackground || '#090D16');
      const contrast = calculateWcagContrast(fg, bg);
      const level = contrast.passesAAA ? 'AAA' : contrast.passesAA ? 'AA' : contrast.passesAALarge ? 'AA Large' : 'Fail';
      const statusClass = contrast.passesAA ? 'pass' : (contrast.passesAALarge ? 'warn' : 'fail');
      contrastBadgeHtml = `
        <div class="cp-contrast-badge cp-contrast-${statusClass}" id="cpContrastBadge" title="WCAG 2.2 Contrast: ${contrast.ratio}:1 against background (${this.contrastBackground || '#090D16'})">
          <span class="cp-contrast-ratio">${contrast.ratio}:1</span>
          <span class="cp-contrast-level">${level}</span>
        </div>
      `;
    } catch (e) {
      contrastBadgeHtml = '';
    }

    // Gradient bar & stop state if in gradient mode
    let gradientHtml = '';
    if (this.mode === 'gradient') {
      if (!this.gradient) {
        this.gradient = {
          type: 'linear-gradient',
          stops: [
            { offset: 0, color: hex },
            { offset: 1, color: '#8B5CF6' }
          ]
        };
      }
      const stops = this.gradient.stops || [
        { offset: 0, color: hex },
        { offset: 1, color: '#8B5CF6' }
      ];
      if (this.activeStopIndex < 0 || this.activeStopIndex >= stops.length) {
        this.activeStopIndex = 0;
      }
      const activeStop = stops[this.activeStopIndex] || stops[0];
      const gradCss = `linear-gradient(to right, ${stops.map(s => `${s.color} ${Math.round(s.offset * 100)}%`).join(', ')})`;

      gradientHtml = `
        <div class="cp-gradient-section" id="cpGradientSection">
          <div class="cp-gradient-type-row">
            <select class="cp-text-input cp-gradient-type-select" id="cpGradientTypeSelect" aria-label="Gradient Type">
              <option value="linear-gradient" ${this.gradient.type === 'linear-gradient' || this.gradient.type === 'gradient' ? 'selected' : ''}>Linear Gradient</option>
              <option value="radial-gradient" ${this.gradient.type === 'radial-gradient' ? 'selected' : ''}>Radial Gradient</option>
              <option value="angular-gradient" ${this.gradient.type === 'angular-gradient' || this.gradient.type === 'conic-gradient' ? 'selected' : ''}>Angular (Conic)</option>
              <option value="diamond-gradient" ${this.gradient.type === 'diamond-gradient' ? 'selected' : ''}>Diamond Gradient</option>
            </select>
            <button class="cp-icon-btn" id="cpBtnReverseStops" title="Reverse Gradient Stops" style="margin-left: auto;">⇄</button>
          </div>
          <div class="cp-gradient-track-wrapper" id="cpGradientTrackWrapper" title="Click bar to add stop">
            <div class="cp-gradient-track" id="cpGradientTrack" style="background: ${gradCss};"></div>
            ${stops.map((s, idx) => `
              <div class="cp-gradient-stop-pin ${idx === this.activeStopIndex ? 'active' : ''}" data-stop-index="${idx}" style="left: ${Math.round(s.offset * 100)}%; background: ${s.color};" title="Stop ${idx + 1}: ${Math.round(s.offset * 100)}% (${s.color})"></div>
            `).join('')}
          </div>
          <div class="cp-gradient-stop-actions">
            <div class="cp-input-wrapper" style="width: 80px;">
              <span class="cp-input-label">POS</span>
              <input type="number" class="cp-text-input" id="cpStopPositionInput" min="0" max="100" value="${Math.round(activeStop.offset * 100)}" step="1">
              <span class="cp-input-label">%</span>
            </div>
            <button class="cp-icon-btn" id="cpBtnDeleteStop" title="Delete Stop" ${stops.length <= 2 ? 'disabled style="opacity: 0.35; cursor: not-allowed;"' : ''}>✕</button>
          </div>
        </div>
      `;
    }

    this.container.innerHTML = `
      <div class="cp-header">
        <div class="cp-tabs">
          <button class="cp-tab-btn ${this.mode === 'solid' ? 'active' : ''}" data-tab="solid">Solid</button>
          <button class="cp-tab-btn ${this.mode === 'gradient' ? 'active' : ''}" data-tab="gradient">Gradient</button>
        </div>
        <div class="cp-header-actions">
          <button class="cp-icon-btn" id="cpBtnCopyColor" title="Copy color code to clipboard">
            <span data-icon="Copy" data-icon-size="13"></span>
          </button>
          ${typeof window !== 'undefined' && 'EyeDropper' in window ? `
          <button class="cp-icon-btn" id="cpBtnEyedropper" title="Pick color from screen">
            <span data-icon="Pipette" data-icon-size="13"></span>
          </button>` : ''}
          <button class="cp-icon-btn" id="cpBtnClose" title="Close"><span data-icon="X" data-icon-size="13"></span></button>
        </div>
      </div>

      ${gradientHtml}

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
            <div class="cp-input-wrapper">
              <span class="cp-input-label">MODEL</span>
              <select class="cp-text-input" id="cpColorModel" aria-label="Color model">
                ${['HEX', 'RGB', 'HSL', 'HSB', 'OKLab', 'OKLCH', 'CSS'].map(format => `<option value="${format}" ${this.format === format ? 'selected' : ''}>${format}</option>`).join('')}
              </select>
            </div>
            <div class="cp-input-wrapper">
              <span class="cp-input-label">%</span>
              <input type="number" class="cp-text-input" id="cpOpacityInput" value="${Math.round(this.a * 100)}" min="0" max="100" step="0.1" aria-describedby="cpColorInputError">
            </div>
          </div>

          <div id="cpModelInputs">${this.renderColorInputFields(rgb, hex)}</div>
          <div id="cpColorInputError" role="alert" aria-live="polite" style="display: none; color: #f87171; font-size: 10px; margin-top: 4px;">
            Enter a valid HEX, RGB, HSL, HSB, OKLab, or CSS color value.
          </div>
          ${contrastBadgeHtml}
        </div>
      </div>

      <!-- Document & Theme Preset Swatches -->
      <div class="cp-palette-section">
        <div class="cp-recent-colors" id="cpRecentColors" style="display: ${this.recentColors.length ? 'block' : 'none'};">
          <div class="cp-palette-title">Recent Colors</div>
          <div class="cp-swatches-grid" id="cpRecentSwatches">
            ${this.recentColors.map(color => `
              <div class="cp-palette-swatch" data-color="${color}" style="background: ${color};" title="${color}"></div>
            `).join('')}
          </div>
        </div>

        <div class="cp-palette-title">Document Colors</div>
        <div class="cp-swatches-grid" id="cpDocSwatches">
          ${this.documentColors.slice(0, 14).map(c => `
            <div class="cp-palette-swatch" data-color="${c}" style="background: ${c};" title="${c}"></div>
          `).join('')}
        </div>

        ${this.designTokens.length ? `
        <div class="cp-palette-title" style="margin-top: 8px;">Design Tokens</div>
        <div class="cp-swatches-grid">
          ${this.designTokens.slice(0, 28).map(token => `
            <div class="cp-palette-swatch" data-color="${token.value}" style="background: ${token.value};" title="${escapeHtml(token.name)}: ${token.value}"></div>
          `).join('')}
        </div>` : ''}

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
    this.bindRecentSwatches();
  }

  drawSBCanvas() {
    if (typeof document === 'undefined' || !this.sbCtx || !this.sbCanvas) return;
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
    if (typeof document === 'undefined') return;
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
    this.hasPendingChange = true;
    const rgb = hsvToRgb(this.h, this.s, this.v);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b, this.a);
    this.currentColor = hex;

    if (this.mode === 'gradient' && this.gradient?.stops?.[this.activeStopIndex]) {
      this.gradient.stops[this.activeStopIndex].color = hex;
    }

    if (typeof document !== 'undefined') {
      const prevCurrent = document.getElementById('cpPreviewCurrent');
      if (prevCurrent) prevCurrent.style.background = hex;

      const activeElement = document.activeElement;
      const hexInp = document.getElementById('cpHexInput');
      if (hexInp && activeElement !== hexInp) hexInp.value = hex;
      const cssInp = document.getElementById('cpCssInput');
      if (cssInp && activeElement !== cssInp) {
        cssInp.value = this.a < 0.999
          ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${this.a})`
          : `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
      }
      const opInp = document.getElementById('cpOpacityInput');
      if (opInp && activeElement !== opInp) opInp.value = Math.round(this.a * 100);

      const rInp = document.getElementById('cpRInput');
      const gInp = document.getElementById('cpGInput');
      const bInp = document.getElementById('cpBInput');
      if (rInp && activeElement !== rInp) rInp.value = rgb.r;
      if (gInp && activeElement !== gInp) gInp.value = rgb.g;
      if (bInp && activeElement !== bInp) bInp.value = rgb.b;

      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      let oklab = { L: 0.6, a: 0, b: 0 };
      let oklch = { L: 0.6, C: 0.1, h: 0 };
      try {
        const c = CanonicalColor.fromHex(hex);
        oklab = c.toOklab();
        oklch = c.toOklch();
      } catch (e) {}

      const modelValues = [
        ['cpHslHInput', hsl.h],
        ['cpHslSInput', hsl.s],
        ['cpHslLInput', hsl.l],
        ['cpHsbHInput', this.h],
        ['cpHsbSInput', this.s],
        ['cpHsbBInput', this.v],
        ['cpOklabLInput', oklab.L],
        ['cpOklabAInput', oklab.a],
        ['cpOklabBInput', oklab.b],
        ['cpOklchLInput', oklch.L],
        ['cpOklchCInput', oklch.C],
        ['cpOklchHInput', oklch.h]
      ];
      for (const [id, value] of modelValues) {
        const input = document.getElementById(id);
        if (input && activeElement !== input) input.value = String(Math.round(value * 100) / 100);
      }

      // Update contrast badge
      const contrastEl = document.getElementById('cpContrastBadge');
      if (contrastEl) {
        try {
          const fg = CanonicalColor.fromHex(hex);
          const bg = CanonicalColor.fromHex(this.contrastBackground || '#090D16');
          const contrast = calculateWcagContrast(fg, bg);
          const level = contrast.passesAAA ? 'AAA' : contrast.passesAA ? 'AA' : contrast.passesAALarge ? 'AA Large' : 'Fail';
          const statusClass = contrast.passesAA ? 'pass' : (contrast.passesAALarge ? 'warn' : 'fail');
          contrastEl.className = `cp-contrast-badge cp-contrast-${statusClass}`;
          contrastEl.title = `WCAG 2.2 Contrast: ${contrast.ratio}:1 against background (${this.contrastBackground || '#090D16'})`;
          contrastEl.innerHTML = `<span class="cp-contrast-ratio">${contrast.ratio}:1</span> <span class="cp-contrast-level">${level}</span>`;
        } catch (e) {}
      }

      // Update gradient track & pins if in gradient mode
      if (this.mode === 'gradient' && this.gradient?.stops) {
        const gradTrack = document.getElementById('cpGradientTrack');
        if (gradTrack) {
          gradTrack.style.background = `linear-gradient(to right, ${this.gradient.stops.map(s => `${s.color} ${Math.round(s.offset * 100)}%`).join(', ')})`;
        }
        const activePin = document.querySelector(`.cp-gradient-stop-pin[data-stop-index="${this.activeStopIndex}"]`);
        if (activePin) activePin.style.background = hex;
      }

      this.updateThumbPositions();
    }

    if (this.onInputCallback) {
      this.onInputCallback(hex, { r: rgb.r, g: rgb.g, b: rgb.b, a: this.a });
    }
    if (this.mode === 'gradient' && this.onGradientChangeCallback) {
      this.onGradientChangeCallback(this.gradient);
    }
  }

  notifyChange() {
    const hex = this.currentColor;
    const rgb = hexToRgb(hex);
    this.saveRecentColor(hex);
    if (this.onChangeCallback) {
      this.onChangeCallback(hex, { r: rgb.r, g: rgb.g, b: rgb.b, a: this.a });
    }
    if (this.mode === 'gradient' && this.onGradientChangeCallback) {
      this.onGradientChangeCallback(this.gradient);
    }
  }

  loadRecentColors() {
    try {
      const stored = globalThis.localStorage?.getItem('designforge_recent_colors');
      const colors = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(colors)) return [];
      return [...new Set(colors.filter(isValidHexColor).map(color => {
        const rgb = hexToRgb(color);
        return rgbToHex(rgb.r, rgb.g, rgb.b, rgb.a);
      }))].slice(0, 14);
    } catch (error) {
      console.warn('Could not load recent colors:', error);
      return [];
    }
  }

  saveRecentColor(color) {
    if (!this.hasPendingChange || !isValidHexColor(color)) return;
    this.hasPendingChange = false;
    const rgb = hexToRgb(color);
    const normalized = rgbToHex(rgb.r, rgb.g, rgb.b, rgb.a);
    this.recentColors = [normalized, ...this.recentColors.filter(item => item !== normalized)].slice(0, 14);

    try {
      globalThis.localStorage?.setItem('designforge_recent_colors', JSON.stringify(this.recentColors));
    } catch (error) {
      console.warn('Could not save recent colors:', error);
    }

    const section = this.container?.querySelector('#cpRecentColors');
    if (section) {
      section.style.display = 'block';
      const swatches = section.querySelector('#cpRecentSwatches');
      if (swatches) {
        swatches.innerHTML = this.recentColors.map(recentColor => `
          <div class="cp-palette-swatch" data-color="${recentColor}" style="background: ${recentColor};" title="${recentColor}"></div>
        `).join('');
        this.bindRecentSwatches();
      }
    }
  }

  bindRecentSwatches() {
    const swatches = this.container?.querySelectorAll('#cpRecentSwatches .cp-palette-swatch');
    swatches?.forEach(swatch => {
      swatch.onclick = () => {
        this.setColor(swatch.dataset.color);
        this.notifyInput();
        this.notifyChange();
      };
    });
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

    const showInputValidity = (input, valid) => {
      if (valid) input.removeAttribute('aria-invalid');
      else input.setAttribute('aria-invalid', 'true');
      const error = document.getElementById('cpColorInputError');
      if (error) {
        error.textContent = input.id === 'cpOpacityInput'
          ? 'Opacity must be between 0 and 100.'
          : 'Enter a valid HEX, RGB, HSL, or CSS color value.';
        error.style.display = valid ? 'none' : 'block';
      }
    };

    // Tabs Solid vs Gradient
    this.container.querySelectorAll('.cp-tab-btn').forEach(btn => {
      btn.onclick = () => {
        const tab = btn.dataset.tab;
        if (tab === this.mode) return;
        this.mode = tab;
        if (this.mode === 'gradient' && !this.gradient) {
          const rgb = hsvToRgb(this.h, this.s, this.v);
          const hex = rgbToHex(rgb.r, rgb.g, rgb.b, this.a);
          this.gradient = {
            type: 'linear-gradient',
            stops: [
              { offset: 0, color: hex },
              { offset: 1, color: '#8B5CF6' }
            ]
          };
          this.activeStopIndex = 0;
        }
        this.render();
        if (this.mode === 'gradient' && this.onGradientChangeCallback) {
          this.onGradientChangeCallback(this.gradient);
        }
      };
    });

    // Copy color button
    const btnCopy = document.getElementById('cpBtnCopyColor');
    if (btnCopy) {
      btnCopy.onclick = () => {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          navigator.clipboard.writeText(this.currentColor);
          btnCopy.style.color = '#10B981';
          setTimeout(() => { if (btnCopy) btnCopy.style.color = ''; }, 1200);
        }
      };
    }

    // Gradient Controls Listeners
    if (this.mode === 'gradient' && this.gradient) {
      const gradTypeSelect = document.getElementById('cpGradientTypeSelect');
      if (gradTypeSelect) {
        gradTypeSelect.onchange = e => {
          this.gradient.type = e.target.value;
          this.render();
          if (this.onGradientChangeCallback) this.onGradientChangeCallback(this.gradient);
        };
      }

      // Reverse stops
      const btnReverse = document.getElementById('cpBtnReverseStops');
      if (btnReverse) {
        btnReverse.onclick = () => {
          this.gradient.stops.reverse();
          this.gradient.stops.forEach((s) => {
            s.offset = Math.round((1 - s.offset) * 100) / 100;
          });
          this.gradient.stops.sort((a, b) => a.offset - b.offset);
          this.activeStopIndex = Math.min(this.activeStopIndex, this.gradient.stops.length - 1);
          const active = this.gradient.stops[this.activeStopIndex];
          if (active) this.setColor(active.color);
          this.render();
          if (this.onGradientChangeCallback) this.onGradientChangeCallback(this.gradient);
        };
      }

      // Stop position input
      const stopPosInput = document.getElementById('cpStopPositionInput');
      if (stopPosInput) {
        stopPosInput.onchange = e => {
          const val = Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)) / 100;
          if (this.gradient.stops[this.activeStopIndex]) {
            this.gradient.stops[this.activeStopIndex].offset = val;
            this.gradient.stops.sort((a, b) => a.offset - b.offset);
            this.render();
            if (this.onGradientChangeCallback) this.onGradientChangeCallback(this.gradient);
          }
        };
      }

      // Delete stop
      const btnDeleteStop = document.getElementById('cpBtnDeleteStop');
      if (btnDeleteStop && this.gradient.stops.length > 2) {
        btnDeleteStop.onclick = () => {
          this.gradient.stops.splice(this.activeStopIndex, 1);
          this.activeStopIndex = Math.max(0, this.activeStopIndex - 1);
          const active = this.gradient.stops[this.activeStopIndex];
          if (active) this.setColor(active.color);
          this.render();
          if (this.onGradientChangeCallback) this.onGradientChangeCallback(this.gradient);
        };
      }

      // Click on stop pins
      this.container.querySelectorAll('.cp-gradient-stop-pin').forEach(pin => {
        pin.onclick = (e) => {
          e.stopPropagation();
          const idx = Number(pin.dataset.stopIndex);
          if (this.gradient.stops[idx]) {
            this.activeStopIndex = idx;
            this.setColor(this.gradient.stops[idx].color);
            this.render();
          }
        };
      });

      // Click on gradient track to add stop
      const trackWrapper = document.getElementById('cpGradientTrackWrapper');
      if (trackWrapper) {
        trackWrapper.onclick = (e) => {
          if (e.target.closest('.cp-gradient-stop-pin')) return;
          const rect = trackWrapper.getBoundingClientRect();
          const offset = Math.max(0, Math.min(1, Math.round(((e.clientX - rect.left) / rect.width) * 100) / 100));
          const rgb = hsvToRgb(this.h, this.s, this.v);
          const color = rgbToHex(rgb.r, rgb.g, rgb.b, this.a);
          this.gradient.stops.push({ offset, color });
          this.gradient.stops.sort((a, b) => a.offset - b.offset);
          this.activeStopIndex = this.gradient.stops.findIndex(s => Math.abs(s.offset - offset) < 0.01);
          this.render();
          if (this.onGradientChangeCallback) this.onGradientChangeCallback(this.gradient);
        };
      }
    }

    const colorModel = document.getElementById('cpColorModel');
    if (colorModel) {
      colorModel.onchange = event => {
        const format = event.target.value;
        if (!['HEX', 'RGB', 'HSL', 'HSB', 'OKLab', 'OKLCH', 'CSS'].includes(format)) return;
        this.format = format;
        this.saveColorFormat(format);
        this.render();
      };
    }

    // 4. Color model input
    const modelInputs = [...this.container.querySelectorAll('.cp-model-input')];
    const modelInput = modelInputs[0];
    if (modelInput) {
      const applyModelInput = commit => {
        let rgb;
        let hasAlpha = false;
        if (this.format === 'RGB' || this.format === 'HSL' || this.format === 'HSB' || this.format === 'OKLab' || this.format === 'OKLCH') {
          const ids = this.format === 'RGB'
            ? ['cpRInput', 'cpGInput', 'cpBInput']
            : this.format === 'HSL'
              ? ['cpHslHInput', 'cpHslSInput', 'cpHslLInput']
              : this.format === 'HSB'
                ? ['cpHsbHInput', 'cpHsbSInput', 'cpHsbBInput']
                : this.format === 'OKLab'
                  ? ['cpOklabLInput', 'cpOklabAInput', 'cpOklabBInput']
                  : ['cpOklchLInput', 'cpOklchCInput', 'cpOklchHInput'];
          const inputs = ids.map(id => document.getElementById(id));
          const values = inputs.map(input => input?.value.trim() === '' ? Number.NaN : Number(input.value));
          const minMax = this.format === 'RGB' ? [[0, 255], [0, 255], [0, 255]]
            : this.format === 'HSL' ? [[0, 360], [0, 100], [0, 100]]
            : this.format === 'HSB' ? [[0, 360], [0, 100], [0, 100]]
            : this.format === 'OKLab' ? [[0, 1], [-0.4, 0.4], [-0.4, 0.4]]
            : [[0, 1], [0, 0.4], [0, 360]];
          const isValid = values.every((value, index) =>
            Number.isFinite(value) && value >= minMax[index][0] && value <= minMax[index][1]
          );
          if (!isValid) {
            inputs.forEach(input => input && showInputValidity(input, false));
            return;
          }
          inputs.forEach(input => input && showInputValidity(input, true));

          if (this.format === 'RGB') {
            rgb = { r: values[0], g: values[1], b: values[2] };
          } else if (this.format === 'HSL') {
            rgb = hslToRgb(values[0], values[1], values[2]);
          } else if (this.format === 'HSB') {
            rgb = hsvToRgb(values[0], values[1], values[2]);
          } else if (this.format === 'OKLab') {
            const canonical = CanonicalColor.fromOklab(values[0], values[1], values[2], this.a);
            rgb = canonical.toRgb255();
          } else if (this.format === 'OKLCH') {
            const canonical = CanonicalColor.fromOklch(values[0], values[1], values[2], this.a);
            rgb = canonical.toRgb255();
          }
        } else {
          const parsed = parseColorString(modelInput.value);
          if (!parsed) {
            showInputValidity(modelInput, false);
            return;
          }
          rgb = parsed;
          hasAlpha = parsed.hasAlpha;
          showInputValidity(modelInput, true);
        }

        const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
        this.h = hsv.h;
        this.s = hsv.s;
        this.v = hsv.v;
        if (hasAlpha) this.a = rgb.a;
        this.drawSBCanvas();
        this.notifyInput();
        if (commit) this.notifyChange();
      };

      modelInput.oninput = () => applyModelInput(false);
      modelInput.onchange = () => applyModelInput(true);
      for (const input of modelInputs.slice(1)) {
        input.oninput = () => applyModelInput(false);
        input.onchange = () => applyModelInput(true);
      }
    }

    // 5. Opacity Input
    const opInp = document.getElementById('cpOpacityInput');
    if (opInp) {
      const applyOpacity = (e, commit) => {
        const value = e.target.value.trim() === '' ? Number.NaN : Number(e.target.value);
        if (!Number.isFinite(value) || value < 0 || value > 100) {
          showInputValidity(opInp, false);
          return;
        }
        showInputValidity(opInp, true);
        this.a = value / 100;
        this.notifyInput();
        if (commit) this.notifyChange();
      };
      opInp.oninput = e => applyOpacity(e, false);
      opInp.onchange = e => applyOpacity(e, true);
    }

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
    const designTokens = options.designTokens || [];

    this.mode = options.mode || (options.gradient ? 'gradient' : 'solid');
    this.gradient = options.gradient ? JSON.parse(JSON.stringify(options.gradient)) : null;
    this.activeStopIndex = options.activeStopIndex || 0;
    this.contrastBackground = options.contrastBackground || '#090D16';
    this.onGradientChangeCallback = options.onGradientChange || null;

    this.initialColor = initialColor;
    this.setColor(this.initialColor);
    this.onInputCallback = onInput;
    this.onChangeCallback = onChange;
    this.documentColors = documentColors;
    this.designTokens = designTokens.filter(token =>
      /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(String(token.value))
    );

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
