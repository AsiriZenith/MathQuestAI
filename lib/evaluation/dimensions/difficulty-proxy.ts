import { countOperators, countReasoningSteps } from "@/lib/evaluation/text-metrics";
import type { GenerationResponse } from "@/lib/prompts/types";
import type { Difficulty } from "@/lib/types";
import type { Deviation, DifficultySignals, DimensionScore } from "@/lib/evaluation/types";

export interface DifficultyOutcome {
  dimension: DimensionScore;
  signals: DifficultySignals;
  deviations: Deviation[];
}

const BAND_ORDER: Difficulty[] = ["easy", "medium", "hard"];

/**
 * Place one question in a difficulty band using the project's own definitions
 * (docs: Easy ~1 step, Medium ~2-3 connected steps, Hard = multiple/complex steps).
 *
 * This is a structural proxy, not a semantic judgement — it counts the reasoning
 * steps the explanation describes and the operators the question contains. It is
 * reported at "medium" confidence with the raw counts shown, precisely so a
 * researcher can disagree with it.
 */
export function classifyDifficulty(questionText: string, explanation: string): Difficulty {
  const steps = countReasoningSteps(explanation);
  const operators = countOperators(questionText);

  if (steps >= 4 || operators >= 6) return "hard";
  if (steps >= 2 || operators >= 3) return "medium";
  return "easy";
}

function bandDistance(a: Difficulty, b: Difficulty): number {
  return Math.abs(BAND_ORDER.indexOf(a) - BAND_ORDER.indexOf(b));
}

/** Measures the DIFFICULTY section. */
export function evaluateDifficultyAlignment(
  response: GenerationResponse,
  requested: Difficulty,
): DifficultyOutcome {
  const questions = response.questions;
  const total = questions.length;

  const observedBands: Record<Difficulty, number> = { easy: 0, medium: 0, hard: 0 };
  let stepSum = 0;
  let operatorSum = 0;
  let creditSum = 0;
  const deviations: Deviation[] = [];

  for (const question of questions) {
    const band = classifyDifficulty(question.questionText, question.explanation);
    observedBands[band] += 1;
    stepSum += countReasoningSteps(question.explanation);
    operatorSum += countOperators(question.questionText);

    const distance = bandDistance(band, requested);
    // Adjacent bands earn partial credit: the proxy is not precise enough to
    // treat a near miss as a full failure.
    creditSum += distance === 0 ? 1 : distance === 1 ? 0.5 : 0;

    if (distance >= 1) {
      deviations.push({
        questionNumber: question.questionNumber,
        kind: "difficulty_drift",
        severity: distance >= 2 ? "high" : "low",
        expected: `${requested} (per the prompt's difficulty guidance)`,
        observed: `structural signals read as ${band}`,
        promptSection: "difficulty",
      });
    }
  }

  const matched = observedBands[requested];
  const score = total > 0 ? creditSum / total : 0;

  return {
    dimension: {
      id: "difficulty_alignment",
      label: "Difficulty",
      score,
      weight: 20,
      status: score >= 0.85 ? "met" : score >= 0.6 ? "partial" : "not_met",
      confidence: "medium",
      promptSection: "difficulty",
      method:
        "Structural proxy, not a semantic judgement: counts the reasoning steps each explanation describes and the operators each question contains, then maps them onto the project's Easy/Medium/Hard step-count definitions. Adjacent bands earn half credit.",
      summary:
        matched === total
          ? `All ${total} questions show structural complexity consistent with ${requested}.`
          : `${matched} of ${total} questions show complexity consistent with ${requested}; the rest read as ${BAND_ORDER.filter((b) => b !== requested && observedBands[b] > 0).join(" or ") || "another band"}.`,
    },
    signals: {
      requested,
      meanReasoningSteps: total > 0 ? stepSum / total : 0,
      meanOperators: total > 0 ? operatorSum / total : 0,
      observedBands,
      matched,
      total,
    },
    deviations,
  };
}
