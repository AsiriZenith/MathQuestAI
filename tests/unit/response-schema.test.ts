import { describe, expect, it } from "vitest";
import { parseGenerationResponse } from "@/lib/prompts/schema";

const VALID_MC_JSON = JSON.stringify({
  questions: [
    {
      questionNumber: 1,
      questionText: "Simplify 3x + 5x.",
      questionType: "multiple_choice",
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
        questionType: "fill_in_the_blank",
        correctAnswer: "8x",
        explanation: "3x and 5x are like terms, so their coefficients are added.",
        ...overrides,
      },
    ],
  });
}

describe("parseGenerationResponse — absent-ish optional fields", () => {
  // Regression guard: `questionPattern` and `options` are optional, but Zod's
  // `.optional()` rejects `null`, and models routinely emit `null`/"" for a
  // field they cannot fill. Because questions are validated as a whole array,
  // one such value used to invalidate an entire batch of good questions.
  it.each([
    ["null", null],
    ["an empty string", ""],
    ["whitespace only", "   "],
  ])("accepts a questionPattern of %s, normalising it to undefined", (_label, value) => {
    const result = parseGenerationResponse(questionWith({ questionPattern: value }));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.questions[0].questionPattern).toBeUndefined();
    }
  });

  it("keeps and trims a real questionPattern value", () => {
    const result = parseGenerationResponse(
      questionWith({ questionPattern: "  Combine Like Terms  " }),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.questions[0].questionPattern).toBe("Combine Like Terms");
    }
  });

  it("accepts a missing questionPattern entirely", () => {
    const result = parseGenerationResponse(questionWith({}));
    expect(result.ok).toBe(true);
  });

  it("accepts null options on a non-multiple-choice question", () => {
    const result = parseGenerationResponse(questionWith({ options: null }));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.questions[0].options).toBeUndefined();
    }
  });

  it("still rejects a multiple_choice question whose options are null", () => {
    const result = parseGenerationResponse(
      questionWith({ questionType: "multiple_choice", options: null, correctAnswer: "A" }),
    );

    expect(result.ok).toBe(false);
  });
});

describe("parseGenerationResponse", () => {
  it("accepts a valid multiple_choice question", () => {
    const result = parseGenerationResponse(VALID_MC_JSON);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.questions).toHaveLength(1);
      expect(result.data.questions[0].correctAnswer).toBe("A");
    }
  });

  it("accepts a valid non-multiple-choice question without options", () => {
    const json = JSON.stringify({
      questions: [
        {
          questionNumber: 1,
          questionText: "True or false: 3x + 5x = 8x.",
          questionType: "true_false",
          correctAnswer: "true",
          explanation: "3x and 5x are like terms.",
        },
      ],
    });
    const result = parseGenerationResponse(json);
    expect(result.ok).toBe(true);
  });

  it("rejects malformed JSON without throwing", () => {
    const result = parseGenerationResponse("{ not valid json");
    expect(result.ok).toBe(false);
  });

  it("rejects a response missing questionText", () => {
    const json = JSON.stringify({
      questions: [
        {
          questionNumber: 1,
          questionType: "multiple_choice",
          options: [{ id: "A", text: "8x" }],
          correctAnswer: "A",
          explanation: "...",
        },
      ],
    });
    const result = parseGenerationResponse(json);
    expect(result.ok).toBe(false);
  });

  it("rejects a multiple_choice question whose correctAnswer doesn't match any option id", () => {
    const json = JSON.stringify({
      questions: [
        {
          questionNumber: 1,
          questionText: "Simplify 3x + 5x.",
          questionType: "multiple_choice",
          options: [
            { id: "A", text: "8x" },
            { id: "B", text: "5x" },
          ],
          correctAnswer: "Z",
          explanation: "...",
        },
      ],
    });
    const result = parseGenerationResponse(json);
    expect(result.ok).toBe(false);
  });

  it("rejects a multiple_choice question with no options", () => {
    const json = JSON.stringify({
      questions: [
        {
          questionNumber: 1,
          questionText: "Simplify 3x + 5x.",
          questionType: "multiple_choice",
          correctAnswer: "A",
          explanation: "...",
        },
      ],
    });
    const result = parseGenerationResponse(json);
    expect(result.ok).toBe(false);
  });

  it("rejects a response with an empty questions array structure error message, not a thrown exception", () => {
    expect(() => parseGenerationResponse("null")).not.toThrow();
  });
});
