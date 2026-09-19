export const SKIP_TAGS: ReadonlySet<string> = new Set<string>([
  "script",
  "style",
  "noscript",
  "textarea",
  "input",
  "select",
  "option",
  "svg",
  "math",
  "canvas",
  "iframe",
  "code",
  "pre",
  "kbd",
  "samp",
  "var",
  "tt",
  "template",
  "head",
  "title",
]);

export const SKIP_SELECTORS: readonly string[] = [
  '[contenteditable]:not([contenteditable="false"])',
  ".katex",
  ".MathJax",
  ".math",
  '[data-bionic="off"]',
  '[aria-hidden="true"]',
];

const SKIP_SELECTOR = SKIP_SELECTORS.join(", ");

const LETTER_RE = /[\p{L}\p{M}]/u;

export function shouldSkipElement(el: Element): boolean {
  try {
    if (!el) return true;
    const tag = el.tagName;
    if (typeof tag === "string" && SKIP_TAGS.has(tag.toLowerCase())) return true;
    if (typeof el.closest !== "function") return false;
    return el.closest(SKIP_SELECTOR) !== null;
  } catch {
    return true;
  }
}

export function shouldSkipText(text: string, parent: Element | null): boolean {
  try {
    if (typeof text !== "string" || text.length === 0) return true;
    if (text.trim().length === 0) return true;
    if (parent && shouldSkipElement(parent)) return true;
    return !LETTER_RE.test(text);
  } catch {
    return true;
  }
}
