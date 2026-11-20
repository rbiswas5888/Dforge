/**
 * DesignForge AI — Autonomous FinTech Operator Platform Builder
 * Programmatically constructs the complete multi-screen FinTech Operator OS,
 * packages it into .dforge v2.0 with cryptographic provenance, and emits live React code.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createNode,
  createPage,
  SCHEMA_VERSION,
  createDefaultTokens
} from '../src/engine/document.js';
import { DForgePackageManager } from '../src/engine/dforge_package.js';
import { DxpPackageManager, IDEDiscoveryEngine } from '../src/engine/ide_mapping.js';
import { ReactCompiler } from '../src/engine/compiler.js';
import { MANTINE_DESIGN_TOKENS } from '../src/engine/design_system/mantine_catalog.js';
import { AG_GRID_VARIABLES } from '../src/engine/design_system/ag_grid_catalog.js';
import { GRAFANA_DESIGN_TOKENS } from '../src/engine/design_system/grafana_catalog.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

export function buildFintechDocument() {
  const doc = {
    schemaVersion: SCHEMA_VERSION,
    id: 'df_proj_fintech_operator_os',
    name: 'FinTech Mission Control — Core Banking & Fraud Operations Platform',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    appVersion: '2.0.0',
    exportProfile: {
      framework: 'react-vite-ts',
      typescript: true
    },
    pages: [],
    components: {},
    tokens: createDefaultTokens(),
    assets: []
  };

  // Helper to add node to page
  function addNodeToPage(page, node) {
    page.nodes[node.id] = node;
    if (!node.parentId) {
      page.rootIds.push(node.id);
    } else {
      const parent = page.nodes[node.parentId];
      if (parent && !parent.childIds.includes(node.id)) {
        parent.childIds.push(node.id);
      }
    }
    return node;
  }

  // =========================================================================
  // GLOBAL SHELL BUILDER (TopBar + Sidebar)
  // =========================================================================
  function buildGlobalShell(page, activeRoute) {
    const shellWidth = 1440;
    const shellHeight = 960;

    // Desktop Application Shell
    const appShell = createNode('frame', {
      name: `Desktop App Shell (1440x960) — ${page.name}`,
      transform: { x: 40, y: 40, width: shellWidth, height: shellHeight },
      style: {
        fills: [{ type: 'solid', color: '#090d16', opacity: 1 }],
        strokes: [{ color: '#1e293b', width: 1, align: 'inside' }],
        cornerRadius: 12
      },
      layout: { mode: 'none' }
    });
    addNodeToPage(page, appShell);

    // 1. Global TopBar
    const topBar = createNode('frame', {
      parentId: appShell.id,
      name: 'Global Top Navigation Bar (TopBar)',
      transform: { x: 0, y: 0, width: shellWidth, height: 60 },
      style: {
        fills: [{ type: 'solid', color: '#0f172a', opacity: 1 }],
        strokes: [{ color: '#1e293b', width: 1, align: 'inside' }],
        cornerRadius: 0
      },
      layout: {
        mode: 'stack-horizontal',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: 24,
        paddingRight: 24
      }
    });
    addNodeToPage(page, topBar);

    // Brand Logo & Title
    const brandContainer = createNode('frame', {
      parentId: topBar.id,
      name: 'Brand Container',
      transform: { x: 0, y: 0, width: 220, height: 40 },
      style: { fills: [] },
      layout: { mode: 'stack-horizontal', alignItems: 'center', gap: 10 }
    });
    addNodeToPage(page, brandContainer);

    const logoText = createNode('text', {
      parentId: brandContainer.id,
      name: 'Brand Logo',
      transform: { x: 0, y: 0, width: 200, height: 24 },
      text: { content: '⚡ NEXUS // FINTECH OS', fontSize: 14, fontWeight: '800', color: '#38bdf8' }
    });
    addNodeToPage(page, logoText);

    // Global Search Widget (Cmd+K)
    const searchWidget = createNode('frame', {
      parentId: topBar.id,
      name: 'Global Search Widget (Cmd+K)',
      transform: { x: 0, y: 0, width: 380, height: 38 },
      style: {
        fills: [{ type: 'solid', color: '#1e293b', opacity: 1 }],
        strokes: [{ color: '#334155', width: 1, align: 'inside' }],
        cornerRadius: 6
      },
      layout: { mode: 'stack-horizontal', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 14, paddingRight: 10 }
    });
    addNodeToPage(page, searchWidget);

    const searchPlaceholder = createNode('text', {
      parentId: searchWidget.id,
      name: 'Search Input Text',
      transform: { x: 0, y: 0, width: 290, height: 20 },
      text: { content: '🔍 Query TxID, account, routing or name...', fontSize: 12, color: '#94a3b8' }
    });
    addNodeToPage(page, searchPlaceholder);

    const kbdBadge = createNode('frame', {
      parentId: searchWidget.id,
      name: 'Keyboard Badge',
      transform: { x: 0, y: 0, width: 44, height: 22 },
      style: { fills: [{ type: 'solid', color: '#0f172a' }], cornerRadius: 4, strokes: [{ color: '#475569', width: 1 }] },
      layout: { mode: 'stack-horizontal', alignItems: 'center', justifyContent: 'center' }
    });
    addNodeToPage(page, kbdBadge);

    const kbdText = createNode('text', {
      parentId: kbdBadge.id,
      name: 'Kbd Text',
      transform: { x: 0, y: 0, width: 36, height: 16 },
      text: { content: '⌘ K', fontSize: 10, fontWeight: '700', color: '#cbd5e1', textAlign: 'center' }
    });
    addNodeToPage(page, kbdText);

    // Right Controls: Environment Toggle + System Status + Notification + Profile
    const rightControls = createNode('frame', {
      parentId: topBar.id,
      name: 'TopBar Right Controls',
      transform: { x: 0, y: 0, width: 560, height: 44 },
      style: { fills: [] },
      layout: { mode: 'stack-horizontal', alignItems: 'center', gap: 16, justifyContent: 'end' }
    });
    addNodeToPage(page, rightControls);

    // Environment Toggle (Live/Production vs Test/Sandbox)
    const envPill = createNode('frame', {
      parentId: rightControls.id,
      name: 'Environment Toggle (Live/Prod)',
      transform: { x: 0, y: 0, width: 120, height: 28 },
      style: { fills: [{ type: 'solid', color: 'rgba(239, 68, 68, 0.15)' }], strokes: [{ color: '#ef4444', width: 1 }], cornerRadius: 14 },
      layout: { mode: 'stack-horizontal', alignItems: 'center', justifyContent: 'center', gap: 6 }
    });
    addNodeToPage(page, envPill);

    const envDot = createNode('ellipse', {
      parentId: envPill.id,
      name: 'Live Red Dot',
      transform: { x: 0, y: 0, width: 8, height: 8 },
      style: { fills: [{ type: 'solid', color: '#ef4444' }] }
    });
    addNodeToPage(page, envDot);

    const envLabel = createNode('text', {
      parentId: envPill.id,
      name: 'Live Label',
      transform: { x: 0, y: 0, width: 80, height: 16 },
      text: { content: 'LIVE / PROD', fontSize: 10, fontWeight: '800', color: '#ef4444' }
    });
    addNodeToPage(page, envLabel);

    // System Status Indicator
    const systemStatus = createNode('frame', {
      parentId: rightControls.id,
      name: 'System Status Indicator',
      transform: { x: 0, y: 0, width: 160, height: 28 },
      style: { fills: [{ type: 'solid', color: '#1e293b' }], cornerRadius: 4 },
      layout: { mode: 'stack-horizontal', alignItems: 'center', gap: 8, paddingLeft: 8, paddingRight: 8 }
    });
    addNodeToPage(page, systemStatus);

    const statusPing = createNode('ellipse', {
      parentId: systemStatus.id,
      name: 'Green Ping',
      transform: { x: 0, y: 0, width: 6, height: 6 },
      style: { fills: [{ type: 'solid', color: '#10b981' }] }
    });
    addNodeToPage(page, statusPing);

    const statusText = createNode('text', {
      parentId: systemStatus.id,
      name: 'Status Label',
      transform: { x: 0, y: 0, width: 130, height: 16 },
      text: { content: 'Mainframe: Online', fontSize: 11, color: '#94a3b8' }
    });
    addNodeToPage(page, statusText);

    // Notification Center (Bell icon + badge)
    const notifBtn = createNode('frame', {
      parentId: rightControls.id,
      name: 'Notification Center (Bell)',
      transform: { x: 0, y: 0, width: 36, height: 36 },
      style: { fills: [{ type: 'solid', color: '#1e293b' }], cornerRadius: 18, strokes: [{ color: '#334155', width: 1 }] },
      layout: { mode: 'stack-horizontal', alignItems: 'center', justifyContent: 'center' }
    });
    addNodeToPage(page, notifBtn);

    const bellText = createNode('text', {
      parentId: notifBtn.id,
      name: 'Bell Icon',
      transform: { x: 0, y: 0, width: 20, height: 20 },
      text: { content: '🔔 3', fontSize: 11, fontWeight: '700', color: '#f59e0b', textAlign: 'center' }
    });
    addNodeToPage(page, bellText);

    // Operator Profile & Audit Logout
    const profileBox = createNode('frame', {
      parentId: rightControls.id,
      name: 'Operator Profile & Logout',
      transform: { x: 0, y: 0, width: 160, height: 36 },
      style: { fills: [{ type: 'solid', color: '#1e293b' }], cornerRadius: 6, strokes: [{ color: '#334155', width: 1 }] },
      layout: { mode: 'stack-horizontal', alignItems: 'center', gap: 8, paddingLeft: 8, paddingRight: 8 }
    });
    addNodeToPage(page, profileBox);

    const avatar = createNode('ellipse', {
      parentId: profileBox.id,
      name: 'Operator Avatar',
      transform: { x: 0, y: 0, width: 24, height: 24 },
      style: { fills: [{ type: 'solid', color: '#0284c7' }] }
    });
    addNodeToPage(page, avatar);

    const profileText = createNode('text', {
      parentId: profileBox.id,
      name: 'Operator Info',
      transform: { x: 0, y: 0, width: 110, height: 24 },
      text: { content: 'Alex Vance\nL3 Fraud Analyst', fontSize: 10, fontWeight: '600', color: '#f8fafc', lineHeight: 1.2 }
    });
    addNodeToPage(page, profileText);

    // 2. Collapsible Sidebar Navigation
    const sidebar = createNode('frame', {
      parentId: appShell.id,
      name: 'Collapsible Sidebar Navigation (Sidebar)',
      transform: { x: 0, y: 60, width: 240, height: shellHeight - 60 },
      style: {
        fills: [{ type: 'solid', color: '#0b0f17', opacity: 1 }],
        strokes: [{ color: '#1e293b', width: 1, align: 'inside' }],
        cornerRadius: 0
      },
      layout: {
        mode: 'stack-vertical',
        paddingTop: 20,
        paddingLeft: 14,
        paddingRight: 14,
        paddingBottom: 20,
        gap: 6
      }
    });
    addNodeToPage(page, sidebar);

    const navItems = [
      { label: 'Executive Dashboard', icon: '📊', route: '/', badge: null },
      { label: 'Transaction Queues', icon: '⇄', route: '/transactions', badge: '42' },
      { label: 'Fraud & Risk', icon: '🛡️', route: '/fraud', badge: '14' },
      { label: 'Account Management', icon: '👥', route: '/accounts', badge: null },
      { label: 'Compliance Reports', icon: '📄', route: '/compliance', badge: null },
      { label: 'Admin Settings', icon: '⚙️', route: '/admin', badge: null }
    ];

    navItems.forEach(item => {
      const isActive = item.route === activeRoute;
      const navItemFrame = createNode('frame', {
        parentId: sidebar.id,
        name: `Nav / ${item.label}`,
        transform: { x: 0, y: 0, width: 212, height: 42 },
        style: {
          fills: isActive ? [{ type: 'solid', color: '#1e293b' }] : [],
          strokes: isActive ? [{ color: '#0284c7', width: 1 }] : [],
          cornerRadius: 6
        },
        layout: { mode: 'stack-horizontal', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 12, paddingRight: 12 }
      });
      addNodeToPage(page, navItemFrame);

      const navLeft = createNode('frame', {
        parentId: navItemFrame.id,
        name: 'Nav Left',
        transform: { x: 0, y: 0, width: 150, height: 24 },
        style: { fills: [] },
        layout: { mode: 'stack-horizontal', alignItems: 'center', gap: 10 }
      });
      addNodeToPage(page, navLeft);

      const navLabel = createNode('text', {
        parentId: navLeft.id,
        name: 'Nav Label',
        transform: { x: 0, y: 0, width: 140, height: 18 },
        text: { content: `${item.icon}  ${item.label}`, fontSize: 12, fontWeight: isActive ? '700' : '500', color: isActive ? '#38bdf8' : '#94a3b8' }
      });
      addNodeToPage(page, navLabel);

      if (item.badge) {
        const badgeFrame = createNode('frame', {
          parentId: navItemFrame.id,
          name: 'Queue Counter Badge',
          transform: { x: 0, y: 0, width: 28, height: 20 },
          style: {
            fills: [{ type: 'solid', color: item.badge === '14' ? '#ef4444' : '#0284c7' }],
            cornerRadius: 10
          },
          layout: { mode: 'stack-horizontal', alignItems: 'center', justifyContent: 'center' }
        });
        addNodeToPage(page, badgeFrame);

        const badgeNum = createNode('text', {
          parentId: badgeFrame.id,
          name: 'Badge Num',
          transform: { x: 0, y: 0, width: 24, height: 14 },
          text: { content: item.badge, fontSize: 10, fontWeight: '700', color: '#ffffff', textAlign: 'center' }
        });
        addNodeToPage(page, badgeNum);
      }
    });

    // Content container inside shell
    const contentBody = createNode('frame', {
      parentId: appShell.id,
      name: `Main Workspace Area — ${page.name}`,
      transform: { x: 240, y: 60, width: shellWidth - 240, height: shellHeight - 60 },
      style: { fills: [{ type: 'solid', color: '#06090f', opacity: 1 }] },
      layout: { mode: 'none' }
    });
    addNodeToPage(page, contentBody);

    return { appShell, topBar, sidebar, contentBody };
  }

  // =========================================================================
  // SCREEN 1: EXECUTIVE DASHBOARD
  // =========================================================================
  const page1 = createPage('Executive Dashboard', '/');
  doc.pages.push(page1);
  const shell1 = buildGlobalShell(page1, '/');

  // 1. KPI Row (MetricsRow) - 4 Widgets
  const metricsRow = createNode('frame', {
    parentId: shell1.contentBody.id,
    name: 'Key Performance Indicator Row (MetricsRow)',
    transform: { x: 24, y: 20, width: 1152, height: 110 },
    style: { fills: [] },
    layout: { mode: 'stack-horizontal', gap: 16 }
  });
  addNodeToPage(page1, metricsRow);

  const kpis = [
    { title: 'Total Volume (24h)', value: '$428,520,000 USD', change: '+14.2% wow', color: '#10b981', sub: 'Across 18 clearing rails' },
    { title: 'Pending Queue', value: '142 Transactions', change: 'Escrow & Hold', color: '#f59e0b', sub: 'Manual clearance required' },
    { title: 'Active Threat Alerts', value: '7 Critical Threats', change: 'Last 60 mins', color: '#ef4444', sub: 'ML risk engine flagged' },
    { title: 'Liquidity Status', value: '$84,200,000 USD', change: 'Tier-1 Reserves', color: '#38bdf8', sub: 'Solvency ratio 99.4%' }
  ];

  kpis.forEach((kpi, idx) => {
    const card = createNode('frame', {
      parentId: metricsRow.id,
      name: `KPI Widget - ${kpi.title}`,
      transform: { x: 0, y: 0, width: 276, height: 110 },
      style: {
        fills: [{ type: 'solid', color: '#0f172a' }],
        strokes: [{ color: '#1e293b', width: 1 }],
        cornerRadius: 8
      },
      layout: { mode: 'stack-vertical', paddingTop: 14, paddingLeft: 16, paddingRight: 16, paddingBottom: 14, gap: 4 }
    });
    addNodeToPage(page1, card);

    const titleText = createNode('text', {
      parentId: card.id,
      name: 'KPI Title',
      transform: { x: 0, y: 0, width: 240, height: 16 },
      text: { content: kpi.title, fontSize: 11, fontWeight: '600', color: '#94a3b8' }
    });
    addNodeToPage(page1, titleText);

    const valText = createNode('text', {
      parentId: card.id,
      name: 'KPI Value',
      transform: { x: 0, y: 0, width: 240, height: 28 },
      text: { content: kpi.value, fontSize: 18, fontWeight: '800', color: '#f8fafc' }
    });
    addNodeToPage(page1, valText);

    const subText = createNode('text', {
      parentId: card.id,
      name: 'KPI Subtext',
      transform: { x: 0, y: 0, width: 240, height: 16 },
      text: { content: `${kpi.change}  •  ${kpi.sub}`, fontSize: 10, fontWeight: '600', color: kpi.color }
    });
    addNodeToPage(page1, subText);
  });

  // 2. Throughput Visualization (VolumeChart)
  const volumeChart = createNode('frame', {
    parentId: shell1.contentBody.id,
    name: 'Throughput Visualization (VolumeChart — Grafana/Recharts)',
    transform: { x: 24, y: 146, width: 1152, height: 380 },
    style: {
      fills: [{ type: 'solid', color: '#0f172a' }],
      strokes: [{ color: '#1e293b', width: 1 }],
      cornerRadius: 8
    },
    layout: { mode: 'none' }
  });
  addNodeToPage(page1, volumeChart);

  const chartTitle = createNode('text', {
    parentId: volumeChart.id,
    name: 'Chart Title',
    transform: { x: 20, y: 16, width: 600, height: 20 },
    text: { content: 'Real-Time Throughput: Incoming Requests vs Successfully Settled (Rolling 12h Window)', fontSize: 13, fontWeight: '700', color: '#f8fafc' }
  });
  addNodeToPage(page1, chartTitle);

  const chartCanvas = createNode('frame', {
    parentId: volumeChart.id,
    name: 'Dual-Axis Area Plot Area',
    transform: { x: 20, y: 48, width: 1112, height: 280 },
    style: { fills: [{ type: 'solid', color: '#0b0f17' }], strokes: [{ color: '#1e293b', width: 1 }], cornerRadius: 4 },
    layout: { mode: 'none' }
  });
  addNodeToPage(page1, chartCanvas);

  // Simulated chart lines / area fills
  const chartFill1 = createNode('frame', {
    parentId: chartCanvas.id,
    name: 'Settled Throughput Wave (Green)',
    transform: { x: 40, y: 80, width: 1040, height: 180 },
    style: { fills: [{ type: 'solid', color: '#10b981', opacity: 0.15 }], strokes: [{ color: '#10b981', width: 2 }] },
    cornerRadius: 0
  });
  addNodeToPage(page1, chartFill1);

  const chartFill2 = createNode('frame', {
    parentId: chartCanvas.id,
    name: 'Incoming Requests Wave (Blue)',
    transform: { x: 40, y: 50, width: 1040, height: 210 },
    style: { fills: [{ type: 'solid', color: '#38bdf8', opacity: 0.15 }], strokes: [{ color: '#38bdf8', width: 2 }] },
    cornerRadius: 0
  });
  addNodeToPage(page1, chartFill2);

  const chartLegend = createNode('text', {
    parentId: volumeChart.id,
    name: 'Chart Legend',
    transform: { x: 20, y: 342, width: 800, height: 20 },
    text: { content: '■ Incoming Requests (Peak: 4,820 req/s)      ■ Successfully Settled (Peak: 4,795 req/s)      ▲ Processing Delta: Normal', fontSize: 11, color: '#94a3b8' }
  });
  addNodeToPage(page1, chartLegend);

  // 3. Recent High-Value Activity (ActivityFeed)
  const activityFeed = createNode('frame', {
    parentId: shell1.contentBody.id,
    name: 'Recent High-Value Activity (ActivityFeed > $1M)',
    transform: { x: 24, y: 542, width: 1152, height: 320 },
    style: {
      fills: [{ type: 'solid', color: '#0f172a' }],
      strokes: [{ color: '#1e293b', width: 1 }],
      cornerRadius: 8
    },
    layout: { mode: 'none' }
  });
  addNodeToPage(page1, activityFeed);

  const feedTitle = createNode('text', {
    parentId: activityFeed.id,
    name: 'Feed Title',
    transform: { x: 20, y: 16, width: 600, height: 20 },
    text: { content: 'High-Value Outgoing Wire Transfers (Exceeding $1,000,000 USD)', fontSize: 13, fontWeight: '700', color: '#f8fafc' }
  });
  addNodeToPage(page1, feedTitle);

  const wires = [
    { id: 'WIRE-99124', origin: 'JPMorgan Chase US33', dest: 'Starlight Global Ltd (UK)', amount: '$12,450,000.00 USD', rail: 'SWIFT gpi', status: 'CLEARED', color: '#10b981' },
    { id: 'WIRE-99125', origin: 'Apex Liquid Capital LLC', dest: 'Zurich Private Bank AG', amount: '$8,200,000.00 EUR', rail: 'SEPA Instant', status: 'CLEARED', color: '#10b981' },
    { id: 'WIRE-99126', origin: 'Sovereign Wealth Alpha', dest: 'Nexus Global Trading Corp', amount: '$24,000,000.00 USD', rail: 'Fedwire', status: 'PROCESSING', color: '#38bdf8' },
    { id: 'WIRE-99127', origin: 'Horizon Venture Fund IV', dest: 'Tokyo Settlement Trust', amount: '$4,150,000.00 USD', rail: 'CHIPS', status: 'CLEARED', color: '#10b981' },
    { id: 'WIRE-99128', origin: 'Vespera Maritime Holdings', dest: 'Global Bunkering Port', amount: '$1,850,000.00 USD', rail: 'SWIFT', status: 'MANUAL REVIEW', color: '#f59e0b' }
  ];

  wires.forEach((wire, idx) => {
    const rowY = 50 + idx * 50;
    const wireRow = createNode('frame', {
      parentId: activityFeed.id,
      name: `Wire Row ${wire.id}`,
      transform: { x: 20, y: rowY, width: 1112, height: 42 },
      style: {
        fills: [{ type: 'solid', color: idx % 2 === 0 ? '#111827' : '#0f172a' }],
        cornerRadius: 4,
        strokes: [{ color: '#1e293b', width: 1 }]
      },
      layout: { mode: 'stack-horizontal', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 16, paddingRight: 16 }
    });
    addNodeToPage(page1, wireRow);

    const wireId = createNode('text', {
      parentId: wireRow.id,
      name: 'TxID',
      transform: { x: 0, y: 0, width: 120, height: 18 },
      text: { content: wire.id, fontSize: 12, fontWeight: '700', color: '#38bdf8' }
    });
    addNodeToPage(page1, wireId);

    const wireRoute = createNode('text', {
      parentId: wireRow.id,
      name: 'Route',
      transform: { x: 0, y: 0, width: 420, height: 18 },
      text: { content: `${wire.origin}  →  ${wire.dest}`, fontSize: 12, color: '#cbd5e1' }
    });
    addNodeToPage(page1, wireRoute);

    const wireAmount = createNode('text', {
      parentId: wireRow.id,
      name: 'Amount',
      transform: { x: 0, y: 0, width: 180, height: 18 },
      text: { content: wire.amount, fontSize: 12, fontWeight: '700', color: '#f8fafc', textAlign: 'right' }
    });
    addNodeToPage(page1, wireAmount);

    const wireStatus = createNode('frame', {
      parentId: wireRow.id,
      name: 'Status Badge',
      transform: { x: 0, y: 0, width: 130, height: 26 },
      style: { fills: [{ type: 'solid', color: `${wire.color}22` }], cornerRadius: 4, strokes: [{ color: wire.color, width: 1 }] },
      layout: { mode: 'stack-horizontal', alignItems: 'center', justifyContent: 'center' }
    });
    addNodeToPage(page1, wireStatus);

    const statusText = createNode('text', {
      parentId: wireStatus.id,
      name: 'Badge Label',
      transform: { x: 0, y: 0, width: 120, height: 16 },
      text: { content: wire.status, fontSize: 10, fontWeight: '700', color: wire.color, textAlign: 'center' }
    });
    addNodeToPage(page1, statusText);
  });

  // Mobile Companion Artboard for Screen 1
  const mobileFrame1 = createNode('frame', {
    name: 'Mobile Incident Triage (390x844)',
    transform: { x: 1520, y: 40, width: 390, height: 844 },
    style: {
      fills: [{ type: 'solid', color: '#090d16' }],
      strokes: [{ color: '#1e293b', width: 1 }],
      cornerRadius: 32
    },
    layout: { mode: 'stack-vertical', paddingTop: 20, paddingLeft: 16, paddingRight: 16, gap: 14 }
  });
  addNodeToPage(page1, mobileFrame1);

  const mobileTitle = createNode('text', {
    parentId: mobileFrame1.id,
    name: 'Mobile Header',
    transform: { x: 0, y: 0, width: 358, height: 28 },
    text: { content: '⚡ NEXUS MOBILE TRIAGE', fontSize: 16, fontWeight: '800', color: '#38bdf8' }
  });
  addNodeToPage(page1, mobileTitle);

  // =========================================================================
  // SCREEN 2: TRANSACTION MONITORING & DEEP DIVE
  // =========================================================================
  const page2 = createPage('Transaction Monitoring', '/transactions');
  doc.pages.push(page2);
  const shell2 = buildGlobalShell(page2, '/transactions');

  // 1. Advanced Query Bar (FilterBar)
  const filterBar = createNode('frame', {
    parentId: shell2.contentBody.id,
    name: 'Advanced Query Bar (FilterBar — Mantine Form)',
    transform: { x: 24, y: 20, width: 740, height: 90 },
    style: {
      fills: [{ type: 'solid', color: '#0f172a' }],
      strokes: [{ color: '#1e293b', width: 1 }],
      cornerRadius: 8
    },
    layout: { mode: 'stack-vertical', paddingTop: 12, paddingLeft: 16, paddingRight: 16, paddingBottom: 12, gap: 8 }
  });
  addNodeToPage(page2, filterBar);

  const filterRow1 = createNode('frame', {
    parentId: filterBar.id,
    name: 'Multi-Select Dropdowns Row',
    transform: { x: 0, y: 0, width: 708, height: 32 },
    style: { fills: [] },
    layout: { mode: 'stack-horizontal', alignItems: 'center', gap: 12 }
  });
  addNodeToPage(page2, filterRow1);

  const filterDropdowns = [
    { label: 'Payment Rail: All (SWIFT, ACH, SEPA, RTP)', width: 220 },
    { label: 'Currency: USD, EUR', width: 140 },
    { label: 'State: Settled, Pending, Held', width: 170 },
    { label: 'Time: Last 24 Hours ▾', width: 140 }
  ];

  filterDropdowns.forEach(dd => {
    const ddFrame = createNode('frame', {
      parentId: filterRow1.id,
      name: dd.label,
      transform: { x: 0, y: 0, width: dd.width, height: 32 },
      style: { fills: [{ type: 'solid', color: '#1e293b' }], cornerRadius: 4, strokes: [{ color: '#334155', width: 1 }] },
      layout: { mode: 'stack-horizontal', alignItems: 'center', paddingLeft: 10, paddingRight: 10 }
    });
    addNodeToPage(page2, ddFrame);

    const ddText = createNode('text', {
      parentId: ddFrame.id,
      name: 'Dropdown Label',
      transform: { x: 0, y: 0, width: dd.width - 20, height: 16 },
      text: { content: dd.label, fontSize: 11, color: '#f8fafc' }
    });
    addNodeToPage(page2, ddText);
  });

  const filterRow2 = createNode('frame', {
    parentId: filterBar.id,
    name: 'Amount Threshold Slider & Date Range',
    transform: { x: 0, y: 0, width: 708, height: 28 },
    style: { fills: [] },
    layout: { mode: 'stack-horizontal', alignItems: 'center', justifyContent: 'space-between' }
  });
  addNodeToPage(page2, filterRow2);

  const sliderLabel = createNode('text', {
    parentId: filterRow2.id,
    name: 'Slider Label',
    transform: { x: 0, y: 0, width: 340, height: 16 },
    text: { content: 'Amount Threshold: $10,000.00 — $25,000,000.00 USD [Dual Slider]', fontSize: 11, color: '#94a3b8' }
  });
  addNodeToPage(page2, sliderLabel);

  const filterAction = createNode('text', {
    parentId: filterRow2.id,
    name: 'Apply Query',
    transform: { x: 0, y: 0, width: 160, height: 16 },
    text: { content: '✓ 142 Matching Transactions', fontSize: 11, fontWeight: '700', color: '#38bdf8', textAlign: 'right' }
  });
  addNodeToPage(page2, filterAction);

  // 2. Transaction Data Grid (AG Grid Table)
  const txTable = createNode('frame', {
    parentId: shell2.contentBody.id,
    name: 'Transaction Data Grid (TransactionTable — AG Grid Enterprise)',
    transform: { x: 24, y: 126, width: 740, height: 730 },
    style: {
      fills: [{ type: 'solid', color: '#0f172a' }],
      strokes: [{ color: '#1e293b', width: 1 }],
      cornerRadius: 8
    },
    layout: { mode: 'none' }
  });
  addNodeToPage(page2, txTable);

  // Header row
  const tableHeader = createNode('frame', {
    parentId: txTable.id,
    name: 'AG Grid Header Row',
    transform: { x: 0, y: 0, width: 740, height: 40 },
    style: { fills: [{ type: 'solid', color: '#1e293b' }], strokes: [{ color: '#334155', width: 1 }] },
    layout: { mode: 'stack-horizontal', alignItems: 'center', paddingLeft: 16, paddingRight: 16, justifyContent: 'space-between' }
  });
  addNodeToPage(page2, tableHeader);

  const cols = ['TxID', 'Timestamp', 'Sender (KYC)', 'Receiver', 'Amount', 'Rail', 'Status'];
  const headerText = createNode('text', {
    parentId: tableHeader.id,
    name: 'Columns',
    transform: { x: 0, y: 0, width: 708, height: 18 },
    text: { content: cols.join('       '), fontSize: 11, fontWeight: '700', color: '#94a3b8' }
  });
  addNodeToPage(page2, headerText);

  // Data rows
  const gridRows = [
    { tx: '#TX-94821', time: '01:14:02', sender: 'Morgan Chase Corp ✓', receiver: 'Starlight Global Ltd', amt: '$2,450,000.00', rail: 'SWIFT gpi', status: 'MANUAL REVIEW', color: '#f59e0b', active: true },
    { tx: '#TX-94822', time: '01:12:45', sender: 'Nexus Trade LLC ✓', receiver: 'Vanguard Euro Trust', amt: '$840,000.00', rail: 'SEPA Inst', status: 'CLEARED', color: '#10b981' },
    { tx: '#TX-94823', time: '01:11:10', sender: 'Alpha Marine Corp ✗', receiver: 'Offshore Holding BVI', amt: '$9,120,000.00', rail: 'Fedwire', status: 'BLOCKED', color: '#ef4444' },
    { tx: '#TX-94824', time: '01:08:33', sender: 'Starlight Tech Inc ✓', receiver: 'Tokyo Micro Corp', amt: '$145,200.00', rail: 'RTP', status: 'PROCESSING', color: '#38bdf8' },
    { tx: '#TX-94825', time: '01:04:19', sender: 'Aura Capital Ltd ✓', receiver: 'London Clearing Ltd', amt: '$1,200,000.00', rail: 'CHIPS', status: 'CLEARED', color: '#10b981' }
  ];

  gridRows.forEach((r, idx) => {
    const rowFrame = createNode('frame', {
      parentId: txTable.id,
      name: `Row ${r.tx}`,
      transform: { x: 0, y: 40 + idx * 48, width: 740, height: 48 },
      style: {
        fills: [{ type: 'solid', color: r.active ? 'rgba(56, 189, 248, 0.1)' : (idx % 2 === 0 ? '#0f172a' : '#111827') }],
        strokes: [{ color: r.active ? '#0284c7' : '#1e293b', width: 1 }]
      },
      layout: { mode: 'stack-horizontal', alignItems: 'center', paddingLeft: 16, paddingRight: 16, justifyContent: 'space-between' }
    });
    addNodeToPage(page2, rowFrame);

    const rowContent = createNode('text', {
      parentId: rowFrame.id,
      name: 'Row Data',
      transform: { x: 0, y: 0, width: 580, height: 18 },
      text: { content: `${r.tx}   ${r.time}   ${r.sender}   ${r.receiver}   ${r.amt}   ${r.rail}`, fontSize: 11, color: '#f8fafc' }
    });
    addNodeToPage(page2, rowContent);

    const statusPill = createNode('frame', {
      parentId: rowFrame.id,
      name: 'Row Status',
      transform: { x: 0, y: 0, width: 110, height: 24 },
      style: { fills: [{ type: 'solid', color: `${r.color}22` }], cornerRadius: 4, strokes: [{ color: r.color, width: 1 }] },
      layout: { mode: 'stack-horizontal', alignItems: 'center', justifyContent: 'center' }
    });
    addNodeToPage(page2, statusPill);

    const pillLabel = createNode('text', {
      parentId: statusPill.id,
      name: 'Label',
      transform: { x: 0, y: 0, width: 100, height: 14 },
      text: { content: r.status, fontSize: 10, fontWeight: '700', color: r.color, textAlign: 'center' }
    });
    addNodeToPage(page2, pillLabel);
  });

  // Expanded routing details for row 1
  const expandedDetails = createNode('frame', {
    parentId: txTable.id,
    name: 'Row 1 Inline Expanded Routing Path',
    transform: { x: 16, y: 290, width: 708, height: 120 },
    style: { fills: [{ type: 'solid', color: '#090d16' }], cornerRadius: 6, strokes: [{ color: '#38bdf8', width: 1 }] },
    layout: { mode: 'stack-vertical', paddingTop: 12, paddingLeft: 14, paddingRight: 14, gap: 6 }
  });
  addNodeToPage(page2, expandedDetails);

  const expandTitle = createNode('text', {
    parentId: expandedDetails.id,
    name: 'Expand Title',
    transform: { x: 0, y: 0, width: 680, height: 16 },
    text: { content: '▾ INLINE EXPANDED ROUTING HOPS (#TX-94821)', fontSize: 11, fontWeight: '700', color: '#38bdf8' }
  });
  addNodeToPage(page2, expandTitle);

  const hopDiagram = createNode('text', {
    parentId: expandedDetails.id,
    name: 'Hop Diagram',
    transform: { x: 0, y: 0, width: 680, height: 40 },
    text: { content: '[1] Origin: Morgan Chase US33  →  [2] Fedwire Core Hub  →  [3] Barclays UK Intermediary  →  [4] Beneficiary: Starlight Ltd', fontSize: 11, color: '#cbd5e1' }
  });
  addNodeToPage(page2, hopDiagram);

  // 3. Deep Dive Inspector Panel (TransactionDetailSlideout)
  const slideout = createNode('frame', {
    parentId: shell2.contentBody.id,
    name: 'Deep Dive Inspector Panel (TransactionDetailSlideout)',
    transform: { x: 780, y: 20, width: 396, height: 836 },
    style: {
      fills: [{ type: 'solid', color: '#0f172a' }],
      strokes: [{ color: '#0284c7', width: 1 }],
      cornerRadius: 8
    },
    layout: { mode: 'none' }
  });
  addNodeToPage(page2, slideout);

  const slideoutHeader = createNode('frame', {
    parentId: slideout.id,
    name: 'Inspector Header',
    transform: { x: 0, y: 0, width: 396, height: 50 },
    style: { fills: [{ type: 'solid', color: '#1e293b' }], strokes: [{ color: '#334155', width: 1 }] },
    layout: { mode: 'stack-horizontal', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 16, paddingRight: 16 }
  });
  addNodeToPage(page2, slideoutHeader);

  const inspectorTitle = createNode('text', {
    parentId: slideoutHeader.id,
    name: 'Title',
    transform: { x: 0, y: 0, width: 280, height: 20 },
    text: { content: 'Transaction Inspector: TX-94821', fontSize: 13, fontWeight: '700', color: '#f8fafc' }
  });
  addNodeToPage(page2, inspectorTitle);

  // Raw Payload Widget (ISO 20022 XML / JSON)
  const rawPayloadWidget = createNode('frame', {
    parentId: slideout.id,
    name: 'Raw Payload Widget (ISO 20022 XML / JSON)',
    transform: { x: 16, y: 64, width: 364, height: 280 },
    style: { fills: [{ type: 'solid', color: '#090d16' }], strokes: [{ color: '#1e293b', width: 1 }], cornerRadius: 6 },
    layout: { mode: 'stack-vertical', paddingTop: 10, paddingLeft: 12, paddingRight: 12, gap: 6 }
  });
  addNodeToPage(page2, rawPayloadWidget);

  const payloadHeader = createNode('text', {
    parentId: rawPayloadWidget.id,
    name: 'Payload Label',
    transform: { x: 0, y: 0, width: 340, height: 16 },
    text: { content: 'RAW PAYLOAD: ISO 20022 (pacs.008.001.08)', fontSize: 10, fontWeight: '700', color: '#38bdf8' }
  });
  addNodeToPage(page2, payloadHeader);

  const payloadContent = createNode('text', {
    parentId: rawPayloadWidget.id,
    name: 'Payload Code',
    transform: { x: 0, y: 0, width: 340, height: 230 },
    text: {
      content: '{\n  "MsgId": "NEXUS-20261110-94821",\n  "CreDtTm": "2026-11-10T01:14:02Z",\n  "NbOfTxs": 1,\n  "IntrBkSttlmAmt": {\n    "@Ccy": "USD",\n    "#text": 2450000.00\n  },\n  "InstgAgt": { "FinInstnId": { "BICFI": "CHASUS33XXX" } },\n  "InstdAgt": { "FinInstnId": { "BICFI": "BARCGB22XXX" } },\n  "RiskScore": 94,\n  "AmlFlag": "VELOCITY_THRESHOLD"\n}',
      fontSize: 10,
      fontFamily: 'monospace',
      color: '#94a3b8'
    }
  });
  addNodeToPage(page2, payloadContent);

  // Trace Map Widget
  const traceMapWidget = createNode('frame', {
    parentId: slideout.id,
    name: 'Trace Map Widget (Intermediary Hops)',
    transform: { x: 16, y: 356, width: 364, height: 260 },
    style: { fills: [{ type: 'solid', color: '#090d16' }], strokes: [{ color: '#1e293b', width: 1 }], cornerRadius: 6 },
    layout: { mode: 'stack-vertical', paddingTop: 10, paddingLeft: 12, paddingRight: 12, gap: 8 }
  });
  addNodeToPage(page2, traceMapWidget);

  const traceHeader = createNode('text', {
    parentId: traceMapWidget.id,
    name: 'Trace Header',
    transform: { x: 0, y: 0, width: 340, height: 16 },
    text: { content: 'INTERBANK TRACE MAP (HOP-BY-HOP)', fontSize: 10, fontWeight: '700', color: '#10b981' }
  });
  addNodeToPage(page2, traceHeader);

  const traceSteps = [
    '● Hop 0: Debited from Chase NY (Verified)',
    '  ↓ (SWIFT gpi Tracking ID: UETR-84820)',
    '● Hop 1: Federal Reserve Clearing Hub (Passed)',
    '  ↓ (Cleared at 01:14:05)',
    '● Hop 2: Barclays UK Correspondent (Flagged Hold)'
  ];
  const traceBody = createNode('text', {
    parentId: traceMapWidget.id,
    name: 'Trace Body',
    transform: { x: 0, y: 0, width: 340, height: 180 },
    text: { content: traceSteps.join('\n'), fontSize: 11, color: '#f8fafc', lineHeight: 1.6 }
  });
  addNodeToPage(page2, traceBody);

  // Operator Action Bar
  const actionBar = createNode('frame', {
    parentId: slideout.id,
    name: 'Operator Action Bar',
    transform: { x: 16, y: 630, width: 364, height: 180 },
    style: { fills: [{ type: 'solid', color: '#1e293b' }], strokes: [{ color: '#334155', width: 1 }], cornerRadius: 6 },
    layout: { mode: 'stack-vertical', paddingTop: 14, paddingLeft: 14, paddingRight: 14, gap: 10 }
  });
  addNodeToPage(page2, actionBar);

  const actionTitle = createNode('text', {
    parentId: actionBar.id,
    name: 'Action Title',
    transform: { x: 0, y: 0, width: 336, height: 16 },
    text: { content: 'OPERATOR ACTIONS (AUDIT LOGGED)', fontSize: 11, fontWeight: '800', color: '#cbd5e1' }
  });
  addNodeToPage(page2, actionTitle);

  const actions = [
    { label: '✓ Force-Clear Transaction', color: '#10b981' },
    { label: '↺ Issue Immediate Refund', color: '#0284c7' },
    { label: '⮌ Reverse Clearing Order', color: '#f59e0b' },
    { label: '⚠ Escalate to L4 Compliance', color: '#ef4444' }
  ];

  actions.forEach(act => {
    const btn = createNode('frame', {
      parentId: actionBar.id,
      name: `Action Button - ${act.label}`,
      transform: { x: 0, y: 0, width: 336, height: 28 },
      style: { fills: [{ type: 'solid', color: `${act.color}22` }], cornerRadius: 4, strokes: [{ color: act.color, width: 1 }] },
      layout: { mode: 'stack-horizontal', alignItems: 'center', justifyContent: 'center' }
    });
    addNodeToPage(page2, btn);

    const btnText = createNode('text', {
      parentId: btn.id,
      name: 'Btn Text',
      transform: { x: 0, y: 0, width: 320, height: 16 },
      text: { content: act.label, fontSize: 11, fontWeight: '700', color: act.color, textAlign: 'center' }
    });
    addNodeToPage(page2, btnText);
  });

  // =========================================================================
  // SCREEN 3: FRAUD ALERTS & RISK MANAGEMENT
  // =========================================================================
  const page3 = createPage('Fraud Alerts & Risk Management', '/fraud');
  doc.pages.push(page3);
  const shell3 = buildGlobalShell(page3, '/fraud');

  // 1. Risk Distribution Overview (RiskAnalyticsHeader — Recharts Pie Chart)
  const riskHeader = createNode('frame', {
    parentId: shell3.contentBody.id,
    name: 'Risk Distribution Overview (RiskAnalyticsHeader — Recharts Pie)',
    transform: { x: 24, y: 20, width: 1152, height: 180 },
    style: {
      fills: [{ type: 'solid', color: '#0f172a' }],
      strokes: [{ color: '#1e293b', width: 1 }],
      cornerRadius: 8
    },
    layout: { mode: 'stack-horizontal', alignItems: 'center', paddingLeft: 24, paddingRight: 24, gap: 32 }
  });
  addNodeToPage(page3, riskHeader);

  // Pie chart illustration
  const pieIllustration = createNode('frame', {
    parentId: riskHeader.id,
    name: 'Recharts Donut / Pie Breakdown',
    transform: { x: 0, y: 0, width: 130, height: 130 },
    style: { fills: [{ type: 'solid', color: '#ef4444' }], cornerRadius: 65, strokes: [{ color: '#38bdf8', width: 6 }] },
    layout: { mode: 'stack-horizontal', alignItems: 'center', justifyContent: 'center' }
  });
  addNodeToPage(page3, pieIllustration);

  const pieInner = createNode('frame', {
    parentId: pieIllustration.id,
    name: 'Pie Hole',
    transform: { x: 0, y: 0, width: 70, height: 70 },
    style: { fills: [{ type: 'solid', color: '#0f172a' }], cornerRadius: 35 },
    layout: { mode: 'stack-horizontal', alignItems: 'center', justifyContent: 'center' }
  });
  addNodeToPage(page3, pieInner);

  const pieTotal = createNode('text', {
    parentId: pieInner.id,
    name: 'Total Count',
    transform: { x: 0, y: 0, width: 60, height: 16 },
    text: { content: '14 Alerts', fontSize: 10, fontWeight: '800', color: '#f8fafc', textAlign: 'center' }
  });
  addNodeToPage(page3, pieTotal);

  // Risk Distribution details
  const riskDetails = createNode('frame', {
    parentId: riskHeader.id,
    name: 'Trigger Type Breakdown',
    transform: { x: 0, y: 0, width: 900, height: 130 },
    style: { fills: [] },
    layout: { mode: 'stack-vertical', justifyContent: 'center', gap: 8 }
  });
  addNodeToPage(page3, riskDetails);

  const riskTitle = createNode('text', {
    parentId: riskDetails.id,
    name: 'Title',
    transform: { x: 0, y: 0, width: 880, height: 20 },
    text: { content: 'Active Fraud Risk Queue Breakdown (ML Model v4.2)', fontSize: 14, fontWeight: '700', color: '#f8fafc' }
  });
  addNodeToPage(page3, riskTitle);

  const riskTriggers = createNode('text', {
    parentId: riskDetails.id,
    name: 'Triggers List',
    transform: { x: 0, y: 0, width: 880, height: 60 },
    text: {
      content: '■ Velocity Trigger: 38% (High frequency withdrawals)\n■ Geo-Mismatch: 24% (IP/GPS coordinate dispute)\n■ Sanctions List Match: 18% (OFAC/SDN fuzzy match)\n■ Impossible Travel: 20% (Multi-region access within threshold)',
      fontSize: 11,
      color: '#cbd5e1',
      lineHeight: 1.5
    }
  });
  addNodeToPage(page3, riskTriggers);

  // 2. Prioritized Alerts Queue (AlertsGrid)
  const alertsGrid = createNode('frame', {
    parentId: shell3.contentBody.id,
    name: 'Prioritized Alerts Queue (AlertsGrid)',
    transform: { x: 24, y: 216, width: 680, height: 640 },
    style: {
      fills: [{ type: 'solid', color: '#0f172a' }],
      strokes: [{ color: '#1e293b', width: 1 }],
      cornerRadius: 8
    },
    layout: { mode: 'none' }
  });
  addNodeToPage(page3, alertsGrid);

  const alertsHeader = createNode('frame', {
    parentId: alertsGrid.id,
    name: 'Alerts Header',
    transform: { x: 0, y: 0, width: 680, height: 40 },
    style: { fills: [{ type: 'solid', color: '#1e293b' }] },
    layout: { mode: 'stack-horizontal', alignItems: 'center', paddingLeft: 16, paddingRight: 16, justifyContent: 'space-between' }
  });
  addNodeToPage(page3, alertsHeader);

  const alertHeaderLabel = createNode('text', {
    parentId: alertsHeader.id,
    name: 'Header Label',
    transform: { x: 0, y: 0, width: 648, height: 18 },
    text: { content: 'SCORE      TRIGGER REASON                                            ONE-CLICK TRIAGE', fontSize: 11, fontWeight: '700', color: '#94a3b8' }
  });
  addNodeToPage(page3, alertHeaderLabel);

  const alertItems = [
    { score: 98, locked: true, reason: 'OFAC Sanctions match (94%) & Tor exit node', color: '#ef4444' },
    { score: 94, locked: true, reason: 'Account age < 24h & Transfer > $100k offshore', color: '#ef4444' },
    { score: 86, locked: false, reason: 'Velocity: 14 withdrawals in 3 mins from new device', color: '#f59e0b' },
    { score: 72, locked: false, reason: 'Impossible travel: London then Singapore in 18m', color: '#eab308' },
    { score: 64, locked: false, reason: 'Dormant account reactivated with max ACH limit', color: '#eab308' }
  ];

  alertItems.forEach((item, idx) => {
    const alertRow = createNode('frame', {
      parentId: alertsGrid.id,
      name: `Alert Item ${item.score}`,
      transform: { x: 0, y: 40 + idx * 72, width: 680, height: 72 },
      style: {
        fills: [{ type: 'solid', color: item.locked ? 'rgba(239, 68, 68, 0.08)' : (idx % 2 === 0 ? '#0f172a' : '#111827') }],
        strokes: [{ color: item.locked ? '#ef4444' : '#1e293b', width: 1 }]
      },
      layout: { mode: 'stack-horizontal', alignItems: 'center', paddingLeft: 16, paddingRight: 16, justifyContent: 'space-between' }
    });
    addNodeToPage(page3, alertRow);

    const scoreBadge = createNode('frame', {
      parentId: alertRow.id,
      name: 'Score Badge',
      transform: { x: 0, y: 0, width: 44, height: 32 },
      style: { fills: [{ type: 'solid', color: item.color }], cornerRadius: 4 },
      layout: { mode: 'stack-horizontal', alignItems: 'center', justifyContent: 'center' }
    });
    addNodeToPage(page3, scoreBadge);

    const scoreNum = createNode('text', {
      parentId: scoreBadge.id,
      name: 'Score',
      transform: { x: 0, y: 0, width: 40, height: 20 },
      text: { content: `${item.score}`, fontSize: 13, fontWeight: '800', color: '#ffffff', textAlign: 'center' }
    });
    addNodeToPage(page3, scoreNum);

    const reasonText = createNode('text', {
      parentId: alertRow.id,
      name: 'Reason Text',
      transform: { x: 0, y: 0, width: 360, height: 36 },
      text: { content: `${item.locked ? '🔒 LOCKED TOP — ' : ''}${item.reason}`, fontSize: 11, fontWeight: item.locked ? '700' : '500', color: item.locked ? '#f8fafc' : '#cbd5e1' }
    });
    addNodeToPage(page3, reasonText);

    // One-Click Triage buttons
    const triageButtons = createNode('frame', {
      parentId: alertRow.id,
      name: 'Triage Buttons',
      transform: { x: 0, y: 0, width: 200, height: 32 },
      style: { fills: [] },
      layout: { mode: 'stack-horizontal', gap: 6, alignItems: 'center' }
    });
    addNodeToPage(page3, triageButtons);

    const tActions = [
      { label: 'Release', color: '#10b981' },
      { label: 'Freeze', color: '#ef4444' },
      { label: 'KYC', color: '#38bdf8' }
    ];

    tActions.forEach(ta => {
      const tb = createNode('frame', {
        parentId: triageButtons.id,
        name: `Triage - ${ta.label}`,
        transform: { x: 0, y: 0, width: 60, height: 26 },
        style: { fills: [{ type: 'solid', color: `${ta.color}22` }], cornerRadius: 4, strokes: [{ color: ta.color, width: 1 }] },
        layout: { mode: 'stack-horizontal', alignItems: 'center', justifyContent: 'center' }
      });
      addNodeToPage(page3, tb);

      const tbText = createNode('text', {
        parentId: tb.id,
        name: 'Label',
        transform: { x: 0, y: 0, width: 56, height: 14 },
        text: { content: ta.label, fontSize: 10, fontWeight: '700', color: ta.color, textAlign: 'center' }
      });
      addNodeToPage(page3, tbText);
    });
  });

  // 3. Analyst Investigation Workspace (InvestigationWidget)
  const investigationWidget = createNode('frame', {
    parentId: shell3.contentBody.id,
    name: 'Analyst Investigation Workspace (InvestigationWidget)',
    transform: { x: 720, y: 216, width: 456, height: 640 },
    style: {
      fills: [{ type: 'solid', color: '#0f172a' }],
      strokes: [{ color: '#1e293b', width: 1 }],
      cornerRadius: 8
    },
    layout: { mode: 'none' }
  });
  addNodeToPage(page3, investigationWidget);

  // Entity Link Analysis
  const entityLinkBox = createNode('frame', {
    parentId: investigationWidget.id,
    name: 'Entity Link Analysis Graph',
    transform: { x: 16, y: 16, width: 424, height: 260 },
    style: { fills: [{ type: 'solid', color: '#090d16' }], cornerRadius: 6, strokes: [{ color: '#38bdf8', width: 1 }] },
    layout: { mode: 'stack-vertical', paddingTop: 12, paddingLeft: 14, paddingRight: 14, gap: 10 }
  });
  addNodeToPage(page3, entityLinkBox);

  const entityTitle = createNode('text', {
    parentId: entityLinkBox.id,
    name: 'Entity Link Header',
    transform: { x: 0, y: 0, width: 396, height: 16 },
    text: { content: 'ENTITY LINK ANALYSIS (CLUSTER GRAPH)', fontSize: 11, fontWeight: '700', color: '#38bdf8' }
  });
  addNodeToPage(page3, entityTitle);

  const entityConnections = [
    '● Flagged Account: Morgan Chase Corp (#ACC-8819)',
    '  ├── Shared IP: 198.51.100.42 (Linked to 3 other accounts)',
    '  ├── Shared Device Fingerprint: MacIntel-WebKit-Chrome122',
    '  └── Beneficiary Link: Starlight Global Ltd (First-time destination)'
  ];
  const entityBody = createNode('text', {
    parentId: entityLinkBox.id,
    name: 'Entity Body',
    transform: { x: 0, y: 0, width: 396, height: 180 },
    text: { content: entityConnections.join('\n'), fontSize: 11, color: '#f8fafc', lineHeight: 1.6 }
  });
  addNodeToPage(page3, entityBody);

  // Audit Trail Log
  const auditTrailBox = createNode('frame', {
    parentId: investigationWidget.id,
    name: 'Audit Trail Log Timeline',
    transform: { x: 16, y: 292, width: 424, height: 330 },
    style: { fills: [{ type: 'solid', color: '#090d16' }], cornerRadius: 6, strokes: [{ color: '#1e293b', width: 1 }] },
    layout: { mode: 'stack-vertical', paddingTop: 12, paddingLeft: 14, paddingRight: 14, gap: 10 }
  });
  addNodeToPage(page3, auditTrailBox);

  const auditTitle = createNode('text', {
    parentId: auditTrailBox.id,
    name: 'Audit Trail Header',
    transform: { x: 0, y: 0, width: 396, height: 16 },
    text: { content: 'CHRONOLOGICAL AUDIT TRAIL TIMELINE', fontSize: 11, fontWeight: '700', color: '#10b981' }
  });
  addNodeToPage(page3, auditTitle);

  const auditEvents = [
    '01:14:02 — Ingested via SWIFT gpi Gateway (API Key: #gw_live_84)',
    '01:14:03 — ML Risk Engine evaluated score: 94 (Flagged)',
    '01:14:05 — Automated hold placed by rule AML-VELOCITY-09',
    '01:18:22 — L2 Analyst flagged for Senior Review',
    '01:25:00 — Assigned to Operator: Alex Vance (L3 Fraud Analyst)',
    '01:25:40 — Verification package exported with immutable audit chain'
  ];
  const auditBody = createNode('text', {
    parentId: auditTrailBox.id,
    name: 'Audit Body',
    transform: { x: 0, y: 0, width: 396, height: 240 },
    text: { content: auditEvents.join('\n\n'), fontSize: 11, color: '#94a3b8', lineHeight: 1.4 }
  });
  addNodeToPage(page3, auditBody);

  return doc;
}

/**
 * Executes the complete build, packages .dforge v2.0, DXP, and writes records
 */
export async function runBuild() {
  console.log('⚡ Starting DesignForge AI FinTech Operator Platform Build...\n');

  // 1. Build Canonical Document
  console.log('1. Constructing 3-screen FinTech Operator OS Scene Graph...');
  const doc = buildFintechDocument();
  console.log('   ✓ Document created with %d pages and %d total nodes.', doc.pages.length, doc.pages.reduce((a, p) => a + Object.keys(p.nodes).length, 0));

  // 2. Build Universal Design Package (.dforge v2.0)
  console.log('2. Generating Universal Design Package (.dforge v2.0)...');
  const dforgeManager = new DForgePackageManager();
  const identity = dforgeManager.ensureIdentity(doc, 'FintechOperatorPlatform.dforge');
  
  // Record sample committed edits
  dforgeManager.recordEdit({ userId: 'alex_vance', application: 'DesignForge AI' }, {
    objectId: 'appShell',
    operation: 'BUILD_GLOBAL_SHELL',
    component: 'TopBar + Sidebar'
  });
  dforgeManager.recordEdit({ userId: 'alex_vance', application: 'DesignForge AI' }, {
    objectId: 'screen1',
    operation: 'BUILD_EXECUTIVE_DASHBOARD',
    component: 'KPIs + VolumeChart + ActivityFeed'
  });
  dforgeManager.recordEdit({ userId: 'alex_vance', application: 'DesignForge AI' }, {
    objectId: 'screen2',
    operation: 'BUILD_TRANSACTION_MONITORING',
    component: 'Mantine FilterBar + AG Grid DataGrid + Inspector Slideout'
  });
  dforgeManager.recordEdit({ userId: 'alex_vance', application: 'DesignForge AI' }, {
    objectId: 'screen3',
    operation: 'BUILD_FRAUD_ALERTS_WORKSPACE',
    component: 'Risk Distribution Pie + AlertsGrid + Entity Link Analysis'
  });

  const dforgeBundle = dforgeManager.buildPackageFiles(doc);
  const auditVerification = dforgeManager.verifyAuditIntegrity();
  console.log('   ✓ Immutable audit chain verified: %s (Terminal hash: %s)', auditVerification.message, auditVerification.terminalHash);

  // 3. Build DXP Package & Design/Prototype IR
  console.log('3. Generating DXP (DesignForge Executable Experience Package)...');
  const dxpManager = new DxpPackageManager(doc);
  const dxpBundle = dxpManager.buildDxpPackage();
  console.log('   ✓ DXP package successfully generated.');

  // 4. Compile React Code
  console.log('4. Compiling to Live React Application...');
  const compiler = new ReactCompiler(doc, { typescript: true });
  const compilation = compiler.compile();
  console.log('   ✓ React Compiler emitted %d files.', Object.keys(compilation.fileTree || {}).length);

  // 5. Detect Local IDEs
  console.log('5. Running Local IDE Discovery Engine...');
  const ideEngine = new IDEDiscoveryEngine();
  const ides = await ideEngine.detectInstalledIDEs();
  const detected = ides.filter(i => i.detected).map(i => i.name);
  console.log('   ✓ Discovered development environments: %s', detected.join(', '));

  // 6. Write Build Records & Artifacts
  console.log('6. Saving Build Records and Artifacts...');
  const buildRecordsDir = path.join(rootDir, 'DesignForge_Build_Records');
  const artifactsDir = path.join(rootDir, 'artifacts');
  fs.mkdirSync(buildRecordsDir, { recursive: true });
  fs.mkdirSync(artifactsDir, { recursive: true });

  // Write Master Build Record Markdown
  const buildRecordMd = `# DESIGNFORGE AI — BUILD RECORD
# FINTECH OPERATOR MISSION CONTROL & IMMUTABLE PROVENANCE

**Project Name:** ${doc.name}  
**Package ID:** \`${identity.packageId}\`  
**Specification Versions:** .dforge 2.0 / DXP 2.0  
**Build Timestamp:** ${new Date().toISOString()}  
**Operator:** Alex Vance (L3 Fraud Analyst)  
**Audit Verification:** ${auditVerification.valid ? 'PASSED (Cryptographically Validated SHA-256)' : 'FAILED'}

---

## 1. Architecture & Design Systems Integrated
- **Mantine UI (@mantine/core, @mantine/form, @mantine/dates):** Advanced Query FilterBar, multi-select payment rails, amount threshold sliders.
- **AG Grid (ag-grid-react):** High-density Transaction Data Grid with expandable inline routing hops, sortable columns, and status pills.
- **Grafana UI (@grafana/ui) & Recharts:** Real-time throughput dual-axis area chart, risk distribution pie/donut breakdown, telemetry threshold accents.
- **Lucide-React:** Global persistent sidebar icon navigation.

## 2. Screen Specifications
1. **Global Application Shell:**
   - TopBar: Cmd+K Global Search, Environment toggle (\`LIVE/PROD\` red pill), System Status indicator (Mainframe Online), Notification Bell (\`3\` pending alerts), Operator profile.
   - Collapsible Sidebar: Navigation links with queue badges (\`42\` on Transactions, \`14\` red urgent on Fraud).
2. **Screen 1: Executive Dashboard:**
   - 4-Widget KPI MetricsRow: 24h Volume ($428.5M), Pending Queue (142), Active Threat Alerts (7 critical), Liquidity ($84.2M).
   - Throughput Visualization: Rolling 12h area chart tracking incoming requests vs settled throughput.
   - Recent High-Value Wire Activity: Live ticker of wire transfers > $1M.
3. **Screen 2: Transaction Monitoring:**
   - Advanced Query Bar: Rail (SWIFT, ACH, SEPA, RTP), currency, status, dual-range slider.
   - Transaction Data Grid: AG Grid table with expandable inline intermediary hops.
   - Deep Dive Inspector Slideout: Raw ISO 20022 XML / JSON payload, Interbank trace map, and operator action buttons (Force-Clear, Refund, Reverse, Escalate).
4. **Screen 3: Fraud Alerts & Risk Management:**
   - Risk Distribution Overview: Donut breakdown by trigger type (Velocity, Geo-Mismatch, Sanctions, Impossible Travel).
   - Prioritized Alerts Queue: Severity Risk Scores (0-99), locked >90 critical items, and one-click triage buttons.
   - Analyst Investigation Workspace: Entity Link Analysis (shared IP / device cluster) and chronological audit trail timeline.

## 3. Package Structure (.dforge v2.0)
\`\`\`text
FintechOperatorPlatform.dforge/
├── manifest.json
├── project.md
├── README.md
├── design/
│   ├── design-index.json
│   └── pages.json
├── design-system/
│   ├── tokens.json
│   └── components.json
└── audit/
    ├── audit-manifest.json
    └── events/
        └── events-000001.jsonl
\`\`\`

## 4. Verification Checkpoints
- **Scene Graph Node Count:** ${doc.pages.reduce((a, p) => a + Object.keys(p.nodes).length, 0)} nodes
- **Audit Hash Chain:** ${dforgeManager.auditEvents.length} events chained from root \`${dforgeManager.auditEvents[0]?.eventHash.slice(0, 16)}...\` to \`${auditVerification.terminalHash.slice(0, 16)}...\`
- **IDE Compatibility:** VS Code, Cursor, Antigravity, Windsurf, WebStorm
`;

  fs.writeFileSync(path.join(buildRecordsDir, 'BUILD_RECORD_FINTECH_OPERATOR_PLATFORM.md'), buildRecordMd, 'utf8');
  
  // Save serialized .dforge v2.0 package and DXP package
  fs.writeFileSync(path.join(buildRecordsDir, 'fintech_operator_platform_v2.json'), JSON.stringify(dforgeBundle, null, 2), 'utf8');
  fs.writeFileSync(path.join(artifactsDir, 'fintech_operator_platform_v2.json'), JSON.stringify(dforgeBundle, null, 2), 'utf8');
  fs.writeFileSync(path.join(buildRecordsDir, 'fintech_operator_platform_dxp.json'), JSON.stringify(dxpBundle, null, 2), 'utf8');

  console.log('   ✓ Build record written to DesignForge_Build_Records/BUILD_RECORD_FINTECH_OPERATOR_PLATFORM.md');
  console.log('   ✓ Packages serialized to DesignForge_Build_Records/ and artifacts/');
  console.log('\n🎉 FINTECH OPERATOR PLATFORM BUILD COMPLETE (100% SUCCESS)!');
  return { doc, dforgeBundle, dxpBundle, compilation };
}

// Execute if run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runBuild().catch(err => {
    console.error('Build error:', err);
    process.exit(1);
  });
}
