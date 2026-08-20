import type { LucideIcon } from "lucide-react";

export type Difficulty = "easy" | "medium" | "hard";

export interface PracticeConfig {
  grade: string;
  subtopic: string;
  subtopicId: string;
  difficulty: Difficulty;
  selectedTypes: string[];
  autoTypes: boolean;
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
