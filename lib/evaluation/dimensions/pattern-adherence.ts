import type { GenerationResponse } from "@/lib/prompts/types";
import type { CoverageReport, Deviation, DimensionScore } from "@/lib/evaluation/types";

export interface PatternAdherenceOutcome {
  dimension: DimensionScore;
  coverage: CoverageReport;
  deviations: Deviation[];
}

function normalise(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Measures the EDUCATIONAL CONTEXT section.
 *
 * Scored: were questions labelled at all, and did the labels name patterns the
 * prompt actually offered? Reported but not scored: whether every requested
 * pattern appeared — the prompt says "Not every question needs to use every
 * pattern", so skew is permitted and a missing pattern is a prompt gap.
 *
 * `promptRequestsLabels` is false for runs generated before the questionPattern
 * field existed. The dimension then reports not_applicable rather than scoring
 * zero, so old sessions are not misrepresented as failures.
 */
export function evaluatePatternAdherence(
  response: GenerationResponse,
  requestedPatterns: string[],
  promptRequestsLabels: boolean,
): PatternAdherenceOutcome {
  const questions = response.questions;
  const total = questions.length;
  const allowed = new Map(requestedPatterns.map((name) => [normalise(name), name]));

  const labelled = questions.filter(
    (q) => typeof q.questionPattern === "string" && q.questionPattern.trim().length > 0,
  );
  const unlabelled = total - labelled.length;

  const counts = new Map<string, number>();
  const outOfScope: typeof questions = [];

  for (const question of labelled) {
    const raw = question.questionPattern!.trim();
    const canonical = allowed.get(normalise(raw));
    if (canonical) {
      counts.set(canonical, (counts.get(canonical) ?? 0) + 1);
    } else {
      counts.set(raw, (counts.get(raw) ?? 0) + 1);
      outOfScope.push(question);
    }
  }

  const entries = [
    ...requestedPatterns.map((name) => ({
      label: name,
      count: counts.get(name) ?? 0,
      share: total > 0 ? (counts.get(name) ?? 0) / total : 0,
      requested: true,
    })),
    ...[...counts.entries()]
      .filter(([name]) => !allowed.has(normalise(name)))
      .map(([name, count]) => ({
        label: name,
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

  if (!promptRequestsLabels) {
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
          "This run was generated before the prompt asked the model to label each question with its Question Pattern, so no per-question pattern data exists.",
        summary:
          "Pattern data unavailable for this run — generate a new set to enable pattern evaluation.",
      },
      coverage: { ...coverage, note: "Pattern labels were not requested when this set was generated." },
      deviations: [],
    };
  }

  const labelledRatio = total > 0 ? labelled.length / total : 0;
  const inScopeRatio = labelled.length > 0 ? (labelled.length - outOfScope.length) / labelled.length : 0;
  const score = labelledRatio * inScopeRatio;

  const deviations: Deviation[] = [
    ...outOfScope.map((question) => ({
      questionNumber: question.questionNumber,
      kind: "out_of_scope_pattern" as const,
      severity: "high" as const,
      expected: requestedPatterns.join(", "),
      observed: question.questionPattern!.trim(),
      promptSection: "educational_context" as const,
    })),
    ...questions
      .filter((q) => !q.questionPattern || q.questionPattern.trim().length === 0)
      .map((question) => ({
        questionNumber: question.questionNumber,
        kind: "missing_pattern_label" as const,
        severity: "medium" as const,
        expected: "A questionPattern label naming one of the requested patterns",
        observed: "No label returned",
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
      method: `Checked how many questions carried a pattern label (${labelled.length}/${total}) and how many of those named one of the ${requestedPatterns.length} pattern(s) the prompt listed.`,
      summary:
        unlabelled === 0 && outOfScope.length === 0
          ? "Every question was labelled with one of the requested question patterns."
          : [
              unlabelled > 0 ? `${unlabelled} question(s) came back with no pattern label` : null,
              outOfScope.length > 0
                ? `${outOfScope.length} named a pattern the prompt did not list`
                : null,
            ]
              .filter(Boolean)
              .join("; ") + ".",
    },
    coverage,
    deviations,
  };
}
