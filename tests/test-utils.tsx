import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement } from "react";
import { PracticeSessionProvider } from "@/components/providers/practice-session-provider";
import type { GenerationResponse } from "@/lib/prompts/types";
import type {
  EvaluationData,
  GenerationContext,
  GenerationMeta,
  PracticeConfig,
} from "@/lib/types";

export function renderWithSession(
  ui: ReactElement,
  initialState: {
    config?: PracticeConfig | null;
    generationResponse?: GenerationResponse | null;
    generationContext?: GenerationContext | null;
    generationMeta?: GenerationMeta | null;
    evaluationData?: EvaluationData | null;
  } = {},
  options?: Omit<RenderOptions, "wrapper">,
) {
  return render(ui, {
    wrapper: ({ children }) => (
      <PracticeSessionProvider
        initialConfig={initialState.config ?? null}
        initialGenerationResponse={initialState.generationResponse ?? null}
        initialGenerationContext={initialState.generationContext ?? null}
        initialGenerationMeta={initialState.generationMeta ?? null}
        initialEvaluationData={initialState.evaluationData ?? null}
      >
        {children}
      </PracticeSessionProvider>
    ),
    ...options,
  });
}

export const TEST_CONFIG: PracticeConfig = {
  grade: "Grade 6",
  subtopic: "Simplify & Calculate",
  subtopicId: "test-subtopic-id",
  difficulty: "easy",
  selectedTypes: ["mc"],
  autoTypes: false,
  selectedPatternIds: ["pattern-a"],
  autoPatterns: false,
};

export const TEST_GENERATION_CONTEXT: GenerationContext = {
  subjectName: "Mathematics",
  subtopicName: "Simplify & Calculate",
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
    questionPattern: "Combine Like Terms",
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

/** Minimal prompt containing the section headings the evaluation traces against. */
export const TEST_PROMPT = [
  "COMMON INSTRUCTIONS\n-------------------\nGenerate exactly the requested number of questions.",
  "GENERATION REQUIREMENT\n----------------------\nGenerate 10 questions.",
  'EDUCATIONAL CONTEXT\n-------------------\nSubject: Mathematics\nSubtopic: Simplify & Calculate\n\nQuestion Patterns:\n- Combine Like Terms\n\nLabel every generated question with the exact Question Pattern name it implements, using the "questionPattern" field described in the OUTPUT FORMAT section.',
  "DIFFICULTY\n----------\nEasy\n\nEasy means:\nDirect application of the Question Pattern.",
  "QUESTION TYPE\n-------------\nMultiple Choice",
  "REFERENCE QUESTIONS\n-------------------\nNo reference questions are available for this context.",
  'OUTPUT FORMAT\n-------------\nReturn ONLY valid JSON. The "questionPattern" field is required for every question.',
].join("\n\n");

export const TEST_GENERATION_META: GenerationMeta = {
  prompt: TEST_PROMPT,
  requestedQuestionCount: 10,
};
