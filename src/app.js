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
import { ImportManager } from './engine/importer/index.js';
import {
  DesignSystemRegistry,
  AITokenWizard,
  ResponsiveTokenEngine,
  ComponentVariableExtractor,
  ReactDesignSystemImporter,
  DesignSystemUIController
} from './engine/design_system/index.js';

export class DesignForgeApp {
  constructor() {
    this.storage = new StorageEngine();
    const savedDoc = this.storage.loadAutosave();
    this.doc = savedDoc || createInitialDocument('ForgePay AI — Treasury Platform');

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
    this.reactDsImporter = new ReactDesignSystemImporter(this.dsRegistry);
    this.dsUi = new DesignSystemUIController(this);
    if (typeof window !== 'undefined') {
      window.designForgeApp = this;
    }

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
    this.showRulers = true;
    this.showGrid = true;

    // DOM references
    this.canvas = document.getElementById('canvas2d');
    this.renderer = new CanvasRenderer(this.canvas, this.engine);
    this.shortcuts = new ShortcutRegistry(this);

    this.initUI();
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

    console.log('⚡ DesignForge AI initialized successfully.');
  }

  initUI() {
    // Project title inline rename
    const titleInput = document.getElementById('projectTitleInput');
    if (titleInput) {
      titleInput.value = this.doc.name;
      titleInput.addEventListener('change', (e) => {
        this.doc.name = e.target.value.trim() || 'Untitled Project';
        this.storage.scheduleAutosave(this.doc);
      });
    }

    // Initialize Unified Design System UI Controller
    this.dsUi.init();

    // Top Bar Mode Switcher
    const modeTabs = document.querySelectorAll('.mode-tab');
    modeTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        modeTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const mode = tab.dataset.mode;
        if (mode === 'prototype') {
          this.openPrototypeModal();
        } else if (mode === 'code') {
          this.openExportModal();
        } else if (mode === 'design-system') {
          this.switchToDesignSystemMode();
        } else if (mode === 'design') {
          this.switchToDesignMode();
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

    // Sidebar navigation tabs (Layers, Assets, Pages)
    const sidebarTabs = document.querySelectorAll('.sidebar-tab-btn');
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
      alert('Project link copied to clipboard!');
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
              this.doc = loadedDoc;
              this.engine = new CommandEngine(this.doc);
              this.renderer.engine = this.engine;
              this.ai.engine = this.engine;
              this.bindEngineEvents();
              this.updateLayersTree();
              this.updatePagesList();
              this.updateInspector();
              this.renderer.zoomToFit();
              this.storage.scheduleAutosave(this.doc);
              alert(`Project "${loadedDoc.name}" loaded successfully!`);
            } catch (err) {
              alert(`Failed to load file: ${err.message}`);
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

    window.addEventListener('click', () => {
      menuItems.forEach(m => m.classList.remove('open'));
      const ctxMenu = document.getElementById('canvasContextMenu');
      if (ctxMenu) ctxMenu.style.display = 'none';
    });

    // File Menu Actions
    document.getElementById('menuNewProject')?.addEventListener('click', () => {
      if (confirm('Create a new blank project? Unsaved changes will be archived.')) {
        this.doc = createInitialDocument('Untitled Experience');
        this.engine = new CommandEngine(this.doc);
        this.renderer.engine = this.engine;
        this.ai.engine = this.engine;
        this.bindEngineEvents();
        this.updateLayersTree();
        this.updatePagesList();
        this.updateInspector();
        this.renderer.zoomToFit();
      }
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
    document.getElementById('ctxExportPng')?.addEventListener('click', () => this.exportSelectedAsPng());
    document.getElementById('ctxExportSvg')?.addEventListener('click', () => this.exportSelectedAsSvg());
  }

  // --- Right Sidebar: Persistent Properties & AI Workspace (Section 4 & Appendix A2) ---
  initRightSidebar() {
    const btnDesign = document.getElementById('btnTabDesign') || document.getElementById('btnTabProperties');
    const btnProto = document.getElementById('btnTabPrototype');
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

    btnDesign?.addEventListener('click', () => setSidebarMode('design'));
    btnProto?.addEventListener('click', () => setSidebarMode('prototype'));
    btnInspect?.addEventListener('click', () => setSidebarMode('inspect'));
    btnExport?.addEventListener('click', () => setSidebarMode('export'));
    btnAi?.addEventListener('click', () => setSidebarMode('ai'));

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
        const manual = prompt('Paste your Markdown specification here:');
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
    const keyFields = document.getElementById('aiKeyFields');
    const statusLabel = document.getElementById('aiModelStatusLabel');
    const modelBadge = document.getElementById('aiModelBadge');

    const updateAiStatusDisplay = (p) => {
      if (statusLabel) {
        if (p === 'ollama') {
          statusLabel.textContent = '🦙 Ollama Llama 3.1 (Local AI)';
        } else if (p === 'local') {
          statusLabel.textContent = '⚡ Built-in Synth Engine (Offline)';
        } else if (p === 'openai') {
          statusLabel.textContent = '🌐 OpenAI GPT-4o';
        } else if (p === 'gemini') {
          statusLabel.textContent = '✨ Google Gemini 1.5/2.0';
        }
      }
      if (modelBadge) {
        modelBadge.textContent = p === 'ollama' ? 'llama3.1:latest' : p;
      }
      if (keyFields) {
        keyFields.style.display = (p === 'local' || p === 'ollama') ? 'none' : 'flex';
      }
    };

    if (providerSelect) {
      providerSelect.value = this.ai.service.activeProviderName;
      updateAiStatusDisplay(providerSelect.value);

      providerSelect.addEventListener('change', (e) => {
        const p = e.target.value;
        this.ai.setProvider(p);
        updateAiStatusDisplay(p);
      });
    }

    const btnTestAi = document.getElementById('btnTestAiConnection');
    const aiConnStatus = document.getElementById('aiConnectionStatus');
    if (btnTestAi) {
      btnTestAi.addEventListener('click', async () => {
        if (aiConnStatus) {
          aiConnStatus.textContent = 'Testing connection to Ollama (Llama 3.1)...';
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
        const type = btn.dataset.type;
        const coords = { x: 300, y: 300 };
        this.handleShapeCreation(type === 'button' ? 'button' : 'frame', coords);
      });
    });

    // 1-Click Vector Shapes Inserts
    document.querySelectorAll('.shape-grid-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const shape = btn.dataset.insertShape;
        this.handleShapeCreation(shape, { x: 260, y: 240 });
      });
    });

    // Add Token button
    document.getElementById('btnAddTokenBtn')?.addEventListener('click', () => {
      const name = prompt('Enter Token Name (e.g. Brand / Violet):');
      if (!name) return;
      const value = prompt('Enter Token Value (Hex color or pixel number):', '#a855f7');
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
      }
    });

    // Add Page button
    document.getElementById('btnAddNewPage')?.addEventListener('click', () => {
      const name = prompt('Enter New Page Name:');
      if (name && name.trim()) {
        const newPage = addPageToDoc(this.doc, name.trim());
        this.engine.setActivePage(newPage.id);
        this.updatePagesList();
        this.updateLayersTree();
        this.renderer.zoomToFit();
        this.storage.scheduleAutosave(this.doc);
      }
    });
  }

  updatePagesList() {
    const container = document.getElementById('pagesListContainer');
    if (!container) return;

    let html = '';
    const activeId = this.engine.getActivePage().id;

    for (const p of this.doc.pages) {
      const isActive = p.id === activeId;
      const count = Object.keys(p.nodes).length;
      html += `
        <div class="page-list-item ${isActive ? 'active' : ''}" data-page-id="${p.id}">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 13px;">📄</span>
            <span>${p.name}</span>
            <span style="font-size: 10px; color: var(--text-dim);">(${count})</span>
          </div>
          <div class="page-actions-group">
            <button class="btn-icon-xs btn-page-dup" data-id="${p.id}" title="Duplicate page">❐</button>
            <button class="btn-icon-xs btn-page-ren" data-id="${p.id}" title="Rename page">✎</button>
            ${this.doc.pages.length > 1 ? `<button class="btn-icon-xs btn-page-del" data-id="${p.id}" title="Delete page">✕</button>` : ''}
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
        this.updatePagesList();
        this.updateLayersTree();
        this.updateInspector();
        this.updateAiContext();
        this.renderer.zoomToFit();
      });
    });

    container.querySelectorAll('.btn-page-dup').forEach(b => {
      b.addEventListener('click', () => {
        const clone = duplicatePageInDoc(this.doc, b.dataset.id);
        if (clone) {
          this.engine.setActivePage(clone.id);
          this.updatePagesList();
          this.updateLayersTree();
        }
      });
    });

    container.querySelectorAll('.btn-page-ren').forEach(b => {
      b.addEventListener('click', () => {
        const page = this.doc.pages.find(p => p.id === b.dataset.id);
        const name = prompt('Rename Page:', page.name);
        if (name && name.trim()) {
          renamePageInDoc(this.doc, b.dataset.id, name);
          this.updatePagesList();
        }
      });
    });

    container.querySelectorAll('.btn-page-del').forEach(b => {
      b.addEventListener('click', () => {
        if (confirm('Delete this page and all its layers?')) {
          deletePageFromDoc(this.doc, b.dataset.id);
          this.engine.setActivePage(this.doc.pages[0].id);
          this.updatePagesList();
          this.updateLayersTree();
        }
      });
    });
  }

  bindEngineEvents() {
    this.engine.subscribe((eventType, detail) => {
      this.renderer.render();
      this.updateLayersTree();
      this.updateInspector();
      this.updateAiContext();
      this.updateRulers();
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
    });
  }

  updateRulers() {
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
    }, { passive: false });

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
    });

    canvas.addEventListener('mousedown', (e) => {
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
        const text = prompt('Enter your design review comment:');
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
          resolveBtn.textContent = hitComment.resolved ? '↩ Re-open Note' : '✓ Mark Resolved';
          resolveBtn.onclick = () => {
            resolveCommentInDoc(this.doc, hitComment.id);
            renderer.render();
            popup.style.display = 'none';
          };
        }
        return;
      }

      // 2. Shape Creation Tools
      if (this.currentTool !== 'select') {
        this.handleShapeCreation(this.currentTool, canvasCoords);
        this.setTool('select');
        return;
      }

      // 3. Resize Handle Hit-test
      const selectedIds = engine.getSelection();
      const page = engine.getActivePage();
      if (selectedIds.length === 1) {
        const bounds = computeWorldBounds(page, selectedIds[0]);
        const handle = renderer.hitTestHandle(canvasCoords.x, canvasCoords.y, bounds);
        if (handle) {
          const node = engine.getNode(selectedIds[0]);
          this.dragState = {
            type: 'resize',
            handle,
            nodeId: selectedIds[0],
            startBounds: { ...bounds },
            startTransform: { ...node.transform },
            startX: e.clientX,
            startY: e.clientY
          };
          return;
        }
      }

      // 4. Hit-test canvas objects
      const hitNodeId = renderer.hitTest(canvasCoords.x, canvasCoords.y);

      if (hitNodeId) {
        if (e.shiftKey) {
          engine.selectToggle(hitNodeId);
        } else if (!selectedIds.includes(hitNodeId)) {
          engine.setSelection([hitNodeId]);
        }

        const node = engine.getNode(hitNodeId);
        if (node && !node.locked) {
          this.dragState = {
            type: 'move',
            startX: canvasCoords.x,
            startY: canvasCoords.y,
            lastX: canvasCoords.x,
            lastY: canvasCoords.y,
            nodeIds: engine.getSelection(),
            initialPositions: engine.getSelection().map(id => {
              const n = engine.getNode(id);
              return { id, x: n.transform.x, y: n.transform.y };
            })
          };
        }
      } else {
        // Clicked empty canvas -> Marquee selection
        if (!e.shiftKey) engine.clearSelection();
        this.dragState = { type: 'marquee', startX: canvasCoords.x, startY: canvasCoords.y };
        renderer.marquee = { startX: canvasCoords.x, startY: canvasCoords.y, currentX: canvasCoords.x, currentY: canvasCoords.y };
      }
    });

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

      if (this.dragState.type === 'move') {
        const dx = canvasCoords.x - this.dragState.lastX;
        const dy = canvasCoords.y - this.dragState.lastY;

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
      } else if (this.dragState.type === 'marquee') {
        renderer.marquee.currentX = canvasCoords.x;
        renderer.marquee.currentY = canvasCoords.y;
        renderer.render();
      }
    });

    window.addEventListener('mouseup', () => {
      if (!this.dragState) return;

      if (this.dragState.type === 'move') {
        renderer.snapGuides = [];
        const totalDx = this.dragState.lastX - this.dragState.startX;
        const totalDy = this.dragState.lastY - this.dragState.startY;
        if (totalDx !== 0 || totalDy !== 0) {
          engine.notify('document-change', { description: 'Move objects' });
        }
      } else if (this.dragState.type === 'resize') {
        engine.notify('document-change', { description: 'Resize object' });
      } else if (this.dragState.type === 'marquee') {
        renderer.marquee = null;
        renderer.render();
      }

      this.dragState = null;
      canvas.style.cursor = this.isHandMode ? 'grab' : 'default';
    });

    window.addEventListener('keyup', (e) => {
      if (e.key === 'Alt' && renderer.altMeasureActive) {
        renderer.altMeasureActive = false;
        renderer.render();
      }
    });

    // Double click to inline edit text
    canvas.addEventListener('dblclick', (e) => {
      const coords = renderer.screenToCanvas(e.clientX, e.clientY);
      const hitId = renderer.hitTest(coords.x, coords.y);
      if (hitId) {
        const node = engine.getNode(hitId);
        if (node && node.type === 'text') {
          const currentText = node.text?.content || '';
          const newText = prompt('Edit text content:', currentText);
          if (newText !== null && newText !== currentText) {
            engine.updateNode(hitId, { text: { content: newText } }, 'Edit text');
          }
        }
      }
    });
  }

  handleShapeCreation(tool, coords) {
    let node;
    const x = Math.round(coords.x);
    const y = Math.round(coords.y);

    if (tool === 'frame') {
      node = createNode('frame', { name: 'New Frame', transform: { x, y, width: 360, height: 240 } });
    } else if (tool === 'rectangle') {
      node = createNode('rectangle', { name: 'Rectangle', transform: { x, y, width: 120, height: 80 } });
    } else if (tool === 'ellipse') {
      node = createNode('ellipse', { name: 'Circle', transform: { x, y, width: 80, height: 80 } });
    } else if (tool === 'line') {
      node = createNode('line', { name: 'Line', transform: { x, y, width: 140, height: 2 } });
    } else if (tool === 'star') {
      node = createNode('star', { name: 'Star', transform: { x, y, width: 64, height: 64 } });
    } else if (tool === 'polygon') {
      node = createNode('polygon', { name: 'Polygon', transform: { x, y, width: 72, height: 72 } });
    } else if (tool === 'image') {
      node = createNode('image', { name: 'Image Box', transform: { x, y, width: 240, height: 160 } });
    } else if (tool === 'text') {
      node = createNode('text', {
        name: 'Heading',
        transform: { x, y, width: 200, height: 32 },
        text: { content: 'New Text Block', fontSize: 18, fontWeight: '600' }
      });
    } else if (tool === 'button') {
      node = createNode('button', { name: 'Button / Primary', transform: { x, y, width: 140, height: 44 } });
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
    const colorMap = new Map();
    const visit = (nodeId) => {
      const node = page.nodes[nodeId];
      if (!node) return;
      if (node.style?.fills) {
        for (const f of node.style.fills) {
          if (f.color && f.color !== 'transparent') {
            const hex = f.color.toLowerCase();
            colorMap.set(hex, (colorMap.get(hex) || 0) + 1);
          }
        }
      }
      if (node.style?.strokes) {
        for (const s of node.style.strokes) {
          if (s.color) {
            const hex = s.color.toLowerCase();
            colorMap.set(hex, (colorMap.get(hex) || 0) + 1);
          }
        }
      }
      if (node.text?.color) {
        const hex = node.text.color.toLowerCase();
        colorMap.set(hex, (colorMap.get(hex) || 0) + 1);
      }
      if (node.childIds) {
        for (const cid of node.childIds) visit(cid);
      }
    };
    for (const id of selectedIds) visit(id);
    return Array.from(colorMap.entries()).map(([hex, count]) => ({ hex, count }));
  }

  // --- Contextual Figma-Identical Design Tab Inspector (Section 4.1 & Appendix A2.2) ---
  updateInspector() {
    const selectedIds = this.engine.getSelection();
    const container = document.getElementById('inspectorProperties');
    const badge = document.getElementById('selectionCountBadge');
    const title = document.getElementById('inspectorSelectionTitle');
    if (!container) return;

    if (badge) badge.textContent = `${selectedIds.length} selected`;

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
            <div class="color-swatch-box" style="background: ${page.background || '#090d16'};"></div>
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
            <button class="btn-inspector-action" id="btnInspBpDesktop" style="font-size: 11px;">💻 Desktop (1440)</button>
            <button class="btn-inspector-action" id="btnInspBpTablet" style="font-size: 11px;">📱 Tablet (768)</button>
            <button class="btn-inspector-action" id="btnInspBpMobile" style="font-size: 11px;">📲 Mobile (375)</button>
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
        page.background = e.target.value;
        this.renderer.render();
      });

      document.getElementById('chkShowLayoutGrid')?.addEventListener('change', (e) => {
        this.renderer.showLayoutGrid = e.target.checked;
        this.renderer.render();
      });

      document.getElementById('btnInspBpDesktop')?.addEventListener('click', () => this.switchBreakpoint('desktop'));
      document.getElementById('btnInspBpTablet')?.addEventListener('click', () => this.switchBreakpoint('tablet'));
      document.getElementById('btnInspBpMobile')?.addEventListener('click', () => this.switchBreakpoint('mobile'));
      document.getElementById('btnInspAddToken')?.addEventListener('click', () => {
        const val = prompt('Enter new color hex (e.g. #06b6d4):');
        if (val) {
          this.engine.doc.tokens[0].tokens.push({
            id: `token_${Date.now()}`,
            name: `Custom / ${val}`,
            type: 'color',
            value: val
          });
          this.updateInspector();
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

    const fills = s.fills && s.fills.length > 0 ? s.fills : [{ type: 'solid', color: '#334155', opacity: 1 }];
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
        <button class="btn-align-tool" id="inspAlignHCenter" title="Align Horizontal Centers (⌥H)">↔</button>
        <button class="btn-align-tool" id="inspAlignRight" title="Align Right (⌥D)">⇥</button>
        <button class="btn-align-tool" id="inspAlignTop" title="Align Top (⌥W)">⤊</button>
        <button class="btn-align-tool" id="inspAlignVCenter" title="Align Vertical Centers (⌥V)">↕</button>
        <button class="btn-align-tool" id="inspAlignBottom" title="Align Bottom (⌥S)">⤋</button>
        <div class="shelf-divider" style="height: 14px;"></div>
        <button class="btn-align-tool" id="inspDistH" title="Distribute Horizontal Spacing">⫿</button>
        <button class="btn-align-tool" id="inspDistV" title="Distribute Vertical Spacing">⫾</button>
      </div>

      <!-- 2. Transform Section & Explicit Variable Extraction (Section 11) -->
      <div class="section-group">
        <div class="section-title">
          <span>Transform</span>
          <span style="font-size: 10px; color: var(--accent-blue); text-transform: lowercase;">${node.type}</span>
        </div>
        <div style="display: flex; gap: 6px; margin-bottom: 8px;">
          <button class="btn-inspector-action" id="btnExtractCompVariables" style="font-size: 11px; color: #10b981; border: 1px solid rgba(16,185,129,0.4);" title="Extract Reusable Variables with AI (Section 11)">
            <span>🔤 Extract Variables (AI)</span>
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
            ${this.aspectRatioLocked ? '🔒' : '🔓'}
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

        <div style="display: flex; gap: 6px; margin-top: 8px;">
          <button class="btn-inspector-action" id="btnFlipH" style="font-size: 11px; flex: 1;">↔ Flip Horizontal</button>
          <button class="btn-inspector-action" id="btnFlipV" style="font-size: 11px; flex: 1;">↕ Flip Vertical</button>
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
            <button class="btn-icon-xs" id="btnToggleVis" title="Toggle Visibility">${node.visible !== false ? '👁' : '🚫'}</button>
            <button class="btn-icon-xs" id="btnToggleLock" title="Toggle Lock">${node.locked ? '🔒' : '🔓'}</button>
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

      <!-- 5. Fills Section (Solid, Linear Gradient, Token Chips, Eyedropper) -->
      <div class="section-group">
        <div class="section-title">
          <span>Fill</span>
          <button class="btn-icon-xs" id="btnAddFill" title="Add Fill">+</button>
        </div>
        ${fills.map((f, idx) => `
        <div class="props-row" style="margin-bottom: 6px;">
          <div class="color-swatch-box" style="background: ${f.color || '#334155'};" id="swatchFill_${idx}"></div>
          <div class="prop-field">
            <input type="text" class="prop-input fill-hex-input" data-index="${idx}" value="${f.color || '#334155'}">
            ${f.tokenName ? `<span class="token-chip-badge" title="Bound to token">${f.tokenName}</span>` : ''}
          </div>
          <button class="btn-icon-xs btn-bind-token" data-index="${idx}" title="Bind to Theme Token">❖</button>
          <button class="btn-icon-xs btn-remove-fill" data-index="${idx}" title="Remove Fill">✕</button>
        </div>
        `).join('')}
      </div>

      <!-- 6. Strokes Section -->
      <div class="section-group">
        <div class="section-title">
          <span>Stroke</span>
          <button class="btn-icon-xs" id="btnAddStroke" title="Add Stroke">+</button>
        </div>
        ${strokes.length > 0 ? strokes.map((st, idx) => `
        <div class="props-row">
          <div class="color-swatch-box" style="background: ${st.color || '#3b82f6'};"></div>
          <div class="prop-field">
            <input type="text" class="prop-input stroke-hex-input" data-index="${idx}" value="${st.color || '#3b82f6'}">
          </div>
          <div class="prop-field" style="max-width: 65px;">
            <span class="prop-label">W</span>
            <input type="text" class="prop-input stroke-width-input" data-index="${idx}" value="${st.width || 1}">
          </div>
          <button class="btn-icon-xs btn-remove-stroke" data-index="${idx}">✕</button>
        </div>
        `).join('') : '<div style="font-size: 11px; color: var(--text-dim);">No stroke applied</div>'}
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
            <button class="btn-icon-xs btn-remove-effect" data-index="${idx}">✕</button>
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
      ${isText ? `
      <div class="section-group">
        <div class="section-title">Typography</div>
        <div class="props-row">
          <div class="prop-field">
            <select class="prop-select" id="propFontFamily">
              <option value="Inter, sans-serif" ${node.text?.fontFamily?.includes('Inter') ? 'selected' : ''}>Inter</option>
              <option value="'Outfit', sans-serif" ${node.text?.fontFamily?.includes('Outfit') ? 'selected' : ''}>Outfit</option>
              <option value="'Roboto', sans-serif" ${node.text?.fontFamily?.includes('Roboto') ? 'selected' : ''}>Roboto</option>
              <option value="'JetBrains Mono', monospace" ${node.text?.fontFamily?.includes('Mono') ? 'selected' : ''}>JetBrains Mono</option>
              <option value="'Playfair Display', serif" ${node.text?.fontFamily?.includes('Playfair') ? 'selected' : ''}>Playfair Display</option>
            </select>
          </div>
        </div>
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
          <textarea class="prop-input" id="propTextContent" rows="3" style="padding: 6px; width: 100%; border-radius: 4px; border: 1px solid var(--border-subtle);">${node.text?.content || ''}</textarea>
        </div>
      </div>` : ''}

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
          ${selectionColors.map(sc => `
          <div class="selection-color-item">
            <div style="display: flex; align-items: center; gap: 8px;">
              <div class="color-swatch-box" style="background: ${sc.hex}; width: 16px; height: 16px;"></div>
              <span style="font-family: 'JetBrains Mono', monospace; font-size: 11px;">${sc.hex}</span>
              <span style="color: var(--text-dim); font-size: 10px;">×${sc.count}</span>
            </div>
            <button class="menu-dropdown-btn-sm btn-recolor-hex" data-hex="${sc.hex}">Change</button>
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
    document.getElementById('btnExtractCompVariables')?.addEventListener('click', () => {
      this.dsUi.openComponentVariablesModal(node);
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
          curFills[idx].color = e.target.value;
          this.engine.updateNode(node.id, { style: { fills: curFills } }, 'Change Fill Color');
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
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index, 10);
        const colorTokens = this.linter.getAllTokens().filter(t => t.type === 'color');
        const tokenListStr = colorTokens.map((t, i) => `${i + 1}. ${t.name} (${t.value})`).join('\n');
        const chosen = prompt(`Select Design Token to bind:\n${tokenListStr}\nEnter number:`);
        if (chosen) {
          const tIdx = parseInt(chosen, 10) - 1;
          if (colorTokens[tIdx]) {
            const tok = colorTokens[tIdx];
            const curFills = JSON.parse(JSON.stringify(s.fills || []));
            if (curFills[idx]) {
              curFills[idx].color = tok.value;
              curFills[idx].tokenId = tok.id;
              curFills[idx].tokenName = tok.name;
              this.engine.updateNode(node.id, { style: { fills: curFills } }, 'Bind Fill to Token');
            }
          }
        }
      });
    });

    // 6. Strokes
    document.getElementById('btnAddStroke')?.addEventListener('click', () => {
      const curStrokes = JSON.parse(JSON.stringify(s.strokes || []));
      curStrokes.push({ color: '#38bdf8', width: 1, align: 'inside' });
      this.engine.updateNode(node.id, { style: { strokes: curStrokes } }, 'Add Stroke');
    });
    document.querySelectorAll('.stroke-hex-input').forEach(inp => {
      inp.addEventListener('change', (e) => {
        const idx = parseInt(inp.dataset.index, 10);
        const curStrokes = JSON.parse(JSON.stringify(s.strokes || []));
        if (curStrokes[idx]) {
          curStrokes[idx].color = e.target.value;
          this.engine.updateNode(node.id, { style: { strokes: curStrokes } }, 'Change Stroke Color');
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
    document.getElementById('btnAlignLeft')?.addEventListener('click', () => {
      this.engine.updateNode(node.id, { text: { textAlign: 'left' } }, 'Align Text Left');
    });
    document.getElementById('btnAlignCenter')?.addEventListener('click', () => {
      this.engine.updateNode(node.id, { text: { textAlign: 'center' } }, 'Align Text Center');
    });
    document.getElementById('btnAlignRight')?.addEventListener('click', () => {
      this.engine.updateNode(node.id, { text: { textAlign: 'right' } }, 'Align Text Right');
    });

    // 9. Recolor Hex
    document.querySelectorAll('.btn-recolor-hex').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetHex = btn.dataset.hex;
        const newHex = prompt(`Replace color ${targetHex} with:`, targetHex);
        if (newHex && newHex !== targetHex) {
          const curFills = JSON.parse(JSON.stringify(s.fills || []));
          for (const f of curFills) {
            if (f.color?.toLowerCase() === targetHex) f.color = newHex;
          }
          this.engine.updateNode(node.id, { style: { fills: curFills } }, 'Recolor Selection');
        }
      });
    });

    // 10. Instant Export Buttons
    document.getElementById('btnExportSelectionPng')?.addEventListener('click', () => this.exportSelectedAsPng());
    document.getElementById('btnExportSelectionSvg')?.addEventListener('click', () => this.exportSelectedAsSvg());
  }

  // --- Prototype Panel Synchronizer (Section 4.2 & Appendix A2.4) ---
  updatePrototypePanel() {
    const container = document.getElementById('prototypePanelContent');
    if (!container) return;
    const selectedIds = this.engine.getSelection();
    const page = this.engine.getActivePage();

    if (selectedIds.length === 0) {
      container.innerHTML = `
        <div class="empty-inspector-note">
          <p>Select a frame or layer to attach interactive triggers, transitions, and screen navigation.</p>
        </div>`;
      return;
    }

    const node = this.engine.getNode(selectedIds[0]);
    if (!node) return;

    const frames = page.rootIds.map(id => page.nodes[id]).filter(n => n && n.type === 'frame');
    const interactions = node.interactions || [];

    container.innerHTML = `
      <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 10px;">
        Layer: <strong>${node.name}</strong> (${node.type})
      </div>

      <!-- Flow Starting Point Toggle -->
      <div class="props-row" style="margin-bottom: 12px; padding: 8px; background: var(--bg-surface); border-radius: 6px;">
        <label style="display: flex; align-items: center; gap: 8px; font-size: 11px; cursor: pointer;">
          <input type="checkbox" id="chkFlowStart" ${node.isFlowStart ? 'checked' : ''}>
          <span>Set as Flow Starting Point</span>
        </label>
      </div>

      <div class="section-title">Interactions (${interactions.length})</div>

      ${interactions.map((int, idx) => `
      <div class="proto-interaction-card">
        <div class="proto-row">
          <span style="font-weight: 600; color: #38bdf8;">⚡ Interaction ${idx + 1}</span>
          <button class="btn-icon-xs btn-remove-interaction" data-index="${idx}">✕</button>
        </div>
        <div class="proto-row">
          <span style="color: var(--text-dim);">Trigger:</span>
          <select class="prop-select sel-trigger" data-index="${idx}" style="font-size: 11px;">
            <option value="click" ${int.trigger === 'click' ? 'selected' : ''}>On Click</option>
            <option value="hover" ${int.trigger === 'hover' ? 'selected' : ''}>While Hovering</option>
            <option value="press" ${int.trigger === 'press' ? 'selected' : ''}>While Pressing</option>
            <option value="enter" ${int.trigger === 'enter' ? 'selected' : ''}>Mouse Enter</option>
          </select>
        </div>
        <div class="proto-row">
          <span style="color: var(--text-dim);">Action:</span>
          <select class="prop-select sel-action" data-index="${idx}" style="font-size: 11px;">
            <option value="navigate" ${int.action === 'navigate' ? 'selected' : ''}>Navigate To Frame</option>
            <option value="overlay" ${int.action === 'overlay' ? 'selected' : ''}>Open Modal Overlay</option>
            <option value="back" ${int.action === 'back' ? 'selected' : ''}>Go Back</option>
            <option value="url" ${int.action === 'url' ? 'selected' : ''}>Open External URL</option>
          </select>
        </div>
        <div class="proto-row">
          <span style="color: var(--text-dim);">Target:</span>
          <select class="prop-select sel-target" data-index="${idx}" style="font-size: 11px;">
            ${frames.map(f => `<option value="${f.id}" ${int.targetId === f.id ? 'selected' : ''}>${f.name}</option>`).join('')}
          </select>
        </div>
        <div class="proto-row">
          <span style="color: var(--text-dim);">Animation:</span>
          <select class="prop-select sel-anim" data-index="${idx}" style="font-size: 11px;">
            <option value="instant" ${int.animation === 'instant' ? 'selected' : ''}>Instant</option>
            <option value="dissolve" ${int.animation === 'dissolve' ? 'selected' : ''}>Dissolve</option>
            <option value="smart-animate" ${int.animation === 'smart-animate' ? 'selected' : ''}>Smart Animate</option>
            <option value="slide-left" ${int.animation === 'slide-left' ? 'selected' : ''}>Slide Left</option>
          </select>
        </div>
      </div>
      `).join('')}

      <div style="margin-top: 14px;">
        <button class="btn-primary" id="btnLaunchProtoSim" style="width: 100%; font-size: 11px;">▶ Launch Prototype Simulator (⌥⌘P)</button>
      </div>
    `;

    document.getElementById('chkFlowStart')?.addEventListener('change', (e) => {
      this.engine.updateNode(node.id, { isFlowStart: e.target.checked }, 'Toggle Flow Starting Point');
    });

    document.getElementById('btnAddInteractionBtn')?.addEventListener('click', () => {
      const cur = JSON.parse(JSON.stringify(node.interactions || []));
      const targetId = frames[0]?.id || null;
      cur.push({ trigger: 'click', action: 'navigate', targetId, animation: 'dissolve' });
      this.engine.updateNode(node.id, { interactions: cur }, 'Add Interaction');
      this.updatePrototypePanel();
    });

    document.querySelectorAll('.btn-remove-interaction').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index, 10);
        const cur = JSON.parse(JSON.stringify(node.interactions || []));
        cur.splice(idx, 1);
        this.engine.updateNode(node.id, { interactions: cur }, 'Remove Interaction');
        this.updatePrototypePanel();
      });
    });

    document.querySelectorAll('.sel-trigger').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const idx = parseInt(sel.dataset.index, 10);
        const cur = JSON.parse(JSON.stringify(node.interactions || []));
        if (cur[idx]) {
          cur[idx].trigger = e.target.value;
          this.engine.updateNode(node.id, { interactions: cur }, 'Change Trigger');
        }
      });
    });

    document.querySelectorAll('.sel-target').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const idx = parseInt(sel.dataset.index, 10);
        const cur = JSON.parse(JSON.stringify(node.interactions || []));
        if (cur[idx]) {
          cur[idx].targetId = e.target.value;
          this.engine.updateNode(node.id, { interactions: cur }, 'Change Target Frame');
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
      btn.textContent = '✓ Copied!';
      setTimeout(() => { btn.textContent = '📋 Copy'; }, 1500);
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
            ⚡ Compile to React Vite Bundle (⌘⇧E)
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
            <span class="palette-result-icon">${item.icon}</span>
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
      alert(`⚡ Successfully auto-bound ${fixed} properties to Design Tokens!`);
      this.renderLinterResults();
      this.renderAll();
    });
  }

  initImportModal() {
    const modal = document.getElementById('modalImportDesign');
    const dropZone = document.getElementById('importDropZone');
    const fileInput = document.getElementById('externalDesignFileInput');
    const btnCommit = document.getElementById('btnCommitImport');
    let pendingImportResult = null;

    dropZone?.addEventListener('click', () => fileInput?.click());

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

    const handleFile = (file) => {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const raw = evt.target.result;
          const result = await this.importer.processImport(raw, { fileName: file.name });
          pendingImportResult = result;
          renderFidelityPreview(result);
        } catch (err) {
          alert(`Could not process ${file.name}: ${err.message}`);
        }
      };
      reader.readAsText(file);
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
        list.innerHTML = `
          <div style="font-weight: 600; color: #f8fafc; margin-bottom: 4px;">Preserved Features:</div>
          ${rep.preservedFeatures.map(f => `<div>✓ ${f}</div>`).join('')}
          ${rep.warnings.length > 0 ? `
            <div style="font-weight: 600; color: #fbbf24; margin-top: 8px; margin-bottom: 4px;">Diagnostics & Fallbacks:</div>
            ${rep.warnings.map(w => `<div style="color: #cbd5e1;">⚠️ ${w}</div>`).join('')}
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
        this.doc = pendingImportResult.document;
        this.engine = new CommandEngine(this.doc);
        this.renderer.engine = this.engine;
        this.inspectGen.doc = this.doc;
        this.prototype.doc = this.doc;

        this.updatePagesList();
        this.updateLayersTree();
        this.updateInspector();
        this.renderer.zoomToFit();
        this.renderer.render();

        modal.style.display = 'none';
        this.showToast(`Imported ${pendingImportResult.format.toUpperCase()} into workspace!`);
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
      list.innerHTML = `<div style="padding: 24px; text-align: center; color: #10b981; font-size: 13px;">✓ Zero design system drift! All colors and spacing are 100% compliant.</div>`;
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
          <span>✓ ${c.requirement}</span>
          <span style="color: #10b981; font-weight: 600;">Covered (${c.mappedNodeName})</span>
        </div>
      `).join('');
    }

    if (ambList && plan.ambiguities) {
      ambList.innerHTML = plan.ambiguities.map(a => `
        <div style="padding: 8px 12px; background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.25); border-radius: 6px; font-size: 11px;">
          <div style="font-weight: 600; color: #f59e0b;">⚠️ ${a.topic}</div>
          <div style="color: var(--text-muted); margin-top: 2px;">${a.assumption}</div>
        </div>
      `).join('');
    }

    modal.style.display = 'flex';
    btnClose?.addEventListener('click', () => { modal.style.display = 'none'; });
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
  }

  // --- Layers Tree Synchronizer ---
  updateLayersTree() {
    const list = document.getElementById('layersTreeList');
    if (!list) return;

    const page = this.engine.getActivePage();
    const selectedIds = this.engine.getSelection();

    let html = '';
    const renderLayerItem = (nodeId, depth = 0) => {
      const node = page.nodes[nodeId];
      if (!node) return;

      // Filter by search query if active
      if (this.layerSearchQuery && !node.name.toLowerCase().includes(this.layerSearchQuery)) {
        if (node.childIds) {
          for (const cid of node.childIds) renderLayerItem(cid, depth + 1);
        }
        return;
      }

      const isSelected = selectedIds.includes(nodeId);
      const icon = node.type === 'frame' ? '#' :
                   node.type === 'text' ? 'T' :
                   node.type === 'ellipse' ? '○' :
                   node.type === 'line' ? '─' :
                   node.type === 'group' ? '⬚' :
                   node.type === 'instance' ? '◇' : '□';

      const paddingLeft = 12 + depth * 14;

      html += `
        <div class="layer-item ${isSelected ? 'selected' : ''}" data-node-id="${node.id}" style="padding-left: ${paddingLeft}px;">
          <span class="layer-icon">${icon}</span>
          <span class="layer-name" title="${node.name}">${node.name}</span>
          <div class="layer-actions">
            <button class="layer-btn toggle-lock" title="Toggle Lock">${node.locked ? '🔒' : '🔓'}</button>
            <button class="layer-btn toggle-vis" title="Toggle Visibility">${node.visible ? '👁' : '🚫'}</button>
          </div>
        </div>
      `;

      if (node.childIds && node.childIds.length > 0) {
        for (const cid of node.childIds) {
          renderLayerItem(cid, depth + 1);
        }
      }
    };

    for (const rootId of page.rootIds) {
      renderLayerItem(rootId, 0);
    }

    list.innerHTML = html || '<div style="padding: 16px; color: var(--text-dim); font-size: 11px;">No matching layers found.</div>';

    // Click listeners on layers items
    list.querySelectorAll('.layer-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const id = item.dataset.nodeId;
        if (e.target.classList.contains('toggle-vis')) {
          this.engine.toggleVisibility(id);
          return;
        }
        if (e.target.classList.contains('toggle-lock')) {
          this.engine.toggleLock(id);
          return;
        }
        if (e.shiftKey) {
          this.engine.selectToggle(id);
        } else {
          this.engine.setSelection([id]);
        }
      });

      // Double click to rename
      item.addEventListener('dblclick', (e) => {
        const id = item.dataset.nodeId;
        const node = this.engine.getNode(id);
        if (node) {
          const newName = prompt('Rename layer:', node.name);
          if (newName && newName.trim()) {
            this.engine.updateNode(id, { name: newName.trim() }, 'Rename layer');
          }
        }
      });
    });
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

  toggleDevMode() {
    this.isDevMode = !this.isDevMode;
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
      // Fallback prompt
      const pattern = prompt(`Rename ${sel.length} layer(s). Use '$n' for sequential numbers (e.g. Card / $n):`, `Card / $n`);
      if (pattern) this.applyBulkRename(pattern);
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
        // Load imported document into CommandEngine
        this.doc = result.document;
        this.engine = new CommandEngine(this.doc);
        this.renderer.engine = this.engine;
        this.inspectGen.doc = this.doc;
        this.prototype.doc = this.doc;

        this.updatePagesList();
        this.updateLayersTree();
        this.updateInspector();
        this.renderer.zoomToFit();
        this.renderer.render();

        const score = result.fidelityReport?.overallScore || 95;
        const tier = result.fidelityReport?.fidelityTier || 'High Fidelity';
        this.showToast(`Imported ${result.format.toUpperCase()} successfully: ${score}% Fidelity (${tier})!`);
        return result;
      }
    } catch (err) {
      console.error('Import error:', err);
      alert(`Import failed: ${err.message}`);
      throw err;
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

  exportSelectedAsSvg() {
    const sel = this.engine.getSelection();
    const page = this.engine.getActivePage();
    const id = sel.length > 0 ? sel[0] : page.rootIds[0];
    const node = page.nodes[id];
    if (!node) return;

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${node.transform.width}" height="${node.transform.height}" viewBox="0 0 ${node.transform.width} ${node.transform.height}">
      <rect width="100%" height="100%" fill="${node.style?.fills?.[0]?.color || '#1e293b'}" rx="${node.style?.cornerRadius || 0}"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="Inter, sans-serif" font-size="16">${node.name}</text>
    </svg>`;

    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${node.name.toLowerCase().replace(/\s+/g, '-')}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }

  exportSelectedAsPng() {
    const dataUrl = this.canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${this.doc.name.toLowerCase().replace(/\s+/g, '-')}-canvas.png`;
    a.click();
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
            <div class="ai-chat-bubble user">📝 Specification: ${parsed.title}</div>
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
          <div style="font-weight: 700; color: #c084fc; margin-bottom: 4px;">✨ Proposed: ${this.pendingAiPlan.intent}</div>
          <div style="font-size: 11px; color: var(--text-muted); line-height: 1.4; margin-bottom: 8px;">${this.pendingAiPlan.explanation}</div>
          <div style="font-size: 10px; color: var(--text-dim); display: flex; justify-content: space-between; align-items: center;">
            <span>${ops.length} atomic operation(s)</span>
            <span>Fully Undoable (⌘Z)</span>
          </div>
          ${this.pendingAiPlan.specCoverage ? `
            <div style="margin-top: 8px;">
              <button class="menu-dropdown-btn-sm" id="btnViewSpecReportInDiff" style="color: #38bdf8; font-size: 10px;">📋 View Spec Coverage & Ambiguity Report</button>
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
        <div style="color: #10b981; font-weight: 700;">🎉 All Design Checks Passed!</div>
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
          <div style="font-size: 10px; color: var(--text-muted); margin-top: 2px;">💡 ${f.suggestion}</div>
        </div>
      `;
    });

    diffBox.innerHTML = `
      <div style="font-weight: 700; color: #38bdf8; margin-bottom: 6px;">🔍 Design Audit (${report.findings.length} findings)</div>
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
          btn.textContent = '✓ Fixed';
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
    if (copyBtn && !copyBtn._hasListener) {
      copyBtn._hasListener = true;
      copyBtn.addEventListener('click', () => {
        if (activeFileName && fileTree[activeFileName]) {
          navigator.clipboard.writeText(fileTree[activeFileName]);
          const orig = copyBtn.textContent;
          copyBtn.textContent = '✓ Copied!';
          setTimeout(() => { copyBtn.textContent = orig; }, 1800);
        }
      });
    }

    const downloadBtn = document.getElementById('btnDownloadProjectPackage');
    if (downloadBtn && !downloadBtn._hasListener) {
      downloadBtn._hasListener = true;
      downloadBtn.addEventListener('click', () => {
        const zipBlob = new Blob([JSON.stringify(fileTree, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.doc.name.toLowerCase().replace(/\s+/g, '-')}-react-export.json`;
        a.click();
        URL.revokeObjectURL(url);
      });
    }

    // Live React Preview Tab
    const previewTab = document.createElement('div');
    previewTab.className = 'code-file-item active';
    previewTab.style.color = '#38bdf8';
    previewTab.style.fontWeight = 'bold';
    previewTab.textContent = '⚡ LIVE REACT PREVIEW';
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
      diagTab.textContent = '🔍 DIAGNOSTICS & AUDIT';
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

    const iframe = document.getElementById('protoPreviewIframe');
    if (iframe) {
      iframe.srcdoc = this.prototype.generatePrototypeHtml();
    }

    document.querySelectorAll('.btn-device-switch').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.btn-device-switch').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const device = btn.dataset.device;
        this.prototype.setDevice(device);
        const bezel = document.getElementById('deviceBezel');
        if (bezel) {
          if (device === 'mobile') {
            bezel.style.width = '375px';
            bezel.style.height = '780px';
            bezel.className = 'device-bezel mobile';
          } else if (device === 'tablet') {
            bezel.style.width = '768px';
            bezel.style.height = '840px';
            bezel.className = 'device-bezel tablet';
          } else {
            bezel.style.width = '100%';
            bezel.style.height = '100%';
            bezel.className = 'device-bezel desktop';
          }
        }
      });
    });
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
    return String(str).replace(/"/g, '&quot;');
  }

  booleanSelected(op) {
    const sel = this.engine.getSelection();
    if (sel.length < 2) {
      alert('Select 2 or more shape layers to perform a boolean operation.');
      return;
    }
    this.engine.booleanGroup(sel, op);
    this.renderer.render();
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

  toggleTheme() {
    const current = this.doc.themeMode || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    this.engine.setThemeMode(next);
    const btn = document.getElementById('btnToggleTheme');
    if (btn) btn.textContent = next === 'light' ? '☀️' : '🌙';
    this.renderer.render();
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
          btn.textContent = '✓ Copied!';
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
            <div style="font-size: 24px;">▶️</div>
            <div style="flex: 1;">
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <h4 style="margin: 0 0 4px 0; font-size: 13px; color: #f8fafc;">${t.title}</h4>
                <span style="font-size: 11px; color: #38bdf8; background: rgba(56,189,248,0.12); padding: 2px 6px; border-radius: 4px;">${t.duration}</span>
              </div>
              <div style="font-size: 11px; color: #94a3b8; margin-bottom: 6px;">By ${t.creator} • Topic: <strong>${t.feature}</strong></div>
              <p style="font-size: 11px; line-height: 1.4; color: #cbd5e1; margin: 0 0 10px 0;">${t.topics}</p>
              <div style="display: flex; align-items: center; gap: 12px;">
                <a href="${t.url}" target="_blank" rel="noopener" style="font-size: 11px; color: #a855f7; text-decoration: none; font-weight: 600;">Watch on YouTube ↗</a>
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
          <a href="${d.url}" target="_blank" rel="noopener" style="font-size: 11px; color: #38bdf8; text-decoration: none;">Read Docs ↗</a>
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
      document.getElementById('btnTourNext').textContent = this.tourCurrentStep === ONBOARDING_TOUR_STEPS.length - 1 ? 'Finish 🏁' : 'Next →';
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

      console.log('⚡ DesignForge MCP Ecosystem online: 4 servers connected.');
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

