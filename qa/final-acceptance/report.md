# DROOM IT Auditable Final Visual Acceptance

## Production

- URL: https://www.droomit.be
- Commit: ef18a00e088d2ce7bf754ffebb62122015d82df3
- Branch: main
- Timestamp: 2026-08-12T09:48:44.827Z
- Deployment inspect: see `report.json`

## Browser

- Chromium 151.0.7922.34
- Zoom: 100% for required screenshots
- Device scale factor: 1
- Fonts: waited for `document.fonts.ready`
- Images: waited for browser image completion before screenshots

## Hero Assets

| Asset | HTTP | Content type | Content length |
| ----- | ---: | ------------ | -------------: |
| /assets/polychem-website-desktop.webp | 200 | image/webp | 73308 |
| /assets/bubble-paws-hero.webp | 200 | image/webp | 39104 |

## Visual Acceptance

| Route | Viewport | Screenshot | Overflow | CTA | Hero | Result |
| ----- | -------: | ---------- | -------- | --- | ---- | ------ |
| /en | 1280x800 | home-en-1280x800.png | PASS | PASS | PASS | PASS |
| /en | 1366x768 | home-en-1366x768.png | PASS | PASS | PASS | PASS |
| /en | 1440x900 | home-en-1440x900.png | PASS | PASS | PASS | PASS |
| /en | 1536x864 | home-en-1536x864.png | PASS | PASS | PASS | PASS |
| /en | 1536x1024 | home-en-1536x1024.png | PASS | PASS | PASS | PASS |
| /en | 1920x1080 | home-en-1920x1080.png | PASS | PASS | PASS | PASS |
| /en | 390x844 | home-en-390x844.png | PASS | PASS | PASS | PASS |
| /nl | 1366x768 | home-nl-1366x768.png | PASS | PASS | PASS | PASS |
| /nl | 1536x864 | home-nl-1536x864.png | PASS | PASS | PASS | PASS |
| /nl | 390x844 | home-nl-390x844.png | PASS | PASS | PASS | PASS |
| /nl/werk | 1440x900 | work-nl-1440x900.png | PASS | N/A | PASS | PASS |

## Overflow

- Global horizontal overflow result: PASS
- Exact per-viewport measurements are stored in `report.json`.

## CTA Visibility

- Hero CTA visibility: PASS
- Header CTA desktop clipping: PASS

## Dutch

- Dutch homepage screenshots captured.
- Dutch work page screenshot captured.
- Legacy English phrase check on `/nl/werk`: PASS

## 404

- English 404: HTTP 404, lang en, robots noindex, follow
- Dutch 404: HTTP 404, lang nl-BE, robots noindex, follow

## Language Switch

- /en -> nl: https://www.droomit.be/nl (nl-BE)
- /nl -> en: https://www.droomit.be/en (en)
- /nl/werk -> en: https://www.droomit.be/en/work (en)

## Console

- Meaningful browser console errors: 0

## Network

- Failed required network requests during visual captures: 0

## Forms / SMTP

- SMTP end-to-end: UNVERIFIED
- No customer form submission was performed during this visual acceptance pass.

## Remaining Issues

- None verified.

## Release Decision

READY TO SHIP
