import type { GenerationResponse } from "@/lib/prompts/types";
import type { DimensionScore, IntegrityCheck } from "@/lib/evaluation/types";

const MIN_EXPLANATION_LENGTH = 15;
const CONVENTIONAL_OPTION_COUNT = 4;
const CONVENTIONAL_OPTION_IDS = ["A", "B", "C", "D"];

/**
 * Measures the OUTPUT FORMAT section.
 *
 * Deliberately checks things *beyond* what Zod already enforces — by the time a
 * response reaches evaluation it has already passed schema validation, so
 * re-checking the schema would score 100% every time and tell the researcher
 * nothing. These are the structural rules the prompt states or implies but
 * nothing in code enforces.
 */
export function evaluateOutputIntegrity(response: GenerationResponse): DimensionScore & {
  checks: IntegrityCheck[];
} {
  const questions = response.questions;
  const checks: IntegrityCheck[] = [];

  const numbers = questions.map((q) => q.questionNumber);
  const uniqueNumbers = new Set(numbers);
  checks.push({
    id: "unique_numbers",
    label: "Question numbers are unique",
    passed: uniqueNumbers.size === numbers.length,
    severity: "requirement",
    detail:
      uniqueNumbers.size === numbers.length
        ? "Every question carries a distinct questionNumber."
        : `${numbers.length - uniqueNumbers.size} duplicate questionNumber value(s) returned.`,
  });

  const isSequential = numbers.every((n, i) => n === i + 1);
  checks.push({
    id: "sequential_numbers",
    label: "Question numbers run 1..N in order",
    passed: isSequential,
    severity: "convention",
    detail: isSequential
      ? "Numbering is sequential from 1."
      : `Numbering is not a clean 1..${numbers.length} sequence: [${numbers.join(", ")}].`,
  });

  const mcQuestions = questions.filter((q) => q.questionType === "multiple_choice");

  const mcWithDuplicateIds = mcQuestions.filter(
    (q) => new Set(q.options?.map((o) => o.id)).size !== (q.options?.length ?? 0),
  );
  checks.push({
    id: "unique_option_ids",
    label: "Multiple-choice option ids are unique",
    passed: mcWithDuplicateIds.length === 0,
    severity: "requirement",
    detail:
      mcWithDuplicateIds.length === 0
        ? "No repeated option ids within a question."
        : `Question(s) ${mcWithDuplicateIds.map((q) => q.questionNumber).join(", ")} repeat an option id.`,
  });

  const mcWrongCount = mcQuestions.filter(
    (q) => (q.options?.length ?? 0) !== CONVENTIONAL_OPTION_COUNT,
  );
  checks.push({
    id: "option_count",
    label: `Multiple-choice questions offer ${CONVENTIONAL_OPTION_COUNT} options`,
    passed: mcWrongCount.length === 0,
    severity: "convention",
    detail:
      mcWrongCount.length === 0
        ? `All multiple-choice questions offer ${CONVENTIONAL_OPTION_COUNT} options.`
        : `Question(s) ${mcWrongCount.map((q) => q.questionNumber).join(", ")} deviate from the ${CONVENTIONAL_OPTION_COUNT}-option example in the prompt.`,
  });

  const mcWrongIds = mcQuestions.filter(
    (q) => !q.options?.every((o, i) => o.id === CONVENTIONAL_OPTION_IDS[i]),
  );
  checks.push({
    id: "option_id_labels",
    label: "Options are labelled A/B/C/D",
    passed: mcWrongIds.length === 0,
    severity: "convention",
    detail:
      mcWrongIds.length === 0
        ? "Option ids follow the A/B/C/D convention shown in the prompt."
        : `Question(s) ${mcWrongIds.map((q) => q.questionNumber).join(", ")} use different option ids.`,
  });

  const strayOptions = questions.filter(
    (q) => q.questionType !== "multiple_choice" && (q.options?.length ?? 0) > 0,
  );
  checks.push({
    id: "no_stray_options",
    label: "Non-multiple-choice questions omit options",
    passed: strayOptions.length === 0,
    severity: "requirement",
    detail:
      strayOptions.length === 0
        ? "Only multiple-choice questions carry an options array."
        : `Question(s) ${strayOptions.map((q) => q.questionNumber).join(", ")} include options despite not being multiple choice.`,
  });

  const thinExplanations = questions.filter(
    (q) => q.explanation.trim().length < MIN_EXPLANATION_LENGTH,
  );
  checks.push({
    id: "substantive_explanations",
    label: "Explanations are substantive",
    passed: thinExplanations.length === 0,
    severity: "requirement",
    detail:
      thinExplanations.length === 0
        ? "Every question carries a non-trivial explanation."
        : `Question(s) ${thinExplanations.map((q) => q.questionNumber).join(", ")} have an explanation under ${MIN_EXPLANATION_LENGTH} characters.`,
  });

  const passed = checks.filter((c) => c.passed).length;
  const score = checks.length > 0 ? passed / checks.length : 1;
  const requirementFailures = checks.filter((c) => !c.passed && c.severity === "requirement");

  return {
    id: "output_integrity",
    label: "Output structure",
    score,
    weight: 15,
    status:
      requirementFailures.length > 0 ? "not_met" : passed === checks.length ? "met" : "partial",
    confidence: "high",
    promptSection: "output_format",
    method: `Ran ${checks.length} structural checks that go beyond schema validation (numbering, option shape, explanation substance). Schema validation already passed before evaluation, so it is not re-scored here.`,
    summary:
      passed === checks.length
        ? "The output followed every structural rule the prompt specified."
        : `${checks.length - passed} of ${checks.length} structural checks failed.`,
    checks,
  };
}
