const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

(async () => {
  const root = path.resolve(__dirname, '..');
  const outDir = path.join(root, 'assets', '_rec');
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ args: ['--force-device-scale-factor=1', '--hide-scrollbars'] });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    recordVideo: { dir: outDir, size: { width: 1920, height: 1080 } }
  });
  const page = await context.newPage();
  await page.goto('file:///' + path.join(root, 'video', 'intro.html').replace(/\\/g, '/'));
  await page.waitForTimeout(94200);
  await context.close();
  await browser.close();
  const file = fs.readdirSync(outDir).find((name) => name.endsWith('.webm'));
  if (!file) throw new Error('no webm produced');
  console.log(path.join(outDir, file));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
