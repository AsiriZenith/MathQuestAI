import { QUESTION_TYPE_CODES, type QuestionType } from "@/lib/types";
import type { GenerationResponse } from "@/lib/prompts/types";

/**
 * Verify that every generated question classified itself with a question type
 * and a question pattern id that the user actually selected (TASK-019 §8, §9).
 *
 * The schema already guarantees `questionType` is a valid code and
 * `questionPatternId` is a non-empty string. This step is the membership check —
 * it needs the current selection to compare against, which the schema does not
 * have. There is deliberately no name-based resolution: the id is compared
 * verbatim.
 */
export function validateClassification(
  response: GenerationResponse,
  selected: { patternIds: string[]; typeCodes: QuestionType[] },
): { ok: true } | { ok: false; error: string } {
  const patternIds = new Set(selected.patternIds);
  const typeCodes = new Set<string>(
    selected.typeCodes.length > 0 ? selected.typeCodes : QUESTION_TYPE_CODES,
  );

  const problems: string[] = [];

  for (const q of response.questions) {
    if (!typeCodes.has(q.questionType)) {
      problems.push(
        `question ${q.questionNumber} used question type "${q.questionType}", which was not selected`,
      );
    }
    if (!patternIds.has(q.questionPatternId)) {
      problems.push(
        `question ${q.questionNumber} used question pattern id "${q.questionPatternId}", which is not one of the selected patterns`,
      );
    }
  }

  if (problems.length === 0) return { ok: true };

  return {
    ok: false,
    error: `The generated questions were not classified against the selected options: ${problems.join("; ")}.`,
  };
}
