import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { QUESTION_TYPE_META } from "@/components/common/question-type-meta";
import { TypeBadge } from "@/components/common/type-badge";
import type { GeneratedQuestion } from "@/lib/prompts/types";

export function QuestionCard({
  question,
  index,
  difficultyLabel,
  difficultyStyle,
}: {
  question: GeneratedQuestion;
  index: number;
  difficultyLabel: string;
  difficultyStyle: string;
}) {
  const meta = QUESTION_TYPE_META[question.questionType];

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 * index }}
      className="bg-card border border-border rounded-2xl p-6 shadow-sm"
    >
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <span className="font-jakarta text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Question {question.questionNumber}
        </span>
        <span
          className={`font-jakarta text-[0.65rem] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border-2 ${difficultyStyle}`}
        >
          {difficultyLabel}
        </span>
      </div>

      <div className="mb-3">
        <TypeBadge meta={meta} size="sm" />
      </div>

      <p className="whitespace-pre-line text-[0.98rem] font-medium text-foreground leading-relaxed">
        {question.questionText}
      </p>

      {question.options && (
        <ol className="mt-3 space-y-1.5">
          {question.options.map((opt) => (
            <li key={opt.id} className="text-sm text-foreground/80">
              <span className="font-semibold text-foreground">{opt.id}.</span> {opt.text}
            </li>
          ))}
        </ol>
      )}

      <div className="mt-5 flex justify-end">
        <Link
          href={`/questions/practice/${question.questionNumber}`}
          className="font-jakarta group flex items-center gap-2 text-sm font-semibold text-primary hover:text-accent transition-colors duration-150"
        >
          Try Question
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
        </Link>
      </div>
    </motion.div>
  );
}
