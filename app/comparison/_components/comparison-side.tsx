import { CoverageCard } from "@/app/evaluation/_components/coverage-card";
import { DifficultyAssessment } from "@/app/evaluation/_components/difficulty-assessment";
import {
  OutputIntegrityCard,
  ReferenceAlignmentCard,
} from "@/app/evaluation/_components/integrity-and-reference";
import { DeviationTable } from "@/app/evaluation/_components/deviation-table";
import type { EvaluationData } from "@/lib/types";

/**
 * One side of the comparison (current or previous), reusing the existing
 * single-result Evaluation page components unmodified (TASK-023) — no new
 * calculation, just re-rendering with this side's own already-computed result.
 */
export function ComparisonSide({ label, data }: { label: string; data: EvaluationData }) {
  const { result } = data;

  return (
    <div>
      <h2 className="font-jakarta text-lg font-bold text-foreground mb-3">{label}</h2>

      <CoverageCard
        title="Question Pattern Coverage"
        description="How the generated questions were distributed across the patterns the prompt listed."
        report={result.patternCoverage}
      />

      <CoverageCard
        title="Question Type Coverage"
        description="How the generated questions were distributed across the requested question types."
        report={result.typeCoverage}
      />

      <DifficultyAssessment signals={result.difficulty} />

      <OutputIntegrityCard checks={result.integrityChecks} />

      <ReferenceAlignmentCard report={result.referenceAlignment} />

      <DeviationTable deviations={result.deviations} />
    </div>
  );
}
