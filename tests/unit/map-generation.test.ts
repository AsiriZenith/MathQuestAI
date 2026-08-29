import { describe, expect, it } from "vitest";
import { mapGeneration, type MapGenerationInput } from "@/lib/persistence/map-generation";
import { QUESTION_TYPE_CODES } from "@/lib/types";
import type { GenerationContext } from "@/lib/types";
import type { GeneratedQuestion } from "@/lib/prompts/types";

const CREATED_AT = new Date("2026-08-29T04:30:15.123Z");

const CONTEXT: GenerationContext = {
  subjectName: "Mathematics",
  subtopicName: "Simplify & Calculate",
  difficulty: "medium",
  patterns: [
    { id: "pat-clt", name: "Combine Like Terms", generationPrompt: null, referenceQuestions: [] },
    { id: "pat-dist", name: "Apply Distributive Property", generationPrompt: null, referenceQuestions: [] },
  ],
};

function question(overrides: Partial<GeneratedQuestion> = {}): GeneratedQuestion {
  return {
    questionNumber: 1,
    questionText: "Simplify 3x + 5x.",
    questionType: "mc",
    questionPatternId: "pat-clt",
    options: [
      { id: "A", text: "8x" },
      { id: "B", text: "15x" },
    ],
    correctAnswer: "A",
    explanation: "3x and 5x are like terms.",
    ...overrides,
  };
}

function input(overrides: Partial<MapGenerationInput> = {}): MapGenerationInput {
  return {
    generationContext: CONTEXT,
    config: { selectedTypes: ["mc"], autoTypes: false, grade: "Grade 6" },
    aiResponse: { questions: [question()] },
    prompt: "FINAL PROMPT",
    createdAt: CREATED_AT,
    aiProvider: "groq",
    aiModel: "openai/gpt-oss-120b",
    requestedQuestionCount: 10,
    ...overrides,
  };
}

describe("mapGeneration", () => {
  it("maps a valid generation into persistence-ready rows", () => {
    const result = mapGeneration(input());
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.context).toMatchObject({
      name: "Generation-2026-08-29-04-30-15-123",
      difficultyLevel: "Medium",
      aiProvider: "groq",
      aiModel: "openai/gpt-oss-120b",
      prompt: "FINAL PROMPT",
      createdAt: CREATED_AT,
      requestedQuestionCount: 10,
      grade: "Grade 6",
    });
    expect(result.value.questionTypeCodes).toEqual(["mc"]);
    // every selected pattern is persisted, not only the ones a question used
    expect(result.value.questionPatternIds).toEqual(["pat-clt", "pat-dist"]);
    expect(result.value.questions).toEqual([
      {
        questionPatternId: "pat-clt",
        questionType: "mc",
        questionNumber: 1,
        questionText: "Simplify 3x + 5x.",
        expectedAnswer: "A",
        explanation: "3x and 5x are like terms.",
      },
    ]);
  });

  it("maps correctAnswer to expectedAnswer", () => {
    const result = mapGeneration(
      input({ aiResponse: { questions: [question({ correctAnswer: "8x" })] } }),
    );
    expect(result.ok && result.value.questions[0].expectedAnswer).toBe("8x");
  });

  it("uses the AI-supplied questionType code directly", () => {
    const result = mapGeneration(
      input({
        config: { selectedTypes: [], autoTypes: true, grade: "Grade 6" },
        aiResponse: { questions: [question({ questionType: "wp", options: undefined })] },
      }),
    );
    expect(result.ok && result.value.questions[0].questionType).toBe("wp");
  });

  it("uses the AI-supplied questionPatternId directly — no name matching", () => {
    const result = mapGeneration(
      input({ aiResponse: { questions: [question({ questionPatternId: "pat-dist" })] } }),
    );
    expect(result.ok && result.value.questions[0].questionPatternId).toBe("pat-dist");
  });

  it("fails when a pattern NAME is sent in questionPatternId", () => {
    const result = mapGeneration(
      input({ aiResponse: { questions: [question({ questionPatternId: "Combine Like Terms" })] } }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(" ")).toMatch(/Combine Like Terms/);
  });

  it("fails when a question has no questionPatternId", () => {
    const result = mapGeneration(
      input({ aiResponse: { questions: [question({ questionPatternId: "" })] } }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(" ")).toMatch(/pattern id/i);
  });

  it("fails when the questionPatternId was not one of the selected patterns", () => {
    const result = mapGeneration(
      input({ aiResponse: { questions: [question({ questionPatternId: "pat-unknown" })] } }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(" ")).toMatch(/pat-unknown/);
  });

  it("persists all five type codes when autoTypes is set", () => {
    const result = mapGeneration(input({ config: { selectedTypes: [], autoTypes: true, grade: "Grade 6" } }));
    expect(result.ok && result.value.questionTypeCodes).toEqual([...QUESTION_TYPE_CODES]);
  });

  it("persists exactly the explicitly selected type codes", () => {
    const result = mapGeneration(
      input({
        config: { selectedTypes: ["mc", "fib", "mc"], autoTypes: false, grade: "Grade 6" },
        aiResponse: { questions: [question()] },
      }),
    );
    expect(result.ok && result.value.questionTypeCodes).toEqual(["mc", "fib"]);
  });

  it("fails when a generated question uses a type that was not selected", () => {
    const result = mapGeneration(
      input({
        config: { selectedTypes: ["fib"], autoTypes: false, grade: "Grade 6" },
        aiResponse: { questions: [question()] }, // mc, not selected
      }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(" ")).toMatch(/not selected|mc/i);
  });

  it("preserves questionNumber and questionText, and allows a null explanation", () => {
    const result = mapGeneration(
      input({
        aiResponse: {
          questions: [
            question({ questionNumber: 7, questionText: "What is 2x + 2x?", explanation: "  " }),
          ],
        },
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.questions[0].questionNumber).toBe(7);
    expect(result.value.questions[0].questionText).toBe("What is 2x + 2x?");
    expect(result.value.questions[0].explanation).toBeNull();
  });

  it("fails when two questions share a questionNumber", () => {
    const result = mapGeneration(
      input({
        aiResponse: {
          questions: [question({ questionNumber: 1 }), question({ questionNumber: 1 })],
        },
      }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(" ")).toMatch(/number/i);
  });

  it("stores a null prompt when the prompt is blank", () => {
    const result = mapGeneration(input({ prompt: "   " }));
    expect(result.ok && result.value.context.prompt).toBeNull();
  });

  it("stores a null grade when the grade is blank", () => {
    const result = mapGeneration(
      input({ config: { selectedTypes: ["mc"], autoTypes: false, grade: "  " } }),
    );
    expect(result.ok && result.value.context.grade).toBeNull();
  });

  it("does not derive requestedQuestionCount from the number of generated questions", () => {
    // AI returned only 1 question, but 10 were originally requested.
    const result = mapGeneration(input({ requestedQuestionCount: 10 }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.questions).toHaveLength(1);
    expect(result.value.context.requestedQuestionCount).toBe(10);
  });

  it("stores a null requestedQuestionCount when it is not a positive number", () => {
    const result = mapGeneration(input({ requestedQuestionCount: 0 }));
    expect(result.ok && result.value.context.requestedQuestionCount).toBeNull();
  });

  it("collects multiple problems in one pass", () => {
    const result = mapGeneration(
      input({
        aiResponse: {
          questions: [
            question({ questionNumber: 1, questionPatternId: "" }),
            question({ questionNumber: 2, questionPatternId: "pat-unknown" }),
          ],
        },
      }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });
});
