const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('api/start-project.js', 'utf8').replace(/^import .*;\r?\n/gm, '').replace('export default async function handler', 'async function handler');
async function run(body, verification = { success: true, hostname: 'www.droomit.be', action: 'contact' }, secret = 'mock-secret') {
  const calls = { writes: 0, emails: 0, verification: 0 };
  const context = vm.createContext({
    Buffer, URLSearchParams, AbortSignal, randomUUID: () => 'test-id', console,
    process: { env: { TURNSTILE_SECRET_KEY: secret, DATABASE_URL: 'mock', SMTP_HOST: 'mock', SMTP_USER: 'mock', SMTP_PASSWORD: 'mock' } },
    neon: () => async (strings) => { if (strings.join('').includes('INSERT')) calls.writes++; return [{ id: 1, created_at: '2026-11-03' }]; },
    nodemailer: { createTransport: () => ({ sendMail: async () => { calls.emails++; } }) },
    fetch: async () => { calls.verification++; if (verification instanceof Error) throw verification; return { ok: true, json: async () => verification }; },
  });
  vm.runInContext(source, context);
  const response = { setHeader() {}, status(value) { this.code = value; return this; }, json(value) { this.body = value; return this; } };
  await context.handler({ method: 'POST', headers: { 'content-type': 'application/json' }, body }, response);
  return { ...calls, status: response.code };
}
const valid = { name: 'Test', email: 'owner@example.com', message: 'Test request', 'cf-turnstile-response': 'mock-token' };
for (const language of ['en', 'nl']) {
  for (const requestType of ['project', 'audit']) test(`valid ${language} ${requestType}: insert and both emails`, async () => {
    const result = await run({ ...valid, language, requestType });
    assert.equal(result.status, 201); assert.equal(result.writes, 1); assert.equal(result.emails, 2);
  });
}
for (const [name, body, verification, secret] of [
  ['missing token', { ...valid, 'cf-turnstile-response': '' }],
  ['invalid token', valid, { success: false }],
  ['expired token', valid, { success: false, 'error-codes': ['timeout-or-duplicate'] }],
  ['reused token', valid, { success: false, 'error-codes': ['timeout-or-duplicate'] }],
  ['network failure', valid, new Error('mock timeout')],
  ['malformed response', valid, null],
  ['wrong hostname', valid, { success: true, hostname: 'evil.example', action: 'contact' }],
  ['wrong action', valid, { success: true, hostname: 'www.droomit.be', action: 'other' }],
  ['missing secret', valid, undefined, ''],
  ['malformed body', []],
  ['missing field', { ...valid, name: '' }],
  ['invalid field type', { ...valid, name: {} }],
  ['oversize', { ...valid, message: 'x'.repeat(40000) }],
]) test(`${name}: no database writes or emails`, async () => {
  const result = await run(body, verification, secret);
  assert.ok(result.status >= 400); assert.equal(result.writes, 0); assert.equal(result.emails, 0);
});
test('public config exposes only site key', () => {
  const configSource = fs.readFileSync('api/turnstile-config.js', 'utf8').replace('export default function', 'function');
  const context = vm.createContext({ process: { env: { NEXT_PUBLIC_TURNSTILE_SITE_KEY: 'public', TURNSTILE_SECRET_KEY: 'private-never-return' } } });
  vm.runInContext(configSource, context);
  const response = { setHeader() {}, status() { return this; }, json(body) { this.body = body; } };
  context.handler({ method: 'GET' }, response);
  assert.equal(JSON.stringify(response.body), '{"siteKey":"public"}');
});
