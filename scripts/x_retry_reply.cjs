const path = require('node:path');
const { chromium } = require('playwright');

const TEXT = `The 63%-cheaper result is one benchmark, not one solved task.

Add retries and it can flip: a model that fails 20% of the time needs 1.25 attempts, not 1. We price cost per success, not per call.

Did the cheaper model still win after retries?

https://leizhidong-creator.github.io/modelpick/eval.html`;

(async () => {
  const root = path.resolve(__dirname, '..');
  const context = await chromium.launchPersistentContext(path.join(root, '.local', 'x-profile'), {
    headless: false,
    viewport: { width: 1280, height: 1000 },
    args: ['--disable-blink-features=AutomationControlled']
  });
  const page = context.pages()[0] ?? (await context.newPage());
  await page.goto('https://x.com/AnthonyWidodo_/status/2123383697718300842', { waitUntil: 'domcontentloaded', timeout: 60000 });
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
  await page.screenshot({ path: path.join(root, '.local', 'x-retry-reply.png'), fullPage: false });
  await dialog.getByRole('button', { name: /^(Reply|Post)$/ }).last().click();
  await page.waitForTimeout(6000);
  await page.screenshot({ path: path.join(root, '.local', 'x-retry-reply-after.png'), fullPage: false });
  console.log('REPLIED');
  await context.close();
})().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
