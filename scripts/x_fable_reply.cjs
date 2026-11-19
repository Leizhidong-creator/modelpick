const path = require('node:path');
const { chromium } = require('playwright');

const TEXT = `Fable 5.2 is excellent, but one model for every node overpays.

80k/8k, 60% cache, coding agent:
Fable 92.3 quality, $0.64/solved
GPT-6.2 Astra 88.9, $0.68
GPT-6.2 Sol 84.0, $0.18

Fable wins the hero node. Not the thumbnail.
https://github.com/Leizhidong-creator/modelpick`;

(async () => {
  const root = path.resolve(__dirname, '..');
  const context = await chromium.launchPersistentContext(path.join(root, '.local', 'x-profile'), {
    headless: false,
    viewport: { width: 1280, height: 1000 },
    args: ['--disable-blink-features=AutomationControlled']
  });
  const page = context.pages()[0] ?? (await context.newPage());
  await page.goto('https://x.com/AnthropicAI/status/2119867707546071125', { waitUntil: 'domcontentloaded', timeout: 60000 });
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
  await page.screenshot({ path: path.join(root, '.local', 'x-fable-reply.png'), fullPage: false });
  await dialog.getByRole('button', { name: /^(Reply|Post)$/ }).last().click();
  await page.waitForTimeout(6000);
  await page.screenshot({ path: path.join(root, '.local', 'x-fable-reply-after.png'), fullPage: false });
  console.log('REPLIED');
  await context.close();
})().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
