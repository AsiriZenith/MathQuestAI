import { describe, expect, it } from "vitest";
import {
  isDifficultyLevel,
  isQuestionType,
  isValidScore,
  validateGeneratedQuestion,
} from "@/lib/persistence/validation";

describe("isQuestionType", () => {
  it.each(["mc", "fib", "wp", "tf", "ms"])("accepts the stable code %s", (code) => {
    expect(isQuestionType(code)).toBe(true);
  });

  it.each(["unknown", "multiple_choice", "MC", "", " mc "])(
    "rejects the invalid value %j",
    (value) => {
      expect(isQuestionType(value)).toBe(false);
    },
  );

  it("rejects null and undefined", () => {
    expect(isQuestionType(null)).toBe(false);
    expect(isQuestionType(undefined)).toBe(false);
  });
});

describe("isDifficultyLevel", () => {
  it.each(["Easy", "Medium", "Hard"])("accepts the DB spelling %s", (level) => {
    expect(isDifficultyLevel(level)).toBe(true);
  });

  it.each(["easy", "HARD", "medium", "Simple", ""])(
    "rejects the invalid value %j",
    (value) => {
      expect(isDifficultyLevel(value)).toBe(false);
    },
  );

  it("rejects null", () => {
    expect(isDifficultyLevel(null)).toBe(false);
  });
});

describe("isValidScore", () => {
  it.each([0, 50, 100])("accepts the valid score %j", (score) => {
    expect(isValidScore(score)).toBe(true);
  });

  it.each([-1, 101, 3.5, Number.NaN, "85", null, undefined, {}])(
    "rejects the invalid score %j",
    (value) => {
      expect(isValidScore(value)).toBe(false);
    },
  );
});

describe("validateGeneratedQuestion", () => {
  const valid = {
    generationContextId: "ctx-1",
    questionPatternId: "pat-1",
    questionType: "mc",
    questionNumber: 1,
    questionText: "Simplify 2x + 3x.",
    expectedAnswer: "5x",
  };

  it("passes a well-formed generated question", () => {
    expect(validateGeneratedQuestion(valid)).toEqual({ ok: true });
  });

  it.each([0, -1, 1.5, Number.NaN])("rejects question number %j", (questionNumber) => {
    const result = validateGeneratedQuestion({ ...valid, questionNumber });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.toLowerCase().includes("number"))).toBe(true);
    }
  });

  it("rejects a missing generationContextId", () => {
    const result = validateGeneratedQuestion({ ...valid, generationContextId: "" });
    expect(result.ok).toBe(false);
  });

  it("rejects a missing questionPatternId", () => {
    const result = validateGeneratedQuestion({ ...valid, questionPatternId: "  " });
    expect(result.ok).toBe(false);
  });

  it("rejects an invalid question type", () => {
    const result = validateGeneratedQuestion({ ...valid, questionType: "multiple_choice" });
    expect(result.ok).toBe(false);
  });

  it("rejects empty question text", () => {
    const result = validateGeneratedQuestion({ ...valid, questionText: "   " });
    expect(result.ok).toBe(false);
  });

  it("rejects a missing expected answer", () => {
    const result = validateGeneratedQuestion({ ...valid, expectedAnswer: "" });
    expect(result.ok).toBe(false);
  });

  it("reports every problem at once", () => {
    const result = validateGeneratedQuestion({
      generationContextId: "",
      questionPatternId: "",
      questionType: "nope",
      questionNumber: 0,
      questionText: "",
      expectedAnswer: "",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.length).toBeGreaterThanOrEqual(5);
    }
  });
});
