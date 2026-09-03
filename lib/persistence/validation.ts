import {
  DIFFICULTY_LEVELS,
  QUESTION_TYPE_CODES,
  type DifficultyLevel,
  type QuestionType,
} from "@/lib/types";

/**
 * Runtime guards + validation for the persistence domain (TASK-016).
 *
 * These mirror the database CHECK constraints so invalid data can be rejected
 * before it ever reaches PostgreSQL:
 *   - `question_type`   IN ('mc','fib','wp','tf','ms')
 *   - `difficulty_level` IN ('Easy','Medium','Hard')
 *   - `question_number` > 0
 *
 * Hand-written on purpose — the actual persistence workflow (and any Zod schema
 * it might need) is a later task.
 */

export function isQuestionType(value: unknown): value is QuestionType {
  return (
    typeof value === "string" &&
    (QUESTION_TYPE_CODES as readonly string[]).includes(value)
  );
}

export function isDifficultyLevel(value: unknown): value is DifficultyLevel {
  return (
    typeof value === "string" &&
    (DIFFICULTY_LEVELS as readonly string[]).includes(value)
  );
}

/** Mirrors evaluateGeneration()'s own promptEffectiveness range — a rounded 0..100 integer (TASK-022). */
export function isValidScore(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 100;
}

export interface GeneratedQuestionInput {
  generationContextId: string;
  questionPatternId: string;
  questionType: string;
  questionNumber: number;
  questionText: string;
  expectedAnswer: string;
  explanation?: string | null;
}

export type ValidationResult = { ok: true } | { ok: false; errors: string[] };

function isNonEmpty(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Validate a candidate GeneratedQuestion before it is persisted. Collects every
 * problem rather than failing on the first.
 */
export function validateGeneratedQuestion(
  input: GeneratedQuestionInput,
): ValidationResult {
  const errors: string[] = [];

  if (!isNonEmpty(input.generationContextId)) {
    errors.push("generationContextId is required.");
  }
  if (!isNonEmpty(input.questionPatternId)) {
    errors.push("questionPatternId is required.");
  }
  if (!isQuestionType(input.questionType)) {
    errors.push(
      `questionType must be one of ${QUESTION_TYPE_CODES.join(", ")}.`,
    );
  }
  if (
    typeof input.questionNumber !== "number" ||
    !Number.isInteger(input.questionNumber) ||
    input.questionNumber <= 0
  ) {
    errors.push("questionNumber must be a positive integer.");
  }
  if (!isNonEmpty(input.questionText)) {
    errors.push("questionText is required.");
  }
  if (!isNonEmpty(input.expectedAnswer)) {
    errors.push("expectedAnswer is required.");
  }

  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}
