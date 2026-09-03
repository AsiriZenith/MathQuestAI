import type { DifficultyLevel, QuestionType } from "@/lib/types";

/**
 * Domain entities for question-generation persistence (TASK-016).
 *
 * These mirror the four PostgreSQL tables (`generation_contexts`,
 * `generation_context_question_types`, `generation_context_question_patterns`,
 * `generated_questions`) and their Prisma models, but expose plain application
 * types — no Prisma imports — so the rest of the app never depends on the
 * generated client's shapes.
 *
 * They carry the `*Record` suffix because the bare names `GenerationContext`
 * (the prompt-builder's educational context, `lib/types.ts`) and
 * `GeneratedQuestion` (a question in the AI response, `lib/prompts/types.ts`)
 * are already taken by the two upstream layers.
 *
 * Layering (task §7):
 *
 *   AI Response            Domain / DB
 *   ----------------       -----------------------
 *   GeneratedQuestion  ->  GeneratedQuestionRecord
 *     questionText      ->   questionText
 *     correctAnswer     ->   expectedAnswer
 *     explanation       ->   explanation
 *     questionNumber    ->   questionNumber
 *     questionType      ->   questionType       (already a stable code)
 *     questionPatternId ->   questionPatternId  (returned by the AI, validated
 *                                                against the selected ids — no
 *                                                name resolution, TASK-019)
 *
 * The mapping lives in `lib/persistence/map-generation.ts`.
 */

/** A persisted generation run: the context a batch of questions was produced from. */
export interface GenerationContextRecord {
  id: string;
  name: string;
  difficultyLevel: DifficultyLevel;
  aiProvider: string;
  aiModel: string;
  prompt?: string | null;
  createdAt: Date;
}

/** A question type selected for a generation context. */
export interface GenerationContextQuestionTypeRecord {
  id: string;
  generationContextId: string;
  questionType: QuestionType;
}

/** A question pattern selected for a generation context. */
export interface GenerationContextQuestionPatternRecord {
  id: string;
  generationContextId: string;
  questionPatternId: string;
}

/** One persisted AI-generated question belonging to a generation context. */
export interface GeneratedQuestionRecord {
  id: string;
  generationContextId: string;
  questionPatternId: string;
  questionType: QuestionType;
  questionNumber: number;
  questionText: string;
  expectedAnswer: string;
  explanation?: string | null;
  createdAt: Date;
}
