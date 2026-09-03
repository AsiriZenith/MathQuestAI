import { describe, expect, it } from "vitest";
import { validateClassification } from "@/lib/prompts/validate-classification";
import type { GeneratedQuestion, GenerationResponse } from "@/lib/prompts/types";

const PAT_A = "8f2c0000-0000-0000-0000-000000000001";
const PAT_B = "3a910000-0000-0000-0000-000000000002";

function q(overrides: Partial<GeneratedQuestion> = {}): GeneratedQuestion {
  return {
    questionNumber: 1,
    questionText: "Simplify 3x + 5x.",
    questionType: "mc",
    questionPatternId: PAT_A,
    options: [
      { id: "A", text: "8x" },
      { id: "B", text: "15x" },
    ],
    correctAnswer: "A",
    explanation: "Like terms.",
    ...overrides,
  };
}

function response(...questions: GeneratedQuestion[]): GenerationResponse {
  return { questions };
}

describe("validateClassification", () => {
  it("accepts questions whose type and pattern id are both among the selections", () => {
    const result = validateClassification(response(q()), {
      patternIds: [PAT_A, PAT_B],
      typeCodes: ["mc", "fib"],
    });
    expect(result).toEqual({ ok: true });
  });

  it("rejects a questionPatternId that was not selected", () => {
    const result = validateClassification(
      response(q({ questionPatternId: "qwe-999" })),
      { patternIds: [PAT_A, PAT_B], typeCodes: ["mc"] },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/pattern/i);
  });

  it("rejects a questionType that was not selected", () => {
    const result = validateClassification(response(q({ questionType: "wp" })), {
      patternIds: [PAT_A],
      typeCodes: ["mc", "fib"],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/type/i);
  });

  it("does not fall back to name matching — a pattern name in questionPatternId is rejected", () => {
    const result = validateClassification(
      response(q({ questionPatternId: "Combine Like Terms" })),
      { patternIds: [PAT_A], typeCodes: ["mc"] },
    );
    expect(result.ok).toBe(false);
  });

  it("reports every offending question number in one message", () => {
    const result = validateClassification(
      response(
        q({ questionNumber: 1, questionPatternId: "nope" }),
        q({ questionNumber: 2, questionType: "tf" }),
        q({ questionNumber: 3 }),
      ),
      { patternIds: [PAT_A], typeCodes: ["mc"] },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/\b1\b/);
      expect(result.error).toMatch(/\b2\b/);
      expect(result.error).not.toMatch(/\b3\b/);
    }
  });

  it.each([
    ["one type, one pattern", ["mc"], [PAT_A]],
    ["multiple types, one pattern", ["mc", "fib"], [PAT_A]],
    ["one type, multiple patterns", ["mc"], [PAT_A, PAT_B]],
    ["multiple types, multiple patterns", ["mc", "fib"], [PAT_A, PAT_B]],
  ] as const)("accepts a valid mix: %s", (_label, typeCodes, patternIds) => {
    const result = validateClassification(
      response(
        q({ questionNumber: 1, questionType: typeCodes[0], questionPatternId: patternIds[0] }),
        q({
          questionNumber: 2,
          questionType: typeCodes[typeCodes.length - 1],
          questionPatternId: patternIds[patternIds.length - 1],
          options:
            typeCodes[typeCodes.length - 1] === "mc"
              ? [{ id: "A", text: "x" }]
              : undefined,
          correctAnswer: typeCodes[typeCodes.length - 1] === "mc" ? "A" : "x",
        }),
      ),
      { typeCodes: [...typeCodes], patternIds: [...patternIds] },
    );
    expect(result).toEqual({ ok: true });
  });
});
