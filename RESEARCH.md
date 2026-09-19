# Research notes

Findings that shaped the design. URLs were read on 2026-09-19.

## 1. Cross-browser Manifest V3

One source manifest, generated per engine. The differences that bite:

| Concern | Chrome / Edge | Firefox |
|---|---|---|
| Background | `background.service_worker: "background.js"` (string), `type: "module"` | `background.scripts: ["background.js"]` (array), optional `type: "module"` (event page) |
| `browser_specific_settings` | Must be **absent**; Chrome rejects unknown top-level keys at review | **Required** for AMO signing: `gecko.id`; `gecko.data_collection_permissions.required: ["none"]` is required for new AMO submissions from 2025-11-03 |
| API style | `chrome.*`, callback-first with promise support on most MV3 APIs | `browser.*` promise-first; a `chrome.*` alias exists |
| Store validation | `chrome-webstore-upload-cli --dry-run` | `web-ext lint --source-dir dist/firefox` (same linter AMO runs) |

Sources: MDN `browser_specific_settings`; Chrome "Manifest V3" and service
worker migration docs; mv3-extension.com "Shipping One Manifest for Chrome and
Firefox"; extension.js.org MV3 notes.

**Design consequence:** `src/shared/browser.ts` prefers `globalThis.browser`
and falls back to `chrome`, and `build.mjs` emits the right `background` shape
and gecko block per target.

## 2. The bionic algorithm is open to reimplement

There is no need for the licensed Bionic Reading API. Public implementations
and their formulations:

- **`text-vide`** (JS, MIT): `fixationPoint` 1–5, custom separators, ignores
  HTML tags/entities; explicitly lists "Saccade" as unimplemented.
- **Bionify / rahulkarda `bionic-reader`**: a rule string
  `"- 0 1 1 2 0.4"` — first char `-`/`+` toggles common-word handling, then the
  number of emphasized characters for lengths 1,2,3,4, and a fraction for
  length ≥5. This is the basis of our `rules` mode.
- **`bread` userscript** (ltGuillaume): min word length, min paragraph length,
  `boldRatio`, per-domain node selector, dynamic-content toggle.
- **BoldFlow** (MV3, TS+Vite): the closest architectural sibling — TreeWalker,
  MutationObserver, per-site enable/disable, known limitations on
  contenteditable and virtualized renderers.

**Design consequence:** the core is a pure, tested function set
(`src/core/`), and the `rules` mode adopts the familiar per-length format.

## 3. What breaks pages, and how we avoid it

Observed failure classes reported by existing extensions and DOM docs:

- **`contenteditable` / editors** (e.g. WhatsApp Web): rewriting text nodes
  corrupts the editor. → hard skip via `shouldSkipElement`.
- **Virtualized renderers** (e.g. some chat UIs): text is re-rendered often;
  wrapping can fight the framework. → MutationObserver with `requestAnimationFrame`
  coalescing and an idempotence guard.
- **Math** (MathJax/KaTeX): their DOM is generated and fragile. → skip
  `.katex`, `.MathJax`, `math`.
- **Canvas/PDF**: text is not in the DOM at all. → out of scope; the popup
  says so.
- **Whole-body observers** are expensive on dynamic sites. → observe `body`
  but batch, and never observe our own injected `<style>`.
- **Screen readers** may announce `<strong>`/`<b>`. → we also support a
  `dim` mode that changes opacity rather than weight, and the master toggle.

## 4. Evidence caveat (important)

- A 2025 *Attention, Perception, & Psychophysics* study ("To boldly go …")
  found bolding the first half of each word **slowed** reading and increased
  fixations versus plain text.
- A 2025 PMC eye-tracking study reports mixed, condition-dependent effects.

**Design consequence:** we do not market a speed claim. Multiple modes exist
because the effect is individual; the README states this plainly.

## 5. Accessibility and reversibility

- Emphasis uses `<b class="bp-head">` and an injected stylesheet, so sites'
  CSP does not block styling and the original nodes can be restored exactly.
- All UI controls are native form elements with labels and keyboard support.
- The floating page control lives in a **shadow root** so page CSS cannot
  restyle it and its styles cannot leak out.

## 6. Prior art we are not

Bionic Reading GmbH (official extension, licensed API), Bionic Reader (Firefox,
Rain Jr.), BoldFlow, Bionify, Beeline Reader (line-gradient, different
technique), Reedy (RSVP reader). We deliberately avoid the trademark in
product naming and do not use the official API.
