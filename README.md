# Bionic Page

Turn any web page into a bionic (fixation) reading page — bold, fade, vowel
anchor, or custom rules — with per-site control and full reversibility.

A Manifest V3 extension for **Chrome** and **Firefox**, built from one
TypeScript source tree with a generated per-engine manifest.

## What it does

- Rewrites the readable text of a page so the leading part of each word is
  emphasized, giving the eye an anchor per word.
- Ships **five modes**, not one: `classic`, `half`, `vowel`, `dim`, and a
  `rules` mode with per-length counts (`"0 1 1 2 0.4"`).
- Works on dynamic pages (SPAs, infinite scroll) via a `MutationObserver`.
- Skips what must never be touched: scripts, code, `pre`, inputs, editors,
  math, SVG, and anything marked `data-bionic="off"`.
- Is **fully reversible** — toggling off restores the original text nodes.
- Per-site overrides, a floating page control, keyboard shortcut, and a
  toolbar badge that shows whether the current tab is on.
- **No network, no analytics, no accounts.** Everything runs locally.

Download the latest packaged build from the
[releases page](https://github.com/srivtx/bionic-page/releases).

## Modes

| Mode | What it emphasizes |
|---|---|
| Classic | The first `intensity` share of each word |
| Half | The first half of each word (Bionic Reading default) |
| Vowel anchor | Up to the first vowel group — friendlier for many languages |
| Low distraction | Bold prefix, fade the rest |
| Custom rule | Per-length counts plus a fraction for longer words |

## Development

```bash
bun install
bun run build          # both targets -> dist/chrome, dist/firefox
bun run build:chrome   # one target
bun run build:watch    # rebuild on change
bun test               # unit + real-DOM tests
bun run typecheck
bun run verify         # assert every manifest-referenced file exists
bun run e2e            # real-browser check over the DevTools protocol
bun run package        # zip both targets for store upload
```

Load `dist/chrome` via `chrome://extensions` → *Load unpacked*.
Load `dist/firefox` via `about:debugging` → *This Firefox* → *Load Temporary
Add-on*. Validate the Firefox package with `bun run lint:firefox`.

Releasing to the stores: see `docs/STORE_LISTING.md` (copy, permission
justifications, screenshots, checklist) and `docs/CONTRACTS.md` (module map).

## Architecture

```
popup / options  ──messages──▶  background (service worker / event page)
      │                                   │
      └────── messages ──▶  content script (per frame)
                                   │
                    ┌──────────────┼───────────────┐
                    ▼              ▼               ▼
              core/algorithm   content/domWalker  content/observer
              (pure, tested)   (walk + wrap)      (dynamic content)
```

`src/shared/types.ts` is the single contract every module imports. See
`docs/CONTRACTS.md` for the exact interfaces.

## Privacy

The extension requests `storage`, `activeTab`, `scripting`, and `<all_urls>`
host access (needed to read page text locally). It makes **no** network
requests and stores only your settings, synced through the browser's own
storage. Removing the extension removes the data.

## Honest note on the science

Bionic Reading is a commercial method; peer-reviewed eye-tracking research is
**mixed**, and one study found bolding the first half of each word *slowed*
reading for typical readers. This project does not claim a speed-reading
benefit. It offers configurable visual anchoring, and you should judge it on
your own reading. See `RESEARCH.md`.

## License

MIT. "Bionic Reading" is a trademark of Bionic Reading GmbH; this project is
not affiliated with or endorsed by it.
