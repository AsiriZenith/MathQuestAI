import type { GenerationResponse } from "@/lib/prompts/types";
import type { CoverageReport, Deviation, DimensionScore } from "@/lib/evaluation/types";

export interface PatternAdherenceOutcome {
  dimension: DimensionScore;
  coverage: CoverageReport;
  deviations: Deviation[];
}

export interface SelectedPattern {
  id: string;
  name: string;
}

/**
 * Measures the EDUCATIONAL CONTEXT section.
 *
 * Since TASK-019 the AI returns each question's `questionPatternId` — the exact
 * database id supplied in the prompt — so this is a straight set-membership
 * check against the ids the user selected. No name matching.
 *
 * Scored: did every question carry an id, and was it one the prompt offered?
 * Reported but not scored: whether every selected pattern actually appeared —
 * the prompt says "Not every question needs to use every pattern", so skew is
 * permitted and a missing pattern is a prompt gap.
 *
 * `promptRequestsPatternIds` is false for runs generated before the prompt asked
 * for a pattern id. The dimension then reports not_applicable rather than
 * scoring zero, so old sessions are not misrepresented as failures.
 */
export function evaluatePatternAdherence(
  response: GenerationResponse,
  selectedPatterns: SelectedPattern[],
  promptRequestsPatternIds: boolean,
): PatternAdherenceOutcome {
  const questions = response.questions;
  const total = questions.length;

  const nameById = new Map(selectedPatterns.map((p) => [p.id, p.name]));
  const selectedIds = new Set(selectedPatterns.map((p) => p.id));

  const labelled = questions.filter(
    (q) => typeof q.questionPatternId === "string" && q.questionPatternId.trim().length > 0,
  );
  const unlabelled = total - labelled.length;

  const counts = new Map<string, number>();
  const outOfScope: typeof questions = [];

  for (const question of labelled) {
    const id = question.questionPatternId;
    counts.set(id, (counts.get(id) ?? 0) + 1);
    if (!selectedIds.has(id)) outOfScope.push(question);
  }

  const displayLabel = (id: string) => nameById.get(id) ?? id;

  const entries = [
    ...selectedPatterns.map((pattern) => ({
      label: pattern.name,
      count: counts.get(pattern.id) ?? 0,
      share: total > 0 ? (counts.get(pattern.id) ?? 0) / total : 0,
      requested: true,
    })),
    ...[...counts.entries()]
      .filter(([id]) => !selectedIds.has(id))
      .map(([id, count]) => ({
        label: displayLabel(id),
        count,
        share: total > 0 ? count / total : 0,
        requested: false,
      })),
  ];

  const coverage: CoverageReport = {
    entries,
    missing: entries.filter((e) => e.requested && e.count === 0).map((e) => e.label),
    unexpected: entries.filter((e) => !e.requested).map((e) => e.label),
    unlabelled,
    promptPermitsSkew: true,
    note: 'The EDUCATIONAL CONTEXT section says "Not every question needs to use every pattern", so the prompt permits an uneven spread. Patterns with no questions indicate the prompt never asked for full coverage.',
  };

  if (!promptRequestsPatternIds) {
    return {
      dimension: {
        id: "pattern_adherence",
        label: "Question pattern",
        score: null,
        weight: 25,
        status: "not_applicable",
        confidence: "high",
        promptSection: "educational_context",
        method:
          "This run was generated before the prompt asked the model to tag each question with its Question Pattern id, so no per-question pattern data exists.",
        summary:
          "Pattern data unavailable for this run — generate a new set to enable pattern evaluation.",
      },
      coverage: { ...coverage, note: "Pattern ids were not requested when this set was generated." },
      deviations: [],
    };
  }

  const labelledRatio = total > 0 ? labelled.length / total : 0;
  const inScopeRatio =
    labelled.length > 0 ? (labelled.length - outOfScope.length) / labelled.length : 0;
  const score = labelledRatio * inScopeRatio;

  const selectedIdList = selectedPatterns.map((p) => p.id).join(", ");

  const deviations: Deviation[] = [
    ...outOfScope.map((question) => ({
      questionNumber: question.questionNumber,
      kind: "out_of_scope_pattern" as const,
      severity: "high" as const,
      expected: selectedIdList,
      observed: question.questionPatternId,
      promptSection: "educational_context" as const,
    })),
    ...questions
      .filter((q) => !q.questionPatternId || q.questionPatternId.trim().length === 0)
      .map((question) => ({
        questionNumber: question.questionNumber,
        kind: "missing_pattern_label" as const,
        severity: "medium" as const,
        expected: "A questionPatternId naming one of the selected patterns",
        observed: "No id returned",
        promptSection: "output_format" as const,
      })),
  ];

  return {
    dimension: {
      id: "pattern_adherence",
      label: "Question pattern",
      score,
      weight: 25,
      status: score >= 0.999 ? "met" : score >= 0.7 ? "partial" : "not_met",
      confidence: "high",
      promptSection: "educational_context",
      method: `Checked how many questions carried a pattern id (${labelled.length}/${total}) and how many of those matched one of the ${selectedPatterns.length} selected pattern id(s).`,
      summary:
        unlabelled === 0 && outOfScope.length === 0
          ? "Every question was tagged with one of the selected question pattern ids."
          : [
              unlabelled > 0 ? `${unlabelled} question(s) came back with no pattern id` : null,
              outOfScope.length > 0
                ? `${outOfScope.length} used an id that was not one of the selected patterns`
                : null,
            ]
              .filter(Boolean)
              .join("; ") + ".",
    },
    coverage,
    deviations,
  };
}
