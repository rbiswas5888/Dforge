import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') console.log(`[CONSOLE ERROR]`, msg.text());
  });

  console.log('Navigating to http://localhost:3001/ ...');
  await page.goto('http://localhost:3001/', { waitUntil: 'load', timeout: 15000 });
  await page.waitForTimeout(1000);

  // Check initial visibility of screens
  const screens = await page.evaluate(() => {
    const auth = document.getElementById('authScreen');
    const ws = document.getElementById('workspaceDashboard');
    const app = document.getElementById('appShell');
    const canvas = document.getElementById('canvas2d');
    const getVis = el => {
      if (!el) return 'missing';
      const style = window.getComputedStyle(el);
      return {
        display: style.display,
        visibility: style.visibility,
        hidden: el.hidden,
        zIndex: style.zIndex
      };
    };
    return {
      authScreen: getVis(auth),
      workspaceDashboard: getVis(ws),
      appShell: getVis(app),
      canvas: getVis(canvas)
    };
  });
  console.log('Screen visibility states:', JSON.stringify(screens, null, 2));

  // If in auth screen, login or bypass
  const isLoggedIn = await page.evaluate(() => {
    return window.designForgeApp?.auth?.isAuthenticated();
  });
  console.log('isLoggedIn:', isLoggedIn);

  // Now ensure we are in the editor
  await page.evaluate(() => {
    if (window.designForgeApp) {
      // Force into editor view if not already
      window.designForgeApp.showWorkspaceView?.('editor');
    }
  });
  await page.waitForTimeout(500);

  // Check what element is at canvas center
  const centerHit = await page.evaluate(() => {
    const canvas = document.getElementById('canvas2d');
    const rect = canvas.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const el = document.elementFromPoint(cx, cy);
    return {
      canvasRect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
      hitElement: el ? { tagName: el.tagName, id: el.id, className: el.className } : null
    };
  });
  console.log('Center hit test on canvas:', JSON.stringify(centerHit, null, 2));

  // Perform a right-click at the center of canvas
  const cx = centerHit.canvasRect.left + centerHit.canvasRect.width / 2;
  const cy = centerHit.canvasRect.top + centerHit.canvasRect.height / 2;
  console.log(`Right-clicking at (${cx}, ${cy})...`);

  // Listen to contextmenu and click events in the page
  await page.evaluate(() => {
    window._rightClickLogs = [];
    const pushLog = (type, e) => {
      window._rightClickLogs.push({
        type,
        button: e.button,
        target: e.target?.tagName + '#' + e.target?.id + '.' + e.target?.className
      });
    };
    window.addEventListener('contextmenu', e => pushLog('window contextmenu', e), true);
    window.addEventListener('mousedown', e => pushLog('window mousedown', e), true);
    window.addEventListener('mouseup', e => pushLog('window mouseup', e), true);
    window.addEventListener('click', e => pushLog('window click', e), true);
  });

  await page.mouse.click(cx, cy, { button: 'right' });
  await page.waitForTimeout(300);

  const menuStatus = await page.evaluate(() => {
    const ctxMenu = document.getElementById('canvasContextMenu');
    const logs = window._rightClickLogs;
    if (!ctxMenu) return { error: 'No #canvasContextMenu' };
    const style = window.getComputedStyle(ctxMenu);
    const rect = ctxMenu.getBoundingClientRect();
    return {
      display: style.display,
      visibility: style.visibility,
      opacity: style.opacity,
      zIndex: style.zIndex,
      rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
      eventLogs: logs
    };
  });
  console.log('Menu status after right-click:', JSON.stringify(menuStatus, null, 2));

  await page.screenshot({ path: '/Users/rbiswas/Documents/Design Project/LLM/scratch_right_click_test.png' });
  console.log('Screenshot saved to scratch_right_click_test.png');

  await browser.close();
})();
