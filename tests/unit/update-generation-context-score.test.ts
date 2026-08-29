import { beforeEach, describe, expect, it, vi } from "vitest";

const updateGenerationContext = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    generationContext: { update: (...args: unknown[]) => updateGenerationContext(...args) },
  },
}));

import { updateGenerationContextScore } from "@/lib/db/generation-context";

beforeEach(() => {
  updateGenerationContext.mockReset();
});

describe("updateGenerationContextScore", () => {
  it("updates the score column with the score, keyed by id", async () => {
    updateGenerationContext.mockResolvedValue({ id: "ctx-1" });

    const result = await updateGenerationContextScore("ctx-1", 85);

    expect(result).toEqual({ ok: true });
    expect(updateGenerationContext).toHaveBeenCalledWith({
      where: { id: "ctx-1" },
      data: { score: 85 },
    });
  });

  it("returns a safe error and does not call Prisma for an empty id", async () => {
    const result = await updateGenerationContextScore("", 85);

    expect(result.ok).toBe(false);
    expect(updateGenerationContext).not.toHaveBeenCalled();
  });

  it.each([-1, 101, 3.5, Number.NaN])(
    "returns a safe error and does not call Prisma for an invalid score %j",
    async (score) => {
      const result = await updateGenerationContextScore("ctx-1", score);

      expect(result.ok).toBe(false);
      expect(updateGenerationContext).not.toHaveBeenCalled();
    },
  );

  it("returns a safe error when the context does not exist", async () => {
    updateGenerationContext.mockRejectedValue(
      new Error("An operation failed because it depends on one or more records that were required but not found."),
    );

    const result = await updateGenerationContextScore("missing-id", 85);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).not.toMatch(/prisma|postgres|password|connection/i);
  });

  it("returns a safe error on a database failure without leaking details", async () => {
    updateGenerationContext.mockRejectedValue(new Error("connection refused; postgres password"));

    const result = await updateGenerationContextScore("ctx-1", 85);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).not.toMatch(/prisma|postgres|password|connection/i);
  });
});
