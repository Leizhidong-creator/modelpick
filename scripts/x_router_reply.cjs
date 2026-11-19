const path = require('node:path');
const { chromium } = require('playwright');

const TEXT = `2,564 requests, 184 read per written token: what a per-token router gets wrong.

We price cost per solved task with retries. If the log is still around, drop it into the CSV eval — want to see where the local router lost.

https://leizhidong-creator.github.io/modelpick/eval.html`;

(async () => {
  const root = path.resolve(__dirname, '..');
  const context = await chromium.launchPersistentContext(path.join(root, '.local', 'x-profile'), {
    headless: false,
    viewport: { width: 1280, height: 1000 },
    args: ['--disable-blink-features=AutomationControlled']
  });
  const page = context.pages()[0] ?? (await context.newPage());
  await page.goto('https://x.com/mattperetti/status/2120165047779655700', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(4000);
  await page.locator('[data-testid="reply"]').first().click();
  await page.waitForTimeout(1500);
  const dialog = page.locator('[role="dialog"]').first();
  const box = dialog.locator('[data-testid="tweetTextarea_0"]');
  await box.waitFor({ state: 'visible', timeout: 20000 });
  await box.click();
  await page.keyboard.press('Control+A');
  await page.keyboard.insertText(TEXT);
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(root, '.local', 'x-router-reply.png'), fullPage: false });
  await dialog.getByRole('button', { name: /^(Reply|Post)$/ }).last().click();
  await page.waitForTimeout(6000);
  await page.screenshot({ path: path.join(root, '.local', 'x-router-reply-after.png'), fullPage: false });
  console.log('REPLIED');
  await context.close();
})().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
