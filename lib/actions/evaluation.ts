"use server";

import { prepareEvaluation } from "@/lib/evaluation/prepare-evaluation";
import { prepareComparison } from "@/lib/evaluation/prepare-comparison";
import { findMatchingGenerationContexts, updateGenerationContextScore } from "@/lib/db/generation-context";
import { resolveSelectedPatternIds, resolveSelectedTypeCodes } from "@/lib/persistence/matching";
import {
  toDifficultyLevel,
  type ComparisonPrepResult,
  type EvaluationMethod,
  type EvaluationPrepResult,
  type FindMatchingGenerationContextsResult,
  type GenerationContext,
  type GenerationMeta,
  type PracticeConfig,
} from "@/lib/types";
import type { GenerationResponse } from "@/lib/prompts/types";

export async function prepareEvaluationAction(input: {
  method: EvaluationMethod;
  config: PracticeConfig | null;
  generationContext: GenerationContext | null;
  generationResponse: GenerationResponse | null;
  generationMeta: GenerationMeta | null;
  generationContextId?: string | null;
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
    generationContextId: input.generationContextId ?? null,
  });
}

/**
 * Finds saved generation runs whose difficulty + question-pattern set +
 * question-type set exactly matches the current selection (TASK-020), for
 * the "Compare with Previous Generations" table.
 */
export async function findMatchingGenerationContextsAction(input: {
  config: PracticeConfig | null;
  generationContext: GenerationContext | null;
  /** The current generation's own saved id, if any — excluded from its own candidate list (TASK-022). */
  excludeGenerationContextId?: string | null;
}): Promise<FindMatchingGenerationContextsResult> {
  const { config, generationContext } = input;

  if (!config || !generationContext) {
    return { ok: false, error: "Missing session data required to find saved results." };
  }

  return findMatchingGenerationContexts({
    difficultyLevel: toDifficultyLevel(config.difficulty),
    questionTypeCodes: resolveSelectedTypeCodes(config),
    questionPatternIds: resolveSelectedPatternIds(generationContext),
    excludeGenerationContextId: input.excludeGenerationContextId ?? undefined,
  });
}

/**
 * Prepares a current-vs-previous comparison (TASK-023): evaluates the
 * current generation (live session data — no save required) and the
 * selected previous generation independently, then diffs the two fresh
 * results. Supersedes the old TASK-020 behavior of evaluating only the
 * selected previous generation by itself.
 */
export async function prepareComparisonAction(input: {
  config: PracticeConfig | null;
  generationContext: GenerationContext | null;
  generationResponse: GenerationResponse | null;
  generationMeta: GenerationMeta | null;
  currentGenerationContextId: string | null;
  previousGenerationContextId: string;
}): Promise<ComparisonPrepResult> {
  const { config, generationContext, generationResponse, generationMeta, previousGenerationContextId } =
    input;

  if (!config || !generationContext || !generationResponse || !generationMeta) {
    return { ok: false, error: "Missing session data required to prepare a comparison." };
  }
  if (!previousGenerationContextId) {
    return { ok: false, error: "No previous generation was selected to compare against." };
  }

  return prepareComparison({
    config,
    generationContext,
    generationResponse,
    prompt: generationMeta.prompt,
    requestedQuestionCount: generationMeta.requestedQuestionCount,
    currentGenerationContextId: input.currentGenerationContextId,
    previousGenerationContextId,
  });
}

/**
 * Persists the final evaluation score onto the GenerationContext it was
 * computed for (TASK-022). No-op-with-error when there is no saved id yet
 * (the current generation hasn't been saved) — nothing to update.
 */
export async function updateGenerationContextScoreAction(input: {
  generationContextId: string | null;
  score: number;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!input.generationContextId) {
    return { ok: false, error: "This generation has not been saved, so its score cannot be persisted." };
  }

  return updateGenerationContextScore(input.generationContextId, input.score);
}
