import {
  toDifficultyLevel,
  type DifficultyLevel,
  type GenerationContext,
  type PracticeConfig,
  type QuestionType,
} from "@/lib/types";
import type { GenerationResponse } from "@/lib/prompts/types";
import { buildGenerationName } from "@/lib/persistence/generation-name";
import { isQuestionType, validateGeneratedQuestion } from "@/lib/persistence/validation";
import { resolveSelectedPatternIds, resolveSelectedTypeCodes } from "@/lib/persistence/matching";

/**
 * Pure mapping from a validated AI response + the user's selections into the
 * shape the four persistence tables need (TASK-017 §10). No Prisma, no I/O — so
 * it is exhaustively unit-tested and the persistence service only has to run the
 * transaction.
 *
 * Field mapping:
 *   AI `correctAnswer`     -> `expectedAnswer`
 *   AI `questionType`      -> `questionType` (already the stable code; TASK-019)
 *   AI `questionPatternId` -> `questionPatternId` (returned directly by the AI;
 *                             only validated against the selected ids — never
 *                             resolved from a name, TASK-019 §13)
 *
 * Any question whose type or pattern id is not among the current selections is a
 * hard failure — the caller must not persist a partial generation (§11).
 */

export interface MapGenerationInput {
  generationContext: GenerationContext;
  config: Pick<PracticeConfig, "selectedTypes" | "autoTypes" | "grade">;
  aiResponse: GenerationResponse;
  prompt: string;
  createdAt: Date;
  aiProvider: string;
  aiModel: string;
  /** The number of questions the user asked for — never derived from the AI's actual output (TASK-021). */
  requestedQuestionCount: number;
}

export interface MappedGenerationContext {
  name: string;
  difficultyLevel: DifficultyLevel;
  aiProvider: string;
  aiModel: string;
  prompt: string | null;
  createdAt: Date;
  requestedQuestionCount: number | null;
  grade: string | null;
}

export interface MappedGeneratedQuestion {
  questionPatternId: string;
  questionType: QuestionType;
  questionNumber: number;
  questionText: string;
  expectedAnswer: string;
  explanation: string | null;
}

export interface MappedGeneration {
  context: MappedGenerationContext;
  /** The question type codes selected for this generation (all five when autoTypes). */
  questionTypeCodes: QuestionType[];
  /** The question pattern ids selected for this generation. */
  questionPatternIds: string[];
  questions: MappedGeneratedQuestion[];
}

export type MapGenerationResult =
  | { ok: true; value: MappedGeneration }
  | { ok: false; errors: string[] };

function nonEmpty(value: string | null | undefined): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

export function mapGeneration(input: MapGenerationInput): MapGenerationResult {
  const errors: string[] = [];

  // --- selected question types -------------------------------------------------
  if (!input.config.autoTypes) {
    for (const raw of input.config.selectedTypes) {
      if (!isQuestionType(raw)) {
        errors.push(`Selected question type "${raw}" is not a supported code.`);
      }
    }
  }
  const questionTypeCodes = resolveSelectedTypeCodes(input.config);
  if (questionTypeCodes.length === 0) {
    errors.push("No question types were selected for this generation.");
  }
  const selectedTypeSet = new Set(questionTypeCodes);

  // --- selected question patterns --------------------------------------------
  const questionPatternIds = resolveSelectedPatternIds(input.generationContext);
  const selectedPatternIdSet = new Set(questionPatternIds);
  if (questionPatternIds.length === 0) {
    errors.push("No question patterns were selected for this generation.");
  }

  // --- generated questions --------------------------------------------------
  const questions: MappedGeneratedQuestion[] = [];
  const seenNumbers = new Set<number>();
  for (const q of input.aiResponse.questions) {
    const label = `Question ${q.questionNumber}`;

    if (seenNumbers.has(q.questionNumber)) {
      errors.push(`${label} repeats a question number already used in this generation.`);
    }
    seenNumbers.add(q.questionNumber);

    const questionType = q.questionType;
    if (!isQuestionType(questionType) || !selectedTypeSet.has(questionType)) {
      errors.push(`${label} uses question type "${questionType}" which was not selected.`);
    }

    const questionPatternId = nonEmpty(q.questionPatternId) ?? "";
    if (!questionPatternId) {
      errors.push(`${label} is missing a question pattern id.`);
    } else if (!selectedPatternIdSet.has(questionPatternId)) {
      errors.push(
        `${label} used question pattern id "${questionPatternId}" which was not selected.`,
      );
    }

    const row: MappedGeneratedQuestion = {
      questionPatternId,
      questionType,
      questionNumber: q.questionNumber,
      questionText: q.questionText,
      expectedAnswer: q.correctAnswer,
      explanation: nonEmpty(q.explanation),
    };

    // Reuse the DB-CHECK-mirroring validator. generationContextId is assigned by
    // PostgreSQL inside the transaction, so a non-empty sentinel stands in here.
    const validation = validateGeneratedQuestion({
      generationContextId: "pending",
      questionPatternId: questionPatternId || "unresolved",
      questionType,
      questionNumber: q.questionNumber,
      questionText: q.questionText,
      expectedAnswer: q.correctAnswer,
      explanation: row.explanation,
    });
    if (!validation.ok) {
      for (const err of validation.errors) errors.push(`${label}: ${err}`);
    }

    questions.push(row);
  }

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      context: {
        name: buildGenerationName(input.createdAt),
        difficultyLevel: toDifficultyLevel(input.generationContext.difficulty),
        aiProvider: input.aiProvider,
        aiModel: input.aiModel,
        prompt: nonEmpty(input.prompt),
        createdAt: input.createdAt,
        requestedQuestionCount:
          input.requestedQuestionCount > 0 ? input.requestedQuestionCount : null,
        grade: nonEmpty(input.config.grade),
      },
      questionTypeCodes,
      questionPatternIds,
      questions,
    },
  };
}
