# AGENTS.md — working in this repo

A Manifest V3 browser extension (Chrome + Firefox) that applies bionic-style
fixation emphasis to page text. One TypeScript source tree, generated
manifests, no runtime dependencies.

## Commands

```bash
bun install
bun run typecheck     # tsc --noEmit, must be clean
bun test              # unit + DOM tests, must pass
bun run icons         # regenerate assets/icons/*.png (zero-dep PNG encoder)
bun run build         # dist/chrome and dist/firefox
node scripts/verify-build.mjs   # asserts every manifest-referenced file exists
bun run e2e           # injects the built content.js into real Chrome via CDP
bun run lint:firefox  # optional, needs web-ext
```

Note: branded Google Chrome 127+ silently ignores `--load-extension`, so the
e2e script injects the built content script over the DevTools Protocol instead
of relying on Chrome to attach the extension. The content script therefore works
even when the extension APIs are absent (see the `degraded` handling).

Load `dist/chrome` at `chrome://extensions` (Developer mode → Load unpacked).
Load `dist/firefox` at `about:debugging` → This Firefox → Load Temporary Add-on.

## Architecture and ownership

- `src/shared/types.ts` is the **single contract**. Every module imports its
  types from here. Do not add cross-module imports without updating
  `docs/CONTRACTS.md`.
- `src/shared/browser.ts` is the only place that touches the extension API
  namespace. Prefer `api` + `call()`; never assume `chrome.*` callback style.
- `src/core/*` is pure and must stay DOM-free so it is unit-testable.
- `src/content/*` owns DOM mutation. It must be reversible and idempotent.
- `src/popup/*`, `src/options/*`, `src/background/*` are UI/worker surfaces.
- `scripts/manifest.mjs` is the only source of manifest truth; `build.mjs`
  consumes it and `tests/manifest.test.ts` asserts it.
- `site/` is the static landing page; it has no build step and must make no
  external network requests.

## Rules for changes

1. Keep the core pure: no DOM, no globals, no clocks, no randomness.
2. Every DOM transform must be reversible and idempotent; add a test.
3. Never touch `script`, `style`, `code`, `pre`, inputs, `contenteditable`,
   math, SVG, or `[data-bionic="off"]` — `guards.ts` is the gate.
4. Follow `docs/BRAND.md` for any user-visible surface.
5. No new runtime dependencies. Dev/test dependencies need a reason.
6. `bunx tsc --noEmit` and `bun test` must pass before a change is done.

## Files that are easy to break

- `build.mjs`: entries are `content`, `popup`, `options`, `background`; all are
  bundled IIFEs so no module background support is required.
- `src/content/styles.ts`: injected CSS is generated from settings; `dim` mode
  wraps tails in `span.bp-tail` and must be undone before `revert()`.
- `scripts/make-icons.mjs`: pure-Node PNG encoder; no image libraries.
