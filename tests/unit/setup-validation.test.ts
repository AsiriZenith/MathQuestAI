import { describe, expect, it } from "vitest";
import { canGenerate } from "@/lib/mock-data";

const base = {
  grade: "Grade 6",
  subtopic: "Simplify & Calculate",
  difficulty: "easy" as const,
  selectedTypesSize: 1,
  autoTypes: false,
  selectedPatternsSize: 1,
  autoPatterns: false,
};

describe("canGenerate", () => {
  it("is true when all fields are filled and a type and pattern are selected", () => {
    expect(canGenerate(base)).toBe(true);
  });

  it("is false when subtopic is missing", () => {
    expect(canGenerate({ ...base, subtopic: "" })).toBe(false);
  });

  it("is false when difficulty is missing", () => {
    expect(canGenerate({ ...base, difficulty: "" })).toBe(false);
  });

  it("is false when grade is missing", () => {
    expect(canGenerate({ ...base, grade: "" })).toBe(false);
  });

  it("is false when no types are selected and autoTypes is off", () => {
    expect(canGenerate({ ...base, selectedTypesSize: 0, autoTypes: false })).toBe(false);
  });

  it("is true when no types are selected but autoTypes is on", () => {
    expect(canGenerate({ ...base, selectedTypesSize: 0, autoTypes: true })).toBe(true);
  });

  it("is false when no patterns are selected and autoPatterns is off", () => {
    expect(canGenerate({ ...base, selectedPatternsSize: 0, autoPatterns: false })).toBe(false);
  });

  it("is true when no patterns are selected but autoPatterns is on", () => {
    expect(canGenerate({ ...base, selectedPatternsSize: 0, autoPatterns: true })).toBe(true);
  });
});
