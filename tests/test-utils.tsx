import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement } from "react";
import { PracticeSessionProvider } from "@/components/providers/practice-session-provider";
import type { GenerationResponse } from "@/lib/prompts/types";
import type { GenerationContext, PracticeConfig } from "@/lib/types";

export function renderWithSession(
  ui: ReactElement,
  initialState: {
    config?: PracticeConfig | null;
    generationResponse?: GenerationResponse | null;
    generationContext?: GenerationContext | null;
  } = {},
  options?: Omit<RenderOptions, "wrapper">,
) {
  return render(ui, {
    wrapper: ({ children }) => (
      <PracticeSessionProvider
        initialConfig={initialState.config ?? null}
        initialGenerationResponse={initialState.generationResponse ?? null}
        initialGenerationContext={initialState.generationContext ?? null}
      >
        {children}
      </PracticeSessionProvider>
    ),
    ...options,
  });
}

export const TEST_CONFIG: PracticeConfig = {
  grade: "Grade 6",
  subtopic: "Simplify / Calculate",
  subtopicId: "test-subtopic-id",
  difficulty: "easy",
  selectedTypes: ["mc"],
  autoTypes: false,
};

export const TEST_GENERATION_CONTEXT: GenerationContext = {
  subjectName: "Mathematics",
  subtopicName: "Simplify / Calculate",
  difficulty: "easy",
  patterns: [
    {
      id: "pattern-a",
      name: "Combine Like Terms",
      generationPrompt: "Focus on combining like terms.",
      referenceQuestions: [],
    },
  ],
};

export const TEST_GENERATION_RESPONSE: GenerationResponse = {
  questions: Array.from({ length: 10 }, (_, i) => ({
    questionNumber: i + 1,
    questionText: `Simplify the expression ${i + 1}.`,
    questionType: "multiple_choice" as const,
    options: [
      { id: "A", text: "Option A" },
      { id: "B", text: "Option B" },
      { id: "C", text: "Option C" },
      { id: "D", text: "Option D" },
    ],
    correctAnswer: "A",
    explanation: "Because A is correct.",
  })),
};
