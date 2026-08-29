import { describe, expect, it } from "vitest";
import {
  isExactSetMatch,
  resolveSelectedPatternIds,
  resolveSelectedTypeCodes,
} from "@/lib/persistence/matching";
import type { GenerationContext, PracticeConfig } from "@/lib/types";

describe("isExactSetMatch", () => {
  it("matches identical sets regardless of order", () => {
    expect(isExactSetMatch(["a", "b"], ["b", "a"])).toBe(true);
  });

  it("does not match when the saved set is missing an item", () => {
    expect(isExactSetMatch(["a", "b"], ["a"])).toBe(false);
  });

  it("does not match when the saved set has an extra item", () => {
    expect(isExactSetMatch(["a", "b"], ["a", "b", "c"])).toBe(false);
  });

  it("does not match when the saved set has a different item", () => {
    expect(isExactSetMatch(["a", "b"], ["a", "c"])).toBe(false);
  });

  it("matches two empty sets", () => {
    expect(isExactSetMatch([], [])).toBe(true);
  });

  it("does not match an empty set against a non-empty one", () => {
    expect(isExactSetMatch(["a"], [])).toBe(false);
  });
});

describe("resolveSelectedTypeCodes", () => {
  it("returns all five codes when autoTypes is true", () => {
    const config: Pick<PracticeConfig, "selectedTypes" | "autoTypes"> = {
      selectedTypes: [],
      autoTypes: true,
    };
    expect(resolveSelectedTypeCodes(config)).toEqual(["mc", "fib", "wp", "tf", "ms"]);
  });

  it("dedupes selected types when autoTypes is false", () => {
    const config: Pick<PracticeConfig, "selectedTypes" | "autoTypes"> = {
      selectedTypes: ["mc", "fib", "mc"],
      autoTypes: false,
    };
    expect(resolveSelectedTypeCodes(config)).toEqual(["mc", "fib"]);
  });

  it("ignores codes that are not recognised question types", () => {
    const config: Pick<PracticeConfig, "selectedTypes" | "autoTypes"> = {
      selectedTypes: ["mc", "not-a-type"],
      autoTypes: false,
    };
    expect(resolveSelectedTypeCodes(config)).toEqual(["mc"]);
  });
});

describe("resolveSelectedPatternIds", () => {
  it("dedupes pattern ids, preserving first-appearance order", () => {
    const generationContext: Pick<GenerationContext, "patterns"> = {
      patterns: [
        { id: "a", name: "A", generationPrompt: null, referenceQuestions: [] },
        { id: "b", name: "B", generationPrompt: null, referenceQuestions: [] },
        { id: "a", name: "A", generationPrompt: null, referenceQuestions: [] },
      ],
    };
    expect(resolveSelectedPatternIds(generationContext)).toEqual(["a", "b"]);
  });

  it("returns an empty array when there are no patterns", () => {
    expect(resolveSelectedPatternIds({ patterns: [] })).toEqual([]);
  });
});
