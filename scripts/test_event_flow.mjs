import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  });
  const page = await browser.newPage();
  await page.goto('http://localhost:3001/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  // Hook event loggers
  await page.evaluate(() => {
    window._eventLog = [];
    ['mousedown', 'mouseup', 'click', 'contextmenu', 'pointerdown', 'pointerup'].forEach(type => {
      window.addEventListener(type, (e) => {
        window._eventLog.push({
          type,
          button: e.button,
          target: e.target.tagName + (e.target.id ? '#' + e.target.id : '') + (e.target.className ? '.' + e.target.className : ''),
          defaultPrevented: e.defaultPrevented,
          clientX: e.clientX,
          clientY: e.clientY
        });
      }, true); // capture
    });
  });

  console.log('Sending right click via page.mouse.click(600, 400, { button: "right" })...');
  await page.mouse.click(600, 400, { button: 'right' });

  const log = await page.evaluate(() => window._eventLog);
  console.log('Event log for mouse.click right:', JSON.stringify(log, null, 2));

  const menuDisplay = await page.evaluate(() => {
    const el = document.getElementById('canvasContextMenu');
    return {
      styleDisplay: el.style.display,
      styleLeft: el.style.left,
      styleTop: el.style.top
    };
  });
  console.log('Menu display:', menuDisplay);

  await browser.close();
})();
