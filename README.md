# DROOM IT

Bilingual corporate website for DROOM IT, a remote-first digital solutions business based in Belgium.

## Services

- Web Design
- Web Development
- Web Applications
- UX/UI Design

## Local preview

Run `npm run dev` and open [English](http://127.0.0.1:4173/en) or [Dutch](http://127.0.0.1:4173/nl).

The local server supports the existing clean URLs. It deliberately returns HTTP 503 for `/api/*`: local review cannot write to Neon or send email. A security-check-unavailable message on a local form is expected; this is not a Production configuration change.

Review the homepage, Services, Work and Contact in both languages. The website improvement service links to the existing contact form with the service preselected. Maison Elegance is clearly presented as a demo; its image is an actual capture of the public demo homepage.

## Checks

- `npm run check` runs the existing JavaScript syntax checks.
- `node --test qa/turnstile/security.test.cjs qa/turnstile/browser.test.cjs qa/conversion.test.cjs` runs backend and browser regressions. Browser checks require Playwright in the development environment. They mock Cloudflare, API submissions, database operations and email delivery, and are not proof of live email delivery.
- `vercel build --prod --yes` builds locally with the linked project's existing settings. It does not deploy. Do not run `vercel deploy` before release approval.
- Conversion screenshots are written to the ignored `.vercel/conversion-review/` directory.

## Manual Submission Check After Approval

1. In an approved isolated Preview environment, test each new service choice in English and Dutch, including the preselected website improvement link. Complete genuine Turnstile verification and confirm the correct success message.
2. Check that the isolated database record includes the selected `projectType` and language, and that notification and auto-reply messages appear only in the isolated email capture transport.
3. External email delivery requires a separately authorized, clearly labelled submission using an owner-controlled inbox. Check the intended notification inbox and the sender's inbox, including spam. SMTP authentication alone does not prove inbox delivery.
4. Remove only records created by that controlled test. Never delete existing customer submissions or use Production as an isolation fallback.
