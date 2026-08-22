import { complexityScore, ngramOverlap } from "@/lib/evaluation/text-metrics";
import type { GenerationResponse } from "@/lib/prompts/types";
import type { GenerationContext } from "@/lib/types";
import type { Deviation, DimensionScore, ReferenceAlignmentReport } from "@/lib/evaluation/types";

export interface ReferenceAlignmentOutcome {
  dimension: DimensionScore;
  report: ReferenceAlignmentReport;
  deviations: Deviation[];
}

/** Above this n-gram containment, a generated question is treated as a near-copy. */
const COPY_THRESHOLD = 0.5;

/**
 * Measures the REFERENCE QUESTIONS section, which instructs the model to use the
 * examples "as guidance, not as questions to copy directly".
 *
 * Two sub-checks, deliberately pulling in opposite directions:
 *  - Copy risk: high n-gram overlap with a reference means the instruction failed.
 *  - Characteristic drift: generated questions far simpler or far more complex
 *    than the references means the examples did not convey their characteristics.
 *
 * Good output therefore sits between the two — original wording, comparable shape.
 */
export function evaluateReferenceAlignment(
  response: GenerationResponse,
  context: GenerationContext,
): ReferenceAlignmentOutcome {
  const references = context.patterns.flatMap((pattern) => pattern.referenceQuestions);
  const questions = response.questions;

  const meanGeneratedComplexity =
    questions.length > 0
      ? questions.reduce((sum, q) => sum + complexityScore(q.questionText, q.explanation), 0) /
        questions.length
      : 0;

  if (references.length === 0) {
    return {
      dimension: {
        id: "reference_alignment",
        label: "Reference alignment",
        score: null,
        weight: 10,
        status: "not_applicable",
        confidence: "medium",
        promptSection: "reference_questions",
        method:
          "No reference questions exist for this pattern/difficulty combination, so the prompt's REFERENCE QUESTIONS section carried no examples to align against. Excluded from the score and the remaining weights renormalised.",
        summary:
          "No reference questions were available for this context, so alignment could not be measured.",
      },
      report: {
        copyRisks: [],
        meanGeneratedComplexity,
        meanReferenceComplexity: 0,
        complexityDelta: 0,
        referenceCount: 0,
      },
      deviations: [],
    };
  }

  const meanReferenceComplexity =
    references.reduce(
      (sum, ref) => sum + complexityScore(ref.questionText, ref.explanation ?? ""),
      0,
    ) / references.length;

  const copyRisks: ReferenceAlignmentReport["copyRisks"] = [];
  for (const question of questions) {
    let worstOverlap = 0;
    let worstReference = "";
    for (const reference of references) {
      const overlap = ngramOverlap(question.questionText, reference.questionText);
      if (overlap > worstOverlap) {
        worstOverlap = overlap;
        worstReference = reference.questionText;
      }
    }
    if (worstOverlap >= COPY_THRESHOLD) {
      copyRisks.push({
        questionNumber: question.questionNumber,
        overlap: worstOverlap,
        referenceText: worstReference,
      });
    }
  }

  const originalityScore =
    questions.length > 0 ? (questions.length - copyRisks.length) / questions.length : 1;

  const complexityDelta = meanGeneratedComplexity - meanReferenceComplexity;
  const relativeDrift =
    meanReferenceComplexity > 0 ? Math.abs(complexityDelta) / meanReferenceComplexity : 0;
  const characteristicScore = Math.max(0, 1 - Math.min(1, relativeDrift));

  const score = originalityScore * 0.6 + characteristicScore * 0.4;

  const deviations: Deviation[] = copyRisks.map((risk) => ({
    questionNumber: risk.questionNumber,
    kind: "copy_risk" as const,
    severity: "high" as const,
    expected: "An original question that borrows the reference's characteristics, not its wording",
    observed: `${Math.round(risk.overlap * 100)}% phrase overlap with a reference question`,
    promptSection: "reference_questions" as const,
  }));

  return {
    dimension: {
      id: "reference_alignment",
      label: "Reference alignment",
      score,
      weight: 10,
      status: score >= 0.85 ? "met" : score >= 0.6 ? "partial" : "not_met",
      confidence: "medium",
      promptSection: "reference_questions",
      method: `Two proxies against ${references.length} reference question(s): 5-gram phrase overlap to detect copying (60% of the score), and the gap between generated and reference structural complexity (40%).`,
      summary:
        copyRisks.length > 0
          ? `${copyRisks.length} question(s) closely echo a reference question, which the prompt explicitly asked the model not to do.`
          : relativeDrift > 0.5
            ? "No copying detected, but generated questions differ substantially in complexity from the reference examples."
            : "Generated questions borrowed reference characteristics without copying their wording.",
    },
    report: {
      copyRisks,
      meanGeneratedComplexity,
      meanReferenceComplexity,
      complexityDelta,
      referenceCount: references.length,
    },
    deviations,
  };
}
