# Preview database isolation plan

## Verified evidence

- Owner identifies Vercel storage `neon-coffee-envelope` as containing real submissions. Treat it as production-sensitive. Record count and contents were not queried.
- Vercel resource `store_MtPRZuG3imSou5Wa` supplies both Production and Preview `POSTGRES_URL`, `DATABASE_URL`, and `NEON_PROJECT_ID`. No branch-specific override was returned.
- The application selects `POSTGRES_URL` before `DATABASE_URL`; overriding only `DATABASE_URL` is insufficient.
- Neon organization enumeration and storage-name search currently return empty lists. Exact provider project, branch and endpoint remain unverified.

## Safe isolation procedure (not executed)

1. Obtain read access to the Marketplace-owned Neon project through the owning organization. Resolve the actual project, production branch, database and compute endpoint from provider metadata.
2. Enumerate existing branches. Confirm a candidate test branch has a different branch ID and endpoint from Production. A test-like name alone is not evidence of isolation.
3. If no isolated branch exists, propose a schema-only branch to avoid copying personal contact data. Creating it requires separate owner authorization; this plan does not create resources.
4. Use test-only credentials for the verified branch. Configure both `POSTGRES_URL` and `DATABASE_URL` as Preview overrides scoped to `codex/cloudflare-turnstile`. Leave Production values and the existing integration untouched.
5. Configure an SMTP capture service with no outbound customer delivery; capture both notification and auto-reply messages. Verify no Production SMTP fallback is possible.
6. Configure a Preview Turnstile widget/credentials and exact hostname. Never permit arbitrary Preview hostnames or use test CAPTCHA credentials in Production.
7. Redeploy Preview. Verify effective database identity without querying customer rows, then run EN/NL contact and audit submissions against the isolated branch and SMTP capture destination only.
8. Verify rejected CAPTCHA requests create no rows or emails. Preserve all existing records; do not delete historical test records.

## Release gate

No live form submissions until database and email isolation are verified. No Production changes or merge until tests pass and the owner explicitly approves release.
