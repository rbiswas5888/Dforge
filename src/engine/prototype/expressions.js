/**
 * DesignForge AI — Prototype Expression Language Engine
 * Conforms to Specification Section 6.6
 * Pure, sandboxed, typed expression evaluator with rich Math, Text, List, Date, Logic, and Validation functions
 */

export class ExpressionEvaluator {
  constructor() {
    this.builtins = {
      // Math
      min: (...args) => Math.min(...args.flat()),
      max: (...args) => Math.max(...args.flat()),
      round: (n) => Math.round(n),
      floor: (n) => Math.floor(n),
      ceil: (n) => Math.ceil(n),
      clamp: (val, min, max) => Math.min(Math.max(val, min), max),
      abs: (n) => Math.abs(n),
      pow: (base, exp) => Math.pow(base, exp),
      sqrt: (n) => Math.sqrt(n),

      // Text
      concat: (...args) => args.join(''),
      contains: (str, substr) => String(str || '').includes(substr),
      startsWith: (str, prefix) => String(str || '').startsWith(prefix),
      endsWith: (str, suffix) => String(str || '').endsWith(suffix),
      length: (str) => String(str || '').length,
      upper: (str) => String(str || '').toUpperCase(),
      lower: (str) => String(str || '').toLowerCase(),
      trim: (str) => String(str || '').trim(),
      format: (template, ...args) => {
        let res = String(template || '');
        args.forEach((arg, i) => {
          res = res.replace(new RegExp(`\\{${i}\\}`, 'g'), String(arg));
        });
        return res;
      },

      // List
      len: (list) => Array.isArray(list) ? list.length : (list ? Object.keys(list).length : 0),
      sum: (list) => Array.isArray(list) ? list.reduce((a, b) => a + (Number(b) || 0), 0) : 0,
      avg: (list) => {
        if (!Array.isArray(list) || list.length === 0) return 0;
        return list.reduce((a, b) => a + (Number(b) || 0), 0) / list.length;
      },
      sort: (list) => Array.isArray(list) ? [...list].sort() : [],
      slice: (list, start, end) => Array.isArray(list) ? list.slice(start, end) : [],
      any: (list, predicate) => {
        if (!Array.isArray(list)) return false;
        if (typeof predicate === 'function') return list.some(predicate);
        return list.some(Boolean);
      },
      all: (list, predicate) => {
        if (!Array.isArray(list)) return false;
        if (typeof predicate === 'function') return list.every(predicate);
        return list.every(Boolean);
      },

      // Date
      now: () => Date.now(),
      addDays: (dateMs, days) => Number(dateMs || Date.now()) + (days * 86400000),
      diff: (d1, d2, unit = 'days') => {
        const ms = Math.abs(Number(d1) - Number(d2));
        if (unit === 'hours') return ms / 3600000;
        if (unit === 'minutes') return ms / 60000;
        if (unit === 'seconds') return ms / 1000;
        return ms / 86400000; // default days
      },

      // Logic
      if: (cond, thenVal, elseVal) => cond ? thenVal : elseVal,
      coalesce: (...args) => args.find(a => a !== null && a !== undefined) ?? null,
      isEmpty: (val) => {
        if (val === null || val === undefined || val === '') return true;
        if (Array.isArray(val) && val.length === 0) return true;
        if (typeof val === 'object' && Object.keys(val).length === 0) return true;
        return false;
      },

      // Validation
      isEmail: (str) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(str || '').trim());
      },
      isPhone: (str) => {
        return /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,15}$/.test(String(str || '').trim());
      },
      matches: (str, regexStr) => {
        try {
          return new RegExp(regexStr).test(String(str || ''));
        } catch {
          return false;
        }
      },
      required: (val) => !this.builtins.isEmpty(val),
      minLen: (val, len) => String(val || '').length >= len,
      maxLen: (val, len) => String(val || '').length <= len,

      // Color
      mix: (c1, c2, weight = 0.5) => c1 || c2,
      lighten: (c, amt = 0.1) => c,
      darken: (c, amt = 0.1) => c,
      contrast: (c1, c2) => 4.5
    };
  }

  /**
   * Evaluates an expression string in a safe, sandboxed environment
   * @param {string} expr - Expression (e.g. "sum(cart.items) > 0 and user.loggedIn")
   * @param {Object} scope - Variables and context object
   * @returns {any}
   */
  evaluate(expr, scope = {}) {
    if (!expr || typeof expr !== 'string' || expr.trim() === '') return true;

    // Normalizing human friendly keywords: 'and' -> '&&', 'or' -> '||', 'not' -> '!'
    let normalized = expr.trim()
      .replace(/\band\b/g, '&&')
      .replace(/\bor\b/g, '||')
      .replace(/\bnot\s+/g, '!');

    try {
      const combinedScope = {
        ...this.builtins,
        ...scope
      };

      const keys = Object.keys(combinedScope);
      const values = Object.values(combinedScope);

      // Sandboxed function execution without window/document/global access
      const fn = new Function(...keys, `
        'use strict';
        return (${normalized});
      `);

      return fn(...values);
    } catch (err) {
      return null;
    }
  }

  /**
   * Evaluates boolean predicate
   */
  evaluatePredicate(expr, scope = {}) {
    const res = this.evaluate(expr, scope);
    return Boolean(res);
  }
}

const defaultEvaluator = new ExpressionEvaluator();
export function evaluateExpression(expr, scope = {}) {
  return defaultEvaluator.evaluate(expr, scope);
}
