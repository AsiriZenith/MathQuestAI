import {
  Brain,
  LayoutList,
  PenLine,
  CheckCircle2,
} from "lucide-react";
import type {
  BenchmarkComparison,
  CoverageResult,
  Difficulty,
  Finding,
  GeneratedTypeId,
  LoadingStep,
  PatternStatus,
  QuestionPatternCoverage,
  RequestedTypeId,
} from "@/lib/types";

export const QUESTION_TYPE_OPTIONS = [
  { id: "mc", label: "Multiple Choice" },
  { id: "fib", label: "Fill in the Blank" },
  { id: "wp", label: "Word Problem" },
  { id: "tf", label: "True / False" },
  { id: "ms", label: "Multi-step Problem" },
];

export const DIFFICULTY_OPTIONS: {
  id: Difficulty;
  label: string;
  activeClass: string;
  hoverClass: string;
}[] = [
  {
    id: "easy",
    label: "Easy",
    activeClass: "bg-emerald-500 border-emerald-500 text-white",
    hoverClass: "hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700",
  },
  {
    id: "medium",
    label: "Medium",
    activeClass: "bg-amber-500 border-amber-500 text-white",
    hoverClass: "hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700",
  },
  {
    id: "hard",
    label: "Hard",
    activeClass: "bg-rose-500 border-rose-500 text-white",
    hoverClass: "hover:border-rose-400 hover:bg-rose-50 hover:text-rose-700",
  },
];

export const LOADING_STEPS: LoadingStep[] = [
  { id: 1, label: "Understanding the concept", Icon: Brain },
  { id: 2, label: "Identifying question types", Icon: LayoutList },
  { id: 3, label: "Creating questions", Icon: PenLine },
  { id: 4, label: "Checking question variety", Icon: CheckCircle2 },
];

export const COVERAGE_RESULT: CoverageResult = {
  level: "good",
  headline: "Good Coverage",
  description: "Most of the important question patterns were covered.",
  secondaryScore: 84,
};

// Pattern names aligned to the real seeded Algebra / Simplify-Calculate
// Question Patterns (docs/project-management/database.md §26), replacing the reference's
// placeholder names ("Direct Equation", "Multi-step Equation", "Missing
// Value"). "Word Problem" and "Multiple Choice" are Question Type labels
// reused here by the reference and are left unchanged.
export const QUESTION_PATTERN_COVERAGE: QuestionPatternCoverage[] = [
  { pattern: "Combine Like Terms", status: "covered" },
  { pattern: "Word Problem", status: "partial" },
  { pattern: "Simplify Multi-Operation Expressions", status: "covered" },
  { pattern: "Apply Distributive Property", status: "partial" },
  { pattern: "Multiple Choice", status: "covered" },
];

export const REQUESTED_TYPE_MATCH: Record<RequestedTypeId, GeneratedTypeId | null> = {
  mc: "mc",
  wp: "word",
  ms: "multistep",
  fib: null,
  tf: null,
};

export const DIFFICULTY_DISTRIBUTION: Record<Difficulty, number> = {
  easy: 10,
  medium: 75,
  hard: 15,
};

export const GENERATED_DIFFICULTY_SUMMARY = "Mostly Medium";
export const DIFFICULTY_INTERPRETATION = "Most questions are close to the requested difficulty.";

export const BENCHMARK_COMPARISON: BenchmarkComparison = {
  benchmarkQuestion: "Find x if 2x + 5 = 15.",
  generatedQuestion:
    "A number is doubled and increased by five. The result is fifteen. Find the number.",
  rows: [
    { label: "Concept", value: "Same", matched: true },
    { label: "Question Pattern", value: "Same", matched: true },
    { label: "Difficulty", value: "Similar", matched: true },
    { label: "Wording", value: "Different", matched: false },
    { label: "Variation", value: "Meaningful", matched: true },
  ],
  resultLabel: "Good Match",
  resultDescription:
    "The question is different in wording but tests the same mathematical idea.",
};

export const EVALUATION_FINDINGS: Finding[] = [
  { type: "warning", text: "Word problems are underrepresented." },
  { type: "warning", text: "A few questions are easier than the requested difficulty." },
  { type: "good", text: "Other major question patterns are covered." },
];

export const COVERAGE_LEVEL_STYLE: Record<
  CoverageResult["level"],
  { cardClass: string; titleClass: string; textClass: string }
> = {
  good: {
    cardClass: "bg-emerald-50 border-emerald-200/60",
    titleClass: "text-emerald-800",
    textClass: "text-emerald-900/90",
  },
  partial: {
    cardClass: "bg-amber-50 border-amber-200/60",
    titleClass: "text-amber-800",
    textClass: "text-amber-900/90",
  },
  limited: {
    cardClass: "bg-rose-50 border-rose-200/60",
    titleClass: "text-rose-800",
    textClass: "text-rose-900/90",
  },
};

export function canGenerate(config: {
  grade: string;
  subtopic: string;
  difficulty: Difficulty | "";
  selectedTypesSize: number;
  autoTypes: boolean;
}): boolean {
  return (
    config.grade !== "" &&
    config.subtopic !== "" &&
    config.difficulty !== "" &&
    (config.selectedTypesSize > 0 || config.autoTypes)
  );
}

export type { PatternStatus };
