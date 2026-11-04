# Final Preview acceptance

Evidence consolidated without repeating automated CAPTCHA waits. Production release is not authorized.

| Requirement | Result | Evidence / qualification |
| --- | --- | --- |
| Existing widget and stable Preview hostname | PASS | Live Cloudflare inventory: DROOM IT Contact Form, Managed; exact branch alias allowed; droomit.be preserved. |
| Branch-scoped configuration | PASS | POSTGRES_URL, DATABASE_URL and both Turnstile keys target Preview/codex/cloudflare-turnstile only. |
| Server-side CAPTCHA enforcement | PASS | Siteverify precedes quota, project insertion and email; success, action and hostname required; failures close safely. |
| Missing/invalid real API requests | PASS | Live EN/NL HTTP403 results recorded previously. |
| Real user submission | PASS | Owner observed Turnstile Success; independent isolated database inspection confirmed saved en/project record. Raw token/response was not captured. |
| Replay/expiry enforcement implementation | PASS | Required Siteverify; mocked timeout-or-duplicate rejection tests; official Cloudflare contract is 300 seconds and single use. This is not a real-token lifecycle result. |
| Real-token replay and expiry | BLOCKED | No captured fresh token in controlled browser. No further automated challenge attempts. |
| Full bilingual live submissions | BLOCKED | Real English project persistence corroborated; full EN/NL contact/project/audit lifecycle matrix not independently executed. |
| Database runtime isolation | PASS | Protected deployed diagnostic checked both URLs, actual getSql, exact test endpoint, schema and zero rows before owner test. |
| Preview non-network email | PASS | Actual deployed notification/reply functions executed via JSON transport; no outbound network transport. No per-owner-request log exists. |
| Durable quota concurrency | PASS | Actual SQL against test branch:20 concurrent requests,5 admitted/15 limited; exact synthetic key removed. Per-email quota is not a global abuse limit. |
| Automated regression | PASS | Prior25 mocked backend checks and24 mocked-service Chromium flows at four widths. Final syntax check passed. Not live CAPTCHA evidence. |
| Diagnostic cleanup | PASS | Only start-project.js and turnstile-config.js remain in api; diagnostic env variable and local secret absent. Historical immutable deployments remain protected. |
| Production/main preservation | PASS | Remote main remains288df9622f65e9b57f56fd9db90d46e537a7780b; no Production writes, credential changes or release performed. No historical customer record deleted. |

Official verification contract: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/

## Decision

Preview has a working, owner-tested English project flow and verified isolated database/email configuration. It is not fully end-to-end qualified across every form/language/token lifecycle. No confirmed application defect remains from this review; missing live coverage is not labelled PASS. Do not merge or deploy Production automatically.

Only if full live-token certification is required: run the existing lifecycle test with a human present in its actual browser. Obtain a token there, submit once, replay the same consumed token, then age a separate unused token beyond300 seconds. No copied chat tokens, mock bypass, key rotation or new widget needed. Owner's existing non-synthetic-address test record remains preserved.
