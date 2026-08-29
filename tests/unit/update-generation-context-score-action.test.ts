import { beforeEach, describe, expect, it, vi } from "vitest";

const updateGenerationContextScoreMock = vi.fn();
vi.mock("@/lib/db/generation-context", () => ({
  updateGenerationContextScore: (...args: unknown[]) => updateGenerationContextScoreMock(...args),
}));

import { updateGenerationContextScoreAction } from "@/lib/actions/evaluation";

beforeEach(() => {
  updateGenerationContextScoreMock.mockReset();
});

describe("updateGenerationContextScoreAction", () => {
  it("returns a safe error without calling the repository when generationContextId is null", async () => {
    const result = await updateGenerationContextScoreAction({
      generationContextId: null,
      score: 85,
    });

    expect(result.ok).toBe(false);
    expect(updateGenerationContextScoreMock).not.toHaveBeenCalled();
  });

  it("forwards the id and score to the repository on success", async () => {
    updateGenerationContextScoreMock.mockResolvedValue({ ok: true });

    const result = await updateGenerationContextScoreAction({
      generationContextId: "ctx-1",
      score: 85,
    });

    expect(result).toEqual({ ok: true });
    expect(updateGenerationContextScoreMock).toHaveBeenCalledWith("ctx-1", 85);
  });

  it("propagates a repository failure as a safe error", async () => {
    updateGenerationContextScoreMock.mockResolvedValue({
      ok: false,
      error: "internal detail: postgres connection refused",
    });

    const result = await updateGenerationContextScoreAction({
      generationContextId: "ctx-1",
      score: 85,
    });

    expect(result.ok).toBe(false);
  });
});
