import type { ComparisonResult, DimensionComparison, EvaluationResult } from "@/lib/evaluation/types";

/**
 * Pure diff between two already-computed evaluation results (TASK-023). No
 * I/O, no database access, no navigation, no persistence — only compares
 * numbers the evaluation engine already produced. See {@link ComparisonResult}
 * for why coverage/difficulty/integrity/reference/deviation data isn't
 * diffed here.
 */
export function compareEvaluationResults(
  current: EvaluationResult,
  previous: EvaluationResult,
): ComparisonResult {
  const previousById = new Map(previous.dimensions.map((d) => [d.id, d]));

  const dimensions: DimensionComparison[] = current.dimensions.map((currentDimension) => {
    const previousDimension = previousById.get(currentDimension.id);
    const currentScore = currentDimension.score;
    const previousScore = previousDimension?.score ?? null;

    return {
      id: currentDimension.id,
      label: currentDimension.label,
      current: currentScore,
      previous: previousScore,
      difference:
        currentScore !== null && previousScore !== null ? currentScore - previousScore : null,
    };
  });

  return {
    overallScore: {
      current: current.promptEffectiveness,
      previous: previous.promptEffectiveness,
      difference: current.promptEffectiveness - previous.promptEffectiveness,
    },
    dimensions,
  };
}
