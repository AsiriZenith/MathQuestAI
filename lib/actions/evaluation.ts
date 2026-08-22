"use server";

import { prepareEvaluation } from "@/lib/evaluation/prepare-evaluation";
import type {
  EvaluationMethod,
  EvaluationPrepResult,
  GenerationContext,
  GenerationMeta,
  PracticeConfig,
} from "@/lib/types";
import type { GenerationResponse } from "@/lib/prompts/types";

export async function prepareEvaluationAction(input: {
  method: EvaluationMethod;
  config: PracticeConfig | null;
  generationContext: GenerationContext | null;
  generationResponse: GenerationResponse | null;
  generationMeta: GenerationMeta | null;
}): Promise<EvaluationPrepResult> {
  const { method, config, generationContext, generationResponse, generationMeta } = input;

  if (!config || !generationContext || !generationResponse || !generationMeta) {
    return { ok: false, error: "Missing session data required to prepare evaluation." };
  }

  return prepareEvaluation({
    method,
    config,
    generationContext,
    generationResponse,
    prompt: generationMeta.prompt,
    requestedQuestionCount: generationMeta.requestedQuestionCount,
  });
}
