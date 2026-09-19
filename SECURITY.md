# Security

## Supported versions

The latest release on the `main` branch is supported.

## Threat model

Bionic Page is a content script that runs on pages the user visits. The two
things worth protecting are (1) the integrity of the page and (2) the user's
privacy.

### What the extension does not do

- It makes **no network requests**. There is no server, no analytics, no
  telemetry, and no remote code. A test (`tests/security.test.ts`) scans the
  source for `fetch`, `XMLHttpRequest`, `WebSocket`, `sendBeacon`, remote URL
  literals, `eval`, `new Function`, `document.write`, and `innerHTML`
  assignment, and fails the build if any appear.
- It does not read or transmit page content, form values, or credentials. The
  only stored data is the user's own settings, in the browser's extension
  storage.
- It does not use `declarativeNetRequest`, `webRequest`, cookies, history,
  bookmarks, or downloads.

### Permissions and why they are needed

| Permission | Why |
|---|---|
| `storage` | Save the user's reading settings |
| `activeTab` | Act on the tab the user is interacting with |
| `<all_urls>` (host) | A reading aid must read the text of whichever page the user chooses; text is processed in memory and discarded |

There is no `<all_urls>` scripting permission beyond the declared content
script, and no `scripting` permission is requested.

### Least-privilege notes

- The content script never evaluates strings and never creates `<script>`.
- Injected markup is limited to `<b class="bp-head">` and, in dim mode, a
  `span.bp-tail`; the text content is always taken from existing text nodes, so
  no page-controlled HTML is ever interpreted by the extension.
- The floating control lives in a shadow root so page CSS cannot reach it and
  its styles cannot leak into the page.
- The transform is fully reversible; disabling the extension restores the page.

## Reporting a vulnerability

Please open a private security advisory on the repository (`Security` →
`Report a vulnerability`) rather than a public issue. Include a minimal
reproduction and the browser version. We aim to acknowledge within a few days.

## Verifying a build

```bash
bun install
bun test                     # includes the anti-network and CSP tests
bun run build
bunx web-ext lint --source-dir dist/firefox   # 0 errors, 0 warnings
node scripts/verify-build.mjs
```
