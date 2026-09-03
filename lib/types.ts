import type { LucideIcon } from "lucide-react";
import type { GenerationResponse } from "@/lib/prompts/types";
// Type-only import: erased at compile time, so the mutual reference with
// lib/evaluation/types.ts creates no runtime cycle.
import type { ComparisonResult, EvaluationResult } from "@/lib/evaluation/types";

export type Difficulty = "easy" | "medium" | "hard";

/**
 * Difficulty as stored in the database / used in the persistence domain — the
 * capitalized spelling the `Easy` / `Medium` / `Hard` CHECK constraints and the
 * seeded `reference_questions` / `question_generation_requests` rows use.
 *
 * The lowercase {@link Difficulty} above is the UI/prompt-builder form;
 * `DIFFICULTY_DB_VALUE` in `lib/db/generation-context.ts` maps between them.
 */
export const DIFFICULTY_LEVELS = ["Easy", "Medium", "Hard"] as const;
export type DifficultyLevel = (typeof DIFFICULTY_LEVELS)[number];

/**
 * Map the lowercase UI/prompt-builder {@link Difficulty} to the capitalized
 * {@link DifficultyLevel} the database stores (and the seeded
 * `reference_questions` / `question_generation_requests` rows use).
 */
export function toDifficultyLevel(difficulty: Difficulty): DifficultyLevel {
  const map: Record<Difficulty, DifficultyLevel> = {
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
  };
  return map[difficulty];
}

/** Inverse of {@link toDifficultyLevel} — the DB's capitalized form back to the UI/prompt-builder form. */
export function toDifficulty(difficultyLevel: DifficultyLevel): Difficulty {
  const map: Record<DifficultyLevel, Difficulty> = {
    Easy: "easy",
    Medium: "medium",
    Hard: "hard",
  };
  return map[difficultyLevel];
}

export interface PracticeConfig {
  grade: string;
  subtopic: string;
  subtopicId: string;
  difficulty: Difficulty;
  selectedTypes: string[];
  autoTypes: boolean;
  selectedPatternIds: string[];
  autoPatterns: boolean;
}

export interface SubjectRecord {
  id: string;
  name: string;
}

export interface TopicRecord {
  id: string;
  name: string;
}

export interface SubtopicRecord {
  id: string;
  name: string;
}

export interface QuestionPatternOption {
  id: string;
  name: string;
}

export type QuestionPatternsResult =
  | { ok: true; patterns: QuestionPatternOption[] }
  | { ok: false; error: string };

export interface SubjectWithSubtopics {
  subject: SubjectRecord;
  topic: TopicRecord;
  subtopics: SubtopicRecord[];
}

export interface GenerationContextReferenceQuestion {
  id: string;
  questionText: string;
  expectedAnswer: string;
  explanation: string | null;
}

export interface GenerationContextPattern {
  id: string;
  name: string;
  generationPrompt: string | null;
  referenceQuestions: GenerationContextReferenceQuestion[];
}

export interface GenerationContext {
  subjectName: string;
  subtopicName: string;
  difficulty: Difficulty;
  patterns: GenerationContextPattern[];
}

export type GenerationContextResult =
  | { ok: true; context: GenerationContext }
  | { ok: false; error: string };

/**
 * A saved {@link GenerationContext} row shown in the "Compare with Previous
 * Generations" table (TASK-020) — display data only, matched exactly by
 * difficulty + question-pattern-id set + question-type set.
 */
export interface MatchingGenerationContext {
  id: string;
  name: string;
  difficultyLevel: DifficultyLevel;
  aiProvider: string;
  aiModel: string;
  patterns: { id: string; name: string }[];
  questionTypes: QuestionType[];
}

export type FindMatchingGenerationContextsResult =
  | { ok: true; contexts: MatchingGenerationContext[] }
  | { ok: false; error: string };

/**
 * What a generation run was asked to do, preserved so the evaluation can hold
 * the prompt accountable for its own output.
 */
export interface GenerationMeta {
  prompt: string;
  requestedQuestionCount: number;
}

export type EvaluationMethod = "predefined" | "saved";

export interface EvaluationData {
  method: EvaluationMethod;
  config: PracticeConfig;
  generationContext: GenerationContext;
  generationResponse: GenerationResponse;
  /** The exact final prompt sent to the AI — the object of study for the evaluation. */
  prompt: string;
  requestedQuestionCount: number;
  result: EvaluationResult;
  /**
   * The saved GenerationContext this evaluation is for, if it has been saved
   * (TASK-022) — the id the Evaluation page persists the final score onto.
   * `null` when the current generation hasn't been saved yet.
   */
  generationContextId: string | null;
}

export type EvaluationPrepResult =
  | { ok: true; data: EvaluationData }
  | { ok: false; error: string };

/**
 * Both sides of a current-vs-previous comparison (TASK-023), plus the
 * computed deltas between them. `current`/`previous` are ordinary
 * {@link EvaluationData} — each independently evaluated through the same
 * unmodified evaluation pipeline as a standalone evaluation.
 */
export interface ComparisonData {
  current: EvaluationData;
  previous: EvaluationData;
  comparison: ComparisonResult;
}

export type ComparisonPrepResult =
  | { ok: true; data: ComparisonData }
  | { ok: false; error: string };

export type GeneratedTypeId = "direct" | "mc" | "word" | "missing" | "multistep";

export interface QuestionTypeMeta {
  label: string;
  dotClass: string;
  badgeClass: string;
}

export type CoverageLevel = "good" | "partial" | "limited";

export interface CoverageResult {
  level: CoverageLevel;
  headline: string;
  description: string;
  secondaryScore: number;
}

export type PatternStatus = "covered" | "partial" | "not-covered";

export interface QuestionPatternCoverage {
  pattern: string;
  status: PatternStatus;
}

/**
 * Stable question-type codes — the single source of truth for the `mc` / `fib` /
 * `wp` / `tf` / `ms` values used across the UI, the prompt layer, the AI response
 * contract, and the persistence domain. These are the values the `question_type`
 * CHECK constraints in PostgreSQL allow, and the exact codes the AI must return
 * for each generated question (TASK-019).
 */
export const QUESTION_TYPE_CODES = ["mc", "fib", "wp", "tf", "ms"] as const;
export type QuestionType = (typeof QUESTION_TYPE_CODES)[number];

/** Human-readable label for each question-type code. The single label source. */
export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  mc: "Multiple Choice",
  fib: "Fill in the Blank",
  wp: "Word Problem",
  tf: "True / False",
  ms: "Multi-step Problem",
};

export function questionTypeLabel(code: QuestionType): string {
  return QUESTION_TYPE_LABELS[code];
}

export interface BenchmarkComparisonRow {
  label: string;
  value: string;
  matched: boolean;
}

export interface BenchmarkComparison {
  benchmarkQuestion: string;
  generatedQuestion: string;
  rows: BenchmarkComparisonRow[];
  resultLabel: string;
  resultDescription: string;
}

export type FindingType = "warning" | "good";

export interface Finding {
  type: FindingType;
  text: string;
}

export interface LoadingStep {
  id: number;
  label: string;
  Icon: LucideIcon;
}

export interface SummaryItem {
  label: string;
  value: string;
  Icon: LucideIcon;
}
