import { motion } from "motion/react";
import { QUESTION_PATTERN_COVERAGE } from "@/lib/mock-data";
import { PatternStatusIndicator } from "@/components/common/pattern-status-indicator";

export function PatternCoverageList() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 }}
      className="bg-card border border-border rounded-2xl p-6 mb-6 shadow-sm"
    >
      <h2 className="font-jakarta text-base font-bold text-foreground mb-2">
        Question Pattern Coverage
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        The benchmark defines several ways the concept can be tested. The generated set is
        checked against these patterns.
      </p>
      <div className="divide-y divide-border">
        {QUESTION_PATTERN_COVERAGE.map((row) => (
          <div
            key={row.pattern}
            className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
          >
            <span className="text-sm font-medium text-foreground">{row.pattern}</span>
            <PatternStatusIndicator status={row.status} />
          </div>
        ))}
      </div>
    </motion.div>
  );
}
