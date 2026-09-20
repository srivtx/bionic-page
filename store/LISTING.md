# Store listing — Bionic Page

## Identity

- **Name:** Bionic Page
- **Summary (132-character limit):** Turn any web page into a bionic reading page. Five modes, per-site control, fully reversible. No network, no tracking.
  - **Character count: 118 / 132.** (Also within Firefox Add-ons' 250-character limit.)
- **Category:** Accessibility (Chrome Web Store) · Accessibility (Firefox Add-ons)
- **Language:** English
- **Homepage:** `site/index.html` → https://srivtx.github.io/bionic-page/
- **Privacy policy:** `site/privacy.html` → https://srivtx.github.io/bionic-page/privacy.html

## Full description

Bionic Page is a Manifest V3 extension for Chrome and Firefox that turns any web
page into a bionic reading page. It emphasizes the leading letters of each word
so the eye has a fixed anchor on every word, while the page keeps its original
text and layout.

Five reading modes are built in. Half emphasizes the first half of each word;
Classic emphasizes a share set by intensity; Vowel anchor emphasizes up to the
first vowel group; Low distraction bolds the prefix and fades the rest; and a
Custom rule mode takes per-length counts plus a fraction. A minimum word length
and an emphasis weight are adjustable.

The transform is deliberately conservative. It never touches script, style,
code, pre, form fields, contenteditable, math, SVG, nav, or buttons, and it
skips URLs, emails, and long unbroken runs. Turning it off restores the original
text nodes exactly. A MutationObserver handles single-page apps, infinite
scroll, and text inside open shadow roots, so dynamic pages stay covered.

Each site can be forced on or off with match patterns and given its own mode and
intensity. A toolbar badge and a floating control show the current state, a
keyboard shortcut (Ctrl/Cmd+Shift+Y) toggles it, and a short welcome page opens
once on install.

There are no network requests, no analytics, and no accounts; settings live in
the browser's own storage. The `<all_urls>` host permission is required so the
extension can read the text of whichever page you choose to read, and that text
is processed locally and never transmitted. The project is MIT-licensed and open
source.

## Single purpose

Apply a configurable bionic reading style to the text of web pages the user is
reading, locally on the device.

## Permission justifications

The manifest requests exactly `storage`, `activeTab`, and the `<all_urls>` host
permission (`dist/chrome/manifest.json`).

- **`storage`** — Saves the user's reading settings (enable state, mode,
  intensity, minimum word length, appearance options, and per-site rules) in the
  browser's own extension storage. Nothing stored is transmitted.
- **`activeTab`** — Applies or removes the reading style on the tab the user is
  interacting with after a user gesture, without requesting broad tab access.
- **`host_permissions: <all_urls>`** — A reading aid must read the text of
  whichever page the user chooses to read; the content script rewrites text
  nodes locally and the page text is never transmitted, stored, or logged. There
  is no server and no network code in the extension. The same `<all_urls>` match
  is used by the content script in the manifest.
- **Remote code** — None. All code is bundled and reviewed; nothing is fetched
  or evaluated at runtime.

## Data-usage declaration

- Data collected: **None.**
- Personally identifiable information: **No**
- Health information: **No**
- Financial and payment information: **No**
- Authentication information: **No**
- Personal communications: **No**
- Location: **No**
- Web history: **No**
- User activity: **No**
- Website content: **No**
- Sold or transferred to third parties: **No**
- Used or transferred for purposes unrelated to the single purpose: **No**
- Used or transferred to determine creditworthiness or for lending: **No**

All three certification statements in the Chrome Web Store data-usage form can
be affirmed. The settings the extension stores stay in the browser's extension
storage and never pass through the project; page text is read in memory and
discarded. The claims are checkable in the source (`src/shared/browser.ts` is
the only module that touches the extension API namespace, and there is no
`fetch` or remote code anywhere in it).

## Non-affiliation

"Bionic Reading" is a trademark of Bionic Reading GmbH; this project is not
affiliated with or endorsed by it.

## Still missing before submission

- Host the homepage and privacy policy and paste both URLs into the listing
  (`site/index.html`, `site/privacy.html`).
- A Chrome Web Store developer account with a verified contact email and
  2-step verification enabled.
- Upload `store/screenshots/01-popup.png`, `02-transformed-page.png`,
  `03-options.png`, `04-welcome.png` (all 1280×800) and
  `store/promo/tile-440x280.png`; `marquee-1400x560.png` is optional.
- Upload the packaged build `dist/bionic-page-chrome-0.3.0.zip` (rebuild with
  `bun run package` if the source changes).
- Firefox Add-ons: confirm the gecko id (`bionic-page@srivtx.github.io`) and the
  `data_collection_permissions: ["none"]` declaration, then attach
  `dist/bionic-page-firefox-0.3.0.zip`.
- Decide whether to link the GitHub repository in the Chrome listing.
