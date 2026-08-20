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
