const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

(async () => {
  const root = path.resolve(__dirname, '..');
  const profile = path.join(root, '.local', 'x-profile');
  fs.mkdirSync(profile, { recursive: true });
  const context = await chromium.launchPersistentContext(profile, {
    headless: false,
    viewport: { width: 1280, height: 900 },
    args: ['--disable-blink-features=AutomationControlled']
  });
  const page = context.pages()[0] ?? (await context.newPage());
  await page.goto('https://x.com/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
  console.log(`BROWSER_OPEN ${profile}`);
  console.log('Log in in the browser window. This process waits 10 minutes and never sees your password.');
  for (let i = 0; i < 120; i += 1) {
    await page.waitForTimeout(5000);
    if (page.url().includes('/home')) {
      console.log('LOGGED_IN');
      break;
    }
  }
  await context.close();
  console.log('BROWSER_CLOSED');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
