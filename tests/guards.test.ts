import { describe, expect, test } from "bun:test";
import { SKIP_TAGS, shouldSkipElement, shouldSkipText } from "../src/content/guards";

/** Minimal fake Element sufficient for the guards' contract. */
function fakeEl(tagName: string, closestResult: Element | null = null): Element {
  return {
    tagName,
    closest: () => closestResult,
  } as unknown as Element;
}

describe("guards.shouldSkipElement", () => {
  test("skips every tag in the skip set", () => {
    for (const tag of SKIP_TAGS) {
      expect(shouldSkipElement(fakeEl(tag))).toBe(true);
    }
  });

  test("does not skip ordinary containers", () => {
    expect(shouldSkipElement(fakeEl("DIV"))).toBe(false);
    expect(shouldSkipElement(fakeEl("P"))).toBe(false);
    expect(shouldSkipElement(fakeEl("SPAN"))).toBe(false);
    expect(shouldSkipElement(fakeEl("H1"))).toBe(false);
  });

  test("is case-insensitive on the tag name", () => {
    expect(shouldSkipElement(fakeEl("SCRIPT"))).toBe(true);
    expect(shouldSkipElement(fakeEl("Input"))).toBe(true);
  });

  test("skips when a skip selector matches an ancestor", () => {
    const ancestor = fakeEl("DIV");
    expect(shouldSkipElement(fakeEl("SPAN", ancestor))).toBe(true);
  });

  test("fails closed for missing elements", () => {
    expect(shouldSkipElement(undefined as unknown as Element)).toBe(true);
  });
});

describe("guards.shouldSkipText", () => {
  test("skips empty and whitespace-only text", () => {
    expect(shouldSkipText("", null)).toBe(true);
    expect(shouldSkipText("   \n\t ", null)).toBe(true);
  });

  test("skips text with no letters (numbers, punctuation, symbols)", () => {
    expect(shouldSkipText("12345", null)).toBe(true);
    expect(shouldSkipText("-- ... !!", null)).toBe(true);
    expect(shouldSkipText("€$%", null)).toBe(true);
  });

  test("keeps text with letters, including unicode", () => {
    expect(shouldSkipText("hello", null)).toBe(false);
    expect(shouldSkipText("café", null)).toBe(false);
    expect(shouldSkipText("日本語", null)).toBe(false);
    expect(shouldSkipText("naïve déjà vu", null)).toBe(false);
  });

  test("skips when the parent is a skip tag", () => {
    expect(shouldSkipText("hello", fakeEl("CODE"))).toBe(true);
    expect(shouldSkipText("hello", fakeEl("DIV"))).toBe(false);
  });
});
