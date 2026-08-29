import { beforeEach, describe, expect, it, vi } from "vitest";

const prepareComparisonMock = vi.fn();
vi.mock("@/lib/evaluation/prepare-comparison", () => ({
  prepareComparison: (...args: unknown[]) => prepareComparisonMock(...args),
}));

import { prepareComparisonAction } from "@/lib/actions/evaluation";
import type { GenerationContext, GenerationMeta, PracticeConfig } from "@/lib/types";
import type { GenerationResponse } from "@/lib/prompts/types";

const CONFIG = { grade: "Grade 6" } as unknown as PracticeConfig;
const CONTEXT = { subjectName: "Mathematics" } as unknown as GenerationContext;
const RESPONSE = { questions: [] } as unknown as GenerationResponse;
const META: GenerationMeta = { prompt: "FINAL PROMPT", requestedQuestionCount: 10 };

function input(overrides: Partial<Parameters<typeof prepareComparisonAction>[0]> = {}) {
  return {
    config: CONFIG,
    generationContext: CONTEXT,
    generationResponse: RESPONSE,
    generationMeta: META,
    currentGenerationContextId: "current-ctx",
    previousGenerationContextId: "previous-ctx",
    ...overrides,
  };
}

beforeEach(() => {
  prepareComparisonMock.mockReset();
});

describe("prepareComparisonAction", () => {
  it.each(["config", "generationContext", "generationResponse", "generationMeta"] as const)(
    "returns a safe error without calling prepareComparison when %s is missing",
    async (missing) => {
      const result = await prepareComparisonAction(input({ [missing]: null }));

      expect(result.ok).toBe(false);
      expect(prepareComparisonMock).not.toHaveBeenCalled();
    },
  );

  it("returns a safe error when previousGenerationContextId is missing", async () => {
    const result = await prepareComparisonAction(input({ previousGenerationContextId: "" }));

    expect(result.ok).toBe(false);
    expect(prepareComparisonMock).not.toHaveBeenCalled();
  });

  it("forwards the session data to prepareComparison", async () => {
    prepareComparisonMock.mockResolvedValue({ ok: true, data: "comparison-data" });

    const result = await prepareComparisonAction(input());

    expect(prepareComparisonMock).toHaveBeenCalledWith({
      config: CONFIG,
      generationContext: CONTEXT,
      generationResponse: RESPONSE,
      prompt: META.prompt,
      requestedQuestionCount: META.requestedQuestionCount,
      currentGenerationContextId: "current-ctx",
      previousGenerationContextId: "previous-ctx",
    });
    expect(result).toEqual({ ok: true, data: "comparison-data" });
  });

  it("allows a null currentGenerationContextId (current generation not yet saved)", async () => {
    prepareComparisonMock.mockResolvedValue({ ok: true, data: "comparison-data" });

    await prepareComparisonAction(input({ currentGenerationContextId: null }));

    expect(prepareComparisonMock).toHaveBeenCalledWith(
      expect.objectContaining({ currentGenerationContextId: null }),
    );
  });
});
