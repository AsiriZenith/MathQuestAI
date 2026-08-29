import { beforeEach, describe, expect, it, vi } from "vitest";

const prepareEvaluationMock = vi.fn();
const prepareSavedEvaluationMock = vi.fn();
const compareEvaluationResultsMock = vi.fn();

vi.mock("@/lib/evaluation/prepare-evaluation", () => ({
  prepareEvaluation: (...args: unknown[]) => prepareEvaluationMock(...args),
  prepareSavedEvaluation: (...args: unknown[]) => prepareSavedEvaluationMock(...args),
}));

vi.mock("@/lib/evaluation/compare-evaluations", () => ({
  compareEvaluationResults: (...args: unknown[]) => compareEvaluationResultsMock(...args),
}));

import { prepareComparison } from "@/lib/evaluation/prepare-comparison";
import type { GenerationContext, PracticeConfig } from "@/lib/types";
import type { GenerationResponse } from "@/lib/prompts/types";

const CONFIG = { grade: "Grade 6" } as unknown as PracticeConfig;
const CONTEXT = { subjectName: "Mathematics" } as unknown as GenerationContext;
const RESPONSE = { questions: [] } as unknown as GenerationResponse;

const CURRENT_EVALUATION_DATA = {
  method: "predefined",
  result: { promptEffectiveness: 84 },
  generationContextId: "current-ctx",
};
const PREVIOUS_EVALUATION_DATA = {
  method: "saved",
  result: { promptEffectiveness: 76 },
  generationContextId: "previous-ctx",
};
const COMPARISON_RESULT = { overallScore: { current: 84, previous: 76, difference: 8 }, dimensions: [] };

function input(overrides: Partial<Parameters<typeof prepareComparison>[0]> = {}) {
  return {
    config: CONFIG,
    generationContext: CONTEXT,
    generationResponse: RESPONSE,
    prompt: "FINAL PROMPT",
    requestedQuestionCount: 10,
    currentGenerationContextId: "current-ctx",
    previousGenerationContextId: "previous-ctx",
    ...overrides,
  };
}

beforeEach(() => {
  prepareEvaluationMock.mockReset();
  prepareSavedEvaluationMock.mockReset();
  compareEvaluationResultsMock.mockReset();
  prepareEvaluationMock.mockResolvedValue({ ok: true, data: CURRENT_EVALUATION_DATA });
  prepareSavedEvaluationMock.mockResolvedValue({ ok: true, data: PREVIOUS_EVALUATION_DATA });
  compareEvaluationResultsMock.mockReturnValue(COMPARISON_RESULT);
});

describe("prepareComparison", () => {
  it("evaluates the current generation with method 'predefined' and its own id", async () => {
    await prepareComparison(input());

    expect(prepareEvaluationMock).toHaveBeenCalledWith({
      method: "predefined",
      config: CONFIG,
      generationContext: CONTEXT,
      generationResponse: RESPONSE,
      prompt: "FINAL PROMPT",
      requestedQuestionCount: 10,
      generationContextId: "current-ctx",
    });
  });

  it("evaluates the previous generation by loading it via prepareSavedEvaluation", async () => {
    await prepareComparison(input());

    expect(prepareSavedEvaluationMock).toHaveBeenCalledWith("previous-ctx");
  });

  it("compares the two fresh results and returns the combined comparison data", async () => {
    const result = await prepareComparison(input());

    expect(compareEvaluationResultsMock).toHaveBeenCalledWith(
      CURRENT_EVALUATION_DATA.result,
      PREVIOUS_EVALUATION_DATA.result,
    );
    expect(result).toEqual({
      ok: true,
      data: {
        current: CURRENT_EVALUATION_DATA,
        previous: PREVIOUS_EVALUATION_DATA,
        comparison: COMPARISON_RESULT,
      },
    });
  });

  it("propagates a current-evaluation failure without evaluating the previous side", async () => {
    prepareEvaluationMock.mockResolvedValue({ ok: false, error: "current failed" });

    const result = await prepareComparison(input());

    expect(result).toEqual({ ok: false, error: "current failed" });
    expect(prepareSavedEvaluationMock).not.toHaveBeenCalled();
    expect(compareEvaluationResultsMock).not.toHaveBeenCalled();
  });

  it("propagates a previous-evaluation failure", async () => {
    prepareSavedEvaluationMock.mockResolvedValue({ ok: false, error: "previous failed" });

    const result = await prepareComparison(input());

    expect(result).toEqual({ ok: false, error: "previous failed" });
    expect(compareEvaluationResultsMock).not.toHaveBeenCalled();
  });

  it("works when the current generation has no saved id (null)", async () => {
    await prepareComparison(input({ currentGenerationContextId: null }));

    expect(prepareEvaluationMock).toHaveBeenCalledWith(
      expect.objectContaining({ generationContextId: null }),
    );
  });
});
