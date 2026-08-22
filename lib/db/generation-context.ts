import "server-only";
import { prisma } from "@/lib/prisma";
import type { Difficulty, GenerationContextResult } from "@/lib/types";

export async function getGenerationContext(input: {
  subjectName: string;
  subtopicId: string;
  subtopicName: string;
  difficulty: Difficulty;
  patternIds: string[];
}): Promise<GenerationContextResult> {
  try {
    if (input.patternIds.length === 0) {
      return { ok: false, error: "Select at least one question pattern." };
    }

    const patterns = await prisma.questionPattern.findMany({
      where: { id: { in: input.patternIds }, subtopicId: input.subtopicId },
      select: { id: true, name: true },
    });

    if (patterns.length === 0) {
      return { ok: false, error: "No question patterns are available for this subtopic." };
    }

    const patternIds = patterns.map((p) => p.id);

    const [generationRequests, referenceQuestions] = await Promise.all([
      prisma.questionGenerationRequest.findMany({
        where: { questionPatternId: { in: patternIds }, difficultyLevel: input.difficulty },
        select: { questionPatternId: true, generationPrompt: true },
      }),
      prisma.referenceQuestion.findMany({
        where: { questionPatternId: { in: patternIds }, difficultyLevel: input.difficulty },
        select: {
          id: true,
          questionPatternId: true,
          questionText: true,
          expectedAnswer: true,
          explanation: true,
        },
      }),
    ]);

    const promptByPattern = new Map(
      generationRequests.map((r) => [r.questionPatternId, r.generationPrompt]),
    );

    return {
      ok: true,
      context: {
        subjectName: input.subjectName,
        subtopicName: input.subtopicName,
        difficulty: input.difficulty,
        patterns: patterns.map((pattern) => ({
          id: pattern.id,
          name: pattern.name,
          generationPrompt: promptByPattern.get(pattern.id) ?? null,
          referenceQuestions: referenceQuestions
            .filter((rq) => rq.questionPatternId === pattern.id)
            .map((rq) => ({
              id: rq.id,
              questionText: rq.questionText,
              expectedAnswer: rq.expectedAnswer,
              explanation: rq.explanation,
            })),
        })),
      },
    };
  } catch {
    return { ok: false, error: "Unable to load question data." };
  }
}
