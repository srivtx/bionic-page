import type { Settings } from "../shared/types";

/** The id of the single injected stylesheet. The observer ignores this node. */
export const STYLE_ID = "bionic-page-style";

const DIM_CLASS = "bp-dim";
const SPACING_CLASS = "bp-ls";

function cssFor(settings: Settings): string {
  const weight = Math.round(settings.boldWeight);
  const opacity = settings.restOpacity;
  return [
    `b.${"bp-head"}{font-weight:${weight};font-synthesis-weight:none;}`,
    `html.${SPACING_CLASS} b.bp-head{letter-spacing:.012em;margin-right:.02em;}`,
    `html.${DIM_CLASS} span.bp-tail{opacity:${opacity};}`,
    `@media (prefers-reduced-motion:reduce){b.bp-head{transition:none!important;}}`,
    `b.bp-head{background:transparent;}`,
  ].join("\n");
}

function docOf(doc?: Document): Document | undefined {
  if (doc) return doc;
  return typeof document !== "undefined" ? document : undefined;
}

function isDimMode(settings: Settings): boolean {
  return settings.mode === "dim";
}

function setClasses(root: HTMLElement, settings: Settings): void {
  try {
    root.classList.toggle(DIM_CLASS, isDimMode(settings));
    root.classList.toggle(SPACING_CLASS, settings.letterSpacing);
  } catch {
    /* ignore */
  }
}

/** Create or update the injected stylesheet and the html-level mode classes. */
export function ensureStyles(doc: Document | undefined, settings: Settings): void {
  const d = docOf(doc);
  if (!d || !d.head) return;
  try {
    let style = d.getElementById(STYLE_ID) as HTMLStyleElement | null;
    if (!style) {
      style = d.createElement("style");
      style.id = STYLE_ID;
      style.setAttribute("data-bionic", "style");
      d.head.appendChild(style);
    }
    const css = cssFor(settings);
    if (style.textContent !== css) style.textContent = css;
    setClasses(d.documentElement, settings);
  } catch {
    /* ignore */
  }
}

export function updateStyles(doc: Document | undefined, settings: Settings): void {
  ensureStyles(doc, settings);
}

export function removeStyles(doc: Document | undefined): void {
  const d = docOf(doc);
  if (!d) return;
  try {
    d.getElementById(STYLE_ID)?.remove();
    d.documentElement?.classList.remove(DIM_CLASS, SPACING_CLASS);
  } catch {
    /* ignore */
  }
}

/**
 * In `dim` mode the tail has no wrapper, so give each emphasized head's
 * following text node a `span.bp-tail` wrapper. Reverted by `undecorateTails`.
 */
export function decorateTails(doc: Document | undefined): void {
  const d = docOf(doc);
  if (!d || !d.body) return;
  try {
    for (const head of Array.from(d.body.querySelectorAll<HTMLElement>("b.bp-head"))) {
      const next = head.nextSibling;
      if (next && next.nodeType === 3 && next.textContent && next.textContent.length > 0) {
        const span = d.createElement("span");
        span.className = "bp-tail";
        next.parentNode?.insertBefore(span, next);
        span.appendChild(next);
      }
    }
  } catch {
    /* ignore */
  }
}

export function undecorateTails(doc: Document | undefined): void {
  const d = docOf(doc);
  if (!d || !d.body) return;
  try {
    for (const span of Array.from(d.body.querySelectorAll<HTMLElement>("span.bp-tail"))) {
      const text = span.firstChild;
      if (text) span.parentNode?.insertBefore(text, span);
      span.remove();
    }
  } catch {
    /* ignore */
  }
}
