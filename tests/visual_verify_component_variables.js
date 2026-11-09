import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:3001...');
  await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Authenticate and navigate to editor
  console.log('Authenticating and switching to editor view...');
  await page.evaluate(async () => {
    const app = window.designForgeApp;
    if (app) {
      if (app.auth) {
        await app.auth.login('designer@designforge.ai', 'DesignForge2026!', true);
      }
      const authScreen = document.getElementById('authScreen');
      if (authScreen) authScreen.hidden = true;
      app.showWorkspaceView('editor');
      const activePage = app.engine.getActivePage();
      const nodeIds = Object.keys(activePage.nodes);
      if (nodeIds.length > 0) {
        app.engine.setSelection([nodeIds[0]]);
        app.updateInspector();
      }
    }
  });
  await page.waitForTimeout(1500);

  // 1. Select a node on canvas to populate inspector
  console.log('Selecting node on canvas...');
  await page.evaluate(() => {
    const app = window.designForgeApp;
    const activePage = app.engine.getActivePage();
    const nodeIds = Object.keys(activePage.nodes);
    if (nodeIds.length > 0) {
      app.engine.setSelection([nodeIds[0]]);
      app.updateInspector();
    }
  });
  await page.waitForTimeout(500);

  // Take screenshot of inspector with selection colors and variable controls
  await page.screenshot({ path: '/Users/rbiswas/.gemini/antigravity/brain/c91b06ab-752a-418c-b228-95c444e7031b/inspector_with_variables_and_selection_colors.png' });
  console.log('Saved inspector_with_variables_and_selection_colors.png');

  // 2. Open Add Variable Modal
  console.log('Opening Add Variable Modal...');
  await page.evaluate(() => {
    document.getElementById('btnOpenAddVariableModal')?.click();
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/Users/rbiswas/.gemini/antigravity/brain/c91b06ab-752a-418c-b228-95c444e7031b/modal_add_variable_to_component.png' });
  console.log('Saved modal_add_variable_to_component.png');

  // Close Add Variable Modal
  await page.evaluate(() => {
    document.getElementById('btnCloseModalAddVar')?.click();
  });
  await page.waitForTimeout(300);

  // 3. Open Replace Component Modal
  console.log('Opening Replace Component Modal...');
  await page.evaluate(() => {
    document.getElementById('btnOpenReplaceComponentModal')?.click();
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/Users/rbiswas/.gemini/antigravity/brain/c91b06ab-752a-418c-b228-95c444e7031b/modal_replace_component.png' });
  console.log('Saved modal_replace_component.png');

  // Close Replace Component Modal
  await page.evaluate(() => {
    document.getElementById('btnCloseModalReplaceComp')?.click();
  });
  await page.waitForTimeout(300);

  // 4. Open Audit Component Modal
  console.log('Opening Audit Component Modal...');
  await page.evaluate(() => {
    document.getElementById('btnOpenAuditComponentModal')?.click();
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/Users/rbiswas/.gemini/antigravity/brain/c91b06ab-752a-418c-b228-95c444e7031b/modal_audit_component.png' });
  console.log('Saved modal_audit_component.png');

  // Close Audit Modal
  await page.evaluate(() => {
    document.getElementById('btnCloseModalAuditComp')?.click();
  });
  await page.waitForTimeout(300);

  // 5. Open AI Assistant Tab and AI Settings Panel
  console.log('Opening AI Assistant and Settings Panel...');
  await page.evaluate(() => {
    document.getElementById('btnTabAiAssistant')?.click();
    const panel = document.getElementById('aiSettingsPanel');
    if (panel) panel.style.display = 'block';
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/Users/rbiswas/.gemini/antigravity/brain/c91b06ab-752a-418c-b228-95c444e7031b/multi_llm_ai_settings_panel.png' });
  console.log('Saved multi_llm_ai_settings_panel.png');

  await browser.close();
  console.log('Visual verification complete!');
}

run().catch(err => {
  console.error('Visual verification failed:', err);
  process.exit(1);
});
