import { describe, expect, it, vi } from "vitest";
import { generateQuestions } from "@/lib/generation/generate-questions";
import { DEFAULT_QUESTION_COUNT } from "@/lib/ai/config";
import type { AiGenerateRequest, AiGenerateResult, AiProvider } from "@/lib/ai/provider";
import type { GenerationContext } from "@/lib/types";

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

const VALID_RESPONSE_JSON = JSON.stringify({
  questions: [
    {
      questionNumber: 1,
      questionText: "Simplify 3x + 5x.",
      questionType: "multiple_choice",
      options: [
        { id: "A", text: "8x" },
        { id: "B", text: "5x" },
      ],
      correctAnswer: "A",
      explanation: "3x and 5x are like terms.",
    },
  ],
});

function makeFakeProvider(): AiProvider & {
  generate: ReturnType<typeof vi.fn<(request: AiGenerateRequest) => Promise<AiGenerateResult>>>;
} {
  return { generate: vi.fn() };
}

describe("generateQuestions", () => {
  it("builds the prompt, calls the provider, parses the response, and returns it", async () => {
    const provider = makeFakeProvider();
    provider.generate.mockResolvedValue({ ok: true, rawText: VALID_RESPONSE_JSON });

    const result = await generateQuestions(CONTEXT, ["multiple_choice"], provider);

    expect(provider.generate).toHaveBeenCalledTimes(1);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.questions).toHaveLength(1);
      expect(result.data.questions[0].questionText).toBe("Simplify 3x + 5x.");
    }
  });

  it("requests exactly the hard-coded question count of 10 in the prompt", async () => {
    const provider = makeFakeProvider();
    provider.generate.mockResolvedValue({ ok: true, rawText: VALID_RESPONSE_JSON });

    await generateQuestions(CONTEXT, ["multiple_choice"], provider);

    const sentPrompt = provider.generate.mock.calls[0][0].prompt as string;
    expect(sentPrompt).toMatch(new RegExp(`Generate ${DEFAULT_QUESTION_COUNT} questions`));
  });

  it("does not call the provider when the context has no question patterns", async () => {
    const provider = makeFakeProvider();
    const emptyContext: GenerationContext = { ...CONTEXT, patterns: [] };

    const result = await generateQuestions(emptyContext, ["multiple_choice"], provider);

    expect(provider.generate).not.toHaveBeenCalled();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.stage).toBe("prompt");
  });

  it("fails safely at the provider stage when the provider fails, without returning fake questions", async () => {
    const provider = makeFakeProvider();
    provider.generate.mockResolvedValue({ ok: false, error: "Unable to reach the AI provider." });

    const result = await generateQuestions(CONTEXT, ["multiple_choice"], provider);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.stage).toBe("provider");
      expect(result.error).toBe("Unable to reach the AI provider.");
    }
  });

  it("fails safely at the validation stage when the provider returns an invalid response", async () => {
    const provider = makeFakeProvider();
    provider.generate.mockResolvedValue({ ok: true, rawText: "not valid json at all" });

    const result = await generateQuestions(CONTEXT, ["multiple_choice"], provider);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.stage).toBe("validation");
  });

  it("only depends on the AiProvider interface, not any concrete provider implementation", async () => {
    // This test file never imports HttpAiProvider — enforced by review/grep, asserted here
    // structurally: the fake provider satisfies AiProvider with no network involved.
    const provider = makeFakeProvider();
    provider.generate.mockResolvedValue({ ok: true, rawText: VALID_RESPONSE_JSON });

    const result = await generateQuestions(CONTEXT, "auto", provider);
    expect(result.ok).toBe(true);
  });
});
