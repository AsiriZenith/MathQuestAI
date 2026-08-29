import { motion } from "motion/react";
import { DeltaBadge } from "./delta-badge";
import type { EvaluationData } from "@/lib/types";
import type { ScoreDelta } from "@/lib/evaluation/types";

function SideSummary({ label, data }: { label: string; data: EvaluationData }) {
  const { generationContext } = data;
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
        {label}
      </p>
      <p className="text-sm text-foreground truncate">
        {generationContext.subtopicName} · {generationContext.difficulty}
      </p>
      <p className="font-jakarta text-3xl font-extrabold text-foreground mt-1">
        {data.result.promptEffectiveness}%
      </p>
    </div>
  );
}

/** Overall current-vs-previous score, at the top of the Comparison page. */
export function ComparisonHeader({
  current,
  previous,
  overallScore,
}: {
  current: EvaluationData;
  previous: EvaluationData;
  overallScore: ScoreDelta;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-card border border-border rounded-2xl p-6 mb-6 shadow-sm"
    >
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <SideSummary label="Current Generation" data={current} />
        <div className="flex flex-col items-center justify-center px-2">
          <span className="text-xs text-muted-foreground mb-1">Difference</span>
          <DeltaBadge value={overallScore.difference} suffix="%" />
        </div>
        <SideSummary label="Previous Generation" data={previous} />
      </div>
    </motion.div>
  );
}
