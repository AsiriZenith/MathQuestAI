import type { LucideIcon } from "lucide-react";
import type { GenerationResponse } from "@/lib/prompts/types";
// Type-only import: erased at compile time, so the mutual reference with
// lib/evaluation/types.ts creates no runtime cycle.
import type { EvaluationResult } from "@/lib/evaluation/types";

export type Difficulty = "easy" | "medium" | "hard";

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
 * What a generation run was asked to do, preserved so the evaluation can hold
 * the prompt accountable for its own output.
 */
export interface GenerationMeta {
  prompt: string;
  requestedQuestionCount: number;
}

export type EvaluationMethod = "predefined";

export interface EvaluationData {
  method: EvaluationMethod;
  config: PracticeConfig;
  generationContext: GenerationContext;
  generationResponse: GenerationResponse;
  /** The exact final prompt sent to the AI — the object of study for the evaluation. */
  prompt: string;
  requestedQuestionCount: number;
  result: EvaluationResult;
}

export type EvaluationPrepResult =
  | { ok: true; data: EvaluationData }
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

export type RequestedTypeId = "mc" | "fib" | "wp" | "tf" | "ms";

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
