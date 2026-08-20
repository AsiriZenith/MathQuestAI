import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";

describe("Database connection", () => {
  it("connects to the existing PostgreSQL database and reads seeded Subject data", async () => {
    const subjects = await prisma.subject.findMany();

    expect(subjects.length).toBeGreaterThan(0);
    expect(subjects[0]).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      language: expect.any(String),
    });
  });

  it("resolves the seeded Algebra Question Patterns via the Subtopic relation", async () => {
    const subtopic = await prisma.subtopic.findFirst({
      where: { name: "Simplify / Calculate" },
      include: { questionPatterns: true },
    });

    expect(subtopic).not.toBeNull();
    expect(subtopic?.questionPatterns.length).toBeGreaterThan(0);
  });
});
