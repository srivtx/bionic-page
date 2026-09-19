# Bionic Page — landing site

Static marketing and how-to site for the Bionic Page extension. No build step,
no framework, no external network requests. Everything is plain HTML, CSS, and
a small vanilla JS file.

```
site/
├── index.html
├── styles.css
├── app.js
└── assets/favicon.svg
```

## Preview locally

Serve the `site` directory from the repository root with either:

```bash
bunx --bun serve site
```

or, with no dependencies at all:

```bash
python3 -m http.server 8000 --directory site
```

Then open the printed URL (for example `http://localhost:8000`). You can also
open `site/index.html` directly in a browser, but a local server is recommended
so the `../README.md` and `../RESEARCH.md` links resolve.

## Deploy

- **GitHub Pages:** push the repository, then point Pages at the `site/` folder
  (`Settings → Pages → Source: Deploy from a branch`, folder `/site`). The site
  is fully static, so no build action is needed.
- **Vercel:** create a new project from the repository and set the output / root
  directory to `site`. Framework preset: "Other". No build command, no install
  command.

Because there are no absolute URLs, the site works from any host root or
subpath.

## Notes

- The live demo in `app.js` is a small copy of the extension's core algorithm
  (`half`, `classic`, `vowel`, `dim`, and the `"0 1 1 2 0.4"` rule). It renders
  into `#demo-text` and restores the original paragraph exactly when toggled
  off.
- All color, type, radius, and motion values are `--bp-*` custom properties
  defined in `styles.css` (see `docs/BRAND.md`).
- Light and dark themes follow `prefers-color-scheme`; motion follows
  `prefers-reduced-motion`.
