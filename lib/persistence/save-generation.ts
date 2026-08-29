import "server-only";
import { prisma } from "@/lib/prisma";
import { mapGeneration } from "@/lib/persistence/map-generation";
import { getAiModel, getAiProvider } from "@/lib/ai/config";
import type { GenerationContext, PracticeConfig } from "@/lib/types";
import type { GenerationResponse } from "@/lib/prompts/types";

/**
 * Persist one complete generation run (TASK-017 §5, §12).
 *
 * A `format-mismatch` is decided by {@link mapGeneration} before any database
 * write — a generation whose AI output cannot be resolved to the selected
 * patterns / types writes nothing at all. Everything that does reach PostgreSQL
 * goes through a single interactive transaction, so a failure at any step rolls
 * the whole batch back.
 */

export type SaveGenerationResult =
  | { ok: true; generationContextId: string; name: string }
  | {
      ok: false;
      reason: "format-mismatch" | "save-failed";
      error: string;
      details?: string[];
    };

export async function saveGeneration(input: {
  generationContext: GenerationContext;
  config: Pick<PracticeConfig, "selectedTypes" | "autoTypes" | "grade">;
  aiResponse: GenerationResponse;
  prompt: string;
  requestedQuestionCount: number;
}): Promise<SaveGenerationResult> {
  const createdAt = new Date();

  const mapped = mapGeneration({
    generationContext: input.generationContext,
    config: input.config,
    aiResponse: input.aiResponse,
    prompt: input.prompt,
    createdAt,
    aiProvider: getAiProvider(),
    aiModel: getAiModel(),
    requestedQuestionCount: input.requestedQuestionCount,
  });

  if (!mapped.ok) {
    console.error("saveGeneration: format mismatch, nothing persisted", mapped.errors);
    return {
      ok: false,
      reason: "format-mismatch",
      error:
        "The generated questions do not match the expected format and were not saved.",
      details: mapped.errors,
    };
  }

  const { context, questionTypeCodes, questionPatternIds, questions } = mapped.value;

  try {
    const generationContextId = await prisma.$transaction(async (tx) => {
      const created = await tx.generationContext.create({
        data: {
          name: context.name,
          difficultyLevel: context.difficultyLevel,
          aiProvider: context.aiProvider,
          aiModel: context.aiModel,
          prompt: context.prompt,
          createdAt: context.createdAt,
          requestedQuestionCount: context.requestedQuestionCount,
          grade: context.grade,
        },
        select: { id: true },
      });

      // Order matters: the composite foreign keys on `generated_questions`
      // require the selected type / pattern rows to exist first.
      await tx.generationContextQuestionType.createMany({
        data: questionTypeCodes.map((questionType) => ({
          generationContextId: created.id,
          questionType,
        })),
      });

      await tx.generationContextQuestionPattern.createMany({
        data: questionPatternIds.map((questionPatternId) => ({
          generationContextId: created.id,
          questionPatternId,
        })),
      });

      await tx.generatedQuestion.createMany({
        data: questions.map((q) => ({
          generationContextId: created.id,
          questionPatternId: q.questionPatternId,
          questionType: q.questionType,
          questionNumber: q.questionNumber,
          questionText: q.questionText,
          expectedAnswer: q.expectedAnswer,
          explanation: q.explanation,
        })),
      });

      return created.id;
    });

    return { ok: true, generationContextId, name: context.name };
  } catch (error) {
    console.error("saveGeneration: persistence failed", error);
    return {
      ok: false,
      reason: "save-failed",
      error: "The generated questions could not be saved. Please try again.",
    };
  }
}
