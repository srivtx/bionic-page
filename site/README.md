# bionic-page — landing site

Static site for the bionic-page extension. No build step for the pages, no
framework, and no external network requests. Everything is plain HTML, the
shared Lens suite stylesheets, and two small classic scripts.

```
site/
├── index.html          landing page with the live demo
├── how-to.html         install and usage walkthrough
├── modes.html          the five modes and the custom rule format
├── privacy.html        privacy policy
├── faq.html            questions and honest limits
├── robots.txt
└── assets/
    ├── lens.css        shared suite design system (do not diverge)
    ├── theme.css       bionic accent and components
    ├── core.js         compiled from src/core/*.ts by scripts/build-demo.mjs
    ├── demo.js         page behaviour: demo, samples, compare, theme, nav
    ├── fonts/*.woff2   self-hosted Geist (SIL OFL 1.1)
    ├── transformed.png
    ├── popup.png
    └── options.png
```

## How it works

- `assets/lens.css` is the shared design system copied byte-identical across
  the Lenses suite. Per-tool changes live in `assets/theme.css`.
- `assets/core.js` is the **real** fixation algorithm, bundled from
  `src/core/*.ts` and exposed as the global `BionicCore`. The demo renders
  exactly what the extension injects, so there is no second implementation to
  drift out of sync.
- `assets/demo.js` is the only site script. It builds the mode chips from
  `BionicCore.MODES`, wires the textarea, intensity slider, and chips to
  repaint the output, renders the hero and every `data-bionic-sample` element,
  drives the compare divider with pointer and keyboard input, and runs the
  shared theme and navigation toggles. If `BionicCore` is missing it hides the
  demo controls and leaves the plain text in place.
- The theme bootstrap inline in each `<head>` applies a stored `data-theme`
  before first paint; `assets/demo.js` handles the toggle and the
  `bionic-page-theme` localStorage key.

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
is recommended over opening the files directly, but there are no absolute URLs,
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
  `assets/lens.css`, with the accent and bionic components in
  `assets/theme.css`.
- Light and dark themes follow `prefers-color-scheme` until a visitor picks one
  with the header toggle; motion follows `prefers-reduced-motion`.
