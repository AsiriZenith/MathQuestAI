import { beforeEach, describe, expect, it } from "vitest";
import { vi } from "vitest";
import { screen } from "@testing-library/react";
import ComparisonPage from "@/app/comparison/page";
import { evaluateGeneration } from "@/lib/evaluation/evaluate-generation";
import { compareEvaluationResults } from "@/lib/evaluation/compare-evaluations";
import {
  renderWithSession,
  TEST_CONFIG,
  TEST_GENERATION_CONTEXT,
  TEST_GENERATION_META,
  TEST_GENERATION_RESPONSE,
} from "../test-utils";
import type { ComparisonData, EvaluationData } from "@/lib/types";

const replace = vi.fn();
const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
}));

const updateGenerationContextScoreAction = vi.fn();
vi.mock("@/lib/actions/evaluation", () => ({
  updateGenerationContextScoreAction: (...args: unknown[]) =>
    updateGenerationContextScoreAction(...args),
}));

const CURRENT_RESULT = evaluateGeneration({
  config: TEST_CONFIG,
  generationContext: TEST_GENERATION_CONTEXT,
  generationResponse: TEST_GENERATION_RESPONSE,
  prompt: TEST_GENERATION_META.prompt,
  requestedQuestionCount: TEST_GENERATION_META.requestedQuestionCount,
});

// Fewer questions than requested -> a genuinely different (lower) score, via the
// real evaluateGeneration pipeline rather than a fabricated number.
const PREVIOUS_RESPONSE = { questions: TEST_GENERATION_RESPONSE.questions.slice(0, 5) };
const PREVIOUS_RESULT = evaluateGeneration({
  config: TEST_CONFIG,
  generationContext: TEST_GENERATION_CONTEXT,
  generationResponse: PREVIOUS_RESPONSE,
  prompt: TEST_GENERATION_META.prompt,
  requestedQuestionCount: TEST_GENERATION_META.requestedQuestionCount,
});

const CURRENT_DATA: EvaluationData = {
  method: "predefined",
  config: TEST_CONFIG,
  generationContext: TEST_GENERATION_CONTEXT,
  generationResponse: TEST_GENERATION_RESPONSE,
  prompt: TEST_GENERATION_META.prompt,
  requestedQuestionCount: TEST_GENERATION_META.requestedQuestionCount,
  result: CURRENT_RESULT,
  generationContextId: "current-ctx",
};

const PREVIOUS_DATA: EvaluationData = {
  method: "saved",
  config: TEST_CONFIG,
  generationContext: TEST_GENERATION_CONTEXT,
  generationResponse: PREVIOUS_RESPONSE,
  prompt: TEST_GENERATION_META.prompt,
  requestedQuestionCount: TEST_GENERATION_META.requestedQuestionCount,
  result: PREVIOUS_RESULT,
  generationContextId: "previous-ctx",
};

const COMPARISON_DATA: ComparisonData = {
  current: CURRENT_DATA,
  previous: PREVIOUS_DATA,
  comparison: compareEvaluationResults(CURRENT_RESULT, PREVIOUS_RESULT),
};

describe("Comparison screen", () => {
  beforeEach(() => {
    replace.mockClear();
    push.mockClear();
    updateGenerationContextScoreAction.mockReset();
    updateGenerationContextScoreAction.mockResolvedValue({ ok: true });
  });

  it("redirects home when no comparison has been prepared", async () => {
    renderWithSession(<ComparisonPage />, {});
    await vi.waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
  });

  it("clearly labels the current and previous generations", () => {
    renderWithSession(<ComparisonPage />, { comparisonData: COMPARISON_DATA });

    expect(screen.getAllByText("Current Generation").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Previous Generation").length).toBeGreaterThan(0);
  });

  it("shows both overall scores", () => {
    renderWithSession(<ComparisonPage />, { comparisonData: COMPARISON_DATA });

    expect(screen.getAllByText(`${CURRENT_RESULT.promptEffectiveness}%`).length).toBeGreaterThan(0);
    expect(screen.getAllByText(`${PREVIOUS_RESULT.promptEffectiveness}%`).length).toBeGreaterThan(0);
  });

  it("shows the overall score difference without requiring the reader to calculate it", () => {
    renderWithSession(<ComparisonPage />, { comparisonData: COMPARISON_DATA });

    const difference = CURRENT_RESULT.promptEffectiveness - PREVIOUS_RESULT.promptEffectiveness;
    const sign = difference > 0 ? "+" : "";
    expect(screen.getByText(`${sign}${difference}%`)).toBeInTheDocument();
  });

  it("renders every comparable dimension with its label", () => {
    renderWithSession(<ComparisonPage />, { comparisonData: COMPARISON_DATA });

    for (const dimension of COMPARISON_DATA.comparison.dimensions) {
      expect(screen.getByText(dimension.label)).toBeInTheDocument();
    }
  });

  describe("Score persistence (TASK-023)", () => {
    it("persists both sides' scores against their own GenerationContextId", async () => {
      renderWithSession(<ComparisonPage />, { comparisonData: COMPARISON_DATA });

      await vi.waitFor(() =>
        expect(updateGenerationContextScoreAction).toHaveBeenCalledWith({
          generationContextId: "current-ctx",
          score: CURRENT_RESULT.promptEffectiveness,
        }),
      );
      expect(updateGenerationContextScoreAction).toHaveBeenCalledWith({
        generationContextId: "previous-ctx",
        score: PREVIOUS_RESULT.promptEffectiveness,
      });
      expect(updateGenerationContextScoreAction).toHaveBeenCalledTimes(2);
    });

    it("does not persist the current side's score when it has not been saved", async () => {
      renderWithSession(<ComparisonPage />, {
        comparisonData: { ...COMPARISON_DATA, current: { ...CURRENT_DATA, generationContextId: null } },
      });

      await vi.waitFor(() =>
        expect(updateGenerationContextScoreAction).toHaveBeenCalledWith({
          generationContextId: "previous-ctx",
          score: PREVIOUS_RESULT.promptEffectiveness,
        }),
      );
      expect(updateGenerationContextScoreAction).toHaveBeenCalledTimes(1);
    });

    it("shows a non-blocking notice when a score fails to save, without hiding the comparison", async () => {
      updateGenerationContextScoreAction.mockResolvedValue({ ok: false, error: "internal detail" });
      renderWithSession(<ComparisonPage />, { comparisonData: COMPARISON_DATA });

      expect(await screen.findByRole("alert")).toHaveTextContent(/couldn't save/i);
      expect(screen.getAllByText(`${CURRENT_RESULT.promptEffectiveness}%`).length).toBeGreaterThan(0);
    });

    it("shows nothing extra when both scores save successfully", async () => {
      renderWithSession(<ComparisonPage />, { comparisonData: COMPARISON_DATA });

      await vi.waitFor(() => expect(updateGenerationContextScoreAction).toHaveBeenCalledTimes(2));
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });
});
