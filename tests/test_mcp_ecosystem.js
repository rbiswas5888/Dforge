/**
 * DesignForge AI - MCP Ecosystem End-to-End Automated Test Suite
 * Validates protocol, server capabilities, security boundaries, connectors, and multi-step workflows.
 */

import assert from 'node:assert';
import { createInitialDocument } from '../src/engine/document.js';
import { CommandEngine } from '../src/engine/commands.js';
import {
  McpClientManager,
  DesignMcpServer,
  FileSystemMcpServer,
  DocumentationMcpServer,
  GitHandoffMcpServer,
  McpWorkflowOrchestrator,
  McpSecurityManager,
  McpAuditLogger,
  MCP_PERMISSIONS,
  MCP_ERROR_CODES
} from '../src/mcp/index.js';

async function runMcpTestSuite() {
  console.log('⚡ Starting Complete MCP Ecosystem Automated Test Suite...\n');

  // Setup Document and CommandEngine
  const doc = createInitialDocument('Treasury Cloud Platform (MCP Test)');
  const engine = new CommandEngine(doc);

  // Setup Security & Client Manager
  const audit = new McpAuditLogger(200);
  const security = new McpSecurityManager(audit);
  const manager = new McpClientManager({ security, audit });
  const orchestrator = new McpWorkflowOrchestrator(manager);

  // 1. Handshake & Server Discovery
  console.log('1. Testing Protocol Handshake & Server Discovery...');
  const designServer = new DesignMcpServer(engine);
  const client = await manager.registerInMemoryServer(designServer, {
    id: 'designforge-design-server',
    name: 'Native Design Server'
  });

  assert.strictEqual(client.isReady, true, 'Client should be ready');
  assert.strictEqual(client.serverInfo.name, 'designforge-design-server');
  assert.strictEqual(client.serverCapabilities.tools.listChanged, true);

  const pingRes = await client.ping();
  assert.strictEqual(pingRes.ok, true, 'Ping should succeed');
  assert.strictEqual(typeof pingRes.latencyMs, 'number');
  console.log('   ✓ Handshake, capabilities negotiation, and ping verified.');

  // 2. Read-Only Tools
  console.log('\n2. Testing Read-Only Native Design Tools...');
  const summaryRes = await manager.invokeTool('design_get_document_summary', {});
  assert.strictEqual(summaryRes.data.documentId, doc.id);
  assert.strictEqual(summaryRes.data.name, 'Treasury Cloud Platform (MCP Test)');
  assert.ok(summaryRes.data.pages.length > 0);

  const pagesRes = await manager.invokeTool('design_list_pages', {});
  assert.ok(pagesRes.data.pages.length >= 1);

  const tokensRes = await manager.invokeTool('design_get_design_tokens', {});
  assert.ok(tokensRes.data.totalTokens >= 10);

  const validateRes = await manager.invokeTool('design_validate_document', {});
  assert.strictEqual(validateRes.data.isValid, true);
  console.log('   ✓ Document summary, pages, tokens, and structural validation verified.');

  // 3. Mutation Tools
  console.log('\n3. Testing Design Mutation Tools & Canonical Document Updates...');
  const frameRes = await manager.invokeTool('design_create_frame', {
    name: 'MCP Automation Frame',
    x: 100,
    y: 100,
    width: 800,
    height: 500,
    fill: '#0f172a',
    layoutMode: 'stack-horizontal',
    gap: 16
  });

  assert.strictEqual(frameRes.data.success, true);
  const frameId = frameRes.data.frameId;
  assert.ok(frameId, 'Frame ID must exist');

  const frameNode = engine.getNode(frameId);
  assert.strictEqual(frameNode.name, 'MCP Automation Frame');
  assert.strictEqual(frameNode.transform.width, 800);
  assert.strictEqual(frameNode.layout.mode, 'stack-horizontal');

  const buttonRes = await manager.invokeTool('design_create_node', {
    type: 'button',
    name: 'Primary CTA',
    parentId: frameId,
    width: 140,
    height: 44,
    fill: '#3b82f6',
    textContent: 'Confirm Action'
  });
  assert.strictEqual(buttonRes.data.success, true);
  const btnId = buttonRes.data.nodeId;
  const btnNode = engine.getNode(btnId);
  assert.strictEqual(btnNode.name, 'Primary CTA');
  assert.strictEqual(btnNode.parentId, frameId);

  await manager.invokeTool('design_update_node_properties', {
    nodeId: btnId,
    fillColor: '#10b981',
    cornerRadius: 12
  });
  assert.strictEqual(btnNode.style.cornerRadius, 12);
  assert.strictEqual(btnNode.style.fills[0].color, '#10b981');
  console.log('   ✓ Frame creation, child attachment, and property mutations verified on canonical doc.');

  // 4. Components & Auto-Layout
  console.log('\n4. Testing Component Creation & Auto-Layout Tools...');
  const compRes = await manager.invokeTool('design_create_component', {
    nodeId: btnId,
    componentName: 'MCP Button Master'
  });
  assert.strictEqual(compRes.data.success, true);
  assert.strictEqual(compRes.data.component.name, 'MCP Button Master');

  const variantRes = await manager.invokeTool('design_create_variant', {
    componentId: compRes.data.component.id,
    variantName: 'state=hover',
    propertyOverrides: { style: { fills: [{ type: 'solid', color: '#059669' }] } }
  });
  assert.strictEqual(variantRes.data.success, true);

  await manager.invokeTool('design_set_auto_layout', {
    frameId,
    mode: 'stack-vertical',
    gap: 20,
    padding: 24
  });
  assert.strictEqual(frameNode.layout.mode, 'stack-vertical');
  assert.strictEqual(frameNode.layout.gap, 20);
  console.log('   ✓ Reusable component creation, variants, and auto-layout configuration verified.');

  // 5. Resources & Prompts
  console.log('\n5. Testing MCP Resources & Reusable Prompts...');
  const resContents = await client.readResource(`design://documents/${doc.id}/summary`);
  assert.ok(resContents.length > 0);
  const parsedRes = JSON.parse(resContents[0].text);
  assert.strictEqual(parsedRes.documentId, doc.id);

  const promptRes = await client.getPrompt('design_create_dashboard', { productPurpose: 'Treasury Ops' });
  assert.ok(promptRes.messages[0].content.text.includes('Treasury Ops'));
  console.log('   ✓ MCP Resources and Prompts resolution verified.');

  // 6. External Connectors
  console.log('\n6. Testing External MCP Connectors (Filesystem, Docs, Git)...');
  const fsServer = new FileSystemMcpServer('.');
  await manager.registerInMemoryServer(fsServer, { id: 'designforge-project-files', name: 'Project Files' });

  const docServer = new DocumentationMcpServer();
  await manager.registerInMemoryServer(docServer, { id: 'designforge-docs', name: 'Documentation Server' });

  const gitServer = new GitHandoffMcpServer();
  await manager.registerInMemoryServer(gitServer, { id: 'designforge-git', name: 'Git Connector' });

  const fileRes = await manager.invokeTool('fs_read_file', { filePath: 'specs/dashboard_prd.md' });
  assert.ok(fileRes.data.content.includes('Treasury & Cloud Analytics Dashboard'));

  let pathTraversalBlocked = false;
  try {
    await manager.invokeTool('fs_read_file', { filePath: '../../etc/passwd' });
  } catch (e) {
    pathTraversalBlocked = true;
  }
  assert.strictEqual(pathTraversalBlocked, true, 'Path traversal must be strictly blocked');

  const searchDocs = await manager.invokeTool('docs_search', { query: 'accessibility' });
  assert.ok(searchDocs.data.count > 0);

  const gitDiffRes = await manager.invokeTool('git_diff', {});
  assert.ok(gitDiffRes.data.diff.includes('DesignForge AI React Compiler'));
  console.log('   ✓ Filesystem with path-traversal prevention, Docs search, and Git connector verified.');

  // 7. Security Boundaries & Approvals
  console.log('\n7. Testing Security Boundaries, Approvals & Audit Redaction...');
  security.revokeScope('designforge-project-files', MCP_PERMISSIONS.PROJECT_WRITE);
  let writeBlocked = false;
  try {
    await manager.invokeTool('fs_write_file', { filePath: 'test.md', content: 'hack' });
  } catch (e) {
    writeBlocked = true;
    assert.strictEqual(e.code, MCP_ERROR_CODES.PERMISSION_DENIED);
  }
  assert.strictEqual(writeBlocked, true, 'Operation must be denied when scope is revoked');

  security.grantScope('designforge-project-files', MCP_PERMISSIONS.PROJECT_WRITE);

  const writePromise = manager.invokeTool('fs_write_file', { filePath: 'test_export.md', content: 'Valid export content' });
  const pendingList = security.getPendingApprovals();
  assert.ok(pendingList.length > 0, 'Sensitive write must be queued in pending approvals');
  const approvalId = pendingList[0].id;
  assert.strictEqual(pendingList[0].toolName, 'fs_write_file');

  security.approveRequest(approvalId);
  const writeResult = await writePromise;
  assert.strictEqual(writeResult.data.success, true);

  audit.log({
    serverId: 'test-server',
    toolName: 'auth_call',
    diagnostics: { apiKey: 'sk-1234567890abcdef', password: 'secretPassword123' }
  });
  const recentAudit = audit.getEntries(1)[0];
  assert.strictEqual(recentAudit.diagnostics.apiKey, '***REDACTED***');
  assert.strictEqual(recentAudit.diagnostics.password, '***REDACTED***');
  console.log('   ✓ Permission enforcement, Human Approval Queue, and Secrets Redaction verified.');

  // 8. Tool Enablement Toggles
  console.log('\n8. Testing Tool Enablement Toggles...');
  manager.setToolEnabled('design_validate_document', false);
  let disabledBlocked = false;
  try {
    await manager.invokeTool('design_validate_document', {});
  } catch (e) {
    disabledBlocked = true;
    assert.ok(e.message.includes('disabled by user policy'));
  }
  assert.strictEqual(disabledBlocked, true);
  manager.setToolEnabled('design_validate_document', true);
  console.log('   ✓ Tool disabling & enablement policy verified.');

  // 9. Multi-Step Autonomous Workflow
  console.log('\n9. Testing Multi-Step Autonomous Workflow: Markdown → Design → React...');
  let progressStepCount = 0;
  const wfExecution = await orchestrator.executeWorkflow('wf_markdown_to_react', {
    specPath: 'specs/dashboard_prd.md',
    frameName: 'End-to-End Orchestrated Dashboard'
  }, (p) => {
    if (p.status === 'completed') progressStepCount++;
  });

  assert.strictEqual(wfExecution.status, 'completed');
  assert.strictEqual(wfExecution.stepsCount, 8);
  assert.strictEqual(progressStepCount, 8);
  assert.ok(wfExecution.stepResults.step_create_container?.frameId);
  assert.strictEqual(wfExecution.stepResults.step_compile_react?.status, 'success');
  assert.ok(wfExecution.stepResults.step_compile_react?.fileCount > 0);
  console.log('   ✓ Multi-step autonomous workflow executed 8 steps across servers with 100% success.');

  // 10. Disconnection & Error Recovery
  console.log('\n10. Testing Disconnect & Error Recovery...');
  await manager.disconnectServer('designforge-git');
  let gitCallBlocked = false;
  try {
    await manager.invokeTool('git_diff', {});
  } catch (e) {
    gitCallBlocked = true;
  }
  assert.strictEqual(gitCallBlocked, true, 'Calls to disconnected server must be rejected');
  console.log('   ✓ Clean disconnection and safe rejection verified.');

  console.log('\n🎉 ALL 10 MCP ECOSYSTEM VERIFICATION CHECKS PASSED WITH ZERO ERRORS!');
}

runMcpTestSuite()
  .then(() => {
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ MCP Test Suite Failed:', err);
    process.exit(1);
  });
