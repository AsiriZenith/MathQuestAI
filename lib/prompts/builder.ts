import {
  COMMON_INSTRUCTIONS,
  DIFFICULTY_GUIDANCE,
  OUTPUT_FORMAT_INSTRUCTIONS,
} from "@/lib/prompts/common";
import { QUESTION_TYPE_CODES, questionTypeLabel } from "@/lib/types";
import type { PromptRequest } from "@/lib/prompts/types";

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function buildQuestionTypeSection(request: PromptRequest): string {
  const codes =
    request.questionTypes === "auto" ? [...QUESTION_TYPE_CODES] : request.questionTypes;

  const list = codes.map((code) => `- ID: ${code}\n  Name: ${questionTypeLabel(code)}`).join("\n");

  const instruction =
    request.questionTypes === "auto"
      ? 'Generate a varied mix drawn from the question types above. Set each question\'s "questionType" field to the ID (e.g. "mc") of the type it uses.'
      : 'Each question must use exactly one of the question types above. Set the "questionType" field to that type\'s ID (e.g. "mc"). Do not use a type that is not listed, and do not invent a new one. Not every type needs to appear in every question.';

  return `QUESTION TYPE\n-------------\nSELECTED QUESTION TYPES\n\n${list}\n\n${instruction}`;
}

function buildEducationalContextSection(request: PromptRequest): string {
  const { context } = request;
  const patternBlocks = context.patterns
    .map((pattern, index) => {
      const lines = [`${index + 1}.`, `   ID: ${pattern.id}`, `   Name: ${pattern.name}`];
      if (pattern.generationPrompt) {
        lines.push(`   Details: ${pattern.generationPrompt}`);
      }
      return lines.join("\n");
    })
    .join("\n\n");

  return `EDUCATIONAL CONTEXT\n-------------------\nSubject: ${context.subjectName}\nSubtopic: ${context.subtopicName}\n\nSELECTED QUESTION PATTERNS\n\n${patternBlocks}\n\nThe listed Question Patterns are the allowed generation context. Not every question needs to use every pattern.\n\nFor every generated question, set the "questionPatternId" field to the exact ID (shown above) of the Question Pattern the question implements. Use the ID exactly as written; never invent or modify it, and never return the pattern name instead of the ID.`;
}

function buildDifficultySection(request: PromptRequest): string {
  const difficulty = request.context.difficulty;
  return `DIFFICULTY\n----------\n${capitalize(difficulty)}\n\n${capitalize(difficulty)} means:\n${DIFFICULTY_GUIDANCE[difficulty]}`;
}

function buildReferenceQuestionsSection(request: PromptRequest): string {
  const examples = request.context.patterns.flatMap((pattern) =>
    pattern.referenceQuestions.map((rq) => ({ pattern: pattern.name, rq })),
  );

  if (examples.length === 0) {
    return "REFERENCE QUESTIONS\n-------------------\nNo reference questions are available for this context.";
  }

  const body = examples
    .map(({ pattern, rq }, index) => {
      const lines = [`Example ${index + 1} (${pattern}):`, rq.questionText];
      if (rq.explanation) lines.push(`Explanation: ${rq.explanation}`);
      return lines.join("\n");
    })
    .join("\n\n");

  return `REFERENCE QUESTIONS\n-------------------\nThese are examples of the expected style and structure. Use them as guidance, not as questions to copy directly.\n\n${body}`;
}

export function buildPrompt(request: PromptRequest): string {
  const sections = [
    `COMMON INSTRUCTIONS\n-------------------\n${COMMON_INSTRUCTIONS}`,
    `GENERATION REQUIREMENT\n----------------------\nGenerate ${request.questionCount} questions.`,
    buildEducationalContextSection(request),
    buildDifficultySection(request),
    buildQuestionTypeSection(request),
    buildReferenceQuestionsSection(request),
    `OUTPUT FORMAT\n-------------\n${OUTPUT_FORMAT_INSTRUCTIONS}`,
  ];

  return sections.join("\n\n");
}
