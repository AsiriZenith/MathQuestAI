import { motion } from "motion/react";
import { AI_QUESTION_TYPE_META } from "@/components/common/ai-question-type-meta";
import { TypeBadge } from "@/components/common/type-badge";
import type { GeneratedQuestion } from "@/lib/prompts/types";

export function QuestionCoverage({ questions }: { questions: GeneratedQuestion[] }) {
  const distinctTypes = Array.from(new Set(questions.map((q) => q.questionType)));

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
          {distinctTypes.length} different question types
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {distinctTypes.map((typeId) => (
          <TypeBadge key={typeId} meta={AI_QUESTION_TYPE_META[typeId]} />
        ))}
      </div>
    </motion.div>
  );
}
