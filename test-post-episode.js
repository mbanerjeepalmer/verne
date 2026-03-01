import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Collect console messages for debugging
  page.on('console', (msg) => {
    if (msg.text().includes('Websocket')) {
      console.log(`[browser] ${msg.text()}`);
    }
  });

  console.log('Opening http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

  // Wait for WebSocket to connect
  await page.waitForTimeout(2000);

  console.log('Submitting query...');
  await page.fill('textarea', 'best episodes about large language models');
  await page.click('button:has-text("Submit")');

  console.log('Waiting for podcast cards (up to 120s)...');
  try {
    // Wait for at least one FullPodcastCard to appear (they render as Card elements with play buttons)
    await page.waitForSelector('button[aria-label="Play podcast"]', { timeout: 120_000 });

    const cardCount = await page.locator('button[aria-label="Play podcast"]').count();
    console.log(`\n✅ ${cardCount} podcast card(s) appeared!`);

    // Verify card content
    const firstCardName = await page.locator('h3').first().textContent();
    console.log(`First card: "${firstCardName}"`);

    // Check for the message area too
    const message = await page.locator('.text-black\\/70').textContent().catch(() => null);
    if (message) {
      console.log(`Agent message: "${message.slice(0, 100)}..."`);
    }
  } catch (err) {
    console.log('\n❌ No podcast cards appeared within timeout.');
    console.log('Check that backend (port 3001) is running with valid API keys.');
  }

  await page.screenshot({ path: '/tmp/test-post-episode.png', fullPage: true });
  console.log('Screenshot saved to /tmp/test-post-episode.png');

  console.log('\nBrowser stays open for 15s...');
  await page.waitForTimeout(15_000);
  await browser.close();
})();
