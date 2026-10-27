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

    const isCmdOrCtrl = !!(e.metaKey || e.ctrlKey);

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

    // 3.5. Active Vector Edit Mode Priority (§11.6 & §11.7)
    if (this.app.editingState === 'VECTOR_EDIT') {
      if (e.key === 'Escape' || e.key === 'Enter') {
        e.preventDefault();
        this.app.exitVectorEdit?.(true);
        return;
      }
      if (isCmdOrCtrl && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        // Scoped Select All Points in active path(s) (§11.6 item 3)
        this.app.selectAllAnchors?.();
        return;
      }
      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        // Delete selected points, NOT the whole layer (§11.10)
        this.app.deleteSelectedAnchors?.();
        return;
      }
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
        const delta = e.shiftKey ? 10 : 1;
        let dx = 0, dy = 0;
        if (e.key === 'ArrowLeft') dx = -delta;
        else if (e.key === 'ArrowRight') dx = delta;
        else if (e.key === 'ArrowUp') dy = -delta;
        else if (e.key === 'ArrowDown') dy = delta;
        this.app.nudgeSelectedAnchors?.(dx, dy);
        return;
      }
    }

    // 4. Active Tool Escape Priority
    const activeTool = this.app.currentTool || this.app.activeTool;
    if (activeTool && activeTool !== 'select' && activeTool !== 'v') {
      if (e.key === 'Enter' && activeTool === 'pen' && this.app.penAnchors?.length > 1) {
        e.preventDefault();
        this.app.finishPenPath?.(false);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        if (activeTool === 'pen') this.app.cancelPenPath?.();
        if (this.app.setTool) this.app.setTool('select');
        else if (this.app.setActiveTool) this.app.setActiveTool('select');
        return;
      }
    }

    // 4.5. Enter / Shift+Enter / Tab (Figma Drill-in & Hierarchy Navigation - Functional Map Part A & D2)
    if ((!this.app.editingState || this.app.editingState === 'OBJECT_SELECT')) {
      if (e.key === 'Enter') {
        const sel = this.app.engine?.getSelection ? this.app.engine.getSelection() : [];
        if (sel.length === 1) {
          if (e.shiftKey) {
            e.preventDefault();
            this.app.selectParent?.();
            return;
          }
          const node = this.app.engine?.getNode(sel[0]);
          if (node && ['rectangle', 'polygon', 'star', 'line', 'arrow', 'vector'].includes(node.type)) {
            e.preventDefault();
            this.app.enterVectorEdit?.(sel[0]);
            return;
          }
          if (node && (node.type === 'frame' || node.type === 'group' || node.type === 'section')) {
            e.preventDefault();
            this.app.selectChildren?.();
            return;
          }
        }
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        if (e.shiftKey) {
          this.app.selectPrevSibling?.();
        } else {
          this.app.selectNextSibling?.();
        }
        return;
      }
    }

    // 4.6. Dev Mode Toggle: Shift+D (Functional Map Part A & E15)
    if (!isCmdOrCtrl && !e.altKey && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
      e.preventDefault();
      this.app.toggleDevMode?.();
      return;
    }

    // 4.7. Add Auto Layout: Shift+A (Functional Map Part E4)
    if (!isCmdOrCtrl && !e.altKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
      e.preventDefault();
      this.app.addAutoLayoutToSelected?.();
      return;
    }

    // 4.8. Flip Objects: Shift+H / Shift+V (Functional Map Part D3)
    if (!isCmdOrCtrl && !e.altKey && e.shiftKey && (e.key === 'H' || e.key === 'h')) {
      e.preventDefault();
      this.app.flipHorizontal?.();
      return;
    }
    if (!isCmdOrCtrl && !e.altKey && e.shiftKey && (e.key === 'V' || e.key === 'v')) {
      e.preventDefault();
      this.app.flipVertical?.();
      return;
    }

    // 4.9. Copy / Paste Properties: Cmd/Ctrl + Alt + C / V (Functional Map Part D3)
    if (isCmdOrCtrl && e.altKey && (e.key === 'c' || e.key === 'C')) {
      e.preventDefault();
      this.app.copyProperties?.();
      return;
    }
    if (isCmdOrCtrl && e.altKey && (e.key === 'v' || e.key === 'V')) {
      e.preventDefault();
      this.app.pasteProperties?.();
      return;
    }

    // 4.10. Place Image/Video: Cmd/Ctrl + Shift + K (Functional Map Part C & F1)
    if (isCmdOrCtrl && e.shiftKey && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      this.app.triggerPlaceImage?.();
      return;
    }

    // 4.11. Create Component: Cmd/Ctrl + Alt + K (Functional Map Part F6)
    if (isCmdOrCtrl && e.altKey && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      this.app.createComponentFromSelection?.();
      return;
    }

    // 4.12. Outline Mode: Cmd/Ctrl + Y (Functional Map Part D1)
    if (isCmdOrCtrl && (e.key === 'y' || e.key === 'Y') && !e.shiftKey) {
      e.preventDefault();
      this.app.toggleOutlineMode?.();
      return;
    }

    // 4.13. Toggle Rulers: Shift+R (Functional Map Part D1)
    if (!isCmdOrCtrl && !e.altKey && e.shiftKey && (e.key === 'R' || e.key === 'r')) {
      e.preventDefault();
      this.app.toggleRulers?.();
      return;
    }

    // 4.14. Toggle Grid: Cmd/Ctrl + ' (Functional Map Part D1)
    if (isCmdOrCtrl && (e.key === "'" || e.key === '"')) {
      e.preventDefault();
      this.app.toggleGrid?.();
      return;
    }

    // 4.15. Zoom Shortcuts: Shift+0 (100%), Shift+1 (fit), Shift+2 (selection) (Functional Map Part D1)
    if (!isCmdOrCtrl && !e.altKey && e.shiftKey) {
      if (e.key === '0') { e.preventDefault(); this.app.zoom100?.(); return; }
      if (e.key === '1') { e.preventDefault(); this.app.zoomToFit?.(); return; }
      if (e.key === '2') { e.preventDefault(); this.app.zoomToSelection?.(); return; }
    }

    // 5. Canvas Selection / Node operations
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

    // Arrow keys nudge selected canvas nodes
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
      const sel = this.app.engine?.getSelection ? this.app.engine.getSelection() : [];
      if (sel.length > 0) {
        e.preventDefault();
        const delta = e.shiftKey ? 10 : 1;
        let dx = 0, dy = 0;
        if (e.key === 'ArrowLeft') dx = -delta;
        else if (e.key === 'ArrowRight') dx = delta;
        else if (e.key === 'ArrowUp') dy = -delta;
        else if (e.key === 'ArrowDown') dy = delta;
        for (const id of sel) {
          const n = this.app.engine.getNode(id);
          if (n && !n.locked) {
            this.app.engine.updateNode(id, {
              transform: { x: n.transform.x + dx, y: n.transform.y + dy }
            }, 'Nudge layer');
          }
        }
        this.app.renderer?.render();
        if (this.app.updateInspector) this.app.updateInspector();
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
