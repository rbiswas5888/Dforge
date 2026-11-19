import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('request', req => {
    console.log('[REQ]', req.method(), req.url());
  });

  page.on('response', res => {
    console.log('[RES]', res.status(), res.url());
  });

  page.on('console', msg => {
    console.log(`[CONSOLE ${msg.type()}]`, msg.text());
  });

  page.on('pageerror', err => {
    console.log('[PAGE ERROR]', err.stack || err.message);
  });

  page.on('requestfailed', req => {
    console.log('[FAILED REQ]', req.method(), req.url(), req.failure()?.errorText);
  });

  console.log('Navigating to http://localhost:3001/ ...');
  try {
    await page.goto('http://localhost:3001/', { waitUntil: 'load', timeout: 15000 });
    console.log('Load event fired!');
  } catch (e) {
    console.log('Navigation warning:', e.message);
  }

  // Check document elements & DF-UX provider
  const title = await page.title();
  const readyState = await page.evaluate(() => document.readyState);
  const hasCanvas2d = await page.evaluate(() => !!document.getElementById('canvas2d'));
  const hasDesignForge = await page.evaluate(() => !!window.designForge);
  const hasDesignForgeApp = await page.evaluate(() => !!window.designForgeApp);
  const activeAiProvider = await page.evaluate(() => window.designForgeApp?.ai?.service?.activeProviderName);
  const providerSelectVal = await page.evaluate(() => document.getElementById('aiProviderSelect')?.value);
  const statusLabelText = await page.evaluate(() => document.getElementById('aiModelStatusLabel')?.textContent?.trim());

  console.log('--- BROWSER VERIFICATION RESULTS ---');
  console.log('Page Title:', title);
  console.log('Document readyState:', readyState);
  console.log('Canvas2d Present:', hasCanvas2d);
  console.log('window.designForge Initialized:', hasDesignForge);
  console.log('window.designForgeApp Initialized:', hasDesignForgeApp);
  console.log('Active AI Provider:', activeAiProvider);
  console.log('Provider Select Value:', providerSelectVal);
  console.log('Status Label Text:', statusLabelText);

  // Test connection directly in browser context
  const testConnResult = await page.evaluate(async () => {
    const provider = window.designForgeApp?.ai?.service?.getProvider();
    return provider ? await provider.testConnection() : { error: 'No provider found' };
  });
  console.log('Browser testConnection():', JSON.stringify(testConnResult));

  // Test live generation in browser context
  console.log('Triggering live DF-UX prompt in browser...');
  const genResult = await page.evaluate(async () => {
    const plan = await window.designForgeApp?.ai?.generateDesignPlan('Create a high-conversion SaaS pricing table with 3 plans');
    return {
      intent: plan?.intent,
      operationsCount: plan?.operations?.length,
      hasDfir: !!plan?.dfir
    };
  });
  console.log('Live DF-UX Generation in Browser:', JSON.stringify(genResult));

  await browser.close();
})();
