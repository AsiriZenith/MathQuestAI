import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GenerationContext, GenerationMeta, PracticeConfig } from "@/lib/types";
import type { GenerationResponse } from "@/lib/prompts/types";

const saveGenerationMock = vi.fn();
vi.mock("@/lib/persistence/save-generation", () => ({
  saveGeneration: (...args: unknown[]) => saveGenerationMock(...args),
}));

import { saveGenerationAction } from "@/lib/actions/save-generation";

const CONFIG: PracticeConfig = {
  grade: "Grade 6",
  subtopic: "Simplify & Calculate",
  subtopicId: "st-1",
  difficulty: "easy",
  selectedTypes: ["mc"],
  autoTypes: false,
  selectedPatternIds: ["pat-a"],
  autoPatterns: false,
};

const GENERATION_CONTEXT: GenerationContext = {
  subjectName: "Mathematics",
  subtopicName: "Simplify & Calculate",
  difficulty: "easy",
  patterns: [
    { id: "pat-a", name: "Combine Like Terms", generationPrompt: null, referenceQuestions: [] },
  ],
};

const GENERATION_RESPONSE: GenerationResponse = {
  questions: [
    {
      questionNumber: 1,
      questionText: "Simplify 3x + 5x.",
      questionType: "mc",
      questionPatternId: "pat-a",
      options: [
        { id: "A", text: "8x" },
        { id: "B", text: "15x" },
      ],
      correctAnswer: "A",
      explanation: "Like terms.",
    },
  ],
};

const GENERATION_META: GenerationMeta = { prompt: "FINAL PROMPT", requestedQuestionCount: 10 };

function input(overrides: Partial<Parameters<typeof saveGenerationAction>[0]> = {}) {
  return {
    config: CONFIG,
    generationContext: GENERATION_CONTEXT,
    generationResponse: GENERATION_RESPONSE,
    generationMeta: GENERATION_META,
    ...overrides,
  };
}

const GENERIC_ERROR = "We couldn't save the questions for evaluation. Please try again.";

beforeEach(() => {
  saveGenerationMock.mockReset();
});

describe("saveGenerationAction", () => {
  it("forwards the session data to the persistence service and returns the new id", async () => {
    saveGenerationMock.mockResolvedValue({ ok: true, generationContextId: "gc-1", name: "Generation-x" });

    const result = await saveGenerationAction(input());

    expect(saveGenerationMock).toHaveBeenCalledTimes(1);
    expect(saveGenerationMock).toHaveBeenCalledWith({
      generationContext: GENERATION_CONTEXT,
      config: CONFIG,
      aiResponse: GENERATION_RESPONSE,
      prompt: "FINAL PROMPT",
      requestedQuestionCount: 10,
    });
    expect(result).toEqual({ ok: true, generationContextId: "gc-1" });
  });

  it.each(["config", "generationContext", "generationResponse", "generationMeta"] as const)(
    "returns a safe error without calling the service when %s is missing",
    async (missing) => {
      const result = await saveGenerationAction(input({ [missing]: null }));

      expect(saveGenerationMock).not.toHaveBeenCalled();
      expect(result).toEqual({ ok: false, error: GENERIC_ERROR });
    },
  );

  it.each(["save-failed", "format-mismatch"] as const)(
    "maps a %s service failure to the generic user-facing error",
    async (reason) => {
      saveGenerationMock.mockResolvedValue({
        ok: false,
        reason,
        error: "internal detail: insert into generated_questions failed; postgres",
        details: ["Question 1 references pattern \"X\""],
      });

      const result = await saveGenerationAction(input());

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe(GENERIC_ERROR);
        expect(result.error).not.toMatch(/prisma|postgres|password|stack|insert into/i);
      }
    },
  );
});
