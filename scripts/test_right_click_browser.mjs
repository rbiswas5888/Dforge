import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', msg => console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`));
  page.on('pageerror', err => console.log(`[PAGE ERROR] ${err.message}`));

  await page.goto('http://localhost:3001/', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(1000);

  console.log('--- 1. Testing Right Click on Canvas ---');
  // Right click on canvas at center
  const canvasBox = await page.locator('#canvas2d').boundingBox();
  console.log('Canvas boundingBox:', canvasBox);

  // Trigger contextmenu at x: 600, y: 400
  await page.mouse.move(600, 400);
  await page.mouse.down({ button: 'right' });
  await page.mouse.up({ button: 'right' });

  await page.waitForTimeout(200);

  const menuInfo = await page.evaluate(() => {
    const el = document.getElementById('canvasContextMenu');
    if (!el) return { found: false };
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    return {
      found: true,
      display: el.style.display,
      computedDisplay: style.display,
      visibility: style.visibility,
      opacity: style.opacity,
      zIndex: style.zIndex,
      position: style.position,
      inlineLeft: el.style.left,
      inlineTop: el.style.top,
      rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height, right: rect.right, bottom: rect.bottom },
      childCount: el.children.length,
      firstItemText: el.children[0]?.textContent?.trim()
    };
  });

  console.log('Context menu info after canvas right click:', JSON.stringify(menuInfo, null, 2));

  // Take a screenshot of the page to inspect visual appearance
  await page.screenshot({ path: 'scratch_right_click_canvas.png' });
  console.log('Saved screenshot to scratch_right_click_canvas.png');

  console.log('--- 2. Testing Right Click on Layer Item ---');
  // Check if layers tree has items
  const layerItem = await page.locator('.layer-item').first();
  const layerCount = await page.locator('.layer-item').count();
  console.log('Layer items count in sidebar:', layerCount);

  if (layerCount > 0) {
    const layerBox = await layerItem.boundingBox();
    console.log('First layer item box:', layerBox);
    await page.mouse.move(layerBox.x + 20, layerBox.y + 10);
    await page.mouse.down({ button: 'right' });
    await page.mouse.up({ button: 'right' });
    await page.waitForTimeout(200);

    const layerMenuInfo = await page.evaluate(() => {
      const el = document.getElementById('canvasContextMenu');
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return {
        display: el.style.display,
        computedDisplay: style.display,
        rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height }
      };
    });
    console.log('Context menu info after layer right click:', JSON.stringify(layerMenuInfo, null, 2));
    await page.screenshot({ path: 'scratch_right_click_layer.png' });
    console.log('Saved screenshot to scratch_right_click_layer.png');
  }

  await browser.close();
  console.log('Done test.');
})();
