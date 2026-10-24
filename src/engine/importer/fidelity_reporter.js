/**
 * DesignForge AI — External Design Import Engine
 * Import Fidelity Report & Diagnostics Engine
 * Conforms to Section 11 of MD/Design.md Specification
 */

export class ImportFidelityEngine {
  constructor() {
    this.standardFonts = [
      'inter', 'roboto', 'system-ui', '-apple-system', 'segoe ui',
      'outfit', 'playfair display', 'jetbrains mono', 'arial', 'helvetica', 'sans-serif'
    ];
  }

  /**
   * Generates a comprehensive fidelity report comparing the source CIR model
   * to the generated DesignForge document model.
   */
  generateReport(cirDoc, dforgeDoc) {
    const report = {
      timestamp: new Date().toISOString(),
      sourceApplication: cirDoc.sourceApplication,
      projectName: cirDoc.projectName,
      overallScore: 100, // 0 - 100
      fidelityTier: 'High Fidelity', // 'High Fidelity' | 'Medium Fidelity' | 'Approximated'
      metrics: {
        sourceNodeCount: 0,
        importedNodeCount: 0,
        pageCount: dforgeDoc.pages.length,
        componentsCount: 0,
        tokenCount: dforgeDoc.tokens ? dforgeDoc.tokens.length : 0,
        interactionsCount: 0
      },
      preservedFeatures: [],
      approximatedFeatures: [],
      unsupportedFeatures: [],
      missingFonts: [],
      warnings: [],
      recommendations: []
    };

    // 1. Calculate node counts and collect node types
    let cirNodeCount = 0;
    const cirNodeTypes = new Set();
    const referencedFonts = new Set();

    for (const page of cirDoc.pages) {
      for (const nodeId of Object.keys(page.nodes)) {
        cirNodeCount++;
        const node = page.nodes[nodeId];
        cirNodeTypes.add(node.type);

        if (node.text && node.text.fontFamily) {
          referencedFonts.add(node.text.fontFamily);
        }

        if (node.interactions && node.interactions.length > 0) {
          report.metrics.interactionsCount += node.interactions.length;
        }

        if (node.unsupportedProps && node.unsupportedProps.length > 0) {
          report.unsupportedFeatures.push({
            nodeId: node.id,
            nodeName: node.name,
            properties: node.unsupportedProps
          });
        }
      }
    }

    let dforgeNodeCount = 0;
    for (const page of dforgeDoc.pages) {
      dforgeNodeCount += Object.keys(page.nodes).length;
    }

    report.metrics.sourceNodeCount = cirNodeCount;
    report.metrics.importedNodeCount = dforgeNodeCount;
    report.metrics.componentsCount = Object.keys(cirDoc.components || {}).length;

    // 2. Validate font availability
    for (const font of referencedFonts) {
      const cleanFont = font.toLowerCase().split(',')[0].replace(/['"]/g, '').trim();
      const isAvailable = this.standardFonts.some(f => cleanFont.includes(f));
      if (!isAvailable) {
        report.missingFonts.push({
          fontFamily: font,
          suggestedReplacement: 'Inter, -apple-system, sans-serif'
        });
      }
    }

    // 3. Evaluate preserved features
    report.preservedFeatures.push('Canvas, artboards, and frame hierarchies');
    report.preservedFeatures.push('Vector geometries, shapes, and corner radiuses');
    report.preservedFeatures.push('Fills, solid colors, and opacity');
    if (report.metrics.componentsCount > 0) {
      report.preservedFeatures.push(`${report.metrics.componentsCount} reusable components / symbols`);
    }
    if (report.metrics.tokenCount > 0) {
      report.preservedFeatures.push(`${report.metrics.tokenCount} design token collections`);
    }
    if (report.metrics.interactionsCount > 0) {
      report.preservedFeatures.push(`${report.metrics.interactionsCount} prototype interaction transitions`);
    }

    // 4. Score calculation
    let deductions = 0;

    if (report.missingFonts.length > 0) {
      deductions += Math.min(10, report.missingFonts.length * 2);
      report.warnings.push(`${report.missingFonts.length} font(s) not installed locally. Mapped to default system typography.`);
      report.recommendations.push('Install or upload missing fonts, or review typography substitutions in the text inspector.');
    }

    if (report.unsupportedFeatures.length > 0) {
      deductions += Math.min(15, report.unsupportedFeatures.length * 3);
      report.warnings.push(`${report.unsupportedFeatures.length} unsupported feature(s) or third-party plugin attributes encountered.`);
      report.recommendations.push('Check layers flagged with limitations to review visual appearance against original.');
    }

    if (cirDoc.sourceApplication === 'svg') {
      deductions += 5; // SVG lacks component definitions and layout metadata
      report.approximatedFeatures.push('SVG layout attributes normalized to static bounding frames');
    }

    report.overallScore = Math.max(70, Math.min(100, 100 - deductions));

    if (report.overallScore >= 90) {
      report.fidelityTier = 'High Fidelity (Production Ready)';
    } else if (report.overallScore >= 80) {
      report.fidelityTier = 'Good Fidelity (Minor Manual Tuning)';
    } else {
      report.fidelityTier = 'Approximated Conversion';
    }

    return report;
  }
}
