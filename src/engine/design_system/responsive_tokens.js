/**
 * DesignForge AI — Unified Design System Subsystem
 * Responsive Token Adaptation Engine (Desktop -> Tablet/Mobile)
 * Conforms to Master Specification Section 10
 */

import { TOKEN_CATEGORIES } from './types.js';

export class ResponsiveTokenEngine {
  constructor(registry) {
    this.registry = registry;
  }

  /**
   * Generates tablet and mobile adaptations for an existing token collection
   */
  generateResponsiveAdaptations(options = {}) {
    const {
      targetDevices = ['tablet', 'mobile'], // 'tablet', 'mobile'
      categories = [TOKEN_CATEGORIES.TYPOGRAPHY, TOKEN_CATEGORIES.SPACING, TOKEN_CATEGORIES.GRID, TOKEN_CATEGORIES.DIMENSION],
      breakpoints = {
        desktop: { min: 1025 },
        tablet: { min: 768, max: 1024 },
        mobile: { max: 767 }
      }
    } = options;

    const sourceTokens = Object.values(this.registry.system.tokens);
    const adaptations = [];

    for (const token of sourceTokens) {
      if (!categories.includes(token.category)) continue;

      const adaptation = {
        tokenId: token.id,
        name: token.name,
        category: token.category,
        desktopValue: token.value,
        tabletValue: token.value,
        mobileValue: token.value,
        hasChanged: false
      };

      // 1. Spacing Adaptation (reduce by 20-30% on tablet, 35-50% on mobile for larger units)
      if (token.category === TOKEN_CATEGORIES.SPACING) {
        const numVal = parseFloat(token.value);
        if (!isNaN(numVal) && numVal >= 24) {
          if (targetDevices.includes('tablet')) {
            adaptation.tabletValue = Math.max(16, Math.round(numVal * 0.75));
          }
          if (targetDevices.includes('mobile')) {
            adaptation.mobileValue = Math.max(12, Math.round(numVal * 0.5));
          }
          adaptation.hasChanged = true;
        }
      }

      // 2. Typography Heading Sizing Adaptation
      if (token.category === TOKEN_CATEGORIES.TYPOGRAPHY && token.name.includes('heading')) {
        const match = String(token.value).match(/([0-9.]+)(px)?/);
        if (match) {
          const size = parseFloat(match[1]);
          if (size >= 28) {
            if (targetDevices.includes('tablet')) {
              adaptation.tabletValue = `${Math.round(size * 0.85)}px`;
            }
            if (targetDevices.includes('mobile')) {
              adaptation.mobileValue = `${Math.round(size * 0.7)}px`;
            }
            adaptation.hasChanged = true;
          }
        }
      }

      // 3. Grid / Layout padding
      if (token.category === TOKEN_CATEGORIES.GRID || token.name.includes('padding') || token.name.includes('page')) {
        const numVal = parseFloat(token.value);
        if (!isNaN(numVal) && numVal >= 32) {
          if (targetDevices.includes('tablet')) adaptation.tabletValue = 24;
          if (targetDevices.includes('mobile')) adaptation.mobileValue = 16;
          adaptation.hasChanged = true;
        }
      }

      if (adaptation.hasChanged) {
        adaptations.push(adaptation);
      }
    }

    return {
      breakpoints,
      targetDevices,
      adaptations,
      cssPreview: this.generateResponsiveCss(adaptations, breakpoints)
    };
  }

  /**
   * Applies approved responsive overrides to tokens in the registry
   */
  commitResponsiveOverrides(adaptations) {
    let appliedCount = 0;
    for (const ad of adaptations) {
      const token = this.registry.system.tokens[ad.tokenId];
      if (!token) continue;

      token.responsiveOverrides = token.responsiveOverrides || {};
      if (ad.tabletValue !== ad.desktopValue) {
        token.responsiveOverrides.tablet = ad.tabletValue;
      }
      if (ad.mobileValue !== ad.desktopValue) {
        token.responsiveOverrides.mobile = ad.mobileValue;
      }
      appliedCount++;
    }

    this.registry.persist();
    return { success: true, appliedCount };
  }

  /**
   * Generates clean CSS media query code conforming to Section 10
   */
  generateResponsiveCss(adaptations, breakpoints) {
    const desktopLines = [':root {'];
    const tabletLines = [`@media (max-width: ${breakpoints.tablet.max || 1024}px) {`, '  :root {'];
    const mobileLines = [`@media (max-width: ${breakpoints.mobile.max || 767}px) {`, '  :root {'];

    for (const ad of adaptations) {
      const varName = `--${ad.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      const format = (v) => typeof v === 'number' ? `${v}px` : v;

      desktopLines.push(`  ${varName}: ${format(ad.desktopValue)};`);
      if (ad.tabletValue !== ad.desktopValue) {
        tabletLines.push(`    ${varName}: ${format(ad.tabletValue)};`);
      }
      if (ad.mobileValue !== ad.desktopValue) {
        mobileLines.push(`    ${varName}: ${format(ad.mobileValue)};`);
      }
    }

    desktopLines.push('}');
    tabletLines.push('  }', '}');
    mobileLines.push('  }', '}');

    return [
      '/**',
      ' * DesignForge AI — Responsive Design Tokens (CSS Media Queries)',
      ' */',
      desktopLines.join('\n'),
      '',
      tabletLines.join('\n'),
      '',
      mobileLines.join('\n')
    ].join('\n');
  }
}
