/**
 * DesignForge AI — Acceptance Test Suite:
 * AG Grid, Grafana UI & Mantine UI Design System Integration
 */

import test from 'node:test';
import assert from 'node:assert';
import { createInitialDocument, createNode } from '../src/engine/document.js';
import { CommandEngine } from '../src/engine/commands.js';
import {
  DesignSystemRegistry,
  ComponentVariableManager,
  // AG Grid
  AG_GRID_COMPONENT_CATALOG,
  AG_GRID_VARIABLES,
  addAgGridComponentToRegistry,
  addAgGridVariablesToRegistry,
  createAgGridNode,
  insertAgGridComponentToCanvas,
  // Grafana UI
  GRAFANA_COMPONENT_CATALOG,
  GRAFANA_DESIGN_TOKENS,
  addGrafanaComponentToRegistry,
  addGrafanaTokensToRegistry,
  createGrafanaNode,
  insertGrafanaComponentToCanvas,
  // Mantine UI
  MANTINE_COMPONENT_CATALOG,
  MANTINE_DESIGN_TOKENS,
  addMantineComponentToRegistry,
  addMantineTokensToRegistry,
  createMantineNode,
  insertMantineComponentToCanvas
} from '../src/engine/design_system/index.js';

test('AG Grid Integration Suite', async (t) => {
  await t.test('1. AG Grid Catalog and Variables definitions', () => {
    assert.ok(AG_GRID_COMPONENT_CATALOG.length >= 10, 'AG Grid catalog should have all essential components');
    const compIds = AG_GRID_COMPONENT_CATALOG.map(c => c.id);
    assert.ok(compIds.includes('data-grid'));
    assert.ok(compIds.includes('enterprise-grid'));
    assert.ok(compIds.includes('tree-data-grid'));
    assert.ok(compIds.includes('pivot-grid'));
    assert.ok(compIds.includes('status-bar'));
    assert.ok(compIds.includes('quick-filter-bar'));

    assert.ok(AG_GRID_VARIABLES.length >= 15, 'AG Grid variables should cover theme variables');
    const varNames = AG_GRID_VARIABLES.map(v => v.name);
    assert.ok(varNames.includes('--ag-grid-size'));
    assert.ok(varNames.includes('--ag-background-color'));
    assert.ok(varNames.includes('--ag-header-background-color'));
    assert.ok(varNames.includes('--ag-border-color'));
    assert.ok(varNames.includes('--ag-selected-row-background-color'));
  });

  await t.test('2. Register AG Grid Component and Variables into DesignSystemRegistry', () => {
    const doc = createInitialDocument('AG Grid Test');
    const registry = new DesignSystemRegistry(doc);

    const compResult = addAgGridComponentToRegistry(registry, 'data-grid');
    assert.strictEqual(compResult.added, true);
    assert.strictEqual(compResult.component.sourceMetadata.package, 'ag-grid-react');

    const addedVars = addAgGridVariablesToRegistry(registry);
    assert.ok(addedVars.length >= 15, 'All AG Grid CSS variables should be registered');
    const registeredVar = registry.getAllVariables().find(v => v.name === '--ag-header-background-color');
    assert.ok(registeredVar);
    assert.strictEqual(registeredVar.type, 'color');
  });

  await t.test('3. Create authentic canvas node hierarchy for AG Grid', () => {
    const { rootNode, childNodes } = createAgGridNode('data-grid', { x: 50, y: 50, width: 720, height: 380 });
    assert.strictEqual(rootNode.type, 'frame');
    assert.strictEqual(rootNode.transform.width, 720);
    assert.ok(childNodes.length > 5, 'Should have header row, column cells, and status bar child nodes');
  });

  await t.test('4. Insert AG Grid directly onto canvas via application mock', () => {
    const doc = createInitialDocument('AG Grid Canvas Insertion');
    const engine = new CommandEngine(doc);
    const registry = new DesignSystemRegistry(doc);
    const appMock = {
      engine,
      doc,
      dsRegistry: registry,
      selectionManager: { setSelection: () => {} },
      storage: { scheduleAutosave: () => {} },
      render: () => {},
      renderLayersTree: () => {},
      showToast: () => {}
    };

    const inserted = insertAgGridComponentToCanvas(appMock, 'enterprise-grid');
    assert.ok(inserted);
    assert.ok(inserted.id);
    const page = engine.getActivePage();
    assert.ok(page.nodes[inserted.id]);
    assert.strictEqual(page.nodes[inserted.id].name, 'AG Grid / EnterpriseGrid');
  });
});

test('Grafana UI Integration Suite', async (t) => {
  await t.test('1. Grafana Catalog and Theme Tokens definitions', () => {
    assert.ok(GRAFANA_COMPONENT_CATALOG.length >= 12, 'Grafana catalog should have visualization panels');
    const compIds = GRAFANA_COMPONENT_CATALOG.map(c => c.id);
    assert.ok(compIds.includes('time-series'));
    assert.ok(compIds.includes('bar-chart'));
    assert.ok(compIds.includes('pie-chart'));
    assert.ok(compIds.includes('gauge'));
    assert.ok(compIds.includes('stat'));
    assert.ok(compIds.includes('heatmap'));
    assert.ok(compIds.includes('node-graph'));

    assert.ok(GRAFANA_DESIGN_TOKENS.palette.thresholds.ok);
    assert.ok(GRAFANA_DESIGN_TOKENS.palette.thresholds.critical);
    assert.strictEqual(GRAFANA_DESIGN_TOKENS.palette.brand.primary, '#3274D9');
  });

  await t.test('2. Register Grafana Component and Tokens into DesignSystemRegistry', () => {
    const doc = createInitialDocument('Grafana Test');
    const registry = new DesignSystemRegistry(doc);

    const compResult = addGrafanaComponentToRegistry(registry, 'time-series');
    assert.strictEqual(compResult.added, true);
    assert.strictEqual(compResult.component.sourceMetadata.package, '@grafana/ui');

    const addedTokens = addGrafanaTokensToRegistry(registry);
    assert.ok(addedTokens.length >= 10, 'Grafana tokens should be seeded');
    const thresholdOk = registry.getAllTokens().find(t => t.name === 'Grafana / Threshold Ok');
    assert.ok(thresholdOk);
    assert.strictEqual(thresholdOk.value, '#73BF69');
  });

  await t.test('3. Create authentic canvas node hierarchy for Grafana visualization', () => {
    const { rootNode, childNodes } = createGrafanaNode('time-series', { x: 50, y: 50, width: 560, height: 280 });
    assert.strictEqual(rootNode.type, 'frame');
    assert.strictEqual(rootNode.style.fills[0].color, '#181B1F');
    assert.ok(childNodes.length >= 6, 'Should generate title, axes, grid lines, series lines, and legend');
  });

  await t.test('4. Insert Grafana Panel directly onto canvas via application mock', () => {
    const doc = createInitialDocument('Grafana Canvas Test');
    const engine = new CommandEngine(doc);
    const registry = new DesignSystemRegistry(doc);
    const appMock = {
      engine,
      doc,
      dsRegistry: registry,
      selectionManager: { setSelection: () => {} },
      storage: { scheduleAutosave: () => {} },
      render: () => {},
      renderLayersTree: () => {},
      showToast: () => {}
    };

    const inserted = insertGrafanaComponentToCanvas(appMock, 'stat');
    assert.ok(inserted);
    const page = engine.getActivePage();
    assert.ok(page.nodes[inserted.id]);
    assert.strictEqual(page.nodes[inserted.id].name, 'Grafana / StatPanel');
  });
});

test('Mantine UI Integration Suite', async (t) => {
  await t.test('1. Mantine Catalog and Design Tokens definitions', () => {
    assert.ok(MANTINE_COMPONENT_CATALOG.length >= 25, 'Mantine catalog should cover core, dates, charts, tiptap, dropzone, carousel, spotlight');
    const compIds = MANTINE_COMPONENT_CATALOG.map(c => c.id);
    assert.ok(compIds.includes('button'));
    assert.ok(compIds.includes('text-input'));
    assert.ok(compIds.includes('card'));
    assert.ok(compIds.includes('date-picker'));
    assert.ok(compIds.includes('area-chart'));
    assert.ok(compIds.includes('rich-text-editor'));
    assert.ok(compIds.includes('dropzone'));
    assert.ok(compIds.includes('carousel'));
    assert.ok(compIds.includes('spotlight'));

    assert.strictEqual(MANTINE_DESIGN_TOKENS.colors.primary, '#228be6');
    assert.strictEqual(MANTINE_DESIGN_TOKENS.radius.sm, 4);
    assert.strictEqual(MANTINE_DESIGN_TOKENS.spacing.md, 16);
  });

  await t.test('2. Register Mantine Component and Tokens into DesignSystemRegistry', () => {
    const doc = createInitialDocument('Mantine Test');
    const registry = new DesignSystemRegistry(doc);

    const compResult = addMantineComponentToRegistry(registry, 'button');
    assert.strictEqual(compResult.added, true);
    assert.strictEqual(compResult.component.sourceMetadata.package, '@mantine/core');

    const addedTokens = addMantineTokensToRegistry(registry);
    assert.ok(addedTokens.length >= 10, 'Mantine tokens should be seeded');
    const primaryTok = registry.getAllTokens().find(t => t.name === 'Mantine / Primary Blue');
    assert.ok(primaryTok);
    assert.strictEqual(primaryTok.value, '#228be6');
  });

  await t.test('3. Create authentic canvas node hierarchy for Mantine rich components', () => {
    const { rootNode: btnRoot } = createMantineNode('button', { x: 50, y: 50 });
    assert.strictEqual(btnRoot.type, 'frame');
    assert.strictEqual(btnRoot.style.fills[0].color, '#228be6');

    const { rootNode: rteRoot, childNodes: rteChildren } = createMantineNode('rich-text-editor', { x: 50, y: 50, width: 520, height: 280 });
    assert.strictEqual(rteRoot.type, 'frame');
    assert.ok(rteChildren.length >= 4, 'RichTextEditor should contain toolbar and formatted text nodes');
  });

  await t.test('4. Insert Mantine Component directly onto canvas via application mock', () => {
    const doc = createInitialDocument('Mantine Canvas Test');
    const engine = new CommandEngine(doc);
    const registry = new DesignSystemRegistry(doc);
    const appMock = {
      engine,
      doc,
      dsRegistry: registry,
      selectionManager: { setSelection: () => {} },
      storage: { scheduleAutosave: () => {} },
      render: () => {},
      renderLayersTree: () => {},
      showToast: () => {}
    };

    const inserted = insertMantineComponentToCanvas(appMock, 'card');
    assert.ok(inserted);
    const page = engine.getActivePage();
    assert.ok(page.nodes[inserted.id]);
    assert.strictEqual(page.nodes[inserted.id].name, 'Mantine / Card');
  });
});

test('Cross-Library Component Variable Manager Workflows', async (t) => {
  await t.test('1. getAvailableCatalogComponents lists Mantine, AG Grid, Grafana, MUI, and RNEUI', () => {
    const doc = createInitialDocument('Cross Library Test');
    const registry = new DesignSystemRegistry(doc);
    const engine = new CommandEngine(doc);
    const mgr = new ComponentVariableManager(registry, engine);

    const available = mgr.getAvailableCatalogComponents();
    const libs = new Set(available.map(a => a.library));
    assert.ok(libs.has('Mantine UI'));
    assert.ok(libs.has('AG Grid'));
    assert.ok(libs.has('Grafana UI'));
    assert.ok(libs.has('Material UI'));
    assert.ok(libs.has('RNEUI'));
  });

  await t.test('2. Replace component preserves geometry and replaces with Mantine and AG Grid', () => {
    const doc = createInitialDocument('Replace Test');
    const engine = new CommandEngine(doc);
    const registry = new DesignSystemRegistry(doc);
    const mgr = new ComponentVariableManager(registry, engine);

    const page = engine.getActivePage();
    const sourceNode = createNode('frame', {
      name: 'Old Custom Card',
      transform: { x: 120, y: 150, width: 340, height: 220 }
    });
    page.nodes[sourceNode.id] = sourceNode;
    page.childIds = [sourceNode.id];

    // Replace with Mantine Card
    const resMantine = mgr.replaceComponent(sourceNode.id, 'card');
    assert.ok(resMantine.replacement);
    assert.strictEqual(resMantine.replacement.transform.x, 120);
    assert.strictEqual(resMantine.replacement.transform.y, 150);
    assert.strictEqual(resMantine.replacement.name, 'Mantine / Card');

    // Replace with AG Grid DataGrid
    const resAgGrid = mgr.replaceComponent(resMantine.replacement.id, 'data-grid');
    assert.ok(resAgGrid.replacement);
    assert.strictEqual(resAgGrid.replacement.transform.x, 120);
    assert.strictEqual(resAgGrid.replacement.transform.y, 150);
    assert.strictEqual(resAgGrid.replacement.name, 'AG Grid / DataGrid');

    // Replace with Grafana TimeSeries
    const resGrafana = mgr.replaceComponent(resAgGrid.replacement.id, 'time-series');
    assert.ok(resGrafana.replacement);
    assert.strictEqual(resGrafana.replacement.transform.x, 120);
    assert.strictEqual(resGrafana.replacement.transform.y, 150);
    assert.strictEqual(resGrafana.replacement.name, 'Grafana / TimeSeriesPanel');
  });
});
