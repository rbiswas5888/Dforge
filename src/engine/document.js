/**
 * DesignForge AI - Canonical Document Model & Scene Graph
 * Conforms to document-v1.schema.json
 */

export const SCHEMA_VERSION = '1.0.0';

export function generateId(prefix = 'node') {
  return `${prefix}_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
}

/**
 * Creates default tokens
 */
export function createDefaultTokens() {
  return [
    {
      id: 'tokens_colors',
      name: 'Colors',
      tokens: [
        { id: 'token_brand_primary', name: 'Brand / Primary', type: 'color', value: '#3b82f6' },
        { id: 'token_brand_accent', name: 'Brand / Accent', type: 'color', value: '#8b5cf6' },
        { id: 'token_bg_main', name: 'Background / Main', type: 'color', value: '#0f172a' },
        { id: 'token_bg_surface', name: 'Background / Surface', type: 'color', value: '#1e293b' },
        { id: 'token_bg_elevated', name: 'Background / Elevated', type: 'color', value: '#334155' },
        { id: 'token_text_primary', name: 'Text / Primary', type: 'color', value: '#f8fafc' },
        { id: 'token_text_muted', name: 'Text / Muted', type: 'color', value: '#94a3b8' },
        { id: 'token_border_subtle', name: 'Border / Subtle', type: 'color', value: '#334155' },
        { id: 'token_success', name: 'Status / Success', type: 'color', value: '#10b981' },
        { id: 'token_danger', name: 'Status / Danger', type: 'color', value: '#ef4444' }
      ]
    },
    {
      id: 'tokens_spacing',
      name: 'Spacing',
      tokens: [
        { id: 'token_space_xs', name: 'Space / XS', type: 'dimension', value: 4 },
        { id: 'token_space_sm', name: 'Space / SM', type: 'dimension', value: 8 },
        { id: 'token_space_md', name: 'Space / MD', type: 'dimension', value: 16 },
        { id: 'token_space_lg', name: 'Space / LG', type: 'dimension', value: 24 },
        { id: 'token_space_xl', name: 'Space / XL', type: 'dimension', value: 32 }
      ]
    },
    {
      id: 'tokens_radius',
      name: 'Corner Radius',
      tokens: [
        { id: 'token_radius_sm', name: 'Radius / SM', type: 'dimension', value: 6 },
        { id: 'token_radius_md', name: 'Radius / MD', type: 'dimension', value: 12 },
        { id: 'token_radius_lg', name: 'Radius / LG', type: 'dimension', value: 20 },
        { id: 'token_radius_full', name: 'Radius / Full', type: 'dimension', value: 9999 }
      ]
    }
  ];
}

/**
 * Creates a blank node with standard schema defaults
 */
export function createNode(type, overrides = {}) {
  const id = overrides.id || generateId(type);
  const name = overrides.name || (type.charAt(0).toUpperCase() + type.slice(1));

  const baseNode = {
    id,
    type,
    name,
    parentId: overrides.parentId || null,
    childIds: overrides.childIds || [],
    visible: overrides.visible !== undefined ? overrides.visible : true,
    locked: overrides.locked !== undefined ? overrides.locked : false,
    opacity: overrides.opacity !== undefined ? overrides.opacity : 1,
    componentId: overrides.componentId || null,
    variantId: overrides.variantId || null,
    booleanOperation: overrides.booleanOperation || null,
    transform: {
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      ...(overrides.transform || {})
    },
    layout: {
      mode: 'none', // 'none' | 'stack-horizontal' | 'stack-vertical' | 'grid' | 'absolute'
      paddingTop: 0,
      paddingRight: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      gap: 0,
      alignItems: 'start', // 'start' | 'center' | 'end' | 'stretch'
      justifyContent: 'start', // 'start' | 'center' | 'end' | 'space-between'
      sizingHorizontal: 'fixed', // 'fixed' | 'hug' | 'fill'
      sizingVertical: 'fixed', // 'fixed' | 'hug' | 'fill'
      ...(overrides.layout || {})
    },
    style: {
      fills: overrides.style?.fills || [{ type: 'solid', color: '#334155', opacity: 1 }],
      strokes: overrides.style?.strokes || [],
      cornerRadius: overrides.style?.cornerRadius !== undefined ? overrides.style.cornerRadius : 0,
      shadows: overrides.style?.shadows || [],
      ...(overrides.style || {})
    },
    interactions: overrides.interactions || [],
    tokenBindings: overrides.tokenBindings || {},
    semanticTag: overrides.semanticTag || (type === 'frame' ? 'div' : type === 'text' ? 'p' : 'div'),
    accessibilityLabel: overrides.accessibilityLabel || '',
    metadata: overrides.metadata || {},
    text: overrides.text ? { ...overrides.text } : null
  };

  // Specific node adjustments
  if (type === 'frame') {
    baseNode.transform.width = overrides.transform?.width || 360;
    baseNode.transform.height = overrides.transform?.height || 240;
    baseNode.style.fills = overrides.style?.fills || [{ type: 'solid', color: '#1e293b', opacity: 1 }];
    baseNode.style.cornerRadius = overrides.style?.cornerRadius !== undefined ? overrides.style.cornerRadius : 12;
  } else if (type === 'text') {
    baseNode.transform.width = overrides.transform?.width || 180;
    baseNode.transform.height = overrides.transform?.height || 32;
    baseNode.style.fills = [];
    baseNode.text = {
      content: overrides.text?.content || 'Double click to edit',
      fontFamily: overrides.text?.fontFamily || 'Inter, -apple-system, sans-serif',
      fontSize: overrides.text?.fontSize || 16,
      fontWeight: overrides.text?.fontWeight || '400',
      lineHeight: overrides.text?.lineHeight || 1.4,
      letterSpacing: overrides.text?.letterSpacing || 0,
      textAlign: overrides.text?.textAlign || 'left',
      color: overrides.text?.color || '#f8fafc',
      ...(overrides.text || {})
    };
  } else if (type === 'rectangle') {
    baseNode.style.fills = overrides.style?.fills || [{ type: 'solid', color: '#3b82f6', opacity: 1 }];
    baseNode.style.cornerRadius = overrides.style?.cornerRadius !== undefined ? overrides.style.cornerRadius : 8;
  } else if (type === 'ellipse') {
    baseNode.style.fills = overrides.style?.fills || [{ type: 'solid', color: '#8b5cf6', opacity: 1 }];
    baseNode.style.cornerRadius = 9999;
  } else if (type === 'line') {
    baseNode.style.strokes = overrides.style?.strokes || [{ color: '#38bdf8', width: 2, align: 'center', style: 'solid' }];
    baseNode.style.fills = [];
    baseNode.transform.height = 2;
  } else if (type === 'polygon' || type === 'star') {
    baseNode.style.fills = overrides.style?.fills || [{ type: 'solid', color: '#f59e0b', opacity: 1 }];
    baseNode.style.cornerRadius = 0;
  } else if (type === 'image') {
    baseNode.style.fills = overrides.style?.fills || [{ type: 'image', url: overrides.imageUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80', opacity: 1 }];
    baseNode.style.cornerRadius = overrides.style?.cornerRadius !== undefined ? overrides.style.cornerRadius : 8;
    baseNode.image = { fit: 'cover', url: overrides.imageUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80' };
  } else if (type === 'group') {
    baseNode.type = 'group';
    baseNode.name = overrides.name || 'Group';
    baseNode.style.fills = [];
  } else if (type === 'button') {
    baseNode.type = 'frame';
    baseNode.name = overrides.name || 'Button';
    baseNode.semanticTag = 'button';
    baseNode.transform.width = overrides.transform?.width || 140;
    baseNode.transform.height = overrides.transform?.height || 44;
    baseNode.layout.mode = 'stack-horizontal';
    baseNode.layout.alignItems = 'center';
    baseNode.layout.justifyContent = 'center';
    baseNode.layout.gap = 8;
    baseNode.layout.paddingLeft = 16;
    baseNode.layout.paddingRight = 16;
    baseNode.style.fills = overrides.style?.fills || [{ type: 'solid', color: '#3b82f6', opacity: 1 }];
    baseNode.style.cornerRadius = overrides.style?.cornerRadius !== undefined ? overrides.style.cornerRadius : 8;
  }

  return baseNode;
}


/**
 * Creates a new Page
 */
export function createPage(name = 'Page 1', route = '/') {
  return {
    id: generateId('page'),
    name,
    route,
    background: '#090d16',
    nodes: {},
    rootIds: [],
    seo: {
      title: `${name} | DesignForge AI Project`,
      description: 'Built with DesignForge AI'
    }
  };
}

/**
 * Creates a fully initialized starter document with sample Fintech & SaaS artboards
 */
export function createInitialDocument(name = 'Fintech Experience Platform') {
  const doc = {
    schemaVersion: SCHEMA_VERSION,
    id: generateId('proj'),
    name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    appVersion: '1.0.0',
    exportProfile: {
      framework: 'react-vite-cssmodules',
      typescript: true
    },
    pages: [],
    components: [],
    tokens: createDefaultTokens(),
    assets: []
  };

  const page = createPage('Dashboard', '/');

  // 1. Main Application Shell Frame (1440 x 900)
  const appFrame = createNode('frame', {
    name: 'Desktop App Shell (1440px)',
    transform: { x: 80, y: 80, width: 1200, height: 760 },
    style: {
      fills: [{ type: 'solid', color: '#0f172a', opacity: 1 }],
      strokes: [{ color: '#1e293b', width: 1, align: 'inside' }],
      cornerRadius: 16,
      shadows: [{ x: 0, y: 24, blur: 48, spread: 0, color: 'rgba(0,0,0,0.5)', inner: false }]
    },
    layout: { mode: 'stack-horizontal', alignItems: 'stretch' },
    semanticTag: 'main'
  });

  // 2. Left Sidebar Navigation
  const sidebar = createNode('frame', {
    parentId: appFrame.id,
    name: 'Sidebar Nav',
    transform: { x: 0, y: 0, width: 240, height: 760 },
    style: {
      fills: [{ type: 'solid', color: '#111827', opacity: 1 }],
      strokes: [{ color: '#1f2937', width: 1, align: 'inside' }],
      cornerRadius: 0
    },
    layout: {
      mode: 'stack-vertical',
      paddingTop: 24,
      paddingLeft: 20,
      paddingRight: 20,
      paddingBottom: 24,
      gap: 20
    },
    semanticTag: 'nav'
  });

  // Sidebar Logo
  const logoText = createNode('text', {
    parentId: sidebar.id,
    name: 'App Logo',
    transform: { x: 0, y: 0, width: 200, height: 28 },
    text: { content: '⚡ ForgePay AI', fontSize: 18, fontWeight: '700', color: '#38bdf8' }
  });

  // Nav Item 1: Overview
  const navItem1 = createNode('frame', {
    parentId: sidebar.id,
    name: 'Nav / Overview',
    transform: { x: 0, y: 0, width: 200, height: 40 },
    style: {
      fills: [{ type: 'solid', color: '#1e293b', opacity: 1 }],
      cornerRadius: 8
    },
    layout: { mode: 'stack-horizontal', alignItems: 'center', paddingLeft: 12, paddingRight: 12 },
    semanticTag: 'a'
  });
  const navText1 = createNode('text', {
    parentId: navItem1.id,
    name: 'Nav Label',
    transform: { x: 0, y: 0, width: 160, height: 20 },
    text: { content: '📊 Overview', fontSize: 14, fontWeight: '600', color: '#f8fafc' }
  });
  navItem1.childIds.push(navText1.id);

  // Nav Item 2: Transactions
  const navItem2 = createNode('frame', {
    parentId: sidebar.id,
    name: 'Nav / Transactions',
    transform: { x: 0, y: 0, width: 200, height: 40 },
    style: { fills: [], cornerRadius: 8 },
    layout: { mode: 'stack-horizontal', alignItems: 'center', paddingLeft: 12, paddingRight: 12 },
    semanticTag: 'a'
  });
  const navText2 = createNode('text', {
    parentId: navItem2.id,
    name: 'Nav Label',
    transform: { x: 0, y: 0, width: 160, height: 20 },
    text: { content: '💳 Cards & Accounts', fontSize: 14, fontWeight: '500', color: '#94a3b8' }
  });
  navItem2.childIds.push(navText2.id);

  // Nav Item 3: Analytics
  const navItem3 = createNode('frame', {
    parentId: sidebar.id,
    name: 'Nav / Analytics',
    transform: { x: 0, y: 0, width: 200, height: 40 },
    style: { fills: [], cornerRadius: 8 },
    layout: { mode: 'stack-horizontal', alignItems: 'center', paddingLeft: 12, paddingRight: 12 },
    semanticTag: 'a'
  });
  const navText3 = createNode('text', {
    parentId: navItem3.id,
    name: 'Nav Label',
    transform: { x: 0, y: 0, width: 160, height: 20 },
    text: { content: '📈 AI Insights', fontSize: 14, fontWeight: '500', color: '#94a3b8' }
  });
  navItem3.childIds.push(navText3.id);

  sidebar.childIds.push(logoText.id, navItem1.id, navItem2.id, navItem3.id);

  // 3. Main Content Area
  const contentArea = createNode('frame', {
    parentId: appFrame.id,
    name: 'Dashboard Body',
    transform: { x: 240, y: 0, width: 960, height: 760 },
    style: { fills: [{ type: 'solid', color: '#090d16', opacity: 1 }] },
    layout: {
      mode: 'stack-vertical',
      paddingTop: 32,
      paddingLeft: 36,
      paddingRight: 36,
      paddingBottom: 32,
      gap: 28
    },
    semanticTag: 'section'
  });

  // Header Bar with User Greeting & Search
  const headerBar = createNode('frame', {
    parentId: contentArea.id,
    name: 'Header Bar',
    transform: { x: 0, y: 0, width: 888, height: 48 },
    style: { fills: [] },
    layout: { mode: 'stack-horizontal', alignItems: 'center', justifyContent: 'space-between' }
  });

  const headerTitle = createNode('text', {
    parentId: headerBar.id,
    name: 'Header Title',
    transform: { x: 0, y: 0, width: 340, height: 32 },
    text: { content: 'Executive Treasury Overview', fontSize: 24, fontWeight: '700', color: '#ffffff' }
  });

  // Action Button in Header
  const actionButton = createNode('frame', {
    parentId: headerBar.id,
    name: 'Send Funds CTA',
    transform: { x: 0, y: 0, width: 140, height: 40 },
    style: {
      fills: [{ type: 'solid', color: '#2563eb', opacity: 1 }],
      cornerRadius: 8,
      shadows: [{ x: 0, y: 4, blur: 12, color: 'rgba(37, 99, 235, 0.4)', inner: false }]
    },
    layout: { mode: 'stack-horizontal', alignItems: 'center', justifyContent: 'center' },
    semanticTag: 'button'
  });
  const actionBtnText = createNode('text', {
    parentId: actionButton.id,
    name: 'Button Text',
    transform: { x: 0, y: 0, width: 110, height: 20 },
    text: { content: '+ Transfer Funds', fontSize: 13, fontWeight: '600', color: '#ffffff', textAlign: 'center' }
  });
  actionButton.childIds.push(actionBtnText.id);
  headerBar.childIds.push(headerTitle.id, actionButton.id);

  // 4. Metrics Cards Grid (3 cards horizontally)
  const metricsGrid = createNode('frame', {
    parentId: contentArea.id,
    name: 'Stats Row',
    transform: { x: 0, y: 0, width: 888, height: 140 },
    style: { fills: [] },
    layout: { mode: 'stack-horizontal', gap: 20, alignItems: 'stretch' }
  });

  // Card 1: Total Balance
  const card1 = createNode('frame', {
    parentId: metricsGrid.id,
    name: 'Metric / Total Balance',
    transform: { x: 0, y: 0, width: 282, height: 140 },
    style: {
      fills: [{ type: 'solid', color: '#161e2e', opacity: 1 }],
      strokes: [{ color: '#26334d', width: 1, align: 'inside' }],
      cornerRadius: 12
    },
    layout: { mode: 'stack-vertical', paddingTop: 20, paddingLeft: 20, paddingRight: 20, paddingBottom: 20, gap: 8 }
  });
  const card1Label = createNode('text', {
    parentId: card1.id,
    name: 'Label',
    transform: { x: 0, y: 0, width: 220, height: 18 },
    text: { content: 'Total Portfolio Balance', fontSize: 13, fontWeight: '500', color: '#94a3b8' }
  });
  const card1Value = createNode('text', {
    parentId: card1.id,
    name: 'Value',
    transform: { x: 0, y: 0, width: 220, height: 36 },
    text: { content: '$2,845,920.40', fontSize: 26, fontWeight: '800', color: '#ffffff' }
  });
  const card1Badge = createNode('text', {
    parentId: card1.id,
    name: 'Trend',
    transform: { x: 0, y: 0, width: 220, height: 18 },
    text: { content: '▲ +14.2% from last month', fontSize: 12, fontWeight: '600', color: '#10b981' }
  });
  card1.childIds.push(card1Label.id, card1Value.id, card1Badge.id);

  // Card 2: 30d Inflow
  const card2 = createNode('frame', {
    parentId: metricsGrid.id,
    name: 'Metric / 30d Inflow',
    transform: { x: 0, y: 0, width: 282, height: 140 },
    style: {
      fills: [{ type: 'solid', color: '#161e2e', opacity: 1 }],
      strokes: [{ color: '#26334d', width: 1, align: 'inside' }],
      cornerRadius: 12
    },
    layout: { mode: 'stack-vertical', paddingTop: 20, paddingLeft: 20, paddingRight: 20, paddingBottom: 20, gap: 8 }
  });
  const card2Label = createNode('text', {
    parentId: card2.id,
    name: 'Label',
    transform: { x: 0, y: 0, width: 220, height: 18 },
    text: { content: 'Monthly Global Volume', fontSize: 13, fontWeight: '500', color: '#94a3b8' }
  });
  const card2Value = createNode('text', {
    parentId: card2.id,
    name: 'Value',
    transform: { x: 0, y: 0, width: 220, height: 36 },
    text: { content: '$840,119.00', fontSize: 26, fontWeight: '800', color: '#38bdf8' }
  });
  const card2Badge = createNode('text', {
    parentId: card2.id,
    name: 'Trend',
    transform: { x: 0, y: 0, width: 220, height: 18 },
    text: { content: '⚡ 99.98% instant settlement', fontSize: 12, fontWeight: '500', color: '#94a3b8' }
  });
  card2.childIds.push(card2Label.id, card2Value.id, card2Badge.id);

  // Card 3: Security Status
  const card3 = createNode('frame', {
    parentId: metricsGrid.id,
    name: 'Metric / Vault Protection',
    transform: { x: 0, y: 0, width: 282, height: 140 },
    style: {
      fills: [{ type: 'solid', color: '#161e2e', opacity: 1 }],
      strokes: [{ color: '#26334d', width: 1, align: 'inside' }],
      cornerRadius: 12
    },
    layout: { mode: 'stack-vertical', paddingTop: 20, paddingLeft: 20, paddingRight: 20, paddingBottom: 20, gap: 8 }
  });
  const card3Label = createNode('text', {
    parentId: card3.id,
    name: 'Label',
    transform: { x: 0, y: 0, width: 220, height: 18 },
    text: { content: 'Multi-Sig Vault Health', fontSize: 13, fontWeight: '500', color: '#94a3b8' }
  });
  const card3Value = createNode('text', {
    parentId: card3.id,
    name: 'Value',
    transform: { x: 0, y: 0, width: 220, height: 36 },
    text: { content: '100% Secure', fontSize: 26, fontWeight: '800', color: '#10b981' }
  });
  const card3Badge = createNode('text', {
    parentId: card3.id,
    name: 'Trend',
    transform: { x: 0, y: 0, width: 220, height: 18 },
    text: { content: '🔒 Hardware KMS Enclave active', fontSize: 12, fontWeight: '500', color: '#94a3b8' }
  });
  card3.childIds.push(card3Label.id, card3Value.id, card3Badge.id);

  metricsGrid.childIds.push(card1.id, card2.id, card3.id);

  // 5. Recent Activity / Transactions Table Section
  const tableSection = createNode('frame', {
    parentId: contentArea.id,
    name: 'Transactions Card',
    transform: { x: 0, y: 0, width: 888, height: 420 },
    style: {
      fills: [{ type: 'solid', color: '#111827', opacity: 1 }],
      strokes: [{ color: '#1f2937', width: 1, align: 'inside' }],
      cornerRadius: 12
    },
    layout: {
      mode: 'stack-vertical',
      paddingTop: 24,
      paddingLeft: 24,
      paddingRight: 24,
      paddingBottom: 24,
      gap: 16
    }
  });

  const tableHeader = createNode('text', {
    parentId: tableSection.id,
    name: 'Section Title',
    transform: { x: 0, y: 0, width: 300, height: 24 },
    text: { content: 'Recent Enterprise Transactions', fontSize: 16, fontWeight: '700', color: '#ffffff' }
  });

  // Table row generator helper
  function makeRow(id, title, sub, amount, statusColor, statusText) {
    const row = createNode('frame', {
      parentId: tableSection.id,
      name: `Row / ${title}`,
      transform: { x: 0, y: 0, width: 840, height: 52 },
      style: {
        fills: [{ type: 'solid', color: '#161f30', opacity: 1 }],
        cornerRadius: 8
      },
      layout: { mode: 'stack-horizontal', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 16, paddingRight: 16 }
    });

    const colLeft = createNode('frame', {
      parentId: row.id,
      name: 'Col Left',
      transform: { x: 0, y: 0, width: 360, height: 36 },
      style: { fills: [] },
      layout: { mode: 'stack-vertical', gap: 2 }
    });
    const rowTitle = createNode('text', {
      parentId: colLeft.id,
      name: 'Title',
      transform: { x: 0, y: 0, width: 300, height: 18 },
      text: { content: title, fontSize: 14, fontWeight: '600', color: '#f8fafc' }
    });
    const rowSub = createNode('text', {
      parentId: colLeft.id,
      name: 'Subtitle',
      transform: { x: 0, y: 0, width: 300, height: 14 },
      text: { content: sub, fontSize: 12, fontWeight: '400', color: '#64748b' }
    });
    colLeft.childIds.push(rowTitle.id, rowSub.id);

    const colRight = createNode('frame', {
      parentId: row.id,
      name: 'Col Right',
      transform: { x: 0, y: 0, width: 240, height: 36 },
      style: { fills: [] },
      layout: { mode: 'stack-horizontal', alignItems: 'center', justifyContent: 'end', gap: 16 }
    });
    const rowAmount = createNode('text', {
      parentId: colRight.id,
      name: 'Amount',
      transform: { x: 0, y: 0, width: 140, height: 20 },
      text: { content: amount, fontSize: 15, fontWeight: '700', color: '#ffffff', textAlign: 'right' }
    });
    const statusBadge = createNode('frame', {
      parentId: colRight.id,
      name: 'Status Badge',
      transform: { x: 0, y: 0, width: 78, height: 26 },
      style: { fills: [{ type: 'solid', color: statusColor, opacity: 0.15 }], cornerRadius: 13 },
      layout: { mode: 'stack-horizontal', alignItems: 'center', justifyContent: 'center' }
    });
    const badgeText = createNode('text', {
      parentId: statusBadge.id,
      name: 'Badge Text',
      transform: { x: 0, y: 0, width: 70, height: 14 },
      text: { content: statusText, fontSize: 11, fontWeight: '600', color: statusColor, textAlign: 'center' }
    });
    statusBadge.childIds.push(badgeText.id);
    colRight.childIds.push(rowAmount.id, statusBadge.id);

    row.childIds.push(colLeft.id, colRight.id);
    return [row, colLeft, rowTitle, rowSub, colRight, rowAmount, statusBadge, badgeText];
  }

  const row1Nodes = makeRow(1, 'Anthropic PBC Cloud API Settlement', 'Invoice #INV-2026-881 • ACH Transfer', '-$14,250.00', '#10b981', 'Completed');
  const row2Nodes = makeRow(2, 'Stripe Global Merchant Payout', 'Batch #B-9921 • Automated Settlement', '+$124,500.00', '#10b981', 'Completed');
  const row3Nodes = makeRow(3, 'Google Cloud EMEA Infrastructure', 'Compute & BigQuery storage reservation', '-$8,490.20', '#f59e0b', 'Pending');
  const row4Nodes = makeRow(4, 'Sequoia Capital Seed Disbursement', 'Treasury wire receipt', '+$500,000.00', '#10b981', 'Completed');

  tableSection.childIds.push(tableHeader.id, row1Nodes[0].id, row2Nodes[0].id, row3Nodes[0].id, row4Nodes[0].id);

  contentArea.childIds.push(headerBar.id, metricsGrid.id, tableSection.id);
  appFrame.childIds.push(sidebar.id, contentArea.id);

  // Put all nodes into the page
  const allNodes = [
    appFrame, sidebar, logoText, navItem1, navText1, navItem2, navText2, navItem3, navText3,
    contentArea, headerBar, headerTitle, actionButton, actionBtnText,
    metricsGrid, card1, card1Label, card1Value, card1Badge,
    card2, card2Label, card2Value, card2Badge,
    card3, card3Label, card3Value, card3Badge,
    tableSection, tableHeader,
    ...row1Nodes, ...row2Nodes, ...row3Nodes, ...row4Nodes
  ];

  for (const n of allNodes) {
    page.nodes[n.id] = n;
  }
  page.rootIds.push(appFrame.id);

  // 6. Mobile Breakpoint Preview Frame (375 x 812)
  const mobileFrame = createNode('frame', {
    name: 'Mobile Screen (375px)',
    transform: { x: 1340, y: 80, width: 375, height: 760 },
    style: {
      fills: [{ type: 'solid', color: '#090d16', opacity: 1 }],
      strokes: [{ color: '#334155', width: 2, align: 'inside' }],
      cornerRadius: 36,
      shadows: [{ x: 0, y: 20, blur: 40, color: 'rgba(0,0,0,0.6)', inner: false }]
    },
    layout: { mode: 'stack-vertical', paddingTop: 36, paddingLeft: 20, paddingRight: 20, paddingBottom: 24, gap: 20 }
  });

  const mobTitle = createNode('text', {
    parentId: mobileFrame.id,
    name: 'Mobile App Title',
    transform: { x: 0, y: 0, width: 335, height: 28 },
    text: { content: '⚡ ForgePay Mobile', fontSize: 18, fontWeight: '700', color: '#ffffff' }
  });

  const mobCard = createNode('frame', {
    parentId: mobileFrame.id,
    name: 'Balance Card Mobile',
    transform: { x: 0, y: 0, width: 335, height: 160 },
    style: {
      fills: [{ type: 'solid', color: '#2563eb', opacity: 1 }],
      cornerRadius: 16,
      shadows: [{ x: 0, y: 8, blur: 24, color: 'rgba(37,99,235,0.4)', inner: false }]
    },
    layout: { mode: 'stack-vertical', paddingTop: 20, paddingLeft: 20, paddingRight: 20, paddingBottom: 20, gap: 8 }
  });
  const mobCardLabel = createNode('text', {
    parentId: mobCard.id,
    name: 'Card Label',
    transform: { x: 0, y: 0, width: 295, height: 16 },
    text: { content: 'Total Portfolio Balance', fontSize: 13, fontWeight: '500', color: '#bfdbfe' }
  });
  const mobCardVal = createNode('text', {
    parentId: mobCard.id,
    name: 'Card Amount',
    transform: { x: 0, y: 0, width: 295, height: 36 },
    text: { content: '$2,845,920.40', fontSize: 26, fontWeight: '800', color: '#ffffff' }
  });
  const mobCardSub = createNode('text', {
    parentId: mobCard.id,
    name: 'Card Sub',
    transform: { x: 0, y: 0, width: 295, height: 16 },
    text: { content: '●●●● 8821  •  Exp 09/29', fontSize: 12, fontWeight: '500', color: '#93c5fd' }
  });
  mobCard.childIds.push(mobCardLabel.id, mobCardVal.id, mobCardSub.id);

  const mobActions = createNode('frame', {
    parentId: mobileFrame.id,
    name: 'Quick Action Row',
    transform: { x: 0, y: 0, width: 335, height: 50 },
    style: { fills: [] },
    layout: { mode: 'stack-horizontal', gap: 12, alignItems: 'stretch' }
  });

  const btnSend = createNode('frame', {
    parentId: mobActions.id,
    name: 'Btn Send',
    transform: { x: 0, y: 0, width: 161, height: 50 },
    style: { fills: [{ type: 'solid', color: '#1e293b', opacity: 1 }], cornerRadius: 10 },
    layout: { mode: 'stack-horizontal', alignItems: 'center', justifyContent: 'center' },
    semanticTag: 'button'
  });
  const btnSendTxt = createNode('text', {
    parentId: btnSend.id,
    name: 'Send Txt',
    transform: { x: 0, y: 0, width: 120, height: 20 },
    text: { content: '↑ Send', fontSize: 14, fontWeight: '600', color: '#ffffff', textAlign: 'center' }
  });
  btnSend.childIds.push(btnSendTxt.id);

  const btnReceive = createNode('frame', {
    parentId: mobActions.id,
    name: 'Btn Receive',
    transform: { x: 0, y: 0, width: 161, height: 50 },
    style: { fills: [{ type: 'solid', color: '#1e293b', opacity: 1 }], cornerRadius: 10 },
    layout: { mode: 'stack-horizontal', alignItems: 'center', justifyContent: 'center' },
    semanticTag: 'button'
  });
  const btnRecTxt = createNode('text', {
    parentId: btnReceive.id,
    name: 'Rec Txt',
    transform: { x: 0, y: 0, width: 120, height: 20 },
    text: { content: '↓ Receive', fontSize: 14, fontWeight: '600', color: '#ffffff', textAlign: 'center' }
  });
  btnReceive.childIds.push(btnRecTxt.id);

  mobActions.childIds.push(btnSend.id, btnReceive.id);

  mobileFrame.childIds.push(mobTitle.id, mobCard.id, mobActions.id);

  const mobileNodes = [mobileFrame, mobTitle, mobCard, mobCardLabel, mobCardVal, mobCardSub, mobActions, btnSend, btnSendTxt, btnReceive, btnRecTxt];
  for (const n of mobileNodes) {
    page.nodes[n.id] = n;
  }
  page.rootIds.push(mobileFrame.id);

  doc.pages.push(page);
  return doc;
}

/**
 * Page Management Helpers
 */
export function addPageToDoc(doc, name = 'New Page', route = null) {
  const pageCount = doc.pages.length + 1;
  const pageName = name || `Page ${pageCount}`;
  const pageRoute = route || `/${pageName.toLowerCase().replace(/\s+/g, '-')}`;
  const newPage = createPage(pageName, pageRoute);
  doc.pages.push(newPage);
  return newPage;
}

export function duplicatePageInDoc(doc, pageId) {
  const source = doc.pages.find(p => p.id === pageId);
  if (!source) return null;
  const clone = JSON.parse(JSON.stringify(source));
  clone.id = generateId('page');
  clone.name = `${source.name} (Copy)`;
  clone.route = `${source.route}-copy`;
  doc.pages.push(clone);
  return clone;
}

export function deletePageFromDoc(doc, pageId) {
  if (doc.pages.length <= 1) return false; // Prevent deleting only page
  const idx = doc.pages.findIndex(p => p.id === pageId);
  if (idx !== -1) {
    doc.pages.splice(idx, 1);
    return true;
  }
  return false;
}

export function renamePageInDoc(doc, pageId, newName) {
  const page = doc.pages.find(p => p.id === pageId);
  if (page && newName?.trim()) {
    page.name = newName.trim();
    return true;
  }
  return false;
}

/**
 * Interactive Comments System Helpers
 */
export function addCommentToDoc(doc, comment) {
  if (!doc.comments) doc.comments = [];
  const commentObj = {
    id: generateId('comment'),
    x: comment.x || 100,
    y: comment.y || 100,
    pageId: comment.pageId || doc.pages[0]?.id,
    author: comment.author || 'Product Designer',
    text: comment.text || 'Review note',
    createdAt: new Date().toISOString(),
    resolved: false
  };
  doc.comments.push(commentObj);
  return commentObj;
}

export function resolveCommentInDoc(doc, commentId) {
  if (!doc.comments) return false;
  const c = doc.comments.find(item => item.id === commentId);
  if (c) {
    c.resolved = !c.resolved;
    return true;
  }
  return false;
}
