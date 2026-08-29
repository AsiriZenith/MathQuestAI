import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GenerationContext } from "@/lib/types";
import type { GenerationResponse } from "@/lib/prompts/types";

const calls: string[] = [];

const generationContextCreate = vi.fn();
const questionTypeCreateMany = vi.fn();
const questionPatternCreateMany = vi.fn();
const generatedQuestionCreateMany = vi.fn();

const tx = {
  generationContext: {
    create: (...args: unknown[]) => {
      calls.push("context");
      return generationContextCreate(...args);
    },
  },
  generationContextQuestionType: {
    createMany: (...args: unknown[]) => {
      calls.push("types");
      return questionTypeCreateMany(...args);
    },
  },
  generationContextQuestionPattern: {
    createMany: (...args: unknown[]) => {
      calls.push("patterns");
      return questionPatternCreateMany(...args);
    },
  },
  generatedQuestion: {
    createMany: (...args: unknown[]) => {
      calls.push("questions");
      return generatedQuestionCreateMany(...args);
    },
  },
};

const $transaction = vi.fn(async (fn: (client: typeof tx) => unknown) => fn(tx));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: (...args: Parameters<typeof $transaction>) => $transaction(...args),
  },
}));

import { saveGeneration } from "@/lib/persistence/save-generation";

const CONTEXT: GenerationContext = {
  subjectName: "Mathematics",
  subtopicName: "Simplify & Calculate",
  difficulty: "medium",
  patterns: [
    { id: "pat-clt", name: "Combine Like Terms", generationPrompt: null, referenceQuestions: [] },
  ],
};

const AI_RESPONSE: GenerationResponse = {
  questions: [
    {
      questionNumber: 1,
      questionText: "Simplify 3x + 5x.",
      questionType: "mc",
      questionPatternId: "pat-clt",
      options: [
        { id: "A", text: "8x" },
        { id: "B", text: "15x" },
      ],
      correctAnswer: "A",
      explanation: "Like terms.",
    },
  ],
};

function goodInput() {
  return {
    generationContext: CONTEXT,
    config: { selectedTypes: ["mc"], autoTypes: false, grade: "Grade 6" },
    aiResponse: AI_RESPONSE,
    prompt: "FINAL PROMPT",
    requestedQuestionCount: 10,
  };
}

beforeEach(() => {
  calls.length = 0;
  vi.clearAllMocks();
  generationContextCreate.mockResolvedValue({ id: "gc-1" });
  questionTypeCreateMany.mockResolvedValue({ count: 1 });
  questionPatternCreateMany.mockResolvedValue({ count: 1 });
  generatedQuestionCreateMany.mockResolvedValue({ count: 1 });
});

describe("saveGeneration", () => {
  it("writes context, then types, then patterns, then questions, in one transaction", async () => {
    const result = await saveGeneration(goodInput());

    expect(result).toEqual({ ok: true, generationContextId: "gc-1", name: expect.stringMatching(/^Generation-/) });
    expect($transaction).toHaveBeenCalledTimes(1);
    expect(calls).toEqual(["context", "types", "patterns", "questions"]);
  });

  it("persists the generated questions against the created context id", async () => {
    await saveGeneration(goodInput());

    const data = generatedQuestionCreateMany.mock.calls[0][0].data;
    expect(data).toEqual([
      {
        generationContextId: "gc-1",
        questionPatternId: "pat-clt",
        questionType: "mc",
        questionNumber: 1,
        questionText: "Simplify 3x + 5x.",
        expectedAnswer: "A",
        explanation: "Like terms.",
      },
    ]);
  });

  it("persists the requested question count and grade on the context", async () => {
    await saveGeneration(goodInput());

    const data = generationContextCreate.mock.calls[0][0].data;
    expect(data.requestedQuestionCount).toBe(10);
    expect(data.grade).toBe("Grade 6");
  });

  it("returns a format-mismatch without opening a transaction when the AI output cannot be resolved", async () => {
    const result = await saveGeneration({
      ...goodInput(),
      aiResponse: {
        questions: [{ ...AI_RESPONSE.questions[0], questionPatternId: "unknown-pattern-id" }],
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("format-mismatch");
      expect(result.details?.join(" ")).toMatch(/unknown-pattern-id/);
    }
    expect($transaction).not.toHaveBeenCalled();
  });

  it("rolls back and returns a safe save-failed error when a write throws", async () => {
    generatedQuestionCreateMany.mockRejectedValue(
      new Error('insert into "generated_questions" violates foreign key; postgres password'),
    );

    const result = await saveGeneration(goodInput());

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("save-failed");
      expect(result.error).not.toMatch(/prisma|postgres|password|connection/i);
    }
  });
});
