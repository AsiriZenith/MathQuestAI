import "server-only";
import { evaluateGeneration } from "@/lib/evaluation/evaluate-generation";
import { loadSavedGeneration } from "@/lib/db/generation-context";
import type {
  EvaluationMethod,
  EvaluationPrepResult,
  GenerationContext,
  PracticeConfig,
} from "@/lib/types";
import type { GenerationResponse } from "@/lib/prompts/types";

/**
 * Entry point for the evaluation flow: validates the session data, runs the
 * deterministic evaluation, and returns the bundled result for the UI.
 */
export async function prepareEvaluation(input: {
  method: EvaluationMethod;
  config: PracticeConfig;
  generationContext: GenerationContext;
  generationResponse: GenerationResponse;
  prompt: string;
  requestedQuestionCount: number;
  generationContextId: string | null;
}): Promise<EvaluationPrepResult> {
  if (input.generationResponse.questions.length === 0) {
    return { ok: false, error: "No generated questions available to evaluate." };
  }

  if (input.prompt.trim().length === 0) {
    return {
      ok: false,
      error: "The prompt used for this generation is unavailable. Generate a new set to evaluate it.",
    };
  }

  try {
    const result = evaluateGeneration({
      config: input.config,
      generationContext: input.generationContext,
      generationResponse: input.generationResponse,
      prompt: input.prompt,
      requestedQuestionCount: input.requestedQuestionCount,
    });

    return { ok: true, data: { ...input, result } };
  } catch {
    return { ok: false, error: "Unable to evaluate this generation." };
  }
}

/**
 * Entry point for the "Compare with Previous Generations" flow (TASK-020):
 * loads a previously saved generation run and evaluates it with the exact
 * same {@link evaluateGeneration} pipeline `prepareEvaluation` uses — no new
 * evaluation logic, only a different data source.
 */
export async function prepareSavedEvaluation(generationContextId: string): Promise<EvaluationPrepResult> {
  const loaded = await loadSavedGeneration(generationContextId);
  if (!loaded.ok) {
    return { ok: false, error: loaded.error };
  }

  const { context, config, generationResponse, prompt, requestedQuestionCount } = loaded.value;

  return prepareEvaluation({
    method: "saved",
    config,
    generationContext: context,
    generationResponse,
    prompt: prompt ?? "",
    requestedQuestionCount,
    generationContextId,
  });
}
