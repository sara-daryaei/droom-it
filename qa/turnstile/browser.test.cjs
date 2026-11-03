const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ headless: true });
  let checks = 0;
  try {
    for (const route of ['/en/contact', '/nl/contact', '/en', '/nl']) {
      for (const width of [1440, 768, 390, 320]) {
        const page = await browser.newPage({ viewport: { width, height: 900 } });
        const submitted = [];
        await page.route('**/*', async request => {
          const url = new URL(request.request().url());
          if (url.hostname === 'challenges.cloudflare.com') return request.fulfill({ contentType: 'text/javascript', body: `window.mockTokens={};window.mockResets=0;window.turnstile={render(el){const id=Object.keys(mockTokens).length;mockTokens[id]='';el.textContent='Mock security widget';return id;},getResponse(id){return mockTokens[id];},reset(id){mockTokens[id]='';mockResets++;}};window.droomTurnstileReady();` });
          if (url.pathname === '/api/turnstile-config') return request.fulfill({ json: { siteKey: 'mock-sitekey' } });
          if (url.pathname === '/api/start-project') { submitted.push(request.request().postDataJSON()); return request.fulfill({ json: { ok: true } }); }
          if (url.hostname !== 'droom.test') return request.abort();
          let file = url.pathname.slice(1);
          if (['en', 'nl'].includes(file)) file += '/index.html';
          else if (!path.extname(file)) file += '.html';
          const absolute = path.resolve(file);
          if (!absolute.startsWith(process.cwd() + path.sep) || !fs.existsSync(absolute)) return request.fulfill({ status: 404, body: '' });
          const ext = path.extname(file);
          return request.fulfill({ body: fs.readFileSync(absolute), contentType: ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.jpeg': 'image/jpeg', '.woff2': 'font/woff2' })[ext] || 'application/octet-stream' });
        });
        await page.goto('https://droom.test' + route);
        const forms = page.locator('[data-project-form]');
        const count = await forms.count();
        await page.waitForFunction(n => Object.keys(window.mockTokens || {}).length === n, count);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${route} ${width} overflow`);
        for (let index = 0; index < count; index++) {
          const form = forms.nth(index);
          await form.locator('[name=name]').fill('Synthetic browser test');
          await form.locator('[name=email]').fill('test@example.invalid');
          await form.locator('[name=message]').fill('Mocked browser submission; no delivery.');
          await form.locator('[name=websiteUrl]').fill('https://example.invalid');
          const button = form.locator('button[type=submit]');
          const before = submitted.length;
          await button.click();
          assert.equal(submitted.length, before, 'missing token must prevent request');
          await page.evaluate(id => { mockTokens[id] = 'mock-valid-token'; }, index);
          await button.click();
          await page.waitForFunction(n => window.mockResets >= n, index + 1);
          assert.equal(submitted.length, before + 1);
          assert.equal(submitted.at(-1)['cf-turnstile-response'], 'mock-valid-token');
          assert.equal(submitted.at(-1).language, route.startsWith('/nl') ? 'nl' : 'en');
          assert.equal(await button.isEnabled(), true);
          checks++;
        }
        await page.close();
      }
    }
    console.log(JSON.stringify({ passedFormChecks: checks, viewports: [1440, 768, 390, 320], realChromium: true, servicesMocked: true, liveDeploymentTest: false }));
  } finally { await browser.close(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
