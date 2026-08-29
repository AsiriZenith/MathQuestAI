import { describe, expect, it } from "vitest";
import { prepareEvaluation } from "@/lib/evaluation/prepare-evaluation";
import type { GenerationContext, PracticeConfig } from "@/lib/types";
import type { GenerationResponse } from "@/lib/prompts/types";

const CONFIG: PracticeConfig = {
  grade: "Grade 6",
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
      options: [
        { id: "A", text: "8x" },
        { id: "B", text: "5x" },
      ],
      correctAnswer: "A",
      explanation: "3x and 5x are like terms, so add their coefficients.",
    },
  ],
};

const PROMPT = [
  "GENERATION REQUIREMENT\n----------------------\nGenerate 1 questions.",
  'EDUCATIONAL CONTEXT\n-------------------\nSELECTED QUESTION PATTERNS\n\n1.\n   ID: pattern-a\n   Name: Combine Like Terms\n\nSet the "questionPatternId" field to the exact ID shown above.',
  "OUTPUT FORMAT\n-------------\nReturn ONLY valid JSON.",
].join("\n\n");

const INPUT = {
  method: "predefined" as const,
  config: CONFIG,
  generationContext: CONTEXT,
  generationResponse: RESPONSE,
  prompt: PROMPT,
  requestedQuestionCount: 1,
  generationContextId: "ctx-1",
};

describe("prepareEvaluation", () => {
  it("returns the session data alongside a computed evaluation result", async () => {
    const result = await prepareEvaluation(INPUT);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.method).toBe("predefined");
    expect(result.data.config).toEqual(CONFIG);
    expect(result.data.generationContext).toEqual(CONTEXT);
    expect(result.data.generationResponse).toEqual(RESPONSE);
    expect(result.data.prompt).toBe(PROMPT);
    expect(result.data.result.promptEffectiveness).toBeGreaterThan(0);
    expect(result.data.result.dimensions.length).toBeGreaterThan(0);
    expect(result.data.generationContextId).toBe("ctx-1");
  });

  it("carries a null generationContextId through when the current generation hasn't been saved", async () => {
    const result = await prepareEvaluation({ ...INPUT, generationContextId: null });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.generationContextId).toBeNull();
  });

  it("returns a safe error when there are no generated questions to evaluate", async () => {
    const result = await prepareEvaluation({
      ...INPUT,
      generationResponse: { questions: [] },
    });

    expect(result.ok).toBe(false);
  });

  it("returns a safe error when the generation prompt was not preserved", async () => {
    const result = await prepareEvaluation({ ...INPUT, prompt: "   " });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/prompt/i);
    }
  });
});
