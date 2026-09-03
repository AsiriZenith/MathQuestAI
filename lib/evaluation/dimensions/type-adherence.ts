import { QUESTION_TYPE_OPTIONS } from "@/lib/mock-data";
import { questionTypeLabel, type QuestionType } from "@/lib/types";
import type { GenerationResponse } from "@/lib/prompts/types";
import type { CoverageReport, Deviation, DimensionScore } from "@/lib/evaluation/types";

export interface TypeAdherenceOutcome {
  dimension: DimensionScore;
  coverage: CoverageReport;
  deviations: Deviation[];
}

/**
 * Measures the QUESTION TYPE section.
 *
 * Two distinct things are assessed, and only the first is scored:
 *
 *  - Scored: did every question use a type the prompt allowed? The prompt does
 *    demand this ("Follow the requested question type(s)").
 *  - Reported, not scored: did every requested type actually appear? The prompt
 *    explicitly says "Not every type needs to appear in every question", so an
 *    uneven spread is permitted by the prompt. Penalising it would measure the
 *    output against a rule the prompt never stated; the honest finding is that
 *    the prompt permits the skew.
 */
export function evaluateTypeAdherence(
  response: GenerationResponse,
  requestedTypes: QuestionType[] | "auto",
): TypeAdherenceOutcome {
  const questions = response.questions;
  const total = questions.length;
  const isAuto = requestedTypes === "auto";
  const allowed: QuestionType[] = isAuto
    ? QUESTION_TYPE_OPTIONS.map((t) => t.id)
    : requestedTypes;

  const counts = new Map<QuestionType, number>();
  for (const question of questions) {
    counts.set(question.questionType, (counts.get(question.questionType) ?? 0) + 1);
  }

  const outOfScope = questions.filter((q) => !allowed.includes(q.questionType));
  const inScopeRatio = total > 0 ? (total - outOfScope.length) / total : 0;

  // In auto mode the prompt asks for "a varied mix", so variety itself is the
  // requirement. Anything less than a handful of distinct types under-delivers.
  const distinctCount = counts.size;
  const varietyTarget = Math.min(QUESTION_TYPE_OPTIONS.length, Math.max(1, total));
  const varietyRatio = varietyTarget > 0 ? Math.min(1, distinctCount / varietyTarget) : 1;

  const score = isAuto ? varietyRatio : inScopeRatio;

  const entries = QUESTION_TYPE_OPTIONS.filter(
    (type) => allowed.includes(type.id) || (counts.get(type.id) ?? 0) > 0,
  ).map((type) => {
    const count = counts.get(type.id) ?? 0;
    return {
      label: type.label,
      count,
      share: total > 0 ? count / total : 0,
      requested: allowed.includes(type.id),
    };
  });

  const missing = entries.filter((e) => e.requested && e.count === 0).map((e) => e.label);
  const unexpected = entries.filter((e) => !e.requested && e.count > 0).map((e) => e.label);

  const deviations: Deviation[] = outOfScope.map((question) => ({
    questionNumber: question.questionNumber,
    kind: "out_of_scope_type" as const,
    severity: "high" as const,
    expected: allowed.map(questionTypeLabel).join(", "),
    observed: questionTypeLabel(question.questionType),
    promptSection: "question_type" as const,
  }));

  const coverage: CoverageReport = {
    entries,
    missing,
    unexpected,
    unlabelled: 0,
    promptPermitsSkew: !isAuto,
    note: isAuto
      ? 'The prompt asked for "a varied mix" without naming counts, so variety is the requirement and an even split is not.'
      : 'The QUESTION TYPE section says "Not every type needs to appear in every question", so the prompt permits an uneven spread. Missing types below are a gap in the prompt, not a rule the output broke.',
  };

  return {
    dimension: {
      id: "type_adherence",
      label: "Question type",
      score,
      weight: 20,
      status: score >= 0.999 ? "met" : score >= 0.8 ? "partial" : "not_met",
      confidence: "high",
      promptSection: "question_type",
      method: isAuto
        ? `Counted distinct question types returned (${distinctCount}) against the "varied mix" the prompt requested.`
        : `Checked each question's declared type against the ${allowed.length} type(s) the prompt allowed.`,
      summary: isAuto
        ? `The prompt asked for a varied mix and received ${distinctCount} distinct type(s) across ${total} questions.`
        : outOfScope.length === 0
          ? "Every question used one of the requested question types."
          : `${outOfScope.length} of ${total} questions used a type the prompt did not request.`,
    },
    coverage,
    deviations,
  };
}
