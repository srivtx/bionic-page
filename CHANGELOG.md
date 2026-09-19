# Changelog

All notable changes to Bionic Page. Format loosely follows Keep a Changelog;
versions follow semver.

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
