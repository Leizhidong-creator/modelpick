const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const TEXT = `Your coding agent picks one model for everything.

A frontier model for a ticket. A frontier model for a 3D prop. A frontier model for a thumbnail.

I built ModelPick: best value per node, cost per solved task. 40 models, 20 nodes, open source.

93s demo:
https://leizhidong-creator.github.io/modelpick/`;

(async () => {
  const root = path.resolve(__dirname, '..');
  const profile = path.join(root, '.local', 'x-profile');
  const screenshot = path.join(root, '.local', 'x-compose.png');
  const context = await chromium.launchPersistentContext(profile, {
    headless: false,
    viewport: { width: 1280, height: 1000 },
    args: ['--disable-blink-features=AutomationControlled']
  });
  const page = context.pages()[0] ?? (await context.newPage());
  await page.goto('https://x.com/compose/post', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2500);
  if (page.url().includes('/login')) throw new Error('X session expired; run scripts/x_session.cjs again');
  const dialog = page.locator('[role="dialog"]').first();
  const box = dialog.locator('[data-testid="tweetTextarea_0"]');
  await box.waitFor({ state: 'visible', timeout: 30000 });
  await box.click();
  await page.keyboard.insertText(TEXT);
  const file = path.join(root, 'assets', 'social-preview.png');
  if (fs.existsSync(file)) {
    await dialog.locator('input[data-testid="fileInput"]').setInputFiles(file);
    await page.waitForTimeout(3000);
  }
  for (let i = 0; i < 60; i += 1) {
    if (await dialog.getByText('Processing').count() === 0) break;
    await page.waitForTimeout(3000);
  }
  await page.waitForTimeout(2500);
  await page.screenshot({ path: screenshot, fullPage: false });
  console.log(`COMPOSE_READY ${screenshot}`);
  if (process.env.X_SUBMIT === '1') {
    const postButton = dialog.locator('[data-testid="tweetButtonInline"]');
    if (await postButton.count()) await postButton.click();
    else await dialog.getByRole('button', { name: 'Post' }).last().click();
    await page.waitForTimeout(8000);
    await page.screenshot({ path: screenshot.replace('.png', '-after.png'), fullPage: false });
    console.log('SUBMITTED');
  } else {
    console.log('Review the post in the browser and click Post. This process waits 5 minutes and does not submit for you.');
  }
  for (let i = 0; i < 60; i += 1) {
    await page.waitForTimeout(5000);
    const toast = await page.locator('[data-testid="toast"]').count();
    if (toast > 0) {
      console.log('POST_SENT');
      break;
    }
  }
  await context.close();
  console.log('BROWSER_CLOSED');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
