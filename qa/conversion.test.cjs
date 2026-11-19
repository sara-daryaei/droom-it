const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { createPreviewServer } = require('./local-preview.cjs');

test('bilingual content, routes, responsive layouts and isolated enquiry flow', { timeout: 180000 }, async () => {
  const server = createPreviewServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({ headless: true });
  const screenshots = path.resolve('.vercel/conversion-review');
  fs.mkdirSync(screenshots, { recursive: true });
  let layoutChecks = 0;
  let submissionChecks = 0;
  const mockWidget = `window.qaTokens={};window.qaWidgets={};window.qaResets=0;window.turnstile={render(el,options){const id=Object.keys(qaWidgets).length;qaWidgets[id]=options;qaTokens[id]='';el.textContent='Isolated test verification';return id;},getResponse(id){return qaTokens[id];},reset(id){qaTokens[id]='';qaResets++;}};window.droomTurnstileReady();`;
  try {
    for (const route of ['/en', '/nl', '/en/services', '/nl/diensten', '/en/work', '/nl/werk', '/en/contact', '/nl/contact']) {
      for (const width of [1440, 900, 390, 320]) {
        const page = await browser.newPage({ viewport: { width, height: 900 } });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.route('**/*', async entry => {
          const url = new URL(entry.request().url());
          if (url.hostname === 'challenges.cloudflare.com') return entry.fulfill({ contentType: 'text/javascript', body: mockWidget });
          if (url.pathname === '/api/turnstile-config') return entry.fulfill({ json: { siteKey: 'isolated-test' } });
          if (url.pathname === '/api/start-project') throw Error('Layout check must never submit');
          if (url.origin === origin || ['fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname)) return entry.continue();
          return entry.abort();
        });
        const response = await page.goto(origin + route, { waitUntil: 'networkidle' });
        assert.equal(response.status(), 200, route);
        await page.evaluate(() => document.fonts.ready);
        assert.equal(await page.locator('h1').count(), 1, route + ' one main heading');
        assert.equal(await page.locator('title').count(), 1);
        assert.ok(await page.locator('meta[name=description]').getAttribute('content'));
        assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'), 'https://www.droomit.be' + route);
        assert.match(await page.locator('html').getAttribute('lang'), route.startsWith('/nl') ? /^nl(?:-BE)?$/i : /^en$/);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, route + ' ' + width + ' page overflow');
        const clipped = await page.locator('.hero-copy, .hero-actions .button, .premium-case-content, .home-service-grid article, .service-item > div, .case-card-content, .premium-timeline li strong, .contact-form label').evaluateAll(elements => elements.filter(el => el.scrollWidth > el.clientWidth + 2).map(el => el.tagName + ':' + el.textContent.trim().slice(0, 60)));
        assert.deepEqual(clipped, [], route + ' ' + width + ' clipped content');
        assert.deepEqual(errors, [], route + ' console errors');
        if (route === '/en' || route === '/nl') {
          const heroWordsOutside = await page.locator('.hero-copy').evaluate(copy => {
            const boundary = copy.getBoundingClientRect();
            const styles = getComputedStyle(copy);
            const text = copy.querySelector('h1').firstChild;
            return Array.from(text.textContent.matchAll(/\S+/g)).filter(match => {
              const range = document.createRange();
              range.setStart(text, match.index);
              range.setEnd(text, match.index + match[0].length);
              return Array.from(range.getClientRects()).some(rect => rect.right > boundary.right - parseFloat(styles.paddingRight) + 2);
            }).map(match => match[0]);
          });
          assert.deepEqual(heroWordsOutside, [], route + ' headline fits its padded column');
          assert.equal(await page.locator('.hero-actions .button').count(), 2);
          assert.equal(await page.locator('.hero-actions .button').nth(1).getAttribute('href'), '#home-work-title');
          assert.deepEqual(await page.locator('.premium-case-card h3').allTextContents(), ['PolyChem MB', 'Bubble Paws', 'Maison Elegance']);
          assert.equal(await page.locator('.home-service-grid article').count(), 6);
          assert.equal(await page.locator('.home-process li').count(), 3);
          const splitProcessWords = await page.locator('.premium-timeline strong').evaluateAll(elements => elements.flatMap(el => {
            const text = el.firstChild;
            if (!text || text.nodeType !== Node.TEXT_NODE) return [];
            return Array.from(text.textContent.matchAll(/\S+/g)).filter(match => {
              const range = document.createRange();
              range.setStart(text, match.index);
              range.setEnd(text, match.index + match[0].length);
              return range.getClientRects().length > 1;
            }).map(match => match[0]);
          }));
          assert.deepEqual(splitProcessWords, [], route + ' process words stay intact');
          if (width === 1440) {
            const mediaHeights = await page.locator('.premium-case-media').evaluateAll(elements => elements.map(el => Math.round(el.getBoundingClientRect().height)));
            assert.equal(new Set(mediaHeights).size, 1, 'portfolio media heights align');
            const titlePositions = await page.locator('.premium-case-card').evaluateAll(cards => cards.map(card => Math.round(card.querySelector('h3').getBoundingClientRect().top - card.getBoundingClientRect().top)));
            assert.equal(new Set(titlePositions).size, 1, 'portfolio titles align');
          }
          const image = page.locator('img[src="/assets/maison-elegance-demo.jpg"]').first();
          await image.scrollIntoViewIfNeeded();
          await image.evaluate(el => el.decode());
          assert.equal(await image.evaluate(el => el.naturalWidth), 1000);
          if ([1440, 390].includes(width)) {
            await page.evaluate(() => document.activeElement.blur());
            await page.locator('.hero').screenshot({ path: path.join(screenshots, route.slice(1) + '-hero-' + width + '.png') });
            await page.locator('.premium-cases').screenshot({ path: path.join(screenshots, route.slice(1) + '-portfolio-' + width + '.png') });
            await page.locator('.home-services').screenshot({ path: path.join(screenshots, route.slice(1) + '-services-' + width + '.png') });
            await page.locator('.home-process').screenshot({ path: path.join(screenshots, route.slice(1) + '-process-' + width + '.png') });
          }
        }
        const links = await page.locator('a[href]').evaluateAll(elements => elements.map(el => el.getAttribute('href')));
        for (const href of new Set(links)) {
          const url = new URL(href, page.url());
          if (url.origin !== origin) continue;
          const linked = await page.request.head(url.origin + url.pathname);
          assert.equal(linked.ok(), true, route + ' broken link ' + href);
          if (url.pathname === new URL(page.url()).pathname && url.hash) assert.equal(await page.locator('[id="' + decodeURIComponent(url.hash.slice(1)) + '"]').count(), 1, href);
        }
        for (const label of await page.locator('.contact-form label').all()) assert.ok(await label.locator('input, select, textarea').count());
        await page.keyboard.press('Tab');
        assert.equal(await page.evaluate(() => document.activeElement.classList.contains('skip-link')), true);
        if (width === 390) {
          await page.locator('.menu-toggle').click();
          assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'), 'true');
          await page.keyboard.press('Escape');
          assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'), 'false');
        }
        layoutChecks++;
        await page.close();
      }
    }
    for (const language of ['en', 'nl']) {
      const page = await browser.newPage();
      const submitted = [];
      let rejectNext = false;
      await page.route('**/*', async entry => {
        const url = new URL(entry.request().url());
        if (url.hostname === 'challenges.cloudflare.com') return entry.fulfill({ contentType: 'text/javascript', body: mockWidget });
        if (url.pathname === '/api/turnstile-config') return entry.fulfill({ json: { siteKey: 'isolated-test' } });
        if (url.pathname === '/api/start-project') {
          submitted.push(entry.request().postDataJSON());
          const failed = rejectNext;
          rejectNext = false;
          return entry.fulfill({ status: failed ? 503 : 201, json: { ok: !failed } });
        }
        if (url.origin === origin) return entry.continue();
        return entry.abort();
      });
      await page.goto(origin + '/' + language + '/contact?service=website-improvement');
      await page.waitForFunction(() => !!window.qaWidgets?.[0]);
      const form = page.locator('[data-project-form]');
      assert.equal(await form.locator('select').inputValue(), 'Website Fix & Improvement');
      await form.locator('button[type=submit]').click();
      assert.equal(submitted.length, 0, 'required fields prevent submission');
      await form.locator('[name=name]').fill('Isolated conversion test');
      await form.locator('[name=email]').fill('invalid-email');
      await form.locator('[name=message]').fill('No real email delivery or database access');
      await form.locator('button[type=submit]').click();
      assert.equal(submitted.length, 0, 'invalid email prevents submission');
      await form.locator('[name=email]').fill('test@example.invalid');
      for (const service of ['Website Fix & Improvement', 'Landing Page', 'Contact Form / Booking']) {
        await form.locator('select').selectOption(service);
        await form.locator('button[type=submit]').click();
        const before = submitted.length;
        await page.evaluate(() => { qaTokens[0] = 'isolated-token'; qaWidgets[0].callback(qaTokens[0]); });
        assert.equal(await form.locator('[data-form-status]').textContent(), '');
        await form.locator('button[type=submit]').click();
        await page.waitForFunction(n => qaResets >= n, before + 1);
        assert.equal(submitted.at(-1).projectType, service);
        assert.equal(submitted.at(-1).language, language);
        assert.equal(submitted.at(-1)['cf-turnstile-response'], 'isolated-token');
        assert.match(await form.locator('[data-form-status]').textContent(), language === 'nl' ? /Bedankt/ : /Thank you/);
        assert.equal(await form.locator('button[type=submit]').isEnabled(), true);
        await form.locator('[name=name]').fill('Isolated conversion test');
        await form.locator('[name=email]').fill('test@example.invalid');
        await form.locator('[name=message]').fill('No real email delivery or database access');
        submissionChecks++;
      }
      rejectNext = true;
      await page.evaluate(() => { qaTokens[0] = 'isolated-token'; qaWidgets[0].callback(qaTokens[0]); });
      const priorResets = await page.evaluate(() => qaResets);
      await form.locator('button[type=submit]').click();
      await page.waitForFunction(n => qaResets > n, priorResets);
      assert.equal(await form.locator('[data-form-status]').evaluate(el => el.classList.contains('error')), true);
      assert.equal(await form.locator('button[type=submit]').isEnabled(), true);
      await page.evaluate(() => { qaTokens[0] = 'isolated-token'; qaWidgets[0].callback(qaTokens[0]); });
      await form.locator('button[type=submit]').click();
      await page.waitForFunction(n => qaResets > n + 1, priorResets);
      assert.match(await form.locator('[data-form-status]').textContent(), language === 'nl' ? /Bedankt/ : /Thank you/);
      submissionChecks++;
      await page.locator('[data-lang="' + (language === 'en' ? 'nl' : 'en') + '"]').click();
      await page.waitForURL('**/' + (language === 'en' ? 'nl' : 'en') + '/contact');
      await page.close();
    }
    for (const blocked of ['/.vercel/project.json', '/.env', '/qa/local-preview.cjs']) assert.equal((await fetch(origin + blocked)).status, 404);
    assert.equal((await fetch(origin + '/api/start-project', { method: 'POST' })).status, 503);
    console.log(JSON.stringify({ layoutChecks, submissionChecks, servicesMocked: true, productionAccess: false, liveEmailDeliveryTested: false }));
  } finally {
    await browser.close();
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
});
