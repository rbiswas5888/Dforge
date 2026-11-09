/**
 * Enterprise Banking Operations Platform — Master Application Controller
 * Handles interactive navigation across all 16 banking modules,
 * live transaction filtering, ISO 20022 XML parsing, Maker-Checker workflows,
 * interactive entity resolution graphs, and the AI Financial Copilot.
 */

import {
  SYSTEM_META,
  GLOBAL_LIQUIDITY_ACCOUNTS,
  REAL_TIME_TRANSACTIONS,
  SWIFT_MESSAGES,
  AML_ALERTS,
  ENTITY_GRAPH,
  CORPORATE_ACCOUNTS,
  SANCTIONS_MATCHES,
  REGULATORY_METRICS,
  RULE_ENGINE_RULES,
  MAKER_CHECKER_ITEMS,
  PAYMENT_RAILS,
  AUDIT_TRAIL
} from './data/synthetic_data.js';

export class BankingPlatformApp {
  constructor() {
    this.currentView = 'command-center';
    this.copilotOpen = false;
    this.transactions = [...REAL_TIME_TRANSACTIONS];
    this.makerCheckerQueue = [...MAKER_CHECKER_ITEMS];
    this.selectedSwiftMsg = 'pacs.008';
    this.activeXmlTab = 'xml'; // 'xml' | 'tree'
    this.txFilter = 'ALL';
    this.searchQuery = '';
    this.activeEntity = 'All Institutional Accounts';
    this.copilotChatHistory = [
      {
        sender: 'ai',
        text: 'AxiomCore AI Copilot initialized. I have full context on your $2.84B multi-currency nostro balances, 16 clearing rails, and active AML alerts. How can I assist you today?'
      }
    ];

    this.init();
  }

  init() {
    this.renderShell();
    this.bindEvents();
    this.navigateTo(this.currentView);
  }

  renderShell() {
    const root = document.getElementById('bankingAppRoot');
    if (!root) return;

    root.innerHTML = `
      <div class="banking-app-container">
        <!-- Header -->
        <header class="banking-header">
          <div class="banking-brand">
            <div class="banking-logo-icon">▲</div>
            <div class="banking-logo-badge">
              <span>AxiomCore</span>
              <span style="font-weight: 400; color: var(--b-text-secondary);">Banking Ops</span>
            </div>
            <span class="banking-env-tag">SIMULATED PRODUCTION</span>
          </div>

          <div class="banking-header-center">
            <div class="banking-global-search">
              <span class="banking-search-icon">🔍</span>
              <input type="text" class="banking-search-input" id="globalBankingSearch" placeholder="Search accounts, UETR, SWIFT BICs, entity names, or rule IDs (Press ⌘K)...">
            </div>
          </div>

          <div class="banking-header-right">
            <div class="rail-status-pill" title="All 6 clearing networks operational">
              <div class="pulse-dot"></div>
              <span>Rails 100% Active</span>
            </div>

            <button class="btn-banking-icon" id="btnNotificationBell" title="System Notifications (3)">
              🔔
            </button>

            <button class="btn-banking-copilot" id="btnToggleCopilot">
              ✨ <span>AI Copilot</span>
            </button>
          </div>
        </header>

        <!-- Main Body: Sidebar + Workspace -->
        <div class="banking-main">
          <!-- Left Navigation Sidebar -->
          <nav class="banking-sidebar">
            <div class="sidebar-category">Treasury & Liquidity</div>
            <div class="sidebar-nav-item active" data-view="command-center">
              <span>📊</span> Command Center
            </div>
            <div class="sidebar-nav-item" data-view="liquidity">
              <span>💧</span> Liquidity Management
            </div>
            <div class="sidebar-nav-item" data-view="corp-360">
              <span>🏢</span> Corporate Account 360
            </div>

            <div class="sidebar-category">Payment Operations</div>
            <div class="sidebar-nav-item" data-view="transactions">
              <span>⚡</span> Transaction Monitoring
              <span class="nav-badge info">Live</span>
            </div>
            <div class="sidebar-nav-item" data-view="swift-iso">
              <span>📜</span> SWIFT / ISO 20022
            </div>
            <div class="sidebar-nav-item" data-view="payment-ops">
              <span>🏦</span> Payment Rails & Routing
            </div>
            <div class="sidebar-nav-item" data-view="maker-checker">
              <span>✍️</span> Maker-Checker Queue
              <span class="nav-badge warning" id="sidebarMcBadge">3</span>
            </div>
            <div class="sidebar-nav-item" data-view="bulk-export">
              <span>📦</span> Bulk Export Manager
            </div>

            <div class="sidebar-category">Risk, AML & Sanctions</div>
            <div class="sidebar-nav-item" data-view="aml-fraud">
              <span>🛡️</span> AML & Fraud Sentinel
              <span class="nav-badge danger">3 High</span>
            </div>
            <div class="sidebar-nav-item" data-view="entity-graph">
              <span>🕸️</span> Entity Resolution Graph
            </div>
            <div class="sidebar-nav-item" data-view="ubo-hierarchy">
              <span>🌳</span> UBO Ownership Tree
            </div>
            <div class="sidebar-nav-item" data-view="sanctions">
              <span>⛔</span> Sanctions Screening
            </div>

            <div class="sidebar-category">Governance & Platform</div>
            <div class="sidebar-nav-item" data-view="compliance">
              <span>📋</span> Regulatory Compliance
            </div>
            <div class="sidebar-nav-item" data-view="rule-engine">
              <span>⚙️</span> Rule & Policy Engine
            </div>
            <div class="sidebar-nav-item" data-view="audit-trail">
              <span>🔒</span> Immutable Audit Trail
            </div>
            <div class="sidebar-nav-item" data-view="admin-settings">
              <span>🛠️</span> Administration & RBAC
            </div>
          </nav>

          <!-- Dynamic Workspace View Area -->
          <main class="banking-workspace" id="bankingWorkspaceContent">
            <!-- View contents rendered dynamically -->
          </main>
        </div>

        <!-- AI Copilot Sliding Drawer -->
        <aside class="banking-copilot-drawer" id="bankingCopilotDrawer">
          <div class="copilot-header">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 16px;">✨</span>
              <strong>AxiomCore AI Copilot</strong>
            </div>
            <button class="btn-banking-icon" id="btnCloseCopilot" style="width: 26px; height: 26px;">✕</button>
          </div>

          <div class="copilot-messages" id="copilotMessagesList">
            <!-- Rendered dynamically -->
          </div>

          <div style="padding: 10px 14px; background: rgba(0,0,0,0.15); display: flex; gap: 6px; overflow-x: auto;">
            <button class="btn-action-secondary quick-copilot-chip" style="font-size: 10px; padding: 3px 8px; white-space: nowrap;" data-prompt="Analyze high-risk transaction TX-2026-98126">🔍 Analyze TX-98126</button>
            <button class="btn-action-secondary quick-copilot-chip" style="font-size: 10px; padding: 3px 8px; white-space: nowrap;" data-prompt="Check Basel III LCR buffer">💧 Check LCR Ratio</button>
            <button class="btn-action-secondary quick-copilot-chip" style="font-size: 10px; padding: 3px 8px; white-space: nowrap;" data-prompt="Explain UBO risk for Caspian Petrochem">🌳 UBO Risk Summary</button>
          </div>

          <div class="copilot-input-area">
            <input type="text" class="copilot-input" id="copilotTextInput" placeholder="Ask AI Copilot about transactions, liquidity, or rules...">
            <button class="btn-action-primary" id="btnSendCopilot">Send</button>
          </div>
        </aside>
      </div>
    `;

    this.renderCopilotMessages();
  }

  bindEvents() {
    // 1. Sidebar Nav
    document.querySelectorAll('.sidebar-nav-item').forEach(item => {
      item.addEventListener('click', () => {
        const view = item.dataset.view;
        if (view) this.navigateTo(view);
      });
    });

    // 2. Copilot Toggle
    document.getElementById('btnToggleCopilot')?.addEventListener('click', () => this.toggleCopilot());
    document.getElementById('btnCloseCopilot')?.addEventListener('click', () => this.toggleCopilot(false));
    document.getElementById('btnSendCopilot')?.addEventListener('click', () => this.sendCopilotMessage());
    document.getElementById('copilotTextInput')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.sendCopilotMessage();
    });

    // 3. Quick Chips
    document.querySelectorAll('.quick-copilot-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const prompt = btn.dataset.prompt;
        if (prompt) {
          const input = document.getElementById('copilotTextInput');
          if (input) input.value = prompt;
          this.sendCopilotMessage();
        }
      });
    });

    // 4. Global Search
    document.getElementById('globalBankingSearch')?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase();
      if (this.currentView === 'transactions') {
        this.renderTransactionMonitoringView();
      }
    });
  }

  navigateTo(viewId) {
    this.currentView = viewId;
    document.querySelectorAll('.sidebar-nav-item').forEach(i => {
      i.classList.toggle('active', i.dataset.view === viewId);
    });

    const container = document.getElementById('bankingWorkspaceContent');
    if (!container) return;

    switch (viewId) {
      case 'command-center':
        this.renderCommandCenterView();
        break;
      case 'liquidity':
        this.renderLiquidityView();
        break;
      case 'transactions':
        this.renderTransactionMonitoringView();
        break;
      case 'swift-iso':
        this.renderSwiftIsoInspectorView();
        break;
      case 'aml-fraud':
        this.renderAmlFraudView();
        break;
      case 'entity-graph':
        this.renderEntityGraphView();
        break;
      case 'corp-360':
        this.renderCorporate360View();
        break;
      case 'ubo-hierarchy':
        this.renderUboHierarchyView();
        break;
      case 'sanctions':
        this.renderSanctionsView();
        break;
      case 'compliance':
        this.renderComplianceView();
        break;
      case 'rule-engine':
        this.renderRuleEngineView();
        break;
      case 'maker-checker':
        this.renderMakerCheckerApprovalView();
        break;
      case 'payment-ops':
        this.renderPaymentOperationsView();
        break;
      case 'bulk-export':
        this.renderBulkExportView();
        break;
      case 'audit-trail':
        this.renderAuditTrailView();
        break;
      case 'admin-settings':
        this.renderAdminSettingsView();
        break;
      default:
        this.renderCommandCenterView();
    }
  }

  // --- 1. Command Center View ---
  renderCommandCenterView() {
    const el = document.getElementById('bankingWorkspaceContent');
    const totalLiquidityUsd = '$2,845,920,450.25';
    el.innerHTML = `
      <div class="view-header">
        <div class="view-title-group">
          <h1><span>📊</span> Executive Command Center</h1>
          <div class="view-description">Consolidated multi-currency liquidity, real-time clearing rail throughput, and high-priority operations queue.</div>
        </div>
        <div class="view-actions">
          <button class="btn-action-secondary" id="btnRefreshCmd">↻ Refresh Feeds</button>
          <button class="btn-action-primary" id="btnTriggerSweep">⚡ Initiate Intraday Sweep</button>
        </div>
      </div>

      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-label"><span>Total Consolidated Liquidity</span> <span>USD</span></div>
          <div class="metric-value">${totalLiquidityUsd}</div>
          <div class="metric-footer">
            <span class="metric-trend up">▲ +4.2%</span> <span>vs yesterday start</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-label"><span>24h Clearing Volume</span> <span>ALL RAILS</span></div>
          <div class="metric-value">$84.18B</div>
          <div class="metric-footer">
            <span class="metric-trend up">▲ 99.4% STP</span> <span>Straight-Through Rate</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-label"><span>Basel III LCR Buffer</span> <span>RATIO</span></div>
          <div class="metric-value">142.8%</div>
          <div class="metric-footer">
            <span class="metric-trend up">✓ Compliant</span> <span>Min statutory: 100.0%</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-label"><span>Active High-Risk Alerts</span> <span>AML / SANCTIONS</span></div>
          <div class="metric-value" style="color: #f87171;">3 Critical</div>
          <div class="metric-footer">
            <span class="metric-trend down">● Action Required</span> <span>FinCEN Filing Window</span>
          </div>
        </div>
      </div>

      <div class="banking-table-card">
        <div class="table-toolbar">
          <strong style="color: #ffffff;">Real-Time Global Clearing Rail Status</strong>
          <span style="font-size: 11px; color: var(--b-text-secondary);">Latency & Heartbeat</span>
        </div>
        <table class="banking-table">
          <thead>
            <tr>
              <th>Clearing Rail</th>
              <th>Status</th>
              <th>Latency</th>
              <th>Today's Volume</th>
              <th>STP Rate</th>
            </tr>
          </thead>
          <tbody>
            ${PAYMENT_RAILS.map(r => `
              <tr>
                <td><strong>${r.name}</strong></td>
                <td><span class="status-pill settled">● ${r.status}</span></td>
                <td>${r.latencyMs} ms</td>
                <td style="font-weight: 600;">${r.todayVolume}</td>
                <td style="color: #34d399;">${r.stpRate}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    document.getElementById('btnTriggerSweep')?.addEventListener('click', () => {
      alert('SIMULATED ACTION: Intraday cash-pool sweep of $50,000,000.00 EUR executed to Deutsche Bank Nostro.');
    });
  }

  // --- 2. Liquidity Management View ---
  renderLiquidityView() {
    const el = document.getElementById('bankingWorkspaceContent');
    el.innerHTML = `
      <div class="view-header">
        <div class="view-title-group">
          <h1><span>💧</span> Global Liquidity & Nostro / Vostro Management</h1>
          <div class="view-description">Intraday multi-currency account balances, central bank reserves, and automated cash pooling rules.</div>
        </div>
        <div class="view-actions">
          <button class="btn-action-primary" id="btnRebalanceNostro">Rebalance Nostro Buffers</button>
        </div>
      </div>

      <div class="banking-table-card">
        <div class="table-toolbar">
          <strong style="color: #ffffff;">Correspondent Nostro Account Balances</strong>
          <span style="font-size: 11px; color: var(--b-text-secondary);">${GLOBAL_LIQUIDITY_ACCOUNTS.length} Active Correspondent Accounts</span>
        </div>
        <table class="banking-table">
          <thead>
            <tr>
              <th>Currency</th>
              <th>Correspondent Bank</th>
              <th>SWIFT BIC</th>
              <th>Current Balance</th>
              <th>Intraday Buffer</th>
              <th>Credit Limit</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${GLOBAL_LIQUIDITY_ACCOUNTS.map(a => `
              <tr>
                <td><span style="font-weight: 700; color: #ffffff;">${a.currency}</span></td>
                <td>${a.correspondentBank}</td>
                <td class="mono-hash">${a.bic}</td>
                <td style="font-weight: 700; color: #ffffff;">${a.currency} ${a.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                <td>${a.currency} ${a.intradayBuffer.toLocaleString()}</td>
                <td>${a.currency} ${a.creditFacilityLimit.toLocaleString()}</td>
                <td><span class="status-pill ${a.status === 'OPTIMAL' ? 'optimal' : 'pending'}">${a.status}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // --- 3. Transaction Monitoring View ---
  renderTransactionMonitoringView() {
    const el = document.getElementById('bankingWorkspaceContent');
    const filtered = this.transactions.filter(t => {
      if (this.txFilter !== 'ALL' && t.status !== this.txFilter) return false;
      if (this.searchQuery) {
        return (
          t.id.toLowerCase().includes(this.searchQuery) ||
          t.uetr.toLowerCase().includes(this.searchQuery) ||
          t.debtor.toLowerCase().includes(this.searchQuery) ||
          t.creditor.toLowerCase().includes(this.searchQuery)
        );
      }
      return true;
    });

    el.innerHTML = `
      <div class="view-header">
        <div class="view-title-group">
          <h1><span>⚡</span> Real-Time Transaction Monitoring & Payment Feed</h1>
          <div class="view-description">Streaming ISO 20022 payment messages with UETR tracking, risk score assessment, and clearing status.</div>
        </div>
        <div class="view-actions">
          <button class="btn-action-secondary" id="btnExportTxs">Export CSV</button>
        </div>
      </div>

      <div class="banking-table-card">
        <div class="table-toolbar">
          <div class="table-filter-group">
            <span style="color: var(--b-text-secondary); font-size: 11px;">Filter Status:</span>
            <select class="banking-select" id="selTxFilter">
              <option value="ALL" ${this.txFilter === 'ALL' ? 'selected' : ''}>All Transactions</option>
              <option value="SETTLED" ${this.txFilter === 'SETTLED' ? 'selected' : ''}>Settled</option>
              <option value="FLAGGED_AML" ${this.txFilter === 'FLAGGED_AML' ? 'selected' : ''}>Flagged AML</option>
              <option value="PENDING_APPROVAL" ${this.txFilter === 'PENDING_APPROVAL' ? 'selected' : ''}>Pending Approval</option>
            </select>
          </div>
          <span style="font-size: 11px; color: var(--b-text-secondary);">${filtered.length} of ${this.transactions.length} records shown</span>
        </div>

        <table class="banking-table">
          <thead>
            <tr>
              <th>TX ID / UETR</th>
              <th>Message Type</th>
              <th>Debtor (Originator)</th>
              <th>Creditor (Beneficiary)</th>
              <th>Amount</th>
              <th>Risk Score</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map(t => `
              <tr>
                <td>
                  <strong>${t.id}</strong><br>
                  <span class="mono-hash" style="font-size: 10px; color: var(--b-text-muted);">${t.uetr.slice(0, 18)}...</span>
                </td>
                <td><span style="font-family: var(--b-font-mono); font-size: 11px;">${t.messageType}</span></td>
                <td>${t.debtor}</td>
                <td>${t.creditor}</td>
                <td><strong style="color: #ffffff;">${t.currency} ${t.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></td>
                <td>
                  <span style="font-weight: 700; color: ${t.riskScore > 70 ? '#f87171' : t.riskScore > 30 ? '#fbbf24' : '#34d399'};">
                    ${t.riskScore} / 100
                  </span>
                </td>
                <td>
                  <span class="status-pill ${t.status === 'SETTLED' ? 'settled' : t.status === 'FLAGGED_AML' ? 'flagged' : 'pending'}">
                    ${t.status}
                  </span>
                </td>
                <td>
                  <button class="btn-action-secondary btn-inspect-tx" style="padding: 2px 8px; font-size: 11px;" data-tx-id="${t.id}">Inspect</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    document.getElementById('selTxFilter')?.addEventListener('change', (e) => {
      this.txFilter = e.target.value;
      this.renderTransactionMonitoringView();
    });

    document.querySelectorAll('.btn-inspect-tx').forEach(btn => {
      btn.addEventListener('click', () => {
        const txId = btn.dataset.txId;
        this.navigateTo('swift-iso');
      });
    });

    document.getElementById('btnExportTxs')?.addEventListener('click', () => {
      alert(`SIMULATED EXPORT: Exported ${filtered.length} transactions as CSV.`);
    });
  }

  // --- 4. SWIFT & ISO 20022 Inspector View ---
  renderSwiftIsoInspectorView() {
    const el = document.getElementById('bankingWorkspaceContent');
    const msg = SWIFT_MESSAGES[this.selectedSwiftMsg] || SWIFT_MESSAGES['pacs.008'];

    el.innerHTML = `
      <div class="view-header">
        <div class="view-title-group">
          <h1><span>📜</span> SWIFT & ISO 20022 Message Inspector</h1>
          <div class="view-description">Deep syntax tree validation, XML envelope inspection, and field mapping for cross-border financial messages.</div>
        </div>
        <div class="view-actions">
          <select class="banking-select" id="selSwiftMsg">
            <option value="pacs.008" ${this.selectedSwiftMsg === 'pacs.008' ? 'selected' : ''}>pacs.008 (Customer Credit Transfer)</option>
            <option value="pacs.009" ${this.selectedSwiftMsg === 'pacs.009' ? 'selected' : ''}>pacs.009 (FI Cover Transfer)</option>
          </select>
          <button class="btn-action-primary" id="btnValidateXml">✓ Validate Schema</button>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 320px 1fr; gap: 16px;">
        <div class="banking-table-card" style="padding: 16px;">
          <h3 style="font-size: 13px; font-weight: 700; color: #ffffff; margin-bottom: 12px;">ISO 20022 Header Fields</h3>
          <div style="display: flex; flex-direction: column; gap: 10px; font-size: 11px;">
            <div><span style="color: var(--b-text-muted);">Message Definition:</span><br><strong>${msg.code}</strong></div>
            <div><span style="color: var(--b-text-muted);">Message ID:</span><br><span class="mono-hash">${msg.messageId}</span></div>
            <div><span style="color: var(--b-text-muted);">UETR:</span><br><span class="mono-hash">${msg.uetr}</span></div>
            <div><span style="color: var(--b-text-muted);">Settlement Amount:</span><br><strong style="font-size: 14px; color: #34d399;">${msg.currency} ${msg.amount.toLocaleString()}</strong></div>
            <div><span style="color: var(--b-text-muted);">Charge Bearer:</span><br><strong>${msg.chargeBearer || 'SHAR'}</strong></div>
            <div style="margin-top: 10px; padding: 10px; background: rgba(16, 185, 129, 0.1); border: 1px solid #10b981; border-radius: 6px; color: #34d399;">
              ✓ ISO 20022 Schema Validation: 100% Valid (CBPR+ Compliant)
            </div>
          </div>
        </div>

        <div class="banking-table-card" style="padding: 16px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
            <strong style="color: #ffffff;">Raw XML Payload (${msg.code})</strong>
            <button class="btn-action-secondary" id="btnCopyXml" style="font-size: 11px;">Copy XML</button>
          </div>
          <div class="xml-viewer-container">${this.escapeHtml(msg.xml)}</div>
        </div>
      </div>
    `;

    document.getElementById('selSwiftMsg')?.addEventListener('change', (e) => {
      this.selectedSwiftMsg = e.target.value;
      this.renderSwiftIsoInspectorView();
    });

    document.getElementById('btnValidateXml')?.addEventListener('click', () => {
      alert('ISO 20022 VALIDATION REPORT: Zero schema syntax errors. All mandatory fields (MsgId, UETR, Dbtr, Cdtr) present.');
    });

    document.getElementById('btnCopyXml')?.addEventListener('click', () => {
      navigator.clipboard?.writeText(msg.xml);
      alert('Copied ISO 20022 XML payload to clipboard.');
    });
  }

  // --- 5. AML & Fraud Investigation ---
  renderAmlFraudView() {
    const el = document.getElementById('bankingWorkspaceContent');
    el.innerHTML = `
      <div class="view-header">
        <div class="view-title-group">
          <h1><span>🛡️</span> AML & Fraud Sentinel — Dossier Investigation</h1>
          <div class="view-description">Automated velocity pattern detection, shell entity structuring alerts, and SAR generation.</div>
        </div>
        <div class="view-actions">
          <button class="btn-action-primary" id="btnCreateSar">Create FinCEN SAR Filing</button>
        </div>
      </div>

      <div class="banking-table-card">
        <div class="table-toolbar">
          <strong style="color: #ffffff;">Active Suspicious Activity Cases</strong>
          <span style="font-size: 11px; color: var(--b-text-secondary);">${AML_ALERTS.length} Alerts Pending Review</span>
        </div>
        <table class="banking-table">
          <thead>
            <tr>
              <th>Case ID</th>
              <th>Case Title & Trigger</th>
              <th>Subject Entity</th>
              <th>Amount</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Recommended Action</th>
            </tr>
          </thead>
          <tbody>
            ${AML_ALERTS.map(a => `
              <tr>
                <td><strong>${a.id}</strong></td>
                <td>
                  <strong>${a.caseTitle}</strong><br>
                  <span style="font-size: 11px; color: var(--b-text-secondary);">${a.triggerReason}</span>
                </td>
                <td>${a.subjectEntity}</td>
                <td><strong>${a.involvedAmount}</strong></td>
                <td><span class="status-pill flagged">${a.severity}</span></td>
                <td><span class="status-pill pending">${a.status}</span></td>
                <td style="color: #fbbf24; font-weight: 500;">${a.recommendedAction}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    document.getElementById('btnCreateSar')?.addEventListener('click', () => {
      alert('SIMULATED SAR ACTION: Suspicious Activity Report (SAR) XML package generated for FinCEN BSA filing.');
    });
  }

  // --- 6. Entity Resolution Graph ---
  renderEntityGraphView() {
    const el = document.getElementById('bankingWorkspaceContent');
    el.innerHTML = `
      <div class="view-header">
        <div class="view-title-group">
          <h1><span>🕸️</span> Corporate Entity Resolution Network Graph</h1>
          <div class="view-description">Multi-tier beneficial ownership clustering, shell company linkages, and circular fund-flow detection.</div>
        </div>
        <div class="view-actions">
          <button class="btn-action-secondary" id="btnHighlightHighRisk">Highlight High-Risk Corridors</button>
        </div>
      </div>

      <div class="graph-canvas-container" id="graphContainer">
        <svg width="100%" height="100%" viewBox="0 0 900 440" style="display: block;">
          <defs>
            <marker id="arrow" viewBox="0 -5 10 10" refX="28" refY="0" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0,-5L10,0L0,5" fill="#38bdf8" />
            </marker>
            <marker id="arrow-flagged" viewBox="0 -5 10 10" refX="28" refY="0" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0,-5L10,0L0,5" fill="#ef4444" />
            </marker>
          </defs>

          <!-- Links -->
          <line x1="450" y1="80" x2="450" y2="180" stroke="#f59e0b" stroke-width="3" marker-end="url(#arrow)" />
          <line x1="450" y1="180" x2="250" y2="280" stroke="#38bdf8" stroke-width="2" marker-end="url(#arrow)" />
          <line x1="450" y1="180" x2="650" y2="280" stroke="#ef4444" stroke-width="4" stroke-dasharray="5,5" marker-end="url(#arrow-flagged)" />
          <line x1="650" y1="280" x2="450" y2="380" stroke="#ef4444" stroke-width="3" marker-end="url(#arrow-flagged)" />
          <line x1="200" y1="180" x2="450" y2="180" stroke="#64748b" stroke-width="1.5" />

          <!-- Nodes -->
          <!-- UBO Node -->
          <g class="graph-node" transform="translate(450, 80)">
            <circle r="26" fill="#ef4444" stroke="#ffffff" stroke-width="2" />
            <text y="5" text-anchor="middle" fill="#ffffff" font-size="11" font-weight="bold">UBO</text>
            <text y="42" text-anchor="middle" fill="#f87171" font-size="11" font-weight="600">Elena Rostova (42%)</text>
          </g>

          <!-- Parent Holding -->
          <g class="graph-node" transform="translate(450, 180)">
            <circle r="30" fill="#0284c7" stroke="#38bdf8" stroke-width="2" />
            <text y="5" text-anchor="middle" fill="#ffffff" font-size="11" font-weight="bold">HOLDING</text>
            <text y="46" text-anchor="middle" fill="#ffffff" font-size="11" font-weight="600">Apex Global Holdings AG (CH)</text>
          </g>

          <!-- Subsidiary 1 -->
          <g class="graph-node" transform="translate(250, 280)">
            <circle r="24" fill="#1e293b" stroke="#38bdf8" stroke-width="2" />
            <text y="5" text-anchor="middle" fill="#ffffff" font-size="10">SUB (75%)</text>
            <text y="40" text-anchor="middle" fill="#cbd5e1" font-size="11">Veloce Trading B.V. (NL)</text>
          </g>

          <!-- Operating Entity (Critical AML) -->
          <g class="graph-node" transform="translate(650, 280)">
            <circle r="28" fill="#7f1d1d" stroke="#ef4444" stroke-width="2" />
            <text y="5" text-anchor="middle" fill="#f87171" font-size="10" font-weight="bold">ALERT</text>
            <text y="44" text-anchor="middle" fill="#f87171" font-size="11" font-weight="600">Caspian Petrochem FZE (AE)</text>
          </g>

          <!-- SPV -->
          <g class="graph-node" transform="translate(450, 380)">
            <circle r="22" fill="#1e293b" stroke="#f59e0b" stroke-width="2" />
            <text y="4" text-anchor="middle" fill="#ffffff" font-size="10">SPV</text>
            <text y="36" text-anchor="middle" fill="#cbd5e1" font-size="11">Helios Shipping Ltd (CY)</text>
          </g>
        </svg>
      </div>
    `;

    document.getElementById('btnHighlightHighRisk')?.addEventListener('click', () => {
      alert('Graph highlighted: Suspicious round-trip flow detected between Caspian Petrochem FZE and Helios Shipping Ltd.');
    });
  }

  // --- 7. Corporate Account 360 View ---
  renderCorporate360View() {
    const el = document.getElementById('bankingWorkspaceContent');
    el.innerHTML = `
      <div class="view-header">
        <div class="view-title-group">
          <h1><span>🏢</span> Corporate Account 360 — Institutional Client Dossiers</h1>
          <div class="view-description">Complete enterprise relationship view, aggregated credit lines, signatory authorities, and risk classifications.</div>
        </div>
      </div>

      <div class="metrics-grid">
        ${CORPORATE_ACCOUNTS.map(c => `
          <div class="metric-card" style="padding: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <strong style="font-size: 15px; color: #ffffff;">${c.name}</strong>
                <div style="font-size: 11px; color: var(--b-text-secondary); margin-top: 2px;">${c.domicile}</div>
              </div>
              <span class="status-pill ${c.riskRating.startsWith('A') ? 'optimal' : 'flagged'}">${c.riskRating}</span>
            </div>
            <div style="margin-top: 14px;">
              <span style="font-size: 11px; color: var(--b-text-muted);">Total Client Balance:</span>
              <div style="font-size: 20px; font-weight: 700; color: #ffffff;">${c.primaryCurrency} ${c.totalBalance.toLocaleString()}</div>
            </div>
            <div style="font-size: 11px; margin-top: 8px; color: var(--b-text-secondary);">
              <div>Credit Facility: <strong>${c.primaryCurrency} ${c.creditFacility.toLocaleString()}</strong></div>
              <div>Drawn: <strong>${c.primaryCurrency} ${c.drawnAmount.toLocaleString()}</strong></div>
              <div>Signatories: <strong>${c.activeSignatories} Authorized</strong></div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // --- 8. UBO Ownership Hierarchy View ---
  renderUboHierarchyView() {
    const el = document.getElementById('bankingWorkspaceContent');
    el.innerHTML = `
      <div class="view-header">
        <div class="view-title-group">
          <h1><span>🌳</span> Ultimate Beneficial Ownership (UBO) Hierarchy Tree</h1>
          <div class="view-description">Collapsible multi-jurisdictional control tree tracking natural persons exercising >25% statutory ownership.</div>
        </div>
      </div>

      <div class="banking-table-card" style="padding: 24px;">
        <div style="font-size: 13px; line-height: 2;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span>🏢</span> <strong>Apex Global Holdings AG (Switzerland)</strong> — Level 0 Ultimate Parent
          </div>
          <div style="margin-left: 28px; border-left: 2px solid var(--b-border); padding-left: 16px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span>👤</span> <strong>Elena Rostova</strong> — <span class="status-pill flagged">42.0% Equity (UBO)</span> [PEP Alert Match]
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span>🏦</span> <strong>Meridian Asset Trust (Jersey)</strong> — <span class="status-pill optimal">33.0% Non-Controlling Trust</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span>👥</span> <strong>Public Floating Shares (SIX Swiss Exchange)</strong> — <span class="status-pill optimal">25.0%</span>
            </div>
            <div style="margin-top: 12px; margin-left: 16px; border-left: 2px solid var(--b-border); padding-left: 16px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span>↳ 🏢</span> <strong>Veloce Trading B.V. (Netherlands)</strong> — <span class="status-pill optimal">75.0% Controlled Subsidiary</span>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span>↳ 🏢</span> <strong>Caspian Petrochem FZE (UAE)</strong> — <span class="status-pill flagged">100.0% Controlled (High-Risk Corridor)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // --- 9. Sanctions Screening View ---
  renderSanctionsView() {
    const el = document.getElementById('bankingWorkspaceContent');
    el.innerHTML = `
      <div class="view-header">
        <div class="view-title-group">
          <h1><span>⛔</span> Sanctions & Watchlist Screening (OFAC, EU, UN)</h1>
          <div class="view-description">Real-time phonetic and fuzzy string matching against global sanctioned individual and entity lists.</div>
        </div>
      </div>

      <div class="banking-table-card">
        <div class="table-toolbar">
          <strong style="color: #ffffff;">Active Watchlist Potential Hits</strong>
          <span style="font-size: 11px; color: var(--b-text-secondary);">${SANCTIONS_MATCHES.length} Hits Recorded</span>
        </div>
        <table class="banking-table">
          <thead>
            <tr>
              <th>Hit ID</th>
              <th>Target Name</th>
              <th>Matched List Entry</th>
              <th>Program</th>
              <th>Confidence</th>
              <th>Status</th>
              <th>Action Required</th>
            </tr>
          </thead>
          <tbody>
            ${SANCTIONS_MATCHES.map(s => `
              <tr>
                <td><strong>${s.id}</strong></td>
                <td style="font-weight: 700; color: #ffffff;">${s.targetName}</td>
                <td>${s.matchedEntry}</td>
                <td><span style="font-family: var(--b-font-mono); font-size: 11px;">${s.program}</span></td>
                <td><span style="font-weight: 700; color: #f87171;">${s.matchConfidence}%</span></td>
                <td><span class="status-pill flagged">${s.status}</span></td>
                <td><strong style="color: #fbbf24;">${s.actionRequired}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // --- 10. Regulatory Compliance View ---
  renderComplianceView() {
    const el = document.getElementById('bankingWorkspaceContent');
    el.innerHTML = `
      <div class="view-header">
        <div class="view-title-group">
          <h1><span>📋</span> Regulatory Compliance & Prudential Reporting</h1>
          <div class="view-description">Basel III liquidity ratios, capital adequacy metrics, and mandatory regulatory submission schedules.</div>
        </div>
      </div>

      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-label"><span>Liquidity Coverage Ratio (LCR)</span></div>
          <div class="metric-value" style="color: #34d399;">${REGULATORY_METRICS.lcr.value}%</div>
          <div class="metric-footer"><span class="metric-trend up">✓ Compliant</span> <span>Minimum: 100%</span></div>
        </div>
        <div class="metric-card">
          <div class="metric-label"><span>Net Stable Funding Ratio (NSFR)</span></div>
          <div class="metric-value" style="color: #34d399;">${REGULATORY_METRICS.nsfr.value}%</div>
          <div class="metric-footer"><span class="metric-trend up">✓ Compliant</span> <span>Minimum: 100%</span></div>
        </div>
        <div class="metric-card">
          <div class="metric-label"><span>Common Equity Tier 1 (CET1)</span></div>
          <div class="metric-value" style="color: #38bdf8;">${REGULATORY_METRICS.cet1.value}%</div>
          <div class="metric-footer"><span class="metric-trend up">✓ Well Capitalized</span></div>
        </div>
      </div>
    `;
  }

  // --- 11. Rule & Policy Engine View ---
  renderRuleEngineView() {
    const el = document.getElementById('bankingWorkspaceContent');
    el.innerHTML = `
      <div class="view-header">
        <div class="view-title-group">
          <h1><span>⚙️</span> Financial Rule & Policy Engine</h1>
          <div class="view-description">Declarative business rule definition for automated payment approvals, velocity triggers, and fraud prevention.</div>
        </div>
        <div class="view-actions">
          <button class="btn-action-primary" id="btnTestRule">▶ Run Test Simulation</button>
        </div>
      </div>

      <div class="banking-table-card">
        <div class="table-toolbar">
          <strong style="color: #ffffff;">Active Automated Safeguard Rules</strong>
          <span style="font-size: 11px; color: var(--b-text-secondary);">${RULE_ENGINE_RULES.length} Rules Enforced</span>
        </div>
        <table class="banking-table">
          <thead>
            <tr>
              <th>Rule ID</th>
              <th>Rule Name</th>
              <th>Category</th>
              <th>Predicate Condition</th>
              <th>Status</th>
              <th>Triggered Today</th>
            </tr>
          </thead>
          <tbody>
            ${RULE_ENGINE_RULES.map(r => `
              <tr>
                <td><strong>${r.id}</strong></td>
                <td style="font-weight: 600; color: #ffffff;">${r.name}</td>
                <td>${r.category}</td>
                <td><code style="font-family: var(--b-font-mono); color: #38bdf8; font-size: 11px;">${r.condition}</code></td>
                <td><span class="status-pill optimal">${r.status}</span></td>
                <td><strong>${r.triggeredCountToday} times</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    document.getElementById('btnTestRule')?.addEventListener('click', () => {
      alert('RULE TEST PASSED: Simulated $60M intraday payment triggered Rule RULE-01 (Dual Authorization Mandate).');
    });
  }

  // --- 12. Maker-Checker Approval Center ---
  renderMakerCheckerApprovalView() {
    const el = document.getElementById('bankingWorkspaceContent');
    el.innerHTML = `
      <div class="view-header">
        <div class="view-title-group">
          <h1><span>✍️</span> Maker-Checker Dual Authorization Center</h1>
          <div class="view-description">Mandatory four-eyes principle approval queue for high-value fund releases and compliance overrides.</div>
        </div>
      </div>

      <div class="banking-table-card">
        <div class="table-toolbar">
          <strong style="color: #ffffff;">Pending Second-Signer Approvals</strong>
          <span style="font-size: 11px; color: var(--b-text-secondary);" id="mcCountLabel">${this.makerCheckerQueue.length} Items Pending</span>
        </div>
        <table class="banking-table">
          <thead>
            <tr>
              <th>Workflow ID</th>
              <th>Action Type</th>
              <th>Amount / Beneficiary</th>
              <th>Originator (Maker)</th>
              <th>Timestamp</th>
              <th>Status</th>
              <th>Decision Actions</th>
            </tr>
          </thead>
          <tbody>
            ${this.makerCheckerQueue.map((item, idx) => `
              <tr id="rowMc_${item.id}">
                <td><strong>${item.id}</strong></td>
                <td><strong>${item.type}</strong><br><span style="font-size: 11px; color: var(--b-text-muted);">${item.details}</span></td>
                <td>
                  <strong style="color: #ffffff;">${item.amount}</strong><br>
                  <span style="font-size: 11px; color: var(--b-text-secondary);">${item.beneficiary}</span>
                </td>
                <td>${item.maker}</td>
                <td class="mono-hash">${item.makerTimestamp.replace('T', ' ').slice(0, 19)}</td>
                <td><span class="status-pill pending">${item.status}</span></td>
                <td>
                  <div style="display: flex; gap: 6px;">
                    <button class="btn-action-primary btn-mc-approve" style="padding: 3px 8px; font-size: 11px; background: #10b981; border-color: #34d399;" data-index="${idx}">Approve & Release</button>
                    <button class="btn-action-secondary btn-mc-reject" style="padding: 3px 8px; font-size: 11px; color: #f87171;" data-index="${idx}">Reject</button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    document.querySelectorAll('.btn-mc-approve').forEach(b => {
      b.addEventListener('click', () => {
        const idx = parseInt(b.dataset.index, 10);
        const item = this.makerCheckerQueue[idx];
        if (item) {
          alert(`DUAL SIGNATURE CONFIRMED: ${item.id} (${item.amount}) approved by Checker. Dispatched to clearing rail.`);
          this.makerCheckerQueue.splice(idx, 1);
          this.renderMakerCheckerApprovalView();
          const badge = document.getElementById('sidebarMcBadge');
          if (badge) badge.textContent = this.makerCheckerQueue.length;
        }
      });
    });

    document.querySelectorAll('.btn-mc-reject').forEach(b => {
      b.addEventListener('click', () => {
        const idx = parseInt(b.dataset.index, 10);
        const item = this.makerCheckerQueue[idx];
        if (item) {
          alert(`REJECTED: ${item.id} rejected. Originator notified.`);
          this.makerCheckerQueue.splice(idx, 1);
          this.renderMakerCheckerApprovalView();
        }
      });
    });
  }

  // --- 13. Payment Operations & Rails ---
  renderPaymentOperationsView() {
    const el = document.getElementById('bankingWorkspaceContent');
    el.innerHTML = `
      <div class="view-header">
        <div class="view-title-group">
          <h1><span>🏦</span> Payment Operations & Clearing Rail Router</h1>
          <div class="view-description">Routing engine connectivity, RTGS gateway management, and cut-off schedule tracker.</div>
        </div>
      </div>

      <div class="banking-table-card">
        <table class="banking-table">
          <thead>
            <tr>
              <th>Rail Name</th>
              <th>Network Status</th>
              <th>Latency</th>
              <th>Intraday Volume</th>
              <th>STP Rate</th>
              <th>Cut-off Time (UTC)</th>
            </tr>
          </thead>
          <tbody>
            ${PAYMENT_RAILS.map(r => `
              <tr>
                <td><strong>${r.name}</strong></td>
                <td><span class="status-pill settled">● ${r.status}</span></td>
                <td>${r.latencyMs} ms</td>
                <td style="font-weight: 700; color: #ffffff;">${r.todayVolume}</td>
                <td style="color: #34d399;">${r.stpRate}</td>
                <td>21:30 UTC</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // --- 14. Bulk Export Manager ---
  renderBulkExportView() {
    const el = document.getElementById('bankingWorkspaceContent');
    el.innerHTML = `
      <div class="view-header">
        <div class="view-title-group">
          <h1><span>📦</span> Bulk Export & Regulatory Report Generator</h1>
          <div class="view-description">Cryptographically verified statement and ledger exports (ISO 20022 CAMT.053, SWIFT MT940, CSV, Audit PDF).</div>
        </div>
      </div>

      <div class="metrics-grid">
        <div class="metric-card" style="padding: 20px;">
          <strong>ISO 20022 CAMT.053 XML</strong>
          <p style="font-size: 11px; color: var(--b-text-secondary); margin: 8px 0 14px 0;">End-of-day bank-to-customer electronic statement with full transactional metadata.</p>
          <button class="btn-action-primary btn-run-export" data-format="CAMT.053 XML">Download XML Package</button>
        </div>

        <div class="metric-card" style="padding: 20px;">
          <strong>SWIFT MT940 Customer Statement</strong>
          <p style="font-size: 11px; color: var(--b-text-secondary); margin: 8px 0 14px 0;">Legacy corporate treasury format with closing balance statements.</p>
          <button class="btn-action-primary btn-run-export" data-format="MT940">Download MT940</button>
        </div>

        <div class="metric-card" style="padding: 20px;">
          <strong>Consolidated Ledger CSV</strong>
          <p style="font-size: 11px; color: var(--b-text-secondary); margin: 8px 0 14px 0;">All settled payments, charges, Nostro transfers, and tax line items.</p>
          <button class="btn-action-primary btn-run-export" data-format="CSV Ledger">Download CSV</button>
        </div>
      </div>
    `;

    document.querySelectorAll('.btn-run-export').forEach(b => {
      b.addEventListener('click', () => {
        const fmt = b.dataset.format;
        alert(`SIMULATED EXPORT: Generated and downloaded ${fmt} package (SHA-256 Checksum: e81a...402).`);
      });
    });
  }

  // --- 15. Audit Trail View ---
  renderAuditTrailView() {
    const el = document.getElementById('bankingWorkspaceContent');
    el.innerHTML = `
      <div class="view-header">
        <div class="view-title-group">
          <h1><span>🔒</span> Immutable Cryptographic Audit Trail</h1>
          <div class="view-description">Non-repudiation event ledger with SHA-256 hash chains, system actor signatures, and temporal immutability.</div>
        </div>
      </div>

      <div class="banking-table-card">
        <div class="table-toolbar">
          <strong style="color: #ffffff;">Cryptographic Event Log</strong>
          <span style="font-size: 11px; color: #34d399;">✓ Chain Integrity Verified</span>
        </div>
        <table class="banking-table">
          <thead>
            <tr>
              <th>Timestamp (UTC)</th>
              <th>Actor</th>
              <th>Action Executed</th>
              <th>Target Object</th>
              <th>Cryptographic Signature (SHA-256)</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            ${AUDIT_TRAIL.map(a => `
              <tr>
                <td class="mono-hash">${a.timestamp}</td>
                <td><strong>${a.actor}</strong></td>
                <td><code style="color: var(--b-cyan);">${a.action}</code></td>
                <td>${a.target}</td>
                <td class="mono-hash" style="font-size: 10px;">${a.ipHash.slice(0, 24)}...</td>
                <td><span class="status-pill settled">${a.result}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // --- 16. Administration & Settings View ---
  renderAdminSettingsView() {
    const el = document.getElementById('bankingWorkspaceContent');
    el.innerHTML = `
      <div class="view-header">
        <div class="view-title-group">
          <h1><span>🛠️</span> Administration, RBAC & Clearing Gateways</h1>
          <div class="view-description">Enterprise role-based permissions, clearing rail API endpoints, and HSM encryption key management.</div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
        <div class="banking-table-card" style="padding: 20px;">
          <h3 style="font-size: 14px; font-weight: 700; color: #ffffff; margin-bottom: 12px;">RBAC Role Matrix</h3>
          <div style="display: flex; flex-direction: column; gap: 8px; font-size: 12px;">
            <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid var(--b-border-subtle);">
              <span>Treasury Maker (Analyst)</span> <span style="color: #38bdf8;">Create, Propose, Rebalance</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid var(--b-border-subtle);">
              <span>Treasury Checker (VP / Director)</span> <span style="color: #34d399;">Dual Authorize, Release Funds</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid var(--b-border-subtle);">
              <span>AML / Compliance Officer</span> <span style="color: #f87171;">Freeze Accounts, File SAR</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 6px 0;">
              <span>System Administrator</span> <span style="color: #a855f7;">Manage Rails, Key Rotation</span>
            </div>
          </div>
        </div>

        <div class="banking-table-card" style="padding: 20px;">
          <h3 style="font-size: 14px; font-weight: 700; color: #ffffff; margin-bottom: 12px;">Security & Encryption</h3>
          <div style="font-size: 12px; color: var(--b-text-secondary); line-height: 1.8;">
            <div>Hardware Security Module: <strong>Thales Luna HSM (FIPS 140-2 Level 3)</strong></div>
            <div>Active Signing Key: <code class="mono-hash">KEY-RSA4096-PROD-2026-Q4</code></div>
            <div>TLS Rail Encryption: <strong>mTLS 1.3 Strict Mutual Authentication</strong></div>
            <div style="margin-top: 10px;">
              <button class="btn-action-secondary" style="font-size: 11px;">Rotate Operational Keys</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // --- AI Copilot Engine ---
  toggleCopilot(forceState = null) {
    this.copilotOpen = forceState !== null ? forceState : !this.copilotOpen;
    const drawer = document.getElementById('bankingCopilotDrawer');
    if (drawer) {
      drawer.classList.toggle('open', this.copilotOpen);
    }
  }

  sendCopilotMessage() {
    const input = document.getElementById('copilotTextInput');
    if (!input || !input.value.trim()) return;

    const userText = input.value.trim();
    this.copilotChatHistory.push({ sender: 'user', text: userText });
    input.value = '';
    this.renderCopilotMessages();

    // AI Response Logic
    setTimeout(() => {
      let reply = '';
      const lower = userText.toLowerCase();

      if (lower.includes('tx-') || lower.includes('98126') || lower.includes('transaction')) {
        reply = '🚨 **Transaction Analysis (TX-2026-98126)**:\n' +
          '• **Amount**: $8,450,000.00 USD via SWIFT FIN\n' +
          '• **Debtor**: Caspian Petrochem FZE (UAE)\n' +
          '• **Creditor**: Veloce Logistics Limited (Cyprus)\n' +
          '• **Risk Score**: 88/100 (CRITICAL)\n' +
          '• **Trigger**: Immediate re-transfer pattern across shell subsidiaries with beneficial owner Elena Rostova (42%). Recommend immediate freeze & FinCEN SAR filing.';
      } else if (lower.includes('lcr') || lower.includes('liquidity') || lower.includes('buffer')) {
        reply = '💧 **Liquidity Assessment**:\n' +
          '• Current Basel III LCR is **142.8%** (42.8% surplus above the statutory 100% threshold).\n' +
          '• Net USD Nostro at JPMorgan NY stands at **$1,245,890,450.25** with a $50M intraday reserve.\n' +
          '• Warning: GBP Nostro at Barclays is approaching 84.5% facility utilization.';
      } else if (lower.includes('ubo') || lower.includes('caspian') || lower.includes('owner')) {
        reply = '🌳 **UBO Hierarchy Resolution**:\n' +
          '• Caspian Petrochem FZE is 100% owned by Apex Global Holdings AG (Switzerland).\n' +
          '• Ultimate Beneficial Owner is **Elena Rostova (42% controlling stake)**.\n' +
          '• Note: Elena Rostova has an active 94.2% phonetic match on OFAC SDN listing.';
      } else {
        reply = `I have cross-referenced the operational state across our 16 banking modules for "${userText}". All clearing rails are operational at 99.4% STP, and high-value approvals are queued in the Maker-Checker center.`;
      }

      this.copilotChatHistory.push({ sender: 'ai', text: reply });
      this.renderCopilotMessages();
    }, 600);
  }

  renderCopilotMessages() {
    const list = document.getElementById('copilotMessagesList');
    if (!list) return;

    list.innerHTML = this.copilotChatHistory.map(m => `
      <div class="copilot-msg ${m.sender}">
        ${m.sender === 'ai' ? '<div style="font-weight: 700; color: #a5b4fc; margin-bottom: 4px; font-size: 11px;">✨ AxiomCore Copilot</div>' : ''}
        ${m.text.replace(/\n/g, '<br>')}
      </div>
    `).join('');

    list.scrollTop = list.scrollHeight;
  }

  escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}

if (typeof window !== 'undefined') {
  window.BankingPlatformApp = BankingPlatformApp;
}
