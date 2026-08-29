import { evaluateCountAdherence } from "@/lib/evaluation/dimensions/count-adherence";
import { evaluateOutputIntegrity } from "@/lib/evaluation/dimensions/output-integrity";
import { evaluateTypeAdherence } from "@/lib/evaluation/dimensions/type-adherence";
import { evaluatePatternAdherence } from "@/lib/evaluation/dimensions/pattern-adherence";
import { evaluateDifficultyAlignment } from "@/lib/evaluation/dimensions/difficulty-proxy";
import { evaluateReferenceAlignment } from "@/lib/evaluation/dimensions/reference-alignment";
import { deriveImprovements, deriveStrengths } from "@/lib/evaluation/improvements";
import { PROMPT_SECTIONS, promptRequestsPatternIds, splitPromptSections } from "@/lib/evaluation/prompt-sections";
import { isQuestionType } from "@/lib/persistence/validation";
import type { GenerationResponse } from "@/lib/prompts/types";
import {
  questionTypeLabel,
  type GenerationContext,
  type PracticeConfig,
  type QuestionType,
} from "@/lib/types";
import type {
  AdherenceStatus,
  DimensionScore,
  EffectivenessBand,
  EvaluationResult,
  PromptSectionTrace,
} from "@/lib/evaluation/types";

function band(score: number): EffectivenessBand {
  if (score >= 85) return "strong";
  if (score >= 65) return "moderate";
  return "weak";
}

function explain(score: number, effectivenessBand: EffectivenessBand): string {
  const preamble = `Based on the criteria used by this prototype, the generated output followed`;
  if (effectivenessBand === "strong") {
    return `${preamble} nearly all of the requirements defined by the current prompt. This is an experimental measurement of how well the prompt communicated its intent, not an absolute measure of question quality.`;
  }
  if (effectivenessBand === "moderate") {
    return `${preamble} most of the requirements defined by the current prompt, with measurable deviations in the dimensions listed below. This is an experimental measurement of how well the prompt communicated its intent, not an absolute measure of question quality.`;
  }
  return `${preamble} only some of the requirements defined by the current prompt. The dimensions below show where the prompt's intent did not carry through. This is an experimental measurement, not an absolute measure of question quality.`;
}

function resolveRequestedTypes(config: PracticeConfig): QuestionType[] | "auto" {
  if (config.autoTypes) return "auto";
  return config.selectedTypes.filter(isQuestionType);
}

/**
 * Roll a prompt section's related dimensions into a single verdict.
 *
 * A section backed by exactly one dimension inherits that dimension's own status
 * verbatim, so the Prompt Inspector and the requirement matrix can never disagree
 * about the same underlying score.
 */
function traceStatus(dimensions: DimensionScore[]): {
  status: AdherenceStatus;
  score: number | null;
} {
  if (dimensions.length === 1) {
    return { status: dimensions[0].status, score: dimensions[0].score };
  }

  const applicable = dimensions
    .map((d) => d.score)
    .filter((s): s is number => s !== null);
  if (applicable.length === 0) return { status: "not_applicable", score: null };

  const mean = applicable.reduce((sum, s) => sum + s, 0) / applicable.length;
  return {
    status: mean >= 0.999 ? "met" : mean >= 0.7 ? "partial" : "not_met",
    score: mean,
  };
}

/**
 * Deterministically evaluate how effectively a prompt produced its intended output.
 *
 * No AI is involved: every score is computed from the generated output by
 * explainable code, so repeating an evaluation on the same input always yields
 * the same result. That reproducibility is the point — when the researcher
 * changes the prompt and the score moves, the prompt caused it.
 */
export function evaluateGeneration(input: {
  config: PracticeConfig;
  generationContext: GenerationContext;
  generationResponse: GenerationResponse;
  prompt: string;
  requestedQuestionCount: number;
}): EvaluationResult {
  const { config, generationContext, generationResponse, prompt, requestedQuestionCount } = input;

  const selectedPatterns = generationContext.patterns.map((p) => ({ id: p.id, name: p.name }));
  const requestedPatterns = selectedPatterns.map((p) => p.name);
  const requestedTypes = resolveRequestedTypes(config);

  const count = evaluateCountAdherence(generationResponse, requestedQuestionCount);
  const { checks, ...integrity } = evaluateOutputIntegrity(generationResponse);
  const type = evaluateTypeAdherence(generationResponse, requestedTypes);
  const pattern = evaluatePatternAdherence(
    generationResponse,
    selectedPatterns,
    promptRequestsPatternIds(prompt),
  );
  const difficulty = evaluateDifficultyAlignment(generationResponse, generationContext.difficulty);
  const reference = evaluateReferenceAlignment(generationResponse, generationContext);

  const dimensions: DimensionScore[] = [
    pattern.dimension,
    type.dimension,
    difficulty.dimension,
    integrity,
    count,
    reference.dimension,
  ];

  // Weights are renormalised over applicable dimensions, so a dimension that
  // cannot be measured for this run neither helps nor hurts the score.
  const applicable = dimensions.filter((d) => d.score !== null);
  const totalWeight = applicable.reduce((sum, d) => sum + d.weight, 0);
  const weighted =
    totalWeight > 0
      ? applicable.reduce((sum, d) => sum + (d.score as number) * d.weight, 0) / totalWeight
      : 0;
  const promptEffectiveness = Math.round(weighted * 100);

  const sectionBodies = splitPromptSections(prompt);
  const promptTrace: PromptSectionTrace[] = PROMPT_SECTIONS.map((section) => {
    const related = dimensions.filter((d) => section.dimensionIds.includes(d.id));
    const { status, score } = traceStatus(related);
    return {
      id: section.id,
      heading: section.heading,
      body: sectionBodies[section.id] ?? "",
      dimensionIds: section.dimensionIds,
      status,
      score,
      verdict:
        related.length === 0
          ? "Cross-cutting guidance; its effect is reflected in the other sections."
          : related.map((d) => d.summary).join(" "),
    };
  });

  const deviations = [
    ...pattern.deviations,
    ...type.deviations,
    ...difficulty.deviations,
    ...reference.deviations,
  ].sort((a, b) => a.questionNumber - b.questionNumber);

  const improvements = deriveImprovements({
    dimensions,
    patternCoverage: pattern.coverage,
    typeCoverage: type.coverage,
    difficulty: difficulty.signals,
    integrityChecks: checks,
    referenceAlignment: reference.report,
    requestedQuestionCount,
    generatedQuestionCount: generationResponse.questions.length,
  });

  return {
    promptEffectiveness,
    band: band(promptEffectiveness),
    explanation: explain(promptEffectiveness, band(promptEffectiveness)),
    dimensions,
    configuration: {
      grade: config.grade,
      subject: generationContext.subjectName,
      topic: "Algebra",
      subtopic: generationContext.subtopicName,
      difficulty: generationContext.difficulty,
      requestedPatterns,
      usedAllPatterns: config.autoPatterns,
      requestedTypes:
        requestedTypes === "auto"
          ? []
          : requestedTypes.map((id) => ({ id, label: questionTypeLabel(id) })),
      usedAiMix: config.autoTypes,
      requestedQuestionCount,
      generatedQuestionCount: generationResponse.questions.length,
    },
    patternCoverage: pattern.coverage,
    typeCoverage: type.coverage,
    difficulty: difficulty.signals,
    integrityChecks: checks,
    referenceAlignment: reference.report,
    promptTrace,
    deviations,
    strengths: deriveStrengths(dimensions),
    improvements,
    evaluatedAt: new Date().toISOString(),
  };
}
