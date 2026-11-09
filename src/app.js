/**
 * DesignForge AI - Main Application Controller
 * Orchestrates Document, Commands, Renderer, Inspector, AI Assistant,
 * Markdown Parser, Prototype Simulator & Deterministic React Compiler.
 */

import {
  createInitialDocument,
  createNode,
  addPageToDoc,
  duplicatePageInDoc,
  deletePageFromDoc,
  renamePageInDoc,
  addCommentToDoc,
  resolveCommentInDoc
} from './engine/document.js';
import { CommandEngine } from './engine/commands.js';
import { CanvasRenderer } from './engine/renderer.js';
import { ShortcutRegistry } from './engine/shortcuts.js';
import { AIEngine } from './engine/ai.js';
import { ReactCompiler } from './engine/compiler.js';
import { PrototypeEngine } from './engine/prototype.js';
import { StorageEngine } from './engine/storage.js';
import { computeWorldBounds, findSnapGuides } from './engine/layout.js';
import { buildSvgExport, createStoredZip } from './engine/exporters.js';
import { DesignSystemLinter } from './engine/linter.js';
import { InspectCodeGenerator } from './engine/inspect_generator.js';
import { CommandPaletteEngine } from './engine/palette.js';
import {
  LearningManager,
  ONBOARDING_TOUR_STEPS,
  PRACTICE_EXERCISES,
  YOUTUBE_TUTORIALS,
  OFFICIAL_DOCS
} from './engine/learning.js';
import {
  McpClientManager,
  DesignMcpServer,
  FileSystemMcpServer,
  DocumentationMcpServer,
  GitHandoffMcpServer,
  McpWorkflowOrchestrator,
  McpHubController,
  globalSecurityManager,
  globalAuditLogger
} from './mcp/index.js';
import { ImportManager, fetchFigmaFile } from './engine/importer/index.js';
import {
  DesignSystemRegistry,
  AITokenWizard,
  ResponsiveTokenEngine,
  ComponentVariableExtractor,
  ComponentVariableManager,
  ReactDesignSystemImporter,
  DesignSystemUIController,
  insertMuiComponentToCanvas,
  addMuiComponentToRegistry,
  MUI_COMPONENT_CATALOG
} from './engine/design_system/index.js';
import { generateQRCodeSVG } from './editor-core/qr-code.js';
import { ColorPickerPopover } from './editor-core/color-picker.js';
import { collectDocumentColors } from './editor-core/document-colors.js';
import { buildSelectionColorUpdates, collectSelectionColors } from './editor-core/selection-colors.js';
import { WorkspaceStore } from './engine/workspace_store.js';
import { AuthService, DEMO_ACCOUNTS } from './engine/auth_service.js';
import { mountLucideIcons } from './ui/lucide-icons.js';
import { FontManager, defaultFontManager } from './editor-core/font-manager.js';

export class DesignForgeApp {
  constructor() {
    this.storage = new StorageEngine();
    const savedDoc = this.storage.loadAutosave();
    this.doc = savedDoc || createInitialDocument('Untitled Experience');
    this.workspaceStore = new WorkspaceStore();
    this.auth = new AuthService(this.workspaceStore);
    this.storage.setWorkspaceStore(this.workspaceStore);
    try {
      this.workspaceStore.ensureActiveProject(this.doc);
      if (!this.workspaceStore.getActiveProfile()) {
        this.workspaceStore.saveProfile({ name: 'DesignForge Designer', role: 'Product Designer' });
      }
    } catch (error) {
      this.workspaceInitializationError = error;
      console.warn('Workspace initialization warning:', error);
    }

    this.engine = new CommandEngine(this.doc);
    this.importer = new ImportManager(this);
    this.mcpSecurity = globalSecurityManager;
    this.mcpAudit = globalAuditLogger;
    this.mcpClientManager = new McpClientManager({ security: this.mcpSecurity, audit: this.mcpAudit });
    this.mcpOrchestrator = new McpWorkflowOrchestrator(this.mcpClientManager);
    this.ai = new AIEngine(this.engine, this.mcpClientManager);
    this.prototype = new PrototypeEngine(this.doc);
    this.linter = new DesignSystemLinter(this.engine);
    this.inspectGen = new InspectCodeGenerator(this.doc);
    this.palette = new CommandPaletteEngine(this);
    this.learning = new LearningManager();
    this.mcpHub = new McpHubController(this, this.mcpClientManager, this.mcpOrchestrator, this.mcpSecurity, this.mcpAudit);

    // Unified Design System Subsystem (Master Prompt Section 2-18)
    this.dsRegistry = new DesignSystemRegistry(this.doc, this.storage);
    this.aiTokenWizard = new AITokenWizard(this.dsRegistry);
    this.responsiveTokenEngine = new ResponsiveTokenEngine(this.dsRegistry);
    this.compVarExtractor = new ComponentVariableExtractor(this.dsRegistry, this.engine);
    this.compVarManager = new ComponentVariableManager(this.dsRegistry, this.engine);
    this.reactDsImporter = new ReactDesignSystemImporter(this.dsRegistry);
    this.dsUi = new DesignSystemUIController(this);
    this.fontManager = defaultFontManager;
    this.ai.setRegistry(this.dsRegistry);
    if (typeof window !== 'undefined') {
      window.designForgeApp = this;
    }

    // In-Editor Multi-Document Tabs (Part 2: §5, §8, §9)
    const initialDocId = this.doc.id || 'doc_' + Date.now();
    this.openDocumentTabs = [{
      id: initialDocId,
      name: this.doc.name || 'Untitled Document',
      doc: this.doc,
      engine: this.engine,
      zoom: 1,
      pan: { x: 0, y: 0 },
      isDirty: false
    }];
    this.activeDocumentTabId = initialDocId;
    this.pendingTabCloseId = null;

    // Active tool state
    this.currentTool = 'select'; // 'select' | 'hand' | 'frame' | 'rectangle' | 'ellipse' | 'line' | 'text' | 'comment' | 'scale' | 'pen' | 'section' | 'slice'
    this.isHandMode = false;
    this.isDevMode = false;
    this.isVectorEditMode = false;
    this.uiHidden = false;

    // Interaction states & Inspector modes
    this.rightTabMode = 'design'; // 'design' | 'prototype' | 'inspect' | 'export' | 'ai'
    this.inspectLang = 'css';
    this.aspectRatioLocked = false;
    this.showIndependentRadius = false;
    this.showIndependentPadding = false;
    this.dragState = null;
    this.pendingAiPlan = null;
    this.aiInputMode = 'prompt'; // 'prompt' | 'markdown'
    this.layerSearchQuery = '';
    this.collapsedNodeIds = new Set();
    this.lastSelectedLayerId = null;
    this.editingLayerId = null;
    this.draggedLayerId = null;
    this.showRulers = true;
    this.showGrid = true;

    // DOM references
    this.canvas = document.getElementById('canvas2d');
    this.renderer = new CanvasRenderer(this.canvas, this.engine);
    this.colorPicker = new ColorPickerPopover();
    this.shortcuts = new ShortcutRegistry(this);

    mountLucideIcons(document.body);
    this.initUI();
    this.initWorkspaceExperience();
    this.initDocumentTabs();
    this.initMenus();
    this.initRightSidebar();
    this.initCommandPalette();
    this.initLinterModal();
    this.initImportModal();
    this.initBulkRenameModal();
    this.initBreakpointBar();
    this.initAssetsAndPages();
    this.bindCanvasEvents();
    this.bindEngineEvents();
    this.initMcpServers();

    // Initial render
    this.updateLayersTree();
    this.updatePagesList();
    this.updateInspector();
    this.updateAiContext();
    this.renderer.render();

    if (this.workspaceInitializationError) {
      this.showToast(`Workspace setup could not be saved locally: ${this.workspaceInitializationError.message}`, 'error');
    }
    console.log('DesignForge AI initialized successfully.');
  }

  initWorkspaceExperience() {
    const showProjects = () => this.showWorkspaceView('projects');
    const showAccount = () => this.openWorkspaceSettings('account');
    document.getElementById('brandLogoBtn')?.addEventListener('click', showProjects);
    document.getElementById('brandLogoBtn')?.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        showProjects();
      }
    });
    document.getElementById('btnWorkspaceDashboard')?.addEventListener('click', showProjects);
    document.getElementById('workspaceDashboardHome')?.addEventListener('click', showProjects);
    document.getElementById('settingsDashboardHome')?.addEventListener('click', showProjects);
    document.getElementById('btnOpenWorkspaceSettings')?.addEventListener('click', showAccount);
    document.getElementById('workspaceSettingsButton')?.addEventListener('click', showAccount);
    document.getElementById('workspaceRailSettings')?.addEventListener('click', showAccount);
    document.getElementById('settingsBackToProjects')?.addEventListener('click', () => {
      this.showWorkspaceView(this.workspaceReturnView || 'projects');
    });
    document.getElementById('workspaceRailOrganization')?.addEventListener('click', () => this.openWorkspaceSettings('organization'));
    for (const id of ['btnWorkspaceProfile', 'workspaceProfileButton', 'settingsProfileButton']) {
      document.getElementById(id)?.addEventListener('click', showAccount);
    }

    document.getElementById('workspaceNewProject')?.addEventListener('click', () => this.openNewProjectDialog());
    document.getElementById('workspaceEmptyCreate')?.addEventListener('click', () => this.openNewProjectDialog());
    document.getElementById('workspaceNewProjectClose')?.addEventListener('click', () => this.closeNewProjectDialog());
    document.getElementById('workspaceNewProjectCancel')?.addEventListener('click', () => this.closeNewProjectDialog());
    document.getElementById('workspaceNewProjectModal')?.addEventListener('click', event => {
      if (event.target.id === 'workspaceNewProjectModal') this.closeNewProjectDialog();
    });
    document.getElementById('workspaceNewProjectForm')?.addEventListener('submit', event => {
      event.preventDefault();
      const name = document.getElementById('workspaceNewProjectName')?.value.trim();
      const desc = document.getElementById('workspaceNewProjectDesc')?.value.trim() || '';
      if (!name) return;
      try {
        this.createWorkspaceProject(name, desc);
      } catch (error) {
        this.showToast(`Could not create project: ${error.message}`, 'error');
      }
    });

    // Project cards interaction
    document.getElementById('workspaceProjectGrid')?.addEventListener('click', event => {
      const settingsButton = event.target.closest('[data-open-project-settings]');
      if (settingsButton) {
        event.stopPropagation();
        this.openProjectSettings(settingsButton.dataset.openProjectSettings);
        return;
      }
      const projectButton = event.target.closest('[data-open-project]');
      if (!projectButton) return;
      try {
        const projId = projectButton.dataset.openProject;
        this.openProjectDetail(projId);
        if (event.ctrlKey || event.metaKey) {
          this.openWorkspaceProject(projectButton.dataset.openProject);
        }
      } catch (error) {
        this.showToast(`Could not open project: ${error.message}`, 'error');
      }
    });

    // Topbar project breadcrumb & quick file switcher
    document.getElementById('btnTopbarProjectCrumb')?.addEventListener('click', () => {
      const activeId = this.workspaceStore.getActiveProjectId();
      if (activeId) {
        this.selectedProjectId = activeId;
        this.showWorkspaceView('projects');
        this.showWorkspaceSubView('project-detail');
      } else {
        this.showWorkspaceView('projects');
      }
    });
    document.getElementById('btnQuickFileSwitcher')?.addEventListener('click', () => this.openQuickFileSwitcher());
    window.addEventListener('keydown', e => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'p' && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        this.openQuickFileSwitcher();
      }
    });

    // Breadcrumb navigation
    document.getElementById('breadcrumbBackToProjects')?.addEventListener('click', () => this.showWorkspaceSubView('projects'));
    document.getElementById('breadcrumbSettingsToProjects')?.addEventListener('click', () => this.showWorkspaceSubView('projects'));
    document.getElementById('breadcrumbSettingsToProjectName')?.addEventListener('click', () => this.openProjectDetail(this.selectedProjectId));
    document.getElementById('btnBackToProjectFromSettings')?.addEventListener('click', () => this.openProjectDetail(this.selectedProjectId));

    // Project Detail Actions
    document.getElementById('btnOpenProjectSettings')?.addEventListener('click', () => this.openProjectSettings(this.selectedProjectId));
    document.getElementById('btnProjectNewFile')?.addEventListener('click', () => this.openNewFileDialog());
    document.getElementById('btnProjectEmptyCreateFile')?.addEventListener('click', () => this.openNewFileDialog());
    document.getElementById('workspaceFileSearch')?.addEventListener('input', () => this.renderProjectDetail(this.selectedProjectId));
    document.getElementById('workspaceFileSort')?.addEventListener('change', () => this.renderProjectDetail(this.selectedProjectId));

    // Design Files Grid click (open file, delete file)
    document.getElementById('workspaceFileGrid')?.addEventListener('click', event => {
      const delBtn = event.target.closest('[data-delete-file]');
      if (delBtn) {
        event.stopPropagation();
        this.deleteWorkspaceFile(delBtn.dataset.deleteFile);
        return;
      }
      const fileBtn = event.target.closest('[data-open-file]');
      if (fileBtn) {
        try {
          this.openWorkspaceFile(fileBtn.dataset.openFile);
        } catch (err) {
          this.showToast(`Could not open file: ${err.message}`, 'error');
        }
      }
    });

    // New File Modal
    document.getElementById('workspaceNewFileClose')?.addEventListener('click', () => this.closeNewFileDialog());
    document.getElementById('workspaceNewFileCancel')?.addEventListener('click', () => this.closeNewFileDialog());
    document.getElementById('workspaceNewFileModal')?.addEventListener('click', event => {
      if (event.target.id === 'workspaceNewFileModal') this.closeNewFileDialog();
    });
    document.getElementById('workspaceNewFileForm')?.addEventListener('submit', event => {
      event.preventDefault();
      const fileName = document.getElementById('workspaceNewFileName')?.value.trim();
      if (!fileName) return;
      try {
        this.createWorkspaceFile(this.selectedProjectId, fileName);
      } catch (err) {
        this.showToast(`Could not create file: ${err.message}`, 'error');
      }
    });

    // Quick File Switcher Modal
    document.getElementById('workspaceFileSwitcherClose')?.addEventListener('click', () => this.closeQuickFileSwitcher());
    document.getElementById('workspaceFileSwitcherModal')?.addEventListener('click', event => {
      if (event.target.id === 'workspaceFileSwitcherModal') this.closeQuickFileSwitcher();
    });
    document.getElementById('quickFileSwitcherInput')?.addEventListener('input', event => {
      this.renderQuickFileSwitcherList(event.target.value);
    });
    document.getElementById('quickFileSwitcherList')?.addEventListener('click', event => {
      const switchBtn = event.target.closest('[data-switch-file]');
      if (switchBtn) {
        this.openWorkspaceFile(switchBtn.dataset.switchFile);
        this.closeQuickFileSwitcher();
      }
    });

    // Project Settings Navigation & Actions
    document.querySelectorAll('[data-proj-settings-tab]').forEach(tabBtn => {
      tabBtn.addEventListener('click', () => {
        document.querySelectorAll('[data-proj-settings-tab]').forEach(b => b.classList.toggle('active', b === tabBtn));
        const tab = tabBtn.dataset.projSettingsTab;
        const generalTab = document.getElementById('projectSettingsTabGeneral');
        const membersTab = document.getElementById('projectSettingsTabMembers');
        if (generalTab) generalTab.hidden = tab !== 'general';
        if (membersTab) membersTab.hidden = tab !== 'members';
      });
    });
    document.getElementById('formProjectGeneralSettings')?.addEventListener('submit', event => {
      event.preventDefault();
      this.handleSaveProjectGeneral();
    });
    document.getElementById('btnDeleteProject')?.addEventListener('click', () => this.handleDeleteProject());
    document.getElementById('btnAddProjectMember')?.addEventListener('click', () => this.handleAddProjectMember());
    document.getElementById('projectMembersTableBody')?.addEventListener('change', event => {
      const roleSelect = event.target.closest('.project-member-role-select');
      if (roleSelect) {
        this.handleProjectMemberRoleChange(roleSelect.dataset.memberUserId, roleSelect.value);
      }
    });
    document.getElementById('projectMembersTableBody')?.addEventListener('click', event => {
      const removeBtn = event.target.closest('[data-remove-member]');
      if (removeBtn) {
        this.handleRemoveProjectMember(removeBtn.dataset.removeMember);
      }
    });

    // Recently Opened grid click
    document.getElementById('workspaceRecentFilesGrid')?.addEventListener('click', event => {
      const fileBtn = event.target.closest('[data-open-file]');
      if (fileBtn) {
        try {
          this.openWorkspaceFile(fileBtn.dataset.openFile);
        } catch (err) {
          this.showToast(`Could not open file: ${err.message}`, 'error');
        }
      }
    });

    document.getElementById('workspaceProjectSearch')?.addEventListener('input', () => this.renderWorkspaceDashboard());
    document.getElementById('workspaceProjectSort')?.addEventListener('change', () => this.renderWorkspaceDashboard());
    document.querySelectorAll('[data-project-filter]').forEach(button => {
      button.addEventListener('click', () => {
        document.querySelectorAll('[data-project-filter]').forEach(item => item.classList.toggle('active', item === button));
        this.workspaceProjectFilter = button.dataset.projectFilter;
        if (this.workspaceProjectFilter === 'recent') {
          this.showWorkspaceSubView('recent-files');
        } else {
          this.showWorkspaceSubView('projects');
        }
      });
    });

    document.querySelector('.settings-nav')?.addEventListener('click', event => {
      const button = event.target.closest('[data-settings-tab]');
      if (button) this.renderWorkspaceSettings(button.dataset.settingsTab);
    });
    const settingsContent = document.getElementById('settingsContent');
    settingsContent?.addEventListener('submit', event => this.handleWorkspaceSettingsSubmit(event));
    settingsContent?.addEventListener('click', event => this.handleWorkspaceSettingsClick(event));
    settingsContent?.addEventListener('change', event => this.handleWorkspaceSettingsChange(event));
    settingsContent?.addEventListener('input', event => {
      if (event.target.id === 'providerModelSelect') this.setSettingsStatus('Model selection is not saved until you click Save AI settings.', 'info');
    });
    this.workspaceProjectFilter = 'all';
    this.selectedProjectId = this.workspaceStore.getActiveProjectId();
    this.updateTopbarProjectCrumb();

    // Persist active view on window unload so re-opening respects previous session
    window.addEventListener('beforeunload', () => {
      try {
        const viewToSave = this.workspaceShellView === 'editor' ? 'editor' : 'workspace';
        this.workspaceStore.setLastActiveView(viewToSave);
      } catch {
        // ignore
      }
    });

    // Initialize responsive authentication experience
    this.initAuthExperience();

    // Landing navigation rule:
    // If not authenticated, always show Login.
    // If authenticated, user always lands on workspace unless they closed the app while design file was open.
    if (!this.auth.isAuthenticated()) {
      this.showAuthView();
    } else {
      const lastActiveView = this.workspaceStore.getLastActiveView();
      if (lastActiveView === 'editor') {
        this.showWorkspaceView('editor');
      } else {
        this.showWorkspaceView('projects');
      }
    }
  }

  workspaceEscape(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[character]);
  }

  showAuthView() {
    this.workspaceShellView = 'auth';
    const authScreen = document.getElementById('authScreen');
    const wsDashboard = document.getElementById('workspaceDashboard');
    const wsSettings = document.getElementById('workspaceSettings');
    if (authScreen) authScreen.hidden = false;
    if (wsDashboard) wsDashboard.hidden = true;
    if (wsSettings) wsSettings.hidden = true;
    mountLucideIcons(authScreen || document.body);
  }

  initAuthExperience() {
    // Quick demo account fills
    document.getElementById('btnFillDemoLead')?.addEventListener('click', () => {
      const emailInput = document.getElementById('authEmailInput');
      const passInput = document.getElementById('authPasswordInput');
      if (emailInput) {
        emailInput.value = 'designer@designforge.ai';
        emailInput.classList.remove('has-error');
      }
      if (passInput) {
        passInput.value = 'DesignForge2026!';
        passInput.classList.remove('has-error');
      }
      this.clearAuthErrors();
    });

    document.getElementById('btnFillDemoAlex')?.addEventListener('click', () => {
      const emailInput = document.getElementById('authEmailInput');
      const passInput = document.getElementById('authPasswordInput');
      if (emailInput) {
        emailInput.value = 'alex@designforge.ai';
        emailInput.classList.remove('has-error');
      }
      if (passInput) {
        passInput.value = 'DesignForge2026!';
        passInput.classList.remove('has-error');
      }
      this.clearAuthErrors();
    });

    // Password visibility toggle
    document.getElementById('btnToggleAuthPassword')?.addEventListener('click', () => {
      const passInput = document.getElementById('authPasswordInput');
      const icon = document.getElementById('passwordEyeIcon');
      if (!passInput) return;
      const isPassword = passInput.type === 'password';
      passInput.type = isPassword ? 'text' : 'password';
      if (icon) {
        icon.setAttribute('data-icon', isPassword ? 'EyeOff' : 'Eye');
        mountLucideIcons(icon.parentElement);
      }
      const btn = document.getElementById('btnToggleAuthPassword');
      if (btn) btn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
    });

    // Form submit
    document.getElementById('authLoginForm')?.addEventListener('submit', async event => {
      event.preventDefault();
      await this.handleLoginSubmit();
    });

    // SSO buttons
    document.getElementById('btnSsoGoogle')?.addEventListener('click', () => this.handleSsoLogin('google'));
    document.getElementById('btnSsoGithub')?.addEventListener('click', () => this.handleSsoLogin('github'));
    document.getElementById('btnSsoSaml')?.addEventListener('click', () => this.handleSsoLogin('saml'));

    // Forgot password modal
    document.getElementById('btnOpenForgotPassword')?.addEventListener('click', () => {
      const modal = document.getElementById('authForgotModal');
      const emailInput = document.getElementById('authForgotEmail');
      const status = document.getElementById('authForgotStatus');
      const errorMsg = document.getElementById('authForgotEmailError');
      if (modal) modal.style.display = 'flex';
      if (emailInput) {
        emailInput.value = document.getElementById('authEmailInput')?.value || '';
        emailInput.focus();
      }
      if (status) status.style.display = 'none';
      if (errorMsg) errorMsg.textContent = '';
    });

    document.getElementById('btnCloseForgotModal')?.addEventListener('click', () => {
      const modal = document.getElementById('authForgotModal');
      if (modal) modal.style.display = 'none';
    });

    document.getElementById('authForgotForm')?.addEventListener('submit', async event => {
      event.preventDefault();
      const email = document.getElementById('authForgotEmail')?.value.trim();
      const status = document.getElementById('authForgotStatus');
      const errorMsg = document.getElementById('authForgotEmailError');
      if (!email) {
        if (errorMsg) errorMsg.textContent = 'Please enter your email.';
        return;
      }
      try {
        const res = await this.auth.requestPasswordReset(email);
        if (status) {
          status.className = 'auth-status-alert success';
          status.textContent = res.message;
          status.style.display = 'flex';
        }
        if (errorMsg) errorMsg.textContent = '';
      } catch (err) {
        if (errorMsg) errorMsg.textContent = err.message;
      }
    });

    // Sign out buttons
    document.getElementById('workspaceRailSignOut')?.addEventListener('click', () => this.handleSignOut());
    document.getElementById('btnSettingsSignOut')?.addEventListener('click', () => this.handleSignOut());
  }

  clearAuthErrors() {
    const emailErr = document.getElementById('authEmailError');
    const passErr = document.getElementById('authPasswordError');
    const statusAlert = document.getElementById('authStatusAlert');
    const emailInput = document.getElementById('authEmailInput');
    const passInput = document.getElementById('authPasswordInput');
    if (emailErr) emailErr.textContent = '';
    if (passErr) passErr.textContent = '';
    if (statusAlert) statusAlert.style.display = 'none';
    if (emailInput) emailInput.classList.remove('has-error');
    if (passInput) passInput.classList.remove('has-error');
  }

  async handleLoginSubmit() {
    this.clearAuthErrors();
    const emailInput = document.getElementById('authEmailInput');
    const passInput = document.getElementById('authPasswordInput');
    const rememberMeInput = document.getElementById('authRememberMe');
    const statusAlert = document.getElementById('authStatusAlert');
    const submitBtn = document.getElementById('btnSubmitAuthLogin');
    const submitText = document.getElementById('authSubmitText');

    const email = emailInput?.value.trim() || '';
    const password = passInput?.value || '';
    const rememberMe = Boolean(rememberMeInput?.checked);

    let hasError = false;
    if (!email) {
      const emailErr = document.getElementById('authEmailError');
      if (emailErr) emailErr.textContent = 'Email or username is required.';
      emailInput?.classList.add('has-error');
      hasError = true;
    } else if (!this.auth.validateEmail(email)) {
      const emailErr = document.getElementById('authEmailError');
      if (emailErr) emailErr.textContent = 'Please enter a valid email address.';
      emailInput?.classList.add('has-error');
      hasError = true;
    }

    if (!password) {
      const passErr = document.getElementById('authPasswordError');
      if (passErr) passErr.textContent = 'Password is required.';
      passInput?.classList.add('has-error');
      hasError = true;
    }

    if (hasError) return;

    if (submitBtn) submitBtn.disabled = true;
    if (submitText) submitText.textContent = 'Signing in...';

    try {
      const session = await this.auth.login(email, password, rememberMe);
      if (statusAlert) {
        statusAlert.className = 'auth-status-alert success';
        statusAlert.textContent = `Welcome back, ${session.user.name}!`;
        statusAlert.style.display = 'flex';
      }
      this.renderWorkspaceProfileSummary();
      this.showToast(`Signed in as ${session.user.name}`, 'success');

      // Hide auth screen and respect landing rule
      setTimeout(() => {
        const authScreen = document.getElementById('authScreen');
        if (authScreen) authScreen.hidden = true;
        const lastActiveView = this.workspaceStore.getLastActiveView();
        if (lastActiveView === 'editor') {
          this.showWorkspaceView('editor');
        } else {
          this.showWorkspaceView('projects');
        }
        if (submitBtn) submitBtn.disabled = false;
        if (submitText) submitText.textContent = 'Sign in';
      }, 300);
    } catch (err) {
      if (statusAlert) {
        statusAlert.className = 'auth-status-alert error';
        statusAlert.textContent = err.message;
        statusAlert.style.display = 'flex';
      }
      if (submitBtn) submitBtn.disabled = false;
      if (submitText) submitText.textContent = 'Sign in';
    }
  }

  async handleSsoLogin(provider) {
    const statusAlert = document.getElementById('authStatusAlert');
    try {
      const session = await this.auth.loginWithSso(provider);
      if (statusAlert) {
        statusAlert.className = 'auth-status-alert success';
        statusAlert.textContent = `Authenticated via ${session.user.name}!`;
        statusAlert.style.display = 'flex';
      }
      this.renderWorkspaceProfileSummary();
      this.showToast(`Signed in via SSO`, 'success');
      setTimeout(() => {
        const authScreen = document.getElementById('authScreen');
        if (authScreen) authScreen.hidden = true;
        this.showWorkspaceView('projects');
      }, 250);
    } catch (err) {
      if (statusAlert) {
        statusAlert.className = 'auth-status-alert error';
        statusAlert.textContent = err.message;
        statusAlert.style.display = 'flex';
      }
    }
  }

  handleSignOut() {
    this.auth.logout();
    document.getElementById('workspaceDashboard').hidden = true;
    document.getElementById('workspaceSettings').hidden = true;
    this.showAuthView();
    const statusAlert = document.getElementById('authStatusAlert');
    if (statusAlert) {
      statusAlert.className = 'auth-status-alert info';
      statusAlert.textContent = 'You have signed out of your workspace.';
      statusAlert.style.display = 'flex';
    }
    this.showToast('Signed out of DesignForge.', 'info');
  }

  showWorkspaceView(view) {
    if (!this.auth.isAuthenticated()) {
      this.showAuthView();
      return;
    }
    this.workspaceShellView = view;
    const authScreen = document.getElementById('authScreen');
    if (authScreen) authScreen.hidden = true;
    document.getElementById('workspaceDashboard').hidden = view !== 'projects';
    document.getElementById('workspaceSettings').hidden = view !== 'settings';
    document.getElementById('workspaceNewProjectModal').hidden = true;
    document.getElementById('workspaceNewFileModal').hidden = true;
    document.getElementById('workspaceFileSwitcherModal').hidden = true;

    // Persist last active view state:
    // If user is in 'editor', persist 'editor'.
    // If in workspace/projects or settings, persist 'workspace'.
    try {
      this.workspaceStore.setLastActiveView(view === 'editor' ? 'editor' : 'workspace');
    } catch {
      // ignore storage errors
    }

    if (view === 'projects') {
      if (!this.storage.flushAutosave(this.doc)) {
        this.showToast('The current document could not be fully saved before opening the dashboard.', 'error');
      }
      this.showWorkspaceSubView(this.workspaceSubView || 'projects');
    }
  }

  showWorkspaceSubView(subView) {
    this.workspaceSubView = subView;
    const viewProjects = document.getElementById('workspaceProjectsView');
    const viewDetail = document.getElementById('workspaceProjectDetailView');
    const viewSettings = document.getElementById('workspaceProjectSettingsView');
    const viewRecent = document.getElementById('workspaceRecentFilesView');

    if (viewProjects) viewProjects.hidden = subView !== 'projects';
    if (viewDetail) viewDetail.hidden = subView !== 'project-detail';
    if (viewSettings) viewSettings.hidden = subView !== 'project-settings';
    if (viewRecent) viewRecent.hidden = subView !== 'recent-files';

    if (subView === 'projects') {
      this.renderWorkspaceDashboard();
    } else if (subView === 'project-detail') {
      this.renderProjectDetail(this.selectedProjectId);
    } else if (subView === 'project-settings') {
      this.renderProjectSettings(this.selectedProjectId);
    } else if (subView === 'recent-files') {
      this.renderRecentFiles();
    }
  }

  openProjectDetail(projectId) {
    if (!projectId) {
      this.showWorkspaceSubView('projects');
      return;
    }
    this.selectedProjectId = projectId;
    this.workspaceStore.setActiveProjectId(projectId);
    this.showWorkspaceSubView('project-detail');
  }

  openProjectSettings(projectId, tab = 'general') {
    if (!projectId) {
      this.showWorkspaceSubView('projects');
      return;
    }
    this.selectedProjectId = projectId;
    this.showWorkspaceSubView('project-settings');
    document.querySelectorAll('[data-proj-settings-tab]').forEach(b => {
      b.classList.toggle('active', b.dataset.projSettingsTab === tab);
    });
    const generalTab = document.getElementById('projectSettingsTabGeneral');
    const membersTab = document.getElementById('projectSettingsTabMembers');
    if (generalTab) generalTab.hidden = tab !== 'general';
    if (membersTab) membersTab.hidden = tab !== 'members';
    this.renderProjectSettings(projectId, tab);
  }

  openWorkspaceSettings(tab = 'account') {
    if (this.workspaceShellView !== 'settings') {
      this.workspaceReturnView = this.workspaceShellView || 'editor';
    }
    this.showWorkspaceView('settings');
    const backButton = document.getElementById('settingsBackToProjects');
    if (backButton) backButton.textContent = this.workspaceReturnView === 'editor' ? '← Back to editor' : '← Projects';
    this.renderWorkspaceSettings(tab);
  }

  openNewProjectDialog() {
    const modal = document.getElementById('workspaceNewProjectModal');
    const input = document.getElementById('workspaceNewProjectName');
    const desc = document.getElementById('workspaceNewProjectDesc');
    if (modal) modal.hidden = false;
    if (input) {
      input.value = '';
      input.focus();
    }
    if (desc) desc.value = '';
  }

  closeNewProjectDialog() {
    document.getElementById('workspaceNewProjectModal').hidden = true;
  }

  openNewFileDialog() {
    const modal = document.getElementById('workspaceNewFileModal');
    const input = document.getElementById('workspaceNewFileName');
    const label = document.getElementById('newFileProjectNameLabel');
    const project = this.workspaceStore.getProject(this.selectedProjectId);
    if (label) label.textContent = project?.name || 'this project';
    if (modal) modal.hidden = false;
    if (input) {
      input.value = '';
      input.focus();
    }
  }

  closeNewFileDialog() {
    document.getElementById('workspaceNewFileModal').hidden = true;
  }

  openQuickFileSwitcher() {
    const modal = document.getElementById('workspaceFileSwitcherModal');
    const input = document.getElementById('quickFileSwitcherInput');
    if (modal) modal.hidden = false;
    if (input) {
      input.value = '';
      input.focus();
    }
    this.renderQuickFileSwitcherList('');
  }

  closeQuickFileSwitcher() {
    document.getElementById('workspaceFileSwitcherModal').hidden = true;
  }

  renderQuickFileSwitcherList(query = '') {
    const list = document.getElementById('quickFileSwitcherList');
    if (!list) return;
    const recent = this.workspaceStore.getRecentFiles(25);
    const filterText = query.trim().toLowerCase();
    const filtered = filterText ? recent.filter(f => f.name.toLowerCase().includes(filterText) || f.projectName.toLowerCase().includes(filterText)) : recent;

    if (!filtered.length) {
      list.innerHTML = `<div style="padding: 16px; text-align: center; color: #9ba1ab; font-size: 12px;">No matching design files found.</div>`;
      return;
    }

    list.innerHTML = filtered.map(file => `
      <button class="file-switcher-item" type="button" data-switch-file="${this.workspaceEscape(file.id)}">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="color: #60a5fa;">▣</span>
          <strong>${this.workspaceEscape(file.name)}</strong>
        </div>
        <span class="workspace-project-pill">in ${this.workspaceEscape(file.projectName)}</span>
      </button>
    `).join('');
  }

  createWorkspaceProject(name, description = '') {
    if (!this.storage.flushAutosave(this.doc)) {
      throw new Error('Current project changes could not be saved; the new project was not created.');
    }
    const nextDocument = createInitialDocument(name);
    const project = this.workspaceStore.createProject(nextDocument, description);
    this.selectedProjectId = project.id;
    this.openDocumentInTab(nextDocument);
    if (!this.storage.flushAutosave(nextDocument)) {
      this.showToast('Project was created, but its latest local snapshot could not be saved.', 'error');
    }
    const titleInput = document.getElementById('projectTitleInput');
    if (titleInput) titleInput.value = nextDocument.name;
    this.updateTopbarProjectCrumb();
    this.closeNewProjectDialog();
    this.showWorkspaceView('editor');
    this.showToast(`Created project "${name}" locally.`, 'success');
  }

  createWorkspaceFile(projectId, name) {
    if (!this.storage.flushAutosave(this.doc)) {
      throw new Error('Current changes could not be saved; file creation cancelled.');
    }
    const nextDocument = createInitialDocument(name);
    this.workspaceStore.createDesignFile(projectId, nextDocument);
    this.selectedProjectId = projectId;
    this.openDocumentInTab(nextDocument);
    if (!this.storage.flushAutosave(nextDocument)) {
      this.showToast('File was created, but its latest snapshot could not be saved.', 'error');
    }
    const titleInput = document.getElementById('projectTitleInput');
    if (titleInput) titleInput.value = nextDocument.name;
    this.updateTopbarProjectCrumb();
    this.closeNewFileDialog();
    this.showWorkspaceView('editor');
    this.showToast(`Created design file "${name}".`, 'success');
  }

  openWorkspaceFile(fileId) {
    if (!this.storage.flushAutosave(this.doc)) {
      throw new Error('Current changes could not be saved; file switching was cancelled.');
    }
    const file = this.workspaceStore.getFile(fileId);
    if (file?.projectId) {
      this.selectedProjectId = file.projectId;
      this.workspaceStore.setActiveProjectId(file.projectId);
    }
    const nextDocument = this.workspaceStore.loadDesignFile(fileId);
    this.openDocumentInTab(nextDocument);
    if (!this.storage.flushAutosave(nextDocument)) {
      this.showToast('File opened, but its latest local snapshot could not be saved.', 'error');
    }
    const titleInput = document.getElementById('projectTitleInput');
    if (titleInput) titleInput.value = nextDocument.name;
    this.updateTopbarProjectCrumb();
    this.showWorkspaceView('editor');
  }

  deleteWorkspaceFile(fileId) {
    const file = this.workspaceStore.getFile(fileId);
    if (!file) return;
    if (!confirm(`Delete design file "${file.name}"? This action cannot be undone.`)) return;
    this.workspaceStore.deleteDesignFile(fileId);
    this.showToast(`Deleted design file "${file.name}".`, 'info');
    this.renderProjectDetail(this.selectedProjectId);
  }

  openWorkspaceProject(projectId) {
    if (!this.storage.flushAutosave(this.doc)) {
      throw new Error('Current project changes could not be saved; project switching was cancelled.');
    }
    this.selectedProjectId = projectId;
    const nextDocument = this.workspaceStore.loadProject(projectId);
    this.openDocumentInTab(nextDocument);
    if (!this.storage.flushAutosave(nextDocument)) {
      this.showToast('Project opened, but its latest local snapshot could not be saved.', 'error');
    }
    const titleInput = document.getElementById('projectTitleInput');
    if (titleInput) titleInput.value = nextDocument.name;
    this.updateTopbarProjectCrumb();
    this.showWorkspaceView('editor');
  }

  updateTopbarProjectCrumb() {
    const activeProjectId = this.workspaceStore.getActiveProjectId() || this.selectedProjectId;
    const project = activeProjectId ? this.workspaceStore.getProject(activeProjectId) : null;
    const crumbEl = document.getElementById('topbarProjectCrumbName');
    if (crumbEl) crumbEl.textContent = project?.name || 'Project';
  }

  renderWorkspaceDashboard() {
    const grid = document.getElementById('workspaceProjectGrid');
    if (!grid) return;
    let projects = [];
    try {
      projects = this.workspaceStore.getProjects();
    } catch (error) {
      this.setSettingsStatus?.(error.message, 'error');
    }
    const search = (document.getElementById('workspaceProjectSearch')?.value || '').trim().toLowerCase();
    const sort = document.getElementById('workspaceProjectSort')?.value || 'recent';
    const filter = this.workspaceProjectFilter || 'all';
    let visibleProjects = projects.filter(project => project.name.toLowerCase().includes(search));
    visibleProjects.sort((a, b) => sort === 'name'
      ? a.name.localeCompare(b.name)
      : sort === 'created'
        ? new Date(b.createdAt) - new Date(a.createdAt)
        : new Date(b.updatedAt) - new Date(a.updatedAt));

    const activeId = this.workspaceStore.getActiveProjectId();
    const count = document.getElementById('workspaceProjectCount');
    if (count) count.textContent = String(projects.length);
    const heading = document.getElementById('workspaceProjectHeading');
    const subheading = document.getElementById('workspaceProjectSubheading');
    if (heading) heading.textContent = 'Recent projects';
    if (subheading) subheading.textContent = `${projects.length} local project${projects.length === 1 ? '' : 's'}`;

    const dateText = value => {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return 'Saved locally';
      const elapsed = Math.max(0, Date.now() - date.getTime());
      const minutes = Math.floor(elapsed / 60000);
      if (minutes < 1) return 'Edited just now';
      if (minutes < 60) return `Edited ${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `Edited ${hours}h ago`;
      return `Edited ${Math.floor(hours / 24)}d ago`;
    };

    grid.innerHTML = visibleProjects.map((project, index) => `
      <article class="workspace-project-card">
        <button class="workspace-project-open" type="button" data-open-project="${this.workspaceEscape(project.id)}" aria-label="Open ${this.workspaceEscape(project.name)}">
          <div class="workspace-project-preview" style="background: ${index % 3 === 0 ? 'linear-gradient(145deg,#34445f,#202b3c)' : index % 3 === 1 ? 'linear-gradient(145deg,#34353b,#202226)' : 'linear-gradient(145deg,#314a49,#202b2c)'}">
            <div aria-hidden="true"><i></i><i></i><i></i><i></i></div>
          </div>
          <div class="workspace-project-meta">
            <span class="workspace-project-file-icon" aria-hidden="true">▣</span>
            <div style="flex: 1; min-width: 0;">
              <strong>${this.workspaceEscape(project.name)}${project.id === activeId ? ' · Active' : ''}</strong>
              <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 4px;">
                <small>${dateText(project.updatedAt)}</small>
                <span class="workspace-project-pill">${project.fileCount || 0} file${project.fileCount === 1 ? '' : 's'}</span>
              </div>
            </div>
          </div>
        </button>
        <div class="workspace-card-actions" style="padding: 0 12px 10px; display: flex; justify-content: space-between;">
          <button class="workspace-card-action-btn" type="button" data-open-project-settings="${this.workspaceEscape(project.id)}" title="Project settings">Settings</button>
          <button class="workspace-card-action-btn" type="button" data-open-project="${this.workspaceEscape(project.id)}" title="Open project detail">Open project →</button>
        </div>
      </article>
    `).join('');
    const isEmpty = !visibleProjects.length;
    document.getElementById('workspaceEmptyState').hidden = !isEmpty;
    grid.hidden = isEmpty;
    this.renderWorkspaceProfileSummary();
  }

  renderProjectDetail(projectId) {
    const project = this.workspaceStore.getProject(projectId);
    if (!project) {
      this.showWorkspaceSubView('projects');
      return;
    }
    const breadcrumbTitle = document.getElementById('projectDetailBreadcrumbTitle');
    const titleEl = document.getElementById('projectDetailTitle');
    const descEl = document.getElementById('projectDetailDescription');
    if (breadcrumbTitle) breadcrumbTitle.textContent = project.name;
    if (titleEl) titleEl.textContent = project.name;
    if (descEl) descEl.textContent = project.description || 'Organize and edit design files for this project.';

    let files = this.workspaceStore.getDesignFiles(projectId);
    const search = (document.getElementById('workspaceFileSearch')?.value || '').trim().toLowerCase();
    const sort = document.getElementById('workspaceFileSort')?.value || 'recent';

    if (search) {
      files = files.filter(f => f.name.toLowerCase().includes(search));
    }
    files.sort((a, b) => sort === 'name'
      ? a.name.localeCompare(b.name)
      : sort === 'created'
        ? new Date(b.createdAt) - new Date(a.createdAt)
        : new Date(b.updatedAt) - new Date(a.updatedAt));

    const countEl = document.getElementById('workspaceProjectFilesCount');
    if (countEl) countEl.textContent = `${files.length} design file${files.length === 1 ? '' : 's'}`;

    const dateText = value => {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return 'Saved locally';
      const elapsed = Math.max(0, Date.now() - date.getTime());
      const minutes = Math.floor(elapsed / 60000);
      if (minutes < 1) return 'Edited just now';
      if (minutes < 60) return `Edited ${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `Edited ${hours}h ago`;
      return `Edited ${Math.floor(hours / 24)}d ago`;
    };

    const grid = document.getElementById('workspaceFileGrid');
    const emptyState = document.getElementById('workspaceFileEmptyState');
    const activeFileId = this.workspaceStore.getActiveFileId();

    if (grid) {
      grid.innerHTML = files.map((file, index) => `
        <article class="workspace-project-card">
          <button class="workspace-project-open" type="button" data-open-file="${this.workspaceEscape(file.id)}" aria-label="Open ${this.workspaceEscape(file.name)}">
            <div class="workspace-project-preview" style="background: ${index % 3 === 0 ? 'linear-gradient(145deg,#34445f,#202b3c)' : index % 3 === 1 ? 'linear-gradient(145deg,#34353b,#202226)' : 'linear-gradient(145deg,#314a49,#202b2c)'}">
              <div aria-hidden="true"><i></i><i></i><i></i><i></i></div>
            </div>
            <div class="workspace-project-meta">
              <span class="workspace-project-file-icon" aria-hidden="true">▣</span>
              <div style="flex: 1; min-width: 0;">
                <strong>${this.workspaceEscape(file.name)}${file.id === activeFileId ? ' · Open' : ''}</strong>
                <small>${dateText(file.updatedAt)}</small>
              </div>
            </div>
          </button>
          <div class="workspace-card-actions" style="padding: 0 12px 10px; display: flex; justify-content: space-between;">
            <button class="workspace-card-action-btn" type="button" data-open-file="${this.workspaceEscape(file.id)}">Open in editor</button>
            <button class="workspace-card-action-btn" type="button" data-delete-file="${this.workspaceEscape(file.id)}" style="color: #f87171;" title="Delete file">Delete</button>
          </div>
        </article>
      `).join('');
    }

    const isEmpty = !files.length;
    if (emptyState) emptyState.hidden = !isEmpty;
    if (grid) grid.hidden = isEmpty;
  }

  renderProjectSettings(projectId, tab = 'general') {
    const project = this.workspaceStore.getProject(projectId);
    if (!project) {
      this.showWorkspaceSubView('projects');
      return;
    }
    const headerTitle = document.getElementById('projectSettingsHeaderTitle');
    const crumbTitle = document.getElementById('breadcrumbSettingsToProjectName');
    if (headerTitle) headerTitle.textContent = `Settings · ${project.name}`;
    if (crumbTitle) crumbTitle.textContent = project.name;

    // General tab inputs
    const nameInput = document.getElementById('inputProjectSettingsName');
    const descInput = document.getElementById('inputProjectSettingsDesc');
    const generalStatus = document.getElementById('projectGeneralStatusMsg');
    if (nameInput) nameInput.value = project.name;
    if (descInput) descInput.value = project.description || '';
    if (generalStatus) generalStatus.textContent = '';

    // Members tab table
    const tableBody = document.getElementById('projectMembersTableBody');
    const memberStatus = document.getElementById('projectMemberStatusMsg');
    if (memberStatus) memberStatus.textContent = '';

    const dateText = value => {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return 'Recently';
      return date.toLocaleDateString();
    };

    if (tableBody) {
      const members = project.members || [];
      tableBody.innerHTML = members.map(m => {
        const initials = (m.name || 'D').split(/\s+/).slice(0, 2).map(p => p[0]).join('').toUpperCase();
        return `
          <tr>
            <td>
              <div class="project-member-cell">
                <span class="workspace-profile-initials" style="width: 28px; height: 28px; font-size: 11px;">${this.workspaceEscape(initials)}</span>
                <div>
                  <strong>${this.workspaceEscape(m.name)}</strong>
                  <small style="display: block; color: #9ba1ab;">${this.workspaceEscape(m.email || 'No email')}</small>
                </div>
              </div>
            </td>
            <td>
              <select class="project-member-role-select" data-member-user-id="${this.workspaceEscape(m.userId)}">
                <option value="Project Lead" ${m.role === 'Project Lead' ? 'selected' : ''}>Project Lead</option>
                <option value="Designer" ${m.role === 'Designer' ? 'selected' : ''}>Designer</option>
                <option value="Viewer" ${m.role === 'Viewer' ? 'selected' : ''}>Viewer</option>
              </select>
            </td>
            <td><small style="color: #9ba1ab;">${dateText(m.addedAt)}</small></td>
            <td style="text-align: right;">
              <button type="button" class="project-member-remove-btn" data-remove-member="${this.workspaceEscape(m.userId)}">Remove</button>
            </td>
          </tr>
        `;
      }).join('');
    }
  }

  handleSaveProjectGeneral() {
    const nameInput = document.getElementById('inputProjectSettingsName');
    const descInput = document.getElementById('inputProjectSettingsDesc');
    const statusMsg = document.getElementById('projectGeneralStatusMsg');
    const newName = nameInput?.value.trim();
    const newDesc = descInput?.value.trim() || '';

    if (!newName) {
      if (statusMsg) {
        statusMsg.className = 'project-member-status error';
        statusMsg.textContent = 'Project name cannot be empty.';
      }
      return;
    }

    try {
      this.workspaceStore.updateProject(this.selectedProjectId, {
        name: newName,
        description: newDesc
      });
      if (statusMsg) {
        statusMsg.className = 'project-member-status success';
        statusMsg.textContent = 'Changes saved successfully.';
      }
      this.showToast('Project updated.', 'success');
      this.updateTopbarProjectCrumb();
    } catch (err) {
      if (statusMsg) {
        statusMsg.className = 'project-member-status error';
        statusMsg.textContent = err.message;
      }
    }
  }

  handleDeleteProject() {
    const project = this.workspaceStore.getProject(this.selectedProjectId);
    if (!project) return;
    const files = this.workspaceStore.getDesignFiles(this.selectedProjectId);
    if (files.length > 0) {
      alert(`Cannot delete "${project.name}" because it contains ${files.length} design file(s).\n\nPlease move or delete all design files first to prevent accidental data loss.`);
      return;
    }
    if (!confirm(`Are you sure you want to delete project "${project.name}"?`)) return;

    try {
      this.workspaceStore.deleteProject(this.selectedProjectId);
      this.showToast(`Project "${project.name}" deleted.`, 'info');
      this.showWorkspaceSubView('projects');
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  handleAddProjectMember() {
    const select = document.getElementById('selectAddProjectMember');
    const roleSelect = document.getElementById('selectAddProjectRole');
    const statusMsg = document.getElementById('projectMemberStatusMsg');
    if (!select || !select.value) {
      if (statusMsg) {
        statusMsg.className = 'project-member-status error';
        statusMsg.textContent = 'Select an organization member to add.';
      }
      return;
    }
    const option = select.options[select.selectedIndex];
    const name = option.dataset.name || option.text;
    const email = option.dataset.email || '';
    const userId = select.value;
    const role = roleSelect?.value || 'Designer';

    try {
      this.workspaceStore.addProjectMember(this.selectedProjectId, {
        userId,
        name,
        email,
        role
      });
      if (statusMsg) {
        statusMsg.className = 'project-member-status success';
        statusMsg.textContent = `Added "${name}" as ${role}.`;
      }
      this.showToast(`Added "${name}" to project.`, 'success');
      select.value = '';
      this.renderProjectSettings(this.selectedProjectId, 'members');
    } catch (err) {
      if (statusMsg) {
        statusMsg.className = 'project-member-status error';
        statusMsg.textContent = err.message;
      }
      this.showToast(err.message, 'error');
    }
  }

  handleProjectMemberRoleChange(userId, newRole) {
    const statusMsg = document.getElementById('projectMemberStatusMsg');
    try {
      this.workspaceStore.updateProjectMemberRole(this.selectedProjectId, userId, newRole);
      if (statusMsg) {
        statusMsg.className = 'project-member-status success';
        statusMsg.textContent = 'Role updated.';
      }
      this.renderProjectSettings(this.selectedProjectId, 'members');
    } catch (err) {
      if (statusMsg) {
        statusMsg.className = 'project-member-status error';
        statusMsg.textContent = err.message;
      }
      this.showToast(err.message, 'error');
      this.renderProjectSettings(this.selectedProjectId, 'members');
    }
  }

  handleRemoveProjectMember(userId) {
    const statusMsg = document.getElementById('projectMemberStatusMsg');
    const project = this.workspaceStore.getProject(this.selectedProjectId);
    const member = project?.members?.find(m => m.userId === userId);
    if (!member) return;

    if (!confirm(`Remove "${member.name}" from this project?\n\nAccess to this project's files will be revoked, but their account, authored work, and organization membership remain intact.`)) {
      return;
    }

    try {
      this.workspaceStore.removeProjectMember(this.selectedProjectId, userId);
      if (statusMsg) {
        statusMsg.className = 'project-member-status success';
        statusMsg.textContent = `Removed "${member.name}" from project.`;
      }
      this.showToast(`Removed "${member.name}" from project.`, 'info');
      this.renderProjectSettings(this.selectedProjectId, 'members');
    } catch (err) {
      if (statusMsg) {
        statusMsg.className = 'project-member-status error';
        statusMsg.textContent = err.message;
      }
      this.showToast(err.message, 'error');
    }
  }

  renderRecentFiles() {
    const grid = document.getElementById('workspaceRecentFilesGrid');
    const emptyState = document.getElementById('workspaceRecentEmptyState');
    if (!grid) return;
    const recent = this.workspaceStore.getRecentFiles(24);

    const dateText = value => {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return 'Recently';
      const elapsed = Math.max(0, Date.now() - date.getTime());
      const minutes = Math.floor(elapsed / 60000);
      if (minutes < 1) return 'Edited just now';
      if (minutes < 60) return `Edited ${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `Edited ${hours}h ago`;
      return `Edited ${Math.floor(hours / 24)}d ago`;
    };

    grid.innerHTML = recent.map((file, index) => `
      <article class="workspace-project-card">
        <button class="workspace-project-open" type="button" data-open-file="${this.workspaceEscape(file.id)}" aria-label="Open ${this.workspaceEscape(file.name)}">
          <div class="workspace-project-preview" style="background: ${index % 3 === 0 ? 'linear-gradient(145deg,#34445f,#202b3c)' : index % 3 === 1 ? 'linear-gradient(145deg,#34353b,#202226)' : 'linear-gradient(145deg,#314a49,#202b2c)'}">
            <div aria-hidden="true"><i></i><i></i><i></i><i></i></div>
          </div>
          <div class="workspace-project-meta">
            <span class="workspace-project-file-icon" aria-hidden="true">▣</span>
            <div style="flex: 1; min-width: 0;">
              <strong>${this.workspaceEscape(file.name)}</strong>
              <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 4px;">
                <small>${dateText(file.updatedAt)}</small>
                <span class="workspace-project-pill">in ${this.workspaceEscape(file.projectName)}</span>
              </div>
            </div>
          </div>
        </button>
        <div class="workspace-card-actions" style="padding: 0 12px 10px;">
          <button class="workspace-card-action-btn" type="button" data-open-file="${this.workspaceEscape(file.id)}">Open in editor →</button>
        </div>
      </article>
    `).join('');

    const isEmpty = !recent.length;
    if (emptyState) emptyState.hidden = !isEmpty;
    grid.hidden = isEmpty;
  }


  renderWorkspaceProfileSummary() {
    let profile = null;
    try {
      profile = this.workspaceStore.getActiveProfile();
    } catch {
      profile = null;
    }
    const name = profile?.name || 'Designer';
    const initials = name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
    for (const id of ['workspaceProfileMini', 'workspaceProfileButton', 'settingsProfileButton', 'btnWorkspaceProfile']) {
      const element = document.getElementById(id);
      if (!element) continue;
      if (element.id === 'workspaceProfileMini') {
        element.innerHTML = `<button type="button" aria-label="Open profile"><span class="workspace-profile-initials">${this.workspaceEscape(initials)}</span><span>${this.workspaceEscape(name)}<small>${this.workspaceEscape(profile?.role || 'Product Designer')}</small></span></button>`;
        element.querySelector('button')?.addEventListener('click', () => this.openWorkspaceSettings('account'));
      } else {
        element.textContent = initials || 'D';
        element.title = name;
        element.setAttribute('aria-label', `Open profile for ${name}`);
      }
    }
  }

  setSettingsStatus(message, kind = 'info') {
    const status = document.getElementById('settingsStatus');
    if (!status) return;
    status.textContent = message;
    status.style.color = kind === 'error' ? '#ff8a8a' : kind === 'success' ? '#78d7a4' : '#8fc0ff';
  }

  renderWorkspaceSettings(tab = 'account') {
    const profile = this.workspaceStore.getActiveProfile() || { name: '', email: '', role: 'Product Designer', handle: '' };
    const tabDetails = {
      account: ['Account', 'Manage your local profile and personal preferences.'],
      organization: ['Organization', 'See how your design team is organized and who is working on the project.'],
      notifications: ['Notifications', 'Choose which project activity updates are saved as your preferences.'],
      security: ['Security & AI', 'Configure AI providers, project design tokens, and statically analyzed React libraries.']
    };
    const [title, description] = tabDetails[tab] || tabDetails.account;
    document.getElementById('settingsBreadcrumb').textContent = title;
    document.getElementById('settingsPageTitle').textContent = title;
    document.getElementById('settingsPageDescription').textContent = description;
    document.querySelectorAll('[data-settings-tab]').forEach(button => {
      button.classList.toggle('active', button.dataset.settingsTab === tab);
    });
    document.getElementById('settingsStatus').textContent = '';
    this.renderWorkspaceProfileSummary();

    const content = document.getElementById('settingsContent');
    if (!content) return;
    if (tab === 'organization') {
      content.innerHTML = `
        <section class="settings-card">
          <h2>DesignForge Product Design</h2>
          <p>Sample organization chart for this local workspace. The UX lead coordinates the designers below.</p>
          <div class="settings-hierarchy" role="tree" aria-label="Sample UX organization chart">
            <div class="settings-org-member team-lead" role="treeitem" aria-level="1">
              <span class="workspace-profile-initials">JL</span><span><strong>Jordan Lee</strong><small>UX Lead · Design Operations</small></span><em>Team lead</em>
            </div>
            <div class="settings-org-member" role="treeitem" aria-level="2">
              <span class="workspace-profile-initials">AM</span><span><strong>Alex Morgan</strong><small>Senior UX Designer · Research & strategy</small></span><em>Reports to Jordan Lee</em>
            </div>
            <div class="settings-org-member" role="treeitem" aria-level="2">
              <span class="workspace-profile-initials">SK</span><span><strong>Sam Kim</strong><small>Product UX Designer · Design systems</small></span><em>Reports to Jordan Lee</em>
            </div>
            <div class="settings-org-member" role="treeitem" aria-level="2">
              <span class="workspace-profile-initials">RP</span><span><strong>Riley Patel</strong><small>UX Designer · Prototyping</small></span><em>Reports to Jordan Lee</em>
            </div>
          </div>
          <div class="settings-card-actions"><span class="settings-muted">Demo team only · No invitations or messages are sent.</span></div>
        </section>`;
      return;
    }

    if (tab === 'notifications') {
      const notifications = this.workspaceStore.getNotifications();
      const options = [
        ['desktop', 'Desktop notifications', 'Show in-app updates about project activity.'],
        ['comments', 'Comments and mentions', 'Notify when someone comments on a design or mentions you.'],
        ['invites', 'Team invites and requests', 'Notify about organization invitations and review requests.'],
        ['projectUpdates', 'Project updates', 'Notify when a shared project changes.'],
        ['productNews', 'Product news', 'Receive occasional product tips and release notes.']
      ];
      content.innerHTML = `
        <section class="settings-card">
          <h2>Activity notifications</h2>
          <p>These preferences are saved in this browser. Email and operating-system notifications are not configured.</p>
          ${options.map(([key, label, help]) => `
            <label class="settings-toggle-row"><span>${label}<small>${help}</small></span>
              <input type="checkbox" data-notification-setting="${key}" ${notifications[key] ? 'checked' : ''}>
            </label>
          `).join('')}
        </section>`;
      return;
    }

    if (tab === 'security') {
      this.renderWorkspaceSecuritySettings(content);
      return;
    }

    const profiles = this.workspaceStore.getProfiles();
    const activeId = profile.id;
    const theme = localStorage.getItem('designforge_theme') || 'axiom-dark';
    content.innerHTML = `
      <section class="settings-card">
        <h2>Profile</h2>
        <p>Local workspace profile only. DesignForge does not create an online account or authenticate a real user.</p>
        <form data-settings-form="profile">
          <input type="hidden" name="id" value="${this.workspaceEscape(profile.id || '')}">
          <div class="settings-form-grid">
            <label class="settings-field">Display name<input name="name" required maxlength="100" value="${this.workspaceEscape(profile.name)}"></label>
            <label class="settings-field">Email address<input name="email" type="email" maxlength="200" value="${this.workspaceEscape(profile.email)}" placeholder="name@example.com"></label>
            <label class="settings-field">Role<input name="role" maxlength="100" value="${this.workspaceEscape(profile.role)}"></label>
            <label class="settings-field">Profile handle<input name="handle" maxlength="60" value="${this.workspaceEscape(profile.handle || '')}" placeholder="your-handle"></label>
            <label class="settings-field">Theme
              <select id="profileTheme">
                <option value="axiom-dark" ${theme === 'axiom-dark' ? 'selected' : ''}>Dark</option>
                <option value="axiom-light" ${theme === 'axiom-light' ? 'selected' : ''}>Light</option>
                <option value="high-contrast" ${theme === 'high-contrast' ? 'selected' : ''}>High contrast</option>
              </select>
            </label>
          </div>
          <div class="settings-card-actions"><button class="workspace-primary-btn" type="submit">Save profile</button></div>
        </form>
        <div class="settings-profile-list">${profiles.map(item => `
          <div class="settings-profile-row"><span><strong>${this.workspaceEscape(item.name)}</strong><small>${this.workspaceEscape(item.role || 'Product Designer')}${item.email ? ` · ${this.workspaceEscape(item.email)}` : ''}</small></span>
            ${item.id === activeId ? '<span>Active</span>' : `<button class="workspace-secondary-btn" type="button" data-switch-profile="${this.workspaceEscape(item.id)}">Switch</button>`}
          </div>
        `).join('')}</div>
      </section>
      <section class="settings-card">
        <h2>Create another profile</h2>
        <p>Add a separate local workspace identity. Profiles do not provide sign-in or access control.</p>
        <button class="workspace-secondary-btn" type="button" data-workspace-action="show-create-profile">＋ Create profile</button>
        <form data-settings-form="new-profile" hidden style="margin-top: 16px;">
          <div class="settings-form-grid">
            <label class="settings-field">Display name<input name="name" required maxlength="100"></label>
            <label class="settings-field">Email address<input name="email" type="email" maxlength="200" placeholder="name@example.com"></label>
            <label class="settings-field">Role<input name="role" maxlength="100" value="Product Designer"></label>
            <label class="settings-field">Handle<input name="handle" maxlength="60" placeholder="your-handle"></label>
          </div>
          <div class="settings-card-actions"><button class="workspace-primary-btn" type="submit">Create profile</button></div>
        </form>
      </section>`;
  }

  renderWorkspaceSecuritySettings(content) {
    const service = this.ai.service;
    const activeProvider = service.activeProviderName;
    const provider = service.getProvider(activeProvider);
    const providerOptions = [
      ['local', 'DesignForge Local (offline)'],
      ['ollama', 'Ollama (local models)'],
      ['openai', 'OpenAI'],
      ['gemini', 'Google Gemini']
    ];
    const models = {
      local: ['DesignForge-Local-v1.2'],
      ollama: ['llama3.1', 'qwen2.5-coder'],
      openai: ['gpt-4o', 'gpt-4.1'],
      gemini: ['gemini-1.5-flash', 'gemini-1.5-pro']
    };
    const libraryRecords = this.workspaceStore.getReactLibraries();
    const tokenCount = this.dsRegistry.getAllTokens().length;
    const tokenLabel = `${tokenCount} design token${tokenCount === 1 ? '' : 's'} ${tokenCount === 1 ? 'is' : 'are'}`;
    content.innerHTML = `
      <section class="settings-card">
        <h2>AI model and design agent</h2>
        <p>Choose an implemented model provider. The active design assistant uses this provider for project design requests.</p>
        <div class="settings-form-grid">
          <label class="settings-field">AI provider
            <select id="providerNameSelect">${providerOptions.map(([value, label]) => `<option value="${value}" ${activeProvider === value ? 'selected' : ''}>${label}</option>`).join('')}</select>
          </label>
          <label class="settings-field">Model
            <select id="providerModelSelect">${(models[activeProvider] || [provider.model]).map(model => `<option value="${this.workspaceEscape(model)}" ${provider.model === model ? 'selected' : ''}>${this.workspaceEscape(model)}</option>`).join('')}</select>
          </label>
          <label class="settings-field" id="providerApiKeyField">API key<input id="providerApiKeyInput" type="password" autocomplete="new-password" placeholder="${provider.apiKey ? 'Key configured · leave blank to keep it' : 'Paste provider API key'}"></label>
          <label class="settings-field">Project context privacy
            <select id="providerPrivacySelect">
              <option value="local_only" ${service.privacyMode === 'local_only' ? 'selected' : ''}>Local only</option>
              <option value="allow_hosted" ${service.privacyMode === 'allow_hosted' ? 'selected' : ''}>Allow hosted provider</option>
              <option value="redact_text" ${service.privacyMode === 'redact_text' ? 'selected' : ''}>Redact text before hosted requests</option>
            </select>
          </label>
        </div>
        <div class="settings-inline-warning" style="margin-top: 14px;">API keys are stored in this browser's local storage and are not encrypted. They are sent to the selected provider only when you request AI generation or test the connection. Do not use shared/public devices; clear the key when finished.</div>
        <div class="settings-card-actions">
          <button class="workspace-primary-btn" type="button" data-workspace-action="save-ai">Save AI settings</button>
          <button class="workspace-secondary-btn" type="button" data-workspace-action="test-ai">Test connection</button>
          <button class="workspace-secondary-btn" type="button" data-workspace-action="clear-ai-key">Clear saved key</button>
        </div>
      </section>
      <section class="settings-card">
        <h2>AI design tokens</h2>
      <p>${tokenLabel} available through this project's design system and can guide the AI assistant.</p>
        <div class="settings-card-actions">
          <button class="workspace-secondary-btn" type="button" data-workspace-action="open-design-tokens">Open design tokens</button>
          <button class="workspace-secondary-btn" type="button" data-workspace-action="generate-design-tokens">Generate token suggestions</button>
        </div>
      </section>
      <section class="settings-card">
        <h2>React libraries and design systems</h2>
        <p>Add React package/source files for safe static analysis. Supported files include package.json, JSON tokens, CSS, JS, JSX, TS, and TSX. Project code and package scripts are never executed.</p>
        <div class="settings-card-actions">
          <button class="workspace-secondary-btn" type="button" data-workspace-action="choose-react-files">＋ Add React library files</button>
          <button class="workspace-secondary-btn" type="button" data-workspace-action="choose-react-folder"><span data-icon="Folder"></span> Add React project folder</button>
          <input type="file" id="workspaceReactFiles" accept=".json,.css,.js,.jsx,.ts,.tsx" multiple hidden>
          <input type="file" id="workspaceReactFolder" accept=".json,.css,.js,.jsx,.ts,.tsx" webkitdirectory directory multiple hidden>
        </div>
        <div class="settings-library-list">${libraryRecords.length ? libraryRecords.map(library => `
          <div class="settings-library-row"><span><strong>${this.workspaceEscape(library.name)}</strong><small>${library.version ? `v${this.workspaceEscape(library.version)} · ` : ''}${library.sourceFileCount} static file(s) · ${library.tokenCount} token(s) · ${library.componentCount} component(s)</small></span>
            <button class="workspace-secondary-btn" type="button" data-remove-library="${this.workspaceEscape(library.name)}">Remove</button>
          </div>`).join('') : '<div class="settings-muted">No React libraries analyzed yet.</div>'}</div>
      </section>`;
    this.updateProviderModelChoices(activeProvider);
  }

  updateProviderModelChoices(providerName) {
    const select = document.getElementById('providerModelSelect');
    if (!select) return;
    const service = this.ai.service;
    const currentModel = service.getProvider(providerName).model;
    const modelOptions = {
      local: ['DesignForge-Local-v1.2'],
      ollama: ['llama3.1', 'qwen2.5-coder'],
      openai: ['gpt-4o', 'gpt-4.1'],
      gemini: ['gemini-1.5-flash', 'gemini-1.5-pro']
    }[providerName] || [currentModel];
    select.innerHTML = modelOptions.map(model => `<option value="${this.workspaceEscape(model)}" ${model === currentModel ? 'selected' : ''}>${this.workspaceEscape(model)}</option>`).join('');
    const keyField = document.getElementById('providerApiKeyField');
    if (keyField) keyField.hidden = !['openai', 'gemini'].includes(providerName);
    const keyInput = document.getElementById('providerApiKeyInput');
    if (keyInput) keyInput.placeholder = service.getProvider(providerName).apiKey ? 'Key configured · leave blank to keep it' : 'Paste provider API key';
  }

  handleWorkspaceSettingsChange(event) {
    if (event.target.id === 'workspaceReactFiles' || event.target.id === 'workspaceReactFolder') {
      void this.importWorkspaceReactLibrary(event.target.files).finally(() => { event.target.value = ''; });
      return;
    }
    const notification = event.target.closest('[data-notification-setting]');
    if (notification) {
      const notifications = this.workspaceStore.getNotifications();
      notifications[notification.dataset.notificationSetting] = notification.checked;
      try {
        this.workspaceStore.saveNotifications(notifications);
        this.setSettingsStatus('Notification preferences saved in this browser.', 'success');
      } catch (error) {
        this.setSettingsStatus(error.message, 'error');
      }
      return;
    }
    if (event.target.id === 'providerNameSelect') {
      this.updateProviderModelChoices(event.target.value);
    }
    if (event.target.id === 'profileTheme') {
      this.toggleTheme(event.target.value);
      this.setSettingsStatus('Theme preference updated.', 'success');
    }
  }

  handleWorkspaceSettingsClick(event) {
    const switchButton = event.target.closest('[data-switch-profile]');
    if (switchButton) {
      try {
        this.workspaceStore.setActiveProfile(switchButton.dataset.switchProfile);
        this.renderWorkspaceSettings('account');
        this.setSettingsStatus('Profile switched.', 'success');
      } catch (error) {
        this.setSettingsStatus(error.message, 'error');
      }
      return;
    }
    const removeLibrary = event.target.closest('[data-remove-library]');
    if (removeLibrary) {
      try {
        this.workspaceStore.removeReactLibrary(removeLibrary.dataset.removeLibrary);
        this.renderWorkspaceSettings('security');
        this.setSettingsStatus('React library removed from the local list. Imported design-system tokens remain in the project.', 'success');
      } catch (error) {
        this.setSettingsStatus(error.message, 'error');
      }
      return;
    }
    const action = event.target.closest('[data-workspace-action]')?.dataset.workspaceAction;
    if (!action) return;
    if (action === 'show-create-profile') {
      const form = document.querySelector('[data-settings-form="new-profile"]');
      if (form) {
        form.hidden = false;
        form.querySelector('input[name="name"]')?.focus();
      }
    } else if (action === 'save-ai') {
      this.saveWorkspaceAiSettings();
    } else if (action === 'test-ai') {
      this.testWorkspaceAiProvider();
    } else if (action === 'clear-ai-key') {
      this.clearWorkspaceAiKey();
    } else if (action === 'open-design-tokens') {
      this.showWorkspaceView('editor');
      this.setAxiomMode('system');
      this.dsUi.renderView('tokens');
    } else if (action === 'generate-design-tokens') {
      this.showWorkspaceView('editor');
      this.setAxiomMode('system');
      this.dsUi.openAiTokensModal();
    } else if (action === 'choose-react-files') {
      document.getElementById('workspaceReactFiles')?.click();
    } else if (action === 'choose-react-folder') {
      document.getElementById('workspaceReactFolder')?.click();
    }
  }

  async handleWorkspaceSettingsSubmit(event) {
    const formType = event.target.dataset.settingsForm;
    if (!formType) return;
    event.preventDefault();
    const formData = new FormData(event.target);
    const profile = {
      id: formData.get('id') || undefined,
      name: formData.get('name'),
      email: formData.get('email'),
      role: formData.get('role'),
      handle: formData.get('handle')
    };
    try {
      this.workspaceStore.saveProfile(profile);
      this.renderWorkspaceSettings('account');
      this.setSettingsStatus(formType === 'new-profile' ? 'Profile created and selected.' : 'Profile saved.', 'success');
    } catch (error) {
      this.setSettingsStatus(error.message, 'error');
    }
  }

  saveWorkspaceAiSettings() {
    const providerName = document.getElementById('providerNameSelect')?.value;
    const model = document.getElementById('providerModelSelect')?.value;
    const apiKey = document.getElementById('providerApiKeyInput')?.value.trim();
    const privacy = document.getElementById('providerPrivacySelect')?.value;
    try {
      if (!providerName || !model) throw new Error('Choose an AI provider and model.');
      this.ai.service.setActiveProvider(providerName);
      this.ai.service.configureProvider(providerName, {
        model,
        ...(apiKey ? { apiKey } : {})
      });
      if (privacy) this.ai.service.setPrivacyMode(privacy);
      const keyInput = document.getElementById('providerApiKeyInput');
      if (keyInput) {
        keyInput.value = '';
        keyInput.placeholder = this.ai.service.getProvider(providerName).apiKey
          ? 'Key configured · leave blank to keep it'
          : 'Paste provider API key';
      }
      this.setSettingsStatus('AI provider settings saved for this browser.', 'success');
    } catch (error) {
      this.setSettingsStatus(error.message, 'error');
    }
  }

  async testWorkspaceAiProvider() {
    const providerName = document.getElementById('providerNameSelect')?.value;
    const model = document.getElementById('providerModelSelect')?.value;
    const apiKey = document.getElementById('providerApiKeyInput')?.value.trim();
    if (!providerName) return;
    const provider = this.ai.service.getProvider(providerName);
    const priorConfig = { model: provider.model, apiKey: provider.apiKey };
    try {
      this.ai.service.configureProvider(providerName, {
        ...(model ? { model } : {}),
        ...(apiKey ? { apiKey } : {})
      }, { persist: false });
      this.setSettingsStatus('Testing provider connection…', 'info');
      const result = await provider.testConnection();
      this.setSettingsStatus(result.message || (result.success ? 'Provider connection succeeded.' : 'Provider connection failed.'), result.success ? 'success' : 'error');
    } catch (error) {
      this.setSettingsStatus(`Connection test failed: ${error.message}`, 'error');
    } finally {
      provider.model = priorConfig.model;
      provider.apiKey = priorConfig.apiKey;
      const keyInput = document.getElementById('providerApiKeyInput');
      if (keyInput) keyInput.value = '';
    }
  }

  // --- In-Editor Multi-Document Tabs (Part 2: §5, §8, §9) ---
  initDocumentTabs() {
    this.renderDocumentTabs();

    document.getElementById('btnNewDocumentTab')?.addEventListener('click', () => {
      const nextDoc = createInitialDocument(`Untitled ${this.openDocumentTabs.length + 1}`);
      this.workspaceStore.createProject(nextDoc);
      this.openDocumentInTab(nextDoc);
      this.showToast(`Opened new design tab: "${nextDoc.name}"`, 'success');
    });

    document.getElementById('btnUnsavedCancel')?.addEventListener('click', () => {
      const modal = document.getElementById('modalUnsavedChanges');
      if (modal) modal.style.display = 'none';
      this.pendingTabCloseId = null;
    });

    document.getElementById('btnUnsavedDontSave')?.addEventListener('click', () => {
      const modal = document.getElementById('modalUnsavedChanges');
      if (modal) modal.style.display = 'none';
      if (this.pendingTabCloseId) {
        this.forceCloseTab(this.pendingTabCloseId);
        this.pendingTabCloseId = null;
      }
    });

    document.getElementById('btnUnsavedSave')?.addEventListener('click', () => {
      const modal = document.getElementById('modalUnsavedChanges');
      if (modal) modal.style.display = 'none';
      if (this.pendingTabCloseId) {
        const tab = this.openDocumentTabs.find(t => t.id === this.pendingTabCloseId);
        if (tab) {
          this.storage.flushAutosave(tab.doc);
          this.forceCloseTab(this.pendingTabCloseId);
        }
        this.pendingTabCloseId = null;
      }
    });
  }

  renderDocumentTabs() {
    const scrollEl = document.getElementById('editorTabsScroll');
    if (!scrollEl) return;
    scrollEl.innerHTML = this.openDocumentTabs.map(tab => {
      const isActive = tab.id === this.activeDocumentTabId;
      const dirtyClass = tab.isDirty ? 'is-dirty' : '';
      return `
        <div class="editor-doc-tab ${isActive ? 'active' : ''} ${dirtyClass}" data-tab-id="${this.escapeAttr(tab.id)}" title="${this.escapeAttr(tab.name)}">
          <span style="font-size: 11px; opacity: 0.7;">▤</span>
          <span class="editor-doc-tab-title">${this.escapeHtml(tab.name)}</span>
          <span class="editor-doc-tab-dot" title="Unsaved changes"></span>
          <button class="editor-doc-tab-close" data-close-tab="${this.escapeAttr(tab.id)}" title="Close tab (⌥W)" type="button">×</button>
        </div>
      `;
    }).join('');

    scrollEl.querySelectorAll('.editor-doc-tab').forEach(tabEl => {
      tabEl.addEventListener('click', (e) => {
        if (e.target.closest('.editor-doc-tab-close')) return;
        this.switchDocumentTab(tabEl.dataset.tabId);
      });
    });

    scrollEl.querySelectorAll('.editor-doc-tab-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeDocumentTab(btn.dataset.closeTab);
      });
    });
  }

  switchDocumentTab(tabId) {
    if (tabId === this.activeDocumentTabId) return;
    const currentTab = this.openDocumentTabs.find(t => t.id === this.activeDocumentTabId);
    if (currentTab) {
      currentTab.zoom = this.renderer.zoom || 1;
      currentTab.pan = { x: this.renderer.panX || 0, y: this.renderer.panY || 0 };
      currentTab.name = this.doc.name || currentTab.name;
    }

    const targetTab = this.openDocumentTabs.find(t => t.id === tabId);
    if (!targetTab) return;

    this.activeDocumentTabId = tabId;
    this.replaceDocument(targetTab.doc);
    this.renderer.zoom = targetTab.zoom || 1;
    this.renderer.panX = targetTab.pan?.x || 0;
    this.renderer.panY = targetTab.pan?.y || 0;
    this.renderer.render();
    this.updateRulers();
    this.renderDocumentTabs();
  }

  openDocumentInTab(nextDoc) {
    let tab = this.openDocumentTabs.find(t => t.id === nextDoc.id);
    if (!tab) {
      tab = {
        id: nextDoc.id || 'doc_' + Date.now(),
        name: nextDoc.name || 'Untitled Document',
        doc: nextDoc,
        engine: new CommandEngine(nextDoc),
        zoom: 1,
        pan: { x: 0, y: 0 },
        isDirty: false
      };
      this.openDocumentTabs.push(tab);
    }
    this.switchDocumentTab(tab.id);
  }

  closeDocumentTab(tabId) {
    const tab = this.openDocumentTabs.find(t => t.id === tabId);
    if (!tab) return;

    if (tab.isDirty) {
      this.pendingTabCloseId = tabId;
      const modal = document.getElementById('modalUnsavedChanges');
      const nameEl = document.getElementById('unsavedChangesDocName');
      if (nameEl) nameEl.textContent = `"${tab.name}" has unsaved edits. Closing without saving will discard changes.`;
      if (modal) modal.style.display = 'flex';
      return;
    }

    this.forceCloseTab(tabId);
  }

  forceCloseTab(tabId) {
    const idx = this.openDocumentTabs.findIndex(t => t.id === tabId);
    if (idx === -1) return;

    this.openDocumentTabs.splice(idx, 1);

    if (this.openDocumentTabs.length === 0) {
      const freshDoc = createInitialDocument('Untitled Document');
      this.openDocumentInTab(freshDoc);
      return;
    }

    if (tabId === this.activeDocumentTabId) {
      const nextTab = this.openDocumentTabs[Math.max(0, idx - 1)];
      this.switchDocumentTab(nextTab.id);
    } else {
      this.renderDocumentTabs();
    }
  }

  cycleNextTab(direction = 1) {
    if (this.openDocumentTabs.length <= 1) return;
    const curIdx = this.openDocumentTabs.findIndex(t => t.id === this.activeDocumentTabId);
    if (curIdx === -1) return;
    const nextIdx = (curIdx + direction + this.openDocumentTabs.length) % this.openDocumentTabs.length;
    this.switchDocumentTab(this.openDocumentTabs[nextIdx].id);
  }

  markActiveTabDirty(isDirty = true) {
    const activeTab = this.openDocumentTabs.find(t => t.id === this.activeDocumentTabId);
    if (activeTab && activeTab.isDirty !== isDirty) {
      activeTab.isDirty = isDirty;
      this.renderDocumentTabs();
    }
  }

  clearWorkspaceAiKey() {
    const providerName = document.getElementById('providerNameSelect')?.value;
    if (!providerName || !['openai', 'gemini'].includes(providerName)) {
      this.setSettingsStatus('Select OpenAI or Gemini to clear a hosted API key.', 'error');
      return;
    }
    try {
      this.ai.service.clearProviderApiKey(providerName);
      const keyInput = document.getElementById('providerApiKeyInput');
      if (keyInput) {
        keyInput.value = '';
        keyInput.placeholder = 'Paste provider API key';
      }
      this.setSettingsStatus('Saved API key cleared from this browser.', 'success');
    } catch (error) {
      this.setSettingsStatus(error.message, 'error');
    }
  }

  async importWorkspaceReactLibrary(files) {
    const supportedFiles = Array.from(files || [])
      .filter(file => /\.(?:json|css|jsx?|tsx?)$/i.test(file.name))
      .filter(file => !/(?:^|\/)(?:node_modules|dist|build|\.git|coverage)\//i.test(file.webkitRelativePath || file.name));
    const totalBytes = supportedFiles.reduce((sum, file) => sum + file.size, 0);
    if (!supportedFiles.length) {
      this.setSettingsStatus('Choose package.json, token JSON, CSS, JS, JSX, TS, or TSX source files.', 'error');
      return;
    }
    if (supportedFiles.length > 300 || totalBytes > 10 * 1024 * 1024) {
      this.setSettingsStatus('Selected React library exceeds the static analysis limit (300 files or 10 MB).', 'error');
      return;
    }
    this.setSettingsStatus(`Analyzing ${supportedFiles.length} file(s) without executing uploaded code…`, 'info');
    try {
      const report = await this.dsUi.analyzeSourceFiles(supportedFiles);
      const packages = report.packages || [];
      const packageInfo = packages[0] || null;
      const name = packageInfo?.name || (supportedFiles[0].webkitRelativePath || supportedFiles[0].name).split('/')[0] || 'Imported React library';
      const collectionName = `${name} Design System`.slice(0, 120);
      const result = this.reactDsImporter.commitImportedSystem(report, collectionName);
      const libraryName = String(name).slice(0, 120);
      const saved = this.workspaceStore.addReactLibrary({
        name: libraryName,
        version: packageInfo?.version || '',
        sourceFileCount: supportedFiles.length,
        tokenCount: result.importedTokensCount,
        componentCount: result.importedComponentsCount,
        warnings: report.warnings.slice(0, 8)
      });
      this.storage.flushAutosave(this.doc);
      this.updateHeaderInfo();
      this.renderer.render();
      this.renderWorkspaceSecuritySettings(document.getElementById('settingsContent'));
      this.setSettingsStatus(`Analyzed ${saved.name}: ${result.importedTokensCount} token(s), ${result.importedComponentsCount} component(s) added. No package scripts were run.`, 'success');
    } catch (error) {
      this.setSettingsStatus(`React library analysis failed: ${error.message}`, 'error');
    }
  }

  initUI() {
    // Project title inline rename
    const titleInput = document.getElementById('projectTitleInput');
    if (titleInput) {
      titleInput.value = this.doc.name;
      titleInput.addEventListener('change', (e) => {
        this.doc.name = e.target.value.trim() || 'Untitled Project';
        this.storage.scheduleAutosave(this.doc);
        this.renderWorkspaceDashboard();
      });
    }

    // Initialize Unified Design System UI Controller
    this.dsUi.init();

    // Initialize Figma-Inspired Typography & Missing Fonts Subsystem
    this.initFontManagement();

    // Initialize Axiom Layout Design System (Section 3 & 8)
    this.initAxiomLayout();

    const appMenuBar = document.querySelector('.app-menu-bar');
    const responsiveMenuSection = document.getElementById('responsiveAppMenuSection');
    const responsiveWorkspaceSection = document.getElementById('responsiveWorkspaceSection');
    const topBarLeft = document.querySelector('.top-bar-left');
    const topBarRight = document.querySelector('.top-bar-right');
    const breakpointBar = document.getElementById('topBreakpointBar');
    const modeRail = document.getElementById('axiomModeRail');
    const themeToggle = document.getElementById('btnToggleTheme');
    const moreMenu = document.querySelector('.top-action-menu');
    const toolShelf = document.querySelector('.tool-shelf');
    const modeToolDivider = document.querySelector('.mode-tool-divider');
    const undoButton = document.getElementById('btnUndo');
    const projectTitleInput = document.getElementById('projectTitleInput');
    const placeAppMenu = () => {
      if (!appMenuBar || !responsiveMenuSection || !responsiveWorkspaceSection || !topBarLeft || !topBarRight) return;
      if (window.innerWidth <= 1150) {
        responsiveMenuSection.appendChild(appMenuBar);
        if (breakpointBar) responsiveWorkspaceSection.appendChild(breakpointBar);
      } else {
        if (projectTitleInput && projectTitleInput.parentNode) {
          projectTitleInput.parentNode.insertBefore(appMenuBar, projectTitleInput);
        }
        if (breakpointBar && undoButton && undoButton.parentNode) {
          undoButton.parentNode.insertBefore(breakpointBar, undoButton);
        }
      }
      if (window.innerWidth <= 700) {
        responsiveWorkspaceSection.appendChild(modeRail);
        responsiveWorkspaceSection.appendChild(themeToggle);
      } else {
        if (modeRail && modeToolDivider && modeToolDivider.parentNode) {
          modeToolDivider.parentNode.insertBefore(modeRail, modeToolDivider);
        }
        if (themeToggle && moreMenu && moreMenu.parentNode) {
          moreMenu.parentNode.insertBefore(themeToggle, moreMenu);
        }
      }
    };
    placeAppMenu();
    window.addEventListener('resize', placeAppMenu);

    // Initialize Figma Universal Modal & Prompt System
    this.initFigmaModals();

    // Restore saved theme preference (Axiom Dark, Light, High-Contrast)
    const savedTheme = (typeof localStorage !== 'undefined' ? localStorage.getItem('designforge_theme') : null);
    if (savedTheme) {
      this.toggleTheme(savedTheme);
    }

    // Top Bar Mode Switcher
    const modeTabs = document.querySelectorAll('.mode-tab');
    modeTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        modeTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const mode = tab.dataset.mode;
        if (mode === 'prototype') {
          this.setAxiomMode('prototype');
        } else if (mode === 'code') {
          this.openExportModal();
        } else if (mode === 'design-system') {
          this.setAxiomMode('system');
        } else if (mode === 'design') {
          this.setAxiomMode('design');
        }
      });
    });

    // Tool shelf buttons
    const toolBtns = document.querySelectorAll('.tool-btn');
    toolBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tool = btn.dataset.tool;
        if (tool === 'ai') {
          this.switchToAiTab();
        } else {
          this.setTool(tool);
        }
      });
    });
    document.querySelectorAll('.tool-group-toggle').forEach(toggle => {
      toggle.addEventListener('click', (event) => {
        event.stopPropagation();
        const group = toggle.closest('.tool-menu-group');
        const shouldOpen = !group.classList.contains('open');
        document.querySelectorAll('.tool-menu-group').forEach(item => {
          item.classList.remove('open');
          item.querySelector('.tool-group-toggle')?.setAttribute('aria-expanded', 'false');
        });
        group.classList.toggle('open', shouldOpen);
        toggle.setAttribute('aria-expanded', String(shouldOpen));
      });
    });

    // Sidebar navigation tabs (Layers, Assets, Pages)
    const sidebarTabs = document.querySelectorAll('.navigator-tabs .sidebar-tab-btn');
    sidebarTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        sidebarTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const target = tab.dataset.tab;
        document.getElementById('tabLayers').style.display = target === 'layers' ? 'block' : 'none';
        document.getElementById('tabAssets').style.display = target === 'assets' ? 'block' : 'none';
        document.getElementById('tabPages').style.display = target === 'pages' ? 'block' : 'none';
        if (target === 'pages') this.updatePagesList();
        if (target === 'assets') this.renderTokensList();
      });
    });

    // Layer search filter input
    const layerSearch = document.getElementById('layerSearchInput');
    if (layerSearch) {
      layerSearch.addEventListener('input', (e) => {
        this.layerSearchQuery = e.target.value.toLowerCase().trim();
        this.updateLayersTree();
      });
    }

    this.initLayersTreeHandlers();

    // Undo / Redo in top bar
    document.getElementById('btnUndo')?.addEventListener('click', () => this.undo());
    document.getElementById('btnRedo')?.addEventListener('click', () => this.redo());

    // Zoom controls
    document.getElementById('btnZoomIn')?.addEventListener('click', () => this.zoomIn());
    document.getElementById('btnZoomOut')?.addEventListener('click', () => this.zoomOut());
    document.getElementById('btnZoomFit')?.addEventListener('click', () => this.zoomToFit());
    document.getElementById('zoomPercentText')?.addEventListener('click', () => this.zoom100());

    // Top Action Buttons
    document.getElementById('btnShare')?.addEventListener('click', () => {
      navigator.clipboard.writeText(window.location.href);
      this.showToast('Project link copied to clipboard!', 'success');
    });
    document.getElementById('btnPlayProtoTop')?.addEventListener('click', () => this.openPrototypeModal());
    document.getElementById('btnExportReactTop')?.addEventListener('click', () => this.openExportModal());

    // Modals close buttons
    document.getElementById('btnCloseExportModal')?.addEventListener('click', () => this.closeModal('modalExport'));
    document.getElementById('btnCloseProtoModal')?.addEventListener('click', () => this.closeModal('modalPrototype'));
    document.getElementById('btnCloseHelpModal')?.addEventListener('click', () => this.closeModal('modalHelp'));

    // Comment popup close & resolve
    document.getElementById('btnCloseCommentPopup')?.addEventListener('click', () => {
      document.getElementById('commentPopupCard').style.display = 'none';
    });

    // Hidden file picker for .dforge files
    const fileInput = document.getElementById('dforgeFileInput');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            try {
              const loadedDoc = this.storage.parseDForgeContent(event.target.result);
              this.replaceDocument(loadedDoc);
              this.showToast(`Project "${loadedDoc.name}" loaded successfully!`, 'success');
            } catch (err) {
              this.showToast(`Failed to load file: ${err.message}`, 'error');
            } finally {
              fileInput.value = '';
            }
          };
          reader.readAsText(file);
        }
      });
    }
  }

  // --- Desktop Application Menu Bar ---
  initMenus() {
    const menuItems = document.querySelectorAll('.app-menu-bar .menu-item');
    menuItems.forEach(item => {
      const btn = item.querySelector('.menu-btn');
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = item.classList.contains('open');
        menuItems.forEach(m => m.classList.remove('open'));
        if (!isOpen) item.classList.add('open');
      });
    });

    window.addEventListener('click', (event) => {
      if (!event.target.closest('.app-menu-bar .menu-btn')) {
        menuItems.forEach(m => m.classList.remove('open'));
      }
      document.querySelectorAll('.tool-menu-group').forEach(group => {
        group.classList.remove('open');
        group.querySelector('.tool-group-toggle')?.setAttribute('aria-expanded', 'false');
      });
      if (!event.target.closest('.top-action-menu-trigger, .app-menu-bar .menu-btn')) {
        document.querySelectorAll('.top-action-menu[open]').forEach(menu => menu.removeAttribute('open'));
      }
      const ctxMenu = document.getElementById('canvasContextMenu');
      if (ctxMenu) ctxMenu.style.display = 'none';
    });

    // File Menu Actions
    document.getElementById('menuNewProject')?.addEventListener('click', () => {
      this.openNewProjectDialog();
    });
    document.getElementById('menuOpenProject')?.addEventListener('click', () => this.openProjectPicker());
    document.getElementById('menuImportDesign')?.addEventListener('click', () => this.openImportModal());
    document.getElementById('menuSaveProject')?.addEventListener('click', () => this.saveProject());
    document.getElementById('menuExportReact')?.addEventListener('click', () => this.openExportModal());
    document.getElementById('menuExportSvg')?.addEventListener('click', () => this.exportSelectedAsSvg());
    document.getElementById('menuExportPng')?.addEventListener('click', () => this.exportSelectedAsPng());
    document.getElementById('btnImportDesignTop')?.addEventListener('click', () => this.openImportModal());
    document.getElementById('btnDevModeToggle')?.addEventListener('click', () => this.toggleDevMode());

    // Edit Menu Actions
    document.getElementById('menuUndo')?.addEventListener('click', () => this.undo());
    document.getElementById('menuRedo')?.addEventListener('click', () => this.redo());
    document.getElementById('menuDuplicate')?.addEventListener('click', () => this.duplicateSelected());
    document.getElementById('menuDelete')?.addEventListener('click', () => this.deleteSelected());
    document.getElementById('menuSelectAll')?.addEventListener('click', () => this.selectAll());
    document.getElementById('menuMissingFonts')?.addEventListener('click', () => this.openMissingFontsModal());

    // View Menu Actions
    document.getElementById('menuZoomIn')?.addEventListener('click', () => this.zoomIn());
    document.getElementById('menuZoomOut')?.addEventListener('click', () => this.zoomOut());
    document.getElementById('menuZoomFit')?.addEventListener('click', () => this.zoomToFit());
    document.getElementById('menuZoom100')?.addEventListener('click', () => this.zoom100());
    document.getElementById('menuToggleGrid')?.addEventListener('click', () => {
      this.showGrid = !this.showGrid;
      this.renderer.render();
    });
    document.getElementById('menuToggleRulers')?.addEventListener('click', () => {
      this.showRulers = !this.showRulers;
      const rh = document.getElementById('canvasRulerH');
      const rv = document.getElementById('canvasRulerV');
      if (rh) rh.style.display = this.showRulers ? 'block' : 'none';
      if (rv) rv.style.display = this.showRulers ? 'block' : 'none';
    });

    // Object Menu Actions
    document.getElementById('menuGroup')?.addEventListener('click', () => this.groupSelected());
    document.getElementById('menuUngroup')?.addEventListener('click', () => this.ungroupSelected());
    document.getElementById('menuBooleanUnion')?.addEventListener('click', () => this.booleanSelected('union'));
    document.getElementById('menuBooleanSubtract')?.addEventListener('click', () => this.booleanSelected('subtract'));
    document.getElementById('menuBooleanIntersect')?.addEventListener('click', () => this.booleanSelected('intersect'));
    document.getElementById('menuBooleanExclude')?.addEventListener('click', () => this.booleanSelected('exclude'));
    document.getElementById('menuBringForward')?.addEventListener('click', () => this.reorderSelected('up'));
    document.getElementById('menuSendBackward')?.addEventListener('click', () => this.reorderSelected('down'));
    document.getElementById('menuBringToFront')?.addEventListener('click', () => this.reorderSelected('top'));
    document.getElementById('menuSendToBack')?.addEventListener('click', () => this.reorderSelected('bottom'));

    // Arrange Menu Actions
    document.getElementById('menuAlignLeft')?.addEventListener('click', () => this.alignSelected('left'));
    document.getElementById('menuAlignCenter')?.addEventListener('click', () => this.alignSelected('center'));
    document.getElementById('menuAlignRight')?.addEventListener('click', () => this.alignSelected('right'));
    document.getElementById('menuAlignTop')?.addEventListener('click', () => this.alignSelected('top'));
    document.getElementById('menuAlignMiddle')?.addEventListener('click', () => this.alignSelected('middle'));
    document.getElementById('menuAlignBottom')?.addEventListener('click', () => this.alignSelected('bottom'));
    document.getElementById('menuDistributeH')?.addEventListener('click', () => this.distributeSelected('horizontal'));
    document.getElementById('menuDistributeV')?.addEventListener('click', () => this.distributeSelected('vertical'));

    // Components Menu Actions
    document.getElementById('menuCreateComponent')?.addEventListener('click', () => this.createComponentFromSelection());
    document.getElementById('menuDetachInstance')?.addEventListener('click', () => this.detachSelected());
    document.getElementById('menuResetOverrides')?.addEventListener('click', () => this.resetSelectedOverrides());
    document.getElementById('menuAddAutoLayout')?.addEventListener('click', () => this.addAutoLayoutToSelected());
    document.getElementById('menuRemoveAutoLayout')?.addEventListener('click', () => this.removeAutoLayoutFromSelected());

    // MCP Actions & Hub
    document.getElementById('btnOpenMcpHub')?.addEventListener('click', () => this.openMcpHub());
    document.getElementById('menuOpenMcpHub')?.addEventListener('click', () => this.openMcpHub());
    document.getElementById('menuMcpTools')?.addEventListener('click', () => {
      this.openMcpHub();
      this.mcpHub.renderSection('tools');
    });
    document.getElementById('menuMcpPermissions')?.addEventListener('click', () => {
      this.openMcpHub();
      this.mcpHub.renderSection('permissions');
    });
    document.getElementById('menuMcpWorkflow')?.addEventListener('click', () => {
      this.openMcpHub();
      this.mcpHub.renderSection('workflows');
    });

    // Help & Learn Menu Actions
    document.getElementById('menuOpenLearn')?.addEventListener('click', () => this.openLearnCenter());
    document.getElementById('menuStartTour')?.addEventListener('click', () => this.startGuidedTour());
    document.getElementById('btnOpenLearnCenter')?.addEventListener('click', () => this.openLearnCenter());
    document.getElementById('btnToggleTheme')?.addEventListener('click', () => this.toggleTheme());
    document.getElementById('btnShareModal')?.addEventListener('click', () => this.openShareModal());
    document.getElementById('menuShortcuts')?.addEventListener('click', () => this.showShortcutModal());
    document.getElementById('menuAudit')?.addEventListener('click', () => {
      this.switchToAiTab();
      this.handleAuditDesign();
    });

    // Context Menu Buttons
    document.getElementById('ctxDuplicate')?.addEventListener('click', () => this.duplicateSelected());
    document.getElementById('ctxDelete')?.addEventListener('click', () => this.deleteSelected());
    document.getElementById('ctxGroup')?.addEventListener('click', () => this.groupSelected());
    document.getElementById('ctxUngroup')?.addEventListener('click', () => this.ungroupSelected());
    document.getElementById('ctxAddAutoLayout')?.addEventListener('click', () => this.addAutoLayoutToSelected());
    document.getElementById('ctxCreateComponent')?.addEventListener('click', () => this.createComponentFromSelection());
    document.getElementById('ctxBringToFront')?.addEventListener('click', () => this.reorderSelected('top'));
    document.getElementById('ctxSendToBack')?.addEventListener('click', () => this.reorderSelected('bottom'));
    document.getElementById('ctxBooleanUnion')?.addEventListener('click', () => this.booleanSelected('union'));
    document.getElementById('ctxBooleanSubtract')?.addEventListener('click', () => this.booleanSelected('subtract'));
    document.getElementById('ctxBooleanIntersect')?.addEventListener('click', () => this.booleanSelected('intersect'));
    document.getElementById('ctxBooleanExclude')?.addEventListener('click', () => this.booleanSelected('exclude'));
    document.getElementById('ctxFlatten')?.addEventListener('click', () => this.flattenSelected());
    document.getElementById('ctxExportPng')?.addEventListener('click', () => this.exportSelectedAsPng());
    document.getElementById('ctxExportSvg')?.addEventListener('click', () => this.exportSelectedAsSvg());
  }

  // --- Right Sidebar: Persistent Properties & AI Workspace (Section 4 & Appendix A2) ---
  initRightSidebar() {
    const btnDesign = document.getElementById('btnTabDesign') || document.getElementById('btnTabProperties');
    const btnProto = document.getElementById('btnTabPrototype');
    const btnDs = document.getElementById('btnTabDesignSystem');
    const btnInspect = document.getElementById('btnTabInspect');
    const btnExport = document.getElementById('btnTabExport');
    const btnAi = document.getElementById('btnTabAiAssistant');

    const panelDesign = document.getElementById('panelProperties');
    const panelProto = document.getElementById('panelPrototype');
    const panelInspect = document.getElementById('panelInspect');
    const panelExport = document.getElementById('panelExportTab');
    const panelAi = document.getElementById('panelAiAssistant');
    const btnPin = document.getElementById('btnPinAiSideBySide');
    const sidebar = document.getElementById('rightSidebar');

    const setSidebarMode = (mode) => {
      this.rightTabMode = mode;
      const allTabs = document.querySelectorAll('.right-tab-btn');
      allTabs.forEach(t => t.classList.toggle('active', t.dataset.mode === mode || (mode === 'design' && t.dataset.mode === 'properties')));

      if (sidebar.classList.contains('side-by-side')) {
        // In side-by-side mode, design and AI remain visible
        if (panelDesign) panelDesign.style.display = 'flex';
        if (panelAi) panelAi.style.display = 'flex';
        return;
      }

      if (panelDesign) panelDesign.style.display = mode === 'design' || mode === 'properties' ? 'flex' : 'none';
      if (panelProto) panelProto.style.display = mode === 'prototype' ? 'flex' : 'none';
      if (panelInspect) panelInspect.style.display = mode === 'inspect' ? 'flex' : 'none';
      if (panelExport) panelExport.style.display = mode === 'export' ? 'flex' : 'none';
      if (panelAi) panelAi.style.display = mode === 'ai' ? 'flex' : 'none';

      if (mode === 'prototype') {
        this.renderer.showPrototypeLinks = true;
        this.updatePrototypePanel();
      } else {
        this.renderer.showPrototypeLinks = false;
      }

      if (mode === 'inspect') this.updateInspectPanel();
      if (mode === 'export') this.updateExportPanel();
      if (mode === 'design' || mode === 'properties') this.updateInspector();
      if (mode === 'ai') this.updateAiContext();

      this.renderer.render();
    };
    this.rightSidebarModeSwitcher = setSidebarMode;

    btnDesign?.addEventListener('click', () => {
      this.switchToDesignMode();
      setSidebarMode('design');
      document.querySelectorAll('.mode-tab').forEach(t => t.classList.toggle('active', t.dataset.mode === 'design'));
    });
    btnProto?.addEventListener('click', () => {
      this.switchToDesignMode();
      setSidebarMode('prototype');
      document.querySelectorAll('.mode-tab').forEach(t => t.classList.toggle('active', t.dataset.mode === 'prototype'));
    });
    btnDs?.addEventListener('click', () => {
      this.setAxiomMode('system');
    });
    btnInspect?.addEventListener('click', () => {
      this.switchToDesignMode();
      setSidebarMode('inspect');
    });
    btnExport?.addEventListener('click', () => {
      this.switchToDesignMode();
      setSidebarMode('export');
    });
    btnAi?.addEventListener('click', () => {
      this.switchToDesignMode();
      setSidebarMode('ai');
    });

    // Pin side-by-side button
    btnPin?.addEventListener('click', () => {
      const isPinned = sidebar.classList.toggle('side-by-side');
      btnPin.style.color = isPinned ? '#0d99ff' : 'var(--text-muted)';
      if (isPinned) {
        if (panelDesign) panelDesign.style.display = 'flex';
        if (panelAi) panelAi.style.display = 'flex';
      } else {
        setSidebarMode('design');
      }
    });

    // Draggable Resizer for Right Sidebar
    const resizer = document.getElementById('rightSidebarResizer');
    if (resizer) {
      let isResizing = false;
      resizer.addEventListener('mousedown', (e) => {
        isResizing = true;
        document.body.style.cursor = 'col-resize';
      });

      window.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        const newWidth = window.innerWidth - e.clientX;
        if (newWidth >= 280 && newWidth <= 680) {
          sidebar.style.width = `${newWidth}px`;
        }
      });

      window.addEventListener('mouseup', () => {
        if (isResizing) {
          isResizing = false;
          document.body.style.cursor = 'default';
        }
      });
    }

    // AI Mode Switcher (Prompt vs Markdown Spec)
    const btnModePrompt = document.getElementById('btnModePrompt');
    const btnModeMd = document.getElementById('btnModeMarkdown');
    const contPrompt = document.getElementById('aiPromptModeContainer');
    const contMd = document.getElementById('aiMarkdownModeContainer');

    btnModePrompt?.addEventListener('click', () => {
      this.aiInputMode = 'prompt';
      btnModePrompt.classList.add('active');
      btnModeMd.classList.remove('active');
      contPrompt.style.display = 'flex';
      contMd.style.display = 'none';
    });

    btnModeMd?.addEventListener('click', () => {
      this.aiInputMode = 'markdown';
      btnModeMd.classList.add('active');
      btnModePrompt.classList.remove('active');
      contMd.style.display = 'flex';
      contPrompt.style.display = 'none';
    });

    // Markdown tools: Import, Paste, Sample Spec
    document.getElementById('btnImportMdFile')?.addEventListener('click', () => {
      document.getElementById('mdFileInput')?.click();
    });

    const mdFileInput = document.getElementById('mdFileInput');
    if (mdFileInput) {
      mdFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            document.getElementById('aiMarkdownInput').value = event.target.result;
          };
          reader.readAsText(file);
        }
      });
    }

    document.getElementById('btnPasteMdSpec')?.addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (text) document.getElementById('aiMarkdownInput').value = text;
      } catch (err) {
        const manual = await this.showPromptModal({
          title: 'Paste Markdown Specification',
          subtitle: 'Paste your markdown design blueprint or layout spec below:',
          multiline: true,
          icon: 'FileText',
          placeholder: '# Design Specification\n## Frame: Dashboard...',
          confirmText: 'Insert Spec'
        });
        if (manual) document.getElementById('aiMarkdownInput').value = manual;
      }
    });

    document.getElementById('btnLoadSampleSpec')?.addEventListener('click', () => {
      const sample = `# Enterprise Cloud Analytics Dashboard

## Objective
Create a modern enterprise analytics dashboard with real-time KPI metrics and ledger activity.

## Layout
- Desktop frame: 1440 x 1024
- Left navigation: 240px wide
- Top header: 72px high

## Components
- Navigation sidebar
- Search header
- KPI cards
- Analytics chart
- Recent activity table
- Primary action button

## Design System
- Font: Inter
- Spacing scale: 4, 8, 12, 16, 24, 32
- Border radius: 8px
- Primary color: #2563EB
- Neutral background: #0f172a

## Output
- Editable design frames
- Reusable components
- Responsive layout
- React and TypeScript export`;
      document.getElementById('aiMarkdownInput').value = sample;
    });

    // AI Generation & Execution Buttons
    document.getElementById('btnAiGenerate')?.addEventListener('click', () => this.handleAiGenerate());
    document.getElementById('btnAiApply')?.addEventListener('click', () => this.handleAiApply());
    document.getElementById('btnCancelAi')?.addEventListener('click', () => {
      this.ai.cancel();
      document.getElementById('aiProgressBar').style.display = 'none';
    });
    document.getElementById('btnUndoAiChanges')?.addEventListener('click', () => this.undo());
    document.getElementById('btnNewAiChat')?.addEventListener('click', () => {
      document.getElementById('aiConversationStream').innerHTML = '';
      document.getElementById('aiPromptInput').value = '';
      document.getElementById('aiDiffBox').style.display = 'none';
      document.getElementById('btnAiApply').style.display = 'none';
      this.pendingAiPlan = null;
    });

    // Provider & Privacy Settings Drawer
    const settingsToggle = document.getElementById('btnAiSettingsToggle');
    const settingsPanel = document.getElementById('aiSettingsPanel');
    if (settingsToggle && settingsPanel) {
      settingsToggle.addEventListener('click', () => {
        const isHidden = settingsPanel.style.display === 'none';
        settingsPanel.style.display = isHidden ? 'block' : 'none';
      });
    }

    const providerSelect = document.getElementById('aiProviderSelect');
    const modelSelect = document.getElementById('aiModelSelect');
    const keyFields = document.getElementById('aiKeyFields');
    const openAiKeyGroup = document.getElementById('aiOpenAiKeyGroup');
    const geminiKeyGroup = document.getElementById('aiGeminiKeyGroup');
    const openAiKeyInput = document.getElementById('aiApiKeyInput');
    const geminiKeyInput = document.getElementById('aiGeminiKeyInput');
    const tempSlider = document.getElementById('aiTemperatureSlider');
    const tempVal = document.getElementById('aiTemperatureValue');
    const statusLabel = document.getElementById('aiModelStatusLabel');
    const modelBadge = document.getElementById('aiModelBadge');

    // Load persisted keys and settings from localStorage
    const savedOpenAiKey = localStorage.getItem('designforge_api_key_openai') || '';
    const savedGeminiKey = localStorage.getItem('designforge_api_key_gemini') || '';
    const savedProvider = localStorage.getItem('designforge_ai_provider') || 'openai';
    const savedModel = localStorage.getItem('designforge_ai_model') || '';
    const savedTemp = localStorage.getItem('designforge_ai_temperature') || '0.2';

    if (openAiKeyInput && savedOpenAiKey) {
      openAiKeyInput.value = savedOpenAiKey;
      const openAiProvider = this.ai.service.providers?.openai;
      if (openAiProvider) openAiProvider.apiKey = savedOpenAiKey;
    }
    if (geminiKeyInput && savedGeminiKey) {
      geminiKeyInput.value = savedGeminiKey;
      const geminiProvider = this.ai.service.providers?.gemini;
      if (geminiProvider) geminiProvider.apiKey = savedGeminiKey;
    }

    if (openAiKeyInput) {
      openAiKeyInput.addEventListener('change', (e) => {
        const val = e.target.value.trim();
        localStorage.setItem('designforge_api_key_openai', val);
        const openAiProvider = this.ai.service.providers?.openai;
        if (openAiProvider) openAiProvider.apiKey = val;
        this.showToast('OpenAI API Key saved', 'success');
      });
    }

    if (geminiKeyInput) {
      geminiKeyInput.addEventListener('change', (e) => {
        const val = e.target.value.trim();
        localStorage.setItem('designforge_api_key_gemini', val);
        const geminiProvider = this.ai.service.providers?.gemini;
        if (geminiProvider) geminiProvider.apiKey = val;
        this.showToast('Google Gemini API Key saved', 'success');
      });
    }

    if (tempSlider) {
      tempSlider.value = savedTemp;
      if (tempVal) tempVal.textContent = savedTemp;
      tempSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value) || 0.2;
        if (tempVal) tempVal.textContent = val.toFixed(1);
        localStorage.setItem('designforge_ai_temperature', val);
        if (this.ai.service.providers?.openai) this.ai.service.providers.openai.temperature = val;
        if (this.ai.service.providers?.gemini) this.ai.service.providers.gemini.temperature = val;
      });
    }

    const populateModelOptions = (p, currentModel = null) => {
      if (!modelSelect) return;
      if (p === 'openai') {
        modelSelect.innerHTML = `
          <option value="gpt-4o">gpt-4o (Omni Multimodal Reasoning — Recommended)</option>
          <option value="gpt-4o-mini">gpt-4o-mini (Fast & Efficient)</option>
          <option value="o3-mini">o3-mini (High-Tier Reasoning & Code)</option>
          <option value="o1">o1 (Deep Chain-of-Thought)</option>
          <option value="gpt-4-turbo">gpt-4-turbo</option>
        `;
        modelSelect.disabled = false;
        if (currentModel) modelSelect.value = currentModel;
      } else if (p === 'gemini') {
        modelSelect.innerHTML = `
          <option value="gemini-2.5-pro">gemini-2.5-pro (Flagship Complex Reasoning — Recommended)</option>
          <option value="gemini-2.5-flash">gemini-2.5-flash (High Velocity Sub-Second)</option>
          <option value="gemini-1.5-pro">gemini-1.5-pro (1M Token Context Window)</option>
          <option value="gemini-1.5-flash">gemini-1.5-flash (Lightweight Agentic)</option>
          <option value="gemini-2.0-flash">gemini-2.0-flash</option>
        `;
        modelSelect.disabled = false;
        if (currentModel) modelSelect.value = currentModel;
      } else if (p === 'dual_reasoning') {
        modelSelect.innerHTML = `
          <option value="dual-orchestrated">Dual Orchestrated (OpenAI GPT-4o + Google Gemini 2.5 Pro)</option>
        `;
        modelSelect.disabled = true;
      } else if (p === 'auto') {
        modelSelect.innerHTML = `
          <option value="auto-routed">Automatic Intelligent Router (Best Model per Complexity)</option>
        `;
        modelSelect.disabled = true;
      } else {
        modelSelect.innerHTML = `
          <option value="default">Default Model</option>
        `;
        modelSelect.disabled = true;
      }
    };

    const updateAiStatusDisplay = (p) => {
      if (statusLabel) {
        const status = {
          ollama: ['Bot', 'Ollama Llama 3.1 (Local AI)'],
          local: ['Zap', 'Built-in Synth Engine (Offline)'],
          openai: ['Globe', 'ChatGPT — OpenAI (GPT-4o)'],
          gemini: ['Sparkles', 'Gemini — Google (2.5 / 1.5)'],
          auto: ['Cpu', 'Automatic Provider Selection'],
          dual_reasoning: ['Layers', 'Dual Reasoning (ChatGPT + Gemini)']
        }[p] || ['Bot', p];
        const icon = statusLabel.querySelector('[data-icon]');
        if (status && icon) {
          icon.dataset.icon = status[0];
          const label = [...statusLabel.childNodes].find(node => node.nodeType === Node.TEXT_NODE);
          if (label) label.textContent = ` ${status[1]}`;
          else statusLabel.append(document.createTextNode(` ${status[1]}`));
        }
      }
      if (modelBadge) {
        modelBadge.textContent = p === 'dual_reasoning' ? 'Dual (GPT-4o + Gemini)' : (p === 'auto' ? 'Auto Router' : p);
      }
      if (keyFields) {
        keyFields.style.display = (p === 'local' || p === 'ollama') ? 'none' : 'flex';
      }
      if (openAiKeyGroup) {
        openAiKeyGroup.style.display = (p === 'openai' || p === 'dual_reasoning' || p === 'auto') ? 'block' : 'none';
      }
      if (geminiKeyGroup) {
        geminiKeyGroup.style.display = (p === 'gemini' || p === 'dual_reasoning' || p === 'auto') ? 'block' : 'none';
      }
      populateModelOptions(p, savedModel);
    };

    if (providerSelect) {
      providerSelect.value = savedProvider;
      this.ai.setProvider(savedProvider);
      updateAiStatusDisplay(savedProvider);

      providerSelect.addEventListener('change', (e) => {
        const p = e.target.value;
        localStorage.setItem('designforge_ai_provider', p);
        this.ai.setProvider(p);
        updateAiStatusDisplay(p);
      });
    }

    if (modelSelect) {
      modelSelect.addEventListener('change', (e) => {
        const m = e.target.value;
        localStorage.setItem('designforge_ai_model', m);
        const p = providerSelect?.value;
        if (p === 'openai' && this.ai.service.providers?.openai) {
          this.ai.service.providers.openai.model = m;
        } else if (p === 'gemini' && this.ai.service.providers?.gemini) {
          this.ai.service.providers.gemini.model = m;
        }
      });
    }

    const btnTestAi = document.getElementById('btnTestAiConnection');
    const aiConnStatus = document.getElementById('aiConnectionStatus');
    if (btnTestAi) {
      btnTestAi.addEventListener('click', async () => {
        const currentProviderName = providerSelect?.value || this.ai.service.activeProviderName;
        if (aiConnStatus) {
          aiConnStatus.textContent = `Testing connection to ${currentProviderName.toUpperCase()}...`;
          aiConnStatus.style.color = 'var(--text-dim)';
        }
        try {
          const provider = this.ai.service.getProvider();
          const res = await provider.testConnection();
          if (aiConnStatus) {
            aiConnStatus.textContent = res.message;
            aiConnStatus.style.color = res.success ? 'var(--accent-green)' : 'var(--accent-rose)';
          }
        } catch (err) {
          if (aiConnStatus) {
            aiConnStatus.textContent = `Error: ${err.message}`;
            aiConnStatus.style.color = 'var(--accent-rose)';
          }
        }
      });
    }

    const privacySelect = document.getElementById('aiPrivacySelect');
    if (privacySelect) {
      privacySelect.value = this.ai.service.privacyMode;
      privacySelect.addEventListener('change', (e) => {
        this.ai.setPrivacyMode(e.target.value);
      });
    }

    // AI Prompt suggestion pills
    document.querySelectorAll('.ai-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const promptInput = document.getElementById('aiPromptInput');
        if (promptInput) {
          promptInput.value = pill.textContent.trim();
          promptInput.focus();
        }
      });
    });

    document.getElementById('btnAuditDesign')?.addEventListener('click', () => this.handleAuditDesign());
  }

  switchToAiTab() {
    const sidebar = document.getElementById('rightSidebar');
    if (sidebar.classList.contains('side-by-side')) return;
    document.getElementById('btnTabAiAssistant')?.click();
  }

  updateAiContext() {
    const targetEl = document.getElementById('aiContextTarget');
    const subEl = document.getElementById('aiContextSub');
    if (!targetEl || !subEl) return;

    const page = this.engine.getActivePage();
    const selIds = this.engine.getSelection();

    if (selIds.length === 1) {
      const node = this.engine.getNode(selIds[0]);
      if (node) {
        targetEl.textContent = `Context: Selected "${node.name}" (${node.type})`;
        subEl.textContent = `Size: ${Math.round(node.transform.width)}×${Math.round(node.transform.height)} • ${page.name}`;
        return;
      }
    } else if (selIds.length > 1) {
      targetEl.textContent = `Context: Selected ${selIds.length} objects`;
      subEl.textContent = `Multi-selection • ${page.name}`;
      return;
    }

    const count = Object.keys(page.nodes).length;
    targetEl.textContent = `Context: Entire Document (${count} layers)`;
    subEl.textContent = `${this.doc.tokens?.length || 19} Design Tokens • ${page.name}`;
  }

  // --- Assets & Pages Initializer ---
  initAssetsAndPages() {
    // 1-Click Component Inserts
    document.querySelectorAll('.btn-insert-asset').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.muiComponent) {
          const muiComp = btn.dataset.muiComponent;
          const coords = this.getCanvasCenter();
          insertMuiComponentToCanvas(this, muiComp, coords);
          return;
        }
        const type = btn.dataset.type;
        const coords = this.getCanvasCenter();
        this.handleShapeCreation(type === 'button' ? 'button' : 'frame', coords);
      });
    });

    // 1-Click Vector Shapes Inserts
    document.querySelectorAll('.shape-grid-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const shape = btn.dataset.insertShape;
        this.handleShapeCreation(shape, this.getCanvasCenter());
      });
    });

    // Add Token button
    document.getElementById('btnAddTokenBtn')?.addEventListener('click', async () => {
      const name = await this.showPromptModal({
        title: 'Add Design Token',
        subtitle: 'Enter token name (e.g. Color / Brand Primary or Spacing / 16):',
        defaultValue: 'Brand / Primary',
        icon: 'Box',
        presets: ['Brand / Primary', 'Brand / Accent', 'Surface / Raised', 'Text / Primary'],
        confirmText: 'Next →'
      });
      if (!name) return;
      const value = await this.showPromptModal({
        title: 'Define Token Value',
        subtitle: 'Enter hex color (#6366F1) or pixel dimension value:',
        defaultValue: '#6366F1',
        icon: 'Palette',
        presets: ['#6366F1', '#4F46E5', '#38BDF8', '#10B981', '16px', '24px'],
        confirmText: 'Save Token'
      });
      if (!value) return;

      const group = this.doc.tokens[0];
      if (group) {
        group.tokens.push({
          id: `token_${Date.now()}`,
          name,
          type: value.startsWith('#') ? 'color' : 'dimension',
          value
        });
        this.renderTokensList();
        this.storage.scheduleAutosave(this.doc);
        this.showToast(`Token "${name}" added`, 'success');
      }
    });

    // Add Page button
    document.getElementById('btnAddNewPage')?.addEventListener('click', async () => {
      await this.addNewPage();
    });
  }

  updatePagesList() {
    const container = document.getElementById('pagesListContainer');
    if (!container) return;

    let html = '';
    const activePage = this.engine.getActivePage();
    if (!activePage) return;
    const activeId = activePage.id;
    const pageLabel = document.getElementById('currentPageLabel');
    if (pageLabel) pageLabel.textContent = activePage.name || 'Page 1';

    for (const p of this.doc.pages) {
      const isActive = p.id === activeId;
      const count = Object.keys(p.nodes).length;
      html += `
        <div class="page-list-item ${isActive ? 'active' : ''}" data-page-id="${p.id}">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 13px;"><span data-icon="FileText"></span></span>
            <span>${p.name}</span>
            <span style="font-size: 10px; color: var(--text-dim);">(${count})</span>
          </div>
          <div class="page-actions-group">
            <button class="btn-icon-xs btn-page-dup" data-id="${p.id}" title="Duplicate page"><span data-icon="Copy"></span></button>
            <button class="btn-icon-xs btn-page-ren" data-id="${p.id}" title="Rename page"><span data-icon="Pencil"></span></button>
            ${this.doc.pages.length > 1 ? `<button class="btn-icon-xs btn-page-del" data-id="${p.id}" title="Delete page" aria-label="Delete page"><span data-icon="X"></span></button>` : ''}
          </div>
        </div>
      `;
    }

    container.innerHTML = html;

    // Attach listeners
    container.querySelectorAll('.page-list-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        const pid = item.dataset.pageId;
        this.engine.setActivePage(pid);
        this.renderer.zoomToFit();
        this.updateRulers();
      });
    });

    container.querySelectorAll('.btn-page-dup').forEach(b => {
      b.addEventListener('click', () => {
        const clone = duplicatePageInDoc(this.doc, b.dataset.id);
        if (clone) {
          this.engine.setActivePage(clone.id);
        }
      });
    });

    container.querySelectorAll('.btn-page-ren').forEach(b => {
      b.addEventListener('click', async () => {
        const page = this.doc.pages.find(p => p.id === b.dataset.id);
        if (!page) return;
        const name = await this.showPromptModal({
          title: 'Rename Page',
          subtitle: 'Enter a new title for this page:',
          defaultValue: page.name,
          icon: 'Pencil',
          confirmText: 'Rename Page'
        });
        if (name && name.trim()) {
          renamePageInDoc(this.doc, b.dataset.id, name.trim());
          this.updatePagesList();
          const pLabel = document.getElementById('currentPageLabel');
          if (pLabel && this.engine.getActivePage()?.id === b.dataset.id) {
            pLabel.textContent = name.trim();
          }
          this.showToast(`Page renamed to "${name.trim()}"`, 'success');
        }
      });
    });

    container.querySelectorAll('.btn-page-del').forEach(b => {
      b.addEventListener('click', () => {
        if (confirm('Delete this page and all its layers?')) {
          deletePageFromDoc(this.doc, b.dataset.id);
          this.engine.setActivePage(this.doc.pages[0].id);
        }
      });
    });
  }

  bindEngineEvents() {
    this.engine.subscribe((eventType, detail) => {
      if (eventType === 'page-change') {
        this.updatePagesList();
      }
      this.renderer.render();
      this.updateLayersTree();
      this.updateInspector();
      this.updateAiContext();
      if (this.rightTabMode === 'prototype') this.updatePrototypePanel();
      if (this.rightTabMode === 'inspect') this.updateInspectPanel();
      if (this.rightTabMode === 'export') this.updateExportPanel();
      this.updateRulers();
      this.markActiveTabDirty(true);
      this.storage.scheduleAutosave(this.doc);

      // Update undo/redo buttons state
      const uBtn = document.getElementById('btnUndo');
      const rBtn = document.getElementById('btnRedo');
      if (uBtn) uBtn.style.opacity = this.engine.canUndo() ? '1' : '0.4';
      if (rBtn) rBtn.style.opacity = this.engine.canRedo() ? '1' : '0.4';

      // Update zoom indicator
      const zoomText = document.getElementById('zoomPercentText');
      if (zoomText) {
        zoomText.textContent = `${Math.round(this.renderer.zoom * 100)}%`;
      }
      const statusZoom = document.getElementById('statusZoomLevel');
      if (statusZoom) statusZoom.textContent = `${Math.round(this.renderer.zoom * 100)}%`;
    });
  }

  updateRulers() {
    const zoomPercent = `${Math.round(this.renderer.zoom * 100)}%`;
    const zoomText = document.getElementById('zoomPercentText');
    const statusZoom = document.getElementById('statusZoomLevel');
    if (zoomText) zoomText.textContent = zoomPercent;
    if (statusZoom) statusZoom.textContent = zoomPercent;

    const rh = document.getElementById('canvasRulerH');
    const rv = document.getElementById('canvasRulerV');
    if (!rh || !rv || !this.showRulers) return;

    // Display basic coordinate tick markers
    const origin = this.renderer.canvasToScreen(0, 0);
    rh.textContent = `  X: ${Math.round(-this.renderer.panX / this.renderer.zoom)} px`;
    rv.textContent = `  Y: ${Math.round(-this.renderer.panY / this.renderer.zoom)}`;
  }

  bindCanvasEvents() {
    const { canvas, renderer, engine } = this;
    this.canvasEventController?.abort();
    this.canvasEventController = new AbortController();
    const listenerOptions = { signal: this.canvasEventController.signal };

    // Wheel zooming & panning
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        const factor = e.deltaY < 0 ? 1.15 : 0.85;
        renderer.setZoom(renderer.zoom * factor, e.clientX, e.clientY);
      } else {
        renderer.panBy(-e.deltaX, -e.deltaY);
      }
      this.updateRulers();
    }, { ...listenerOptions, passive: false });

    // Canvas Context Menu (Right-click)
    canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const coords = renderer.screenToCanvas(e.clientX, e.clientY);
      const hitNodeId = renderer.hitTest(coords.x, coords.y);
      if (hitNodeId && !engine.getSelection().includes(hitNodeId)) {
        engine.setSelection([hitNodeId]);
      }
      const ctxMenu = document.getElementById('canvasContextMenu');
      if (ctxMenu) {
        ctxMenu.style.display = 'block';
        ctxMenu.style.left = `${Math.min(e.clientX, window.innerWidth - 220)}px`;
        ctxMenu.style.top = `${Math.min(e.clientY, window.innerHeight - 260)}px`;
      }
    }, listenerOptions);

    canvas.addEventListener('mousedown', async (e) => {
      if (e.button === 2) return; // Right-click handled by contextmenu

      const isMiddle = e.button === 1;
      const isHand = this.isHandMode || this.currentTool === 'hand' || isMiddle;

      if (isHand) {
        this.dragState = { type: 'pan', startX: e.clientX, startY: e.clientY };
        canvas.style.cursor = 'grabbing';
        return;
      }

      const canvasCoords = renderer.screenToCanvas(e.clientX, e.clientY);

      // 1. Check Comment tool
      if (this.currentTool === 'comment') {
        const author = 'Product Designer';
        const text = await this.showPromptModal({
          title: 'Add Design Review Comment',
          subtitle: `Drop pin at (${Math.round(canvasCoords.x)}, ${Math.round(canvasCoords.y)})`,
          multiline: true,
          icon: 'MessageSquare',
          placeholder: 'Type your feedback, question, or design approval note...',
          confirmText: 'Post Pin'
        });
        if (text && text.trim()) {
          addCommentToDoc(this.doc, {
            x: Math.round(canvasCoords.x),
            y: Math.round(canvasCoords.y),
            pageId: engine.getActivePage().id,
            author,
            text: text.trim()
          });
          renderer.render();
          this.storage.scheduleAutosave(this.doc);
          this.showToast('Comment pin placed', 'success');
        }
        this.setTool('select');
        return;
      }

      // Check if clicking existing comment pin
      const hitComment = renderer.hitTestComment(canvasCoords.x, canvasCoords.y);
      if (hitComment) {
        const popup = document.getElementById('commentPopupCard');
        if (popup) {
          popup.style.display = 'block';
          popup.style.left = `${e.clientX + 10}px`;
          popup.style.top = `${e.clientY + 10}px`;
          document.getElementById('commentAuthorText').textContent = `${hitComment.author} (${new Date(hitComment.createdAt).toLocaleTimeString()})`;
          document.getElementById('commentContentText').textContent = hitComment.text;
          const resolveBtn = document.getElementById('btnResolveComment');
          resolveBtn.textContent = hitComment.resolved ? 'Re-open Note' : 'Mark Resolved';
          resolveBtn.onclick = () => {
            resolveCommentInDoc(this.doc, hitComment.id);
            renderer.render();
            popup.style.display = 'none';
          };
        }
        return;
      }

      // 1.5 Shape Builder Tool Interaction (§9.2, §32.4.K, §32.6.B)
      if (this.currentTool === 'shape_builder') {
        const selectedIds = engine.getSelection();
        if (selectedIds.length < 2) {
          this.showToast('Select 2 or more overlapping shapes to use Shape Builder.', 'warning');
          return;
        }
        this.dragState = {
          type: 'shape_builder',
          isSubtract: !!(e.altKey),
          touchedIds: new Set()
        };
        const rawHit = renderer.hitTest(canvasCoords.x, canvasCoords.y);
        if (rawHit && selectedIds.includes(rawHit)) {
          this.dragState.touchedIds.add(rawHit);
        }
        return;
      }

      // 2. Shape Creation Tools
      if (this.currentTool !== 'select') {
        this.dragState = {
          type: 'create',
          tool: this.currentTool,
          startX: canvasCoords.x,
          startY: canvasCoords.y,
          currentX: canvasCoords.x,
          currentY: canvasCoords.y
        };
        renderer.creationPreview = {
          tool: this.currentTool,
          x: canvasCoords.x,
          y: canvasCoords.y,
          width: 0,
          height: 0
        };
        return;
      }

      // 3. Resize Handle & Transform Pivot Hit-test
      const selectedIds = engine.getSelection();
      const page = engine.getActivePage();
      if (selectedIds.length === 1) {
        const bounds = computeWorldBounds(page, selectedIds[0]);
        const node = engine.getNode(selectedIds[0]);
        if (node && !node.locked && renderer.hitTestPivot(canvasCoords.x, canvasCoords.y, bounds, node)) {
          const px = node.transform?.pivot?.x !== undefined ? node.transform.pivot.x : 0.5;
          const py = node.transform?.pivot?.y !== undefined ? node.transform.pivot.y : 0.5;
          this.dragState = {
            type: 'pivot',
            moved: false,
            nodeId: selectedIds[0],
            bounds,
            startPivot: { x: px, y: py },
            startX: canvasCoords.x,
            startY: canvasCoords.y
          };
          return;
        }

        const handle = renderer.hitTestHandle(canvasCoords.x, canvasCoords.y, bounds);
        if (handle && node && !node.locked) {
          this.dragState = {
            type: 'resize',
            handle,
            moved: false,
            nodeId: selectedIds[0],
            startBounds: { ...bounds },
            startTransform: { ...node.transform },
            initialTransforms: [{ id: node.id, transform: { ...node.transform } }],
            startX: e.clientX,
            startY: e.clientY
          };
          return;
        }
      }

      // 4. Hit-test canvas objects
      const rawHitNodeId = renderer.hitTest(canvasCoords.x, canvasCoords.y);
      const isDeepSelect = !!(e.metaKey || e.ctrlKey);
      const hitNodeId = this.resolveSelectionTarget(rawHitNodeId, isDeepSelect);

      if (hitNodeId) {
        if (e.shiftKey) {
          engine.selectToggle(hitNodeId);
        } else if (!selectedIds.includes(hitNodeId)) {
          engine.setSelection([hitNodeId]);
        }

        const node = engine.getNode(hitNodeId);
        const shiftRemovedNode = e.shiftKey && selectedIds.includes(hitNodeId);
        if (node && !node.locked && !shiftRemovedNode) {
          const movableIds = engine.getSelection().filter(id => !engine.getNode(id)?.locked);
          this.dragState = {
            type: 'move',
            moved: false,
            startX: canvasCoords.x,
            startY: canvasCoords.y,
            lastX: canvasCoords.x,
            lastY: canvasCoords.y,
            nodeIds: movableIds,
            initialTransforms: movableIds.map(id => {
              const n = engine.getNode(id);
              return { id, transform: { ...n.transform } };
            })
          };
        }
      } else {
        // Clicked empty canvas -> Marquee selection
        if (!e.shiftKey) engine.clearSelection();
        this.dragState = { type: 'marquee', startX: canvasCoords.x, startY: canvasCoords.y };
        renderer.marquee = { startX: canvasCoords.x, startY: canvasCoords.y, currentX: canvasCoords.x, currentY: canvasCoords.y };
      }
    }, listenerOptions);

    window.addEventListener('mousemove', (e) => {
      const canvasCoords = renderer.screenToCanvas(e.clientX, e.clientY);

      if (!this.dragState) {
        // Distance measurement on Alt / Option hover
        if (e.altKey && engine.getSelection().length > 0) {
          const hoveredId = renderer.hitTest(canvasCoords.x, canvasCoords.y);
          if (hoveredId && hoveredId !== engine.getSelection()[0]) {
            renderer.altMeasureActive = true;
            renderer.hoveredNodeId = hoveredId;
            renderer.render();
          } else if (renderer.altMeasureActive) {
            renderer.altMeasureActive = false;
            renderer.render();
          }
        } else if (renderer.altMeasureActive) {
          renderer.altMeasureActive = false;
          renderer.render();
        }
        return;
      }

      if (this.dragState.type === 'pan') {
        const dx = e.clientX - this.dragState.startX;
        const dy = e.clientY - this.dragState.startY;
        renderer.panBy(dx, dy);
        this.dragState.startX = e.clientX;
        this.dragState.startY = e.clientY;
        this.updateRulers();
        return;
      }

      if (this.dragState.type === 'create') {
        this.dragState.currentX = canvasCoords.x;
        this.dragState.currentY = canvasCoords.y;
        renderer.creationPreview = {
          tool: this.dragState.tool,
          x: Math.min(this.dragState.startX, canvasCoords.x),
          y: Math.min(this.dragState.startY, canvasCoords.y),
          width: Math.abs(canvasCoords.x - this.dragState.startX),
          height: Math.abs(canvasCoords.y - this.dragState.startY)
        };
        renderer.render();
      } else if (this.dragState.type === 'move') {
        const dx = canvasCoords.x - this.dragState.lastX;
        const dy = canvasCoords.y - this.dragState.lastY;
        if (dx || dy) this.dragState.moved = true;

        for (const id of this.dragState.nodeIds) {
          const n = engine.getNode(id);
          if (n && n.transform) {
            n.transform.x += dx;
            n.transform.y += dy;
          }
        }

        const page = engine.getActivePage();
        const firstBounds = computeWorldBounds(page, this.dragState.nodeIds[0]);
        if (firstBounds) {
          const { guides } = findSnapGuides(page, firstBounds, this.dragState.nodeIds);
          renderer.snapGuides = guides;
        }

        this.dragState.lastX = canvasCoords.x;
        this.dragState.lastY = canvasCoords.y;
        renderer.render();
      } else if (this.dragState.type === 'resize') {
        const { handle, nodeId, startTransform } = this.dragState;
        const deltaX = (e.clientX - this.dragState.startX) / renderer.zoom;
        const deltaY = (e.clientY - this.dragState.startY) / renderer.zoom;
        if (deltaX || deltaY) this.dragState.moved = true;
        const node = engine.getNode(nodeId);

        let newW = startTransform.width;
        let newH = startTransform.height;
        let newX = startTransform.x;
        let newY = startTransform.y;

        if (handle.includes('e')) newW = Math.max(20, startTransform.width + deltaX);
        if (handle.includes('s')) newH = Math.max(20, startTransform.height + deltaY);
        if (handle.includes('w')) {
          newW = Math.max(20, startTransform.width - deltaX);
          newX = startTransform.x + (startTransform.width - newW);
        }
        if (handle.includes('n')) {
          newH = Math.max(20, startTransform.height - deltaY);
          newY = startTransform.y + (startTransform.height - newH);
        }

        node.transform.width = Math.round(newW);
        node.transform.height = Math.round(newH);
        node.transform.x = Math.round(newX);
        node.transform.y = Math.round(newY);
        renderer.render();
        this.updateInspector();
      } else if (this.dragState.type === 'shape_builder') {
        const rawHit = renderer.hitTest(canvasCoords.x, canvasCoords.y);
        const selectedIds = engine.getSelection();
        if (rawHit && selectedIds.includes(rawHit)) {
          this.dragState.touchedIds.add(rawHit);
        }
      } else if (this.dragState.type === 'pivot') {
        const { bounds, nodeId } = this.dragState;
        const node = engine.getNode(nodeId);
        if (node && bounds.width > 0 && bounds.height > 0) {
          let px = (canvasCoords.x - bounds.x) / bounds.width;
          let py = (canvasCoords.y - bounds.y) / bounds.height;
          const snapPoints = [0, 0.5, 1];
          for (const sp of snapPoints) {
            if (Math.abs(px - sp) < 0.06) px = sp;
            if (Math.abs(py - sp) < 0.06) py = sp;
          }
          if (!node.transform) node.transform = {};
          node.transform.pivot = { x: Math.round(px * 100) / 100, y: Math.round(py * 100) / 100 };
          this.dragState.moved = true;
          renderer.render();
          this.updateInspector();
        }
      } else if (this.dragState.type === 'marquee') {
        renderer.marquee.currentX = canvasCoords.x;
        renderer.marquee.currentY = canvasCoords.y;
        renderer.render();
      }
    }, listenerOptions);

    window.addEventListener('mouseup', () => {
      if (!this.dragState) return;

      if (this.dragState.type === 'shape_builder') {
        const selectedIds = engine.getSelection();
        const isSubtract = this.dragState.isSubtract;
        const op = isSubtract ? 'subtract' : 'union';
        if (selectedIds.length >= 2) {
          const groupId = this.engine.booleanGroup(selectedIds, op);
          if (groupId) {
            renderer.render();
            this.updateLayersTree();
            this.updateInspector();
            this.showToast(isSubtract ? 'Shape Builder: Subtracted overlapping region' : 'Shape Builder: Merged regions into shape', 'success');
          }
        }
      } else if (this.dragState.type === 'pivot') {
        if (this.dragState.moved) {
          const node = engine.getNode(this.dragState.nodeId);
          if (node?.transform?.pivot) {
            this.engine.updateNode(this.dragState.nodeId, { transform: { pivot: { ...node.transform.pivot } } }, 'Move Pivot Point');
          }
        }
      } else if (this.dragState.type === 'move') {
        renderer.snapGuides = [];
        if (this.dragState.moved) engine.commitTransforms(this.dragState.initialTransforms, 'Move objects');
      } else if (this.dragState.type === 'resize') {
        if (this.dragState.moved) engine.commitTransforms(this.dragState.initialTransforms, 'Resize object');
      } else if (this.dragState.type === 'create') {
        const { tool, startX, startY, currentX, currentY } = this.dragState;
        const width = Math.abs(currentX - startX);
        const height = Math.abs(currentY - startY);
        const dragged = width >= 2 || height >= 2;
        const bounds = dragged ? {
          x: Math.min(startX, currentX),
          y: Math.min(startY, currentY),
          width,
          height
        } : null;
        renderer.creationPreview = null;
        this.handleShapeCreation(tool, { x: startX, y: startY }, bounds);
        this.setTool('select');
      } else if (this.dragState.type === 'marquee') {
        renderer.marquee = null;
        renderer.render();
      }

      this.dragState = null;
      canvas.style.cursor = this.isHandMode ? 'grab' : 'default';
    }, listenerOptions);

    window.addEventListener('keyup', (e) => {
      if (e.key === 'Alt' && renderer.altMeasureActive) {
        renderer.altMeasureActive = false;
        renderer.render();
      }
    }, listenerOptions);

    // Double click on canvas object
    canvas.addEventListener('dblclick', async (e) => {
      // If already in Vector Edit Mode, double clicking anywhere exits it
      if (this.isVectorEditMode) {
        this.isVectorEditMode = false;
        this.renderer.isVectorEditMode = false;
        this.renderer.render();
        this.showToast('Exited Vector Edit Mode');
        return;
      }

      const coords = renderer.screenToCanvas(e.clientX, e.clientY);
      const hitId = renderer.hitTest(coords.x, coords.y);

      if (!hitId) return;

      const node = engine.getNode(hitId);
      if (!node) return;

      // 1. Text Layer: activate direct inline canvas text editing
      if (node.type === 'text') {
        engine.setSelection([hitId]);
        this.startInlineCanvasTextEdit(node, e.clientX, e.clientY);
        return;
      }

      const currentSelection = engine.getSelection();

      // 2. Container (Frame, Group, Boolean Group) with children:
      // If a container is currently selected, drill down into the child directly under cursor
      if (currentSelection.length === 1) {
        const selNode = engine.getNode(currentSelection[0]);
        if (selNode && selNode.childIds && selNode.childIds.length > 0) {
          let targetChildId = null;
          for (let i = selNode.childIds.length - 1; i >= 0; i--) {
            const cid = selNode.childIds[i];
            const match = renderer.hitTestRecursive(engine.getActivePage(), cid, coords.x, coords.y);
            if (match) {
              targetChildId = match;
              break;
            }
          }
          if (targetChildId) {
            engine.setSelection([targetChildId]);
            const childNode = engine.getNode(targetChildId);
            if (childNode?.type === 'text') {
              this.startInlineCanvasTextEdit(childNode, e.clientX, e.clientY);
            } else {
              this.showToast(`Selected: ${childNode?.name || 'Inner Layer'}`);
            }
            return;
          }
        }

        // If the selected node is already this shape, enter Vector Edit Mode (Figma behavior)
        if (currentSelection[0] === hitId && ['rectangle', 'ellipse', 'star', 'polygon', 'line', 'vector', 'boolean_group'].includes(selNode?.type)) {
          this.isVectorEditMode = true;
          this.renderer.isVectorEditMode = true;
          this.renderer.render();
          this.showToast(`Vector Edit Mode: editing ${selNode.name}. Press Esc to exit.`);
          return;
        }
      }

      // 3. Leaf Geometry Nodes (Vector, Rectangle, Ellipse, Star, Polygon, Line, Boolean Group):
      // Enter Vector Edit Mode (Figma P / Enter anchor points editing)
      if (['rectangle', 'ellipse', 'star', 'polygon', 'line', 'vector', 'boolean_group'].includes(node.type)) {
        engine.setSelection([hitId]);
        this.isVectorEditMode = true;
        this.renderer.isVectorEditMode = true;
        this.renderer.render();
        this.showToast(`Vector Edit Mode: editing ${node.name}. Press Esc to exit.`);
      } else if (node.childIds && node.childIds.length > 0) {
        this.drillInSelection();
      }
    }, listenerOptions);
  }

  startInlineCanvasTextEdit(node, clientX, clientY) {
    if (!node || node.type !== 'text') return;

    let existing = document.getElementById('canvasInlineTextEditor');
    if (existing) existing.remove();

    const renderer = this.renderer;
    const page = this.engine.getActivePage();
    const bounds = computeWorldBounds(page, node.id);
    if (!bounds) return;

    const p1 = renderer.canvasToScreen(bounds.x, bounds.y);
    const p2 = renderer.canvasToScreen(bounds.x + bounds.width, bounds.y + bounds.height);
    const screenW = Math.max(90, p2.x - p1.x);
    const screenH = Math.max(26, p2.y - p1.y);

    const textarea = document.createElement('textarea');
    textarea.id = 'canvasInlineTextEditor';
    textarea.value = node.text?.content || '';
    textarea.style.position = 'fixed';
    textarea.style.left = `${Math.round(p1.x)}px`;
    textarea.style.top = `${Math.round(p1.y)}px`;
    textarea.style.width = `${Math.round(screenW + 24)}px`;
    textarea.style.height = `${Math.round(screenH + 12)}px`;
    textarea.style.zIndex = '1000';
    textarea.style.background = 'rgba(15, 23, 42, 0.95)';
    textarea.style.color = node.text?.color || '#ffffff';
    textarea.style.fontFamily = node.text?.fontFamily || 'Inter, sans-serif';
    textarea.style.fontSize = `${Math.max(12, Math.round((node.text?.fontSize || 14) * renderer.zoom))}px`;
    textarea.style.fontWeight = node.text?.fontWeight || '400';
    textarea.style.border = '2px solid #38bdf8';
    textarea.style.borderRadius = '4px';
    textarea.style.padding = '4px 6px';
    textarea.style.outline = 'none';
    textarea.style.resize = 'both';
    textarea.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.6), 0 0 0 3px rgba(56, 189, 248, 0.3)';

    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    let committed = false;
    const commit = () => {
      if (committed) return;
      committed = true;
      const val = textarea.value;
      textarea.remove();
      if (val !== (node.text?.content || '')) {
        this.engine.updateNode(node.id, { text: { content: val } }, 'Edit text');
      }
    };

    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey || !node.text?.multiline)) {
        e.preventDefault();
        commit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        committed = true;
        textarea.remove();
      }
      e.stopPropagation();
    });

    textarea.addEventListener('blur', () => {
      commit();
    });
  }

  handleShapeCreation(tool, coords, bounds = null) {
    let node;
    const x = Math.round(bounds?.x ?? coords.x);
    const y = Math.round(bounds?.y ?? coords.y);
    const width = Math.max(2, Math.round(bounds?.width || 0));
    const height = Math.max(2, Math.round(bounds?.height || 0));
    const transform = (defaultWidth, defaultHeight) => ({
      x,
      y,
      width: bounds ? width : defaultWidth,
      height: bounds ? height : defaultHeight
    });

    if (tool === 'frame') {
      node = createNode('frame', { name: 'New Frame', transform: transform(360, 240) });
    } else if (tool === 'section') {
      node = createNode('section', { name: 'Section', transform: transform(360, 240) });
    } else if (tool === 'slice') {
      node = createNode('slice', { name: 'Slice', transform: transform(120, 80) });
    } else if (tool === 'rectangle') {
      node = createNode('rectangle', { name: 'Rectangle', transform: transform(120, 80) });
    } else if (tool === 'ellipse') {
      node = createNode('ellipse', { name: 'Circle', transform: transform(80, 80) });
    } else if (tool === 'line') {
      node = createNode('line', { name: 'Line', transform: transform(140, 2) });
    } else if (tool === 'star') {
      node = createNode('star', { name: 'Star', transform: transform(64, 64) });
    } else if (tool === 'polygon') {
      node = createNode('polygon', { name: 'Polygon', transform: transform(72, 72) });
    } else if (tool === 'image') {
      node = createNode('image', { name: 'Image Box', transform: transform(240, 160) });
    } else if (tool === 'text') {
      node = createNode('text', {
        name: 'Heading',
        transform: transform(200, 32),
        text: { content: 'New Text Block', fontSize: 18, fontWeight: '600' }
      });
    } else if (tool === 'button') {
      node = createNode('button', { name: 'Button / Primary', transform: transform(140, 44) });
      const txt = createNode('text', {
        parentId: node.id,
        name: 'Button Label',
        transform: { x: 0, y: 0, width: 100, height: 20 },
        text: { content: 'Action Button', fontSize: 14, fontWeight: '600', color: '#ffffff', textAlign: 'center' }
      });
      node.childIds.push(txt.id);
      this.engine.addNode(node, null, 'Create Button Component');
      this.engine.getActivePage().nodes[txt.id] = txt;
      return;
    }

    if (node) {
      this.engine.addNode(node, null, `Create ${node.name}`);
    }
  }

  setTool(tool) {
    this.currentTool = tool;
    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tool === tool);
    });
    document.querySelectorAll('.tool-menu-group').forEach(group => {
      const tools = group.dataset.toolGroup.split(',');
      group.classList.toggle('has-active-tool', tools.includes(tool));
      group.classList.remove('open');
      group.querySelector('.tool-group-toggle')?.setAttribute('aria-expanded', 'false');
    });

    // Update Axiom Status Bar Tool Hint (Section 3.1 & 3.2)
    const hints = {
      select: 'Tool: Select / Move (V) • Hold Space to Pan Canvas',
      scale: 'Tool: Scale (K)',
      hand: 'Tool: Hand / Pan Canvas (H or hold Space)',
      frame: 'Tool: Frame / Artboard (F) • Click & drag on canvas',
      section: 'Tool: Section Tool (⇧S) • Group visual frames',
      slice: 'Tool: Slice / Export Region (S)',
      rectangle: 'Tool: Rectangle (R) • Click & drag',
      ellipse: 'Tool: Ellipse (O) • Click & drag',
      line: 'Tool: Line (L) • Shift for 45° snaps',
      pen: 'Tool: Pen / Vector Path (P)',
      star: 'Tool: Star Shape',
      polygon: 'Tool: Polygon / Triangle Shape',
      shape_builder: 'Tool: Shape Builder (⇧M) • Drag across overlapping shapes to merge (hold Alt to subtract)',
      text: 'Tool: Text (T) • Click canvas to type',
      comment: 'Tool: Comment (C) • Click canvas to pin review note',
      ai: 'Tool: AI Assistant (⌘⇧K)'
    };
    const hintEl = document.getElementById('statusToolHint');
    if (hintEl) hintEl.textContent = hints[tool] || `Tool: ${tool}`;

    if (tool === 'shape_builder') {
      const sel = this.engine.getSelection();
      if (sel.length < 2) {
        this.showToast('Shape Builder: Select 2 or more overlapping shapes to merge or subtract', 'info');
      } else {
        this.showToast('Shape Builder: Drag across regions to merge, hold Alt to subtract', 'info');
      }
    }
  }

  normalizeHexColor(value, fallback = '#3B82F6') {
    const color = String(value || '').trim();
    return /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(color)
      ? color.toUpperCase()
      : fallback;
  }

  getDocumentColorPalette() {
    return collectDocumentColors(this.doc);
  }

  getDocumentColorTokens() {
    return (this.doc.tokens || []).flatMap(group =>
      (group.tokens || []).filter(token =>
        token.type === 'color' &&
        /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(String(token.value))
      ).map(token => ({ name: token.name, value: token.value }))
    );
  }

  openPageColorPicker(targetElement, page) {
    const initialColor = this.normalizeHexColor(page.background, '#090D16');
    let committedColor = initialColor;
    this.colorPicker.open({
      targetElement,
      initialColor,
      documentColors: this.getDocumentColorPalette(),
      designTokens: this.getDocumentColorTokens(),
      onInput: color => {
        page.background = color;
        const input = document.getElementById('propPageBg');
        if (input) input.value = color;
        targetElement.style.background = color;
        this.renderer.render();
        this.refreshOpenPrototypePreview();
      },
      onChange: color => {
        committedColor = this.normalizeHexColor(color, committedColor);
        page.background = committedColor;
        const input = document.getElementById('propPageBg');
        if (input) input.value = committedColor;
        targetElement.style.background = committedColor;
        this.renderer.render();
        this.storage.scheduleAutosave(this.doc);
        this.refreshOpenPrototypePreview();
      }
    });
  }

  openNodeColorPicker(targetElement, color, options) {
    const initialColor = this.normalizeHexColor(color, '#3B82F6');
    let committedColor = initialColor;
    const syncColorControls = nextColor => {
      if (options.gradient && options.gradient.type?.includes('gradient')) {
        const stops = options.gradient.stops || [];
        targetElement.style.background = `linear-gradient(135deg, ${stops[0]?.color || '#334155'}, ${stops[1]?.color || '#8B5CF6'})`;
      } else {
        targetElement.style.background = nextColor;
      }
      const input = targetElement.closest('.props-row')?.querySelector('input');
      if (input && !options.gradient) input.value = nextColor;
    };
    this.colorPicker.open({
      targetElement,
      initialColor,
      documentColors: this.getDocumentColorPalette(),
      designTokens: this.getDocumentColorTokens(),
      contrastBackground: this.engine.getActivePage()?.background || '#090D16',
      mode: options.mode || (options.gradient ? 'gradient' : 'solid'),
      gradient: options.gradient || null,
      activeStopIndex: options.activeStopIndex || 0,
      onInput: nextColor => {
        const previewColor = this.normalizeHexColor(nextColor, committedColor);
        if (options.preview) options.preview(previewColor);
        syncColorControls(previewColor);
        this.renderer.render();
        this.refreshOpenPrototypePreview();
      },
      onChange: nextColor => {
        const colorToCommit = this.normalizeHexColor(nextColor, committedColor);
        if (options.preview) options.preview(committedColor);
        syncColorControls(colorToCommit);
        if (colorToCommit !== committedColor && options.commit) {
          this.engine.updateNode(options.node.id, options.commit(colorToCommit), options.description);
          committedColor = colorToCommit;
        }
      },
      onGradientChange: nextGradient => {
        if (options.onGradientChange) {
          options.onGradientChange(nextGradient);
          syncColorControls();
          this.renderer.render();
          this.refreshOpenPrototypePreview();
        }
      }
    });
  }

  getCanvasCenter() {
    const rect = this.canvas.getBoundingClientRect();
    return this.renderer.screenToCanvas(rect.left + rect.width / 2, rect.top + rect.height / 2);
  }

  setHandMode(active) {
    this.isHandMode = active;
    const canvas = document.getElementById('canvas2d');
    if (canvas) canvas.classList.toggle('hand-mode', active);
  }

  // --- Numeric Expression Evaluator (supports 100+24, 20*2, etc.) ---
  evalExpr(val, fallback = 0) {
    if (typeof val === 'number') return val;
    if (!val || typeof val !== 'string') return fallback;
    const clean = val.trim().replace(/[^0-9+\-*/.()]/g, '');
    if (!clean) return fallback;
    try {
      const res = new Function(`return (${clean})`)();
      return typeof res === 'number' && !isNaN(res) ? Math.round(res * 100) / 100 : fallback;
    } catch {
      const parsed = parseFloat(clean);
      return !isNaN(parsed) ? parsed : fallback;
    }
  }

  // --- Numeric Label Scrubbing ---
  makeScrubbable(element, onScrub, step = 1) {
    if (!element) return;
    element.classList.add('scrubbable');
    let startX = 0;
    let isDragging = false;

    const onMouseDown = (e) => {
      isDragging = true;
      startX = e.clientX;
      document.body.style.cursor = 'ew-resize';
      const onMouseMove = (moveEvent) => {
        if (!isDragging) return;
        const delta = moveEvent.clientX - startX;
        startX = moveEvent.clientX;
        const multiplier = moveEvent.shiftKey ? 10 : 1;
        onScrub(delta * step * multiplier);
      };
      const onMouseUp = () => {
        if (isDragging) {
          isDragging = false;
          document.body.style.cursor = 'default';
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup', onMouseUp);
        }
      };
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      e.preventDefault();
    };

    element.addEventListener('mousedown', onMouseDown);
  }

  // Extract all distinct colors from selection for Selection Colors section
  extractSelectionColors(selectedIds, page) {
    return collectSelectionColors(page, selectedIds, this.dsRegistry.getAllTokens());
  }

  // --- Contextual Figma-Identical Design Tab Inspector (Section 4.1 & Appendix A2.2) ---
  updateInspector() {
    const selectedIds = this.engine.getSelection();
    const container = document.getElementById('inspectorProperties');
    const badge = document.getElementById('selectionCountBadge');
    const title = document.getElementById('inspectorSelectionTitle');
    const summaryEl = document.getElementById('statusSelectionSummary');
    if (!container) return;

    if (badge) badge.textContent = `${selectedIds.length} selected`;

    // Update Status Bar Selection Summary (Section 3.1 & 3.2)
    if (summaryEl) {
      if (selectedIds.length === 0) {
        summaryEl.textContent = 'Selected: None • Canvas';
      } else if (selectedIds.length === 1) {
        const node = this.engine.getNode(selectedIds[0]);
        summaryEl.textContent = `Selected: ${node?.type || 'node'} "${node?.name || 'Unnamed'}" (${Math.round(node?.transform?.width || 0)} × ${Math.round(node?.transform?.height || 0)})`;
      } else {
        summaryEl.textContent = `Selected: ${selectedIds.length} objects`;
      }
    }

    // 1. When Nothing is Selected: Canvas & Page Settings
    if (selectedIds.length === 0) {
      if (title) title.textContent = 'Page Canvas';
      const page = this.engine.getActivePage();
      const tokens = this.linter.getAllTokens();

      container.innerHTML = `
        <!-- Canvas Background & Layout Grid Settings -->
        <div class="section-group">
          <div class="section-title">Canvas Settings</div>
          <div class="props-row">
            <button type="button" class="color-swatch-box" id="swatchPageBackground"
              style="background: ${page.background || '#090d16'};" title="Choose canvas background color"
              aria-label="Choose canvas background color"></button>
            <div class="prop-field">
              <span class="prop-label">Background</span>
              <input type="text" class="prop-input" id="propPageBg" value="${page.background || '#090d16'}">
            </div>
          </div>
          <div class="props-row" style="margin-top: 10px;">
            <label style="display: flex; align-items: center; gap: 8px; font-size: 11px; color: var(--text-muted); cursor: pointer;">
              <input type="checkbox" id="chkShowLayoutGrid" ${this.renderer.showLayoutGrid ? 'checked' : ''}>
              <span>Show 12-Column Layout Grid Overlay</span>
            </label>
          </div>
        </div>

        <!-- Responsive Breakpoint Switcher Section -->
        <div class="section-group">
          <div class="section-title">Responsive Artboards</div>
          <div style="display: flex; gap: 6px;">
            <button class="btn-inspector-action" id="btnInspBpDesktop" style="font-size: 11px;"><span data-icon="Monitor"></span> Desktop (1440)</button>
            <button class="btn-inspector-action" id="btnInspBpTablet" style="font-size: 11px;"><span data-icon="Tablet"></span> Tablet (768)</button>
            <button class="btn-inspector-action" id="btnInspBpMobile" style="font-size: 11px;"><span data-icon="Tablet"></span> Mobile (375)</button>
          </div>
        </div>

        <!-- Document Local Variables & Design Tokens Summary -->
        <div class="section-group">
          <div class="section-title">
            <span>Design Tokens (${tokens.length})</span>
            <button class="btn-icon-xs" id="btnInspAddToken" title="Add token">+</button>
          </div>
          <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px;">
            ${tokens.slice(0, 10).map(t => `
              <span class="token-chip-badge" title="${t.name}: ${t.value}">
                ${t.type === 'color' ? `<span style="width: 8px; height: 8px; border-radius: 50%; background: ${t.value}; display: inline-block;"></span>` : ''}
                ${t.name}
              </span>
            `).join('')}
          </div>
        </div>

        <div class="empty-inspector-note">
          <p>Select any layer on canvas to inspect alignment, auto layout, typography, fills, strokes, and effects.</p>
        </div>
      `;

      document.getElementById('propPageBg')?.addEventListener('change', (e) => {
        const color = this.normalizeHexColor(e.target.value, page.background || '#090d16');
        page.background = color;
        e.target.value = color;
        const swatch = document.getElementById('swatchPageBackground');
        if (swatch) swatch.style.background = color;
        this.renderer.render();
        this.storage.scheduleAutosave(this.doc);
      });
      document.getElementById('swatchPageBackground')?.addEventListener('click', (e) => {
        this.openPageColorPicker(e.currentTarget, page);
      });

      document.getElementById('chkShowLayoutGrid')?.addEventListener('change', (e) => {
        this.renderer.showLayoutGrid = e.target.checked;
        this.renderer.render();
      });

      document.getElementById('btnInspBpDesktop')?.addEventListener('click', () => this.switchBreakpoint('desktop'));
      document.getElementById('btnInspBpTablet')?.addEventListener('click', () => this.switchBreakpoint('tablet'));
      document.getElementById('btnInspBpMobile')?.addEventListener('click', () => this.switchBreakpoint('mobile'));
      document.getElementById('btnInspAddToken')?.addEventListener('click', async () => {
        const val = await this.showPromptModal({
          title: 'Add Color Token',
          subtitle: 'Enter color hex value or select a preset swatch:',
          defaultValue: '#6366F1',
          presets: ['#6366F1', '#4F46E5', '#38BDF8', '#10B981', '#F59E0B', '#EF4444', '#FFFFFF', '#0F172A'],
          icon: 'Palette',
          confirmText: 'Add Token'
        });
        if (val) {
          this.engine.doc.tokens[0].tokens.push({
            id: `token_${Date.now()}`,
            name: `Custom / ${val}`,
            type: 'color',
            value: val
          });
          this.updateInspector();
          this.showToast(`Token for ${val} added`, 'success');
        }
      });
      return;
    }

    const page = this.engine.getActivePage();
    const node = this.engine.getNode(selectedIds[0]);
    if (!node) return;
    if (title) title.textContent = selectedIds.length === 1 ? node.name : `${selectedIds.length} layers selected`;

    const t = node.transform || { x: 0, y: 0, width: 100, height: 100, rotation: 0 };
    const l = node.layout || { mode: 'none', gap: 0, paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0, alignItems: 'start', justifyContent: 'flex-start', sizingHorizontal: 'fixed', sizingVertical: 'fixed' };
    const s = node.style || {};
    const radius = s.cornerRadius !== undefined ? s.cornerRadius : 0;
    const isQuadRadius = typeof radius === 'object' && radius !== null;
    const radTL = isQuadRadius ? (radius.topLeft || 0) : radius;
    const radTR = isQuadRadius ? (radius.topRight || 0) : radius;
    const radBR = isQuadRadius ? (radius.bottomRight || 0) : radius;
    const radBL = isQuadRadius ? (radius.bottomLeft || 0) : radius;
    const px = t.pivot?.x !== undefined ? t.pivot.x : 0.5;
    const py = t.pivot?.y !== undefined ? t.pivot.y : 0.5;

    const fills = s.fills || [];
    const strokes = s.strokes && s.strokes.length > 0 ? s.strokes : [];
    const shadows = s.shadows && s.shadows.length > 0 ? s.shadows : [];
    const isText = node.type === 'text';
    const isImage = node.type === 'image';
    const hasAutoLayout = l.mode && l.mode !== 'none';
    const selectionColors = this.extractSelectionColors(selectedIds, page);

    container.innerHTML = `
      <!-- 1. Top Alignment & Distribution Bar (Figma Inspector Header) -->
      <div class="inspector-align-bar">
        <button class="btn-align-tool" id="inspAlignLeft" title="Align Left (⌥A)">⇤</button>
        <button class="btn-align-tool" id="inspAlignHCenter" title="Align Horizontal Centers (⌥H)"><span data-icon="ArrowLeftRight"></span></button>
        <button class="btn-align-tool" id="inspAlignRight" title="Align Right (⌥D)">⇥</button>
        <button class="btn-align-tool" id="inspAlignTop" title="Align Top (⌥W)"><span data-icon="ArrowUp"></span></button>
        <button class="btn-align-tool" id="inspAlignVCenter" title="Align Vertical Centers (⌥V)"><span data-icon="ArrowUpDown"></span></button>
        <button class="btn-align-tool" id="inspAlignBottom" title="Align Bottom (⌥S)"><span data-icon="ArrowDown"></span></button>
        <div class="shelf-divider" style="height: 14px;"></div>
        <button class="btn-align-tool" id="inspDistH" title="Distribute Horizontal Spacing"><span data-icon="ArrowLeftRight"></span></button>
        <button class="btn-align-tool" id="inspDistV" title="Distribute Vertical Spacing"><span data-icon="ArrowUpDown"></span></button>
      </div>

      ${selectedIds.length >= 2 ? `
      <!-- Boolean Operations (2+ shapes selected) -->
      <div class="section-group" style="padding-bottom: 8px;">
        <div class="section-title">Boolean Operations</div>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; margin-top: 6px;">
          <button class="btn-inspector-action" id="btnInspBoolUnion" title="Union Selection (⌥⌘U)" style="font-size: 11px; padding: 4px 2px;"><span data-icon="Layers" data-icon-size="13"></span> Union</button>
          <button class="btn-inspector-action" id="btnInspBoolSubtract" title="Subtract Selection (⌥⌘S)" style="font-size: 11px; padding: 4px 2px;"><span data-icon="Minus" data-icon-size="13"></span> Subtract</button>
          <button class="btn-inspector-action" id="btnInspBoolIntersect" title="Intersect Selection (⌥⌘I)" style="font-size: 11px; padding: 4px 2px;"><span data-icon="Circle" data-icon-size="13"></span> Intersect</button>
          <button class="btn-inspector-action" id="btnInspBoolExclude" title="Exclude Selection (⌥⌘X)" style="font-size: 11px; padding: 4px 2px;"><span data-icon="X" data-icon-size="13"></span> Exclude</button>
        </div>
      </div>` : ''}

      ${selectedIds.length === 1 && node.type === 'boolean_group' ? `
      <!-- Boolean Group Operation Mode -->
      <div class="section-group" style="padding-bottom: 8px;">
        <div class="section-title">Boolean Operation</div>
        <div class="props-row">
          <div class="prop-field" style="flex: 1;">
            <select class="prop-input" id="propBooleanGroupOp">
              <option value="union" ${node.booleanOperation === 'union' ? 'selected' : ''}>Union Selection</option>
              <option value="subtract" ${node.booleanOperation === 'subtract' ? 'selected' : ''}>Subtract Selection</option>
              <option value="intersect" ${node.booleanOperation === 'intersect' ? 'selected' : ''}>Intersect Selection</option>
              <option value="exclude" ${node.booleanOperation === 'exclude' ? 'selected' : ''}>Exclude Selection</option>
            </select>
          </div>
        </div>
        <button class="btn-inspector-action" id="btnInspFlatten" style="margin-top: 6px; width: 100%; font-size: 11px;" title="Flatten into single vector (⌘E)">Flatten Selection (⌘E)</button>
      </div>` : ''}

      <!-- 2. Transform Section & Explicit Variable Extraction (Section 11) -->
      <div class="section-group">
        <div class="section-title">
          <span>Transform</span>
          <span style="font-size: 10px; color: var(--accent-blue); text-transform: lowercase;">${node.type}</span>
        </div>
        <div style="display: flex; gap: 4px; margin-bottom: 8px;">
          <button class="btn-inspector-action" id="btnOpenAddVariableModal" style="font-size: 10px; padding: 4px 6px; color: #38bdf8; border: 1px solid rgba(56,189,248,0.3);" title="Add Variable to Component (Spec Part A, Section 2)">
            <span>+ Variable</span>
          </button>
          <button class="btn-inspector-action" id="btnOpenReplaceComponentModal" style="font-size: 10px; padding: 4px 6px; color: #c084fc; border: 1px solid rgba(192,132,252,0.3);" title="Replace Component (Spec Part A, Section 3)">
            <span>⇄ Replace</span>
          </button>
          <button class="btn-inspector-action" id="btnOpenAuditComponentModal" style="font-size: 10px; padding: 4px 6px; color: #10b981; border: 1px solid rgba(16,185,129,0.3);" title="Audit Variables & Compatibility (Spec Part A, Section 1)">
            <span>Audit</span>
          </button>
          <button class="btn-inspector-action" id="btnExtractCompVariables" style="font-size: 10px; padding: 4px 6px; color: #94a3b8;" title="Extract Reusable Variables with AI (Section 11)">
            <span>Extract</span>
          </button>
        </div>
        <div class="props-row">
          <div class="prop-field">
            <span class="prop-label scrubbable" id="lblX">X</span>
            <input type="text" class="prop-input" id="propX" value="${Math.round(t.x)}">
          </div>
          <div class="prop-field">
            <span class="prop-label scrubbable" id="lblY">Y</span>
            <input type="text" class="prop-input" id="propY" value="${Math.round(t.y)}">
          </div>
        </div>
        <div class="props-row">
          <div class="prop-field">
            <span class="prop-label scrubbable" id="lblW">W</span>
            <input type="text" class="prop-input" id="propW" value="${Math.round(t.width)}">
          </div>
          <button class="btn-aspect-ratio ${this.aspectRatioLocked ? 'locked' : ''}" id="btnLockAspectRatio" title="Constrain Proportions">
            ${this.aspectRatioLocked ? '<span data-icon="LockKeyhole"></span>' : '<span data-icon="LockOpen"></span>'}
          </button>
          <div class="prop-field">
            <span class="prop-label scrubbable" id="lblH">H</span>
            <input type="text" class="prop-input" id="propH" value="${Math.round(t.height)}">
          </div>
        </div>
        <div class="props-row">
          <div class="prop-field">
            <span class="prop-label scrubbable" id="lblRotation">∠</span>
            <input type="text" class="prop-input" id="propRotation" value="${t.rotation || 0}">
          </div>
          <div class="prop-field">
            <span class="prop-label scrubbable" id="lblRadius">Corner</span>
            <input type="text" class="prop-input" id="propRadius" value="${typeof radius === 'number' ? radius : radTL}">
          </div>
          <button class="btn-aspect-ratio ${this.showIndependentRadius ? 'locked' : ''}" id="btnToggleRadiusQuad" title="Independent Corners">
            ◲
          </button>
        </div>

        ${this.showIndependentRadius ? `
        <div class="radius-quad-inputs">
          <div class="prop-field"><span class="prop-label" style="font-size: 9px;">TL</span><input type="text" class="prop-input" id="propRadTL" value="${radTL}"></div>
          <div class="prop-field"><span class="prop-label" style="font-size: 9px;">TR</span><input type="text" class="prop-input" id="propRadTR" value="${radTR}"></div>
          <div class="prop-field"><span class="prop-label" style="font-size: 9px;">BR</span><input type="text" class="prop-input" id="propRadBR" value="${radBR}"></div>
          <div class="prop-field"><span class="prop-label" style="font-size: 9px;">BL</span><input type="text" class="prop-input" id="propRadBL" value="${radBL}"></div>
        </div>` : ''}

        <!-- 9-Point Transform Pivot / Reference Point (§8 & §32.7) -->
        <div class="props-row" style="align-items: center; justify-content: space-between; margin-top: 6px; padding: 4px 6px; background: rgba(255,255,255,0.03); border-radius: 6px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div class="pivot-matrix" id="pivotMatrix" title="Transform Reference Point">
              <button class="pivot-dot ${px===0&&py===0?'active':''}" data-pivot="0,0" title="Top-Left" type="button"></button>
              <button class="pivot-dot ${px===0.5&&py===0?'active':''}" data-pivot="0.5,0" title="Top-Center" type="button"></button>
              <button class="pivot-dot ${px===1&&py===0?'active':''}" data-pivot="1,0" title="Top-Right" type="button"></button>
              <button class="pivot-dot ${px===0&&py===0.5?'active':''}" data-pivot="0,0.5" title="Center-Left" type="button"></button>
              <button class="pivot-dot ${px===0.5&&py===0.5?'active':''}" data-pivot="0.5,0.5" title="Center" type="button"></button>
              <button class="pivot-dot ${px===1&&py===0.5?'active':''}" data-pivot="1,0.5" title="Center-Right" type="button"></button>
              <button class="pivot-dot ${px===0&&py===1?'active':''}" data-pivot="0,1" title="Bottom-Left" type="button"></button>
              <button class="pivot-dot ${px===0.5&&py===1?'active':''}" data-pivot="0.5,1" title="Bottom-Center" type="button"></button>
              <button class="pivot-dot ${px===1&&py===1?'active':''}" data-pivot="1,1" title="Bottom-Right" type="button"></button>
            </div>
            <div style="font-size: 11px; color: var(--text-muted);">
              Pivot: <strong style="color: var(--text-main);">${px === 0.5 && py === 0.5 ? 'Center' : `${Math.round(px*100)}%, ${Math.round(py*100)}%`}</strong>
            </div>
          </div>
          <button class="btn-inspector-action" id="btnResetPivot" style="font-size: 10px; padding: 2px 6px;" title="Reset Pivot to Center (0.5, 0.5)" type="button">Reset</button>
        </div>

        <div style="display: flex; gap: 6px; margin-top: 8px;">
          <button class="btn-inspector-action" id="btnFlipH" style="font-size: 11px; flex: 1;"><span data-icon="ArrowLeftRight"></span> Flip Horizontal</button>
          <button class="btn-inspector-action" id="btnFlipV" style="font-size: 11px; flex: 1;"><span data-icon="ArrowUpDown"></span> Flip Vertical</button>
        </div>
      </div>

      <!-- 3. Auto Layout 2.0 (Figma-Class Flexbox) -->
      <div class="section-group">
        <div class="section-title">
          <span>Auto Layout</span>
          <button class="btn-icon-xs" id="btnToggleAutoLayout" title="${hasAutoLayout ? 'Remove Auto Layout' : 'Add Auto Layout (⇧A)'}">
            ${hasAutoLayout ? '−' : '＋'}
          </button>
        </div>

        ${hasAutoLayout ? `
        <!-- Direction Segment (Vertical, Horizontal, Wrap) -->
        <div class="props-row">
          <div class="sizing-pill-selector" style="width: 100%;">
            <button class="sizing-pill-btn ${l.mode === 'stack-vertical' ? 'active' : ''}" id="btnDirVertical" title="Vertical Stack (Column)">↓ Vertical</button>
            <button class="sizing-pill-btn ${l.mode === 'stack-horizontal' ? 'active' : ''}" id="btnDirHorizontal" title="Horizontal Stack (Row)">→ Horizontal</button>
            <button class="sizing-pill-btn ${l.mode === 'wrap' ? 'active' : ''}" id="btnDirWrap" title="Wrap items">↵ Wrap</button>
          </div>
        </div>

        <!-- Sizing Rules: Horizontal & Vertical (Fixed, Hug, Fill) -->
        <div class="props-row">
          <div class="prop-field">
            <span class="prop-label">H</span>
            <select class="prop-select" id="propSizingH" style="font-size: 11px;">
              <option value="fixed" ${l.sizingHorizontal === 'fixed' ? 'selected' : ''}>Fixed width</option>
              <option value="hug" ${l.sizingHorizontal === 'hug' ? 'selected' : ''}>Hug contents</option>
              <option value="fill" ${l.sizingHorizontal === 'fill' ? 'selected' : ''}>Fill container</option>
            </select>
          </div>
          <div class="prop-field">
            <span class="prop-label">V</span>
            <select class="prop-select" id="propSizingV" style="font-size: 11px;">
              <option value="fixed" ${l.sizingVertical === 'fixed' ? 'selected' : ''}>Fixed height</option>
              <option value="hug" ${l.sizingVertical === 'hug' ? 'selected' : ''}>Hug contents</option>
              <option value="fill" ${l.sizingVertical === 'fill' ? 'selected' : ''}>Fill container</option>
            </select>
          </div>
        </div>

        <!-- Gap and 3x3 Alignment Pad Widget -->
        <div class="props-row" style="align-items: flex-start;">
          <div style="flex: 1; display: flex; flex-direction: column; gap: 8px;">
            <div class="prop-field">
              <span class="prop-label scrubbable" id="lblGap">Gap</span>
              <input type="text" class="prop-input" id="propGap" value="${l.gap || 0}">
              <button class="btn-icon-xs" id="btnAutoGap" title="Toggle Auto Space-Between" style="${l.justifyContent === 'space-between' ? 'color: var(--accent-blue);' : ''}">Auto</button>
            </div>
            <div class="prop-field">
              <span class="prop-label scrubbable" id="lblPad">Padding</span>
              <input type="text" class="prop-input" id="propPaddingUniform" value="${l.paddingTop || 0}">
              <button class="btn-aspect-ratio ${this.showIndependentPadding ? 'locked' : ''}" id="btnTogglePaddingQuad" title="Independent Padding">◫</button>
            </div>
          </div>

          <!-- Figma 3x3 Alignment Pad -->
          <div class="align-pad-grid" id="alignPadGrid" title="Click to set Auto-Layout alignment">
            <button class="align-pad-cell ${l.alignItems === 'start' && l.justifyContent === 'flex-start' ? 'active' : ''}" data-align="start" data-justify="flex-start"><span class="dot"></span></button>
            <button class="align-pad-cell ${l.alignItems === 'start' && l.justifyContent === 'center' ? 'active' : ''}" data-align="start" data-justify="center"><span class="dot"></span></button>
            <button class="align-pad-cell ${l.alignItems === 'start' && l.justifyContent === 'flex-end' ? 'active' : ''}" data-align="start" data-justify="flex-end"><span class="dot"></span></button>
            <button class="align-pad-cell ${l.alignItems === 'center' && l.justifyContent === 'flex-start' ? 'active' : ''}" data-align="center" data-justify="flex-start"><span class="dot"></span></button>
            <button class="align-pad-cell ${l.alignItems === 'center' && l.justifyContent === 'center' ? 'active' : ''}" data-align="center" data-justify="center"><span class="dot"></span></button>
            <button class="align-pad-cell ${l.alignItems === 'center' && l.justifyContent === 'flex-end' ? 'active' : ''}" data-align="center" data-justify="flex-end"><span class="dot"></span></button>
            <button class="align-pad-cell ${l.alignItems === 'end' && l.justifyContent === 'flex-start' ? 'active' : ''}" data-align="end" data-justify="flex-start"><span class="dot"></span></button>
            <button class="align-pad-cell ${l.alignItems === 'end' && l.justifyContent === 'center' ? 'active' : ''}" data-align="end" data-justify="center"><span class="dot"></span></button>
            <button class="align-pad-cell ${l.alignItems === 'end' && l.justifyContent === 'flex-end' ? 'active' : ''}" data-align="end" data-justify="flex-end"><span class="dot"></span></button>
          </div>
        </div>

        ${this.showIndependentPadding ? `
        <div class="radius-quad-inputs">
          <div class="prop-field"><span class="prop-label" style="font-size: 9px;">T</span><input type="text" class="prop-input" id="propPadTop" value="${l.paddingTop || 0}"></div>
          <div class="prop-field"><span class="prop-label" style="font-size: 9px;">R</span><input type="text" class="prop-input" id="propPadRight" value="${l.paddingRight || 0}"></div>
          <div class="prop-field"><span class="prop-label" style="font-size: 9px;">B</span><input type="text" class="prop-input" id="propPadBottom" value="${l.paddingBottom || 0}"></div>
          <div class="prop-field"><span class="prop-label" style="font-size: 9px;">L</span><input type="text" class="prop-input" id="propPadLeft" value="${l.paddingLeft || 0}"></div>
        </div>` : ''}

        <div class="props-row" style="margin-top: 8px;">
          <label style="display: flex; align-items: center; gap: 8px; font-size: 11px; color: var(--text-muted); cursor: pointer;">
            <input type="checkbox" id="propClipContent" ${node.clipContent !== false ? 'checked' : ''}>
            <span>Clip content</span>
          </label>
        </div>` : `
        <button class="btn-inspector-action" id="btnInspAddAutoLayoutPrompt" style="font-size: 11px;">＋ Add Auto Layout (⇧A)</button>
        `}
      </div>

      <!-- 4. Appearance & Blending (Opacity, Blend Modes, Visibility, Lock) -->
      <div class="section-group">
        <div class="section-title">
          <span>Appearance</span>
          <div style="display: flex; gap: 6px;">
            <button class="btn-icon-xs" id="btnToggleVis" title="Toggle Visibility"><span data-icon="${node.visible !== false ? 'Eye' : 'EyeOff'}"></span></button>
            <button class="btn-icon-xs" id="btnToggleLock" title="Toggle Lock"><span data-icon="${node.locked ? 'LockKeyhole' : 'LockOpen'}"></span></button>
          </div>
        </div>
        <div class="props-row">
          <div class="prop-field">
            <span class="prop-label scrubbable" id="lblOpacity">Opacity</span>
            <input type="text" class="prop-input" id="propOpacity" value="${Math.round((node.opacity !== undefined ? node.opacity : 1) * 100)}%">
          </div>
          <div class="prop-field">
            <select class="prop-select" id="propBlendMode" style="font-size: 11px;">
              <option value="normal" ${s.blendMode === 'normal' || !s.blendMode ? 'selected' : ''}>Pass through</option>
              <option value="multiply" ${s.blendMode === 'multiply' ? 'selected' : ''}>Multiply</option>
              <option value="screen" ${s.blendMode === 'screen' ? 'selected' : ''}>Screen</option>
              <option value="overlay" ${s.blendMode === 'overlay' ? 'selected' : ''}>Overlay</option>
              <option value="darken" ${s.blendMode === 'darken' ? 'selected' : ''}>Darken</option>
              <option value="lighten" ${s.blendMode === 'lighten' ? 'selected' : ''}>Lighten</option>
              <option value="color-dodge" ${s.blendMode === 'color-dodge' ? 'selected' : ''}>Color Dodge</option>
              <option value="color-burn" ${s.blendMode === 'color-burn' ? 'selected' : ''}>Color Burn</option>
              <option value="hard-light" ${s.blendMode === 'hard-light' ? 'selected' : ''}>Hard Light</option>
              <option value="soft-light" ${s.blendMode === 'soft-light' ? 'selected' : ''}>Soft Light</option>
              <option value="difference" ${s.blendMode === 'difference' ? 'selected' : ''}>Difference</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 5. Fills Section (Solid, Gradients, Video, Image, Tokens) -->
      <div class="section-group">
        <div class="section-title">
          <span>Fill (${fills.length})</span>
          <button class="btn-icon-xs" id="btnAddFill" title="Add Fill">+</button>
        </div>
        ${fills.length ? fills.map((f, idx) => {
          const fillType = f.type || 'solid';
          const isGrad = ['linear-gradient', 'gradient', 'radial-gradient', 'angular-gradient', 'conic-gradient', 'diamond-gradient'].includes(fillType);
          const firstStop = f.stops?.[0]?.color || f.color || '#334155';
          const lastStop = f.stops?.[1]?.color || '#8b5cf6';
          let swatchStyle = f.color || '#334155';
          if (fillType === 'linear-gradient' || fillType === 'gradient') {
            swatchStyle = `linear-gradient(135deg, ${firstStop}, ${lastStop})`;
          } else if (fillType === 'radial-gradient') {
            swatchStyle = `radial-gradient(circle, ${firstStop}, ${lastStop})`;
          } else if (fillType === 'angular-gradient' || fillType === 'conic-gradient') {
            swatchStyle = `conic-gradient(from 0deg, ${firstStop}, ${lastStop})`;
          } else if (fillType === 'diamond-gradient') {
            swatchStyle = `radial-gradient(circle at center, ${firstStop} 0%, ${lastStop} 70%)`;
          } else if (fillType === 'image' || fillType === 'video') {
            swatchStyle = f.url ? `url(${f.url}) center/cover` : '#334155';
          }
          const isVisible = f.visible !== false;
          const opacityPct = Math.round((f.opacity !== undefined ? f.opacity : 1) * 100);

          return `
          <div class="paint-row-card fill-paint-card" data-index="${idx}">
            <!-- Primary Row: Visibility, Swatch, Hex/Type, Opacity, More, Delete -->
            <div class="paint-primary-row">
              <button type="button" class="btn-icon-xs btn-toggle-fill-vis" data-index="${idx}" title="${isVisible ? 'Hide fill' : 'Show fill'}">
                <span data-icon="${isVisible ? 'Eye' : 'EyeOff'}" data-icon-size="12"></span>
              </button>
              <button type="button" class="color-swatch-box paint-swatch" style="background: ${swatchStyle};"
                id="swatchFill_${idx}" data-index="${idx}" title="Click to open color picker" aria-label="Choose fill color"></button>
              
              ${fillType === 'solid' ? `
                <div class="paint-val-field">
                  <input type="text" class="paint-val-input fill-hex-input" data-index="${idx}" value="${this.escapeAttr(f.color || '#334155')}" aria-label="Solid fill color" spellcheck="false">
                </div>
              ` : isGrad ? `
                <div class="paint-type-badge btn-edit-gradient" data-index="${idx}" title="Edit gradient stops">
                  <span>${fillType.replace('-gradient', '').replace('gradient', 'Linear')}</span>
                </div>
              ` : `
                <div class="paint-type-badge btn-upload-fill" data-index="${idx}" title="Click to upload/replace ${fillType}">
                  <span>${fillType === 'image' ? 'Image' : 'Video'}</span>
                  <input type="file" class="fill-media-input" data-index="${idx}" accept="${fillType}/*" style="display: none;">
                </div>
              `}

              <div class="paint-opacity-box" title="Fill opacity">
                <input type="number" class="prop-input fill-opacity-input" data-index="${idx}" min="0" max="100" value="${opacityPct}">
              </div>

              <button type="button" class="btn-icon-xs btn-toggle-fill-more" data-index="${idx}" title="More options (blend mode, reorder, duplicate)">
                <span data-icon="SlidersHorizontal" data-icon-size="12"></span>
              </button>

              <button type="button" class="btn-icon-xs btn-remove-fill" data-index="${idx}" title="Remove fill" aria-label="Remove fill">
                <span data-icon="Minus" data-icon-size="12"></span>
              </button>
            </div>

            <!-- Advanced Drawer (visible if blendMode != normal OR tokenName OR expanded) -->
            <div class="paint-sub-drawer fill-details-drawer" id="fillDrawer_${idx}" style="${(f.blendMode && f.blendMode !== 'normal') || f.tokenName ? 'display: flex;' : 'display: none;'} flex-direction: column; gap: 6px; margin-top: 6px; padding-top: 6px; border-top: 1px solid rgba(255, 255, 255, 0.06);">
              <div style="display: flex; gap: 6px; align-items: center;">
                <select class="prop-select fill-blend-select" data-index="${idx}" style="flex: 1; font-size: 11px; height: 26px;">
                  <option value="normal" ${!f.blendMode || f.blendMode === 'normal' ? 'selected' : ''}>Pass through</option>
                  <option value="multiply" ${f.blendMode === 'multiply' ? 'selected' : ''}>Multiply</option>
                  <option value="screen" ${f.blendMode === 'screen' ? 'selected' : ''}>Screen</option>
                  <option value="overlay" ${f.blendMode === 'overlay' ? 'selected' : ''}>Overlay</option>
                  <option value="darken" ${f.blendMode === 'darken' ? 'selected' : ''}>Darken</option>
                  <option value="lighten" ${f.blendMode === 'lighten' ? 'selected' : ''}>Lighten</option>
                  <option value="color-dodge" ${f.blendMode === 'color-dodge' ? 'selected' : ''}>Color Dodge</option>
                  <option value="color-burn" ${f.blendMode === 'color-burn' ? 'selected' : ''}>Color Burn</option>
                  <option value="hard-light" ${f.blendMode === 'hard-light' ? 'selected' : ''}>Hard Light</option>
                  <option value="soft-light" ${f.blendMode === 'soft-light' ? 'selected' : ''}>Soft Light</option>
                  <option value="difference" ${f.blendMode === 'difference' ? 'selected' : ''}>Difference</option>
                </select>
                <button class="btn-icon-xs btn-bind-token" data-index="${idx}" title="Bind to Theme Token / Variable"><span data-icon="Link" data-icon-size="12"></span></button>
                <button class="btn-icon-xs btn-move-fill-up" data-index="${idx}" title="Move fill up" ${idx === 0 ? 'disabled style="opacity: 0.3;"' : ''}>▲</button>
                <button class="btn-icon-xs btn-move-fill-down" data-index="${idx}" title="Move fill down" ${idx === fills.length - 1 ? 'disabled style="opacity: 0.3;"' : ''}>▼</button>
                <button class="btn-icon-xs btn-duplicate-fill" data-index="${idx}" title="Duplicate fill"><span data-icon="Copy" data-icon-size="11"></span></button>
                <select class="prop-select fill-type-select" data-index="${idx}" aria-label="Paint type" style="display: none;">
                  <option value="solid" ${fillType === 'solid' ? 'selected' : ''}>Solid</option>
                  <option value="linear-gradient" ${fillType === 'linear-gradient' || fillType === 'gradient' ? 'selected' : ''}>Linear</option>
                  <option value="radial-gradient" ${fillType === 'radial-gradient' ? 'selected' : ''}>Radial</option>
                  <option value="angular-gradient" ${fillType === 'angular-gradient' || fillType === 'conic-gradient' ? 'selected' : ''}>Angular</option>
                  <option value="diamond-gradient" ${fillType === 'diamond-gradient' ? 'selected' : ''}>Diamond</option>
                  <option value="image" ${fillType === 'image' ? 'selected' : ''}>Image</option>
                  <option value="video" ${fillType === 'video' ? 'selected' : ''}>Video</option>
                </select>
              </div>
              ${f.tokenName ? `
                <div style="display: flex; align-items: center; justify-content: space-between;">
                  <span class="token-chip-badge" title="Bound variable: ${this.escapeAttr(f.tokenName)}">${this.escapeAttr(f.tokenName)}</span>
                  <button class="btn-icon-xs btn-detach-token" data-index="${idx}" title="Detach variable">✕</button>
                </div>
              ` : ''}
              ${isGrad ? `
                <div style="display: flex; align-items: center; justify-content: space-between; font-size: 10px; color: var(--text-muted);">
                  <span>Stops: ${f.stops?.length || 2}</span>
                  <div style="display: flex; gap: 4px;">
                    <button class="btn-inspector-action btn-reverse-fill-stops" data-index="${idx}" style="font-size: 10px; padding: 2px 6px; width: auto;">Reverse ⇄</button>
                    <button class="btn-inspector-action btn-edit-gradient" data-index="${idx}" style="font-size: 10px; padding: 2px 6px; width: auto;">Edit Stops</button>
                  </div>
                </div>
              ` : ''}
            </div>
          </div>`;
        }).join('') : '<div style="font-size: 11px; color: var(--text-dim);">No fill applied</div>'}
      </div>

      <!-- 6. Strokes Section (Multi-stroke stack, Align, Per-side, Caps/Joins, Dashes) -->
      <div class="section-group">
        <div class="section-title">
          <span>Stroke (${strokes.length})</span>
          <button class="btn-icon-xs" id="btnAddStroke" title="Add Stroke">+</button>
        </div>
        ${strokes.length > 0 ? strokes.map((st, idx) => {
          const isVisible = st.visible !== false;
          const align = st.align || st.strokeAlign || 'center';
          const cap = st.strokeCap || st.cap || 'butt';
          const join = st.strokeJoin || st.join || 'miter';
          const dash = Array.isArray(st.dashPattern || st.dash) ? (st.dashPattern || st.dash).join(', ') : '';
          const weights = st.strokeWeights || {};
          const isPerSide = Boolean(weights.top || weights.right || weights.bottom || weights.left);

          return `
          <div class="paint-row-card stroke-card" data-index="${idx}">
            <!-- Row 1: Visibility, Swatch, Hex, Opacity, Delete -->
            <div class="paint-primary-row">
              <button type="button" class="btn-icon-xs btn-toggle-stroke-vis" data-index="${idx}" title="${isVisible ? 'Hide stroke' : 'Show stroke'}">
                <span data-icon="${isVisible ? 'Eye' : 'EyeOff'}" data-icon-size="12"></span>
              </button>
              <button type="button" class="color-swatch-box paint-swatch stroke-swatch"
                style="background: ${st.color || '#3b82f6'};" data-index="${idx}" title="Choose stroke color"
                aria-label="Choose stroke color"></button>
              <div class="paint-val-field">
                <input type="text" class="paint-val-input stroke-hex-input" data-index="${idx}" value="${st.color || '#3b82f6'}" spellcheck="false">
              </div>
              <div class="paint-opacity-box" title="Stroke opacity">
                <input type="number" class="prop-input stroke-opacity-input" data-index="${idx}" min="0" max="100" value="${Math.round((st.opacity !== undefined ? st.opacity : 1) * 100)}">
              </div>
              <button type="button" class="btn-icon-xs btn-remove-stroke" data-index="${idx}" title="Remove stroke" aria-label="Remove stroke">
                <span data-icon="Minus" data-icon-size="12"></span>
              </button>
            </div>

            <!-- Row 2: Alignment, Width, Settings -->
            <div class="paint-primary-row" style="margin-top: 4px;">
              <select class="prop-select stroke-align-select" data-index="${idx}" style="flex: 1; font-size: 11px; height: 26px;" title="Stroke Alignment">
                <option value="inside" ${align === 'inside' ? 'selected' : ''}>Inside</option>
                <option value="center" ${align === 'center' ? 'selected' : ''}>Center</option>
                <option value="outside" ${align === 'outside' ? 'selected' : ''}>Outside</option>
              </select>
              <div class="prop-field" style="width: 70px; flex: 0 0 70px; height: 26px; padding: 2px 6px;" title="Stroke Width">
                <span class="prop-label">W</span>
                <input type="number" class="prop-input stroke-width-input" data-index="${idx}" min="1" max="100" value="${st.width || 1}">
              </div>
              <button type="button" class="btn-icon-xs btn-toggle-stroke-more" data-index="${idx}" title="Advanced Stroke Options">
                <span data-icon="SlidersHorizontal" data-icon-size="12"></span>
              </button>
            </div>

            <!-- Advanced Stroke Drawer (visible if custom caps/joins/dashes/weights are applied OR expanded) -->
            <div class="paint-sub-drawer stroke-details-drawer" id="strokeDrawer_${idx}" style="${cap !== 'butt' || join !== 'miter' || dash || isPerSide ? 'display: flex;' : 'display: none;'} flex-direction: column; gap: 6px; margin-top: 6px; padding-top: 6px; border-top: 1px solid rgba(255, 255, 255, 0.06);">
              <!-- Sub-row 1: Cap & Join (ONLY 2 items, NEVER clips!) -->
              <div style="display: flex; gap: 6px;">
                <div class="prop-field" style="flex: 1; height: 26px; padding: 2px 6px;" title="Stroke Cap">
                  <span class="prop-label">Cap</span>
                  <select class="prop-select stroke-cap-select" data-index="${idx}" style="font-size: 11px; border: none; background: transparent; padding: 0;">
                    <option value="butt" ${cap === 'butt' ? 'selected' : ''}>Butt</option>
                    <option value="round" ${cap === 'round' ? 'selected' : ''}>Round</option>
                    <option value="square" ${cap === 'square' ? 'selected' : ''}>Square</option>
                  </select>
                </div>
                <div class="prop-field" style="flex: 1; height: 26px; padding: 2px 6px;" title="Stroke Join">
                  <span class="prop-label">Join</span>
                  <select class="prop-select stroke-join-select" data-index="${idx}" style="font-size: 11px; border: none; background: transparent; padding: 0;">
                    <option value="miter" ${join === 'miter' ? 'selected' : ''}>Miter</option>
                    <option value="round" ${join === 'round' ? 'selected' : ''}>Round</option>
                    <option value="bevel" ${join === 'bevel' ? 'selected' : ''}>Bevel</option>
                  </select>
                </div>
              </div>

              <!-- Sub-row 2: Dash & Custom Sides -->
              <div style="display: flex; gap: 6px; align-items: center;">
                <div class="prop-field" style="flex: 1; height: 26px; padding: 2px 6px;" title="Dash pattern (e.g. 8, 4)">
                  <span class="prop-label">Dash</span>
                  <input type="text" class="prop-input stroke-dash-input" data-index="${idx}" placeholder="e.g. 8, 4" value="${dash}">
                </div>
                <button type="button" class="btn-inspector-action btn-toggle-stroke-sides" data-index="${idx}" style="font-size: 10px; padding: 2px 8px; width: auto; height: 26px;">
                  ${isPerSide ? 'Custom Sides' : 'Per Side'}
                </button>
              </div>

              <!-- Sub-row 3: Stroke Actions -->
              <div style="display: flex; gap: 6px; align-items: center; justify-content: flex-end;">
                <button class="btn-icon-xs btn-bind-stroke-token" data-index="${idx}" title="Bind Stroke to Variable"><span data-icon="Link" data-icon-size="12"></span></button>
                <button class="btn-icon-xs btn-move-stroke-up" data-index="${idx}" title="Move stroke up" ${idx === 0 ? 'disabled style="opacity: 0.3;"' : ''}>▲</button>
                <button class="btn-icon-xs btn-move-stroke-down" data-index="${idx}" title="Move stroke down" ${idx === strokes.length - 1 ? 'disabled style="opacity: 0.3;"' : ''}>▼</button>
                <button class="btn-icon-xs btn-duplicate-stroke" data-index="${idx}" title="Duplicate stroke"><span data-icon="Copy" data-icon-size="11"></span></button>
              </div>

              <!-- Sub-row 3: Per-side weights -->
              <div class="stroke-sides-row" id="strokeSides_${idx}" style="display: ${isPerSide ? 'flex' : 'none'}; gap: 4px; margin-top: 2px;">
                <div class="prop-field" style="height: 24px; padding: 2px 4px;"><span class="prop-label">T</span><input type="number" class="prop-input stroke-weight-top" data-index="${idx}" min="0" value="${weights.top || 0}"></div>
                <div class="prop-field" style="height: 24px; padding: 2px 4px;"><span class="prop-label">R</span><input type="number" class="prop-input stroke-weight-right" data-index="${idx}" min="0" value="${weights.right || 0}"></div>
                <div class="prop-field" style="height: 24px; padding: 2px 4px;"><span class="prop-label">B</span><input type="number" class="prop-input stroke-weight-bottom" data-index="${idx}" min="0" value="${weights.bottom || 0}"></div>
                <div class="prop-field" style="height: 24px; padding: 2px 4px;"><span class="prop-label">L</span><input type="number" class="prop-input stroke-weight-left" data-index="${idx}" min="0" value="${weights.left || 0}"></div>
              </div>
            </div>
          </div>
          `;
        }).join('') : '<div style="font-size: 11px; color: var(--text-dim);">No stroke applied</div>'}
      </div>

      <!-- 7. Effects Section (Drop Shadow, Inner Shadow, Blur) -->
      <div class="section-group">
        <div class="section-title">
          <span>Effects</span>
          <button class="btn-icon-xs" id="btnAddEffect" title="Add Effect">+</button>
        </div>
        ${shadows.length > 0 ? shadows.map((sh, idx) => `
        <div style="background: var(--bg-surface); padding: 8px; border-radius: 4px; border: 1px solid var(--border-subtle); margin-bottom: 6px;">
          <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 6px;">
            <span>Drop Shadow</span>
            <button class="btn-icon-xs btn-remove-effect" data-index="${idx}" title="Remove effect" aria-label="Remove effect"><span data-icon="Minus"></span></button>
          </div>
          <div class="props-row">
            <div class="prop-field"><span class="prop-label">X</span><input type="text" class="prop-input effect-x" data-index="${idx}" value="${sh.x || 0}"></div>
            <div class="prop-field"><span class="prop-label">Y</span><input type="text" class="prop-input effect-y" data-index="${idx}" value="${sh.y || 4}"></div>
            <div class="prop-field"><span class="prop-label">Blur</span><input type="text" class="prop-input effect-blur" data-index="${idx}" value="${sh.blur || 12}"></div>
          </div>
        </div>
        `).join('') : '<div style="font-size: 11px; color: var(--text-dim);">No effects applied</div>'}
      </div>

      <!-- 8. Typography Section if text node -->
      ${(() => {
        if (!isText) return '';
        const rawFont = node.text?.fontFamily || 'Inter';
        const cleanFont = this.fontManager.cleanFontFamily(rawFont);
        const isMissing = !this.fontManager.isFontAvailable(cleanFont);
        const isSkipped = this.fontManager.isFontSkipped(cleanFont);
        const avail = this.fontManager.getAvailableFonts();

        let optHtml = '';
        if (isMissing) {
          optHtml += `<optgroup label="⚠️ Missing font (not installed)">
            <option value="${cleanFont}" selected>⚠️ ${cleanFont} (Missing)</option>
          </optgroup>`;
        }
        optHtml += `<optgroup label="Installed System Fonts">
          ${avail.systemFonts.map(f => `<option value="${f}" ${!isMissing && cleanFont.toLowerCase() === f.toLowerCase() ? 'selected' : ''}>${f}</option>`).join('')}
        </optgroup>`;
        optHtml += `<optgroup label="Popular Web Fonts">
          ${avail.webFonts.map(f => `<option value="${f}" ${!isMissing && cleanFont.toLowerCase() === f.toLowerCase() ? 'selected' : ''}>${f}</option>`).join('')}
        </optgroup>`;

        const alertBoxHtml = (isMissing && !isSkipped) ? `
          <div class="missing-font-alert-box" id="missingFontInspectorAlert">
            <div class="missing-font-alert-header">
              <span class="missing-font-alert-icon">⚠️</span>
              <div class="missing-font-alert-text">
                <strong>Missing font:</strong> "${cleanFont}" is not installed on this system.
              </div>
            </div>
            <div class="missing-font-alert-actions">
              <button class="missing-font-alert-btn-change" id="btnInspectorChangeMissingFont" type="button">Change font</button>
              <button class="missing-font-alert-btn-skip" id="btnInspectorSkipMissingFont" type="button">Skip</button>
            </div>
          </div>
        ` : '';

        return `
        <div class="section-group">
          <div class="section-title" style="display: flex; align-items: center; justify-content: space-between;">
            <span>Typography</span>
            ${isMissing ? `<span class="missing-font-badge-warning" title="Font missing on system">⚠️ Missing</span>` : ''}
          </div>
          <div class="props-row">
            <div class="prop-field" style="width: 100%;">
              <select class="prop-select" id="propFontFamily">
                ${optHtml}
              </select>
            </div>
          </div>
          ${alertBoxHtml}
          <div class="props-row">
            <div class="prop-field">
              <span class="prop-label scrubbable" id="lblFontSize">Size</span>
              <input type="text" class="prop-input" id="propFontSize" value="${node.text?.fontSize || 16}">
            </div>
            <div class="prop-field">
              <select class="prop-select" id="propFontWeight">
                <option value="400" ${node.text?.fontWeight === '400' ? 'selected' : ''}>Regular (400)</option>
                <option value="500" ${node.text?.fontWeight === '500' ? 'selected' : ''}>Medium (500)</option>
                <option value="600" ${node.text?.fontWeight === '600' ? 'selected' : ''}>Semibold (600)</option>
                <option value="700" ${node.text?.fontWeight === '700' ? 'selected' : ''}>Bold (700)</option>
                <option value="800" ${node.text?.fontWeight === '800' ? 'selected' : ''}>Extra Bold (800)</option>
              </select>
            </div>
          </div>
          <div class="props-row">
            <div class="sizing-pill-selector" style="width: 100%;">
              <button class="sizing-pill-btn ${node.text?.textAlign === 'left' || !node.text?.textAlign ? 'active' : ''}" id="btnAlignLeft">Left</button>
              <button class="sizing-pill-btn ${node.text?.textAlign === 'center' ? 'active' : ''}" id="btnAlignCenter">Center</button>
              <button class="sizing-pill-btn ${node.text?.textAlign === 'right' ? 'active' : ''}" id="btnAlignRight">Right</button>
            </div>
          </div>
          <div class="props-row">
            <button type="button" class="color-swatch-box paint-swatch" id="swatchTextColor"
              style="background: ${node.text?.color || '#f8fafc'};" title="Choose text color"
              aria-label="Choose text color"></button>
            <div class="prop-field">
              <span class="prop-label">Color</span>
              <input type="text" class="prop-input" id="propTextColor" value="${node.text?.color || '#f8fafc'}">
            </div>
          </div>
          <div class="props-row">
            <textarea class="prop-input" id="propTextContent" rows="3" style="padding: 6px; width: 100%; border-radius: 4px; border: 1px solid var(--border-subtle);">${node.text?.content || ''}</textarea>
          </div>
        </div>
        `;
      })()}

      <!-- 9. Image Section if image node -->
      ${isImage ? `
      <div class="section-group">
        <div class="section-title">Image Asset</div>
        <div class="props-row">
          <div class="prop-field">
            <span class="prop-label">URL</span>
            <input type="text" class="prop-input" id="propImageUrl" value="${node.image?.url || ''}">
          </div>
        </div>
      </div>` : ''}

      <!-- 10. Selection Colors (Appendix A2.2 item 11) -->
      ${selectionColors.length > 0 ? `
      <div class="section-group">
        <div class="section-title">
          <span>Selection Colors (${selectionColors.length})</span>
        </div>
        <div class="selection-colors-list">
          ${selectionColors.map((sc, index) => `
          <div class="selection-color-item" data-color-index="${index}">
            <div style="display: flex; align-items: center; gap: 8px; min-width: 0;">
              <div class="color-swatch-box paint-swatch" style="background: ${sc.color}; width: 18px; height: 18px; border-radius: 4px; cursor: pointer;"
                title="Click to recolor" data-color-index="${index}"></div>
              <span class="selection-color-hex" style="font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 500; cursor: pointer;" title="Click to recolor" data-color-index="${index}">${sc.color}</span>
              <span style="color: var(--text-dim); font-size: 10px;">×${sc.count}</span>
              <span style="color: var(--text-muted); font-size: 9px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${this.escapeAttr(sc.kinds.join(', '))}</span>
            </div>
            <div style="display: flex; gap: 4px; align-items: center; flex-shrink: 0;">
              ${sc.tokenName ? `<span class="token-chip-badge" title="${sc.unresolved ? 'Unresolved color resource' : 'Linked color resource'}">${this.escapeAttr(sc.tokenName)}</span>` : ''}
              <button type="button" class="btn-inspector-action btn-select-color-matches" data-color-index="${index}" style="font-size: 10px; padding: 2px 8px; width: auto; height: 24px;" title="Select matching layers (${sc.count})">
                Select matches
              </button>
              <button type="button" class="btn-inspector-action btn-recolor-selection-color" data-color-index="${index}" style="font-size: 10px; padding: 2px 8px; width: auto; height: 24px;" title="${sc.tokenId || sc.tokenName || sc.unresolved ? 'Detach & Change' : 'Change color'}">
                Change
              </button>
            </div>
          </div>
          `).join('')}
        </div>
      </div>` : ''}

      <!-- 11. Export Settings in Design Tab -->
      <div class="section-group">
        <div class="section-title">Export</div>
        <div style="display: flex; gap: 6px;">
          <button class="btn-inspector-action" id="btnExportSelectionPng" style="font-size: 11px; flex: 1;">PNG (1x)</button>
          <button class="btn-inspector-action" id="btnExportSelectionSvg" style="font-size: 11px; flex: 1;">SVG</button>
        </div>
      </div>
    `;

    mountLucideIcons(container);

    // --- Wire Event Handlers for Figma-Identical Design Controls ---
    // 1. Top Alignment Bar
    document.getElementById('inspAlignLeft')?.addEventListener('click', () => this.alignSelected('left'));
    document.getElementById('inspAlignHCenter')?.addEventListener('click', () => this.alignSelected('center'));
    document.getElementById('inspAlignRight')?.addEventListener('click', () => this.alignSelected('right'));
    document.getElementById('inspAlignTop')?.addEventListener('click', () => this.alignSelected('top'));
    document.getElementById('inspAlignVCenter')?.addEventListener('click', () => this.alignSelected('middle'));
    document.getElementById('inspAlignBottom')?.addEventListener('click', () => this.alignSelected('bottom'));
    document.getElementById('inspDistH')?.addEventListener('click', () => this.distributeSelected('horizontal'));
    document.getElementById('inspDistV')?.addEventListener('click', () => this.distributeSelected('vertical'));
    
    // Component & Variable Management Handlers (Spec Part A)
    document.getElementById('btnOpenAddVariableModal')?.addEventListener('click', () => {
      this.dsUi.openAddVariableModal(node);
    });
    document.getElementById('btnOpenReplaceComponentModal')?.addEventListener('click', () => {
      this.dsUi.openReplaceComponentModal(node);
    });
    document.getElementById('btnOpenAuditComponentModal')?.addEventListener('click', () => {
      this.dsUi.openAuditComponentModal(node);
    });
    document.getElementById('btnExtractCompVariables')?.addEventListener('click', () => {
      this.dsUi.openComponentVariablesModal(node);
    });

    // Boolean Operations in Inspector
    document.getElementById('btnInspBoolUnion')?.addEventListener('click', () => this.booleanSelected('union'));
    document.getElementById('btnInspBoolSubtract')?.addEventListener('click', () => this.booleanSelected('subtract'));
    document.getElementById('btnInspBoolIntersect')?.addEventListener('click', () => this.booleanSelected('intersect'));
    document.getElementById('btnInspBoolExclude')?.addEventListener('click', () => this.booleanSelected('exclude'));
    document.getElementById('btnInspFlatten')?.addEventListener('click', () => this.flattenSelected());
    document.getElementById('propBooleanGroupOp')?.addEventListener('change', (e) => {
      this.engine.updateNode(node.id, { booleanOperation: e.target.value }, 'Change Boolean Operation');
      this.renderer.render();
      this.updateLayersTree();
      this.updateInspector();
    });

    // 2. Transform Inputs & Scrubbing
    this.makeScrubbable(document.getElementById('lblX'), (delta) => {
      this.engine.updateNode(node.id, { transform: { x: t.x + delta } }, 'Scrub X');
    });
    this.makeScrubbable(document.getElementById('lblY'), (delta) => {
      this.engine.updateNode(node.id, { transform: { y: t.y + delta } }, 'Scrub Y');
    });
    this.makeScrubbable(document.getElementById('lblW'), (delta) => {
      const newW = Math.max(10, t.width + delta);
      const patch = { transform: { width: newW } };
      if (this.aspectRatioLocked && t.width > 0) {
        patch.transform.height = Math.max(10, Math.round(newW * (t.height / t.width)));
      }
      this.engine.updateNode(node.id, patch, 'Scrub Width');
    });
    this.makeScrubbable(document.getElementById('lblH'), (delta) => {
      const newH = Math.max(10, t.height + delta);
      const patch = { transform: { height: newH } };
      if (this.aspectRatioLocked && t.height > 0) {
        patch.transform.width = Math.max(10, Math.round(newH * (t.width / t.height)));
      }
      this.engine.updateNode(node.id, patch, 'Scrub Height');
    });
    this.makeScrubbable(document.getElementById('lblRotation'), (delta) => {
      this.engine.updateNode(node.id, { transform: { rotation: (t.rotation || 0) + delta } }, 'Scrub Rotation');
    });
    this.makeScrubbable(document.getElementById('lblRadius'), (delta) => {
      const cur = typeof radius === 'number' ? radius : radTL;
      this.engine.updateNode(node.id, { style: { cornerRadius: Math.max(0, cur + delta) } }, 'Scrub Radius');
    });

    document.getElementById('propX')?.addEventListener('change', (e) => {
      this.engine.updateNode(node.id, { transform: { x: this.evalExpr(e.target.value, t.x) } }, 'Change X');
    });
    document.getElementById('propY')?.addEventListener('change', (e) => {
      this.engine.updateNode(node.id, { transform: { y: this.evalExpr(e.target.value, t.y) } }, 'Change Y');
    });
    document.getElementById('propW')?.addEventListener('change', (e) => {
      const newW = Math.max(10, this.evalExpr(e.target.value, t.width));
      const patch = { transform: { width: newW } };
      if (this.aspectRatioLocked && t.width > 0) {
        patch.transform.height = Math.max(10, Math.round(newW * (t.height / t.width)));
      }
      this.engine.updateNode(node.id, patch, 'Change Width');
    });
    document.getElementById('propH')?.addEventListener('change', (e) => {
      const newH = Math.max(10, this.evalExpr(e.target.value, t.height));
      const patch = { transform: { height: newH } };
      if (this.aspectRatioLocked && t.height > 0) {
        patch.transform.width = Math.max(10, Math.round(newH * (t.width / t.height)));
      }
      this.engine.updateNode(node.id, patch, 'Change Height');
    });
    document.getElementById('btnLockAspectRatio')?.addEventListener('click', () => {
      this.aspectRatioLocked = !this.aspectRatioLocked;
      this.updateInspector();
    });
    document.getElementById('btnToggleRadiusQuad')?.addEventListener('click', () => {
      this.showIndependentRadius = !this.showIndependentRadius;
      this.updateInspector();
    });
    document.getElementById('propRadius')?.addEventListener('change', (e) => {
      this.engine.updateNode(node.id, { style: { cornerRadius: Math.max(0, this.evalExpr(e.target.value, 0)) } }, 'Change Radius');
    });

    // Independent 4 corners
    const updateQuadRadius = () => {
      const tl = Math.max(0, this.evalExpr(document.getElementById('propRadTL')?.value, 0));
      const tr = Math.max(0, this.evalExpr(document.getElementById('propRadTR')?.value, 0));
      const br = Math.max(0, this.evalExpr(document.getElementById('propRadBR')?.value, 0));
      const bl = Math.max(0, this.evalExpr(document.getElementById('propRadBL')?.value, 0));
      this.engine.updateNode(node.id, { style: { cornerRadius: { topLeft: tl, topRight: tr, bottomRight: br, bottomLeft: bl } } }, 'Change Corner Radii');
    };
    document.getElementById('propRadTL')?.addEventListener('change', updateQuadRadius);
    document.getElementById('propRadTR')?.addEventListener('change', updateQuadRadius);
    document.getElementById('propRadBR')?.addEventListener('change', updateQuadRadius);
    document.getElementById('propRadBL')?.addEventListener('change', updateQuadRadius);

    document.getElementById('btnFlipH')?.addEventListener('click', () => {
      this.engine.updateNode(node.id, { transform: { scaleX: (t.scaleX || 1) * -1 } }, 'Flip Horizontal');
    });
    document.getElementById('btnFlipV')?.addEventListener('click', () => {
      this.engine.updateNode(node.id, { transform: { scaleY: (t.scaleY || 1) * -1 } }, 'Flip Vertical');
    });

    // Pivot Reference Matrix & Reset
    document.querySelectorAll('.pivot-dot').forEach(dot => {
      dot.addEventListener('click', (e) => {
        const raw = e.currentTarget.dataset.pivot || '';
        const parts = raw.split(',').map(Number);
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          this.engine.updateNode(node.id, { transform: { pivot: { x: parts[0], y: parts[1] } } }, 'Change Pivot Reference');
          this.renderer.render();
          this.updateInspector();
        }
      });
    });
    document.getElementById('btnResetPivot')?.addEventListener('click', () => {
      this.engine.updateNode(node.id, { transform: { pivot: { x: 0.5, y: 0.5 } } }, 'Reset Pivot Reference');
      this.renderer.render();
      this.updateInspector();
    });

    // 3. Auto Layout 2.0 Controls
    document.getElementById('btnToggleAutoLayout')?.addEventListener('click', () => {
      if (hasAutoLayout) this.engine.removeAutoLayout(node.id);
      else this.engine.addAutoLayout(node.id);
    });
    document.getElementById('btnInspAddAutoLayoutPrompt')?.addEventListener('click', () => {
      this.engine.addAutoLayout(node.id);
    });

    document.getElementById('btnDirVertical')?.addEventListener('click', () => {
      this.engine.updateNode(node.id, { layout: { mode: 'stack-vertical' } }, 'Set Vertical Stack');
    });
    document.getElementById('btnDirHorizontal')?.addEventListener('click', () => {
      this.engine.updateNode(node.id, { layout: { mode: 'stack-horizontal' } }, 'Set Horizontal Stack');
    });
    document.getElementById('btnDirWrap')?.addEventListener('click', () => {
      this.engine.updateNode(node.id, { layout: { mode: 'wrap' } }, 'Set Wrap Layout');
    });

    document.getElementById('propSizingH')?.addEventListener('change', (e) => {
      this.engine.updateNode(node.id, { layout: { sizingHorizontal: e.target.value } }, 'Change H Sizing');
    });
    document.getElementById('propSizingV')?.addEventListener('change', (e) => {
      this.engine.updateNode(node.id, { layout: { sizingVertical: e.target.value } }, 'Change V Sizing');
    });

    this.makeScrubbable(document.getElementById('lblGap'), (delta) => {
      this.engine.updateNode(node.id, { layout: { gap: Math.max(0, (l.gap || 0) + delta) } }, 'Scrub Gap');
    });
    document.getElementById('propGap')?.addEventListener('change', (e) => {
      this.engine.updateNode(node.id, { layout: { gap: Math.max(0, this.evalExpr(e.target.value, 0)) } }, 'Change Gap');
    });
    document.getElementById('btnAutoGap')?.addEventListener('click', () => {
      const isAuto = l.justifyContent === 'space-between';
      this.engine.updateNode(node.id, { layout: { justifyContent: isAuto ? 'flex-start' : 'space-between' } }, 'Toggle Auto Gap');
    });

    this.makeScrubbable(document.getElementById('lblPad'), (delta) => {
      const newP = Math.max(0, (l.paddingTop || 0) + delta);
      this.engine.updateNode(node.id, { layout: { paddingTop: newP, paddingRight: newP, paddingBottom: newP, paddingLeft: newP } }, 'Scrub Padding');
    });
    document.getElementById('propPaddingUniform')?.addEventListener('change', (e) => {
      const val = Math.max(0, this.evalExpr(e.target.value, 0));
      this.engine.updateNode(node.id, { layout: { paddingTop: val, paddingRight: val, paddingBottom: val, paddingLeft: val } }, 'Change Padding');
    });
    document.getElementById('btnTogglePaddingQuad')?.addEventListener('click', () => {
      this.showIndependentPadding = !this.showIndependentPadding;
      this.updateInspector();
    });

    const updateQuadPad = () => {
      const pt = Math.max(0, this.evalExpr(document.getElementById('propPadTop')?.value, 0));
      const pr = Math.max(0, this.evalExpr(document.getElementById('propPadRight')?.value, 0));
      const pb = Math.max(0, this.evalExpr(document.getElementById('propPadBottom')?.value, 0));
      const pl = Math.max(0, this.evalExpr(document.getElementById('propPadLeft')?.value, 0));
      this.engine.updateNode(node.id, { layout: { paddingTop: pt, paddingRight: pr, paddingBottom: pb, paddingLeft: pl } }, 'Change Quad Padding');
    };
    document.getElementById('propPadTop')?.addEventListener('change', updateQuadPad);
    document.getElementById('propPadRight')?.addEventListener('change', updateQuadPad);
    document.getElementById('propPadBottom')?.addEventListener('change', updateQuadPad);
    document.getElementById('propPadLeft')?.addEventListener('change', updateQuadPad);

    // 3x3 Alignment Pad clicks
    document.querySelectorAll('.align-pad-cell').forEach(cell => {
      cell.addEventListener('click', () => {
        const align = cell.dataset.align;
        const justify = cell.dataset.justify;
        this.engine.updateNode(node.id, { layout: { alignItems: align, justifyContent: justify } }, 'Set Auto-Layout Alignment');
      });
    });

    document.getElementById('propClipContent')?.addEventListener('change', (e) => {
      this.engine.updateNode(node.id, { clipContent: e.target.checked }, 'Toggle Clip Content');
    });

    // 4. Appearance
    this.makeScrubbable(document.getElementById('lblOpacity'), (delta) => {
      const cur = node.opacity !== undefined ? node.opacity : 1;
      const next = Math.max(0, Math.min(1, cur + delta / 100));
      this.engine.updateNode(node.id, { opacity: next }, 'Scrub Opacity');
    });
    document.getElementById('propOpacity')?.addEventListener('change', (e) => {
      const val = Math.max(0, Math.min(100, parseFloat(e.target.value) || 100)) / 100;
      this.engine.updateNode(node.id, { opacity: val }, 'Change Opacity');
    });
    document.getElementById('propBlendMode')?.addEventListener('change', (e) => {
      this.engine.updateNode(node.id, { style: { blendMode: e.target.value } }, 'Change Blend Mode');
    });
    document.getElementById('btnToggleVis')?.addEventListener('click', () => {
      this.engine.toggleVisibility(node.id);
    });
    document.getElementById('btnToggleLock')?.addEventListener('click', () => {
      this.engine.toggleLock(node.id);
    });

    // 5. Fills
    document.getElementById('btnAddFill')?.addEventListener('click', () => {
      const curFills = JSON.parse(JSON.stringify(s.fills || []));
      curFills.push({ type: 'solid', color: '#2563eb', opacity: 1 });
      this.engine.updateNode(node.id, { style: { fills: curFills } }, 'Add Fill');
    });
    document.querySelectorAll('.fill-hex-input').forEach(inp => {
      inp.addEventListener('change', (e) => {
        const idx = parseInt(inp.dataset.index, 10);
        const curFills = JSON.parse(JSON.stringify(s.fills || []));
        if (curFills[idx]) {
          curFills[idx].color = this.normalizeHexColor(e.target.value, curFills[idx].color || '#334155');
          this.engine.updateNode(node.id, { style: { fills: curFills } }, 'Change Fill Color');
        }
      });
    });
    document.querySelectorAll('.fill-type-select').forEach(select => {
      select.addEventListener('change', () => {
        const idx = Number(select.dataset.index);
        const nextFills = JSON.parse(JSON.stringify(node.style?.fills || []));
        if (!nextFills[idx]) return;
        const previous = nextFills[idx];
        const nextType = select.value;
        nextFills[idx] = nextType === 'linear-gradient'
          ? {
            ...previous,
            type: nextType,
            color: previous.color || '#3b82f6',
            stops: previous.stops?.length
              ? previous.stops
              : [{ offset: 0, color: previous.color || '#3b82f6' }, { offset: 1, color: '#8b5cf6' }]
          }
          : { ...previous, type: nextType };
        this.engine.updateNode(node.id, { style: { fills: nextFills } }, 'Change Fill Type');
      });
    });
    document.querySelectorAll('.gradient-stop-input').forEach(input => {
      input.addEventListener('change', () => {
        const idx = Number(input.dataset.index);
        const stopIndex = Number(input.dataset.stop);
        const nextFills = JSON.parse(JSON.stringify(node.style?.fills || []));
        const fill = nextFills[idx];
        if (!fill) return;
        fill.type = 'linear-gradient';
        fill.stops = fill.stops?.length
          ? fill.stops
          : [{ offset: 0, color: fill.color || '#3b82f6' }, { offset: 1, color: '#8b5cf6' }];
        fill.stops[stopIndex] = { ...fill.stops[stopIndex], offset: stopIndex, color: input.value };
        this.engine.updateNode(node.id, { style: { fills: nextFills } }, 'Change Gradient Stop');
      });
    });
    document.querySelectorAll('.btn-upload-fill').forEach(button => {
      button.addEventListener('click', () => {
        button.parentElement.querySelector('.fill-media-input')?.click();
      });
    });
    document.querySelectorAll('.fill-media-input').forEach(input => {
      input.addEventListener('change', async () => {
        const file = input.files?.[0];
        if (!file) return;
        const idx = Number(input.dataset.index);
        const nextFills = JSON.parse(JSON.stringify(node.style?.fills || []));
        const fill = nextFills[idx];
        if (!fill) return;
        const mediaType = fill.type;
        const validType = mediaType === 'video' ? file.type.startsWith('video/') : file.type.startsWith('image/');
        if (!validType) {
          this.showToast(`Choose a valid ${mediaType} file.`, 'error');
          input.value = '';
          return;
        }
        const existingMediaSize = this.doc.pages.reduce((total, currentPage) =>
          total + Object.values(currentPage.nodes).reduce((pageTotal, currentNode) =>
            pageTotal + (currentNode.style?.fills || []).reduce((size, currentFill, fillIndex) => {
              if (currentPage.id === page.id && currentNode.id === node.id && fillIndex === idx) return size;
              const data = currentFill.url?.match(/^data:[^,]*;base64,(.*)$/)?.[1];
              return size + (data ? Math.floor(data.length * 0.75) : 0);
            }, 0), 0), 0);
        if (file.size + existingMediaSize > 2 * 1024 * 1024) {
          this.showToast('Embedded media is limited to 2 MB per project so saved project files remain manageable.', 'error');
          input.value = '';
          return;
        }
        try {
          const dataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error || new Error('Could not read the selected media file.'));
            reader.readAsDataURL(file);
          });
          fill.url = dataUrl;
          fill.name = file.name;
          fill.mimeType = file.type;
          fill.opacity = fill.opacity ?? 1;
          this.engine.updateNode(node.id, { style: { fills: nextFills } }, `Upload ${mediaType}`);
          this.showToast(`${mediaType === 'video' ? 'Video' : 'Image'} added to fill.`, 'success');
        } catch (error) {
          this.showToast(`Could not load media: ${error.message}`, 'error');
        } finally {
          input.value = '';
        }
      });
    });
    document.querySelectorAll('.btn-generate-fill').forEach(button => {
      button.addEventListener('click', () => {
        this.showToast(`AI ${button.dataset.type} generation needs an image/video provider connection. Upload a media file to use this fill.`, 'error');
      });
    });

    // Fills Event Listeners
    document.querySelectorAll('.btn-toggle-fill-vis').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index, 10);
        const curFills = JSON.parse(JSON.stringify(node.style?.fills || []));
        if (curFills[idx]) {
          curFills[idx].visible = curFills[idx].visible === false ? true : false;
          this.engine.updateNode(node.id, { style: { fills: curFills } }, 'Toggle Fill Visibility');
          this.updateInspector();
        }
      });
    });

    document.querySelectorAll('.btn-toggle-fill-more').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = btn.dataset.index;
        const drawer = document.getElementById(`fillDrawer_${idx}`);
        if (drawer) {
          const isHidden = drawer.style.display === 'none' || !drawer.style.display;
          drawer.style.display = isHidden ? 'flex' : 'none';
        }
      });
    });

    document.querySelectorAll('.fill-opacity-input').forEach(inp => {
      inp.addEventListener('change', (e) => {
        const idx = parseInt(inp.dataset.index, 10);
        const val = Math.max(0, Math.min(100, parseFloat(e.target.value) || 100)) / 100;
        const curFills = JSON.parse(JSON.stringify(node.style?.fills || []));
        if (curFills[idx]) {
          curFills[idx].opacity = val;
          this.engine.updateNode(node.id, { style: { fills: curFills } }, 'Change Fill Opacity');
        }
      });
    });

    document.querySelectorAll('.fill-blend-select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const idx = parseInt(sel.dataset.index, 10);
        const curFills = JSON.parse(JSON.stringify(node.style?.fills || []));
        if (curFills[idx]) {
          curFills[idx].blendMode = e.target.value;
          this.engine.updateNode(node.id, { style: { fills: curFills } }, 'Change Fill Blend Mode');
        }
      });
    });

    document.querySelectorAll('.btn-move-fill-up').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index, 10);
        if (idx <= 0) return;
        const curFills = JSON.parse(JSON.stringify(node.style?.fills || []));
        const temp = curFills[idx];
        curFills[idx] = curFills[idx - 1];
        curFills[idx - 1] = temp;
        this.engine.updateNode(node.id, { style: { fills: curFills } }, 'Reorder Fills');
        this.updateInspector();
      });
    });

    document.querySelectorAll('.btn-move-fill-down').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index, 10);
        const curFills = JSON.parse(JSON.stringify(node.style?.fills || []));
        if (idx >= curFills.length - 1) return;
        const temp = curFills[idx];
        curFills[idx] = curFills[idx + 1];
        curFills[idx + 1] = temp;
        this.engine.updateNode(node.id, { style: { fills: curFills } }, 'Reorder Fills');
        this.updateInspector();
      });
    });

    document.querySelectorAll('.btn-duplicate-fill').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index, 10);
        const curFills = JSON.parse(JSON.stringify(node.style?.fills || []));
        if (curFills[idx]) {
          const copy = JSON.parse(JSON.stringify(curFills[idx]));
          curFills.splice(idx + 1, 0, copy);
          this.engine.updateNode(node.id, { style: { fills: curFills } }, 'Duplicate Fill');
          this.updateInspector();
        }
      });
    });

    document.querySelectorAll('.btn-detach-token').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index, 10);
        const curFills = JSON.parse(JSON.stringify(node.style?.fills || []));
        if (curFills[idx]) {
          delete curFills[idx].tokenId;
          delete curFills[idx].tokenName;
          this.engine.updateNode(node.id, { style: { fills: curFills } }, 'Detach Fill Token');
          this.updateInspector();
        }
      });
    });

    document.querySelectorAll('.btn-reverse-fill-stops').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index, 10);
        const curFills = JSON.parse(JSON.stringify(node.style?.fills || []));
        const f = curFills[idx];
        if (f && f.stops && f.stops.length > 1) {
          f.stops.reverse();
          f.stops.forEach(s => { s.offset = Math.round((1 - s.offset) * 100) / 100; });
          f.stops.sort((a, b) => a.offset - b.offset);
          this.engine.updateNode(node.id, { style: { fills: curFills } }, 'Reverse Gradient Stops');
          this.updateInspector();
        }
      });
    });

    document.querySelectorAll('.btn-edit-gradient').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.index);
        const fill = node.style?.fills?.[idx];
        if (!fill) return;
        const swatch = document.getElementById(`swatchFill_${idx}`) || btn;
        this.openNodeColorPicker(swatch, fill.stops?.[0]?.color || '#3b82f6', {
          node,
          mode: 'gradient',
          gradient: fill,
          description: 'Edit Gradient Fill',
          preview: () => {},
          commit: () => ({ style: { fills: node.style?.fills } }),
          onGradientChange: nextGradient => {
            const nextFills = JSON.parse(JSON.stringify(node.style?.fills || []));
            if (nextFills[idx]) {
              nextFills[idx] = { ...nextFills[idx], ...nextGradient };
              this.engine.updateNode(node.id, { style: { fills: nextFills } }, 'Edit Gradient Fill');
            }
          }
        });
      });
    });

    document.querySelectorAll('.paint-swatch:not(.stroke-swatch)').forEach(swatch => {
      swatch.addEventListener('click', (e) => {
        const idx = Number(swatch.dataset.index || 0);
        const fill = node.style?.fills?.[idx];
        if (!fill || fill.type === 'image' || fill.type === 'video') return;

        const isGrad = ['linear-gradient', 'gradient', 'radial-gradient', 'angular-gradient', 'conic-gradient', 'diamond-gradient'].includes(fill.type);
        if (isGrad) {
          this.openNodeColorPicker(e.currentTarget, fill.stops?.[0]?.color || fill.color || '#3b82f6', {
            node,
            mode: 'gradient',
            gradient: fill,
            description: 'Edit Gradient Fill',
            preview: () => {},
            commit: () => ({ style: { fills: node.style?.fills } }),
            onGradientChange: nextGradient => {
              const nextFills = JSON.parse(JSON.stringify(node.style?.fills || []));
              if (nextFills[idx]) {
                nextFills[idx] = { ...nextFills[idx], ...nextGradient };
                this.engine.updateNode(node.id, { style: { fills: nextFills } }, 'Edit Gradient Fill');
              }
            }
          });
        } else {
          this.openNodeColorPicker(e.currentTarget, fill.color || '#334155', {
            node,
            mode: 'solid',
            description: 'Change Fill Color',
            preview: color => { node.style.fills[idx].color = color; },
            commit: color => {
              const nextFills = JSON.parse(JSON.stringify(node.style?.fills || []));
              if (nextFills[idx]) nextFills[idx].color = color;
              return { style: { fills: nextFills } };
            }
          });
        }
      });
    });

    document.querySelectorAll('.btn-remove-fill').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index, 10);
        const curFills = JSON.parse(JSON.stringify(s.fills || []));
        curFills.splice(idx, 1);
        this.engine.updateNode(node.id, { style: { fills: curFills } }, 'Remove Fill');
      });
    });

    document.querySelectorAll('.btn-bind-token').forEach(btn => {
      btn.addEventListener('click', async () => {
        const idx = parseInt(btn.dataset.index, 10);
        const colorTokens = this.linter.getAllTokens().filter(t => t.type === 'color');
        const chosen = await this.showPromptModal({
          title: 'Bind Fill to Design Token',
          subtitle: 'Select from available design tokens or type token name:',
          defaultValue: colorTokens[0]?.name || '',
          presets: colorTokens.map(t => t.name),
          icon: 'Box',
          confirmText: 'Bind Token'
        });
        if (chosen) {
          const tok = colorTokens.find(t => t.name.toLowerCase() === chosen.toLowerCase() || chosen.includes(t.name)) || 
                      colorTokens[parseInt(chosen, 10) - 1];
          if (tok) {
            const curFills = JSON.parse(JSON.stringify(s.fills || []));
            if (curFills[idx]) {
              curFills[idx].color = tok.value;
              curFills[idx].tokenId = tok.id;
              curFills[idx].tokenName = tok.name;
              this.engine.updateNode(node.id, { style: { fills: curFills } }, 'Bind Fill to Token');
              this.showToast(`Bound fill to "${tok.name}"`, 'success');
            }
          }
        }
      });
    });

    // 6. Strokes Event Listeners
    document.getElementById('btnAddStroke')?.addEventListener('click', () => {
      const curStrokes = JSON.parse(JSON.stringify(s.strokes || []));
      curStrokes.push({ color: '#38bdf8', width: 1, align: 'inside' });
      this.engine.updateNode(node.id, { style: { strokes: curStrokes } }, 'Add Stroke');
    });

    document.querySelectorAll('.btn-toggle-stroke-vis').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index, 10);
        const curStrokes = JSON.parse(JSON.stringify(node.style?.strokes || []));
        if (curStrokes[idx]) {
          curStrokes[idx].visible = curStrokes[idx].visible === false ? true : false;
          this.engine.updateNode(node.id, { style: { strokes: curStrokes } }, 'Toggle Stroke Visibility');
          this.updateInspector();
        }
      });
    });

    document.querySelectorAll('.stroke-hex-input').forEach(inp => {
      inp.addEventListener('change', (e) => {
        const idx = parseInt(inp.dataset.index, 10);
        const curStrokes = JSON.parse(JSON.stringify(s.strokes || []));
        if (curStrokes[idx]) {
          curStrokes[idx].color = this.normalizeHexColor(e.target.value, curStrokes[idx].color || '#3b82f6');
          this.engine.updateNode(node.id, { style: { strokes: curStrokes } }, 'Change Stroke Color');
        }
      });
    });

    document.querySelectorAll('.stroke-swatch').forEach(swatch => {
      swatch.addEventListener('click', (e) => {
        const idx = Number(swatch.dataset.index);
        const stroke = node.style?.strokes?.[idx];
        if (!stroke) return;
        this.openNodeColorPicker(e.currentTarget, stroke.color || '#3b82f6', {
          node,
          description: 'Change Stroke Color',
          preview: color => { node.style.strokes[idx].color = color; },
          commit: color => {
            const nextStrokes = JSON.parse(JSON.stringify(node.style?.strokes || []));
            if (nextStrokes[idx]) nextStrokes[idx].color = color;
            return { style: { strokes: nextStrokes } };
          }
        });
      });
    });

    document.querySelectorAll('.stroke-opacity-input').forEach(inp => {
      inp.addEventListener('change', (e) => {
        const idx = parseInt(inp.dataset.index, 10);
        const val = Math.max(0, Math.min(100, parseFloat(e.target.value) || 100)) / 100;
        const curStrokes = JSON.parse(JSON.stringify(node.style?.strokes || []));
        if (curStrokes[idx]) {
          curStrokes[idx].opacity = val;
          this.engine.updateNode(node.id, { style: { strokes: curStrokes } }, 'Change Stroke Opacity');
        }
      });
    });

    document.querySelectorAll('.btn-toggle-stroke-more').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = btn.dataset.index;
        const drawer = document.getElementById(`strokeDrawer_${idx}`);
        if (drawer) {
          const isHidden = drawer.style.display === 'none' || !drawer.style.display;
          drawer.style.display = isHidden ? 'flex' : 'none';
        }
      });
    });

    document.querySelectorAll('.stroke-width-input').forEach(inp => {
      inp.addEventListener('change', (e) => {
        const idx = parseInt(inp.dataset.index, 10);
        const curStrokes = JSON.parse(JSON.stringify(s.strokes || []));
        if (curStrokes[idx]) {
          curStrokes[idx].width = Math.max(1, parseFloat(e.target.value) || 1);
          this.engine.updateNode(node.id, { style: { strokes: curStrokes } }, 'Change Stroke Width');
        }
      });
    });

    document.querySelectorAll('.stroke-align-select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const idx = parseInt(sel.dataset.index, 10);
        const curStrokes = JSON.parse(JSON.stringify(node.style?.strokes || []));
        if (curStrokes[idx]) {
          curStrokes[idx].align = e.target.value;
          curStrokes[idx].strokeAlign = e.target.value;
          this.engine.updateNode(node.id, { style: { strokes: curStrokes } }, 'Change Stroke Alignment');
        }
      });
    });

    document.querySelectorAll('.stroke-cap-select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const idx = parseInt(sel.dataset.index, 10);
        const curStrokes = JSON.parse(JSON.stringify(node.style?.strokes || []));
        if (curStrokes[idx]) {
          curStrokes[idx].strokeCap = e.target.value;
          this.engine.updateNode(node.id, { style: { strokes: curStrokes } }, 'Change Stroke Cap');
        }
      });
    });

    document.querySelectorAll('.stroke-join-select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const idx = parseInt(sel.dataset.index, 10);
        const curStrokes = JSON.parse(JSON.stringify(node.style?.strokes || []));
        if (curStrokes[idx]) {
          curStrokes[idx].strokeJoin = e.target.value;
          this.engine.updateNode(node.id, { style: { strokes: curStrokes } }, 'Change Stroke Join');
        }
      });
    });

    document.querySelectorAll('.stroke-dash-input').forEach(inp => {
      inp.addEventListener('change', (e) => {
        const idx = parseInt(inp.dataset.index, 10);
        const curStrokes = JSON.parse(JSON.stringify(node.style?.strokes || []));
        if (curStrokes[idx]) {
          const raw = String(e.target.value || '').trim();
          if (!raw) {
            curStrokes[idx].dashPattern = [];
          } else {
            const parts = raw.split(/[\s,]+/).map(Number).filter(n => !isNaN(n) && n > 0);
            curStrokes[idx].dashPattern = parts.length > 0 ? parts : [];
          }
          this.engine.updateNode(node.id, { style: { strokes: curStrokes } }, 'Change Stroke Dash');
        }
      });
    });

    document.querySelectorAll('.btn-toggle-stroke-sides').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = btn.dataset.index;
        const row = document.getElementById(`strokeSides_${idx}`);
        if (row) {
          row.style.display = row.style.display === 'none' ? 'flex' : 'none';
        }
      });
    });

    const updateStrokeWeight = (idx, side, val) => {
      const curStrokes = JSON.parse(JSON.stringify(node.style?.strokes || []));
      if (curStrokes[idx]) {
        if (!curStrokes[idx].strokeWeights) curStrokes[idx].strokeWeights = {};
        curStrokes[idx].strokeWeights[side] = Math.max(0, parseFloat(val) || 0);
        this.engine.updateNode(node.id, { style: { strokes: curStrokes } }, `Change ${side} Stroke Weight`);
      }
    };
    document.querySelectorAll('.stroke-weight-top').forEach(inp => {
      inp.addEventListener('change', (e) => updateStrokeWeight(parseInt(inp.dataset.index, 10), 'top', e.target.value));
    });
    document.querySelectorAll('.stroke-weight-right').forEach(inp => {
      inp.addEventListener('change', (e) => updateStrokeWeight(parseInt(inp.dataset.index, 10), 'right', e.target.value));
    });
    document.querySelectorAll('.stroke-weight-bottom').forEach(inp => {
      inp.addEventListener('change', (e) => updateStrokeWeight(parseInt(inp.dataset.index, 10), 'bottom', e.target.value));
    });
    document.querySelectorAll('.stroke-weight-left').forEach(inp => {
      inp.addEventListener('change', (e) => updateStrokeWeight(parseInt(inp.dataset.index, 10), 'left', e.target.value));
    });

    document.querySelectorAll('.btn-move-stroke-up').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index, 10);
        if (idx <= 0) return;
        const curStrokes = JSON.parse(JSON.stringify(node.style?.strokes || []));
        const temp = curStrokes[idx];
        curStrokes[idx] = curStrokes[idx - 1];
        curStrokes[idx - 1] = temp;
        this.engine.updateNode(node.id, { style: { strokes: curStrokes } }, 'Reorder Strokes');
        this.updateInspector();
      });
    });

    document.querySelectorAll('.btn-move-stroke-down').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index, 10);
        const curStrokes = JSON.parse(JSON.stringify(node.style?.strokes || []));
        if (idx >= curStrokes.length - 1) return;
        const temp = curStrokes[idx];
        curStrokes[idx] = curStrokes[idx + 1];
        curStrokes[idx + 1] = temp;
        this.engine.updateNode(node.id, { style: { strokes: curStrokes } }, 'Reorder Strokes');
        this.updateInspector();
      });
    });

    document.querySelectorAll('.btn-duplicate-stroke').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index, 10);
        const curStrokes = JSON.parse(JSON.stringify(node.style?.strokes || []));
        if (curStrokes[idx]) {
          const copy = JSON.parse(JSON.stringify(curStrokes[idx]));
          curStrokes.splice(idx + 1, 0, copy);
          this.engine.updateNode(node.id, { style: { strokes: curStrokes } }, 'Duplicate Stroke');
          this.updateInspector();
        }
      });
    });

    document.querySelectorAll('.btn-bind-stroke-token').forEach(btn => {
      btn.addEventListener('click', async () => {
        const idx = parseInt(btn.dataset.index, 10);
        const colorTokens = this.linter.getAllTokens().filter(t => t.type === 'color');
        const chosen = await this.showPromptModal({
          title: 'Bind Stroke to Design Token',
          subtitle: 'Select from available design tokens or type token name:',
          defaultValue: colorTokens[0]?.name || '',
          presets: colorTokens.map(t => t.name),
          icon: 'Box',
          confirmText: 'Bind Token'
        });
        if (chosen) {
          const tok = colorTokens.find(t => t.name.toLowerCase() === chosen.toLowerCase() || chosen.includes(t.name)) || 
                      colorTokens[parseInt(chosen, 10) - 1];
          if (tok) {
            const curStrokes = JSON.parse(JSON.stringify(node.style?.strokes || []));
            if (curStrokes[idx]) {
              curStrokes[idx].color = tok.value;
              curStrokes[idx].tokenId = tok.id;
              curStrokes[idx].tokenName = tok.name;
              this.engine.updateNode(node.id, { style: { strokes: curStrokes } }, 'Bind Stroke to Token');
              this.showToast(`Bound stroke to "${tok.name}"`, 'success');
            }
          }
        }
      });
    });

    document.querySelectorAll('.btn-remove-stroke').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index, 10);
        const curStrokes = JSON.parse(JSON.stringify(s.strokes || []));
        curStrokes.splice(idx, 1);
        this.engine.updateNode(node.id, { style: { strokes: curStrokes } }, 'Remove Stroke');
      });
    });

    // 7. Effects
    document.getElementById('btnAddEffect')?.addEventListener('click', () => {
      const curEffects = JSON.parse(JSON.stringify(s.shadows || []));
      curEffects.push({ type: 'drop-shadow', x: 0, y: 4, blur: 12, color: 'rgba(0,0,0,0.35)' });
      this.engine.updateNode(node.id, { style: { shadows: curEffects } }, 'Add Shadow Effect');
    });
    document.querySelectorAll('.btn-remove-effect').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index, 10);
        const curEffects = JSON.parse(JSON.stringify(s.shadows || []));
        curEffects.splice(idx, 1);
        this.engine.updateNode(node.id, { style: { shadows: curEffects } }, 'Remove Effect');
      });
    });

    // 8. Typography
    document.getElementById('propFontFamily')?.addEventListener('change', (e) => {
      this.engine.updateNode(node.id, { text: { fontFamily: e.target.value } }, 'Change Font Family');
      this.updateMissingFontsBadge();
    });
    document.getElementById('btnInspectorChangeMissingFont')?.addEventListener('click', () => {
      const rawFont = node.text?.fontFamily || 'Inter';
      const cleanFont = this.fontManager.cleanFontFamily(rawFont);
      this.openMissingFontsModal({ targetFont: cleanFont });
    });
    document.getElementById('btnInspectorSkipMissingFont')?.addEventListener('click', () => {
      const rawFont = node.text?.fontFamily || 'Inter';
      const cleanFont = this.fontManager.cleanFontFamily(rawFont);
      this.fontManager.skipMissingFont(cleanFont);
      this.showToast(`Skipped font change for "${cleanFont}". Layer kept as-is.`, 'info');
      this.updateInspector();
      this.updateMissingFontsBadge();
    });
    document.getElementById('propFontSize')?.addEventListener('change', (e) => {
      this.engine.updateNode(node.id, { text: { fontSize: this.evalExpr(e.target.value, 16) } }, 'Change Font Size');
    });
    document.getElementById('propFontWeight')?.addEventListener('change', (e) => {
      this.engine.updateNode(node.id, { text: { fontWeight: e.target.value } }, 'Change Font Weight');
    });
    document.getElementById('propTextContent')?.addEventListener('change', (e) => {
      this.engine.updateNode(node.id, { text: { content: e.target.value } }, 'Edit Text');
    });
    document.getElementById('propTextColor')?.addEventListener('change', (e) => {
      const color = this.normalizeHexColor(e.target.value, node.text?.color || '#f8fafc');
      this.engine.updateNode(node.id, { text: { color } }, 'Change Text Color');
    });
    document.getElementById('swatchTextColor')?.addEventListener('click', (e) => {
      this.openNodeColorPicker(e.currentTarget, node.text?.color || '#f8fafc', {
        node,
        description: 'Change Text Color',
        preview: color => { node.text.color = color; },
        commit: color => ({ text: { color } })
      });
    });
    document.getElementById('btnAlignLeft')?.addEventListener('click', () => {
      this.engine.updateNode(node.id, { text: { textAlign: 'left' } }, 'Align Text Left');
    });
    document.getElementById('btnAlignCenter')?.addEventListener('click', () => {
      this.engine.updateNode(node.id, { text: { textAlign: 'center' } }, 'Align Text Center');
    });
    document.getElementById('btnAlignRight')?.addEventListener('click', () => {
      this.engine.updateNode(node.id, { text: { textAlign: 'right' } }, 'Align Text Right');
    });

    // 9. Recolor the exact visible properties represented by each selection color.
    document.querySelectorAll('.btn-select-color-matches').forEach(btn => {
      btn.addEventListener('click', () => {
        const entry = selectionColors[Number(btn.dataset.colorIndex)];
        if (!entry) return;
        const pageEntries = collectSelectionColors(page, page.rootIds || [], this.dsRegistry.getAllTokens());
        const matching = pageEntries.find(candidate => candidate.key === entry.key);
        const nodeIds = matching?.nodeIds || entry.nodeIds;
        if (nodeIds.length > 0) {
          this.engine.setSelection(nodeIds);
          this.showToast(`Selected ${nodeIds.length} matching object${nodeIds.length === 1 ? '' : 's'}`, 'info');
        }
      });
    });
    document.querySelectorAll('.btn-recolor-selection-color').forEach(btn => {
      btn.addEventListener('click', async () => {
        const entry = selectionColors[Number(btn.dataset.colorIndex)];
        if (!entry) return;
        const newHex = await this.showPromptModal({
          title: entry.tokenId || entry.tokenName || entry.unresolved ? 'Detach and Recolor Selection' : 'Recolor Selection',
          subtitle: entry.tokenId || entry.tokenName || entry.unresolved
            ? `Replace ${entry.color} locally and detach ${entry.tokenName || 'the linked color resource'} from these selected properties.`
            : `Replace matching ${entry.color} values in the current selection:`,
          defaultValue: entry.color,
          presets: ['#6366F1', '#4F46E5', '#38BDF8', '#10B981', '#F59E0B', '#EF4444', '#FFFFFF', '#0F172A'],
          icon: 'Palette',
          confirmText: 'Replace Color'
        });
        if (!newHex) return;
        const color = this.normalizeHexColor(newHex, '');
        if (!color) {
          this.showToast('Enter a valid HEX color before applying the recolor.', 'error');
          return;
        }
        if (color.toLowerCase() === entry.color.toLowerCase()) return;

        try {
          const updates = buildSelectionColorUpdates(page, entry.targets, color, { detachBindings: Boolean(entry.tokenId || entry.tokenName || entry.unresolved) });
          if (this.engine.updateNodes(updates, 'Recolor Selection')) {
            this.showToast(`Recolored ${entry.count} matching color properties`, 'success');
          }
        } catch (error) {
          this.showToast(`Could not recolor selection: ${error.message}`, 'error');
        }
      });
    });

    document.querySelectorAll('.selection-color-item .paint-swatch, .selection-color-item .selection-color-hex').forEach(el => {
      el.addEventListener('click', () => {
        const idx = el.dataset.colorIndex;
        const btn = document.querySelector(`.btn-recolor-selection-color[data-color-index="${idx}"]`);
        if (btn) btn.click();
      });
    });

    // 10. Instant Export Buttons
    document.getElementById('btnExportSelectionPng')?.addEventListener('click', () => this.exportSelectedAsPng());
    document.getElementById('btnExportSelectionSvg')?.addEventListener('click', () => this.exportSelectedAsSvg());
  }

  // --- Prototype Panel Synchronizer (Figma UI3 Parity) ---
  updatePrototypePanel() {
    const container = document.getElementById('prototypePanelContent');
    if (!container) return;
    const selectedIds = this.engine.getSelection();
    const page = this.engine.getActivePage();
    const frames = (page.rootIds || []).map(id => page.nodes[id]).filter(n => n && n.type === 'frame');

    if (selectedIds.length === 0) {
      const startingFrames = frames.filter(f => f.isFlowStart || f.flowName);
      const docVars = this.doc.variables || [];

      container.innerHTML = `
        <div style="margin-bottom: 14px;">
          <div class="section-title" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span>Flow Starting Points (${startingFrames.length})</span>
          </div>
          ${startingFrames.length === 0 ? `
            <div style="font-size: 11px; color: var(--text-muted); background: var(--bg-surface); padding: 10px; border-radius: 6px; border: 1px dashed var(--border-subtle); margin-bottom: 10px;">
              No flows started yet. Select a frame on the canvas and check "Set as Flow Starting Point" to create a user flow.
            </div>
            ${frames.length > 0 ? `
              <button class="btn-secondary" id="btnMakeFirstFlowStart" style="width: 100%; font-size: 11px; margin-bottom: 10px;">+ Set "${this.escapeAttr(frames[0].name)}" as Flow 1</button>
            ` : ''}
          ` : `
            <div style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px;">
              ${startingFrames.map((f, i) => `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 10px; background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: 6px;">
                  <div>
                    <div style="font-size: 11px; font-weight: 600; color: #38bdf8;"><span data-icon="Play"></span> ${this.escapeAttr(f.flowName || f.name || `Flow ${i + 1}`)}</div>
                    <div style="font-size: 10px; color: var(--text-dim);">Frame: ${this.escapeAttr(f.name)}</div>
                  </div>
                  <button class="btn-icon-xs btn-play-flow" data-frame-id="${f.id}" title="Play this flow" style="color: #10b981;"><span data-icon="Play"></span></button>
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <div style="margin-bottom: 14px;">
          <div class="section-title" style="margin-bottom: 8px;">Prototype Presentation Settings</div>
          <div class="props-row" style="margin-bottom: 6px;">
            <span style="font-size: 11px; color: var(--text-dim);">Device Preset:</span>
            <select class="prop-select" id="protoSettingDevice" style="font-size: 11px;">
              <option value="desktop" ${this.prototype.currentDevice === 'desktop' ? 'selected' : ''}>MacBook Pro (1440 × 900)</option>
              <option value="iphone16" ${this.prototype.currentDevice === 'iphone16' || this.prototype.currentDevice === 'mobile' ? 'selected' : ''}>iPhone 16 Pro (393 × 852)</option>
              <option value="pixel9" ${this.prototype.currentDevice === 'pixel9' ? 'selected' : ''}>Google Pixel 9 (412 × 923)</option>
              <option value="tablet" ${this.prototype.currentDevice === 'tablet' ? 'selected' : ''}>iPad Pro (768 × 1024)</option>
              <option value="responsive" ${this.prototype.currentDevice === 'responsive' ? 'selected' : ''}>Responsive Fullscreen</option>
            </select>
          </div>
          <div class="props-row" style="margin-bottom: 6px;">
            <span style="font-size: 11px; color: var(--text-dim);">Background:</span>
            <input type="text" class="prop-input" id="protoSettingBg" value="#090d16" style="width: 80px; font-size: 11px;">
          </div>
        </div>

        <div style="margin-bottom: 14px;">
          <div class="section-title" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span>Prototype Variables (${docVars.length})</span>
            <button class="btn-icon-xs" id="btnAddProtoVar" style="color: #38bdf8;">+ Var</button>
          </div>
          ${docVars.length === 0 ? `
            <div style="font-size: 11px; color: var(--text-muted); background: var(--bg-surface); padding: 8px; border-radius: 6px;">
              No variables defined yet. Click + Var to create reactive state.
            </div>
          ` : `
            <div style="display: flex; flex-direction: column; gap: 4px; max-height: 120px; overflow-y: auto;">
              ${docVars.map(v => `
                <div style="display: flex; justify-content: space-between; font-size: 11px; padding: 4px 6px; background: var(--bg-surface); border-radius: 4px;">
                  <code style="color: #38bdf8;">${this.escapeAttr(v.name || v.id)}</code>
                  <span style="color: var(--text-dim);">${this.escapeAttr(String(v.value !== undefined ? v.value : ''))}</span>
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <div style="margin-top: 14px;">
          <button class="btn-primary" id="btnLaunchProtoSim" style="width: 100%; font-size: 11px;"><span data-icon="Play"></span> Launch Prototype Simulator (⌥⌘P)</button>
        </div>
      `;

      document.getElementById('btnMakeFirstFlowStart')?.addEventListener('click', () => {
        if (frames[0]) {
          this.engine.updateNode(frames[0].id, { isFlowStart: true, flowName: 'Flow 1' }, 'Set Flow Starting Point');
          this.updatePrototypePanel();
          this.renderer.render();
        }
      });

      container.querySelectorAll('.btn-play-flow').forEach(btn => {
        btn.addEventListener('click', () => {
          this.prototype.currentFrameId = btn.dataset.frameId;
          this.openPrototypeModal();
        });
      });

      document.getElementById('protoSettingDevice')?.addEventListener('change', (e) => {
        this.prototype.setDevice(e.target.value);
      });

      document.getElementById('btnAddProtoVar')?.addEventListener('click', () => {
        const name = prompt('Variable Name (e.g. cart_count, user_name, is_logged_in):');
        if (!name) return;
        const initial = prompt('Initial Value (number, boolean true/false, or text):', '0');
        let parsed = initial;
        let type = 'string';
        if (initial === 'true' || initial === 'false') { parsed = initial === 'true'; type = 'boolean'; }
        else if (!isNaN(Number(initial)) && initial.trim() !== '') { parsed = Number(initial); type = 'number'; }
        const curVars = this.doc.variables || [];
        curVars.push({ id: name, name, type, value: parsed, initialValue: parsed });
        this.doc.variables = curVars;
        this.prototype.initVariables();
        this.updatePrototypePanel();
      });

      document.getElementById('btnLaunchProtoSim')?.addEventListener('click', () => {
        this.openPrototypeModal();
      });

      const addBtn = document.getElementById('btnAddInteractionBtn');
      if (addBtn) addBtn.onclick = () => {
        this.showToast('Select a layer or frame first to add an interaction.', 'info');
      };

      return;
    }

    const node = this.engine.getNode(selectedIds[0]);
    if (!node) return;

    const interactions = node.interactions || [];

    container.innerHTML = `
      <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 10px;">
        Layer: <strong>${this.escapeAttr(node.name)}</strong> (${this.escapeAttr(node.type)})
      </div>

      <!-- Flow Starting Point Toggle & Name -->
      <div class="props-row" style="margin-bottom: 12px; padding: 10px; background: var(--bg-surface); border-radius: 6px; border: 1px solid var(--border-subtle); display: flex; flex-direction: column; gap: 8px;">
        <label style="display: flex; align-items: center; gap: 8px; font-size: 11px; cursor: pointer;">
          <input type="checkbox" id="chkFlowStart" ${node.isFlowStart ? 'checked' : ''}>
          <span style="font-weight: 600;">Set as Flow Starting Point</span>
        </label>
        ${node.isFlowStart ? `
          <div style="display: flex; flex-direction: column; gap: 4px; width: 100%;">
            <span style="font-size: 10px; color: var(--text-dim);">Flow Name:</span>
            <input type="text" class="prop-input" id="txtFlowName" value="${this.escapeAttr(node.flowName || node.name || 'Flow 1')}" placeholder="Flow Name">
          </div>
        ` : ''}
      </div>

      <div class="section-title" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span>Interactions (${interactions.length})</span>
      </div>

      ${interactions.map((int, idx) => `
      <div class="proto-interaction-card" style="padding: 10px; background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: 6px; margin-bottom: 10px; display: flex; flex-direction: column; gap: 8px;">
        <div class="proto-row" style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: 600; color: #38bdf8;"><span data-icon="Zap"></span> Interaction ${idx + 1}</span>
          <button class="btn-icon-xs btn-remove-interaction" data-index="${idx}" title="Remove interaction" aria-label="Remove interaction"><span data-icon="X"></span></button>
        </div>

        <!-- Trigger Selector -->
        <div class="proto-row">
          <span style="color: var(--text-dim);">Trigger:</span>
          <select class="prop-select sel-trigger" data-index="${idx}" style="font-size: 11px;">
            <option value="click" ${int.trigger === 'click' ? 'selected' : ''}>On Click / On Tap</option>
            <option value="drag" ${int.trigger === 'drag' ? 'selected' : ''}>On Drag</option>
            <option value="hover" ${int.trigger === 'hover' ? 'selected' : ''}>While Hovering</option>
            <option value="press" ${int.trigger === 'press' ? 'selected' : ''}>While Pressing</option>
            <option value="enter" ${int.trigger === 'enter' ? 'selected' : ''}>Mouse Enter</option>
            <option value="leave" ${int.trigger === 'leave' ? 'selected' : ''}>Mouse Leave</option>
            <option value="down" ${int.trigger === 'down' ? 'selected' : ''}>Mouse Down</option>
            <option value="up" ${int.trigger === 'up' ? 'selected' : ''}>Mouse Up</option>
            <option value="delay" ${int.trigger === 'delay' ? 'selected' : ''}>After Delay</option>
            <option value="key" ${int.trigger === 'key' ? 'selected' : ''}>Key / Gamepad</option>
            <option value="scroll" ${int.trigger === 'scroll' ? 'selected' : ''}>On Scroll</option>
          </select>
        </div>

        ${int.trigger === 'delay' ? `
        <div class="proto-row">
          <span style="color: var(--text-dim);">Delay (ms):</span>
          <input type="number" class="prop-input sel-delay" data-index="${idx}" value="${int.delay || 500}" min="10" step="50" style="font-size: 11px;">
        </div>` : ''}

        ${int.trigger === 'key' ? `
        <div class="proto-row">
          <span style="color: var(--text-dim);">Key:</span>
          <input type="text" class="prop-input sel-key" data-index="${idx}" value="${this.escapeAttr(int.key || 'Enter')}" placeholder="Enter, Escape, Space...">
        </div>` : ''}

        <!-- Action Selector -->
        <div class="proto-row">
          <span style="color: var(--text-dim);">Action:</span>
          <select class="prop-select sel-action" data-index="${idx}" style="font-size: 11px;">
            <option value="navigate" ${int.action === 'navigate' ? 'selected' : ''}>Navigate To Frame</option>
            <option value="overlay" ${int.action === 'overlay' ? 'selected' : ''}>Open Modal Overlay</option>
            <option value="swap_overlay" ${int.action === 'swap_overlay' ? 'selected' : ''}>Swap Overlay</option>
            <option value="close_overlay" ${int.action === 'close_overlay' ? 'selected' : ''}>Close Overlay</option>
            <option value="back" ${int.action === 'back' ? 'selected' : ''}>Go Back</option>
            <option value="scroll_to" ${int.action === 'scroll_to' ? 'selected' : ''}>Scroll To Element</option>
            <option value="url" ${int.action === 'url' ? 'selected' : ''}>Open External URL</option>
            <option value="set_variable" ${int.action === 'set_variable' ? 'selected' : ''}>Set Variable (Logic)</option>
            <option value="set_variable_mode" ${int.action === 'set_variable_mode' ? 'selected' : ''}>Set Variable Mode</option>
            <option value="conditional" ${int.action === 'conditional' ? 'selected' : ''}>Conditional (If / Else)</option>
            <option value="change_to" ${int.action === 'change_to' ? 'selected' : ''}>Change Component Variant</option>
          </select>
        </div>

        <!-- Target Frame for Navigate / Overlay -->
        ${int.action === 'navigate' || int.action === 'overlay' || int.action === 'swap_overlay' ? `
        <div class="proto-row">
          <span style="color: var(--text-dim);">Target:</span>
          <select class="prop-select sel-target" data-index="${idx}" style="font-size: 11px;">
            ${frames.length
              ? frames.map(f => `<option value="${f.id}" ${int.targetId === f.id ? 'selected' : ''}>${this.escapeAttr(f.name)}</option>`).join('')
              : '<option value="">No frames on this page</option>'}
          </select>
        </div>` : ''}

        ${int.action === 'overlay' ? `
        <div class="proto-row">
          <span style="color: var(--text-dim);">Position:</span>
          <select class="prop-select sel-overlay-pos" data-index="${idx}" style="font-size: 11px;">
            <option value="center" ${int.overlayPosition === 'center' ? 'selected' : ''}>Centered</option>
            <option value="top-center" ${int.overlayPosition === 'top-center' ? 'selected' : ''}>Top Center</option>
            <option value="bottom-center" ${int.overlayPosition === 'bottom-center' ? 'selected' : ''}>Bottom Center</option>
            <option value="top-left" ${int.overlayPosition === 'top-left' ? 'selected' : ''}>Top Left</option>
            <option value="bottom-left" ${int.overlayPosition === 'bottom-left' ? 'selected' : ''}>Bottom Left</option>
            <option value="manual" ${int.overlayPosition === 'manual' ? 'selected' : ''}>Manual (Designed pos)</option>
          </select>
        </div>
        <div class="proto-row">
          <label style="display: flex; align-items: center; gap: 6px; font-size: 11px; cursor: pointer;">
            <input type="checkbox" class="chk-overlay-outside" data-index="${idx}" ${int.closeOnClickOutside !== false ? 'checked' : ''}>
            <span>Close when clicking outside</span>
          </label>
        </div>` : ''}

        ${int.action === 'url' ? `
        <div class="proto-row">
          <span style="color: var(--text-dim);">URL:</span>
          <input type="url" class="prop-input sel-url" data-index="${idx}" value="${this.escapeAttr(int.url || '')}" placeholder="https://example.com">
        </div>` : ''}

        ${int.action === 'set_variable' ? `
        <div class="proto-row">
          <span style="color: var(--text-dim);">Variable:</span>
          <input type="text" class="prop-input sel-var-id" data-index="${idx}" value="${this.escapeAttr(int.variableId || '')}" placeholder="e.g. cart_count">
        </div>
        <div class="proto-row">
          <span style="color: var(--text-dim);">Operator:</span>
          <select class="prop-select sel-var-op" data-index="${idx}" style="font-size: 11px;">
            <option value="=" ${int.operator === '=' ? 'selected' : ''}>= (Set to)</option>
            <option value="+=" ${int.operator === '+=' ? 'selected' : ''}>+= (Add)</option>
            <option value="-=" ${int.operator === '-=' ? 'selected' : ''}>-= (Subtract)</option>
            <option value="*=" ${int.operator === '*=' ? 'selected' : ''}>*= (Multiply)</option>
            <option value="/=" ${int.operator === '/=' ? 'selected' : ''}>/= (Divide)</option>
            <option value="toggle" ${int.operator === 'toggle' ? 'selected' : ''}>toggle (Boolean)</option>
          </select>
        </div>
        <div class="proto-row">
          <span style="color: var(--text-dim);">Expr / Value:</span>
          <input type="text" class="prop-input sel-var-val" data-index="${idx}" value="${this.escapeAttr(int.value !== undefined ? String(int.value) : (int.expr || '1'))}" placeholder="1 or expression">
        </div>` : ''}

        ${int.action === 'conditional' ? `
        <div class="proto-row">
          <span style="color: var(--text-dim);">If Cond:</span>
          <input type="text" class="prop-input sel-cond-expr" data-index="${idx}" value="${this.escapeAttr(int.condition || 'cart_count > 0')}" placeholder="cart_count > 0">
        </div>
        <div class="proto-row">
          <span style="color: var(--text-dim);">Then Frame:</span>
          <select class="prop-select sel-cond-then" data-index="${idx}" style="font-size: 11px;">
            ${frames.map(f => `<option value="${f.id}" ${int.thenTarget === f.id ? 'selected' : ''}>${this.escapeAttr(f.name)}</option>`).join('')}
          </select>
        </div>
        <div class="proto-row">
          <span style="color: var(--text-dim);">Else Frame:</span>
          <select class="prop-select sel-cond-else" data-index="${idx}" style="font-size: 11px;">
            <option value="">(None)</option>
            ${frames.map(f => `<option value="${f.id}" ${int.elseTarget === f.id ? 'selected' : ''}>${this.escapeAttr(f.name)}</option>`).join('')}
          </select>
        </div>` : ''}

        ${int.action === 'change_to' ? `
        <div class="proto-row">
          <span style="color: var(--text-dim);">Variant:</span>
          <input type="text" class="prop-input sel-variant-id" data-index="${idx}" value="${this.escapeAttr(int.variantId || 'active')}" placeholder="e.g. hover, active">
        </div>` : ''}

        <!-- Animation / Transition Settings -->
        <div class="proto-row">
          <span style="color: var(--text-dim);">Animation:</span>
          <select class="prop-select sel-anim" data-index="${idx}" style="font-size: 11px;">
            <option value="instant" ${int.animation === 'instant' ? 'selected' : ''}>Instant</option>
            <option value="dissolve" ${int.animation === 'dissolve' ? 'selected' : ''}>Dissolve</option>
            <option value="smart-animate" ${int.animation === 'smart-animate' ? 'selected' : ''}>Smart Animate</option>
            <option value="slide-left" ${int.animation === 'slide-left' ? 'selected' : ''}>Slide Left</option>
            <option value="slide-right" ${int.animation === 'slide-right' ? 'selected' : ''}>Slide Right</option>
            <option value="slide-up" ${int.animation === 'slide-up' ? 'selected' : ''}>Slide Up</option>
            <option value="slide-down" ${int.animation === 'slide-down' ? 'selected' : ''}>Slide Down</option>
            <option value="push" ${int.animation === 'push' ? 'selected' : ''}>Push</option>
          </select>
        </div>

        <div class="proto-row">
          <span style="color: var(--text-dim);">Easing:</span>
          <select class="prop-select sel-easing" data-index="${idx}" style="font-size: 11px;">
            <option value="ease-out" ${int.easing === 'ease-out' ? 'selected' : ''}>Ease Out</option>
            <option value="ease-in-out" ${int.easing === 'ease-in-out' ? 'selected' : ''}>Ease In and Out</option>
            <option value="ease-in" ${int.easing === 'ease-in' ? 'selected' : ''}>Ease In</option>
            <option value="linear" ${int.easing === 'linear' ? 'selected' : ''}>Linear</option>
            <option value="gentle" ${int.easing === 'gentle' ? 'selected' : ''}>Gentle Spring</option>
            <option value="quick" ${int.easing === 'quick' ? 'selected' : ''}>Quick Spring</option>
            <option value="bouncy" ${int.easing === 'bouncy' ? 'selected' : ''}>Bouncy Spring</option>
            <option value="slow" ${int.easing === 'slow' ? 'selected' : ''}>Slow Spring</option>
          </select>
        </div>

        <div class="proto-row">
          <span style="color: var(--text-dim);">Duration:</span>
          <div style="display: flex; align-items: center; gap: 4px;">
            <input type="number" class="prop-input sel-duration" data-index="${idx}" value="${int.duration || 300}" min="0" step="50" style="width: 70px; font-size: 11px;">
            <span style="font-size: 10px; color: var(--text-dim);">ms</span>
          </div>
        </div>
      </div>
      `).join('')}

      <div style="margin-top: 14px;">
        <button class="btn-primary" id="btnLaunchProtoSim" style="width: 100%; font-size: 11px;"><span data-icon="Play"></span> Launch Prototype Simulator (⌥⌘P)</button>
      </div>
    `;

    // Event Wire-up
    document.getElementById('chkFlowStart')?.addEventListener('change', (e) => {
      this.engine.updateNode(node.id, { isFlowStart: e.target.checked, flowName: node.flowName || node.name || 'Flow 1' }, 'Toggle Flow Starting Point');
      this.updatePrototypePanel();
      this.renderer.render();
    });

    document.getElementById('txtFlowName')?.addEventListener('change', (e) => {
      this.engine.updateNode(node.id, { flowName: e.target.value.trim() }, 'Rename Flow');
      this.renderer.render();
    });

    const addInteractionButton = document.getElementById('btnAddInteractionBtn');
    if (addInteractionButton) addInteractionButton.onclick = () => {
      const cur = JSON.parse(JSON.stringify(node.interactions || []));
      const targetId = frames.find(frame => frame.id !== node.id)?.id || frames[0]?.id || null;
      cur.push({ trigger: 'click', action: 'navigate', targetId, animation: 'smart-animate', easing: 'ease-out', duration: 300 });
      this.engine.updateNode(node.id, { interactions: cur }, 'Add Interaction');
      this.updatePrototypePanel();
      this.renderer.render();
    };

    container.querySelectorAll('.btn-remove-interaction').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index, 10);
        const cur = JSON.parse(JSON.stringify(node.interactions || []));
        cur.splice(idx, 1);
        this.engine.updateNode(node.id, { interactions: cur }, 'Remove Interaction');
        this.updatePrototypePanel();
        this.renderer.render();
      });
    });

    container.querySelectorAll('.sel-trigger').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const idx = parseInt(sel.dataset.index, 10);
        const cur = JSON.parse(JSON.stringify(node.interactions || []));
        if (cur[idx]) {
          cur[idx].trigger = e.target.value;
          this.engine.updateNode(node.id, { interactions: cur }, 'Change Trigger');
          this.updatePrototypePanel();
          this.renderer.render();
        }
      });
    });

    container.querySelectorAll('.sel-delay').forEach(inp => {
      inp.addEventListener('change', (e) => {
        const idx = parseInt(inp.dataset.index, 10);
        const cur = JSON.parse(JSON.stringify(node.interactions || []));
        if (cur[idx]) {
          cur[idx].delay = Number(e.target.value) || 500;
          this.engine.updateNode(node.id, { interactions: cur }, 'Change Delay');
        }
      });
    });

    container.querySelectorAll('.sel-key').forEach(inp => {
      inp.addEventListener('change', (e) => {
        const idx = parseInt(inp.dataset.index, 10);
        const cur = JSON.parse(JSON.stringify(node.interactions || []));
        if (cur[idx]) {
          cur[idx].key = e.target.value.trim();
          this.engine.updateNode(node.id, { interactions: cur }, 'Change Key');
        }
      });
    });

    container.querySelectorAll('.sel-action').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const idx = Number(sel.dataset.index);
        const cur = JSON.parse(JSON.stringify(node.interactions || []));
        if (cur[idx]) {
          cur[idx].action = e.target.value;
          this.engine.updateNode(node.id, { interactions: cur }, 'Change Action');
          this.updatePrototypePanel();
          this.renderer.render();
        }
      });
    });

    container.querySelectorAll('.sel-target').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const idx = parseInt(sel.dataset.index, 10);
        const cur = JSON.parse(JSON.stringify(node.interactions || []));
        if (cur[idx]) {
          cur[idx].targetId = e.target.value;
          this.engine.updateNode(node.id, { interactions: cur }, 'Change Target Frame');
          this.renderer.render();
        }
      });
    });

    container.querySelectorAll('.sel-overlay-pos').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const idx = parseInt(sel.dataset.index, 10);
        const cur = JSON.parse(JSON.stringify(node.interactions || []));
        if (cur[idx]) {
          cur[idx].overlayPosition = e.target.value;
          this.engine.updateNode(node.id, { interactions: cur }, 'Change Overlay Position');
        }
      });
    });

    container.querySelectorAll('.chk-overlay-outside').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const idx = parseInt(chk.dataset.index, 10);
        const cur = JSON.parse(JSON.stringify(node.interactions || []));
        if (cur[idx]) {
          cur[idx].closeOnClickOutside = e.target.checked;
          this.engine.updateNode(node.id, { interactions: cur }, 'Change Overlay Dismiss');
        }
      });
    });

    container.querySelectorAll('.sel-anim').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const idx = Number(sel.dataset.index);
        const cur = JSON.parse(JSON.stringify(node.interactions || []));
        if (cur[idx]) {
          cur[idx].animation = e.target.value;
          this.engine.updateNode(node.id, { interactions: cur }, 'Change Animation');
        }
      });
    });

    container.querySelectorAll('.sel-easing').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const idx = Number(sel.dataset.index);
        const cur = JSON.parse(JSON.stringify(node.interactions || []));
        if (cur[idx]) {
          cur[idx].easing = e.target.value;
          this.engine.updateNode(node.id, { interactions: cur }, 'Change Easing');
        }
      });
    });

    container.querySelectorAll('.sel-duration').forEach(inp => {
      inp.addEventListener('change', (e) => {
        const idx = Number(inp.dataset.index);
        const cur = JSON.parse(JSON.stringify(node.interactions || []));
        if (cur[idx]) {
          cur[idx].duration = Number(e.target.value) || 300;
          this.engine.updateNode(node.id, { interactions: cur }, 'Change Duration');
        }
      });
    });

    container.querySelectorAll('.sel-url').forEach(input => {
      input.addEventListener('change', (e) => {
        const idx = Number(input.dataset.index);
        const cur = JSON.parse(JSON.stringify(node.interactions || []));
        if (cur[idx]) {
          cur[idx].url = e.target.value.trim();
          this.engine.updateNode(node.id, { interactions: cur }, 'Change Interaction URL');
        }
      });
    });

    container.querySelectorAll('.sel-var-id').forEach(inp => {
      inp.addEventListener('change', (e) => {
        const idx = Number(inp.dataset.index);
        const cur = JSON.parse(JSON.stringify(node.interactions || []));
        if (cur[idx]) {
          cur[idx].variableId = e.target.value.trim();
          this.engine.updateNode(node.id, { interactions: cur }, 'Change Variable ID');
        }
      });
    });

    container.querySelectorAll('.sel-var-op').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const idx = Number(sel.dataset.index);
        const cur = JSON.parse(JSON.stringify(node.interactions || []));
        if (cur[idx]) {
          cur[idx].operator = e.target.value;
          this.engine.updateNode(node.id, { interactions: cur }, 'Change Variable Operator');
        }
      });
    });

    container.querySelectorAll('.sel-var-val').forEach(inp => {
      inp.addEventListener('change', (e) => {
        const idx = Number(inp.dataset.index);
        const cur = JSON.parse(JSON.stringify(node.interactions || []));
        if (cur[idx]) {
          const v = e.target.value.trim();
          cur[idx].value = !isNaN(Number(v)) ? Number(v) : (v === 'true' ? true : v === 'false' ? false : v);
          cur[idx].expr = v;
          this.engine.updateNode(node.id, { interactions: cur }, 'Change Variable Value');
        }
      });
    });

    container.querySelectorAll('.sel-cond-expr').forEach(inp => {
      inp.addEventListener('change', (e) => {
        const idx = Number(inp.dataset.index);
        const cur = JSON.parse(JSON.stringify(node.interactions || []));
        if (cur[idx]) {
          cur[idx].condition = e.target.value.trim();
          this.engine.updateNode(node.id, { interactions: cur }, 'Change Condition Expr');
        }
      });
    });

    container.querySelectorAll('.sel-cond-then').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const idx = Number(sel.dataset.index);
        const cur = JSON.parse(JSON.stringify(node.interactions || []));
        if (cur[idx]) {
          cur[idx].thenTarget = e.target.value;
          cur[idx].thenAction = { action: 'navigate', targetId: e.target.value };
          this.engine.updateNode(node.id, { interactions: cur }, 'Change Then Branch');
        }
      });
    });

    container.querySelectorAll('.sel-cond-else').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const idx = Number(sel.dataset.index);
        const cur = JSON.parse(JSON.stringify(node.interactions || []));
        if (cur[idx]) {
          cur[idx].elseTarget = e.target.value;
          cur[idx].elseAction = e.target.value ? { action: 'navigate', targetId: e.target.value } : null;
          this.engine.updateNode(node.id, { interactions: cur }, 'Change Else Branch');
        }
      });
    });

    container.querySelectorAll('.sel-variant-id').forEach(inp => {
      inp.addEventListener('change', (e) => {
        const idx = Number(inp.dataset.index);
        const cur = JSON.parse(JSON.stringify(node.interactions || []));
        if (cur[idx]) {
          cur[idx].variantId = e.target.value.trim();
          cur[idx].variant = e.target.value.trim();
          this.engine.updateNode(node.id, { interactions: cur }, 'Change Variant ID');
        }
      });
    });

    document.getElementById('btnLaunchProtoSim')?.addEventListener('click', () => {
      this.openPrototypeModal();
    });
  }

  // --- Inspect / Dev Mode Panel Synchronizer (Section 4.3 & Appendix A2.5) ---
  updateInspectPanel() {
    const selectedIds = this.engine.getSelection();
    const boxModelEl = document.getElementById('inspectBoxModelWidget');
    const tokenSec = document.getElementById('inspectTokenUsageSection');
    const codeOut = document.getElementById('inspectCodeOutput');
    if (!codeOut) return;

    if (selectedIds.length === 0) {
      if (boxModelEl) boxModelEl.innerHTML = '';
      if (tokenSec) tokenSec.innerHTML = '';
      codeOut.textContent = '// Select a layer on the canvas to inspect generated code and box model';
      return;
    }

    const node = this.engine.getNode(selectedIds[0]);
    if (!node) return;

    const inspectData = this.inspectGen.generateInspectData(node);
    if (!inspectData) return;

    // Render Box Model
    if (boxModelEl) {
      const bm = inspectData.boxModel;
      boxModelEl.innerHTML = `
        <div class="inspect-box-model">
          <div class="box-model-rect">
            <span style="font-weight: 600;">Padding: ${bm.paddingTop}px ${bm.paddingRight}px ${bm.paddingBottom}px ${bm.paddingLeft}px</span>
            <div class="box-model-content" style="margin-top: 6px;">
              ${bm.width} × ${bm.height} px
            </div>
          </div>
        </div>
      `;
    }

    // Render Tokens Section
    if (tokenSec) {
      tokenSec.innerHTML = `
        <div style="font-size: 11px; color: var(--text-dim); margin-bottom: 4px;">Tokens Referenced:</div>
        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
          <span class="token-chip-badge">Fill: ${inspectData.tokens.fillHex}</span>
          ${inspectData.tokens.radius ? `<span class="token-chip-badge">Radius: ${inspectData.tokens.radius}</span>` : ''}
          ${inspectData.tokens.font ? `<span class="token-chip-badge">Font: ${inspectData.tokens.font}</span>` : ''}
        </div>
      `;
    }

    // Set Code Text
    const lang = this.inspectLang || 'css';
    codeOut.textContent = inspectData[lang] || inspectData.css;

    // Mode Buttons
    document.querySelectorAll('.inspect-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === this.inspectLang);
      btn.onclick = () => {
        this.inspectLang = btn.dataset.lang;
        this.updateInspectPanel();
      };
    });

    document.getElementById('btnCopyInspectSnippet').onclick = () => {
      navigator.clipboard.writeText(codeOut.textContent);
      const btn = document.getElementById('btnCopyInspectSnippet');
      btn.textContent = '<span data-icon="Check"></span> Copied!';
      setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
    };
  }

  // --- Export Panel Synchronizer ---
  updateExportPanel() {
    const container = document.getElementById('exportPanelContent');
    if (!container) return;
    const selectedIds = this.engine.getSelection();

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <div style="font-size: 11px; color: var(--text-muted);">
          Export selected artboards or layers in vector SVG, retina PNG, or production React.
        </div>

        <div style="background: var(--bg-surface); padding: 10px; border-radius: 6px; border: 1px solid var(--border-subtle);">
          <div class="section-title">Selection Export</div>
          <div style="display: flex; gap: 6px; margin-top: 8px;">
            <button class="btn-inspector-action" id="btnExportSelPng1x">PNG 1x</button>
            <button class="btn-inspector-action" id="btnExportSelPng2x">PNG 2x</button>
            <button class="btn-inspector-action" id="btnExportSelSvg">SVG Vector</button>
          </div>
        </div>

        <div style="background: var(--bg-surface); padding: 10px; border-radius: 6px; border: 1px solid var(--border-subtle);">
          <div class="section-title">Production Code</div>
          <button class="btn-primary" id="btnExportAllReactBtn" style="width: 100%; margin-top: 8px; font-size: 11px;">
          <span data-icon="Zap"></span> Compile to React Vite Bundle (⌘⇧E)
          </button>
        </div>
      </div>
    `;

    document.getElementById('btnExportSelPng1x')?.addEventListener('click', () => this.exportSelectedAsPng(1));
    document.getElementById('btnExportSelPng2x')?.addEventListener('click', () => this.exportSelectedAsPng(2));
    document.getElementById('btnExportSelSvg')?.addEventListener('click', () => this.exportSelectedAsSvg());
    document.getElementById('btnExportAllReactBtn')?.addEventListener('click', () => this.openExportModal());
  }

  // --- Command Palette Engine Integration (Section A2) ---
  initCommandPalette() {
    const modal = document.getElementById('commandPaletteModal');
    const input = document.getElementById('paletteSearchInput');
    const list = document.getElementById('paletteResultsList');
    const btnOpen = document.getElementById('btnOpenCommandPalette');

    btnOpen?.addEventListener('click', () => this.toggleCommandPalette());

    let selectedIdx = 0;

    const renderResults = () => {
      const q = input?.value || '';
      const items = this.palette.search(q);
      if (!list) return;

      if (items.length === 0) {
        list.innerHTML = `<div style="padding: 16px; text-align: center; color: var(--text-dim); font-size: 12px;">No matching commands found.</div>`;
        return;
      }

      list.innerHTML = items.map((item, i) => `
        <div class="palette-result-item ${i === selectedIdx ? 'selected' : ''}" data-index="${i}">
          <div class="palette-result-left">
            <span class="palette-result-icon"><span data-icon="${item.icon}"></span></span>
            <span class="palette-result-title">${item.title}</span>
            <span class="palette-result-category">${item.category}</span>
          </div>
          ${item.shortcut ? `<span class="palette-result-shortcut">${item.shortcut}</span>` : ''}
        </div>
      `).join('');

      document.querySelectorAll('.palette-result-item').forEach(el => {
        el.addEventListener('click', () => {
          const idx = parseInt(el.dataset.index, 10);
          if (items[idx]) {
            modal.style.display = 'none';
            items[idx].action();
          }
        });
      });
    };

    input?.addEventListener('input', () => {
      selectedIdx = 0;
      renderResults();
    });

    input?.addEventListener('keydown', (e) => {
      const items = this.palette.search(input.value);
      if (e.key === 'ArrowDown') {
        selectedIdx = (selectedIdx + 1) % items.length;
        renderResults();
        e.preventDefault();
      } else if (e.key === 'ArrowUp') {
        selectedIdx = (selectedIdx - 1 + items.length) % items.length;
        renderResults();
        e.preventDefault();
      } else if (e.key === 'Enter') {
        if (items[selectedIdx]) {
          modal.style.display = 'none';
          items[selectedIdx].action();
        }
      } else if (e.key === 'Escape') {
        modal.style.display = 'none';
      }
    });

    modal?.addEventListener('click', (e) => {
      if (e.target === modal) modal.style.display = 'none';
    });
  }

  toggleCommandPalette() {
    const modal = document.getElementById('commandPaletteModal');
    const input = document.getElementById('paletteSearchInput');
    if (!modal) return;
    const isVisible = modal.style.display === 'flex';
    modal.style.display = isVisible ? 'none' : 'flex';
    if (!isVisible) {
      if (input) {
        input.value = '';
        input.focus();
      }
      this.initCommandPalette();
    }
  }

  // --- Design System Linter Integration (Section 2.1 & 10) ---
  initLinterModal() {
    const modal = document.getElementById('modalLinter');
    const btnOpen = document.getElementById('btnOpenLinter');
    const btnClose = document.getElementById('btnCloseLinterModal');
    const btnAutoBind = document.getElementById('btnAutoBindAllTokens');
    const btnRescan = document.getElementById('btnRecheckLinter');

    btnOpen?.addEventListener('click', () => this.openLinterModal());
    btnClose?.addEventListener('click', () => { modal.style.display = 'none'; });
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) modal.style.display = 'none';
    });

    btnRescan?.addEventListener('click', () => this.renderLinterResults());

    btnAutoBind?.addEventListener('click', () => {
      const { issues } = this.linter.lint();
      const fixed = this.linter.autoBindAll(issues);
      this.showToast(`<span data-icon="Zap"></span> Successfully auto-bound ${fixed} properties to Design Tokens!`, 'success');
      this.renderLinterResults();
      this.renderAll();
    });
  }

  initImportModal() {
    const modal = document.getElementById('modalImportDesign');
    const dropZone = document.getElementById('importDropZone');
    const fileInput = document.getElementById('externalDesignFileInput');
    const reactFolderInput = document.getElementById('reactProjectFolderInput');
    const btnCommit = document.getElementById('btnCommitImport');
    const btnImportFigmaApi = document.getElementById('btnImportFigmaApi');
    const figmaUrlInput = document.getElementById('figmaApiFileUrl');
    const figmaTokenInput = document.getElementById('figmaApiToken');
    const figmaStatus = document.getElementById('figmaApiStatus');
    const clearFigmaToken = () => {
      if (figmaTokenInput) figmaTokenInput.value = '';
    };
    let pendingImportResult = null;

    dropZone?.addEventListener('click', () => fileInput?.click());
    document.getElementById('btnImportReactFolder')?.addEventListener('click', () => reactFolderInput?.click());
    document.getElementById('btnCloseImportModal')?.addEventListener('click', clearFigmaToken);
    modal?.querySelector('button[onclick*="modalImportDesign"]')?.addEventListener('click', clearFigmaToken);

    btnImportFigmaApi?.addEventListener('click', async () => {
      const fileUrl = figmaUrlInput?.value.trim() || '';
      const accessToken = figmaTokenInput?.value || '';
      pendingImportResult = null;
      if (btnCommit) btnCommit.style.display = 'none';
      if (btnImportFigmaApi) btnImportFigmaApi.disabled = true;
      if (figmaStatus) figmaStatus.textContent = 'Requesting file from Figma...';
      try {
        const { fileKey, fileData } = await fetchFigmaFile(fileUrl, accessToken);
        const result = await this.importer.processImport(fileData, {
          format: 'figma',
          fileName: `${fileKey}.figma.api.json`
        });
        pendingImportResult = result;
        renderFidelityPreview(result);
        if (figmaStatus) figmaStatus.textContent = 'Figma file loaded. Review the fidelity report, then commit the import.';
      } catch (error) {
        if (figmaStatus) figmaStatus.textContent = `Figma import failed: ${error.message}`;
      } finally {
        clearFigmaToken();
        if (btnImportFigmaApi) btnImportFigmaApi.disabled = false;
      }
    });

    dropZone?.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.style.borderColor = '#38bdf8';
      dropZone.style.background = 'rgba(56, 189, 248, 0.1)';
    });

    dropZone?.addEventListener('dragleave', () => {
      dropZone.style.borderColor = '#3b82f6';
      dropZone.style.background = 'rgba(30, 41, 59, 0.4)';
    });

    dropZone?.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.style.borderColor = '#3b82f6';
      dropZone.style.background = 'rgba(30, 41, 59, 0.4)';
      const file = e.dataTransfer?.files?.[0];
      if (file) handleFile(file);
    });

    fileInput?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    });

    reactFolderInput?.addEventListener('change', async () => {
      const sourceFiles = Array.from(reactFolderInput.files || [])
        .filter(file => /\.(?:jsx|tsx|js|ts)$/i.test(file.name))
        .filter(file => !/(?:^|\/)(?:node_modules|dist|build|\.git|coverage)\//i.test(file.webkitRelativePath || file.name))
        .sort((a, b) => {
          const rank = file => /(?:^|\/)src\/App\.(?:tsx|jsx|ts|js)$/i.test(file.webkitRelativePath) ? 0
            : /(?:^|\/)App\.(?:tsx|jsx|ts|js)$/i.test(file.webkitRelativePath) ? 1
              : /(?:^|\/)src\/index\.(?:tsx|jsx|ts|js)$/i.test(file.webkitRelativePath) ? 2 : 3;
          return rank(a) - rank(b) || a.webkitRelativePath.localeCompare(b.webkitRelativePath);
        });
      const totalBytes = sourceFiles.reduce((sum, file) => sum + file.size, 0);
      if (!sourceFiles.length) {
        this.showToast('No React JavaScript or TypeScript source files were found in that folder.', 'error');
        reactFolderInput.value = '';
        return;
      }
      if (sourceFiles.length > 300 || totalBytes > 10 * 1024 * 1024) {
        this.showToast('React folder exceeds the safe static-analysis limit (300 source files or 10 MB).', 'error');
        reactFolderInput.value = '';
        return;
      }

      pendingImportResult = null;
      if (btnCommit) btnCommit.style.display = 'none';
      const candidates = sourceFiles.filter(file => /(?:^|\/)App\.(?:tsx|jsx|ts|js)$/i.test(file.webkitRelativePath))
        .concat(sourceFiles.filter(file => !/(?:^|\/)App\.(?:tsx|jsx|ts|js)$/i.test(file.webkitRelativePath)));
      const failures = [];
      try {
        for (const file of candidates) {
          try {
            const result = await this.importer.processImport(await file.text(), {
              fileName: file.webkitRelativePath || file.name
            });
            pendingImportResult = result;
            renderFidelityPreview(result);
            this.showToast(`Imported static JSX from ${file.webkitRelativePath || file.name}.`, 'success');
            return;
          } catch (error) {
            failures.push(error.message);
          }
        }
        throw new Error(failures[0] || 'No static JSX component could be converted.');
      } catch (error) {
        this.showToast(`Could not import React folder: ${error.message}`, 'error');
      } finally {
        reactFolderInput.value = '';
      }
    });

    const handleFile = async (file) => {
      pendingImportResult = null;
      if (btnCommit) btnCommit.style.display = 'none';
      try {
        const raw = /\.(?:sketch|fig|jam|deck|buzz|site|make|xd)$/i.test(file.name)
          ? await file.arrayBuffer()
          : await file.text();
        const result = await this.importer.processImport(raw, { fileName: file.name });
        pendingImportResult = result;
        renderFidelityPreview(result);
      } catch (err) {
        this.showToast(`Could not process ${file.name}: ${err.message}`, 'error');
      } finally {
        if (fileInput) fileInput.value = '';
      }
    };

    const renderFidelityPreview = (result) => {
      const card = document.getElementById('importFidelityCard');
      const badge = document.getElementById('importFidelityBadge');
      const tag = document.getElementById('importSourceTag');
      const statPages = document.getElementById('statImportPages');
      const statNodes = document.getElementById('statImportNodes');
      const statComps = document.getElementById('statImportComponents');
      const statInters = document.getElementById('statImportInteractions');
      const list = document.getElementById('importPreservedList');

      if (card) card.style.display = 'block';
      if (btnCommit) btnCommit.style.display = 'inline-block';
      if (tag) tag.textContent = result.format.toUpperCase();

      const rep = result.fidelityReport;
      if (badge) {
        badge.textContent = `${rep.overallScore}% ${rep.fidelityTier}`;
        badge.style.background = rep.overallScore >= 90 ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)';
        badge.style.color = rep.overallScore >= 90 ? '#34d399' : '#fbbf24';
      }

      if (statPages) statPages.textContent = rep.metrics.pageCount;
      if (statNodes) statNodes.textContent = rep.metrics.importedNodeCount;
      if (statComps) statComps.textContent = rep.metrics.componentsCount;
      if (statInters) statInters.textContent = rep.metrics.interactionsCount;

      if (list) {
        const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;'
        })[char]);
        list.innerHTML = `
          <div style="font-weight: 600; color: #f8fafc; margin-bottom: 4px;">Preserved Features:</div>
          ${rep.preservedFeatures.map(f => `<div><span data-icon="Check"></span> ${escapeHtml(f)}</div>`).join('')}
          ${rep.warnings.length > 0 ? `
            <div style="font-weight: 600; color: #fbbf24; margin-top: 8px; margin-bottom: 4px;">Diagnostics & Fallbacks:</div>
            ${rep.warnings.map(w => `<div style="color: #cbd5e1;"><span data-icon="TriangleAlert"></span> ${escapeHtml(w)}</div>`).join('')}
          ` : ''}
        `;
      }
    };

    // Preset Sample buttons
    document.getElementById('btnSampleSketch')?.addEventListener('click', async () => {
      const sketchSample = {
        _class: 'document',
        pages: [{
          _class: 'page',
          name: 'Sketch Mobile Flow',
          layers: [{
            _class: 'artboard',
            name: 'iOS Wallet Screen',
            frame: { x: 0, y: 0, width: 393, height: 852 },
            hasBackgroundColor: true,
            backgroundColor: { red: 0.05, green: 0.08, blue: 0.15, alpha: 1 },
            layers: [
              { _class: 'rectangle', name: 'Balance Card', frame: { x: 20, y: 100, width: 353, height: 180 }, fixedRadius: 16, style: { fills: [{ fillType: 0, color: { red: 0.23, green: 0.51, blue: 0.96, alpha: 1 } }] } },
              { _class: 'text', name: 'Balance Amount', frame: { x: 44, y: 130, width: 200, height: 36 }, attributedString: { string: '$48,250.00' } },
              { _class: 'rectangle', name: 'Send Action', frame: { x: 20, y: 310, width: 168, height: 50 }, fixedRadius: 12, style: { fills: [{ fillType: 0, color: { red: 0.1, green: 0.72, blue: 0.5, alpha: 1 } }] } },
              { _class: 'rectangle', name: 'Receive Action', frame: { x: 205, y: 310, width: 168, height: 50 }, fixedRadius: 12, style: { fills: [{ fillType: 0, color: { red: 0.54, green: 0.36, blue: 0.96, alpha: 1 } }] } }
            ]
          }]
        }]
      };
      const result = await this.importer.processImport(sketchSample, { fileName: 'wallet_flow.sketch' });
      pendingImportResult = result;
      renderFidelityPreview(result);
    });

    document.getElementById('btnSampleFigma')?.addEventListener('click', async () => {
      const figmaSample = {
        name: 'SaaS Treasury Dashboard',
        document: {
          type: 'DOCUMENT',
          children: [{
            type: 'CANVAS',
            name: 'Overview Canvas',
            children: [{
              type: 'FRAME',
              name: 'Dashboard Frame',
              absoluteBoundingBox: { x: 100, y: 100, width: 1440, height: 900 },
              layoutMode: 'VERTICAL',
              itemSpacing: 24,
              paddingTop: 32, paddingRight: 32, paddingBottom: 32, paddingLeft: 32,
              fills: [{ type: 'SOLID', color: { r: 0.06, g: 0.09, b: 0.16, a: 1 } }],
              children: [
                { type: 'TEXT', name: 'Header', characters: 'Enterprise Treasury & Multi-Cloud Liquidity', style: { fontFamily: 'Inter', fontSize: 28, fontWeight: 700 } },
                { type: 'COMPONENT', name: 'Stats Card', absoluteBoundingBox: { x: 132, y: 180, width: 340, height: 140 }, cornerRadius: 12, fills: [{ type: 'SOLID', color: { r: 0.12, g: 0.16, b: 0.25, a: 1 } }] }
              ]
            }]
          }]
        }
      };
      const result = await this.importer.processImport(figmaSample, { fileName: 'treasury.figma.json' });
      pendingImportResult = result;
      renderFidelityPreview(result);
    });

    document.getElementById('btnSampleSvg')?.addEventListener('click', async () => {
      const svgSample = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
        <rect x="20" y="20" width="160" height="90" rx="8" fill="#3b82f6" />
        <circle cx="280" cy="80" r="50" fill="#10b981" />
        <text x="20" y="180" font-family="Inter" font-size="20" fill="#ffffff">Vector Illustration</text>
      </svg>`;
      const result = await this.importer.processImport(svgSample, { fileName: 'illustration.svg' });
      pendingImportResult = result;
      renderFidelityPreview(result);
    });

    btnCommit?.addEventListener('click', () => {
      if (pendingImportResult && pendingImportResult.document) {
        const format = pendingImportResult.format;
        this.replaceDocument(pendingImportResult.document);

        modal.style.display = 'none';
        this.showToast(`Imported ${format.toUpperCase()} into workspace!`);
      }
    });
  }

  initBulkRenameModal() {
    const modal = document.getElementById('modalBulkRename');
    const form = document.getElementById('formBulkRename');

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const pattern = document.getElementById('bulkRenamePattern')?.value || 'Layer $n';
      const findText = document.getElementById('bulkRenameFind')?.value || '';
      const replaceText = document.getElementById('bulkRenameReplace')?.value || '';

      this.applyBulkRename(pattern, findText, replaceText);
      if (modal) modal.style.display = 'none';
    });
  }

  openLinterModal() {
    const modal = document.getElementById('modalLinter');
    if (!modal) return;
    modal.style.display = 'flex';
    this.renderLinterResults();
  }

  renderLinterResults() {
    const { issues, summary } = this.linter.lint();
    const countTotal = document.getElementById('lintTotalCount');
    const countExact = document.getElementById('lintExactCount');
    const countSpacing = document.getElementById('lintSpacingCount');
    const list = document.getElementById('linterIssuesList');

    if (countTotal) countTotal.textContent = summary.total;
    if (countExact) countExact.textContent = summary.warnings;
    if (countSpacing) countSpacing.textContent = issues.filter(i => i.fixType === 'gap').length;

    if (!list) return;

    if (issues.length === 0) {
      list.innerHTML = `<div style="padding: 24px; text-align: center; color: #10b981; font-size: 13px;"><span data-icon="Check"></span> Zero design system drift! All colors and spacing are 100% compliant.</div>`;
      return;
    }

    list.innerHTML = issues.map(iss => `
      <div class="linter-issue-card ${iss.severity}">
        <div>
          <div style="font-size: 12px; font-weight: 600; color: var(--text-main);">${iss.nodeName} — ${iss.message}</div>
          <div style="font-size: 10px; color: var(--text-dim); margin-top: 2px;">Rule: ${iss.rule}</div>
        </div>
        <button class="btn-inspector-action btn-bind-single-issue" data-id="${iss.id}" style="width: auto; padding: 4px 10px; font-size: 10px; background: rgba(16, 185, 129, 0.15); color: #10b981; border-color: rgba(16, 185, 129, 0.3);">
          Bind to ${iss.suggestedToken.name}
        </button>
      </div>
    `).join('');

    document.querySelectorAll('.btn-bind-single-issue').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const targetIssue = issues.find(i => i.id === id);
        if (targetIssue) {
          this.linter.autoBindAll([targetIssue]);
          this.renderLinterResults();
          this.renderAll();
        }
      });
    });
  }

  // --- Responsive Breakpoints Navigation Bar (Section 2.1 & 7) ---
  initBreakpointBar() {
    const bar = document.getElementById('topBreakpointBar');
    if (!bar) return;
    bar.querySelectorAll('.bp-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        bar.querySelectorAll('.bp-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.switchBreakpoint(btn.dataset.bp);
      });
    });
  }

  switchBreakpoint(mode) {
    const page = this.engine.getActivePage();
    if (!page || page.rootIds.length === 0) return;

    // Look for target frame matching mode, e.g. Desktop 1440 or Mobile 375
    let targetWidth = 1440;
    if (mode === 'tablet') targetWidth = 768;
    if (mode === 'mobile') targetWidth = 375;

    let targetNode = null;
    for (const rid of page.rootIds) {
      const n = page.nodes[rid];
      if (n && n.type === 'frame') {
        if (Math.abs(n.transform.width - targetWidth) < 100) {
          targetNode = n;
          break;
        }
      }
    }

    if (targetNode) {
      this.engine.setSelection([targetNode.id]);
      this.renderer.panX = 100;
      this.renderer.panY = 100;
      this.renderer.render();
      this.updateInspector();
    }
  }

  // Quick prompt runner from Command Palette
  runAiPromptQuick(promptText) {
    this.switchToAiTab();
    const inp = document.getElementById('aiPromptInput');
    if (inp) {
      inp.value = promptText;
      document.getElementById('btnAiGenerate')?.click();
    }
  }

  // --- AI Spec Coverage & Ambiguity Report Modal (Section 2.1 & 6) ---
  showSpecCoverageReport(plan) {
    const modal = document.getElementById('modalSpecCoverage');
    const covList = document.getElementById('specCoverageList');
    const ambList = document.getElementById('specAmbiguityList');
    const btnClose = document.getElementById('btnCloseSpecCoverageModal');
    if (!modal) return;

    if (covList && plan.specCoverage) {
      covList.innerHTML = plan.specCoverage.map(c => `
        <div style="padding: 8px 12px; background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.25); border-radius: 6px; font-size: 11px; display: flex; align-items: center; justify-content: space-between;">
          <span><span data-icon="Check"></span> ${c.requirement}</span>
          <span style="color: #10b981; font-weight: 600;">Covered (${c.mappedNodeName})</span>
        </div>
      `).join('');
    }

    if (ambList && plan.ambiguities) {
      ambList.innerHTML = plan.ambiguities.map(a => `
        <div style="padding: 8px 12px; background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.25); border-radius: 6px; font-size: 11px;">
          <div style="font-weight: 600; color: #f59e0b;"><span data-icon="TriangleAlert"></span> ${a.topic}</div>
          <div style="color: var(--text-muted); margin-top: 2px;">${a.assumption}</div>
        </div>
      `).join('');
    }

    modal.style.display = 'flex';
    btnClose?.addEventListener('click', () => { modal.style.display = 'none'; });
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
  }

  // --- Layers Tree Synchronizer & Interaction Handlers ---
  initLayersTreeHandlers() {
    if (this._layersTreeHandlersInitialized) return;
    const list = document.getElementById('layersTreeList');
    if (!list) return;
    this._layersTreeHandlersInitialized = true;

    // 1. Drag & Drop Reordering & Reparenting
    list.addEventListener('dragstart', (e) => {
      const item = e.target.closest('.layer-item');
      if (!item || e.target.closest('.layer-btn') || e.target.closest('.layer-chevron') || e.target.closest('.layer-rename-input')) {
        e.preventDefault();
        return;
      }
      this.draggedLayerId = item.dataset.nodeId;
      e.dataTransfer?.setData('text/plain', this.draggedLayerId);
      if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
      item.classList.add('dragging');
    });

    list.addEventListener('dragover', (e) => {
      if (!this.draggedLayerId) return;
      const item = e.target.closest('.layer-item');
      if (!item) return;

      const targetId = item.dataset.nodeId;
      const page = this.engine.getActivePage();
      const draggedNode = page?.nodes?.[this.draggedLayerId];
      const targetNode = page?.nodes?.[targetId];
      if (!draggedNode || !targetNode || draggedNode.id === targetNode.id) return;

      // Prevent dragging a node into its own descendant
      let curr = targetNode;
      let isDesc = false;
      while (curr && curr.parentId) {
        if (curr.parentId === draggedNode.id) { isDesc = true; break; }
        curr = page.nodes[curr.parentId];
      }
      if (isDesc) return;

      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';

      const bounds = item.getBoundingClientRect();
      const relY = (e.clientY - bounds.top) / bounds.height;
      const isContainer = targetNode.type === 'frame' || targetNode.type === 'group' || targetNode.type === 'component';

      let position = 'before';
      if (isContainer) {
        if (relY < 0.25) position = 'before';
        else if (relY > 0.75) position = 'after';
        else position = 'inside';
      } else {
        position = relY < 0.5 ? 'before' : 'after';
      }

      list.querySelectorAll('.layer-item[data-drop-position]').forEach(el => {
        if (el !== item) delete el.dataset.dropPosition;
      });
      item.dataset.dropPosition = position;
    });

    list.addEventListener('dragleave', (e) => {
      const item = e.target.closest('.layer-item');
      if (item && !item.contains(e.relatedTarget)) {
        delete item.dataset.dropPosition;
      }
    });

    list.addEventListener('drop', (e) => {
      e.preventDefault();
      const item = e.target.closest('.layer-item');
      if (!item || !this.draggedLayerId) return;

      const targetId = item.dataset.nodeId;
      const position = item.dataset.dropPosition || 'before';
      delete item.dataset.dropPosition;

      if (this.draggedLayerId !== targetId) {
        this.engine.reorderNodeTo(this.draggedLayerId, targetId, position);
      }
      this.draggedLayerId = null;
      list.querySelectorAll('.layer-item.dragging').forEach(el => el.classList.remove('dragging'));
    });

    list.addEventListener('dragend', () => {
      this.draggedLayerId = null;
      list.querySelectorAll('.layer-item.dragging').forEach(el => el.classList.remove('dragging'));
      list.querySelectorAll('.layer-item[data-drop-position]').forEach(el => delete el.dataset.dropPosition);
    });

    // 2. Click Interactions (Expand/Collapse, Lock, Visibility, Selection)
    list.addEventListener('click', (e) => {
      const actionBtn = e.target.closest('[data-action]');
      const item = e.target.closest('.layer-item');
      if (!item) return;
      const id = item.dataset.nodeId;
      const page = this.engine.getActivePage();

      // Expand/Collapse toggle
      if (actionBtn && actionBtn.dataset.action === 'toggle-collapse') {
        e.stopPropagation();
        const shouldCollapse = !this.collapsedNodeIds.has(id);
        if (shouldCollapse) {
          this.collapsedNodeIds.add(id);
        } else {
          this.collapsedNodeIds.delete(id);
        }

        // Alt+Click recursively toggles descendants
        if (e.altKey) {
          const toggleRecursive = (nodeId) => {
            const n = page?.nodes?.[nodeId];
            if (!n || !Array.isArray(n.childIds)) return;
            if (shouldCollapse) this.collapsedNodeIds.add(nodeId);
            else this.collapsedNodeIds.delete(nodeId);
            for (const cid of n.childIds) toggleRecursive(cid);
          };
          toggleRecursive(id);
        }
        this.updateLayersTree();
        return;
      }

      // Lock toggle
      if (actionBtn && actionBtn.dataset.action === 'toggle-lock') {
        e.stopPropagation();
        this.engine.toggleLock(id);
        return;
      }

      // Visibility toggle
      if (actionBtn && actionBtn.dataset.action === 'toggle-vis') {
        e.stopPropagation();
        this.engine.toggleVisibility(id);
        return;
      }

      // Ignore row clicks on rename input
      if (e.target.closest('.layer-rename-input')) return;

      this._preventTreeScroll = true;
      if (e.metaKey || e.ctrlKey) {
        this.engine.selectToggle(id);
      } else if (e.shiftKey && this.lastSelectedLayerId) {
        const allItems = Array.from(list.querySelectorAll('.layer-item')).map(el => el.dataset.nodeId);
        const idxA = allItems.indexOf(this.lastSelectedLayerId);
        const idxB = allItems.indexOf(id);
        if (idxA !== -1 && idxB !== -1) {
          const [start, end] = idxA < idxB ? [idxA, idxB] : [idxB, idxA];
          const rangeIds = allItems.slice(start, end + 1);
          this.engine.setSelection(rangeIds);
        } else {
          this.engine.setSelection([id]);
        }
      } else {
        this.engine.setSelection([id]);
      }
      this.lastSelectedLayerId = id;
      setTimeout(() => { this._preventTreeScroll = false; }, 100);
    });

    // 3. Double Click for Inline Rename
    list.addEventListener('dblclick', (e) => {
      const item = e.target.closest('.layer-item');
      if (!item || e.target.closest('.layer-chevron') || e.target.closest('.layer-btn')) return;
      const id = item.dataset.nodeId;
      this.editingLayerId = id;
      this.updateLayersTree();
    });

    // 4. Right Click for Context Menu
    list.addEventListener('contextmenu', (e) => {
      const item = e.target.closest('.layer-item');
      if (!item) return;
      e.preventDefault();
      const id = item.dataset.nodeId;
      const selected = this.engine.getSelection();
      if (!selected.includes(id)) {
        this.engine.setSelection([id]);
        this.lastSelectedLayerId = id;
      }
      const ctxMenu = document.getElementById('canvasContextMenu');
      if (ctxMenu) {
        ctxMenu.style.display = 'block';
        ctxMenu.style.left = `${Math.min(e.clientX, window.innerWidth - 220)}px`;
        ctxMenu.style.top = `${Math.min(e.clientY, window.innerHeight - 260)}px`;
      }
    });

    // 5. Tree <-> Canvas Hover Synchronization
    list.addEventListener('mouseover', (e) => {
      const item = e.target.closest('.layer-item');
      if (item && item.dataset.nodeId) {
        const hoverId = item.dataset.nodeId;
        if (this.renderer.hoveredNodeId !== hoverId) {
          this.renderer.hoveredNodeId = hoverId;
          this.renderer.render();
        }
      }
    });

    list.addEventListener('mouseleave', () => {
      if (this.renderer.hoveredNodeId) {
        this.renderer.hoveredNodeId = null;
        this.renderer.render();
      }
    });
  }

  updateLayersTree() {
    const list = document.getElementById('layersTreeList');
    if (!list) return;

    const page = this.engine.getActivePage();
    if (!page) {
      list.innerHTML = '';
      return;
    }
    const selectedIds = this.engine.getSelection();

    this.collapsedNodeIds = this.collapsedNodeIds || new Set();

    // Auto-expand ancestors of selected nodes so they are visible
    for (const selId of selectedIds) {
      let pId = page.nodes?.[selId]?.parentId;
      while (pId) {
        this.collapsedNodeIds.delete(pId);
        pId = page.nodes?.[pId]?.parentId;
      }
    }

    const query = (this.layerSearchQuery || '').toLowerCase().trim();
    const matchesQuery = (id) => {
      if (!query) return true;
      const n = page.nodes[id];
      if (!n) return false;
      if (n.name.toLowerCase().includes(query)) return true;
      if (Array.isArray(n.childIds)) {
        return n.childIds.some(cid => matchesQuery(cid));
      }
      return false;
    };

    // If search active, auto-expand containers having matching children
    if (query) {
      const expandMatching = (id) => {
        const n = page.nodes[id];
        if (!n || !Array.isArray(n.childIds)) return;
        if (n.childIds.some(cid => matchesQuery(cid))) {
          this.collapsedNodeIds.delete(id);
        }
        for (const cid of n.childIds) expandMatching(cid);
      };
      for (const rootId of (page.rootIds || [])) expandMatching(rootId);
    }

    const escapeHtml = (str) => String(str || '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);

    let html = '';
    const renderLayerItem = (nodeId, depth = 0) => {
      const node = page.nodes[nodeId];
      if (!node) return;
      if (query && !matchesQuery(nodeId)) return;

      const isSelected = selectedIds.includes(nodeId);
      const isEditing = this.editingLayerId === nodeId;
      const hasChildren = Array.isArray(node.childIds) && node.childIds.length > 0;
      const isCollapsed = this.collapsedNodeIds.has(nodeId);

      const icon = node.type === 'frame' ? 'Frame' :
                   node.type === 'text' ? 'Type' :
                   node.type === 'ellipse' ? 'Circle' :
                   node.type === 'line' ? 'Minus' :
                   node.type === 'group' ? 'Layers' :
                   node.type === 'component' ? 'Box' :
                   node.type === 'instance' ? 'Copy' :
                   node.type === 'path' || node.type === 'vector' ? 'PenTool' :
                   node.type === 'image' ? 'Image' :
                   node.type === 'star' ? 'Star' :
                   node.type === 'polygon' ? 'Triangle' :
                   (node.type === 'boolean' || node.type === 'boolean_group') ? (
                     node.booleanOperation === 'subtract' ? 'Minus' :
                     node.booleanOperation === 'intersect' ? 'Circle' :
                     node.booleanOperation === 'exclude' ? 'X' : 'Layers'
                   ) : 'Square';

      const paddingLeft = 6 + depth * 14;

      const chevronHtml = hasChildren
        ? `<button class="layer-chevron ${isCollapsed ? 'collapsed' : ''}" data-action="toggle-collapse" data-node-id="${node.id}" title="${isCollapsed ? 'Expand' : 'Collapse'}" tabindex="-1"><span data-icon="${isCollapsed ? 'ChevronRight' : 'ChevronDown'}" data-icon-size="13"></span></button>`
        : `<span class="layer-chevron-spacer"></span>`;

      const nameHtml = isEditing
        ? `<input type="text" class="layer-rename-input" value="${escapeHtml(node.name)}" data-node-id="${node.id}" spellcheck="false">`
        : `<span class="layer-name" title="${escapeHtml(node.name)}">${escapeHtml(node.name)}</span>`;

      const stateClasses = [
        'layer-item',
        'layer-tree-item',
        isSelected ? 'selected' : '',
        !node.visible ? 'layer-hidden' : '',
        node.locked ? 'layer-locked' : '',
        hasChildren ? 'is-container' : 'is-leaf'
      ].filter(Boolean).join(' ');

      html += `
        <div class="${stateClasses}" data-node-id="${node.id}" draggable="${!isEditing}" style="padding-left: ${paddingLeft}px;">
          ${chevronHtml}
          <span class="layer-icon" title="${node.type}"><span data-icon="${icon}" data-icon-size="14"></span></span>
          ${nameHtml}
          <div class="layer-actions">
            <button class="layer-btn toggle-lock" data-action="toggle-lock" data-node-id="${node.id}" title="${node.locked ? 'Unlock Layer' : 'Lock Layer'}">${node.locked ? '<span data-icon="LockKeyhole"></span>' : '<span data-icon="LockOpen"></span>'}</button>
            <button class="layer-btn toggle-vis" data-action="toggle-vis" data-node-id="${node.id}" title="${node.visible ? 'Hide Layer' : 'Show Layer'}">${node.visible ? '<span data-icon="Eye"></span>' : '<span data-icon="EyeOff"></span>'}</button>
          </div>
        </div>
      `;

      if (!isCollapsed && hasChildren) {
        for (const cid of node.childIds) {
          renderLayerItem(cid, depth + 1);
        }
      }
    };

    for (const rootId of (page.rootIds || [])) {
      renderLayerItem(rootId, 0);
    }

    const prevScroll = list.scrollTop;
    list.innerHTML = html || `<div style="padding: 16px; color: var(--text-dim); font-size: 11px; text-align: center;">No layers found${query ? ` matching "${escapeHtml(query)}"` : ''}.</div>`;
    list.scrollTop = prevScroll;

    // Handle inline rename input focus & lifecycle
    if (this.editingLayerId) {
      const renameInput = list.querySelector('.layer-rename-input');
      if (renameInput) {
        renameInput.focus();
        renameInput.select();
        let committed = false;
        const commitRename = () => {
          if (committed) return;
          committed = true;
          const newName = renameInput.value.trim();
          const targetId = this.editingLayerId;
          this.editingLayerId = null;
          if (newName && page.nodes[targetId] && page.nodes[targetId].name !== newName) {
            this.engine.updateNode(targetId, { name: newName }, 'Rename layer');
          } else {
            this.updateLayersTree();
          }
        };
        renameInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commitRename();
          } else if (e.key === 'Escape') {
            e.preventDefault();
            committed = true;
            this.editingLayerId = null;
            this.updateLayersTree();
          }
          e.stopPropagation();
        });
        renameInput.addEventListener('blur', () => {
          commitRename();
        });
        return;
      }
    }

    // Gentle auto-scroll to selected layer if canvas triggered selection
    if (selectedIds.length === 1 && !this._preventTreeScroll) {
      const selEl = list.querySelector(`.layer-item[data-node-id="${selectedIds[0]}"]`);
      if (selEl) {
        selEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }

  renderTokensList() {
    const list = document.getElementById('tokensTreeList');
    if (!list) return;
    const tokens = this.doc.tokens || [];

    let html = '';
    for (const group of tokens) {
      html += `<div style="padding: 8px 0 4px; font-size: 11px; font-weight: 700; color: var(--text-dim); text-transform: uppercase;">${group.name}</div>`;
      for (const t of group.tokens || []) {
        html += `
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 5px 8px; font-size: 11px; border-bottom: 1px solid var(--border-subtle); background: var(--bg-surface); border-radius: 4px; margin-bottom: 4px; cursor: pointer;" class="token-row" data-token-val="${t.value}" data-token-type="${t.type}">
            <div style="display: flex; align-items: center; gap: 6px;">
              ${t.type === 'color' ? `<div style="width: 12px; height: 12px; border-radius: 3px; background: ${t.value};"></div>` : ''}
              <span>${t.name}</span>
            </div>
            <code style="font-size: 10px; color: var(--text-dim);">${t.value}</code>
          </div>
        `;
      }
    }
    list.innerHTML = html;

    list.querySelectorAll('.token-row').forEach(row => {
      row.addEventListener('click', () => {
        const sel = this.engine.getSelection();
        const val = row.dataset.tokenVal;
        const type = row.dataset.tokenType;
        if (sel.length > 0 && type === 'color') {
          for (const id of sel) {
            this.engine.updateNode(id, { style: { fills: [{ type: 'solid', color: val }] } }, 'Apply Token Color');
          }
        }
      });
    });
  }

  // --- Manipulations & Shortcuts ---
  undo() { this.engine.undo(); }
  redo() { this.engine.redo(); }

  duplicateSelected() {
    const selectedIds = this.engine.getSelection();
    if (selectedIds.length === 0) return;
    this.engine.duplicateNodes(selectedIds);
  }

  deleteSelected() {
    const selectedIds = this.engine.getSelection();
    if (selectedIds.length > 0) {
      this.engine.deleteNodes(selectedIds);
    }
  }

  groupSelected() {
    const selectedIds = this.engine.getSelection();
    if (selectedIds.length > 1) {
      this.engine.groupNodes(selectedIds);
    }
  }

  ungroupSelected() {
    const selectedIds = this.engine.getSelection();
    if (selectedIds.length === 1) {
      this.engine.ungroupNode(selectedIds[0]);
    }
  }

  alignSelected(alignment) {
    const selectedIds = this.engine.getSelection();
    if (selectedIds.length > 1) {
      this.engine.alignNodes(selectedIds, alignment);
    }
  }

  distributeSelected(axis) {
    const selectedIds = this.engine.getSelection();
    if (selectedIds.length > 2) {
      this.engine.distributeNodes(selectedIds, axis);
    }
  }

  addAutoLayoutToSelected() {
    const sel = this.engine.getSelection();
    if (sel.length > 0) {
      this.engine.addAutoLayout(sel[0]);
    }
  }

  removeAutoLayoutFromSelected() {
    const sel = this.engine.getSelection();
    if (sel.length > 0) {
      this.engine.removeAutoLayout(sel[0]);
    }
  }

  createComponentFromSelection() {
    const sel = this.engine.getSelection();
    if (sel.length > 0) {
      this.engine.createComponentFromNode(sel[0]);
    }
  }

  selectAll() {
    const page = this.engine.getActivePage();
    this.engine.setSelection([...page.rootIds]);
  }

  zoomIn() { this.renderer.setZoom(this.renderer.zoom * 1.25); this.updateRulers(); }
  zoomOut() { this.renderer.setZoom(this.renderer.zoom * 0.8); this.updateRulers(); }
  zoomToFit() { this.renderer.zoomToFit(); this.updateRulers(); }
  zoom100() { this.renderer.setZoom(1.0); this.updateRulers(); }

  reorderSelected(direction) {
    const sel = this.engine.getSelection();
    if (sel.length === 1) {
      this.engine.reorderNode(sel[0], direction);
    }
  }

  // --- Figma Functional Map Modes & Interactions (MD/figma-design-page-functional-map.md) ---

  switchRightTab(mode) {
    if (typeof this.rightSidebarModeSwitcher !== 'function') {
      throw new Error('Right sidebar is not initialized.');
    }
    this.rightSidebarModeSwitcher(mode);
  }

  toggleDevMode(force) {
    this.isDevMode = typeof force === 'boolean' ? force : !this.isDevMode;
    const badge = document.getElementById('devModeBadge');
    const devBtn = document.getElementById('btnDevModeToggle');

    if (this.isDevMode) {
      if (badge) badge.style.display = 'inline-flex';
      if (devBtn) devBtn.classList.add('active');
      this.switchRightTab('inspect');
      this.showToast('Dev Mode Active (⇧D): Inspection, code generation, and export specs enabled.');
    } else {
      if (badge) badge.style.display = 'none';
      if (devBtn) devBtn.classList.remove('active');
      this.switchRightTab('design');
      this.showToast('Returned to Design Canvas Mode');
    }
  }

  resolveSelectionTarget(leafHitId, isDeepSelect = false) {
    if (!leafHitId) return null;
    const page = this.engine.getActivePage();
    if (!page || !page.nodes) return leafHitId;

    if (isDeepSelect) {
      return leafHitId;
    }

    const currentSelection = this.engine.getSelection();

    // Find the hierarchy chain from root down to leafHitId
    const chain = [];
    let cur = page.nodes[leafHitId];
    while (cur) {
      chain.unshift(cur.id);
      cur = cur.parentId ? page.nodes[cur.parentId] : null;
    }

    // In standard design tools (Figma/Sketch), composite containers (groups and boolean groups)
    // act as atomic selection units unless they or one of their children are already selected.
    for (let i = 0; i < chain.length - 1; i++) {
      const ancestorId = chain[i];
      const ancestor = page.nodes[ancestorId];
      if (ancestor && (ancestor.type === 'group' || ancestor.type === 'boolean_group')) {
        const isSelectedOrChildSelected = chain.slice(i).some(id => currentSelection.includes(id));
        if (!isSelectedOrChildSelected) {
          return ancestorId;
        }
      }
    }

    return leafHitId;
  }

  drillInSelection() {
    const sel = this.engine.getSelection();
    if (sel.length === 0) return;
    const page = this.engine.getActivePage();
    const node = page.nodes[sel[0]];
    if (!node) return;

    if (node.childIds && node.childIds.length > 0) {
      // Container node: select its first child
      this.engine.setSelection([node.childIds[0]]);
      this.showToast(`Drilled into: ${page.nodes[node.childIds[0]]?.name || 'Child layer'}`);
    } else if (node.type === 'vector' || node.type === 'rectangle' || node.type === 'ellipse' || node.type === 'line') {
      // Leaf geometry node: enter Vector Edit Mode (Figma vector point mode)
      this.isVectorEditMode = true;
      this.renderer.isVectorEditMode = true;
      this.renderer.render();
      this.showToast('Vector Edit Mode active: anchor points visible. Press Esc to exit.');
    }
  }

  drillOutSelection() {
    if (this.isVectorEditMode) {
      this.isVectorEditMode = false;
      this.renderer.isVectorEditMode = false;
      this.renderer.render();
      this.showToast('Exited Vector Edit Mode');
      return;
    }

    const sel = this.engine.getSelection();
    if (sel.length === 0) return;
    const page = this.engine.getActivePage();
    const node = page.nodes[sel[0]];
    if (node && node.parentId) {
      this.engine.setSelection([node.parentId]);
      this.showToast(`Selected parent: ${page.nodes[node.parentId]?.name || 'Parent frame'}`);
    }
  }

  toggleOutlineView() {
    this.renderer.outlineViewOnly = !this.renderer.outlineViewOnly;
    this.renderer.render();
    this.showToast(this.renderer.outlineViewOnly ? 'Outline View Enabled (⌘Y)' : 'Render View Restored');
  }

  togglePixelGrid() {
    this.renderer.showPixelGrid = !this.renderer.showPixelGrid;
    this.renderer.render();
    this.showToast(this.renderer.showPixelGrid ? 'Pixel Grid Enabled (⇧\')' : 'Pixel Grid Disabled');
  }

  toggleRulers() {
    this.showRulers = !this.showRulers;
    const r = document.getElementById('canvasRulers');
    if (r) r.style.display = this.showRulers ? 'block' : 'none';
    this.showToast(this.showRulers ? 'Rulers Enabled (⇧R)' : 'Rulers Hidden');
  }

  toggleUI() {
    this.uiHidden = !this.uiHidden;
    const left = document.querySelector('.left-sidebar');
    const right = document.querySelector('.right-sidebar');
    if (left) left.style.display = this.uiHidden ? 'none' : 'flex';
    if (right) right.style.display = this.uiHidden ? 'none' : 'flex';
    this.renderer.resize?.();
    this.showToast(this.uiHidden ? 'Panels Hidden (⌘\\)' : 'Panels Restored');
  }

  flipSelected(direction) {
    const sel = this.engine.getSelection();
    if (sel.length === 0) return;
    const page = this.engine.getActivePage();
    for (const id of sel) {
      const node = page.nodes[id];
      if (!node) continue;
      const currentScaleX = node.transform.scaleX !== undefined ? node.transform.scaleX : 1;
      const currentScaleY = node.transform.scaleY !== undefined ? node.transform.scaleY : 1;
      if (direction === 'horizontal') {
        this.engine.updateNode(id, { transform: { scaleX: currentScaleX * -1 } }, 'Flip Horizontal');
      } else {
        this.engine.updateNode(id, { transform: { scaleY: currentScaleY * -1 } }, 'Flip Vertical');
      }
    }
  }

  openBulkRenameModal() {
    const sel = this.engine.getSelection();
    if (sel.length === 0) {
      this.showToast('Please select one or more layers to rename (⌘R).');
      return;
    }
    const modal = document.getElementById('modalBulkRename');
    if (modal) {
      modal.style.display = 'flex';
      const input = document.getElementById('bulkRenamePattern');
      if (input) {
        input.value = `Layer $n`;
        input.focus();
        input.select();
      }
    } else {
      // Fallback prompt using Figma modal
      (async () => {
        const pattern = await this.showPromptModal({
          title: 'Batch Rename Layers',
          subtitle: `Renaming ${sel.length} layer(s). Use '$n' for sequential numbers:`,
          defaultValue: 'Card / $n',
          presets: ['Card / $n', 'Item $n', 'Row $n', 'Column $N'],
          icon: 'Type',
          confirmText: 'Rename Layers'
        });
        if (pattern) this.applyBulkRename(pattern);
      })();
    }
  }

  applyBulkRename(pattern, findText = '', replaceText = '') {
    const sel = this.engine.getSelection();
    const page = this.engine.getActivePage();
    sel.forEach((id, idx) => {
      const node = page.nodes[id];
      if (!node) return;
      let newName = pattern;
      if (findText) {
        newName = node.name.replaceAll(findText, replaceText);
      } else if (pattern.includes('$n')) {
        newName = pattern.replace('$n', String(idx + 1));
      } else if (pattern.includes('$N')) {
        newName = pattern.replace('$N', String(idx + 1).padStart(2, '0'));
      }
      this.engine.updateNode(id, { name: newName }, 'Bulk Rename Layer');
    });
    this.updateLayersTree();
    this.showToast(`Renamed ${sel.length} layers.`);
  }

  // --- External Design Import Engine (MD/Design.md) ---

  openImportModal() {
    const modal = document.getElementById('modalImportDesign');
    if (modal) {
      modal.style.display = 'flex';
    } else {
      document.getElementById('externalDesignFileInput')?.click();
    }
  }

  async importDesignData(rawInput, fileName = 'imported_design') {
    try {
      this.showToast(`Analyzing and parsing ${fileName}...`);
      const result = await this.importer.processImport(rawInput, { fileName });

      if (result.success && result.document) {
        this.replaceDocument(result.document);

        const score = result.fidelityReport?.overallScore || 95;
        const tier = result.fidelityReport?.fidelityTier || 'High Fidelity';
        this.showToast(`Imported ${result.format.toUpperCase()} successfully: ${score}% Fidelity (${tier})!`);
        return result;
      }
    } catch (err) {
      console.error('Import error:', err);
      this.showToast(`Import failed: ${err.message}`, 'error');
      throw err;
    }
  }

  replaceDocument(nextDocument) {
    this.doc = nextDocument;
    const projectTitleInput = document.getElementById('projectTitleInput');
    if (projectTitleInput) projectTitleInput.value = nextDocument.name || 'Untitled Project';
    this.engine = new CommandEngine(this.doc);
    this.renderer.engine = this.engine;
    this.ai.engine = this.engine;
    this.linter.engine = this.engine;
    this.inspectGen.doc = this.doc;
    this.prototype.doc = this.doc;

    this.dsRegistry = new DesignSystemRegistry(this.doc, this.storage);
    this.aiTokenWizard.registry = this.dsRegistry;
    this.responsiveTokenEngine.registry = this.dsRegistry;
    this.compVarExtractor.registry = this.dsRegistry;
    this.compVarExtractor.engine = this.engine;
    this.reactDsImporter.registry = this.dsRegistry;
    this.dsUi.registry = this.dsRegistry;
    this.dsUi.wizard = this.aiTokenWizard;
    this.dsUi.responsive = this.responsiveTokenEngine;
    this.dsUi.extractor = this.compVarExtractor;
    this.dsUi.importer = this.reactDsImporter;

    this.bindCanvasEvents();
    this.bindEngineEvents();
    this.updatePagesList();
    this.updateLayersTree();
    this.updateInspector();
    this.renderer.zoomToFit();
    this.renderer.render();
    this.updateRulers();
    this.storage.scheduleAutosave(this.doc);
    this.refreshOpenPrototypePreview();
    this.updateMissingFontsBadge();
    try {
      const report = this.fontManager.scanDocumentForMissingFonts(this.doc, this.engine.activePageId);
      if (report.hasUnskippedMissingFonts && typeof document !== 'undefined' && document.getElementById('modalMissingFonts')) {
        this.openMissingFontsModal();
      }
    } catch (e) {
      // Non-blocking in tests or background loads
    }
  }

  saveProject() {
    const filename = this.storage.exportDForgeFile(this.doc);
    const badge = document.getElementById('saveStatusText');
    if (badge) {
      badge.textContent = `Saved ${filename}`;
      setTimeout(() => { badge.textContent = 'Saved locally'; }, 3000);
    }
  }

  openProjectPicker() {
    document.getElementById('dforgeFileInput')?.click();
  }

  // --- Figma-Inspired Typography & Missing Fonts Subsystem ---
  initFontManagement() {
    if (typeof window === 'undefined') return;

    // 1. Asynchronously scan local system typography via Local Font Access API
    this.fontManager.scanSystemFonts().then(res => {
      const scanStatus = document.getElementById('systemFontsScanStatus');
      if (scanStatus) {
        scanStatus.textContent = res.nativeCount > 0
          ? `${res.totalInstalled} system & web fonts available (${res.nativeCount} local)`
          : `${res.totalInstalled} system & web fonts available`;
      }
    }).catch(() => {});

    // 2. Wire Topbar Missing Fonts Badge
    document.getElementById('btnTopMissingFontsBadge')?.addEventListener('click', () => {
      this.openMissingFontsModal();
    });

    // 3. Wire Missing Fonts Modal Actions
    document.getElementById('btnCloseMissingFontsModal')?.addEventListener('click', () => {
      this.closeMissingFontsModal();
    });

    document.getElementById('btnScanLocalFonts')?.addEventListener('click', async () => {
      const btn = document.getElementById('btnScanLocalFonts');
      const scanStatus = document.getElementById('systemFontsScanStatus');
      if (btn) btn.disabled = true;
      if (scanStatus) scanStatus.textContent = 'Querying system typography...';
      try {
        const res = await this.fontManager.scanSystemFonts({ requestPermission: true });
        this.showToast(`System typography scanned: ${res.totalInstalled} fonts detected.`, 'success');
        if (scanStatus) {
          scanStatus.textContent = `${res.totalInstalled} fonts available (${res.nativeCount} local)`;
        }
        this.openMissingFontsModal();
        this.updateInspector();
      } catch (err) {
        this.showToast(`System font scan: ${err.message}`, 'error');
      } finally {
        if (btn) btn.disabled = false;
      }
    });

    document.getElementById('btnSkipMissingFonts')?.addEventListener('click', () => {
      const report = this.fontManager.scanDocumentForMissingFonts(this.doc, this.engine.activePageId);
      for (const m of report.missingFonts) {
        this.fontManager.skipMissingFont(m.fontFamily);
      }
      this.showToast('Skipped font changes. All text layers kept as-is.', 'info');
      this.closeMissingFontsModal();
      this.updateInspector();
      this.updateMissingFontsBadge();
    });

    document.getElementById('btnApplyMissingFonts')?.addEventListener('click', () => {
      const selects = document.querySelectorAll('.missing-font-replacement-select');
      let totalReplaced = 0;
      selects.forEach(sel => {
        const missingFont = sel.dataset.missingFont;
        const replacementFont = sel.value;
        if (missingFont && replacementFont && missingFont !== replacementFont) {
          const res = this.fontManager.replaceMissingFont(this.engine, missingFont, replacementFont);
          totalReplaced += res.replacedCount;
        }
      });
      if (totalReplaced > 0) {
        this.showToast(`Successfully replaced fonts across ${totalReplaced} text layer(s)!`, 'success');
        this.renderer.render();
        this.updateInspector();
        this.updateMissingFontsBadge();
      } else {
        this.showToast('No font replacements applied.', 'info');
      }
      this.closeMissingFontsModal();
    });

    // 4. Initial badge check
    this.updateMissingFontsBadge();
  }

  updateMissingFontsBadge() {
    if (typeof document === 'undefined') return;
    const report = this.fontManager.scanDocumentForMissingFonts(this.doc, this.engine.activePageId);
    const badge = document.getElementById('btnTopMissingFontsBadge');
    const countEl = document.getElementById('topMissingFontsCount');
    const unskippedCount = report.missingFonts.filter(m => !m.isSkipped).length;

    if (badge && countEl) {
      if (unskippedCount > 0) {
        badge.style.display = 'inline-flex';
        countEl.textContent = unskippedCount;
      } else {
        badge.style.display = 'none';
      }
    }
  }

  openMissingFontsModal(options = {}) {
    if (typeof document === 'undefined') return;
    const report = this.fontManager.scanDocumentForMissingFonts(this.doc, this.engine.activePageId);
    const tbody = document.getElementById('missingFontsTableBody');
    const modal = document.getElementById('modalMissingFonts');
    const summaryText = document.getElementById('missingFontsSummaryText');
    const availableFonts = this.fontManager.getAvailableFonts();

    if (!tbody || !modal) return;

    if (report.missingFonts.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="3" style="text-align: center; padding: 36px 16px; color: #10b981;">
            <div style="font-size: 24px; margin-bottom: 8px;">✓</div>
            <div style="font-weight: 600; font-size: 13px;">All fonts are available!</div>
            <div style="font-size: 11px; color: var(--text-dim); margin-top: 4px;">Zero missing fonts detected in the current document.</div>
          </td>
        </tr>
      `;
      if (summaryText) summaryText.textContent = 'All fonts installed & available';
      modal.style.display = 'flex';
      return;
    }

    tbody.innerHTML = report.missingFonts.map(m => {
      const isTarget = options.targetFont && options.targetFont.toLowerCase() === m.fontFamily.toLowerCase();
      const suggested = m.suggestedReplacement || 'Inter';

      return `
        <tr style="${isTarget ? 'background: rgba(245, 158, 11, 0.08);' : ''}">
          <td>
            <div class="missing-font-cell-title">
              <span class="missing-font-badge-warning">⚠️ Missing</span>
              <strong>${m.fontFamily}</strong>
            </div>
            ${m.isSkipped ? '<div style="font-size: 10px; color: #94a3b8; margin-top: 2px;">(Currently skipped)</div>' : ''}
          </td>
          <td>
            <span class="missing-font-cell-count">${m.count} layer${m.count > 1 ? 's' : ''}</span>
          </td>
          <td>
            <select class="missing-font-select missing-font-replacement-select" data-missing-font="${m.fontFamily}">
              <optgroup label="Recommended Replacement">
                <option value="${suggested}" selected>${suggested} (Recommended)</option>
              </optgroup>
              <optgroup label="Installed System Fonts">
                ${availableFonts.systemFonts.map(f => `<option value="${f}" ${f === suggested ? 'selected' : ''}>${f}</option>`).join('')}
              </optgroup>
              <optgroup label="Popular Web Fonts">
                ${availableFonts.webFonts.map(f => `<option value="${f}" ${f === suggested ? 'selected' : ''}>${f}</option>`).join('')}
              </optgroup>
            </select>
          </td>
        </tr>
      `;
    }).join('');

    if (summaryText) {
      summaryText.textContent = `${report.missingFonts.length} missing font family(s) across ${report.totalMissingLayers} text layer(s)`;
    }

    modal.style.display = 'flex';
  }

  closeMissingFontsModal() {
    if (typeof document === 'undefined') return;
    const modal = document.getElementById('modalMissingFonts');
    if (modal) modal.style.display = 'none';
  }


  exportSelectedAsSvg() {
    try {
      const sel = this.engine.getSelection();
      const page = this.engine.getActivePage();
      const ids = sel.length ? sel : page.rootIds;
      const svg = buildSvgExport(this.doc, page, ids);
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${this.doc.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-selection.svg`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      this.showToast(`Could not export SVG: ${error.message}`, 'error');
    }
  }

  async exportSelectedAsPng(scale = 1) {
    try {
      const page = this.engine.getActivePage();
      const ids = this.engine.getSelection().length ? this.engine.getSelection() : page.rootIds;
      const svg = buildSvgExport(this.doc, page, ids);
      const svgUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
      try {
      const image = new Image();
      image.src = svgUrl;
      await image.decode();
      const output = document.createElement('canvas');
      output.width = Math.ceil(image.naturalWidth * scale);
      output.height = Math.ceil(image.naturalHeight * scale);
      const context = output.getContext('2d');
      if (!context) throw new Error('Could not create an image export surface.');
      context.scale(scale, scale);
      context.drawImage(image, 0, 0);
      const blob = await new Promise(resolve => output.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('PNG rendering failed.');
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${this.doc.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-selection-${scale}x.png`;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      } finally {
        URL.revokeObjectURL(svgUrl);
      }
    } catch (error) {
      this.showToast(`Could not export PNG: ${error.message}`, 'error');
    }
  }

  // --- Native AI Assistant & Markdown Generation (Section 5 & 6) ---
  async handleAiGenerate() {
    const diffBox = document.getElementById('aiDiffBox');
    const applyBtn = document.getElementById('btnAiApply');
    const progressBar = document.getElementById('aiProgressBar');
    const progressText = document.getElementById('aiProgressText');
    const stream = document.getElementById('aiConversationStream');

    if (progressBar) progressBar.style.display = 'flex';
    if (diffBox) diffBox.style.display = 'none';
    if (applyBtn) applyBtn.style.display = 'none';

    try {
      if (this.aiInputMode === 'markdown') {
        const mdText = document.getElementById('aiMarkdownInput')?.value?.trim();
        if (!mdText) throw new Error('Please enter or import a Markdown specification.');

        if (progressText) progressText.textContent = 'Parsing Markdown specification & building design plan...';

        const parsed = this.ai.parseMarkdownSpec(mdText);
        this.pendingAiPlan = {
          intent: `Markdown Spec: ${parsed.title}`,
          explanation: parsed.summary,
          operations: parsed.operations,
          provider: 'Markdown Spec Compiler',
          specCoverage: parsed.specCoverage,
          ambiguities: parsed.ambiguities
        };

        // Show Spec Coverage & Ambiguities modal
        this.showSpecCoverageReport(parsed);

        // Append to conversation
        if (stream) {
          stream.innerHTML += `
            <div class="ai-chat-bubble user"><span data-icon="FileText"></span> Specification: ${parsed.title}</div>
            <div class="ai-chat-bubble assistant">${parsed.summary}</div>
          `;
          stream.scrollTop = stream.scrollHeight;
        }
      } else {
        const promptInput = document.getElementById('aiPromptInput');
        const prompt = promptInput?.value?.trim();
        if (!prompt) throw new Error('Please enter a prompt.');

        this.pendingAiPlan = await this.ai.generateDesignPlan(prompt, (prog) => {
          if (progressText) progressText.textContent = `[Step ${prog.step}/${prog.total}] ${prog.message}`;
        });

        if (stream) {
          stream.innerHTML += `
            <div class="ai-chat-bubble user">${prompt}</div>
            <div class="ai-chat-bubble assistant">${this.pendingAiPlan.explanation}</div>
          `;
          stream.scrollTop = stream.scrollHeight;
        }
      }

      if (progressBar) progressBar.style.display = 'none';

      if (diffBox && this.pendingAiPlan) {
        diffBox.style.display = 'block';
        const ops = this.pendingAiPlan.operations || [];
        diffBox.innerHTML = `
          <div style="font-weight: 700; color: #c084fc; margin-bottom: 4px;"><span data-icon="Sparkles"></span> Proposed: ${this.pendingAiPlan.intent}</div>
          <div style="font-size: 11px; color: var(--text-muted); line-height: 1.4; margin-bottom: 8px;">${this.pendingAiPlan.explanation}</div>
          <div style="font-size: 10px; color: var(--text-dim); display: flex; justify-content: space-between; align-items: center;">
            <span>${ops.length} atomic operation(s)</span>
            <span>Fully Undoable (⌘Z)</span>
          </div>
          ${this.pendingAiPlan.specCoverage ? `
            <div style="margin-top: 8px;">
              <button class="menu-dropdown-btn-sm" id="btnViewSpecReportInDiff" style="color: #38bdf8; font-size: 10px;"><span data-icon="Copy"></span> View Spec Coverage & Ambiguity Report</button>
            </div>
          ` : ''}
        `;
        document.getElementById('btnViewSpecReportInDiff')?.addEventListener('click', () => {
          this.showSpecCoverageReport(this.pendingAiPlan);
        });
      }
      if (applyBtn) applyBtn.style.display = 'block';
    } catch (err) {
      if (progressBar) progressBar.style.display = 'none';
      if (diffBox) {
        diffBox.style.display = 'block';
        diffBox.innerHTML = `<div style="color: #ef4444; font-weight: 600;">${err.name}: ${err.message}</div>`;
      }
    }
  }

  handleAiApply() {
    if (!this.pendingAiPlan) return;
    this.ai.executePlan(this.pendingAiPlan);
    this.pendingAiPlan = null;
    const diffBox = document.getElementById('aiDiffBox');
    const applyBtn = document.getElementById('btnAiApply');
    if (diffBox) diffBox.style.display = 'none';
    if (applyBtn) applyBtn.style.display = 'none';
    const promptInput = document.getElementById('aiPromptInput');
    if (promptInput) promptInput.value = '';
    this.renderer.zoomToFit();
    this.updateInspector();
  }

  handleAuditDesign() {
    const report = this.ai.auditDocument();
    const diffBox = document.getElementById('aiDiffBox');
    if (!diffBox) return;

    diffBox.style.display = 'block';

    if (report.findings.length === 0) {
      diffBox.innerHTML = `
        <div style="color: #10b981; font-weight: 700;"><span data-icon="Check"></span> All Design Checks Passed!</div>
        <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">Zero layout overflow, WCAG contrast compliant, and 100% token consistency across all elements.</div>
      `;
      return;
    }

    let itemsHtml = '';
    report.findings.forEach((f, idx) => {
      const color = f.severity === 'error' ? '#ef4444' : f.severity === 'warning' ? '#f59e0b' : '#38bdf8';
      itemsHtml += `
        <div style="padding: 8px; background: rgba(0,0,0,0.3); border-radius: 4px; border-left: 3px solid ${color}; margin-bottom: 6px;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <span style="font-size: 10px; font-weight: 700; color: ${color}; text-transform: uppercase;">${f.category}</span>
            ${f.fix ? `<button class="menu-dropdown-btn btn-quick-fix" data-fix-idx="${idx}" style="font-size: 9px; padding: 1px 4px; color: #10b981;">Fix</button>` : ''}
          </div>
          <div style="font-size: 11px; color: var(--text-main); margin-top: 2px;">${f.message}</div>
          <div style="font-size: 10px; color: var(--text-muted); margin-top: 2px;"><span data-icon="Lightbulb"></span> ${f.suggestion}</div>
        </div>
      `;
    });

    diffBox.innerHTML = `
      <div style="font-weight: 700; color: #38bdf8; margin-bottom: 6px;"><span data-icon="Search"></span> Design Audit (${report.findings.length} findings)</div>
      <div style="max-height: 180px; overflow-y: auto;">
        ${itemsHtml}
      </div>
    `;

    diffBox.querySelectorAll('.btn-quick-fix').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.fixIdx, 10);
        const finding = report.findings[idx];
        if (finding && finding.fix) {
          this.engine.updateNode(finding.fix.nodeId, finding.fix.patch, `Auto-fix: ${finding.category}`);
          btn.textContent = '<span data-icon="Check"></span> Fixed';
          btn.disabled = true;
          btn.style.opacity = '0.5';
        }
      });
    });
  }

  // --- Unified Design System Mode Transitions (Section 2 & 4) ---
  switchToDesignSystemMode() {
    const dsWorkspace = document.getElementById('designSystemWorkspace');
    const canvasWrapper = document.getElementById('canvasWrapper');
    const rightSidebar = document.getElementById('rightSidebar');
    if (dsWorkspace) dsWorkspace.style.display = 'flex';
    if (canvasWrapper) canvasWrapper.style.display = 'none';
    if (rightSidebar) rightSidebar.style.display = 'none';
    document.querySelectorAll('.mode-tab').forEach(t => t.classList.toggle('active', t.dataset.mode === 'design-system'));
    document.querySelectorAll('.right-tab-btn').forEach(t => t.classList.toggle('active', t.dataset.mode === 'design-system'));
    this.dsUi.renderView(this.dsUi.activeView || 'overview');
  }

  switchToDesignMode() {
    const dsWorkspace = document.getElementById('designSystemWorkspace');
    const canvasWrapper = document.getElementById('canvasWrapper');
    const rightSidebar = document.getElementById('rightSidebar');
    if (dsWorkspace) dsWorkspace.style.display = 'none';
    if (canvasWrapper) canvasWrapper.style.display = 'block';
    if (rightSidebar) rightSidebar.style.display = 'flex';
    if (this.renderer) this.renderer.render();
  }

  // --- Modals (Export, Prototype & Shortcuts) ---
  openExportModal() {
    const modal = document.getElementById('modalExport');
    if (!modal) return;
    modal.style.display = 'flex';

    const targetSelect = document.getElementById('exportTargetSelect');
    const currentTarget = targetSelect ? targetSelect.value : 'react-vite-ts';
    const isTs = !currentTarget.includes('js');

    const compiler = new ReactCompiler(this.doc, { target: currentTarget, typescript: isTs });
    const compilation = compiler.compile();
    const fileTree = compilation.fileTree;
    this.compiledFiles = fileTree;

    const fileListEl = document.getElementById('exportFileList');
    const viewerEl = document.getElementById('exportCodeViewer');
    fileListEl.innerHTML = '';

    let activeFileName = 'LIVE PREVIEW';

    if (targetSelect && !targetSelect._hasListener) {
      targetSelect._hasListener = true;
      targetSelect.addEventListener('change', () => this.openExportModal());
    }

    const copyBtn = document.getElementById('btnCopyExportCode');
    if (copyBtn) {
      copyBtn.onclick = async () => {
        const code = fileTree[activeFileName];
        if (!code) return;
        try {
          await navigator.clipboard.writeText(code);
          const orig = copyBtn.textContent;
          copyBtn.textContent = '<span data-icon="Check"></span> Copied!';
          setTimeout(() => { copyBtn.textContent = orig; }, 1800);
        } catch (error) {
          this.showToast(`Could not copy code: ${error.message}`, 'error');
        }
      };
    }

    const downloadBtn = document.getElementById('btnDownloadProjectPackage');
    if (downloadBtn) {
      downloadBtn.onclick = () => {
        try {
          const zipBlob = createStoredZip(fileTree);
          const url = URL.createObjectURL(zipBlob);
          const anchor = document.createElement('a');
          anchor.href = url;
          anchor.download = `${this.doc.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-react-export.zip`;
          anchor.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (error) {
          this.showToast(`Could not export React project: ${error.message}`, 'error');
        }
      };
    }

    // Live React Preview Tab
    const previewTab = document.createElement('div');
    previewTab.className = 'code-file-item active';
    previewTab.style.color = '#38bdf8';
    previewTab.style.fontWeight = 'bold';
    previewTab.textContent = 'LIVE REACT PREVIEW';
    previewTab.addEventListener('click', () => {
      fileListEl.querySelectorAll('.code-file-item').forEach(i => i.classList.remove('active'));
      previewTab.classList.add('active');
      activeFileName = 'LIVE PREVIEW';
      viewerEl.innerHTML = `<iframe srcdoc="${this.escapeAttr(compiler.generateLivePreviewHtml())}" class="preview-iframe" style="height: 100%;"></iframe>`;
    });
    fileListEl.appendChild(previewTab);

    // Diagnostics Tab
    if (compilation.diagnostics) {
      const diagTab = document.createElement('div');
      diagTab.className = 'code-file-item';
      diagTab.style.color = '#a855f7';
      diagTab.style.fontWeight = '600';
      diagTab.textContent = 'DIAGNOSTICS & AUDIT';
      diagTab.addEventListener('click', () => {
        fileListEl.querySelectorAll('.code-file-item').forEach(i => i.classList.remove('active'));
        diagTab.classList.add('active');
        activeFileName = 'DIAGNOSTICS';
        viewerEl.textContent = JSON.stringify(compilation.diagnostics, null, 2);
      });
      fileListEl.appendChild(diagTab);
    }

    // Source Files
    Object.keys(fileTree).forEach((fname) => {
      const item = document.createElement('div');
      item.className = 'code-file-item';
      item.textContent = fname;
      item.addEventListener('click', () => {
        fileListEl.querySelectorAll('.code-file-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        activeFileName = fname;
        viewerEl.textContent = fileTree[fname];
      });
      fileListEl.appendChild(item);
    });

    previewTab.click();
  }

  openPrototypeModal() {
    const modal = document.getElementById('modalPrototype');
    if (!modal) return;
    modal.style.display = 'flex';
    this.prototype.startFlow();

    const iframe = document.getElementById('protoPreviewIframe');
    if (iframe) {
      iframe.srcdoc = this.prototype.generatePrototypeHtml();
    }

    document.querySelectorAll('.btn-device-switch').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.btn-device-switch').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const device = btn.dataset.device;
        this.prototype.setDevice(device);
        const bezel = document.getElementById('deviceBezel');
        if (bezel) {
          if (device === 'mobile' || device === 'iphone16') {
            bezel.style.width = '393px';
            bezel.style.height = '852px';
            bezel.className = 'device-bezel mobile';
          } else if (device === 'pixel9') {
            bezel.style.width = '412px';
            bezel.style.height = '923px';
            bezel.className = 'device-bezel mobile';
          } else if (device === 'tablet') {
            bezel.style.width = '768px';
            bezel.style.height = '840px';
            bezel.className = 'device-bezel tablet';
          } else if (device === 'responsive') {
            bezel.style.width = '100%';
            bezel.style.height = '100%';
            bezel.className = 'device-bezel responsive';
          } else {
            bezel.style.width = '100%';
            bezel.style.height = '100%';
            bezel.className = 'device-bezel desktop';
          }
        }
      };
    });
  }

  refreshOpenPrototypePreview() {
    const modal = document.getElementById('modalPrototype');
    const iframe = document.getElementById('protoPreviewIframe');
    if (!modal || modal.style.display === 'none' || !iframe) return;
    iframe.srcdoc = this.prototype.generatePrototypeHtml();
  }

  showShortcutModal() {
    const modal = document.getElementById('modalHelp');
    if (!modal) return;
    modal.style.display = 'flex';

    const container = document.getElementById('shortcutGridContainer');
    if (container) {
      const all = this.shortcuts.getAllShortcuts();
      container.innerHTML = all.map(sc => `
        <div class="shortcut-row">
          <span class="shortcut-label">${sc.name}</span>
          <span class="shortcut-key">${sc.displayKey}</span>
        </div>
      `).join('');
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
  }

  escapeAttr(str) {
    return String(str ?? '').replace(/[&<>"']/g, character => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[character]);
  }

  escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, character => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[character]);
  }

  booleanSelected(op) {
    const sel = this.engine.getSelection();
    if (sel.length < 2) {
      this.showToast('Select 2 or more shape layers to perform a boolean operation.', 'warning');
      return;
    }
    const groupId = this.engine.booleanGroup(sel, op);
    if (groupId) {
      this.renderer.render();
      this.updateLayersTree();
      this.updateInspector();
      this.showToast(`Applied Boolean ${op.charAt(0).toUpperCase() + op.slice(1)}`);
    }
  }

  flattenSelected() {
    const sel = this.engine.getSelection();
    if (!sel || sel.length === 0) return;
    const res = this.engine.flattenSelection(sel);
    if (res) {
      this.renderer.render();
      this.updateLayersTree();
      this.updateInspector();
      this.showToast('Flattened selection to vector shape');
    }
  }

  detachSelected() {
    const sel = this.engine.getSelection();
    for (const id of sel) {
      this.engine.detachInstance(id);
    }
    this.renderer.render();
  }

  resetSelectedOverrides() {
    const sel = this.engine.getSelection();
    for (const id of sel) {
      this.engine.resetOverrides(id);
    }
    this.renderer.render();
  }

  toggleTheme(forcedTheme) {
    const themes = ['axiom-dark', 'axiom-light', 'high-contrast'];
    let next;
    if (forcedTheme && themes.includes(forcedTheme)) {
      next = forcedTheme;
    } else {
      const current = (typeof localStorage !== 'undefined' ? localStorage.getItem('designforge_theme') : null) || (this.doc.themeMode === 'light' ? 'axiom-light' : 'axiom-dark');
      const idx = themes.indexOf(current);
      next = themes[(idx + 1) % themes.length];
    }
    
    if (typeof document !== 'undefined') {
      document.body.classList.remove('theme-axiom-dark', 'theme-axiom-light', 'theme-high-contrast', 'theme-dark', 'theme-light');
      document.body.classList.add(`theme-${next}`);
      if (next === 'axiom-light') document.body.classList.add('theme-light');
      if (next === 'axiom-dark') document.body.classList.add('theme-dark');
      if (typeof localStorage !== 'undefined') localStorage.setItem('designforge_theme', next);
    }
    this.doc.themeMode = next === 'axiom-light' ? 'light' : (next === 'high-contrast' ? 'high-contrast' : 'dark');
    this.engine.setThemeMode(this.doc.themeMode);

    const btn = document.getElementById('btnToggleTheme');
    if (btn) {
      const themeIcon = btn.querySelector('#themeModeIcon');
      if (themeIcon) themeIcon.dataset.icon = next === 'axiom-light' ? 'Sun' : (next === 'high-contrast' ? 'Eye' : 'Moon');
      btn.title = `Theme: ${next.replace('-', ' ').toUpperCase()} (Click to cycle themes)`;
    }
    this.renderer.render();
  }

  async addNewPage(pageName) {
    let name = pageName;
    if (!name) {
      name = await this.showPromptModal({
        title: 'Add New Page',
        subtitle: 'Enter name for the new document page:',
        defaultValue: `Page ${this.doc.pages.length + 1}`,
        icon: 'FileText',
        confirmText: 'Create Page'
      });
    }
    if (!name || !name.trim()) return null;
    const newPage = addPageToDoc(this.doc, name.trim());
    this.engine.setActivePage(newPage.id);
    this.updatePagesList();
    this.updateLayersTree();
    this.renderer.zoomToFit();
    this.storage.scheduleAutosave(this.doc);
    const pLabel = document.getElementById('currentPageLabel');
    if (pLabel) pLabel.textContent = newPage.name;
    this.showToast(`Page "${newPage.name}" created`, 'success', 2000);
    return newPage;
  }

  // --- Figma Web Application Prompt & Modal System ---
  initFigmaModals() {
    if (typeof document === 'undefined') return;

    // 1. Universal Prompt Modal Event Listeners
    const modalBackdrop = document.getElementById('figmaPromptModal');
    const closeBtn = document.getElementById('btnFigmaPromptClose');
    const cancelBtn = document.getElementById('btnFigmaPromptCancel');
    const confirmBtn = document.getElementById('btnFigmaPromptConfirm');
    const textInput = document.getElementById('figmaPromptTextInput');
    const textArea = document.getElementById('figmaPromptTextArea');

    const closeModal = (resolvedVal = null) => {
      if (modalBackdrop) {
        modalBackdrop.classList.remove('active');
        modalBackdrop.setAttribute('aria-hidden', 'true');
      }
      if (this._promptModalResolver) {
        this._promptModalResolver(resolvedVal);
        this._promptModalResolver = null;
      }
    };

    closeBtn?.addEventListener('click', () => closeModal(null));
    cancelBtn?.addEventListener('click', () => closeModal(null));
    modalBackdrop?.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) closeModal(null);
    });

    const submitPrompt = () => {
      const activeInput = textArea?.style.display !== 'none' ? textArea : textInput;
      const val = activeInput?.value?.trim() ?? '';
      closeModal(val);
    };

    confirmBtn?.addEventListener('click', submitPrompt);

    textInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        submitPrompt();
      } else if (e.key === 'Escape') {
        closeModal(null);
      }
    });

    textArea?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        submitPrompt();
      } else if (e.key === 'Escape') {
        closeModal(null);
      }
    });

    // 2. Figma AI Floating Prompt Bar
    const aiBar = document.getElementById('figmaAiFloatingBar');
    const aiInput = document.getElementById('figmaAiBarInput');
    const aiSubmitBtn = document.getElementById('btnFigmaAiSubmit');
    const aiCloseBtn = document.getElementById('btnFigmaAiClose');

    const closeAiBar = () => {
      if (aiBar) aiBar.classList.remove('active');
    };

    const submitAiPrompt = async () => {
      const promptText = aiInput?.value?.trim();
      if (!promptText) return;
      closeAiBar();
      this.showToast(`Figma AI: Generating "${promptText.slice(0, 32)}..."`, 'info', 3000);
      
      const aiPromptInp = document.getElementById('aiPromptInput');
      if (aiPromptInp) aiPromptInp.value = promptText;
      this.switchToAiTab();
      await this.handleAiGenerate(promptText);
    };

    aiSubmitBtn?.addEventListener('click', submitAiPrompt);
    aiCloseBtn?.addEventListener('click', closeAiBar);
    aiInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        submitAiPrompt();
      } else if (e.key === 'Escape') {
        closeAiBar();
      }
    });

    // Preset chips
    document.querySelectorAll('.figma-ai-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const text = chip.dataset.aiPreset;
        if (aiInput && text) {
          aiInput.value = text;
          aiInput.focus();
        }
      });
    });

    // Trigger button in Command Bar & Command Palette
    document.getElementById('btnOpenFigmaAiPrompt')?.addEventListener('click', () => {
      this.openFigmaAiPromptBar();
    });
    document.getElementById('btnOpenCommandPalette')?.addEventListener('click', () => {
      this.openFigmaAiPromptBar();
    });

    // Keyboard Shortcuts: ⌘J / Ctrl+J or ⌘K / Ctrl+K opens Figma AI Prompt Bar
    window.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'j' || e.key === 'J' || e.key === 'k' || e.key === 'K')) {
        // Do not intercept browser inputs unless not typing
        const tag = document.activeElement?.tagName?.toLowerCase();
        if (tag !== 'input' && tag !== 'textarea') {
          e.preventDefault();
          this.openFigmaAiPromptBar();
        }
      } else if (e.key === 'Escape') {
        const cmdModal = document.getElementById('commandPaletteModal');
        if (cmdModal && cmdModal.style.display !== 'none') {
          cmdModal.style.display = 'none';
        }
        const aiBar = document.getElementById('figmaAiFloatingBar');
        if (aiBar && aiBar.classList.contains('active')) {
          aiBar.classList.remove('active');
        }
        const exportModal = document.getElementById('modalExport');
        if (exportModal && exportModal.style.display !== 'none') {
          exportModal.style.display = 'none';
        }
        const promptModal = document.getElementById('figmaPromptModal');
        if (promptModal && promptModal.style.display !== 'none') {
          promptModal.style.display = 'none';
        }
      }
    });
  }

  openFigmaAiPromptBar(prefill = '') {
    const aiBar = document.getElementById('figmaAiFloatingBar');
    const aiInput = document.getElementById('figmaAiBarInput');
    if (!aiBar || !aiInput) return;
    if (prefill) aiInput.value = prefill;
    aiBar.classList.add('active');
    setTimeout(() => {
      aiInput.focus();
      aiInput.select();
    }, 50);
  }

  showPromptModal(options = {}) {
    return new Promise((resolve) => {
      if (typeof document === 'undefined') return resolve(null);
      this._promptModalResolver = resolve;

      const modalBackdrop = document.getElementById('figmaPromptModal');
      const titleEl = document.getElementById('figmaPromptTitle');
      const subtitleEl = document.getElementById('figmaPromptSubtitle');
      const iconEl = document.getElementById('figmaPromptIcon');
      const textInput = document.getElementById('figmaPromptTextInput');
      const textArea = document.getElementById('figmaPromptTextArea');
      const confirmLabel = document.getElementById('figmaPromptConfirmLabel');
      const presetsContainer = document.getElementById('figmaPromptPresetsContainer');
      const presetsList = document.getElementById('figmaPromptPresetsList');

      if (titleEl) titleEl.textContent = options.title || 'Input Required';
      if (subtitleEl) subtitleEl.textContent = options.subtitle || 'Please enter a value:';
      if (iconEl) {
        const promptIcon = iconEl.querySelector('[data-icon]');
        if (promptIcon) promptIcon.dataset.icon = options.icon || 'Pencil';
      }
      if (confirmLabel) confirmLabel.textContent = options.confirmText || 'Apply';

      const isMultiline = Boolean(options.multiline);
      if (textInput) {
        textInput.style.display = isMultiline ? 'none' : 'block';
        textInput.value = options.defaultValue || '';
        textInput.placeholder = options.placeholder || '';
      }
      if (textArea) {
        textArea.style.display = isMultiline ? 'block' : 'none';
        textArea.value = options.defaultValue || '';
        textArea.placeholder = options.placeholder || '';
      }

      // Presets
      if (presetsContainer && presetsList) {
        if (Array.isArray(options.presets) && options.presets.length > 0) {
          presetsContainer.style.display = 'flex';
          presetsList.innerHTML = options.presets.map(p => `<button class="figma-preset-chip" type="button">${p}</button>`).join('');
          presetsList.querySelectorAll('.figma-preset-chip').forEach(chip => {
            chip.addEventListener('click', () => {
              const activeInput = isMultiline ? textArea : textInput;
              if (activeInput) {
                activeInput.value = chip.textContent;
                activeInput.focus();
              }
            });
          });
        } else {
          presetsContainer.style.display = 'none';
          presetsList.innerHTML = '';
        }
      }

      if (modalBackdrop) {
        modalBackdrop.classList.add('active');
        modalBackdrop.setAttribute('aria-hidden', 'false');
      }

      setTimeout(() => {
        const activeInput = isMultiline ? textArea : textInput;
        if (activeInput) {
          activeInput.focus();
          if (activeInput.select) activeInput.select();
        }
      }, 50);
    });
  }

  showToast(message, type = 'info', duration = 3000) {
    if (typeof document === 'undefined') return;
    const container = document.getElementById('figmaToastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `figma-toast toast-${type}`;
    const icon = type === 'success' ? 'Check' : (type === 'error' ? 'TriangleAlert' : (type === 'warning' ? 'TriangleAlert' : 'Info'));

    toast.innerHTML = `
      <span class="figma-toast-icon"><span data-icon="${icon}"></span></span>
      <span class="figma-toast-msg">${message}</span>
      <button class="figma-toast-close" title="Dismiss"><span data-icon="X"></span></button>
    `;

    toast.querySelector('.figma-toast-close')?.addEventListener('click', () => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px) scale(0.95)';
      setTimeout(() => toast.remove(), 200);
    });

    container.appendChild(toast);

    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px) scale(0.95)';
        setTimeout(() => toast.remove(), 200);
      }
    }, duration);
  }

  // --- Axiom Layout Controller (Section 3, 5, 6, 8, 11) ---
  initAxiomLayout() {
    if (typeof document === 'undefined') return;

    // 1. Mode Rail Controller (Section 3.4)
    const modeRailBtns = document.querySelectorAll('.mode-rail-btn');
    modeRailBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        modeRailBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.dataset.mode;
        this.setAxiomMode(mode);
      });
    });

    // 2. Page Selector Header
    const pageLabel = document.getElementById('currentPageLabel');
    if (pageLabel) {
      const activePage = this.engine.getActivePage();
      pageLabel.textContent = activePage?.name || 'Page 1';
    }
    document.getElementById('btnQuickAddPage')?.addEventListener('click', () => {
      this.addNewPage();
      const pLabel = document.getElementById('currentPageLabel');
      if (pLabel) pLabel.textContent = this.engine.getActivePage()?.name || 'New Page';
    });
    document.getElementById('btnPageSelectorMenu')?.addEventListener('click', () => {
      const pagesTabBtn = document.querySelector('.sidebar-tab-btn[data-tab="pages"]');
      pagesTabBtn?.click();
    });

    // 3. Bottom Drawer Controller (Section 3.1 & 3.2)
    const drawer = document.getElementById('axiomBottomDrawer');
    const toggleDrawerBtn = document.getElementById('btnToggleBottomDrawer');
    const closeDrawerBtn = document.getElementById('btnCloseDrawer');

    const toggleDrawer = () => {
      if (drawer) {
        drawer.classList.toggle('open');
        if (drawer.classList.contains('open')) {
          this.refreshDrawerContent();
        }
      }
    };

    toggleDrawerBtn?.addEventListener('click', toggleDrawer);
    closeDrawerBtn?.addEventListener('click', toggleDrawer);

    const drawerTabBtns = document.querySelectorAll('.drawer-tab-btn');
    drawerTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        drawerTabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tabKey = btn.dataset.drawerTab;
        const panes = document.querySelectorAll('.drawer-pane');
        panes.forEach(p => p.style.display = 'none');
        const activePane = document.getElementById(`drawerTab${tabKey.charAt(0).toUpperCase() + tabKey.slice(1).replace(/-([a-z])/g, g => g[1].toUpperCase())}`);
        if (activePane) activePane.style.display = 'block';
        this.refreshDrawerContent(tabKey);
      });
    });

    // 4. Mobile Live Preview QR Modal (Blueprint Section 11)
    document.getElementById('btnMobilePreviewQr')?.addEventListener('click', () => {
      this.openMobilePreviewQrModal();
    });
    document.getElementById('btnCloseMobilePreviewQr')?.addEventListener('click', () => {
      const modal = document.getElementById('modalMobilePreviewQr');
      if (modal) modal.style.display = 'none';
    });
    document.getElementById('btnCopyMobilePreviewLink')?.addEventListener('click', () => {
      const text = document.getElementById('modalQrUrlText')?.textContent;
      if (text) {
        navigator.clipboard?.writeText(text);
        const btn = document.getElementById('btnCopyMobilePreviewLink');
        if (btn) {
          btn.textContent = 'Copied!';
          setTimeout(() => { btn.textContent = 'Copy Link'; }, 2000);
        }
      }
    });
    document.getElementById('btnOpenMobilePreviewInTab')?.addEventListener('click', () => {
      const text = document.getElementById('modalQrUrlText')?.textContent;
      if (text) window.open(text, '_blank');
    });

    // 5. Restore Saved Theme
    const savedTheme = (typeof localStorage !== 'undefined' ? localStorage.getItem('designforge_theme') : null) || 'axiom-dark';
    document.body.className = `theme-${savedTheme}`;
    const themeBtn = document.getElementById('btnToggleTheme');
    if (themeBtn) {
      const themeIcon = themeBtn.querySelector('#themeModeIcon');
      if (themeIcon) themeIcon.dataset.icon = savedTheme === 'axiom-light' ? 'Sun' : (savedTheme === 'high-contrast' ? 'Eye' : 'Moon');
    }
  }

  setAxiomMode(mode) {
    const topMode = (mode === 'system' || mode === 'design-system') ? 'design-system' : mode;
    document.querySelectorAll('.mode-tab').forEach(t => t.classList.toggle('active', t.dataset.mode === topMode));
    document.querySelectorAll('.right-tab-btn').forEach(t => t.classList.toggle('active', t.dataset.mode === topMode || (topMode === 'design' && t.dataset.mode === 'properties')));
    document.querySelectorAll('.mode-rail-btn').forEach(button => {
      button.classList.toggle('active', button.dataset.mode === mode);
    });

    if (mode === 'design') {
      this.switchToDesignMode();
      this.rightSidebarModeSwitcher?.('design');
    } else if (mode === 'prototype') {
      this.switchToDesignMode();
      this.rightSidebarModeSwitcher?.('prototype');
    } else if (mode === 'system' || mode === 'design-system') {
      this.switchToDesignSystemMode();
    } else if (mode === 'dev') {
      this.switchToDesignMode();
      this.toggleDevMode(true);
      this.rightSidebarModeSwitcher?.('inspect');
    } else if (mode === 'comments') {
      this.switchToDesignMode();
      this.setTool('comment');
    } else if (mode === 'ai') {
      this.switchToDesignMode();
      this.switchToAiTab();
    }
  }

  refreshDrawerContent(tabKey = 'timeline') {
    if (tabKey === 'variables') {
      const el = document.getElementById('drawerVariablesContent');
      if (el) {
        const tokens = this.linter?.getAllTokens?.() || [];
        const vars = this.prototype?.variablesStore?.getAll?.() || [];
        let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px;">';
        for (const t of tokens.slice(0, 12)) {
          html += `<div style="padding: 8px; background: var(--surface-input); border-radius: 4px; border: 1px solid var(--border-subtle);"><span style="color: var(--brand-accent); font-weight: 600;">${t.id || t.name}</span>: <span style="color: var(--text-primary);">${t.value}</span></div>`;
        }
        for (const v of vars) {
          html += `<div style="padding: 8px; background: var(--surface-input); border-radius: 4px; border: 1px solid var(--border-subtle);"><span style="color: #10b981; font-weight: 600;">$${v.name}</span> = <span style="color: var(--text-primary);">${v.value}</span></div>`;
        }
        html += '</div>';
        el.innerHTML = html;
      }
    } else if (tabKey === 'comments') {
      const el = document.getElementById('drawerCommentsContent');
      if (el) {
        const comments = (this.doc.comments || []).filter(comment =>
          comment.pageId === this.engine.getActivePage()?.id
        );
        if (comments.length === 0) {
          el.innerHTML = '<div style="color: var(--text-muted);">No review comments yet. Press (C) to add a review comment on canvas.</div>';
        } else {
          el.innerHTML = comments.map(c => `<div style="padding: 6px 10px; margin-bottom: 6px; background: var(--surface-input); border-radius: 4px;"><strong>${this.escapeAttr(c.author || 'Reviewer')}:</strong> ${this.escapeAttr(c.text || 'Review note')} <span style="color: var(--text-muted); font-size: 10px; margin-left: 8px;">(${c.resolved ? 'resolved' : 'open'})</span></div>`).join('');
        }
      }
    } else if (tabKey === 'issues') {
      const el = document.getElementById('drawerIssuesContent');
      if (el) {
        const findings = this.linter?.lint?.()?.findings || [];
        if (findings.length === 0) {
          el.innerHTML = '<div style="color: var(--status-success);"><span data-icon="Check"></span> Zero design system or contrast issues found. Document is 100% compliant.</div>';
        } else {
          el.innerHTML = findings.slice(0, 10).map(f => `<div style="padding: 6px 10px; margin-bottom: 6px; background: var(--surface-input); border-radius: 4px; border-left: 3px solid ${f.level === 'error' ? 'var(--status-danger)' : 'var(--status-warning)'};"><strong>${f.level.toUpperCase()}:</strong> ${f.message}</div>`).join('');
        }
      }
    } else if (tabKey === 'ai-activity') {
      const el = document.getElementById('drawerAiActivityContent');
      if (el) {
        const history = this.ai?.service?.history || [];
        if (history.length === 0) {
          el.innerHTML = '<div style="color: var(--text-muted);">No AI operations executed yet in this session.</div>';
        } else {
          el.innerHTML = history.slice(-5).map(h => `<div style="padding: 6px 10px; margin-bottom: 6px; background: var(--surface-input); border-radius: 4px;"><strong>Prompt:</strong> ${h.prompt} <span style="color: var(--brand-accent); margin-left: 8px;">(${h.plan?.riskLevel || 'low'} risk)</span></div>`).join('');
        }
      }
    }
  }

  async openMobilePreviewQrModal() {
    const modal = document.getElementById('modalMobilePreviewQr');
    const container = document.getElementById('modalQrSvgContainer');
    const urlText = document.getElementById('modalQrUrlText');
    if (!modal) return;
    modal.style.display = 'flex';

    if (container) container.innerHTML = '<div style="color: #64748b; font-size: 12px;">Generating preview session...</div>';

    try {
      const res = await fetch('/api/preview/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: this.doc.name,
          documentSnapshot: this.doc
        })
      });
      const data = await res.json();
      if (data.success && data.previewUrl) {
        const fullUrl = `${window.location.origin}${data.previewUrl}`;
        const svg = generateQRCodeSVG(fullUrl, { size: 200, padding: 2 });
        if (container) container.innerHTML = svg;
        if (urlText) urlText.textContent = fullUrl;
      } else {
        throw new Error(data.error || 'Failed to initialize preview session');
      }
    } catch (err) {
      console.warn('Preview session generation note, using direct URL:', err.message);
      const fallbackUrl = `${window.location.origin}/preview.html`;
      const svg = generateQRCodeSVG(fallbackUrl, { size: 200, padding: 2 });
      if (container) container.innerHTML = svg;
      if (urlText) urlText.textContent = fallbackUrl;
    }
  }


  openShareModal() {
    const modal = document.getElementById('modalShare');
    if (!modal) return;
    modal.style.display = 'flex';
    document.getElementById('btnCloseShareModal')?.addEventListener('click', () => {
      modal.style.display = 'none';
    }, { once: true });
    document.getElementById('btnCopyShareLink')?.addEventListener('click', () => {
      const input = document.getElementById('shareLinkInput');
      if (input) {
        input.select();
        navigator.clipboard?.writeText(input.value);
        const btn = document.getElementById('btnCopyShareLink');
        if (btn) {
          btn.textContent = '<span data-icon="Check"></span> Copied!';
          setTimeout(() => { btn.textContent = 'Copy Link'; }, 2000);
        }
      }
    });
  }

  openLearnCenter() {
    const modal = document.getElementById('modalLearnCenter');
    if (!modal) return;
    modal.style.display = 'flex';
    this.renderLearnCenter();

    // Tab buttons inside Learn Center
    const tabVideos = document.getElementById('learnTabBtnVideos');
    const tabExercises = document.getElementById('learnTabBtnExercises');
    const tabDocs = document.getElementById('learnTabBtnDocs');
    const viewVideos = document.getElementById('learnViewVideos');
    const viewExercises = document.getElementById('learnViewExercises');
    const viewDocs = document.getElementById('learnViewDocs');

    tabVideos?.addEventListener('click', () => {
      tabVideos.classList.add('active');
      tabExercises?.classList.remove('active');
      tabDocs?.classList.remove('active');
      if (viewVideos) viewVideos.style.display = 'flex';
      if (viewExercises) viewExercises.style.display = 'none';
      if (viewDocs) viewDocs.style.display = 'none';
    });

    tabExercises?.addEventListener('click', () => {
      tabExercises.classList.add('active');
      tabVideos?.classList.remove('active');
      tabDocs?.classList.remove('active');
      if (viewExercises) viewExercises.style.display = 'flex';
      if (viewVideos) viewVideos.style.display = 'none';
      if (viewDocs) viewDocs.style.display = 'none';
    });

    tabDocs?.addEventListener('click', () => {
      tabDocs.classList.add('active');
      tabVideos?.classList.remove('active');
      tabExercises?.classList.remove('active');
      if (viewDocs) viewDocs.style.display = 'flex';
      if (viewVideos) viewVideos.style.display = 'none';
      if (viewExercises) viewExercises.style.display = 'none';
    });

    document.getElementById('btnCloseLearnCenterModal')?.addEventListener('click', () => {
      modal.style.display = 'none';
    }, { once: true });

    document.getElementById('btnStartTourFromLearn')?.addEventListener('click', () => {
      modal.style.display = 'none';
      this.startGuidedTour();
    });
  }

  renderLearnCenter() {
    const stats = this.learning.getProgressStats();
    const percentEl = document.getElementById('learnProgressPercent');
    const barEl = document.getElementById('learnProgressBar');
    if (percentEl) percentEl.textContent = `${stats.percentage}%`;
    if (barEl) barEl.style.width = `${stats.percentage}%`;

    // Render Video Tutorials
    const vidList = document.getElementById('learnViewVideos');
    if (vidList) {
      vidList.innerHTML = YOUTUBE_TUTORIALS.map(t => {
        const watched = this.learning.isTutorialWatched(t.id);
        return `
          <div style="display: flex; gap: 14px; padding: 14px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px;">
            <div style="font-size: 24px;"><span data-icon="Play"></span></div>
            <div style="flex: 1;">
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <h4 style="margin: 0 0 4px 0; font-size: 13px; color: #f8fafc;">${t.title}</h4>
                <span style="font-size: 11px; color: #38bdf8; background: rgba(56,189,248,0.12); padding: 2px 6px; border-radius: 4px;">${t.duration}</span>
              </div>
              <div style="font-size: 11px; color: #94a3b8; margin-bottom: 6px;">By ${t.creator} • Topic: <strong>${t.feature}</strong></div>
              <p style="font-size: 11px; line-height: 1.4; color: #cbd5e1; margin: 0 0 10px 0;">${t.topics}</p>
              <div style="display: flex; align-items: center; gap: 12px;">
                <a href="${t.url}" target="_blank" rel="noopener" style="font-size: 11px; color: #a855f7; text-decoration: none; font-weight: 600;">Watch on YouTube <span data-icon="ArrowUpRight"></span></a>
                <label style="font-size: 11px; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; gap: 4px;">
                  <input type="checkbox" class="cb-learn-tutorial" data-id="${t.id}" ${watched ? 'checked' : ''}>
                  Mark Completed
                </label>
              </div>
            </div>
          </div>
        `;
      }).join('');

      vidList.querySelectorAll('.cb-learn-tutorial').forEach(cb => {
        cb.onchange = (e) => {
          this.learning.toggleTutorial(e.target.dataset.id);
          this.renderLearnCenter();
        };
      });
    }

    // Render Practice Exercises
    const exList = document.getElementById('learnViewExercises');
    if (exList) {
      exList.innerHTML = PRACTICE_EXERCISES.map(ex => {
        const done = this.learning.isExerciseCompleted(ex.id);
        const badgeColor = ex.level === 'Beginner' ? '#10b981' : ex.level === 'Intermediate' ? '#38bdf8' : '#f59e0b';
        return `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px;">
            <div style="flex: 1; padding-right: 16px;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <span style="font-size: 10px; font-weight: 700; color: ${badgeColor}; border: 1px solid ${badgeColor}; padding: 1px 5px; border-radius: 3px;">${ex.level}</span>
                <strong style="font-size: 12px; color: #f8fafc;">${ex.title}</strong>
              </div>
              <p style="font-size: 11px; color: #94a3b8; margin: 0 0 6px 0;">${ex.desc}</p>
              <div style="display: flex; gap: 6px;">
                ${ex.skills.map(s => `<span style="font-size: 10px; background: rgba(255,255,255,0.06); padding: 2px 6px; border-radius: 4px; color: #cbd5e1;">${s}</span>`).join('')}
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <button class="menu-dropdown-btn-sm btn-load-exercise" data-action="${ex.templateAction}" style="font-size: 11px; color: #38bdf8;">Load Template</button>
              <input type="checkbox" class="cb-learn-exercise" data-id="${ex.id}" ${done ? 'checked' : ''} title="Mark exercise completed">
            </div>
          </div>
        `;
      }).join('');

      exList.querySelectorAll('.cb-learn-exercise').forEach(cb => {
        cb.onchange = (e) => {
          this.learning.toggleExercise(e.target.dataset.id);
          this.renderLearnCenter();
        };
      });

      exList.querySelectorAll('.btn-load-exercise').forEach(btn => {
        btn.onclick = (e) => {
          this.loadExerciseTemplate(e.target.dataset.action);
          document.getElementById('modalLearnCenter').style.display = 'none';
        };
      });
    }

    // Render Documentation
    const docList = document.getElementById('learnViewDocs');
    if (docList) {
      docList.innerHTML = OFFICIAL_DOCS.map(d => `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: rgba(255,255,255,0.02); border-radius: 6px; border: 1px solid rgba(255,255,255,0.06);">
          <div>
            <span style="font-size: 11px; font-weight: 700; color: #a855f7; margin-right: 8px;">[${d.section}]</span>
            <span style="font-size: 12px; color: #e2e8f0;">${d.title}</span>
          </div>
          <a href="${d.url}" target="_blank" rel="noopener" style="font-size: 11px; color: #38bdf8; text-decoration: none;">Read Docs <span data-icon="ArrowUpRight"></span></a>
        </div>
      `).join('');
    }
  }

  loadExerciseTemplate(templateAction) {
    const page = this.engine.getActivePage();
    if (templateAction === 'setup-frame-shapes') {
      const frame = createNode('frame', { name: 'Practice / Canvas Frame', transform: { x: 200, y: 150, width: 600, height: 400 } });
      const rect = createNode('rectangle', { parentId: frame.id, name: 'Card Rect', transform: { x: 30, y: 40, width: 140, height: 90 }, style: { cornerRadius: 8, fills: [{ color: '#3b82f6' }] } });
      const circle = createNode('ellipse', { parentId: frame.id, name: 'Status Indicator', transform: { x: 210, y: 40, width: 70, height: 70 }, style: { fills: [{ color: '#10b981' }] } });
      frame.childIds.push(rect.id, circle.id);
      this.engine.addNode(frame, null, 'Load Exercise Template');
      page.nodes[rect.id] = rect;
      page.nodes[circle.id] = circle;
    } else if (templateAction === 'setup-autolayout-button') {
      const btn = createNode('frame', {
        name: 'Auto-Layout Button',
        transform: { x: 300, y: 250, width: 160, height: 44 },
        layout: { mode: 'stack-horizontal', paddingLeft: 16, paddingRight: 16, paddingTop: 10, paddingBottom: 10, gap: 8, alignItems: 'center', justifyContent: 'center' },
        style: { cornerRadius: 8, fills: [{ color: '#6366f1' }] }
      });
      const txt = createNode('text', { parentId: btn.id, name: 'Button Copy', transform: { x: 0, y: 0, width: 80, height: 20 }, text: { content: 'Get Started', fontSize: 14, fontWeight: '600', color: '#ffffff' } });
      btn.childIds.push(txt.id);
      this.engine.addNode(btn, null, 'Load Auto-Layout Button Exercise');
      page.nodes[txt.id] = txt;
    } else if (templateAction === 'setup-align-distribute') {
      for (let i = 0; i < 3; i++) {
        const card = createNode('rectangle', {
          name: `Card ${i + 1}`,
          transform: { x: 180 + i * 160, y: 200 + (i % 2 === 0 ? 30 : 0), width: 120, height: 160 },
          style: { cornerRadius: 8, fills: [{ color: '#1e293b' }], strokes: [{ color: '#334155', width: 1 }] }
        });
        this.engine.addNode(card, null, 'Setup Align Cards');
      }
    }
    this.renderer.render();
  }

  startGuidedTour() {
    this.tourCurrentStep = 0;
    const card = document.getElementById('tourCalloutCard');
    if (!card) return;
    card.style.display = 'block';

    const updateTour = () => {
      const step = ONBOARDING_TOUR_STEPS[this.tourCurrentStep];
      if (!step) {
        card.style.display = 'none';
        return;
      }
      document.getElementById('tourStepTitle').textContent = step.title;
      document.getElementById('tourStepContent').textContent = step.content;
      document.getElementById('tourStepCounter').textContent = `Step ${this.tourCurrentStep + 1} of ${ONBOARDING_TOUR_STEPS.length}`;
      document.getElementById('btnTourPrev').style.display = this.tourCurrentStep === 0 ? 'none' : 'block';
      document.getElementById('btnTourNext').textContent = this.tourCurrentStep === ONBOARDING_TOUR_STEPS.length - 1 ? 'Finish' : 'Next →';
    };

    document.getElementById('btnCloseTour').onclick = () => { card.style.display = 'none'; };
    document.getElementById('btnTourPrev').onclick = () => {
      if (this.tourCurrentStep > 0) {
        this.tourCurrentStep--;
        updateTour();
      }
    };
    document.getElementById('btnTourNext').onclick = () => {
      if (this.tourCurrentStep < ONBOARDING_TOUR_STEPS.length - 1) {
        this.tourCurrentStep++;
        updateTour();
      } else {
        card.style.display = 'none';
      }
    };

    updateTour();
  }

  openMcpHub() {
    if (this.mcpHub) {
      this.mcpHub.open();
    }
  }

  async initMcpServers() {
    try {
      // 1. Native Design MCP Server (connected directly to CommandEngine & canonical doc)
      const designServer = new DesignMcpServer(this.engine);
      await this.mcpClientManager.registerInMemoryServer(designServer, {
        id: 'designforge-design-server',
        name: 'DesignForge Native Design Server',
        description: 'Exposes canonical document, layers, auto-layout, prototype flows, and React compiler'
      });

      // 2. Project Files MCP Server
      const fsServer = new FileSystemMcpServer('.');
      await this.mcpClientManager.registerInMemoryServer(fsServer, {
        id: 'designforge-project-files',
        name: 'Project Files & Specs Server',
        description: 'Provides project specification files and export manifests'
      });

      // 3. Documentation & Guidelines MCP Server
      const docServer = new DocumentationMcpServer();
      await this.mcpClientManager.registerInMemoryServer(docServer, {
        id: 'designforge-docs',
        name: 'Design Systems & WCAG Docs Server',
        description: 'Accessibility rules, 8pt spacing scales, and typography standards'
      });

      // 4. Git Handoff MCP Server
      const gitServer = new GitHandoffMcpServer();
      await this.mcpClientManager.registerInMemoryServer(gitServer, {
        id: 'designforge-git',
        name: 'Git & Repository Connector',
        description: 'Repository diff inspection and controlled handoff staging'
      });

      console.log('DesignForge MCP Ecosystem online: 4 servers connected.');
    } catch (err) {
      console.warn('MCP bootstrap warning:', err);
    }
  }
}

// Instantiate safely on DOM ready or immediate if already interactive/complete
if (typeof window !== 'undefined') {
  const initApp = () => {
    if (!window.designForge) {
      try {
        window.designForge = new DesignForgeApp();
      } catch (err) {
        console.error('Fatal error initializing DesignForgeApp:', err);
      }
    }
  };

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
}
