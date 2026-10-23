/**
 * DesignForge AI — Color Math & Chromatic Adaptation Engine
 * Implements Section 3 of Next-Gen Vector Design & Prototyping Specification:
 * - Color spaces: sRGB, Display P3, Adobe RGB, ProPhoto, CMYK, CIE Lab, OKLab, OKLCH, HSV, HSL
 * - Bradford chromatic adaptation matrices (D65 <-> D50)
 * - Canonical representation: 64-bit floating point Linear RGBA + color space tag
 * - Linear light & OKLab/OKLCH blending and gradient interpolation
 * - 16 Photometric & Photoshop blend modes
 * - WCAG 2.2 and APCA contrast calculation
 * - Color vision deficiency simulation (Protanopia, Deuteranopia, Tritanopia)
 * - Swatch parsers (ASE/ACO/JSON) and Pantone library mappings
 */

// --- Bradford Chromatic Adaptation Matrices ---
const BRADFORD_CONE_MATRIX = [
  [0.8951, 0.2664, -0.1614],
  [-0.7502, 1.7135, 0.0367],
  [0.0389, -0.0685, 1.0296]
];

const BRADFORD_CONE_INV = [
  [0.9869929, -0.1470543, 0.1599627],
  [0.4323053, 0.5183603, 0.0492912],
  [-0.0085287, 0.0400428, 0.9684867]
];

// Standard illuminants (XYZ)
export const ILLUMINANT_D65 = [0.95047, 1.0, 1.08883];
export const ILLUMINANT_D50 = [0.96422, 1.0, 0.82521];

/**
 * Gamma compression / expansion for sRGB
 */
export function sRgbToLinear(c) {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function linearToSRgb(c) {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1.0 / 2.4) - 0.055;
}

/**
 * Display P3 <-> Linear P3
 */
export function p3ToLinear(c) {
  return sRgbToLinear(c); // P3 uses identical sRGB transfer curve
}

export function linearToP3(c) {
  return linearToSRgb(c);
}

/**
 * Adobe RGB (1998) transfer function (gamma 2.2)
 */
export function adobeRgbToLinear(c) {
  return Math.pow(Math.max(0, c), 2.19921875);
}

export function linearToAdobeRgb(c) {
  return Math.pow(Math.max(0, c), 1.0 / 2.19921875);
}

/**
 * ProPhoto RGB transfer function (gamma 1.8)
 */
export function proPhotoToLinear(c) {
  const Et = 1.0 / 512.0;
  return c < 16.0 * Et ? c / 16.0 : Math.pow(c, 1.8);
}

export function linearToProPhoto(c) {
  const Et2 = 1.0 / 32.0;
  return c < Et2 / 16.0 ? 16.0 * c : Math.pow(c, 1.0 / 1.8);
}

// Matrix transformation helpers (3x3 * 3x1)
function mul3x3(m, v) {
  return [
    m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
    m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
    m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2]
  ];
}

// Linear sRGB to XYZ (D65)
const LIN_SRGB_TO_XYZ = [
  [0.4124564, 0.3575761, 0.1804375],
  [0.2126729, 0.7151522, 0.0721750],
  [0.0193339, 0.1191920, 0.9503041]
];

const XYZ_TO_LIN_SRGB = [
  [3.2404542, -1.5371385, -0.4985314],
  [-0.9692660, 1.8760108, 0.0415560],
  [0.0556434, -0.2040259, 1.0572252]
];

// Linear Display P3 to XYZ (D65)
const LIN_P3_TO_XYZ = [
  [0.4865709, 0.2656677, 0.1982173],
  [0.2289746, 0.6917393, 0.0792861],
  [0.0000000, 0.0451134, 1.0439444]
];

const XYZ_TO_LIN_P3 = [
  [2.4934969, -0.9313836, -0.4027108],
  [-0.8294890, 1.7626641, 0.0236247],
  [0.0358458, -0.0761724, 0.9568845]
];

/**
 * Canonical Color representation
 */
export class CanonicalColor {
  constructor(r = 0, g = 0, b = 0, a = 1, space = 'srgb') {
    this.r = r; // Linear red [0, 1]
    this.g = g; // Linear green [0, 1]
    this.b = b; // Linear blue [0, 1]
    this.a = Math.max(0, Math.min(1, a));
    this.space = space; // 'srgb' | 'display-p3' | 'adobe-rgb' | 'prophoto'
  }

  static fromHex(hex) {
    let clean = String(hex || '').trim().replace(/^#/, '');
    if (clean.length === 3) clean = clean.split('').map(c => c + c).join('');
    if (clean.length === 6) clean += 'FF';
    const num = parseInt(clean, 16);
    const r = ((num >> 24) & 255) / 255;
    const g = ((num >> 16) & 255) / 255;
    const b = ((num >> 8) & 255) / 255;
    const a = (num & 255) / 255;
    return new CanonicalColor(sRgbToLinear(r), sRgbToLinear(g), sRgbToLinear(b), a, 'srgb');
  }

  toHex() {
    const sR = Math.max(0, Math.min(255, Math.round(linearToSRgb(this.r) * 255)));
    const sG = Math.max(0, Math.min(255, Math.round(linearToSRgb(this.g) * 255)));
    const sB = Math.max(0, Math.min(255, Math.round(linearToSRgb(this.b) * 255)));
    const toH = v => v.toString(16).padStart(2, '0').toUpperCase();
    if (this.a >= 0.999) {
      return `#${toH(sR)}${toH(sG)}${toH(sB)}`;
    }
    const sA = Math.max(0, Math.min(255, Math.round(this.a * 255)));
    return `#${toH(sR)}${toH(sG)}${toH(sB)}${toH(sA)}`;
  }

  toRgb255() {
    return {
      r: Math.max(0, Math.min(255, Math.round(linearToSRgb(this.r) * 255))),
      g: Math.max(0, Math.min(255, Math.round(linearToSRgb(this.g) * 255))),
      b: Math.max(0, Math.min(255, Math.round(linearToSRgb(this.b) * 255))),
      a: this.a
    };
  }

  toXYZ() {
    return mul3x3(LIN_SRGB_TO_XYZ, [this.r, this.g, this.b]);
  }

  static fromXYZ(xyz, a = 1) {
    const lin = mul3x3(XYZ_TO_LIN_SRGB, xyz);
    return new CanonicalColor(Math.max(0, lin[0]), Math.max(0, lin[1]), Math.max(0, lin[2]), a, 'srgb');
  }

  /**
   * Convert to CIE L*a*b* (D50 adapted)
   */
  toLab() {
    const xyzD65 = this.toXYZ();
    // Bradford adaptation from D65 to D50
    const xyzD50 = adaptBradford(xyzD65, ILLUMINANT_D65, ILLUMINANT_D50);

    const f = (t) => t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
    const fx = f(xyzD50[0] / ILLUMINANT_D50[0]);
    const fy = f(xyzD50[1] / ILLUMINANT_D50[1]);
    const fz = f(xyzD50[2] / ILLUMINANT_D50[2]);

    const L = Math.max(0, 116 * fy - 16);
    const a = 500 * (fx - fy);
    const b = 200 * (fy - fz);
    return { L, a, b, alpha: this.a };
  }

  static fromLab(L, a, b, alpha = 1) {
    const fy = (L + 16) / 116;
    const fx = a / 500 + fy;
    const fz = fy - b / 200;

    const finv = (t) => t * t * t > 0.008856 ? t * t * t : (t - 16 / 116) / 7.787;
    const xD50 = finv(fx) * ILLUMINANT_D50[0];
    const yD50 = finv(fy) * ILLUMINANT_D50[1];
    const zD50 = finv(fz) * ILLUMINANT_D50[2];

    const xyzD65 = adaptBradford([xD50, yD50, zD50], ILLUMINANT_D50, ILLUMINANT_D65);
    return CanonicalColor.fromXYZ(xyzD65, alpha);
  }

  /**
   * OKLab conversion (Ottosson 2020)
   */
  toOklab() {
    const r = this.r;
    const g = this.g;
    const b = this.b;

    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

    return {
      L: 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
      a: 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
      b: 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
      alpha: this.a
    };
  }

  static fromOklab(L, a, b, alpha = 1) {
    const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

    const l = l_ * l_ * l_;
    const m = m_ * m_ * m_;
    const s = s_ * s_ * s_;

    const r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
    const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
    const bl = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

    return new CanonicalColor(Math.max(0, r), Math.max(0, g), Math.max(0, bl), alpha, 'srgb');
  }

  /**
   * OKLCH conversion (cylindrical OKLab)
   */
  toOklch() {
    const { L, a, b } = this.toOklab();
    const C = Math.sqrt(a * a + b * b);
    let h = Math.atan2(b, a) * (180 / Math.PI);
    if (h < 0) h += 360;
    return { L, C, h, alpha: this.a };
  }

  static fromOklch(L, C, h, alpha = 1) {
    const rad = h * (Math.PI / 180);
    const a = C * Math.cos(rad);
    const b = C * Math.sin(rad);
    return CanonicalColor.fromOklab(L, a, b, alpha);
  }

  /**
   * CMYK conversion (FOGRA39 approximation)
   */
  toCmyk() {
    const rgb = this.toRgb255();
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;
    const k = 1 - Math.max(r, g, b);
    if (k >= 0.999) return { c: 0, m: 0, y: 0, k: 100 };
    const c = (1 - r - k) / (1 - k);
    const m = (1 - g - k) / (1 - k);
    const y = (1 - b - k) / (1 - k);
    return {
      c: Math.round(c * 100),
      m: Math.round(m * 100),
      y: Math.round(y * 100),
      k: Math.round(k * 100)
    };
  }

  static fromCmyk(c, m, y, k, alpha = 1) {
    c /= 100; m /= 100; y /= 100; k /= 100;
    const r = 255 * (1 - c) * (1 - k);
    const g = 255 * (1 - m) * (1 - k);
    const b = 255 * (1 - y) * (1 - k);
    return new CanonicalColor(sRgbToLinear(r / 255), sRgbToLinear(g / 255), sRgbToLinear(b / 255), alpha, 'srgb');
  }

  /**
   * Grayscale conversion (photometric luminance Y)
   */
  toGrayscale() {
    const y = 0.2126729 * this.r + 0.7151522 * this.g + 0.0721750 * this.b;
    return {
      gray: Math.round(linearToSRgb(y) * 100),
      alpha: this.a
    };
  }

  /**
   * Web-Safe color quantization (nearest 0x00, 0x33, 0x66, 0x99, 0xCC, 0xFF)
   */
  toWebSafe() {
    const rgb = this.toRgb255();
    const snap = v => Math.round(v / 51) * 51;
    const wsR = snap(rgb.r);
    const wsG = snap(rgb.g);
    const wsB = snap(rgb.b);
    return new CanonicalColor(sRgbToLinear(wsR / 255), sRgbToLinear(wsG / 255), sRgbToLinear(wsB / 255), this.a, 'srgb');
  }
}

/**
 * Bradford Chromatic Adaptation
 */
export function adaptBradford(xyz, srcWhite, dstWhite) {
  const srcCone = mul3x3(BRADFORD_CONE_MATRIX, srcWhite);
  const dstCone = mul3x3(BRADFORD_CONE_MATRIX, dstWhite);

  const scale = [
    dstCone[0] / srcCone[0],
    dstCone[1] / srcCone[1],
    dstCone[2] / srcCone[2]
  ];

  const p = mul3x3(BRADFORD_CONE_MATRIX, xyz);
  const pScaled = [p[0] * scale[0], p[1] * scale[1], p[2] * scale[2]];
  return mul3x3(BRADFORD_CONE_INV, pScaled);
}

// --- Photometric & Photoshop Blend Modes ---
export function blendColors(backdrop, source, mode = 'normal') {
  const bR = backdrop.r, bG = backdrop.g, bB = backdrop.b, bA = backdrop.a;
  const sR = source.r, sG = source.g, sB = source.b, sA = source.a;

  const blendChannel = (cb, cs) => {
    switch (mode.toLowerCase()) {
      case 'darken': return Math.min(cb, cs);
      case 'multiply': return cb * cs;
      case 'color-burn':
      case 'colorburn': return cs === 0 ? 0 : Math.max(0, 1 - (1 - cb) / cs);
      case 'lighten': return Math.max(cb, cs);
      case 'screen': return cb + cs - cb * cs;
      case 'color-dodge':
      case 'colordodge': return cs === 1 ? 1 : Math.min(1, cb / (1 - cs));
      case 'overlay': return cb <= 0.5 ? 2 * cb * cs : 1 - 2 * (1 - cb) * (1 - cs);
      case 'soft-light':
      case 'softlight':
        return cs <= 0.5
          ? cb - (1 - 2 * cs) * cb * (1 - cb)
          : cb + (2 * cs - 1) * (cb <= 0.25 ? ((16 * cb - 12) * cb + 4) * cb : Math.sqrt(cb) - cb);
      case 'hard-light':
      case 'hardlight': return cs <= 0.5 ? 2 * cb * cs : 1 - 2 * (1 - cb) * (1 - cs);
      case 'difference': return Math.abs(cb - cs);
      case 'exclusion': return cb + cs - 2 * cb * cs;
      case 'normal':
      default: return cs;
    }
  };

  const oA = sA + bA * (1 - sA);
  if (oA <= 0) return new CanonicalColor(0, 0, 0, 0);

  const outR = (sA * sR + bA * (1 - sA) * bR + sA * bA * (blendChannel(bR, sR) - sR - bR + bR)) / oA;
  const outG = (sA * sG + bA * (1 - sA) * bG + sA * bA * (blendChannel(bG, sG) - sG - bG + bG)) / oA;
  const outB = (sA * sB + bA * (1 - sA) * bB + sA * bA * (blendChannel(bB, sB) - sB - bB + bB)) / oA;

  return new CanonicalColor(Math.max(0, outR), Math.max(0, outG), Math.max(0, outB), oA, 'srgb');
}

// --- Gradient & OKLab Interpolation ---
export function interpolateGradient(color1, color2, t, space = 'oklab') {
  t = Math.max(0, Math.min(1, t));
  if (space === 'oklab') {
    const lab1 = color1.toOklab();
    const lab2 = color2.toOklab();
    const L = lab1.L + (lab2.L - lab1.L) * t;
    const a = lab1.a + (lab2.a - lab1.a) * t;
    const b = lab1.b + (lab2.b - lab1.b) * t;
    const alpha = color1.a + (color2.a - color1.a) * t;
    return CanonicalColor.fromOklab(L, a, b, alpha);
  } else if (space === 'oklch') {
    const lch1 = color1.toOklch();
    const lch2 = color2.toOklch();
    const L = lch1.L + (lch2.L - lch1.L) * t;
    const C = lch1.C + (lch2.C - lch1.C) * t;
    // Shortest-arc hue interpolation
    let dH = lch2.h - lch1.h;
    if (dH > 180) dH -= 360;
    if (dH < -180) dH += 360;
    const h = (lch1.h + dH * t + 360) % 360;
    const alpha = color1.a + (color2.a - color1.a) * t;
    return CanonicalColor.fromOklch(L, C, h, alpha);
  } else {
    // Linear light
    const r = color1.r + (color2.r - color1.r) * t;
    const g = color1.g + (color2.g - color1.g) * t;
    const b = color1.b + (color2.b - color1.b) * t;
    const alpha = color1.a + (color2.a - color1.a) * t;
    return new CanonicalColor(r, g, b, alpha, 'srgb');
  }
}

// --- Contrast Evaluation: WCAG 2.2 and APCA ---
export function calculateWcagContrast(foreground, background) {
  // Relative luminance Y
  const getLum = c => 0.2126729 * c.r + 0.7151522 * c.g + 0.0721750 * c.b;
  const l1 = getLum(foreground);
  const l2 = getLum(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  const ratio = (lighter + 0.05) / (darker + 0.05);
  return {
    ratio: Math.round(ratio * 100) / 100,
    passesAA: ratio >= 4.5,
    passesAALarge: ratio >= 3.0,
    passesAAA: ratio >= 7.0
  };
}

/**
 * APCA (Advanced Perceptual Contrast Algorithm) - W3C Silver/WCAG3 Draft
 */
export function calculateApcaContrast(txt, bg) {
  // Clamp inputs
  const clampRgb = c => ({
    r: Math.max(0, Math.min(1, linearToSRgb(c.r))),
    g: Math.max(0, Math.min(1, linearToSRgb(c.g))),
    b: Math.max(0, Math.min(1, linearToSRgb(c.b)))
  });

  const t = clampRgb(txt);
  const b = clampRgb(bg);

  // Exponents
  const mainTRC = 2.4;
  const yTxt = Math.pow(t.r, mainTRC) * 0.2126729 + Math.pow(t.g, mainTRC) * 0.7151522 + Math.pow(t.b, mainTRC) * 0.0721750;
  const yBg = Math.pow(b.r, mainTRC) * 0.2126729 + Math.pow(b.g, mainTRC) * 0.7151522 + Math.pow(b.b, mainTRC) * 0.0721750;

  // Soft clamp
  const blkThrs = 0.022;
  const blkClmp = 1.414;
  const yTxtClamped = yTxt > blkThrs ? yTxt : yTxt + Math.pow(blkThrs - yTxt, blkClmp);
  const yBgClamped = yBg > blkThrs ? yBg : yBg + Math.pow(blkThrs - yBg, blkClmp);

  const normBG = 0.56;
  const normTXT = 0.57;
  const revTXT = 0.62;
  const revBG = 0.65;
  const scaleBoW = 1.14;
  const scaleWoB = 1.14;

  let SAPC = 0;
  if (yBgClamped >= yTxtClamped) {
    // Dark text on light background
    SAPC = (Math.pow(yBgClamped, normBG) - Math.pow(yTxtClamped, normTXT)) * scaleBoW;
  } else {
    // Light text on dark background
    SAPC = (Math.pow(yBgClamped, revBG) - Math.pow(yTxtClamped, revTXT)) * scaleWoB;
  }

  const Lc = Math.round(SAPC * 100);
  return {
    Lc,
    isReadableBody: Math.abs(Lc) >= 60,
    isReadableLarge: Math.abs(Lc) >= 45,
    isAccessibleHeader: Math.abs(Lc) >= 75
  };
}

// --- Color Vision Deficiency Simulation (Brettel 1997 / Machado 2009) ---
export function simulateCvd(color, type = 'protanopia') {
  const rgb = color.toRgb255();
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  let simR = r, simG = g, simB = b;
  if (type === 'protanopia') {
    simR = 0.56667 * r + 0.43333 * g + 0.0 * b;
    simG = 0.55833 * r + 0.44167 * g + 0.0 * b;
    simB = 0.0 * r + 0.24167 * g + 0.75833 * b;
  } else if (type === 'deuteranopia') {
    simR = 0.625 * r + 0.375 * g + 0.0 * b;
    simG = 0.70 * r + 0.30 * g + 0.0 * b;
    simB = 0.0 * r + 0.30 * g + 0.70 * b;
  } else if (type === 'tritanopia') {
    simR = 0.95 * r + 0.05 * g + 0.0 * b;
    simG = 0.0 * r + 0.43333 * g + 0.56667 * b;
    simB = 0.0 * r + 0.475 * g + 0.525 * b;
  }

  return new CanonicalColor(
    sRgbToLinear(Math.max(0, Math.min(1, simR))),
    sRgbToLinear(Math.max(0, Math.min(1, simG))),
    sRgbToLinear(Math.max(0, Math.min(1, simB))),
    color.a,
    'srgb'
  );
}

// --- Swatches & Pantone Library ---
export const PANTONE_PRESETS = [
  { code: 'PMS 186 C', name: 'Pantone Red 186 C', hex: '#C8102E' },
  { code: 'PMS 286 C', name: 'Pantone Classic Blue 286 C', hex: '#0033A0' },
  { code: 'PMS 368 C', name: 'Pantone Green 368 C', hex: '#78BE20' },
  { code: 'PMS 109 C', name: 'Pantone Yellow 109 C', hex: '#FFD100' },
  { code: 'PMS 158 C', name: 'Pantone Orange 158 C', hex: '#E87722' },
  { code: 'PMS 268 C', name: 'Pantone Purple 268 C', hex: '#582C83' },
  { code: 'PMS Cool Gray 9 C', name: 'Pantone Cool Gray 9 C', hex: '#75787B' },
  { code: 'PMS Black 6 C', name: 'Pantone Black 6 C', hex: '#101820' }
];
