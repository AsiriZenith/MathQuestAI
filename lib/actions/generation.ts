"use server";

import { generateQuestions, type GenerateQuestionsResult } from "@/lib/generation/generate-questions";
import type { GenerationContext, QuestionType } from "@/lib/types";

export async function generateQuestionsAction(
  context: GenerationContext | null,
  questionTypes: QuestionType[] | "auto",
): Promise<GenerateQuestionsResult> {
  if (!context) {
    return { ok: false, stage: "prompt", error: "Missing generation context." };
  }
  return generateQuestions(context, questionTypes);
}
