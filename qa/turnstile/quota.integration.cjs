const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { randomUUID, createHash } = require('node:crypto');
const { neon } = require('@neondatabase/serverless');

(async () => {
  // Capture the actual handler's parameterized quota query using mocked services.
  const queries = [];
  const source = fs.readFileSync('api/start-project.js', 'utf8').replace(/^import .*;\r?\n/gm, '').replace('export default async function handler', 'async function handler');
  const context = vm.createContext({
    Buffer, URLSearchParams, AbortSignal, randomUUID, createHash, console,
    process: { env: { TURNSTILE_SECRET_KEY: 'mock', DATABASE_URL: 'mock', VERCEL_ENV: 'preview' } },
    neon: () => async (strings, ...values) => { queries.push({ strings, values }); return [{ attempts: 1, id: 1, created_at: new Date().toISOString() }]; },
    fetch: async () => ({ ok: true, json: async () => ({ success: true, hostname: 'www.droomit.be', action: 'contact' }) }),
    nodemailer: { createTransport: () => ({ sendMail: async () => ({}) }) },
  });
  vm.runInContext(source, context);
  await context.handler({ method: 'POST', headers: { 'content-type': 'application/json' }, body: { name: 'Synthetic', email: 'quota@example.invalid', message: 'Mock capture', 'cf-turnstile-response': 'mock' } }, { setHeader() {}, status() { return this; }, json() {} });
  const create = queries.find(q => q.strings.join('').includes('CREATE TABLE IF NOT EXISTS contact_rate_limits'));
  const quota = queries.find(q => q.strings.join('').includes('RETURNING attempts'));
  assert.ok(create && quota);
  const connection = fs.readFileSync('C:/Users/SURFACE/.droom-it-testing-db-url', 'utf8').trim();
  assert.equal(new URL(connection).hostname.split('.')[0], 'ep-wispy-flower-apeuzpic-pooler');
  const sql = neon(connection);
  const countBefore = await sql`SELECT count(*)::int AS count FROM public.project_requests`;
  await sql(create.strings, ...create.values);
  const key = createHash('sha256').update('isolated-quota-test:' + randomUUID()).digest('hex');
  try {
    const results = await Promise.all(Array.from({ length: 20 }, () => sql(quota.strings, key)));
    const counts = results.map(r => r[0].attempts).sort((a, b) => a - b);
    assert.deepEqual(counts.slice(0, 5), [1, 2, 3, 4, 5]);
    assert.ok(counts.slice(5).every(n => n === 6));
    const countAfter = await sql`SELECT count(*)::int AS count FROM public.project_requests`;
    assert.equal(countBefore[0].count, countAfter[0].count);
    console.log(JSON.stringify({ livePostgresConcurrency: 'PASS', parallelAttempts: 20, admitted: 5, rejected: 15, projectRequestsUnchanged: true, testingEndpointOnly: true }));
  } finally {
    await sql`DELETE FROM contact_rate_limits WHERE key = ${key}`;
    const remaining = await sql`SELECT count(*)::int AS count FROM contact_rate_limits WHERE key = ${key}`;
    assert.equal(remaining[0].count, 0);
    console.log(JSON.stringify({ exactSyntheticQuotaKeyRemoved: true }));
  }
})().catch(() => { console.error('Isolated quota integration test failed; secret details suppressed'); process.exitCode = 1; });
