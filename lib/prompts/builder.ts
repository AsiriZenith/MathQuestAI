import {
  ALL_AI_QUESTION_TYPES,
  COMMON_INSTRUCTIONS,
  DIFFICULTY_GUIDANCE,
  OUTPUT_FORMAT_INSTRUCTIONS,
  questionTypeLabel,
} from "@/lib/prompts/common";
import type { PromptRequest } from "@/lib/prompts/types";

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function buildQuestionTypeSection(request: PromptRequest): string {
  if (request.questionTypes === "auto") {
    const labels = ALL_AI_QUESTION_TYPES.map((t) => t.label).join(", ");
    return `QUESTION TYPE\n-------------\nGenerate a varied mix drawn from the following types: ${labels}.`;
  }

  const labels = request.questionTypes.map(questionTypeLabel).join(", ");
  return `QUESTION TYPE\n-------------\n${labels}\n\nEach generated question should use one of the listed types. Not every type needs to appear in every question.`;
}

function buildEducationalContextSection(request: PromptRequest): string {
  const { context } = request;
  const patternLines = context.patterns
    .map((pattern) => {
      const lines = [`- ${pattern.name}`];
      if (pattern.generationPrompt) {
        lines.push(`  Generation guidance: ${pattern.generationPrompt}`);
      }
      return lines.join("\n");
    })
    .join("\n");

  return `EDUCATIONAL CONTEXT\n-------------------\nSubject: ${context.subjectName}\nSubtopic: ${context.subtopicName}\n\nQuestion Patterns:\n${patternLines}\n\nThe listed Question Patterns are the allowed generation context. Not every question needs to use every pattern.\n\nLabel every generated question with the exact Question Pattern name it implements, using the "questionPattern" field described in the OUTPUT FORMAT section.`;
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
