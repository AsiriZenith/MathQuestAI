import "server-only";
import { z } from "zod";
import { buildPrompt } from "@/lib/prompts/builder";
import { generationResponseSchema, parseGenerationResponse } from "@/lib/prompts/schema";
import { DEFAULT_QUESTION_COUNT } from "@/lib/ai/config";
import { GeminiProvider } from "@/lib/ai/gemini-provider";
import type { AiProvider } from "@/lib/ai/provider";
import type { AiQuestionType, GenerationResponse } from "@/lib/prompts/types";
import type { GenerationContext } from "@/lib/types";

export type GenerateQuestionsResult =
  | { ok: true; data: GenerationResponse }
  | { ok: false; stage: "prompt" | "provider" | "validation"; error: string };

export async function generateQuestions(
  context: GenerationContext,
  questionTypes: AiQuestionType[] | "auto",
  provider: AiProvider = new GeminiProvider(),
): Promise<GenerateQuestionsResult> {
  if (context.patterns.length === 0) {
    console.error("generateQuestions: prompt stage failed - no question patterns in context");
    return { ok: false, stage: "prompt", error: "No question patterns available for this context." };
  }

  const prompt = buildPrompt({
    context,
    questionTypes,
    questionCount: DEFAULT_QUESTION_COUNT,
  });

  console.log("generateQuestions: generation started");

  const responseJsonSchema = z.toJSONSchema(generationResponseSchema);
  const providerResult = await provider.generate({ prompt, responseJsonSchema });

  if (!providerResult.ok) {
    console.error("generateQuestions: provider stage failed");
    return { ok: false, stage: "provider", error: providerResult.error };
  }

  const parsed = parseGenerationResponse(providerResult.rawText);
  if (!parsed.ok) {
    console.error("generateQuestions: validation stage failed");
    return { ok: false, stage: "validation", error: parsed.error };
  }

  console.log("generateQuestions: generation succeeded");
  return { ok: true, data: parsed.data };
}
