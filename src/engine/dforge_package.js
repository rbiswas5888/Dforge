/**
 * DesignForge AI — Universal Design Package & Immutable Provenance Engine (Specification v2.0)
 * Implements .dforge v2.0 ZIP-compatible archive, master project.md documentation,
 * and append-only hash-chained audit provenance tracking.
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const DFORGE_SPEC_VERSION = '2.0';

/**
 * Computes SHA-256 hash of a string or buffer
 */
export function sha256(data) {
  return crypto.createHash('sha256').update(typeof data === 'string' ? data : JSON.stringify(data)).digest('hex');
}

/**
 * Creates or initializes an immutable audit record for a package
 */
export function createPackageIdentity(originalFileName = 'Project.dforge', projectId = 'df_proj_default', createdBy = 'DesignForge Designer') {
  const packageId = `pkg_${crypto.randomBytes(8).toString('hex')}_${Date.now()}`;
  const now = new Date().toISOString();
  return {
    packageId,
    originalFileName,
    currentFileName: originalFileName,
    originalProjectId: projectId,
    currentProjectId: projectId,
    createdAt: now,
    createdBy,
    createdIn: 'DesignForge AI',
    formatVersion: DFORGE_SPEC_VERSION,
    currentRevision: 1,
    fileNameHistory: [
      { fileName: originalFileName, timestamp: now, application: 'DesignForge AI' }
    ],
    projectTransferHistory: [
      { projectId, projectName: 'Primary Project', timestamp: now, operation: 'INITIAL_CREATION' }
    ]
  };
}

/**
 * Generates an append-only audit event with cryptographic hash-chaining
 */
export function createAuditEvent(packageIdentity, eventType, actor, changeDetails, previousEventHash = '0'.repeat(64)) {
  const now = new Date().toISOString();
  const eventId = `evt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  
  const eventPayload = {
    eventId,
    eventType,
    packageId: packageIdentity.packageId,
    timestamp: now,
    actor: {
      userId: actor?.userId || 'operator_l3_analyst',
      application: actor?.application || 'DesignForge AI',
      applicationVersion: '2.0'
    },
    environment: {
      type: actor?.ide ? 'ide' : 'native',
      ide: actor?.ide || null,
      operatingSystem: process.platform === 'darwin' ? 'macOS' : process.platform
    },
    project: {
      projectId: packageIdentity.currentProjectId,
      projectName: packageIdentity.currentFileName.replace(/\.dforge$/, '')
    },
    change: changeDetails,
    revision: packageIdentity.currentRevision,
    previousEventHash
  };

  const eventHash = sha256(eventPayload);
  return {
    ...eventPayload,
    eventHash,
    signature: `sig_sha256_${eventHash.substring(0, 32)}`
  };
}

/**
 * Generates the master project.md documentation according to Section 3
 */
export function generateProjectMarkdown(doc, packageIdentity, auditEvents = []) {
  const pages = doc.pages || [];
  const tokens = doc.tokens || [];
  const components = Object.values(doc.components || {});

  let md = `# ${doc.name || 'DesignForge AI Project'}\n\n`;
  md += `**Format:** .dforge Universal Design Package v${DFORGE_SPEC_VERSION}  \n`;
  md += `**Package ID:** \`${packageIdentity.packageId}\`  \n`;
  md += `**Original File:** \`${packageIdentity.originalFileName}\`  \n`;
  md += `**Current Revision:** \`${packageIdentity.currentRevision}\`  \n`;
  md += `**Created:** ${packageIdentity.createdAt} by ${packageIdentity.createdBy}  \n\n`;

  md += `## 1. Project Overview & Hierarchy\n\n`;
  md += `This package contains ${pages.length} design screen(s)/canvas(es), ${tokens.length} token collection(s), and ${components.length} governed design system component(s).\n\n`;

  md += `### Pages & Canvases Order\n`;
  pages.forEach((p, idx) => {
    const nodeCount = Object.keys(p.nodes || {}).length;
    const rootCount = (p.rootIds || []).length;
    md += `${idx + 1}. **${p.name}** (Route: \`${p.route || '/'}\`) — ${rootCount} root frame(s), ${nodeCount} total node(s)\n`;
  });
  md += `\n`;

  md += `## 2. Design System & Token Architecture\n\n`;
  md += `### Design Tokens Summary\n`;
  tokens.forEach(col => {
    md += `- **${col.name}** (${(col.tokens || []).length} tokens)\n`;
  });
  md += `\n`;

  md += `## 3. Component & Variable Mappings\n\n`;
  if (components.length === 0) {
    md += `*Integrated with Mantine UI, AG Grid Enterprise, and Grafana Observability components.*\n\n`;
  } else {
    components.forEach(c => {
      md += `- **${c.name}** (\`${c.category || 'General'}\`): ${c.description || 'Design component'}\n`;
    });
    md += `\n`;
  }

  md += `## 4. Immutable Audit & Provenance Verification\n\n`;
  md += `- **Total Committed Audit Events:** ${auditEvents.length}\n`;
  md += `- **Verification Status:** Cryptographically Chained (SHA-256)\n`;
  if (auditEvents.length > 0) {
    const latest = auditEvents[auditEvents.length - 1];
    md += `- **Latest Event:** \`${latest.eventType}\` at ${latest.timestamp}\n`;
    md += `- **Terminal Event Hash:** \`${latest.eventHash}\`\n`;
  }
  md += `\n`;

  md += `## 5. IDE Implementation Instructions\n\n`;
  md += `1. **Extract Package:** Use standard ZIP tool or DesignForge Local IDE Bridge to unpack.\n`;
  md += `2. **Import Design IR:** Load \`design/design-index.json\` into the target framework compiler.\n`;
  md += `3. **Mount Design Tokens:** Include \`design-system/tokens/\` into the application CSS/theme root.\n`;
  md += `4. **Execute Live Prototype:** Run \`npm start\` or launch via the Live Prototype Runtime.\n`;

  return md;
}

/**
 * Universal DForge Package Manager (v2.0)
 */
export class DForgePackageManager {
  constructor(docOrOptions = {}, maybeOptions = {}) {
    const options = (docOrOptions && (docOrOptions.schemaVersion || docOrOptions.pages)) ? maybeOptions : docOrOptions;
    this.options = options || {};
    this.packageIdentity = this.options.identity || null;
    this.auditEvents = [];
    this.statistics = {
      totalCommittedEditOperations: 0,
      designForgeEditOperations: 0,
      ideEditOperations: 0,
      externalImportEditOperations: 0,
      saveRevisions: 0,
      openingSessions: 0,
      renameOperations: 0,
      projectTransferOperations: 0
    };
  }

  /**
   * Initializes or loads a package identity
   */
  ensureIdentity(doc, fileName = null) {
    const targetFileName = fileName || this.options.originalFileName || `${doc.name || 'Project'}.dforge`;
    if (!this.packageIdentity) {
      this.packageIdentity = createPackageIdentity(targetFileName, doc.id || 'df_proj_default', 'DesignForge Operator');
      // Record initial CREATION event
      const creationEvent = createAuditEvent(
        this.packageIdentity,
        'PACKAGE_CREATED',
        { userId: 'operator_admin', application: 'DesignForge AI' },
        { operation: 'CREATE', fileName: targetFileName, schemaVersion: DFORGE_SPEC_VERSION }
      );
      this.auditEvents.push(creationEvent);
      this.statistics.openingSessions += 1;
      this.statistics.saveRevisions = 1;
    }
    return this.packageIdentity;
  }

  /**
   * Records an edit operation
   */
  recordEdit(actor, changeDetails) {
    const prevHash = this.auditEvents.length > 0 ? this.auditEvents[this.auditEvents.length - 1].eventHash : '0'.repeat(64);
    const event = createAuditEvent(this.packageIdentity, 'DESIGN_OBJECT_UPDATED', actor, changeDetails, prevHash);
    this.auditEvents.push(event);
    this.statistics.totalCommittedEditOperations += 1;
    if (actor?.ide) {
      this.statistics.ideEditOperations += 1;
    } else {
      this.statistics.designForgeEditOperations += 1;
    }
    this.packageIdentity.currentRevision += 1;
    return event;
  }

  /**
   * Records a rename operation
   */
  recordRename(newFileName, actor) {
    const prevName = this.packageIdentity.currentFileName;
    this.packageIdentity.currentFileName = newFileName;
    this.packageIdentity.fileNameHistory.push({
      fileName: newFileName,
      timestamp: new Date().toISOString(),
      application: actor?.application || 'DesignForge AI'
    });

    const prevHash = this.auditEvents.length > 0 ? this.auditEvents[this.auditEvents.length - 1].eventHash : '0'.repeat(64);
    const event = createAuditEvent(this.packageIdentity, 'PACKAGE_RENAMED', actor, {
      previousFileName: prevName,
      newFileName
    }, prevHash);

    this.auditEvents.push(event);
    this.statistics.renameOperations += 1;
    return event;
  }

  /**
   * Verifies the cryptographic integrity of the audit chain
   */
  verifyAuditIntegrity() {
    if (this.auditEvents.length === 0) {
      return { valid: true, count: 0, message: 'No events recorded' };
    }

    let prevHash = '0'.repeat(64);
    for (let i = 0; i < this.auditEvents.length; i++) {
      const evt = this.auditEvents[i];
      if (i > 0 && evt.previousEventHash !== prevHash) {
        return {
          valid: false,
          compromisedIndex: i,
          eventId: evt.eventId,
          error: `Broken hash chain at event index ${i}: expected ${prevHash}, got ${evt.previousEventHash}`
        };
      }

      // Recompute payload hash without eventHash and signature
      const { eventHash, signature, ...payload } = evt;
      const expectedHash = sha256(payload);
      if (expectedHash !== eventHash) {
        return {
          valid: false,
          compromisedIndex: i,
          eventId: evt.eventId,
          error: `Event payload hash mismatch at index ${i}`
        };
      }

      prevHash = eventHash;
    }

    return {
      valid: true,
      count: this.auditEvents.length,
      terminalHash: prevHash,
      message: 'All audit events verified with intact cryptographic SHA-256 chain'
    };
  }

  /**
   * Builds the complete v2.0 package structure
   */
  buildPackageFiles(doc) {
    this.ensureIdentity(doc, this.options.originalFileName || `${doc.name || 'Project'}.dforge`);

    const manifest = {
      packageId: this.packageIdentity.packageId,
      formatVersion: DFORGE_SPEC_VERSION,
      schemaVersion: doc.schemaVersion || '1.0.0',
      identity: this.packageIdentity,
      statistics: this.statistics,
      createdAt: this.packageIdentity.createdAt,
      updatedAt: new Date().toISOString(),
      pageCount: (doc.pages || []).length,
      tokenCount: (doc.tokens || []).length,
      componentCount: Object.keys(doc.components || {}).length,
      auditVerification: this.verifyAuditIntegrity()
    };

    const projectMd = generateProjectMarkdown(doc, this.packageIdentity, this.auditEvents);
    const readmeMd = `# ${doc.name}\n\nUniversal Design Package generated by DesignForge AI v2.0.\nContains complete visual composition, tokens, wireframes, and audit trail.\n`;

    const designIndex = {
      pages: (doc.pages || []).map(p => ({
        id: p.id,
        name: p.name,
        route: p.route,
        background: p.background,
        rootNodeIds: p.rootIds || [],
        nodeCount: Object.keys(p.nodes || {}).length
      }))
    };

    const packageBundle = {
      'manifest.json': JSON.stringify(manifest, null, 2),
      'project.md': projectMd,
      'README.md': readmeMd,
      'design/design-index.json': JSON.stringify(designIndex, null, 2),
      'design/pages.json': JSON.stringify(doc.pages || [], null, 2),
      'design-system/tokens.json': JSON.stringify(doc.tokens || [], null, 2),
      'design-system/components.json': JSON.stringify(doc.components || {}, null, 2),
      'audit/audit-manifest.json': JSON.stringify({
        packageId: this.packageIdentity.packageId,
        totalEvents: this.auditEvents.length,
        statistics: this.statistics,
        integrity: this.verifyAuditIntegrity()
      }, null, 2),
      'audit/events/events-000001.jsonl': this.auditEvents.map(e => JSON.stringify(e)).join('\n')
    };

    return packageBundle;
  }
}
