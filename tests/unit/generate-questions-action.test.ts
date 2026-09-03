import { beforeEach, describe, expect, it, vi } from "vitest";

const generateQuestionsMock = vi.fn();
vi.mock("@/lib/generation/generate-questions", () => ({
  generateQuestions: (...args: unknown[]) => generateQuestionsMock(...args),
}));

import { generateQuestionsAction } from "@/lib/actions/generation";
import type { GenerationContext } from "@/lib/types";

const CONTEXT: GenerationContext = {
  subjectName: "Mathematics",
  subtopicName: "Simplify & Calculate",
  difficulty: "easy",
  patterns: [
    {
      id: "pattern-a",
      name: "Combine Like Terms",
      generationPrompt: "test",
      referenceQuestions: [],
    },
  ],
};

beforeEach(() => {
  generateQuestionsMock.mockReset();
});

describe("generateQuestionsAction", () => {
  it("calls generateQuestions with the given context and question types", async () => {
    generateQuestionsMock.mockResolvedValue({ ok: true, data: { questions: [] } });

    await generateQuestionsAction(CONTEXT, ["mc"]);

    expect(generateQuestionsMock).toHaveBeenCalledWith(CONTEXT, ["mc"]);
  });

  it("does not call generateQuestions when context is null, and returns a safe error", async () => {
    const result = await generateQuestionsAction(null, ["mc"]);

    expect(generateQuestionsMock).not.toHaveBeenCalled();
    expect(result.ok).toBe(false);
  });

  it("passes through a successful result", async () => {
    const data = { questions: [{ questionNumber: 1 }] };
    generateQuestionsMock.mockResolvedValue({ ok: true, data });

    const result = await generateQuestionsAction(CONTEXT, "auto");

    expect(result).toEqual({ ok: true, data });
  });

  it("passes through a failure result unchanged", async () => {
    generateQuestionsMock.mockResolvedValue({
      ok: false,
      stage: "provider",
      error: "Unable to reach the Gemini API.",
    });

    const result = await generateQuestionsAction(CONTEXT, ["mc"]);

    expect(result).toEqual({
      ok: false,
      stage: "provider",
      error: "Unable to reach the Gemini API.",
    });
  });
});
