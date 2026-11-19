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

  // Login
  console.log('Logging in with demo account...');
  await page.evaluate(async () => {
    const auth = window.designForgeApp.auth;
    await auth.login('designer@designforge.ai', 'DesignForge2026!');
    const authScreen = document.getElementById('authScreen');
    if (authScreen) authScreen.hidden = true;
    window.designForgeApp.showWorkspaceView('editor');
  });
  await page.waitForTimeout(1000);

  // 1. Test right-click on empty canvas area
  console.log('\n--- TEST 1: Empty Canvas Right-Click ---');
  // Right click at (500, 450)
  await page.mouse.click(500, 450, { button: 'right' });
  await page.waitForTimeout(300);

  const emptyCanvasMenu = await page.evaluate(() => {
    const ctxMenu = document.getElementById('canvasContextMenu');
    const style = window.getComputedStyle(ctxMenu);
    const rect = ctxMenu.getBoundingClientRect();
    const selectAll = document.getElementById('ctxSelectAll');
    const cut = document.getElementById('ctxCut');
    return {
      display: style.display,
      rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
      selectAllDisplay: selectAll?.style.display,
      cutDisplay: cut?.style.display,
      selectionCount: window.designForgeApp.engine.getSelection().length
    };
  });
  console.log('Empty Canvas Menu Result:', JSON.stringify(emptyCanvasMenu, null, 2));

  // 2. Dismiss menu by clicking on empty canvas
  console.log('\n--- TEST 2: Dismiss Menu on Left-Click ---');
  await page.mouse.click(300, 300, { button: 'left' });
  await page.waitForTimeout(300);
  const dismissedMenu = await page.evaluate(() => {
    const ctxMenu = document.getElementById('canvasContextMenu');
    return { display: ctxMenu.style.display };
  });
  console.log('Dismissed Menu Result:', JSON.stringify(dismissedMenu, null, 2));

  // 3. Test right-click directly on an object on the canvas
  console.log('\n--- TEST 3: Object Right-Click on Canvas ---');
  // Find where a node is rendered on canvas
  const nodePosition = await page.evaluate(() => {
    const p = window.designForgeApp.engine.getActivePage();
    const firstNode = Object.values(p.nodes)[0];
    if (!firstNode) return null;
    const renderer = window.designForgeApp.renderer;
    const screen = renderer.canvasToScreen(firstNode.transform.x + 20, firstNode.transform.y + 20);
    return { id: firstNode.id, x: screen.x, y: screen.y };
  });

  if (nodePosition) {
    console.log(`Right-clicking on node ${nodePosition.id} at (${nodePosition.x}, ${nodePosition.y})...`);
    await page.mouse.click(nodePosition.x, nodePosition.y, { button: 'right' });
    await page.waitForTimeout(300);

    const objectMenu = await page.evaluate(() => {
      const ctxMenu = document.getElementById('canvasContextMenu');
      const rect = ctxMenu.getBoundingClientRect();
      const cut = document.getElementById('ctxCut');
      const duplicate = document.getElementById('ctxDuplicate');
      return {
        display: ctxMenu.style.display,
        rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
        cutDisplay: cut?.style.display,
        duplicateDisplay: duplicate?.style.display,
        selection: window.designForgeApp.engine.getSelection()
      };
    });
    console.log('Object Menu Result:', JSON.stringify(objectMenu, null, 2));

    // Test duplicate from context menu
    console.log('\n--- TEST 4: Click Duplicate in Context Menu ---');
    const initialNodeCount = await page.evaluate(() => Object.keys(window.designForgeApp.engine.getActivePage().nodes).length);
    await page.click('#ctxDuplicate');
    await page.waitForTimeout(300);

    const afterDup = await page.evaluate(() => {
      const p = window.designForgeApp.engine.getActivePage();
      const ctxMenu = document.getElementById('canvasContextMenu');
      return {
        menuDisplay: ctxMenu.style.display,
        newNodeCount: Object.keys(p.nodes).length,
        selection: window.designForgeApp.engine.getSelection()
      };
    });
    console.log('After Duplicate Result:', JSON.stringify({ initialNodeCount, ...afterDup }, null, 2));
  }

  // 5. Test layers tree right-click
  console.log('\n--- TEST 5: Layers Panel Right-Click ---');
  const layerHit = await page.evaluate(() => {
    const item = document.querySelector('.layer-item');
    if (!item) return null;
    const r = item.getBoundingClientRect();
    return { id: item.dataset?.nodeId, x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });

  if (layerHit) {
    console.log(`Right-clicking on layer item at (${layerHit.x}, ${layerHit.y})...`);
    await page.mouse.click(layerHit.x, layerHit.y, { button: 'right' });
    await page.waitForTimeout(300);

    const layerMenu = await page.evaluate(() => {
      const ctxMenu = document.getElementById('canvasContextMenu');
      const rect = ctxMenu.getBoundingClientRect();
      return {
        display: ctxMenu.style.display,
        rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
        selection: window.designForgeApp.engine.getSelection()
      };
    });
    console.log('Layers Menu Result:', JSON.stringify(layerMenu, null, 2));
  }

  await page.screenshot({ path: '/Users/rbiswas/Documents/Design Project/LLM/scratch_final_right_click.png' });
  console.log('\nScreenshot saved to scratch_final_right_click.png');

  await browser.close();
})();
