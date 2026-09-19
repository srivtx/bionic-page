/**
 * Tests for the pure core algorithm. Covers every behavioral rule in
 * docs/CONTRACTS.md plus unicode, punctuation, hyphenation and digit edges.
 *
 * The Bun test runner provides `test`/`expect` as globals; the declarations
 * below keep `tsc --noEmit` happy without adding a dependency.
 */

import {
  COMMON_WORDS,
  DEFAULT_VOWELS,
  isLetter,
  splitAffixes,
} from "../src/core/languages";
import { DEFAULT_RULE, parseRule } from "../src/core/rules";
import type { RuleSpec } from "../src/core/rules";
import {
  CORE_PACKAGE_VERSION,
  bionicText,
  boldLength,
  emphasize,
} from "../src/core/algorithm";
import type { BionicOptions } from "../src/core/algorithm";
import type { ModeId } from "../src/shared/types";

declare function test(name: string, fn: () => void | Promise<void>): void;

interface Matchers {
  toBe(expected: unknown): void;
  toEqual(expected: unknown): void;
  toBeNull(): void;
  toBeDefined(): void;
  toBeTrue(): void;
  toBeFalse(): void;
  toThrow(): void;
  toContain(expected: string): void;
  toBeGreaterThan(expected: number): void;
  toBeGreaterThanOrEqual(expected: number): void;
  toBeLessThanOrEqual(expected: number): void;
  not: Matchers;
}

declare function expect(actual: unknown): Matchers;

const BASE: BionicOptions = {
  mode: "classic",
  intensity: 0.5,
  minWordLength: 2,
  skipCommonWords: false,
  rule: DEFAULT_RULE,
  customVowels: "",
};

function opt(overrides: Partial<BionicOptions>): BionicOptions {
  return { ...BASE, ...overrides };
}

const ALL_MODES: readonly ModeId[] = ["classic", "half", "vowel", "dim", "rules"];

function lettersOf(text: string): number {
  let n = 0;
  for (const ch of text) {
    if (isLetter(ch)) n++;
  }
  return n;
}

function coreLetterCount(word: string): number {
  return lettersOf(splitAffixes(word).core);
}

function stripTags(html: string): string {
  return html.replace(/<\/?b>/g, "");
}

test("languages: DEFAULT_VOWELS covers ascii and accented vowels", () => {
  expect(DEFAULT_VOWELS).toContain("a");
  expect(DEFAULT_VOWELS).toContain("y");
  expect(DEFAULT_VOWELS).toContain("é");
  expect(DEFAULT_VOWELS).toContain("ø");
  expect(DEFAULT_VOWELS).toContain("ü");
});

test("languages: COMMON_WORDS is a lowercase function-word set", () => {
  expect(COMMON_WORDS.has("the")).toBeTrue();
  expect(COMMON_WORDS.has("and")).toBeTrue();
  expect(COMMON_WORDS.has("of")).toBeTrue();
  expect(COMMON_WORDS.has("The")).toBeFalse();
});

test("languages: isLetter is unicode aware and accepts combining marks", () => {
  expect(isLetter("a")).toBeTrue();
  expect(isLetter("Z")).toBeTrue();
  expect(isLetter("é")).toBeTrue();
  expect(isLetter("ø")).toBeTrue();
  expect(isLetter("ñ")).toBeTrue();
  expect(isLetter("\u0301")).toBeTrue();
  expect(isLetter(" ")).toBeFalse();
  expect(isLetter("1")).toBeFalse();
  expect(isLetter("!")).toBeFalse();
  expect(isLetter("")).toBeFalse();
});

test("languages: splitAffixes separates leading and trailing non-letters", () => {
  expect(splitAffixes("(hello)")).toEqual({ prefix: "(", core: "hello", suffix: ")" });
  expect(splitAffixes('"world"')).toEqual({ prefix: '"', core: "world", suffix: '"' });
  expect(splitAffixes("…word…")).toEqual({ prefix: "…", core: "word", suffix: "…" });
  expect(splitAffixes("hello")).toEqual({ prefix: "", core: "hello", suffix: "" });
  expect(splitAffixes("...")).toEqual({ prefix: "...", core: "", suffix: "" });
  expect(splitAffixes("12345")).toEqual({ prefix: "12345", core: "", suffix: "" });
  expect(splitAffixes("well-known")).toEqual({ prefix: "", core: "well-known", suffix: "" });
  expect(splitAffixes("[[a]]")).toEqual({ prefix: "[[", core: "a", suffix: "]]" });
});

test("rules: parseRule reads the canonical format", () => {
  expect(parseRule("0 1 1 2 0.4")).toEqual({
    highLightCommon: false,
    counts: [0, 1, 1, 2],
    fraction: 0.4,
  });
  expect(parseRule("+0 1 1 2 0.4").highLightCommon).toBeTrue();
  expect(parseRule("-0 1 1 2 0.4").highLightCommon).toBeFalse();
});

test("rules: parseRule accepts a detached sign and fewer counts", () => {
  expect(parseRule("- 0 1 1 2 0.4").highLightCommon).toBeFalse();
  expect(parseRule("+ 0 1 1 2 0.4").highLightCommon).toBeTrue();
  expect(parseRule("1 0.4")).toEqual({ highLightCommon: false, counts: [1], fraction: 0.4 });
});

test("rules: invalid input falls back to DEFAULT_RULE without throwing", () => {
  const fallback: RuleSpec = {
    highLightCommon: false,
    counts: [0, 1, 1, 2],
    fraction: 0.4,
  };
  for (const bad of ["", "   ", "garbage", "0 1 1 2", "0 x 1 2 0.4", "0.5 0.4", "+-", "1 2 3 4 5 6"]) {
    expect(parseRule(bad)).toEqual(fallback);
  }
  expect(() => parseRule("anything at all")).not.toThrow();
});

// Rule 1: boldLength never exceeds the number of letters in the word.
test("rule 1: boldLength never exceeds the core letter count", () => {
  const words = [
    "strength",
    "well-known",
    "café",
    "naïve",
    "supercalifragilistic",
    "HELLO",
    "abc123",
    "a",
    "I",
    "don't",
    "résumé",
    "12345",
    "",
  ];
  for (const mode of ALL_MODES) {
    for (const word of words) {
      const n = boldLength(word, opt({ mode }));
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThanOrEqual(coreLetterCount(word));
    }
  }
});

// Rule 2: empty / whitespace-only input returns 0.
test("rule 2: empty and whitespace-only words return 0", () => {
  for (const mode of ALL_MODES) {
    expect(boldLength("", opt({ mode }))).toBe(0);
    expect(boldLength("   ", opt({ mode }))).toBe(0);
    expect(boldLength("\t\n", opt({ mode }))).toBe(0);
    expect(boldLength("...", opt({ mode }))).toBe(0);
  }
  expect(emphasize("", opt({}))).toBeNull();
  expect(emphasize("   ", opt({}))).toBeNull();
});

// Rule 3: minWordLength gates most modes; rules/half may still bold short words.
test("rule 3: minWordLength gates classic/vowel/dim but not rules/half", () => {
  const min = 8;
  expect(boldLength("at", opt({ mode: "classic", minWordLength: min }))).toBe(0);
  expect(boldLength("at", opt({ mode: "vowel", minWordLength: min }))).toBe(0);
  expect(boldLength("at", opt({ mode: "dim", minWordLength: min }))).toBe(0);

  expect(boldLength("at", opt({ mode: "half", minWordLength: min }))).toBe(1);
  expect(boldLength("abc", opt({ mode: "half", minWordLength: min }))).toBe(2);
  expect(boldLength("at", opt({ mode: "rules", minWordLength: min }))).toBe(1);
  expect(boldLength("abc", opt({ mode: "rules", minWordLength: min }))).toBe(1);
});

// Rule 4: skipCommonWords drops members of COMMON_WORDS.
test("rule 4: skipCommonWords returns 0 for common words", () => {
  for (const mode of ["classic", "half", "vowel", "dim"] as const) {
    for (const word of ["the", "and", "of", "to"]) {
      expect(boldLength(word, opt({ mode, skipCommonWords: true, minWordLength: 2 }))).toBe(0);
    }
  }
  expect(boldLength("the", opt({ mode: "half", skipCommonWords: false }))).toBe(2);
  expect(boldLength("the", opt({ mode: "classic", skipCommonWords: false }))).toBe(2);
});

// Rule 5: "half" bolds half of an 8-letter word.
test("rule 5: half mode on an 8-letter word returns 4", () => {
  expect(boldLength("strength", opt({ mode: "half" }))).toBe(4);
  expect(boldLength("abcdefgh", opt({ mode: "half" }))).toBe(4);
});

// Rule 6: classic scales with intensity, min 1.
test("rule 6: classic mode follows intensity, always at least 1", () => {
  expect(boldLength("strength", opt({ mode: "classic", intensity: 0.5 }))).toBe(4);
  expect(boldLength("strength", opt({ mode: "classic", intensity: 0.25 }))).toBe(2);
  expect(boldLength("at", opt({ mode: "classic", intensity: 0.2, minWordLength: 2 }))).toBe(1);
});

// Rule 7: vowel anchors on the first vowel group, >= 1 and <= half + 1.
test("rule 7: vowel mode emphasizes through the first vowel group", () => {
  expect(boldLength("strength", opt({ mode: "vowel", minWordLength: 2 }))).toBe(4);
  expect(boldLength("apple", opt({ mode: "vowel", minWordLength: 2 }))).toBe(1);
  expect(boldLength("banana", opt({ mode: "vowel", minWordLength: 2 }))).toBe(2);
  const n = boldLength("strength", opt({ mode: "vowel", minWordLength: 2 }));
  expect(n).toBeGreaterThanOrEqual(1);
  expect(n).toBeLessThanOrEqual(Math.ceil(8 / 2) + 1);
  const split = emphasize("strength", opt({ mode: "vowel", minWordLength: 2 }));
  expect(split).toBeDefined();
  expect(split?.head).toContain("e");
});

// Rule 8: the default rule's per-length counts and fraction.
test("rule 8: rules mode follows '0 1 1 2 0.4'", () => {
  const o = opt({ mode: "rules", rule: "0 1 1 2 0.4", minWordLength: 2 });
  expect(boldLength("a", o)).toBe(0);
  expect(boldLength("ab", o)).toBe(1);
  expect(boldLength("abc", o)).toBe(1);
  expect(boldLength("abcd", o)).toBe(2);
  expect(boldLength("abcde", o)).toBe(2);
  expect(boldLength("abcdefgh", o)).toBe(4);
  expect(boldLength("abcdefghij", o)).toBe(4);
});

// Rule 9: purity / determinism.
test("rule 9: functions are pure and deterministic", () => {
  const o = opt({ mode: "classic", intensity: 0.5 });
  expect(boldLength("hello", o)).toBe(boldLength("hello", o));
  expect(emphasize("hello", o)).toEqual(emphasize("hello", o));
  expect(parseRule("0 1 1 2 0.4")).toEqual(parseRule("0 1 1 2 0.4"));
  const a = emphasize("hello", o);
  const b = emphasize("hello", o);
  expect(a).not.toBe(b);
  expect(typeof CORE_PACKAGE_VERSION).toBe("string");
  expect(CORE_PACKAGE_VERSION.length).toBeGreaterThan(0);
});

// Rule 10: bionicText preserves every original character in order.
test("rule 10: bionicText strips back to the exact input and never nests", () => {
  const inputs = [
    "",
    " ",
    "   ",
    "\t\n",
    "x",
    "hello world",
    "(hello)",
    '"world"',
    "…word…",
    "[test]",
    "{value}",
    "café",
    "naïve",
    "über",
    "résumé",
    "señor",
    "well-known",
    "mother-in-law",
    "e-mail",
    "HELLO",
    "NASA",
    "abc123",
    "2,000",
    "#tag123",
    "don't",
    "it's",
    "state-of-the-art",
    "cafe\u0301",
  ];
  for (const mode of ALL_MODES) {
    const o = opt({ mode, minWordLength: 2 });
    for (const input of inputs) {
      const html = bionicText(input, o);
      expect(html).not.toContain("<b><b>");
      expect(html).not.toContain("</b></b>");
      expect(stripTags(html)).toBe(input);
    }
  }
  expect(stripTags(bionicText("x", opt({})))).toBe("x");
});

test("emphasize: head + tail always reconstructs the whole word", () => {
  const words = [
    "(hello)",
    '"world"',
    "…word…",
    "well-known",
    "don't",
    "café",
    "HELLO",
    "abc123",
    "supercalifragilistic",
  ];
  for (const mode of ALL_MODES) {
    for (const word of words) {
      const split = emphasize(word, opt({ mode, minWordLength: 2 }));
      if (split === null) continue;
      expect(split.head + split.tail).toBe(word);
      expect(split.head.length).toBeGreaterThan(0);
    }
  }
});

test("emphasize: leading quote stays with the emphasized head", () => {
  const split = emphasize("(hello)", opt({ mode: "classic", intensity: 0.5 }));
  expect(split).toEqual({ head: "(hel", tail: "lo)" });
});

test("edge: punctuation-only and digit-only tokens are untouched", () => {
  const o = opt({ mode: "classic" });
  for (const word of ["12345", "3.14", "!!!", "…", "''"]) {
    expect(emphasize(word, o)).toBeNull();
    expect(boldLength(word, o)).toBe(0);
  }
  expect(bionicText("3.14 42", o)).toBe("3.14 42");
});

test("edge: accented and decomposed words keep their marks", () => {
  const o = opt({ mode: "half" });
  expect(coreLetterCount("café")).toBe(4);
  expect(coreLetterCount("cafe\u0301")).toBe(5);
  const split = emphasize("café", o);
  expect(split).toEqual({ head: "ca", tail: "fé" });
  expect(stripTags(bionicText("résumé naïve", o))).toBe("résumé naïve");
});

test("edge: all-caps words are treated case-insensitively", () => {
  const o = opt({ mode: "classic", intensity: 0.5 });
  expect(boldLength("HELLO", o)).toBe(3);
  expect(emphasize("HELLO", o)).toEqual({ head: "HEL", tail: "LO" });
});

test("edge: hyphenated words count letters across the hyphen", () => {
  const o = opt({ mode: "classic", intensity: 0.5 });
  expect(coreLetterCount("well-known")).toBe(9);
  expect(boldLength("well-known", o)).toBe(5);
  const split = emphasize("well-known", o);
  expect(split).not.toBeNull();
  if (split) expect(split.head + split.tail).toBe("well-known");
});
