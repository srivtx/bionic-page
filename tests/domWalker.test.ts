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

function docFor(html: string): Document {
  const { document } = parseHTML(`<!doctype html><html><head></head><body>${html}</body></html>`);
  return document as unknown as Document;
}

describe("transformRoot", () => {
  test("wraps the leading part of words in b.bp-head", () => {
    const doc = docFor("<p>Reading works</p>");
    transformRoot(doc.body, OPTIONS, doc);
    const heads = Array.from(doc.querySelectorAll("b.bp-head"));
    expect(heads.length).toBeGreaterThan(0);
    expect(heads.map((h) => h.textContent).join(" ")).toContain("Read");
  });

  test("is fully reversible: revert restores the original html exactly", () => {
    const doc = docFor("<p>Hello wonderful world</p><p>Second paragraph here</p>");
    const before = doc.body.innerHTML;
    const handle = transformRoot(doc.body, OPTIONS, doc);
    expect(doc.body.innerHTML).not.toBe(before);
    handle.revert();
    expect(doc.body.innerHTML).toBe(before);
  });

  test("is idempotent: a second pass adds no new wrappers", () => {
    const doc = docFor("<p>Repeated transform should be stable</p>");
    const first = transformRoot(doc.body, OPTIONS, doc);
    const afterFirst = doc.querySelectorAll("b.bp-head").length;
    transformRoot(doc.body, OPTIONS, doc);
    const afterSecond = doc.querySelectorAll("b.bp-head").length;
    expect(afterSecond).toBe(afterFirst);
    first.revert();
  });

  test("never touches code, pre, or contenteditable", () => {
    const doc = docFor(
      '<pre><code>const keep = 1;</code></pre><div contenteditable="true">editable words here</div><p>normal words here</p>',
    );
    transformRoot(doc.body, OPTIONS, doc);
    expect(doc.querySelectorAll("pre b.bp-head").length).toBe(0);
    expect(doc.querySelectorAll("code b.bp-head").length).toBe(0);
    expect(doc.querySelector('div[contenteditable="true"]')?.querySelectorAll("b.bp-head").length).toBe(0);
    expect(doc.querySelectorAll("p b.bp-head").length).toBeGreaterThan(0);
  });

  test("honours data-bionic=off", () => {
    const doc = docFor('<p data-bionic="off">leave these words alone</p>');
    transformRoot(doc.body, OPTIONS, doc);
    expect(doc.querySelectorAll("b.bp-head").length).toBe(0);
  });

  test("skips navigation and button regions", () => {
    const doc = docFor(
      '<nav><a href="#">Home page link</a></nav><button type="button">Save changes now</button><p>Readable words here</p>',
    );
    transformRoot(doc.body, OPTIONS, doc);
    expect(doc.querySelectorAll("nav b.bp-head").length).toBe(0);
    expect(doc.querySelectorAll("button b.bp-head").length).toBe(0);
    expect(doc.querySelectorAll("p b.bp-head").length).toBeGreaterThan(0);
  });

  test("processes text that replaces content in an already-transformed parent", () => {
    const doc = docFor('<p id="live">original words in this paragraph</p>');
    transformRoot(doc.body, OPTIONS, doc);
    expect(doc.querySelectorAll("b.bp-head").length).toBeGreaterThan(0);

    // A framework rewrites the paragraph's text: a brand-new text node under
    // the same parent, which must be transformed on the next pass.
    const p = doc.getElementById("live")!;
    p.textContent = "replacement words arriving later";
    expect(doc.querySelectorAll("b.bp-head").length).toBe(0);

    transformRoot(doc.body, OPTIONS, doc);
    expect(doc.querySelectorAll("b.bp-head").length).toBeGreaterThan(0);
    expect(doc.querySelector("b.bp-head")!.textContent).toBe("replac");
  });

  test("separate handles each revert their own pass without over-reverting", () => {
    const doc = docFor('<p id="a">first paragraph words</p><p id="b">second paragraph words</p>');
    const before = doc.body.innerHTML;
    const h1 = transformRoot(doc.body, OPTIONS, doc);
    const h2 = transformRoot(doc.body, OPTIONS, doc);
    h2.revert();
    // h1's wrappers are still present until h1 reverts.
    expect(doc.querySelectorAll("b.bp-head").length).toBeGreaterThan(0);
    h1.revert();
    expect(doc.body.innerHTML).toBe(before);
  });

  test("stats report transformed text nodes and words", () => {
    const doc = docFor("<p>Counting words here</p>");
    const handle = transformRoot(doc.body, OPTIONS, doc);
    expect(handle.stats.textNodes).toBeGreaterThan(0);
    expect(handle.stats.words).toBeGreaterThan(0);
  });

  test("revert is safe to call twice", () => {
    const doc = docFor("<p>Safe to revert twice</p>");
    const handle = transformRoot(doc.body, OPTIONS, doc);
    handle.revert();
    expect(() => handle.revert()).not.toThrow();
  });

  test("an empty body is a no-op", () => {
    const doc = docFor("");
    const handle = transformRoot(doc.body, OPTIONS, doc);
    expect(handle.stats.textNodes).toBe(0);
    handle.revert();
  });
});
