import { describe, expect, test } from "bun:test";
import { bionicText, boldLength, emphasize, isUnbreakableToken, MAX_TOKEN_LETTERS } from "../src/core/algorithm";
import type { BionicOptions } from "../src/core/algorithm";

const OPTIONS: BionicOptions = {
  mode: "half",
  intensity: 0.5,
  minWordLength: 3,
  skipCommonWords: false,
  rule: "0 1 1 2 0.4",
  customVowels: "",
};

describe("unbreakable tokens are left alone", () => {
  const cases = [
    "https://example.com/a/very/long/path?with=query",
    "http://localhost:3000/",
    "www.example.com",
    "user@example.com",
    "someone.name+tag@sub.domain.co",
  ];
  for (const token of cases) {
    test(`skips ${token}`, () => {
      expect(boldLength(token, OPTIONS)).toBe(0);
      expect(emphasize(token, OPTIONS)).toBeNull();
      expect(bionicText(token, OPTIONS)).toBe(token);
    });
  }

  test("skips very long unbroken runs (a CJK sentence, a hash)", () => {
    const cjk = "这是一段没有任何空格的很长的中文句子用来验证它不会被错误地加粗处理因为它远远超过了单个词的长度上限应该被跳过";
    expect(cjk.length).toBeGreaterThan(MAX_TOKEN_LETTERS);
    expect(boldLength(cjk, OPTIONS)).toBe(0);

    const hash = "a".repeat(MAX_TOKEN_LETTERS + 1);
    expect(boldLength(hash, OPTIONS)).toBe(0);
    expect(isUnbreakableToken(hash, hash.length)).toBe(true);
  });

  test("still emphasizes ordinary long words below the cap", () => {
    const word = "a".repeat(MAX_TOKEN_LETTERS);
    expect(boldLength(word, OPTIONS)).toBeGreaterThan(0);
  });

  test("hyphenated and punctuated words are still transformed", () => {
    expect(boldLength("well-known", OPTIONS)).toBeGreaterThan(0);
    expect(boldLength("(parenthetical)", OPTIONS)).toBeGreaterThan(0);
    expect(boldLength('"quoted"', OPTIONS)).toBeGreaterThan(0);
  });

  test("emphasize keeps quotes and brackets outside the core intact", () => {
    const split = emphasize('"(hello)"', OPTIONS);
    expect(split).not.toBeNull();
    expect(split!.head + split!.tail).toBe('"(hello)"');
    expect(split!.head.startsWith('"(')).toBe(true);
  });
});
