import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
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
const findMatchingGenerationContextsAction = vi.fn();
const prepareComparisonAction = vi.fn();
vi.mock("@/lib/actions/evaluation", () => ({
  prepareEvaluationAction: (...args: unknown[]) => prepareEvaluationAction(...args),
  findMatchingGenerationContextsAction: (...args: unknown[]) =>
    findMatchingGenerationContextsAction(...args),
  prepareComparisonAction: (...args: unknown[]) => prepareComparisonAction(...args),
}));

const saveGenerationAction = vi.fn();
vi.mock("@/lib/actions/save-generation", () => ({
  saveGenerationAction: (...args: unknown[]) => saveGenerationAction(...args),
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
    findMatchingGenerationContextsAction.mockReset();
    prepareComparisonAction.mockReset();
    saveGenerationAction.mockReset();
  });

  it("renders a card for every generated question and the coverage badges", () => {
    renderQuestionsPage();

    TEST_GENERATION_RESPONSE.questions.forEach((q) => {
      expect(screen.getByText(`Question ${q.questionNumber}`)).toBeInTheDocument();
    });
    expect(screen.getByText("1 different question types")).toBeInTheDocument();
  });

  it("links each card's Try Question action to that question's focused practice page", () => {
    renderQuestionsPage();

    const links = screen.getAllByRole("link", { name: /try question/i });
    expect(links).toHaveLength(TEST_GENERATION_RESPONSE.questions.length);
    TEST_GENERATION_RESPONSE.questions.forEach((q, i) => {
      expect(links[i]).toHaveAttribute(
        "href",
        `/questions/practice/${q.questionNumber}`,
      );
    });
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

  describe("Compare with Previous Generations", () => {
    const SAVED_CONTEXT = {
      id: "ctx-1",
      name: "Generation-2026-01-01-00-00-00-000",
      difficultyLevel: "Easy",
      aiProvider: "deepseek",
      aiModel: "deepseek-chat",
      patterns: [
        { id: "pattern-a", name: "Combine Like Terms" },
        { id: "pattern-b", name: "Solve Linear Equations" },
      ],
      questionTypes: ["mc", "fib"],
    };

    const openSavedResults = async (user: ReturnType<typeof userEvent.setup>) => {
      await user.click(screen.getByRole("button", { name: /evaluate results/i }));
      await user.click(
        screen.getByRole("button", { name: /compare with previous generations/i }),
      );
    };

    it("shows the matching saved results with the required columns", async () => {
      findMatchingGenerationContextsAction.mockResolvedValue({
        ok: true,
        contexts: [SAVED_CONTEXT],
      });
      const user = userEvent.setup();
      renderQuestionsPage();

      await openSavedResults(user);

      expect(await screen.findByText(SAVED_CONTEXT.name)).toBeInTheDocument();
      expect(
        screen.getByText("Combine Like Terms, Solve Linear Equations"),
      ).toBeInTheDocument();
      expect(screen.getByText("Multiple Choice, Fill in the Blank")).toBeInTheDocument();
      expect(screen.getByText("deepseek")).toBeInTheDocument();
      expect(screen.getByText("deepseek-chat")).toBeInTheDocument();
      expect(screen.getByRole("cell", { name: "Easy" })).toBeInTheDocument();
    });

    it("disables Compare until a row is selected, then enables it and navigates to /comparison using the id", async () => {
      findMatchingGenerationContextsAction.mockResolvedValue({
        ok: true,
        contexts: [SAVED_CONTEXT],
      });
      prepareComparisonAction.mockResolvedValue({
        ok: true,
        data: {
          current: { method: "predefined", result: { promptEffectiveness: 84 } },
          previous: { method: "saved", result: { promptEffectiveness: 76 } },
          comparison: { overallScore: { current: 84, previous: 76, difference: 8 }, dimensions: [] },
        },
      });
      const user = userEvent.setup();
      renderQuestionsPage();

      await openSavedResults(user);
      const compareButton = await screen.findByRole("button", { name: /^compare$/i });
      expect(compareButton).toBeDisabled();

      await user.click(screen.getByRole("radio", { name: /select generation-2026/i }));
      expect(compareButton).toBeEnabled();

      await user.click(compareButton);

      await vi.waitFor(() =>
        expect(prepareComparisonAction).toHaveBeenCalledWith(
          expect.objectContaining({
            currentGenerationContextId: null,
            previousGenerationContextId: "ctx-1",
          }),
        ),
      );
      await vi.waitFor(() => expect(push).toHaveBeenCalledWith("/comparison"));
      expect(push).not.toHaveBeenCalledWith("/evaluation");
    });

    it("shows a clear message when no saved results match", async () => {
      findMatchingGenerationContextsAction.mockResolvedValue({ ok: true, contexts: [] });
      const user = userEvent.setup();
      renderQuestionsPage();

      await openSavedResults(user);

      expect(
        await screen.findByText(/no saved results were found for the selected/i),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /back/i })).toBeInTheDocument();
    });

    it("leaves the predefined-questions option working as before", async () => {
      prepareEvaluationAction.mockResolvedValue({
        ok: true,
        data: { method: "predefined", generationResponse: TEST_GENERATION_RESPONSE },
      });
      const user = userEvent.setup();
      renderQuestionsPage();

      await user.click(screen.getByRole("button", { name: /evaluate results/i }));
      await user.click(
        screen.getByRole("button", { name: /evaluate against predefined questions/i }),
      );
      await user.click(screen.getByRole("button", { name: /^proceed$/i }));

      await vi.waitFor(() => expect(push).toHaveBeenCalledWith("/evaluation"));
      expect(findMatchingGenerationContextsAction).not.toHaveBeenCalled();
    });
  });

  describe("Save for Evaluation", () => {
    const openSaveDialog = async (user: ReturnType<typeof userEvent.setup>) => {
      await user.click(screen.getByRole("button", { name: /save for evaluation/i }));
      return within(screen.getByRole("alertdialog", { name: /save questions for evaluation/i }));
    };

    it("opens a confirmation dialog and does not save until confirmed", async () => {
      const user = userEvent.setup();
      renderQuestionsPage();

      const dialog = await openSaveDialog(user);

      expect(
        dialog.getByText(/save the questions and their generation details/i),
      ).toBeInTheDocument();
      expect(saveGenerationAction).not.toHaveBeenCalled();
      expect(push).not.toHaveBeenCalled();
    });

    it("closes on Cancel without saving, questions still visible", async () => {
      const user = userEvent.setup();
      renderQuestionsPage();

      const dialog = await openSaveDialog(user);
      await user.click(dialog.getByRole("button", { name: /^cancel$/i }));

      await waitFor(() =>
        expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
      );
      expect(saveGenerationAction).not.toHaveBeenCalled();
      expect(screen.getByText("Question 1")).toBeInTheDocument();
    });

    it("submits the session data once and shows the saved state on success", async () => {
      let resolve!: (v: { ok: true; generationContextId: string }) => void;
      saveGenerationAction.mockReturnValue(
        new Promise((r) => {
          resolve = r;
        }),
      );
      const user = userEvent.setup();
      renderQuestionsPage();

      const dialog = await openSaveDialog(user);
      await user.click(dialog.getByRole("button", { name: /^save for evaluation$/i }));

      // while the request is in flight the confirm button shows "Saving…" and
      // is disabled, so a repeat submission can't be made
      const savingDialog = within(screen.getByRole("alertdialog"));
      expect(savingDialog.getByRole("button", { name: /saving/i })).toBeDisabled();
      expect(
        savingDialog.queryByRole("button", { name: /^save for evaluation$/i }),
      ).not.toBeInTheDocument();
      expect(saveGenerationAction).toHaveBeenCalledTimes(1);
      expect(saveGenerationAction).toHaveBeenCalledWith({
        config: TEST_CONFIG,
        generationContext: TEST_GENERATION_CONTEXT,
        generationResponse: TEST_GENERATION_RESPONSE,
        generationMeta: TEST_GENERATION_META,
      });

      resolve({ ok: true, generationContextId: "gc-1" });

      expect(await screen.findByRole("status")).toHaveTextContent(
        "Questions saved successfully for evaluation.",
      );
      await waitFor(() =>
        expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
      );
      expect(
        screen.queryByRole("button", { name: /save for evaluation/i }),
      ).not.toBeInTheDocument();
    });

    it("offers to save a freshly generated set even when its configuration matches an earlier saved run (TASK-024)", () => {
      // A new generation resets savedGenerationContextId to null, so identical
      // criteria to an earlier saved generation must not suppress the button.
      renderWithSession(<QuestionsPage />, {
        config: TEST_CONFIG,
        generationContext: TEST_GENERATION_CONTEXT,
        generationMeta: TEST_GENERATION_META,
        generationResponse: TEST_GENERATION_RESPONSE,
        savedGenerationContextId: null,
      });

      expect(
        screen.getByRole("button", { name: /save for evaluation/i }),
      ).toBeInTheDocument();
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    it("does not offer to save again once already saved", () => {
      renderWithSession(<QuestionsPage />, {
        config: TEST_CONFIG,
        generationContext: TEST_GENERATION_CONTEXT,
        generationMeta: TEST_GENERATION_META,
        generationResponse: TEST_GENERATION_RESPONSE,
        savedGenerationContextId: "gc-existing",
      });

      expect(screen.getByRole("status")).toHaveTextContent("Questions saved successfully");
      expect(
        screen.queryByRole("button", { name: /save for evaluation/i }),
      ).not.toBeInTheDocument();
      expect(saveGenerationAction).not.toHaveBeenCalled();
    });

    it("shows a generic error and keeps the questions on failure", async () => {
      saveGenerationAction.mockResolvedValue({
        ok: false,
        error: "We couldn't save the questions for evaluation. Please try again.",
      });
      const user = userEvent.setup();
      renderQuestionsPage();

      const dialog = await openSaveDialog(user);
      await user.click(dialog.getByRole("button", { name: /^save for evaluation$/i }));

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "We couldn't save the questions for evaluation. Please try again.",
      );
      expect(screen.getByText("Question 1")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });
  });
});
