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
import { computeWorldBounds, findSnapGuides, computeWorldTransform, isDescendant, canContain, resolveParentForPointer } from './engine/layout.js';
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
import {
  VariablesEngine,
  VariableScope,
  MathExpressionEvaluator,
  ScrubbyInputController,
  reduceMixedProperty,
  ExportHandoffEngine,
  CentralInputRouter,
  PrototypeDiagnosticsEngine,
  ColorPickerPopover,
  queryDevicePresets,
  DEVICE_PRESET_CATALOG,
  CustomFrameEngine,
  EDITING_STATES,
  HANDLE_MODES,
  ENTRY_SELECTION_POLICIES,
  routeDoubleClick,
  extractNodeAnchors,
  anchorsToVectorPath,
  applyEntrySelectionPolicy,
  deleteSelectedAnchors,
  nudgeAnchors,
  convertAnchorHandleMode,
  updateBezierHandle,
  getRectangleCornerHandles,
  calculateCornerRadiusFromDrag,
  applySketchDataSupplier,
  insertSketchUserProfileCard,
  initializeSketchData
} from './editor-core/index.js';

export class DesignForgeApp {
  constructor() {
    this.storage = new StorageEngine();
    const savedDoc = this.storage.loadAutosave();
    this.doc = savedDoc || createInitialDocument('ForgePay AI — Treasury Platform');

    this.engine = new CommandEngine(this.doc);
    this.variablesEngine = new VariablesEngine();
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
    initializeSketchData();

    // Active tool state
    this.currentTool = 'select'; // 'select' | 'hand' | 'frame' | 'rectangle' | 'ellipse' | 'line' | 'text' | 'comment'
    this.isHandMode = false;

    // Revision v2 Interaction State Machine & Vector Direct Editing (§11.6, §11.7)
    this.editingState = EDITING_STATES.OBJECT_SELECT;
    this.vectorEditEntrySelectionPolicy = ENTRY_SELECTION_POLICIES.UNDER_POINTER;
    this.activeVectorEdit = null;

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
    this.protoDiagnostics = new PrototypeDiagnosticsEngine(this.doc);
    this.protoInspectorMode = 'quick'; // 'quick' | 'advanced'
    this.inputRouter = new CentralInputRouter(this);
    this.colorPicker = new ColorPickerPopover();
    this.customFrameEngine = new CustomFrameEngine();
    this.devicePresetCategory = 'All';
    this.devicePresetQuery = '';
    this.customFrameW = 1440;
    this.customFrameH = 900;
    this.collapsedNodeIds = new Set();

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', (e) => this.inputRouter.handleKeyDown(e));
      window.addEventListener('keyup', (e) => this.inputRouter.handleKeyUp(e));
    }

    this.initUI();
    this.initMenus();
    this.initRightSidebar();
    this.initCommandPalette();
    this.initLinterModal();
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
    // Project title inline rename on double-click
    const titleWrapper = document.getElementById('projectTitleWrapper');
    const titleDisplay = document.getElementById('projectTitleDisplay');
    const titleInput = document.getElementById('projectTitleInput');
    if (titleWrapper && titleDisplay && titleInput) {
      titleDisplay.textContent = this.doc.name;
      titleInput.value = this.doc.name;

      const startEditing = () => {
        titleDisplay.style.display = 'none';
        titleInput.style.display = 'inline-block';
        titleInput.focus();
        titleInput.select();
      };

      const commitEditing = () => {
        const newName = titleInput.value.trim() || 'Untitled Project';
        this.doc.name = newName;
        titleDisplay.textContent = newName;
        titleDisplay.style.display = 'inline-block';
        titleInput.style.display = 'none';
        this.storage.scheduleAutosave(this.doc);
        document.title = `${newName} — DesignForge`;
      };

      titleWrapper.addEventListener('dblclick', startEditing);
      titleInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') commitEditing();
        if (e.key === 'Escape') {
          titleInput.value = this.doc.name;
          titleDisplay.style.display = 'inline-block';
          titleInput.style.display = 'none';
        }
      });
      titleInput.addEventListener('blur', commitEditing);
    }

    // Top Bar Mode Switcher: Design | Prototype | Code
    const modeTabs = document.querySelectorAll('.mode-tab');
    modeTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const mode = tab.dataset.mode;
        if (mode === 'prototype') {
          this.setSidebarMode?.('prototype');
        } else if (mode === 'code') {
          this.setSidebarMode?.('inspect');
        } else {
          this.setSidebarMode?.('design');
        }
      });
    });

    // Left Sidebar: Collapsible Pages Accordion
    const pagesToggle = document.getElementById('pagesSectionToggle');
    const pagesChevron = document.getElementById('pagesChevron');
    const pagesContainer = document.getElementById('pagesListContainer');
    if (pagesToggle && pagesChevron && pagesContainer) {
      pagesToggle.addEventListener('click', (e) => {
        if (e.target.closest('#btnAddNewPage')) return;
        pagesChevron.classList.toggle('collapsed');
        pagesContainer.classList.toggle('collapsed');
      });
    }

    // Left Sidebar Tabs Switcher: Layers | Assets
    const sidebarTabs = document.querySelectorAll('.sidebar-tab-btn');
    sidebarTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        sidebarTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const target = tab.dataset.tab;
        const layersEl = document.getElementById('tabLayers');
        const assetsEl = document.getElementById('tabAssets');
        if (layersEl) layersEl.style.display = target === 'layers' ? 'block' : 'none';
        if (assetsEl) assetsEl.style.display = target === 'assets' ? 'block' : 'none';
        if (target === 'assets') this.renderTokensList();
      });
    });

    // Tool shelf buttons
    const toolBtns = document.querySelectorAll('.tool-btn');
    toolBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tool = btn.dataset.tool;
        if (tool === 'ai') {
          this.switchToAiTab();
        } else if (tool === 'resources') {
          // Switch to Assets tab
          document.querySelector('.sidebar-tab-btn[data-tab="assets"]')?.click();
        } else if (tool) {
          this.setTool(tool);
        }
      });
    });

    // Toolbar Flyout Triggers & Sub-tools
    document.querySelectorAll('.tool-flyout-trigger').forEach(trigger => {
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const targetId = trigger.dataset.target;
        const menu = document.getElementById(targetId);
        const isOpen = menu?.classList.contains('open');
        document.querySelectorAll('.tool-flyout-menu').forEach(m => m.classList.remove('open'));
        if (!isOpen && menu) menu.classList.add('open');
      });
    });

    document.querySelectorAll('.tool-flyout-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const tool = item.dataset.tool;
        const menu = item.closest('.tool-flyout-menu');
        const groupWrapper = item.closest('.tool-group-wrapper');
        if (tool) {
          this.setTool(tool);
          // Update group face button
          const faceBtn = groupWrapper?.querySelector('.tool-btn');
          if (faceBtn) {
            faceBtn.dataset.tool = tool;
            const name = item.querySelector('span')?.textContent || tool;
            const shortcut = item.querySelector('.shortcut')?.textContent || '';
            faceBtn.title = `${name} (${shortcut})`;
          }
        }
        menu?.classList.remove('open');
      });
    });

    // Close flyouts on outside click
    document.addEventListener('click', () => {
      document.querySelectorAll('.tool-flyout-menu').forEach(m => m.classList.remove('open'));
      document.getElementById('statusZoomMenu')?.classList.remove('open');
    });

    // Vector Edit Done Button listener
    document.getElementById('btnExitVectorEdit')?.addEventListener('click', () => {
      this.exitVectorEdit(true);
    });

    // Live cursor coordinate readout on canvas mousemove
    this.canvas?.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const canvasPt = this.renderer.screenToCanvas(screenX, screenY);
      const coordEl = document.getElementById('statusCoords');
      if (coordEl) {
        coordEl.textContent = `X: ${Math.round(canvasPt.x)}px  Y: ${Math.round(canvasPt.y)}px`;
      }
    });

    // Status bar controls
    document.getElementById('btnStatusRulers')?.addEventListener('click', (e) => {
      this.showRulers = !this.showRulers;
      this.toggleRulers(this.showRulers);
      e.currentTarget.classList.toggle('active', this.showRulers);
    });

    document.getElementById('btnStatusGrid')?.addEventListener('click', (e) => {
      this.showGrid = !this.showGrid;
      this.renderer.showGrid = this.showGrid;
      this.renderer.render();
      e.currentTarget.classList.toggle('active', this.showGrid);
    });

    document.getElementById('btnStatusSnap')?.addEventListener('click', (e) => {
      const btn = e.currentTarget;
      btn.classList.toggle('active');
      this.renderer.smartSnappingEnabled = btn.classList.contains('active');
    });

    document.getElementById('statusLinterBadge')?.addEventListener('click', () => this.openLinterModal());
    document.getElementById('statusMcpChip')?.addEventListener('click', () => this.openMcpHub());
    document.getElementById('btnStatusTheme')?.addEventListener('click', () => this.toggleTheme());

    document.getElementById('statusZoomValue')?.addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('statusZoomMenu')?.classList.toggle('open');
    });

    document.querySelectorAll('#statusZoomMenu .tool-flyout-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const z = item.dataset.zoom;
        if (z === 'fit') this.zoomToFit();
        else if (z === 'selection') this.zoomToSelection();
        else if (z === '100') this.zoom100();
        else if (z === '50') this.renderer.zoom = 0.5;
        else if (z === '200') this.renderer.zoom = 2.0;
        this.renderer.render();
        this.updateZoomDisplay();
        document.getElementById('statusZoomMenu')?.classList.remove('open');
      });
    });

    // Preferences Menu Handlers
    document.getElementById('menuPrefTheme')?.addEventListener('click', () => this.toggleTheme());
    document.getElementById('menuPrefSnap')?.addEventListener('click', () => {
      this.renderer.smartSnappingEnabled = !this.renderer.smartSnappingEnabled;
      document.getElementById('btnStatusSnap')?.classList.toggle('active', this.renderer.smartSnappingEnabled);
    });
    document.getElementById('menuPrefRulers')?.addEventListener('click', () => {
      this.showRulers = !this.showRulers;
      this.toggleRulers(this.showRulers);
      document.getElementById('btnStatusRulers')?.classList.toggle('active', this.showRulers);
    });
    document.getElementById('menuPrefGrid')?.addEventListener('click', () => {
      this.showGrid = !this.showGrid;
      this.renderer.showGrid = this.showGrid;
      this.renderer.render();
      document.getElementById('btnStatusGrid')?.classList.toggle('active', this.showGrid);
    });

    // Layer search filter input
    const layerSearch = document.getElementById('layerSearchInput');
    if (layerSearch) {
      layerSearch.addEventListener('input', (e) => {
        this.layerSearchQuery = e.target.value.toLowerCase().trim();
        this.updateLayersTree();
      });
    }

    // Top Action Buttons
    document.getElementById('btnShareModal')?.addEventListener('click', () => this.openShareModal());
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
    document.getElementById('menuSaveProject')?.addEventListener('click', () => this.saveProject());
    document.getElementById('menuExportReact')?.addEventListener('click', () => this.openExportModal());
    document.getElementById('menuExportSvg')?.addEventListener('click', () => this.exportSelectedAsSvg());
    document.getElementById('menuExportPng')?.addEventListener('click', () => this.exportSelectedAsPng());

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
    document.getElementById('menuSketchGuides')?.addEventListener('click', () => {
      this.openSketchDocsTab();
    });

    // Data Menu Actions (Official Sketch Builtin Resources)
    document.getElementById('menuDataFaces')?.addEventListener('click', () => {
      applySketchDataSupplier(this.engine, 'faces');
      this.renderer.render();
      this.updateInspector();
    });
    document.getElementById('menuDataNames')?.addEventListener('click', () => {
      applySketchDataSupplier(this.engine, 'names');
      this.renderer.render();
      this.updateInspector();
    });
    document.getElementById('menuDataCities')?.addEventListener('click', () => {
      applySketchDataSupplier(this.engine, 'cities');
      this.renderer.render();
      this.updateInspector();
    });
    document.getElementById('menuDataTiles')?.addEventListener('click', () => {
      applySketchDataSupplier(this.engine, 'tiles');
      this.renderer.render();
      this.updateInspector();
    });
    document.getElementById('menuDataProfileCard')?.addEventListener('click', () => {
      const vp = this.renderer?.viewport || { panX: 0, panY: 0, zoom: 1 };
      const centerX = (-vp.panX + 500) / (vp.zoom || 1);
      const centerY = (-vp.panY + 300) / (vp.zoom || 1);
      insertSketchUserProfileCard(this.engine, centerX, centerY);
      this.renderer.render();
      this.updateInspector();
      this.updateLayersTree();
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

    this.setSidebarMode = (mode) => {
      this.rightTabMode = mode;
      const allTabs = document.querySelectorAll('.right-tab-btn');
      allTabs.forEach(t => t.classList.toggle('active', t.dataset.mode === mode || (mode === 'design' && t.dataset.mode === 'properties')));

      const topModeTabs = document.querySelectorAll('.mode-tab');
      topModeTabs.forEach(t => {
        const tm = t.dataset.mode;
        const matches = (mode === 'design' && tm === 'design') ||
                        (mode === 'prototype' && tm === 'prototype') ||
                        ((mode === 'inspect' || mode === 'code') && tm === 'code');
        t.classList.toggle('active', Boolean(matches));
      });

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

    btnDesign?.addEventListener('click', () => this.setSidebarMode('design'));
    btnProto?.addEventListener('click', () => this.setSidebarMode('prototype'));
    btnInspect?.addEventListener('click', () => this.setSidebarMode('inspect'));
    btnExport?.addEventListener('click', () => this.setSidebarMode('export'));
    btnAi?.addEventListener('click', () => this.setSidebarMode('ai'));

    // Prototype Quick vs Advanced Mode Toggle (Section 28.2 & 30)
    const btnQuick = document.getElementById('btnProtoQuickMode');
    const btnAdv = document.getElementById('btnProtoAdvMode');
    btnQuick?.addEventListener('click', () => {
      this.protoInspectorMode = 'quick';
      btnQuick.classList.add('active');
      btnAdv?.classList.remove('active');
      btnQuick.style.background = 'var(--accent-blue)';
      btnQuick.style.color = '#fff';
      if (btnAdv) {
        btnAdv.style.background = 'transparent';
        btnAdv.style.color = 'var(--text-dim)';
      }
      this.updatePrototypePanel();
    });
    btnAdv?.addEventListener('click', () => {
      this.protoInspectorMode = 'advanced';
      btnAdv.classList.add('active');
      btnQuick?.classList.remove('active');
      btnAdv.style.background = 'var(--accent-blue)';
      btnAdv.style.color = '#fff';
      if (btnQuick) {
        btnQuick.style.background = 'transparent';
        btnQuick.style.color = 'var(--text-dim)';
      }
      this.updatePrototypePanel();
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
    if (providerSelect) {
      providerSelect.value = this.ai.service.activeProviderName;
      if (keyFields) keyFields.style.display = providerSelect.value === 'local' ? 'none' : 'flex';
      providerSelect.addEventListener('change', (e) => {
        const p = e.target.value;
        this.ai.setProvider(p);
        document.getElementById('aiModelStatusLabel').textContent =
          p === 'local' ? '⚡ Local Synth Engine (Offline)' :
          p === 'openai' ? 'OpenAI GPT-4o' : 'Google Gemini 1.5/2.0';
        if (keyFields) keyFields.style.display = p === 'local' ? 'none' : 'flex';
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
      this.updateZoomDisplay();
    });
  }

  updateZoomDisplay() {
    if (!this.renderer) return;
    const pct = Math.round(this.renderer.zoom * 100);
    const statusZoom = document.getElementById('statusZoomValue');
    if (statusZoom) statusZoom.textContent = `${pct}% ▾`;
    const zoomText = document.getElementById('zoomPercentText');
    if (zoomText) zoomText.textContent = `${pct}%`;
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
        this.updateZoomDisplay();
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

      // 1.4 Freehand Pencil Tool
      if (this.currentTool === 'pencil') {
        this.pencilStroke = [{ x: canvasCoords.x, y: canvasCoords.y }];
        renderer.pencilPreview = this.pencilStroke;
        renderer.render();
        return;
      }

      // 1.5 Vector Pen Tool
      if (this.currentTool === 'pen') {
        if (!this.penAnchors) this.penAnchors = [];
        if (this.penAnchors.length >= 2) {
          const first = this.penAnchors[0];
          const distToFirst = Math.hypot(canvasCoords.x - first.x, canvasCoords.y - first.y);
          if (distToFirst < 14) {
            this.finishPenPath(true);
            return;
          }
        }
        this.penAnchors.push({ x: canvasCoords.x, y: canvasCoords.y });
        renderer.penPreview = { points: this.penAnchors, current: canvasCoords };
        renderer.render();
        this.updateInspector();
        return;
      }

      // 2. Shape Creation Tools (Drag-to-create or click-to-insert)
      if (this.currentTool !== 'select' && this.currentTool !== 'hand') {
        this.dragState = {
          type: 'create-shape',
          tool: this.currentTool,
          startX: canvasCoords.x,
          startY: canvasCoords.y,
          currentX: canvasCoords.x,
          currentY: canvasCoords.y
        };
        renderer.creationPreview = {
          tool: this.currentTool,
          startX: canvasCoords.x,
          startY: canvasCoords.y,
          currentX: canvasCoords.x,
          currentY: canvasCoords.y
        };
        renderer.render();
        return;
      }

      // 2.5. Prototype Connection Handle Hit-test
      if (this.rightTabMode === 'prototype' || renderer.showPrototypeLinks) {
        const selIds = engine.getSelection();
        if (selIds.length === 1) {
          const selBounds = computeWorldBounds(engine.getActivePage(), selIds[0]);
          if (renderer.hitTestConnectionHandle(canvasCoords.x, canvasCoords.y, selBounds)) {
            const handleX = selBounds.x + selBounds.width;
            const handleY = selBounds.y + selBounds.height / 2;
            this.dragState = {
              type: 'connect',
              sourceId: selIds[0],
              startX: handleX,
              startY: handleY
            };
            renderer.connectionDrag = {
              sourceId: selIds[0],
              startX: handleX,
              startY: handleY,
              currentX: canvasCoords.x,
              currentY: canvasCoords.y
            };
            renderer.render();
            return;
          }
        }
      }

      // 2.7. Vector Edit Mode Interaction Priority (§11.6, §11.8, §11.9)
      if (this.editingState === EDITING_STATES.VECTOR_EDIT && this.activeVectorEdit) {
        const { bounds, anchors, selectedIndices } = this.activeVectorEdit;

        // 1. Hit-test Bézier handles of selected anchors
        const hitHandle = renderer.hitTestVectorHandle(canvasCoords.x, canvasCoords.y, bounds, anchors, selectedIndices);
        if (hitHandle) {
          this.dragState = {
            type: 'drag-bezier-handle',
            anchorIndex: hitHandle.anchorIndex,
            which: hitHandle.which,
            startX: canvasCoords.x,
            startY: canvasCoords.y
          };
          return;
        }

        // 2. Hit-test Vector Anchors
        const hitAnchorIdx = renderer.hitTestVectorAnchor(canvasCoords.x, canvasCoords.y, bounds, anchors);
        if (hitAnchorIdx !== -1) {
          if (e.shiftKey) {
            if (selectedIndices.has(hitAnchorIdx)) {
              selectedIndices.delete(hitAnchorIdx);
              anchors[hitAnchorIdx].selected = false;
            } else {
              selectedIndices.add(hitAnchorIdx);
              anchors[hitAnchorIdx].selected = true;
            }
          } else if (!selectedIndices.has(hitAnchorIdx)) {
            selectedIndices.clear();
            anchors.forEach(a => a.selected = false);
            selectedIndices.add(hitAnchorIdx);
            anchors[hitAnchorIdx].selected = true;
          }

          this.dragState = {
            type: 'move-anchors',
            startX: canvasCoords.x,
            startY: canvasCoords.y,
            lastX: canvasCoords.x,
            lastY: canvasCoords.y,
            initialAnchorPositions: Array.from(selectedIndices).map(idx => ({
              idx,
              x: anchors[idx].x,
              y: anchors[idx].y
            }))
          };
          renderer.render();
          return;
        }

        // 2.5. Hit-test Vector Segments to add anchor points (Figma click-to-add vector behavior)
        const node = engine.getNode(this.activeVectorEdit.nodeId);
        const closed = node?.type !== 'line' && node?.type !== 'arrow';
        const hitSegment = renderer.hitTestVectorSegment(canvasCoords.x, canvasCoords.y, bounds, anchors, closed);
        if (hitSegment) {
          const newAnchor = {
            x: Math.round(hitSegment.x),
            y: Math.round(hitSegment.y),
            handleIn: { x: 0, y: 0 },
            handleOut: { x: 0, y: 0 },
            type: HANDLE_MODES.CORNER,
            selected: true
          };
          anchors.splice(hitSegment.insertIndex, 0, newAnchor);
          selectedIndices.clear();
          anchors.forEach(a => a.selected = false);
          newAnchor.selected = true;
          selectedIndices.add(hitSegment.insertIndex);

          this.dragState = {
            type: 'move-anchors',
            startX: canvasCoords.x,
            startY: canvasCoords.y,
            lastX: canvasCoords.x,
            lastY: canvasCoords.y,
            initialAnchorPositions: [{ idx: hitSegment.insertIndex, x: newAnchor.x, y: newAnchor.y }]
          };
          renderer.render();
          return;
        }

        // 3. Clicked empty canvas inside vector edit -> Anchor Marquee Selection
        if (!e.shiftKey) {
          selectedIndices.clear();
          anchors.forEach(a => a.selected = false);
        }
        this.dragState = { type: 'anchor-marquee', startX: canvasCoords.x, startY: canvasCoords.y };
        renderer.marquee = { startX: canvasCoords.x, startY: canvasCoords.y, currentX: canvasCoords.x, currentY: canvasCoords.y };
        renderer.render();
        return;
      }

      // 2.8. Corner Radius Handle Hit-test for Rectangles (§11.11)
      const curSelIds = engine.getSelection();
      const pageRef = engine.getActivePage();
      if (curSelIds.length === 1) {
        const n = engine.getNode(curSelIds[0]);
        if (n && n.type === 'rectangle' && !n.locked) {
          const b = computeWorldBounds(pageRef, curSelIds[0]);
          const cornerRadius = n.style?.cornerRadius || 0;
          const cornerRadii = n.style?.cornerRadii || null;
          const hitCorner = renderer.hitTestCornerRadiusHandle(canvasCoords.x, canvasCoords.y, b, cornerRadius, cornerRadii);
          if (hitCorner) {
            this.dragState = {
              type: 'drag-corner-radius',
              nodeId: curSelIds[0],
              cornerKey: hitCorner,
              bounds: { ...b },
              startRadius: cornerRadius,
              altKey: e.altKey
            };
            return;
          }
        }
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

      if (this.pencilStroke) {
        this.pencilStroke.push({ x: canvasCoords.x, y: canvasCoords.y });
        renderer.pencilPreview = this.pencilStroke;
        renderer.render();
        return;
      }

      if (this.currentTool === 'pen' && this.penAnchors && this.penAnchors.length > 0) {
        renderer.penPreview = { points: this.penAnchors, current: canvasCoords };
        renderer.render();
      }

      if (this.dragState.type === 'create-shape') {
        this.dragState.currentX = canvasCoords.x;
        this.dragState.currentY = canvasCoords.y;
        if (renderer.creationPreview) {
          renderer.creationPreview.currentX = canvasCoords.x;
          renderer.creationPreview.currentY = canvasCoords.y;
        }
        renderer.render();
        return;
      }

      if (this.dragState.type === 'connect') {
        renderer.connectionDrag.currentX = canvasCoords.x;
        renderer.connectionDrag.currentY = canvasCoords.y;
        renderer.render();
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
      } else if (this.dragState.type === 'move-anchors') {
        const dx = canvasCoords.x - this.dragState.lastX;
        const dy = canvasCoords.y - this.dragState.lastY;
        if (this.activeVectorEdit && this.activeVectorEdit.anchors) {
          const { anchors, selectedIndices } = this.activeVectorEdit;
          for (const idx of selectedIndices) {
            if (anchors[idx]) {
              anchors[idx].x += dx;
              anchors[idx].y += dy;
            }
          }
        }
        this.dragState.lastX = canvasCoords.x;
        this.dragState.lastY = canvasCoords.y;
        renderer.render();
      } else if (this.dragState.type === 'drag-bezier-handle') {
        if (this.activeVectorEdit && this.activeVectorEdit.anchors) {
          const { anchors, bounds } = this.activeVectorEdit;
          const anchor = anchors[this.dragState.anchorIndex];
          if (anchor) {
            const hx = canvasCoords.x - (bounds.x + anchor.x);
            const hy = canvasCoords.y - (bounds.y + anchor.y);
            updateBezierHandle(anchor, this.dragState.which, hx, hy, anchor.type || HANDLE_MODES.SMOOTH);
            renderer.render();
          }
        }
      } else if (this.dragState.type === 'anchor-marquee') {
        renderer.marquee.currentX = canvasCoords.x;
        renderer.marquee.currentY = canvasCoords.y;
        if (this.activeVectorEdit && this.activeVectorEdit.anchors) {
          const { anchors, selectedIndices, bounds } = this.activeVectorEdit;
          const minX = Math.min(renderer.marquee.startX, renderer.marquee.currentX);
          const maxX = Math.max(renderer.marquee.startX, renderer.marquee.currentX);
          const minY = Math.min(renderer.marquee.startY, renderer.marquee.currentY);
          const maxY = Math.max(renderer.marquee.startY, renderer.marquee.currentY);

          selectedIndices.clear();
          anchors.forEach((a, idx) => {
            const ax = bounds.x + a.x;
            const ay = bounds.y + a.y;
            if (ax >= minX && ax <= maxX && ay >= minY && ay <= maxY) {
              a.selected = true;
              selectedIndices.add(idx);
            } else {
              a.selected = false;
            }
          });
        }
        renderer.render();
      } else if (this.dragState.type === 'drag-corner-radius') {
        const { nodeId, cornerKey, bounds } = this.dragState;
        const newRadius = calculateCornerRadiusFromDrag(cornerKey, canvasCoords, bounds);
        const node = engine.getNode(nodeId);
        if (node && node.style) {
          node.style.cornerRadius = newRadius;
          renderer.render();
          this.updateInspector();
        }
      }
    });

    window.addEventListener('mouseup', () => {
      if (this.pencilStroke) {
        const points = this.pencilStroke;
        this.pencilStroke = null;
        renderer.pencilPreview = null;
        if (points.length >= 2) {
          this.finishPencilStroke(points);
        } else {
          renderer.render();
        }
        return;
      }

      if (!this.dragState) return;

      if (this.dragState.type === 'create-shape') {
        const { tool, startX, startY, currentX, currentY } = this.dragState;
        renderer.creationPreview = null;
        this.createShapeFromDrag(tool, startX, startY, currentX, currentY);
        this.setTool('select');
        this.dragState = null;
        canvas.style.cursor = this.isHandMode ? 'grab' : 'default';
        renderer.render();
        this.updateInspector();
        this.updateLayersTree();
        return;
      }

      if (this.dragState.type === 'connect') {
        const canvasCoords = renderer.screenToCanvas(window.event?.clientX || 0, window.event?.clientY || 0);
        const hitTargetId = renderer.hitTest(canvasCoords.x, canvasCoords.y);
        const sourceNode = engine.getNode(this.dragState.sourceId);
        renderer.connectionDrag = null;
        renderer.render();

        if (sourceNode && hitTargetId && hitTargetId !== sourceNode.id) {
          const page = engine.getActivePage();
          const hitNode = page.nodes[hitTargetId];
          let targetFrameId = hitTargetId;
          let curr = hitNode;
          while (curr && curr.parentId) {
            curr = page.nodes[curr.parentId];
            if (curr && curr.type === 'frame') targetFrameId = curr.id;
          }
          if (hitNode?.type === 'frame') targetFrameId = hitNode.id;

          const curInteractions = JSON.parse(JSON.stringify(sourceNode.interactions || []));
          curInteractions.push({
            trigger: 'click',
            action: 'navigate',
            targetId: targetFrameId,
            animation: 'smart-animate',
            duration: 300
          });
          engine.updateNode(sourceNode.id, { interactions: curInteractions }, 'Connect Interactive Link');
          this.setSidebarMode('prototype');
          this.updatePrototypePanel();
        }
      } else if (this.dragState.type === 'move') {
        renderer.snapGuides = [];
        if (this.dragState.initialPositions) {
          const moves = this.dragState.initialPositions.map(pos => {
            const cur = engine.getNode(pos.id);
            return {
              id: pos.id,
              startX: pos.x,
              startY: pos.y,
              endX: cur?.transform?.x ?? pos.x,
              endY: cur?.transform?.y ?? pos.y
            };
          });
          this.engine.commitMove(moves, 'Move objects');

          // Figma-parity auto-reparenting when dragging across container boundaries on canvas
          // Suppressed if holding Cmd/Ctrl key
          const isCmdOrCtrl = window.event?.ctrlKey || window.event?.metaKey;
          if (!isCmdOrCtrl) {
            const page = engine.getActivePage();
            for (const pos of this.dragState.initialPositions) {
              const cur = engine.getNode(pos.id);
              if (!cur || cur.type === 'section') continue;
              const b = computeWorldBounds(page, cur.id);
              if (b) {
                const targetParentId = resolveParentForPointer(b.x + b.width / 2, b.y + b.height / 2, cur.type, page, [cur.id]);
                if (targetParentId !== (cur.parentId || null)) {
                  this.engine.reparent(cur.id, targetParentId);
                }
              }
            }
          }
        }
      } else if (this.dragState.type === 'resize') {
        const cur = engine.getNode(this.dragState.nodeId);
        if (cur && this.dragState.startTransform) {
          this.engine.commitResize(this.dragState.nodeId, this.dragState.startTransform, { ...cur.transform }, 'Resize object');
        }
      } else if (this.dragState.type === 'marquee') {
        const mq = renderer.marquee;
        renderer.marquee = null;
        if (mq) {
          const minX = Math.min(mq.startX, mq.currentX);
          const maxX = Math.max(mq.startX, mq.currentX);
          const minY = Math.min(mq.startY, mq.currentY);
          const maxY = Math.max(mq.startY, mq.currentY);
          if (Math.abs(maxX - minX) > 4 || Math.abs(maxY - minY) > 4) {
            const page = engine.getActivePage();
            const matchedIds = [];
            if (page && page.rootIds) {
              for (const rootId of page.rootIds) {
                const b = computeWorldBounds(page, rootId);
                if (b && b.x + b.width >= minX && b.x <= maxX && b.y + b.height >= minY && b.y <= maxY) {
                  matchedIds.push(rootId);
                }
              }
            }
            if (matchedIds.length > 0) {
              engine.setSelection(matchedIds);
              this.updateInspector();
              this.updateLayersTree();
            }
          }
        }
        renderer.render();
      } else if (this.dragState.type === 'drag-corner-radius') {
        const { nodeId, startRadius } = this.dragState;
        const node = engine.getNode(nodeId);
        if (node && node.style && node.style.cornerRadius !== startRadius) {
          engine.updateNode(nodeId, { style: { cornerRadius: node.style.cornerRadius } }, 'Adjust Corner Radius');
        }
        this.dragState = null;
        renderer.render();
      } else if (this.dragState.type === 'move-anchors' || this.dragState.type === 'drag-bezier-handle') {
        this.dragState = null;
        renderer.render();
        this.updateInspector();
      } else if (this.dragState.type === 'anchor-marquee') {
        renderer.marquee = null;
        this.dragState = null;
        renderer.render();
        this.updateInspector();
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

    // Section 11.6 & 11.7: Double Click Routing State Machine
    canvas.addEventListener('dblclick', (e) => {
      if (this.currentTool === 'pen' && this.penAnchors && this.penAnchors.length >= 2) {
        this.finishPenPath(false);
        return;
      }
      const coords = renderer.screenToCanvas(e.clientX, e.clientY);

      // If already in Vector Edit Mode, double-clicking an anchor point toggles between CORNER and SMOOTH (§11.9)
      if (this.editingState === EDITING_STATES.VECTOR_EDIT && this.activeVectorEdit) {
        const { bounds, anchors } = this.activeVectorEdit;
        const hitAnchorIdx = renderer.hitTestVectorAnchor(coords.x, coords.y, bounds, anchors);
        if (hitAnchorIdx !== -1) {
          const a = anchors[hitAnchorIdx];
          const nextMode = a.type === HANDLE_MODES.CORNER ? HANDLE_MODES.SMOOTH : HANDLE_MODES.CORNER;
          convertAnchorHandleMode(a, nextMode);
          renderer.render();
          return;
        }
      }

      const hitId = renderer.hitTest(coords.x, coords.y);
      if (hitId) {
        const node = engine.getNode(hitId);
        const routed = routeDoubleClick(node, null, coords);

        if (routed.state === 'LOCKED') {
          alert(routed.message);
          return;
        }

        if (routed.state === EDITING_STATES.TEXT_EDIT) {
          const currentText = node.text?.content || '';
          const newText = prompt('Edit text content:', currentText);
          if (newText !== null && newText !== currentText) {
            engine.updateNode(hitId, { text: { content: newText } }, 'Edit text');
          }
          return;
        }

        if (routed.state === EDITING_STATES.VECTOR_EDIT) {
          this.enterVectorEdit(hitId, coords);
          return;
        }

        if (routed.state === EDITING_STATES.GROUP_DEEP_SELECT) {
          if (node.childIds && node.childIds.length > 0) {
            engine.setSelection([node.childIds[0]]);
            renderer.render();
          }
          return;
        }
      } else {
        // Double clicking empty canvas exits Vector Edit Mode if active
        if (this.editingState === EDITING_STATES.VECTOR_EDIT) {
          this.exitVectorEdit(true);
        }
      }
    });
  }

  /**
   * Section 11.6: Enter Vector Edit Mode on an editable shape or vector
   */
  enterVectorEdit(nodeId, clickCoords = null) {
    const node = this.engine.getNode(nodeId);
    if (!node) return;
    if (node.locked) {
      alert(`Layer "${node.name}" is locked.`);
      return;
    }

    const bounds = computeWorldBounds(this.engine.getActivePage(), nodeId);
    const anchors = extractNodeAnchors(node);
    applyEntrySelectionPolicy(anchors, this.vectorEditEntrySelectionPolicy, clickCoords, bounds);

    const selectedIndices = new Set();
    anchors.forEach((a, idx) => {
      if (a.selected) selectedIndices.add(idx);
    });

    this.editingState = EDITING_STATES.VECTOR_EDIT;
    this.activeVectorEdit = {
      nodeId,
      anchors,
      selectedIndices,
      bounds: { ...bounds },
      initialPath: anchorsToVectorPath(anchors, node.type !== 'line' && node.type !== 'arrow')
    };

    this.renderer.vectorEdit = this.activeVectorEdit;
    this.engine.setSelection([nodeId]);

    const banner = document.getElementById('vectorEditBanner');
    if (banner) banner.style.display = 'flex';

    this.renderer.render();
    this.updateInspector();
  }

  /**
   * Section 11.6: Exit Vector Edit Mode and commit or discard changes
   */
  exitVectorEdit(commit = true) {
    const banner = document.getElementById('vectorEditBanner');
    if (banner) banner.style.display = 'none';

    if (!this.activeVectorEdit) {
      this.editingState = EDITING_STATES.OBJECT_SELECT;
      return;
    }

    const { nodeId, anchors } = this.activeVectorEdit;
    const node = this.engine.getNode(nodeId);

    if (commit && node && anchors && anchors.length > 0) {
      const newPath = anchorsToVectorPath(anchors, node.type !== 'line' && node.type !== 'arrow');
      this.engine.updateNode(nodeId, {
        type: 'vector',
        vectorPath: newPath
      }, 'Edit Vector Anchors');
    }

    this.activeVectorEdit = null;
    this.renderer.vectorEdit = null;
    this.editingState = EDITING_STATES.OBJECT_SELECT;
    this.renderer.render();
    this.updateInspector();
  }

  /**
   * Section 11.6 item 3: Scoped Cmd/Ctrl+A selects all points in active path(s)
   */
  selectAllAnchors() {
    if (!this.activeVectorEdit || !this.activeVectorEdit.anchors) return;
    const { anchors, selectedIndices } = this.activeVectorEdit;
    selectedIndices.clear();
    anchors.forEach((a, idx) => {
      a.selected = true;
      selectedIndices.add(idx);
    });
    this.renderer.render();
    this.updateInspector();
  }

  /**
   * Section 11.10: Delete selected anchor points while preserving path topology
   */
  deleteSelectedAnchors() {
    if (!this.activeVectorEdit || !this.activeVectorEdit.anchors) return;
    const { nodeId, anchors, selectedIndices } = this.activeVectorEdit;
    if (selectedIndices.size === 0) return;

    const node = this.engine.getNode(nodeId);
    const closed = node?.type !== 'line' && node?.type !== 'arrow';
    const result = deleteSelectedAnchors(anchors, selectedIndices, closed);

    if (result.success) {
      this.activeVectorEdit.anchors = result.remaining;
      selectedIndices.clear();
      this.activeVectorEdit.anchors.forEach(a => a.selected = false);
      this.renderer.render();
      this.updateInspector();
    } else {
      console.warn(result.message);
    }
  }

  /**
   * Section 11.8: Nudge selected anchors by delta using arrow keys
   */
  nudgeSelectedAnchors(dx, dy) {
    if (!this.activeVectorEdit || !this.activeVectorEdit.anchors) return;
    const { anchors, selectedIndices } = this.activeVectorEdit;
    if (selectedIndices.size === 0) return;

    nudgeAnchors(anchors, selectedIndices, dx, dy);
    this.renderer.render();
    this.updateInspector();
  }

  /**
   * Section 11.9: Convert selected anchors to target handle mode
   */
  setAnchorHandleMode(mode) {
    if (!this.activeVectorEdit || !this.activeVectorEdit.anchors) return;
    const { anchors, selectedIndices } = this.activeVectorEdit;
    for (const idx of selectedIndices) {
      if (anchors[idx]) {
        convertAnchorHandleMode(anchors[idx], mode);
      }
    }
    this.renderer.render();
    this.updateInspector();
  }

  /**
   * Section 11.6: User preference for vectorEditEntrySelectionPolicy
   */
  setVectorEditEntrySelectionPolicy(policy) {
    if (Object.values(ENTRY_SELECTION_POLICIES).includes(policy)) {
      this.vectorEditEntrySelectionPolicy = policy;
    }
  }

  createShapeFromDrag(tool, startX, startY, currentX, currentY) {
    const isClick = Math.abs(currentX - startX) < 6 && Math.abs(currentY - startY) < 6;
    let x, y, width, height;

    if (isClick) {
      x = Math.round(startX);
      y = Math.round(startY);
      if (tool === 'frame') { width = 360; height = 240; }
      else if (tool === 'section') { width = 640; height = 480; }
      else if (tool === 'rectangle') { width = 120; height = 80; }
      else if (tool === 'ellipse') { width = 100; height = 100; }
      else if (tool === 'line') { width = 140; height = 2; }
      else if (tool === 'arrow') { width = 140; height = 2; }
      else if (tool === 'star') { width = 80; height = 80; }
      else if (tool === 'polygon') { width = 80; height = 80; }
      else if (tool === 'image') { width = 240; height = 160; }
      else if (tool === 'text') { width = 200; height = 36; }
      else { width = 120; height = 80; }
    } else {
      x = Math.round(Math.min(startX, currentX));
      y = Math.round(Math.min(startY, currentY));
      width = Math.max(10, Math.round(Math.abs(currentX - startX)));
      height = Math.max(tool === 'line' || tool === 'arrow' ? 2 : 10, Math.round(Math.abs(currentY - startY)));
    }

    let node;
    if (tool === 'frame') {
      node = createNode('frame', {
        name: 'Frame',
        transform: { x, y, width, height },
        style: { fills: [{ type: 'solid', color: '#1e293b' }], cornerRadius: 8 }
      });
    } else if (tool === 'section') {
      node = createNode('section', {
        name: 'Section',
        sectionTitle: 'Section',
        transform: { x, y, width, height },
        style: {
          fills: [{ type: 'solid', color: 'rgba(30, 41, 59, 0.45)' }],
          strokes: [{ color: '#475569', width: 1, style: 'dashed', dash: [6, 4] }]
        }
      });
    } else if (tool === 'rectangle') {
      node = createNode('rectangle', {
        name: 'Rectangle',
        transform: { x, y, width, height },
        style: { fills: [{ type: 'solid', color: '#3b82f6' }], cornerRadius: 4 }
      });
    } else if (tool === 'ellipse') {
      node = createNode('ellipse', {
        name: 'Circle',
        transform: { x, y, width, height },
        style: { fills: [{ type: 'solid', color: '#8b5cf6' }] }
      });
    } else if (tool === 'line') {
      if (isClick) {
        node = createNode('line', {
          name: 'Line',
          transform: { x, y, width: 140, height: 2, rotation: 0 },
          style: { strokes: [{ color: '#94a3b8', width: 2, style: 'solid' }] }
        });
      } else {
        const dx = currentX - startX;
        const dy = currentY - startY;
        const len = Math.max(10, Math.round(Math.hypot(dx, dy)));
        const rot = Math.round(Math.atan2(dy, dx) * 180 / Math.PI);
        node = createNode('line', {
          name: 'Line',
          transform: { x: Math.round(startX), y: Math.round(startY), width: len, height: 2, rotation: rot },
          style: { strokes: [{ color: '#94a3b8', width: 2, style: 'solid' }] }
        });
      }
    } else if (tool === 'arrow') {
      if (isClick) {
        node = createNode('arrow', {
          name: 'Arrow',
          transform: { x, y, width: 140, height: 2, rotation: 0 },
          arrowheadStart: 'none',
          arrowheadEnd: 'triangle',
          style: { strokes: [{ color: '#38bdf8', width: 2, style: 'solid' }] }
        });
      } else {
        const dx = currentX - startX;
        const dy = currentY - startY;
        const len = Math.max(10, Math.round(Math.hypot(dx, dy)));
        const rot = Math.round(Math.atan2(dy, dx) * 180 / Math.PI);
        node = createNode('arrow', {
          name: 'Arrow',
          transform: { x: Math.round(startX), y: Math.round(startY), width: len, height: 2, rotation: rot },
          arrowheadStart: 'none',
          arrowheadEnd: 'triangle',
          style: { strokes: [{ color: '#38bdf8', width: 2, style: 'solid' }] }
        });
      }
    } else if (tool === 'star') {
      node = createNode('star', {
        name: 'Star',
        transform: { x, y, width, height },
        starPoints: 5,
        starRatio: 0.45,
        style: { fills: [{ type: 'solid', color: '#f59e0b' }] }
      });
    } else if (tool === 'polygon') {
      node = createNode('polygon', {
        name: 'Polygon',
        transform: { x, y, width, height },
        polygonSides: 6,
        style: { fills: [{ type: 'solid', color: '#10b981' }] }
      });
    } else if (tool === 'pen' || tool === 'pencil') {
      const w = Math.max(20, width);
      const h = Math.max(20, height);
      node = createNode('vector', {
        name: tool === 'pencil' ? 'Pencil Sketch' : 'Vector Path',
        transform: { x, y, width: w, height: h },
        vectorPath: [
          { type: 'M', x: 0, y: h },
          { type: 'C', cp1x: w * 0.3, cp1y: 0, cp2x: w * 0.7, cp2y: h, x: w, y: 0 }
        ],
        style: {
          strokes: [{ color: '#38bdf8', width: 2, style: 'solid', cap: 'round', join: 'round' }],
          fills: []
        }
      });
    } else if (tool === 'image') {
      node = createNode('image', {
        name: 'Image Box',
        transform: { x, y, width, height },
        style: { fills: [{ type: 'solid', color: '#334155' }] }
      });
    } else if (tool === 'text') {
      node = createNode('text', {
        name: 'Text Block',
        transform: { x, y, width, height },
        text: {
          content: 'Heading',
          fontSize: 20,
          fontWeight: '600',
          color: '#f8fafc',
          fontFamily: "'Inter', sans-serif",
          lineHeight: 1.3,
          letterSpacing: 0,
          textAlign: 'left',
          verticalAlign: 'top',
          fontStyle: 'normal',
          textDecoration: 'none',
          textCase: 'none',
          autoResize: 'auto-width'
        }
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
      this.engine.setSelection([node.id]);
      return;
    }

    if (node) {
      let targetParentId = null;
      if (node.type !== 'section') {
        const page = this.engine.getActivePage();
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        targetParentId = resolveParentForPointer(centerX, centerY, node.type, page);
        if (targetParentId) {
          const parentWorld = computeWorldTransform(page, targetParentId);
          node.transform.x = x - parentWorld.x;
          node.transform.y = y - parentWorld.y;
          node.parentId = targetParentId;
        }
      }
      this.engine.addNode(node, targetParentId, `Create ${node.name}`);
      this.engine.setSelection([node.id]);
    }
  }

  handleShapeCreation(tool, coords) {
    this.createShapeFromDrag(tool, coords.x, coords.y, coords.x, coords.y);
  }

  setTool(tool) {
    const prevTool = this.currentTool;
    this.currentTool = tool;

    // Clean up temporary active tool previews if switching away
    if (prevTool === 'pencil' && this.pencilStroke) {
      this.pencilStroke = null;
      this.renderer.pencilPreview = null;
      this.renderer.render();
    }
    if (prevTool === 'pen' && this.penAnchors) {
      this.penAnchors = null;
      this.renderer.penPreview = null;
      this.renderer.render();
    }

    const groupMap = {
      select: 'move', scale: 'move',
      frame: 'region', section: 'region', slice: 'region',
      rectangle: 'shapes', line: 'shapes', arrow: 'shapes', ellipse: 'shapes', polygon: 'shapes', star: 'shapes', image: 'shapes',
      pen: 'vector', pencil: 'vector'
    };
    const group = groupMap[tool];
    if (group) {
      const faceBtn = document.getElementById(`toolFace_${group}`);
      if (faceBtn) faceBtn.dataset.tool = tool;
    }

    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tool === tool);
    });

    const canvas = document.getElementById('canvas2d');
    if (canvas) {
      if (tool === 'hand') canvas.style.cursor = 'grab';
      else if (['frame', 'section', 'rectangle', 'ellipse', 'line', 'arrow', 'star', 'polygon', 'image'].includes(tool)) canvas.style.cursor = 'crosshair';
      else if (tool === 'text') canvas.style.cursor = 'text';
      else if (tool === 'pen' || tool === 'pencil') canvas.style.cursor = 'crosshair';
      else canvas.style.cursor = 'default';
    }

    // Always refresh inspector so contextual tool studio / settings panel appears on the right
    this.updateInspector();
  }

  setHandMode(active) {
    this.isHandMode = active;
    const canvas = document.getElementById('canvas2d');
    if (canvas) canvas.classList.toggle('hand-mode', active);
  }

  // --- Numeric Expression Evaluator (supports 100+24, 20*2, +20%, -10%, etc.) ---
  evalExpr(val, fallback = 0) {
    return MathExpressionEvaluator.evaluate(val, fallback);
  }

  // --- Numeric Label Scrubbing ---
  makeScrubbable(element, onScrub, step = 1) {
    if (!element) return;
    element.classList.add('scrubbable');
    element.classList.add('scrubby-label');
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
        const calculated = ScrubbyInputController.calculateDelta(delta, {
          shiftKey: moveEvent.shiftKey,
          altKey: moveEvent.altKey,
          baseStep: step
        });
        onScrub(calculated);
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

  setActiveTool(tool) {
    this.setTool(tool);
  }

  cancelActiveGesture() {
    if (this.dragState) {
      this.dragState = null;
      this.renderer.render();
    }
  }

  closeActiveModal() {
    const modalIds = [
      'modalPrototype',
      'modalExport',
      'modalHelp',
      'modalLinter',
      'modalShare',
      'modalLearnCenter',
      'modalSpecCoverage',
      'commandPaletteModal'
    ];
    for (const id of modalIds) {
      const el = document.getElementById(id);
      if (el && el.style.display !== 'none' && !el.classList.contains('hidden')) {
        el.style.display = 'none';
        return true;
      }
    }
    return false;
  }

  // --- Interactive Canvas Breadcrumbs (design_engine_logical_parameters.md Section 24) ---
  updateBreadcrumbs() {
    const bar = document.getElementById('canvasBreadcrumbs');
    if (!bar) return;

    const selectedIds = this.engine.getSelection();
    if (selectedIds.length === 0) {
      bar.style.display = 'none';
      bar.innerHTML = '';
      return;
    }

    const page = this.engine.getActivePage();
    if (!page) {
      bar.style.display = 'none';
      return;
    }

    const targetNode = page.nodes[selectedIds[0]];
    if (!targetNode) {
      bar.style.display = 'none';
      return;
    }

    // Build ancestor chain
    const chain = [];
    let cur = targetNode;
    while (cur) {
      chain.unshift(cur);
      cur = cur.parentId ? page.nodes[cur.parentId] : null;
    }

    const getIcon = (type) => {
      switch (type) {
        case 'page': return '📄';
        case 'section': return '📐';
        case 'frame': return '⏹';
        case 'component': return '❖';
        case 'instance': return '◇';
        case 'text': return 'T';
        case 'group': return '📁';
        case 'vector':
        case 'path': return '✒';
        default: return '▢';
      }
    };

    let html = `
      <span class="breadcrumb-item" data-id="__page__" title="Active Page (${page.name || 'Page 1'})">
        <span class="breadcrumb-icon">${getIcon('page')}</span>
        <span>${page.name || 'Page 1'}</span>
      </span>
    `;

    for (const node of chain) {
      const isSelected = node.id === targetNode.id;
      html += `
        <span class="breadcrumb-separator">›</span>
        <span class="breadcrumb-item ${isSelected ? 'active' : ''}" data-id="${node.id}" title="${node.name} (${node.type})">
          <span class="breadcrumb-icon">${getIcon(node.type)}</span>
          <span>${node.name}</span>
        </span>
      `;
    }

    bar.innerHTML = html;
    bar.style.display = 'flex';

    bar.querySelectorAll('.breadcrumb-item').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = el.dataset.id;
        if (id === '__page__') {
          this.engine.setSelection([]);
        } else {
          this.engine.setSelection([id]);
        }
        this.renderer.render();
        this.updateInspector();
        this.updateLayersTree();
      });
    });
  }

  // --- Device Presets & Custom Frame Generator (Section 4) ---
  renderDevicePresetsHTML(selectedFrame = null) {
    const categories = ['All', 'Phone', 'Tablet', 'Desktop', 'Custom'];
    const activeCategory = this.devicePresetCategory || 'All';
    const query = this.devicePresetQuery || '';

    let presets = queryDevicePresets({ query });
    if (activeCategory === 'Phone') {
      presets = presets.filter(p => (p.subcategory && (p.subcategory.includes('Phone') || p.subcategory.includes('iPhone') || p.subcategory.includes('Foldable') || p.subcategory.includes('Note'))));
    } else if (activeCategory === 'Tablet') {
      presets = presets.filter(p => (p.subcategory && (p.subcategory.includes('iPad') || p.subcategory.includes('Tablet'))));
    } else if (activeCategory === 'Desktop') {
      presets = presets.filter(p => p.category === 'Laptop/Desktop');
    }

    const currentW = selectedFrame ? Math.round(selectedFrame.transform?.width || 1440) : (this.customFrameW || 1440);
    const currentH = selectedFrame ? Math.round(selectedFrame.transform?.height || 900) : (this.customFrameH || 900);

    return `
      <div class="device-preset-container" id="devicePresetContainer">
        <div class="device-preset-header">
          <span>📱 Device & Frame Presets</span>
          <span style="font-size: 10px; color: var(--accent-blue);">${presets.length} models</span>
        </div>

        <!-- Category Pills (All, Phone, Tablet, Desktop, Custom) -->
        <div class="device-category-pills">
          ${categories.map(cat => `
            <button class="device-pill-btn ${cat === activeCategory ? 'active' : ''}" data-cat="${cat}">${cat}</button>
          `).join('')}
        </div>

        ${activeCategory === 'Custom' ? `
          <!-- Custom Frame Form -->
          <div class="custom-frame-controls">
            <div class="props-row">
              <div class="prop-field">
                <span class="prop-label">W</span>
                <input type="number" class="prop-input" id="inpCustomFrameW" value="${currentW}">
              </div>
              <button class="btn-aspect-ratio ${this.aspectRatioLocked ? 'locked' : ''}" id="btnLockCustomAspect" title="Lock Aspect Ratio">
                ${this.aspectRatioLocked ? '🔒' : '🔓'}
              </button>
              <div class="prop-field">
                <span class="prop-label">H</span>
                <input type="number" class="prop-input" id="inpCustomFrameH" value="${currentH}">
              </div>
            </div>
            <div style="display: flex; gap: 6px;">
              <button class="orientation-toggle-btn" id="btnToggleCustomOrientation" style="flex: 1;" title="Toggle Orientation (Portrait <-> Landscape)">
                <span>↔ Orientation</span>
              </button>
              <button class="btn-inspector-action" id="btnInsertCustomFrame" style="flex: 1.5; font-size: 11px; background: var(--accent-blue); color: #fff;">
                ${selectedFrame ? 'Apply Dimensions' : '＋ Add Custom Frame'}
              </button>
            </div>
          </div>
        ` : `
          <!-- Search input -->
          <input type="text" class="device-search-input" id="inpDeviceSearch" placeholder="Search devices (iPhone, iPad, Galaxy, MacBook)..." value="${query}">

          <!-- Device Presets List -->
          <div class="device-preset-list">
            ${presets.map(p => `
              <div class="device-preset-item" data-preset-id="${p.id}" data-w="${p.width}" data-h="${p.height}" data-name="${p.name}" data-category="${p.category}" data-subcategory="${p.subcategory || ''}">
                <div>
                  <div class="device-preset-name">${p.name}</div>
                  <div class="device-preset-era">${p.category} • ${p.era}</div>
                </div>
                <div class="device-preset-meta">
                  <div class="device-preset-dims">${p.width} × ${p.height} ${p.unit}</div>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  }

  bindDevicePresetListeners(selectedFrame = null) {
    // 1. Category pills
    document.querySelectorAll('.device-pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.devicePresetCategory = btn.dataset.cat;
        this.updateInspector();
      });
    });

    // 2. Search input
    const searchInp = document.getElementById('inpDeviceSearch');
    if (searchInp) {
      searchInp.addEventListener('input', (e) => {
        this.devicePresetQuery = e.target.value;
        const container = document.getElementById('devicePresetContainer');
        if (container) {
          const list = container.querySelector('.device-preset-list');
          if (list) {
            let presets = queryDevicePresets({ query: this.devicePresetQuery });
            const activeCategory = this.devicePresetCategory || 'All';
            if (activeCategory === 'Phone') {
              presets = presets.filter(p => (p.subcategory && (p.subcategory.includes('Phone') || p.subcategory.includes('iPhone') || p.subcategory.includes('Foldable') || p.subcategory.includes('Note'))));
            } else if (activeCategory === 'Tablet') {
              presets = presets.filter(p => (p.subcategory && (p.subcategory.includes('iPad') || p.subcategory.includes('Tablet'))));
            } else if (activeCategory === 'Desktop') {
              presets = presets.filter(p => p.category === 'Laptop/Desktop');
            }
            list.innerHTML = presets.map(p => `
              <div class="device-preset-item" data-preset-id="${p.id}" data-w="${p.width}" data-h="${p.height}" data-name="${p.name}" data-category="${p.category}" data-subcategory="${p.subcategory || ''}">
                <div>
                  <div class="device-preset-name">${p.name}</div>
                  <div class="device-preset-era">${p.category} • ${p.era}</div>
                </div>
                <div class="device-preset-meta">
                  <div class="device-preset-dims">${p.width} × ${p.height} ${p.unit}</div>
                </div>
              </div>
            `).join('');
            this.bindPresetItemClicks(selectedFrame);
          }
        }
      });
    }

    // 3. Preset item clicks
    this.bindPresetItemClicks(selectedFrame);

    // 4. Custom Frame controls
    document.getElementById('btnLockCustomAspect')?.addEventListener('click', () => {
      this.aspectRatioLocked = !this.aspectRatioLocked;
      this.updateInspector();
    });

    document.getElementById('inpCustomFrameW')?.addEventListener('change', (e) => {
      this.customFrameW = Math.max(10, parseInt(e.target.value, 10) || 1440);
      if (this.aspectRatioLocked && this.customFrameH > 0) {
        this.customFrameH = Math.max(10, Math.round(this.customFrameW * (900 / 1440)));
      }
    });

    document.getElementById('inpCustomFrameH')?.addEventListener('change', (e) => {
      this.customFrameH = Math.max(10, parseInt(e.target.value, 10) || 900);
      if (this.aspectRatioLocked && this.customFrameW > 0) {
        this.customFrameW = Math.max(10, Math.round(this.customFrameH * (1440 / 900)));
      }
    });

    document.getElementById('btnToggleCustomOrientation')?.addEventListener('click', () => {
      if (selectedFrame) {
        const oldW = selectedFrame.transform?.width || 1440;
        const oldH = selectedFrame.transform?.height || 900;
        this.engine.updateNode(selectedFrame.id, { transform: { width: oldH, height: oldW } }, 'Toggle Frame Orientation');
        this.renderer.render();
        this.updateInspector();
      } else {
        const oldW = this.customFrameW || 1440;
        const oldH = this.customFrameH || 900;
        this.customFrameW = oldH;
        this.customFrameH = oldW;
        this.updateInspector();
      }
    });

    document.getElementById('btnInsertCustomFrame')?.addEventListener('click', () => {
      const w = this.customFrameW || 1440;
      const h = this.customFrameH || 900;
      if (selectedFrame) {
        this.engine.updateNode(selectedFrame.id, { transform: { width: w, height: h } }, 'Update Frame Dimensions');
        this.renderer.render();
        this.updateInspector();
      } else {
        this.insertDeviceFrame({ name: 'Custom Frame', width: w, height: h, category: 'Custom', subcategory: '' });
      }
    });
  }

  bindPresetItemClicks(selectedFrame = null) {
    document.querySelectorAll('.device-preset-item').forEach(item => {
      item.onclick = () => {
        const w = parseInt(item.dataset.w, 10);
        const h = parseInt(item.dataset.h, 10);
        const name = item.dataset.name;
        const category = item.dataset.category;
        const subcategory = item.dataset.subcategory || '';

        if (selectedFrame) {
          this.engine.updateNode(selectedFrame.id, {
            name,
            transform: { width: w, height: h }
          }, `Resize Frame to ${name}`);
          this.renderer.render();
          this.updateInspector();
        } else {
          this.insertDeviceFrame({ name, width: w, height: h, category, subcategory });
        }
      };
    });
  }

  insertDeviceFrame({ name, width, height, category, subcategory = '' }) {
    const viewW = this.canvas ? this.canvas.width : 1200;
    const viewH = this.canvas ? this.canvas.height : 800;
    const z = this.renderer ? this.renderer.zoom : 1;
    const px = this.renderer ? this.renderer.panX : 0;
    const py = this.renderer ? this.renderer.panY : 0;

    const posX = Math.round(-px / z + (viewW / z) / 2 - width / 2);
    const posY = Math.round(-py / z + (viewH / z) / 2 - height / 2);

    const isPhone = subcategory.includes('iPhone') || subcategory.includes('Phone');
    const isTablet = subcategory.includes('iPad') || subcategory.includes('Tablet');
    const radius = isPhone ? 40 : (isTablet ? 24 : 8);

    const newFrame = createNode('frame', {
      name,
      transform: {
        x: Math.max(40, posX),
        y: Math.max(40, posY),
        width,
        height
      },
      style: {
        fills: [{ type: 'solid', color: '#161a24' }],
        cornerRadius: radius
      }
    });

    this.engine.addNode(newFrame);
    this.engine.setSelection([newFrame.id]);
    this.setTool('select');
    this.renderer.render();
    this.updateInspector();
  }

  finishPencilStroke(points) {
    if (!points || points.length < 2) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of points) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
    const width = Math.max(12, maxX - minX);
    const height = Math.max(12, maxY - minY);
    const originX = Math.round(minX);
    const originY = Math.round(minY);

    const pathData = [{ type: 'M', x: Math.round(points[0].x - originX), y: Math.round(points[0].y - originY) }];
    for (let i = 1; i < points.length; i++) {
      pathData.push({ type: 'L', x: Math.round(points[i].x - originX), y: Math.round(points[i].y - originY) });
    }

    const strokeColor = this.pencilDefaultColor || '#38bdf8';
    const strokeWidth = this.pencilDefaultWidth || 2;
    const node = createNode('vector', {
      name: 'Pencil Sketch',
      transform: { x: originX, y: originY, width: Math.round(width), height: Math.round(height) },
      vectorPath: pathData,
      style: {
        strokes: [{ color: strokeColor, width: strokeWidth, style: 'solid', cap: 'round', join: 'round' }],
        fills: []
      }
    });

    const page = this.engine.getActivePage();
    this.engine.addNode(node, page.id);
    this.engine.setSelection([node.id]);
    this.renderer.render();
    this.updateInspector();
    this.updateLayersTree();
    this.storage.scheduleAutosave(this.doc);
  }

  finishPenPath(closed = false) {
    const points = this.penAnchors;
    this.penAnchors = null;
    this.renderer.penPreview = null;
    if (!points || points.length < 2) {
      this.renderer.render();
      this.updateInspector();
      return;
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of points) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
    const width = Math.max(14, maxX - minX);
    const height = Math.max(14, maxY - minY);
    const originX = Math.round(minX);
    const originY = Math.round(minY);

    const pathData = [{ type: 'M', x: Math.round(points[0].x - originX), y: Math.round(points[0].y - originY) }];
    for (let i = 1; i < points.length; i++) {
      pathData.push({ type: 'L', x: Math.round(points[i].x - originX), y: Math.round(points[i].y - originY) });
    }
    if (closed) {
      pathData.push({ type: 'Z' });
    }

    const strokeColor = this.penDefaultColor || '#38bdf8';
    const strokeWidth = this.penDefaultWidth || 2;
    const node = createNode('vector', {
      name: closed ? 'Vector Shape' : 'Vector Path',
      transform: { x: originX, y: originY, width: Math.round(width), height: Math.round(height) },
      vectorPath: pathData,
      style: {
        strokes: [{ color: strokeColor, width: strokeWidth, style: 'solid', cap: 'round', join: 'round' }],
        fills: closed ? [{ type: 'solid', color: 'rgba(56, 189, 248, 0.25)' }] : []
      }
    });

    const page = this.engine.getActivePage();
    this.engine.addNode(node, page.id);
    this.engine.setSelection([node.id]);
    this.setTool('select');
    this.renderer.render();
    this.updateInspector();
    this.updateLayersTree();
    this.storage.scheduleAutosave(this.doc);
  }

  cancelPenPath() {
    this.penAnchors = null;
    this.renderer.penPreview = null;
    this.renderer.render();
    this.updateInspector();
  }

  // --- Active Tool Studios for Right Hand Properties Panel ---

  renderArrowToolStudio() {
    const startCap = this.arrowDefaultStart || 'none';
    const endCap = this.arrowDefaultEnd || 'triangle';
    const strokeWidth = this.arrowDefaultWidth || 2;
    const strokeColor = this.arrowDefaultColor || '#38bdf8';
    const strokeStyle = this.arrowDefaultStyle || 'solid';

    return `
      <div class="tool-active-banner">
        <div class="tool-active-banner-icon">↗</div>
        <div class="tool-active-banner-info">
          <div class="tool-active-banner-title">Arrow Tool Active</div>
          <div class="tool-active-banner-desc">Click & drag on canvas to draw directional arrows and connectors at any angle.</div>
        </div>
      </div>

      <div class="section-group">
        <div class="section-title">Arrowheads & Caps</div>
        <div class="props-row">
          <div class="prop-field">
            <span class="prop-label">Start</span>
            <select class="prop-select" id="toolArrowStartCap">
              <option value="none" ${startCap === 'none' ? 'selected' : ''}>None</option>
              <option value="triangle" ${startCap === 'triangle' ? 'selected' : ''}>Triangle ▶</option>
              <option value="stealth" ${startCap === 'stealth' ? 'selected' : ''}>Stealth ▷</option>
              <option value="circle" ${startCap === 'circle' ? 'selected' : ''}>Circle ●</option>
              <option value="square" ${startCap === 'square' ? 'selected' : ''}>Square ■</option>
              <option value="diamond" ${startCap === 'diamond' ? 'selected' : ''}>Diamond ◆</option>
            </select>
          </div>
          <div class="prop-field">
            <span class="prop-label">End</span>
            <select class="prop-select" id="toolArrowEndCap">
              <option value="triangle" ${endCap === 'triangle' ? 'selected' : ''}>Triangle ▶</option>
              <option value="stealth" ${endCap === 'stealth' ? 'selected' : ''}>Stealth ▷</option>
              <option value="circle" ${endCap === 'circle' ? 'selected' : ''}>Circle ●</option>
              <option value="square" ${endCap === 'square' ? 'selected' : ''}>Square ■</option>
              <option value="diamond" ${endCap === 'diamond' ? 'selected' : ''}>Diamond ◆</option>
              <option value="none" ${endCap === 'none' ? 'selected' : ''}>None</option>
            </select>
          </div>
        </div>
      </div>

      <div class="section-group">
        <div class="section-title">Stroke Parameters</div>
        <div class="props-row">
          <div class="color-swatch-box" id="toolArrowSwatch" style="background: ${strokeColor};" title="Arrow Color"></div>
          <div class="prop-field">
            <span class="prop-label">Color</span>
            <input type="text" class="prop-input" id="toolArrowColorInp" value="${strokeColor}">
          </div>
          <div class="prop-field" style="max-width: 80px;">
            <span class="prop-label">Width</span>
            <input type="number" class="prop-input" id="toolArrowWidthInp" value="${strokeWidth}" min="1" max="64">
          </div>
        </div>

        <div class="props-row" style="margin-top: 8px;">
          <div class="tool-preset-pills-row">
            ${[1, 2, 3, 4, 6, 8].map(w => `
              <button class="tool-preset-pill ${w === strokeWidth ? 'active' : ''}" data-val="${w}">${w}px</button>
            `).join('')}
          </div>
        </div>

        <div class="props-row" style="margin-top: 8px;">
          <div class="sizing-pill-selector" style="width: 100%;">
            <button class="sizing-pill-btn ${strokeStyle === 'solid' ? 'active' : ''}" data-style="solid">Solid ───</button>
            <button class="sizing-pill-btn ${strokeStyle === 'dashed' ? 'active' : ''}" data-style="dashed">Dashed ╌╌╌</button>
            <button class="sizing-pill-btn ${strokeStyle === 'dotted' ? 'active' : ''}" data-style="dotted">Dotted ┈┈┈</button>
          </div>
        </div>
      </div>

      <div class="tool-studio-card">
        <div style="font-size: 11px; font-weight: 600; color: #ffffff;">💡 Pro Tips (Figma & XD Parity)</div>
        <div style="font-size: 10.5px; color: var(--text-dim); line-height: 1.4;">
          • Hold <b>Shift</b> while dragging to snap angle to 0°, 45°, 90°, or 180°.<br>
          • Drag end points on canvas anytime to redirect the arrow.
        </div>
      </div>
    `;
  }

  bindArrowToolStudioListeners() {
    document.getElementById('toolArrowStartCap')?.addEventListener('change', (e) => {
      this.arrowDefaultStart = e.target.value;
    });
    document.getElementById('toolArrowEndCap')?.addEventListener('change', (e) => {
      this.arrowDefaultEnd = e.target.value;
    });
    document.getElementById('toolArrowWidthInp')?.addEventListener('change', (e) => {
      this.arrowDefaultWidth = Math.max(1, parseInt(e.target.value, 10) || 2);
    });
    document.querySelectorAll('.tool-preset-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const val = parseInt(pill.dataset.val, 10);
        this.arrowDefaultWidth = val;
        const inp = document.getElementById('toolArrowWidthInp');
        if (inp) inp.value = val;
        document.querySelectorAll('.tool-preset-pill').forEach(p => p.classList.toggle('active', p === pill));
      });
    });
    document.querySelectorAll('.sizing-pill-btn[data-style]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.arrowDefaultStyle = btn.dataset.style;
        document.querySelectorAll('.sizing-pill-btn[data-style]').forEach(b => b.classList.toggle('active', b === btn));
      });
    });
    const swatch = document.getElementById('toolArrowSwatch');
    if (swatch) {
      swatch.addEventListener('click', () => {
        this.colorPicker.open({
          anchorEl: swatch,
          color: this.arrowDefaultColor || '#38bdf8',
          palette: this.getDocumentColors(),
          onChange: (hex) => {
            this.arrowDefaultColor = hex;
            swatch.style.background = hex;
            const inp = document.getElementById('toolArrowColorInp');
            if (inp) inp.value = hex;
          },
          onCommit: (hex) => {
            this.arrowDefaultColor = hex;
            swatch.style.background = hex;
            const inp = document.getElementById('toolArrowColorInp');
            if (inp) inp.value = hex;
          }
        });
      });
    }
  }

  renderLineToolStudio() {
    const strokeWidth = this.lineDefaultWidth || 2;
    const strokeColor = this.lineDefaultColor || '#94a3b8';
    return `
      <div class="tool-active-banner">
        <div class="tool-active-banner-icon">╱</div>
        <div class="tool-active-banner-info">
          <div class="tool-active-banner-title">Line Tool Active</div>
          <div class="tool-active-banner-desc">Click & drag on canvas to draw straight divider lines and rules.</div>
        </div>
      </div>

      <div class="section-group">
        <div class="section-title">Stroke Parameters</div>
        <div class="props-row">
          <div class="color-swatch-box" id="toolLineSwatch" style="background: ${strokeColor};" title="Line Color"></div>
          <div class="prop-field">
            <span class="prop-label">Color</span>
            <input type="text" class="prop-input" id="toolLineColorInp" value="${strokeColor}">
          </div>
          <div class="prop-field" style="max-width: 80px;">
            <span class="prop-label">Width</span>
            <input type="number" class="prop-input" id="toolLineWidthInp" value="${strokeWidth}" min="1" max="64">
          </div>
        </div>
        <div class="props-row" style="margin-top: 8px;">
          <div class="tool-preset-pills-row">
            ${[1, 2, 3, 4, 6, 8].map(w => `
              <button class="tool-preset-pill ${w === strokeWidth ? 'active' : ''}" data-val="${w}">${w}px</button>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  bindLineToolStudioListeners() {
    document.getElementById('toolLineWidthInp')?.addEventListener('change', (e) => {
      this.lineDefaultWidth = Math.max(1, parseInt(e.target.value, 10) || 2);
    });
    document.querySelectorAll('.tool-preset-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const val = parseInt(pill.dataset.val, 10);
        this.lineDefaultWidth = val;
        const inp = document.getElementById('toolLineWidthInp');
        if (inp) inp.value = val;
        document.querySelectorAll('.tool-preset-pill').forEach(p => p.classList.toggle('active', p === pill));
      });
    });
    const swatch = document.getElementById('toolLineSwatch');
    if (swatch) {
      swatch.addEventListener('click', () => {
        this.colorPicker.open({
          anchorEl: swatch,
          color: this.lineDefaultColor || '#94a3b8',
          palette: this.getDocumentColors(),
          onChange: (hex) => {
            this.lineDefaultColor = hex;
            swatch.style.background = hex;
            const inp = document.getElementById('toolLineColorInp');
            if (inp) inp.value = hex;
          },
          onCommit: (hex) => {
            this.lineDefaultColor = hex;
            swatch.style.background = hex;
            const inp = document.getElementById('toolLineColorInp');
            if (inp) inp.value = hex;
          }
        });
      });
    }
  }

  renderPenToolStudio() {
    const anchorsCount = this.penAnchors ? this.penAnchors.length : 0;
    const strokeColor = this.penDefaultColor || '#38bdf8';
    const strokeWidth = this.penDefaultWidth || 2;

    return `
      <div class="tool-active-banner">
        <div class="tool-active-banner-icon">✒️</div>
        <div class="tool-active-banner-info">
          <div class="tool-active-banner-title">Pen Tool Active</div>
          <div class="tool-active-banner-desc">Click canvas to drop vector anchor points and create custom bezier curves.</div>
        </div>
      </div>

      <div class="section-group">
        <div class="section-title">
          <span>Active Path Status</span>
          <span style="font-size: 10px; color: var(--accent-blue);">${anchorsCount} points placed</span>
        </div>
        <div style="display: flex; gap: 6px;">
          <button class="btn-inspector-action" id="btnFinishPenPath" style="flex: 1; font-size: 11px;" ${anchorsCount < 2 ? 'disabled' : ''}>✓ Complete Path (Enter)</button>
          <button class="btn-inspector-action" id="btnCancelPenPath" style="font-size: 11px;" ${anchorsCount === 0 ? 'disabled' : ''}>✕ Cancel (Esc)</button>
        </div>
      </div>

      <div class="section-group">
        <div class="section-title">Default Vector Style</div>
        <div class="props-row">
          <div class="color-swatch-box" id="toolPenSwatch" style="background: ${strokeColor};" title="Path Color"></div>
          <div class="prop-field">
            <span class="prop-label">Color</span>
            <input type="text" class="prop-input" id="toolPenColorInp" value="${strokeColor}">
          </div>
          <div class="prop-field" style="max-width: 80px;">
            <span class="prop-label">Width</span>
            <input type="number" class="prop-input" id="toolPenWidthInp" value="${strokeWidth}" min="1" max="64">
          </div>
        </div>
        <div class="props-row" style="margin-top: 8px;">
          <div class="tool-preset-pills-row">
            ${[1, 2, 3, 4, 6].map(w => `
              <button class="tool-preset-pill ${w === strokeWidth ? 'active' : ''}" data-val="${w}">${w}px</button>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="tool-studio-card">
        <div style="font-size: 11px; font-weight: 600; color: #ffffff;">💡 Pen Guide (Illustrator & Figma)</div>
        <div style="font-size: 10.5px; color: var(--text-dim); line-height: 1.4;">
          • Click anywhere to drop an anchor point.<br>
          • Click back on the <b>first anchor</b> to close into a filled vector shape.<br>
          • Press <b>Enter</b> or double-click to finish an open vector path.<br>
          • Press <b>Escape</b> to cancel.
        </div>
      </div>
    `;
  }

  bindPenToolStudioListeners() {
    document.getElementById('btnFinishPenPath')?.addEventListener('click', () => this.finishPenPath(false));
    document.getElementById('btnCancelPenPath')?.addEventListener('click', () => this.cancelPenPath());
    document.getElementById('toolPenWidthInp')?.addEventListener('change', (e) => {
      this.penDefaultWidth = Math.max(1, parseInt(e.target.value, 10) || 2);
    });
    document.querySelectorAll('.tool-preset-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const val = parseInt(pill.dataset.val, 10);
        this.penDefaultWidth = val;
        const inp = document.getElementById('toolPenWidthInp');
        if (inp) inp.value = val;
        document.querySelectorAll('.tool-preset-pill').forEach(p => p.classList.toggle('active', p === pill));
      });
    });
    const swatch = document.getElementById('toolPenSwatch');
    if (swatch) {
      swatch.addEventListener('click', () => {
        this.colorPicker.open({
          anchorEl: swatch,
          color: this.penDefaultColor || '#38bdf8',
          palette: this.getDocumentColors(),
          onChange: (hex) => {
            this.penDefaultColor = hex;
            swatch.style.background = hex;
            const inp = document.getElementById('toolPenColorInp');
            if (inp) inp.value = hex;
          },
          onCommit: (hex) => {
            this.penDefaultColor = hex;
            swatch.style.background = hex;
            const inp = document.getElementById('toolPenColorInp');
            if (inp) inp.value = hex;
          }
        });
      });
    }
  }

  renderPencilToolStudio() {
    const strokeColor = this.pencilDefaultColor || '#38bdf8';
    const strokeWidth = this.pencilDefaultWidth || 2;

    return `
      <div class="tool-active-banner">
        <div class="tool-active-banner-icon">✏️</div>
        <div class="tool-active-banner-info">
          <div class="tool-active-banner-title">Pencil Tool Active</div>
          <div class="tool-active-banner-desc">Draw freehand sketches directly on the canvas with automatic vector path conversion.</div>
        </div>
      </div>

      <div class="section-group">
        <div class="section-title">Brush & Stroke</div>
        <div class="props-row">
          <div class="color-swatch-box" id="toolPencilSwatch" style="background: ${strokeColor};" title="Pencil Color"></div>
          <div class="prop-field">
            <span class="prop-label">Color</span>
            <input type="text" class="prop-input" id="toolPencilColorInp" value="${strokeColor}">
          </div>
          <div class="prop-field" style="max-width: 80px;">
            <span class="prop-label">Width</span>
            <input type="number" class="prop-input" id="toolPencilWidthInp" value="${strokeWidth}" min="1" max="64">
          </div>
        </div>

        <div class="props-row" style="margin-top: 8px;">
          <div class="tool-preset-pills-row">
            ${[1, 2, 3, 4, 6, 8].map(w => `
              <button class="tool-preset-pill ${w === strokeWidth ? 'active' : ''}" data-val="${w}">${w}px</button>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="tool-studio-card">
        <div style="font-size: 11px; font-weight: 600; color: #ffffff;">💡 Freehand Sketching</div>
        <div style="font-size: 10.5px; color: var(--text-dim); line-height: 1.4;">
          • Click & drag freely on canvas to sketch.<br>
          • When you release the mouse, your stroke is instantly converted to a vectorized layer with full stroke and editability.
        </div>
      </div>
    `;
  }

  bindPencilToolStudioListeners() {
    document.getElementById('toolPencilWidthInp')?.addEventListener('change', (e) => {
      this.pencilDefaultWidth = Math.max(1, parseInt(e.target.value, 10) || 2);
    });
    document.querySelectorAll('.tool-preset-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const val = parseInt(pill.dataset.val, 10);
        this.pencilDefaultWidth = val;
        const inp = document.getElementById('toolPencilWidthInp');
        if (inp) inp.value = val;
        document.querySelectorAll('.tool-preset-pill').forEach(p => p.classList.toggle('active', p === pill));
      });
    });
    const swatch = document.getElementById('toolPencilSwatch');
    if (swatch) {
      swatch.addEventListener('click', () => {
        this.colorPicker.open({
          anchorEl: swatch,
          color: this.pencilDefaultColor || '#38bdf8',
          palette: this.getDocumentColors(),
          onChange: (hex) => {
            this.pencilDefaultColor = hex;
            swatch.style.background = hex;
            const inp = document.getElementById('toolPencilColorInp');
            if (inp) inp.value = hex;
          },
          onCommit: (hex) => {
            this.pencilDefaultColor = hex;
            swatch.style.background = hex;
            const inp = document.getElementById('toolPencilColorInp');
            if (inp) inp.value = hex;
          }
        });
      });
    }
  }

  renderTextToolStudio() {
    return `
      <div class="tool-active-banner">
        <div class="tool-active-banner-icon">T</div>
        <div class="tool-active-banner-info">
          <div class="tool-active-banner-title">Text Tool Active</div>
          <div class="tool-active-banner-desc">Click anywhere to type, or drag on the canvas to create a fixed-width text box.</div>
        </div>
      </div>

      <div class="section-group">
        <div class="section-title">Word & Typography Presets</div>
        <div class="typography-presets-bar">
          <button class="typo-preset-chip" data-size="40" data-weight="800">Display</button>
          <button class="typo-preset-chip" data-size="32" data-weight="700">H1</button>
          <button class="typo-preset-chip" data-size="24" data-weight="600">H2</button>
          <button class="typo-preset-chip" data-size="18" data-weight="600">H3</button>
          <button class="typo-preset-chip active" data-size="14" data-weight="400">Body</button>
          <button class="typo-preset-chip" data-size="11" data-weight="400">Caption</button>
          <button class="typo-preset-chip" data-size="13" data-weight="500" data-mono="true">Code</button>
        </div>
      </div>

      <div class="tool-studio-card">
        <div style="font-size: 11px; font-weight: 600; color: #ffffff;">💡 Text Placement</div>
        <div style="font-size: 10.5px; color: var(--text-dim); line-height: 1.4;">
          • Click canvas to place an <b>Auto Width</b> text block.<br>
          • Drag canvas to define a custom <b>Fixed Width</b> container with automatic word-wrapping.
        </div>
      </div>
    `;
  }

  bindTextToolStudioListeners() {
    document.querySelectorAll('.typo-preset-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.typo-preset-chip').forEach(c => c.classList.toggle('active', c === chip));
      });
    });
  }

  renderShapeToolStudio(tool) {
    const title = tool.charAt(0).toUpperCase() + tool.slice(1);
    return `
      <div class="tool-active-banner">
        <div class="tool-active-banner-icon">▢</div>
        <div class="tool-active-banner-info">
          <div class="tool-active-banner-title">${title} Tool Active</div>
          <div class="tool-active-banner-desc">Click & drag on canvas to create a ${tool} shape with live dimension preview.</div>
        </div>
      </div>

      ${tool === 'star' ? `
      <div class="section-group">
        <div class="section-title">Star Geometry</div>
        <div class="props-row">
          <div class="prop-field">
            <span class="prop-label">Points</span>
            <input type="number" class="prop-input" id="toolStarPoints" value="5" min="3" max="32">
          </div>
          <div class="prop-field">
            <span class="prop-label">Ratio %</span>
            <input type="number" class="prop-input" id="toolStarRatio" value="45" min="10" max="90">
          </div>
        </div>
      </div>` : ''}

      ${tool === 'polygon' ? `
      <div class="section-group">
        <div class="section-title">Polygon Geometry</div>
        <div class="props-row">
          <div class="prop-field">
            <span class="prop-label">Sides</span>
            <input type="number" class="prop-input" id="toolPolygonSides" value="6" min="3" max="24">
          </div>
        </div>
      </div>` : ''}

      <div class="tool-studio-card">
        <div style="font-size: 11px; font-weight: 600; color: #ffffff;">💡 Alignment Tip</div>
        <div style="font-size: 10.5px; color: var(--text-dim); line-height: 1.4;">
          Hold <b>Shift</b> while dragging to lock a 1:1 aspect ratio (square, perfect circle, symmetrical star).
        </div>
      </div>
    `;
  }

  bindShapeToolStudioListeners(tool) {
    // Optional reactive listeners for live shape defaults
  }

  // --- Contextual Figma-Identical Design Tab Inspector (Section 4.1 & Appendix A2.2) ---
  updateInspector() {
    this.updateBreadcrumbs();
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.classList?.contains('prop-input') || activeEl.classList?.contains('device-search-input'))) {
      return;
    }

    const selectedIds = this.engine.getSelection();
    const container = document.getElementById('inspectorProperties');
    const badge = document.getElementById('selectionCountBadge');
    const title = document.getElementById('inspectorSelectionTitle');
    if (!container) return;

    if (badge) badge.textContent = `${selectedIds.length} selected`;

    // 0. When Specific Design Tools are Active with no selection: Show Tool Studios
    if (selectedIds.length === 0 && this.currentTool !== 'select' && this.currentTool !== 'hand') {
      if (this.currentTool === 'frame') {
        if (title) title.textContent = 'Frame Presets';
        if (badge) badge.textContent = 'Active Tool';
        container.innerHTML = `
          <div style="font-size: 11px; color: var(--text-dim); margin-bottom: 8px;">
            Choose a preset below to insert an artboard, or click and drag on the canvas.
          </div>
          ${this.renderDevicePresetsHTML()}
        `;
        this.bindDevicePresetListeners();
        return;
      }
      if (this.currentTool === 'arrow') {
        if (title) title.textContent = 'Arrow Tool';
        if (badge) badge.textContent = 'Active Tool';
        container.innerHTML = this.renderArrowToolStudio();
        this.bindArrowToolStudioListeners();
        return;
      }
      if (this.currentTool === 'line') {
        if (title) title.textContent = 'Line Tool';
        if (badge) badge.textContent = 'Active Tool';
        container.innerHTML = this.renderLineToolStudio();
        this.bindLineToolStudioListeners();
        return;
      }
      if (this.currentTool === 'pen') {
        if (title) title.textContent = 'Pen Tool';
        if (badge) badge.textContent = 'Active Tool';
        container.innerHTML = this.renderPenToolStudio();
        this.bindPenToolStudioListeners();
        return;
      }
      if (this.currentTool === 'pencil') {
        if (title) title.textContent = 'Pencil Tool';
        if (badge) badge.textContent = 'Active Tool';
        container.innerHTML = this.renderPencilToolStudio();
        this.bindPencilToolStudioListeners();
        return;
      }
      if (this.currentTool === 'text') {
        if (title) title.textContent = 'Text Tool';
        if (badge) badge.textContent = 'Active Tool';
        container.innerHTML = this.renderTextToolStudio();
        this.bindTextToolStudioListeners();
        return;
      }
      if (['rectangle', 'ellipse', 'star', 'polygon'].includes(this.currentTool)) {
        const toolName = this.currentTool.charAt(0).toUpperCase() + this.currentTool.slice(1);
        if (title) title.textContent = `${toolName} Tool`;
        if (badge) badge.textContent = 'Active Tool';
        container.innerHTML = this.renderShapeToolStudio(this.currentTool);
        this.bindShapeToolStudioListeners(this.currentTool);
        return;
      }
    }

    // 1. When Nothing is Selected: Canvas & Page Settings + Device Presets
    if (selectedIds.length === 0) {
      if (title) title.textContent = 'Page Canvas';
      const page = this.engine.getActivePage();
      const tokens = this.linter.getAllTokens();

      container.innerHTML = `
        <!-- Device & Frame Presets -->
        ${this.renderDevicePresetsHTML()}

        <!-- Canvas Background & Layout Grid Settings -->
        <div class="section-group">
          <div class="section-title">Canvas Settings</div>
          <div class="props-row">
            <div class="color-swatch-box" style="background: ${page.background || '#090d16'};" id="swatchPageBg" title="Click to choose background color"></div>
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

      const swatchPageBg = document.getElementById('swatchPageBg');
      if (swatchPageBg) {
        swatchPageBg.addEventListener('click', () => {
          this.colorPicker.open({
            anchorEl: swatchPageBg,
            color: page.background || '#090d16',
            palette: this.getDocumentColors(),
            onChange: (hex) => {
              page.background = hex;
              swatchPageBg.style.background = hex;
              const inp = document.getElementById('propPageBg');
              if (inp) inp.value = hex;
              this.renderer.render();
            },
            onCommit: (hex) => {
              page.background = hex;
              swatchPageBg.style.background = hex;
              const inp = document.getElementById('propPageBg');
              if (inp) inp.value = hex;
              this.renderer.render();
            }
          });
        });
      }

      document.getElementById('propPageBg')?.addEventListener('change', (e) => {
        page.background = e.target.value;
        const sw = document.getElementById('swatchPageBg');
        if (sw) sw.style.background = e.target.value;
        this.renderer.render();
      });

      document.getElementById('chkShowLayoutGrid')?.addEventListener('change', (e) => {
        this.renderer.showLayoutGrid = e.target.checked;
        this.renderer.render();
      });

      document.getElementById('btnInspBpDesktop')?.addEventListener('click', () => this.switchBreakpoint('desktop'));
      document.getElementById('btnInspBpTablet')?.addEventListener('click', () => this.switchBreakpoint('tablet'));
      document.getElementById('btnInspBpMobile')?.addEventListener('click', () => this.switchBreakpoint('mobile'));
      document.getElementById('btnInspAddToken')?.addEventListener('click', (e) => {
        const btn = e.currentTarget;
        this.colorPicker.open({
          anchorEl: btn,
          color: '#06b6d4',
          palette: this.getDocumentColors(),
          onCommit: (hex) => {
            if (!this.engine.doc.tokens) this.engine.doc.tokens = [{ id: 'set_1', name: 'Global', tokens: [] }];
            if (!this.engine.doc.tokens[0]) this.engine.doc.tokens[0] = { id: 'set_1', name: 'Global', tokens: [] };
            this.engine.doc.tokens[0].tokens.push({
              id: `token_${Date.now()}`,
              name: `Color / ${hex.toUpperCase()}`,
              type: 'color',
              value: hex
            });
            this.updateInspector();
          }
        });
      });
      this.bindDevicePresetListeners();
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
        <button class="btn-align-tool" id="inspTidyUp" title="Tidy Up (⬚)">⬚</button>
      </div>

      ${selectedIds.length > 1 ? `
      <!-- Multi-selection Actions -->
      <div style="display: flex; gap: 6px; padding: 4px 8px; margin-bottom: 8px;">
        <button class="btn-inspector-action" id="btnInspCombineVariants" style="font-size: 11px; flex: 1;">❖ Combine as Variants</button>
      </div>` : ''}

      <!-- Instance Section if selected node is an instance -->
      ${node.type === 'instance' ? (() => {
        const comp = this.doc.components?.[node.componentId] || (node.componentId && page.nodes[node.componentId]);
        const compName = comp?.name || 'Component';
        const variants = comp?.variants || [{ id: 'default', name: 'Default' }];
        const currentVarId = node.variantId || variants[0]?.id || 'default';
        return `
        <div class="section-group">
          <div class="section-title">
            <span>❖ Component Instance</span>
            <span style="font-size: 10px; color: var(--accent-blue);">${compName}</span>
          </div>
          <div class="props-row">
            <div class="prop-field">
              <span class="prop-label">Variant</span>
              <select class="prop-select" id="propInstanceVariant" style="font-size: 11px;">
                ${variants.map(v => `<option value="${v.id}" ${v.id === currentVarId ? 'selected' : ''}>${v.name}</option>`).join('')}
              </select>
            </div>
          </div>
          <div style="display: flex; gap: 6px; margin-top: 8px;">
            <button class="btn-inspector-action" id="btnResetOverrides" style="font-size: 11px; flex: 1;">Reset Overrides</button>
            <button class="btn-inspector-action" id="btnDetachInstance" style="font-size: 11px; flex: 1;">Detach</button>
          </div>
          <div style="margin-top: 6px;">
            <button class="btn-inspector-action" id="btnGoToMainComponent" style="font-size: 11px; width: 100%;">Go to Main Component ↗</button>
          </div>
        </div>`;
      })() : ''}

      <!-- Main Component Section if selected node is a component root -->
      ${(node.isComponent || node.type === 'component' || this.doc.components?.[node.id]) ? (() => {
        const compDef = this.doc.components?.[node.id];
        const variants = compDef?.variants || [{ id: 'default', name: 'Default' }];
        return `
        <div class="section-group">
          <div class="section-title">
            <span>❖ Main Component</span>
            <button class="btn-icon-xs" id="btnAddVariantBtn" title="Add Variant">＋</button>
          </div>
          <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 6px;">
            Variants: ${variants.map(v => v.name).join(', ')}
          </div>
          <button class="btn-inspector-action" id="btnInspAddVariant" style="font-size: 11px; width: 100%;">＋ Add Variant</button>
        </div>`;
      })() : ''}

      <!-- Section Container Settings -->
      ${node.type === 'section' ? `
      <div class="section-group">
        <div class="section-title">Section Settings</div>
        <div class="props-row">
          <div class="prop-field">
            <span class="prop-label">Title</span>
            <input type="text" class="prop-input" id="propSectionTitle" value="${node.sectionTitle || node.name}">
          </div>
        </div>
        <div class="props-row" style="margin-top: 6px;">
          <div class="prop-field">
            <span class="prop-label">Dev Status</span>
            <select class="prop-select" id="propSectionDevStatus" style="font-size: 11px;">
              <option value="none" ${!node.devStatus || node.devStatus === 'none' ? 'selected' : ''}>None</option>
              <option value="in_progress" ${node.devStatus === 'in_progress' ? 'selected' : ''}>In Progress</option>
              <option value="ready" ${node.devStatus === 'ready' ? 'selected' : ''}>Ready for Dev</option>
            </select>
          </div>
        </div>
      </div>` : ''}

      <!-- Frame Presets if selected node is a frame -->
      ${node.type === 'frame' ? `
      <div class="section-group">
        <div class="section-title">
          <span>📱 Frame Presets</span>
          <span style="font-size: 10px; color: var(--accent-blue);">${Math.round(t.width)} × ${Math.round(t.height)}</span>
        </div>
        ${this.renderDevicePresetsHTML(node)}
      </div>` : ''}

      <!-- 2. Transform Section (Position, Dimensions, Aspect Ratio Lock, Rotation, Corners) -->
      <div class="section-group">
        <div class="section-title">
          <span>Transform</span>
          <span style="font-size: 10px; color: var(--accent-blue); text-transform: lowercase;">${node.type}</span>
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

      <!-- Arrow & Line Studio if arrow or line node -->
      ${(node.type === 'arrow' || node.type === 'line') ? `
      <div class="section-group">
        <div class="section-title">
          <span>${node.type === 'arrow' ? '↗ Arrowhead & Vector' : '╱ Line'} Studio</span>
        </div>
        ${node.type === 'arrow' ? `
        <div class="props-row">
          <div class="prop-field">
            <span class="prop-label">Start Cap</span>
            <select class="prop-select" id="propArrowheadStart">
              <option value="none" ${(!node.arrowheadStart || node.arrowheadStart === 'none') ? 'selected' : ''}>None</option>
              <option value="triangle" ${node.arrowheadStart === 'triangle' ? 'selected' : ''}>Triangle ▶</option>
              <option value="stealth" ${node.arrowheadStart === 'stealth' ? 'selected' : ''}>Stealth ▷</option>
              <option value="circle" ${node.arrowheadStart === 'circle' ? 'selected' : ''}>Circle ●</option>
              <option value="square" ${node.arrowheadStart === 'square' ? 'selected' : ''}>Square ■</option>
              <option value="diamond" ${node.arrowheadStart === 'diamond' ? 'selected' : ''}>Diamond ◆</option>
            </select>
          </div>
          <div class="prop-field">
            <span class="prop-label">End Cap</span>
            <select class="prop-select" id="propArrowheadEnd">
              <option value="triangle" ${(node.arrowheadEnd === 'triangle' || !node.arrowheadEnd) ? 'selected' : ''}>Triangle ▶</option>
              <option value="stealth" ${node.arrowheadEnd === 'stealth' ? 'selected' : ''}>Stealth ▷</option>
              <option value="circle" ${node.arrowheadEnd === 'circle' ? 'selected' : ''}>Circle ●</option>
              <option value="square" ${node.arrowheadEnd === 'square' ? 'selected' : ''}>Square ■</option>
              <option value="diamond" ${node.arrowheadEnd === 'diamond' ? 'selected' : ''}>Diamond ◆</option>
              <option value="none" ${node.arrowheadEnd === 'none' ? 'selected' : ''}>None</option>
            </select>
          </div>
        </div>` : ''}
        <div class="props-row">
          <div class="prop-field">
            <span class="prop-label">Length</span>
            <input type="text" class="prop-input" id="propLineLength" value="${Math.round(t.width)}">
          </div>
          <div class="prop-field">
            <span class="prop-label">Angle</span>
            <input type="text" class="prop-input" id="propLineAngle" value="${Math.round(t.rotation || 0)}°">
          </div>
        </div>
      </div>` : ''}

      <!-- Star Geometry Settings if star node -->
      ${node.type === 'star' ? `
      <div class="section-group">
        <div class="section-title">
          <span>★ Star Geometry</span>
        </div>
        <div class="props-row">
          <div class="prop-field">
            <span class="prop-label">Points</span>
            <input type="number" class="prop-input" id="propStarPoints" value="${node.starPoints || 5}" min="3" max="32">
          </div>
          <div class="prop-field">
            <span class="prop-label">Ratio %</span>
            <input type="number" class="prop-input" id="propStarRatio" value="${Math.round((node.starRatio !== undefined ? node.starRatio : 0.45) * 100)}" min="10" max="90">
          </div>
        </div>
      </div>` : ''}

      <!-- Polygon Geometry Settings if polygon node -->
      ${node.type === 'polygon' ? `
      <div class="section-group">
        <div class="section-title">
          <span>⬡ Polygon Geometry</span>
        </div>
        <div class="props-row">
          <div class="prop-field">
            <span class="prop-label">Sides</span>
            <input type="number" class="prop-input" id="propPolygonSides" value="${node.polygonSides || 6}" min="3" max="24">
          </div>
        </div>
      </div>` : ''}

      <!-- Ellipse & Donut Settings if ellipse node -->
      ${node.type === 'ellipse' ? `
      <div class="section-group">
        <div class="section-title">
          <span>● Arc & Donut Studio</span>
        </div>
        <div class="props-row">
          <div class="prop-field">
            <span class="prop-label">Sweep ∠</span>
            <input type="number" class="prop-input" id="propArcSweep" value="${node.arcSweep !== undefined ? node.arcSweep : 360}" min="1" max="360">
          </div>
          <div class="prop-field">
            <span class="prop-label">Hole %</span>
            <input type="number" class="prop-input" id="propArcRatio" value="${Math.round((node.arcRatio || 0) * 100)}" min="0" max="90">
          </div>
        </div>
      </div>` : ''}

      <!-- Vector Path Studio if vector node -->
      ${node.type === 'vector' ? `
      <div class="section-group">
        <div class="section-title">
          <span>✒️ Vector Path Studio</span>
          <span style="font-size: 10px; color: var(--accent-blue);">${node.vectorPath ? node.vectorPath.length : 0} vertices</span>
        </div>
        <div class="props-row">
          <label style="display: flex; align-items: center; gap: 8px; font-size: 11px; color: var(--text-muted); cursor: pointer;">
            <input type="checkbox" id="chkVectorClosed" ${node.vectorPath?.some(c => c.type === 'Z') ? 'checked' : ''}>
            <span>Closed Shape (Enables Fills)</span>
          </label>
        </div>
      </div>` : ''}

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

        ${(() => {
          const parent = node.parentId ? page.nodes[node.parentId] : null;
          if (parent && parent.layout && parent.layout.mode && parent.layout.mode !== 'none') {
            return `
            <div class="props-row" style="margin-top: 6px; padding: 6px 8px; background: var(--bg-surface); border-radius: 4px;">
              <label style="display: flex; align-items: center; gap: 8px; font-size: 11px; color: var(--text-muted); cursor: pointer;">
                <input type="checkbox" id="chkIgnoreAutoLayout" ${node.layout?.ignoreAutoLayout ? 'checked' : ''}>
                <span>Ignore Auto Layout (Absolute Position)</span>
              </label>
            </div>`;
          }
          return '';
        })()}
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
        <div class="props-row" style="margin-top: 6px;">
          <label style="display: flex; align-items: center; gap: 8px; font-size: 11px; color: var(--text-muted); cursor: pointer;">
            <input type="checkbox" id="chkUseAsMask" ${node.isMask ? 'checked' : ''}>
            <span>Use as Mask</span>
          </label>
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
          <div class="color-swatch-box fill-swatch-box" data-index="${idx}" style="background: ${f.color || '#334155'};" id="swatchFill_${idx}" title="Click to open color picker"></div>
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
        <div class="props-row" style="margin-bottom: 6px;">
          <div class="color-swatch-box stroke-swatch-box" data-index="${idx}" style="background: ${st.color || '#3b82f6'};" id="swatchStroke_${idx}" title="Click to open color picker"></div>
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

      <!-- 8. Comprehensive Word + Figma Typography Studio if text node -->
      ${isText ? `
      <div class="section-group">
        <div class="section-title">
          <span>Typography Studio</span>
          <span style="font-size: 10px; color: var(--accent-blue);">Word & Figma Parity</span>
        </div>

        <!-- Word Quick Style Presets Chips -->
        <div class="typography-presets-bar">
          <button class="typo-preset-chip" data-preset="display" title="Display Hero (40px Bold)">Display</button>
          <button class="typo-preset-chip" data-preset="h1" title="Heading 1 (32px Bold)">H1</button>
          <button class="typo-preset-chip" data-preset="h2" title="Heading 2 (24px Semibold)">H2</button>
          <button class="typo-preset-chip" data-preset="h3" title="Heading 3 (18px Semibold)">H3</button>
          <button class="typo-preset-chip" data-preset="body" title="Body Text (14px Regular)">Body</button>
          <button class="typo-preset-chip" data-preset="caption" title="Caption (11px Regular)">Caption</button>
          <button class="typo-preset-chip" data-preset="code" title="Monospace Code (13px Mono)">Code</button>
        </div>

        <!-- Font Family & Weight -->
        <div class="props-row">
          <div class="prop-field">
            <select class="prop-select" id="propFontFamily">
              <optgroup label="Modern Sans (Web / Google Fonts)">
                <option value="'Inter', sans-serif" ${node.text?.fontFamily?.includes('Inter') || !node.text?.fontFamily ? 'selected' : ''}>Inter</option>
                <option value="'Outfit', sans-serif" ${node.text?.fontFamily?.includes('Outfit') ? 'selected' : ''}>Outfit</option>
                <option value="'Roboto', sans-serif" ${node.text?.fontFamily?.includes('Roboto') ? 'selected' : ''}>Roboto</option>
                <option value="'Poppins', sans-serif" ${node.text?.fontFamily?.includes('Poppins') ? 'selected' : ''}>Poppins</option>
                <option value="'Montserrat', sans-serif" ${node.text?.fontFamily?.includes('Montserrat') ? 'selected' : ''}>Montserrat</option>
                <option value="'Open Sans', sans-serif" ${node.text?.fontFamily?.includes('Open Sans') ? 'selected' : ''}>Open Sans</option>
                <option value="'Lato', sans-serif" ${node.text?.fontFamily?.includes('Lato') ? 'selected' : ''}>Lato</option>
              </optgroup>
              <optgroup label="System / Native Fonts">
                <option value="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" ${node.text?.fontFamily?.includes('system-ui') ? 'selected' : ''}>System Default</option>
                <option value="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', sans-serif" ${node.text?.fontFamily?.includes('SF Pro') || node.text?.fontFamily?.includes('-apple-system') ? 'selected' : ''}>Apple SF Pro</option>
                <option value="'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" ${node.text?.fontFamily?.includes('Segoe UI') ? 'selected' : ''}>Segoe UI (Windows)</option>
                <option value="'Helvetica Neue', Helvetica, Arial, sans-serif" ${node.text?.fontFamily?.includes('Helvetica') ? 'selected' : ''}>Helvetica Neue</option>
                <option value="Arial, sans-serif" ${node.text?.fontFamily === 'Arial, sans-serif' ? 'selected' : ''}>Arial</option>
                <option value="Georgia, serif" ${node.text?.fontFamily?.includes('Georgia') ? 'selected' : ''}>Georgia</option>
                <option value="'Times New Roman', Times, serif" ${node.text?.fontFamily?.includes('Times') ? 'selected' : ''}>Times New Roman</option>
                <option value="Menlo, Monaco, Consolas, monospace" ${node.text?.fontFamily?.includes('Menlo') ? 'selected' : ''}>Menlo / Monaco</option>
              </optgroup>
              <optgroup label="Monospace & Code">
                <option value="'JetBrains Mono', monospace" ${node.text?.fontFamily?.includes('JetBrains Mono') ? 'selected' : ''}>JetBrains Mono</option>
                <option value="'Fira Code', monospace" ${node.text?.fontFamily?.includes('Fira Code') ? 'selected' : ''}>Fira Code</option>
                <option value="'Source Code Pro', monospace" ${node.text?.fontFamily?.includes('Source Code Pro') ? 'selected' : ''}>Source Code Pro</option>
                <option value="'Courier New', Courier, monospace" ${node.text?.fontFamily?.includes('Courier') ? 'selected' : ''}>Courier New</option>
              </optgroup>
              <optgroup label="Serif & Editorial">
                <option value="'Playfair Display', serif" ${node.text?.fontFamily?.includes('Playfair') ? 'selected' : ''}>Playfair Display</option>
                <option value="'Merriweather', serif" ${node.text?.fontFamily?.includes('Merriweather') ? 'selected' : ''}>Merriweather</option>
                <option value="'Lora', serif" ${node.text?.fontFamily?.includes('Lora') ? 'selected' : ''}>Lora</option>
              </optgroup>
            </select>
          </div>
          <div class="prop-field">
            <select class="prop-select" id="propFontWeight">
              <option value="300" ${node.text?.fontWeight === '300' ? 'selected' : ''}>Light (300)</option>
              <option value="400" ${node.text?.fontWeight === '400' || !node.text?.fontWeight ? 'selected' : ''}>Regular (400)</option>
              <option value="500" ${node.text?.fontWeight === '500' ? 'selected' : ''}>Medium (500)</option>
              <option value="600" ${node.text?.fontWeight === '600' ? 'selected' : ''}>Semibold (600)</option>
              <option value="700" ${node.text?.fontWeight === '700' ? 'selected' : ''}>Bold (700)</option>
              <option value="800" ${node.text?.fontWeight === '800' ? 'selected' : ''}>Extra Bold (800)</option>
              <option value="900" ${node.text?.fontWeight === '900' ? 'selected' : ''}>Black (900)</option>
            </select>
          </div>
        </div>

        <!-- Size, Line Height & Letter Spacing -->
        <div class="props-row">
          <div class="prop-field">
            <span class="prop-label scrubbable" id="lblFontSize">Size</span>
            <input type="text" class="prop-input" id="propFontSize" value="${node.text?.fontSize || 16}">
          </div>
          <div class="prop-field">
            <span class="prop-label scrubbable" id="lblLineHeight">LH</span>
            <input type="text" class="prop-input" id="propLineHeight" value="${node.text?.lineHeight || 'Auto'}" placeholder="Auto">
          </div>
          <div class="prop-field">
            <span class="prop-label scrubbable" id="lblLetterSpacing">LS</span>
            <input type="text" class="prop-input" id="propLetterSpacing" value="${node.text?.letterSpacing || 0}" placeholder="0px">
          </div>
        </div>

        <!-- Word Style Formatting Action Bar (B, I, U, S) & Text Case -->
        <div class="props-row">
          <div class="text-formatting-toolbar">
            <button class="btn-format-toggle ${node.text?.fontWeight === '700' || node.text?.fontWeight === '800' ? 'active' : ''}" id="btnFormatBold" title="Bold (⌘B)"><b>B</b></button>
            <button class="btn-format-toggle ${node.text?.fontStyle === 'italic' ? 'active' : ''}" id="btnFormatItalic" title="Italic (⌘I)"><i>I</i></button>
            <button class="btn-format-toggle ${node.text?.textDecoration?.includes('underline') ? 'active' : ''}" id="btnFormatUnderline" title="Underline (⌘U)"><u>U</u></button>
            <button class="btn-format-toggle ${node.text?.textDecoration?.includes('line-through') || node.text?.textDecoration?.includes('strikethrough') ? 'active' : ''}" id="btnFormatStrike" title="Strikethrough"><s>S</s></button>
            <div class="shelf-divider" style="height: 14px;"></div>
            <button class="btn-case-toggle ${node.text?.textCase === 'uppercase' ? 'active' : ''}" id="btnCaseUpper" title="Uppercase">TT</button>
            <button class="btn-case-toggle ${node.text?.textCase === 'lowercase' ? 'active' : ''}" id="btnCaseLower" title="Lowercase">tt</button>
            <button class="btn-case-toggle ${node.text?.textCase === 'capitalize' ? 'active' : ''}" id="btnCaseTitle" title="Title Case">Tt</button>
            <button class="btn-case-toggle ${!node.text?.textCase || node.text?.textCase === 'none' ? 'active' : ''}" id="btnCaseNormal" title="As Typed">Tᴛ</button>
          </div>
        </div>

        <!-- Alignments (Horizontal & Vertical) -->
        <div class="props-row">
          <div class="sizing-pill-selector" style="width: 100%;">
            <button class="sizing-pill-btn ${node.text?.textAlign === 'left' || !node.text?.textAlign ? 'active' : ''}" id="btnAlignLeft" title="Align Left">Left</button>
            <button class="sizing-pill-btn ${node.text?.textAlign === 'center' ? 'active' : ''}" id="btnAlignCenter" title="Align Center">Center</button>
            <button class="sizing-pill-btn ${node.text?.textAlign === 'right' ? 'active' : ''}" id="btnAlignRight" title="Align Right">Right</button>
            <button class="sizing-pill-btn ${node.text?.textAlign === 'justify' ? 'active' : ''}" id="btnAlignJustify" title="Justify">Justify</button>
          </div>
        </div>
        <div class="props-row" style="margin-top: 4px;">
          <div class="sizing-pill-selector" style="width: 100%;">
            <button class="sizing-pill-btn ${node.text?.verticalAlign === 'top' || !node.text?.verticalAlign ? 'active' : ''}" id="btnVAlignTop" title="Align Top">⤊ Top</button>
            <button class="sizing-pill-btn ${node.text?.verticalAlign === 'middle' ? 'active' : ''}" id="btnVAlignMiddle" title="Align Middle">↕ Middle</button>
            <button class="sizing-pill-btn ${node.text?.verticalAlign === 'bottom' ? 'active' : ''}" id="btnVAlignBottom" title="Align Bottom">⤋ Bottom</button>
          </div>
        </div>

        <!-- Text Box Auto-Sizing (Figma Parity) -->
        <div class="props-row" style="margin-top: 4px;">
          <div class="sizing-pill-selector" style="width: 100%;">
            <button class="sizing-pill-btn ${node.text?.autoResize === 'auto-width' || !node.text?.autoResize ? 'active' : ''}" id="btnTextAutoW" title="Auto Width">↔ Auto W</button>
            <button class="sizing-pill-btn ${node.text?.autoResize === 'auto-height' ? 'active' : ''}" id="btnTextAutoH" title="Auto Height">↕ Auto H</button>
            <button class="sizing-pill-btn ${node.text?.autoResize === 'fixed' ? 'active' : ''}" id="btnTextFixed" title="Fixed Size">⛶ Fixed</button>
          </div>
        </div>

        <!-- Color & Swatch -->
        <div class="props-row" style="margin-top: 6px;">
          <div class="color-swatch-box" id="swatchTextColor" style="background: ${node.text?.color || '#f8fafc'};" title="Text Color"></div>
          <div class="prop-field">
            <span class="prop-label">Color</span>
            <input type="text" class="prop-input" id="propTextColor" value="${node.text?.color || '#f8fafc'}">
          </div>
        </div>

        <!-- Live Content Editor -->
        <div class="props-row" style="margin-top: 6px;">
          <textarea class="prop-input" id="propTextContent" rows="3" placeholder="Type text here..." style="padding: 6px; width: 100%; border-radius: 4px; border: 1px solid var(--border-subtle);">${node.text?.content || ''}</textarea>
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
              <div class="color-swatch-box recolor-swatch-box" data-hex="${sc.hex}" style="background: ${sc.hex}; width: 16px; height: 16px; cursor: pointer;" title="Change color ${sc.hex}"></div>
              <span style="font-family: 'JetBrains Mono', monospace; font-size: 11px;">${sc.hex}</span>
              <span style="color: var(--text-dim); font-size: 10px;">×${sc.count}</span>
            </div>
            <button class="menu-dropdown-btn-sm btn-recolor-hex" data-hex="${sc.hex}">Change</button>
          </div>
          `).join('')}
        </div>
      </div>` : ''}

      <!-- 10. Data Suppliers (Official Sketch Resources) -->
      <div class="section-group">
        <div class="section-title">
          <span>⚡ Data Suppliers</span>
          <span style="font-size: 10px; color: var(--accent-blue);">Sketch Data</span>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 6px;">
          <button class="btn-inspector-action" id="btnInspDataFaces" title="Apply avatar portrait fill from 125 Sketch real faces">👤 Avatar Photo</button>
          <button class="btn-inspector-action" id="btnInspDataTiles" title="Apply texture pattern tile from 18 Sketch 1024x1024 tiles">🧱 Tile Texture</button>
          <button class="btn-inspector-action" id="btnInspDataNames" title="Fill with human name from 605 Sketch names">📝 Human Name</button>
          <button class="btn-inspector-action" id="btnInspDataCities" title="Fill with world city from 251 Sketch cities">🌍 World City</button>
        </div>
        <button class="btn-inspector-action" id="btnInspDataProfile" style="width: 100%; font-size: 11px;" title="Insert complete Sketch User Profile Auto-Layout Card">💳 Insert User Profile Card</button>
      </div>

      <!-- 11. Export Settings in Design Tab -->
      <div class="section-group">
        <div class="section-title">Export</div>
        <div style="display: flex; gap: 6px;">
          <button class="btn-inspector-action" id="btnExportSelectionPng" style="font-size: 11px; flex: 1;">PNG (1x)</button>
          <button class="btn-inspector-action" id="btnExportSelectionSvg" style="font-size: 11px; flex: 1;">SVG</button>
        </div>
      </div>
    `;

    // 0. Frame Preset Listeners if node is a frame
    if (node.type === 'frame') {
      this.bindDevicePresetListeners(node);
    }

    // 1. Top Alignment Bar
    document.getElementById('inspAlignLeft')?.addEventListener('click', () => this.alignSelected('left'));
    document.getElementById('inspAlignHCenter')?.addEventListener('click', () => this.alignSelected('center'));
    document.getElementById('inspAlignRight')?.addEventListener('click', () => this.alignSelected('right'));
    document.getElementById('inspAlignTop')?.addEventListener('click', () => this.alignSelected('top'));
    document.getElementById('inspAlignVCenter')?.addEventListener('click', () => this.alignSelected('middle'));
    document.getElementById('inspAlignBottom')?.addEventListener('click', () => this.alignSelected('bottom'));
    document.getElementById('inspDistH')?.addEventListener('click', () => this.distributeSelected('horizontal'));
    document.getElementById('inspDistV')?.addEventListener('click', () => this.distributeSelected('vertical'));
    document.getElementById('inspTidyUp')?.addEventListener('click', () => {
      this.engine.tidyUp(selectedIds);
      this.renderer.render();
      this.updateInspector();
    });

    // Multi-selection Combine Variants
    document.getElementById('btnInspCombineVariants')?.addEventListener('click', () => {
      const cName = prompt('Enter Component Set Name:', 'Component');
      if (cName) {
        this.engine.combineAsVariants(selectedIds, cName);
        this.renderer.render();
        this.updateInspector();
      }
    });

    // Instance controls
    document.getElementById('propInstanceVariant')?.addEventListener('change', (e) => {
      this.engine.setInstanceVariant(node.id, e.target.value);
      this.renderer.render();
      this.updateInspector();
    });
    document.getElementById('btnResetOverrides')?.addEventListener('click', () => {
      this.engine.resetOverrides(node.id);
      this.renderer.render();
      this.updateInspector();
    });
    document.getElementById('btnDetachInstance')?.addEventListener('click', () => {
      this.engine.detachInstance(node.id);
      this.renderer.render();
      this.updateInspector();
    });
    document.getElementById('btnGoToMainComponent')?.addEventListener('click', () => {
      if (node.componentId) {
        this.engine.select(node.componentId);
        this.renderer.render();
        this.updateInspector();
      }
    });

    // Main Component controls
    const handleAddVar = () => {
      const varName = prompt('Enter Variant Name (e.g. Hover, Pressed):', 'Hover');
      if (varName) {
        this.engine.addComponentVariant(node.id, varName, { style: { fills: [{ type: 'solid', color: '#1d4ed8' }] } });
        this.renderer.render();
        this.updateInspector();
      }
    };
    document.getElementById('btnAddVariantBtn')?.addEventListener('click', handleAddVar);
    document.getElementById('btnInspAddVariant')?.addEventListener('click', handleAddVar);

    // Section controls
    document.getElementById('propSectionTitle')?.addEventListener('change', (e) => {
      this.engine.updateNode(node.id, { sectionTitle: e.target.value.trim() }, 'Change Section Title');
    });
    document.getElementById('propSectionDevStatus')?.addEventListener('change', (e) => {
      this.engine.updateNode(node.id, { devStatus: e.target.value }, 'Change Dev Status');
    });

    // Mask & Ignore Auto Layout
    document.getElementById('chkUseAsMask')?.addEventListener('change', (e) => {
      this.engine.updateNode(node.id, { isMask: e.target.checked }, 'Toggle Mask');
      this.renderer.render();
    });
    document.getElementById('chkIgnoreAutoLayout')?.addEventListener('change', (e) => {
      this.engine.updateNode(node.id, { layout: { ignoreAutoLayout: e.target.checked } }, 'Toggle Ignore Auto Layout');
      this.renderer.render();
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

    // Arrow & Line Studio Listeners
    document.getElementById('propArrowheadStart')?.addEventListener('change', (e) => {
      this.engine.updateNode(node.id, { arrowheadStart: e.target.value, arrowStart: e.target.value }, 'Change Arrowhead Start');
      this.renderer.render();
    });
    document.getElementById('propArrowheadEnd')?.addEventListener('change', (e) => {
      this.engine.updateNode(node.id, { arrowheadEnd: e.target.value, arrowEnd: e.target.value }, 'Change Arrowhead End');
      this.renderer.render();
    });
    document.getElementById('propLineLength')?.addEventListener('change', (e) => {
      const len = Math.max(2, parseFloat(e.target.value) || t.width);
      this.engine.updateNode(node.id, { transform: { width: len } }, 'Change Line Length');
      this.renderer.render();
    });
    document.getElementById('propLineAngle')?.addEventListener('change', (e) => {
      const deg = parseFloat(e.target.value) || 0;
      this.engine.updateNode(node.id, { transform: { rotation: deg } }, 'Change Line Angle');
      this.renderer.render();
    });

    // Star Studio Listeners
    document.getElementById('propStarPoints')?.addEventListener('change', (e) => {
      const pts = Math.max(3, parseInt(e.target.value, 10) || 5);
      this.engine.updateNode(node.id, { starPoints: pts }, 'Change Star Points');
      this.renderer.render();
    });
    document.getElementById('propStarRatio')?.addEventListener('change', (e) => {
      const ratio = Math.max(0.1, Math.min(0.9, (parseFloat(e.target.value) || 45) / 100));
      this.engine.updateNode(node.id, { starRatio: ratio }, 'Change Star Ratio');
      this.renderer.render();
    });

    // Polygon Studio Listeners
    document.getElementById('propPolygonSides')?.addEventListener('change', (e) => {
      const sides = Math.max(3, parseInt(e.target.value, 10) || 6);
      this.engine.updateNode(node.id, { polygonSides: sides }, 'Change Polygon Sides');
      this.renderer.render();
    });

    // Ellipse & Donut Studio Listeners
    document.getElementById('propArcSweep')?.addEventListener('change', (e) => {
      const sweep = Math.max(1, Math.min(360, parseFloat(e.target.value) || 360));
      this.engine.updateNode(node.id, { arcSweep: sweep }, 'Change Arc Sweep');
      this.renderer.render();
    });
    document.getElementById('propArcRatio')?.addEventListener('change', (e) => {
      const ratio = Math.max(0, Math.min(0.9, (parseFloat(e.target.value) || 0) / 100));
      this.engine.updateNode(node.id, { arcRatio: ratio }, 'Change Donut Ratio');
      this.renderer.render();
    });

    // Vector Path Closed Toggle Listener
    document.getElementById('chkVectorClosed')?.addEventListener('change', (e) => {
      if (!Array.isArray(node.vectorPath)) return;
      const curPath = JSON.parse(JSON.stringify(node.vectorPath));
      const hasZ = curPath.some(c => c.type === 'Z');
      if (e.target.checked && !hasZ) {
        curPath.push({ type: 'Z' });
      } else if (!e.target.checked && hasZ) {
        const zIdx = curPath.findIndex(c => c.type === 'Z');
        if (zIdx !== -1) curPath.splice(zIdx, 1);
      }
      this.engine.updateNode(node.id, { vectorPath: curPath }, 'Toggle Vector Path Closed');
      this.renderer.render();
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
      this.updateInspector();
    });

    document.querySelectorAll('.fill-swatch-box').forEach(swatch => {
      swatch.addEventListener('click', () => {
        const idx = parseInt(swatch.dataset.index, 10);
        const curFills = JSON.parse(JSON.stringify(s.fills || []));
        if (!curFills[idx]) return;
        this.colorPicker.open({
          anchorEl: swatch,
          color: curFills[idx].color || '#334155',
          palette: this.getDocumentColors(),
          onChange: (hex) => {
            curFills[idx].color = hex;
            swatch.style.background = hex;
            const inp = document.querySelector(`.fill-hex-input[data-index="${idx}"]`);
            if (inp) inp.value = hex;
            if (node.style?.fills?.[idx]) {
              node.style.fills[idx].color = hex;
              this.renderer.render();
            }
          },
          onCommit: (hex) => {
            curFills[idx].color = hex;
            this.engine.updateNode(node.id, { style: { fills: curFills } }, 'Change Fill Color');
            this.renderer.render();
            this.updateInspector();
          }
        });
      });
    });

    document.querySelectorAll('.fill-hex-input').forEach(inp => {
      inp.addEventListener('change', (e) => {
        const idx = parseInt(inp.dataset.index, 10);
        const curFills = JSON.parse(JSON.stringify(s.fills || []));
        if (curFills[idx]) {
          curFills[idx].color = e.target.value;
          this.engine.updateNode(node.id, { style: { fills: curFills } }, 'Change Fill Color');
          this.updateInspector();
        }
      });
    });
    document.querySelectorAll('.btn-remove-fill').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index, 10);
        const curFills = JSON.parse(JSON.stringify(s.fills || []));
        curFills.splice(idx, 1);
        this.engine.updateNode(node.id, { style: { fills: curFills } }, 'Remove Fill');
        this.updateInspector();
      });
    });
    document.querySelectorAll('.btn-bind-token').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index, 10);
        const vars = this.engine.doc.variables || {};
        const varList = Object.values(vars);
        const colorTokens = this.linter.getAllTokens().filter(t => t.type === 'color');

        const items = [];
        let promptText = 'Select Variable or Design Token to bind:\n';
        for (const v of varList) {
          items.push({ kind: 'var', item: v });
          promptText += `${items.length}. [Variable] ${v.name} (${v.value})\n`;
        }
        for (const t of colorTokens) {
          items.push({ kind: 'token', item: t });
          promptText += `${items.length}. [Token] ${t.name} (${t.value})\n`;
        }
        promptText += 'Enter number:';

        const chosen = prompt(promptText);
        if (chosen) {
          const cIdx = parseInt(chosen, 10) - 1;
          const selected = items[cIdx];
          if (selected) {
            if (selected.kind === 'var') {
              this.engine.bindVariable(node.id, `style.fills[${idx}].color`, selected.item.id);
            } else {
              const curFills = JSON.parse(JSON.stringify(s.fills || []));
              if (curFills[idx]) {
                curFills[idx].color = selected.item.value;
                curFills[idx].tokenId = selected.item.id;
                curFills[idx].tokenName = selected.item.name;
                this.engine.updateNode(node.id, { style: { fills: curFills } }, 'Bind Fill to Token');
              }
            }
            this.renderer.render();
            this.updateInspector();
          }
        }
      });
    });

    // 6. Strokes
    document.getElementById('btnAddStroke')?.addEventListener('click', () => {
      const curStrokes = JSON.parse(JSON.stringify(s.strokes || []));
      curStrokes.push({ color: '#38bdf8', width: 1, align: 'inside' });
      this.engine.updateNode(node.id, { style: { strokes: curStrokes } }, 'Add Stroke');
      this.updateInspector();
    });

    document.querySelectorAll('.stroke-swatch-box').forEach(swatch => {
      swatch.addEventListener('click', () => {
        const idx = parseInt(swatch.dataset.index, 10);
        const curStrokes = JSON.parse(JSON.stringify(s.strokes || []));
        if (!curStrokes[idx]) return;
        this.colorPicker.open({
          anchorEl: swatch,
          color: curStrokes[idx].color || '#38bdf8',
          palette: this.getDocumentColors(),
          onChange: (hex) => {
            curStrokes[idx].color = hex;
            swatch.style.background = hex;
            const inp = document.querySelector(`.stroke-hex-input[data-index="${idx}"]`);
            if (inp) inp.value = hex;
            if (node.style?.strokes?.[idx]) {
              node.style.strokes[idx].color = hex;
              this.renderer.render();
            }
          },
          onCommit: (hex) => {
            curStrokes[idx].color = hex;
            this.engine.updateNode(node.id, { style: { strokes: curStrokes } }, 'Change Stroke Color');
            this.renderer.render();
            this.updateInspector();
          }
        });
      });
    });

    document.querySelectorAll('.stroke-hex-input').forEach(inp => {
      inp.addEventListener('change', (e) => {
        const idx = parseInt(inp.dataset.index, 10);
        const curStrokes = JSON.parse(JSON.stringify(s.strokes || []));
        if (curStrokes[idx]) {
          curStrokes[idx].color = e.target.value;
          this.engine.updateNode(node.id, { style: { strokes: curStrokes } }, 'Change Stroke Color');
          this.updateInspector();
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
        this.updateInspector();
      });
    });

    // 7. Effects
    document.getElementById('btnAddEffect')?.addEventListener('click', () => {
      const curEffects = JSON.parse(JSON.stringify(s.shadows || []));
      curEffects.push({ type: 'drop-shadow', x: 0, y: 4, blur: 12, color: 'rgba(0,0,0,0.35)' });
      this.engine.updateNode(node.id, { style: { shadows: curEffects } }, 'Add Shadow Effect');
      this.updateInspector();
    });
    document.querySelectorAll('.btn-remove-effect').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index, 10);
        const curEffects = JSON.parse(JSON.stringify(s.shadows || []));
        curEffects.splice(idx, 1);
        this.engine.updateNode(node.id, { style: { shadows: curEffects } }, 'Remove Effect');
        this.updateInspector();
      });
    });

    // 8. Typography Studio Listeners (Word & Figma Parity)
    document.querySelectorAll('.typo-preset-chip[data-preset]').forEach(chip => {
      chip.addEventListener('click', () => {
        const p = chip.dataset.preset;
        const presets = {
          display: { fontSize: 40, fontWeight: '800', lineHeight: 1.15, letterSpacing: -0.5 },
          h1: { fontSize: 32, fontWeight: '700', lineHeight: 1.2, letterSpacing: -0.3 },
          h2: { fontSize: 24, fontWeight: '600', lineHeight: 1.25, letterSpacing: 0 },
          h3: { fontSize: 18, fontWeight: '600', lineHeight: 1.3, letterSpacing: 0 },
          body: { fontSize: 14, fontWeight: '400', lineHeight: 1.45, letterSpacing: 0 },
          caption: { fontSize: 11, fontWeight: '400', lineHeight: 1.4, letterSpacing: 0.2 },
          code: { fontSize: 13, fontWeight: '500', fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.4, letterSpacing: 0 }
        };
        const cfg = presets[p];
        if (cfg) {
          this.engine.updateNode(node.id, { text: cfg }, `Apply Typography Preset ${p}`);
          this.renderer.render();
          this.updateInspector();
        }
      });
    });

    document.getElementById('propFontFamily')?.addEventListener('change', (e) => {
      this.engine.updateNode(node.id, { text: { fontFamily: e.target.value } }, 'Change Font Family');
      this.renderer.render();
    });
    this.makeScrubbable(document.getElementById('lblFontSize'), (delta) => {
      const curSize = node.text?.fontSize || 16;
      this.engine.updateNode(node.id, { text: { fontSize: Math.max(6, curSize + delta) } }, 'Scrub Font Size');
    });
    document.getElementById('propFontSize')?.addEventListener('change', (e) => {
      this.engine.updateNode(node.id, { text: { fontSize: this.evalExpr(e.target.value, 16) } }, 'Change Font Size');
    });
    document.getElementById('propFontWeight')?.addEventListener('change', (e) => {
      this.engine.updateNode(node.id, { text: { fontWeight: e.target.value } }, 'Change Font Weight');
    });

    const swatchTextColor = document.getElementById('swatchTextColor');
    if (swatchTextColor) {
      swatchTextColor.addEventListener('click', () => {
        this.colorPicker.open({
          anchorEl: swatchTextColor,
          color: node.text?.color || '#f8fafc',
          palette: this.getDocumentColors(),
          onChange: (hex) => {
            swatchTextColor.style.background = hex;
            const inp = document.getElementById('propTextColor');
            if (inp) inp.value = hex;
            if (node.text) {
              node.text.color = hex;
              this.renderer.render();
            }
          },
          onCommit: (hex) => {
            this.engine.updateNode(node.id, { text: { color: hex } }, 'Change Text Color');
            this.renderer.render();
            this.updateInspector();
          }
        });
      });
    }
    document.getElementById('propTextColor')?.addEventListener('change', (e) => {
      this.engine.updateNode(node.id, { text: { color: e.target.value } }, 'Change Text Color');
      const swatch = document.getElementById('swatchTextColor');
      if (swatch) swatch.style.background = e.target.value;
    });

    this.makeScrubbable(document.getElementById('lblLineHeight'), (delta) => {
      const curLh = typeof node.text?.lineHeight === 'number' ? node.text.lineHeight : 1.3;
      const next = Math.max(0.5, Math.round((curLh + delta * 0.05) * 10) / 10);
      this.engine.updateNode(node.id, { text: { lineHeight: next } }, 'Scrub Line Height');
    });
    document.getElementById('propLineHeight')?.addEventListener('change', (e) => {
      const val = parseFloat(e.target.value);
      this.engine.updateNode(node.id, { text: { lineHeight: isNaN(val) ? 1.3 : val } }, 'Change Line Height');
    });

    this.makeScrubbable(document.getElementById('lblLetterSpacing'), (delta) => {
      const curLs = typeof node.text?.letterSpacing === 'number' ? node.text.letterSpacing : 0;
      const next = Math.round((curLs + delta * 0.2) * 10) / 10;
      this.engine.updateNode(node.id, { text: { letterSpacing: next } }, 'Scrub Letter Spacing');
    });
    document.getElementById('propLetterSpacing')?.addEventListener('change', (e) => {
      const val = parseFloat(e.target.value);
      this.engine.updateNode(node.id, { text: { letterSpacing: isNaN(val) ? 0 : val } }, 'Change Letter Spacing');
    });

    // Word Style Formatting Buttons (B, I, U, S)
    document.getElementById('btnFormatBold')?.addEventListener('click', () => {
      const isBold = node.text?.fontWeight === '700' || node.text?.fontWeight === '800';
      this.engine.updateNode(node.id, { text: { fontWeight: isBold ? '400' : '700' } }, 'Toggle Bold');
      this.renderer.render();
      this.updateInspector();
    });
    document.getElementById('btnFormatItalic')?.addEventListener('click', () => {
      const isItalic = node.text?.fontStyle === 'italic';
      this.engine.updateNode(node.id, { text: { fontStyle: isItalic ? 'normal' : 'italic' } }, 'Toggle Italic');
      this.renderer.render();
      this.updateInspector();
    });
    document.getElementById('btnFormatUnderline')?.addEventListener('click', () => {
      const isUnder = node.text?.textDecoration?.includes('underline');
      this.engine.updateNode(node.id, { text: { textDecoration: isUnder ? 'none' : 'underline' } }, 'Toggle Underline');
      this.renderer.render();
      this.updateInspector();
    });
    document.getElementById('btnFormatStrike')?.addEventListener('click', () => {
      const isStrike = node.text?.textDecoration?.includes('line-through') || node.text?.textDecoration?.includes('strikethrough');
      this.engine.updateNode(node.id, { text: { textDecoration: isStrike ? 'none' : 'line-through' } }, 'Toggle Strikethrough');
      this.renderer.render();
      this.updateInspector();
    });

    // Letter Casing Buttons
    document.getElementById('btnCaseUpper')?.addEventListener('click', () => {
      this.engine.updateNode(node.id, { text: { textCase: 'uppercase' } }, 'Set Uppercase');
      this.renderer.render();
      this.updateInspector();
    });
    document.getElementById('btnCaseLower')?.addEventListener('click', () => {
      this.engine.updateNode(node.id, { text: { textCase: 'lowercase' } }, 'Set Lowercase');
      this.renderer.render();
      this.updateInspector();
    });
    document.getElementById('btnCaseTitle')?.addEventListener('click', () => {
      this.engine.updateNode(node.id, { text: { textCase: 'capitalize' } }, 'Set Title Case');
      this.renderer.render();
      this.updateInspector();
    });
    document.getElementById('btnCaseNormal')?.addEventListener('click', () => {
      this.engine.updateNode(node.id, { text: { textCase: 'none' } }, 'Set Normal Case');
      this.renderer.render();
      this.updateInspector();
    });

    // Alignments (Horizontal & Vertical)
    document.getElementById('btnAlignLeft')?.addEventListener('click', () => {
      this.engine.updateNode(node.id, { text: { textAlign: 'left' } }, 'Align Text Left');
    });
    document.getElementById('btnAlignCenter')?.addEventListener('click', () => {
      this.engine.updateNode(node.id, { text: { textAlign: 'center' } }, 'Align Text Center');
    });
    document.getElementById('btnAlignRight')?.addEventListener('click', () => {
      this.engine.updateNode(node.id, { text: { textAlign: 'right' } }, 'Align Text Right');
    });
    document.getElementById('btnAlignJustify')?.addEventListener('click', () => {
      this.engine.updateNode(node.id, { text: { textAlign: 'justify' } }, 'Align Text Justify');
    });

    document.getElementById('btnVAlignTop')?.addEventListener('click', () => {
      this.engine.updateNode(node.id, { text: { verticalAlign: 'top' } }, 'Align Vertical Top');
      this.renderer.render();
      this.updateInspector();
    });
    document.getElementById('btnVAlignMiddle')?.addEventListener('click', () => {
      this.engine.updateNode(node.id, { text: { verticalAlign: 'middle' } }, 'Align Vertical Middle');
      this.renderer.render();
      this.updateInspector();
    });
    document.getElementById('btnVAlignBottom')?.addEventListener('click', () => {
      this.engine.updateNode(node.id, { text: { verticalAlign: 'bottom' } }, 'Align Vertical Bottom');
      this.renderer.render();
      this.updateInspector();
    });

    // Auto-Sizing (Figma Parity)
    document.getElementById('btnTextAutoW')?.addEventListener('click', () => {
      const fontStyle = node.text?.fontStyle === 'italic' ? 'italic ' : '';
      const weight = node.text?.fontWeight || '400';
      const size = node.text?.fontSize || 16;
      const family = node.text?.fontFamily || 'Inter, sans-serif';
      const lines = String(node.text?.content || 'Heading').split('\n');
      const estCharW = size * 0.58;
      let maxLen = 0;
      for (const line of lines) {
        maxLen = Math.max(maxLen, line.length);
      }
      const measuredW = Math.max(40, Math.round(maxLen * estCharW + 16));
      this.engine.updateNode(node.id, {
        transform: { width: measuredW },
        text: { autoResize: 'auto-width' }
      }, 'Set Text Auto Width');
      this.renderer.render();
      this.updateInspector();
    });
    document.getElementById('btnTextAutoH')?.addEventListener('click', () => {
      this.engine.updateNode(node.id, { text: { autoResize: 'auto-height' } }, 'Set Text Auto Height');
      this.renderer.render();
      this.updateInspector();
    });
    document.getElementById('btnTextFixed')?.addEventListener('click', () => {
      this.engine.updateNode(node.id, { text: { autoResize: 'fixed' } }, 'Set Text Fixed Size');
      this.renderer.render();
      this.updateInspector();
    });

    document.getElementById('propTextContent')?.addEventListener('input', (e) => {
      this.engine.updateNode(node.id, { text: { content: e.target.value } }, 'Edit Text');
    });

    // 9. Recolor Hex with Color Picker Popover
    const handleRecolor = (targetHex, anchor) => {
      this.colorPicker.open({
        anchorEl: anchor,
        color: targetHex,
        palette: this.getDocumentColors(),
        onCommit: (newHex) => {
          if (!newHex || newHex.toLowerCase() === targetHex.toLowerCase()) return;
          for (const sId of selectedIds) {
            const sNode = this.engine.getNode(sId);
            if (!sNode) continue;
            let modified = false;
            const patch = {};
            if (sNode.style?.fills) {
              const fills = JSON.parse(JSON.stringify(sNode.style.fills));
              for (const f of fills) {
                if (f.color?.toLowerCase() === targetHex.toLowerCase()) {
                  f.color = newHex;
                  modified = true;
                }
              }
              if (modified) patch.style = { ...sNode.style, fills };
            }
            if (sNode.style?.strokes) {
              const strokes = JSON.parse(JSON.stringify(sNode.style.strokes));
              for (const st of strokes) {
                if (st.color?.toLowerCase() === targetHex.toLowerCase()) {
                  st.color = newHex;
                  modified = true;
                }
              }
              if (modified) patch.style = { ...(patch.style || sNode.style), strokes };
            }
            if (sNode.text?.color?.toLowerCase() === targetHex.toLowerCase()) {
              patch.text = { ...sNode.text, color: newHex };
              modified = true;
            }
            if (modified) {
              this.engine.updateNode(sId, patch, 'Recolor Selection');
            }
          }
          this.updateInspector();
        }
      });
    };

    document.querySelectorAll('.btn-recolor-hex').forEach(btn => {
      btn.addEventListener('click', () => handleRecolor(btn.dataset.hex, btn));
    });
    document.querySelectorAll('.recolor-swatch-box').forEach(box => {
      box.addEventListener('click', () => handleRecolor(box.dataset.hex, box));
    });

    // 10. Instant Export Buttons
    document.getElementById('btnExportSelectionPng')?.addEventListener('click', () => this.exportSelectedAsPng());
    document.getElementById('btnExportSelectionSvg')?.addEventListener('click', () => this.exportSelectedAsSvg());

    // 11. Data Supplier Buttons (Sketch Builtin Resources)
    document.getElementById('btnInspDataFaces')?.addEventListener('click', () => {
      applySketchDataSupplier(this.engine, 'faces');
      this.renderer.render();
      this.updateInspector();
    });
    document.getElementById('btnInspDataTiles')?.addEventListener('click', () => {
      applySketchDataSupplier(this.engine, 'tiles');
      this.renderer.render();
      this.updateInspector();
    });
    document.getElementById('btnInspDataNames')?.addEventListener('click', () => {
      applySketchDataSupplier(this.engine, 'names');
      this.renderer.render();
      this.updateInspector();
    });
    document.getElementById('btnInspDataCities')?.addEventListener('click', () => {
      applySketchDataSupplier(this.engine, 'cities');
      this.renderer.render();
      this.updateInspector();
    });
    document.getElementById('btnInspDataProfile')?.addEventListener('click', () => {
      const curT = node.transform || { x: 0, y: 0 };
      insertSketchUserProfileCard(this.engine, curT.x + 40, curT.y + 40);
      this.renderer.render();
      this.updateInspector();
      this.updateLayersTree();
    });
  }

  // --- Prototype Panel Synchronizer (Section 4.2 & Appendix A2.4 & design_engine_logical_parameters.md Sec 28, 30, 37) ---
  updatePrototypePanel() {
    const container = document.getElementById('prototypePanelContent');
    if (!container) return;
    const selectedIds = this.engine.getSelection();
    const page = this.engine.getActivePage();

    // 1. Prototype Flow Diagnostics & Coverage Card
    const diagSlot = document.getElementById('prototypeDiagnosticsSlot');
    if (diagSlot) {
      this.protoDiagnostics.doc = this.doc;
      const diag = this.protoDiagnostics.validateDocumentFlow();

      diagSlot.innerHTML = `
        <div class="proto-diagnostics-card">
          <div class="proto-diagnostics-header">
            <span>Flow Coverage & Health</span>
            <span class="coverage-pct">${diag.coveragePct}%</span>
          </div>
          <div class="coverage-meter-bar">
            <div class="coverage-bar-inner" style="width: ${diag.coveragePct}%;"></div>
          </div>
          <div class="proto-stat-row">
            <span>Reachable Screens:</span>
            <span style="color: var(--text-main); font-weight: 600;">${diag.reachableScreens.length} / ${diag.totalScreens}</span>
          </div>
          <div class="proto-stat-row">
            <span>Starting Points:</span>
            <span style="color: #38bdf8; font-weight: 600;">${diag.startingPoints.length}</span>
          </div>
          ${diag.brokenLinks.length > 0 ? `
          <div class="proto-stat-row" style="color: #ef4444; margin-top: 4px;">
            <span>⚠️ Broken Links:</span>
            <span style="font-weight: 700;">${diag.brokenLinks.length}</span>
          </div>
          <button class="btn-inspector-action" id="btnAutoRepairLinks" style="width: 100%; margin-top: 6px; font-size: 10px; background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; color: #fca5a5;">
            🛠 Auto-Repair Broken Links
          </button>` : ''}
          ${diag.deadEnds.length > 0 ? `
          <div class="proto-stat-row" style="color: #f59e0b; margin-top: 2px;">
            <span>ℹ️ Dead-end Screens:</span>
            <span>${diag.deadEnds.length}</span>
          </div>` : ''}
        </div>
      `;

      document.getElementById('btnAutoRepairLinks')?.addEventListener('click', () => {
        const repaired = this.protoDiagnostics.repairBrokenLinks();
        if (repaired > 0) {
          this.renderer.render();
          this.updatePrototypePanel();
        }
      });
    }

    if (selectedIds.length === 0) {
      container.innerHTML = `
        <div class="empty-inspector-note" style="padding: 16px 8px; text-align: center; color: var(--text-dim); font-size: 11px;">
          <p style="margin-bottom: 8px;">Select a frame or layer to attach interactive triggers, transitions, and screen navigation.</p>
          <button class="btn-primary" id="btnLaunchProtoSimEmpty" style="width: 100%; font-size: 11px; margin-top: 8px;">▶ Launch Prototype Simulator (⌥⌘P)</button>
        </div>`;
      document.getElementById('btnLaunchProtoSimEmpty')?.addEventListener('click', () => {
        this.openPrototypeModal();
      });
      return;
    }

    const node = this.engine.getNode(selectedIds[0]);
    if (!node) return;

    const frames = page.rootIds.map(id => page.nodes[id]).filter(n => n && n.type === 'frame');
    const interactions = node.interactions || [];
    const isQuick = this.protoInspectorMode === 'quick';

    let interactionsHtml = '';

    if (isQuick) {
      // --- Quick Mode: Human-readable narrative & 1-click test button ---
      interactionsHtml = interactions.map((int, idx) => {
        const targetFrame = frames.find(f => f.id === int.targetId);
        const targetName = targetFrame ? targetFrame.name : (int.targetId ? 'Target Frame' : 'Select Target');
        const actionLabel = int.action === 'change_variant' ? `Change to ${int.targetVariant || 'variant'}` :
                            int.action === 'open_overlay' ? 'Open Modal' :
                            int.action === 'close_overlay' ? 'Close Overlay' :
                            int.action === 'back' ? 'Go Back' :
                            int.action === 'set_variable' ? `Set ${int.variableName} = ${int.variableValue}` :
                            int.action === 'url' ? 'Open URL' : 'Navigate to';
        return `
        <div class="proto-interaction-card">
          <div class="proto-row">
            <span style="font-weight: 600; color: #38bdf8;">⚡ ${int.trigger ? int.trigger.toUpperCase() : 'ON CLICK'}</span>
            <button class="btn-icon-xs btn-remove-interaction" data-index="${idx}">✕</button>
          </div>
          <div style="font-size: 11px; line-height: 1.5; color: var(--text-main); margin: 6px 0;">
            On <strong>${int.trigger || 'click'}</strong> → <strong>${actionLabel}</strong> <span style="color: #38bdf8; font-weight: 600;">${targetName}</span>
            <span style="display: block; color: var(--text-dim); font-size: 10px; margin-top: 2px;">
              Transition: <em>${int.animation || 'dissolve'}</em>
            </span>
          </div>
          <div style="display: flex; gap: 6px; margin-top: 8px;">
            <button class="btn-inspector-action btn-quick-test" data-target="${int.targetId || ''}" style="flex: 1; font-size: 10px; padding: 4px 6px;">
              ▶ Test Link
            </button>
          </div>
        </div>`;
      }).join('');
    } else {
      // --- Advanced Mode: Granular properties, ODE Spring Physics & Conditional Variables ---
      interactionsHtml = interactions.map((int, idx) => `
      <div class="proto-interaction-card">
        <div class="proto-row">
          <span style="font-weight: 600; color: #38bdf8;">⚡ Interaction ${idx + 1}</span>
          <button class="btn-icon-xs btn-remove-interaction" data-index="${idx}">✕</button>
        </div>
        <div class="proto-row">
          <span style="color: var(--text-dim);">Trigger:</span>
          <select class="prop-select sel-trigger" data-index="${idx}" style="font-size: 11px;">
            <option value="click" ${int.trigger === 'click' ? 'selected' : ''}>On Click</option>
            <option value="tap" ${int.trigger === 'tap' ? 'selected' : ''}>On Tap</option>
            <option value="hover" ${int.trigger === 'hover' ? 'selected' : ''}>While Hovering</option>
            <option value="press" ${int.trigger === 'press' ? 'selected' : ''}>While Pressing</option>
            <option value="delay" ${int.trigger === 'delay' ? 'selected' : ''}>After Delay</option>
            <option value="enter" ${int.trigger === 'enter' ? 'selected' : ''}>Mouse Enter</option>
            <option value="leave" ${int.trigger === 'leave' ? 'selected' : ''}>Mouse Leave</option>
            <option value="key" ${int.trigger === 'key' ? 'selected' : ''}>Keyboard</option>
          </select>
        </div>

        ${int.trigger === 'delay' ? `
        <div class="proto-row">
          <span style="color: var(--text-dim);">Delay (ms):</span>
          <input type="number" class="prop-input inp-delay" data-index="${idx}" value="${int.delay || 800}" style="font-size: 11px; max-width: 90px;">
        </div>` : ''}

        <div class="proto-row">
          <span style="color: var(--text-dim);">Action:</span>
          <select class="prop-select sel-action" data-index="${idx}" style="font-size: 11px;">
            <option value="navigate" ${int.action === 'navigate' ? 'selected' : ''}>Navigate To Frame</option>
            <option value="change_variant" ${int.action === 'change_variant' ? 'selected' : ''}>Change Variant</option>
            <option value="open_overlay" ${int.action === 'open_overlay' || int.action === 'overlay' ? 'selected' : ''}>Open Modal Overlay</option>
            <option value="close_overlay" ${int.action === 'close_overlay' ? 'selected' : ''}>Close Overlay</option>
            <option value="back" ${int.action === 'back' ? 'selected' : ''}>Go Back</option>
            <option value="set_variable" ${int.action === 'set_variable' ? 'selected' : ''}>Set Variable</option>
            <option value="url" ${int.action === 'url' ? 'selected' : ''}>Open External URL</option>
          </select>
        </div>

        ${(int.action === 'navigate' || int.action === 'open_overlay' || int.action === 'overlay' || !int.action) ? `
        <div class="proto-row">
          <span style="color: var(--text-dim);">Target:</span>
          <select class="prop-select sel-target" data-index="${idx}" style="font-size: 11px;">
            ${frames.map(f => `<option value="${f.id}" ${int.targetId === f.id ? 'selected' : ''}>${f.name}</option>`).join('')}
          </select>
        </div>` : ''}

        ${(int.action === 'open_overlay' || int.action === 'overlay') ? `
        <div class="proto-row" style="margin-top: 4px; padding: 4px; background: rgba(0,0,0,0.15); border-radius: 4px;">
          <label style="display: flex; align-items: center; gap: 6px; font-size: 10px; cursor: pointer;">
            <input type="checkbox" class="chk-dim-bg" data-index="${idx}" ${int.dimBackground !== false ? 'checked' : ''}>
            <span>Dim background</span>
          </label>
          <label style="display: flex; align-items: center; gap: 6px; font-size: 10px; cursor: pointer; margin-left: 8px;">
            <input type="checkbox" class="chk-close-outside" data-index="${idx}" ${int.closeOnClickOutside !== false ? 'checked' : ''}>
            <span>Click outside to close</span>
          </label>
        </div>` : ''}

        ${int.action === 'change_variant' ? `
        <div class="proto-row">
          <span style="color: var(--text-dim);">To Variant:</span>
          <input type="text" class="prop-input inp-target-variant" data-index="${idx}" value="${int.targetVariant || 'hover'}" style="font-size: 11px;" placeholder="e.g. Hover, Pressed">
        </div>` : ''}

        ${int.action === 'set_variable' ? `
        <div class="proto-row">
          <span style="color: var(--text-dim);">Var Name:</span>
          <input type="text" class="prop-input inp-var-name" data-index="${idx}" value="${int.variableName || 'theme'}" style="font-size: 11px;">
        </div>
        <div class="proto-row">
          <span style="color: var(--text-dim);">Var Value:</span>
          <input type="text" class="prop-input inp-var-val" data-index="${idx}" value="${int.variableValue || 'dark'}" style="font-size: 11px;">
        </div>` : ''}

        <div class="proto-row">
          <span style="color: var(--text-dim);">Animation:</span>
          <select class="prop-select sel-anim" data-index="${idx}" style="font-size: 11px;">
            <option value="instant" ${int.animation === 'instant' ? 'selected' : ''}>Instant</option>
            <option value="dissolve" ${int.animation === 'dissolve' ? 'selected' : ''}>Dissolve</option>
            <option value="smart-animate" ${int.animation === 'smart-animate' ? 'selected' : ''}>Smart Animate</option>
            <option value="slide-left" ${int.animation === 'slide-left' ? 'selected' : ''}>Slide Left</option>
            <option value="slide-right" ${int.animation === 'slide-right' ? 'selected' : ''}>Slide Right</option>
          </select>
        </div>

        ${int.animation === 'smart-animate' ? `
        <div class="proto-row" style="font-size: 10px; color: var(--text-dim); margin-top: 6px;">
          <span>Spring Physics ODE:</span>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px; margin-top: 4px;">
          <div>
            <span style="font-size: 9px; color: var(--text-dim); display: block;">Mass</span>
            <input type="number" class="prop-input inp-spring-mass" data-index="${idx}" value="${int.springMass || 1}" step="0.1" style="font-size: 10px; padding: 2px 4px;">
          </div>
          <div>
            <span style="font-size: 9px; color: var(--text-dim); display: block;">Stiffness</span>
            <input type="number" class="prop-input inp-spring-stiff" data-index="${idx}" value="${int.springStiffness || 100}" step="10" style="font-size: 10px; padding: 2px 4px;">
          </div>
          <div>
            <span style="font-size: 9px; color: var(--text-dim); display: block;">Damping</span>
            <input type="number" class="prop-input inp-spring-damp" data-index="${idx}" value="${int.springDamping || 15}" step="1" style="font-size: 10px; padding: 2px 4px;">
          </div>
        </div>` : ''}
      </div>
      `).join('');
    }

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

      <div class="section-title">
        <span>Interactions (${interactions.length})</span>
        <button class="btn-icon-xs" id="btnAddInteractionBtn" title="Add Interaction">＋</button>
      </div>

      ${interactionsHtml}

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

    document.querySelectorAll('.btn-quick-test').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.target;
        if (targetId) {
          this.engine.setSelection([targetId]);
          this.renderer.render();
          this.updateInspector();
        } else {
          this.openPrototypeModal();
        }
      });
    });

    document.querySelectorAll('.sel-trigger').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const idx = parseInt(sel.dataset.index, 10);
        const cur = JSON.parse(JSON.stringify(node.interactions || []));
        if (cur[idx]) {
          cur[idx].trigger = e.target.value;
          this.engine.updateNode(node.id, { interactions: cur }, 'Change Trigger');
          this.updatePrototypePanel();
        }
      });
    });

    document.querySelectorAll('.inp-delay').forEach(inp => {
      inp.addEventListener('change', (e) => {
        const idx = parseInt(inp.dataset.index, 10);
        const cur = JSON.parse(JSON.stringify(node.interactions || []));
        if (cur[idx]) {
          cur[idx].delay = parseInt(e.target.value, 10) || 800;
          this.engine.updateNode(node.id, { interactions: cur }, 'Change Delay Duration');
        }
      });
    });

    document.querySelectorAll('.sel-action').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const idx = parseInt(sel.dataset.index, 10);
        const cur = JSON.parse(JSON.stringify(node.interactions || []));
        if (cur[idx]) {
          cur[idx].action = e.target.value;
          if (cur[idx].action === 'open_overlay' && cur[idx].dimBackground === undefined) {
            cur[idx].dimBackground = true;
            cur[idx].closeOnClickOutside = true;
          }
          this.engine.updateNode(node.id, { interactions: cur }, 'Change Action');
          this.updatePrototypePanel();
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

    document.querySelectorAll('.inp-target-variant').forEach(inp => {
      inp.addEventListener('change', (e) => {
        const idx = parseInt(inp.dataset.index, 10);
        const cur = JSON.parse(JSON.stringify(node.interactions || []));
        if (cur[idx]) {
          cur[idx].targetVariant = e.target.value.trim();
          this.engine.updateNode(node.id, { interactions: cur }, 'Change Target Variant');
        }
      });
    });

    document.querySelectorAll('.inp-var-name').forEach(inp => {
      inp.addEventListener('change', (e) => {
        const idx = parseInt(inp.dataset.index, 10);
        const cur = JSON.parse(JSON.stringify(node.interactions || []));
        if (cur[idx]) {
          cur[idx].variableName = e.target.value.trim();
          this.engine.updateNode(node.id, { interactions: cur }, 'Change Variable Name');
        }
      });
    });

    document.querySelectorAll('.inp-var-val').forEach(inp => {
      inp.addEventListener('change', (e) => {
        const idx = parseInt(inp.dataset.index, 10);
        const cur = JSON.parse(JSON.stringify(node.interactions || []));
        if (cur[idx]) {
          cur[idx].variableValue = e.target.value.trim();
          this.engine.updateNode(node.id, { interactions: cur }, 'Change Variable Value');
        }
      });
    });

    document.querySelectorAll('.chk-dim-bg').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const idx = parseInt(chk.dataset.index, 10);
        const cur = JSON.parse(JSON.stringify(node.interactions || []));
        if (cur[idx]) {
          cur[idx].dimBackground = e.target.checked;
          this.engine.updateNode(node.id, { interactions: cur }, 'Toggle Dim Background');
        }
      });
    });

    document.querySelectorAll('.chk-close-outside').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const idx = parseInt(chk.dataset.index, 10);
        const cur = JSON.parse(JSON.stringify(node.interactions || []));
        if (cur[idx]) {
          cur[idx].closeOnClickOutside = e.target.checked;
          this.engine.updateNode(node.id, { interactions: cur }, 'Toggle Close Outside');
        }
      });
    });

    document.querySelectorAll('.sel-anim').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const idx = parseInt(sel.dataset.index, 10);
        const cur = JSON.parse(JSON.stringify(node.interactions || []));
        if (cur[idx]) {
          cur[idx].animation = e.target.value;
          this.engine.updateNode(node.id, { interactions: cur }, 'Change Animation');
          this.updatePrototypePanel();
        }
      });
    });

    document.querySelectorAll('.inp-spring-mass').forEach(inp => {
      inp.addEventListener('change', (e) => {
        const idx = parseInt(inp.dataset.index, 10);
        const cur = JSON.parse(JSON.stringify(node.interactions || []));
        if (cur[idx]) {
          cur[idx].springMass = parseFloat(e.target.value) || 1;
          this.engine.updateNode(node.id, { interactions: cur }, 'Change Spring Mass');
        }
      });
    });

    document.querySelectorAll('.inp-spring-stiff').forEach(inp => {
      inp.addEventListener('change', (e) => {
        const idx = parseInt(inp.dataset.index, 10);
        const cur = JSON.parse(JSON.stringify(node.interactions || []));
        if (cur[idx]) {
          cur[idx].springStiffness = parseFloat(e.target.value) || 100;
          this.engine.updateNode(node.id, { interactions: cur }, 'Change Spring Stiffness');
        }
      });
    });

    document.querySelectorAll('.inp-spring-damp').forEach(inp => {
      inp.addEventListener('change', (e) => {
        const idx = parseInt(inp.dataset.index, 10);
        const cur = JSON.parse(JSON.stringify(node.interactions || []));
        if (cur[idx]) {
          cur[idx].springDamping = parseFloat(e.target.value) || 15;
          this.engine.updateNode(node.id, { interactions: cur }, 'Change Spring Damping');
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
    if (lang === 'compose') {
      codeOut.textContent = ExportHandoffEngine.generateJetpackCompose(node);
    } else if (lang === 'swiftui') {
      codeOut.textContent = ExportHandoffEngine.generateSwiftUI(node);
    } else {
      codeOut.textContent = inspectData[lang] || inspectData.css;
    }

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
    const emptyState = document.getElementById('layersEmptyState');
    const emptyFiltered = document.getElementById('layersEmptyFiltered');

    if (!page || !page.rootIds || page.rootIds.length === 0) {
      list.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
      if (emptyFiltered) emptyFiltered.style.display = 'none';
      return;
    }

    const visibleLayerIds = [];
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

      visibleLayerIds.push(nodeId);

      const isSelected = selectedIds.includes(nodeId);
      const hasChildren = node.childIds && node.childIds.length > 0;
      const isCollapsed = this.collapsedNodeIds.has(node.id);

      const icon = node.type === 'section' ? '§' :
                   node.type === 'frame' ? '#' :
                   node.type === 'text' ? 'T' :
                   node.type === 'ellipse' ? '○' :
                   node.type === 'line' ? '─' :
                   node.type === 'group' ? '⬚' :
                   node.type === 'component' ? '❖' :
                   node.type === 'instance' ? '◇' : '□';

      const paddingLeft = 6 + depth * 14;

      html += `
        <div class="layer-item ${isSelected ? 'selected' : ''}" data-node-id="${node.id}" draggable="true" style="padding-left: ${paddingLeft}px;">
          ${hasChildren ? `
            <span class="layer-chevron" data-chevron-id="${node.id}" title="${isCollapsed ? 'Expand' : 'Collapse'}">${isCollapsed ? '▸' : '▾'}</span>
          ` : `<span style="width: 14px; display: inline-block;"></span>`}
          <span class="layer-icon">${icon}</span>
          <span class="layer-name" title="${node.name}">${node.name}</span>
          <div class="layer-actions">
            <button class="layer-btn toggle-lock" title="Toggle Lock">${node.locked ? '🔒' : '🔓'}</button>
            <button class="layer-btn toggle-vis" title="Toggle Visibility">${node.visible ? '👁' : '🚫'}</button>
          </div>
        </div>
      `;

      // If branch is not collapsed, recurse children in reverse z-index (top layer on top)
      if (hasChildren && !isCollapsed) {
        for (let ci = node.childIds.length - 1; ci >= 0; ci--) {
          renderLayerItem(node.childIds[ci], depth + 1);
        }
      }
    };

    // Render roots in reverse z-index (topmost layer at top of Layers panel, like Figma)
    for (let ri = page.rootIds.length - 1; ri >= 0; ri--) {
      renderLayerItem(page.rootIds[ri], 0);
    }

    if (!html) {
      list.innerHTML = '';
      if (this.layerSearchQuery) {
        if (emptyFiltered) emptyFiltered.style.display = 'block';
        if (emptyState) emptyState.style.display = 'none';
      } else {
        if (emptyState) emptyState.style.display = 'block';
        if (emptyFiltered) emptyFiltered.style.display = 'none';
      }
    } else {
      list.innerHTML = html;
      if (emptyState) emptyState.style.display = 'none';
      if (emptyFiltered) emptyFiltered.style.display = 'none';
    }

    // Bind item click & drag listeners
    list.querySelectorAll('.layer-item').forEach(item => {
      const id = item.dataset.nodeId;
      const node = page.nodes[id];
      if (!node) return;

      // Chevron toggle
      item.querySelector('.layer-chevron')?.addEventListener('click', (e) => {
        e.stopPropagation();
        const cid = e.currentTarget.dataset.chevronId;
        if (this.collapsedNodeIds.has(cid)) {
          this.collapsedNodeIds.delete(cid);
        } else {
          this.collapsedNodeIds.add(cid);
        }
        this.updateLayersTree();
      });

      // Layer click (selection, visibility, lock, Shift-range, Cmd/Ctrl-toggle)
      item.addEventListener('click', (e) => {
        if (e.target.closest('.layer-chevron')) return;
        if (e.target.classList.contains('toggle-vis')) {
          e.stopPropagation();
          this.engine.toggleVisibility(id);
          return;
        }
        if (e.target.classList.contains('toggle-lock')) {
          e.stopPropagation();
          this.engine.toggleLock(id);
          return;
        }

        if (e.shiftKey && this.lastClickedLayerId && visibleLayerIds.includes(this.lastClickedLayerId)) {
          const idx1 = visibleLayerIds.indexOf(this.lastClickedLayerId);
          const idx2 = visibleLayerIds.indexOf(id);
          const start = Math.min(idx1, idx2);
          const end = Math.max(idx1, idx2);
          const range = visibleLayerIds.slice(start, end + 1);
          this.engine.setSelection(range);
        } else if (e.metaKey || e.ctrlKey) {
          this.engine.selectToggle(id);
          this.lastClickedLayerId = id;
        } else {
          this.engine.setSelection([id]);
          this.lastClickedLayerId = id;
        }
      });

      // Inline rename on double-click
      const nameSpan = item.querySelector('.layer-name');
      if (nameSpan) {
        nameSpan.addEventListener('dblclick', (e) => {
          e.stopPropagation();
          this.enterLayerRename(id);
        });
      }

      // Dragstart
      item.addEventListener('dragstart', (e) => {
        let dragged = this.engine.getSelection();
        if (!dragged.includes(id)) {
          this.engine.setSelection([id]);
          dragged = [id];
        }
        this.layerDragState = {
          draggedIds: [...dragged],
          sourceId: id
        };

        item.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'copyMove';
        try {
          e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'designforge/layers', ids: dragged }));
        } catch (_) {}

        // Create drag ghost badge
        const ghost = document.createElement('div');
        ghost.className = 'layer-drag-ghost';
        const label = dragged.length > 1 ? `${dragged.length} layers` : (node.name || 'Layer');
        ghost.textContent = label;
        document.body.appendChild(ghost);
        if (e.dataTransfer.setDragImage) {
          e.dataTransfer.setDragImage(ghost, 12, 12);
        }
        setTimeout(() => ghost.remove(), 0);
      });

      // Dragover
      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!this.layerDragState) return;
        const { draggedIds } = this.layerDragState;

        // Auto-scroll near top/bottom edges of layers list (8px per frame)
        const listRect = list.getBoundingClientRect();
        if (e.clientY < listRect.top + 40) {
          list.scrollTop -= 8;
        } else if (e.clientY > listRect.bottom - 40) {
          list.scrollTop += 8;
        }

        const targetId = id;
        const targetNode = page.nodes[targetId];
        if (!targetNode) return;

        // Invariant check: Cannot drop into self or descendant
        const isForbidden = draggedIds.includes(targetId) || draggedIds.some(dId => isDescendant(page, targetId, dId));
        if (isForbidden) {
          item.classList.add('drop-forbidden');
          item.classList.remove('drop-above', 'drop-below', 'drop-inside');
          item.dataset.dropZone = 'forbidden';
          e.dataTransfer.dropEffect = 'none';
          return;
        }

        // Calculate quarter zones (Top 25%, Middle 50%, Bottom 25%)
        const rect = item.getBoundingClientRect();
        const relY = e.clientY - rect.top;
        const ratio = relY / rect.height;
        const isContainer = ['section', 'frame', 'group', 'component'].includes(targetNode.type);

        item.classList.remove('drop-forbidden', 'drop-above', 'drop-below', 'drop-inside');

        if (ratio < 0.25) {
          item.classList.add('drop-above');
          item.dataset.dropZone = 'above';
        } else if (ratio > 0.75) {
          item.classList.add('drop-below');
          item.dataset.dropZone = 'below';
        } else {
          // Middle 50%
          if (isContainer) {
            // Container check: can target contain all dragged types?
            const allAllowed = draggedIds.every(dId => {
              const dn = page.nodes[dId];
              return dn ? canContain(targetNode.type, dn.type) : true;
            });
            if (allAllowed) {
              item.classList.add('drop-inside');
              item.dataset.dropZone = 'inside';

              // Auto-expand on hover > 600ms
              if (this.collapsedNodeIds.has(targetId)) {
                if (this.hoveredContainerId !== targetId) {
                  clearTimeout(this.layerHoverTimer);
                  this.hoveredContainerId = targetId;
                  this.layerHoverTimer = setTimeout(() => {
                    if (this.hoveredContainerId === targetId && this.collapsedNodeIds.has(targetId)) {
                      this.collapsedNodeIds.delete(targetId);
                      this.updateLayersTree();
                    }
                  }, 600);
                }
              }
            } else {
              item.classList.add('drop-forbidden');
              item.dataset.dropZone = 'forbidden';
              e.dataTransfer.dropEffect = 'none';
              return;
            }
          } else {
            // Non-container: nearest edge
            if (ratio < 0.5) {
              item.classList.add('drop-above');
              item.dataset.dropZone = 'above';
            } else {
              item.classList.add('drop-below');
              item.dataset.dropZone = 'below';
            }
          }
        }

        e.dataTransfer.dropEffect = e.altKey ? 'copy' : 'move';
      });

      // Dragleave
      item.addEventListener('dragleave', () => {
        item.classList.remove('drop-above', 'drop-below', 'drop-inside', 'drop-forbidden');
        if (this.hoveredContainerId === id) {
          clearTimeout(this.layerHoverTimer);
          this.hoveredContainerId = null;
        }
      });

      // Drop
      item.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();

        clearTimeout(this.layerHoverTimer);
        this.hoveredContainerId = null;

        const zone = item.dataset.dropZone;
        item.classList.remove('drop-above', 'drop-below', 'drop-inside', 'drop-forbidden');

        if (!this.layerDragState || zone === 'forbidden') {
          this.layerDragState = null;
          return;
        }

        const { draggedIds } = this.layerDragState;
        this.layerDragState = null;

        const targetNode = page.nodes[id];
        if (!targetNode || draggedIds.length === 0) return;

        // Alt/Option key duplication
        let nodesToOperate = draggedIds;
        if (e.altKey) {
          nodesToOperate = this.engine.duplicateNodes(draggedIds);
        }

        let targetParentId = null;
        let targetIndex = null;

        if (zone === 'inside') {
          targetParentId = targetNode.id;
          targetIndex = targetNode.childIds ? targetNode.childIds.length : 0;
        } else {
          targetParentId = targetNode.parentId || null;
          const siblingList = targetParentId && page.nodes[targetParentId]
            ? (page.nodes[targetParentId].childIds || [])
            : page.rootIds;
          const targetSiblingIdx = siblingList.indexOf(targetNode.id);

          // Sibling visual order is reversed z-index:
          // Visual "Above" in panel = higher z-index = after in array (targetSiblingIdx + 1)
          // Visual "Below" in panel = lower z-index = before in array (targetSiblingIdx)
          if (zone === 'above') {
            targetIndex = targetSiblingIdx !== -1 ? targetSiblingIdx + 1 : siblingList.length;
          } else {
            targetIndex = targetSiblingIdx !== -1 ? targetSiblingIdx : 0;
          }
        }

        this.engine.reparentMultiple(nodesToOperate, targetParentId, targetIndex);
        this.engine.setSelection(nodesToOperate);
        this.renderer?.render();
        this.updateInspector();
        this.updateLayersTree();
      });

      // Dragend
      item.addEventListener('dragend', () => {
        item.classList.remove('dragging', 'drop-above', 'drop-below', 'drop-inside', 'drop-forbidden');
        clearTimeout(this.layerHoverTimer);
        this.hoveredContainerId = null;
        this.layerDragState = null;
        list.querySelectorAll('.layer-item').forEach(el => {
          el.classList.remove('dragging', 'drop-above', 'drop-below', 'drop-inside', 'drop-forbidden');
        });
      });
    });

    // Drop onto empty space in layers list container (reparents to root page level)
    list.ondragover = (e) => {
      if (e.target === list || e.target.id === 'layersEmptyState') {
        e.preventDefault();
        e.dataTransfer.dropEffect = e.altKey ? 'copy' : 'move';
      }
    };
    list.ondrop = (e) => {
      if ((e.target === list || e.target.id === 'layersEmptyState') && this.layerDragState) {
        e.preventDefault();
        const { draggedIds } = this.layerDragState;
        this.layerDragState = null;
        let nodesToMove = draggedIds;
        if (e.altKey) {
          nodesToMove = this.engine.duplicateNodes(draggedIds);
        }
        this.engine.reparentMultiple(nodesToMove, null, null);
        this.engine.setSelection(nodesToMove);
        this.renderer?.render();
        this.updateInspector();
        this.updateLayersTree();
      }
    };
  }

  enterLayerRename(nodeId) {
    const item = document.querySelector(`.layer-item[data-node-id="${nodeId}"]`);
    if (!item) return;
    const nameSpan = item.querySelector('.layer-name');
    if (!nameSpan) return;
    const node = this.engine.getNode(nodeId);
    if (!node) return;
    const prevName = node.name;

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'layer-inline-rename-input';
    input.value = prevName;
    nameSpan.replaceWith(input);
    input.focus();
    input.select();

    let committed = false;
    const commit = () => {
      if (committed) return;
      committed = true;
      const newName = input.value.trim();
      if (newName && newName !== prevName) {
        this.engine.updateNode(nodeId, { name: newName }, 'Rename layer');
      }
      this.updateLayersTree();
    };

    input.addEventListener('keydown', (ke) => {
      if (ke.key === 'Enter') {
        ke.preventDefault();
        commit();
      } else if (ke.key === 'Escape') {
        ke.preventDefault();
        committed = true;
        this.updateLayersTree();
      }
    });
    input.addEventListener('blur', commit);
  }

  renderTokensList() {
    const list = document.getElementById('tokensTreeList');
    if (!list) return;

    const components = Object.values(this.doc.components || {});
    const variables = Object.values(this.doc.variables || {});
    const tokens = this.doc.tokens || [];

    let html = '';

    // 1. Component Library Section
    html += `
      <div style="padding: 4px 0 6px; font-size: 11px; font-weight: 700; color: var(--accent-blue); text-transform: uppercase; display: flex; justify-content: space-between; align-items: center;">
        <span>❖ Component Library (${components.length})</span>
      </div>
    `;
    if (components.length === 0) {
      html += `<div style="font-size: 11px; color: var(--text-dim); margin-bottom: 12px; font-style: italic;">No components created yet. Select a frame and click Create Component.</div>`;
    } else {
      for (const comp of components) {
        const varCount = (comp.variants || []).length || 1;
        html += `
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 8px; font-size: 11px; border-bottom: 1px solid var(--border-subtle); background: var(--bg-surface); border-radius: 4px; margin-bottom: 4px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="color: #a855f7;">❖</span>
              <span style="font-weight: 500;">${comp.name}</span>
              <span style="font-size: 10px; color: var(--text-dim);">(${varCount} ${varCount === 1 ? 'variant' : 'variants'})</span>
            </div>
            <button class="menu-dropdown-btn-sm btn-insert-instance" data-comp-id="${comp.id}" style="font-size: 10px; padding: 2px 6px;">Insert</button>
          </div>
        `;
      }
    }

    // 2. Design Variables Section
    html += `
      <div style="padding: 10px 0 6px; font-size: 11px; font-weight: 700; color: #10b981; text-transform: uppercase; display: flex; justify-content: space-between; align-items: center;">
        <span>Variables (${variables.length})</span>
        <button class="btn-icon-xs" id="btnAddDocVariable" title="Add Variable">+</button>
      </div>
    `;
    for (const v of variables) {
      html += `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 5px 8px; font-size: 11px; border-bottom: 1px solid var(--border-subtle); background: var(--bg-surface); border-radius: 4px; margin-bottom: 4px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            ${v.type === 'color' ? `<div style="width: 12px; height: 12px; border-radius: 3px; background: ${v.value};"></div>` : `<span style="font-size: 9px; padding: 1px 4px; background: var(--bg-hover); border-radius: 2px;">${v.type}</span>`}
            <span>${v.name}</span>
          </div>
          <code style="font-size: 10px; color: var(--text-dim);">${v.value}</code>
        </div>
      `;
    }

    // 3. Design Tokens Section
    html += `<div style="padding: 10px 0 6px; font-size: 11px; font-weight: 700; color: var(--text-dim); text-transform: uppercase;">Design Tokens</div>`;
    for (const group of tokens) {
      html += `<div style="padding: 4px 0 2px; font-size: 10px; font-weight: 600; color: var(--text-muted); text-transform: uppercase;">${group.name}</div>`;
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

    // Listeners for Insert Instance
    list.querySelectorAll('.btn-insert-instance').forEach(btn => {
      btn.addEventListener('click', () => {
        const compId = btn.dataset.compId;
        const newInstance = this.engine.createInstance(compId);
        if (newInstance) {
          this.engine.select(newInstance.id);
          this.renderer.render();
          this.updateLayersTree();
          this.updateInspector();
        }
      });
    });

    // Listener for Add Variable
    document.getElementById('btnAddDocVariable')?.addEventListener('click', () => {
      const vName = prompt('Enter variable name (e.g. brand-accent, card-radius):');
      if (!vName) return;
      const vType = prompt('Enter variable type (color | number | string | boolean):', 'color') || 'color';
      const vVal = prompt('Enter variable default value:', vType === 'color' ? '#3b82f6' : '16') || '#3b82f6';
      this.engine.addVariable('core', vName, vType, vVal);
      this.renderTokensList();
    });

    // Listeners for applying tokens
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

  zoomIn() { this.renderer.setZoom(this.renderer.zoom * 1.25); this.updateRulers(); this.updateZoomDisplay(); }
  zoomOut() { this.renderer.setZoom(this.renderer.zoom * 0.8); this.updateRulers(); this.updateZoomDisplay(); }
  zoomToFit() { this.renderer.zoomToFit(); this.updateRulers(); this.updateZoomDisplay(); }
  zoom100() { this.renderer.setZoom(1.0); this.updateRulers(); this.updateZoomDisplay(); }
  zoomToSelection() { this.renderer.zoomToSelection(); this.updateRulers(); this.updateZoomDisplay(); }

  toggleDevMode() {
    const nextMode = this.rightTabMode === 'inspect' ? 'design' : 'inspect';
    if (this.setSidebarMode) {
      this.setSidebarMode(nextMode);
    }
  }

  selectParent() {
    const sel = this.engine.getSelection();
    if (sel.length === 0) return;
    const node = this.engine.getNode(sel[0]);
    if (node && node.parentId) {
      this.engine.setSelection([node.parentId]);
      this.renderer.render();
      this.updateInspector();
      this.updateLayersTree();
    }
  }

  selectChildren() {
    const sel = this.engine.getSelection();
    if (sel.length === 0) return;
    const node = this.engine.getNode(sel[0]);
    if (node && node.childIds && node.childIds.length > 0) {
      this.engine.setSelection([node.childIds[0]]);
      this.renderer.render();
      this.updateInspector();
      this.updateLayersTree();
    }
  }

  selectNextSibling() {
    const sel = this.engine.getSelection();
    if (sel.length === 0) return;
    const page = this.engine.getActivePage();
    const node = this.engine.getNode(sel[0]);
    if (!node || !page) return;

    const siblings = node.parentId ? (page.nodes[node.parentId]?.childIds || []) : (page.rootIds || []);
    if (siblings.length <= 1) return;
    const curIdx = siblings.indexOf(node.id);
    const nextIdx = (curIdx + 1) % siblings.length;
    this.engine.setSelection([siblings[nextIdx]]);
    this.renderer.render();
    this.updateInspector();
    this.updateLayersTree();
  }

  selectPrevSibling() {
    const sel = this.engine.getSelection();
    if (sel.length === 0) return;
    const page = this.engine.getActivePage();
    const node = this.engine.getNode(sel[0]);
    if (!node || !page) return;

    const siblings = node.parentId ? (page.nodes[node.parentId]?.childIds || []) : (page.rootIds || []);
    if (siblings.length <= 1) return;
    const curIdx = siblings.indexOf(node.id);
    const prevIdx = (curIdx - 1 + siblings.length) % siblings.length;
    this.engine.setSelection([siblings[prevIdx]]);
    this.renderer.render();
    this.updateInspector();
    this.updateLayersTree();
  }

  flipHorizontal() {
    const sel = this.engine.getSelection();
    for (const id of sel) {
      const node = this.engine.getNode(id);
      if (node && node.transform) {
        const curScale = node.transform.scaleX !== undefined ? node.transform.scaleX : 1;
        this.engine.updateNode(id, { transform: { scaleX: curScale * -1 } }, 'Flip Horizontal');
      }
    }
    this.renderer.render();
    this.updateInspector();
  }

  flipVertical() {
    const sel = this.engine.getSelection();
    for (const id of sel) {
      const node = this.engine.getNode(id);
      if (node && node.transform) {
        const curScale = node.transform.scaleY !== undefined ? node.transform.scaleY : 1;
        this.engine.updateNode(id, { transform: { scaleY: curScale * -1 } }, 'Flip Vertical');
      }
    }
    this.renderer.render();
    this.updateInspector();
  }

  copyProperties() {
    const sel = this.engine.getSelection();
    if (sel.length === 0) return;
    const node = this.engine.getNode(sel[0]);
    if (node && node.style) {
      this.clipboardProperties = JSON.parse(JSON.stringify(node.style));
    }
  }

  pasteProperties() {
    if (!this.clipboardProperties) return;
    const sel = this.engine.getSelection();
    for (const id of sel) {
      const node = this.engine.getNode(id);
      if (node && !node.locked) {
        this.engine.updateNode(id, { style: JSON.parse(JSON.stringify(this.clipboardProperties)) }, 'Paste Properties');
      }
    }
    this.renderer.render();
    this.updateInspector();
  }

  toggleOutlineMode() {
    this.renderer.outlineMode = !this.renderer.outlineMode;
    this.renderer.render();
  }

  triggerPlaceImage() {
    if (typeof document === 'undefined') return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*';
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const dataUrl = loadEvent.target?.result;
        if (!dataUrl) return;
        const page = this.engine.getActivePage();
        const rect = this.renderer.canvas.getBoundingClientRect();
        const center = this.renderer.screenToCanvas(rect.left + rect.width / 2, rect.top + rect.height / 2);
        const node = createNode('image', {
          name: file.name.replace(/\.[^/.]+$/, ''),
          transform: { x: Math.round(center.x - 120), y: Math.round(center.y - 80), width: 240, height: 160 },
          imageUrl: dataUrl
        });
        this.engine.addNode(node, page.id);
        this.engine.setSelection([node.id]);
        this.renderer.render();
        this.updateInspector();
        this.updateLayersTree();
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }

  reorderSelected(direction) {
    const sel = this.engine.getSelection();
    if (sel.length === 1) {
      this.engine.reorderNode(sel[0], direction);
      this.renderer.render();
      this.updateLayersTree();
      this.updateInspector();
    }
  }

  getDocumentColors() {
    const colors = new Set();
    const page = this.engine.getActivePage();
    if (page && page.nodes) {
      for (const node of Object.values(page.nodes)) {
        if (node.style) {
          if (Array.isArray(node.style.fills)) {
            for (const f of node.style.fills) {
              if (f.color && typeof f.color === 'string') colors.add(f.color.toLowerCase());
            }
          }
          if (Array.isArray(node.style.strokes)) {
            for (const s of node.style.strokes) {
              if (s.color && typeof s.color === 'string') colors.add(s.color.toLowerCase());
            }
          }
        }
        if (node.text && node.text.color && typeof node.text.color === 'string') {
          colors.add(node.text.color.toLowerCase());
        }
      }
    }
    if (page && page.background) {
      colors.add(page.background.toLowerCase());
    }
    if (this.doc && this.doc.tokens) {
      try {
        const allTokens = this.linter?.getAllTokens ? this.linter.getAllTokens() : [];
        for (const t of allTokens) {
          if (t.type === 'color' && t.value && typeof t.value === 'string') {
            colors.add(t.value.toLowerCase());
          }
        }
      } catch (e) {}
    }
    return Array.from(colors).filter(c => /^#[0-9a-f]{3,8}$/i.test(c));
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
      iframe.srcdoc = this.prototype.generateStandalonePlayer(this.engine.activePageId);
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

  openSketchDocsTab() {
    this.openLearnCenter();
    const tabDocs = document.getElementById('learnTabBtnDocs');
    if (tabDocs) tabDocs.click();
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

