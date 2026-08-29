import type { QuestionType } from "@/lib/types";
import type { Difficulty } from "@/lib/types";

/**
 * How much trust the researcher should place in a dimension's score.
 *
 * high   — computed exactly from the generated output (counting, set membership).
 * medium — computed from a structural proxy that stands in for a semantic
 *          judgement (e.g. reasoning-step counts as a proxy for difficulty).
 */
export type Confidence = "high" | "medium";

export type AdherenceStatus = "met" | "partial" | "not_met" | "not_applicable";

/** The seven sections emitted by lib/prompts/builder.ts, in order. */
export type PromptSectionId =
  | "common_instructions"
  | "generation_requirement"
  | "educational_context"
  | "difficulty"
  | "question_type"
  | "reference_questions"
  | "output_format";

export type DimensionId =
  | "count_adherence"
  | "output_integrity"
  | "type_adherence"
  | "pattern_adherence"
  | "difficulty_alignment"
  | "reference_alignment";

/**
 * One scored dimension. Every dimension names the prompt section it measures,
 * so a weak score always points at an editable block of prompt text.
 */
export interface DimensionScore {
  id: DimensionId;
  label: string;
  /** 0..1, or null when the dimension does not apply to this run. */
  score: number | null;
  /** Relative weight before renormalisation over applicable dimensions. */
  weight: number;
  status: AdherenceStatus;
  confidence: Confidence;
  /** The prompt section this dimension holds accountable. */
  promptSection: PromptSectionId;
  /** Plain-English description of exactly how the score was computed. */
  method: string;
  /** One-line finding, phrased in terms of the prompt rather than the model. */
  summary: string;
}

export interface IntegrityCheck {
  id: string;
  label: string;
  passed: boolean;
  /** convention checks reflect the OUTPUT FORMAT example rather than a hard rule. */
  severity: "requirement" | "convention";
  detail: string;
}

export interface CoverageEntry {
  label: string;
  /** Number of generated questions attributed to this bucket. */
  count: number;
  /** Share of the labelled/total set, 0..1. */
  share: number;
  requested: boolean;
}

export interface CoverageReport {
  entries: CoverageEntry[];
  /** Requested buckets that received zero questions. */
  missing: string[];
  /** Buckets that appeared but were never requested. */
  unexpected: string[];
  /** Questions the AI failed to label at all (pattern coverage only). */
  unlabelled: number;
  /**
   * True when the prompt permits the observed skew. Coverage is then reported
   * descriptively rather than scored as a failure — the gap is a prompt gap.
   */
  promptPermitsSkew: boolean;
  note: string;
}

export interface DifficultySignals {
  requested: Difficulty;
  /** Mean reasoning steps inferred from each question's explanation. */
  meanReasoningSteps: number;
  /** Mean count of mathematical operators in each question's text. */
  meanOperators: number;
  /** Per-band tallies of where each generated question landed. */
  observedBands: Record<Difficulty, number>;
  /** Questions whose observed band matched the requested difficulty. */
  matched: number;
  total: number;
}

export interface ReferenceAlignmentReport {
  /** Generated questions whose overlap with a reference question is too high. */
  copyRisks: { questionNumber: number; overlap: number; referenceText: string }[];
  meanGeneratedComplexity: number;
  meanReferenceComplexity: number;
  complexityDelta: number;
  referenceCount: number;
}

export type DeviationKind =
  | "out_of_scope_type"
  | "out_of_scope_pattern"
  | "missing_pattern_label"
  | "difficulty_drift"
  | "copy_risk"
  | "structure";

export interface Deviation {
  questionNumber: number;
  kind: DeviationKind;
  severity: "high" | "medium" | "low";
  expected: string;
  observed: string;
  /** Which prompt section failed to prevent this. */
  promptSection: PromptSectionId;
}

/**
 * A concrete, evidence-backed prompt change. Never generic advice: every
 * improvement names the file/constant to edit and supplies replacement text.
 */
export interface ImprovementOpportunity {
  id: string;
  problem: string;
  evidence: string;
  likelyPromptWeakness: string;
  suggestedChange: string;
  targetFile: string;
  promptSection: PromptSectionId;
}

/** A prompt instruction that demonstrably worked — i.e. do not change it. */
export interface Strength {
  id: string;
  finding: string;
  promptSection: PromptSectionId;
}

export interface PromptSectionTrace {
  id: PromptSectionId;
  heading: string;
  body: string;
  dimensionIds: DimensionId[];
  status: AdherenceStatus;
  /** 0..1 across the dimensions this section is accountable for, null if N/A. */
  score: number | null;
  verdict: string;
}

export interface ConfigurationSummary {
  grade: string;
  subject: string;
  topic: string;
  subtopic: string;
  difficulty: Difficulty;
  requestedPatterns: string[];
  usedAllPatterns: boolean;
  requestedTypes: { id: QuestionType; label: string }[];
  usedAiMix: boolean;
  requestedQuestionCount: number;
  generatedQuestionCount: number;
}

export type EffectivenessBand = "strong" | "moderate" | "weak";

/**
 * A single comparable number, current vs. previous (TASK-023).
 * `difference = current - previous`: positive means the current generation
 * scored higher, negative means lower, zero means equal.
 */
export interface ScoreDelta {
  current: number;
  previous: number;
  difference: number;
}

/**
 * One evaluation dimension, current vs. previous. `current`/`previous` mirror
 * `DimensionScore.score` (0..1, or null when not applicable to that side).
 * `difference` is only computed when both sides are non-null — never
 * fabricated by treating a missing score as 0.
 */
export interface DimensionComparison {
  id: DimensionId;
  label: string;
  current: number | null;
  previous: number | null;
  difference: number | null;
}

/**
 * Output of comparing two already-computed {@link EvaluationResult}s
 * (TASK-023). Deliberately limited to the numeric metrics that already have a
 * clear delta semantic (overall score, per-dimension score) — coverage
 * reports, difficulty signals, integrity checks, reference alignment, and
 * deviations are structured, not single numbers, and the evaluation engine
 * defines no delta for them, so they are displayed side by side from each
 * side's own unmodified `EvaluationResult` instead of diffed here.
 */
export interface ComparisonResult {
  overallScore: ScoreDelta;
  dimensions: DimensionComparison[];
}

export interface EvaluationResult {
  /** 0..100, rounded. Weighted across applicable dimensions only. */
  promptEffectiveness: number;
  band: EffectivenessBand;
  /** Plain-English reading of the score, phrased as an experimental metric. */
  explanation: string;
  dimensions: DimensionScore[];
  configuration: ConfigurationSummary;
  patternCoverage: CoverageReport;
  typeCoverage: CoverageReport;
  difficulty: DifficultySignals;
  integrityChecks: IntegrityCheck[];
  referenceAlignment: ReferenceAlignmentReport;
  promptTrace: PromptSectionTrace[];
  deviations: Deviation[];
  strengths: Strength[];
  improvements: ImprovementOpportunity[];
  /** ISO timestamp, so exported reports are comparable across runs. */
  evaluatedAt: string;
}
