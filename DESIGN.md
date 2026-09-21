---
version: alpha
name: bionic-page
description: "The bionic-page landing site — the Lens suite base system with an indigo accent, a headline written into place by a caret, and a field of emphasis breathing behind it."
colors:
  primary: "#4f46e5"
  accent: "#4f46e5"
  accent-ink: "#ffffff"
  accent-soft: "color-mix(in srgb, #4f46e5 10%, transparent)"
  accent-dark: "#818cf8"
  accent-ink-dark: "#0a0a0a"
  accent-soft-dark: "color-mix(in srgb, #818cf8 10%, transparent)"
  swash: "#c026d3"
  swash-dark: "#e879f9"
  canvas: "#ffffff"
  canvas-dark: "#0a0a0a"
  surface: "#fafafa"
  surface-dark: "#111112"
  surface-2: "#f4f4f5"
  surface-2-dark: "#18181b"
  hairline: "#e6e6e8"
  hairline-dark: "#232326"
  hairline-strong: "#d4d4d8"
  hairline-strong-dark: "#33333a"
  ink: "#0a0a0a"
  ink-dark: "#fafafa"
  body: "#3f3f46"
  body-dark: "#c4c4ca"
  mute: "#71717a"
  mute-dark: "#8b8b93"
  faint: "#6f6f78"
  faint-dark: "#8b8b93"
  success: "#15803d"
  success-dark: "#4ade80"
  warning: "#b45309"
  warning-dark: "#fbbf24"
  error: "#b91c1c"
  error-dark: "#f87171"
  info: "#1d4ed8"
  info-dark: "#93c5fd"
  term-bg: "#0b0b0e"
  term-bar: "#121216"
  term-ink: "#e8e8ef"
  term-mute: "#8f8f9b"
  term-dim: "#63636e"
  term-cmd: "#f2f2f7"
  term-err: "#f87171"
  term-warn: "#fbbf24"
  term-info: "#93c5fd"
  term-ok: "#4ade80"
  term-acc: "#a5b4fc"
typography:
  display:
    fontFamily: Geist
    fontSize: 3.75rem
    fontWeight: 600
    lineHeight: 1.02
    letterSpacing: "-0.04em"
  title:
    fontFamily: Geist
    fontSize: 2.5rem
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.03em"
  headline:
    fontFamily: Geist
    fontSize: 1.9rem
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  headline-sm:
    fontFamily: Geist
    fontSize: 1.4375rem
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  subhead:
    fontFamily: Geist
    fontSize: 1.0625rem
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  lede:
    fontFamily: Geist
    fontSize: 1.125rem
    fontWeight: 400
    lineHeight: 1.6
  lead-editorial:
    fontFamily: Geist
    fontSize: 1.1875rem
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "-0.015em"
  body:
    fontFamily: Geist
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.6
    fontFeature: '"ss01" on, "cv11" on'
  body-sm:
    fontFamily: Geist
    fontSize: 0.9375rem
    fontWeight: 400
    lineHeight: 1.6
  nav:
    fontFamily: Geist
    fontSize: 0.875rem
    fontWeight: 500
    lineHeight: 1.6
  button:
    fontFamily: Geist
    fontSize: 0.9rem
    fontWeight: 550
    lineHeight: 1
  button-sm:
    fontFamily: Geist
    fontSize: 0.8125rem
    fontWeight: 550
    lineHeight: 1
  label:
    fontFamily: Geist Mono
    fontSize: 0.6875rem
    fontWeight: 500
    lineHeight: 1
    letterSpacing: 0.1em
  mono:
    fontFamily: Geist Mono
    fontSize: 0.8125rem
    fontWeight: 400
    lineHeight: 1.7
  metric:
    fontFamily: Geist Mono
    fontSize: 1.375rem
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.02em"
rounded:
  xs: 3px
  sm: 5px
  md: 7px
  lg: 10px
  brand: 8px
  full: 999px
spacing:
  s-1: 4px
  s-2: 8px
  s-3: 12px
  s-4: 16px
  s-5: 24px
  s-6: 32px
  s-7: 48px
  s-8: 64px
  s-9: 96px
  gutter: 24px
  nav-height: 56px
  container: 1120px
components:
  button:
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
    padding: "0 14px"
    height: 38px
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.accent-ink}"
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
    padding: "0 14px"
    height: 38px
  button-primary-hover:
    backgroundColor: "color-mix(in srgb, #4f46e5 88%, #0a0a0a)"
  button-outline:
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
    padding: "0 14px"
    height: 38px
  button-ghost:
    textColor: "{colors.mute}"
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
    padding: "0 14px"
    height: 38px
  button-sm:
    typography: "{typography.button-sm}"
    rounded: "{rounded.sm}"
    padding: "0 10px"
    height: 32px
  chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.mute}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
  chip-error:
    textColor: "{colors.error}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
  chip-warning:
    textColor: "{colors.warning}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
  chip-info:
    textColor: "{colors.info}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
  chip-ok:
    textColor: "{colors.success}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
  card:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.body}"
    rounded: "{rounded.md}"
    padding: "{spacing.s-5}"
  field:
    textColor: "{colors.mute}"
    typography: "{typography.mono}"
  input:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.mono}"
    rounded: "{rounded.md}"
    padding: "{spacing.s-4}"
  nav:
    backgroundColor: "color-mix(in srgb, #ffffff 82%, transparent)"
    height: "{spacing.nav-height}"
  nav-link:
    textColor: "{colors.mute}"
    typography: "{typography.nav}"
    rounded: "{rounded.sm}"
    padding: 6px
  nav-link-hover:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
  nav-link-active:
    backgroundColor: "{colors.accent-soft}"
  brand:
    textColor: "{colors.ink}"
    typography: "{typography.body}"
  brand-mark:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.brand}"
    size: 26px
  brand-tag:
    textColor: "{colors.faint}"
    typography: "{typography.label}"
  footer:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.faint}"
    padding: "{spacing.s-7}"
  footer-heading:
    textColor: "{colors.faint}"
    typography: "{typography.label}"
  footer-link:
    textColor: "{colors.body}"
    typography: "{typography.nav}"
  footer-meta:
    textColor: "{colors.faint}"
    typography: "{typography.nav}"
  divider:
    backgroundColor: "{colors.hairline}"
    height: 1px
  divider-strong:
    backgroundColor: "{colors.hairline-strong}"
    height: 1px
  eyebrow:
    textColor: "{colors.mute}"
    typography: "{typography.label}"
  code:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.mono}"
    rounded: "{rounded.md}"
    padding: "{spacing.s-4}"
  term:
    backgroundColor: "{colors.term-bg}"
    textColor: "{colors.term-ink}"
    typography: "{typography.mono}"
    rounded: "{rounded.lg}"
    padding: "{spacing.s-4}"
  term-bar:
    backgroundColor: "{colors.term-bar}"
    textColor: "{colors.term-mute}"
  term-prompt:
    backgroundColor: "{colors.term-bg}"
    textColor: "{colors.term-dim}"
  term-command:
    textColor: "{colors.term-cmd}"
  term-error:
    textColor: "{colors.term-err}"
  term-warning:
    textColor: "{colors.term-warn}"
  term-info:
    textColor: "{colors.term-info}"
  term-ok:
    textColor: "{colors.term-ok}"
  term-accent:
    textColor: "{colors.term-acc}"
  table-head:
    textColor: "{colors.mute}"
    typography: "{typography.label}"
  table-cell:
    textColor: "{colors.body}"
    typography: "{typography.body-sm}"
  callout:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.body}"
    rounded: "{rounded.sm}"
    padding: "{spacing.s-5}"
  install:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "{spacing.s-3}"
  keycap:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.mono}"
    rounded: "{rounded.sm}"
    padding: "2px 7px"
  tile:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "{spacing.s-4}"
  tile-name:
    textColor: "{colors.ink}"
    typography: "{typography.subhead}"
  tile-sample:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.body}"
    typography: "{typography.nav}"
    rounded: "{rounded.sm}"
  tile-note:
    textColor: "{colors.mute}"
    typography: "{typography.body-sm}"
  metric:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "{spacing.s-4}"
  metric-number:
    textColor: "{colors.ink}"
    typography: "{typography.metric}"
  metric-key:
    textColor: "{colors.mute}"
    typography: "{typography.body-sm}"
  bionic-head:
    textColor: "{colors.ink}"
  bionic-tail:
    textColor: "{colors.body}"
  metabar:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.mute}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "6px 14px"
  metabar-accent:
    textColor: "{colors.accent}"
    typography: "{typography.label}"
  metabar-sep:
    backgroundColor: "{colors.hairline-strong}"
    width: 1px
    height: 13px
  demo-panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
  demo-head:
    backgroundColor: "{colors.surface-2}"
    padding: "{spacing.s-4}"
  demo-title:
    textColor: "{colors.ink}"
    typography: "{typography.label}"
  demo-body:
    backgroundColor: "{colors.hairline}"
    padding: 1px
  demo-pane:
    backgroundColor: "{colors.canvas}"
    padding: "{spacing.s-5}"
  demo-label:
    textColor: "{colors.faint}"
    typography: "{typography.label}"
  demo-output:
    textColor: "{colors.body}"
    typography: "{typography.lede}"
  demo-foot:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.mute}"
    typography: "{typography.label}"
    padding: "{spacing.s-4}"
  mode-chip:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.body}"
    typography: "{typography.button-sm}"
    rounded: "{rounded.full}"
    padding: "5px 11px"
  mode-chip-on:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.full}"
    padding: "5px 11px"
  compare:
    backgroundColor: "{colors.canvas}"
    rounded: "{rounded.md}"
  compare-text:
    textColor: "{colors.body}"
    typography: "{typography.body}"
    padding: "{spacing.s-5}"
  compare-knob:
    backgroundColor: "{colors.accent}"
    size: 2px
  compare-grip:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.full}"
    size: 30px
  compare-tag:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.mute}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "2px 9px"
  hero-caret:
    backgroundColor: "{colors.swash}"
    width: 2px
  floating-control:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.button-sm}"
    rounded: "{rounded.full}"
    padding: "9px 14px"
  floating-dot:
    backgroundColor: "{colors.accent}"
    size: 9px
  footer-art:
    height: 232px
  mark-off:
    textColor: "{colors.hairline-strong}"
  mark-on:
    textColor: "{colors.ink}"
  mark-caret:
    backgroundColor: "{colors.accent}"
    width: 3px
  nav-dark:
    backgroundColor: "color-mix(in srgb, #0a0a0a 82%, transparent)"
    height: "{spacing.nav-height}"
  nav-link-dark:
    textColor: "{colors.mute-dark}"
    typography: "{typography.nav}"
  nav-link-active-dark:
    backgroundColor: "{colors.accent-soft-dark}"
  brand-dark:
    textColor: "{colors.ink-dark}"
    typography: "{typography.body}"
  brand-mark-dark:
    backgroundColor: "{colors.accent-dark}"
    textColor: "{colors.accent-ink-dark}"
    rounded: "{rounded.brand}"
    size: 26px
  card-dark:
    backgroundColor: "{colors.canvas-dark}"
    textColor: "{colors.body-dark}"
    rounded: "{rounded.md}"
    padding: "{spacing.s-5}"
  footer-dark:
    backgroundColor: "{colors.canvas-dark}"
    textColor: "{colors.faint-dark}"
    padding: "{spacing.s-7}"
  divider-dark:
    backgroundColor: "{colors.hairline-dark}"
    height: 1px
  divider-strong-dark:
    backgroundColor: "{colors.hairline-strong-dark}"
    height: 1px
  chip-dark:
    backgroundColor: "{colors.surface-2-dark}"
    textColor: "{colors.mute-dark}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
  chip-error-dark:
    textColor: "{colors.error-dark}"
  chip-warning-dark:
    textColor: "{colors.warning-dark}"
  chip-info-dark:
    textColor: "{colors.info-dark}"
  chip-ok-dark:
    textColor: "{colors.success-dark}"
  input-dark:
    backgroundColor: "{colors.canvas-dark}"
    textColor: "{colors.ink-dark}"
    typography: "{typography.mono}"
    rounded: "{rounded.md}"
    padding: "{spacing.s-4}"
  demo-panel-dark:
    backgroundColor: "{colors.surface-dark}"
    rounded: "{rounded.lg}"
  demo-head-dark:
    backgroundColor: "{colors.surface-2-dark}"
    padding: "{spacing.s-4}"
  hero-caret-dark:
    backgroundColor: "{colors.swash-dark}"
    width: 2px
---

## Overview

bionic-page is the landing site for a Manifest V3 extension that rewrites the
readable text of any page so the leading part of each word carries more weight.
It shares the **Lens suite** base system (`site/assets/lens.css`,
`site/assets/theme.css`) with its sibling, and differs only in identity
(`site/assets/identity.css`).

The personality is **engineered and quiet**: a 1120px container, hairline
borders, layered soft shadows, 12/20/pill radii, and exactly one accent. The page
should read like a precise instrument that explains itself — measured numbers,
reversible behaviour, and a live demo that runs the extension's own algorithm
offline.

The page is one document: a fixed nav, a hero with a live reading card, a band of
scrolling rails, then numbered sections, then a footer whose wordmark is set the
way the algorithm sets a word. This identity is **indigo**, and its signature is
a headline that is *written into place* one anchor at a time, with a caret at the
end of the line. The sibling uses teal and a different signature; the two share
the same base system and no identity.

UI type is Geist and Geist Mono, self-hosted. Reading text — the demo, the
compare panel, the mode samples — is set in a serif, because that is the kind of
text the extension is for.

## Colors

One accent, a hairline-driven neutral ramp, and semantic status colors. All
values are the literal custom properties declared in `lens.css`, `theme.css` and
`identity.css`; the light values are the normative tokens above, and the dark
overrides are listed here because the schema has a single value axis.

- **Accent — indigo `#4f46e5` (`#818cf8` in dark):** the sole driver of
  interaction. `primary` is the spec-required alias of `accent`; they are the
  same value. Accent ink is white on light and near-black on dark.
- **Accent wash — `accent-soft`:** `color-mix(in srgb, accent 10%, transparent)`,
  used behind the hero and as the current-page wash in the sidebar. It is a
  translucent token, so contrast tools that flatten it will report a misleading
  ratio.
- **Canvas / surface / surface-2 — `#ffffff` / `#fafafa` / `#f4f4f5`:** page,
  raised panels, and pressed/chrome surfaces.
- **Hairline / hairline-strong — `#e6e6e8` / `#d4d4d8`:** every border and
  divider. These are border-and-fill tokens, not text colors.
- **Ink / body / mute / faint — `#0a0a0a` / `#3f3f46` / `#71717a` / `#6f6f78`:**
  the text ramp: headlines, prose, secondary copy, and labels.
- **Swash — `#c026d3` (`#e879f9` in dark):** a second, *non-interactive* hue
  used only by `.swash` and the writing caret, so the pair never reads as the
  same tool as its teal sibling. It is decoration, never a button.
- **Success / warning / error / info:** status only, carried by `.chip--*`.
- **Terminal palette (`term-*`):** a self-contained dark set for `.term`, the
  same in both themes.

**Dark theme.** The same token names take dark values under
`[data-theme="dark"]` and `prefers-color-scheme: dark`: canvas `#0a0a0a`,
surface `#111112`, surface-2 `#18181b`, hairline `#232326`,
hairline-strong `#33333a`, ink `#fafafa`, body `#c4c4ca`, mute/faint `#8b8b93`,
accent `#818cf8`, swash `#e879f9`; the status colors brighten. The schema has no
theme axis, so these are documented as `*-dark` tokens and `*-dark` component
variants rather than as a single normative value.

**Accessibility.** Every body and metadata pair clears WCAG AA (4.5:1) in both
themes; the accent on white is 6.29:1 and on dark canvas 6.64:1. Two pairs are
below AA and are deliberate:

- **`.term .dim` / term prompt (`term-dim` on `term-bg`, 3.31:1)** — this is the
  *dimmed* half of a terminal line (the `$` prompt and de-emphasised output).
  Low contrast is the entire semantic; it is never used for prose.
- **`.bdemo__foot` and `.compare__tag` (`mute` on `surface-2`, 4.40:1)** — a
  genuine near-miss. This is small monospace metadata (word counts, "bionic" /
  "as written" tags), not body copy; it is reported as a finding rather than
  hidden, and should be nudged to `body` if that metadata ever grows.

Low-distraction mode also fades word tails with `opacity` (0.72 default, 0.45 at
display size). Opacity is not a color token, so no lintable pair exists; the fade
is intentional and reversible (`html[data-fixation="off"]` restores it to 1).

## Typography

**Geist** for text and **Geist Mono** for data, both self-hosted variable fonts
(`fonts/geist-*.woff2`, SIL OFL 1.1, weights 100–900) with **no external
requests**. Body text enables `"ss01"` and `"cv11"`. Headings are tight
(`-0.02em` to `-0.04em`) and lead at 1.02–1.1; prose leads at 1.6.

- **Display / title / headline:** Geist 600, tightening from `-0.025em` to
  `-0.04em` as size grows. The hero and section headings use fluid `clamp()`
  sizes (e.g. `clamp(2.5rem, 5.4vw, 3.75rem)`); the tokens record the upper
  bound, and the full expression is not representable as a single `Dimension`.
- **Lede / body / body-sm:** Geist 400 at 1.125rem / 1rem / 0.9375rem.
- **Label:** Geist Mono 500, 0.6875rem, uppercase, `0.1em` tracking — eyebrows,
  footer headings, demo labels, the metabar.
- **Mono:** Geist Mono 400 at 0.8125rem / 1.7 for code and the terminal.
- **Metric:** Geist Mono 600 at 1.375rem, tabular figures.

The hero takes a deliberate liberty: the fixation "head" is drawn with
`-webkit-text-stroke: 1.05px` (weight unchanged) so the plain and fixed copies
keep identical advance widths and never ghost during the wipe. That single
metric is fixed in both copies and cannot be expressed as a `fontWeight` token.

## Layout & Spacing

A strict **4px rhythm** (`--s-1` … `--s-9`), a **1120px** fixed-max container
with a 24px gutter (20px under 860px), and a sticky 56px nav. Sections are
`96px` block padding (`64px` under 860px) with a soft hairline between them. The
grid is `repeat(auto-fit, minmax(260px, 1fr))`, with 320px / 240px variants and
a 2-up `.duo`. Sidebars (`.docs__nav`, `.band__label`) stick at
`calc(nav-height + 28px)`. Radii never grow with the layout; spacing never breaks
the 4px step.

## Elevation & Depth

Depth is **tonal and flat**, not shadowed. Hierarchy comes from a border, a
surface step (`canvas → surface → surface-2`), and accent washes. Shadows are
reserved for things that literally float: the terminal (`0 30px 70px -40px`),
the draggable control (`0 8px 24px`), and the compare knob. The hero and footer
are lit by soft radial accent washes; the footer eases from canvas into surface
over ~240px so there is no visible boundary. Focus is a 2px accent outline with
a 2px offset, never a glow.

## Shapes

Radii are small and consistent: `3px` / `5px` / `7px` / `10px`, the brand mark at
`8px`, and `999px` for pills (chips, metabar, mode chips, compare tags, the
floating control). Buttons are `5px` rectangles; cards, inputs and code blocks
are `7px`; panels and the reader are `10px`. The one geometric motif is the
**half-solid rule** (`.fxrule`, `hairline-strong` 0–52%, then `hairline` to
100%) — the mark, expressed as a divider. The footer art is a word split by a
travelling caret, echoing the intensity slider.

## Components

Base atoms come from the shared system and are identical in both sites: `button`
(+ `primary` / `outline` / `ghost` / `sm`), `chip` (+ status variants), `card`,
`field` / `input`, `nav`, `brand` (+ `mark` / `tag`), `footer`, `code`, `term`,
`table`, `callout`, `install`, `keycap`, `tile`, `metric`, `eyebrow`, and the
1px `divider`. Variants are sibling entries (`button-primary-hover`), never
nested.

The bionic-specific atoms, all from `theme.css`:

- **`demo-panel`** — the live playground: a surface panel with a `surface-2`
  head carrying mode chips and the intensity slider, two `canvas` panes divided
  by a 1px `hairline`, and a `surface-2` foot of tabular stats. It runs the
  extension's compiled algorithm, offline.
- **`mode-chip`** — selectable pills (distinct from status `chip`); the selected
  one (`mode-chip-on`, `[aria-pressed="true"]`) is solid accent with accent ink.
- **`compare`** — the drag-to-reveal slider. It is `role="slider"` and keyboard
  operable; the top layer is revealed with `clip-path: inset(...)` driven by one
  custom property `--p`, never by narrowing the box (which would re-wrap the
  text). `compare-knob` is a 2px accent line with a 30px circular `compare-grip`;
  `compare-tag` labels each side.
- **`metabar`** — the pill of product facts above the headline: mono, uppercase,
  hairline separators, the first item in `metabar-accent`. It collapses to a
  small radius and hides its separators under 600px.
- **`bionic-head` / `bionic-tail`** — fixation emphasis: the head is weight 700
  at `ink` (800 at `--xl`), the tail is weight 400 faded by `opacity` (0.72, or
  0.45 in `--xl` mode).
- **`footer-art`** — the word "bionic" drawn twice, a `mark-off` copy in
  `hairline-strong` under a `mark-on` copy in `ink`, split by a travelling
  `mark-caret`; the split animates 30%→62% and back like the slider.
- **`floating-control`** — the extension's real floating control, made
  draggable: a pill with `floating-dot` in accent that turns off fixation
  (`[aria-pressed="false"]`) and restores the original text.
- **`hero-caret`** — the 2px `swash` caret that rides the wipe while the
  headline is written.

The dark theme is expressed as the `*-dark` sibling variants; components that
are dark by design (`.term`) do not change.

## Do's and Don'ts

- **Do** treat every rule as a **soft rule**: `border-image` fades the hairline
  out at both margins, so nothing runs edge to edge.
- **Don't** fade the page to blank on navigation. Use the cross-document View
  Transition API (`@view-transition { navigation: auto }`); without it, navigate
  as before — never blank, never delayed.
- **Do** keep **one accent per site**. Indigo here; teal on the sibling. No
  element is shared between the two identities.
- **Don't** add a second interactive hue. `swash` is decoration only.
- **Do** make **no external requests**: fonts, art and the demo are all local.
- **Don't** use emoji anywhere in the product surface.
- **Do** always carry **"by svx"** beside the wordmark in the nav and in the
  footer meta (`by svx · MIT licensed.`).
- **Don't** add analytics, accounts or telemetry, or claim a speed-reading
  benefit — numbers are measured, not estimated.
- **Do** keep the core pure and every DOM transform reversible and idempotent;
  the demo must run offline.
- **Don't** break the 4px rhythm, the small radius set, or the single container
  width.
- **Do** respect `prefers-reduced-motion`: the beam, the caret wipe and the
  footer split all have a still fallback.
