import type {
  CoverageReport,
  DifficultySignals,
  DimensionScore,
  ImprovementOpportunity,
  IntegrityCheck,
  ReferenceAlignmentReport,
  Strength,
} from "@/lib/evaluation/types";

/** A dimension scoring at or above this is treated as a prompt instruction that worked. */
const STRENGTH_THRESHOLD = 0.9;

interface ImprovementInput {
  dimensions: DimensionScore[];
  patternCoverage: CoverageReport;
  typeCoverage: CoverageReport;
  difficulty: DifficultySignals;
  integrityChecks: IntegrityCheck[];
  referenceAlignment: ReferenceAlignmentReport;
  requestedQuestionCount: number;
  generatedQuestionCount: number;
}

function dimension(dimensions: DimensionScore[], id: DimensionScore["id"]) {
  return dimensions.find((d) => d.id === id);
}

/**
 * Derive concrete, evidence-backed prompt changes from the evaluation findings.
 *
 * Every rule fires only on observed evidence and names the exact file and
 * section to edit, with replacement text. Deliberately rule-based rather than
 * AI-generated: the task requires recommendations that identify a specific
 * prompt weakness, not generic "make the prompt clearer" advice.
 */
export function deriveImprovements(input: ImprovementInput): ImprovementOpportunity[] {
  const improvements: ImprovementOpportunity[] = [];
  const {
    dimensions,
    patternCoverage,
    typeCoverage,
    difficulty,
    integrityChecks,
    referenceAlignment,
    requestedQuestionCount,
    generatedQuestionCount,
  } = input;

  if (generatedQuestionCount !== requestedQuestionCount) {
    improvements.push({
      id: "count_drift",
      problem: `The prompt requested ${requestedQuestionCount} questions but received ${generatedQuestionCount}.`,
      evidence: `GENERATION REQUIREMENT states "Generate ${requestedQuestionCount} questions." and COMMON INSTRUCTIONS repeats "Generate exactly the requested number of questions." Neither was honoured, and the response schema does not enforce a count.`,
      likelyPromptWeakness:
        "The count is stated twice but never framed as a hard constraint, and nothing in the output contract makes an incorrect count invalid.",
      suggestedChange: `Return exactly ${requestedQuestionCount} questions. A response containing any other number of questions is invalid and must not be returned.`,
      targetFile: "lib/prompts/builder.ts › GENERATION REQUIREMENT section",
      promptSection: "generation_requirement",
    });
  }

  if (patternCoverage.missing.length > 0 && patternCoverage.unlabelled < generatedQuestionCount) {
    improvements.push({
      id: "pattern_coverage_gap",
      problem: `${patternCoverage.missing.length} of the ${patternCoverage.entries.filter((e) => e.requested).length} requested question patterns produced no questions.`,
      evidence: `No questions were generated for: ${patternCoverage.missing.join(", ")}.`,
      likelyPromptWeakness:
        'EDUCATIONAL CONTEXT closes with "Not every question needs to use every pattern." The prompt therefore permits the skew observed here — it never asked for balanced coverage. This is a gap in the prompt, not a failure by the model.',
      suggestedChange:
        "Distribute the questions across all listed Question Patterns so that every pattern is represented at least once. Spread the remaining questions as evenly as the count allows.",
      targetFile: "lib/prompts/builder.ts › buildEducationalContextSection",
      promptSection: "educational_context",
    });
  }

  if (patternCoverage.unexpected.length > 0) {
    improvements.push({
      id: "pattern_out_of_scope",
      problem: "Questions were labelled with patterns the prompt never listed.",
      evidence: `Unlisted pattern(s) returned: ${patternCoverage.unexpected.join(", ")}.`,
      likelyPromptWeakness:
        'EDUCATIONAL CONTEXT calls the listed patterns "the allowed generation context" but never forbids inventing others.',
      suggestedChange:
        "Use ONLY the Question Patterns listed above. Do not invent, rename, or substitute any other pattern.",
      targetFile: "lib/prompts/builder.ts › buildEducationalContextSection",
      promptSection: "educational_context",
    });
  }

  if (patternCoverage.unlabelled > 0) {
    improvements.push({
      id: "pattern_labels_missing",
      problem: `${patternCoverage.unlabelled} question(s) came back with no questionPatternId.`,
      evidence:
        "The OUTPUT FORMAT section requires a questionPatternId on every question, but some questions omitted it — so their pattern cannot be evaluated.",
      likelyPromptWeakness:
        "The field is described after the JSON example rather than being emphasised as mandatory alongside the other required fields.",
      suggestedChange:
        'Every question object MUST include a non-empty "questionPatternId" set to one of the ids from the SELECTED QUESTION PATTERNS section. Omitting it makes the response invalid.',
      targetFile: "lib/prompts/common.ts › OUTPUT_FORMAT_INSTRUCTIONS",
      promptSection: "output_format",
    });
  }

  if (typeCoverage.unexpected.length > 0) {
    improvements.push({
      id: "type_out_of_scope",
      problem: "Questions used question types that were never requested.",
      evidence: `Unrequested type(s) generated: ${typeCoverage.unexpected.join(", ")}.`,
      likelyPromptWeakness:
        'The QUESTION TYPE section lists the allowed types but softens immediately with "Not every type needs to appear in every question", and never states that unlisted types are forbidden.',
      suggestedChange:
        "Use ONLY the question types listed above. Any other question type makes the response invalid.",
      targetFile: "lib/prompts/builder.ts › buildQuestionTypeSection",
      promptSection: "question_type",
    });
  }

  if (typeCoverage.missing.length > 0 && typeCoverage.promptPermitsSkew) {
    improvements.push({
      id: "type_coverage_gap",
      problem: `${typeCoverage.missing.length} requested question type(s) never appeared.`,
      evidence: `No questions were generated as: ${typeCoverage.missing.join(", ")}.`,
      likelyPromptWeakness:
        'QUESTION TYPE explicitly permits this: "Not every type needs to appear in every question." If every selected type should be represented, the prompt has to say so.',
      suggestedChange:
        "Generate at least one question for each listed question type before adding additional questions of any single type.",
      targetFile: "lib/prompts/builder.ts › buildQuestionTypeSection",
      promptSection: "question_type",
    });
  }

  const difficultyDimension = dimension(dimensions, "difficulty_alignment");
  if (difficultyDimension && (difficultyDimension.score ?? 1) < 0.85) {
    const offBand = (Object.entries(difficulty.observedBands) as [string, number][])
      .filter(([band, count]) => band !== difficulty.requested && count > 0)
      .map(([band, count]) => `${count} read as ${band}`)
      .join(", ");

    improvements.push({
      id: "difficulty_drift",
      problem: `Only ${difficulty.matched} of ${difficulty.total} questions show complexity consistent with the requested ${difficulty.requested} difficulty.`,
      evidence: `Structural signals: ${difficulty.meanReasoningSteps.toFixed(1)} mean reasoning steps, ${difficulty.meanOperators.toFixed(1)} mean operators per question${offBand ? ` (${offBand})` : ""}.`,
      likelyPromptWeakness:
        "The DIFFICULTY section describes the band qualitatively but gives the model no countable target, so it has no concrete threshold to aim at.",
      suggestedChange:
        difficulty.requested === "easy"
          ? "Each question must be solvable in a single step. Do not chain operations."
          : difficulty.requested === "medium"
            ? "Each question must require 2-3 connected solution steps. A question solvable in one step does not meet this difficulty."
            : "Each question must require at least 4 connected solution steps, or combine several related sources of complexity.",
      targetFile: "lib/prompts/common.ts › DIFFICULTY_GUIDANCE",
      promptSection: "difficulty",
    });
  }

  if (referenceAlignment.copyRisks.length > 0) {
    improvements.push({
      id: "reference_copying",
      problem: `${referenceAlignment.copyRisks.length} generated question(s) closely echo a reference question.`,
      evidence: referenceAlignment.copyRisks
        .map((r) => `Question ${r.questionNumber}: ${Math.round(r.overlap * 100)}% phrase overlap`)
        .join("; "),
      likelyPromptWeakness:
        'REFERENCE QUESTIONS says "Use them as guidance, not as questions to copy directly", but does not say what copying means in practice — so reusing the phrasing with new numbers still reads as compliant.',
      suggestedChange:
        "Do not reuse the wording, numbers, or sentence structure of the examples. Take only the mathematical task and level of complexity from them, and write each question from scratch.",
      targetFile: "lib/prompts/builder.ts › buildReferenceQuestionsSection",
      promptSection: "reference_questions",
    });
  }

  const failedRequirements = integrityChecks.filter(
    (check) => !check.passed && check.severity === "requirement",
  );
  if (failedRequirements.length > 0) {
    improvements.push({
      id: "structure_violations",
      problem: "The generated output broke structural rules the prompt specified.",
      evidence: failedRequirements.map((c) => c.detail).join(" "),
      likelyPromptWeakness:
        "OUTPUT FORMAT shows a single example object, leaving rules that apply across the whole set (numbering, per-type field usage) implicit.",
      suggestedChange:
        'Number the questions sequentially from 1 with no repeats. Include the options array only for "mc" questions. Every explanation must describe the full solution.',
      targetFile: "lib/prompts/common.ts › OUTPUT_FORMAT_INSTRUCTIONS",
      promptSection: "output_format",
    });
  }

  return improvements;
}

/**
 * The inverse signal: prompt instructions that demonstrably worked, so the
 * researcher knows which sections to leave untouched in the next iteration.
 */
export function deriveStrengths(dimensions: DimensionScore[]): Strength[] {
  const wording: Record<string, string> = {
    count_adherence: "The requested question count was produced exactly.",
    output_integrity: "The output followed the required structure throughout.",
    type_adherence: "Generated questions stayed within the requested question types.",
    pattern_adherence: "Questions were labelled and stayed within the requested question patterns.",
    difficulty_alignment: "Generated complexity was consistent with the requested difficulty.",
    reference_alignment:
      "Reference questions informed the output without being copied — exactly the intended balance.",
  };

  return dimensions
    .filter((d) => d.score !== null && d.score >= STRENGTH_THRESHOLD)
    .map((d) => ({
      id: d.id,
      finding: wording[d.id] ?? d.summary,
      promptSection: d.promptSection,
    }));
}
