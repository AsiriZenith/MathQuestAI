import "server-only";
import { evaluateGeneration } from "@/lib/evaluation/evaluate-generation";
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
