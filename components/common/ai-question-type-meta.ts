import type { AiQuestionType } from "@/lib/prompts/types";
import { questionTypeLabel } from "@/lib/prompts/common";
import type { QuestionTypeMeta } from "@/lib/types";

export const AI_QUESTION_TYPE_META: Record<AiQuestionType, QuestionTypeMeta> = {
  multiple_choice: {
    label: questionTypeLabel("multiple_choice"),
    dotClass: "bg-violet-500",
    badgeClass: "bg-violet-50 border-violet-200/60 text-violet-700",
  },
  fill_in_the_blank: {
    label: questionTypeLabel("fill_in_the_blank"),
    dotClass: "bg-indigo-500",
    badgeClass: "bg-indigo-50 border-indigo-200/60 text-indigo-700",
  },
  word_problem: {
    label: questionTypeLabel("word_problem"),
    dotClass: "bg-amber-500",
    badgeClass: "bg-amber-50 border-amber-200/60 text-amber-700",
  },
  true_false: {
    label: questionTypeLabel("true_false"),
    dotClass: "bg-rose-500",
    badgeClass: "bg-rose-50 border-rose-200/60 text-rose-700",
  },
  multi_step: {
    label: questionTypeLabel("multi_step"),
    dotClass: "bg-emerald-500",
    badgeClass: "bg-emerald-50 border-emerald-200/60 text-emerald-700",
  },
};
