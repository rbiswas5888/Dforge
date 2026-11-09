/**
 * DesignForge AI — AG Grid (ag-grid-react) Component & Variable Catalog
 * Authoritative integration for AG Grid React data grids, enterprise tables,
 * CSS theme variables, and live canvas components.
 */

import { createNode } from '../document.js';
import { VARIABLE_TYPES, TOKEN_CATEGORIES } from './types.js';

/**
 * Official AG Grid Design Variables & Theme Properties
 * Conforms to AG Grid theme customization specification (CSS Variables API).
 */
export const AG_GRID_VARIABLES = Object.freeze([
  {
    name: '--ag-grid-size',
    type: VARIABLE_TYPES.DIMENSION,
    value: '4px',
    category: 'Spacing',
    description: 'Internal sizing base unit. All paddings and spacings scale from this parameter.'
  },
  {
    name: '--ag-font-size',
    type: VARIABLE_TYPES.DIMENSION,
    value: '13px',
    category: 'Typography',
    description: 'Default text font size across grid header, cells, and status bar.'
  },
  {
    name: '--ag-font-family',
    type: VARIABLE_TYPES.STRING,
    value: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, sans-serif',
    category: 'Typography',
    description: 'Font family applied to grid headers and cells.'
  },
  {
    name: '--ag-background-color',
    type: VARIABLE_TYPES.COLOR,
    value: '#ffffff',
    category: 'Color',
    description: 'Grid viewport background color.'
  },
  {
    name: '--ag-foreground-color',
    type: VARIABLE_TYPES.COLOR,
    value: '#181d1f',
    category: 'Color',
    description: 'Primary text color for data cells and headers.'
  },
  {
    name: '--ag-header-background-color',
    type: VARIABLE_TYPES.COLOR,
    value: '#f8fafc',
    category: 'Color',
    description: 'Background color of the column header container.'
  },
  {
    name: '--ag-header-foreground-color',
    type: VARIABLE_TYPES.COLOR,
    value: '#475569',
    category: 'Color',
    description: 'Text color of column header labels.'
  },
  {
    name: '--ag-header-height',
    type: VARIABLE_TYPES.DIMENSION,
    value: '48px',
    category: 'Sizing',
    description: 'Height of the column header row.'
  },
  {
    name: '--ag-row-height',
    type: VARIABLE_TYPES.DIMENSION,
    value: '42px',
    category: 'Sizing',
    description: 'Height of each data row.'
  },
  {
    name: '--ag-border-color',
    type: VARIABLE_TYPES.COLOR,
    value: '#e2e8f0',
    category: 'Border',
    description: 'Color of the outer frame border and column separators.'
  },
  {
    name: '--ag-row-border-color',
    type: VARIABLE_TYPES.COLOR,
    value: '#f1f5f9',
    category: 'Border',
    description: 'Color of horizontal borders separating table rows.'
  },
  {
    name: '--ag-row-hover-color',
    type: VARIABLE_TYPES.COLOR,
    value: '#f8fafc',
    category: 'Color',
    description: 'Background highlight color when hovering over a row.'
  },
  {
    name: '--ag-selected-row-background-color',
    type: VARIABLE_TYPES.COLOR,
    value: '#e0f2fe',
    category: 'Color',
    description: 'Background color applied to selected data rows.'
  },
  {
    name: '--ag-range-selection-border-color',
    type: VARIABLE_TYPES.COLOR,
    value: '#0284c7',
    category: 'Color',
    description: 'Border color indicating cell range selection.'
  },
  {
    name: '--ag-odd-row-background-color',
    type: VARIABLE_TYPES.COLOR,
    value: '#fcfdfe',
    category: 'Color',
    description: 'Background color for striped alternating rows.'
  },
  {
    name: '--ag-header-column-separator-color',
    type: VARIABLE_TYPES.COLOR,
    value: '#cbd5e1',
    category: 'Border',
    description: 'Color of the vertical divider between header columns.'
  },
  {
    name: '--ag-cell-horizontal-padding',
    type: VARIABLE_TYPES.DIMENSION,
    value: '12px',
    category: 'Spacing',
    description: 'Left and right padding inside grid cells.'
  },
  {
    name: '--ag-border-radius',
    type: VARIABLE_TYPES.DIMENSION,
    value: '8px',
    category: 'Radius',
    description: 'Corner radius of the root grid container.'
  }
]);

/**
 * Official AG Grid Component Definitions
 */
const AG_GRID_COMPONENTS = [
  {
    id: 'data-grid',
    name: 'DataGrid',
    category: 'Grids',
    description: 'High-performance interactive data grid with sorting, filtering, selection, and pagination.',
    defaultSize: { width: 720, height: 380 },
    properties: [
      { name: 'theme', type: 'variant', defaultValue: 'ag-theme-quartz', options: ['ag-theme-quartz', 'ag-theme-alpine', 'ag-theme-balham', 'ag-theme-material'] },
      { name: 'pagination', type: 'boolean', defaultValue: true },
      { name: 'paginationPageSize', type: 'number', defaultValue: 10 },
      { name: 'rowSelection', type: 'variant', defaultValue: 'multiple', options: ['single', 'multiple', 'none'] },
      { name: 'enableSorting', type: 'boolean', defaultValue: true },
      { name: 'enableFilter', type: 'boolean', defaultValue: true },
      { name: 'animateRows', type: 'boolean', defaultValue: true }
    ]
  },
  {
    id: 'enterprise-grid',
    name: 'EnterpriseGrid',
    category: 'Grids',
    description: 'Enterprise data grid with row grouping, column tool panel, aggregation, and range selection.',
    defaultSize: { width: 840, height: 420 },
    properties: [
      { name: 'theme', type: 'variant', defaultValue: 'ag-theme-quartz', options: ['ag-theme-quartz', 'ag-theme-alpine', 'ag-theme-balham'] },
      { name: 'sideBar', type: 'boolean', defaultValue: true },
      { name: 'enableRangeSelection', type: 'boolean', defaultValue: true },
      { name: 'rowGroupPanelShow', type: 'variant', defaultValue: 'always', options: ['always', 'onlyWhenGrouping', 'never'] },
      { name: 'pivotMode', type: 'boolean', defaultValue: false },
      { name: 'statusBar', type: 'boolean', defaultValue: true }
    ]
  },
  {
    id: 'tree-data-grid',
    name: 'TreeDataGrid',
    category: 'Hierarchical',
    description: 'Hierarchical data grid supporting parent-child folder structures and expandable nodes.',
    defaultSize: { width: 720, height: 380 },
    properties: [
      { name: 'treeData', type: 'boolean', defaultValue: true },
      { name: 'autoGroupColumnDef', type: 'text', defaultValue: 'Hierarchy' },
      { name: 'groupDefaultExpanded', type: 'number', defaultValue: 1 }
    ]
  },
  {
    id: 'pivot-grid',
    name: 'PivotGrid',
    category: 'Analytics',
    description: 'Multi-dimensional pivot data grid with cross-tabulation and dynamic value summarization.',
    defaultSize: { width: 800, height: 400 },
    properties: [
      { name: 'pivotMode', type: 'boolean', defaultValue: true },
      { name: 'pivotPanelShow', type: 'variant', defaultValue: 'always', options: ['always', 'onlyWhenPivoting'] }
    ]
  },
  {
    id: 'charted-grid',
    name: 'ChartedGrid',
    category: 'Analytics',
    description: 'Integrated AG Grid with automated linked chart generation from cell ranges.',
    defaultSize: { width: 860, height: 440 },
    properties: [
      { name: 'enableCharts', type: 'boolean', defaultValue: true },
      { name: 'chartType', type: 'variant', defaultValue: 'groupedColumn', options: ['groupedColumn', 'stackedBar', 'line', 'pie'] }
    ]
  },
  {
    id: 'master-detail-grid',
    name: 'MasterDetailGrid',
    category: 'Grids',
    description: 'Master row with collapsible nested detail view displaying sub-records.',
    defaultSize: { width: 760, height: 420 },
    properties: [
      { name: 'masterDetail', type: 'boolean', defaultValue: true },
      { name: 'detailRowHeight', type: 'number', defaultValue: 160 }
    ]
  },
  {
    id: 'filter-tool-panel',
    name: 'FilterToolPanel',
    category: 'ToolPanels',
    description: 'Side tool panel providing fast search, column filtering, and active filter management.',
    defaultSize: { width: 220, height: 360 },
    properties: [
      { name: 'searchable', type: 'boolean', defaultValue: true },
      { name: 'expanded', type: 'boolean', defaultValue: true }
    ]
  },
  {
    id: 'column-tool-panel',
    name: 'ColumnToolPanel',
    category: 'ToolPanels',
    description: 'Side tool panel allowing users to toggle column visibility and drag columns into row groups.',
    defaultSize: { width: 220, height: 360 },
    properties: [
      { name: 'suppressRowGroups', type: 'boolean', defaultValue: false },
      { name: 'suppressValues', type: 'boolean', defaultValue: false },
      { name: 'suppressPivots', type: 'boolean', defaultValue: false }
    ]
  },
  {
    id: 'status-bar',
    name: 'StatusBar',
    category: 'Navigation',
    description: 'Grid footer bar showing total row counts, filtered count, selected count, and page size.',
    defaultSize: { width: 720, height: 36 },
    properties: [
      { name: 'totalRows', type: 'number', defaultValue: 1250 },
      { name: 'selectedCount', type: 'number', defaultValue: 12 },
      { name: 'filteredCount', type: 'number', defaultValue: 1250 }
    ]
  },
  {
    id: 'quick-filter-bar',
    name: 'QuickFilterBar',
    category: 'Toolbar',
    description: 'Top utility bar with global search input, density selector, and CSV export action.',
    defaultSize: { width: 720, height: 44 },
    properties: [
      { name: 'placeholder', type: 'text', defaultValue: 'Search all columns...' },
      { name: 'showExport', type: 'boolean', defaultValue: true }
    ]
  }
];

export const AG_GRID_COMPONENT_CATALOG = Object.freeze(
  AG_GRID_COMPONENTS.map(c => Object.freeze({
    ...c,
    defaultSize: Object.freeze({ ...c.defaultSize }),
    properties: Object.freeze(c.properties.map(p => Object.freeze({ ...p })))
  }))
);

/**
 * Registers an AG Grid component into the Design System Registry
 */
export function addAgGridComponentToRegistry(registry, componentId) {
  const definition = AG_GRID_COMPONENT_CATALOG.find(c => c.id === componentId);
  if (!definition) {
    throw new Error(`Unknown AG Grid catalog component: ${componentId}`);
  }

  const existing = registry.getAllComponents().find(c =>
    c.sourceMetadata?.catalogId === definition.id && c.sourceMetadata?.package === 'ag-grid-react'
  );
  if (existing) return { component: existing, added: false };

  const component = registry.registerComponent(`AG Grid / ${definition.name}`, {
    category: `AG Grid / ${definition.category}`,
    description: definition.description,
    properties: definition.properties.map((p, i) => ({
      id: `${definition.id}_prop_${i + 1}`,
      ...p
    })),
    sourceMetadata: {
      origin: 'package-catalog',
      package: 'ag-grid-react',
      packageVersion: '^36.3.0',
      catalogId: definition.id,
      platform: 'react-web',
      rendering: 'native-canvas'
    }
  });

  return { component, added: true };
}

/**
 * Registers all official AG Grid CSS variables and tokens into the registry
 */
export function addAgGridVariablesToRegistry(registry) {
  const registeredVars = [];
  for (const v of AG_GRID_VARIABLES) {
    const existing = registry.getAllVariables().find(item => item.name === v.name);
    if (!existing) {
      const added = registry.addVariable(v.name, v.type, v.value, {
        description: v.description,
        codeSyntax: {
          css: `var(${v.name})`,
          react: `props.${v.name.replace(/^--/, '').replace(/-/g, '_')}`
        }
      });
      registeredVars.push(added);
    }
  }
  return registeredVars;
}

// Helpers for canvas node generation
function makeText(name, content, x, y, width, height, opts = {}) {
  return createNode('text', {
    name,
    transform: { x, y, width, height },
    text: {
      content,
      fontSize: opts.fontSize ?? 12,
      fontWeight: opts.fontWeight ?? '400',
      fontFamily: opts.fontFamily ?? '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: opts.color ?? '#181d1f',
      textAlign: opts.textAlign ?? 'left',
      verticalAlign: 'middle'
    }
  });
}

function makeBox(name, x, y, width, height, opts = {}) {
  return createNode('frame', {
    name,
    transform: { x, y, width, height },
    cornerRadius: opts.cornerRadius ?? 0,
    fills: opts.fill ? [{ type: 'solid', color: opts.fill, opacity: 1, visible: true }] : [],
    strokes: opts.stroke ? [{ color: opts.stroke, weight: opts.strokeWeight ?? 1, align: 'inside', visible: true }] : []
  });
}

/**
 * Creates authentic canvas node hierarchy representing an AG Grid component
 */
export function createAgGridNode(componentId, options = {}) {
  const definition = AG_GRID_COMPONENT_CATALOG.find(c => c.id === componentId) || AG_GRID_COMPONENT_CATALOG[0];
  const x = Math.round(options.x ?? 100);
  const y = Math.round(options.y ?? 100);
  const width = Math.round(options.width ?? definition.defaultSize.width);
  const height = Math.round(options.height ?? definition.defaultSize.height);

  let rootNode;
  const childNodes = [];

  switch (definition.id) {
    case 'data-grid':
    case 'enterprise-grid':
    case 'tree-data-grid':
    case 'pivot-grid':
    case 'charted-grid':
    case 'master-detail-grid': {
      const isEnterprise = definition.id === 'enterprise-grid' || definition.id === 'pivot-grid';
      const isTree = definition.id === 'tree-data-grid';

      rootNode = createNode('frame', {
        name: `AG Grid / ${definition.name}`,
        transform: { x, y, width, height },
        cornerRadius: 8,
        fills: [{ type: 'solid', color: '#ffffff', opacity: 1, visible: true }],
        strokes: [{ color: '#e2e8f0', weight: 1, align: 'inside', visible: true }]
      });

      let currentY = 0;

      // Optional Quick Toolbar / Group Panel
      if (isEnterprise) {
        const groupBar = makeBox('Row Group Panel', 0, currentY, width, 32, { fill: '#f1f5f9' });
        groupBar.parentId = rootNode.id;
        const groupText = makeText('Group Label', 'Drag here to set row groups (e.g. Country, Department)', 12, currentY + 7, width - 24, 18, {
          fontSize: 11,
          color: '#64748b'
        });
        groupText.parentId = rootNode.id;
        childNodes.push(groupBar, groupText);
        currentY += 32;
      }

      // Column Headers Row
      const headerHeight = 40;
      const headerRow = makeBox('Header Row', 0, currentY, width, headerHeight, {
        fill: '#f8fafc',
        stroke: '#e2e8f0'
      });
      headerRow.parentId = rootNode.id;
      childNodes.push(headerRow);

      const columns = isTree
        ? [
            { label: 'Name (Hierarchy)', width: 240 },
            { label: 'Type', width: 110 },
            { label: 'Size', width: 90 },
            { label: 'Modified', width: 140 },
            { label: 'Status', width: 100 }
          ]
        : [
            { label: 'ID', width: 60 },
            { label: 'Customer / Entity', width: 180 },
            { label: 'Region', width: 110 },
            { label: 'Revenue', width: 120 },
            { label: 'Status', width: 110 },
            { label: 'Actions', width: 100 }
          ];

      let colX = 12;
      for (const col of columns) {
        const headerCell = makeText(`Col - ${col.label}`, col.label.toUpperCase(), colX, currentY + 12, col.width, 16, {
          fontSize: 11,
          fontWeight: '700',
          color: '#475569'
        });
        headerCell.parentId = rootNode.id;
        childNodes.push(headerCell);
        colX += col.width;
      }
      currentY += headerHeight;

      // Sample Rows
      const rowHeight = 38;
      const sampleRows = isTree
        ? [
            { c1: '▾ Documents', c2: 'Folder', c3: '--', c4: 'Today 10:14', c5: 'Active' },
            { c1: '    ├ Design Specs.pdf', c2: 'PDF Document', c3: '2.4 MB', c4: 'Yesterday', c5: 'Reviewed' },
            { c1: '    └ Architecture.png', c2: 'Image', c3: '1.1 MB', c4: 'Nov 08', c5: 'Reviewed' },
            { c1: '▸ Financial Reports', c2: 'Folder', c3: '--', c4: 'Nov 07', c5: 'Pending' },
            { c1: '▸ System Assets', c2: 'Folder', c3: '--', c4: 'Nov 04', c5: 'Active' }
          ]
        : [
            { c1: '#1001', c2: 'Acme Corporation', c3: 'North America', c4: '$124,500.00', c5: 'Completed' },
            { c1: '#1002', c2: 'Starlight Tech Inc', c3: 'Europe', c4: '$89,200.00', c5: 'Processing' },
            { c1: '#1003', c2: 'Nexus Global Ltd', c3: 'Asia Pacific', c4: '$240,150.00', c5: 'Completed' },
            { c1: '#1004', c2: 'Vanguard Systems', c3: 'Latin America', c4: '$54,320.00', c5: 'Pending' },
            { c1: '#1005', c2: 'Aura Logistics', c3: 'North America', c4: '$98,000.00', c5: 'Completed' }
          ];

      sampleRows.forEach((row, idx) => {
        const isSelected = idx === 1;
        const isOdd = idx % 2 === 1;
        const rowBg = isSelected ? '#e0f2fe' : (isOdd ? '#fcfdfe' : '#ffffff');

        const rowBox = makeBox(`Row ${idx + 1}`, 0, currentY, width, rowHeight, {
          fill: rowBg,
          stroke: '#f1f5f9'
        });
        rowBox.parentId = rootNode.id;
        childNodes.push(rowBox);

        let cellX = 12;
        const vals = [row.c1, row.c2, row.c3, row.c4, row.c5];
        vals.forEach((val, cIdx) => {
          const colDef = columns[cIdx] || { width: 100 };
          const cellColor = cIdx === 4
            ? (val === 'Completed' || val === 'Active' ? '#16a34a' : (val === 'Processing' ? '#0284c7' : '#d97706'))
            : (isSelected ? '#0369a1' : '#1e293b');

          const cellText = makeText(`Cell ${idx}_${cIdx}`, val, cellX, currentY + 11, colDef.width, 16, {
            fontSize: 12,
            fontWeight: cIdx === 0 || isSelected ? '600' : '400',
            color: cellColor
          });
          cellText.parentId = rootNode.id;
          childNodes.push(cellText);
          cellX += colDef.width;
        });

        currentY += rowHeight;
      });

      // Bottom Status Bar
      const statusBarHeight = 32;
      const statusY = height - statusBarHeight;
      const statusBar = makeBox('Status Bar', 0, statusY, width, statusBarHeight, {
        fill: '#f8fafc',
        stroke: '#e2e8f0'
      });
      statusBar.parentId = rootNode.id;
      childNodes.push(statusBar);

      const statusText = makeText('Status Info', 'Total: 1,250 rows  |  Filtered: 1,250  |  Selected: 1 row', 12, statusY + 8, width / 2, 16, {
        fontSize: 11,
        color: '#64748b'
      });
      statusText.parentId = rootNode.id;

      const pageText = makeText('Pagination', 'Page 1 of 125  ‹ 1  2  3  4  5 ›', width - 210, statusY + 8, 200, 16, {
        fontSize: 11,
        color: '#64748b',
        textAlign: 'right'
      });
      pageText.parentId = rootNode.id;
      childNodes.push(statusText, pageText);

      rootNode.childIds = childNodes.map(c => c.id);
      break;
    }

    case 'filter-tool-panel':
    case 'column-tool-panel': {
      const isFilter = definition.id === 'filter-tool-panel';
      rootNode = createNode('frame', {
        name: `AG Grid / ${definition.name}`,
        transform: { x, y, width, height },
        cornerRadius: 6,
        fills: [{ type: 'solid', color: '#f8fafc', opacity: 1, visible: true }],
        strokes: [{ color: '#cbd5e1', weight: 1, align: 'inside', visible: true }]
      });

      const header = makeBox('Header', 0, 0, width, 36, { fill: '#f1f5f9', stroke: '#e2e8f0' });
      header.parentId = rootNode.id;
      const headerTitle = makeText('Title', isFilter ? 'Filters' : 'Columns', 10, 10, width - 20, 16, {
        fontSize: 12,
        fontWeight: '700',
        color: '#334155'
      });
      headerTitle.parentId = rootNode.id;
      childNodes.push(header, headerTitle);

      const searchBox = makeBox('Search', 8, 42, width - 16, 28, { fill: '#ffffff', stroke: '#cbd5e1', cornerRadius: 4 });
      searchBox.parentId = rootNode.id;
      const searchPlaceholder = makeText('Placeholder', isFilter ? 'Filter columns...' : 'Search columns...', 16, 48, width - 32, 16, {
        fontSize: 11,
        color: '#94a3b8'
      });
      searchPlaceholder.parentId = rootNode.id;
      childNodes.push(searchBox, searchPlaceholder);

      const items = isFilter
        ? ['✓ Customer Name', '✓ Region Filter', '✓ Revenue Range', '✓ Order Status']
        : ['☑ ID', '☑ Customer', '☑ Region', '☑ Revenue', '☑ Status', '☐ Internal UUID'];

      let itemY = 80;
      items.forEach((item, i) => {
        const itemText = makeText(`Item ${i}`, item, 12, itemY, width - 24, 18, {
          fontSize: 12,
          color: '#1e293b'
        });
        itemText.parentId = rootNode.id;
        childNodes.push(itemText);
        itemY += 24;
      });

      rootNode.childIds = childNodes.map(c => c.id);
      break;
    }

    case 'status-bar': {
      rootNode = createNode('frame', {
        name: 'AG Grid / StatusBar',
        transform: { x, y, width, height },
        cornerRadius: 4,
        fills: [{ type: 'solid', color: '#f8fafc', opacity: 1, visible: true }],
        strokes: [{ color: '#cbd5e1', weight: 1, align: 'inside', visible: true }]
      });

      const leftText = makeText('Left Metrics', 'Total: 1,250 rows  •  Filtered: 128  •  Selected: 5', 12, 10, width - 220, 16, {
        fontSize: 11,
        color: '#475569'
      });
      leftText.parentId = rootNode.id;

      const rightText = makeText('Right Controls', 'Page 1 of 13  |  Page Size: 10 ▾', width - 200, 10, 190, 16, {
        fontSize: 11,
        color: '#475569',
        textAlign: 'right'
      });
      rightText.parentId = rootNode.id;

      childNodes.push(leftText, rightText);
      rootNode.childIds = [leftText.id, rightText.id];
      break;
    }

    case 'quick-filter-bar': {
      rootNode = createNode('frame', {
        name: 'AG Grid / QuickFilterBar',
        transform: { x, y, width, height },
        cornerRadius: 6,
        fills: [{ type: 'solid', color: '#f8fafc', opacity: 1, visible: true }],
        strokes: [{ color: '#e2e8f0', weight: 1, align: 'inside', visible: true }]
      });

      const searchInput = makeBox('Input Container', 8, 7, 240, 30, { fill: '#ffffff', stroke: '#cbd5e1', cornerRadius: 4 });
      searchInput.parentId = rootNode.id;
      const searchPlaceholder = makeText('Input Text', '🔍 Quick search rows...', 18, 14, 220, 16, {
        fontSize: 11,
        color: '#94a3b8'
      });
      searchPlaceholder.parentId = rootNode.id;

      const densityBtn = makeBox('Density Btn', width - 180, 7, 75, 30, { fill: '#ffffff', stroke: '#cbd5e1', cornerRadius: 4 });
      densityBtn.parentId = rootNode.id;
      const densityText = makeText('Density Label', 'Density ▾', width - 170, 14, 60, 16, {
        fontSize: 11,
        color: '#475569',
        textAlign: 'center'
      });
      densityText.parentId = rootNode.id;

      const exportBtn = makeBox('Export Btn', width - 95, 7, 85, 30, { fill: '#0284c7', cornerRadius: 4 });
      exportBtn.parentId = rootNode.id;
      const exportText = makeText('Export Label', 'Export CSV', width - 90, 14, 75, 16, {
        fontSize: 11,
        fontWeight: '600',
        color: '#ffffff',
        textAlign: 'center'
      });
      exportText.parentId = rootNode.id;

      childNodes.push(searchInput, searchPlaceholder, densityBtn, densityText, exportBtn, exportText);
      rootNode.childIds = childNodes.map(c => c.id);
      break;
    }

    default: {
      rootNode = createNode('frame', {
        name: `AG Grid / ${definition.name}`,
        transform: { x, y, width, height },
        cornerRadius: 6,
        fills: [{ type: 'solid', color: '#ffffff', opacity: 1, visible: true }],
        strokes: [{ color: '#0284c7', weight: 1, align: 'inside', visible: true }]
      });
      const title = makeText('Title', `AG Grid ${definition.name}`, 12, 12, width - 24, 20, {
        fontSize: 13,
        fontWeight: '700',
        color: '#0284c7'
      });
      title.parentId = rootNode.id;
      childNodes.push(title);
      rootNode.childIds = [title.id];
      break;
    }
  }

  return { rootNode, childNodes };
}

/**
 * Inserts an AG Grid component directly onto the active canvas page
 */
export function insertAgGridComponentToCanvas(app, componentId, coords = null) {
  if (!app || !app.engine) {
    throw new Error('Application engine not initialized');
  }

  const activePage = app.engine.getActivePage();
  if (!activePage) {
    throw new Error('No active document page');
  }

  const center = coords || (app.getCanvasCenter ? app.getCanvasCenter() : { x: 160, y: 160 });
  const { rootNode, childNodes } = createAgGridNode(componentId, center);

  // Register in current design system registry
  if (app.dsRegistry) {
    addAgGridComponentToRegistry(app.dsRegistry, componentId);
  }

  // Add child nodes
  for (const child of childNodes) {
    activePage.nodes[child.id] = child;
  }

  // Add root node via undoable command
  app.engine.addNode(rootNode, null, `Insert ${rootNode.name}`);

  if (app.selectionManager) {
    app.selectionManager.setSelection([rootNode.id]);
  }

  if (app.storage && typeof app.storage.scheduleAutosave === 'function') {
    app.storage.scheduleAutosave(app.doc);
  }

  if (typeof app.render === 'function') {
    app.render();
  }

  if (typeof app.renderLayersTree === 'function') {
    app.renderLayersTree();
  }

  if (typeof app.showToast === 'function') {
    app.showToast(`Inserted ${rootNode.name} onto canvas`, 'success');
  }

  return rootNode;
}
