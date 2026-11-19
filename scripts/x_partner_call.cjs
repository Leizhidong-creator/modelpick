const path = require('node:path');
const { chromium } = require('playwright');

const TEXT = `Looking for 5 teams using Claude Code / Codex.

Send one CSV of model runs. I'll turn it into a cost-per-solved-task report, free, no signup.

ModelPick is now on npm and in the Official MCP Registry.

https://leizhidong-creator.github.io/modelpick/eval.html`;

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
  const dialog = page.locator('[role="dialog"]').first();
  const box = dialog.locator('[data-testid="tweetTextarea_0"]');
  await box.waitFor({ state: 'visible', timeout: 30000 });
  await box.click();
  await page.keyboard.insertText(TEXT);
  await dialog.locator('input[data-testid="fileInput"]').setInputFiles(path.join(root, 'assets', 'scorecard.png'));
  await page.waitForTimeout(5000);
  await page.screenshot({ path: path.join(root, '.local', 'x-partner-call.png'), fullPage: false });
  const post = dialog.locator('[data-testid="tweetButtonInline"]');
  if (await post.count()) await post.click();
  else await dialog.getByRole('button', { name: /^Post$/ }).last().click();
  await page.waitForTimeout(6000);
  await page.screenshot({ path: path.join(root, '.local', 'x-partner-call-after.png'), fullPage: false });
  console.log('POSTED');
  await context.close();
})().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
