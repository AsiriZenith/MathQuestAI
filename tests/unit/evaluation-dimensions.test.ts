import { describe, expect, it } from "vitest";
import { evaluateCountAdherence } from "@/lib/evaluation/dimensions/count-adherence";
import { evaluateOutputIntegrity } from "@/lib/evaluation/dimensions/output-integrity";
import { evaluateTypeAdherence } from "@/lib/evaluation/dimensions/type-adherence";
import { evaluatePatternAdherence } from "@/lib/evaluation/dimensions/pattern-adherence";
import { evaluateDifficultyAlignment } from "@/lib/evaluation/dimensions/difficulty-proxy";
import { evaluateReferenceAlignment } from "@/lib/evaluation/dimensions/reference-alignment";
import { ngramOverlap } from "@/lib/evaluation/text-metrics";
import type { GeneratedQuestion, GenerationResponse } from "@/lib/prompts/types";
import type { GenerationContext } from "@/lib/types";

function question(overrides: Partial<GeneratedQuestion> = {}): GeneratedQuestion {
  return {
    questionNumber: 1,
    questionText: "Simplify 3x + 5x.",
    questionType: "multiple_choice",
    questionPattern: "Combine Like Terms",
    options: [
      { id: "A", text: "8x" },
      { id: "B", text: "5x" },
      { id: "C", text: "2x" },
      { id: "D", text: "15x" },
    ],
    correctAnswer: "A",
    explanation: "3x and 5x are like terms, so add their coefficients to get 8x.",
    ...overrides,
  };
}

function responseOf(questions: GeneratedQuestion[]): GenerationResponse {
  return { questions };
}

describe("count adherence", () => {
  it("scores a perfect match as met", () => {
    const result = evaluateCountAdherence(responseOf([question(), question()]), 2);
    expect(result.score).toBe(1);
    expect(result.status).toBe("met");
  });

  it("penalises a short set proportionally", () => {
    const result = evaluateCountAdherence(responseOf([question()]), 10);
    expect(result.score).toBeCloseTo(0.1);
    expect(result.status).toBe("not_met");
  });
});

describe("type adherence", () => {
  it("flags a question whose type was never requested", () => {
    const response = responseOf([
      question({ questionNumber: 1 }),
      question({ questionNumber: 2, questionType: "word_problem", options: undefined }),
    ]);

    const { dimension, deviations, coverage } = evaluateTypeAdherence(response, [
      "multiple_choice",
    ]);

    expect(dimension.score).toBe(0.5);
    expect(deviations).toHaveLength(1);
    expect(deviations[0].kind).toBe("out_of_scope_type");
    expect(coverage.unexpected).toContain("Word Problem");
  });

  it("treats variety as the requirement in AI-mix mode", () => {
    const response = responseOf([question({ questionNumber: 1 }), question({ questionNumber: 2 })]);
    const { dimension, coverage } = evaluateTypeAdherence(response, "auto");

    // Two questions of a single type: half the achievable variety.
    expect(dimension.score).toBe(0.5);
    expect(coverage.promptPermitsSkew).toBe(false);
  });

  it("reports a missing requested type without scoring it as a failure", () => {
    const response = responseOf([question()]);
    const { dimension, coverage } = evaluateTypeAdherence(response, [
      "multiple_choice",
      "word_problem",
    ]);

    expect(dimension.score).toBe(1);
    expect(dimension.status).toBe("met");
    expect(coverage.missing).toEqual(["Word Problem"]);
    expect(coverage.promptPermitsSkew).toBe(true);
  });
});

describe("pattern adherence", () => {
  const patterns = ["Combine Like Terms", "Apply Distributive Property"];

  it("scores fully when every question is labelled and in scope", () => {
    const response = responseOf([question(), question({ questionNumber: 2 })]);
    const { dimension } = evaluatePatternAdherence(response, patterns, true);

    expect(dimension.score).toBe(1);
    expect(dimension.status).toBe("met");
  });

  it("penalises unlabelled questions and records them as deviations", () => {
    const response = responseOf([
      question(),
      question({ questionNumber: 2, questionPattern: undefined }),
    ]);
    const { dimension, coverage, deviations } = evaluatePatternAdherence(response, patterns, true);

    expect(dimension.score).toBe(0.5);
    expect(coverage.unlabelled).toBe(1);
    expect(deviations.some((d) => d.kind === "missing_pattern_label")).toBe(true);
  });

  it("flags a pattern the prompt never listed", () => {
    const response = responseOf([question({ questionPattern: "Solve Quadratics" })]);
    const { coverage, deviations } = evaluatePatternAdherence(response, patterns, true);

    expect(coverage.unexpected).toContain("Solve Quadratics");
    expect(deviations[0].kind).toBe("out_of_scope_pattern");
  });

  it("reports not_applicable for runs generated before labels were requested", () => {
    const response = responseOf([question({ questionPattern: undefined })]);
    const { dimension } = evaluatePatternAdherence(response, patterns, false);

    expect(dimension.status).toBe("not_applicable");
    expect(dimension.score).toBeNull();
  });
});

describe("output integrity", () => {
  it("detects duplicate question numbers", () => {
    const response = responseOf([question({ questionNumber: 1 }), question({ questionNumber: 1 })]);
    const result = evaluateOutputIntegrity(response);

    const check = result.checks.find((c) => c.id === "unique_numbers");
    expect(check?.passed).toBe(false);
    expect(result.status).toBe("not_met");
  });

  it("detects options attached to a non-multiple-choice question", () => {
    const response = responseOf([question({ questionType: "true_false" })]);
    const result = evaluateOutputIntegrity(response);

    expect(result.checks.find((c) => c.id === "no_stray_options")?.passed).toBe(false);
  });

  it("passes a well-formed response", () => {
    const result = evaluateOutputIntegrity(responseOf([question()]));
    expect(result.status).toBe("met");
    expect(result.score).toBe(1);
  });
});

describe("difficulty proxy", () => {
  it("reads a one-step question as easy", () => {
    const response = responseOf([
      question({ questionText: "What is 2 + 3?", explanation: "Add two and three." }),
    ]);
    const { dimension, signals } = evaluateDifficultyAlignment(response, "easy");

    expect(signals.observedBands.easy).toBe(1);
    expect(dimension.score).toBe(1);
  });

  it("awards partial credit for an adjacent band", () => {
    const response = responseOf([
      question({ questionText: "What is 2 + 3?", explanation: "Add two and three." }),
    ]);
    const { dimension } = evaluateDifficultyAlignment(response, "medium");

    expect(dimension.score).toBe(0.5);
  });

  it("always reports itself as a proxy rather than a measurement", () => {
    const { dimension } = evaluateDifficultyAlignment(responseOf([question()]), "easy");
    expect(dimension.confidence).toBe("medium");
  });
});

describe("reference alignment", () => {
  const contextWith = (referenceText: string | null): GenerationContext => ({
    subjectName: "Mathematics",
    subtopicName: "Simplify & Calculate",
    difficulty: "easy",
    patterns: [
      {
        id: "pattern-a",
        name: "Combine Like Terms",
        generationPrompt: null,
        referenceQuestions: referenceText
          ? [
              {
                id: "ref-1",
                questionText: referenceText,
                expectedAnswer: "8x",
                explanation: "Add the coefficients.",
              },
            ]
          : [],
      },
    ],
  });

  it("is not applicable when the context carried no reference questions", () => {
    const { dimension } = evaluateReferenceAlignment(responseOf([question()]), contextWith(null));

    expect(dimension.status).toBe("not_applicable");
    expect(dimension.score).toBeNull();
  });

  it("flags a near-verbatim copy of a reference question", () => {
    const copied = "Simplify the expression three x plus five x and give the result";
    const response = responseOf([question({ questionText: copied })]);
    const { report, deviations } = evaluateReferenceAlignment(response, contextWith(copied));

    expect(report.copyRisks).toHaveLength(1);
    expect(deviations[0].kind).toBe("copy_risk");
  });

  it("does not flag an original question", () => {
    const response = responseOf([question({ questionText: "Combine 7a and 2a into one term." })]);
    const { report } = evaluateReferenceAlignment(
      response,
      contextWith("A gardener plants 4b tulips and 9b roses. How many plants in total?"),
    );

    expect(report.copyRisks).toHaveLength(0);
  });
});

describe("ngramOverlap", () => {
  it("returns 1 for identical text and 0 for unrelated text", () => {
    const text = "simplify the expression three x plus five x";
    expect(ngramOverlap(text, text)).toBe(1);
    expect(ngramOverlap(text, "a train leaves the station at noon heading north")).toBe(0);
  });
});
