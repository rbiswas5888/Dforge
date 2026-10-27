/**
 * DesignForge AI — Desktop-Grade Inspector Ergonomics & Input Physics
 * - Scrubby Number Inputs (ew-resize, Shift 10x, Alt 0.1x)
 * - Inline Mathematical Expression Evaluator (supports arithmetic and +20% / -10% relative percentages)
 * - Layout Grids & Guides Engine
 */

export class MathExpressionEvaluator {
  /**
   * Parse and evaluate an inline math expression
   * Supports: "240+32", "100/3", "50 * 2.5", "+20%", "-10%"
   */
  static evaluate(inputStr, currentValue = 0) {
    if (typeof inputStr === 'number') return inputStr;
    if (!inputStr || typeof inputStr !== 'string') return currentValue;

    const trimmed = inputStr.trim();

    // Check for relative percentage: "+20%" or "-15%"
    const relPercentMatch = trimmed.match(/^([+-])\s*(\d+(?:\.\d+)?)\s*%$/);
    if (relPercentMatch) {
      const sign = relPercentMatch[1] === '+' ? 1 : -1;
      const pct = parseFloat(relPercentMatch[2]) / 100;
      return currentValue + sign * (currentValue * pct);
    }

    // Check for direct percentage: "50%"
    const directPercentMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*%$/);
    if (directPercentMatch) {
      return (parseFloat(directPercentMatch[1]) / 100) * currentValue;
    }

    // Clean arithmetic string
    const sanitized = trimmed.replace(/[^0-9.+\-*/() ]/g, '');
    if (!sanitized) return currentValue;

    try {
      // Safe arithmetic evaluator
      const fn = new Function(`"use strict"; return (${sanitized});`);
      const res = fn();
      if (typeof res === 'number' && !isNaN(res) && isFinite(res)) {
        return Math.round(res * 100) / 100;
      }
      return currentValue;
    } catch {
      return currentValue;
    }
  }
}

export class ScrubbyInputController {
  /**
   * Calculate incremental value delta from mouse movement
   */
  static calculateDelta(pixelDeltaX, { shiftKey = false, altKey = false, baseStep = 1 } = {}) {
    let multiplier = baseStep;
    if (shiftKey) multiplier *= 10;
    if (altKey) multiplier *= 0.1;

    // 1 step per 3 pixels of drag
    const steps = pixelDeltaX / 3;
    return steps * multiplier;
  }
}

export class LayoutGridsAndGuides {
  constructor() {
    this.horizontalGuides = []; // [y1, y2, ...]
    this.verticalGuides = []; // [x1, x2, ...]
    this.grids = []; // [{ type: 'COLUMNS'|'ROWS'|'GRID', count: 12, gutter: 16, margin: 20, color: 'rgba(255,0,0,0.1)' }]
  }

  addGuide(orientation, position) {
    if (orientation === 'H') {
      this.horizontalGuides.push(position);
      this.horizontalGuides.sort((a, b) => a - b);
    } else {
      this.verticalGuides.push(position);
      this.verticalGuides.sort((a, b) => a - b);
    }
  }

  removeGuide(orientation, index) {
    if (orientation === 'H' && index >= 0 && index < this.horizontalGuides.length) {
      this.horizontalGuides.splice(index, 1);
    } else if (orientation === 'V' && index >= 0 && index < this.verticalGuides.length) {
      this.verticalGuides.splice(index, 1);
    }
  }
}
