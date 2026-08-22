import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import QuestionsPage from "@/app/questions/page";
import {
  renderWithSession,
  TEST_CONFIG,
  TEST_GENERATION_CONTEXT,
  TEST_GENERATION_META,
  TEST_GENERATION_RESPONSE,
} from "../test-utils";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
}));

const prepareEvaluationAction = vi.fn();
vi.mock("@/lib/actions/evaluation", () => ({
  prepareEvaluationAction: (...args: unknown[]) => prepareEvaluationAction(...args),
}));

function renderQuestionsPage() {
  return renderWithSession(<QuestionsPage />, {
    config: TEST_CONFIG,
    generationContext: TEST_GENERATION_CONTEXT,
    generationMeta: TEST_GENERATION_META,
    generationResponse: TEST_GENERATION_RESPONSE,
  });
}

describe("Questions screen", () => {
  beforeEach(() => {
    push.mockClear();
    prepareEvaluationAction.mockReset();
  });

  it("renders a card for every generated question and the coverage badges", () => {
    renderQuestionsPage();

    TEST_GENERATION_RESPONSE.questions.forEach((q) => {
      expect(screen.getByText(`Question ${q.questionNumber}`)).toBeInTheDocument();
    });
    expect(screen.getByText("1 different question types")).toBeInTheDocument();
  });

  it("opens the evaluation-method dialog instead of navigating directly when Evaluate Results is clicked", async () => {
    const user = userEvent.setup();
    renderQuestionsPage();

    await user.click(screen.getByRole("button", { name: /evaluate results/i }));

    expect(screen.getByText("Choose Evaluation Method")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it("navigates to /evaluation after successfully preparing the predefined-questions evaluation", async () => {
    prepareEvaluationAction.mockResolvedValue({
      ok: true,
      data: {
        method: "predefined",
        config: TEST_CONFIG,
        generationContext: TEST_GENERATION_CONTEXT,
        generationResponse: TEST_GENERATION_RESPONSE,
      },
    });
    const user = userEvent.setup();
    renderQuestionsPage();

    await user.click(screen.getByRole("button", { name: /evaluate results/i }));
    await user.click(
      screen.getByRole("button", { name: /evaluate against predefined questions/i }),
    );
    await user.click(screen.getByRole("button", { name: /proceed/i }));

    await vi.waitFor(() => expect(push).toHaveBeenCalledWith("/evaluation"));
  });

  it("keeps the user on the page with a retry option when evaluation preparation fails", async () => {
    prepareEvaluationAction.mockResolvedValue({
      ok: false,
      error: "Unable to prepare evaluation.",
    });
    const user = userEvent.setup();
    renderQuestionsPage();

    await user.click(screen.getByRole("button", { name: /evaluate results/i }));
    await user.click(
      screen.getByRole("button", { name: /evaluate against predefined questions/i }),
    );
    await user.click(screen.getByRole("button", { name: /proceed/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to prepare evaluation.");
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });
});
