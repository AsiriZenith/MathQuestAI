import type { GenerationContext } from "@/lib/types";

export type AiQuestionType =
  | "multiple_choice"
  | "fill_in_the_blank"
  | "word_problem"
  | "true_false"
  | "multi_step";

export interface GeneratedQuestionOption {
  id: string;
  text: string;
}

export interface GeneratedQuestion {
  questionNumber: number;
  questionText: string;
  questionType: AiQuestionType;
  options?: GeneratedQuestionOption[];
  correctAnswer: string;
  explanation: string;
}

export interface GenerationResponse {
  questions: GeneratedQuestion[];
}

export interface PromptRequest {
  context: GenerationContext;
  questionTypes: AiQuestionType[] | "auto";
  questionCount: number;
}

export type ParsedGenerationResponse =
  | { ok: true; data: GenerationResponse }
  | { ok: false; error: string };
