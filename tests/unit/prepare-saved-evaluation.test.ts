import { beforeEach, describe, expect, it, vi } from "vitest";

const loadSavedGeneration = vi.fn();

vi.mock("@/lib/db/generation-context", () => ({
  loadSavedGeneration: (...args: unknown[]) => loadSavedGeneration(...args),
}));

import { prepareSavedEvaluation } from "@/lib/evaluation/prepare-evaluation";
import type { GenerationContext, PracticeConfig } from "@/lib/types";
import type { GenerationResponse } from "@/lib/prompts/types";

const CONFIG: PracticeConfig = {
  grade: "N/A",
  subtopic: "Simplify & Calculate",
  subtopicId: "subtopic-1",
  difficulty: "easy",
  selectedTypes: ["mc"],
  autoTypes: false,
  selectedPatternIds: ["pattern-a"],
  autoPatterns: false,
};

const CONTEXT: GenerationContext = {
  subjectName: "Mathematics",
  subtopicName: "Simplify & Calculate",
  difficulty: "easy",
  patterns: [
    {
      id: "pattern-a",
      name: "Combine Like Terms",
      generationPrompt: "Focus on combining like terms.",
      referenceQuestions: [],
    },
  ],
};

const RESPONSE: GenerationResponse = {
  questions: [
    {
      questionNumber: 1,
      questionText: "Simplify 3x + 5x.",
      questionType: "mc",
      questionPatternId: "pattern-a",
      correctAnswer: "8x",
      explanation: "Combine like terms.",
    },
  ],
};

beforeEach(() => {
  loadSavedGeneration.mockReset();
});

describe("prepareSavedEvaluation", () => {
  it("returns a safe error when the saved generation cannot be loaded", async () => {
    loadSavedGeneration.mockResolvedValue({ ok: false, error: "not found" });

    const result = await prepareSavedEvaluation("ctx-1");

    expect(result.ok).toBe(false);
  });

  it("evaluates the reconstructed saved generation, tagged with method 'saved'", async () => {
    loadSavedGeneration.mockResolvedValue({
      ok: true,
      value: {
        context: CONTEXT,
        config: CONFIG,
        generationResponse: RESPONSE,
        prompt: "Generate questions about combining like terms.",
        requestedQuestionCount: 1,
      },
    });

    const result = await prepareSavedEvaluation("ctx-1");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.method).toBe("saved");
    expect(result.data.generationResponse).toEqual(RESPONSE);
    expect(result.data.result.dimensions.length).toBeGreaterThan(0);
    expect(result.data.generationContextId).toBe("ctx-1");
  });

  it("returns a safe error when the saved prompt is missing", async () => {
    loadSavedGeneration.mockResolvedValue({
      ok: true,
      value: {
        context: CONTEXT,
        config: CONFIG,
        generationResponse: RESPONSE,
        prompt: null,
        requestedQuestionCount: 1,
      },
    });

    const result = await prepareSavedEvaluation("ctx-1");

    expect(result.ok).toBe(false);
  });
});
