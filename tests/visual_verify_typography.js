import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:3001...');
  await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // 1. Authenticate and navigate to editor
  console.log('Authenticating and entering editor...');
  await page.evaluate(async () => {
    const app = window.designForgeApp;
    if (app) {
      if (app.auth) {
        await app.auth.login('designer@designforge.ai', 'DesignForge2026!', true);
      }
      const authScreen = document.getElementById('authScreen');
      if (authScreen) authScreen.hidden = true;
      app.showWorkspaceView('editor');
    }
  });
  await page.waitForTimeout(1200);

  // 2. Inject text layer with missing custom font
  console.log('Injecting text layer with missing font...');
  await page.evaluate(() => {
    const app = window.designForgeApp;
    const activePage = app.engine.getActivePage();
    
    // Create text node with missing custom font
    const textNode = {
      id: 'node_test_missing_font',
      type: 'text',
      name: 'Executive KPI Title',
      transform: { x: 380, y: 120, width: 280, height: 42, rotation: 0 },
      style: { fills: [] },
      text: {
        content: 'Executive KPI Overview',
        fontFamily: 'AvenirNextPro-BoldCustom',
        fontSize: 24,
        fontWeight: '700',
        color: '#f8fafc',
        textAlign: 'left'
      }
    };
    activePage.nodes[textNode.id] = textNode;
    activePage.rootIds.push(textNode.id);

    // Select this text node so inspector shows typography
    app.engine.setSelection([textNode.id]);
    app.updateInspector();
    app.updateMissingFontsBadge();
  });

  await page.waitForTimeout(600);

  // Screenshot 1: Right Inspector with Typography Section, Missing Font Alert & System Fonts Dropdown
  await page.screenshot({ path: '/Users/rbiswas/.gemini/antigravity/brain/c91b06ab-752a-418c-b228-95c444e7031b/inspector_typography_missing_font_alert.png' });
  console.log('Saved inspector_typography_missing_font_alert.png');

  // 3. Open Missing Fonts Modal
  console.log('Opening Missing Fonts Modal...');
  await page.evaluate(() => {
    window.designForgeApp.openMissingFontsModal();
  });
  await page.waitForTimeout(600);

  // Screenshot 2: Figma-Inspired Missing Fonts Modal with missing font row & replacement selector
  await page.screenshot({ path: '/Users/rbiswas/.gemini/antigravity/brain/c91b06ab-752a-418c-b228-95c444e7031b/figma_missing_fonts_modal.png' });
  console.log('Saved figma_missing_fonts_modal.png');

  // 4. Test Skip button in modal
  console.log('Testing Skip button...');
  await page.evaluate(() => {
    document.getElementById('btnSkipMissingFonts')?.click();
  });
  await page.waitForTimeout(600);

  // Screenshot 3: Editor after Skip (warning banner dismissed, node kept as-is)
  await page.screenshot({ path: '/Users/rbiswas/.gemini/antigravity/brain/c91b06ab-752a-418c-b228-95c444e7031b/editor_after_skip_missing_font.png' });
  console.log('Saved editor_after_skip_missing_font.png');

  await browser.close();
  console.log('Visual verification complete!');
}

run().catch(err => {
  console.error('Error running visual verification:', err);
  process.exit(1);
});
