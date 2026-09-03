import { beforeEach, describe, expect, it, vi } from "vitest";

const findManyGenerationContext = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    generationContext: { findMany: (...args: unknown[]) => findManyGenerationContext(...args) },
  },
}));

import { findMatchingGenerationContexts } from "@/lib/db/generation-context";

function row(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "ctx-1",
    name: "Generation-2026-01-01-00-00-00-000",
    difficultyLevel: "Medium",
    aiProvider: "deepseek",
    aiModel: "deepseek-chat",
    questionTypes: [{ questionType: "mc" }, { questionType: "fib" }],
    questionPatterns: [
      { questionPatternId: "pattern-a", questionPattern: { id: "pattern-a", name: "A" } },
      { questionPatternId: "pattern-b", questionPattern: { id: "pattern-b", name: "B" } },
    ],
    ...overrides,
  };
}

beforeEach(() => {
  findManyGenerationContext.mockReset();
});

describe("findMatchingGenerationContexts", () => {
  it("filters by difficulty level at the database level", async () => {
    findManyGenerationContext.mockResolvedValue([]);

    await findMatchingGenerationContexts({
      difficultyLevel: "Medium",
      questionTypeCodes: ["mc"],
      questionPatternIds: ["pattern-a"],
    });

    expect(findManyGenerationContext).toHaveBeenCalledWith(
      expect.objectContaining({ where: { difficultyLevel: "Medium" } }),
    );
  });

  it("returns an exact match on pattern-id set and type-code set", async () => {
    findManyGenerationContext.mockResolvedValue([row()]);

    const result = await findMatchingGenerationContexts({
      difficultyLevel: "Medium",
      questionTypeCodes: ["fib", "mc"],
      questionPatternIds: ["pattern-b", "pattern-a"],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.contexts).toHaveLength(1);
    expect(result.contexts[0]).toEqual({
      id: "ctx-1",
      name: "Generation-2026-01-01-00-00-00-000",
      difficultyLevel: "Medium",
      aiProvider: "deepseek",
      aiModel: "deepseek-chat",
      patterns: [
        { id: "pattern-a", name: "A" },
        { id: "pattern-b", name: "B" },
      ],
      questionTypes: ["mc", "fib"],
    });
  });

  it("excludes a saved context with a missing pattern", async () => {
    findManyGenerationContext.mockResolvedValue([row()]);

    const result = await findMatchingGenerationContexts({
      difficultyLevel: "Medium",
      questionTypeCodes: ["mc", "fib"],
      questionPatternIds: ["pattern-a", "pattern-b", "pattern-c"],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.contexts).toHaveLength(0);
  });

  it("excludes a saved context with an extra pattern", async () => {
    findManyGenerationContext.mockResolvedValue([
      row({
        questionPatterns: [
          { questionPatternId: "pattern-a", questionPattern: { id: "pattern-a", name: "A" } },
          { questionPatternId: "pattern-b", questionPattern: { id: "pattern-b", name: "B" } },
          { questionPatternId: "pattern-c", questionPattern: { id: "pattern-c", name: "C" } },
        ],
      }),
    ]);

    const result = await findMatchingGenerationContexts({
      difficultyLevel: "Medium",
      questionTypeCodes: ["mc", "fib"],
      questionPatternIds: ["pattern-a", "pattern-b"],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.contexts).toHaveLength(0);
  });

  it("excludes a saved context with a different pattern set", async () => {
    findManyGenerationContext.mockResolvedValue([
      row({
        questionPatterns: [
          { questionPatternId: "pattern-a", questionPattern: { id: "pattern-a", name: "A" } },
          { questionPatternId: "pattern-c", questionPattern: { id: "pattern-c", name: "C" } },
        ],
      }),
    ]);

    const result = await findMatchingGenerationContexts({
      difficultyLevel: "Medium",
      questionTypeCodes: ["mc", "fib"],
      questionPatternIds: ["pattern-a", "pattern-b"],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.contexts).toHaveLength(0);
  });

  it("excludes a saved context missing a question type", async () => {
    findManyGenerationContext.mockResolvedValue([
      row({ questionTypes: [{ questionType: "mc" }] }),
    ]);

    const result = await findMatchingGenerationContexts({
      difficultyLevel: "Medium",
      questionTypeCodes: ["mc", "fib"],
      questionPatternIds: ["pattern-a", "pattern-b"],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.contexts).toHaveLength(0);
  });

  it("excludes a saved context with an extra question type", async () => {
    findManyGenerationContext.mockResolvedValue([
      row({ questionTypes: [{ questionType: "mc" }, { questionType: "fib" }, { questionType: "tf" }] }),
    ]);

    const result = await findMatchingGenerationContexts({
      difficultyLevel: "Medium",
      questionTypeCodes: ["mc", "fib"],
      questionPatternIds: ["pattern-a", "pattern-b"],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.contexts).toHaveLength(0);
  });

  it("excludes a saved context with a different question type", async () => {
    findManyGenerationContext.mockResolvedValue([
      row({ questionTypes: [{ questionType: "mc" }, { questionType: "tf" }] }),
    ]);

    const result = await findMatchingGenerationContexts({
      difficultyLevel: "Medium",
      questionTypeCodes: ["mc", "fib"],
      questionPatternIds: ["pattern-a", "pattern-b"],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.contexts).toHaveLength(0);
  });

  it("returns an empty list when nothing is saved", async () => {
    findManyGenerationContext.mockResolvedValue([]);

    const result = await findMatchingGenerationContexts({
      difficultyLevel: "Medium",
      questionTypeCodes: ["mc"],
      questionPatternIds: ["pattern-a"],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.contexts).toEqual([]);
  });

  it("adds a server-side id exclusion to the where clause when excludeGenerationContextId is given", async () => {
    findManyGenerationContext.mockResolvedValue([]);

    await findMatchingGenerationContexts({
      difficultyLevel: "Medium",
      questionTypeCodes: ["mc"],
      questionPatternIds: ["pattern-a"],
      excludeGenerationContextId: "ctx-current",
    });

    expect(findManyGenerationContext).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { difficultyLevel: "Medium", id: { not: "ctx-current" } },
      }),
    );
  });

  it("does not add an id exclusion when excludeGenerationContextId is omitted", async () => {
    findManyGenerationContext.mockResolvedValue([]);

    await findMatchingGenerationContexts({
      difficultyLevel: "Medium",
      questionTypeCodes: ["mc"],
      questionPatternIds: ["pattern-a"],
    });

    const where = findManyGenerationContext.mock.calls[0][0].where;
    expect(where.id).toBeUndefined();
  });

  it("worked example (TASK-022 §4): excludes the current generation but keeps other exact matches", async () => {
    // Simulates the DB already having applied `id != A` — B is the only exact match left.
    findManyGenerationContext.mockResolvedValue([
      row({ id: "B", questionTypes: [{ questionType: "mc" }, { questionType: "fib" }] }),
      row({ id: "C", questionTypes: [{ questionType: "mc" }] }), // not an exact type match anyway
    ]);

    const result = await findMatchingGenerationContexts({
      difficultyLevel: "Medium",
      questionTypeCodes: ["mc", "fib"],
      questionPatternIds: ["pattern-a", "pattern-b"],
      excludeGenerationContextId: "A",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.contexts.map((c) => c.id)).toEqual(["B"]);
  });

  it("returns an empty list when the current generation was the only match", async () => {
    findManyGenerationContext.mockResolvedValue([]); // DB already excluded A, nothing else matches

    const result = await findMatchingGenerationContexts({
      difficultyLevel: "Medium",
      questionTypeCodes: ["mc", "fib"],
      questionPatternIds: ["pattern-a", "pattern-b"],
      excludeGenerationContextId: "A",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.contexts).toEqual([]);
  });

  it("returns a safe error when the database call fails", async () => {
    findManyGenerationContext.mockRejectedValue(new Error("connection refused: password auth failed"));

    const result = await findMatchingGenerationContexts({
      difficultyLevel: "Medium",
      questionTypeCodes: ["mc"],
      questionPatternIds: ["pattern-a"],
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).not.toMatch(/password|connection refused/i);
  });
});
