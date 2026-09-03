import "server-only";
import { prepareEvaluation, prepareSavedEvaluation } from "@/lib/evaluation/prepare-evaluation";
import { compareEvaluationResults } from "@/lib/evaluation/compare-evaluations";
import type {
  ComparisonPrepResult,
  GenerationContext,
  PracticeConfig,
} from "@/lib/types";
import type { GenerationResponse } from "@/lib/prompts/types";

/**
 * Entry point for "Compare with Previous Generations" (TASK-023): evaluates
 * the current generation and the selected previous one independently,
 * through the exact same unmodified evaluation pipeline
 * (`prepareEvaluation`/`prepareSavedEvaluation` → `evaluateGeneration`), then
 * diffs the two fresh results. Never uses a stored `score` — `loadSavedGeneration`
 * (called inside `prepareSavedEvaluation`) doesn't even expose that column.
 * No persistence here; that stays a page-level concern, exactly like a
 * standalone evaluation.
 */
export async function prepareComparison(input: {
  config: PracticeConfig;
  generationContext: GenerationContext;
  generationResponse: GenerationResponse;
  prompt: string;
  requestedQuestionCount: number;
  currentGenerationContextId: string | null;
  previousGenerationContextId: string;
}): Promise<ComparisonPrepResult> {
  const current = await prepareEvaluation({
    method: "predefined",
    config: input.config,
    generationContext: input.generationContext,
    generationResponse: input.generationResponse,
    prompt: input.prompt,
    requestedQuestionCount: input.requestedQuestionCount,
    generationContextId: input.currentGenerationContextId,
  });
  if (!current.ok) return { ok: false, error: current.error };

  const previous = await prepareSavedEvaluation(input.previousGenerationContextId);
  if (!previous.ok) return { ok: false, error: previous.error };

  const comparison = compareEvaluationResults(current.data.result, previous.data.result);

  return { ok: true, data: { current: current.data, previous: previous.data, comparison } };
}
