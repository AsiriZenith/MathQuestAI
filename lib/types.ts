import type { LucideIcon } from "lucide-react";

export type Difficulty = "easy" | "medium" | "hard";

export interface PracticeConfig {
  grade: string;
  subtopic: string;
  difficulty: Difficulty;
  selectedTypes: string[];
  autoTypes: boolean;
}

export type GeneratedTypeId = "direct" | "mc" | "word" | "missing" | "multistep";

export interface QuestionTypeMeta {
  label: string;
  dotClass: string;
  badgeClass: string;
}

export interface GeneratedQuestion {
  id: number;
  typeId: GeneratedTypeId;
  prompt: string;
  options?: string[];
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
