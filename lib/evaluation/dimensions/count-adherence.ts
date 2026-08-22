import type { GenerationResponse } from "@/lib/prompts/types";
import type { DimensionScore } from "@/lib/evaluation/types";

/**
 * Measures the GENERATION REQUIREMENT section ("Generate N questions.").
 *
 * Worth measuring because nothing else enforces it: the Zod schema only requires
 * at least one question, so a short or long set passes validation silently.
 */
export function evaluateCountAdherence(
  response: GenerationResponse,
  requestedCount: number,
): DimensionScore {
  const actual = response.questions.length;
  const drift = Math.abs(actual - requestedCount);
  const score = requestedCount > 0 ? Math.max(0, 1 - drift / requestedCount) : 0;

  return {
    id: "count_adherence",
    label: "Question count",
    score,
    weight: 10,
    status: drift === 0 ? "met" : score >= 0.8 ? "partial" : "not_met",
    confidence: "high",
    promptSection: "generation_requirement",
    method: `Compared the number of questions returned (${actual}) with the number the prompt requested (${requestedCount}).`,
    summary:
      drift === 0
        ? `The prompt asked for ${requestedCount} questions and received exactly ${requestedCount}.`
        : `The prompt asked for ${requestedCount} questions but received ${actual}.`,
  };
}
