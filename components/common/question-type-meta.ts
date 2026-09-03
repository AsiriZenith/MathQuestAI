import { questionTypeLabel, type QuestionType, type QuestionTypeMeta } from "@/lib/types";

/** Display metadata (label + colours) for each stable question-type code. */
export const QUESTION_TYPE_META: Record<QuestionType, QuestionTypeMeta> = {
  mc: {
    label: questionTypeLabel("mc"),
    dotClass: "bg-violet-500",
    badgeClass: "bg-violet-50 border-violet-200/60 text-violet-700",
  },
  fib: {
    label: questionTypeLabel("fib"),
    dotClass: "bg-indigo-500",
    badgeClass: "bg-indigo-50 border-indigo-200/60 text-indigo-700",
  },
  wp: {
    label: questionTypeLabel("wp"),
    dotClass: "bg-amber-500",
    badgeClass: "bg-amber-50 border-amber-200/60 text-amber-700",
  },
  tf: {
    label: questionTypeLabel("tf"),
    dotClass: "bg-rose-500",
    badgeClass: "bg-rose-50 border-rose-200/60 text-rose-700",
  },
  ms: {
    label: questionTypeLabel("ms"),
    dotClass: "bg-emerald-500",
    badgeClass: "bg-emerald-50 border-emerald-200/60 text-emerald-700",
  },
};
