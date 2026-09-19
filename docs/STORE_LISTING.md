# Store listing copy and submission kit

Use this for the Chrome Web Store and Firefox Add-ons (AMO). Screenshots are in
`store/screenshots/` (1440-wide landing, 820-wide transformed page, popup,
options).

## Identity

- **Name:** Bionic Page
- **Summary (Chrome, ≤132 chars):** Turn any page into a bionic reading page. Five modes, per-site control, fully reversible. No network, no tracking.
- **Summary (Firefox, ≤250 chars):** Turn any web page into a bionic reading page. Emphasize the leading letters of each word with five configurable modes, per-site control, a floating on/off control, and full reversibility. Runs locally; no network requests and no analytics.
- **Category:** Accessibility (Chrome) / Reading & News (AMO alt: Accessibility)
- **Language:** English
- **Homepage / privacy policy:** `site/index.html`, `site/privacy.html` (host these and paste the URLs).

## Detailed description

```
Bionic Page turns any web page into a bionic reading page.

It rewrites the readable text so the leading part of each word carries more
visual weight, giving your eye a fixed anchor per word. This is configurable
visual anchoring, not a speed-reading claim — peer-reviewed results on bionic
emphasis are mixed, so judge it on your own reading.

FIVE MODES
• Classic — emphasize a share of each word; intensity controls how much.
• Half — the first half of each word, the familiar default.
• Vowel anchor — emphasize up to the first vowel group; friendlier across languages.
• Low distraction — bold the prefix and fade the rest of the word.
• Custom rule — per-length character counts plus a fraction, e.g. "0 1 1 2 0.4".

BUILT FOR REAL PAGES
• Works on dynamic sites (SPAs, infinite scroll) with a MutationObserver.
• Never touches code blocks, input fields, editors, math, or SVG.
• Fully reversible: turning it off restores the original text exactly.
• Per-site rules, a floating page control, and a keyboard shortcut (Ctrl/Cmd+Shift+Y).

PRIVATE BY DESIGN
No network requests. No analytics. No accounts. Your settings stay in your
browser's own storage. The extension needs access to page text to do its job,
and that text never leaves your device.

Open source under the MIT license. "Bionic Reading" is a trademark of Bionic
Reading GmbH; this project is not affiliated with or endorsed by it.
```

## Permission justifications (required fields)

- `storage` — "Saves the user's reading settings (mode, intensity, per-site rules) in the browser's extension storage."
- `activeTab` — "Applies or removes the reading style on the tab the user is interacting with."
- `host_permissions: <all_urls>` — "A reading aid must read the text of whichever page the user chooses to read. Text is processed locally and discarded; nothing is transmitted."
- Remote code: "None. All code is bundled and reviewed; nothing is fetched or evaluated at runtime."
- Data usage: "Does not collect or transmit any data."

## Data-safety / privacy answers

- Collects personally identifiable information: **No**
- Collects health, financial, authentication, personal communications, location, web history: **No**
- Uses data for purposes unrelated to the single purpose: **No**
- Sells or transfers data to third parties: **No**
- Uses or transfers data to determine creditworthiness or for lending: **No**
- Single purpose statement: "Apply a configurable bionic reading style to page text, locally."

## Screenshots

| File | Shows |
|---|---|
| `01-landing.png` | Landing page and live demo |
| `02-transformed-page.png` | A real page transformed, with the floating control |
| `03-popup.png` | Toolbar popup: mode, intensity, per-site toggle |
| `04-options.png` | Options page: full settings and live preview |

## Submission checklist

1. `bun install && bunx tsc --noEmit && bun test`
2. `bun run icons && bun run build && node scripts/verify-build.mjs`
3. `bun run e2e` (local Chrome) — all six checks PASS.
4. `bun run package` — zips `dist/chrome` and `dist/firefox`.
5. AMO only: `bun run lint:firefox` (web-ext) must report no errors.
6. Replace the placeholder gecko id in `scripts/manifest.mjs` with the real one
   before first AMO submission; Chrome ignores it, Firefox requires it.
7. Paste the store copy above, upload the four screenshots, and link the privacy
   policy URL.
