/**
 * DesignForge AI - Cross-Platform Keyboard Shortcut Engine
 * Unified command dispatch for macOS (⌘, ⌥) and Windows/Linux (Ctrl, Alt)
 */

export const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

export class ShortcutRegistry {
  constructor(appController) {
    this.app = appController;
    this.shortcuts = [];
    this.isSpacePressed = false;
    this.initDefaultShortcuts();
    this.bindGlobalListener();
  }

  register(shortcut) {
    // shortcut: { id, name, category, macKey, winKey, handler }
    this.shortcuts.push(shortcut);
  }

  initDefaultShortcuts() {
    this.register({
      id: 'undo',
      name: 'Undo',
      category: 'Edit',
      macKey: '⌘Z',
      winKey: 'Ctrl+Z',
      match: (e) => (isMac ? e.metaKey : e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'z',
      handler: () => this.app.undo()
    });

    this.register({
      id: 'redo',
      name: 'Redo',
      category: 'Edit',
      macKey: '⌘⇧Z',
      winKey: 'Ctrl+Shift+Z',
      match: (e) => ((isMac ? e.metaKey : e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'z') ||
                    ((isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === 'y'),
      handler: () => this.app.redo()
    });

    this.register({
      id: 'duplicate',
      name: 'Duplicate',
      category: 'Edit',
      macKey: '⌘D',
      winKey: 'Ctrl+D',
      match: (e) => (isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === 'd',
      handler: () => this.app.duplicateSelected()
    });

    this.register({
      id: 'delete',
      name: 'Delete Selected',
      category: 'Edit',
      macKey: '⌫ / Del',
      winKey: 'Del / Backspace',
      match: (e) => !e.metaKey && !e.ctrlKey && (e.key === 'Delete' || e.key === 'Backspace'),
      handler: () => this.app.deleteSelected()
    });

    this.register({
      id: 'selectAll',
      name: 'Select All',
      category: 'Selection',
      macKey: '⌘A',
      winKey: 'Ctrl+A',
      match: (e) => (isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === 'a',
      handler: () => this.app.selectAll()
    });

    this.register({
      id: 'save',
      name: 'Save Project',
      category: 'File',
      macKey: '⌘S',
      winKey: 'Ctrl+S',
      match: (e) => (isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === 's',
      handler: () => this.app.saveProject()
    });

    this.register({
      id: 'exportReact',
      name: 'Export React Code',
      category: 'Code',
      macKey: '⌘⇧E',
      winKey: 'Ctrl+Shift+E',
      match: (e) => (isMac ? e.metaKey : e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'e',
      handler: () => this.app.openExportModal()
    });

    this.register({
      id: 'commandPalette',
      name: 'Command Palette',
      category: 'General',
      macKey: '⌘K',
      winKey: 'Ctrl+K',
      match: (e) => (isMac ? e.metaKey : e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'k',
      handler: () => this.app.toggleCommandPalette()
    });

    this.register({
      id: 'aiAssistant',
      name: 'Toggle AI Assistant',
      category: 'AI',
      macKey: '⌘⇧K',
      winKey: 'Ctrl+Shift+K',
      match: (e) => (isMac ? e.metaKey : e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'k',
      handler: () => this.app.toggleAIAssistant()
    });

    this.register({
      id: 'toolSelect',
      name: 'Move / Select Tool',
      category: 'Tools',
      macKey: 'V / Esc',
      winKey: 'V / Esc',
      match: (e) => !e.metaKey && !e.ctrlKey && !e.shiftKey && (e.key.toLowerCase() === 'v' || e.key === 'Escape'),
      handler: () => this.app.setTool('select')
    });

    this.register({
      id: 'toolFrame',
      name: 'Frame Tool',
      category: 'Tools',
      macKey: 'F',
      winKey: 'F',
      match: (e) => !e.metaKey && !e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'f',
      handler: () => this.app.setTool('frame')
    });

    this.register({
      id: 'toolRect',
      name: 'Rectangle Tool',
      category: 'Tools',
      macKey: 'R',
      winKey: 'R',
      match: (e) => !e.metaKey && !e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'r',
      handler: () => this.app.setTool('rectangle')
    });

    this.register({
      id: 'toolEllipse',
      name: 'Ellipse Tool',
      category: 'Tools',
      macKey: 'O',
      winKey: 'O',
      match: (e) => !e.metaKey && !e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'o',
      handler: () => this.app.setTool('ellipse')
    });

    this.register({
      id: 'toolText',
      name: 'Text Tool',
      category: 'Tools',
      macKey: 'T',
      winKey: 'T',
      match: (e) => !e.metaKey && !e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 't',
      handler: () => this.app.setTool('text')
    });

    this.register({
      id: 'zoomIn',
      name: 'Zoom In',
      category: 'View',
      macKey: '⌘+',
      winKey: 'Ctrl++',
      match: (e) => (isMac ? e.metaKey : e.ctrlKey) && (e.key === '=' || e.key === '+'),
      handler: () => this.app.zoomIn()
    });

    this.register({
      id: 'zoomOut',
      name: 'Zoom Out',
      category: 'View',
      macKey: '⌘-',
      winKey: 'Ctrl+-',
      match: (e) => (isMac ? e.metaKey : e.ctrlKey) && e.key === '-',
      handler: () => this.app.zoomOut()
    });

    this.register({
      id: 'zoomFit',
      name: 'Zoom to Fit',
      category: 'View',
      macKey: '⌘⇧0',
      winKey: 'Ctrl+Shift+0',
      match: (e) => (isMac ? e.metaKey : e.ctrlKey) && e.shiftKey && e.key === '0',
      handler: () => this.app.zoomToFit()
    });

    this.register({
      id: 'zoom100',
      name: 'Zoom to 100%',
      category: 'View',
      macKey: '⌘0',
      winKey: 'Ctrl+0',
      match: (e) => (isMac ? e.metaKey : e.ctrlKey) && !e.shiftKey && e.key === '0',
      handler: () => this.app.zoom100()
    });

    this.register({
      id: 'bringForward',
      name: 'Bring Forward',
      category: 'Arrange',
      macKey: '⌘]',
      winKey: 'Ctrl+]',
      match: (e) => (isMac ? e.metaKey : e.ctrlKey) && !e.altKey && e.key === ']',
      handler: () => this.app.reorderSelected('up')
    });

    this.register({
      id: 'sendBackward',
      name: 'Send Backward',
      category: 'Arrange',
      macKey: '⌘[',
      winKey: 'Ctrl+[',
      match: (e) => (isMac ? e.metaKey : e.ctrlKey) && !e.altKey && e.key === '[',
      handler: () => this.app.reorderSelected('down')
    });

    this.register({
      id: 'help',
      name: 'Keyboard Shortcuts Help',
      category: 'Help',
      macKey: '?',
      winKey: '?',
      match: (e) => !e.metaKey && !e.ctrlKey && e.key === '?',
      handler: () => this.app.showShortcutModal()
    });

    this.register({
      id: 'group',
      name: 'Group Selection',
      category: 'Arrange',
      macKey: '⌘G',
      winKey: 'Ctrl+G',
      match: (e) => (isMac ? e.metaKey : e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'g',
      handler: () => this.app.groupSelected()
    });

    this.register({
      id: 'ungroup',
      name: 'Ungroup Selection',
      category: 'Arrange',
      macKey: '⌘⇧G',
      winKey: 'Ctrl+Shift+G',
      match: (e) => (isMac ? e.metaKey : e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'g',
      handler: () => this.app.ungroupSelected()
    });

    this.register({
      id: 'autoLayout',
      name: 'Add Auto Layout',
      category: 'Layout',
      macKey: '⇧A',
      winKey: 'Shift+A',
      match: (e) => !e.metaKey && !e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a',
      handler: () => this.app.addAutoLayoutToSelected()
    });

    this.register({
      id: 'createComponent',
      name: 'Create Component',
      category: 'Components',
      macKey: '⌥⌘K',
      winKey: 'Alt+Ctrl+K',
      match: (e) => (isMac ? e.metaKey : e.ctrlKey) && e.altKey && e.key.toLowerCase() === 'k',
      handler: () => this.app.createComponentFromSelection()
    });

    this.register({
      id: 'playPrototype',
      name: 'Play Prototype',
      category: 'Prototype',
      macKey: '⌥⌘P',
      winKey: 'Alt+Ctrl+P',
      match: (e) => (isMac ? e.metaKey : e.ctrlKey) && e.altKey && e.key.toLowerCase() === 'p',
      handler: () => this.app.openPrototypeModal()
    });

    this.register({
      id: 'toolLine',
      name: 'Line Tool',
      category: 'Tools',
      macKey: 'L',
      winKey: 'L',
      match: (e) => !e.metaKey && !e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'l',
      handler: () => this.app.setTool('line')
    });

    this.register({
      id: 'toolComment',
      name: 'Comment Tool',
      category: 'Tools',
      macKey: 'C',
      winKey: 'C',
      match: (e) => !e.metaKey && !e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'c',
      handler: () => this.app.setTool('comment')
    });

    this.register({
      id: 'zoomFitShift1',
      name: 'Zoom to Fit',
      category: 'View',
      macKey: '⇧1',
      winKey: 'Shift+1',
      match: (e) => !e.metaKey && !e.ctrlKey && e.shiftKey && (e.key === '1' || e.key === '!'),
      handler: () => this.app.zoomToFit()
    });

    this.register({
      id: 'tabDesign',
      name: 'Switch to Design',
      category: 'Panels',
      macKey: '⌥1',
      winKey: 'Alt+1',
      match: (e) => e.altKey && !e.metaKey && !e.ctrlKey && e.key === '1',
      handler: () => (document.getElementById('btnTabDesign') || document.getElementById('btnTabProperties'))?.click()
    });

    this.register({
      id: 'tabAiAssistant',
      name: 'Switch to AI Assistant',
      category: 'Panels',
      macKey: '⌥2',
      winKey: 'Alt+2',
      match: (e) => e.altKey && !e.metaKey && !e.ctrlKey && e.key === '2',
      handler: () => document.getElementById('btnTabAiAssistant')?.click()
    });

    this.register({
      id: 'tabPrototype',
      name: 'Switch to Prototype',
      category: 'Panels',
      macKey: '⌥3',
      winKey: 'Alt+3',
      match: (e) => e.altKey && !e.metaKey && !e.ctrlKey && e.key === '3',
      handler: () => document.getElementById('btnTabPrototype')?.click()
    });

    this.register({
      id: 'tabInspect',
      name: 'Switch to Inspect',
      category: 'Panels',
      macKey: '⌥4',
      winKey: 'Alt+4',
      match: (e) => e.altKey && !e.metaKey && !e.ctrlKey && e.key === '4',
      handler: () => document.getElementById('btnTabInspect')?.click()
    });

    this.register({
      id: 'tabExport',
      name: 'Switch to Export',
      category: 'Panels',
      macKey: '⌥5',
      winKey: 'Alt+5',
      match: (e) => e.altKey && !e.metaKey && !e.ctrlKey && e.key === '5',
      handler: () => document.getElementById('btnTabExport')?.click()
    });

    this.register({
      id: 'linter',
      name: 'Design System Linter',
      category: 'System',
      macKey: '⌥L',
      winKey: 'Alt+L',
      match: (e) => e.altKey && !e.metaKey && !e.ctrlKey && e.key.toLowerCase() === 'l',
      handler: () => this.app.openLinterModal()
    });

    this.register({
      id: 'mcp-hub',
      name: 'Open MCP Hub & Registry',
      category: 'System',
      macKey: '⌘⌥M',
      winKey: 'Ctrl+Alt+M',
      match: (e) => (isMac ? (e.metaKey && e.altKey) : (e.ctrlKey && e.altKey)) && e.key.toLowerCase() === 'm',
      handler: () => this.app.openMcpHub()
    });
  }


  bindGlobalListener() {
    window.addEventListener('keydown', (e) => {
      // Don't intercept if user is typing in an active text input or textarea
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || document.activeElement?.isContentEditable) {
        if (e.key === 'Escape') {
          document.activeElement.blur();
        }
        return;
      }

      // Space bar temporary hand pan tool
      if (e.code === 'Space' && !this.isSpacePressed) {
        this.isSpacePressed = true;
        this.app.setHandMode(true);
        e.preventDefault();
        return;
      }

      for (const sc of this.shortcuts) {
        if (sc.match(e)) {
          e.preventDefault();
          sc.handler();
          return;
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space' && this.isSpacePressed) {
        this.isSpacePressed = false;
        this.app.setHandMode(false);
        e.preventDefault();
      }
    });
  }

  getAllShortcuts() {
    return this.shortcuts.map(sc => ({
      id: sc.id,
      name: sc.name,
      category: sc.category,
      displayKey: isMac ? sc.macKey : sc.winKey
    }));
  }
}
