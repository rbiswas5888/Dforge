import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('--- 🧪 DesignForge AI: Figma Web Modal & Multi-Theme Verification Suite ---');

// 1. Verify index.html contains Figma Modals & Prompts
console.log('  ✓ 1. Validating Figma Universal Modal elements in index.html...');
const htmlPath = path.join(rootDir, 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

assert(html.includes('id="figmaPromptModal"'), 'Must have #figmaPromptModal for web Figma prompt dialogs');
assert(html.includes('id="figmaAiFloatingBar"'), 'Must have #figmaAiFloatingBar for floating AI prompt bar');
assert(html.includes('id="figmaToastContainer"'), 'Must have #figmaToastContainer for toast notifications');
assert(html.includes('id="btnOpenFigmaAiPrompt"'), 'Must have #btnOpenFigmaAiPrompt in command bar');
assert(html.includes('figma_modals.css'), 'Must link figma_modals.css');

// 2. Verify figma_modals.css
console.log('  ✓ 2. Validating Figma modal styles in figma_modals.css...');
const modalCssPath = path.join(rootDir, 'src', 'styles', 'figma_modals.css');
assert(fs.existsSync(modalCssPath), 'figma_modals.css must exist');
const modalCss = fs.readFileSync(modalCssPath, 'utf8');

assert(modalCss.includes('.figma-modal-backdrop'), 'Must style .figma-modal-backdrop');
assert(modalCss.includes('.figma-prompt-dialog'), 'Must style .figma-prompt-dialog');
assert(modalCss.includes('.figma-ai-floating-bar'), 'Must style .figma-ai-floating-bar');
assert(modalCss.includes('.figma-toast'), 'Must style .figma-toast');
assert(modalCss.includes('.figma-preset-chip'), 'Must style preset chips');

// 3. Verify Light, Dark & High Contrast theme coverage in designforge.css
console.log('  ✓ 3. Validating comprehensive multi-theme variables in designforge.css...');
const dfCssPath = path.join(rootDir, 'src', 'styles', 'designforge.css');
const dfCss = fs.readFileSync(dfCssPath, 'utf8');

assert(dfCss.includes('body.theme-axiom-dark,') && dfCss.includes('body.theme-dark'), 'Must define dark theme classes');
assert(dfCss.includes('body.theme-axiom-light,') && dfCss.includes('body.theme-light'), 'Must define light theme classes');
assert(dfCss.includes('body.theme-high-contrast'), 'Must define high contrast theme');

// Check that light theme provides light input backgrounds & dark text
assert(dfCss.includes('--bg-input: #FFFFFF;'), 'Light theme must set white input background');
assert(dfCss.includes('--text-main: #0F172A;'), 'Light theme must set dark primary text');
assert(dfCss.includes('--surface-canvas-chrome: #E4E4E7;'), 'Light theme must set light canvas chrome');

// 4. Verify Renderer Canvas theme responsiveness
console.log('  ✓ 4. Validating CanvasRenderer dynamic theme adaptation in renderer.js...');
const rendererPath = path.join(rootDir, 'src', 'engine', 'renderer.js');
const rendererCode = fs.readFileSync(rendererPath, 'utf8');

assert(rendererCode.includes('theme-axiom-light') && rendererCode.includes('theme-light'), 'Renderer must detect light mode');
assert(rendererCode.includes('theme-high-contrast'), 'Renderer must detect high contrast mode');
assert(rendererCode.includes('ctx.fillStyle = isHighContrast ? \'#000000\' : (isLight ? \'#E4E4E7\' : \'#0D0D0F\');'), 'Canvas background must adapt to theme');

// 5. Verify Controller methods in app.js
console.log('  ✓ 5. Validating Controller wiring in src/app.js...');
const appPath = path.join(rootDir, 'src', 'app.js');
const appCode = fs.readFileSync(appPath, 'utf8');

assert(appCode.includes('initFigmaModals()'), 'app.js must implement initFigmaModals');
assert(appCode.includes('showPromptModal('), 'app.js must implement showPromptModal');
assert(appCode.includes('showToast('), 'app.js must implement showToast');
assert(appCode.includes('openFigmaAiPromptBar('), 'app.js must implement openFigmaAiPromptBar');
assert(appCode.includes('addNewPage('), 'app.js must implement addNewPage');

console.log('\n🎉 ALL FIGMA MODAL & MULTI-THEME ACCEPTANCE CHECKS PASSED!\n');
