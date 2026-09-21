# bionic-page — landing site

Static site for the bionic-page extension. No build step for the page, no
framework, and no external network requests. Everything is plain HTML, the
shared Lens suite stylesheets, and two small classic scripts.

```
site/
├── index.html          the whole site: hero, live demo, compare, modes,
│                       how it works, controls, safety, numbers, privacy,
│                       install, FAQ
├── llms.txt            a plain-text summary for language models
├── robots.txt
├── sitemap.xml
└── assets/
    ├── lens.css        shared suite layout and components (do not diverge)
    ├── theme.css       shared suite tokens, base type, and controls
    ├── identity.css    the bionic-page layer: the headline write, the wordmark
    ├── core.js         compiled from src/core/*.ts by scripts/build-demo.mjs
    ├── demo.js         page behaviour
    ├── fonts/*.woff2   self-hosted Geist and Geist Mono (SIL OFL 1.1)
    ├── og.png
    ├── transformed.png
    ├── popup.png
    └── options.png
```

## How it works

- `assets/theme.css` and `assets/lens.css` are the shared design system, copied
  byte-identical across the Lenses suite. Per-tool changes live in
  `assets/identity.css`.
- `assets/core.js` is the **real** fixation algorithm, bundled from
  `src/core/*.ts` and exposed as the global `BionicCore`. The demo renders
  exactly what the extension injects, so there is no second implementation to
  drift out of sync.
- `assets/demo.js` is the only site script. It paints the hero, the reading
  card, the compare panel, the mode tiles and the footer wordmark from
  `BionicCore`, builds the mode chips from `BionicCore.MODES`, wires the
  textarea, intensity sliders and chips to repaint their output, drives the
  compare divider with pointer and keyboard input, and runs the chrome around
  them: theme, navigation, the emphasis switch, the rails, the FAQ, the copy
  button, and the scroll behaviour. If `BionicCore` is missing it hides the
  demo controls and leaves the plain text in place.
- The theme bootstrap inline in `<head>` applies a stored `data-theme` and
  `data-fixation` before first paint, so a reload does not flash the wrong
  state; `assets/demo.js` handles the switches and the localStorage keys
  `bionic-page-theme` and `bionic-page-fixation`.
- Reveal animations are added by JavaScript rather than written into the
  markup, so a visitor without JavaScript sees the whole page.

## Preview locally

Serve the `site` directory from the repository root with either:

```bash
bunx --bun serve site
```

or, with no dependencies at all:

```bash
python3 -m http.server 8000 --directory site
```

Then open the printed URL (for example `http://localhost:8000`). A local server
is recommended over opening the file directly, but there are no absolute URLs,
so the site also works from any host root or subpath.

## Regenerate the demo bundle

After a change in `src/core/`:

```bash
node scripts/build-demo.mjs
```

## Deploy

- **GitHub Pages:** push the repository, then point Pages at the `site/` folder
  (`Settings → Pages → Source: Deploy from a branch`, folder `/site`). The site
  is fully static, so no build action is needed.
- **Vercel:** create a new project from the repository and set the output / root
  directory to `site`. Framework preset: "Other". No build command, no install
  command.

## Notes

- No page makes an external request: no CDN, no remote fonts, no remote images.
- All color, type, radius, and motion values are custom properties defined in
  `assets/theme.css`, with the layout and components in `assets/lens.css`.
- Light and dark themes follow `prefers-color-scheme` until a visitor picks one
  with the header control; motion follows `prefers-reduced-motion`.
