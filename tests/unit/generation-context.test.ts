import { beforeEach, describe, expect, it, vi } from "vitest";

const findManyQuestionPattern = vi.fn();
const findManyQuestionGenerationRequest = vi.fn();
const findManyReferenceQuestion = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    questionPattern: { findMany: (...args: unknown[]) => findManyQuestionPattern(...args) },
    questionGenerationRequest: {
      findMany: (...args: unknown[]) => findManyQuestionGenerationRequest(...args),
    },
    referenceQuestion: {
      findMany: (...args: unknown[]) => findManyReferenceQuestion(...args),
    },
  },
}));

import { getGenerationContext } from "@/lib/db/generation-context";

const PATTERN_A = { id: "pattern-a", name: "Combine Like Terms" };
const PATTERN_B = { id: "pattern-b", name: "Apply Distributive Property" };

beforeEach(() => {
  findManyQuestionPattern.mockReset();
  findManyQuestionGenerationRequest.mockReset();
  findManyReferenceQuestion.mockReset();
});

describe("getGenerationContext", () => {
  it("returns a safe error when the subtopic has no question patterns", async () => {
    findManyQuestionPattern.mockResolvedValue([]);

    const result = await getGenerationContext({
      subjectName: "Mathematics",
      subtopicId: "missing-subtopic",
      subtopicName: "Nonexistent",
      difficulty: "easy",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).not.toMatch(/prisma|postgres|password|connection/i);
    }
  });

  it("assembles a context with prompt and reference questions merged per pattern", async () => {
    findManyQuestionPattern.mockResolvedValue([PATTERN_A, PATTERN_B]);
    findManyQuestionGenerationRequest.mockResolvedValue([
      { questionPatternId: "pattern-a", generationPrompt: "Prompt A" },
    ]);
    findManyReferenceQuestion.mockResolvedValue([
      {
        id: "ref-1",
        questionPatternId: "pattern-a",
        questionText: "3x + 2x = ?",
        expectedAnswer: "5x",
        explanation: null,
      },
    ]);

    const result = await getGenerationContext({
      subjectName: "Mathematics",
      subtopicId: "subtopic-1",
      subtopicName: "Simplify / Calculate",
      difficulty: "easy",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.context.patterns).toHaveLength(2);

    const patternA = result.context.patterns.find((p) => p.id === "pattern-a");
    expect(patternA?.generationPrompt).toBe("Prompt A");
    expect(patternA?.referenceQuestions).toHaveLength(1);

    const patternB = result.context.patterns.find((p) => p.id === "pattern-b");
    expect(patternB?.generationPrompt).toBeNull();
    expect(patternB?.referenceQuestions).toHaveLength(0);
  });

  it("returns a safe error instead of throwing when the database call fails", async () => {
    findManyQuestionPattern.mockRejectedValue(new Error("connection refused: password auth"));

    const result = await getGenerationContext({
      subjectName: "Mathematics",
      subtopicId: "subtopic-1",
      subtopicName: "Simplify / Calculate",
      difficulty: "hard",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).not.toMatch(/password|connection refused/i);
    }
  });
});
