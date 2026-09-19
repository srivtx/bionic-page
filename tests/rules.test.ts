import { describe, expect, test } from "bun:test";
import { DEFAULT_RULE, parseRule } from "../src/core/rules";

const DEFAULT_SPEC = { highLightCommon: false, counts: [0, 1, 1, 2], fraction: 0.4 };

describe("parseRule", () => {
  test("parses the documented default", () => {
    expect(parseRule(DEFAULT_RULE)).toEqual(DEFAULT_SPEC);
  });

  test("'-' and absent sign mean common words are left alone", () => {
    expect(parseRule("- 0 1 1 2 0.4").highLightCommon).toBe(false);
    expect(parseRule("0 1 1 2 0.4").highLightCommon).toBe(false);
  });

  test("'+' turns on common-word highlighting", () => {
    expect(parseRule("+ 0 1 1 2 0.4").highLightCommon).toBe(true);
    expect(parseRule("+0 1 1 2 0.4").highLightCommon).toBe(true);
  });

  test("accepts fewer counts than four", () => {
    const spec = parseRule("1 2 0.5");
    expect(spec.counts).toEqual([1, 2]);
    expect(spec.fraction).toBe(0.5);
  });

  test("tolerates surrounding whitespace", () => {
    expect(parseRule("   0 1 1 2 0.4   ")).toEqual(DEFAULT_SPEC);
  });

  test("falls back to the default on garbage instead of throwing", () => {
    for (const bad of ["", "   ", "nonsense", "0 1 1 2", "0 1 1 2 x", "0 1 1 2 0", "a b c", "0 1 1 2 3 4 5"]) {
      expect(() => parseRule(bad)).not.toThrow();
      expect(parseRule(bad)).toEqual(DEFAULT_SPEC);
    }
  });

  test("non-string input falls back", () => {
    expect(parseRule(undefined as unknown as string)).toEqual(DEFAULT_SPEC);
    expect(parseRule(42 as unknown as string)).toEqual(DEFAULT_SPEC);
  });

  test("requires a decimal fraction token, not a bare integer", () => {
    expect(parseRule("0 1 1 2 1")).toEqual(DEFAULT_SPEC);
    expect(parseRule("0 1 1 2 .5").fraction).toBe(0.5);
  });
});
