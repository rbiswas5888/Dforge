/**
 * DesignForge AI - Design System UI Controller
 * Manages the unified Design System views, navigation, modals, and synchronizations.
 */

import { TOKEN_CATEGORIES, VARIABLE_TYPES, THEME_MODES, DESIGN_SYSTEM_STARTERS } from './types.js';
import { RNEUI_COMPONENT_CATALOG, addRneuiComponentToRegistry } from './rneui_catalog.js';
import { MUI_COMPONENT_CATALOG, MUI_DESIGN_TOKENS, addMuiComponentToRegistry, insertMuiComponentToCanvas } from './mui_catalog.js';

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
    this.activeComponentLibrary = 'mui';
    this.activeMuiCategory = 'all';
    this.tokenSearchQuery = '';
    this.varSearchQuery = '';

    this.activeProposals = [];
    this.activeCompNode = null;
    this.lastImportReport = null;
    this.pendingReactSourceFiles = [];
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

    const btnBackEditor = document.getElementById('btnDsBackToEditor');
    if (btnBackEditor) {
      btnBackEditor.addEventListener('click', () => {
        this.app.setAxiomMode('design');
      });
    }
  }

  bindToolbarEvents() {
    const btnDsDesign = document.getElementById('btnDsSwitchDesign');
    if (btnDsDesign) {
      btnDsDesign.addEventListener('click', () => this.app.setAxiomMode('design'));
    }

    const btnDsProto = document.getElementById('btnDsSwitchPrototype');
    if (btnDsProto) {
      btnDsProto.addEventListener('click', () => this.app.setAxiomMode('prototype'));
    }

    const btnDsSys = document.getElementById('btnDsSwitchSystem');
    if (btnDsSys) {
      btnDsSys.addEventListener('click', () => this.app.setAxiomMode('system'));
    }

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
    const btnChooseReactFolder = document.getElementById('btnChooseReactFolder');
    const importFileInput = document.getElementById('importReactFileInput');
    const importFolderInput = document.getElementById('importReactFolderInput');
    const closeImp = () => { if (modalImp) modalImp.style.display = 'none'; };
    if (btnCloseImp) btnCloseImp.addEventListener('click', closeImp);
    if (btnCancelImp) btnCancelImp.addEventListener('click', closeImp);
    if (btnChooseImportFile && importFileInput) {
      btnChooseImportFile.addEventListener('click', () => importFileInput.click());
      importFileInput.addEventListener('change', async () => {
        const files = Array.from(importFileInput.files || []);
        if (!files.length) return;
        const input = document.getElementById('importReactSourceInput');
        const status = document.getElementById('importAnalysisStatus');
        this.pendingReactSourceFiles = files;
        this.lastImportReport = null;
        if (input) input.value = files.length === 1 ? await files[0].text() : '';
        if (status) status.textContent = `Loaded ${files.length} source file${files.length === 1 ? '' : 's'}. Analyze to inspect tokens and components.`;
        if (btnCommitImp) btnCommitImp.style.display = 'none';
        document.getElementById('importReportBox').style.display = 'none';
        importFileInput.value = '';
      });
    }

    if (btnChooseReactFolder && importFolderInput) {
      btnChooseReactFolder.addEventListener('click', () => importFolderInput.click());
      importFolderInput.addEventListener('change', () => {
        const files = Array.from(importFolderInput.files || [])
          .filter(file => /\.(?:json|css|jsx?|tsx?)$/i.test(file.name))
          .filter(file => !/(?:^|\/)(?:node_modules|dist|build|\.git|coverage)\//i.test(file.webkitRelativePath || file.name));
        const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
        const status = document.getElementById('importAnalysisStatus');
        this.lastImportReport = null;
        if (files.length > 300 || totalBytes > 10 * 1024 * 1024) {
          this.pendingReactSourceFiles = [];
          if (status) status.textContent = 'Folder exceeds the safe analysis limit (300 files or 10 MB).';
          if (btnCommitImp) btnCommitImp.style.display = 'none';
          importFolderInput.value = '';
          return;
        }
        this.pendingReactSourceFiles = files;
        const input = document.getElementById('importReactSourceInput');
        if (input) input.value = '';
        if (status) status.textContent = files.length
          ? `Loaded ${files.length} source files from the folder. Analyze to inspect tokens and components.`
          : 'No supported token or source files found in that folder.';
        if (btnCommitImp) btnCommitImp.style.display = 'none';
        document.getElementById('importReportBox').style.display = 'none';
        importFolderInput.value = '';
      });
    }

    document.getElementById('importReactSourceInput')?.addEventListener('input', () => {
      this.pendingReactSourceFiles = [];
      this.lastImportReport = null;
      if (btnCommitImp) btnCommitImp.style.display = 'none';
    });

    if (btnAnalyzeImp) {
      btnAnalyzeImp.addEventListener('click', async () => {
        const input = document.getElementById('importReactSourceInput')?.value || '';
        const status = document.getElementById('importAnalysisStatus');
        if (status) status.textContent = 'Analyzing source constructs...';

        let report;
        try {
          report = this.pendingReactSourceFiles.length
            ? await this.analyzeSourceFiles(this.pendingReactSourceFiles)
            : await this.importer.analyzeAndParse(input);
        } catch (error) {
          if (status) status.textContent = `Analysis failed: ${error.message}`;
          if (btnCommitImp) btnCommitImp.style.display = 'none';
          return;
        }
        this.lastImportReport = report;

        const reportBox = document.getElementById('importReportBox');
        const summary = document.getElementById('importReportSummary');
        if (reportBox && summary) {
          const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
          })[char]);
          const packages = report.packages || (report.packageInfo ? [report.packageInfo] : []);
          reportBox.style.display = 'block';
          summary.innerHTML = `
            <div><strong>Format Detected:</strong> ${report.format.toUpperCase()} (Confidence: ${report.confidence}%)</div>
            <div><strong>Discovered Tokens:</strong> ${report.discoveredTokens.length}</div>
            <div><strong>Discovered Components:</strong> ${report.discoveredComponents.length}</div>
            <div><strong>Fidelity Score:</strong> ${report.fidelityScore}%</div>
            ${packages.map(info => `
              <div><strong>Package:</strong> ${escapeHtml(info.name)}${info.version ? `@${escapeHtml(info.version)}` : ''} · ${info.exports.length} export path(s) · ${info.dependencies.length} dependency reference(s)</div>
              ${info.entryPoints.length ? `<div><strong>Entry points:</strong> ${info.entryPoints.map(entry => `${escapeHtml(entry.kind)}: ${escapeHtml(entry.path)}`).join(', ')}</div>` : ''}
              ${info.scriptNames.length ? `<div style="color: #fbbf24;">Package scripts detected (${info.scriptNames.map(escapeHtml).join(', ')}) but will not be run.</div>` : ''}
            `).join('')}
            ${report.warnings.length ? `<div style="color: #f59e0b; margin-top: 4px;"><span data-icon="TriangleAlert" data-icon-size="13"></span> ${report.warnings.map(escapeHtml).join(', ')}</div>` : ''}
          `;
        }
        if (status) status.textContent = 'Analysis complete.';
        if (btnCommitImp) btnCommitImp.style.display = 'inline-flex';
      });
    }

    if (btnCommitImp) {
      btnCommitImp.addEventListener('click', () => {
        if (this.lastImportReport) {
          const status = document.getElementById('importAnalysisStatus');
          try {
            const packages = this.lastImportReport.packages || (this.lastImportReport.packageInfo ? [this.lastImportReport.packageInfo] : []);
            const packageName = packages.length === 1
              ? packages[0].name.replace(/[^a-zA-Z0-9._@/ -]/g, '').slice(0, 100)
              : '';
            const collectionName = packages.length === 1
              ? `${packageName || 'Imported Package'} Design System`
              : 'Imported React System';
            const result = this.importer.commitImportedSystem(this.lastImportReport, collectionName);
            closeImp();
            this.updateHeaderInfo();
            this.renderView(this.activeView);
            if (this.app.renderer) this.app.renderer.render();
            this.app.showToast(
              `Imported ${result.importedTokensCount} token(s) and ${result.importedComponentsCount} component(s).`
            );
          } catch (error) {
            if (status) status.textContent = `Import failed: ${error.message}`;
          }
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
        const description = document.getElementById('createDsDesc')?.value || '';
        const starter = document.querySelector('input[name="dsStarterRadio"]:checked')?.value || 'minimal';
        try {
          this.registry.initializeWithStarter(starter, name, description);
          closeCreate();
          this.updateHeaderInfo();
          this.renderView('overview');
          if (this.app.renderer) this.app.renderer.render();
        } catch (error) {
          this.app.showToast(`Could not create design system: ${error.message}`);
        }
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

  async analyzeSourceFiles(files) {
    const reports = [];
    for (const file of files) {
      reports.push(await this.importer.analyzeAndParse(await file.text(), {
        sourceName: file.webkitRelativePath || file.name
      }));
    }
    const uniqueBy = (items, keyFor) => {
      const seen = new Set();
      return items.filter(item => {
        const key = keyFor(item);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    };
    const tokens = reports.flatMap(report => report.discoveredTokens);
    const components = reports.flatMap(report => report.discoveredComponents);
    return {
      sourceName: files.length === 1 ? reports[0].sourceName : 'React project folder',
      format: files.length === 1 ? reports[0].format : 'project-folder',
      confidence: Math.round(reports.reduce((sum, report) => sum + report.confidence, 0) / reports.length),
      fidelityScore: Math.round(reports.reduce((sum, report) => sum + report.fidelityScore, 0) / reports.length),
      discoveredTokens: uniqueBy(tokens, token => `${token.name}:${JSON.stringify(token.value)}`),
      discoveredComponents: uniqueBy(components, component => component.name),
      packages: uniqueBy(reports.map(report => report.packageInfo).filter(Boolean), info => `${info.name}@${info.version}`),
      unsupportedConstructs: uniqueBy(reports.flatMap(report => report.unsupportedConstructs), item => item),
      warnings: uniqueBy(reports.flatMap(report => report.warnings), item => item)
    };
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
    this.pendingReactSourceFiles = [];
    this.lastImportReport = null;
    const status = document.getElementById('importAnalysisStatus');
    if (status) status.textContent = 'Waiting for input...';
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
              ${metrics.duplicateCandidates.length === 0 ? '<span data-icon="Check" data-icon-size="13"></span> All Validated' : `${metrics.duplicateCandidates.length} warnings`}
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
              <div><span data-icon="Check" data-icon-size="13"></span> Zero duplicate token candidates detected. Registry is normalized.</div>
            </div>
          `}
          ${metrics.unboundCount > 0 ? `
            <div class="ds-issue-item">
              <div><strong>Unbound Raw Values in Document:</strong> ${metrics.unboundCount} candidate layers could use tokens.</div>
            </div>
          ` : `
            <div class="ds-issue-item info">
              <div><span data-icon="Check" data-icon-size="13"></span> No unbound raw styling candidates identified in document layers.</div>
            </div>
          `}
          <div class="ds-issue-item info">
            <div><span data-icon="Check" data-icon-size="13"></span> Single authoritative shared registry active. Tokens, Variables, Assets synchronized.</div>
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
          <span data-icon="Search" data-icon-size="14"></span>
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
                <button class="menu-dropdown-btn-sm" onclick="window.designForgeApp.dsUi.deleteTokenPrompt('${t.id}')" title="Delete Token"><span data-icon="Trash2" data-icon-size="14"></span></button>
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
          <span data-icon="Search" data-icon-size="14"></span>
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
    const isMui = this.activeComponentLibrary === 'mui';

    const muiCategories = ['all', 'Inputs', 'Surfaces', 'Feedback', 'Data Display', 'Navigation', 'Layout'];
    const filteredMuiComps = this.activeMuiCategory === 'all'
      ? MUI_COMPONENT_CATALOG
      : MUI_COMPONENT_CATALOG.filter(c => c.category.toLowerCase() === this.activeMuiCategory.toLowerCase());

    container.innerHTML = `
      <section class="ds-card" style="margin-bottom: 20px;">
        <!-- Library Selector Header -->
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 14px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 12px;">
          <div>
            <div style="font-size: 15px; font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 8px;">
              <span>Component Library Catalog</span>
              <span style="font-size: 11px; padding: 2px 8px; border-radius: 12px; background: rgba(25, 118, 210, 0.15); color: #42a5f5; font-weight: 600;">
                ${isMui ? '@mui/material · React v10' : '@rneui/themed · Mobile v5'}
              </span>
            </div>
            <div style="font-size: 11px; color: var(--text-dim); margin-top: 4px;">
              ${isMui 
                ? 'Official Material UI React components. Insert directly onto the canvas with live styling or register into your active design system.'
                : 'React Native Elements component references for cross-platform mobile interface architecture.'}
            </div>
          </div>

          <!-- Library Toggle Switcher -->
          <div style="display: flex; background: var(--bg-surface); padding: 3px; border-radius: 8px; border: 1px solid var(--border-subtle); gap: 4px;">
            <button type="button" class="ds-filter-pill ${isMui ? 'active' : ''}" data-ds-lib="mui" style="padding: 5px 12px; font-size: 11px; font-weight: 600; cursor: pointer;">
              Material UI (@mui/material)
            </button>
            <button type="button" class="ds-filter-pill ${!isMui ? 'active' : ''}" data-ds-lib="rneui" style="padding: 5px 12px; font-size: 11px; font-weight: 600; cursor: pointer;">
              React Native (@rneui/themed)
            </button>
          </div>
        </div>

        ${isMui ? `
          <!-- MUI Category Filter Pills -->
          <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px;">
            ${muiCategories.map(cat => `
              <button type="button" class="ds-filter-pill ${this.activeMuiCategory === cat.toLowerCase() ? 'active' : ''}" data-mui-category="${cat.toLowerCase()}" style="font-size: 11px; padding: 4px 10px; cursor: pointer;">
                ${cat === 'all' ? 'All Categories (' + MUI_COMPONENT_CATALOG.length + ')' : cat}
              </button>
            `).join('')}
          </div>

          <!-- MUI Component Grid -->
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px;">
            ${filteredMuiComps.map(component => {
              const added = comps.some(item => item.sourceMetadata?.catalogId === component.id && item.sourceMetadata?.package === '@mui/material');
              return `
                <article style="border: 1px solid var(--border-subtle); border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 8px; background: var(--bg-surface); transition: border-color 0.15s ease;">
                  <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="font-size: 13px; font-weight: 700; color: var(--text-main);">${component.name}</div>
                    <span style="font-size: 9px; padding: 2px 6px; border-radius: 4px; background: rgba(25,118,210,0.12); color: #42a5f5; font-weight: 600;">
                      ${component.category}
                    </span>
                  </div>
                  <div style="font-size: 11px; color: var(--text-dim); min-height: 32px; line-height: 1.4;">${component.description}</div>
                  
                  <div style="display: flex; gap: 6px; margin-top: auto; padding-top: 6px;">
                    <button type="button" class="ds-action-btn" data-mui-insert="${component.id}" title="Insert directly onto design canvas" style="flex: 1; background: #1976d2; color: #ffffff; border: none; font-weight: 600;">
                      ↵ Insert
                    </button>
                    <button type="button" class="ds-action-btn" data-mui-add="${component.id}" ${added ? 'disabled style="opacity: 0.6; cursor: not-allowed;"' : ''} style="flex: 1;">
                      ${added ? '✓ In System' : '+ System'}
                    </button>
                  </div>
                </article>
              `;
            }).join('')}
          </div>
        ` : `
          <!-- RNEUI Component Grid -->
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 10px;">
            ${RNEUI_COMPONENT_CATALOG.map(component => {
              const added = comps.some(item => item.sourceMetadata?.catalogId === component.id && item.sourceMetadata?.package === '@rneui/themed');
              return `
                <article style="border: 1px solid var(--border-subtle); border-radius: 8px; padding: 10px; display: flex; flex-direction: column; gap: 6px;">
                  <div style="font-size: 12px; font-weight: 700; color: var(--text-main);">${component.name}</div>
                  <div style="font-size: 10px; color: var(--text-dim); min-height: 28px;">${component.description}</div>
                  <button type="button" class="ds-action-btn" data-rneui-component="${component.id}" ${added ? 'disabled style="opacity: 0.6; cursor: not-allowed;"' : ''}>
                    ${added ? 'Added to system' : 'Add to system'}
                  </button>
                </article>
              `;
            }).join('')}
          </div>
        `}
      </section>

      <!-- Registered Components List in Active Design System -->
      <div style="margin-top: 24px;">
        <div style="font-size: 14px; font-weight: 700; color: var(--text-main); margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
          <span>Registered Design System Components (${comps.length})</span>
          <span style="font-size: 11px; color: var(--text-dim);">Authoritative definitions</span>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px;">
          ${comps.length === 0 ? `
            <div style="grid-column: 1 / -1; text-align: center; color: var(--text-dim); padding: 28px; border: 1px dashed var(--border-subtle); border-radius: 8px;">
              No components registered yet. Use "+ System" on any Material UI or RNEUI component above.
            </div>
          ` : comps.map(c => `
            <div class="ds-card" style="display: flex; flex-direction: column; gap: 8px;">
              <div style="height: 70px; background: var(--bg-surface); border-radius: 6px; display: flex; align-items: center; justify-content: center;">
                <span data-icon="Box" data-icon-size="28"></span>
              </div>
              <div style="font-size: 13px; font-weight: 700; color: var(--text-main);">${c.name}</div>
              <div style="font-size: 11px; color: var(--text-dim);">${c.description || 'Governed component definition'}</div>
              <div style="display: flex; gap: 6px; margin-top: auto; padding-top: 8px;">
                <span style="font-size: 10px; padding: 2px 6px; border-radius: 4px; background: rgba(13,153,255,0.15); color: var(--accent-blue);">${c.sourceMetadata?.package || 'custom'}</span>
                <span style="font-size: 10px; padding: 2px 6px; border-radius: 4px; background: rgba(16,185,129,0.15); color: var(--accent-green);">${c.status || 'published'}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // Library toggle buttons
    container.querySelectorAll('[data-ds-lib]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeComponentLibrary = btn.dataset.dsLib;
        this.renderComponentsView(container);
      });
    });

    // MUI category filter buttons
    container.querySelectorAll('[data-mui-category]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeMuiCategory = btn.dataset.muiCategory;
        this.renderComponentsView(container);
      });
    });

    // MUI Insert directly onto canvas
    container.querySelectorAll('[data-mui-insert]').forEach(btn => {
      btn.addEventListener('click', () => {
        try {
          const compId = btn.dataset.muiInsert;
          insertMuiComponentToCanvas(this.app, compId);
          // Return to Design workspace to see and manipulate the new node
          this.app.setAxiomMode('design');
        } catch (error) {
          this.app.showToast(`Error inserting MUI component: ${error.message}`);
        }
      });
    });

    // MUI Add to system
    container.querySelectorAll('[data-mui-add]').forEach(btn => {
      btn.addEventListener('click', () => {
        try {
          const compId = btn.dataset.muiAdd;
          const result = addMuiComponentToRegistry(this.registry, compId);
          if (result.added) {
            this.updateHeaderInfo();
            this.renderComponentsView(container);
            this.app.showToast(`${result.component.name} registered in design system.`);
          }
        } catch (error) {
          this.app.showToast(`Could not register MUI component: ${error.message}`);
        }
      });
    });

    // RNEUI Add to system
    container.querySelectorAll('[data-rneui-component]').forEach(button => {
      button.addEventListener('click', () => {
        try {
          const result = addRneuiComponentToRegistry(this.registry, button.dataset.rneuiComponent);
          if (result.added) {
            this.updateHeaderInfo();
            this.renderComponentsView(container);
            this.app.showToast(`${result.component.name} added to the design system catalog.`);
          }
        } catch (error) {
          this.app.showToast(`Could not add RNEUI component: ${error.message}`);
        }
      });
    });
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
      <div style="display: flex; flex-direction: column; gap: 20px; max-width: 800px;">
        <!-- Active Design System -->
        <div class="ds-card">
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

        <!-- Integrated External Libraries -->
        <div class="ds-card">
          <div class="ds-card-title">
            <span>Integrated Component Libraries & Token Sets</span>
            <span style="font-size: 11px; color: var(--accent-green);">2 Libraries Available</span>
          </div>
          <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 16px;">
            DesignForge AI integrates production React and React Native frameworks directly into your workflow.
          </p>

          <div style="display: flex; flex-direction: column; gap: 14px;">
            <!-- Material UI Card -->
            <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 14px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <strong style="color: var(--text-main); font-size: 13px;">Material UI (@mui/material)</strong>
                  <span style="font-size: 10px; padding: 2px 6px; border-radius: 4px; background: rgba(25,118,210,0.15); color: #42a5f5; font-weight: 600;">v10.0.0-alpha.0</span>
                  <span style="font-size: 10px; padding: 2px 6px; border-radius: 4px; background: rgba(16,185,129,0.15); color: var(--accent-green);">React / Web</span>
                </div>
                <button type="button" class="ds-action-btn" id="btnSeedMuiTokens" style="font-size: 11px; padding: 4px 10px;">
                  + Seed Material Tokens
                </button>
              </div>
              <div style="font-size: 11px; color: var(--text-dim); line-height: 1.6;">
                32+ core components (Buttons, Cards, Inputs, Dialogs, AppBar, Tabs, Alerts). Includes authentic Roboto typography scale, 8px grid spacing, and 24 elevation shadow depths.
              </div>
            </div>

            <!-- React Native Elements Card -->
            <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 14px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <strong style="color: var(--text-main); font-size: 13px;">React Native Elements (@rneui/themed)</strong>
                  <span style="font-size: 10px; padding: 2px 6px; border-radius: 4px; background: rgba(13,153,255,0.15); color: var(--accent-blue); font-weight: 600;">v5.0.0</span>
                  <span style="font-size: 10px; padding: 2px 6px; border-radius: 4px; background: rgba(16,185,129,0.15); color: var(--accent-green);">React Native</span>
                </div>
              </div>
              <div style="font-size: 11px; color: var(--text-dim); line-height: 1.6;">
                13 mobile cross-platform component schemas with theme-based styling properties and mobile design patterns.
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Seed Material tokens button
    container.querySelector('#btnSeedMuiTokens')?.addEventListener('click', () => {
      try {
        const primaryColor = MUI_DESIGN_TOKENS.palette.primary.main;
        const secondaryColor = MUI_DESIGN_TOKENS.palette.secondary.main;
        const errorColor = MUI_DESIGN_TOKENS.palette.error.main;
        const successColor = MUI_DESIGN_TOKENS.palette.success.main;

        this.registry.addToken(TOKEN_CATEGORIES.COLOR, 'MUI / Primary', primaryColor);
        this.registry.addToken(TOKEN_CATEGORIES.COLOR, 'MUI / Secondary', secondaryColor);
        this.registry.addToken(TOKEN_CATEGORIES.COLOR, 'MUI / Error', errorColor);
        this.registry.addToken(TOKEN_CATEGORIES.COLOR, 'MUI / Success', successColor);
        this.registry.addToken(TOKEN_CATEGORIES.SPACING, 'MUI / Spacing Base', '8px');
        this.registry.addToken(TOKEN_CATEGORIES.TYPOGRAPHY, 'MUI / Font Family', 'Roboto, sans-serif');

        this.updateHeaderInfo();
        this.app.showToast('Material UI tokens seeded into design system.', 'success');
      } catch (err) {
        this.app.showToast(`Error seeding tokens: ${err.message}`);
      }
    });
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
          <span data-icon="Upload" data-icon-size="14"></span> Import New React or DTCG System
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
