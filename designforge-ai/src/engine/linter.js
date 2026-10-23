/**
 * DesignForge AI - Continuous Design System Linter & Token Auto-Binder
 * Inspects document nodes for token drift, non-standard spacing, and hard-coded values,
 * and provides single-click token auto-binding.
 */

// Color distance helper (Euclidean in RGB)
function hexToRgb(hex) {
  if (!hex || typeof hex !== 'string') return null;
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) clean = clean.split('').map(c => c + c).join('');
  if (clean.length < 6) return null;
  const num = parseInt(clean.substring(0, 6), 16);
  if (isNaN(num)) return null;
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

function colorDistance(hexA, hexB) {
  const rgbA = hexToRgb(hexA);
  const rgbB = hexToRgb(hexB);
  if (!rgbA || !rgbB) return 999999;
  return Math.sqrt(
    Math.pow(rgbA.r - rgbB.r, 2) +
    Math.pow(rgbA.g - rgbB.g, 2) +
    Math.pow(rgbA.b - rgbB.b, 2)
  );
}

export class DesignSystemLinter {
  constructor(engine) {
    this.engine = engine;
  }

  getAllTokens() {
    const doc = this.engine.doc;
    const tokens = [];
    if (!doc.tokens) return tokens;
    for (const group of doc.tokens) {
      if (group.tokens) {
        for (const t of group.tokens) {
          tokens.push(t);
        }
      }
    }
    return tokens;
  }

  findClosestColorToken(colorHex, tokens) {
    const colorTokens = tokens.filter(t => t.type === 'color');
    let best = null;
    let minDist = 999999;
    for (const ct of colorTokens) {
      const d = colorDistance(colorHex, ct.value);
      if (d < minDist) {
        minDist = d;
        best = ct;
      }
    }
    return { token: best, distance: minDist };
  }

  findClosestDimensionToken(dimValue, tokens) {
    const dimTokens = tokens.filter(t => t.type === 'dimension');
    let best = null;
    let minDiff = 999999;
    for (const dt of dimTokens) {
      const diff = Math.abs(dimValue - dt.value);
      if (diff < minDiff) {
        minDiff = diff;
        best = dt;
      }
    }
    return { token: best, diff: minDiff };
  }

  /**
   * Scans active page or whole document for design system issues
   */
  lint(pageId = null) {
    const page = pageId ? this.engine.doc.pages.find(p => p.id === pageId) : this.engine.getActivePage();
    if (!page) return { issues: [], summary: { total: 0, errors: 0, warnings: 0 } };

    const tokens = this.getAllTokens();
    const issues = [];

    for (const id in page.nodes) {
      const node = page.nodes[id];
      if (!node) continue;

      // 1. Check Fills for hard-coded colors
      if (node.style?.fills) {
        for (let i = 0; i < node.style.fills.length; i++) {
          const fill = node.style.fills[i];
          if (fill.type === 'solid' && fill.color && !fill.tokenId) {
            const match = this.findClosestColorToken(fill.color, tokens);
            if (match.token) {
              issues.push({
                id: `lint_fill_${node.id}_${i}`,
                nodeId: node.id,
                nodeName: node.name,
                rule: 'token-unbound-color',
                severity: match.distance === 0 ? 'warning' : 'info',
                message: match.distance === 0
                  ? `Color ${fill.color} exactly matches token '${match.token.name}' but is not bound.`
                  : `Hard-coded color ${fill.color}. Suggest binding to nearest token '${match.token.name}' (${match.token.value}).`,
                currentValue: fill.color,
                suggestedToken: match.token,
                fixType: 'fill',
                fillIndex: i
              });
            }
          }
        }
      }

      // 2. Check Auto-Layout Gap against Spacing Tokens
      if (node.layout && node.layout.mode !== 'none' && node.layout.gap > 0) {
        const gap = node.layout.gap;
        const match = this.findClosestDimensionToken(gap, tokens);
        if (match.token && match.diff > 0 && match.diff <= 4) {
          issues.push({
            id: `lint_gap_${node.id}`,
            nodeId: node.id,
            nodeName: node.name,
            rule: 'token-unbound-spacing',
            severity: 'info',
            message: `Gap ${gap}px is off-scale. Nearest spacing token is '${match.token.name}' (${match.token.value}px).`,
            currentValue: gap,
            suggestedToken: match.token,
            fixType: 'gap'
          });
        }
      }

      // 3. Check Corner Radius against Radius Tokens
      if (node.style && typeof node.style.cornerRadius === 'number' && node.style.cornerRadius > 0) {
        const r = node.style.cornerRadius;
        const radiusTokens = tokens.filter(t => t.id && t.id.includes('radius'));
        const match = this.findClosestDimensionToken(r, radiusTokens.length > 0 ? radiusTokens : tokens);
        if (match.token && match.diff > 0 && match.diff <= 3) {
          issues.push({
            id: `lint_radius_${node.id}`,
            nodeId: node.id,
            nodeName: node.name,
            rule: 'token-unbound-radius',
            severity: 'info',
            message: `Corner radius ${r}px is off-scale. Nearest radius token is '${match.token.name}' (${match.token.value}px).`,
            currentValue: r,
            suggestedToken: match.token,
            fixType: 'radius'
          });
        }
      }
    }

    const summary = {
      total: issues.length,
      warnings: issues.filter(i => i.severity === 'warning').length,
      info: issues.filter(i => i.severity === 'info').length
    };

    return { issues, summary };
  }

  /**
   * Applies auto-binding fix to all detected issues in a single transaction
   */
  autoBindAll(issues) {
    if (!issues || issues.length === 0) return 0;
    let fixedCount = 0;

    for (const issue of issues) {
      const node = this.engine.getNode(issue.nodeId);
      if (!node) continue;

      if (issue.fixType === 'fill' && issue.suggestedToken) {
        const newFills = JSON.parse(JSON.stringify(node.style?.fills || []));
        if (newFills[issue.fillIndex]) {
          newFills[issue.fillIndex].color = issue.suggestedToken.value;
          newFills[issue.fillIndex].tokenId = issue.suggestedToken.id;
          newFills[issue.fillIndex].tokenName = issue.suggestedToken.name;
          this.engine.updateNode(node.id, { style: { fills: newFills } }, 'Bind fill to token');
          fixedCount++;
        }
      } else if (issue.fixType === 'gap' && issue.suggestedToken) {
        this.engine.updateNode(node.id, { layout: { gap: issue.suggestedToken.value } }, 'Bind gap to token');
        fixedCount++;
      } else if (issue.fixType === 'radius' && issue.suggestedToken) {
        this.engine.updateNode(node.id, { style: { cornerRadius: issue.suggestedToken.value } }, 'Bind radius to token');
        fixedCount++;
      }
    }

    return fixedCount;
  }
}
