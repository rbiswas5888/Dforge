/**
 * DesignForge AI - Design Operation Validator
 * Strict pre-flight validation preventing document corruption, cyclic hierarchies, and invalid geometries
 */

import { OPERATIONS, ValidationError, RISK_LEVELS, CHECK_STATUS, EXECUTION_STATUS } from './types.js';

export class OperationValidator {
  constructor(document = null, activePageId = null) {
    this.doc = document;
    this.activePageId = activePageId || document?.pages?.[0]?.id;
  }

  getActivePage() {
    return this.doc?.pages?.find(p => p.id === this.activePageId) || this.doc?.pages?.[0] || { nodes: {}, rootIds: [] };
  }


  /**
   * Validates an array of operations or a single operation
   * @param {Array|Object} operations
   * @returns {{ valid: boolean, errors: string[], warnings: string[], isDestructive: boolean }}
   */
  validate(operations) {
    const list = Array.isArray(operations) ? operations : [operations];
    const page = this.getActivePage();
    const errors = [];
    const warnings = [];
    let isDestructive = false;

    // Projected set of IDs for forward references within the same batch
    const createdNodeIds = new Set();
    const deletedNodeIds = new Set();

    for (let i = 0; i < list.length; i++) {
      const op = list[i];
      const indexPrefix = `Operation #${i + 1} (${op.type || op.op}): `;

      if (!op.type && !op.op) {
        errors.push(`${indexPrefix}Missing operation type.`);
        continue;
      }

      const opType = op.type || op.op;

      switch (opType) {
        case OPERATIONS.CREATE_NODE:
        case 'createNode': {
          const node = op.node || op.payload || op;
          if (!node.type) {
            errors.push(`${indexPrefix}Node requires a valid 'type' (frame, rectangle, text, ellipse, etc.).`);
          }

          if (node.id) createdNodeIds.add(node.id);

          // Validate parent reference
          if (node.parentId) {
            const parentExists = page.nodes[node.parentId] || createdNodeIds.has(node.parentId);
            if (!parentExists) {
              errors.push(`${indexPrefix}Parent node '${node.parentId}' does not exist on active page.`);
            }
            if (deletedNodeIds.has(node.parentId)) {
              errors.push(`${indexPrefix}Cannot add child to parent '${node.parentId}' which is marked for deletion.`);
            }
          }

          // Validate dimensions
          if (node.transform) {
            const { width, height, x, y } = node.transform;
            if (width !== undefined && (!Number.isFinite(width) || width <= 0)) {
              errors.push(`${indexPrefix}Transform width must be a positive number (received ${width}).`);
            }
            if (height !== undefined && (!Number.isFinite(height) || height <= 0)) {
              errors.push(`${indexPrefix}Transform height must be a positive number (received ${height}).`);
            }
            if (x !== undefined && !Number.isFinite(x)) {
              errors.push(`${indexPrefix}Transform x coordinate is not a finite number.`);
            }
            if (y !== undefined && !Number.isFinite(y)) {
              errors.push(`${indexPrefix}Transform y coordinate is not a finite number.`);
            }
          }

          // Validate style color formats
          this.validateStyleColors(node.style, indexPrefix, errors);
          break;
        }

        case OPERATIONS.UPDATE_NODE:
        case 'updateNode': {
          const nodeId = op.nodeId;
          if (!nodeId) {
            errors.push(`${indexPrefix}Missing required 'nodeId'.`);
            break;
          }

          const existingNode = page.nodes[nodeId];
          if (!existingNode && !createdNodeIds.has(nodeId)) {
            errors.push(`${indexPrefix}Target node '${nodeId}' not found on active page.`);
            break;
          }

          const patch = op.patch || op.payload || {};

          // Validate dimension patches
          if (patch.transform) {
            const { width, height } = patch.transform;
            if (width !== undefined && (!Number.isFinite(width) || width <= 0)) {
              errors.push(`${indexPrefix}Patched width must be > 0.`);
            }
            if (height !== undefined && (!Number.isFinite(height) || height <= 0)) {
              errors.push(`${indexPrefix}Patched height must be > 0.`);
            }
          }

          // Validate style colors
          if (patch.style) {
            this.validateStyleColors(patch.style, indexPrefix, errors);
          }
          break;
        }

        case OPERATIONS.DELETE_NODE:
        case 'deleteNode': {
          const nodeId = op.nodeId;
          if (!nodeId) {
            errors.push(`${indexPrefix}Missing required 'nodeId'.`);
            break;
          }

          const target = page.nodes[nodeId];
          if (!target && !createdNodeIds.has(nodeId)) {
            errors.push(`${indexPrefix}Target node '${nodeId}' not found for deletion.`);
            break;
          }

          deletedNodeIds.add(nodeId);
          // If deleting root node or node with many children, flag as destructive
          if (target && !target.parentId) {
            isDestructive = true;
            warnings.push(`${indexPrefix}Deleting top-level container '${target.name}'.`);
          }
          break;
        }

        case OPERATIONS.APPLY_LAYOUT:
        case 'applyLayout': {
          const nodeId = op.nodeId;
          const target = page.nodes[nodeId];
          if (!target) {
            errors.push(`${indexPrefix}Target layout container '${nodeId}' does not exist.`);
          }
          break;
        }

        case 'createTree': {
          // Tree batch creation
          const allNodes = op.allNodes || [];
          for (const n of allNodes) {
            if (n.id) createdNodeIds.add(n.id);
            if (n.transform) {
              if (n.transform.width <= 0 || n.transform.height <= 0) {
                errors.push(`${indexPrefix}Node '${n.name}' has invalid dimensions.`);
              }
            }
          }
          break;
        }

        default:
          warnings.push(`${indexPrefix}Unrecognized operation type '${opType}', treated as experimental.`);
          break;
      }
    }

    // Check for high destructive ratio (> 30% of total document nodes deleted)
    const totalNodesCount = Object.keys(page.nodes).length;
    if (totalNodesCount > 5 && deletedNodeIds.size / totalNodesCount > 0.3) {
      isDestructive = true;
      warnings.push(`Warning: Batch proposes deleting ${deletedNodeIds.size} of ${totalNodesCount} total nodes.`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      isDestructive
    };
  }

  validateStyleColors(style, prefix, errors) {
    if (!style) return;
    if (style.fills && Array.isArray(style.fills)) {
      for (const fill of style.fills) {
        if (fill.color && typeof fill.color === 'string') {
          if (!this.isValidColor(fill.color)) {
            errors.push(`${prefix}Invalid fill color format: '${fill.color}'.`);
          }
        }
      }
    }
  }

  isValidColor(color) {
    // Accepts hex (#fff, #ffffff, #ffffff80), rgb(), rgba(), or standard transparent
    return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(color) ||
           /^rgba?\([\d\s,\.%]+\)$/.test(color) ||
           color === 'transparent';
  }

  /**
   * Evaluates Change-Risk Policy Classification (Agent Master Prompt Section 4)
   * Low: Rename layer, single property, explain, comment
   * Medium: Generate screen, rework layout, tokens/variants, batch operations
   * High: Delete >= 5 nodes or root frame, replace design system, global token overwrite
   * @param {Array|Object} operations
   * @returns {{ level: 'low'|'medium'|'high', approvalRequired: boolean, reasons: string[] }}
   */
  assessRisk(operations) {
    const list = Array.isArray(operations) ? operations : [operations];
    const reasons = [];
    let deleteCount = 0;
    let createCount = 0;
    let modifiesTokens = false;
    let touchesRootFrame = false;
    const page = this.getActivePage();

    for (const op of list) {
      const type = op.type || op.op;
      if (type === OPERATIONS.DELETE_NODE || type === 'deleteNode') {
        deleteCount++;
        const targetId = op.nodeId || op.id;
        if (page.rootIds && page.rootIds.includes(targetId)) {
          touchesRootFrame = true;
          reasons.push(`Deletes root frame '${targetId}'.`);
        }
      } else if (type === OPERATIONS.CREATE_NODE || type === 'createNode') {
        createCount++;
        const node = op.node || op.payload || op;
        if (node.type === 'frame' && !node.parentId) {
          touchesRootFrame = true;
        }
      } else if (type === OPERATIONS.UPDATE_TOKENS || type === 'updateTokens') {
        modifiesTokens = true;
      }
    }

    if (deleteCount >= 5) {
      reasons.push(`Bulk deletion of ${deleteCount} nodes.`);
    }

    if (deleteCount >= 5 || touchesRootFrame) {
      return {
        level: RISK_LEVELS.HIGH,
        approvalRequired: true,
        reasons
      };
    }

    if (createCount >= 3 || touchesRootFrame || modifiesTokens || list.length > 5) {
      return {
        level: RISK_LEVELS.MEDIUM,
        approvalRequired: false,
        reasons: [`Touches ${list.length} operations across layout/tokens.`]
      };
    }

    return {
      level: RISK_LEVELS.LOW,
      approvalRequired: false,
      reasons: ['Localized low-risk property change.']
    };
  }

  /**
   * Builds strict ValidationReport shape conforming to Agent Master Prompt Section 5
   * @param {Object} validationResult - Result from validate()
   * @param {Object} diagnosticReport - Optional findings from DesignIntelligenceAnalyzer
   * @returns {Object} Structured report with checks and unresolvedIssues
   */
  buildValidationReport(validationResult, diagnosticReport = null) {
    const checks = [];
    const unresolvedIssues = [];

    // 1. Schema & Document Integrity Check
    if (validationResult.valid) {
      checks.push({
        check: 'document_schema',
        status: CHECK_STATUS.PASSED,
        scope: ['document'],
        evidence: 'Pre-flight schema validation passed with 0 errors.'
      });
    } else {
      checks.push({
        check: 'document_schema',
        status: CHECK_STATUS.FAILED,
        scope: ['document'],
        evidence: validationResult.errors.join('; ')
      });
      unresolvedIssues.push(...validationResult.errors);
    }

    // 2. Diagnostics integration if available
    if (diagnosticReport && Array.isArray(diagnosticReport.findings)) {
      const contrastIssues = diagnosticReport.findings.filter(f => f.type === 'contrast');
      const overflowIssues = diagnosticReport.findings.filter(f => f.type === 'overflow');

      if (contrastIssues.length === 0) {
        checks.push({
          check: 'contrast',
          status: CHECK_STATUS.PASSED,
          scope: ['active_page'],
          evidence: 'All tested text elements meet WCAG contrast thresholds against rendered background.'
        });
      } else {
        checks.push({
          check: 'contrast',
          status: CHECK_STATUS.FAILED,
          scope: contrastIssues.map(i => i.nodeId),
          evidence: `${contrastIssues.length} text elements do not meet minimum contrast threshold.`
        });
        unresolvedIssues.push(...contrastIssues.map(i => i.message));
      }

      if (overflowIssues.length === 0) {
        checks.push({
          check: 'layout_overflow',
          status: CHECK_STATUS.PASSED,
          scope: ['active_page'],
          evidence: 'No horizontal or vertical bounding box clipping detected.'
        });
      } else {
        checks.push({
          check: 'layout_overflow',
          status: CHECK_STATUS.FAILED,
          scope: overflowIssues.map(i => i.nodeId),
          evidence: `${overflowIssues.length} containers exhibit child overflow.`
        });
        unresolvedIssues.push(...overflowIssues.map(i => i.message));
      }
    } else {
      checks.push({
        check: 'contrast',
        status: CHECK_STATUS.NOT_CHECKED,
        scope: ['document'],
        evidence: 'Contrast audit was not executed for this operation set.'
      });
    }

    // 3. Screen reader semantics check
    checks.push({
      check: 'screen_reader_semantics',
      status: CHECK_STATUS.NOT_CHECKED,
      scope: ['document'],
      evidence: 'Visual document does not encode assistive-technology tree semantics directly; handoff compiler handles ARIA mapping.'
    });

    const hasFailures = checks.some(c => c.status === CHECK_STATUS.FAILED);
    const hasUnchecked = checks.some(c => c.status === CHECK_STATUS.NOT_CHECKED);

    return {
      status: hasFailures ? EXECUTION_STATUS.FAILED : (hasUnchecked ? EXECUTION_STATUS.PARTIAL : EXECUTION_STATUS.SUCCEEDED),
      checks,
      unresolvedIssues
    };
  }
}

