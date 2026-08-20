"use server";

import { getGenerationContext } from "@/lib/db/generation-context";
import type { Difficulty, GenerationContextResult } from "@/lib/types";

export async function loadGenerationContextAction(input: {
  subjectName: string;
  subtopicId: string;
  subtopicName: string;
  difficulty: Difficulty;
}): Promise<GenerationContextResult> {
  return getGenerationContext(input);
}
