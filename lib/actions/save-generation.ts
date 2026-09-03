"use server";

import { saveGeneration } from "@/lib/persistence/save-generation";
import type { GenerationContext, GenerationMeta, PracticeConfig } from "@/lib/types";
import type { GenerationResponse } from "@/lib/prompts/types";

const GENERIC_ERROR = "We couldn't save the questions for evaluation. Please try again.";

/**
 * Explicit "Save for Evaluation" action (TASK-018). Persistence happens only when
 * the user confirms it from the Questions page — never during AI generation.
 *
 * Takes the session objects that produced the currently displayed questions and
 * hands them to the shared persistence service (`lib/persistence/save-generation.ts`).
 * Every failure — missing session data, an AI response that can't be mapped, or a
 * database error — is reported with one generic message; the service logs the
 * detail server-side and never leaks internals.
 */
export async function saveGenerationAction(input: {
  config: PracticeConfig | null;
  generationContext: GenerationContext | null;
  generationResponse: GenerationResponse | null;
  generationMeta: GenerationMeta | null;
}): Promise<{ ok: true; generationContextId: string } | { ok: false; error: string }> {
  const { config, generationContext, generationResponse, generationMeta } = input;

  if (!config || !generationContext || !generationResponse || !generationMeta) {
    return { ok: false, error: GENERIC_ERROR };
  }

  const saved = await saveGeneration({
    generationContext,
    config,
    aiResponse: generationResponse,
    prompt: generationMeta.prompt,
    requestedQuestionCount: generationMeta.requestedQuestionCount,
  });

  if (!saved.ok) {
    return { ok: false, error: GENERIC_ERROR };
  }

  return { ok: true, generationContextId: saved.generationContextId };
}
