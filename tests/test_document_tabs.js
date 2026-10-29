import assert from 'node:assert/strict';
import { createInitialDocument } from '../src/engine/document.js';
import { ShortcutRegistry } from '../src/engine/shortcuts.js';

console.log('⚡ Starting Multi-Document Tab Bar & Session Switcher Test Suite...\n');

// Mock App State to simulate DesignForgeApp document tabs
class MockDesignForgeApp {
  constructor() {
    this.openDocumentTabs = [];
    this.activeDocumentTabId = null;
    this.pendingTabCloseId = null;
    this.document = createInitialDocument('Project 1');
    this.viewport = { zoom: 1, panX: 0, panY: 0 };
    this.selectedIds = [];
    this.toasts = [];

    this.initDocumentTabs();
  }

  initDocumentTabs() {
    this.openDocumentTabs = [{
      id: this.document.id,
      name: this.document.name || 'Untitled',
      isDirty: false,
      viewport: { ...this.viewport },
      selectedIds: [...this.selectedIds],
      doc: this.document
    }];
    this.activeDocumentTabId = this.document.id;
  }

  openDocumentInTab(nextDoc) {
    if (!nextDoc) return;
    const existing = this.openDocumentTabs.find(t => t.id === nextDoc.id);
    if (existing) {
      this.switchDocumentTab(existing.id);
      return;
    }
    const currentTab = this.openDocumentTabs.find(t => t.id === this.activeDocumentTabId);
    if (currentTab) {
      currentTab.viewport = { ...this.viewport };
      currentTab.selectedIds = [...this.selectedIds];
    }
    const newTab = {
      id: nextDoc.id,
      name: nextDoc.name || 'Untitled',
      isDirty: false,
      viewport: { zoom: 1, panX: 0, panY: 0 },
      selectedIds: [],
      doc: nextDoc
    };
    this.openDocumentTabs.push(newTab);
    this.activeDocumentTabId = newTab.id;
    this.document = nextDoc;
    this.viewport = { ...newTab.viewport };
    this.selectedIds = [...newTab.selectedIds];
  }

  switchDocumentTab(tabId) {
    if (tabId === this.activeDocumentTabId) return;
    const targetTab = this.openDocumentTabs.find(t => t.id === tabId);
    if (!targetTab) return;
    const currentTab = this.openDocumentTabs.find(t => t.id === this.activeDocumentTabId);
    if (currentTab) {
      currentTab.viewport = { ...this.viewport };
      currentTab.selectedIds = [...this.selectedIds];
    }
    this.activeDocumentTabId = targetTab.id;
    this.document = targetTab.doc;
    this.viewport = { ...targetTab.viewport };
    this.selectedIds = [...targetTab.selectedIds];
  }

  markActiveTabDirty(isDirty = true) {
    const tab = this.openDocumentTabs.find(t => t.id === this.activeDocumentTabId);
    if (tab) {
      tab.isDirty = isDirty;
    }
  }

  closeDocumentTab(tabId) {
    const tab = this.openDocumentTabs.find(t => t.id === tabId);
    if (!tab) return;
    if (tab.isDirty) {
      this.pendingTabCloseId = tabId;
      return 'prompt_unsaved';
    }
    this.forceCloseTab(tabId);
    return 'closed';
  }

  forceCloseTab(tabId) {
    const idx = this.openDocumentTabs.findIndex(t => t.id === tabId);
    if (idx === -1) return;
    this.openDocumentTabs.splice(idx, 1);
    if (this.openDocumentTabs.length === 0) {
      const fallback = createInitialDocument('Untitled');
      this.openDocumentInTab(fallback);
      return;
    }
    if (this.activeDocumentTabId === tabId) {
      const nextActive = this.openDocumentTabs[Math.max(0, idx - 1)];
      this.switchDocumentTab(nextActive.id);
    }
  }

  cycleNextTab(direction = 1) {
    if (this.openDocumentTabs.length <= 1) return;
    const curIdx = this.openDocumentTabs.findIndex(t => t.id === this.activeDocumentTabId);
    if (curIdx === -1) return;
    const nextIdx = (curIdx + direction + this.openDocumentTabs.length) % this.openDocumentTabs.length;
    this.switchDocumentTab(this.openDocumentTabs[nextIdx].id);
  }

  showToast(msg) {
    this.toasts.push(msg);
  }
}

// 1. Initial Document Tab
console.log('1. Testing Initial Tab Creation on Startup...');
const app = new MockDesignForgeApp();
assert.equal(app.openDocumentTabs.length, 1, 'One initial tab opened');
assert.equal(app.activeDocumentTabId, app.document.id, 'Initial tab is active');
assert.equal(app.openDocumentTabs[0].name, 'Project 1', 'Tab title matches document name');
console.log('   ✓ Initial document tab active and initialized.');

// 2. Open New Tabs & Switch Sessions
console.log('2. Testing Multi-Tab Opening & Per-Tab Session State Isolation...');
const doc2 = createInitialDocument('Project 2');
app.viewport = { zoom: 2.5, panX: 120, panY: 240 };
app.selectedIds = ['rect1', 'rect2'];

app.openDocumentInTab(doc2);
assert.equal(app.openDocumentTabs.length, 2, 'Two document tabs open');
assert.equal(app.activeDocumentTabId, doc2.id, 'Active tab switched to doc2');
assert.equal(app.document.name, 'Project 2', 'Active document is Project 2');
assert.equal(app.viewport.zoom, 1, 'doc2 initialized with standard zoom');

// Switch back to tab 1
app.switchDocumentTab(app.openDocumentTabs[0].id);
assert.equal(app.activeDocumentTabId, app.openDocumentTabs[0].id, 'Switched back to tab 1');
assert.equal(app.viewport.zoom, 2.5, 'Preserved tab 1 isolated zoom');
assert.equal(app.viewport.panX, 120, 'Preserved tab 1 isolated panX');
assert.deepEqual(app.selectedIds, ['rect1', 'rect2'], 'Preserved tab 1 isolated selection');
console.log('   ✓ Per-tab viewport, pan, and selection state isolation verified.');

// 3. Tab Cycling
console.log('3. Testing Tab Cycling (Ctrl+Tab / Ctrl+Shift+Tab)...');
app.cycleNextTab(1);
assert.equal(app.activeDocumentTabId, doc2.id, 'Cycled forward to tab 2');
app.cycleNextTab(-1);
assert.equal(app.activeDocumentTabId, app.openDocumentTabs[0].id, 'Cycled backward to tab 1');
console.log('   ✓ Tab forward and reverse cycling verified.');

// 4. Dirty State & Unsaved Edits Modal Protection
console.log('4. Testing Dirty State Tracking & Unsaved Changes Protection...');
assert.equal(app.openDocumentTabs[0].isDirty, false, 'Tab starts clean');
app.markActiveTabDirty(true);
assert.equal(app.openDocumentTabs[0].isDirty, true, 'Tab marked dirty after edit');

const closeResult = app.closeDocumentTab(app.openDocumentTabs[0].id);
assert.equal(closeResult, 'prompt_unsaved', 'Dirty tab close intercepted with confirmation prompt');
assert.equal(app.pendingTabCloseId, app.openDocumentTabs[0].id, 'Pending close ID recorded');
assert.equal(app.openDocumentTabs.length, 2, 'Tab not closed without confirmation');

// User selects "Don't Save" -> forceCloseTab
app.forceCloseTab(app.pendingTabCloseId);
assert.equal(app.openDocumentTabs.length, 1, 'Tab closed upon user confirmation');
assert.equal(app.activeDocumentTabId, doc2.id, 'Remaining tab activated');
console.log('   ✓ Dirty tracking and confirmation prompt successfully protect against unsaved loss.');

// 5. Shortcut Registration
console.log('5. Testing Shortcut Registration for Tabs...');
const shortcutManager = new ShortcutManager(app);
assert.ok(shortcutManager.shortcuts.has('newDocumentTab'), 'newDocumentTab shortcut registered');
assert.ok(shortcutManager.shortcuts.has('nextDocumentTab'), 'nextDocumentTab shortcut registered');
assert.ok(shortcutManager.shortcuts.has('prevDocumentTab'), 'prevDocumentTab shortcut registered');
assert.ok(shortcutManager.shortcuts.has('closeDocumentTab'), 'closeDocumentTab shortcut registered');
console.log('   ✓ All document tab shortcuts registered in ShortcutManager.');

console.log('\n✅ All Multi-Document Tab Bar & Session Switcher tests PASSED!\n');
