---
version: alpha
name: bionic-page
description: "The bionic-page landing site — the shared Lens suite base with an indigo ink, a headline written into place one anchor at a time, and a live demo that runs the extension's own algorithm."
colors:
  primary: "#4f46e5"
  primary-dark: "#8b8cf7"
  accent: "#4f46e5"
  accent-dark: "#8b8cf7"
  accent-2: "#8b5cf6"
  accent-2-dark: "#a78bfa"
  accent-soft: "#edefff"
  accent-soft-dark: "#1c2034"
  accent-ink: "#FFFFFF"
  accent-ink-dark: "#0C0E12"
  ink: "#14161A"
  ink-dark: "#F4F5F7"
  body: "#3F4550"
  body-dark: "#C3C9D4"
  mute: "#6B7280"
  mute-dark: "#878FA0"
  canvas: "#FBFBF9"
  canvas-dark: "#0B0D11"
  canvas-soft: "#F4F4F0"
  canvas-soft-dark: "#13161C"
  hairline: "#E6E6DF"
  hairline-dark: "#222734"
  success: "#0D9488"
  success-dark: "#34D399"
  term-bg: "#0D1117"
  term-bar: "#161B22"
  term-ink: "#C9D1D9"
  term-prompt: "#7EE787"
  term-dim: "#8B949E"
typography:
  display:
    fontFamily: Geist
    fontSize: 5.2rem
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.04em"
  h1:
    fontFamily: Geist
    fontSize: 3.6rem
    fontWeight: 400
    lineHeight: 1.12
    letterSpacing: "-0.032em"
  h1-anchor:
    fontFamily: Geist
    fontWeight: 750
  h2:
    fontFamily: Geist
    fontSize: 2.4rem
    fontWeight: 600
    lineHeight: 1.12
    letterSpacing: "-0.028em"
  h3:
    fontFamily: Geist
    fontSize: 1.05rem
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.022em"
  lede:
    fontFamily: Geist
    fontSize: 1.06rem
    fontWeight: 400
    lineHeight: 1.65
  body-md:
    fontFamily: Geist
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.65
  body-sm:
    fontFamily: Geist
    fontSize: 0.92rem
    fontWeight: 400
    lineHeight: 1.62
  reading:
    fontFamily: Georgia
    fontSize: 1.06rem
    fontWeight: 400
    lineHeight: 1.85
  reading-lg:
    fontFamily: Georgia
    fontSize: 1.18rem
    fontWeight: 400
    lineHeight: 1.85
  eyebrow:
    fontFamily: Geist
    fontSize: 0.7rem
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.18em"
  label:
    fontFamily: Geist
    fontSize: 0.72rem
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.12em"
  metric:
    fontFamily: Geist
    fontSize: 2.6rem
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.03em"
  control:
    fontFamily: Geist
    fontSize: 0.95rem
    fontWeight: 600
    lineHeight: 1
  mono-sm:
    fontFamily: Geist Mono
    fontSize: 0.74rem
    fontWeight: 600
    lineHeight: 1.4
  mono-md:
    fontFamily: Geist Mono
    fontSize: 0.9rem
    fontWeight: 400
    lineHeight: 2
rounded:
  xs: 6px
  sm: 9px
  md: 12px
  lg: 20px
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
  container: 1120px
  nav-height: 64px
  section-y: 96px
  section-y-tight: 56px
components:
  nav:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.body}"
    height: 64px
  nav-link:
    textColor: "{colors.body}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.full}"
    padding: "8px 12px"
  nav-link-active:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.accent}"
    rounded: "{rounded.full}"
  nav-fix:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.body}"
    rounded: "{rounded.full}"
    size: 40px
    height: 34px
  nav-gh:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.full}"
    padding: "7px 14px"
  theme-pick:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.mute}"
    rounded: "{rounded.full}"
    height: 32px
  theme-pick-active:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.accent}"
    rounded: "{rounded.full}"
  button-accent:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    typography: "{typography.control}"
    rounded: "{rounded.full}"
    padding: "12px 24px"
    height: 46px
  button-outline:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.control}"
    rounded: "{rounded.full}"
    padding: "12px 24px"
    height: 46px
  button-ghost:
    textColor: "{colors.body}"
    typography: "{typography.control}"
    rounded: "{rounded.full}"
    padding: "8px 12px"
  button-ghost-sm:
    textColor: "{colors.body}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.full}"
    padding: "7px 15px"
    height: 34px
  chip:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.mute}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.full}"
    padding: "6px 14px"
  chip-hover:
    textColor: "{colors.accent}"
  keycap:
    backgroundColor: "{colors.canvas-soft}"
    textColor: "{colors.ink}"
    typography: "{typography.mono-sm}"
    rounded: "{rounded.xs}"
    padding: "0.12em 0.4em"
  eyebrow:
    textColor: "{colors.mute}"
    typography: "{typography.eyebrow}"
  eyebrow-number:
    textColor: "{colors.accent}"
    typography: "{typography.eyebrow}"
  section-head:
    textColor: "{colors.body}"
    width: 660px
  readcard:
    backgroundColor: "{colors.canvas-soft}"
    textColor: "{colors.body}"
    rounded: "{rounded.lg}"
  readcard-bar:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.mute}"
    typography: "{typography.body-sm}"
  readcard-body:
    backgroundColor: "{colors.canvas-soft}"
    textColor: "{colors.body}"
    typography: "{typography.reading}"
    padding: "28px 30px"
  rail-card:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.full}"
    padding: "11px 20px"
  rail-icon:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.accent}"
    rounded: "{rounded.sm}"
    size: 32px
  hero-card:
    backgroundColor: "{colors.canvas-soft}"
    textColor: "{colors.body}"
    typography: "{typography.reading}"
    rounded: "{rounded.lg}"
  hero-chip:
    textColor: "{colors.mute}"
    typography: "{typography.reading}"
    rounded: "{rounded.full}"
    padding: "6px 15px"
  hero-chip-anchor:
    textColor: "{colors.ink}"
    typography: "{typography.reading}"
  demo-panel:
    backgroundColor: "{colors.canvas}"
    rounded: "{rounded.lg}"
  demo-head:
    backgroundColor: "{colors.canvas-soft}"
    textColor: "{colors.success}"
    typography: "{typography.label}"
    padding: "16px 20px"
  demo-pane:
    backgroundColor: "{colors.canvas}"
    padding: "26px 28px"
  demo-pane-alt:
    backgroundColor: "{colors.canvas-soft}"
    padding: "26px 28px"
  demo-output:
    textColor: "{colors.body}"
    typography: "{typography.reading}"
  mode-chip:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.body}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.full}"
    padding: "7px 15px"
  mode-chip-active:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.full}"
  compare:
    backgroundColor: "{colors.canvas-soft}"
    rounded: "{rounded.lg}"
  compare-text:
    textColor: "{colors.body}"
    typography: "{typography.reading-lg}"
    padding: "48px 52px"
  compare-grip:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.full}"
    size: 44px
  tile:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.body}"
    rounded: "{rounded.lg}"
    padding: 22px
  tile-sample:
    textColor: "{colors.body}"
    typography: "{typography.reading}"
  tile-note:
    textColor: "{colors.mute}"
    typography: "{typography.body-sm}"
  step:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.body}"
    rounded: "{rounded.lg}"
    padding: "28px 26px"
  step-icon:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.accent}"
    rounded: 14px
    size: 46px
  panel:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.body}"
    rounded: "{rounded.lg}"
    padding: 32px
  rule-row:
    textColor: "{colors.ink}"
    typography: "{typography.mono-sm}"
    padding: "13px 2px"
  key:
    backgroundColor: "{colors.canvas-soft}"
    textColor: "{colors.ink}"
    typography: "{typography.mono-sm}"
    rounded: 11px
    height: 46px
  key-accent:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    rounded: 11px
    height: 46px
  switch-track:
    backgroundColor: "{colors.hairline}"
    rounded: "{rounded.full}"
    width: 40px
    height: 22px
  switch-track-on:
    backgroundColor: "{colors.accent}"
    rounded: "{rounded.full}"
  card:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.body}"
    rounded: "{rounded.lg}"
    padding: 30px
  metric-card:
    backgroundColor: "{colors.canvas}"
    rounded: "{rounded.lg}"
    padding: "34px 16px"
  metric-number:
    textColor: "{colors.accent}"
    typography: "{typography.metric}"
  metric-label:
    textColor: "{colors.mute}"
    typography: "{typography.body-sm}"
  term:
    backgroundColor: "{colors.term-bg}"
    textColor: "{colors.term-ink}"
    typography: "{typography.mono-md}"
    rounded: "{rounded.lg}"
  term-bar:
    backgroundColor: "{colors.term-bar}"
    textColor: "{colors.term-dim}"
    typography: "{typography.mono-sm}"
    padding: "12px 16px"
  faq-item:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "18px 22px"
  faq-item-open:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.accent}"
    rounded: "{rounded.lg}"
  totop:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.canvas}"
    rounded: "{rounded.full}"
    size: 44px
  footer:
    backgroundColor: "{colors.canvas-soft}"
    textColor: "{colors.body}"
  footer-heading:
    textColor: "{colors.mute}"
    typography: "{typography.label}"
  footer-link:
    textColor: "{colors.body}"
    typography: "{typography.body-sm}"
---

## Overview

bionic-page is the landing site for a Manifest V3 extension that rewrites the
readable text of any page so the leading part of each word carries more weight.
It shares the **Lens suite** base system (`site/assets/theme.css` and
`site/assets/lens.css`) with its sibling and differs in
`site/assets/identity.css`.

The personality is **engineered and quiet**: a 1120px container, hairline
borders, layered soft shadows, 12/20/pill radii, and exactly one accent. The page
should read like a precise instrument that explains itself — measured numbers,
reversible behaviour, and a live demo that runs the extension's own algorithm
offline.

The page is one document: a fixed nav, a hero with a live reading card, a band of
scrolling rails, then numbered sections, then a footer whose wordmark is set the
way the algorithm sets a word. This identity is **indigo**, and its signature is
a headline that is *written into place* one anchor at a time, with a caret at the
end of the line. The sibling uses teal and a descending highlight; the two share
the same base system and no identity.

UI type is Geist and Geist Mono, self-hosted. Reading text — the demo, the
compare panel, the mode samples — is set in a serif, because that is the kind of
text the extension is for.

## Colors

One accent, a hairline-driven neutral ramp, and one semantic status color. All
values are the literal custom properties declared in `theme.css` (the shared
base), `lens.css` (layout and components) and `identity.css` (the indigo ink and
the headline wave). This repo's identity adds the caret; the accent group is
declared in `theme.css` and overridden by the sibling.

- **`--bp-accent` — indigo `#4F46E5`, `#8B8CF7` in dark:** the sole driver of
  interaction.
- **`--bp-accent-2` — `#8B5CF6`, `#A78BFA` in dark:** the far end of
  `--bp-grad`, a 120° linear gradient used on pills, the brand mark, the keycap,
  and the metric numerals.
- **`--bp-accent-soft` — `#EDEFFF`, `#1C2034` in dark:** the current-section
  wash behind a nav link, and the icon-tile fill.
- **`--bp-ink` / `--bp-body` / `--bp-mute` — `#14161A` / `#3F4550` / `#6B7280`:**
  the text ramp: headlines, prose, and secondary copy.
- **`--bp-canvas` / `--bp-canvas-soft` — `#FBFBF9` / `#F4F4F0`:** page, and the
  raised bands (rail band, metrics band, footer, demo chrome).
- **`--bp-hairline` — `#E6E6DF`:** every border and divider, and the quiet half
  of the footer wordmark. A border-and-fill token, not a text color.
- **`--bp-success` — `#0D9488`, `#34D399` in dark:** the live dot on the demo
  panel only.
- **Shadows:** three steps, `--shadow-sm`, `--shadow-md`, `--shadow-lg`, used for
  cards, panels and the terminal respectively.

## Typography

Geist for the interface, Geist Mono for figures and commands, and Georgia for
anything that is reading text. All three resolve without a network request:
Geist and Geist Mono are self-hosted woff2 subsets, Georgia is a system serif.

The headline is the one place the two families of weight meet. It is set at 400
and its fixation anchors rise to 750, so the emphasis is the *difference*
between the two, not the size. Nothing else on the page mixes weights inside a
line.

Section headings are 600. The largest type on the page is the footer wordmark at
`clamp(2.6rem, 8vw, 5.2rem)`, which is the product name set the way the
algorithm sets a word: a solid opening and a quiet remainder.

## Layout

One 1120px container with 28px gutters, used by the nav, every section and the
footer, so all three share a single left edge. Sections are 96px of vertical
padding, or 56px for the tight ones, and a hairline rule separates them.

The hero is a two-column grid that collapses to one column at 940px. Every other
multi-column arrangement — the rails, the tiles, the steps, the metrics, the two
card grids — is an auto-fit grid so the count follows the width without
breakpoints. The nav collapses to a sheet at 1180px, because the actions are the
crowded part of the bar.

The four display sizes are fluid. The tokens above are their caps, and the
declared values are `clamp(2.6rem, 8vw, 5.2rem)` for the footer wordmark,
`clamp(2.3rem, 5.2vw, 3.6rem)` for the headline, `clamp(1.7rem, 3.4vw, 2.4rem)`
for a section heading and `clamp(1.8rem, 3.6vw, 2.6rem)` for a metric.

## Elevation & Depth

Depth is **soft and layered**, not flat. Hierarchy comes from a hairline border,
a surface step (`canvas → canvas-soft`), and accent washes, on top of three
shadow steps (`--shadow-sm`, `--shadow-md`, `--shadow-lg`) reserved for cards,
the demo panel and the terminal. The hero is lit by soft radial accent washes
over a masked grid. Focus is a 2px accent outline with a 2px offset, never a
glow.

## Shapes

Radii are a short, consistent set: `6px` for inline code, `9px` for the brand
mark, `11px`–`14px` for keys and icon tiles, `12px` for controls, `20px` for cards
and `999px` for pills (chips, metabar, mode chips, buttons). A hairline rule
separates sections.

## Components

The base system is shared and every component below reads its color from a
token, so the two sites cannot drift apart by accident.

- **Navigation.** A fixed bar with a translucent canvas behind a blur. The
  section you are reading is marked with an accent-soft wash, and the emphasis
  switch is an icon button: the mark is the two halves of a word, and the label
  lives in `aria-label` and `title`.
- **Buttons.** `button-accent` is the only high-emphasis action on a page, and
  there is a rule for how many are allowed: one per section, at most. Everything
  else is `button-outline` or `button-ghost`.
- **The reading card.** The hero's visual, and the one place the intensity
  slider appears before the demo: a window chrome, a page of serif text with the
  fixation applied, and the current intensity read out beside the control.
- **The demo panel** is the page's centrepiece: a two-pane split with the source
  text on the left and the painted output on the right, a mode chip row and an
  intensity slider in the chrome, and the measured word and character counts in
  the footer.
- **The compare panel** puts the same divider that the reader would use under a
  paragraph, and its percentage readout travels with the divider it describes.
- **The rails** are two marquees — where it runs, and what it guarantees — built
  from pill cards. The track is duplicated in JavaScript so the loop has no seam,
  and it pauses on hover.
- **The terminal** is the only dark surface on a light page, and the only place
  a monospace stack is used for anything longer than a word.
- **Cards and panels** lift by 3–5px on hover and never change their border
  color to anything but an accent mix. Motion is 160ms for a color, 340ms for a
  move, and every one of them is behind `prefers-reduced-motion`.

## Do's and Don'ts

- **Do** keep one accent. The indigo means "interactive" or "measured" and
  nothing else.
- **Don't** add a second accent, a gradient behind text, or a decorative image.
  The page's only ornament is the emphasis itself.
- **Do** keep the emphasis visible: the fixation weight is the product. A page
  where the head and the tail look alike is a broken page.
- **Do** check the reading text in the serif at a real size, not just the UI.
- **Don't** claim a speed-reading benefit, on the page or anywhere else. The
  copy says configurable visual anchoring and the peer-reviewed results are
  mixed, because that is what is true.
- **Don't** let a number on a page drift from the repository. `check-copy.mjs`
  fails the build when a claim and the suite disagree.
- **Do** respect `prefers-reduced-motion`: the headline write, the rails, the
  compare sweep and every reveal have a still fallback. The reveal animations are
  added by JavaScript so a visitor without it sees the whole page.
