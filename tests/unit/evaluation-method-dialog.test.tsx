import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EvaluationMethodDialog } from "@/app/questions/_components/evaluation-method-dialog";
import type {
  EvaluationData,
  GenerationContext,
  GenerationMeta,
  PracticeConfig,
} from "@/lib/types";
import type { GenerationResponse } from "@/lib/prompts/types";

const prepareEvaluationAction = vi.fn();
vi.mock("@/lib/actions/evaluation", () => ({
  prepareEvaluationAction: (...args: unknown[]) => prepareEvaluationAction(...args),
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
      questionType: "multiple_choice",
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

function renderDialog(onPrepared = vi.fn(), onClose = vi.fn()) {
  render(
    <EvaluationMethodDialog
      open={true}
      onClose={onClose}
      config={CONFIG}
      generationContext={CONTEXT}
      generationResponse={RESPONSE}
      generationMeta={GENERATION_META}
      onPrepared={onPrepared}
    />,
  );
  return { onPrepared, onClose };
}

describe("EvaluationMethodDialog", () => {
  beforeEach(() => {
    prepareEvaluationAction.mockReset();
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
      />,
    );
    expect(screen.queryByText("Choose Evaluation Method")).not.toBeInTheDocument();
  });

  it("renders both evaluation methods, with the second disabled and marked Coming Soon", () => {
    renderDialog();

    expect(
      screen.getByRole("button", { name: /evaluate against predefined questions/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/compare with previous generations/i)).toBeInTheDocument();
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /compare with previous generations/i }),
    ).not.toBeInTheDocument();
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
});
