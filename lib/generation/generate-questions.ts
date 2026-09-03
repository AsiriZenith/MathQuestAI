import "server-only";
import { z } from "zod";
import { buildPrompt } from "@/lib/prompts/builder";
import { generationResponseSchema, parseGenerationResponse } from "@/lib/prompts/schema";
import { DEFAULT_QUESTION_COUNT } from "@/lib/ai/config";
import { HttpAiProvider } from "@/lib/ai/http-provider";
import type { AiProvider } from "@/lib/ai/provider";
import { validateClassification } from "@/lib/prompts/validate-classification";
import type { GenerationResponse } from "@/lib/prompts/types";
import { QUESTION_TYPE_CODES, type GenerationContext, type QuestionType } from "@/lib/types";

export type GenerateQuestionsResult =
  | { ok: true; data: GenerationResponse; prompt: string; requestedQuestionCount: number }
  | { ok: false; stage: "prompt" | "provider" | "validation"; error: string };

export async function generateQuestions(
  context: GenerationContext,
  questionTypes: QuestionType[] | "auto",
  provider: AiProvider = new HttpAiProvider(),
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

  console.log(
    [
      "generateQuestions: generation started",
      `  questionTypes: ${JSON.stringify(questionTypes)}`,
      `  questionCount: ${DEFAULT_QUESTION_COUNT}`,
      `  patterns: ${context.patterns.map((p) => p.name).join(", ")}`,
      "----- FINAL PROMPT BEGIN -----",
      prompt,
      "----- FINAL PROMPT END -----",
    ].join("\n"),
  );

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

  // Every question must have classified itself with a question type and a
  // question pattern id the user actually selected (TASK-019). No name matching.
  const classification = validateClassification(parsed.data, {
    patternIds: context.patterns.map((p) => p.id),
    typeCodes: questionTypes === "auto" ? [...QUESTION_TYPE_CODES] : questionTypes,
  });
  if (!classification.ok) {
    console.error("generateQuestions: validation stage failed - classification");
    return { ok: false, stage: "validation", error: classification.error };
  }

  console.log("generateQuestions: generation succeeded");
  // The prompt is returned, not discarded: it is the object of study for the
  // evaluation pipeline, which traces each finding back to a prompt section.
  return {
    ok: true,
    data: parsed.data,
    prompt,
    requestedQuestionCount: DEFAULT_QUESTION_COUNT,
  };
}
