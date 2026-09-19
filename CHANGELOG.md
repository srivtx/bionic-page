# Changelog

All notable changes to Bionic Page. Format loosely follows Keep a Changelog;
versions follow semver.

## [0.3.0] — 2026-09-19

Production-readiness release.

### Added

- **Shadow DOM support**: text inside open shadow roots is transformed and
  reverted, including nested roots, while skipped hosts are left alone.
- **First-run welcome page** with quick-start steps, opened on install.
- **Security gate**: `tests/security.test.ts` fails the build on `eval`,
  `new Function`, `document.write`, `innerHTML` assignment, `fetch`,
  `XMLHttpRequest`, `WebSocket`, `sendBeacon`, remote URL literals, string
  timers, inline scripts, or inline event handlers.
- **Accessibility gate**: every form control in every extension page must be
  labelled; buttons need an accessible name; images need alt text.
- **Release workflow**: tags `v*` run typecheck, tests, build, and publish the
  packaged zips automatically; the tag must match `package.json`.
- Store promotional images (440×280 tile, 1400×560 marquee) and
  `docs/ARCHITECTURE.md`, `SECURITY.md`, `CONTRIBUTING.md`,
  `CODE_OF_CONDUCT.md`, and issue/PR templates.
- The browser e2e now drives apply/remove through a debug handle and asserts a
  full toggle-off restore (10 checks).

## [0.2.0] — 2026-09-19

Hardening release: the extension is now correct on dynamic pages, safer around
non-prose text, and the landing site has motion and full documentation.

### Fixed

- Text that a framework replaces inside an already-transformed paragraph is now
  transformed (the walker tracks processed text nodes instead of marking
  parents), while re-runs stay idempotent.
- Changing mode or a setting while active now takes effect: the previous pass is
  reverted before re-applying. Before this, the change was silently skipped and
  a later toggle-off could leave wrappers behind.
- Incremental passes are compacted after 64 handles so a long-lived tab cannot
  accumulate unbounded records.
- The options live preview no longer assigns `innerHTML` (`web-ext` unsafe
  assignment warning).
- Firefox minimum is 140 (and Android 142) so `data_collection_permissions` is
  understood; `web-ext lint` is now 0/0/0.
- URLs, email addresses, and very long unbroken runs (for example a CJK sentence
  with no spaces) are left alone instead of being half-bolded.

### Added

- Toolbar badge for per-tab state; nav and button regions are skipped.
- Landing-site motion: hero entrance, scroll reveal, reading progress bar,
  sticky-nav state, back-to-top control, and a staggered demo ink-in, all
  disabled under `prefers-reduced-motion`.
- A dedicated how-to page, a privacy policy page, and a store listing kit.
- Benchmark script and loose performance tests.

## [0.1.0] — 2026-09-19

First working release.

### Added

- Manifest V3 extension for Chrome and Firefox, generated from one manifest
  source (`scripts/manifest.mjs`) into `dist/chrome` and `dist/firefox`.
- Five reading modes: Classic, Half, Vowel anchor, Low distraction, and a
  Custom rule mode with per-length counts plus a fraction (`0 1 1 2 0.4`).
- Reading settings: intensity, minimum word length, skip common words, respect
  existing bold, emphasis weight, faded-remainder opacity, letter spacing,
  custom vowels, dynamic-content handling, and iframe handling.
- Per-site rules (match patterns), a floating in-page control in a shadow root,
  a `Ctrl/Cmd+Shift+Y` toggle command, and a toolbar badge for per-tab state.
- Fully reversible, idempotent DOM transform with guards that skip code, pre,
  editors, inputs, math, SVG, nav, buttons, and `[data-bionic="off"]`.
- URL, email, and very long unbroken token protection (no half-bolded URLs or
  CJK runs).
- Popup and options UIs with a live preview, JSON import/export, and reset.
- Static landing site with a live demo, a how-to walkthrough, and a privacy
  policy; brand tokens in `docs/BRAND.md`.
- Tooling: esbuild build, zero-dependency PNG icon generator, zip packager,
  post-build verifier, `web-ext` lint clean, CDP browser e2e, benchmark.
- 89 unit and real-DOM tests plus a GitHub Actions CI workflow.

### Notes

- Firefox requires 140+ because `data_collection_permissions` is only
  understood from that version.
- The extension makes no network requests and stores only settings.
- "Bionic Reading" is a trademark of Bionic Reading GmbH; this project is not
  affiliated with it.
