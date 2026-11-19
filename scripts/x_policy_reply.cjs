const path = require('node:path');
const { chromium } = require('playwright');

const TEXT = `This is the right framing: the policy boundary is the product, not the model list.

Support needs latency/cost; financial needs audit + exact JSON. A single "best model" hides that. We apply hard constraints per node, then price cost per solved task.

https://leizhidong-creator.github.io/modelpick/eval.html`;

(async () => {
  const root = path.resolve(__dirname, '..');
  const context = await chromium.launchPersistentContext(path.join(root, '.local', 'x-profile'), {
    headless: false,
    viewport: { width: 1280, height: 1000 },
    args: ['--disable-blink-features=AutomationControlled']
  });
  const page = context.pages()[0] ?? (await context.newPage());
  await page.goto('https://x.com/shlokafc/status/2123374478638080226', { waitUntil: 'domcontentloaded', timeout: 60000 });
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
  await page.screenshot({ path: path.join(root, '.local', 'x-policy-reply.png'), fullPage: false });
  await dialog.getByRole('button', { name: /^(Reply|Post)$/ }).last().click();
  await page.waitForTimeout(6000);
  await page.screenshot({ path: path.join(root, '.local', 'x-policy-reply-after.png'), fullPage: false });
  console.log('REPLIED');
  await context.close();
})().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
