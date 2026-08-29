import { describe, expect, it } from "vitest";
import { parseGenerationResponse } from "@/lib/prompts/schema";

const PATTERN_ID = "8f2c0000-0000-0000-0000-000000000001";

const VALID_MC_JSON = JSON.stringify({
  questions: [
    {
      questionNumber: 1,
      questionText: "Simplify 3x + 5x.",
      questionType: "mc",
      questionPatternId: PATTERN_ID,
      options: [
        { id: "A", text: "8x" },
        { id: "B", text: "5x" },
        { id: "C", text: "15x" },
        { id: "D", text: "2x" },
      ],
      correctAnswer: "A",
      explanation: "3x and 5x are like terms, so their coefficients are added.",
    },
  ],
});

function questionWith(overrides: Record<string, unknown>): string {
  return JSON.stringify({
    questions: [
      {
        questionNumber: 1,
        questionText: "Simplify 3x + 5x.",
        questionType: "fib",
        questionPatternId: PATTERN_ID,
        correctAnswer: "8x",
        explanation: "3x and 5x are like terms, so their coefficients are added.",
        ...overrides,
      },
    ],
  });
}

describe("parseGenerationResponse — questionPatternId is required (TASK-019)", () => {
  it("rejects a question with no questionPatternId", () => {
    const json = JSON.stringify({
      questions: [
        {
          questionNumber: 1,
          questionText: "Simplify 3x + 5x.",
          questionType: "fib",
          correctAnswer: "8x",
          explanation: "...",
        },
      ],
    });
    expect(parseGenerationResponse(json).ok).toBe(false);
  });

  it.each([null, "", "   "])("rejects a questionPatternId of %j", (value) => {
    expect(parseGenerationResponse(questionWith({ questionPatternId: value })).ok).toBe(false);
  });

  it("rejects a question that sends a pattern name field instead of an id", () => {
    const json = JSON.stringify({
      questions: [
        {
          questionNumber: 1,
          questionText: "Simplify 3x + 5x.",
          questionType: "fib",
          questionPattern: "Combine Like Terms",
          correctAnswer: "8x",
          explanation: "...",
        },
      ],
    });
    expect(parseGenerationResponse(json).ok).toBe(false);
  });

  it("keeps the questionPatternId verbatim", () => {
    const result = parseGenerationResponse(questionWith({ questionPatternId: PATTERN_ID }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.questions[0].questionPatternId).toBe(PATTERN_ID);
  });
});

describe("parseGenerationResponse — options", () => {
  it("accepts null options on a non-mc question, normalising to undefined", () => {
    const result = parseGenerationResponse(questionWith({ options: null }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.questions[0].options).toBeUndefined();
  });

  it("still rejects an mc question whose options are null", () => {
    const result = parseGenerationResponse(
      questionWith({ questionType: "mc", options: null, correctAnswer: "A" }),
    );
    expect(result.ok).toBe(false);
  });
});

describe("parseGenerationResponse", () => {
  it("accepts a valid mc question", () => {
    const result = parseGenerationResponse(VALID_MC_JSON);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.questions).toHaveLength(1);
      expect(result.data.questions[0].questionType).toBe("mc");
      expect(result.data.questions[0].correctAnswer).toBe("A");
    }
  });

  it("accepts a valid non-mc question without options", () => {
    const json = JSON.stringify({
      questions: [
        {
          questionNumber: 1,
          questionText: "True or false: 3x + 5x = 8x.",
          questionType: "tf",
          questionPatternId: PATTERN_ID,
          correctAnswer: "true",
          explanation: "3x and 5x are like terms.",
        },
      ],
    });
    expect(parseGenerationResponse(json).ok).toBe(true);
  });

  it("rejects a long-form questionType", () => {
    expect(parseGenerationResponse(questionWith({ questionType: "multiple_choice" })).ok).toBe(false);
  });

  it("rejects malformed JSON without throwing", () => {
    expect(parseGenerationResponse("{ not valid json").ok).toBe(false);
  });

  it("rejects a response missing questionText", () => {
    const json = JSON.stringify({
      questions: [
        {
          questionNumber: 1,
          questionType: "mc",
          questionPatternId: PATTERN_ID,
          options: [{ id: "A", text: "8x" }],
          correctAnswer: "A",
          explanation: "...",
        },
      ],
    });
    expect(parseGenerationResponse(json).ok).toBe(false);
  });

  it("rejects an mc question whose correctAnswer doesn't match any option id", () => {
    const json = JSON.stringify({
      questions: [
        {
          questionNumber: 1,
          questionText: "Simplify 3x + 5x.",
          questionType: "mc",
          questionPatternId: PATTERN_ID,
          options: [
            { id: "A", text: "8x" },
            { id: "B", text: "5x" },
          ],
          correctAnswer: "Z",
          explanation: "...",
        },
      ],
    });
    expect(parseGenerationResponse(json).ok).toBe(false);
  });

  it("rejects an mc question with no options", () => {
    const json = JSON.stringify({
      questions: [
        {
          questionNumber: 1,
          questionText: "Simplify 3x + 5x.",
          questionType: "mc",
          questionPatternId: PATTERN_ID,
          correctAnswer: "A",
          explanation: "...",
        },
      ],
    });
    expect(parseGenerationResponse(json).ok).toBe(false);
  });

  it("does not throw on a bare null", () => {
    expect(() => parseGenerationResponse("null")).not.toThrow();
  });
});
