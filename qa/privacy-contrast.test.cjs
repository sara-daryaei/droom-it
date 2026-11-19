const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { createPreviewServer } = require('./local-preview.cjs');

function luminance(rgb) {
  const linear = rgb.slice(0, 3).map(value => {
    const component = value / 255;
    return component <= 0.04045 ? component / 12.92 : ((component + 0.055) / 1.055) ** 2.4;
  });
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}

function contrast(first, second) {
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

test('dark-form privacy links meet AA in both languages and all interaction states', { timeout: 60000 }, async () => {
  const server = createPreviewServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch();
  const results = [];
  try {
    for (const language of ['en', 'nl']) {
      for (const route of ['/' + language, '/' + language + '/contact']) {
        for (const width of [1440, 390]) {
          const page = await browser.newPage({ viewport: { width, height: 900 } });
          await page.route('**/*', entry => new URL(entry.request().url()).origin === origin ? entry.continue() : entry.abort());
          await page.goto(origin + route, { waitUntil: 'domcontentloaded' });
          const link = page.locator('.contact-section .form-privacy a');
          assert.equal(await link.getAttribute('href'), '/' + language + '/privacy');
          await link.scrollIntoViewIfNeeded();
          const read = () => link.evaluate(element => {
            const styles = getComputedStyle(element);
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = 1;
            const context = canvas.getContext('2d', { willReadFrequently: true });
            const rgba = color => {
              context.clearRect(0, 0, 1, 1);
              context.fillStyle = color;
              context.fillRect(0, 0, 1, 1);
              return Array.from(context.getImageData(0, 0, 1, 1).data);
            };
            return {
              color: rgba(styles.color),
              background: rgba(getComputedStyle(element.closest('.contact-section')).backgroundColor),
              outline: rgba(styles.outlineColor),
              outlineWidth: parseFloat(styles.outlineWidth),
              outlineStyle: styles.outlineStyle,
              underlined: styles.textDecorationLine.includes('underline'),
              focusVisible: element.matches(':focus-visible'),
              width: element.getBoundingClientRect().width,
              height: element.getBoundingClientRect().height,
            };
          });
          const normal = await read();
          assert.ok(contrast(normal.color, normal.background) >= 4.5, route + ' normal AA text contrast');
          assert.equal(normal.underlined, true);
          assert.equal(await link.isVisible(), true);
          await link.hover();
          const hover = await read();
          assert.ok(contrast(hover.color, hover.background) >= 4.5, route + ' hover AA text contrast');
          await page.mouse.move(0, 0);
          await page.locator('.contact-section textarea[name=message]').focus();
          await page.keyboard.press('Tab');
          assert.equal(await link.evaluate(element => document.activeElement === element), true, 'Tab reaches the privacy link');
          const focused = await read();
          assert.equal(focused.focusVisible, true);
          assert.ok(contrast(focused.color, focused.background) >= 4.5, route + ' focus AA text contrast');
          assert.ok(contrast(focused.outline, focused.background) >= 3, 'focus ring contrast');
          assert.ok(focused.outlineWidth >= 2);
          assert.equal(focused.outlineStyle, 'solid');
          assert.equal(focused.width, normal.width, 'interaction does not resize the link');
          assert.equal(focused.height, normal.height);
          if (!route.endsWith('/contact')) {
            const lightColor = await page.locator('.audit-section .form-privacy a').evaluate(element => getComputedStyle(element).color);
            assert.equal(lightColor, 'rgb(17, 19, 21)', 'light audit form remains unchanged');
          }
          results.push({ route, width, normal: contrast(normal.color, normal.background).toFixed(2), hover: contrast(hover.color, hover.background).toFixed(2), focus: contrast(focused.color, focused.background).toFixed(2), focusRing: contrast(focused.outline, focused.background).toFixed(2) });
          await page.keyboard.press('Enter');
          await page.waitForURL(origin + '/' + language + '/privacy');
          assert.equal((await page.request.get(page.url())).status(), 200);
          await page.close();
        }
      }
    }
    console.log(JSON.stringify({ cases: results, submissions: 0, externalEmails: 0 }));
  } finally {
    await browser.close();
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
});
