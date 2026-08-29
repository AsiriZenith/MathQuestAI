import { describe, expect, it } from "vitest";
import { compareEvaluationResults } from "@/lib/evaluation/compare-evaluations";
import type { DimensionScore, EvaluationResult } from "@/lib/evaluation/types";

function dimension(overrides: Partial<DimensionScore> = {}): DimensionScore {
  return {
    id: "count_adherence",
    label: "Question count",
    score: 0.8,
    weight: 10,
    status: "partial",
    confidence: "high",
    promptSection: "generation_requirement",
    method: "method",
    summary: "summary",
    ...overrides,
  };
}

function result(overrides: Partial<EvaluationResult> = {}): EvaluationResult {
  return {
    promptEffectiveness: 84,
    band: "strong",
    explanation: "explanation",
    dimensions: [
      dimension({ id: "count_adherence", label: "Question count", score: 0.9 }),
      dimension({ id: "output_integrity", label: "Output integrity", score: 1 }),
      dimension({ id: "type_adherence", label: "Question type", score: 0.7 }),
      dimension({ id: "pattern_adherence", label: "Question pattern", score: 0.85 }),
      dimension({ id: "difficulty_alignment", label: "Difficulty", score: 0.6 }),
      dimension({ id: "reference_alignment", label: "Reference alignment", score: null }),
    ],
    configuration: {} as EvaluationResult["configuration"],
    patternCoverage: {} as EvaluationResult["patternCoverage"],
    typeCoverage: {} as EvaluationResult["typeCoverage"],
    difficulty: {} as EvaluationResult["difficulty"],
    integrityChecks: [],
    referenceAlignment: {} as EvaluationResult["referenceAlignment"],
    promptTrace: [],
    deviations: [],
    strengths: [],
    improvements: [],
    evaluatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("compareEvaluationResults", () => {
  it("computes difference = current - previous when current is higher", () => {
    const comparison = compareEvaluationResults(
      result({ promptEffectiveness: 84 }),
      result({ promptEffectiveness: 76 }),
    );
    expect(comparison.overallScore).toEqual({ current: 84, previous: 76, difference: 8 });
  });

  it("computes a negative difference when current is lower", () => {
    const comparison = compareEvaluationResults(
      result({ promptEffectiveness: 70 }),
      result({ promptEffectiveness: 78 }),
    );
    expect(comparison.overallScore.difference).toBe(-8);
  });

  it("computes a zero difference when scores are equal", () => {
    const comparison = compareEvaluationResults(
      result({ promptEffectiveness: 80 }),
      result({ promptEffectiveness: 80 }),
    );
    expect(comparison.overallScore.difference).toBe(0);
  });

  it("computes a difference for every dimension present in both results", () => {
    const current = result({
      dimensions: [
        dimension({ id: "count_adherence", score: 0.9 }),
        dimension({ id: "type_adherence", score: 0.7 }),
      ],
    });
    const previous = result({
      dimensions: [
        dimension({ id: "count_adherence", score: 0.5 }),
        dimension({ id: "type_adherence", score: 0.7 }),
      ],
    });

    const comparison = compareEvaluationResults(current, previous);

    const count = comparison.dimensions.find((d) => d.id === "count_adherence");
    expect(count).toMatchObject({ current: 0.9, previous: 0.5, difference: 0.4 });
    const type = comparison.dimensions.find((d) => d.id === "type_adherence");
    expect(type).toMatchObject({ current: 0.7, previous: 0.7, difference: 0 });
  });

  it("does not fabricate a difference when a dimension is null (N/A) on either side", () => {
    const current = result({
      dimensions: [dimension({ id: "reference_alignment", score: null })],
    });
    const previous = result({
      dimensions: [dimension({ id: "reference_alignment", score: 0.5 })],
    });

    const comparison = compareEvaluationResults(current, previous);

    const ref = comparison.dimensions.find((d) => d.id === "reference_alignment");
    expect(ref).toMatchObject({ current: null, previous: 0.5, difference: null });
  });

  it("preserves each dimension's label", () => {
    const comparison = compareEvaluationResults(result(), result());
    const count = comparison.dimensions.find((d) => d.id === "count_adherence");
    expect(count?.label).toBe("Question count");
  });
});
