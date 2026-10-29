/**
 * DesignForge AI - Command Palette Search Engine (Cmd/Ctrl+K)
 * Fast, fuzzy-searchable registry of all tools, actions, layers, pages, and AI recipes.
 */

export class CommandPaletteEngine {
  constructor(appController) {
    this.app = appController;
  }

  /**
   * Builds an aggregated index of all searchable items
   */
  buildIndex() {
    const items = [];
    const engine = this.app.engine;
    const page = engine.getActivePage();

    // 1. Tool commands
    const tools = [
      { id: 'tool_select', title: 'Select / Move Tool', category: 'Tool', icon: 'MousePointer2', shortcut: 'V', action: () => this.app.setTool('select') },
      { id: 'tool_frame', title: 'Frame Tool', category: 'Tool', icon: 'Frame', shortcut: 'F', action: () => this.app.setTool('frame') },
      { id: 'tool_rect', title: 'Rectangle Tool', category: 'Tool', icon: 'Square', shortcut: 'R', action: () => this.app.setTool('rectangle') },
      { id: 'tool_ellipse', title: 'Ellipse Tool', category: 'Tool', icon: 'Circle', shortcut: 'O', action: () => this.app.setTool('ellipse') },
      { id: 'tool_line', title: 'Line Tool', category: 'Tool', icon: 'Minus', shortcut: 'L', action: () => this.app.setTool('line') },
      { id: 'tool_text', title: 'Text Tool', category: 'Tool', icon: 'Type', shortcut: 'T', action: () => this.app.setTool('text') },
      { id: 'tool_comment', title: 'Add Review Comment', category: 'Tool', icon: 'MessageSquare', shortcut: 'C', action: () => this.app.setTool('comment') },
      { id: 'tool_hand', title: 'Hand / Pan Canvas', category: 'Tool', icon: 'Hand', shortcut: 'H / Space', action: () => this.app.setHandMode(true) }
    ];
    items.push(...tools);

    // 2. Editor Actions
    const actions = [
      { id: 'act_undo', title: 'Undo', category: 'Action', icon: 'Undo2', shortcut: '⌘Z', action: () => this.app.undo() },
      { id: 'act_redo', title: 'Redo', category: 'Action', icon: 'Redo2', shortcut: '⌘⇧Z', action: () => this.app.redo() },
      { id: 'act_duplicate', title: 'Duplicate Selection', category: 'Action', icon: 'Copy', shortcut: '⌘D', action: () => this.app.duplicateSelected() },
      { id: 'act_delete', title: 'Delete Selection', category: 'Action', icon: 'X', shortcut: '⌫', action: () => this.app.deleteSelected() },
      { id: 'act_group', title: 'Group Selection', category: 'Action', icon: 'Layers', shortcut: '⌘G', action: () => this.app.groupSelected() },
      { id: 'act_ungroup', title: 'Ungroup Selection', category: 'Action', icon: 'Layers', shortcut: '⌘⇧G', action: () => this.app.ungroupSelected() },
      { id: 'act_autolayout', title: 'Add Auto Layout', category: 'Action', icon: 'AlignCenter', shortcut: '⇧A', action: () => this.app.addAutoLayoutToSelected() },
      { id: 'act_component', title: 'Create Component', category: 'Action', icon: 'Box', shortcut: '⌥⌘K', action: () => this.app.createComponentFromSelection() },
      { id: 'act_play', title: 'Play Interactive Prototype', category: 'Action', icon: 'Play', shortcut: '⌥⌘P', action: () => this.app.openPrototypeModal() },
      { id: 'act_export', title: 'Compile to Production React', category: 'Action', icon: 'Zap', shortcut: '⌘⇧E', action: () => this.app.openExportModal() },
      { id: 'act_zoom_fit', title: 'Zoom to Fit', category: 'View', icon: 'Search', shortcut: '⇧1', action: () => this.app.zoomToFit() },
      { id: 'act_zoom_100', title: 'Zoom to 100%', category: 'View', icon: 'ZoomIn', shortcut: '⌘0', action: () => this.app.zoom100() },
      { id: 'act_linter', title: 'Run Design System Linter', category: 'System', icon: 'Activity', shortcut: '', action: () => this.app.openLinterModal() }
    ];
    items.push(...actions);

    // 3. Pages navigation
    if (engine.doc.pages) {
      for (const p of engine.doc.pages) {
        items.push({
          id: `page_${p.id}`,
          title: `Switch to Page: ${p.name}`,
          category: 'Page',
          icon: 'FileText',
          shortcut: '',
          action: () => {
            engine.setActivePage(p.id);
            this.app.renderAll();
          }
        });
      }
    }

    // 4. Layers in active page
    if (page && page.nodes) {
      for (const id in page.nodes) {
        const n = page.nodes[id];
        if (!n) continue;
        items.push({
          id: `node_${n.id}`,
          title: `Select Layer: ${n.name} (${n.type})`,
          category: 'Layer',
          icon: n.type === 'frame' ? 'Frame' : n.type === 'text' ? 'Type' : 'Square',
          shortcut: '',
          action: () => {
            engine.setSelection([n.id]);
            this.app.renderAll();
          }
        });
      }
    }

    // 5. AI Quick Actions
    const aiActions = [
      { id: 'ai_dashboard', title: 'AI: Generate Enterprise SaaS Dashboard', category: 'AI', icon: 'Sparkles', shortcut: '', action: () => this.app.runAiPromptQuick('Generate enterprise analytics SaaS dashboard') },
      { id: 'ai_pricing', title: 'AI: Generate SaaS Pricing Table', category: 'AI', icon: 'Sparkles', shortcut: '', action: () => this.app.runAiPromptQuick('Create SaaS pricing table with 3 tiers') },
      { id: 'ai_spacing', title: 'AI: Improve Spacing & Layout', category: 'AI', icon: 'Sparkles', shortcut: '', action: () => this.app.runAiPromptQuick('Improve spacing and align elements consistently') },
      { id: 'ai_audit', title: 'AI: Audit WCAG & Contrast', category: 'AI', icon: 'Eye', shortcut: '', action: () => document.getElementById('btnAuditDesign')?.click() }
    ];
    items.push(...aiActions);

    return items;
  }

  /**
   * Simple fuzzy search filter
   */
  search(query) {
    const items = this.buildIndex();
    if (!query || !query.trim()) return items.slice(0, 15);

    const q = query.toLowerCase().trim();
    return items
      .filter(item => {
        const titleMatch = item.title.toLowerCase().includes(q);
        const catMatch = item.category.toLowerCase().includes(q);
        const shortcutMatch = item.shortcut.toLowerCase().includes(q);
        return titleMatch || catMatch || shortcutMatch;
      })
      .slice(0, 15);
  }
}
