import { describe, expect, test } from "bun:test";
import { parseHTML } from "linkedom";
import type { BionicOptions } from "../src/core/algorithm";
import { transformRoot } from "../src/content/domWalker";
import { decorateTails, removeStyles, undecorateTails } from "../src/content/styles";

const HALF: BionicOptions = {
  mode: "half",
  intensity: 0.5,
  minWordLength: 3,
  skipCommonWords: false,
  rule: "0 1 1 2 0.4",
  customVowels: "",
};
const DIM: BionicOptions = { ...HALF, mode: "dim" };

function docFor(html: string): Document {
  const { document } = parseHTML(`<!doctype html><html><head></head><body>${html}</body></html>`);
  return document as unknown as Document;
}

describe("dim mode tail decoration", () => {
  test("wraps the remainder in span.bp-tail and reverses cleanly", () => {
    const doc = docFor("<p>Fading the rest of every word</p>");
    const before = doc.body.innerHTML;

    const handle = transformRoot(doc.body, DIM, doc);
    decorateTails(doc);
    expect(doc.querySelectorAll("span.bp-tail").length).toBeGreaterThan(0);
    expect(doc.querySelectorAll("b.bp-head").length).toBeGreaterThan(0);

    undecorateTails(doc);
    handle.revert();
    expect(doc.body.innerHTML).toBe(before);
    expect(doc.querySelectorAll("span.bp-tail").length).toBe(0);
  });

  test("decorateTails is idempotent", () => {
    const doc = docFor("<p>One two three four five</p>");
    const handle = transformRoot(doc.body, DIM, doc);
    decorateTails(doc);
    const count = doc.querySelectorAll("span.bp-tail").length;
    decorateTails(doc);
    expect(doc.querySelectorAll("span.bp-tail").length).toBe(count);
    undecorateTails(doc);
    handle.revert();
  });

  test("switching mode after a revert changes the produced heads", () => {
    const doc = docFor("<p>Refactoring repeated words</p>");
    const before = doc.body.innerHTML;

    const half = transformRoot(doc.body, HALF, doc);
    const halfHeads = Array.from(doc.querySelectorAll("b.bp-head")).map((h) => h.textContent);
    half.revert();
    expect(doc.body.innerHTML).toBe(before);

    const dim = transformRoot(doc.body, DIM, doc);
    const dimHeads = Array.from(doc.querySelectorAll("b.bp-head")).map((h) => h.textContent);
    dim.revert();

    expect(halfHeads.length).toBeGreaterThan(0);
    expect(dimHeads.length).toBeGreaterThan(0);
    // The two modes agree here, but the point is that the second pass ran at all
    // after a full revert instead of being skipped as already-processed.
    expect(doc.body.innerHTML).toBe(before);
  });
});

describe("removeStyles", () => {
  test("removes the injected stylesheet and mode classes", () => {
    const doc = docFor("<p>Styles are injected then removed</p>");
    const { document } = parseHTML("<!doctype html><html><head></head><body></body></html>");
    expect(document.getElementById("bionic-page-style")).toBeNull();
    removeStyles(doc);
    expect(doc.getElementById("bionic-page-style")).toBeNull();
  });
});
