import type { Difficulty } from "@/lib/types";

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

export const OUTPUT_FORMAT_INSTRUCTIONS = `Return ONLY valid JSON using this exact structure. Do not wrap it in Markdown code fences. Do not add any text before or after the JSON.

{
  "questions": [
    {
      "questionNumber": 1,
      "questionText": "...",
      "questionType": "mc",
      "questionPatternId": "<the exact id of a pattern from the SELECTED QUESTION PATTERNS section>",
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

The "questionType" field is required for every question. It must be exactly one of the question-type codes listed in the QUESTION TYPE section (for example "mc"). Never invent a code and never use a code that was not listed.

The "options" field is required only when "questionType" is "mc". For other question types, omit "options" and provide "correctAnswer" as the expected answer text.

For every generated question, return the "questionPatternId" of the selected Question Pattern that the question implements. Use the exact ID supplied in the SELECTED QUESTION PATTERNS section. Never invent, modify, or generate a new ID. Do not return the Question Pattern name instead of the ID.`;
