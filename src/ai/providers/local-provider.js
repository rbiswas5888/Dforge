/**
 * DesignForge AI - Built-in Local Intelligence Provider
 * Zero-latency, deterministic design generator operating entirely within client memory
 */

import { BaseProvider } from './provider-base.js';
import { createNode, generateId } from '../../engine/document.js';

export class LocalProvider extends BaseProvider {
  constructor(config = {}) {
    super({
      name: 'local',
      model: 'DesignForge-Local-v1.2',
      ...config
    });
  }

  async testConnection() {
    return { success: true, message: 'Local Built-in Design Engine is ready and operating offline.' };
  }

  async generate(prompt, context, options = {}) {
    const { signal, onProgress } = options;
    this.checkSignal(signal);

    if (onProgress) onProgress({ step: 1, total: 3, message: 'Analyzing design context and intent...' });

    // Artificial tiny tick to simulate planner evaluation and respect AbortSignal
    await new Promise(r => setTimeout(r, 60));
    this.checkSignal(signal);

    if (onProgress) onProgress({ step: 2, total: 3, message: 'Synthesizing layout hierarchy and design tokens...' });

    const cleanPrompt = prompt.trim().toLowerCase();
    let plan;

    // 0. Enterprise Banking Operations Command Centre
    if (
      cleanPrompt.includes('banking') ||
      cleanPrompt.includes('command centre') ||
      cleanPrompt.includes('command center') ||
      (cleanPrompt.includes('operations') && cleanPrompt.includes('dashboard'))
    ) {
      plan = this.synthesizeBankingOperationsDashboard();
    }
    // 1. Enterprise SaaS Dashboard
    else if (cleanPrompt.includes('dashboard') || cleanPrompt.includes('saas') || cleanPrompt.includes('kpi') || cleanPrompt.includes('fintech')) {
      plan = this.synthesizeEnterpriseDashboard();
    }
    // 2. SaaS Pricing Table
    else if (cleanPrompt.includes('pricing') || cleanPrompt.includes('tier') || cleanPrompt.includes('plan')) {
      plan = this.synthesizePricingTable();
    }
    // 3. Hero Landing Section
    else if (cleanPrompt.includes('hero') || cleanPrompt.includes('landing') || cleanPrompt.includes('banner')) {
      plan = this.synthesizeHeroSection();
    }
    // 4. Authentication Form Card
    else if (cleanPrompt.includes('login') || cleanPrompt.includes('auth') || cleanPrompt.includes('sign in')) {
      plan = this.synthesizeAuthCard();
    }
    // 5. Contextual Edit: Auto Layout & Spacing
    else if (context.selection?.length > 0 && (cleanPrompt.includes('auto layout') || cleanPrompt.includes('stack') || cleanPrompt.includes('gap') || cleanPrompt.includes('align') || cleanPrompt.includes('spacing'))) {
      plan = this.synthesizeLayoutAdjustment(cleanPrompt, context.selection);
    }
    // 6. Contextual Edit: Dark Theme Tokens
    else if (cleanPrompt.includes('dark') || cleanPrompt.includes('theme') || cleanPrompt.includes('tokens')) {
      plan = this.synthesizeThemeApplication(context);
    }
    // 7. Contextual Edit: Mobile Viewport Frame (375px)
    else if (cleanPrompt.includes('mobile') || cleanPrompt.includes('responsive')) {
      plan = this.synthesizeMobileAdaptiveFrame(context.selection[0]);
    }
    // 8. Minimalist Refactoring
    else if (cleanPrompt.includes('minimal')) {
      plan = this.synthesizeMinimalistRefactor(context.selection);
    }
    // 9. Fallback: Metric Card Component
    else {
      plan = this.synthesizeGenericMetricCard(prompt);
    }

    this.checkSignal(signal);
    if (onProgress) onProgress({ step: 3, total: 3, message: 'Validating structured operations...' });

    return plan;
  }

  synthesizeBankingOperationsDashboard() {
    const allNodes = [];
    const c_blue_950 = '#071B36';
    const c_blue_900 = '#0B2545';
    const c_blue_700 = '#1757A6';
    const c_blue_600 = '#1769D2';
    const c_blue_500 = '#287FE5';
    const c_neutral_900 = '#1D2939';
    const c_neutral_700 = '#475467';
    const c_neutral_600 = '#667085';
    const c_neutral_200 = '#EAECF0';
    const c_neutral_50 = '#F8FAFC';
    const c_white = '#FFFFFF';
    const c_success = '#16A36A';
    const c_success_bg = '#E8F7EF';
    const c_warning = '#D99016';
    const c_critical = '#DC4242';
    const c_ai = '#7956D8';
    const c_ai_bg = '#F1EDFF';
    const c_teal = '#159A9C';

    const rootFrame = createNode('frame', {
      name: 'Enterprise Banking Operations Command Centre (1440px)',
      componentId: 'paper',
      transform: { x: 80, y: 920, width: 1440, height: 3200 },
      style: {
        fills: [{ type: 'solid', color: c_neutral_50, opacity: 1 }],
        strokes: [{ color: c_neutral_200, width: 1, align: 'inside' }]
      },
      tokenBindings: {
        'style.fills.0.color': 'token_bg_main',
        'style.strokes.0.color': 'token_border_subtle'
      },
      layout: { mode: 'stack-horizontal', alignItems: 'stretch' },
      semanticTag: 'main'
    });
    allNodes.push(rootFrame);

    // Sidebar Nav (248px)
    const sidebar = createNode('frame', {
      parentId: rootFrame.id,
      name: 'Sidebar Navigation',
      componentId: 'paper',
      transform: { x: 0, y: 0, width: 248, height: 3200 },
      style: { fills: [{ type: 'solid', color: c_blue_950, opacity: 1 }], strokes: [{ color: '#102A4E', width: 1 }] },
      tokenBindings: {
        'style.fills.0.color': 'token_bg_surface',
        'style.strokes.0.color': 'token_border_subtle'
      },
      layout: { mode: 'stack-vertical', paddingTop: 24, paddingLeft: 16, paddingRight: 16, paddingBottom: 24, gap: 10 },
      semanticTag: 'nav'
    });
    allNodes.push(sidebar);

    const logo = createNode('text', {
      parentId: sidebar.id,
      name: 'Logo',
      transform: { x: 0, y: 0, width: 216, height: 32 },
      text: { content: '⚡ BANCORP COMMAND', fontSize: 15, fontWeight: '800', color: c_white },
      tokenBindings: { 'text.color': 'token_brand_primary' }
    });
    sidebar.childIds.push(logo.id);
    allNodes.push(logo);

    const navItems = [
      ['Overview', '📊', true],
      ['Transactions', '💳', false],
      ['Payments', '💸', false],
      ['Reconciliation', '⚖️', false],
      ['Settlement', '🤝', false],
      ['Risk & Fraud', '🛡️', false],
      ['Exceptions', '⚠️', false],
      ['Reports & Analytics', '📈', false],
      ['Operational Teams', '👥', false],
      ['System Monitoring', '🖥️', false]
    ];

    for (const [label, icon, isActive] of navItems) {
      const navItem = createNode('frame', {
        parentId: sidebar.id,
        name: `Nav / ${label}`,
        transform: { x: 0, y: 0, width: 216, height: 36 },
        style: {
          fills: [{ type: 'solid', color: isActive ? c_blue_700 : 'transparent', opacity: 1 }],
          cornerRadius: 6
        },
        layout: { mode: 'stack-horizontal', alignItems: 'center', paddingLeft: 12, paddingRight: 12 }
      });
      const navTxt = createNode('text', {
        parentId: navItem.id,
        name: 'Label',
        transform: { x: 0, y: 0, width: 192, height: 18 },
        text: { content: `${icon}  ${label}`, fontSize: 13, fontWeight: isActive ? '600' : '400', color: isActive ? c_white : '#98A2B3' }
      });
      navItem.childIds.push(navTxt.id);
      sidebar.childIds.push(navItem.id);
      allNodes.push(navItem, navTxt);
    }

    // Main Content Workspace (1192px)
    const cardContainerW = 1144;
    const body = createNode('frame', {
      parentId: rootFrame.id,
      name: 'Operations Workspace',
      transform: { x: 248, y: 0, width: 1192, height: 3200 },
      style: { fills: [{ type: 'solid', color: c_neutral_50, opacity: 1 }] },
      tokenBindings: { 'style.fills.0.color': 'token_bg_main' },
      layout: { mode: 'stack-vertical', paddingTop: 20, paddingLeft: 24, paddingRight: 24, paddingBottom: 40, gap: 20 }
    });
    allNodes.push(body);

    // 1. Top Navigation
    const topNav = createNode('frame', {
      parentId: body.id,
      name: 'Top Navigation Header',
      transform: { x: 0, y: 0, width: cardContainerW, height: 54 },
      style: { fills: [{ type: 'solid', color: c_white, opacity: 1 }], strokes: [{ color: c_neutral_200, width: 1 }], cornerRadius: 8 },
      layout: { mode: 'stack-horizontal', justifyContent: 'space-between', alignItems: 'center', paddingLeft: 16, paddingRight: 16 }
    });
    const org = createNode('text', {
      parentId: topNav.id,
      name: 'Org Selector',
      transform: { x: 0, y: 0, width: 280, height: 20 },
      text: { content: '🏢 Global Banking Corp • Production Ledger', fontSize: 13, fontWeight: '600', color: c_blue_900 }
    });
    const search = createNode('frame', {
      parentId: topNav.id,
      name: 'Global Search Field',
      componentId: 'textfield',
      transform: { x: 0, y: 0, width: 340, height: 36 },
      style: { fills: [{ type: 'solid', color: '#F2F4F7', opacity: 1 }], cornerRadius: 6 },
      layout: { mode: 'stack-horizontal', alignItems: 'center', paddingLeft: 12 }
    });
    const searchTxt = createNode('text', {
      parentId: search.id,
      name: 'Search Placeholder',
      transform: { x: 0, y: 0, width: 310, height: 18 },
      text: { content: '🔍 Search Transaction ID, UTR, Account, Exception...', fontSize: 12, color: c_neutral_600 }
    });
    search.childIds.push(searchTxt.id);

    const metaRight = createNode('frame', {
      parentId: topNav.id,
      name: 'Top Nav Metadata & User',
      transform: { x: 0, y: 0, width: 380, height: 36 },
      style: { fills: [] },
      layout: { mode: 'stack-horizontal', alignItems: 'center', justifyContent: 'end', gap: 12 }
    });
    const dateTxt = createNode('text', { parentId: metaRight.id, name: 'Date', transform: { x: 0, y: 0, width: 130, height: 18 }, text: { content: '📅 Last 24 Hours • Live', fontSize: 12, fontWeight: '500', color: c_neutral_700 } });
    const envPill = createNode('text', { parentId: metaRight.id, name: 'Env', transform: { x: 0, y: 0, width: 120, height: 18 }, text: { content: '🟢 PROD • Mumbai DC', fontSize: 12, fontWeight: '600', color: c_success } });
    const notifPill = createNode('text', { parentId: metaRight.id, name: 'Notif', transform: { x: 0, y: 0, width: 40, height: 18 }, text: { content: '🔔 14', fontSize: 12, fontWeight: '700', color: c_blue_600 } });
    const userTxt = createNode('text', { parentId: metaRight.id, name: 'User', transform: { x: 0, y: 0, width: 70, height: 18 }, text: { content: '👤 Ops Lead', fontSize: 12, fontWeight: '600', color: c_blue_900 } });
    metaRight.childIds.push(dateTxt.id, envPill.id, notifPill.id, userTxt.id);

    topNav.childIds.push(org.id, search.id, metaRight.id);
    body.childIds.push(topNav.id);
    allNodes.push(topNav, org, search, searchTxt, metaRight, dateTxt, envPill, notifPill, userTxt);

    // 2. Section A: Page Header Bar
    const secA = createNode('frame', {
      parentId: body.id,
      name: 'Section A: Page Header Bar',
      transform: { x: 0, y: 0, width: cardContainerW, height: 64 },
      style: { fills: [] },
      layout: { mode: 'stack-horizontal', justifyContent: 'space-between', alignItems: 'center' }
    });
    const titleGrp = createNode('frame', {
      parentId: secA.id,
      name: 'Title & Subtitle',
      transform: { x: 0, y: 0, width: 680, height: 54 },
      style: { fills: [] },
      layout: { mode: 'stack-vertical', gap: 4 }
    });
    const mainTitle = createNode('text', { parentId: titleGrp.id, name: 'Title', transform: { x: 0, y: 0, width: 600, height: 28 }, text: { content: 'Banking Operations Overview', fontSize: 24, fontWeight: '700', color: c_blue_950 } });
    const mainSubtitle = createNode('text', { parentId: titleGrp.id, name: 'Subtitle', transform: { x: 0, y: 0, width: 680, height: 18 }, text: { content: 'Monitor transaction processing, financial performance, risk and operational efficiency.', fontSize: 13, color: c_neutral_600 } });
    titleGrp.childIds.push(mainTitle.id, mainSubtitle.id);

    const actionGrp = createNode('frame', {
      parentId: secA.id,
      name: 'Actions Grp',
      transform: { x: 0, y: 0, width: 420, height: 40 },
      style: { fills: [] },
      layout: { mode: 'stack-horizontal', alignItems: 'center', justifyContent: 'end', gap: 12 }
    });
    const slaPill = createNode('frame', {
      parentId: actionGrp.id,
      name: 'SLA Badge',
      transform: { x: 0, y: 0, width: 160, height: 32 },
      style: { fills: [{ type: 'solid', color: c_success_bg, opacity: 1 }], strokes: [{ color: '#B7E6CD', width: 1 }], cornerRadius: 16 },
      layout: { mode: 'stack-horizontal', alignItems: 'center', justifyContent: 'center' }
    });
    const slaPillTxt = createNode('text', { parentId: slaPill.id, name: 'SLA Txt', transform: { x: 0, y: 0, width: 140, height: 16 }, text: { content: '● SLA: 99.4% (Optimal)', fontSize: 11, fontWeight: '600', color: c_success, textAlign: 'center' } });
    slaPill.childIds.push(slaPillTxt.id);

    const expBtn = createNode('frame', {
      parentId: actionGrp.id,
      name: 'Export Action Button',
      componentId: 'button',
      transform: { x: 0, y: 0, width: 170, height: 36 },
      style: { fills: [{ type: 'solid', color: c_blue_600, opacity: 1 }], cornerRadius: 6 },
      layout: { mode: 'stack-horizontal', alignItems: 'center', justifyContent: 'center' }
    });
    const expBtnTxt = createNode('text', { parentId: expBtn.id, name: 'Export Label', transform: { x: 0, y: 0, width: 140, height: 18 }, text: { content: '📥 Export Report (CSV)', fontSize: 12, fontWeight: '600', color: c_white, textAlign: 'center' } });
    expBtn.childIds.push(expBtnTxt.id);
    actionGrp.childIds.push(slaPill.id, expBtn.id);

    secA.childIds.push(titleGrp.id, actionGrp.id);
    body.childIds.push(secA.id);
    allNodes.push(secA, titleGrp, mainTitle, mainSubtitle, actionGrp, slaPill, slaPillTxt, expBtn, expBtnTxt);

    // 3. Section B: 4 Executive KPI Cards
    const secB = createNode('frame', {
      parentId: body.id,
      name: 'Section B: Executive KPI Cards',
      transform: { x: 0, y: 0, width: cardContainerW, height: 140 },
      style: { fills: [] },
      layout: { mode: 'stack-horizontal', gap: 16, alignItems: 'stretch' }
    });
    const kpiCardW = (cardContainerW - (3 * 16)) / 4;
    const kpis = [
      { lbl: 'Total Transaction Volume', val: '₹248.6 Cr', chg: '▲ +12.8% vs prev period', sub: 'Mini line trend: Steady velocity', color: c_blue_600 },
      { lbl: 'Successful Transactions', val: '98.42%', chg: '▲ +1.24%', sub: '1,842,500 / 1,872,000 attempts', color: c_success },
      { lbl: 'Pending Transactions', val: '12,845', chg: '▲ +8.2%', sub: 'Hourly trend peak (Ageing >30m: 142)', color: c_warning },
      { lbl: 'Failed Transactions', val: '1,248', chg: 'Rate: 0.12%', sub: 'Primary: Bank Host Timeout (68%)', color: c_critical }
    ];

    for (const spec of kpis) {
      const card = createNode('frame', {
        parentId: secB.id,
        name: `KPI / ${spec.lbl}`,
        componentId: 'card',
        transform: { x: 0, y: 0, width: kpiCardW, height: 140 },
        style: { fills: [{ type: 'solid', color: c_white, opacity: 1 }], strokes: [{ color: c_neutral_200, width: 1 }], cornerRadius: 10 },
        tokenBindings: { 'style.fills.0.color': 'token_bg_surface', 'style.cornerRadius': 'token_radius_md' },
        layout: { mode: 'stack-vertical', paddingTop: 16, paddingLeft: 18, paddingRight: 18, paddingBottom: 16, gap: 6 }
      });
      const kl = createNode('text', { parentId: card.id, name: 'Label', transform: { x: 0, y: 0, width: kpiCardW - 36, height: 16 }, text: { content: spec.lbl, fontSize: 12, fontWeight: '600', color: c_neutral_600 } });
      const kv = createNode('text', { parentId: card.id, name: 'Val', transform: { x: 0, y: 0, width: kpiCardW - 36, height: 34 }, text: { content: spec.val, fontSize: 24, fontWeight: '700', color: c_blue_950 } });
      const kc = createNode('text', { parentId: card.id, name: 'Change', transform: { x: 0, y: 0, width: kpiCardW - 36, height: 16 }, text: { content: spec.chg, fontSize: 11, fontWeight: '600', color: spec.color } });
      const ks = createNode('text', { parentId: card.id, name: 'Sub', transform: { x: 0, y: 0, width: kpiCardW - 36, height: 14 }, text: { content: spec.sub, fontSize: 10, color: c_neutral_600 } });
      card.childIds.push(kl.id, kv.id, kc.id, ks.id);
      secB.childIds.push(card.id);
      allNodes.push(card, kl, kv, kc, ks);
    }
    body.childIds.push(secB.id);
    allNodes.push(secB);

    // 4. Section C: Transaction Volume & Performance Chart
    const secC = createNode('frame', {
      parentId: body.id,
      name: 'Section C: Transaction Volume & Performance Chart',
      componentId: 'card',
      transform: { x: 0, y: 0, width: cardContainerW, height: 270 },
      style: { fills: [{ type: 'solid', color: c_white, opacity: 1 }], strokes: [{ color: c_neutral_200, width: 1 }], cornerRadius: 10 },
      layout: { mode: 'stack-vertical', paddingTop: 20, paddingLeft: 22, paddingRight: 22, paddingBottom: 20, gap: 14 }
    });
    const chartHead = createNode('frame', {
      parentId: secC.id,
      name: 'Chart Head',
      transform: { x: 0, y: 0, width: cardContainerW - 44, height: 32 },
      style: { fills: [] },
      layout: { mode: 'stack-horizontal', justifyContent: 'space-between', alignItems: 'center' }
    });
    const ct = createNode('text', { parentId: chartHead.id, name: 'Title', transform: { x: 0, y: 0, width: 420, height: 20 }, text: { content: 'Transaction Volume & Processing Performance (Multi-Series)', fontSize: 14, fontWeight: '600', color: c_blue_900 } });
    const ctabs = createNode('text', { parentId: chartHead.id, name: 'Tabs', transform: { x: 0, y: 0, width: 280, height: 20 }, text: { content: '[24 Hours (Active)]  •  7 Days  •  30 Days  •  90 Days', fontSize: 11, fontWeight: '600', color: c_blue_600, textAlign: 'right' } });
    chartHead.childIds.push(ct.id, ctabs.id);

    const chartStage = createNode('frame', {
      parentId: secC.id,
      name: 'Chart Stage Visual',
      transform: { x: 0, y: 0, width: cardContainerW - 44, height: 170 },
      style: { fills: [{ type: 'solid', color: '#F8FAFC', opacity: 1 }], strokes: [{ color: c_neutral_200, width: 1 }], cornerRadius: 6 },
      layout: { mode: 'stack-vertical', justifyContent: 'center', alignItems: 'center', gap: 8 }
    });
    const cvis = createNode('text', { parentId: chartStage.id, name: 'Curves', transform: { x: 0, y: 0, width: 800, height: 50 }, text: { content: '📈 ━━━━━ Volume ₹ (Peak: ₹38.4 Cr/hr) ━━━━━ Success Rate: 98.42% ━━━━━ Failure Rate: 0.12%', fontSize: 13, fontWeight: '600', color: c_blue_600, textAlign: 'center' } });
    const cgrid = createNode('text', { parentId: chartStage.id, name: 'Scale', transform: { x: 0, y: 0, width: 800, height: 20 }, text: { content: '00:00        04:00        08:00        12:00 (Peak)        16:00        20:00        23:59 (Current)', fontSize: 11, color: c_neutral_600, textAlign: 'center' } });
    chartStage.childIds.push(cvis.id, cgrid.id);

    secC.childIds.push(chartHead.id, chartStage.id);
    body.childIds.push(secC.id);
    allNodes.push(secC, chartHead, ct, ctabs, chartStage, cvis, cgrid);

    // 5. Section D: Payment Channels & Status
    const secD = createNode('frame', {
      parentId: body.id,
      name: 'Section D: Payment Channels & Status',
      transform: { x: 0, y: 0, width: cardContainerW, height: 240 },
      style: { fills: [] },
      layout: { mode: 'stack-horizontal', gap: 16 }
    });
    const halfW = (cardContainerW - 16) / 2;

    const cardD1 = createNode('frame', {
      parentId: secD.id,
      name: 'Card 1: Payment Channel Distribution',
      componentId: 'card',
      transform: { x: 0, y: 0, width: halfW, height: 240 },
      style: { fills: [{ type: 'solid', color: c_white, opacity: 1 }], strokes: [{ color: c_neutral_200, width: 1 }], cornerRadius: 10 },
      layout: { mode: 'stack-vertical', paddingTop: 18, paddingLeft: 20, paddingRight: 20, paddingBottom: 18, gap: 10 }
    });
    const d1t = createNode('text', { parentId: cardD1.id, name: 'Title', transform: { x: 0, y: 0, width: halfW - 40, height: 20 }, text: { content: 'Payment Channel Distribution (Donut Metrics)', fontSize: 13, fontWeight: '600', color: c_blue_900 } });
    const ch1 = createNode('text', { parentId: cardD1.id, name: 'UPI', transform: { x: 0, y: 0, width: halfW - 40, height: 24 }, text: { content: '• UPI: 48.2% (₹120.1 Cr • 902,400 TXs)', fontSize: 12, fontWeight: '600', color: c_blue_600 } });
    const ch2 = createNode('text', { parentId: cardD1.id, name: 'NEFT', transform: { x: 0, y: 0, width: halfW - 40, height: 24 }, text: { content: '• NEFT: 24.1% (₹60.0 Cr • 451,200 TXs)', fontSize: 12, fontWeight: '600', color: c_teal } });
    const ch3 = createNode('text', { parentId: cardD1.id, name: 'IMPS', transform: { x: 0, y: 0, width: halfW - 40, height: 24 }, text: { content: '• IMPS: 17.5% (₹43.5 Cr • 327,600 TXs)', fontSize: 12, fontWeight: '600', color: c_ai } });
    const ch4 = createNode('text', { parentId: cardD1.id, name: 'RTGS', transform: { x: 0, y: 0, width: halfW - 40, height: 24 }, text: { content: '• RTGS: 10.2% (₹25.0 Cr • 190,800 TXs)', fontSize: 12, fontWeight: '600', color: '#559EED' } });
    cardD1.childIds.push(d1t.id, ch1.id, ch2.id, ch3.id, ch4.id);

    const cardD2 = createNode('frame', {
      parentId: secD.id,
      name: 'Card 2: Transaction Status Distribution',
      componentId: 'card',
      transform: { x: 0, y: 0, width: halfW, height: 240 },
      style: { fills: [{ type: 'solid', color: c_white, opacity: 1 }], strokes: [{ color: c_neutral_200, width: 1 }], cornerRadius: 10 },
      layout: { mode: 'stack-vertical', paddingTop: 18, paddingLeft: 20, paddingRight: 20, paddingBottom: 18, gap: 10 }
    });
    const d2t = createNode('text', { parentId: cardD2.id, name: 'Title', transform: { x: 0, y: 0, width: halfW - 40, height: 20 }, text: { content: 'Transaction Status Distribution (Live Volume)', fontSize: 13, fontWeight: '600', color: c_blue_900 } });
    const st1 = createNode('text', { parentId: cardD2.id, name: 'Succ', transform: { x: 0, y: 0, width: halfW - 40, height: 24 }, text: { content: '✓ Successful: 98.42% (1,842,500 attempts)', fontSize: 12, fontWeight: '600', color: c_success } });
    const st2 = createNode('text', { parentId: cardD2.id, name: 'Proc', transform: { x: 0, y: 0, width: halfW - 40, height: 24 }, text: { content: '⏳ Processing: 0.80% (14,976 in-flight)', fontSize: 12, fontWeight: '600', color: c_blue_500 } });
    const st3 = createNode('text', { parentId: cardD2.id, name: 'Pend', transform: { x: 0, y: 0, width: halfW - 40, height: 24 }, text: { content: '⏸️ Pending: 0.66% (12,845 in queue)', fontSize: 12, fontWeight: '600', color: c_warning } });
    const st4 = createNode('text', { parentId: cardD2.id, name: 'Fail', transform: { x: 0, y: 0, width: halfW - 40, height: 24 }, text: { content: '✕ Failed: 0.12% (1,248 exceptions)', fontSize: 12, fontWeight: '600', color: c_critical } });
    cardD2.childIds.push(d2t.id, st1.id, st2.id, st3.id, st4.id);

    secD.childIds.push(cardD1.id, cardD2.id);
    body.childIds.push(secD.id);
    allNodes.push(secD, cardD1, d1t, ch1, ch2, ch3, ch4, cardD2, d2t, st1, st2, st3, st4);

    // 6. Section E: Risk and Fraud Monitoring
    const secE = createNode('frame', {
      parentId: body.id,
      name: 'Section E: Risk and Fraud Monitoring',
      transform: { x: 0, y: 0, width: cardContainerW, height: 220 },
      style: { fills: [] },
      layout: { mode: 'stack-horizontal', gap: 16 }
    });
    const cardE1 = createNode('frame', {
      parentId: secE.id,
      name: 'Card 1: Fraud Detection Overview',
      componentId: 'card',
      transform: { x: 0, y: 0, width: halfW, height: 220 },
      style: { fills: [{ type: 'solid', color: c_white, opacity: 1 }], strokes: [{ color: c_neutral_200, width: 1 }], cornerRadius: 10 },
      layout: { mode: 'stack-vertical', paddingTop: 18, paddingLeft: 20, paddingRight: 20, paddingBottom: 18, gap: 8 }
    });
    const e1t = createNode('text', { parentId: cardE1.id, name: 'Title', transform: { x: 0, y: 0, width: halfW - 40, height: 20 }, text: { content: 'Fraud Detection & Risk Exposure', fontSize: 13, fontWeight: '600', color: c_blue_900 } });
    const f1 = createNode('text', { parentId: cardE1.id, name: 'Exp', transform: { x: 0, y: 0, width: halfW - 40, height: 20 }, text: { content: '• Exposed Transaction Value: ₹1.42 Cr', fontSize: 12, fontWeight: '700', color: c_critical } });
    const f2 = createNode('text', { parentId: cardE1.id, name: 'Flag', transform: { x: 0, y: 0, width: halfW - 40, height: 20 }, text: { content: '• Flagged Transactions: 342  |  Under Investigation: 86', fontSize: 12, color: c_neutral_700 } });
    const f3 = createNode('text', { parentId: cardE1.id, name: 'Blk', transform: { x: 0, y: 0, width: halfW - 40, height: 20 }, text: { content: '• Automated Blocked TXs: 256  |  False Positive Rate: 0.04%', fontSize: 12, color: c_neutral_700 } });
    cardE1.childIds.push(e1t.id, f1.id, f2.id, f3.id);

    const cardE2 = createNode('frame', {
      parentId: secE.id,
      name: 'Card 2: Risk Severity Distribution',
      componentId: 'card',
      transform: { x: 0, y: 0, width: halfW, height: 220 },
      style: { fills: [{ type: 'solid', color: c_white, opacity: 1 }], strokes: [{ color: c_neutral_200, width: 1 }], cornerRadius: 10 },
      layout: { mode: 'stack-vertical', paddingTop: 18, paddingLeft: 20, paddingRight: 20, paddingBottom: 18, gap: 8 }
    });
    const e2t = createNode('text', { parentId: cardE2.id, name: 'Title', transform: { x: 0, y: 0, width: halfW - 40, height: 20 }, text: { content: 'Risk Severity Breakdown (Active Queues)', fontSize: 13, fontWeight: '600', color: c_blue_900 } });
    const r1 = createNode('text', { parentId: cardE2.id, name: 'Crit', transform: { x: 0, y: 0, width: halfW - 40, height: 20 }, text: { content: '🔴 Critical: 14 cases (Immediate Freeze)', fontSize: 12, fontWeight: '600', color: c_critical } });
    const r2 = createNode('text', { parentId: cardE2.id, name: 'High', transform: { x: 0, y: 0, width: halfW - 40, height: 20 }, text: { content: '🟠 High: 42 cases (Manual Review required)', fontSize: 12, fontWeight: '600', color: c_warning } });
    const r3 = createNode('text', { parentId: cardE2.id, name: 'Med', transform: { x: 0, y: 0, width: halfW - 40, height: 20 }, text: { content: '🔵 Medium: 118 cases  |  🟢 Low: 168 cases', fontSize: 12, color: c_neutral_700 } });
    cardE2.childIds.push(e2t.id, r1.id, r2.id, r3.id);

    secE.childIds.push(cardE1.id, cardE2.id);
    body.childIds.push(secE.id);
    allNodes.push(secE, cardE1, e1t, f1, f2, f3, cardE2, e2t, r1, r2, r3);

    // 7. Section F: Settlement and Reconciliation
    const secF = createNode('frame', {
      parentId: body.id,
      name: 'Section F: Settlement and Reconciliation',
      componentId: 'card',
      transform: { x: 0, y: 0, width: cardContainerW, height: 200 },
      style: { fills: [{ type: 'solid', color: c_white, opacity: 1 }], strokes: [{ color: c_neutral_200, width: 1 }], cornerRadius: 10 },
      layout: { mode: 'stack-vertical', paddingTop: 18, paddingLeft: 22, paddingRight: 22, paddingBottom: 18, gap: 10 }
    });
    const ft = createNode('text', { parentId: secF.id, name: 'Title', transform: { x: 0, y: 0, width: cardContainerW - 44, height: 20 }, text: { content: 'Settlement Performance & Reconciliation Variance', fontSize: 13, fontWeight: '600', color: c_blue_900 } });
    const fm = createNode('text', { parentId: secF.id, name: 'Summary', transform: { x: 0, y: 0, width: cardContainerW - 44, height: 22 }, text: { content: 'Total Settlement: ₹248.60 Cr  •  Reconciled: ₹234.15 Cr (94.1%)  •  Unreconciled / Pending: ₹14.45 Cr (5.9%)  •  Unmatched: 42 TXs', fontSize: 12, fontWeight: '600', color: c_neutral_900 } });
    const fbar = createNode('frame', {
      parentId: secF.id,
      name: 'Progress',
      transform: { x: 0, y: 0, width: cardContainerW - 44, height: 36 },
      style: { fills: [{ type: 'solid', color: c_success_bg, opacity: 1 }], cornerRadius: 6 },
      layout: { mode: 'stack-horizontal', alignItems: 'center', paddingLeft: 12 }
    });
    const ftxt = createNode('text', { parentId: fbar.id, name: 'Txt', transform: { x: 0, y: 0, width: 700, height: 18 }, text: { content: '✓ T+0 Settlement Cycle 4 of 6 Completed • Clearing variance 0.002% within tolerance thresholds.', fontSize: 12, color: c_success } });
    fbar.childIds.push(ftxt.id);

    secF.childIds.push(ft.id, fm.id, fbar.id);
    body.childIds.push(secF.id);
    allNodes.push(secF, ft, fm, fbar, ftxt);

    // 8. Section G: Operational SLA Monitoring
    const secG = createNode('frame', {
      parentId: body.id,
      name: 'Section G: Operational SLA Monitoring',
      transform: { x: 0, y: 0, width: cardContainerW, height: 180 },
      style: { fills: [] },
      layout: { mode: 'stack-horizontal', gap: 16 }
    });
    const cardG1 = createNode('frame', {
      parentId: secG.id,
      name: 'Card 1: SLA Performance',
      componentId: 'card',
      transform: { x: 0, y: 0, width: halfW, height: 180 },
      style: { fills: [{ type: 'solid', color: c_white, opacity: 1 }], strokes: [{ color: c_neutral_200, width: 1 }], cornerRadius: 10 },
      layout: { mode: 'stack-vertical', paddingTop: 16, paddingLeft: 20, paddingRight: 20, paddingBottom: 16, gap: 6 }
    });
    const g1t = createNode('text', { parentId: cardG1.id, name: 'Title', transform: { x: 0, y: 0, width: halfW - 40, height: 20 }, text: { content: 'Operational SLA Performance', fontSize: 13, fontWeight: '600', color: c_blue_900 } });
    const g1v = createNode('text', { parentId: cardG1.id, name: 'Val', transform: { x: 0, y: 0, width: halfW - 40, height: 30 }, text: { content: '99.40% Compliance (Target: 99.0%)', fontSize: 18, fontWeight: '700', color: c_success } });
    const g1s = createNode('text', { parentId: cardG1.id, name: 'Sub', transform: { x: 0, y: 0, width: halfW - 40, height: 18 }, text: { content: 'Within-SLA: 99.4%  |  Breached Rate: 0.60% (112 TXs)', fontSize: 12, color: c_neutral_600 } });
    cardG1.childIds.push(g1t.id, g1v.id, g1s.id);

    const cardG2 = createNode('frame', {
      parentId: secG.id,
      name: 'Card 2: Processing Latency',
      componentId: 'card',
      transform: { x: 0, y: 0, width: halfW, height: 180 },
      style: { fills: [{ type: 'solid', color: c_white, opacity: 1 }], strokes: [{ color: c_neutral_200, width: 1 }], cornerRadius: 10 },
      layout: { mode: 'stack-vertical', paddingTop: 16, paddingLeft: 20, paddingRight: 20, paddingBottom: 16, gap: 6 }
    });
    const g2t = createNode('text', { parentId: cardG2.id, name: 'Title', transform: { x: 0, y: 0, width: halfW - 40, height: 20 }, text: { content: 'Transaction Processing Latency', fontSize: 13, fontWeight: '600', color: c_blue_900 } });
    const g2v = createNode('text', { parentId: cardG2.id, name: 'Val', transform: { x: 0, y: 0, width: halfW - 40, height: 30 }, text: { content: 'Avg: 118 ms  •  P95: 242 ms  •  P99: 485 ms', fontSize: 18, fontWeight: '700', color: c_blue_600 } });
    const g2s = createNode('text', { parentId: cardG2.id, name: 'Sub', transform: { x: 0, y: 0, width: halfW - 40, height: 18 }, text: { content: 'Sub-500ms SLA Commitment: PASS across all payment gateways', fontSize: 12, color: c_neutral_600 } });
    cardG2.childIds.push(g2t.id, g2v.id, g2s.id);

    secG.childIds.push(cardG1.id, cardG2.id);
    body.childIds.push(secG.id);
    allNodes.push(secG, cardG1, g1t, g1v, g1s, cardG2, g2t, g2v, g2s);

    // 9. Section H: Operational Exceptions Table (AG Grid)
    const secH = createNode('frame', {
      parentId: body.id,
      name: 'Section H: Operational Exceptions Table',
      componentId: 'ag-grid-table',
      transform: { x: 0, y: 0, width: cardContainerW, height: 320 },
      style: { fills: [{ type: 'solid', color: c_white, opacity: 1 }], strokes: [{ color: c_neutral_200, width: 1 }], cornerRadius: 10 },
      layout: { mode: 'stack-vertical', paddingTop: 18, paddingLeft: 20, paddingRight: 20, paddingBottom: 18, gap: 10 }
    });
    const hHead = createNode('frame', {
      parentId: secH.id,
      name: 'Title & Actions',
      transform: { x: 0, y: 0, width: cardContainerW - 40, height: 28 },
      style: { fills: [] },
      layout: { mode: 'stack-horizontal', justifyContent: 'space-between', alignItems: 'center' }
    });
    const ht = createNode('text', { parentId: hHead.id, name: 'Title', transform: { x: 0, y: 0, width: 340, height: 20 }, text: { content: 'High-Density Operational Exceptions Queue', fontSize: 13, fontWeight: '600', color: c_blue_900 } });
    const ha = createNode('text', { parentId: hHead.id, name: 'Action', transform: { x: 0, y: 0, width: 300, height: 18 }, text: { content: '🔍 Filter: Critical Only  |  Bulk Action: Resolve (3)', fontSize: 11, fontWeight: '600', color: c_blue_600, textAlign: 'right' } });
    hHead.childIds.push(ht.id, ha.id);

    const tblTh = createNode('frame', {
      parentId: secH.id,
      name: 'Table Header',
      transform: { x: 0, y: 0, width: cardContainerW - 40, height: 36 },
      style: { fills: [{ type: 'solid', color: '#F2F4F7', opacity: 1 }], cornerRadius: 4 },
      layout: { mode: 'stack-horizontal', alignItems: 'center', paddingLeft: 12, paddingRight: 12 }
    });
    const thCols = [
      { name: 'Transaction ID', w: 140 },
      { name: 'Time', w: 100 },
      { name: 'Channel', w: 90 },
      { name: 'Amount (₹)', w: 130, align: 'right' },
      { name: 'Failure Reason', w: 200 },
      { name: 'Priority', w: 90 },
      { name: 'Assigned Team', w: 120 },
      { name: 'Action', w: 90, align: 'right' }
    ];
    for (const c of thCols) {
      const thTxt = createNode('text', { parentId: tblTh.id, name: 'TH', transform: { x: 0, y: 0, width: c.w, height: 16 }, text: { content: c.name, fontSize: 11, fontWeight: '600', color: c_neutral_700, textAlign: c.align || 'left' } });
      tblTh.childIds.push(thTxt.id);
      allNodes.push(thTxt);
    }

    const row1 = createNode('frame', {
      parentId: secH.id,
      name: 'Row: TX-984210',
      transform: { x: 0, y: 0, width: cardContainerW - 40, height: 44 },
      style: { fills: [{ type: 'solid', color: c_white, opacity: 1 }], strokes: [{ color: '#F2F4F7', width: 1 }] },
      layout: { mode: 'stack-horizontal', alignItems: 'center', paddingLeft: 12, paddingRight: 12 }
    });
    const r1Cells = [
      { text: 'TX-984210', w: 140, color: c_blue_600, weight: '600' },
      { text: '16:32:04', w: 100, color: c_neutral_600 },
      { text: 'NEFT', w: 90, color: c_neutral_700, weight: '500' },
      { text: '₹4,25,000.00', w: 130, color: c_blue_950, weight: '700', align: 'right' },
      { text: 'Bank Host Timeout', w: 200, color: c_critical },
      { text: '🔴 Critical', w: 90, color: c_critical, weight: '700' },
      { text: 'Settlement Ops', w: 120, color: c_neutral_700 },
      { text: '[Retry TX]', w: 90, color: c_blue_600, weight: '600', align: 'right' }
    ];
    for (const cell of r1Cells) {
      const cTxt = createNode('text', { parentId: row1.id, name: 'Cell', transform: { x: 0, y: 0, width: cell.w, height: 16 }, text: { content: cell.text, fontSize: 12, fontWeight: cell.weight || '400', color: cell.color, textAlign: cell.align || 'left' } });
      row1.childIds.push(cTxt.id);
      allNodes.push(cTxt);
    }

    secH.childIds.push(hHead.id, tblTh.id, row1.id);
    body.childIds.push(secH.id);
    allNodes.push(secH, hHead, ht, ha, tblTh, row1);

    // 10. Section I: Recent Transaction Stream (AG Grid)
    const secI = createNode('frame', {
      parentId: body.id,
      name: 'Section I: Recent Transaction Stream',
      componentId: 'ag-grid-table',
      transform: { x: 0, y: 0, width: cardContainerW, height: 260 },
      style: { fills: [{ type: 'solid', color: c_white, opacity: 1 }], strokes: [{ color: c_neutral_200, width: 1 }], cornerRadius: 10 },
      layout: { mode: 'stack-vertical', paddingTop: 18, paddingLeft: 20, paddingRight: 20, paddingBottom: 18, gap: 10 }
    });
    const it = createNode('text', { parentId: secI.id, name: 'Title', transform: { x: 0, y: 0, width: cardContainerW - 40, height: 20 }, text: { content: 'Recent Transaction Stream (Audit Trail & Risk Scoring)', fontSize: 13, fontWeight: '600', color: c_blue_900 } });

    const txTh = createNode('frame', {
      parentId: secI.id,
      name: 'Header',
      transform: { x: 0, y: 0, width: cardContainerW - 40, height: 32 },
      style: { fills: [{ type: 'solid', color: '#F2F4F7', opacity: 1 }], cornerRadius: 4 },
      layout: { mode: 'stack-horizontal', alignItems: 'center', paddingLeft: 12, paddingRight: 12 }
    });
    const txCols = [
      { name: 'Transaction ID', w: 160 },
      { name: 'Customer ID', w: 160 },
      { name: 'Method', w: 100 },
      { name: 'Amount (₹)', w: 150, align: 'right' },
      { name: 'Settlement Gateway', w: 180 },
      { name: 'Status', w: 140 },
      { name: 'Risk Score', w: 110, align: 'right' }
    ];
    for (const c of txCols) {
      const thTxt = createNode('text', { parentId: txTh.id, name: 'TH', transform: { x: 0, y: 0, width: c.w, height: 16 }, text: { content: c.name, fontSize: 11, fontWeight: '600', color: c_neutral_700, textAlign: c.align || 'left' } });
      txTh.childIds.push(thTxt.id);
      allNodes.push(thTxt);
    }

    const txR1 = createNode('frame', {
      parentId: secI.id,
      name: 'Row: TX-88301',
      transform: { x: 0, y: 0, width: cardContainerW - 40, height: 40 },
      style: { fills: [{ type: 'solid', color: c_white, opacity: 1 }], strokes: [{ color: '#F2F4F7', width: 1 }] },
      layout: { mode: 'stack-horizontal', alignItems: 'center', paddingLeft: 12, paddingRight: 12 }
    });
    const txR1Cells = [
      { text: 'TX-88301 • UPI', w: 160, color: c_blue_600, weight: '600' },
      { text: 'CUST-7721 (Verified)', w: 160, color: c_neutral_700 },
      { text: 'UPI / QR', w: 100, color: c_neutral_600 },
      { text: '₹24,500.00', w: 150, color: c_blue_950, weight: '700', align: 'right' },
      { text: 'HDFC Node-1', w: 180, color: c_neutral_600 },
      { text: '✓ Completed', w: 140, color: c_success, weight: '600' },
      { text: '0.02 (Low)', w: 110, color: c_neutral_600, align: 'right' }
    ];
    for (const cell of txR1Cells) {
      const cTxt = createNode('text', { parentId: txR1.id, name: 'Cell', transform: { x: 0, y: 0, width: cell.w, height: 16 }, text: { content: cell.text, fontSize: 12, fontWeight: cell.weight || '400', color: cell.color, textAlign: cell.align || 'left' } });
      txR1.childIds.push(cTxt.id);
      allNodes.push(cTxt);
    }

    secI.childIds.push(it.id, txTh.id, txR1.id);
    body.childIds.push(secI.id);
    allNodes.push(secI, it, txTh, txR1);

    // 11. Section 10: AI Operational Intelligence Panel
    const sec10 = createNode('frame', {
      parentId: body.id,
      name: 'Section 10: AI Operational Intelligence Panel',
      componentId: 'card',
      transform: { x: 0, y: 0, width: cardContainerW, height: 220 },
      style: { fills: [{ type: 'solid', color: c_ai_bg, opacity: 1 }], strokes: [{ color: '#C4B5FD', width: 1 }], cornerRadius: 10 },
      layout: { mode: 'stack-vertical', paddingTop: 18, paddingLeft: 22, paddingRight: 22, paddingBottom: 18, gap: 12 }
    });
    const ait = createNode('text', { parentId: sec10.id, name: 'Panel Title', transform: { x: 0, y: 0, width: cardContainerW - 44, height: 22 }, text: { content: '⚡ AI Operational Intelligence & Diagnostic Insights (Real-Time)', fontSize: 14, fontWeight: '700', color: c_ai } });

    const aiRow = createNode('frame', {
      parentId: sec10.id,
      name: 'AI Insights Row',
      transform: { x: 0, y: 0, width: cardContainerW - 44, height: 140 },
      style: { fills: [] },
      layout: { mode: 'stack-horizontal', gap: 12, alignItems: 'stretch' }
    });
    const aiCardW = (cardContainerW - 68) / 3;
    const aiInsights = [
      { head: '📈 Performance Insight', headColor: c_blue_600, body: 'UPI rail throughput surged +18.4% during 14:00–16:00. Gateway headroom remained optimal (peak 42% buffer).' },
      { head: '🛡️ Risk & Fraud Pattern', headColor: c_critical, body: 'Cluster of 14 rapid micro-transfers detected from Subnet 192.168.x. Auto-held ₹3.2 Lakhs for secondary biometric verification.' },
      { head: '💡 Operational Action', headColor: c_ai, body: 'Pending NEFT queue (12,845 items) approaching 17:00 clearing window. Recommend initiating secondary settlement worker.' }
    ];
    for (const ai of aiInsights) {
      const aic = createNode('frame', {
        parentId: aiRow.id,
        name: 'AI Card',
        transform: { x: 0, y: 0, width: aiCardW, height: 140 },
        style: { fills: [{ type: 'solid', color: c_white, opacity: 1 }], cornerRadius: 8 },
        layout: { mode: 'stack-vertical', paddingTop: 12, paddingLeft: 14, paddingRight: 14, paddingBottom: 12, gap: 6 }
      });
      const aih = createNode('text', { parentId: aic.id, name: 'Head', transform: { x: 0, y: 0, width: 300, height: 16 }, text: { content: ai.head, fontSize: 12, fontWeight: '700', color: ai.headColor } });
      const aib = createNode('text', { parentId: aic.id, name: 'Body', transform: { x: 0, y: 0, width: 300, height: 80 }, text: { content: ai.body, fontSize: 11, color: c_neutral_700 } });
      aic.childIds.push(aih.id, aib.id);
      aiRow.childIds.push(aic.id);
      allNodes.push(aic, aih, aib);
    }
    sec10.childIds.push(ait.id, aiRow.id);
    body.childIds.push(sec10.id);
    allNodes.push(sec10, ait, aiRow);

    rootFrame.childIds.push(sidebar.id, body.id);

    return {
      intent: 'Generate Enterprise Banking Operations Command Centre',
      explanation: 'Constructed 1440px enterprise banking operations command centre with Left Sidebar, Executive KPIs, Transaction Analytics, Payment Channels, Risk/Fraud, Reconciliation, SLA Latency, Exceptions Table, Audit Stream, and AI Intelligence.',
      operations: [{ op: 'createTree', rootNode: rootFrame, allNodes }]
    };
  }

  synthesizeEnterpriseDashboard() {
    const rootFrame = createNode('frame', {
      name: 'Enterprise Cloud SaaS Dashboard (1200px)',
      componentId: 'paper',
      transform: { x: 80, y: 920, width: 1200, height: 760 },
      style: {
        fills: [{ type: 'solid', color: '#0b0f19', opacity: 1 }],
        strokes: [{ color: '#1e293b', width: 1, align: 'inside' }],
        cornerRadius: 16
      },
      tokenBindings: {
        'style.fills.0.color': 'token_bg_main',
        'style.strokes.0.color': 'token_border_subtle'
      },
      layout: { mode: 'stack-horizontal', alignItems: 'stretch' },
      semanticTag: 'main'
    });

    // Sidebar Nav
    const sidebar = createNode('frame', {
      parentId: rootFrame.id,
      name: 'Navigation Sidebar',
      componentId: 'paper',
      transform: { x: 0, y: 0, width: 220, height: 760 },
      style: { fills: [{ type: 'solid', color: '#111827', opacity: 1 }], strokes: [{ color: '#1f2937', width: 1 }] },
      tokenBindings: {
        'style.fills.0.color': 'token_bg_surface',
        'style.strokes.0.color': 'token_border_subtle'
      },
      layout: { mode: 'stack-vertical', paddingTop: 24, paddingLeft: 20, paddingRight: 20, paddingBottom: 24, gap: 16 },
      semanticTag: 'nav'
    });
    const logo = createNode('text', {
      parentId: sidebar.id,
      name: 'Logo',
      transform: { x: 0, y: 0, width: 180, height: 28 },
      text: { content: '⚡ CloudPulse AI', fontSize: 16, fontWeight: '700', color: '#38bdf8' },
      tokenBindings: { 'text.color': 'token_brand_primary' }
    });
    sidebar.childIds.push(logo.id);

    // Dashboard Content
    const body = createNode('frame', {
      parentId: rootFrame.id,
      name: 'Dashboard Workspace',
      transform: { x: 220, y: 0, width: 980, height: 760 },
      style: { fills: [{ type: 'solid', color: '#090d16', opacity: 1 }] },
      tokenBindings: { 'style.fills.0.color': 'token_bg_main' },
      layout: { mode: 'stack-vertical', paddingTop: 32, paddingLeft: 32, paddingRight: 32, paddingBottom: 32, gap: 24 }
    });

    const header = createNode('frame', {
      parentId: body.id,
      name: 'Header Row',
      transform: { x: 0, y: 0, width: 916, height: 44 },
      style: { fills: [] },
      layout: { mode: 'stack-horizontal', alignItems: 'center', justifyContent: 'space-between' }
    });
    const title = createNode('text', {
      parentId: header.id,
      name: 'Title',
      transform: { x: 0, y: 0, width: 340, height: 28 },
      text: { content: 'Cloud Compute Infrastructure', fontSize: 22, fontWeight: '700', color: '#ffffff' },
      tokenBindings: { 'text.color': 'token_text_primary' }
    });
    header.childIds.push(title.id);

    // Primary Action Button (MUI Button)
    const headerBtn = createNode('frame', {
      parentId: header.id,
      name: 'Primary Button',
      componentId: 'button',
      transform: { x: 0, y: 0, width: 140, height: 38 },
      style: {
        fills: [{ type: 'solid', color: '#3b82f6', opacity: 1 }],
        cornerRadius: 8
      },
      tokenBindings: {
        'style.fills.0.color': 'token_brand_primary',
        'style.cornerRadius': 'token_radius_sm'
      },
      layout: { mode: 'stack-horizontal', alignItems: 'center', justifyContent: 'center' },
      semanticTag: 'button'
    });
    const headerBtnTxt = createNode('text', {
      parentId: headerBtn.id,
      name: 'Button Label',
      transform: { x: 0, y: 0, width: 110, height: 18 },
      text: { content: '+ New Cluster', fontSize: 13, fontWeight: '600', color: '#ffffff', textAlign: 'center' },
      tokenBindings: { 'text.color': 'token_text_primary' }
    });
    headerBtn.childIds.push(headerBtnTxt.id);
    header.childIds.push(headerBtn.id);

    // KPI Cards Row
    const kpiRow = createNode('frame', {
      parentId: body.id,
      name: 'KPI Row',
      transform: { x: 0, y: 0, width: 916, height: 130 },
      style: { fills: [] },
      layout: { mode: 'stack-horizontal', gap: 20, alignItems: 'stretch' }
    });

    const kpis = [
      { label: 'Active Microservices', val: '1,428', note: '99.99% operational', color: '#10b981' },
      { label: 'Network Throughput', val: '48.2 Gbps', note: '▲ +18% peak bandwidth', color: '#38bdf8' },
      { label: 'Monthly Compute Burn', val: '$38,490', note: 'Within $45k budget', color: '#94a3b8' }
    ];

    const allNodes = [rootFrame, sidebar, logo, body, header, title, headerBtn, headerBtnTxt, kpiRow];

    for (const k of kpis) {
      const card = createNode('frame', {
        parentId: kpiRow.id,
        name: `KPI / ${k.label}`,
        componentId: 'card',
        transform: { x: 0, y: 0, width: 292, height: 130 },
        style: { fills: [{ type: 'solid', color: '#131b2c', opacity: 1 }], strokes: [{ color: '#222f47', width: 1 }], cornerRadius: 12 },
        tokenBindings: {
          'style.fills.0.color': 'token_bg_surface',
          'style.strokes.0.color': 'token_border_subtle',
          'style.cornerRadius': 'token_radius_md'
        },
        layout: { mode: 'stack-vertical', paddingTop: 20, paddingLeft: 20, paddingRight: 20, paddingBottom: 20, gap: 8 }
      });
      const lbl = createNode('text', {
        parentId: card.id,
        name: 'Label',
        transform: { x: 0, y: 0, width: 240, height: 16 },
        text: { content: k.label, fontSize: 13, fontWeight: '500', color: '#94a3b8' },
        tokenBindings: { 'text.color': 'token_text_muted' }
      });
      const val = createNode('text', {
        parentId: card.id,
        name: 'Value',
        transform: { x: 0, y: 0, width: 240, height: 32 },
        text: { content: k.val, fontSize: 24, fontWeight: '800', color: '#ffffff' },
        tokenBindings: { 'text.color': 'token_text_primary' }
      });
      const note = createNode('text', {
        parentId: card.id,
        name: 'Note',
        transform: { x: 0, y: 0, width: 240, height: 16 },
        text: { content: k.note, fontSize: 12, fontWeight: '500', color: k.color },
        tokenBindings: { 'text.color': 'token_success' }
      });
      card.childIds.push(lbl.id, val.id, note.id);
      kpiRow.childIds.push(card.id);
      allNodes.push(card, lbl, val, note);
    }

    // Telemetry Table (AG Grid Component)
    const tableFrame = createNode('frame', {
      parentId: body.id,
      name: 'Infrastructure Telemetry Table',
      componentId: 'ag-grid-table',
      transform: { x: 0, y: 0, width: 916, height: 320 },
      style: {
        fills: [{ type: 'solid', color: '#131b2c', opacity: 1 }],
        strokes: [{ color: '#222f47', width: 1 }],
        cornerRadius: 12
      },
      tokenBindings: {
        'style.fills.0.color': 'token_bg_surface',
        'style.strokes.0.color': 'token_border_subtle',
        'style.cornerRadius': 'token_radius_md'
      },
      layout: { mode: 'stack-vertical', paddingTop: 18, paddingLeft: 20, paddingRight: 20, paddingBottom: 18, gap: 12 }
    });
    const tableTitle = createNode('text', {
      parentId: tableFrame.id,
      name: 'Table Header',
      transform: { x: 0, y: 0, width: 400, height: 22 },
      text: { content: 'Cluster Node Pools & Allocations (AG Grid)', fontSize: 14, fontWeight: '700', color: '#ffffff' },
      tokenBindings: { 'text.color': 'token_text_primary' }
    });
    tableFrame.childIds.push(tableTitle.id);
    body.childIds.push(header.id, kpiRow.id, tableFrame.id);
    rootFrame.childIds.push(sidebar.id, body.id);
    allNodes.push(tableFrame, tableTitle);

    return {
      intent: 'Generate Enterprise Cloud SaaS Dashboard',
      explanation: 'Constructed responsive 1200px SaaS dashboard containing navigation sidebar, KPI metric cards, and cloud telemetry headers.',
      operations: [{ op: 'createTree', rootNode: rootFrame, allNodes }]
    };
  }

  synthesizePricingTable() {
    const rootFrame = createNode('frame', {
      name: 'AI Generated: SaaS Pricing Section',
      componentId: 'paper',
      transform: { x: 80, y: 920, width: 1080, height: 460 },
      style: { fills: [{ type: 'solid', color: '#090d16', opacity: 1 }], strokes: [{ color: '#1e293b', width: 1 }], cornerRadius: 20 },
      tokenBindings: {
        'style.fills.0.color': 'token_bg_main',
        'style.strokes.0.color': 'token_border_subtle'
      },
      layout: { mode: 'stack-vertical', paddingTop: 36, paddingLeft: 36, paddingRight: 36, paddingBottom: 36, gap: 28, alignItems: 'center' }
    });

    const header = createNode('text', {
      parentId: rootFrame.id,
      name: 'Title',
      transform: { x: 0, y: 0, width: 600, height: 32 },
      text: { content: 'Predictable Cloud Pricing Plans', fontSize: 24, fontWeight: '800', textAlign: 'center', color: '#ffffff' },
      tokenBindings: { 'text.color': 'token_text_primary' }
    });
    rootFrame.childIds.push(header.id);

    const cardsRow = createNode('frame', {
      parentId: rootFrame.id,
      name: 'Tiers Row',
      transform: { x: 0, y: 0, width: 1008, height: 320 },
      style: { fills: [] },
      layout: { mode: 'stack-horizontal', gap: 24, alignItems: 'stretch' }
    });

    const allNodes = [rootFrame, header, cardsRow];
    const tiers = [
      { name: 'Starter', price: '$29/mo', desc: 'Unlimited prototypes for small design teams', highlight: false },
      { name: 'Growth Team', price: '$89/mo', desc: 'AI-assisted generation and React export', highlight: true },
      { name: 'Enterprise', price: '$249/mo', desc: 'Dedicated self-hosted inference & SSO', highlight: false }
    ];

    for (const t of tiers) {
      const card = createNode('frame', {
        parentId: cardsRow.id,
        name: `Tier / ${t.name}`,
        componentId: 'card',
        transform: { x: 0, y: 0, width: 320, height: 320 },
        style: {
          fills: [{ type: 'solid', color: t.highlight ? '#1a2436' : '#111827', opacity: 1 }],
          strokes: [{ color: t.highlight ? '#38bdf8' : '#1f2937', width: t.highlight ? 2 : 1 }],
          cornerRadius: 16
        },
        tokenBindings: {
          'style.fills.0.color': 'token_bg_surface',
          'style.strokes.0.color': 'token_border_subtle',
          'style.cornerRadius': 'token_radius_md'
        },
        layout: { mode: 'stack-vertical', paddingTop: 28, paddingLeft: 24, paddingRight: 24, paddingBottom: 28, gap: 16 }
      });
      const tName = createNode('text', {
        parentId: card.id,
        name: 'Name',
        transform: { x: 0, y: 0, width: 270, height: 20 },
        text: { content: t.name, fontSize: 16, fontWeight: '700', color: t.highlight ? '#38bdf8' : '#94a3b8' }
      });
      const tPrice = createNode('text', {
        parentId: card.id,
        name: 'Price',
        transform: { x: 0, y: 0, width: 270, height: 36 },
        text: { content: t.price, fontSize: 32, fontWeight: '800', color: '#ffffff' },
        tokenBindings: { 'text.color': 'token_text_primary' }
      });
      const tDesc = createNode('text', {
        parentId: card.id,
        name: 'Desc',
        transform: { x: 0, y: 0, width: 270, height: 36 },
        text: { content: t.desc, fontSize: 13, fontWeight: '400', color: '#94a3b8' },
        tokenBindings: { 'text.color': 'token_text_muted' }
      });
      const btn = createNode('frame', {
        parentId: card.id,
        name: 'CTA',
        componentId: 'button',
        transform: { x: 0, y: 0, width: 272, height: 44 },
        style: { fills: [{ type: 'solid', color: t.highlight ? '#0284c7' : '#1e293b', opacity: 1 }], cornerRadius: 8 },
        tokenBindings: {
          'style.fills.0.color': t.highlight ? 'token_brand_primary' : 'token_bg_surface',
          'style.cornerRadius': 'token_radius_sm'
        },
        layout: { mode: 'stack-horizontal', alignItems: 'center', justifyContent: 'center' },
        semanticTag: 'button'
      });
      const btnTxt = createNode('text', {
        parentId: btn.id,
        name: 'Label',
        transform: { x: 0, y: 0, width: 200, height: 20 },
        text: { content: 'Choose Plan →', fontSize: 13, fontWeight: '600', color: '#ffffff', textAlign: 'center' }
      });
      btn.childIds.push(btnTxt.id);
      card.childIds.push(tName.id, tPrice.id, tDesc.id, btn.id);
      cardsRow.childIds.push(card.id);
      allNodes.push(card, tName, tPrice, tDesc, btn, btnTxt);
    }

    rootFrame.childIds.push(cardsRow.id);

    return {
      intent: 'Generate SaaS Pricing Table Component',
      explanation: 'Synthesized 3-tier SaaS pricing component complete with feature highlights and responsive CTA buttons.',
      operations: [{ op: 'createTree', rootNode: rootFrame, allNodes }]
    };
  }

  synthesizeHeroSection() {
    const heroFrame = createNode('frame', {
      name: 'AI Generated: Hero Landing Section',
      componentId: 'paper',
      transform: { x: 80, y: 920, width: 1100, height: 400 },
      style: { fills: [{ type: 'solid', color: '#090d16', opacity: 1 }], strokes: [{ color: '#1e293b', width: 1 }], cornerRadius: 24 },
      tokenBindings: {
        'style.fills.0.color': 'token_bg_main',
        'style.strokes.0.color': 'token_border_subtle'
      },
      layout: { mode: 'stack-vertical', paddingTop: 56, paddingLeft: 60, paddingRight: 60, paddingBottom: 56, gap: 20, alignItems: 'center', justifyContent: 'center' }
    });

    const badge = createNode('frame', {
      parentId: heroFrame.id,
      name: 'Badge',
      transform: { x: 0, y: 0, width: 240, height: 32 },
      style: { fills: [{ type: 'solid', color: '#1e293b', opacity: 1 }], strokes: [{ color: '#38bdf8', width: 1 }], cornerRadius: 16 },
      layout: { mode: 'stack-horizontal', alignItems: 'center', justifyContent: 'center' }
    });
    const badgeTxt = createNode('text', {
      parentId: badge.id,
      name: 'Badge Text',
      transform: { x: 0, y: 0, width: 220, height: 16 },
      text: { content: '⚡ DesignForge AI Native v2.0', fontSize: 12, fontWeight: '600', color: '#38bdf8', textAlign: 'center' }
    });
    badge.childIds.push(badgeTxt.id);

    const headline = createNode('text', {
      parentId: heroFrame.id,
      name: 'Headline',
      transform: { x: 0, y: 0, width: 840, height: 68 },
      text: { content: 'Design with Pure Vector Precision.\nCompile Directly to Production React.', fontSize: 34, fontWeight: '800', textAlign: 'center', color: '#ffffff', lineHeight: 1.2 },
      tokenBindings: { 'text.color': 'token_text_primary' }
    });

    const sub = createNode('text', {
      parentId: heroFrame.id,
      name: 'Sub',
      transform: { x: 0, y: 0, width: 680, height: 40 },
      text: { content: 'The professional design environment that transforms visual ideas into interactive prototypes and clean TypeScript components in one continuous flow.', fontSize: 15, fontWeight: '400', textAlign: 'center', color: '#94a3b8' },
      tokenBindings: { 'text.color': 'token_text_muted' }
    });

    const ctaRow = createNode('frame', {
      parentId: heroFrame.id,
      name: 'CTA Row',
      transform: { x: 0, y: 0, width: 340, height: 48 },
      style: { fills: [] },
      layout: { mode: 'stack-horizontal', gap: 16, alignItems: 'center', justifyContent: 'center' }
    });
    const pBtn = createNode('frame', {
      parentId: ctaRow.id,
      name: 'Primary CTA',
      componentId: 'button',
      transform: { x: 0, y: 0, width: 160, height: 48 },
      style: { fills: [{ type: 'solid', color: '#2563eb', opacity: 1 }], cornerRadius: 10 },
      tokenBindings: {
        'style.fills.0.color': 'token_brand_primary',
        'style.cornerRadius': 'token_radius_sm'
      },
      layout: { mode: 'stack-horizontal', alignItems: 'center', justifyContent: 'center' },
      semanticTag: 'button'
    });
    const pTxt = createNode('text', {
      parentId: pBtn.id,
      name: 'Txt',
      transform: { x: 0, y: 0, width: 130, height: 20 },
      text: { content: 'Start Designing →', fontSize: 14, fontWeight: '600', color: '#ffffff', textAlign: 'center' }
    });
    pBtn.childIds.push(pTxt.id);

    const sBtn = createNode('frame', {
      parentId: ctaRow.id,
      name: 'Secondary CTA',
      componentId: 'button',
      transform: { x: 0, y: 0, width: 140, height: 48 },
      style: { fills: [{ type: 'solid', color: '#1e293b', opacity: 1 }], strokes: [{ color: '#334155', width: 1 }], cornerRadius: 10 },
      tokenBindings: {
        'style.fills.0.color': 'token_bg_surface',
        'style.cornerRadius': 'token_radius_sm'
      },
      layout: { mode: 'stack-horizontal', alignItems: 'center', justifyContent: 'center' },
      semanticTag: 'button'
    });
    const sTxt = createNode('text', {
      parentId: sBtn.id,
      name: 'Txt',
      transform: { x: 0, y: 0, width: 110, height: 20 },
      text: { content: 'Watch Demo', fontSize: 14, fontWeight: '600', color: '#f8fafc', textAlign: 'center' }
    });
    sBtn.childIds.push(sTxt.id);
    ctaRow.childIds.push(pBtn.id, sBtn.id);

    heroFrame.childIds.push(badge.id, headline.id, sub.id, ctaRow.id);

    return {
      intent: 'Generate Modern Landing Hero Section',
      explanation: 'Built high-converting hero layout with badge, responsive typography, and primary/secondary CTA actions.',
      operations: [{ op: 'createTree', rootNode: heroFrame, allNodes: [heroFrame, badge, badgeTxt, headline, sub, ctaRow, pBtn, pTxt, sBtn, sTxt] }]
    };
  }

  synthesizeAuthCard() {
    const card = createNode('frame', {
      name: 'AI Generated: Auth Card',
      componentId: 'card',
      transform: { x: 80, y: 920, width: 400, height: 440 },
      style: { fills: [{ type: 'solid', color: '#111827', opacity: 1 }], strokes: [{ color: '#1f2937', width: 1 }], cornerRadius: 16 },
      tokenBindings: {
        'style.fills.0.color': 'token_bg_surface',
        'style.strokes.0.color': 'token_border_subtle',
        'style.cornerRadius': 'token_radius_md'
      },
      layout: { mode: 'stack-vertical', paddingTop: 36, paddingLeft: 32, paddingRight: 32, paddingBottom: 36, gap: 18 }
    });
    const title = createNode('text', {
      parentId: card.id,
      name: 'Title',
      transform: { x: 0, y: 0, width: 336, height: 26 },
      text: { content: 'Sign In to Workspace', fontSize: 20, fontWeight: '700', color: '#ffffff' },
      tokenBindings: { 'text.color': 'token_text_primary' }
    });
    const emailField = createNode('frame', {
      parentId: card.id,
      name: 'Input Email',
      componentId: 'textfield',
      transform: { x: 0, y: 0, width: 336, height: 46 },
      style: { fills: [{ type: 'solid', color: '#1e293b', opacity: 1 }], cornerRadius: 8 },
      tokenBindings: {
        'style.fills.0.color': 'token_bg_elevated',
        'style.cornerRadius': 'token_radius_sm'
      },
      layout: { mode: 'stack-horizontal', alignItems: 'center', paddingLeft: 14 },
      semanticTag: 'input'
    });
    const emailTxt = createNode('text', {
      parentId: emailField.id,
      name: 'Text',
      transform: { x: 0, y: 0, width: 280, height: 18 },
      text: { content: 'dev@company.com', fontSize: 13, color: '#94a3b8' }
    });
    emailField.childIds.push(emailTxt.id);

    const passField = createNode('frame', {
      parentId: card.id,
      name: 'Input Password',
      componentId: 'textfield',
      transform: { x: 0, y: 0, width: 336, height: 46 },
      style: { fills: [{ type: 'solid', color: '#1e293b', opacity: 1 }], cornerRadius: 8 },
      tokenBindings: {
        'style.fills.0.color': 'token_bg_elevated',
        'style.cornerRadius': 'token_radius_sm'
      },
      layout: { mode: 'stack-horizontal', alignItems: 'center', paddingLeft: 14 },
      semanticTag: 'input'
    });
    const passTxt = createNode('text', {
      parentId: passField.id,
      name: 'Text',
      transform: { x: 0, y: 0, width: 280, height: 18 },
      text: { content: '••••••••••••••••', fontSize: 13, color: '#94a3b8' }
    });
    passField.childIds.push(passTxt.id);

    const submitBtn = createNode('frame', {
      parentId: card.id,
      name: 'Submit Button',
      componentId: 'button',
      transform: { x: 0, y: 0, width: 336, height: 46 },
      style: { fills: [{ type: 'solid', color: '#2563eb', opacity: 1 }], cornerRadius: 8 },
      tokenBindings: {
        'style.fills.0.color': 'token_brand_primary',
        'style.cornerRadius': 'token_radius_sm'
      },
      layout: { mode: 'stack-horizontal', alignItems: 'center', justifyContent: 'center' },
      semanticTag: 'button'
    });
    const subTxt = createNode('text', {
      parentId: submitBtn.id,
      name: 'Text',
      transform: { x: 0, y: 0, width: 200, height: 20 },
      text: { content: 'Continue →', fontSize: 14, fontWeight: '600', color: '#ffffff', textAlign: 'center' }
    });
    submitBtn.childIds.push(subTxt.id);

    card.childIds.push(title.id, emailField.id, passField.id, submitBtn.id);

    return {
      intent: 'Generate Accessible Authentication Card',
      explanation: 'Generated login card complete with semantic form fields and submission trigger.',
      operations: [{ op: 'createTree', rootNode: card, allNodes: [card, title, emailField, emailTxt, passField, passTxt, submitBtn, subTxt] }]
    };
  }

  synthesizeLayoutAdjustment(prompt, selection) {
    const isHorizontal = prompt.includes('horizontal') || prompt.includes('row');
    const gapMatch = prompt.match(/(\d+)\s*px/);
    const gap = gapMatch ? parseInt(gapMatch[1], 10) : 16;

    const operations = selection.map(node => ({
      op: 'updateNode',
      nodeId: node.id,
      patch: {
        layout: {
          mode: isHorizontal ? 'stack-horizontal' : 'stack-vertical',
          gap,
          alignItems: prompt.includes('center') ? 'center' : 'start',
          justifyContent: prompt.includes('space') ? 'space-between' : 'start',
          paddingTop: 16,
          paddingRight: 16,
          paddingBottom: 16,
          paddingLeft: 16
        }
      }
    }));

    return {
      intent: 'Apply Auto Layout & Spacing Rules',
      explanation: `Configured ${selection.length} selected element(s) to ${isHorizontal ? 'Horizontal' : 'Vertical'} stack with ${gap}px gap.`,
      operations
    };
  }

  synthesizeThemeApplication(context) {
    const operations = [];
    const targets = context.selection?.length > 0 ? context.selection : context.page?.rootFrames || [];

    for (const t of targets) {
      operations.push({
        op: 'updateNode',
        nodeId: t.id,
        patch: {
          style: {
            fills: [{ type: 'solid', color: '#090d16', opacity: 1 }],
            strokes: [{ color: '#1e293b', width: 1, align: 'inside' }]
          }
        }
      });
    }

    return {
      intent: 'Apply Dark Mode Theme Tokens',
      explanation: `Mapped semantic dark background (#090d16) and subtle slate border tokens to ${operations.length} element(s).`,
      operations
    };
  }

  synthesizeMobileAdaptiveFrame(desktopNode) {
    const mobFrame = createNode('frame', {
      name: `Mobile Screen (${desktopNode?.name || 'Adaptive'})`,
      transform: { x: 1340, y: 920, width: 375, height: 720 },
      style: { fills: [{ type: 'solid', color: '#090d16', opacity: 1 }], strokes: [{ color: '#334155', width: 2 }], cornerRadius: 36 },
      layout: { mode: 'stack-vertical', paddingTop: 32, paddingLeft: 20, paddingRight: 20, paddingBottom: 24, gap: 16 }
    });
    const title = createNode('text', {
      parentId: mobFrame.id,
      name: 'Mobile Title',
      transform: { x: 0, y: 0, width: 335, height: 28 },
      text: { content: '⚡ Mobile Adaptive 375px', fontSize: 17, fontWeight: '700', color: '#ffffff' }
    });
    mobFrame.childIds.push(title.id);

    return {
      intent: 'Generate Mobile Adaptive Viewport Frame',
      explanation: 'Constructed standard 375px mobile viewport frame with touch-optimized vertical stack.',
      operations: [{ op: 'createTree', rootNode: mobFrame, allNodes: [mobFrame, title] }]
    };
  }

  synthesizeMinimalistRefactor(selection) {
    const operations = (selection || []).map(node => ({
      op: 'updateNode',
      nodeId: node.id,
      patch: {
        style: {
          shadows: [], // Strip heavy drop shadows
          strokes: [{ color: 'rgba(255,255,255,0.08)', width: 1 }],
          cornerRadius: 8
        }
      }
    }));

    return {
      intent: 'Refactor Layout to Minimalist Aesthetic',
      explanation: `Simplified styling on ${operations.length} object(s): removed shadows, normalized corner radii, and added subtle hairline borders.`,
      operations
    };
  }

  synthesizeGenericMetricCard(prompt) {
    const card = createNode('frame', {
      name: 'AI Generated: Metric Card',
      transform: { x: 80, y: 920, width: 340, height: 160 },
      style: { fills: [{ type: 'solid', color: '#131b2c', opacity: 1 }], strokes: [{ color: '#222f47', width: 1 }], cornerRadius: 14 },
      layout: { mode: 'stack-vertical', paddingTop: 24, paddingLeft: 24, paddingRight: 24, paddingBottom: 24, gap: 10 }
    });
    const label = createNode('text', {
      parentId: card.id,
      name: 'Label',
      transform: { x: 0, y: 0, width: 280, height: 18 },
      text: { content: 'AI Intelligent Node', fontSize: 13, fontWeight: '500', color: '#94a3b8' }
    });
    const val = createNode('text', {
      parentId: card.id,
      name: 'Value',
      transform: { x: 0, y: 0, width: 280, height: 32 },
      text: { content: 'Synthesized from Intent', fontSize: 20, fontWeight: '700', color: '#38bdf8' }
    });
    card.childIds.push(label.id, val.id);

    return {
      intent: 'Synthesize Custom Element',
      explanation: `Generated design layout based on user prompt: "${prompt}".`,
      operations: [{ op: 'createTree', rootNode: card, allNodes: [card, label, val] }]
    };
  }
}
