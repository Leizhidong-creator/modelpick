const path = require('node:path');
const { chromium } = require('playwright');

const TEXT = `Looking for 5 coding-agent teams to test this on their own tasks.

Run modelpick eval on 20–50 pass/fail runs. I will publish what the router gets wrong, with your permission.

No signup, no call:
https://github.com/Leizhidong-creator/modelpick/blob/main/docs/EVALS.md`;

(async () => {
  const root = path.resolve(__dirname, '..');
  const context = await chromium.launchPersistentContext(path.join(root, '.local', 'x-profile'), {
    headless: false,
    viewport: { width: 1280, height: 1000 },
    args: ['--disable-blink-features=AutomationControlled']
  });
  const page = context.pages()[0] ?? (await context.newPage());
  await page.goto('https://x.com/DurgaraoGa51557/status/2123360126975558084', { waitUntil: 'domcontentloaded', timeout: 60000 });
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
  await page.screenshot({ path: path.join(root, '.local', 'x-reply2.png'), fullPage: false });
  const post = dialog.getByRole('button', { name: /^Post$/ }).last();
  await post.click();
  await page.waitForTimeout(6000);
  await page.screenshot({ path: path.join(root, '.local', 'x-reply2-after.png'), fullPage: false });
  console.log('REPLIED');
  await context.close();
})().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
