import { describe, expect, it } from "vitest";
import { buildPrompt } from "@/lib/prompts/builder";
import type { GenerationContext } from "@/lib/types";
import type { PromptRequest } from "@/lib/prompts/types";

const CONTEXT: GenerationContext = {
  subjectName: "Mathematics",
  subtopicName: "Simplify & Calculate",
  difficulty: "hard",
  patterns: [
    {
      id: "pattern-a",
      name: "Combine Like Terms",
      generationPrompt: "Focus on combining like terms across multiple steps.",
      referenceQuestions: [
        {
          id: "ref-1",
          questionText: "Simplify 3x + 5x - 2x.",
          expectedAnswer: "6x",
          explanation: "Combine the coefficients of x.",
        },
      ],
    },
    {
      id: "pattern-b",
      name: "Apply Distributive Property",
      generationPrompt: null,
      referenceQuestions: [],
    },
  ],
};

function makeRequest(overrides: Partial<PromptRequest> = {}): PromptRequest {
  return {
    context: CONTEXT,
    questionTypes: ["multiple_choice"],
    questionCount: 5,
    ...overrides,
  };
}

describe("buildPrompt", () => {
  it("includes the common generation instructions", () => {
    const prompt = buildPrompt(makeRequest());
    expect(prompt).toMatch(/Generate exactly the requested number of questions/);
  });

  it("includes the requested question count", () => {
    const prompt = buildPrompt(makeRequest({ questionCount: 7 }));
    expect(prompt).toMatch(/Generate 7 questions/);
  });

  it("includes the subject and subtopic", () => {
    const prompt = buildPrompt(makeRequest());
    expect(prompt).toContain("Mathematics");
    expect(prompt).toContain("Simplify & Calculate");
  });

  it("includes all selected question patterns without implying every one is mandatory per question", () => {
    const prompt = buildPrompt(makeRequest());
    expect(prompt).toContain("Combine Like Terms");
    expect(prompt).toContain("Apply Distributive Property");
    expect(prompt).not.toMatch(/every question must (use|include) all/i);
  });

  it("includes the difficulty guidance matching the selected level", () => {
    const prompt = buildPrompt(makeRequest());
    expect(prompt).toMatch(/multiple connected steps/i);
  });

  it("includes the pattern-specific generation prompt when available", () => {
    const prompt = buildPrompt(makeRequest());
    expect(prompt).toContain("Focus on combining like terms across multiple steps.");
  });

  it("includes reference questions from the context", () => {
    const prompt = buildPrompt(makeRequest());
    expect(prompt).toContain("Simplify 3x + 5x - 2x.");
  });

  it("explicitly includes a single selected question type", () => {
    const prompt = buildPrompt(makeRequest({ questionTypes: ["multiple_choice"] }));
    expect(prompt).toMatch(/Multiple Choice/);
  });

  it("explicitly includes multiple selected question types", () => {
    const prompt = buildPrompt(
      makeRequest({ questionTypes: ["multiple_choice", "word_problem"] }),
    );
    expect(prompt).toMatch(/Multiple Choice/);
    expect(prompt).toMatch(/Word Problem/);
  });

  it("lists all available question types when 'auto' is requested", () => {
    const prompt = buildPrompt(makeRequest({ questionTypes: "auto" }));
    expect(prompt).toMatch(/Multiple Choice/);
    expect(prompt).toMatch(/Fill in the Blank/);
    expect(prompt).toMatch(/True \/ False/);
  });

  it("includes the required output format instructions", () => {
    const prompt = buildPrompt(makeRequest());
    expect(prompt).toMatch(/Return ONLY valid JSON/);
    expect(prompt).toContain('"questionNumber"');
  });

  it("is deterministic for the same input", () => {
    const request = makeRequest();
    expect(buildPrompt(request)).toBe(buildPrompt(request));
  });
});
