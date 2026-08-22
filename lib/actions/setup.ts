"use server";

import { getGenerationContext } from "@/lib/db/generation-context";
import { getQuestionPatternsForSubtopic } from "@/lib/db/education";
import type { Difficulty, GenerationContextResult, QuestionPatternsResult } from "@/lib/types";

export async function loadGenerationContextAction(input: {
  subjectName: string;
  subtopicId: string;
  subtopicName: string;
  difficulty: Difficulty;
  patternIds: string[];
}): Promise<GenerationContextResult> {
  return getGenerationContext(input);
}

export async function loadQuestionPatternsAction(
  subtopicId: string,
): Promise<QuestionPatternsResult> {
  return getQuestionPatternsForSubtopic(subtopicId);
}
