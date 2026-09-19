# bionic-page — module contracts

Every module imports its types **only** from `src/shared/types.ts` and its
cross-browser helpers **only** from `src/shared/browser.ts` /
`storage.ts` / `messaging.ts`. Do not add new cross-module imports without
updating this file.

## Ownership map (agents edit only their files)

| Area | Files | Owner |
|---|---|---|
| Core algorithm | `src/core/algorithm.ts`, `src/core/rules.ts`, `src/core/languages.ts`, `tests/algorithm.test.ts` | agent-core |
| DOM layer | `src/content/guards.ts`, `src/content/domWalker.ts`, `src/content/observer.ts` | agent-dom |
| Content entry + styles | `src/content/content.ts`, `src/content/styles.ts` | agent-content |
| UI | `src/popup/popup.{html,ts,css}`, `src/options/options.{html,ts,css}` | agent-ui |
| Build + background | `build.mjs`, `src/background/background.ts`, `scripts/make-icons.mjs`, `scripts/package.mjs` | agent-build |

Shared files (`src/shared/*`, `src/shared/types.ts`, `build` inputs) are frozen
by the orchestrator. If a contract looks wrong, report it; do not edit shared
files.

## Core algorithm contract (`src/core/`)

```ts
// languages.ts
export const DEFAULT_VOWELS: string;            // "aeiouy" plus accented latin
export const COMMON_WORDS: ReadonlySet<string>; // lowercase english function words
export function isLetter(ch: string): boolean;  // unicode-aware, includes combining marks
export function splitAffixes(word: string): { prefix: string; core: string; suffix: string };
//   prefix/suffix are leading/trailing non-letter runs (quotes, brackets, punctuation)

// rules.ts
export interface RuleSpec { highLightCommon: boolean; counts: number[]; fraction: number }
export function parseRule(rule: string): RuleSpec;
//   "0 1 1 2 0.4" -> { highLightCommon:false, counts:[0,1,1,2], fraction:0.4 }
//   "+0 1 1 2 0.4" -> highLightCommon:true
//   invalid input falls back to DEFAULT_RULE without throwing
export const DEFAULT_RULE: string;

// algorithm.ts
import type { ModeId } from "../shared/types";
export interface BionicOptions {
  mode: ModeId;
  intensity: number;        // already clamped [0.2,0.9]
  minWordLength: number;    // already clamped [2,8]
  skipCommonWords: boolean;
  rule: string;
  customVowels: string;
}
export function boldLength(word: string, options: BionicOptions): number;
//   Number of leading *letters* to emphasize, 0 when the word should not be
//   transformed. Must be deterministic and never exceed the core length.
export function emphasize(word: string, options: BionicOptions): { head: string; tail: string } | null;
//   null -> leave the word untouched. Otherwise split the *whole word*
//   (including affixes: the head may include a leading quote, the tail keeps
//   trailing punctuation) so callers can wrap `head` in <b>.
export function bionicText(text: string, options: BionicOptions): string;
//   Plain-text convenience: returns text with "<b>..</b>" around heads. Used by
//   tests and previews only; the DOM path uses emphasize().
export const CORE_PACKAGE_VERSION: string;
```

Rules the implementation must satisfy (asserted in tests):

1. `boldLength` never returns more than the number of letters in the word.
2. `boldLength("", ...) === 0`; whitespace-only returns 0.
3. Words shorter than `minWordLength` return 0, except mode `"rules"` and
   `"half"` which may still emphasize 2–3 letter words when the rule allows.
4. `skipCommonWords:true` returns 0 for members of `COMMON_WORDS`.
5. Mode `"half"` on an 8-letter word returns 4.
6. Mode `"classic"` with intensity 0.5 on an 8-letter word returns 4; with
   intensity 0.25 returns 2; always at least 1 when the word qualifies.
7. Mode `"vowel"` emphasizes up to and including the first vowel group
   (e.g. "strength" -> the "e" run), at least 1 letter, at most half+1.
8. Mode `"rules"` with `"0 1 1 2 0.4"`: 1-letter 0, 2-letter 1, 3-letter 1,
   4-letter 2, 5+ `ceil(0.4*len)`.
9. `emphasize` is pure: no DOM, no globals, no randomness, no clocks.
10. `bionicText` never emits nested `<b>` and preserves all original
    characters in order (strip tags -> original input).

## DOM layer contract (`src/content/`)

```ts
// guards.ts
export const SKIP_TAGS: ReadonlySet<string>;
//   script style noscript textarea input select option svg math canvas iframe
//   code pre kbd samp var tt template head title
export const SKIP_SELECTORS: readonly string[];
//   [contenteditable]:not([contenteditable="false"]), .katex, .MathJax,
//   .math, [data-bionic="off"], [aria-hidden="true"] (optional)
export function shouldSkipElement(el: Element): boolean;
export function shouldSkipText(text: string, parent: Element | null): boolean;
//   skip whitespace-only, skip text with no letters, skip inside skip tags

// domWalker.ts
import type { BionicOptions } from "../core/algorithm";
export interface TransformStats { textNodes: number; words: number; skipped: number }
export interface TransformHandle {
  revert(): void;               // restore original text nodes exactly
  readonly stats: TransformStats;
}
export function transformRoot(root: ParentNode, options: BionicOptions, doc?: Document): TransformHandle;
//   Walk text nodes, apply emphasize(), and wrap heads in <b class="bp-head">.
//   Must be fully reversible and idempotent (never wraps already-wrapped text).
//   Uses a single injected <style> (see styles.ts) rather than inline styles.

// observer.ts
export function observeDynamic(
  root: ParentNode,
  onChange: () => void,
  options?: { debounceMs?: number },
): () => void;
//   MutationObserver on childList+characterData, subtree. Coalesces bursts and
//   schedules onChange via requestAnimationFrame (or setTimeout fallback).
//   Never observes the <style> the extension injects (ignore its node).
```

## Content entry contract (`src/content/`)

```ts
// styles.ts
export const STYLE_ID: string; // "bionic-page-style"
export function ensureStyles(doc: Document, settings: Settings): void;
export function updateStyles(doc: Document, settings: Settings): void;
export function removeStyles(doc: Document): void;

// content.ts  (bundled as an IIFE content script)
// Responsibilities:
//  - on load: loadSettings(), read the page override, apply or not
//  - listen for messages: get-state, apply, remove, toggle, settings-changed, refresh
//  - report PageState back for a get-state message
//  - when processDynamic, observe and re-apply to new subtrees
//  - when showFloatingControl and settings.enabled, render a tiny shadow-DOM
//    toggle (accessible button, 32px, bottom-right, no layout impact)
//  - never throw into the page; all failures degrade silently
```

## UI contract (`src/popup/`, `src/options/`)

Popup (`popup.html` + `popup.ts`): master toggle, mode `<select>`, intensity
slider, "this site" on/off, and a link that opens the options page. Reads state
via `sendToActiveTab({type:"get-state"})`, writes via messages, and updates
live. Must be keyboard accessible and not exceed 320px width.

Options (`options.html` + `options.ts`): full `Settings` form, per-site list
(add/remove/enable), custom rule with a live preview using
`bionicText`/`emphasize`, reset to defaults, import/export JSON. Persist with
`saveSettings` and notify tabs via `broadcast({type:"settings-changed",...})`.

Both pages load `../shared/storage.ts` and `../shared/messaging.ts`; the build
bundles them, so use normal ESM imports.

## Build contract (`build.mjs`)

- Bundles with esbuild (no other runtime deps) to `dist/chrome/` and
  `dist/firefox/`.
- Entries: `src/content/content.ts` (IIFE), `src/popup/popup.ts` (IIFE),
  `src/options/options.ts` (IIFE), `src/background/background.ts`
  (ESM module).
- Generates `dist/<target>/manifest.json` from one shared base object:
  - `manifest_version: 3`, `name: "Bionic Page"`, `version` from package.json.
  - `permissions: ["storage","activeTab","scripting"]`,
    `host_permissions: ["<all_urls>"]`.
  - Content script matches `<all_urls>`, `all_frames: true`, `run_at:
    "document_idle"`.
  - Chrome: `background: { service_worker: "background.js", type: "module" }`,
    `minimum_chrome_version: "116"`, **no** `browser_specific_settings`,
    `action` with default_popup + icons.
  - Firefox: `background: { scripts: ["background.js"] }`,
    `browser_specific_settings: { gecko: { id:
    "bionic-page@example.com", strict_min_version: "140.0",
    data_collection_permissions: { required: ["none"] } }, gecko_android: {
    strict_min_version: "142.0" } }`,
    `action` with default_popup + icons, `options_ui` page.
- Copies `popup.html`, `options.html`, CSS, and `assets/icons/*` into each
  target; rewrites nothing else.
- `node build.mjs` builds both; `node build.mjs chrome` builds one;
  `--watch` uses esbuild context rebuild.
