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

- 2026-11-04: authorization updated successfully. Reused existing DROOM IT Contact Form, Managed; added only exact feature-branch Preview alias while preserving droomit.be. No duplicate widget or key rotation. Existing widget credentials securely configured only for branch-scoped Preview; Production credential variables unchanged.
- Live config endpoint returned200 with expected site key. Real EN/NL API calls with missing and invalid synthetic tokens each returned403. Test project_requests remained zero rows after requests.
- Live Chromium at1440 and390 loaded the actual Turnstile library and response field, with no reported form verification error or horizontal overflow. No token was generated within the test window. No challenge interaction or bypass was attempted; successful/expired/replayed real-token tests remain blocked on fresh token generation in an authorized browser.
- Real CAPTCHA generation/success/expiration/replay tests remain blocked on Preview credentials.
- Browser tests: 24 source-based Chromium form checks at four widths passed with services mocked; not live CAPTCHA/browser integration proof.
- Backend tests: 25 mocked checks passed.
- Live quota test: actual handler SQL captured with mocked services, then executed against the verified test endpoint with 20 parallel requests. Exactly 5 admitted and 15 rate-limited. project_requests count unchanged. Only the exact random synthetic quota key was deleted; its absence was verified. The legitimate quota table remains on the test database. No Production queries or form submissions.
- No Production readiness claim or PR merge.
