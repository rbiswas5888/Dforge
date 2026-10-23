/**
 * DesignForge AI - MCP Hub UI Controller
 * Renders Overview, Servers, Tool Catalog, Resources, Prompts, Permissions,
 * Activity Logs, and Automated Workflows with rich interactive controls.
 */

import { TOOL_CATEGORIES, MCP_PERMISSIONS } from '../protocol/types.js';

export class McpHubController {
  constructor(app, clientManager, orchestrator, securityManager, auditLogger) {
    this.app = app;
    this.clientManager = clientManager;
    this.orchestrator = orchestrator;
    this.security = securityManager;
    this.audit = auditLogger;

    this.activeTab = 'overview';
    this.activeToolCategory = 'all';
    this.toolSearchQuery = '';
    this.logSearchQuery = '';

    this.initEventListeners();
    this.clientManager.subscribe(() => this.refreshActiveView());
    this.audit.subscribe(() => {
      if (this.activeTab === 'logs' || this.activeTab === 'overview') {
        this.refreshActiveView();
      }
    });
  }

  initEventListeners() {
    // Navigation Tabs inside MCP Hub Modal
    document.querySelectorAll('.mcp-nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.mcp-nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeTab = btn.dataset.section;
        this.renderSection(this.activeTab);
      });
    });

    // Close Modal Button
    document.getElementById('btnCloseMcpHub')?.addEventListener('click', () => {
      this.close();
    });

    // Add Server Button & Form
    document.getElementById('btnOpenAddServerModal')?.addEventListener('click', () => {
      const modal = document.getElementById('modalAddMcpServer');
      if (modal) modal.style.display = 'flex';
    });

    document.getElementById('btnCloseAddServerModal')?.addEventListener('click', () => {
      const modal = document.getElementById('modalAddMcpServer');
      if (modal) modal.style.display = 'none';
    });

    document.getElementById('formAddMcpServer')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleAddServerSubmit();
    });

    // Transport type switcher in Add Server modal
    const transportSelect = document.getElementById('addServerTransportType');
    if (transportSelect) {
      transportSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        document.getElementById('addServerHttpFields').style.display = val === 'http-stream' ? 'block' : 'none';
        document.getElementById('addServerStdioFields').style.display = val === 'stdio' ? 'block' : 'none';
      });
    }

    // Clear Logs Button
    document.getElementById('btnClearMcpLogs')?.addEventListener('click', () => {
      this.audit.clear();
      this.renderLogs();
    });

    // Refresh Resources Button
    document.getElementById('btnRefreshMcpResources')?.addEventListener('click', async () => {
      await this.clientManager.getAllResources();
      this.renderResources();
    });
  }

  open() {
    const hub = document.getElementById('modalMcpHub');
    if (hub) {
      hub.style.display = 'flex';
      this.renderSection(this.activeTab);
    }
  }

  close() {
    const hub = document.getElementById('modalMcpHub');
    if (hub) hub.style.display = 'none';
  }

  refreshActiveView() {
    const hub = document.getElementById('modalMcpHub');
    if (hub && hub.style.display !== 'none') {
      this.renderSection(this.activeTab);
    }
  }

  renderSection(section) {
    // Hide all view containers
    document.querySelectorAll('.mcp-view-pane').forEach(p => p.style.display = 'none');
    const pane = document.getElementById(`mcpPane_${section}`);
    if (pane) pane.style.display = 'block';

    switch (section) {
      case 'overview': this.renderOverview(); break;
      case 'servers': this.renderServers(); break;
      case 'tools': this.renderTools(); break;
      case 'resources': this.renderResources(); break;
      case 'prompts': this.renderPrompts(); break;
      case 'permissions': this.renderPermissions(); break;
      case 'logs': this.renderLogs(); break;
      case 'workflows': this.renderWorkflows(); break;
    }
  }

  // ==========================================
  // 3.1 OVERVIEW
  // ==========================================
  renderOverview() {
    const container = document.getElementById('mcpOverviewContent');
    if (!container) return;

    const servers = this.clientManager.getServerSummaries();
    const connectedCount = servers.filter(s => s.status === 'connected').length;
    const tools = Array.from(this.clientManager.toolRegistry.values());
    const enabledToolsCount = tools.filter(t => t.enabled).length;
    const recentLogs = this.audit.getEntries(50);
    const failedCount = recentLogs.filter(l => l.status === 'error' || l.status === 'denied').length;
    const pendingApprovals = this.security.getPendingApprovals();

    container.innerHTML = `
      <div class="mcp-kpi-grid">
        <div class="mcp-kpi-card">
          <div class="mcp-kpi-label">Configured Servers</div>
          <div class="mcp-kpi-value">${servers.length}</div>
          <div class="mcp-kpi-sub">${connectedCount} active & connected</div>
        </div>
        <div class="mcp-kpi-card">
          <div class="mcp-kpi-label">Available Tools</div>
          <div class="mcp-kpi-value">${tools.length}</div>
          <div class="mcp-kpi-sub">${enabledToolsCount} enabled for AI</div>
        </div>
        <div class="mcp-kpi-card">
          <div class="mcp-kpi-label">Recent Executions</div>
          <div class="mcp-kpi-value">${recentLogs.length}</div>
          <div class="mcp-kpi-sub" style="color: ${failedCount > 0 ? '#f43f5e' : '#10b981'};">${failedCount} failed / denied</div>
        </div>
        <div class="mcp-kpi-card">
          <div class="mcp-kpi-label">Pending Approvals</div>
          <div class="mcp-kpi-value" style="color: ${pendingApprovals.length > 0 ? '#f59e0b' : '#38bdf8'};">${pendingApprovals.length}</div>
          <div class="mcp-kpi-sub">${pendingApprovals.length > 0 ? 'Requires human review' : 'No blocked operations'}</div>
        </div>
      </div>

      <div style="margin-top: 24px;">
        <h4 style="font-size: 13px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 0.5px;">Connected MCP Servers</h4>
        <div class="mcp-servers-grid">
          ${servers.map(s => `
            <div class="mcp-server-mini-card">
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <span style="font-weight: 600; font-size: 13px; color: #f8fafc;">${s.name}</span>
                <span class="mcp-badge ${s.status === 'connected' ? 'badge-success' : 'badge-error'}">${s.status}</span>
              </div>
              <div style="font-size: 11px; color: #94a3b8; margin: 4px 0 10px 0;">${s.description}</div>
              <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; color: #64748b;">
                <span>Transport: ${s.transportType}</span>
                <span>${s.toolsCount} tools</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // ==========================================
  // 3.2 SERVERS
  // ==========================================
  renderServers() {
    const list = document.getElementById('mcpServersList');
    if (!list) return;

    const servers = this.clientManager.getServerSummaries();
    list.innerHTML = servers.map(s => {
      const isConnected = s.status === 'connected';
      return `
        <div class="mcp-card">
          <div style="display: flex; align-items: flex-start; justify-content: space-between;">
            <div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <h3 style="font-size: 15px; font-weight: 700; color: #f8fafc; margin: 0;">${s.name}</h3>
                <span class="mcp-badge ${isConnected ? 'badge-success' : 'badge-error'}">${s.status}</span>
                <span class="mcp-badge badge-neutral">${s.isLocal ? 'Local' : 'Remote'}</span>
              </div>
              <p style="font-size: 12px; color: #94a3b8; margin: 6px 0 10px 0;">${s.description}</p>
              <div style="display: flex; gap: 16px; font-size: 11px; color: #64748b;">
                <span><strong>Transport:</strong> ${s.transportType}</span>
                <span><strong>Endpoint:</strong> <code>${s.endpoint}</code></span>
                <span><strong>Tools:</strong> ${s.toolsCount}</span>
                ${s.lastConnected ? `<span><strong>Last Active:</strong> ${new Date(s.lastConnected).toLocaleTimeString()}</span>` : ''}
              </div>
            </div>
            <div style="display: flex; gap: 8px;">
              ${isConnected ? `
                <button class="mcp-btn-secondary btn-test-ping" data-id="${s.id}">⚡ Ping</button>
                <button class="mcp-btn-secondary btn-disconnect-server" data-id="${s.id}" style="color: #f43f5e;">Disconnect</button>
              ` : `
                <button class="mcp-btn-primary btn-reconnect-server" data-id="${s.id}">Connect</button>
                <button class="mcp-btn-secondary btn-remove-server" data-id="${s.id}" style="color: #f43f5e;">Remove</button>
              `}
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach actions
    list.querySelectorAll('.btn-test-ping').forEach(b => {
      b.onclick = async () => {
        const sEntry = this.clientManager.servers.get(b.dataset.id);
        if (sEntry && sEntry.client) {
          try {
            const res = await sEntry.client.ping();
            alert(`Ping response from ${sEntry.name}: OK (${res.latencyMs}ms)`);
          } catch (e) {
            alert(`Ping failed: ${e.message}`);
          }
        }
      };
    });

    list.querySelectorAll('.btn-disconnect-server').forEach(b => {
      b.onclick = async () => {
        await this.clientManager.disconnectServer(b.dataset.id);
        this.renderServers();
      };
    });

    list.querySelectorAll('.btn-remove-server').forEach(b => {
      b.onclick = async () => {
        if (confirm('Remove this MCP server configuration?')) {
          await this.clientManager.removeServer(b.dataset.id);
          this.renderServers();
        }
      };
    });
  }

  // ==========================================
  // 3.3 TOOL CATALOG
  // ==========================================
  async renderTools() {
    const container = document.getElementById('mcpToolsCatalogContent');
    if (!container) return;

    const allTools = await this.clientManager.getAllTools();
    const categories = ['all', ...Object.values(TOOL_CATEGORIES)];

    container.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; gap: 12px;">
        <input type="text" id="mcpToolSearchInput" class="mcp-search-input" placeholder="Search ${allTools.length} tools by name, description..." value="${this.toolSearchQuery}" />
        <select id="mcpCategoryFilter" class="mcp-select">
          ${categories.map(c => `<option value="${c}" ${this.activeToolCategory === c ? 'selected' : ''}>${c === 'all' ? 'All Categories' : c}</option>`).join('')}
        </select>
      </div>
      <div class="mcp-tools-list" id="mcpFilteredToolsList"></div>
    `;

    const searchInput = document.getElementById('mcpToolSearchInput');
    const catSelect = document.getElementById('mcpCategoryFilter');

    searchInput.oninput = (e) => {
      this.toolSearchQuery = e.target.value.toLowerCase().trim();
      this.renderFilteredToolsList(allTools);
    };

    catSelect.onchange = (e) => {
      this.activeToolCategory = e.target.value;
      this.renderFilteredToolsList(allTools);
    };

    this.renderFilteredToolsList(allTools);
  }

  renderFilteredToolsList(allTools) {
    const listEl = document.getElementById('mcpFilteredToolsList');
    if (!listEl) return;

    const filtered = allTools.filter(t => {
      const def = t.definition;
      const matchesCat = this.activeToolCategory === 'all' || def.category === this.activeToolCategory;
      const matchesSearch = !this.toolSearchQuery ||
        def.name.toLowerCase().includes(this.toolSearchQuery) ||
        def.description.toLowerCase().includes(this.toolSearchQuery);
      return matchesCat && matchesSearch;
    });

    if (filtered.length === 0) {
      listEl.innerHTML = `<div style="text-align: center; padding: 40px; color: #64748b;">No MCP tools matched your filter criteria.</div>`;
      return;
    }

    listEl.innerHTML = filtered.map(t => {
      const def = t.definition;
      const isWrite = def.name.startsWith('design_create') || def.name.startsWith('design_update') || def.name.startsWith('design_apply') || def.name.startsWith('fs_write');
      return `
        <div class="mcp-card">
          <div style="display: flex; align-items: flex-start; justify-content: space-between;">
            <div style="flex: 1;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <code style="font-size: 13px; font-weight: 700; color: #38bdf8;">${def.name}</code>
                <span class="mcp-badge badge-neutral">${def.category || 'General'}</span>
                <span class="mcp-badge ${isWrite ? 'badge-warning' : 'badge-neutral'}">${isWrite ? 'Write' : 'Read-only'}</span>
                ${def.requiresApproval ? '<span class="mcp-badge badge-warning">Approval Required</span>' : ''}
              </div>
              <p style="font-size: 12px; color: #94a3b8; margin: 6px 0 8px 0;">${def.description}</p>
              <div style="font-size: 11px; color: #64748b;">
                <strong>Server:</strong> ${t.serverName} • <strong>Scope:</strong> <code>${this.security.getRequiredScope(def.name)}</code>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
              <label class="mcp-switch" title="Toggle tool availability">
                <input type="checkbox" class="toggle-tool-enable" data-tool="${def.name}" ${t.enabled ? 'checked' : ''} />
                <span class="mcp-slider"></span>
              </label>
              <button class="mcp-btn-secondary btn-test-tool" data-tool="${def.name}">Execute</button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Wire toggle listeners
    listEl.querySelectorAll('.toggle-tool-enable').forEach(chk => {
      chk.onchange = (e) => {
        this.clientManager.setToolEnabled(e.target.dataset.tool, e.target.checked);
      };
    });

    // Wire execution test listeners
    listEl.querySelectorAll('.btn-test-tool').forEach(btn => {
      btn.onclick = async () => {
        const toolName = btn.dataset.tool;
        try {
          const res = await this.clientManager.invokeTool(toolName, {}, 'mcp-hub-test');
          alert(`Success invoking ${toolName}:\n\n${JSON.stringify(res, null, 2).slice(0, 500)}`);
          this.app.renderer.render();
          this.app.updateLayersTree();
        } catch (err) {
          alert(`Tool execution failed: ${err.message}`);
        }
      };
    });
  }

  // ==========================================
  // 3.4 RESOURCES
  // ==========================================
  async renderResources() {
    const list = document.getElementById('mcpResourcesList');
    if (!list) return;

    const resources = await this.clientManager.getAllResources();
    list.innerHTML = resources.map(r => `
      <div class="mcp-card">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 13px; font-weight: 600; color: #f8fafc;">${r.name}</span>
              <span class="mcp-badge badge-neutral">${r.mimeType || 'application/json'}</span>
            </div>
            <div style="font-size: 11px; color: #38bdf8; margin: 4px 0;"><code>${r.uri}</code></div>
            <div style="font-size: 11px; color: #64748b;">${r.description || 'No description'} • Server: ${r.serverName}</div>
          </div>
          <button class="mcp-btn-secondary btn-preview-resource" data-server="${r.serverId}" data-uri="${r.uri}">Inspect Preview ↗</button>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('.btn-preview-resource').forEach(btn => {
      btn.onclick = async () => {
        const server = this.clientManager.servers.get(btn.dataset.server);
        if (server && server.client) {
          try {
            const contents = await server.client.readResource(btn.dataset.uri, 'mcp-hub-inspect');
            const previewText = contents[0]?.text || '(Empty content)';
            alert(`Resource Preview [${btn.dataset.uri}]:\n\n${previewText.slice(0, 600)}`);
          } catch (e) {
            alert(`Failed reading resource: ${e.message}`);
          }
        }
      };
    });
  }

  // ==========================================
  // 3.5 PROMPTS
  // ==========================================
  async renderPrompts() {
    const list = document.getElementById('mcpPromptsList');
    if (!list) return;

    const prompts = await this.clientManager.getAllPrompts();
    list.innerHTML = prompts.map(p => `
      <div class="mcp-card">
        <div style="display: flex; align-items: flex-start; justify-content: space-between;">
          <div style="flex: 1;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <h4 style="font-size: 14px; font-weight: 700; color: #f8fafc; margin: 0;">${p.name}</h4>
              <span class="mcp-badge badge-neutral">Server: ${p.serverName}</span>
            </div>
            <p style="font-size: 12px; color: #94a3b8; margin: 6px 0 8px 0;">${p.description}</p>
            <div style="font-size: 11px; color: #64748b;">
              Arguments: ${(p.arguments || []).map(a => `<code>${a.name}${a.required ? '*' : ''}</code>`).join(', ') || 'None'}
            </div>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="mcp-btn-secondary btn-preview-prompt" data-server="${p.serverId}" data-name="${p.name}">Preview</button>
            <button class="mcp-btn-primary btn-use-in-ai" data-server="${p.serverId}" data-name="${p.name}">Use in AI Copilot →</button>
          </div>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('.btn-preview-prompt').forEach(b => {
      b.onclick = async () => {
        const s = this.clientManager.servers.get(b.dataset.server);
        if (s && s.client) {
          try {
            const res = await s.client.getPrompt(b.dataset.name, {});
            const msg = res.messages?.[0]?.content?.text || '';
            alert(`Prompt Preview [${b.dataset.name}]:\n\n${msg}`);
          } catch (e) {
            alert(`Error resolving prompt: ${e.message}`);
          }
        }
      };
    });

    list.querySelectorAll('.btn-use-in-ai').forEach(b => {
      b.onclick = async () => {
        const s = this.clientManager.servers.get(b.dataset.server);
        if (s && s.client) {
          try {
            const res = await s.client.getPrompt(b.dataset.name, {});
            const promptContent = res.messages?.[0]?.content?.text || '';
            const aiInput = document.getElementById('aiPromptInput');
            if (aiInput) {
              aiInput.value = promptContent;
            }
            this.close();
            this.app.switchToAiTab();
          } catch (e) {
            alert(`Error sending prompt to AI: ${e.message}`);
          }
        }
      };
    });
  }

  // ==========================================
  // 3.6 PERMISSIONS & APPROVALS
  // ==========================================
  renderPermissions() {
    const container = document.getElementById('mcpPermissionsContent');
    if (!container) return;

    const pending = this.security.getPendingApprovals();
    const servers = this.clientManager.getServerSummaries();

    container.innerHTML = `
      <div style="margin-bottom: 24px;">
        <h4 style="font-size: 13px; font-weight: 700; color: #f59e0b; text-transform: uppercase; margin-bottom: 12px;">
          Pending Human Approvals (${pending.length})
        </h4>
        ${pending.length === 0 ? `
          <div style="background: rgba(255,255,255,0.02); border: 1px dashed rgba(255,255,255,0.1); border-radius: 8px; padding: 20px; text-align: center; color: #64748b; font-size: 12px;">
            No pending human authorizations. Sensitive tool calls will appear here for explicit sign-off.
          </div>
        ` : pending.map(a => `
          <div class="mcp-card" style="border-left: 3px solid #f59e0b;">
            <div style="display: flex; align-items: flex-start; justify-content: space-between;">
              <div>
                <div style="font-size: 13px; font-weight: 700; color: #f8fafc;">${a.description}</div>
                <div style="font-size: 11px; color: #94a3b8; margin: 4px 0;">Tool: <code>${a.toolName}</code> • Scope: <code>${a.scope}</code></div>
                <div style="font-size: 11px; color: #64748b;">Requested at: ${new Date(a.timestamp).toLocaleTimeString()}</div>
              </div>
              <div style="display: flex; gap: 8px;">
                <button class="mcp-btn-secondary btn-deny-approval" data-id="${a.id}" style="color: #f43f5e;">Deny</button>
                <button class="mcp-btn-primary btn-grant-approval" data-id="${a.id}">Approve Operation</button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      <div>
        <h4 style="font-size: 13px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 12px;">
          Server Scope Grants & Allowlist
        </h4>
        ${servers.map(s => {
          const granted = this.security.getGrantedScopes(s.id);
          const allScopes = Object.values(MCP_PERMISSIONS);
          return `
            <div class="mcp-card">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                <span style="font-size: 13px; font-weight: 700; color: #f8fafc;">${s.name} (${s.id})</span>
                <span class="mcp-badge badge-neutral">${granted.length} scopes granted</span>
              </div>
              <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                ${allScopes.map(sc => {
                  const isGranted = granted.includes(sc);
                  return `
                    <label style="display: flex; align-items: center; gap: 6px; font-size: 11px; color: #cbd5e1; background: rgba(255,255,255,0.03); padding: 4px 8px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.06);">
                      <input type="checkbox" class="toggle-scope" data-server="${s.id}" data-scope="${sc}" ${isGranted ? 'checked' : ''} />
                      <code>${sc}</code>
                    </label>
                  `;
                }).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Approvals handling
    container.querySelectorAll('.btn-grant-approval').forEach(b => {
      b.onclick = () => {
        this.security.approveRequest(b.dataset.id);
        this.renderPermissions();
        this.renderOverview();
      };
    });

    container.querySelectorAll('.btn-deny-approval').forEach(b => {
      b.onclick = () => {
        this.security.rejectRequest(b.dataset.id);
        this.renderPermissions();
        this.renderOverview();
      };
    });

    // Scope toggle handling
    container.querySelectorAll('.toggle-scope').forEach(chk => {
      chk.onchange = (e) => {
        const { server, scope } = e.target.dataset;
        if (e.target.checked) {
          this.security.grantScope(server, scope);
        } else {
          this.security.revokeScope(server, scope);
        }
      };
    });
  }

  // ==========================================
  // 3.7 ACTIVITY & AUDIT LOGS
  // ==========================================
  renderLogs() {
    const list = document.getElementById('mcpAuditLogsList');
    if (!list) return;

    const entries = this.audit.getEntries(100, { toolName: this.logSearchQuery });

    list.innerHTML = `
      <div style="margin-bottom: 12px;">
        <input type="text" id="mcpLogSearchInput" class="mcp-search-input" placeholder="Search audit events by tool name..." value="${this.logSearchQuery}" />
      </div>
      <table class="mcp-table">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Server</th>
            <th>Tool / Resource</th>
            <th>Scope</th>
            <th>Status</th>
            <th>Duration</th>
          </tr>
        </thead>
        <tbody>
          ${entries.map(e => `
            <tr>
              <td style="color: #64748b;">${new Date(e.timestamp).toLocaleTimeString()}</td>
              <td style="font-weight: 500;">${e.serverId}</td>
              <td><code>${e.toolName}</code></td>
              <td><span class="mcp-badge badge-neutral">${e.scope}</span></td>
              <td>
                <span class="mcp-badge ${e.status === 'success' ? 'badge-success' : e.status === 'pending' ? 'badge-warning' : 'badge-error'}">
                  ${e.status}
                </span>
              </td>
              <td>${e.durationMs}ms</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    const search = document.getElementById('mcpLogSearchInput');
    if (search) {
      search.oninput = (e) => {
        this.logSearchQuery = e.target.value.trim();
        this.renderLogs();
      };
    }
  }

  // ==========================================
  // 3.8 AUTOMATED WORKFLOWS
  // ==========================================
  renderWorkflows() {
    const container = document.getElementById('mcpWorkflowsContent');
    if (!container) return;

    const workflows = this.orchestrator.getWorkflows();
    const history = this.orchestrator.executionHistory;

    container.innerHTML = `
      <div style="margin-bottom: 24px;">
        <h4 style="font-size: 13px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 12px;">
          Available Cross-Server Workflows
        </h4>
        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${workflows.map(wf => `
            <div class="mcp-card">
              <div style="display: flex; align-items: flex-start; justify-content: space-between;">
                <div>
                  <h4 style="font-size: 14px; font-weight: 700; color: #f8fafc; margin: 0;">${wf.name}</h4>
                  <p style="font-size: 12px; color: #94a3b8; margin: 6px 0 10px 0;">${wf.description}</p>
                  <div style="font-size: 11px; color: #38bdf8;">
                    <strong>Steps (${wf.steps.length}):</strong> ${wf.steps.map(s => s.name).join(' → ')}
                  </div>
                </div>
                <button class="mcp-btn-primary btn-run-workflow" data-id="${wf.id}">⚡ Run Workflow</button>
              </div>
              <div class="mcp-workflow-tracker" id="tracker_${wf.id}" style="display: none; margin-top: 14px; padding-top: 14px; border-top: 1px solid rgba(255,255,255,0.06);"></div>
            </div>
          `).join('')}
        </div>
      </div>

      <div>
        <h4 style="font-size: 13px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 12px;">
          Recent Execution Runs (${history.length})
        </h4>
        ${history.map(h => `
          <div class="mcp-card" style="padding: 10px 14px;">
            <div style="display: flex; align-items: center; justify-content: space-between; font-size: 12px;">
              <span style="font-weight: 600; color: #f8fafc;">${h.name}</span>
              <span class="mcp-badge ${h.status === 'completed' ? 'badge-success' : 'badge-error'}">${h.status}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    container.querySelectorAll('.btn-run-workflow').forEach(b => {
      b.onclick = async () => {
        const wfId = b.dataset.id;
        const tracker = document.getElementById(`tracker_${wfId}`);
        if (tracker) {
          tracker.style.display = 'block';
          tracker.innerHTML = `<div style="font-size: 12px; color: #38bdf8;">Starting workflow execution...</div>`;
        }

        try {
          const res = await this.orchestrator.executeWorkflow(wfId, {}, (prog) => {
            if (tracker) {
              tracker.innerHTML = `
                <div style="font-size: 12px; color: #e2e8f0; margin-bottom: 4px;">
                  Step ${prog.stepIndex + 1} of ${prog.totalSteps}: <strong>${prog.stepName}</strong> (${prog.tool})
                </div>
                <div style="font-size: 11px; color: ${prog.status === 'completed' ? '#10b981' : '#38bdf8'};">
                  Status: ${prog.status.toUpperCase()}
                </div>
              `;
            }
          });
          if (tracker) {
            tracker.innerHTML = `<div style="font-size: 12px; color: #10b981; font-weight: 600;">✓ Workflow Completed Successfully! All design nodes and React components generated.</div>`;
          }
          this.app.renderer.render();
          this.app.updateLayersTree();
          this.app.updateInspector();
          this.renderWorkflows();
        } catch (err) {
          if (tracker) {
            tracker.innerHTML = `<div style="font-size: 12px; color: #f43f5e; font-weight: 600;">✕ Execution Failed: ${err.message}</div>`;
          }
        }
      };
    });
  }

  async handleAddServerSubmit() {
    const name = document.getElementById('addServerName')?.value.trim();
    const type = document.getElementById('addServerTransportType')?.value;
    if (!name) return;

    try {
      if (type === 'http-stream') {
        const endpoint = document.getElementById('addServerEndpoint')?.value.trim();
        await this.clientManager.registerRemoteServer({ name, endpoint });
      } else if (type === 'stdio') {
        const command = document.getElementById('addServerCommand')?.value.trim();
        await this.clientManager.registerStdioServer({ name, command });
      }
      document.getElementById('modalAddMcpServer').style.display = 'none';
      this.renderServers();
      this.renderOverview();
      alert(`MCP Server '${name}' registered and connected successfully!`);
    } catch (err) {
      alert(`Failed connecting MCP server: ${err.message}`);
    }
  }
}
