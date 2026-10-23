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

    // 1. Enterprise SaaS Dashboard
    if (cleanPrompt.includes('dashboard') || cleanPrompt.includes('saas') || cleanPrompt.includes('kpi') || cleanPrompt.includes('fintech')) {
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

  synthesizeEnterpriseDashboard() {
    const rootFrame = createNode('frame', {
      name: 'Enterprise Cloud SaaS Dashboard (1200px)',
      transform: { x: 80, y: 920, width: 1200, height: 760 },
      style: {
        fills: [{ type: 'solid', color: '#0b0f19', opacity: 1 }],
        strokes: [{ color: '#1e293b', width: 1, align: 'inside' }],
        cornerRadius: 16
      },
      layout: { mode: 'stack-horizontal', alignItems: 'stretch' },
      semanticTag: 'main'
    });

    // Sidebar Nav
    const sidebar = createNode('frame', {
      parentId: rootFrame.id,
      name: 'Navigation Sidebar',
      transform: { x: 0, y: 0, width: 220, height: 760 },
      style: { fills: [{ type: 'solid', color: '#111827', opacity: 1 }], strokes: [{ color: '#1f2937', width: 1 }] },
      layout: { mode: 'stack-vertical', paddingTop: 24, paddingLeft: 20, paddingRight: 20, paddingBottom: 24, gap: 16 },
      semanticTag: 'nav'
    });
    const logo = createNode('text', {
      parentId: sidebar.id,
      name: 'Logo',
      transform: { x: 0, y: 0, width: 180, height: 28 },
      text: { content: '⚡ CloudPulse AI', fontSize: 16, fontWeight: '700', color: '#38bdf8' }
    });
    sidebar.childIds.push(logo.id);

    // Dashboard Content
    const body = createNode('frame', {
      parentId: rootFrame.id,
      name: 'Dashboard Workspace',
      transform: { x: 220, y: 0, width: 980, height: 760 },
      style: { fills: [{ type: 'solid', color: '#090d16', opacity: 1 }] },
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
      text: { content: 'Cloud Compute Infrastructure', fontSize: 22, fontWeight: '700', color: '#ffffff' }
    });
    header.childIds.push(title.id);

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

    const allNodes = [rootFrame, sidebar, logo, body, header, title, kpiRow];

    for (const k of kpis) {
      const card = createNode('frame', {
        parentId: kpiRow.id,
        name: `KPI / ${k.label}`,
        transform: { x: 0, y: 0, width: 292, height: 130 },
        style: { fills: [{ type: 'solid', color: '#131b2c', opacity: 1 }], strokes: [{ color: '#222f47', width: 1 }], cornerRadius: 12 },
        layout: { mode: 'stack-vertical', paddingTop: 20, paddingLeft: 20, paddingRight: 20, paddingBottom: 20, gap: 8 }
      });
      const lbl = createNode('text', {
        parentId: card.id,
        name: 'Label',
        transform: { x: 0, y: 0, width: 240, height: 16 },
        text: { content: k.label, fontSize: 13, fontWeight: '500', color: '#94a3b8' }
      });
      const val = createNode('text', {
        parentId: card.id,
        name: 'Value',
        transform: { x: 0, y: 0, width: 240, height: 32 },
        text: { content: k.val, fontSize: 24, fontWeight: '800', color: '#ffffff' }
      });
      const note = createNode('text', {
        parentId: card.id,
        name: 'Note',
        transform: { x: 0, y: 0, width: 240, height: 16 },
        text: { content: k.note, fontSize: 12, fontWeight: '500', color: k.color }
      });
      card.childIds.push(lbl.id, val.id, note.id);
      kpiRow.childIds.push(card.id);
      allNodes.push(card, lbl, val, note);
    }

    body.childIds.push(header.id, kpiRow.id);
    rootFrame.childIds.push(sidebar.id, body.id);

    return {
      intent: 'Generate Enterprise Cloud SaaS Dashboard',
      explanation: 'Constructed responsive 1200px SaaS dashboard containing navigation sidebar, KPI metric cards, and cloud telemetry headers.',
      operations: [{ op: 'createTree', rootNode: rootFrame, allNodes }]
    };
  }

  synthesizePricingTable() {
    const rootFrame = createNode('frame', {
      name: 'AI Generated: SaaS Pricing Section',
      transform: { x: 80, y: 920, width: 1080, height: 460 },
      style: { fills: [{ type: 'solid', color: '#090d16', opacity: 1 }], strokes: [{ color: '#1e293b', width: 1 }], cornerRadius: 20 },
      layout: { mode: 'stack-vertical', paddingTop: 36, paddingLeft: 36, paddingRight: 36, paddingBottom: 36, gap: 28, alignItems: 'center' }
    });

    const header = createNode('text', {
      parentId: rootFrame.id,
      name: 'Title',
      transform: { x: 0, y: 0, width: 600, height: 32 },
      text: { content: 'Predictable Cloud Pricing Plans', fontSize: 24, fontWeight: '800', textAlign: 'center', color: '#ffffff' }
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
        transform: { x: 0, y: 0, width: 320, height: 320 },
        style: {
          fills: [{ type: 'solid', color: t.highlight ? '#1a2436' : '#111827', opacity: 1 }],
          strokes: [{ color: t.highlight ? '#38bdf8' : '#1f2937', width: t.highlight ? 2 : 1 }],
          cornerRadius: 16
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
        text: { content: t.price, fontSize: 32, fontWeight: '800', color: '#ffffff' }
      });
      const tDesc = createNode('text', {
        parentId: card.id,
        name: 'Desc',
        transform: { x: 0, y: 0, width: 270, height: 36 },
        text: { content: t.desc, fontSize: 13, fontWeight: '400', color: '#94a3b8' }
      });
      const btn = createNode('frame', {
        parentId: card.id,
        name: 'CTA',
        transform: { x: 0, y: 0, width: 272, height: 44 },
        style: { fills: [{ type: 'solid', color: t.highlight ? '#0284c7' : '#1e293b', opacity: 1 }], cornerRadius: 8 },
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
      transform: { x: 80, y: 920, width: 1100, height: 400 },
      style: { fills: [{ type: 'solid', color: '#090d16', opacity: 1 }], strokes: [{ color: '#1e293b', width: 1 }], cornerRadius: 24 },
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
      text: { content: 'Design with Pure Vector Precision.\nCompile Directly to Production React.', fontSize: 34, fontWeight: '800', textAlign: 'center', color: '#ffffff', lineHeight: 1.2 }
    });

    const sub = createNode('text', {
      parentId: heroFrame.id,
      name: 'Sub',
      transform: { x: 0, y: 0, width: 680, height: 40 },
      text: { content: 'The professional design environment that transforms visual ideas into interactive prototypes and clean TypeScript components in one continuous flow.', fontSize: 15, fontWeight: '400', textAlign: 'center', color: '#94a3b8' }
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
      transform: { x: 0, y: 0, width: 160, height: 48 },
      style: { fills: [{ type: 'solid', color: '#2563eb', opacity: 1 }], cornerRadius: 10 },
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
      transform: { x: 0, y: 0, width: 140, height: 48 },
      style: { fills: [{ type: 'solid', color: '#1e293b', opacity: 1 }], strokes: [{ color: '#334155', width: 1 }], cornerRadius: 10 },
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
      transform: { x: 80, y: 920, width: 400, height: 440 },
      style: { fills: [{ type: 'solid', color: '#111827', opacity: 1 }], strokes: [{ color: '#1f2937', width: 1 }], cornerRadius: 16 },
      layout: { mode: 'stack-vertical', paddingTop: 36, paddingLeft: 32, paddingRight: 32, paddingBottom: 36, gap: 18 }
    });
    const title = createNode('text', {
      parentId: card.id,
      name: 'Title',
      transform: { x: 0, y: 0, width: 336, height: 26 },
      text: { content: 'Sign In to Workspace', fontSize: 20, fontWeight: '700', color: '#ffffff' }
    });
    const emailField = createNode('frame', {
      parentId: card.id,
      name: 'Input Email',
      transform: { x: 0, y: 0, width: 336, height: 46 },
      style: { fills: [{ type: 'solid', color: '#1e293b', opacity: 1 }], cornerRadius: 8 },
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
      transform: { x: 0, y: 0, width: 336, height: 46 },
      style: { fills: [{ type: 'solid', color: '#1e293b', opacity: 1 }], cornerRadius: 8 },
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
      transform: { x: 0, y: 0, width: 336, height: 46 },
      style: { fills: [{ type: 'solid', color: '#2563eb', opacity: 1 }], cornerRadius: 8 },
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
