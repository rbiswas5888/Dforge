import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('--- 🧪 DesignForge AI: Axiom Layout & Design System Spec Verification Suite ---');

// 1. Verify index.html DOM structure meets Axiom Specification
const htmlPath = path.join(rootDir, 'index.html');
assert(fs.existsSync(htmlPath), 'index.html must exist');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

console.log('  ✓ 1. Validating Primary Shell Components in index.html...');
assert(htmlContent.includes('class="top-bar global-command-bar"'), 'Must have .global-command-bar top application bar');
assert(htmlContent.includes('id="axiomModeRail"'), 'Must have #axiomModeRail vertical navigation rail');
assert(htmlContent.includes('id="pageSelectorHeader"'), 'Must have #pageSelectorHeader for rapid page switching');
assert(htmlContent.includes('id="btnPageSelectorMenu"'), 'Must have #btnPageSelectorMenu dropdown trigger');
assert(htmlContent.includes('id="btnQuickAddPage"'), 'Must have #btnQuickAddPage quick add button');
assert(htmlContent.includes('id="axiomBottomDrawer"'), 'Must have #axiomBottomDrawer collapsible drawer');
assert(htmlContent.includes('id="axiomStatusBar"'), 'Must have #axiomStatusBar 28px bottom status bar');
assert(htmlContent.includes('id="modalMobilePreviewQr"'), 'Must have #modalMobilePreviewQr live preview modal');

// Check Mode Rail 6 core modes
console.log('  ✓ 2. Validating Axiom 6-Mode Rail modes...');
const requiredModes = ['design', 'prototype', 'system', 'dev', 'comments', 'ai'];
requiredModes.forEach(mode => {
  assert(
    htmlContent.includes(`data-mode="${mode}"`),
    `Mode rail must include button for mode: "${mode}"`
  );
});

// Check Bottom Drawer 6 functional tabs
console.log('  ✓ 3. Validating Axiom Bottom Drawer tabs...');
const requiredDrawerTabs = ['timeline', 'variables', 'comments', 'issues', 'console', 'ai-activity'];
requiredDrawerTabs.forEach(tab => {
  assert(
    htmlContent.includes(`data-drawer-tab="${tab}"`),
    `Bottom drawer must include tab for: "${tab}"`
  );
});

// Check Status Bar items
console.log('  ✓ 4. Validating Axiom Status Bar telemetry elements...');
assert(htmlContent.includes('id="statusToolHint"'), 'Status bar must have tool hint label');
assert(htmlContent.includes('id="statusSelectionSummary"'), 'Status bar must have selection summary telemetry');
assert(htmlContent.includes('id="btnToggleBottomDrawer"'), 'Status bar must have drawer toggle button');
assert(htmlContent.includes('id="statusZoomLevel"'), 'Status bar must have zoom level indicator');

// 2. Verify src/styles/axiom_layout.css tokens and themes
console.log('  ✓ 5. Validating Design System Tokens in axiom_layout.css...');
const cssPath = path.join(rootDir, 'src', 'styles', 'axiom_layout.css');
assert(fs.existsSync(cssPath), 'src/styles/axiom_layout.css must exist');
const cssContent = fs.readFileSync(cssPath, 'utf8');

// Section 3 & 8 Tokens
assert(cssContent.includes('--command-bar-height: 48px;'), 'Must specify 48px command bar height');
assert(cssContent.includes('--mode-rail-width: 48px;'), 'Must specify 48px mode rail width');
assert(cssContent.includes('--navigator-width: 272px;'), 'Must specify 272px navigator width');
assert(cssContent.includes('--inspector-width: 312px;'), 'Must specify 312px inspector width');
assert(cssContent.includes('--status-bar-height: 28px;'), 'Must specify 28px status bar height');

// Palette tokens
assert(cssContent.includes('#0D0D0F'), 'Must include #0D0D0F base canvas chrome token');
assert(cssContent.includes('#141417'), 'Must include #141417 raised surface token');
assert(cssContent.includes('#1A1A1E'), 'Must include #1A1A1E input surface token');
assert(cssContent.includes('#312E81'), 'Must include #312E81 selected layer row token');
assert(cssContent.includes('#6366F1'), 'Must include #6366F1 brand accent token');
assert(cssContent.includes('#4F46E5'), 'Must include #4F46E5 action token');
assert(cssContent.includes('#22D3EE'), 'Must include #22D3EE cyan smart guides (distinct from error red)');

// Themes
assert(cssContent.includes('body.theme-axiom-dark'), 'Must define theme-axiom-dark');
assert(cssContent.includes('body.theme-axiom-light'), 'Must define theme-axiom-light');
assert(cssContent.includes('body.theme-high-contrast'), 'Must define theme-high-contrast');

// 3. Verify src/app.js wiring for Axiom Layout
console.log('  ✓ 6. Validating Controller Wiring in src/app.js...');
const appJsPath = path.join(rootDir, 'src', 'app.js');
assert(fs.existsSync(appJsPath), 'src/app.js must exist');
const appJsContent = fs.readFileSync(appJsPath, 'utf8');

assert(appJsContent.includes('initAxiomLayout()'), 'src/app.js must implement initAxiomLayout');
assert(appJsContent.includes('setAxiomMode('), 'src/app.js must implement setAxiomMode');
assert(appJsContent.includes('refreshDrawerContent('), 'src/app.js must implement refreshDrawerContent');
assert(appJsContent.includes('openMobilePreviewQrModal('), 'src/app.js must implement openMobilePreviewQrModal');
assert(appJsContent.includes('generateQRCodeSVG'), 'src/app.js must use generateQRCodeSVG for mobile QR');

console.log('\n🎉 ALL AXIOM LAYOUT & DESIGN SYSTEM SPEC TESTS PASSED SUCCESFULLY!\n');
