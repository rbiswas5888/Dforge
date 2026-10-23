/**
 * DesignForge AI — Central Input Router
 * Implements Section 27.1 of Design Engine Logical Parameters Specification:
 * Routes keyboard and gesture events by strict priority:
 * 1. Active text/code/input editor
 * 2. Modal/dialog/popover/menu currently owning focus
 * 3. Active direct-manipulation gesture
 * 4. Active tool operation
 * 5. Prototype mode wire/interaction operations
 * 6. Canvas selection and viewport gestures
 * 7. Application-level shortcuts
 */

export class CentralInputRouter {
  constructor(app) {
    this.app = app;
    this.activeGesture = null;
    this.activeModal = null;
  }

  /**
   * Determine whether an event originated from an active text input field
   */
  isTextInputActive(e) {
    const target = e.target;
    if (!target) return false;
    const tagName = target.tagName ? target.tagName.toUpperCase() : '';
    if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
      return true;
    }
    if (target.isContentEditable) {
      return true;
    }
    return false;
  }

  /**
   * Main keydown event processor
   */
  handleKeyDown(e) {
    // 1. Text input has absolute priority
    if (this.isTextInputActive(e)) {
      if (e.key === 'Escape') {
        e.target.blur();
      }
      return; // Do not intercept typing or shortcuts
    }

    // 2. Open Modal / Popover Priority
    if (typeof document !== 'undefined') {
      const openModal = document.querySelector('.modal-overlay.active, .modal.open, .token-popover.open');
      if (openModal) {
        if (e.key === 'Escape') {
          e.preventDefault?.();
          // Close topmost popover or modal
          const popover = document.getElementById('tokenVariablePopover');
          if (popover && popover.classList.contains('open')) {
            popover.classList.remove('open');
            return;
          }
          if (this.app.closeActiveModal) {
            this.app.closeActiveModal();
          }
          return;
        }
      }
    }

    // 3. Active Direct Manipulation Gesture Priority
    if (this.app.dragState && this.app.dragState.type) {
      if (e.key === 'Escape') {
        e.preventDefault();
        // Cancel active drag gesture and restore initial transforms
        this.app.cancelActiveGesture();
        return;
      }
    }

    // 4. Active Tool Escape Priority
    const activeTool = this.app.currentTool || this.app.activeTool;
    if (activeTool && activeTool !== 'select' && activeTool !== 'v') {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (this.app.setTool) this.app.setTool('select');
        else if (this.app.setActiveTool) this.app.setActiveTool('select');
        return;
      }
    }

    // 5. Canvas Selection / Node operations
    const isCmdOrCtrl = e.metaKey || e.ctrlKey;

    if (e.key === 'Escape') {
      e.preventDefault();
      // Clear selection
      if (this.app.engine?.setSelection) {
        this.app.engine.setSelection([]);
      }
      this.app.renderer?.render();
      if (this.app.updateInspector) this.app.updateInspector();
      return;
    }

    // Delete or Backspace
    if (e.key === 'Backspace' || e.key === 'Delete') {
      if (this.app.deleteSelected) {
        e.preventDefault();
        this.app.deleteSelected();
        return;
      }
      const sel = this.app.engine?.getSelection ? this.app.engine.getSelection() : [];
      if (sel.length > 0) {
        e.preventDefault();
        this.app.engine.deleteNodes(sel);
        this.app.renderer?.render();
        if (this.app.updateInspector) this.app.updateInspector();
        if (this.app.updateLayersTree) this.app.updateLayersTree();
        return;
      }
    }

    // Duplicate: Cmd/Ctrl + D
    if (isCmdOrCtrl && (e.key === 'd' || e.key === 'D')) {
      e.preventDefault();
      if (this.app.duplicateSelected) this.app.duplicateSelected();
      return;
    }

    // Select All: Cmd/Ctrl + A
    if (isCmdOrCtrl && (e.key === 'a' || e.key === 'A')) {
      e.preventDefault();
      if (this.app.selectAll) this.app.selectAll();
      return;
    }

    // Undo / Redo
    if (isCmdOrCtrl && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
      e.preventDefault();
      if (this.app.undo) this.app.undo();
      else if (this.app.engine?.undo) this.app.engine.undo();
      this.app.renderer?.render();
      if (this.app.updateInspector) this.app.updateInspector();
      if (this.app.updateLayersTree) this.app.updateLayersTree();
      return;
    }
    if ((isCmdOrCtrl && e.shiftKey && (e.key === 'z' || e.key === 'Z')) || (isCmdOrCtrl && (e.key === 'y' || e.key === 'Y'))) {
      e.preventDefault();
      if (this.app.redo) this.app.redo();
      else if (this.app.engine?.redo) this.app.engine.redo();
      this.app.renderer?.render();
      if (this.app.updateInspector) this.app.updateInspector();
      if (this.app.updateLayersTree) this.app.updateLayersTree();
      return;
    }

    // Layer Reordering: Cmd/Ctrl + [ / ] (Figma Parity)
    if (isCmdOrCtrl && (e.key === ']' || e.key === '}')) {
      e.preventDefault();
      const sel = this.app.engine?.getSelection ? this.app.engine.getSelection() : [];
      if (sel.length > 0) {
        const dir = (e.shiftKey || e.altKey) ? 'top' : 'up';
        for (const id of sel) {
          this.app.engine.reorderNode(id, dir);
        }
        this.app.renderer?.render();
        if (this.app.updateLayersTree) this.app.updateLayersTree();
      }
      return;
    }
    if (isCmdOrCtrl && (e.key === '[' || e.key === '{')) {
      e.preventDefault();
      const sel = this.app.engine?.getSelection ? this.app.engine.getSelection() : [];
      if (sel.length > 0) {
        const dir = (e.shiftKey || e.altKey) ? 'bottom' : 'down';
        for (const id of [...sel].reverse()) {
          this.app.engine.reorderNode(id, dir);
        }
        this.app.renderer?.render();
        if (this.app.updateLayersTree) this.app.updateLayersTree();
      }
      return;
    }

    // Group / Ungroup: Cmd/Ctrl + G / Cmd/Ctrl + Shift + G
    if (isCmdOrCtrl && (e.key === 'g' || e.key === 'G')) {
      e.preventDefault();
      const sel = this.app.engine?.getSelection ? this.app.engine.getSelection() : [];
      if (e.shiftKey) {
        // Ungroup
        if (sel.length > 0) {
          for (const id of sel) {
            this.app.engine?.ungroupNode(id);
          }
          this.app.renderer?.render();
          if (this.app.updateInspector) this.app.updateInspector();
          if (this.app.updateLayersTree) this.app.updateLayersTree();
        }
      } else {
        // Group
        if (sel.length > 0) {
          this.app.engine?.groupNodes(sel);
          this.app.renderer?.render();
          if (this.app.updateInspector) this.app.updateInspector();
          if (this.app.updateLayersTree) this.app.updateLayersTree();
        }
      }
      return;
    }

    // Rename Layer: Cmd/Ctrl + R
    if (isCmdOrCtrl && (e.key === 'r' || e.key === 'R')) {
      e.preventDefault();
      const sel = this.app.engine?.getSelection ? this.app.engine.getSelection() : [];
      if (sel.length > 0 && this.app.enterLayerRename) {
        this.app.enterLayerRename(sel[0]);
      }
      return;
    }

    // Tool activation shortcuts
    const switchTool = (t) => {
      if (this.app.setTool) this.app.setTool(t);
      else if (this.app.setActiveTool) this.app.setActiveTool(t);
    };

    if (!isCmdOrCtrl && !e.altKey) {
      const key = e.key.toLowerCase();
      if (key === 'v') { e.preventDefault(); switchTool('select'); }
      else if (key === 'k') { e.preventDefault(); switchTool('scale'); }
      else if (key === 'f') { e.preventDefault(); switchTool('frame'); }
      else if (key === 's' && !e.shiftKey) { e.preventDefault(); switchTool('section'); }
      else if (key === 'r') { e.preventDefault(); switchTool('rectangle'); }
      else if (key === 'o') { e.preventDefault(); switchTool('ellipse'); }
      else if (key === 'l') { e.preventDefault(); switchTool('line'); }
      else if (key === 'p' && !e.shiftKey) { e.preventDefault(); switchTool('pen'); }
      else if (key === 't') { e.preventDefault(); switchTool('text'); }
      else if (key === 'h') { e.preventDefault(); switchTool('hand'); }
      else if (key === 'c') { e.preventDefault(); switchTool('comment'); }
    }

    // Alt key measurement indicator
    if (e.key === 'Alt' || e.key === 'Option') {
      if (this.app.renderer) {
        this.app.renderer.altMeasureActive = true;
        this.app.renderer.render();
      }
    }
  }

  handleKeyUp(e) {
    if (e.key === 'Alt' || e.key === 'Option') {
      if (this.app.renderer) {
        this.app.renderer.altMeasureActive = false;
        this.app.renderer.render();
      }
    }
  }
}
