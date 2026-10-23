/**
 * DesignForge AI — Typography, OpenType & Text Engine
 * - Advanced typography controls (weight, size, line-height, letter/paragraph spacing, case, decoration)
 * - OpenType Feature Flags (liga, tnum, frac, stylistic alternates)
 * - Auto-resizing modes (Auto Width, Auto Height, Fixed Size)
 * - Styled range overrides
 */

export const TextAutoResize = {
  AUTO_WIDTH: 'AUTO_WIDTH',
  AUTO_HEIGHT: 'AUTO_HEIGHT',
  FIXED: 'FIXED'
};

export const TextCase = {
  ORIGINAL: 'ORIGINAL',
  UPPER: 'UPPER',
  LOWER: 'LOWER',
  TITLE: 'TITLE'
};

export class TypographyEngine {
  /**
   * Format OpenType feature settings into CSS string
   * e.g. { liga: true, tnum: true, frac: false } -> '"liga" 1, "tnum" 1, "frac" 0'
   */
  static formatOpenTypeFeatures(features = {}) {
    const parts = [];
    for (const [tag, enabled] of Object.entries(features)) {
      parts.push(`"${tag}" ${enabled ? 1 : 0}`);
    }
    return parts.join(', ') || 'normal';
  }

  /**
   * Transform text case according to mode
   */
  static applyTextCase(text, mode = TextCase.ORIGINAL) {
    if (!text) return '';
    switch (mode) {
      case TextCase.UPPER:
        return text.toUpperCase();
      case TextCase.LOWER:
        return text.toLowerCase();
      case TextCase.TITLE:
        return text.replace(/\b\w/g, c => c.toUpperCase());
      default:
        return text;
    }
  }

  /**
   * Measure text dimensions using standard Canvas 2D measurement
   */
  static measureText(text, { fontFamily = 'Inter, sans-serif', fontSize = 16, fontWeight = '400', letterSpacing = 0, lineHeight = 1.4 } = {}, canvasCtx = null) {
    let ctx = canvasCtx;
    if (!ctx && typeof document !== 'undefined') {
      const c = document.createElement('canvas');
      ctx = c.getContext('2d');
    }
    if (!ctx) {
      // Headless fallback estimate
      const charWidth = fontSize * 0.6;
      return {
        width: (text.length * charWidth) + (text.length * letterSpacing),
        height: fontSize * lineHeight
      };
    }

    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    const metrics = ctx.measureText(text);
    const measuredWidth = metrics.width + (text.length * letterSpacing);
    const calculatedHeight = fontSize * lineHeight;

    return {
      width: Math.ceil(measuredWidth),
      height: Math.ceil(calculatedHeight)
    };
  }
}
