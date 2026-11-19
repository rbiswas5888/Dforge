import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Navigating to http://127.0.0.1:3001/ ...');
  await page.goto('http://127.0.0.1:3001/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(1000);

  // Authenticate & open editor
  await page.evaluate(async () => {
    const auth = window.designForgeApp.auth;
    await auth.login('designer@designforge.ai', 'DesignForge2026!');
    const authScreen = document.getElementById('authScreen');
    if (authScreen) authScreen.hidden = true;
    window.designForgeApp.showWorkspaceView('editor');
  });
  await page.waitForTimeout(1000);

  // 1. Force Light Mode
  console.log('\n--- VERIFYING LIGHT MODE ---');
  await page.evaluate(() => {
    window.designForgeApp.toggleTheme('axiom-light');
  });
  await page.waitForTimeout(500);

  // Right-click at center of canvas
  await page.mouse.click(500, 350, { button: 'right' });
  await page.waitForTimeout(400);

  const lightMenu = await page.evaluate(() => {
    const ctx = document.getElementById('canvasContextMenu');
    const firstItem = ctx.querySelector('.context-menu-item:not([style*="display: none"])');
    const span = firstItem?.querySelector('span');
    const divider = ctx.querySelector('.context-menu-divider:not([style*="display: none"])');
    const ctxStyle = window.getComputedStyle(ctx);
    const itemStyle = firstItem ? window.getComputedStyle(firstItem) : null;
    const spanStyle = span ? window.getComputedStyle(span) : null;
    const divStyle = divider ? window.getComputedStyle(divider) : null;
    return {
      bodyClasses: document.body.className,
      menuDisplay: ctxStyle.display,
      menuBg: ctxStyle.backgroundColor,
      menuBorder: ctxStyle.borderColor,
      itemText: firstItem?.textContent?.trim(),
      itemColor: itemStyle?.color,
      itemBg: itemStyle?.backgroundColor,
      spanColor: spanStyle?.color,
      dividerBg: divStyle?.backgroundColor
    };
  });
  console.log('Light Mode Context Menu Computed Styles:', JSON.stringify(lightMenu, null, 2));

  await page.screenshot({ path: '/Users/rbiswas/Documents/Design Project/LLM/scratch_light_mode_menu.png' });
  console.log('Screenshot saved: scratch_light_mode_menu.png');

  // Dismiss menu
  await page.mouse.click(300, 200, { button: 'left' });
  await page.waitForTimeout(300);

  // 2. Force Dark Mode
  console.log('\n--- VERIFYING DARK MODE ---');
  await page.evaluate(() => {
    window.designForgeApp.toggleTheme('axiom-dark');
  });
  await page.waitForTimeout(500);

  // Right-click at center of canvas
  await page.mouse.click(500, 350, { button: 'right' });
  await page.waitForTimeout(400);

  const darkMenu = await page.evaluate(() => {
    const ctx = document.getElementById('canvasContextMenu');
    const firstItem = ctx.querySelector('.context-menu-item:not([style*="display: none"])');
    const span = firstItem?.querySelector('span');
    const divider = ctx.querySelector('.context-menu-divider:not([style*="display: none"])');
    const ctxStyle = window.getComputedStyle(ctx);
    const itemStyle = firstItem ? window.getComputedStyle(firstItem) : null;
    const spanStyle = span ? window.getComputedStyle(span) : null;
    const divStyle = divider ? window.getComputedStyle(divider) : null;
    return {
      bodyClasses: document.body.className,
      menuDisplay: ctxStyle.display,
      menuBg: ctxStyle.backgroundColor,
      menuBorder: ctxStyle.borderColor,
      itemText: firstItem?.textContent?.trim(),
      itemColor: itemStyle?.color,
      itemBg: itemStyle?.backgroundColor,
      spanColor: spanStyle?.color,
      dividerBg: divStyle?.backgroundColor
    };
  });
  console.log('Dark Mode Context Menu Computed Styles:', JSON.stringify(darkMenu, null, 2));

  await page.screenshot({ path: '/Users/rbiswas/Documents/Design Project/LLM/scratch_dark_mode_menu.png' });
  console.log('Screenshot saved: scratch_dark_mode_menu.png');

  await browser.close();
})();
