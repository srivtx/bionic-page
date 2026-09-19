import { describe, expect, test } from "bun:test";
import { parseHTML } from "linkedom";
import type { BionicOptions } from "../src/core/algorithm";
import { transformRoot } from "../src/content/domWalker";

const OPTIONS: BionicOptions = {
  mode: "half",
  intensity: 0.5,
  minWordLength: 3,
  skipCommonWords: false,
  rule: "0 1 1 2 0.4",
  customVowels: "",
};

function bigPage(paragraphs: number): Document {
  const words = "reading better one word at a time with a place to land every moment".split(" ");
  const body = Array.from({ length: paragraphs }, (_, p) =>
    `<p>${Array.from({ length: 45 }, (_, w) => words[(p + w) % words.length]).join(" ")}</p>`,
  ).join("\n");
  const { document } = parseHTML(`<!doctype html><html><head></head><body>${body}</body></html>`);
  return document as unknown as Document;
}

describe("transform performance", () => {
  test("a 1,000-paragraph article transforms and reverts under a loose budget", () => {
    const doc = bigPage(1000);
    const before = doc.body.innerHTML;

    const start = performance.now();
    const handle = transformRoot(doc.body, OPTIONS, doc);
    handle.revert();
    const elapsed = performance.now() - start;

    expect(doc.body.innerHTML).toBe(before);
    // Very loose: this is hundreds of milliseconds locally; a CI box is slower.
    expect(elapsed).toBeLessThan(8000);
    expect(handle.stats.textNodes).toBeGreaterThan(900);
  });

  test("a second pass adds nothing new (idempotent) and stays bounded", () => {
    const doc = bigPage(300);
    const first = transformRoot(doc.body, OPTIONS, doc);
    const headsAfterFirst = doc.querySelectorAll("b.bp-head").length;

    const start = performance.now();
    transformRoot(doc.body, OPTIONS, doc);
    const secondPassMs = performance.now() - start;

    expect(doc.querySelectorAll("b.bp-head").length).toBe(headsAfterFirst);
    expect(secondPassMs).toBeLessThan(4000);
    first.revert();
  });
});
