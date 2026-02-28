import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Capture console messages
  page.on('console', msg => {
    console.log(`[BROWSER ${msg.type()}]:`, msg.text());
  });

  // Capture page errors
  page.on('pageerror', error => {
    console.log('[PAGE ERROR]:', error.message);
  });

  // Navigate to the page
  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });

  // Wait a bit for React to render
  await page.waitForTimeout(2000);

  // Get page content
  const content = await page.content();
  console.log('\n=== Page HTML (first 1000 chars) ===');
  console.log(content.substring(0, 1000));

  // Check for specific elements
  const hasQueryBlock = await page.locator('textarea').count();
  const hasSubmitButton = await page.locator('button:has-text("Submit")').count();

  console.log('\n=== Element Check ===');
  console.log('TextArea found:', hasQueryBlock > 0);
  console.log('Submit button found:', hasSubmitButton > 0);

  // Take a screenshot
  await page.screenshot({ path: '/tmp/frontend-screenshot.png', fullPage: true });
  console.log('\nScreenshot saved to /tmp/frontend-screenshot.png');

  await browser.close();
})();
