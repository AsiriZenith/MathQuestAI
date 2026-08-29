import "server-only";
import { prisma } from "@/lib/prisma";
import {
  toDifficulty,
  toDifficultyLevel,
  type Difficulty,
  type DifficultyLevel,
  type FindMatchingGenerationContextsResult,
  type GenerationContext,
  type GenerationContextResult,
  type PracticeConfig,
  type QuestionType,
} from "@/lib/types";
import type { GenerationResponse } from "@/lib/prompts/types";
import { isExactSetMatch } from "@/lib/persistence/matching";
import { isQuestionType, isValidScore } from "@/lib/persistence/validation";

export async function getGenerationContext(input: {
  subjectName: string;
  subtopicId: string;
  subtopicName: string;
  difficulty: Difficulty;
  patternIds: string[];
}): Promise<GenerationContextResult> {
  try {
    if (input.patternIds.length === 0) {
      return { ok: false, error: "Select at least one question pattern." };
    }

    const patterns = await prisma.questionPattern.findMany({
      where: { id: { in: input.patternIds }, subtopicId: input.subtopicId },
      select: { id: true, name: true },
    });

    if (patterns.length === 0) {
      return { ok: false, error: "No question patterns are available for this subtopic." };
    }

    const patternIds = patterns.map((p) => p.id);
    const difficultyLevel = toDifficultyLevel(input.difficulty);

    const [generationRequests, referenceQuestions] = await Promise.all([
      prisma.questionGenerationRequest.findMany({
        where: { questionPatternId: { in: patternIds }, difficultyLevel },
        select: { questionPatternId: true, generationPrompt: true },
      }),
      prisma.referenceQuestion.findMany({
        where: { questionPatternId: { in: patternIds }, difficultyLevel },
        select: {
          id: true,
          questionPatternId: true,
          questionText: true,
          expectedAnswer: true,
          explanation: true,
        },
      }),
    ]);

    const promptByPattern = new Map(
      generationRequests.map((r) => [r.questionPatternId, r.generationPrompt]),
    );

    return {
      ok: true,
      context: {
        subjectName: input.subjectName,
        subtopicName: input.subtopicName,
        difficulty: input.difficulty,
        patterns: patterns.map((pattern) => ({
          id: pattern.id,
          name: pattern.name,
          generationPrompt: promptByPattern.get(pattern.id) ?? null,
          referenceQuestions: referenceQuestions
            .filter((rq) => rq.questionPatternId === pattern.id)
            .map((rq) => ({
              id: rq.id,
              questionText: rq.questionText,
              expectedAnswer: rq.expectedAnswer,
              explanation: rq.explanation,
            })),
        })),
      },
    };
  } catch {
    return { ok: false, error: "Unable to load question data." };
  }
}

/**
 * Find saved {@link GenerationContext} rows that exactly match a difficulty +
 * question-pattern-id set + question-type set (TASK-020). Difficulty is
 * filtered at the database level; the (typically small) candidate set is then
 * compared in JS with {@link isExactSetMatch} since there is no direct way to
 * express set equality against two join tables in a single Prisma query. A
 * saved context that contains extra or missing patterns/types is excluded —
 * partial matches are never returned. `excludeGenerationContextId` (TASK-022)
 * keeps the currently saved generation from matching itself — applied
 * server-side in the `where` clause, not filtered out in React.
 */
export async function findMatchingGenerationContexts(input: {
  difficultyLevel: DifficultyLevel;
  questionTypeCodes: QuestionType[];
  questionPatternIds: string[];
  excludeGenerationContextId?: string;
}): Promise<FindMatchingGenerationContextsResult> {
  try {
    const candidates = await prisma.generationContext.findMany({
      where: {
        difficultyLevel: input.difficultyLevel,
        ...(input.excludeGenerationContextId
          ? { id: { not: input.excludeGenerationContextId } }
          : {}),
      },
      select: {
        id: true,
        name: true,
        difficultyLevel: true,
        aiProvider: true,
        aiModel: true,
        questionTypes: { select: { questionType: true } },
        questionPatterns: {
          select: { questionPatternId: true, questionPattern: { select: { id: true, name: true } } },
        },
      },
    });

    const contexts = candidates
      .filter((candidate) => {
        const candidateTypeCodes = candidate.questionTypes.map((t) => t.questionType);
        const candidatePatternIds = candidate.questionPatterns.map((p) => p.questionPatternId);
        return (
          isExactSetMatch(input.questionTypeCodes, candidateTypeCodes) &&
          isExactSetMatch(input.questionPatternIds, candidatePatternIds)
        );
      })
      .map((candidate) => ({
        id: candidate.id,
        name: candidate.name,
        difficultyLevel: candidate.difficultyLevel as DifficultyLevel,
        aiProvider: candidate.aiProvider,
        aiModel: candidate.aiModel,
        patterns: candidate.questionPatterns.map((p) => p.questionPattern),
        questionTypes: candidate.questionTypes
          .map((t) => t.questionType)
          .filter(isQuestionType),
      }));

    return { ok: true, contexts };
  } catch {
    return { ok: false, error: "Unable to load saved results." };
  }
}

export interface LoadedSavedGeneration {
  context: GenerationContext;
  config: PracticeConfig;
  generationResponse: GenerationResponse;
  prompt: string | null;
  requestedQuestionCount: number;
}

export type LoadSavedGenerationResult =
  | { ok: true; value: LoadedSavedGeneration }
  | { ok: false; error: string };

/**
 * Reconstruct a saved generation run for evaluation (TASK-020/021).
 * `requestedQuestionCount` and `grade` are persisted on `generation_contexts`
 * (TASK-021) and are read back verbatim — never derived from the number of
 * saved questions or replaced with a placeholder when a real value exists.
 * Records saved before TASK-021 may have `requestedQuestionCount IS NULL`;
 * since there is no honest way to recover the original request, evaluation is
 * blocked for those with a clear message (mirrors `prepareEvaluation`'s
 * existing missing-prompt guard) rather than inventing a number. A missing
 * `grade` falls back to the existing `"N/A"` display placeholder, which is
 * safe because `grade` is display-only and never affects evaluation scoring.
 * Reference questions and generation prompts are re-fetched via the existing
 * {@link getGenerationContext} rather than duplicated here.
 */
export async function loadSavedGeneration(generationContextId: string): Promise<LoadSavedGenerationResult> {
  try {
    const saved = await prisma.generationContext.findUnique({
      where: { id: generationContextId },
      select: {
        id: true,
        name: true,
        difficultyLevel: true,
        aiProvider: true,
        aiModel: true,
        prompt: true,
        requestedQuestionCount: true,
        grade: true,
        questionTypes: { select: { questionType: true } },
        questionPatterns: {
          select: {
            questionPatternId: true,
            questionPattern: {
              select: {
                id: true,
                name: true,
                subtopic: {
                  select: { id: true, name: true, topic: { select: { subject: { select: { name: true } } } } },
                },
              },
            },
          },
        },
        generatedQuestions: {
          select: {
            questionPatternId: true,
            questionType: true,
            questionNumber: true,
            questionText: true,
            expectedAnswer: true,
            explanation: true,
          },
        },
      },
    });

    if (!saved || saved.questionPatterns.length === 0) {
      return { ok: false, error: "This saved generation could not be found." };
    }

    if (saved.requestedQuestionCount == null) {
      return {
        ok: false,
        error:
          "This saved generation's original question count is unavailable. Generate a new set to evaluate it.",
      };
    }

    const { subtopic } = saved.questionPatterns[0].questionPattern;
    const subjectName = subtopic.topic.subject.name;
    const patternIds = saved.questionPatterns.map((p) => p.questionPatternId);
    const difficulty = toDifficulty(saved.difficultyLevel as DifficultyLevel);

    const contextResult = await getGenerationContext({
      subjectName,
      subtopicId: subtopic.id,
      subtopicName: subtopic.name,
      difficulty,
      patternIds,
    });

    if (!contextResult.ok) {
      return { ok: false, error: contextResult.error };
    }

    const questionTypeCodes = saved.questionTypes.map((t) => t.questionType).filter(isQuestionType);

    const config: PracticeConfig = {
      grade: saved.grade ?? "N/A",
      subtopic: subtopic.name,
      subtopicId: subtopic.id,
      difficulty,
      selectedTypes: questionTypeCodes,
      autoTypes: false,
      selectedPatternIds: patternIds,
      autoPatterns: false,
    };

    const generationResponse: GenerationResponse = {
      questions: [...saved.generatedQuestions]
        .sort((a, b) => a.questionNumber - b.questionNumber)
        .map((q) => ({
          questionNumber: q.questionNumber,
          questionText: q.questionText,
          questionType: (isQuestionType(q.questionType) ? q.questionType : "mc") as QuestionType,
          questionPatternId: q.questionPatternId,
          correctAnswer: q.expectedAnswer,
          explanation: q.explanation ?? "",
        })),
    };

    return {
      ok: true,
      value: {
        context: contextResult.context,
        config,
        generationResponse,
        prompt: saved.prompt,
        requestedQuestionCount: saved.requestedQuestionCount,
      },
    };
  } catch {
    return { ok: false, error: "Unable to load this saved generation." };
  }
}

/**
 * Persist a generation's final evaluation score (TASK-022) into the
 * dedicated `score` column added directly to the live database by the
 * project owner (no migration in this repo — same pattern as TASK-021's
 * `requested_question_count`/`grade`). An earlier version of this function
 * stored the score in the `grade` column, which was wrong — it destroyed the
 * real Setup-screen grade value once a context was scored. Corrected once
 * the real `score` column existed.
 */
export async function updateGenerationContextScore(
  generationContextId: string,
  score: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (generationContextId.trim().length === 0) {
    return { ok: false, error: "A generation context id is required to save the score." };
  }
  if (!isValidScore(score)) {
    return { ok: false, error: "The score is not valid." };
  }

  try {
    await prisma.generationContext.update({
      where: { id: generationContextId },
      data: { score },
    });
    return { ok: true };
  } catch {
    return { ok: false, error: "Unable to save the score for this generation." };
  }
}
