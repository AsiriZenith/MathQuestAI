import { z } from "zod";
import type { ParsedGenerationResponse } from "@/lib/prompts/types";

const optionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
});

const questionSchema = z
  .object({
    questionNumber: z.number().int().positive(),
    questionText: z.string().min(1),
    questionType: z.enum([
      "multiple_choice",
      "fill_in_the_blank",
      "word_problem",
      "true_false",
      "multi_step",
    ]),
    options: z.array(optionSchema).optional(),
    correctAnswer: z.string().min(1),
    explanation: z.string().min(1),
  })
  .superRefine((question, ctx) => {
    if (question.questionType === "multiple_choice") {
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
    return { ok: false, error: "Response does not match the expected question schema." };
  }

  return { ok: true, data: result.data };
}
