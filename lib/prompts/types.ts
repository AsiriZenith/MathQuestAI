import type { GenerationContext, QuestionType } from "@/lib/types";

export interface GeneratedQuestionOption {
  id: string;
  text: string;
}

export interface GeneratedQuestion {
  questionNumber: number;
  questionText: string;
  /** One of the stable question-type codes the user selected (TASK-019). */
  questionType: QuestionType;
  /**
   * The exact database id of the selected Question Pattern this question
   * implements — supplied to the AI in the prompt and returned verbatim
   * (TASK-019). The application never resolves a pattern name to an id.
   */
  questionPatternId: string;
  options?: GeneratedQuestionOption[];
  correctAnswer: string;
  explanation: string;
}

export interface GenerationResponse {
  questions: GeneratedQuestion[];
}

export interface PromptRequest {
  context: GenerationContext;
  questionTypes: QuestionType[] | "auto";
  questionCount: number;
}

export type ParsedGenerationResponse =
  | { ok: true; data: GenerationResponse }
  | { ok: false; error: string };
