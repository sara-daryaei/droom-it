# Preview runtime verification

Verified on 2026-11-03 using existing authenticated CLI/API access. No new deployment protection bypass token was generated. The existing automation token was selected by its recorded creation timestamp, not exposed or revoked.

## Deployed checks

- Diagnostic deployment: `dpl_bNmw7G5YYaFpvUACKc3H4WYdycFd`, commit `50ffc39`.
- HTTP 200: `ok`, `endpointMatches`, `schemaMatches`, `empty`, and `previewEmailCaptureExecuted` were all true.
- Both POSTGRES_URL and DATABASE_URL resolved to endpoint `ep-wispy-flower-apeuzpic` before any connection was attempted.
- Endpoint-to-branch mapping `droom-it-safe-testing` was confirmed by the owner in Neon. The runtime used the application's actual getSql function.
- Read-only queries checked public.project_requests columns and count; zero rows. No customer records returned.
- The actual notification and auto-reply functions ran with synthetic `.invalid` data under Preview. Existing jsonTransport rendered both messages without network delivery; nothing was persisted or logged.
- Requests used Vercel protection and a separate random secret in headers, never query parameters. No contact-form submissions or database writes occurred.

## Cleanup

- Temporary diagnostic source removed in `5dec396`.
- Temporary PREVIEW_DB_CHECK_SECRET removed from branch-scoped Preview variables; local secret file removed.
- Historical immutable deployments may retain old code/environment snapshots. They remain protected; current clean Preview must return 404 for the diagnostic route.
- Existing bypass token is confirmed to have worked during these checks. It was not revoked because no administrative revocation was requested in this pass. No unrelated tokens modified.

## Remaining release gates

- Cloudflare Preview-widget creation previously failed for missing Turnstile Edit permission. Production widget remains unchanged.
- Real CAPTCHA generation/success/expiration/replay tests remain blocked on Preview credentials.
- Browser tests: 24 source-based Chromium form checks at four widths passed with services mocked; not live CAPTCHA/browser integration proof.
- Backend tests: 25 mocked checks passed. Atomic quota SQL has not been concurrency-tested against live Postgres.
- No Production readiness claim or PR merge.
