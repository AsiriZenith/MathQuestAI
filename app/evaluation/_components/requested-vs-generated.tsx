import { motion } from "motion/react";
import { PatternStatusIndicator } from "@/components/common/pattern-status-indicator";
import type { PracticeConfig } from "@/lib/types";

export function RequestedVsGenerated({
  config,
  requestedRows,
  interpretation,
}: {
  config: PracticeConfig;
  requestedRows: { id: string; label: string; generated: boolean }[];
  interpretation: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="bg-card border border-border rounded-2xl p-6 mb-6 shadow-sm"
    >
      <h2 className="font-jakarta text-base font-bold text-foreground mb-2">
        Did AI Generate What You Asked For?
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        {config.autoTypes
          ? "You let AI choose a varied mix — here's what it covered."
          : "Here's whether AI generated a matching question for each type you asked for."}
      </p>
      <div className="divide-y divide-border mb-4">
        {requestedRows.map((row) => (
          <div
            key={row.id}
            className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
          >
            <span className="text-sm font-medium text-foreground">{row.label}</span>
            <PatternStatusIndicator status={row.generated ? "covered" : "not-covered"} />
          </div>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">{interpretation}</p>
    </motion.div>
  );
}
