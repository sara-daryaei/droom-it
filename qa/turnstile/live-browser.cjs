const { chromium } = require('playwright');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

(async () => {
  const cli = path.join(process.env.APPDATA, 'npm/node_modules/vercel/dist/index.js');
  const raw = spawnSync(process.execPath, [cli, 'api', '/v9/projects/droom-it?teamId=team_2mJ840yYUjnbjutZFZBH87nd', '--method', 'GET'], { encoding: 'utf8' });
  const project = JSON.parse(raw.stdout);
  const entry = Object.entries(project.protectionBypass || {}).find(([, v]) => v.createdAt === 1793743222540);
  if (!entry) throw Error('Existing authorized Preview access unavailable');
  const origin = 'https://droom-it-git-codex-cloudflare-turnstile-droom-it-s-projects.vercel.app';
  const browser = await chromium.launch({ headless: process.env.DROOM_HEADED !== '1' });
  const results = [];
  try {
    for (const width of (process.env.DROOM_HEADED === '1' ? [1440] : [1440, 390])) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      await context.route(origin + '/**', route => route.continue({ headers: { ...route.request().headers(), 'x-vercel-protection-bypass': entry[0] } }));
      const page = await context.newPage();
      await page.goto(origin + '/en/contact', { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => window.turnstile && document.querySelector('[name="cf-turnstile-response"]'), null, { timeout: 10000 }).catch(() => {});
      const generated = await page.waitForFunction(() => !!document.querySelector('[name="cf-turnstile-response"]')?.value, null, { timeout: 30000 }).then(() => true).catch(() => false);
      results.push({ width, tokenGenerated: generated, overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), widgetState: await page.evaluate(() => ({ libraryLoaded: !!window.turnstile, responseFields: document.querySelectorAll('[name="cf-turnstile-response"]').length, verificationErrorDisplayed: !!document.querySelector('[data-form-status].error') })) });
      await context.close();
    }
    console.log(JSON.stringify({ actualPreviewBrowser: true, results, submissionsPerformed: false }));
  } finally { await browser.close(); }
})().catch(() => { console.error('Live browser verification failed; details suppressed'); process.exitCode = 1; });
