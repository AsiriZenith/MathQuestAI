import { motion } from "motion/react";
import { StatusPill } from "@/components/common/evaluation-indicators";
import type { ConfigurationSummary, DimensionScore } from "@/lib/evaluation/types";

/**
 * A flat met / partially met / not met view of every requirement the prompt set.
 * Often more directly useful to a researcher than the percentages.
 */
export function RequirementMatrix({
  dimensions,
  configuration,
}: {
  dimensions: DimensionScore[];
  configuration: ConfigurationSummary;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="bg-card border border-border rounded-2xl p-6 mb-6 shadow-sm"
    >
      <h2 className="font-jakarta text-base font-bold text-foreground mb-2">
        Requirement Adherence
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        Every requirement the current prompt communicates, and whether the output honoured it.
      </p>

      <div className="divide-y divide-border">
        {dimensions.map((dimension) => (
          <div
            key={dimension.id}
            className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
          >
            <span className="text-sm font-medium text-foreground min-w-0">{dimension.label}</span>
            <StatusPill status={dimension.status} />
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Fact label="Grade" value={configuration.grade} />
        <Fact label="Subject" value={configuration.subject} />
        <Fact label="Topic" value={configuration.topic} />
        <Fact label="Subtopic" value={configuration.subtopic} />
        <Fact label="Difficulty" value={configuration.difficulty} />
        <Fact
          label="Patterns"
          value={
            configuration.usedAllPatterns
              ? `All ${configuration.requestedPatterns.length} for subtopic`
              : `${configuration.requestedPatterns.length} selected`
          }
        />
        <Fact
          label="Types"
          value={
            configuration.usedAiMix
              ? "AI-chosen mix"
              : `${configuration.requestedTypes.length} selected`
          }
        />
        <Fact
          label="Questions"
          value={`${configuration.generatedQuestionCount} of ${configuration.requestedQuestionCount}`}
        />
      </div>
    </motion.div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground capitalize break-words">{value}</p>
    </div>
  );
}
