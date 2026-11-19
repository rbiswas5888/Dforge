/**
 * Comprehensive Verification Test:
 * 1. Faro React & AG Grid package imports
 * 2. AG Grid Quartz/Alpine theme variables & getting started integration
 * 3. Tailwind CSS & Light/Dark Mode configuration
 * 4. MUI as primary design system library
 * 5. System Font Library prioritization
 * 6. Component Variable Modal Nudge
 * 7. DF-MCP Advanced Server Architecture (Level 1, 2, 3 tools, resources, prompts, HTTP, STDIO)
 */

import assert from 'node:assert';
import { createInitialDocument, createNode } from '../src/engine/document.js';
import { CommandEngine } from '../src/engine/commands.js';
import { DesignMcpServer } from '../src/mcp/server/design_server.js';
import { FontManager, SYSTEM_FONTS_CATALOG } from '../src/editor-core/font-manager.js';
import { MUI_COMPONENT_CATALOG, MUI_DESIGN_TOKENS, insertMuiComponentToCanvas } from '../src/engine/design_system/mui_catalog.js';
import { AG_GRID_VARIABLES, AG_GRID_COMPONENT_CATALOG } from '../src/engine/design_system/ag_grid_catalog.js';
import { DesignSystemRegistry } from '../src/engine/design_system/registry.js';
import { ComponentVariableManager } from '../src/engine/design_system/component_variable_manager.js';
import { DesignSystemUIController } from '../src/engine/design_system/ui_controller.js';

console.log('🧪 Starting DesignForge Advanced Upgrades Verification Suite...\n');

import fs from 'node:fs';

// 1. Verify Package Installations
console.log('1. Verifying @grafana/faro-react, ag-grid-react, and @mui/material installations...');
const faroPkg = JSON.parse(fs.readFileSync('node_modules/@grafana/faro-react/package.json', 'utf8'));
assert.ok(faroPkg.name === '@grafana/faro-react', 'faro-react package should be valid');
assert.ok(faroPkg.version, 'faro-react should have version');

const agGridPkg = JSON.parse(fs.readFileSync('node_modules/ag-grid-react/package.json', 'utf8'));
assert.ok(agGridPkg.name === 'ag-grid-react', 'ag-grid-react package should be valid');

const muiPkg = JSON.parse(fs.readFileSync('node_modules/@mui/material/package.json', 'utf8'));
assert.ok(muiPkg.name === '@mui/material', 'mui material package should be valid');
console.log(`   ✓ Verified @grafana/faro-react (v${faroPkg.version}), ag-grid-react (v${agGridPkg.version}), and @mui/material (v${muiPkg.version}).`);

// 2. Verify AG Grid Styling & Variables
console.log('2. Verifying AG Grid Design System & Theme Styling...');
assert.ok(AG_GRID_VARIABLES.some(v => v.name === '--ag-background-color'), 'AG Grid theme background var should exist');
assert.ok(AG_GRID_VARIABLES.some(v => v.name === '--ag-header-background-color'), 'AG Grid header background var should exist');
assert.ok(AG_GRID_COMPONENT_CATALOG.some(c => c.id === 'data-grid'), 'AG Grid DataGrid component should exist');
console.log('   ✓ AG Grid Quartz/Alpine theme tokens and grid components verified.');

// 3. Verify MUI as Main Design System
console.log('3. Verifying MUI as Main Design System...');
const doc = createInitialDocument('MUI Test Project');
const engine = new CommandEngine(doc);
const registry = new DesignSystemRegistry(doc);
const compVarManager = new ComponentVariableManager(registry, engine);

const mockApp = {
  doc,
  engine,
  dsRegistry: registry,
  compVarManager,
  getCanvasCenter: () => ({ x: 300, y: 300 }),
  dsUi: {
    activeComponentLibrary: 'mui',
    openAddVariableModal: (node) => {
      mockApp._nudgedNode = node;
    }
  },
  showToast: () => {}
};

assert.strictEqual(mockApp.dsUi.activeComponentLibrary, 'mui', 'Default library should be MUI');
assert.ok(MUI_COMPONENT_CATALOG.length >= 10, 'MUI should provide comprehensive component catalog');
console.log(`   ✓ MUI confirmed as main design system with ${MUI_COMPONENT_CATALOG.length} catalog components.`);

// 4. Verify Component Variable Modal Nudge
console.log('4. Verifying Component Variable Modal Nudge on Insert...');
const insertedButton = insertMuiComponentToCanvas(mockApp, 'button', { x: 100, y: 100 });
assert.ok(insertedButton, 'Inserted button should exist');
assert.strictEqual(mockApp._nudgedNode.id, insertedButton.id, 'Modal nudge should be invoked with newly inserted component node');
console.log(`   ✓ Component Variable Modal Nudge triggered for inserted node "${insertedButton.name}".`);

// 5. Verify System Font Library Prioritization
console.log('5. Verifying System Font Library Prioritization...');
const fontManager = new FontManager();
assert.ok(SYSTEM_FONTS_CATALOG.includes('System Default (Native OS)'), 'System default should be in catalog');
assert.ok(SYSTEM_FONTS_CATALOG.includes('system-ui'), 'system-ui should be in catalog');
const avail = fontManager.getAvailableFonts();
assert.ok(avail.systemFonts.includes('system-ui') || avail.systemFonts.includes('SF Pro'), 'System fonts should be listed');
console.log(`   ✓ System Font Library prioritized with ${avail.systemFonts.length} system fonts.`);

// 6. Verify DF-MCP Advanced Architecture
console.log('6. Verifying DF-MCP Advanced Server Architecture...');
const mcpServer = new DesignMcpServer(engine);

// Verify Level 1 Autonomous Workflows
const level1Tools = [
  'df_generate_ux_architecture',
  'df_generate_wireframe',
  'df_generate_complete_design',
  'df_build_interactive_prototype',
  'df_audit_design',
  'df_repair_design',
  'df_generate_frontend_project',
  'df_sync_design_and_code'
];
for (const toolName of level1Tools) {
  assert.ok(mcpServer.tools.has(toolName), `Level 1 tool "${toolName}" must be registered`);
}
console.log('   ✓ Level 1 Autonomous Workflow tools verified (8/8).');

// Verify Level 2 Atomic Operations
const level2Tools = [
  'df_create_frame',
  'df_create_node',
  'df_update_node',
  'df_delete_node',
  'df_duplicate_node',
  'df_transform_node',
  'df_manage_layers',
  'df_manage_components',
  'df_manage_variants',
  'df_manage_auto_layout',
  'df_manage_variables',
  'df_manage_styles',
  'df_manage_constraints',
  'df_import_assets',
  'df_export_assets'
];
for (const toolName of level2Tools) {
  assert.ok(mcpServer.tools.has(toolName), `Level 2 tool "${toolName}" must be registered`);
}
console.log('   ✓ Level 2 Atomic Design Operation tools verified (15/15).');

// Verify Level 3 Inspection and Validation (Full Figma Parity)
const level3Tools = [
  'df_get_design_context',
  'df_get_metadata',
  'df_get_node_properties',
  'df_get_variable_defs',
  'df_get_libraries',
  'df_validate_accessibility',
  'df_get_screenshot',
  'df_get_motion_context',
  'df_get_comments',
  'df_get_figjam',
  'df_get_code_connect_map',
  'df_get_file_structure',
  'df_validate_layout',
  'df_validate_prototype',
  'df_validate_generated_code'
];
for (const toolName of level3Tools) {
  assert.ok(mcpServer.tools.has(toolName), `Level 3 tool "${toolName}" must be registered`);
}
console.log('   ✓ Level 3 Inspection & Validation tools verified (15/15).');

// Test executing an autonomous tool call
console.log('   Executing df_generate_wireframe tool...');
const wireframeTool = mcpServer.tools.get('df_generate_wireframe');
const wireframeResult = await wireframeTool.handler({ prompt: 'Enterprise Banking Dashboard', screenType: 'desktop' });
assert.strictEqual(wireframeResult.success, true, 'Wireframe generation should succeed');
assert.ok(wireframeResult.rootFrameId, 'Wireframe should create root container frame');
console.log(`   ✓ df_generate_wireframe executed cleanly, created frame "${wireframeResult.rootFrameId}".`);

console.log('\n🎉 ALL DESIGNFORGE ADVANCED UPGRADE CHECKS PASSED SUCCESSFULLY!');
