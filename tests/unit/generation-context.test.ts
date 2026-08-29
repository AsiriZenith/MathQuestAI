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

beforeEach(() => {
  findManyQuestionPattern.mockReset();
  findManyQuestionGenerationRequest.mockReset();
  findManyReferenceQuestion.mockReset();
});

describe("getGenerationContext", () => {
  it("returns a safe error when no pattern ids are provided", async () => {
    const result = await getGenerationContext({
      subjectName: "Mathematics",
      subtopicId: "subtopic-1",
      subtopicName: "Simplify & Calculate",
      difficulty: "easy",
      patternIds: [],
    });

    expect(result.ok).toBe(false);
    expect(findManyQuestionPattern).not.toHaveBeenCalled();
  });

  it("returns a safe error when the selected patterns are not available for this subtopic", async () => {
    findManyQuestionPattern.mockResolvedValue([]);

    const result = await getGenerationContext({
      subjectName: "Mathematics",
      subtopicId: "missing-subtopic",
      subtopicName: "Nonexistent",
      difficulty: "easy",
      patternIds: ["pattern-a"],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).not.toMatch(/prisma|postgres|password|connection/i);
    }
  });

  it("scopes the question pattern lookup to the given pattern ids and subtopic", async () => {
    findManyQuestionPattern.mockResolvedValue([PATTERN_A]);
    findManyQuestionGenerationRequest.mockResolvedValue([]);
    findManyReferenceQuestion.mockResolvedValue([]);

    await getGenerationContext({
      subjectName: "Mathematics",
      subtopicId: "subtopic-1",
      subtopicName: "Simplify & Calculate",
      difficulty: "easy",
      patternIds: ["pattern-a"],
    });

    expect(findManyQuestionPattern).toHaveBeenCalledWith({
      where: { id: { in: ["pattern-a"] }, subtopicId: "subtopic-1" },
      select: { id: true, name: true },
    });
  });

  it("queries reference questions and generation requests with the DB's capitalized difficulty", async () => {
    findManyQuestionPattern.mockResolvedValue([PATTERN_A]);
    findManyQuestionGenerationRequest.mockResolvedValue([]);
    findManyReferenceQuestion.mockResolvedValue([]);

    await getGenerationContext({
      subjectName: "Mathematics",
      subtopicId: "subtopic-1",
      subtopicName: "Simplify & Calculate",
      difficulty: "medium",
      patternIds: ["pattern-a"],
    });

    expect(findManyReferenceQuestion).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ difficultyLevel: "Medium" }),
      }),
    );
    expect(findManyQuestionGenerationRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ difficultyLevel: "Medium" }),
      }),
    );
  });

  it("assembles a context with prompt and reference questions merged per selected pattern only", async () => {
    findManyQuestionPattern.mockResolvedValue([PATTERN_A]);
    findManyQuestionGenerationRequest.mockResolvedValue([
      { questionPatternId: "pattern-a", generationPrompt: "Prompt A" },
    ]);
    findManyReferenceQuestion.mockResolvedValue(
      Array.from({ length: 5 }, (_, i) => ({
        id: `ref-${i + 1}`,
        questionPatternId: "pattern-a",
        questionText: `3x + ${i + 1}x = ?`,
        expectedAnswer: `${i + 4}x`,
        explanation: null,
      })),
    );

    const result = await getGenerationContext({
      subjectName: "Mathematics",
      subtopicId: "subtopic-1",
      subtopicName: "Simplify & Calculate",
      difficulty: "easy",
      patternIds: ["pattern-a", "pattern-b"],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.context.patterns).toHaveLength(1);

    const patternA = result.context.patterns.find((p) => p.id === "pattern-a");
    expect(patternA?.generationPrompt).toBe("Prompt A");
    expect(patternA?.referenceQuestions).toHaveLength(5);

    expect(result.context.patterns.find((p) => p.id === "pattern-b")).toBeUndefined();
  });

  it("returns a safe error instead of throwing when the database call fails", async () => {
    findManyQuestionPattern.mockRejectedValue(new Error("connection refused: password auth"));

    const result = await getGenerationContext({
      subjectName: "Mathematics",
      subtopicId: "subtopic-1",
      subtopicName: "Simplify & Calculate",
      difficulty: "hard",
      patternIds: ["pattern-a"],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).not.toMatch(/password|connection refused/i);
    }
  });
});
