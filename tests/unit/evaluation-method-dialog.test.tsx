import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EvaluationMethodDialog } from "@/app/questions/_components/evaluation-method-dialog";
import type {
  ComparisonData,
  EvaluationData,
  GenerationContext,
  GenerationMeta,
  PracticeConfig,
} from "@/lib/types";
import type { GenerationResponse } from "@/lib/prompts/types";

const prepareEvaluationAction = vi.fn();
const findMatchingGenerationContextsAction = vi.fn();
const prepareComparisonAction = vi.fn();
vi.mock("@/lib/actions/evaluation", () => ({
  prepareEvaluationAction: (...args: unknown[]) => prepareEvaluationAction(...args),
  findMatchingGenerationContextsAction: (...args: unknown[]) =>
    findMatchingGenerationContextsAction(...args),
  prepareComparisonAction: (...args: unknown[]) => prepareComparisonAction(...args),
}));

const CONFIG: PracticeConfig = {
  grade: "Grade 6",
  subtopic: "Simplify & Calculate",
  subtopicId: "subtopic-1",
  difficulty: "easy",
  selectedTypes: ["mc"],
  autoTypes: false,
  selectedPatternIds: ["pattern-a"],
  autoPatterns: false,
};

const CONTEXT: GenerationContext = {
  subjectName: "Mathematics",
  subtopicName: "Simplify & Calculate",
  difficulty: "easy",
  patterns: [],
};

const RESPONSE: GenerationResponse = {
  questions: [
    {
      questionNumber: 1,
      questionText: "Simplify 3x + 5x.",
      questionType: "mc",
      questionPatternId: "pattern-a",
      options: [{ id: "A", text: "8x" }],
      correctAnswer: "A",
      explanation: "3x and 5x are like terms.",
    },
  ],
};

const GENERATION_META: GenerationMeta = {
  prompt: "GENERATION REQUIREMENT\n----------------------\nGenerate 1 questions.",
  requestedQuestionCount: 1,
};

const EVALUATION_DATA = {
  method: "predefined",
  config: CONFIG,
  generationContext: CONTEXT,
  generationResponse: RESPONSE,
  prompt: GENERATION_META.prompt,
  requestedQuestionCount: GENERATION_META.requestedQuestionCount,
  result: { promptEffectiveness: 82 },
} as unknown as EvaluationData;

function renderDialog(
  onPrepared = vi.fn(),
  onClose = vi.fn(),
  savedGenerationContextId: string | null = null,
  onComparisonPrepared = vi.fn(),
) {
  render(
    <EvaluationMethodDialog
      open={true}
      onClose={onClose}
      config={CONFIG}
      generationContext={CONTEXT}
      generationResponse={RESPONSE}
      generationMeta={GENERATION_META}
      onPrepared={onPrepared}
      onComparisonPrepared={onComparisonPrepared}
      savedGenerationContextId={savedGenerationContextId}
    />,
  );
  return { onPrepared, onClose, onComparisonPrepared };
}

describe("EvaluationMethodDialog", () => {
  beforeEach(() => {
    prepareEvaluationAction.mockReset();
    findMatchingGenerationContextsAction.mockReset();
    prepareComparisonAction.mockReset();
  });

  it("does not render when closed", () => {
    render(
      <EvaluationMethodDialog
        open={false}
        onClose={vi.fn()}
        config={CONFIG}
        generationContext={CONTEXT}
        generationResponse={RESPONSE}
        generationMeta={GENERATION_META}
        onPrepared={vi.fn()}
        onComparisonPrepared={vi.fn()}
      />,
    );
    expect(screen.queryByText("Choose Evaluation Method")).not.toBeInTheDocument();
  });

  it("renders both evaluation methods, both selectable", () => {
    renderDialog();

    expect(
      screen.getByRole("button", { name: /evaluate against predefined questions/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /compare with previous generations/i }),
    ).toBeInTheDocument();
  });

  it("disables Proceed until the predefined-questions option is selected", async () => {
    const user = userEvent.setup();
    renderDialog();

    const proceedButton = screen.getByRole("button", { name: /proceed/i });
    expect(proceedButton).toBeDisabled();

    await user.click(
      screen.getByRole("button", { name: /evaluate against predefined questions/i }),
    );
    expect(proceedButton).toBeEnabled();
  });

  it("shows a loading state, then calls onPrepared with the result on success", async () => {
    let resolvePrepare: (value: { ok: true; data: EvaluationData }) => void;
    prepareEvaluationAction.mockReturnValue(
      new Promise((resolve) => {
        resolvePrepare = resolve;
      }),
    );
    const user = userEvent.setup();
    const { onPrepared } = renderDialog();

    await user.click(
      screen.getByRole("button", { name: /evaluate against predefined questions/i }),
    );
    await user.click(screen.getByRole("button", { name: /proceed/i }));

    expect(screen.getByText(/preparing evaluation/i)).toBeInTheDocument();
    expect(prepareEvaluationAction).toHaveBeenCalledWith({
      method: "predefined",
      config: CONFIG,
      generationContext: CONTEXT,
      generationResponse: RESPONSE,
      generationMeta: GENERATION_META,
      generationContextId: null,
    });

    resolvePrepare!({ ok: true, data: EVALUATION_DATA });
    await vi.waitFor(() => expect(onPrepared).toHaveBeenCalledWith(EVALUATION_DATA));
  });

  it("shows an error and allows retry when preparation fails", async () => {
    prepareEvaluationAction.mockResolvedValue({ ok: false, error: "Unable to prepare evaluation." });
    const user = userEvent.setup();
    const { onPrepared } = renderDialog();

    await user.click(
      screen.getByRole("button", { name: /evaluate against predefined questions/i }),
    );
    await user.click(screen.getByRole("button", { name: /proceed/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to prepare evaluation.");
    expect(onPrepared).not.toHaveBeenCalled();

    const retryButton = screen.getByRole("button", { name: /try again/i });
    expect(retryButton).toBeEnabled();
  });

  describe("Compare with Previous Generations", () => {
    const SAVED_CONTEXTS = [
      {
        id: "ctx-1",
        name: "Generation-1",
        difficultyLevel: "Easy",
        aiProvider: "groq",
        aiModel: "openai/gpt-oss-120b",
        patterns: [{ id: "pattern-a", name: "Combine Like Terms" }],
        questionTypes: ["mc"],
      },
      {
        id: "ctx-2",
        name: "Generation-2",
        difficultyLevel: "Easy",
        aiProvider: "groq",
        aiModel: "openai/gpt-oss-120b",
        patterns: [{ id: "pattern-a", name: "Combine Like Terms" }],
        questionTypes: ["mc"],
      },
    ];

    it("only allows one saved row to be selected at a time", async () => {
      findMatchingGenerationContextsAction.mockResolvedValue({
        ok: true,
        contexts: SAVED_CONTEXTS,
      });
      const user = userEvent.setup();
      renderDialog();

      await user.click(
        screen.getByRole("button", { name: /compare with previous generations/i }),
      );

      const radio1 = await screen.findByRole("radio", { name: /select generation-1/i });
      const radio2 = screen.getByRole("radio", { name: /select generation-2/i });

      await user.click(radio1);
      expect(radio1).toBeChecked();
      expect(radio2).not.toBeChecked();

      await user.click(radio2);
      expect(radio1).not.toBeChecked();
      expect(radio2).toBeChecked();
    });

    it("shows the empty-results message and lets the user go back", async () => {
      findMatchingGenerationContextsAction.mockResolvedValue({ ok: true, contexts: [] });
      const user = userEvent.setup();
      renderDialog();

      await user.click(
        screen.getByRole("button", { name: /compare with previous generations/i }),
      );

      expect(
        await screen.findByText(/no saved results were found for the selected/i),
      ).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /back/i }));
      expect(
        screen.getByRole("button", { name: /compare with previous generations/i }),
      ).toBeInTheDocument();
    });

    it("prepares a comparison and fires onComparisonPrepared on success (TASK-023)", async () => {
      findMatchingGenerationContextsAction.mockResolvedValue({
        ok: true,
        contexts: SAVED_CONTEXTS,
      });
      const comparisonData = {
        current: { result: { promptEffectiveness: 84 } },
        previous: { result: { promptEffectiveness: 76 } },
        comparison: { overallScore: { current: 84, previous: 76, difference: 8 }, dimensions: [] },
      } as unknown as ComparisonData;
      prepareComparisonAction.mockResolvedValue({ ok: true, data: comparisonData });
      const user = userEvent.setup();
      const { onComparisonPrepared, onPrepared } = renderDialog(vi.fn(), vi.fn(), "ctx-current");

      await user.click(
        screen.getByRole("button", { name: /compare with previous generations/i }),
      );
      await user.click(await screen.findByRole("radio", { name: /select generation-1/i }));
      await user.click(screen.getByRole("button", { name: /^compare$/i }));

      expect(prepareComparisonAction).toHaveBeenCalledWith({
        config: CONFIG,
        generationContext: CONTEXT,
        generationResponse: RESPONSE,
        generationMeta: GENERATION_META,
        currentGenerationContextId: "ctx-current",
        previousGenerationContextId: "ctx-1",
      });
      await vi.waitFor(() => expect(onComparisonPrepared).toHaveBeenCalledWith(comparisonData));
      expect(onPrepared).not.toHaveBeenCalled();
    });

    it("shows an error and stays on the saved-list when comparison preparation fails", async () => {
      findMatchingGenerationContextsAction.mockResolvedValue({
        ok: true,
        contexts: SAVED_CONTEXTS,
      });
      prepareComparisonAction.mockResolvedValue({ ok: false, error: "Unable to prepare comparison." });
      const user = userEvent.setup();
      const { onComparisonPrepared } = renderDialog();

      await user.click(
        screen.getByRole("button", { name: /compare with previous generations/i }),
      );
      await user.click(await screen.findByRole("radio", { name: /select generation-1/i }));
      await user.click(screen.getByRole("button", { name: /^compare$/i }));

      expect(await screen.findByRole("alert")).toHaveTextContent("Unable to prepare comparison.");
      expect(onComparisonPrepared).not.toHaveBeenCalled();
      // still on the saved-list phase — the radio selection should still be visible
      expect(screen.getByRole("radio", { name: /select generation-1/i })).toBeInTheDocument();
    });

    it("passes the current generation's saved id as an exclusion when finding matches (TASK-022)", async () => {
      findMatchingGenerationContextsAction.mockResolvedValue({ ok: true, contexts: [] });
      const user = userEvent.setup();
      renderDialog(vi.fn(), vi.fn(), "ctx-current");

      await user.click(
        screen.getByRole("button", { name: /compare with previous generations/i }),
      );

      expect(findMatchingGenerationContextsAction).toHaveBeenCalledWith({
        config: CONFIG,
        generationContext: CONTEXT,
        excludeGenerationContextId: "ctx-current",
      });
    });
  });
});
