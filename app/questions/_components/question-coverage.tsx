import { motion } from "motion/react";
import { GENERATED_TYPE_ORDER, QUESTION_TYPE_META } from "@/lib/mock-data";
import { TypeBadge } from "@/components/common/type-badge";

export function QuestionCoverage({ totalTypes }: { totalTypes: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-card border border-border rounded-2xl p-6 mb-8 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="font-jakarta text-base font-bold text-foreground">Question Coverage</h2>
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {totalTypes} different question types
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {GENERATED_TYPE_ORDER.map((typeId) => (
          <TypeBadge key={typeId} meta={QUESTION_TYPE_META[typeId]} />
        ))}
      </div>
    </motion.div>
  );
}
