/**
 * Test Suite: Universal Design Package (.dforge v2.0), IDE Mapping & DXP Runtime Extensions
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  createInitialDocument,
  createNode,
  createPage
} from '../src/engine/document.js';
import { CommandEngine } from '../src/engine/commands.js';
import {
  DForgePackageManager,
  createDForgeAuditHistory,
  appendDForgeAuditEvent,
  verifyDForgeAuditChain
} from '../src/engine/dforge_package.js';
import {
  IDEDiscoveryEngine,
  DesignMappingEngine,
  PrototypeTransferEngine,
  DxpPackageManager
} from '../src/engine/ide_mapping.js';
import { DesignMcpServer } from '../src/mcp/server/design_server.js';
import { MCP_PERMISSIONS } from '../src/mcp/protocol/types.js';

describe('Universal Design Package (.dforge v2.0) & Provenance', () => {
  it('initializes audit history and generates valid cryptographic SHA-256 chain', () => {
    const doc = createInitialDocument('Audit Test Doc');
    const history = createDForgeAuditHistory(doc, { user: 'Test Operator', initialAction: 'DOCUMENT_CREATED' });

    assert.strictEqual(history.events.length, 1);
    assert.strictEqual(history.events[0].action, 'DOCUMENT_CREATED');
    assert.ok(history.events[0].eventHash);
    assert.strictEqual(history.events[0].prevHash, '0000000000000000000000000000000000000000000000000000000000000000');

    // Append second event
    const secondEvent = appendDForgeAuditEvent(history, {
      action: 'TOKENS_MODIFIED',
      user: 'Test Operator',
      details: 'Added Mantine color tokens'
    });

    assert.strictEqual(history.events.length, 2);
    assert.strictEqual(secondEvent.prevHash, history.events[0].eventHash);

    // Verify chain integrity
    const verification = verifyDForgeAuditChain(history);
    assert.strictEqual(verification.valid, true);
    assert.strictEqual(verification.totalEvents, 2);
    assert.strictEqual(verification.terminalHash, secondEvent.eventHash);
  });

  it('detects tampering in the cryptographic audit trail', () => {
    const doc = createInitialDocument('Tamper Test Doc');
    const history = createDForgeAuditHistory(doc);
    appendDForgeAuditEvent(history, { action: 'NODE_ADDED', user: 'Attacker' });

    // Tamper with first event details
    history.events[0].user = 'Impersonated User';
    const verification = verifyDForgeAuditChain(history);

    assert.strictEqual(verification.valid, false);
    assert.strictEqual(verification.compromisedAtEventIndex, 0);
  });

  it('preserves packageId permanence and produces complete .dforge v2.0 manifest and project.md', () => {
    const doc = createInitialDocument('Mission Control');
    const manager = new DForgePackageManager(doc, { originalFileName: 'mission_control.dforge' });
    const pkg1 = manager.exportPackage();

    assert.ok(pkg1['manifest.json']);
    assert.ok(pkg1['project.md']);
    assert.ok(pkg1['audit/history.json']);

    const manifest1 = JSON.parse(pkg1['manifest.json']);
    assert.strictEqual(manifest1.packageFormat, 'dforge');
    assert.strictEqual(manifest1.version, '2.0.0');
    assert.strictEqual(manifest1.originalFileName, 'mission_control.dforge');
    assert.ok(manifest1.packageId);

    // Rebuilding preserves packageId
    const pkg2 = manager.exportPackage();
    const manifest2 = JSON.parse(pkg2['manifest.json']);
    assert.strictEqual(manifest2.packageId, manifest1.packageId);
    assert.strictEqual(manifest2.createdAt, manifest1.createdAt);
  });
});

describe('IDE Mapping & DXP Runtime Engine', () => {
  it('detects installed IDEs with capability profiles', async () => {
    const ideEngine = new IDEDiscoveryEngine();
    const ides = await ideEngine.detectInstalledIDEs();

    assert.ok(Array.isArray(ides));
    assert.ok(ides.length >= 3);

    const vsCode = ides.find(i => i.id === 'vscode');
    assert.ok(vsCode);
    assert.strictEqual(vsCode.name, 'Visual Studio Code');

    const antigravity = ides.find(i => i.id === 'antigravity');
    assert.ok(antigravity);
    assert.strictEqual(antigravity.name, 'Antigravity');

    const caps = await ideEngine.getIDECapabilities('antigravity');
    assert.strictEqual(caps.name, 'Antigravity');
    assert.strictEqual(caps.previewSupport, true);
  });

  it('generates canonical Design IR and Prototype IR', () => {
    const doc = createInitialDocument('IR Test');
    const designMapper = new DesignMappingEngine(doc);
    const designIR = designMapper.generateDesignIR();

    assert.strictEqual(designIR.schemaVersion, '2.0.0');
    assert.strictEqual(designIR.screens.length, doc.pages.length);
    assert.ok(designIR.responsiveProfiles.desktop);

    const protoMapper = new PrototypeTransferEngine(doc);
    const prototypeIR = protoMapper.extractPrototypeIR();

    assert.strictEqual(prototypeIR.schemaVersion, '2.0.0');
    assert.ok(Array.isArray(prototypeIR.flows));
    assert.ok(Array.isArray(prototypeIR.interactions));
  });

  it('builds valid DXP executable package container', () => {
    const doc = createInitialDocument('DXP Test');
    const dxpManager = new DxpPackageManager(doc);
    const dxpFiles = dxpManager.buildDxpPackage();

    assert.ok(dxpFiles['dxp-manifest.json']);
    assert.ok(dxpFiles['design-ir/index.json']);
    assert.ok(dxpFiles['prototype-ir/index.json']);
    assert.ok(dxpFiles['runtime-config.json']);

    const manifest = JSON.parse(dxpFiles['dxp-manifest.json']);
    assert.strictEqual(manifest.packageVersion, '2.0.0');
    assert.strictEqual(manifest.validationStatus, 'PASSED');
  });
});

describe('Phase 9 Extended MCP Tools', () => {
  it('executes df_detect_installed_ides and df_get_ide_capabilities', async () => {
    const doc = createInitialDocument('MCP Test');
    const engine = new CommandEngine(doc);
    const server = new DesignMcpServer(engine);

    const detectResult = await server.handleCallTool({
      params: { name: 'df_detect_installed_ides', arguments: {} }
    }, { grantedScopes: [MCP_PERMISSIONS.DESIGN_READ] });

    assert.strictEqual(detectResult.isError, false);
    assert.ok(detectResult.result.environments.length > 0);

    const capsResult = await server.handleCallTool({
      params: { name: 'df_get_ide_capabilities', arguments: { ideId: 'antigravity' } }
    }, { grantedScopes: [MCP_PERMISSIONS.DESIGN_READ] });

    assert.strictEqual(capsResult.isError, false);
    assert.strictEqual(capsResult.result.capabilities.name, 'Antigravity');
  });

  it('executes df_create_dxp_package, df_validate_dxp_package and df_map_design_elements', async () => {
    const doc = createInitialDocument('MCP Test 2');
    const engine = new CommandEngine(doc);
    const server = new DesignMcpServer(engine);

    const mapResult = await server.handleCallTool({
      params: { name: 'df_map_design_elements', arguments: { targetFramework: 'react-mantine' } }
    }, { grantedScopes: [MCP_PERMISSIONS.DESIGN_READ] });

    assert.strictEqual(mapResult.isError, false);
    assert.strictEqual(mapResult.result.framework, 'react-mantine');

    const dxpResult = await server.handleCallTool({
      params: { name: 'df_create_dxp_package', arguments: {} }
    }, { grantedScopes: [MCP_PERMISSIONS.EXPORT_RUN] });

    assert.strictEqual(dxpResult.isError, false);
    assert.ok(dxpResult.result.packageId);

    const valResult = await server.handleCallTool({
      params: { name: 'df_validate_dxp_package', arguments: {} }
    }, { grantedScopes: [MCP_PERMISSIONS.DESIGN_READ] });

    assert.strictEqual(valResult.isError, false);
    assert.strictEqual(valResult.result.valid, true);

    const transferVal = await server.handleCallTool({
      params: { name: 'df_validate_design_transfer', arguments: {} }
    }, { grantedScopes: [MCP_PERMISSIONS.DESIGN_READ] });

    assert.strictEqual(transferVal.isError, false);
    assert.strictEqual(transferVal.result.status, 'VERIFIED');
    assert.ok(transferVal.result.fidelityScore >= 0.99);
  });
});
