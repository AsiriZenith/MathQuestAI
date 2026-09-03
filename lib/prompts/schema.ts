import { z } from "zod";
import { QUESTION_TYPE_CODES } from "@/lib/types";
import type { ParsedGenerationResponse } from "@/lib/prompts/types";

const optionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
});

/**
 * Normalise an absent-ish value to `undefined` before validation.
 *
 * Zod's `.optional()` accepts `undefined` but rejects `null`, and models
 * routinely emit `null` or `""` for a field they cannot confidently fill.
 * Because `questions` is validated as a whole array, one such value would
 * otherwise invalidate an entire batch of good questions.
 */
function emptyToUndefined(value: unknown): unknown {
  if (value === null) return undefined;
  if (typeof value === "string" && value.trim().length === 0) return undefined;
  if (Array.isArray(value) && value.length === 0) return undefined;
  return value;
}

const questionSchema = z
  .object({
    questionNumber: z.number().int().positive(),
    questionText: z.string().min(1),
    // The stable question-type code (TASK-019). Membership in the user's
    // selected types is checked afterwards by validateClassification.
    questionType: z.enum(QUESTION_TYPE_CODES),
    // Required (TASK-019): the exact database id of a selected Question Pattern.
    // Whether it is actually one of the selected ids is checked by
    // validateClassification, which has the selection to compare against.
    questionPatternId: z.string().trim().min(1),
    // The prompt tells the model to omit `options` for non-mc questions, and a
    // literal `null` there must not invalidate the batch. The mc case is
    // enforced below.
    options: z.preprocess(emptyToUndefined, z.array(optionSchema).optional()),
    correctAnswer: z.string().min(1),
    explanation: z.string().min(1),
  })
  .superRefine((question, ctx) => {
    if (question.questionType === "mc") {
      if (!question.options || question.options.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "multiple_choice questions require a non-empty options array",
          path: ["options"],
        });
        return;
      }
      if (!question.options.some((opt) => opt.id === question.correctAnswer)) {
        ctx.addIssue({
          code: "custom",
          message: "correctAnswer must match one of the option ids",
          path: ["correctAnswer"],
        });
      }
    }
  });

export const generationResponseSchema = z.object({
  questions: z.array(questionSchema).min(1),
});

export function parseGenerationResponse(raw: string): ParsedGenerationResponse {
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch {
    return { ok: false, error: "Response is not valid JSON." };
  }

  const result = generationResponseSchema.safeParse(parsedJson);
  if (!result.success) {
    // Log the offending field paths server-side so a schema mismatch is
    // diagnosable; the returned message stays generic because provider
    // internals must not reach the user (docs architecture §27).
    console.error(
      "parseGenerationResponse: schema validation failed -",
      result.error.issues
        .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
        .join(" | "),
    );
    return { ok: false, error: "Response does not match the expected question schema." };
  }

  return { ok: true, data: result.data };
}
