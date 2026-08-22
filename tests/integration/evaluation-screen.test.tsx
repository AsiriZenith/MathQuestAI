import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EvaluationPage from "@/app/evaluation/page";
import { evaluateGeneration } from "@/lib/evaluation/evaluate-generation";
import {
  renderWithSession,
  TEST_CONFIG,
  TEST_GENERATION_CONTEXT,
  TEST_GENERATION_META,
  TEST_GENERATION_RESPONSE,
} from "../test-utils";
import type { EvaluationData } from "@/lib/types";

const replace = vi.fn();
const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
}));

const RESULT = evaluateGeneration({
  config: TEST_CONFIG,
  generationContext: TEST_GENERATION_CONTEXT,
  generationResponse: TEST_GENERATION_RESPONSE,
  prompt: TEST_GENERATION_META.prompt,
  requestedQuestionCount: TEST_GENERATION_META.requestedQuestionCount,
});

const EVALUATION_DATA: EvaluationData = {
  method: "predefined",
  config: TEST_CONFIG,
  generationContext: TEST_GENERATION_CONTEXT,
  generationResponse: TEST_GENERATION_RESPONSE,
  prompt: TEST_GENERATION_META.prompt,
  requestedQuestionCount: TEST_GENERATION_META.requestedQuestionCount,
  result: RESULT,
};

describe("Evaluation screen", () => {
  beforeEach(() => {
    replace.mockClear();
    push.mockClear();
  });

  it("redirects home when no evaluation has been prepared", async () => {
    renderWithSession(<EvaluationPage />, {});
    await vi.waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
  });

  it("renders the prompt effectiveness score and its explanation", () => {
    renderWithSession(<EvaluationPage />, { evaluationData: EVALUATION_DATA });

    // The percentage can also appear on a dimension row, so scope to the hero ring.
    expect(screen.getAllByText(`${RESULT.promptEffectiveness}%`).length).toBeGreaterThan(0);
    expect(screen.getByText("followed")).toBeInTheDocument();
    expect(screen.getByText(/experimental prototype metric/i)).toBeInTheDocument();
  });

  it("frames the report around the prompt rather than the AI model", () => {
    renderWithSession(<EvaluationPage />, { evaluationData: EVALUATION_DATA });

    expect(screen.getByText(/how well did this prompt work/i)).toBeInTheDocument();
    expect(screen.getByText(/not the AI model/i)).toBeInTheDocument();
  });

  it("renders every scored dimension in the breakdown", () => {
    renderWithSession(<EvaluationPage />, { evaluationData: EVALUATION_DATA });

    for (const dimension of RESULT.dimensions) {
      expect(screen.getAllByText(dimension.label).length).toBeGreaterThan(0);
    }
  });

  it("shows the requested and generated question counts side by side", () => {
    renderWithSession(<EvaluationPage />, { evaluationData: EVALUATION_DATA });

    expect(screen.getByText(/what the prompt asked for vs what came back/i)).toBeInTheDocument();
  });

  it("exposes the real prompt, split into its sections", async () => {
    const user = userEvent.setup();
    renderWithSession(<EvaluationPage />, { evaluationData: EVALUATION_DATA });

    expect(screen.getByText(/the prompt that produced this/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /GENERATION REQUIREMENT/ }));
    expect(await screen.findByText(/Generate 10 questions\./)).toBeInTheDocument();
  });

  it("navigates back to generate when asked for another set", async () => {
    const user = userEvent.setup();
    renderWithSession(<EvaluationPage />, { evaluationData: EVALUATION_DATA });

    await user.click(screen.getByRole("button", { name: /generate another set/i }));
    expect(push).toHaveBeenCalledWith("/generate");
  });
});
