import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Capture WS events via CDP — console.log with object args doesn't stringify reliably
  const wsEvents = [];
  const client = await page.context().newCDPSession(page);
  await client.send('Runtime.enable');
  client.on('Runtime.consoleAPICalled', (event) => {
    const text = event.args.map((a) => a.value ?? a.description ?? '').join(' ');
    if (text.includes('Websocket event received')) {
      // The second arg is the parsed JSON object
      const objArg = event.args.find((a) => a.type === 'object' && a.preview);
      if (objArg?.preview?.properties) {
        const props = Object.fromEntries(
          objArg.preview.properties.map((p) => [p.name, p.value])
        );
        wsEvents.push(props);
        console.log(`[ws] ${props.event_type}`);
      }
    }
  });

  console.log('Opening http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  console.log('Submitting query...');
  await page.fill('textarea', 'best episodes about large language models');
  await page.click('button:has-text("Submit")');

  console.log('Waiting for streaming messages (up to 120s)...');

  try {
    // Wait for any intermediate message type to appear via data attributes
    await page.waitForSelector(
      '[data-msg-type="reasoning"], [data-msg-type="tool_call"], [data-msg-type="tool_result"]',
      { timeout: 120_000 }
    );
    console.log('\n✅ Intermediate messages appeared!');

    const reasoning = await page.locator('[data-msg-type="reasoning"]').count();
    const toolCall = await page.locator('[data-msg-type="tool_call"]').count();
    const toolResult = await page.locator('[data-msg-type="tool_result"]').count();
    console.log(`   reasoning: ${reasoning}, tool_call: ${toolCall}, tool_result: ${toolResult}`);

    // Screenshot while still streaming
    await page.screenshot({ path: '/tmp/test-streaming-intermediate.png', fullPage: true });
    console.log('Intermediate screenshot → /tmp/test-streaming-intermediate.png');

  } catch {
    console.log('\n⚠️  No intermediate messages within timeout.');
  }

  // Wait for podcast cards
  try {
    await page.waitForSelector('button[aria-label="Play podcast"]', { timeout: 120_000 });
    const cards = await page.locator('button[aria-label="Play podcast"]').count();
    console.log(`\n✅ ${cards} podcast card(s) appeared!`);
  } catch {
    console.log('\n⚠️  No podcast cards appeared.');
  }

  // Final counts
  const reasoning = await page.locator('[data-msg-type="reasoning"]').count();
  const toolCall = await page.locator('[data-msg-type="tool_call"]').count();
  const toolResult = await page.locator('[data-msg-type="tool_result"]').count();
  console.log(`\nFinal message counts — reasoning: ${reasoning}, tool_call: ${toolCall}, tool_result: ${toolResult}`);

  await page.screenshot({ path: '/tmp/test-streaming-final.png', fullPage: true });
  console.log('Final screenshot → /tmp/test-streaming-final.png');

  // WS event summary
  console.log(`\n--- ${wsEvents.length} WebSocket events ---`);
  const counts = {};
  wsEvents.forEach((e) => { counts[e.event_type] = (counts[e.event_type] || 0) + 1; });
  Object.entries(counts).forEach(([t, c]) => console.log(`   ${t}: ${c}`));

  // Verify ordering
  const firstIntermediate = wsEvents.findIndex((e) =>
    ['reasoning', 'tool_call', 'tool_result', 'assistant'].includes(e.event_type)
  );
  const firstEpisodes = wsEvents.findIndex((e) => e.event_type === 'episodes');
  if (firstIntermediate >= 0 && firstEpisodes >= 0 && firstIntermediate < firstEpisodes) {
    console.log(`\n✅ Streaming verified: intermediate events arrived before episodes`);
  } else if (firstIntermediate >= 0 && firstEpisodes < 0) {
    console.log(`\n✅ Intermediate events received (no episodes in this run)`);
  } else if (firstIntermediate < 0) {
    console.log('\n❌ No intermediate events captured via CDP');
  }

  console.log('\nBrowser stays open for 15s...');
  await page.waitForTimeout(15_000);
  await browser.close();
})();
