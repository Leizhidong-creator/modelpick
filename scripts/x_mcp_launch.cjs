const path = require('node:path');
const { chromium } = require('playwright');

const TEXT = `ModelPick is in the Official MCP Registry.

io.github.Leizhidong-creator/modelpick@0.1.1

npx modelpick setup claude-code

40 models / 20 nodes. Best value per task, not one model for everything.

https://registry.modelcontextprotocol.io/v0/servers?search=modelpick`;

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
  await dialog.locator('input[data-testid="fileInput"]').setInputFiles(path.join(root, 'assets', 'social-preview.png'));
  await page.waitForTimeout(5000);
  await page.screenshot({ path: path.join(root, '.local', 'x-mcp.png'), fullPage: false });
  const post = dialog.locator('[data-testid="tweetButtonInline"]');
  if (await post.count()) await post.click();
  else await dialog.getByRole('button', { name: /^Post$/ }).last().click();
  await page.waitForTimeout(6000);
  await page.screenshot({ path: path.join(root, '.local', 'x-mcp-after.png'), fullPage: false });
  console.log('POSTED');
  await context.close();
})().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
