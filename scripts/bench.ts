#!/usr/bin/env node
/**
 * Throughput benchmark for the DOM transform. Run with: bun run bench
 *
 * Builds synthetic articles of increasing size, transforms them, reverts, and
 * reports milliseconds and words/second. This is a local measurement, not a
 * gate; the loose thresholds live in tests/performance.test.ts.
 */
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

const WORDS = "reading better one word at a time with a place to land every single moment".split(" ");

function makePage(paragraphs: number, wordsPerParagraph: number): Document {
  const body: string[] = [];
  for (let p = 0; p < paragraphs; p += 1) {
    const words: string[] = [];
    for (let w = 0; w < wordsPerParagraph; w += 1) {
      words.push(WORDS[(p * 7 + w) % WORDS.length]!);
    }
    body.push(`<p>${words.join(" ")}</p>`);
  }
  const { document } = parseHTML(`<!doctype html><html><head></head><body>${body.join("\n")}</body></html>`);
  return document as unknown as Document;
}

function time(label: string, fn: () => void): number {
  const start = performance.now();
  fn();
  const ms = performance.now() - start;
  return ms;
}

console.log("paragraphs  words    transform   revert     words/s");
for (const paragraphs of [100, 500, 1000, 2000]) {
  const wordsPer = 45;
  const doc = makePage(paragraphs, wordsPer);
  const totalWords = paragraphs * wordsPer;
  const before = doc.body.innerHTML;

  let handle: ReturnType<typeof transformRoot> | undefined;
  const transformMs = time("transform", () => {
    handle = transformRoot(doc.body, OPTIONS, doc);
  });
  const revertMs = time("revert", () => {
    handle?.revert();
  });

  const restored = doc.body.innerHTML === before;
  const perSec = Math.round(totalWords / (transformMs / 1000));
  console.log(
    `${String(paragraphs).padEnd(11)} ${String(totalWords).padEnd(8)} ${transformMs
      .toFixed(1)
      .padEnd(11)} ${revertMs.toFixed(1).padEnd(10)} ${perSec.toLocaleString()}${
      restored ? "" : "  (REVERT MISMATCH)"
    }`,
  );
}
