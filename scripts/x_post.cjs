const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const TEXT = `I lowered two model scores after independent arena data contradicted my priors:

Nano Banana Pro 96 → 91
Veo 3.1 95 → 89

The benchmark should hurt when the evidence says so.

40 models, 20 nodes, 177 tests, open source.
https://github.com/Leizhidong-creator/modelpick`;

(async () => {
  const root = path.resolve(__dirname, '..');
  const context = await chromium.launchPersistentContext(path.join(root, '.local', 'x-profile'), {
    headless: false,
    viewport: { width: 1280, height: 1000 },
    args: ['--disable-blink-features=AutomationControlled']
  });
  const page = context.pages()[0] ?? (await context.newPage());
  await page.goto('https://x.com/compose/post', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2500);
  if (page.url().includes('/login')) throw new Error('X session expired');
  const dialog = page.locator('[role="dialog"]').first();
  const box = dialog.locator('[data-testid="tweetTextarea_0"]');
  await box.waitFor({ state: 'visible', timeout: 30000 });
  await box.click();
  await page.keyboard.insertText(TEXT);
  const file = path.join(root, 'assets', 'scorecard.png');
  if (fs.existsSync(file)) {
    await dialog.locator('input[data-testid="fileInput"]').setInputFiles(file);
    await page.waitForTimeout(5000);
  }
  await page.screenshot({ path: path.join(root, '.local', 'x-calibration.png'), fullPage: false });
  if (process.env.X_SUBMIT === '1') {
    const post = dialog.locator('[data-testid="tweetButtonInline"]');
    if (await post.count()) await post.click();
    else await dialog.getByRole('button', { name: /^Post$/ }).last().click();
    await page.waitForTimeout(6000);
    await page.screenshot({ path: path.join(root, '.local', 'x-calibration-after.png'), fullPage: false });
    console.log('POSTED');
  }
  await context.close();
})().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
