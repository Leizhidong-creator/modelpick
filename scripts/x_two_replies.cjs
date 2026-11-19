const path = require('node:path');
const { chromium } = require('playwright');

const replies = [
  {
    url: 'https://x.com/rollacode/status/2123382382120042506',
    text: `Running Claude Code, Codex and OpenCode side by side is honest. The missing layer is per-node routing: the same task shouldn't pay for the same model because the agent differs. We price cost per solved task across them.

https://leizhidong-creator.github.io/modelpick/eval.html`
  },
  {
    url: 'https://x.com/hibernuts/status/2123416792211325428',
    text: `The chart tells you quality. It rarely tells you cost per solved task. Add attempts: a model that fails 20% needs 1.25 calls, and the cheap bar can invert. That's the missing metric in most launch tables.

https://leizhidong-creator.github.io/modelpick/eval.html`
  }
];

(async () => {
  const root = path.resolve(__dirname, '..');
  const context = await chromium.launchPersistentContext(path.join(root, '.local', 'x-profile'), {
    headless: false,
    viewport: { width: 1280, height: 1000 },
    args: ['--disable-blink-features=AutomationControlled']
  });
  const page = context.pages()[0] ?? (await context.newPage());
  for (const [i, item] of replies.entries()) {
    await page.goto(item.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3500);
    await page.locator('[data-testid="reply"]').first().click();
    await page.waitForTimeout(1500);
    const dialog = page.locator('[role="dialog"]').first();
    const box = dialog.locator('[data-testid="tweetTextarea_0"]');
    await box.waitFor({ state: 'visible', timeout: 20000 });
    await box.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.insertText(item.text);
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(root, '.local', `x-reply-${i}.png`), fullPage: false });
    await dialog.getByRole('button', { name: /^(Reply|Post)$/ }).last().click();
    await page.waitForTimeout(5000);
    console.log('REPLIED', i);
  }
  await context.close();
})().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
