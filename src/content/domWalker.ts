import type { BionicOptions } from "../core/algorithm";
import { emphasize } from "../core/algorithm";
import { shouldSkipElement, shouldSkipText } from "./guards";

export interface TransformStats {
  textNodes: number;
  words: number;
  skipped: number;
}

export interface TransformHandle {
  revert(): void;
  readonly stats: TransformStats;
}

interface TransformRecord {
  parent: Node;
  original: Text;
  inserted: Node[];
}

const HEAD_CLASS = "bp-head";
const SHOW_TEXT = 4;
const TOKEN_RE = /\S+/g;

/**
 * Text nodes that already carry emphasis (heads) or are already part of a
 * transformed run (tails and preserved whitespace). Tracking nodes rather than
 * parents means a site that replaces the text inside an existing paragraph is
 * still processed, while a re-run over the same run does nothing.
 */
const processedText = new WeakSet<Text>();

function markProcessed(nodes: readonly Node[]): void {
  for (const node of nodes) {
    if (node.nodeType === 3) processedText.add(node as Text);
  }
}

function unmarkProcessed(nodes: readonly Node[]): void {
  for (const node of nodes) {
    if (node.nodeType === 3) processedText.delete(node as Text);
  }
}

function createHead(doc: Document, text: string): HTMLElement {
  const b = doc.createElement("b");
  b.className = HEAD_CLASS;
  b.textContent = text;
  return b;
}

function transformTextNode(
  node: Text,
  options: BionicOptions,
  doc: Document,
  stats: TransformStats,
): Node[] | null {
  const source = node.data;
  if (!source) return null;

  const fragment = doc.createDocumentFragment();
  let changed = false;
  let addedWords = 0;
  let lastIndex = 0;

  TOKEN_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = TOKEN_RE.exec(source)) !== null) {
    const token = match[0];
    if (token === undefined || token.length === 0) continue;
    const start = match.index;
    if (start > lastIndex) {
      fragment.appendChild(doc.createTextNode(source.slice(lastIndex, start)));
    }
    const result = emphasize(token, options);
    if (result && result.head) {
      fragment.appendChild(createHead(doc, result.head));
      if (result.tail) fragment.appendChild(doc.createTextNode(result.tail));
      addedWords += 1;
      changed = true;
    } else {
      fragment.appendChild(doc.createTextNode(token));
    }
    lastIndex = start + token.length;
  }

  if (!changed) return null;

  if (lastIndex < source.length) {
    fragment.appendChild(doc.createTextNode(source.slice(lastIndex)));
  }

  const inserted = Array.from(fragment.childNodes);
  try {
    node.replaceWith(fragment);
  } catch {
    return null;
  }

  markProcessed(inserted);
  stats.words += addedWords;
  stats.textNodes += 1;
  return inserted;
}

export function transformRoot(
  root: ParentNode,
  options: BionicOptions,
  doc?: Document,
): TransformHandle {
  const stats: TransformStats = { textNodes: 0, words: 0, skipped: 0 };
  const records: TransformRecord[] = [];
  let reverted = false;

  const handle: TransformHandle = {
    get stats(): TransformStats {
      return stats;
    },
    revert(): void {
      if (reverted) return;
      reverted = true;
      for (let i = records.length - 1; i >= 0; i -= 1) {
        const record = records[i];
        if (!record) continue;
        try {
          const parent = record.parent;
          let ref: Node | null = null;
          for (const n of record.inserted) {
            if (n.parentNode === parent) {
              ref = n;
              break;
            }
          }
          if (ref && ref.parentNode === parent) {
            parent.insertBefore(record.original, ref);
          } else if (parent.isConnected !== false) {
            parent.appendChild(record.original);
          }
          for (const n of record.inserted) {
            if (n.parentNode) n.parentNode.removeChild(n);
          }
          unmarkProcessed(record.inserted);
        } catch {
          /* keep reverting the rest */
        }
      }
      records.length = 0;
    },
  };

  try {
    if (!root || !options) return handle;
    const ownerDoc =
      doc ??
      (root as Node).ownerDocument ??
      (typeof document !== "undefined" ? document : null);
    if (!ownerDoc) return handle;

    const walker = ownerDoc.createTreeWalker(root as Node, SHOW_TEXT);
    let node = walker.nextNode() as Text | null;
    while (node) {
      const next = walker.nextNode() as Text | null;
      try {
        const parent = node.parentElement;
        if (!parent) {
          stats.skipped += 1;
        } else if (
          processedText.has(node) ||
          parent.closest("." + HEAD_CLASS) !== null ||
          shouldSkipElement(parent) ||
          shouldSkipText(node.data, parent)
        ) {
          stats.skipped += 1;
        } else {
          const inserted = transformTextNode(node, options, ownerDoc, stats);
          if (inserted && inserted.length > 0) {
            records.push({ parent, original: node, inserted });
          } else {
            stats.skipped += 1;
          }
        }
      } catch {
        stats.skipped += 1;
      }
      node = next;
    }
  } catch {
    /* never throw into the page */
  }

  return handle;
}
