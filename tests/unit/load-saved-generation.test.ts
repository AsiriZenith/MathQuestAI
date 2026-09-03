import { beforeEach, describe, expect, it, vi } from "vitest";

const findUniqueGenerationContext = vi.fn();
const findManyQuestionPattern = vi.fn();
const findManyQuestionGenerationRequest = vi.fn();
const findManyReferenceQuestion = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    generationContext: { findUnique: (...args: unknown[]) => findUniqueGenerationContext(...args) },
    questionPattern: { findMany: (...args: unknown[]) => findManyQuestionPattern(...args) },
    questionGenerationRequest: {
      findMany: (...args: unknown[]) => findManyQuestionGenerationRequest(...args),
    },
    referenceQuestion: {
      findMany: (...args: unknown[]) => findManyReferenceQuestion(...args),
    },
  },
}));

import { loadSavedGeneration } from "@/lib/db/generation-context";

const SAVED_ROW = {
  id: "ctx-1",
  name: "Generation-2026-01-01-00-00-00-000",
  difficultyLevel: "Medium",
  aiProvider: "deepseek",
  aiModel: "deepseek-chat",
  prompt: "Generate questions about combining like terms.",
  requestedQuestionCount: 10,
  grade: "Grade 6",
  questionTypes: [{ questionType: "mc" }],
  questionPatterns: [
    {
      questionPatternId: "pattern-a",
      questionPattern: {
        id: "pattern-a",
        name: "Combine Like Terms",
        subtopic: {
          id: "subtopic-1",
          name: "Simplify & Calculate",
          topic: { subject: { name: "Mathematics" } },
        },
      },
    },
  ],
  generatedQuestions: [
    {
      questionPatternId: "pattern-a",
      questionType: "mc",
      questionNumber: 1,
      questionText: "Simplify 3x + 5x.",
      expectedAnswer: "8x",
      explanation: "Combine like terms.",
    },
  ],
};

beforeEach(() => {
  findUniqueGenerationContext.mockReset();
  findManyQuestionPattern.mockReset();
  findManyQuestionGenerationRequest.mockReset();
  findManyReferenceQuestion.mockReset();
});

describe("loadSavedGeneration", () => {
  it("returns a safe error when the context does not exist", async () => {
    findUniqueGenerationContext.mockResolvedValue(null);

    const result = await loadSavedGeneration("missing-id");

    expect(result.ok).toBe(false);
  });

  it("reconstructs the context, config, and response from the saved rows", async () => {
    findUniqueGenerationContext.mockResolvedValue(SAVED_ROW);
    findManyQuestionPattern.mockResolvedValue([{ id: "pattern-a", name: "Combine Like Terms" }]);
    findManyQuestionGenerationRequest.mockResolvedValue([
      { questionPatternId: "pattern-a", generationPrompt: "Focus on combining like terms." },
    ]);
    findManyReferenceQuestion.mockResolvedValue([]);

    const result = await loadSavedGeneration("ctx-1");

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.context.subjectName).toBe("Mathematics");
    expect(result.value.context.subtopicName).toBe("Simplify & Calculate");
    expect(result.value.context.difficulty).toBe("medium");
    expect(result.value.context.patterns).toEqual([
      {
        id: "pattern-a",
        name: "Combine Like Terms",
        generationPrompt: "Focus on combining like terms.",
        referenceQuestions: [],
      },
    ]);

    expect(result.value.config.selectedTypes).toEqual(["mc"]);
    expect(result.value.config.selectedPatternIds).toEqual(["pattern-a"]);
    expect(result.value.config.autoTypes).toBe(false);
    expect(result.value.config.autoPatterns).toBe(false);
    expect(result.value.config.subtopicId).toBe("subtopic-1");
    expect(result.value.config.grade).toBe("Grade 6");

    expect(result.value.generationResponse.questions).toEqual([
      {
        questionNumber: 1,
        questionText: "Simplify 3x + 5x.",
        questionType: "mc",
        questionPatternId: "pattern-a",
        correctAnswer: "8x",
        explanation: "Combine like terms.",
      },
    ]);

    expect(result.value.prompt).toBe("Generate questions about combining like terms.");
    // The originally requested count (10), not the number of saved questions (1).
    expect(result.value.requestedQuestionCount).toBe(10);

    // Reuses getGenerationContext's own query path for reference data.
    expect(findManyQuestionPattern).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: { in: ["pattern-a"] }, subtopicId: "subtopic-1" } }),
    );
  });

  it("returns a safe error when the saved record has no patterns", async () => {
    findUniqueGenerationContext.mockResolvedValue({ ...SAVED_ROW, questionPatterns: [] });

    const result = await loadSavedGeneration("ctx-1");

    expect(result.ok).toBe(false);
  });

  it("returns a safe error, without pretending it matches the saved-question count, when requestedQuestionCount is null (legacy record)", async () => {
    findUniqueGenerationContext.mockResolvedValue({ ...SAVED_ROW, requestedQuestionCount: null });

    const result = await loadSavedGeneration("ctx-1");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/question count/i);
    expect(findManyQuestionPattern).not.toHaveBeenCalled();
  });

  it("falls back to a safe placeholder when grade is null (legacy record)", async () => {
    findUniqueGenerationContext.mockResolvedValue({ ...SAVED_ROW, grade: null });
    findManyQuestionPattern.mockResolvedValue([{ id: "pattern-a", name: "Combine Like Terms" }]);
    findManyQuestionGenerationRequest.mockResolvedValue([]);
    findManyReferenceQuestion.mockResolvedValue([]);

    const result = await loadSavedGeneration("ctx-1");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.config.grade).toBe("N/A");
  });
});
