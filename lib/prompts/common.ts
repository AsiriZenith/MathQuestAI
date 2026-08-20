import type { Difficulty } from "@/lib/types";
import type { AiQuestionType } from "@/lib/prompts/types";

export const COMMON_INSTRUCTIONS = `You are generating mathematics practice questions for a research prototype.
Generate exactly the requested number of questions.
Every question must be based on the educational context and reference questions provided below.
Follow the requested difficulty and question type(s).
Do not include any commentary, explanation, or text outside the required JSON output format.`;

export const DIFFICULTY_GUIDANCE: Record<Difficulty, string> = {
  easy: "Direct application of the Question Pattern. Usually requires one main step and a familiar structure.",
  medium:
    "Still directly related to the Question Pattern, but requires additional processing or approximately 2-3 connected steps.",
  hard: "Requires multiple connected steps, a more complex arrangement, or a combination of a few related complexity factors.",
};

export const QUESTION_TYPE_ID_MAP: Record<string, { id: AiQuestionType; label: string }> = {
  mc: { id: "multiple_choice", label: "Multiple Choice" },
  fib: { id: "fill_in_the_blank", label: "Fill in the Blank" },
  wp: { id: "word_problem", label: "Word Problem" },
  tf: { id: "true_false", label: "True / False" },
  ms: { id: "multi_step", label: "Multi-step Problem" },
};

export const ALL_AI_QUESTION_TYPES: { id: AiQuestionType; label: string }[] =
  Object.values(QUESTION_TYPE_ID_MAP);

export function questionTypeLabel(id: AiQuestionType): string {
  return ALL_AI_QUESTION_TYPES.find((t) => t.id === id)?.label ?? id;
}

export const OUTPUT_FORMAT_INSTRUCTIONS = `Return ONLY valid JSON using this exact structure. Do not wrap it in Markdown code fences. Do not add any text before or after the JSON.

{
  "questions": [
    {
      "questionNumber": 1,
      "questionText": "...",
      "questionType": "multiple_choice",
      "options": [
        { "id": "A", "text": "..." },
        { "id": "B", "text": "..." },
        { "id": "C", "text": "..." },
        { "id": "D", "text": "..." }
      ],
      "correctAnswer": "A",
      "explanation": "..."
    }
  ]
}

The "options" field is required only when "questionType" is "multiple_choice". For other question types, omit "options" and provide "correctAnswer" as the expected answer text.`;
