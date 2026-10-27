/**
 * DesignForge AI - Design System UI Controller
 * Manages the unified Design System views, navigation, modals, and synchronizations.
 */

import { TOKEN_CATEGORIES, VARIABLE_TYPES, THEME_MODES, DESIGN_SYSTEM_STARTERS } from './types.js';

export class DesignSystemUIController {
  constructor(app) {
    this.app = app;
    this.registry = app.dsRegistry;
    this.wizard = app.aiTokenWizard;
    this.responsive = app.responsiveTokenEngine;
    this.extractor = app.compVarExtractor;
    this.importer = app.reactDsImporter;

    this.activeView = 'overview';
    this.activeTokenCategory = 'all';
    this.activeTheme = 'dark';
    this.tokenSearchQuery = '';
    this.varSearchQuery = '';

    this.activeProposals = [];
    this.activeCompNode = null;
    this.lastImportReport = null;
  }

  init() {
    this.bindNavEvents();
    this.bindToolbarEvents();
    this.bindModalEvents();
  }

  bindNavEvents() {
    const navItems = document.querySelectorAll('.ds-nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        navItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        const view = item.dataset.view;
        this.renderView(view);
      });
    });

    const themeBtns = document.querySelectorAll('#dsThemeSwitcher .ds-theme-btn');
    themeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        themeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeTheme = btn.dataset.theme;
        this.renderView(this.activeView);
      });
    });
  }

  bindToolbarEvents() {
    const btnAi = document.getElementById('btnDsAiGenerateTokens');
    if (btnAi) btnAi.addEventListener('click', () => this.openAiTokensModal());

    const btnResp = document.getElementById('btnDsResponsiveTokens');
    if (btnResp) btnResp.addEventListener('click', () => this.openResponsiveModal());

    const btnImp = document.getElementById('btnDsImportReact');
    if (btnImp) btnImp.addEventListener('click', () => this.openImportModal());

    const btnNew = document.getElementById('btnDsCreateScratch');
    if (btnNew) btnNew.addEventListener('click', () => this.openCreateModal());

    const btnPub = document.getElementById('btnDsPublish');
    if (btnPub) btnPub.addEventListener('click', () => this.openPublishModal());
  }

  bindModalEvents() {
    // 1. AI Tokens Modal
    const modalAi = document.getElementById('modalAiGenerateTokens');
    const btnCloseAi = document.getElementById('btnCloseModalAiTokens');
    const btnCancelAi = document.getElementById('btnAiTokensCancel');
    const btnGenAi = document.getElementById('btnAiTokensGenerate');
    const btnCommitAi = document.getElementById('btnAiTokensCommit');
    const btnBackAi = document.getElementById('btnAiTokensBack');
    const checkAllAi = document.getElementById('aiTokensCheckAll');

    const closeAi = () => { if (modalAi) modalAi.style.display = 'none'; };
    if (btnCloseAi) btnCloseAi.addEventListener('click', closeAi);
    if (btnCancelAi) btnCancelAi.addEventListener('click', closeAi);

    if (btnGenAi) {
      btnGenAi.addEventListener('click', () => {
        const name = document.getElementById('aiTokensSystemName')?.value || 'Design System';
        const brandColor = document.getElementById('aiTokensBrandColorHex')?.value || '#2563eb';
        const industry = document.getElementById('aiTokensIndustry')?.value || 'fintech';
        const direction = document.getElementById('aiTokensDirection')?.value || 'minimal';

        const checkedCats = Array.from(document.querySelectorAll('#aiTokensCategoryGrid input:checked')).map(i => i.value);

        const proposals = this.wizard.generateProposals({
          name,
          brandColor,
          industry,
          direction,
          categories: checkedCats
        });

        this.activeProposals = proposals;
        this.renderProposalTable(proposals);

        document.getElementById('aiTokensStep1').style.display = 'none';
        document.getElementById('aiTokensStep2').style.display = 'block';
        btnGenAi.style.display = 'none';
        btnCommitAi.style.display = 'inline-flex';
        btnBackAi.style.display = 'inline-flex';
      });
    }

    if (btnBackAi) {
      btnBackAi.addEventListener('click', () => {
        document.getElementById('aiTokensStep1').style.display = 'block';
        document.getElementById('aiTokensStep2').style.display = 'none';
        btnGenAi.style.display = 'inline-flex';
        btnCommitAi.style.display = 'none';
        btnBackAi.style.display = 'none';
      });
    }

    if (btnCommitAi) {
      btnCommitAi.addEventListener('click', () => {
        const approvedIndices = [];
        const rows = document.querySelectorAll('#aiTokensProposalsBody tr');
        rows.forEach((r, idx) => {
          const chk = r.querySelector('input[type="checkbox"]');
          if (chk && chk.checked) approvedIndices.push(idx);
        });

        const approvedProposals = approvedIndices.map(i => this.activeProposals[i]).filter(Boolean);
        const result = this.wizard.commitProposals(approvedProposals);

        closeAi();
        this.updateHeaderInfo();
        this.renderView(this.activeView);
        if (this.app.renderer) this.app.renderer.render();
      });
    }

    if (checkAllAi) {
      checkAllAi.addEventListener('change', (e) => {
        const chks = document.querySelectorAll('#aiTokensProposalsBody input[type="checkbox"]');
        chks.forEach(c => c.checked = e.target.checked);
      });
    }

    // Color picker sync
    const picker = document.getElementById('aiTokensBrandColorPicker');
    const hexInput = document.getElementById('aiTokensBrandColorHex');
    if (picker && hexInput) {
      picker.addEventListener('input', (e) => { hexInput.value = e.target.value; });
      hexInput.addEventListener('input', (e) => { picker.value = e.target.value; });
    }

    // 2. Responsive Modal
    const modalResp = document.getElementById('modalResponsiveTokens');
    const btnCloseResp = document.getElementById('btnCloseModalResponsive');
    const btnCancelResp = document.getElementById('btnCancelResponsive');
    const btnGenResp = document.getElementById('btnGenerateResponsive');
    const btnCommitResp = document.getElementById('btnCommitResponsive');

    const closeResp = () => { if (modalResp) modalResp.style.display = 'none'; };
    if (btnCloseResp) btnCloseResp.addEventListener('click', closeResp);
    if (btnCancelResp) btnCancelResp.addEventListener('click', closeResp);

    let activeRespResult = null;
    if (btnGenResp) {
      btnGenResp.addEventListener('click', () => {
        const target = document.getElementById('responsiveTargetsSelect')?.value || 'both';
        const cats = [];
        if (document.getElementById('respCatSpacing')?.checked) cats.push('spacing');
        if (document.getElementById('respCatTypography')?.checked) cats.push('typography');
        if (document.getElementById('respCatSizing')?.checked) cats.push('sizing');

        activeRespResult = this.responsive.generateAdaptations({
          target,
          categories: cats
        });

        const previewBox = document.getElementById('responsivePreviewContainer');
        const codeOutput = document.getElementById('responsiveCssOutput');
        if (previewBox && codeOutput) {
          previewBox.style.display = 'block';
          codeOutput.textContent = activeRespResult.cssOutput;
        }
        btnCommitResp.style.display = 'inline-flex';
      });
    }

    if (btnCommitResp) {
      btnCommitResp.addEventListener('click', () => {
        if (activeRespResult) {
          this.responsive.commitOverrides(activeRespResult);
          closeResp();
          this.renderView(this.activeView);
        }
      });
    }

    // 3. Component Variable Extraction Modal
    const modalComp = document.getElementById('modalComponentVariables');
    const btnCloseComp = document.getElementById('btnCloseModalCompVars');
    const btnCancelComp = document.getElementById('btnCancelCompVars');
    const btnCommitComp = document.getElementById('btnCommitCompVars');
    const closeComp = () => { if (modalComp) modalComp.style.display = 'none'; };
    if (btnCloseComp) btnCloseComp.addEventListener('click', closeComp);
    if (btnCancelComp) btnCancelComp.addEventListener('click', closeComp);

    if (btnCommitComp) {
      btnCommitComp.addEventListener('click', () => {
        if (!this.activeCompNode || !this.activeCompProposals) return;
        const approvedIndices = [];
        const rows = document.querySelectorAll('#compVarsBody tr');
        rows.forEach((r, idx) => {
          const chk = r.querySelector('input[type="checkbox"]');
          if (chk && chk.checked) approvedIndices.push(idx);
        });

        const approved = approvedIndices.map(i => this.activeCompProposals[i]).filter(Boolean);
        this.extractor.commitAndBind(this.activeCompNode, approved);
        closeComp();
        this.updateHeaderInfo();
        this.renderView(this.activeView);
        this.app.updateInspector();
        if (this.app.renderer) this.app.renderer.render();
      });
    }

    // 4. Import React / DTCG System Modal
    const modalImp = document.getElementById('modalImportReactSystem');
    const btnCloseImp = document.getElementById('btnCloseModalImportReact');
    const btnCancelImp = document.getElementById('btnCancelImportReact');
    const btnAnalyzeImp = document.getElementById('btnAnalyzeImportSource');
    const btnCommitImp = document.getElementById('btnCommitImportReact');
    const btnChooseImportFile = document.getElementById('btnChooseImportReactFile');
    const importFileInput = document.getElementById('importReactFileInput');
    const closeImp = () => { if (modalImp) modalImp.style.display = 'none'; };
    if (btnCloseImp) btnCloseImp.addEventListener('click', closeImp);
    if (btnCancelImp) btnCancelImp.addEventListener('click', closeImp);
    if (btnChooseImportFile && importFileInput) {
      btnChooseImportFile.addEventListener('click', () => importFileInput.click());
      importFileInput.addEventListener('change', async () => {
        const file = importFileInput.files?.[0];
        if (!file) return;
        const source = await file.text();
        const input = document.getElementById('importReactSourceInput');
        const status = document.getElementById('importAnalysisStatus');
        if (input) input.value = source;
        if (status) status.textContent = `Loaded ${file.name}. Analyze to inspect tokens and components.`;
        if (btnCommitImp) btnCommitImp.style.display = 'none';
        document.getElementById('importReportBox').style.display = 'none';
        importFileInput.value = '';
      });
    }

    if (btnAnalyzeImp) {
      btnAnalyzeImp.addEventListener('click', async () => {
        const input = document.getElementById('importReactSourceInput')?.value || '';
        const status = document.getElementById('importAnalysisStatus');
        if (status) status.textContent = 'Analyzing source constructs...';

        const report = await this.importer.analyzeAndParse(input);
        this.lastImportReport = report;

        const reportBox = document.getElementById('importReportBox');
        const summary = document.getElementById('importReportSummary');
        if (reportBox && summary) {
          reportBox.style.display = 'block';
          summary.innerHTML = `
            <div><strong>Format Detected:</strong> ${report.format.toUpperCase()} (Confidence: ${report.confidence}%)</div>
            <div><strong>Discovered Tokens:</strong> ${report.discoveredTokens.length}</div>
            <div><strong>Discovered Components:</strong> ${report.discoveredComponents.length}</div>
            <div><strong>Fidelity Score:</strong> ${report.fidelityScore}%</div>
            ${report.warnings.length ? `<div style="color: #f59e0b; margin-top: 4px;">⚠️ ${report.warnings.join(', ')}</div>` : ''}
          `;
        }
        if (status) status.textContent = 'Analysis complete.';
        if (btnCommitImp) btnCommitImp.style.display = 'inline-flex';
      });
    }

    if (btnCommitImp) {
      btnCommitImp.addEventListener('click', () => {
        if (this.lastImportReport) {
          this.importer.commitImport(this.lastImportReport, 'merge');
          closeImp();
          this.updateHeaderInfo();
          this.renderView(this.activeView);
          if (this.app.renderer) this.app.renderer.render();
        }
      });
    }

    // 5. Create Design System Modal
    const modalCreate = document.getElementById('modalCreateDesignSystem');
    const btnCloseCreate = document.getElementById('btnCloseModalCreateDs');
    const btnCancelCreate = document.getElementById('btnCancelCreateDs');
    const btnConfirmCreate = document.getElementById('btnConfirmCreateDs');
    const closeCreate = () => { if (modalCreate) modalCreate.style.display = 'none'; };
    if (btnCloseCreate) btnCloseCreate.addEventListener('click', closeCreate);
    if (btnCancelCreate) btnCancelCreate.addEventListener('click', closeCreate);

    if (btnConfirmCreate) {
      btnConfirmCreate.addEventListener('click', () => {
        const name = document.getElementById('createDsName')?.value || 'New Design System';
        const starter = document.querySelector('input[name="dsStarterRadio"]:checked')?.value || 'minimal';
        this.registry.initializeWithStarter(starter, name);
        closeCreate();
        this.updateHeaderInfo();
        this.renderView('overview');
        if (this.app.renderer) this.app.renderer.render();
      });
    }

    // 6. Publish Modal
    const modalPub = document.getElementById('modalPublishLibrary');
    const btnClosePub = document.getElementById('btnCloseModalPublish');
    const btnCancelPub = document.getElementById('btnCancelPublish');
    const btnConfirmPub = document.getElementById('btnConfirmPublish');
    const closePub = () => { if (modalPub) modalPub.style.display = 'none'; };
    if (btnClosePub) btnClosePub.addEventListener('click', closePub);
    if (btnCancelPub) btnCancelPub.addEventListener('click', closePub);

    if (btnConfirmPub) {
      btnConfirmPub.addEventListener('click', () => {
        const version = document.getElementById('publishDsVersion')?.value || '1.1.0';
        const changelog = document.getElementById('publishDsChangelog')?.value || 'Published release.';
        this.registry.publishRelease(version, changelog);
        closePub();
        this.updateHeaderInfo();
        this.renderView(this.activeView);
      });
    }
  }

  openAiTokensModal() {
    const modal = document.getElementById('modalAiGenerateTokens');
    if (!modal) return;
    document.getElementById('aiTokensStep1').style.display = 'block';
    document.getElementById('aiTokensStep2').style.display = 'none';
    document.getElementById('btnAiTokensGenerate').style.display = 'inline-flex';
    document.getElementById('btnAiTokensCommit').style.display = 'none';
    document.getElementById('btnAiTokensBack').style.display = 'none';
    modal.style.display = 'flex';
  }

  openResponsiveModal() {
    const modal = document.getElementById('modalResponsiveTokens');
    if (!modal) return;
    document.getElementById('responsivePreviewContainer').style.display = 'none';
    document.getElementById('btnCommitResponsive').style.display = 'none';
    modal.style.display = 'flex';
  }

  openComponentVariablesModal(node) {
    if (!node) return;
    this.activeCompNode = node;
    const modal = document.getElementById('modalComponentVariables');
    const info = document.getElementById('compVarsSelectionInfo');
    const tbody = document.getElementById('compVarsBody');
    if (!modal || !tbody) return;

    if (info) info.textContent = `Selected: ${node.name} (${node.type})`;

    const proposals = this.extractor.inspectAndPropose(node);
    this.activeCompProposals = proposals;

    if (proposals.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #64748b; padding: 20px;">No unbound visual properties found on this layer.</td></tr>`;
    } else {
      tbody.innerHTML = proposals.map((p, idx) => `
        <tr>
          <td><input type="checkbox" checked data-idx="${idx}"></td>
          <td style="font-weight: 600; color: #94a3b8;">${p.property}</td>
          <td><code>${p.rawValue}</code></td>
          <td style="color: #38bdf8; font-family: monospace;">${p.proposedName}</td>
          <td><span style="font-size: 10px; padding: 2px 6px; border-radius: 4px; background: rgba(56,189,248,0.15); color: #38bdf8;">${p.action}</span></td>
        </tr>
      `).join('');
    }

    modal.style.display = 'flex';
  }

  openImportModal() {
    const modal = document.getElementById('modalImportReactSystem');
    if (!modal) return;
    document.getElementById('importReportBox').style.display = 'none';
    document.getElementById('btnCommitImportReact').style.display = 'none';
    modal.style.display = 'flex';
  }

  openCreateModal() {
    const modal = document.getElementById('modalCreateDesignSystem');
    if (modal) modal.style.display = 'flex';
  }

  openPublishModal() {
    const modal = document.getElementById('modalPublishLibrary');
    if (modal) modal.style.display = 'flex';
  }

  renderProposalTable(proposals) {
    const tbody = document.getElementById('aiTokensProposalsBody');
    if (!tbody) return;

    tbody.innerHTML = proposals.map((p, idx) => `
      <tr>
        <td><input type="checkbox" checked data-idx="${idx}"></td>
        <td class="ds-token-name">${p.name}</td>
        <td><span style="font-size: 10px; padding: 2px 6px; border-radius: 4px; background: rgba(148,163,184,0.15);">${p.category}</span></td>
        <td style="font-size: 11px; color: #94a3b8;">${p.type}</td>
        <td>
          ${p.type === 'color' ? `<span class="ds-color-swatch" style="background: ${p.value}; width: 14px; height: 14px;"></span>` : ''}
          <code>${p.value}</code>
        </td>
        <td><span style="font-size: 10px; padding: 2px 6px; border-radius: 4px; background: ${p.action === 'reuse' ? 'rgba(16,185,129,0.15); color: #34d399;' : 'rgba(13,153,255,0.15); color: #38bdf8;'}">${p.action}</span></td>
        <td style="font-size: 11px; color: #64748b;">${p.reason}</td>
      </tr>
    `).join('');
  }

  updateHeaderInfo() {
    const metrics = this.registry.computeOverviewMetrics();
    const titleEl = document.getElementById('dsActiveSystemName');
    const badgeEl = document.getElementById('dsActiveVersionBadge');
    if (titleEl) titleEl.textContent = this.registry.system.name;
    if (badgeEl) badgeEl.textContent = `v${this.registry.system.version} (${this.registry.system.status})`;

    // Subnav badges
    const bTokens = document.getElementById('dsNavBadgeTokens');
    const bVars = document.getElementById('dsNavBadgeVars');
    const bComps = document.getElementById('dsNavBadgeComps');
    const bStyles = document.getElementById('dsNavBadgeStyles');
    const bAssets = document.getElementById('dsNavBadgeAssets');

    if (bTokens) bTokens.textContent = metrics.totalTokens;
    if (bVars) bVars.textContent = metrics.totalVariables;
    if (bComps) bComps.textContent = metrics.totalComponents;
    if (bStyles) bStyles.textContent = metrics.totalStyles;
    if (bAssets) bAssets.textContent = metrics.totalAssets;
  }

  renderView(view) {
    this.activeView = view;
    this.updateHeaderInfo();

    const title = document.getElementById('dsViewTitle');
    const viewport = document.getElementById('dsViewport');
    if (!viewport) return;

    if (view === 'overview') {
      if (title) title.textContent = 'Design System Overview';
      this.renderOverviewView(viewport);
    } else if (view === 'tokens') {
      if (title) title.textContent = 'Design Tokens Workspace';
      this.renderTokensView(viewport);
    } else if (view === 'variables') {
      if (title) title.textContent = 'Variables & Property Bindings';
      this.renderVariablesView(viewport);
    } else if (view === 'components') {
      if (title) title.textContent = 'Component Library & Variants';
      this.renderComponentsView(viewport);
    } else if (view === 'styles') {
      if (title) title.textContent = 'Styles Registry';
      this.renderStylesView(viewport);
    } else if (view === 'assets') {
      if (title) title.textContent = 'Unified Assets Inventory';
      this.renderAssetsView(viewport);
    } else if (view === 'libraries') {
      if (title) title.textContent = 'Active Libraries & Dependencies';
      this.renderLibrariesView(viewport);
    } else if (view === 'imports') {
      if (title) title.textContent = 'Imports & Source Synchronization';
      this.renderImportsView(viewport);
    } else if (view === 'docs') {
      if (title) title.textContent = 'Living Documentation & Guidelines';
      this.renderDocsView(viewport);
    } else if (view === 'versions') {
      if (title) title.textContent = 'Version History & Releases';
      this.renderVersionsView(viewport);
    }
  }

  // --- Views ---

  renderOverviewView(container) {
    const metrics = this.registry.computeOverviewMetrics();

    container.innerHTML = `
      <div class="ds-metrics-grid">
        <div class="ds-metric-card" onclick="window.designForgeApp.dsUi.renderView('tokens')">
          <span class="ds-metric-label">Design Tokens</span>
          <span class="ds-metric-value">${metrics.totalTokens}</span>
          <span class="ds-metric-subtext">${metrics.duplicateCandidates.length} duplicates detected</span>
        </div>
        <div class="ds-metric-card" onclick="window.designForgeApp.dsUi.renderView('variables')">
          <span class="ds-metric-label">Variables</span>
          <span class="ds-metric-value">${metrics.totalVariables}</span>
          <span class="ds-metric-subtext">Mapped to layout & colors</span>
        </div>
        <div class="ds-metric-card" onclick="window.designForgeApp.dsUi.renderView('components')">
          <span class="ds-metric-label">Components</span>
          <span class="ds-metric-value">${metrics.totalComponents}</span>
          <span class="ds-metric-subtext">${metrics.totalVariants} total variants</span>
        </div>
        <div class="ds-metric-card" onclick="window.designForgeApp.dsUi.renderView('styles')">
          <span class="ds-metric-label">Styles</span>
          <span class="ds-metric-value">${metrics.totalStyles}</span>
          <span class="ds-metric-subtext">Color & Typography</span>
        </div>
        <div class="ds-metric-card" onclick="window.designForgeApp.dsUi.renderView('assets')">
          <span class="ds-metric-label">Assets</span>
          <span class="ds-metric-value">${metrics.totalAssets}</span>
          <span class="ds-metric-subtext">100% synchronized</span>
        </div>
      </div>

      <div class="ds-overview-row">
        <div class="ds-card">
          <div class="ds-card-title">
            <span>Validation Health & Governance</span>
            <span style="font-size: 11px; color: ${metrics.duplicateCandidates.length === 0 ? 'var(--accent-green)' : 'var(--accent-amber)'};">
              ${metrics.duplicateCandidates.length === 0 ? '✓ All Validated' : `${metrics.duplicateCandidates.length} warnings`}
            </span>
          </div>
          ${metrics.duplicateCandidates.length > 0 ? `
            <div class="ds-issue-item">
              <div>
                <strong>Duplicate Token Candidates:</strong> ${metrics.duplicateCandidates.map(d => `${d.tokenA.name} = ${d.tokenB.name} (${d.value})`).join('; ')}
              </div>
            </div>
          ` : `
            <div class="ds-issue-item info">
              <div>✓ Zero duplicate token candidates detected. Registry is normalized.</div>
            </div>
          `}
          ${metrics.unboundCount > 0 ? `
            <div class="ds-issue-item">
              <div><strong>Unbound Raw Values in Document:</strong> ${metrics.unboundCount} candidate layers could use tokens.</div>
            </div>
          ` : `
            <div class="ds-issue-item info">
              <div>✓ No unbound raw styling candidates identified in document layers.</div>
            </div>
          `}
          <div class="ds-issue-item info">
            <div>✓ Single authoritative shared registry active. Tokens, Variables, Assets synchronized.</div>
          </div>
        </div>

        <div class="ds-card">
          <div class="ds-card-title">
            <span>System Details</span>
          </div>
          <div style="font-size: 12px; color: var(--text-muted); line-height: 1.8;">
            <div><strong>Active System:</strong> ${this.registry.system.name}</div>
            <div><strong>Current Version:</strong> v${this.registry.system.version}</div>
            <div><strong>Status:</strong> <span style="color: var(--accent-blue);">${this.registry.system.status}</span></div>
            <div><strong>Last Modified:</strong> ${new Date(this.registry.system.updatedAt).toLocaleTimeString()}</div>
            <div><strong>Releases Published:</strong> ${this.registry.system.history.length}</div>
          </div>
        </div>
      </div>
    `;
  }

  renderTokensView(container) {
    const tokens = this.registry.getAllTokens();
    const categories = ['all', 'color', 'typography', 'spacing', 'sizing', 'borders', 'shadows', 'motion', 'opacity', 'zindex', 'dataviz'];

    const filtered = tokens.filter(t => {
      if (this.activeTokenCategory !== 'all' && t.category !== this.activeTokenCategory) return false;
      if (this.tokenSearchQuery && !t.name.toLowerCase().includes(this.tokenSearchQuery.toLowerCase())) return false;
      return true;
    });

    container.innerHTML = `
      <div class="ds-table-controls">
        <div class="ds-search-bar">
          <span>🔍</span>
          <input type="text" id="tokenSearchInput" placeholder="Search tokens by name, category, or value..." value="${this.tokenSearchQuery}">
        </div>
        <div class="ds-filter-tabs">
          ${categories.map(c => `
            <button class="ds-filter-pill ${c === this.activeTokenCategory ? 'active' : ''}" data-cat="${c}">
              ${c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          `).join('')}
        </div>
      </div>

      <table class="ds-data-table">
        <thead>
          <tr>
            <th>Token Name</th>
            <th>Category</th>
            <th>Default Value</th>
            <th>Type</th>
            <th>Usage</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${filtered.length === 0 ? `
            <tr><td colspan="6" style="text-align: center; color: var(--text-dim); padding: 30px;">No tokens match the selected filters.</td></tr>
          ` : filtered.map(t => `
            <tr>
              <td>
                <span class="ds-token-name">${t.name}</span>
                ${t.primitiveId ? `<span class="ds-token-alias">→ alias</span>` : ''}
              </td>
              <td><span style="font-size: 11px; padding: 2px 6px; border-radius: 4px; background: var(--bg-surface);">${t.category}</span></td>
              <td>
                ${t.type === 'color' ? `<span class="ds-color-swatch" style="background: ${t.value};"></span>` : ''}
                <code>${t.value}</code>
              </td>
              <td style="color: var(--text-dim); font-size: 11px;">${t.type}</td>
              <td><span style="font-size: 10px; padding: 2px 6px; border-radius: 9999px; background: var(--bg-surface);">${t.usageCount || 0} uses</span></td>
              <td>
                <button class="menu-dropdown-btn-sm" onclick="window.designForgeApp.dsUi.deleteTokenPrompt('${t.id}')" title="Delete Token">🗑</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    const searchInput = container.querySelector('#tokenSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.tokenSearchQuery = e.target.value;
        this.renderTokensView(container);
      });
    }

    const pills = container.querySelectorAll('.ds-filter-pill');
    pills.forEach(p => {
      p.addEventListener('click', () => {
        this.activeTokenCategory = p.dataset.cat;
        this.renderTokensView(container);
      });
    });
  }

  deleteTokenPrompt(id) {
    const dependents = this.registry.getDependents(id);
    if (dependents.length > 0) {
      alert(`Cannot delete token: It is referenced by ${dependents.length} item(s). Reassign them first.`);
      return;
    }
    this.registry.deleteToken(id);
    this.renderView('tokens');
  }

  renderVariablesView(container) {
    const vars = this.registry.getAllVariables();

    container.innerHTML = `
      <div class="ds-table-controls">
        <div class="ds-search-bar">
          <span>🔍</span>
          <input type="text" placeholder="Search variables...">
        </div>
      </div>

      <table class="ds-data-table">
        <thead>
          <tr>
            <th>Variable Name</th>
            <th>Type</th>
            <th>Authoritative Value</th>
            <th>Bound Property</th>
            <th>Scope</th>
            <th>Collection</th>
          </tr>
        </thead>
        <tbody>
          ${vars.length === 0 ? `
            <tr><td colspan="6" style="text-align: center; color: var(--text-dim); padding: 30px;">No variables configured.</td></tr>
          ` : vars.map(v => `
            <tr>
              <td class="ds-token-name" style="color: var(--accent-green);">${v.name}</td>
              <td style="font-size: 11px; text-transform: uppercase;">${v.type}</td>
              <td>
                ${v.type === 'color' ? `<span class="ds-color-swatch" style="background: ${v.value};"></span>` : ''}
                <code>${v.value}</code>
              </td>
              <td><span style="font-size: 11px; color: var(--accent-blue);">${v.boundProperty || 'visual'}</span></td>
              <td style="color: var(--text-dim); font-size: 11px;">all-scopes</td>
              <td style="color: var(--text-dim); font-size: 11px;">foundation</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  renderComponentsView(container) {
    const comps = this.registry.getAllComponents();

    container.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px;">
        ${comps.length === 0 ? `
          <div style="grid-column: 1 / -1; text-align: center; color: var(--text-dim); padding: 40px;">No components published yet.</div>
        ` : comps.map(c => `
          <div class="ds-card" style="display: flex; flex-direction: column; gap: 8px;">
            <div style="height: 90px; background: var(--bg-surface); border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 28px;">
              ❖
            </div>
            <div style="font-size: 13px; font-weight: 700; color: var(--text-main);">${c.name}</div>
            <div style="font-size: 11px; color: var(--text-dim);">${c.description || 'Governed component definition'}</div>
            <div style="display: flex; gap: 6px; margin-top: auto; padding-top: 8px;">
              <span style="font-size: 10px; padding: 2px 6px; border-radius: 4px; background: rgba(13,153,255,0.15); color: var(--accent-blue);">${c.variants?.length || 1} variants</span>
              <span style="font-size: 10px; padding: 2px 6px; border-radius: 4px; background: rgba(16,185,129,0.15); color: var(--accent-green);">${c.status || 'published'}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  renderStylesView(container) {
    const styles = this.registry.getAllStyles();

    container.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px;">
        ${styles.length === 0 ? `
          <div style="grid-column: 1 / -1; text-align: center; color: var(--text-dim); padding: 40px;">No styles created yet.</div>
        ` : styles.map(s => `
          <div class="ds-card">
            <div style="font-size: 13px; font-weight: 700; color: var(--text-main); margin-bottom: 6px;">${s.name}</div>
            <div style="font-size: 11px; color: var(--text-dim); text-transform: uppercase;">${s.type} Style</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  renderAssetsView(container) {
    const assets = this.registry.doc.assets || [];

    container.innerHTML = `
      <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 16px;">
        Authoritative unified view over all reusable components, tokens, variables, and assets.
      </p>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 14px;">
        ${assets.length === 0 ? `
          <div style="grid-column: 1 / -1; text-align: center; color: var(--text-dim); padding: 40px;">No assets registered.</div>
        ` : assets.map(a => `
          <div class="ds-card" style="padding: 14px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
              <span style="font-size: 10px; text-transform: uppercase; color: var(--text-dim); font-weight: 700;">${a.type}</span>
              <span style="font-size: 9px; padding: 1px 4px; border-radius: 4px; background: rgba(16,185,129,0.15); color: var(--accent-green);">synced</span>
            </div>
            <div style="font-size: 12px; font-weight: 600; color: var(--text-main);">${a.name}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  renderLibrariesView(container) {
    container.innerHTML = `
      <div class="ds-card" style="max-width: 600px;">
        <div class="ds-card-title">
          <span>Active Design System Library</span>
          <span style="font-size: 11px; color: var(--accent-blue);">Authoritative</span>
        </div>
        <div style="font-size: 12px; line-height: 1.8; color: var(--text-muted);">
          <div><strong>Library ID:</strong> <code>${this.registry.system.id}</code></div>
          <div><strong>Library Name:</strong> ${this.registry.system.name}</div>
          <div><strong>Semantic Version:</strong> ${this.registry.system.version}</div>
          <div><strong>Publication State:</strong> ${this.registry.system.status}</div>
          <div><strong>Provenance:</strong> native-registry</div>
        </div>
      </div>
    `;
  }

  renderImportsView(container) {
    container.innerHTML = `
      <div class="ds-card" style="max-width: 600px;">
        <div class="ds-card-title">
          <span>Source Synchronization Status</span>
        </div>
        <p style="font-size: 12px; color: var(--text-muted); line-height: 1.6; margin-bottom: 12px;">
          DesignForge AI supports importing and bi-directional synchronization with W3C DTCG Token JSON, Tailwind configurations, and React component packages.
        </p>
        <button class="ds-action-btn" onclick="window.designForgeApp.dsUi.openImportModal()">
          📥 Import New React or DTCG System
        </button>
      </div>
    `;
  }

  renderDocsView(container) {
    const tokens = this.registry.getAllTokens();
    const colors = tokens.filter(t => t.category === 'color');
    const typos = tokens.filter(t => t.category === 'typography');

    container.innerHTML = `
      <div style="max-width: 760px; display: flex; flex-direction: column; gap: 20px;">
        <div class="ds-card">
          <div class="ds-card-title">Color Palette & Contrast Guidelines</div>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px;">
            ${colors.slice(0, 12).map(c => `
              <div style="background: var(--bg-surface); border-radius: 6px; padding: 10px; border: 1px solid var(--border-subtle);">
                <div style="height: 36px; border-radius: 4px; background: ${c.value}; margin-bottom: 6px; border: 1px solid rgba(255,255,255,0.1);"></div>
                <div style="font-size: 11px; font-weight: 600; color: var(--text-main);">${c.name}</div>
                <div style="font-size: 10px; color: var(--text-dim);">${c.value}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="ds-card">
          <div class="ds-card-title">Typography Hierarchy</div>
          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${typos.map(t => `
              <div style="display: flex; align-items: baseline; justify-content: space-between; border-bottom: 1px solid var(--border-subtle); padding-bottom: 8px;">
                <span style="font-size: ${typeof t.value === 'number' ? `${t.value}px` : t.value}; color: var(--text-main);">${t.name}</span>
                <span style="font-size: 11px; color: var(--text-dim);">${t.value}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  renderVersionsView(container) {
    const releases = this.registry.system.history;

    container.innerHTML = `
      <div class="ds-card" style="max-width: 760px;">
        <div class="ds-card-title">
          <span>Release History</span>
          <button class="menu-dropdown-btn-sm" onclick="window.designForgeApp.dsUi.openPublishModal()">+ New Release</button>
        </div>
        <table class="ds-data-table" style="margin-top: 12px;">
          <thead>
            <tr>
              <th>Version</th>
              <th>Release Notes</th>
              <th>Published At</th>
            </tr>
          </thead>
          <tbody>
            ${releases.map(r => `
              <tr>
                <td><span class="ds-version-pill">v${r.version}</span></td>
                <td style="font-size: 12px; color: var(--text-main);">${r.summary}</td>
                <td style="font-size: 11px; color: var(--text-dim);">${new Date(r.publishedAt).toLocaleDateString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
}
