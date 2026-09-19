# Architecture

Bionic Page applies a reversible typographic transform to the text of a web
page. It is one TypeScript tree that builds into an MV3 extension for Chrome
and Firefox.

## Module map

```
src/
  shared/        contract and cross-browser plumbing (no DOM mutation)
    types.ts       Settings, PageState, Message, MODES, sanitizeSettings
    browser.ts     api namespace (browser.* preferred, chrome.* fallback) + call()
    storage.ts     loadSettings / saveSettings / onSettingsChanged
    messaging.ts   sendToTab / sendToActiveTab / broadcast / onMessage
    site.ts        match-pattern matching and per-site resolution (pure)
  core/          pure algorithm; DOM-free and unit-testable
    algorithm.ts   boldLength / emphasize / bionicText
    rules.ts       parseRule for the custom rule mode
    languages.ts   vowels, common words, unicode helpers
  content/       DOM mutation; reversible and idempotent
    guards.ts      what must never be touched
    domWalker.ts   text walk, wrapping, shadow-root recursion, revert
    observer.ts    coalesced MutationObserver for dynamic content
    styles.ts      the single injected stylesheet + dim-mode tail decoration
    content.ts     lifecycle: apply, remove, toggle, messages, floating control
  popup/         toolbar popup (mode, intensity, per-site, open options)
  options/       full settings form, site list, live preview, import/export
  welcome/       first-run onboarding page
  background/    install defaults, toggle command, per-tab badge
```

`src/shared/types.ts` is the single contract; `scripts/manifest.mjs` is the
single source of manifest truth.

## Runtime data flow

```
popup/options ──saveSettings──▶ extension storage ──onChanged──▶ content refresh
      │                                   ▲
      └── settings-changed (broadcast) ───┘
                                          │
content: get-state ─▶ PageState           │
content: apply ─▶ transformRoot ─▶ observer ─▶ incremental apply
content: remove ─▶ revertAll ─▶ original DOM
```

## Invariants

1. **Purity.** `src/core/*` has no DOM, timers, randomness, or network. It is
   deterministic and total.
2. **Reversibility.** Every inserted node is recorded; `revert()` re-inserts the
   original text nodes and removes what it added. Tests compare `innerHTML`
   before and after.
3. **Idempotence.** The walker keeps a `WeakSet` of processed text nodes, so a
   second pass adds nothing, while text a framework *replaces* inside an
   existing paragraph is still transformed.
4. **Safety.** `guards.ts` is the only gate for exclusion; it skips scripts,
   styles, code, pre, form controls, editors, math, SVG, nav, buttons, and
   `[data-bionic="off"]`, and the algorithm skips URLs, emails, and long
   unbroken runs.
5. **No network.** The extension makes no requests; a test scans the source for
   `fetch`, `XMLHttpRequest`, `WebSocket`, remote URLs, `eval`, `new Function`,
   and `innerHTML` assignment.
6. **One manifest source.** `scripts/manifest.mjs` feeds `build.mjs` and is
   asserted by `tests/manifest.test.ts`, so Chrome and Firefox cannot drift.

## Lifecycle

- On load the content script reads settings, resolves the per-site rule, and
  applies if enabled. It reports state and listens for messages.
- A `MutationObserver` batches changes and re-runs the walker incrementally;
  after 64 incremental handles the tab compacts with a full re-apply.
- A mode or setting change reverts the previous pass before re-applying, so the
  change is visible and nothing is left behind.

## Build pipeline

```
src/**/*.ts ──esbuild──▶ dist/<target>/*.js      (content/popup/options/welcome/background)
src/**/*.html,css ─────▶ dist/<target>/*.html,css
assets/icons/*.png ────▶ dist/<target>/icons/
scripts/manifest.mjs ──▶ dist/<target>/manifest.json
```

`build.mjs <chrome|firefox|both>`; `--watch` rebuilds on change.
`scripts/verify-build.mjs` asserts every file a manifest references exists and
that the version matches `package.json`.
