import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false }); // Open visible browser
  const page = await browser.newPage();

  console.log('Opening http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

  console.log('Waiting for page to load...');
  await page.waitForTimeout(2000);

  console.log('Typing first query...');
  await page.fill('textarea', 'What are some good tech podcasts?');

  console.log('Clicking Submit...');
  await page.click('button:has-text("Submit")');

  console.log('Waiting for clarification message...');
  await page.waitForTimeout(3000);

  console.log('Typing second query...');
  await page.fill('textarea', 'Tech podcasts about Kafka and distributed systems');

  console.log('Clicking Submit again...');
  await page.click('button:has-text("Submit")');

  console.log('Waiting for podcast results...');
  await page.waitForTimeout(3000);

  // Take screenshot of final state
  await page.screenshot({ path: '/tmp/test-result.png', fullPage: true });
  console.log('\n✅ Test complete! Screenshot saved to /tmp/test-result.png');
  console.log('The browser will stay open for 10 seconds so you can see the result...');

  await page.waitForTimeout(10000);
  await browser.close();
})();
