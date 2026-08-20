import { describe, expect, it } from "vitest";
import { getSubjectWithSubtopics } from "@/lib/db/education";
import { getGenerationContext } from "@/lib/db/generation-context";
import { prisma } from "@/lib/prisma";

describe("Dynamic educational data loading (real database)", () => {
  it("loads the Mathematics subject with its Algebra subtopics", async () => {
    const data = await getSubjectWithSubtopics("Mathematics", "Algebra");

    expect(data).not.toBeNull();
    expect(data?.subject.name).toBe("Mathematics");
    expect(data?.topic.name).toBe("Algebra");
    expect(data?.subtopics.some((s) => s.name === "Simplify / Calculate")).toBe(true);
  });

  it("returns null for a subject/topic combination that does not exist", async () => {
    const data = await getSubjectWithSubtopics("Mathematics", "Nonexistent Topic");
    expect(data).toBeNull();
  });

  it("loads only the Question Patterns belonging to the selected Subtopic", async () => {
    const subtopic = await prisma.subtopic.findFirst({
      where: { name: "Simplify / Calculate" },
    });
    expect(subtopic).not.toBeNull();
    if (!subtopic) return;

    const result = await getGenerationContext({
      subjectName: "Mathematics",
      subtopicId: subtopic.id,
      subtopicName: subtopic.name,
      difficulty: "easy",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.context.patterns.length).toBeGreaterThan(0);
    const expectedPatternIds = await prisma.questionPattern.findMany({
      where: { subtopicId: subtopic.id },
      select: { id: true },
    });
    expect(result.context.patterns.map((p) => p.id).sort()).toEqual(
      expectedPatternIds.map((p) => p.id).sort(),
    );
  });

  it("returns a safe error for a subtopic id that does not exist", async () => {
    const result = await getGenerationContext({
      subjectName: "Mathematics",
      subtopicId: "00000000-0000-0000-0000-000000000000",
      subtopicName: "Nonexistent",
      difficulty: "easy",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).not.toMatch(/prisma|postgres|password/i);
    }
  });
});
