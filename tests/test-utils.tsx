import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement } from "react";
import { PracticeSessionProvider } from "@/components/providers/practice-session-provider";
import type { GeneratedQuestion, PracticeConfig } from "@/lib/types";

export function renderWithSession(
  ui: ReactElement,
  initialState: { config?: PracticeConfig | null; questions?: GeneratedQuestion[] | null } = {},
  options?: Omit<RenderOptions, "wrapper">,
) {
  return render(ui, {
    wrapper: ({ children }) => (
      <PracticeSessionProvider
        initialConfig={initialState.config ?? null}
        initialQuestions={initialState.questions ?? null}
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
  difficulty: "easy",
  selectedTypes: ["mc"],
  autoTypes: false,
};
