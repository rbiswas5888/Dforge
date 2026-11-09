/**
 * DesignForge AI — Grafana UI (@grafana/ui) Component & Token Catalog
 * Authoritative integration for Grafana UI graphs, metric visualization panels,
 * observability tokens, and authentic canvas insertion.
 */

import { createNode } from '../document.js';
import { TOKEN_CATEGORIES, VARIABLE_TYPES } from './types.js';

/**
 * Official Grafana UI Theme Design Tokens & Telemetry Palettes
 */
export const GRAFANA_DESIGN_TOKENS = Object.freeze({
  palette: {
    brand: {
      primary: '#3274D9',
      orange: '#FF9900',
      text: '#CCCCDC'
    },
    background: {
      canvas: '#111217',
      panel: '#181B1F',
      panelHover: '#202328',
      dropdown: '#141619'
    },
    border: {
      weak: '#22252B',
      medium: '#2C3235',
      strong: '#3E4247'
    },
    text: {
      primary: '#CCCCDC',
      secondary: '#8E8E9E',
      disabled: '#52545C',
      link: '#5794F2'
    },
    thresholds: {
      ok: '#73BF69',        // Green
      warning: '#FADE2A',   // Yellow
      orange: '#FF9900',    // Orange
      critical: '#F2495C',  // Red
      purple: '#8F3BB8',    // Purple
      blue: '#5794F2'       // Blue
    },
    visualization: [
      '#73BF69', // series 1 - green
      '#FADE2A', // series 2 - yellow
      '#5794F2', // series 3 - blue
      '#FF9900', // series 4 - orange
      '#F2495C', // series 5 - red
      '#8F3BB8', // series 6 - purple
      '#B877D9', // series 7 - lilac
      '#37872D'  // series 8 - dark green
    ]
  },
  typography: {
    fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
    titleSize: 14,
    statSize: 32,
    bodySize: 12,
    legendSize: 11
  },
  shape: {
    borderRadius: 4
  }
});

/**
 * Official Grafana UI Visualization Panels Catalog
 */
const GRAFANA_COMPONENTS = [
  {
    id: 'time-series',
    name: 'TimeSeriesPanel',
    category: 'Charts',
    description: 'Grafana primary time-series graph supporting multi-query lines, area gradients, and time thresholds.',
    defaultSize: { width: 560, height: 280 },
    properties: [
      { name: 'title', type: 'text', defaultValue: 'CPU & Memory Utilization' },
      { name: 'graphType', type: 'variant', defaultValue: 'lines', options: ['lines', 'bars', 'points'] },
      { name: 'fillOpacity', type: 'number', defaultValue: 15 },
      { name: 'showLegend', type: 'boolean', defaultValue: true },
      { name: 'legendDisplayMode', type: 'variant', defaultValue: 'table', options: ['list', 'table', 'hidden'] }
    ]
  },
  {
    id: 'bar-chart',
    name: 'BarChartPanel',
    category: 'Charts',
    description: 'Categorical and time-based vertical or horizontal bar chart with group stacking and value thresholds.',
    defaultSize: { width: 500, height: 280 },
    properties: [
      { name: 'title', type: 'text', defaultValue: 'HTTP Request Volume by Status' },
      { name: 'orientation', type: 'variant', defaultValue: 'vertical', options: ['vertical', 'horizontal'] },
      { name: 'stacking', type: 'variant', defaultValue: 'normal', options: ['none', 'normal', 'percent'] }
    ]
  },
  {
    id: 'pie-chart',
    name: 'PieChartPanel',
    category: 'Charts',
    description: 'Donut and pie chart panel displaying relative proportion breakdowns with percentage callouts.',
    defaultSize: { width: 440, height: 260 },
    properties: [
      { name: 'title', type: 'text', defaultValue: 'Traffic by Region' },
      { name: 'pieType', type: 'variant', defaultValue: 'donut', options: ['pie', 'donut'] },
      { name: 'showLabels', type: 'boolean', defaultValue: true }
    ]
  },
  {
    id: 'gauge',
    name: 'GaugePanel',
    category: 'Gauges',
    description: 'Radial semi-circle gauge showing standard and critical threshold ranges with current value needle.',
    defaultSize: { width: 320, height: 240 },
    properties: [
      { name: 'title', type: 'text', defaultValue: 'Cluster Saturation' },
      { name: 'min', type: 'number', defaultValue: 0 },
      { name: 'max', type: 'number', defaultValue: 100 },
      { name: 'unit', type: 'text', defaultValue: '%' },
      { name: 'value', type: 'number', defaultValue: 78.4 }
    ]
  },
  {
    id: 'stat',
    name: 'StatPanel',
    category: 'Gauges',
    description: 'Single high-impact metric headline with background sparkline trend and threshold coloring.',
    defaultSize: { width: 280, height: 160 },
    properties: [
      { name: 'title', type: 'text', defaultValue: 'API Error Rate' },
      { name: 'value', type: 'text', defaultValue: '0.04%' },
      { name: 'colorMode', type: 'variant', defaultValue: 'background', options: ['value', 'background', 'none'] },
      { name: 'graphMode', type: 'variant', defaultValue: 'area', options: ['area', 'none'] }
    ]
  },
  {
    id: 'heatmap',
    name: 'HeatmapPanel',
    category: 'Observability',
    description: '2D bucket density heatmap showing request latency frequency distribution across time.',
    defaultSize: { width: 560, height: 280 },
    properties: [
      { name: 'title', type: 'text', defaultValue: 'Latency Distribution (ms)' },
      { name: 'colorScale', type: 'variant', defaultValue: 'spectral', options: ['spectral', 'blues', 'greens', 'reds'] }
    ]
  },
  {
    id: 'candlestick',
    name: 'CandlestickPanel',
    category: 'Financial',
    description: 'OHLC (Open, High, Low, Close) financial price candlestick chart with volume histogram.',
    defaultSize: { width: 560, height: 300 },
    properties: [
      { name: 'title', type: 'text', defaultValue: 'Token Exchange OHLC' },
      { name: 'upColor', type: 'color', defaultValue: '#73BF69' },
      { name: 'downColor', type: 'color', defaultValue: '#F2495C' }
    ]
  },
  {
    id: 'state-timeline',
    name: 'StateTimelinePanel',
    category: 'Observability',
    description: 'Horizontal status bands showing operational state (Online, Degraded, Down) over time.',
    defaultSize: { width: 560, height: 240 },
    properties: [
      { name: 'title', type: 'text', defaultValue: 'Pod Health Timeline' },
      { name: 'showValues', type: 'boolean', defaultValue: true }
    ]
  },
  {
    id: 'node-graph',
    name: 'NodeGraphPanel',
    category: 'Observability',
    description: 'Distributed microservice topology graph showing dependencies, error rates, and request latency.',
    defaultSize: { width: 600, height: 320 },
    properties: [
      { name: 'title', type: 'text', defaultValue: 'Service Mesh Topology' },
      { name: 'layout', type: 'variant', defaultValue: 'force', options: ['force', 'grid', 'layered'] }
    ]
  },
  {
    id: 'histogram',
    name: 'HistogramPanel',
    category: 'Charts',
    description: 'Value distribution frequency histogram with selectable bucket sizes.',
    defaultSize: { width: 480, height: 260 },
    properties: [
      { name: 'title', type: 'text', defaultValue: 'Query Duration Histogram' },
      { name: 'bucketSize', type: 'number', defaultValue: 50 }
    ]
  },
  {
    id: 'alert-list',
    name: 'AlertListPanel',
    category: 'Observability',
    description: 'Active alert rule monitor listing firing, pending, and resolved telemetry alerts.',
    defaultSize: { width: 440, height: 280 },
    properties: [
      { name: 'title', type: 'text', defaultValue: 'Firing Alerts' },
      { name: 'stateFilter', type: 'variant', defaultValue: 'all', options: ['all', 'firing', 'pending'] }
    ]
  },
  {
    id: 'geomap',
    name: 'GeomapPanel',
    category: 'Observability',
    description: 'Geographic world map panel with coordinate pins, heat markers, and point data metrics.',
    defaultSize: { width: 560, height: 300 },
    properties: [
      { name: 'title', type: 'text', defaultValue: 'Global User Distribution' },
      { name: 'basemap', type: 'variant', defaultValue: 'carto-dark', options: ['carto-dark', 'carto-light', 'osm'] }
    ]
  },
  {
    id: 'dashboard-header',
    name: 'DashboardHeader',
    category: 'Navigation',
    description: 'Grafana top dashboard navbar with title, time picker (e.g. Last 6 hours), refresh rate, and tags.',
    defaultSize: { width: 780, height: 48 },
    properties: [
      { name: 'title', type: 'text', defaultValue: 'Production Cluster Overview' },
      { name: 'timeRange', type: 'text', defaultValue: 'Last 6 hours' },
      { name: 'refreshRate', type: 'text', defaultValue: '30s' }
    ]
  }
];

export const GRAFANA_COMPONENT_CATALOG = Object.freeze(
  GRAFANA_COMPONENTS.map(c => Object.freeze({
    ...c,
    defaultSize: Object.freeze({ ...c.defaultSize }),
    properties: Object.freeze(c.properties.map(p => Object.freeze({ ...p })))
  }))
);

/**
 * Registers a Grafana UI component into the Design System Registry
 */
export function addGrafanaComponentToRegistry(registry, componentId) {
  const definition = GRAFANA_COMPONENT_CATALOG.find(c => c.id === componentId);
  if (!definition) {
    throw new Error(`Unknown Grafana catalog component: ${componentId}`);
  }

  const existing = registry.getAllComponents().find(c =>
    c.sourceMetadata?.catalogId === definition.id && c.sourceMetadata?.package === '@grafana/ui'
  );
  if (existing) return { component: existing, added: false };

  const component = registry.registerComponent(`Grafana / ${definition.name}`, {
    category: `Grafana / ${definition.category}`,
    description: definition.description,
    properties: definition.properties.map((p, i) => ({
      id: `${definition.id}_prop_${i + 1}`,
      ...p
    })),
    sourceMetadata: {
      origin: 'package-catalog',
      package: '@grafana/ui',
      packageVersion: '^13.3.0',
      catalogId: definition.id,
      platform: 'react-web',
      rendering: 'native-canvas'
    }
  });

  return { component, added: true };
}

/**
 * Registers all Grafana tokens and variables into the design system registry
 */
export function addGrafanaTokensToRegistry(registry) {
  const addedTokens = [];
  const palette = GRAFANA_DESIGN_TOKENS.palette;

  const entries = [
    { cat: TOKEN_CATEGORIES.COLOR, name: 'Grafana / Brand Primary', value: palette.brand.primary },
    { cat: TOKEN_CATEGORIES.COLOR, name: 'Grafana / Canvas Background', value: palette.background.canvas },
    { cat: TOKEN_CATEGORIES.COLOR, name: 'Grafana / Panel Background', value: palette.background.panel },
    { cat: TOKEN_CATEGORIES.COLOR, name: 'Grafana / Panel Border', value: palette.border.weak },
    { cat: TOKEN_CATEGORIES.COLOR, name: 'Grafana / Text Primary', value: palette.text.primary },
    { cat: TOKEN_CATEGORIES.COLOR, name: 'Grafana / Text Secondary', value: palette.text.secondary },
    { cat: TOKEN_CATEGORIES.COLOR, name: 'Grafana / Threshold Ok', value: palette.thresholds.ok },
    { cat: TOKEN_CATEGORIES.COLOR, name: 'Grafana / Threshold Warning', value: palette.thresholds.warning },
    { cat: TOKEN_CATEGORIES.COLOR, name: 'Grafana / Threshold Critical', value: palette.thresholds.critical },
    { cat: TOKEN_CATEGORIES.COLOR, name: 'Grafana / Series Blue', value: palette.visualization[2] },
    { cat: TOKEN_CATEGORIES.COLOR, name: 'Grafana / Series Green', value: palette.visualization[0] },
    { cat: TOKEN_CATEGORIES.COLOR, name: 'Grafana / Series Yellow', value: palette.visualization[1] },
    { cat: TOKEN_CATEGORIES.TYPOGRAPHY, name: 'Grafana / Font Family', value: GRAFANA_DESIGN_TOKENS.typography.fontFamily }
  ];

  for (const entry of entries) {
    const existing = registry.getAllTokens().find(t => t.name === entry.name);
    if (!existing) {
      addedTokens.push(registry.addToken(entry.cat, entry.name, entry.value));
    }
  }

  return addedTokens;
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
      fontFamily: opts.fontFamily ?? '"Inter", "Helvetica Neue", Arial, sans-serif',
      color: opts.color ?? '#CCCCDC',
      textAlign: opts.textAlign ?? 'left',
      verticalAlign: 'middle'
    }
  });
}

function makeBox(name, x, y, width, height, opts = {}) {
  return createNode('frame', {
    name,
    transform: { x, y, width, height },
    cornerRadius: opts.cornerRadius ?? 4,
    fills: opts.fill ? [{ type: 'solid', color: opts.fill, opacity: opts.opacity ?? 1, visible: true }] : [],
    strokes: opts.stroke ? [{ color: opts.stroke, weight: opts.strokeWeight ?? 1, align: 'inside', visible: true }] : []
  });
}

/**
 * Creates authentic canvas node hierarchy representing a Grafana UI visualization panel
 */
export function createGrafanaNode(componentId, options = {}) {
  const definition = GRAFANA_COMPONENT_CATALOG.find(c => c.id === componentId) || GRAFANA_COMPONENT_CATALOG[0];
  const x = Math.round(options.x ?? 100);
  const y = Math.round(options.y ?? 100);
  const width = Math.round(options.width ?? definition.defaultSize.width);
  const height = Math.round(options.height ?? definition.defaultSize.height);

  let rootNode;
  const childNodes = [];

  switch (definition.id) {
    case 'time-series': {
      rootNode = makeBox(`Grafana / ${definition.name}`, x, y, width, height, {
        fill: '#181B1F',
        stroke: '#22252B',
        cornerRadius: 4
      });

      // Panel Header
      const headerTitle = makeText('Panel Title', 'CPU & Memory Utilization', 12, 10, width - 60, 18, {
        fontSize: 13,
        fontWeight: '600',
        color: '#CCCCDC'
      });
      headerTitle.parentId = rootNode.id;

      const headerActions = makeText('Panel Actions', '▾ ⚙', width - 40, 10, 30, 18, {
        fontSize: 11,
        color: '#8E8E9E',
        textAlign: 'right'
      });
      headerActions.parentId = rootNode.id;
      childNodes.push(headerTitle, headerActions);

      // Y-Axis Labels
      const yAxis1 = makeText('Y-100%', '100%', 12, 40, 35, 14, { fontSize: 10, color: '#8E8E9E' });
      const yAxis2 = makeText('Y-50%', '50%', 12, 110, 35, 14, { fontSize: 10, color: '#8E8E9E' });
      const yAxis3 = makeText('Y-0%', '0%', 12, 180, 35, 14, { fontSize: 10, color: '#8E8E9E' });
      yAxis1.parentId = rootNode.id;
      yAxis2.parentId = rootNode.id;
      yAxis3.parentId = rootNode.id;
      childNodes.push(yAxis1, yAxis2, yAxis3);

      // Horizontal Grid lines
      const gridLine1 = makeBox('Grid Line 1', 50, 48, width - 65, 1, { fill: '#22252B' });
      const gridLine2 = makeBox('Grid Line 2', 50, 118, width - 65, 1, { fill: '#22252B' });
      const gridLine3 = makeBox('Grid Line 3', 50, 188, width - 65, 1, { fill: '#22252B' });
      gridLine1.parentId = rootNode.id;
      gridLine2.parentId = rootNode.id;
      gridLine3.parentId = rootNode.id;
      childNodes.push(gridLine1, gridLine2, gridLine3);

      // Simulated Chart Series Areas (Represented by layered color accent bars/shapes)
      const series1Area = makeBox('Series 1 Fill (CPU)', 50, 90, width - 65, 98, {
        fill: '#5794F2',
        opacity: 0.15
      });
      series1Area.parentId = rootNode.id;

      const series1Line = makeBox('Series 1 Line (CPU)', 50, 90, width - 65, 2, {
        fill: '#5794F2'
      });
      series1Line.parentId = rootNode.id;

      const series2Area = makeBox('Series 2 Fill (Mem)', 50, 130, width - 65, 58, {
        fill: '#73BF69',
        opacity: 0.15
      });
      series2Area.parentId = rootNode.id;

      const series2Line = makeBox('Series 2 Line (Mem)', 50, 130, width - 65, 2, {
        fill: '#73BF69'
      });
      series2Line.parentId = rootNode.id;
      childNodes.push(series1Area, series1Line, series2Area, series2Line);

      // Threshold Warning line
      const thresholdLine = makeBox('Critical Threshold', 50, 60, width - 65, 1, {
        fill: '#F2495C'
      });
      thresholdLine.parentId = rootNode.id;
      childNodes.push(thresholdLine);

      // Bottom Legend Bar
      const legendBg = makeBox('Legend Bar', 12, height - 34, width - 24, 24, { fill: '#141619', cornerRadius: 2 });
      legendBg.parentId = rootNode.id;
      const legendText = makeText('Legend Info', '■ cpu_user (avg: 54.2%, max: 88.1%)    ■ mem_used (avg: 36.8%, max: 42.0%)', 22, height - 30, width - 44, 16, {
        fontSize: 11,
        color: '#CCCCDC'
      });
      legendText.parentId = rootNode.id;
      childNodes.push(legendBg, legendText);

      rootNode.childIds = childNodes.map(c => c.id);
      break;
    }

    case 'bar-chart': {
      rootNode = makeBox(`Grafana / ${definition.name}`, x, y, width, height, {
        fill: '#181B1F',
        stroke: '#22252B',
        cornerRadius: 4
      });

      const headerTitle = makeText('Panel Title', 'HTTP Request Volume by Status', 12, 10, width - 24, 18, {
        fontSize: 13,
        fontWeight: '600',
        color: '#CCCCDC'
      });
      headerTitle.parentId = rootNode.id;
      childNodes.push(headerTitle);

      // Bars representation
      const barData = [
        { label: '200 OK', val: 140, color: '#73BF69' },
        { label: '304 Not Mod', val: 75, color: '#5794F2' },
        { label: '400 Bad Req', val: 35, color: '#FADE2A' },
        { label: '404 Not Found', val: 50, color: '#FF9900' },
        { label: '500 Internal', val: 22, color: '#F2495C' }
      ];

      const barWidth = Math.floor((width - 90) / barData.length) - 10;
      let startX = 50;

      barData.forEach((b, idx) => {
        const barHeight = b.val;
        const barY = height - 55 - barHeight;

        const bar = makeBox(`Bar ${b.label}`, startX, barY, barWidth, barHeight, {
          fill: b.color,
          cornerRadius: 2
        });
        bar.parentId = rootNode.id;

        const label = makeText(`Label ${b.label}`, b.label, startX, height - 45, barWidth, 16, {
          fontSize: 10,
          color: '#8E8E9E',
          textAlign: 'center'
        });
        label.parentId = rootNode.id;

        const valText = makeText(`Val ${b.label}`, `${b.val}k`, startX, barY - 16, barWidth, 14, {
          fontSize: 10,
          fontWeight: '600',
          color: '#CCCCDC',
          textAlign: 'center'
        });
        valText.parentId = rootNode.id;

        childNodes.push(bar, label, valText);
        startX += barWidth + 12;
      });

      rootNode.childIds = childNodes.map(c => c.id);
      break;
    }

    case 'pie-chart': {
      rootNode = makeBox(`Grafana / ${definition.name}`, x, y, width, height, {
        fill: '#181B1F',
        stroke: '#22252B',
        cornerRadius: 4
      });

      const headerTitle = makeText('Panel Title', 'Traffic by Region', 12, 10, width - 24, 18, {
        fontSize: 13,
        fontWeight: '600',
        color: '#CCCCDC'
      });
      headerTitle.parentId = rootNode.id;
      childNodes.push(headerTitle);

      // Donut Ring Outer
      const donutOuter = makeBox('Donut Ring Outer', 30, 48, 160, 160, {
        fill: '#5794F2',
        cornerRadius: 80
      });
      donutOuter.parentId = rootNode.id;

      // Donut Inner Cutout
      const donutInner = makeBox('Donut Hole', 65, 83, 90, 90, {
        fill: '#181B1F',
        cornerRadius: 45
      });
      donutInner.parentId = rootNode.id;

      const centerMetric = makeText('Center Total', '1.4M\nreq/s', 65, 108, 90, 40, {
        fontSize: 14,
        fontWeight: '700',
        color: '#CCCCDC',
        textAlign: 'center'
      });
      centerMetric.parentId = rootNode.id;
      childNodes.push(donutOuter, donutInner, centerMetric);

      // Legend Breakdown on the Right
      const regions = [
        { name: 'North America', pct: '48.2%', color: '#5794F2' },
        { name: 'Europe', pct: '28.4%', color: '#73BF69' },
        { name: 'Asia Pacific', pct: '15.6%', color: '#FADE2A' },
        { name: 'Latin America', pct: '7.8%', color: '#FF9900' }
      ];

      let regY = 56;
      regions.forEach(r => {
        const dot = makeBox(`Dot ${r.name}`, 220, regY + 4, 8, 8, { fill: r.color, cornerRadius: 4 });
        dot.parentId = rootNode.id;
        const text = makeText(`Text ${r.name}`, `${r.name} (${r.pct})`, 236, regY, width - 245, 16, {
          fontSize: 11,
          color: '#CCCCDC'
        });
        text.parentId = rootNode.id;
        childNodes.push(dot, text);
        regY += 28;
      });

      rootNode.childIds = childNodes.map(c => c.id);
      break;
    }

    case 'gauge': {
      rootNode = makeBox(`Grafana / ${definition.name}`, x, y, width, height, {
        fill: '#181B1F',
        stroke: '#22252B',
        cornerRadius: 4
      });

      const headerTitle = makeText('Panel Title', 'Cluster Saturation', 12, 10, width - 24, 18, {
        fontSize: 13,
        fontWeight: '600',
        color: '#CCCCDC'
      });
      headerTitle.parentId = rootNode.id;
      childNodes.push(headerTitle);

      // Gauge Arc simulation
      const gaugeOuter = makeBox('Gauge Arc Base', (width - 180) / 2, 45, 180, 100, {
        fill: '#22252B',
        cornerRadius: 90
      });
      gaugeOuter.parentId = rootNode.id;

      const gaugeFill = makeBox('Gauge Active Arc', (width - 180) / 2 + 5, 50, 170, 90, {
        fill: '#FF9900',
        cornerRadius: 85
      });
      gaugeFill.parentId = rootNode.id;

      const gaugeHole = makeBox('Gauge Center Hole', (width - 180) / 2 + 25, 70, 130, 80, {
        fill: '#181B1F',
        cornerRadius: 65
      });
      gaugeHole.parentId = rootNode.id;

      const gaugeVal = makeText('Gauge Value', '78.4%', (width - 140) / 2, 100, 140, 36, {
        fontSize: 28,
        fontWeight: '700',
        color: '#FF9900',
        textAlign: 'center'
      });
      gaugeVal.parentId = rootNode.id;

      const gaugeRange = makeText('Gauge Range', '0%              Threshold: 80%              100%', 20, height - 35, width - 40, 16, {
        fontSize: 10,
        color: '#8E8E9E',
        textAlign: 'center'
      });
      gaugeRange.parentId = rootNode.id;

      childNodes.push(gaugeOuter, gaugeFill, gaugeHole, gaugeVal, gaugeRange);
      rootNode.childIds = childNodes.map(c => c.id);
      break;
    }

    case 'stat': {
      rootNode = makeBox(`Grafana / ${definition.name}`, x, y, width, height, {
        fill: '#181B1F',
        stroke: '#22252B',
        cornerRadius: 4
      });

      const title = makeText('Stat Title', 'API Error Rate', 14, 12, width - 28, 18, {
        fontSize: 12,
        fontWeight: '600',
        color: '#8E8E9E'
      });
      title.parentId = rootNode.id;

      const value = makeText('Stat Main Value', '0.04%', 14, 40, width - 28, 44, {
        fontSize: 34,
        fontWeight: '800',
        color: '#73BF69'
      });
      value.parentId = rootNode.id;

      const subtitle = makeText('Stat Subtitle', '▼ -0.02% vs last 24h (Normal: < 0.10%)', 14, 94, width - 28, 16, {
        fontSize: 11,
        color: '#73BF69'
      });
      subtitle.parentId = rootNode.id;

      // Sparkline background at bottom
      const sparkline = makeBox('Sparkline Bar', 14, height - 20, width - 28, 6, {
        fill: '#73BF69',
        cornerRadius: 3
      });
      sparkline.parentId = rootNode.id;

      childNodes.push(title, value, subtitle, sparkline);
      rootNode.childIds = childNodes.map(c => c.id);
      break;
    }

    case 'dashboard-header': {
      rootNode = makeBox('Grafana / DashboardHeader', x, y, width, height, {
        fill: '#181B1F',
        stroke: '#22252B',
        cornerRadius: 4
      });

      const title = makeText('Dashboard Title', 'Production Cluster Overview ★', 14, 14, 260, 20, {
        fontSize: 14,
        fontWeight: '700',
        color: '#CCCCDC'
      });
      title.parentId = rootNode.id;

      const timePicker = makeBox('Time Picker', width - 240, 9, 130, 30, { fill: '#141619', stroke: '#2C3235', cornerRadius: 3 });
      timePicker.parentId = rootNode.id;
      const timeText = makeText('Time Range', '🕒 Last 6 hours', width - 235, 15, 120, 16, {
        fontSize: 11,
        color: '#CCCCDC'
      });
      timeText.parentId = rootNode.id;

      const refreshBtn = makeBox('Refresh Box', width - 95, 9, 80, 30, { fill: '#3274D9', cornerRadius: 3 });
      refreshBtn.parentId = rootNode.id;
      const refreshText = makeText('Refresh Text', '⟳ 30s', width - 90, 15, 70, 16, {
        fontSize: 11,
        fontWeight: '600',
        color: '#ffffff',
        textAlign: 'center'
      });
      refreshText.parentId = rootNode.id;

      childNodes.push(title, timePicker, timeText, refreshBtn, refreshText);
      rootNode.childIds = childNodes.map(c => c.id);
      break;
    }

    default: {
      rootNode = makeBox(`Grafana / ${definition.name}`, x, y, width, height, {
        fill: '#181B1F',
        stroke: '#22252B',
        cornerRadius: 4
      });
      const title = makeText('Title', `Grafana ${definition.name}`, 14, 12, width - 28, 20, {
        fontSize: 13,
        fontWeight: '700',
        color: '#3274D9'
      });
      title.parentId = rootNode.id;
      const desc = makeText('Desc', definition.description, 14, 38, width - 28, height - 50, {
        fontSize: 11,
        color: '#8E8E9E'
      });
      desc.parentId = rootNode.id;
      childNodes.push(title, desc);
      rootNode.childIds = [title.id, desc.id];
      break;
    }
  }

  return { rootNode, childNodes };
}

/**
 * Inserts a Grafana UI component directly onto the active canvas page
 */
export function insertGrafanaComponentToCanvas(app, componentId, coords = null) {
  if (!app || !app.engine) {
    throw new Error('Application engine not initialized');
  }

  const activePage = app.engine.getActivePage();
  if (!activePage) {
    throw new Error('No active document page');
  }

  const center = coords || (app.getCanvasCenter ? app.getCanvasCenter() : { x: 180, y: 180 });
  const { rootNode, childNodes } = createGrafanaNode(componentId, center);

  // Register in design system registry
  if (app.dsRegistry) {
    addGrafanaComponentToRegistry(app.dsRegistry, componentId);
  }

  // Add child nodes
  for (const child of childNodes) {
    activePage.nodes[child.id] = child;
  }

  // Add root node
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
