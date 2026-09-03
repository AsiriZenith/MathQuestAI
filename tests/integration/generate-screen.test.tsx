import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GeneratePage from "@/app/generate/page";
import { usePracticeSession } from "@/components/providers/practice-session-provider";
import {
  renderWithSession,
  TEST_COMPARISON_DATA,
  TEST_CONFIG,
  TEST_EVALUATION_DATA,
  TEST_GENERATION_CONTEXT,
  TEST_GENERATION_RESPONSE,
  TEST_PROMPT,
} from "../test-utils";

/** Renders the live session's per-generation derived state so tests can assert on it. */
function SessionProbe() {
  const { savedGenerationContextId, evaluationData, comparisonData, generationResponse, generationMeta } =
    usePracticeSession();
  return (
    <dl>
      <dd data-testid="probe-saved-id">{savedGenerationContextId ?? "null"}</dd>
      <dd data-testid="probe-evaluation">{evaluationData === null ? "null" : "set"}</dd>
      <dd data-testid="probe-comparison">{comparisonData === null ? "null" : "set"}</dd>
      <dd data-testid="probe-response">{generationResponse === null ? "null" : "set"}</dd>
      <dd data-testid="probe-meta">{generationMeta === null ? "null" : "set"}</dd>
    </dl>
  );
}

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
}));

const generateQuestionsActionMock = vi.fn();
vi.mock("@/lib/actions/generation", () => ({
  generateQuestionsAction: (...args: unknown[]) => generateQuestionsActionMock(...args),
}));

beforeEach(() => {
  push.mockClear();
  generateQuestionsActionMock.mockReset();
});

async function runAnimationToEnd() {
  for (let i = 0; i < 4; i++) {
    await act(async () => {
      await new Promise((r) => setTimeout(r, 2250));
    });
  }
}

describe("GeneratePage — real generation", () => {
  it("calls generateQuestionsAction exactly once on mount", async () => {
    generateQuestionsActionMock.mockResolvedValue({ ok: true, data: TEST_GENERATION_RESPONSE });

    renderWithSession(<GeneratePage />, {
      config: TEST_CONFIG,
      generationContext: TEST_GENERATION_CONTEXT,
    });

    expect(generateQuestionsActionMock).toHaveBeenCalledTimes(1);
    expect(generateQuestionsActionMock).toHaveBeenCalledWith(
      TEST_GENERATION_CONTEXT,
      ["mc"],
    );
  });

  it(
    "navigates to /questions with the real result once both the animation and result are ready",
    async () => {
      generateQuestionsActionMock.mockResolvedValue({ ok: true, data: TEST_GENERATION_RESPONSE });
      const user = userEvent.setup();

      renderWithSession(<GeneratePage />, {
        config: TEST_CONFIG,
        generationContext: TEST_GENERATION_CONTEXT,
      });

      expect(generateQuestionsActionMock).toHaveBeenCalledTimes(1);

      await runAnimationToEnd();

      const button = screen.getByRole("button", { name: /view questions/i });
      await user.click(button);

      expect(push).toHaveBeenCalledWith("/questions");
    },
    15000,
  );

  it(
    "shows an error state and does not navigate when generation fails",
    async () => {
      generateQuestionsActionMock.mockResolvedValue({
        ok: false,
        stage: "provider",
        error: "Unable to reach the Gemini API.",
      });

      renderWithSession(<GeneratePage />, {
        config: TEST_CONFIG,
        generationContext: TEST_GENERATION_CONTEXT,
      });

      await runAnimationToEnd();

      expect(screen.getByText(/unable to reach the gemini api/i)).toBeInTheDocument();
      expect(push).not.toHaveBeenCalled();
    },
    15000,
  );
});

describe("GeneratePage — new-generation derived state reset (TASK-024)", () => {
  const SEEDED_STATE = {
    config: TEST_CONFIG,
    generationContext: TEST_GENERATION_CONTEXT,
    savedGenerationContextId: "gc-previous",
    evaluationData: TEST_EVALUATION_DATA,
    comparisonData: TEST_COMPARISON_DATA,
  };

  it(
    "clears the previous generation's saved id and evaluation/comparison data once the new generation is stored",
    async () => {
      generateQuestionsActionMock.mockResolvedValue({
        ok: true,
        data: TEST_GENERATION_RESPONSE,
        prompt: TEST_PROMPT,
        requestedQuestionCount: 10,
      });
      const user = userEvent.setup();

      renderWithSession(
        <>
          <GeneratePage />
          <SessionProbe />
        </>,
        SEEDED_STATE,
      );

      expect(screen.getByTestId("probe-saved-id")).toHaveTextContent("gc-previous");
      expect(screen.getByTestId("probe-evaluation")).toHaveTextContent("set");
      expect(screen.getByTestId("probe-comparison")).toHaveTextContent("set");

      await runAnimationToEnd();
      await user.click(screen.getByRole("button", { name: /view questions/i }));

      expect(screen.getByTestId("probe-saved-id")).toHaveTextContent("null");
      expect(screen.getByTestId("probe-evaluation")).toHaveTextContent("null");
      expect(screen.getByTestId("probe-comparison")).toHaveTextContent("null");
      expect(screen.getByTestId("probe-response")).toHaveTextContent("set");
      expect(screen.getByTestId("probe-meta")).toHaveTextContent("set");
      expect(push).toHaveBeenCalledWith("/questions");
    },
    15000,
  );

  it(
    "leaves the previous generation's derived state untouched when the new generation fails",
    async () => {
      generateQuestionsActionMock.mockResolvedValue({
        ok: false,
        stage: "provider",
        error: "Unable to reach the Gemini API.",
      });

      renderWithSession(
        <>
          <GeneratePage />
          <SessionProbe />
        </>,
        SEEDED_STATE,
      );

      await runAnimationToEnd();

      expect(screen.getByTestId("probe-saved-id")).toHaveTextContent("gc-previous");
      expect(screen.getByTestId("probe-evaluation")).toHaveTextContent("set");
      expect(screen.getByTestId("probe-comparison")).toHaveTextContent("set");
      expect(push).not.toHaveBeenCalled();
    },
    15000,
  );
});
