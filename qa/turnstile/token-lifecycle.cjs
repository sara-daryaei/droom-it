const { chromium } = require('playwright');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const { randomUUID } = require('node:crypto');
const { neon } = require('@neondatabase/serverless');

(async () => {
  const raw = spawnSync(process.execPath, [path.join(process.env.APPDATA, 'npm/node_modules/vercel/dist/index.js'), 'api', '/v9/projects/droom-it?teamId=team_2mJ840yYUjnbjutZFZBH87nd', '--method', 'GET'], { encoding: 'utf8' });
  const project = JSON.parse(raw.stdout);
  const auth = Object.entries(project.protectionBypass || {}).find(([, v]) => v.createdAt === 1793743222540)?.[0];
  if (!auth) throw Error('Existing Preview authorization unavailable');
  const connection = fs.readFileSync('C:/Users/SURFACE/.droom-it-testing-db-url', 'utf8').trim();
  if (!new URL(connection).hostname.startsWith('ep-wispy-flower-apeuzpic-pooler.')) throw Error('Endpoint mismatch');
  const sql = neon(connection);
  const origin = 'https://droom-it-git-codex-cloudflare-turnstile-droom-it-s-projects.vercel.app';
  const browser = await chromium.launch({ headless: false });
  try {
    for (const language of ['en', 'nl']) {
      const context = await browser.newContext({ viewport: { width: language === 'en' ? 1440 : 390, height: 900 } });
      await context.route(origin + '/**', route => route.continue({ headers: { ...route.request().headers(), 'x-vercel-protection-bypass': auth } }));
      const page = await context.newPage();
      await page.goto(origin + '/' + language + '/contact');
      const ready = await page.waitForFunction(() => !!document.querySelector('[name="cf-turnstile-response"]')?.value, null, { timeout: 30000 }).then(() => true).catch(() => false);
      if (!ready) { console.log(JSON.stringify({ language, status: 'BLOCKED', reason: 'No fresh real token generated in automated browser; no submission performed' })); break; }
      const token = await page.locator('[name="cf-turnstile-response"]').inputValue();
      const email = 'qa-' + randomUUID() + '@example.invalid';
      const payload = { name: 'Synthetic lifecycle test', email, message: 'Isolated QA request', language, 'cf-turnstile-response': token };
      const post = async body => {
        const response = await fetch(origin + '/api/start-project', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-vercel-protection-bypass': auth }, body: JSON.stringify(body) });
        return { status: response.status, body: await response.json() };
      };
      let id;
      try {
        const accepted = await post(payload);
        if (accepted.status !== 201 || !accepted.body.emailCaptured) throw Error('Live acceptance/capture verification failed');
        id = accepted.body.id;
        const rows = await sql`SELECT id FROM project_requests WHERE id = ${id} AND email = ${email}`;
        if (rows.length !== 1) throw Error('Persistence verification failed');
        const replay = await post(payload);
        if (replay.status !== 403) throw Error('Replay was not rejected');
        console.log(JSON.stringify({ language, validSubmission: 'PASS', testPersistence: 'PASS', emailCaptured: true, replay: 'PASS' }));
      } finally {
        if (id) await sql`DELETE FROM project_requests WHERE id = ${id} AND email = ${email}`;
      }
      await page.evaluate(() => window.turnstile.reset());
      const fresh = await page.waitForFunction(() => !!document.querySelector('[name="cf-turnstile-response"]')?.value, null, { timeout: 30000 }).then(() => true).catch(() => false);
      if (fresh) {
        const unused = await page.locator('[name="cf-turnstile-response"]').inputValue();
        console.log(JSON.stringify({ language, expirationCheck: 'Waiting 310 seconds with an unused real token' }));
        await new Promise(resolve => setTimeout(resolve, 310000));
        const expired = await post({ ...payload, 'cf-turnstile-response': unused });
        if (expired.status !== 403) throw Error('Expired token was not rejected');
        console.log(JSON.stringify({ language, expiredToken: 'PASS' }));
      } else console.log(JSON.stringify({ language, expiredToken: 'BLOCKED', reason: 'No fresh unused token generated' }));
      await context.close();
    }
  } finally { await browser.close(); }
})().catch(() => { console.error('Lifecycle check failed; secret details suppressed'); process.exitCode = 1; });
