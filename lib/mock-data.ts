import {
  Brain,
  LayoutList,
  PenLine,
  CheckCircle2,
} from "lucide-react";
import {
  QUESTION_TYPE_CODES,
  QUESTION_TYPE_LABELS,
  type Difficulty,
  type LoadingStep,
  type QuestionType,
} from "@/lib/types";

export const QUESTION_TYPE_OPTIONS: { id: QuestionType; label: string }[] =
  QUESTION_TYPE_CODES.map((id) => ({ id, label: QUESTION_TYPE_LABELS[id] }));

export const DIFFICULTY_OPTIONS: {
  id: Difficulty;
  label: string;
  activeClass: string;
  hoverClass: string;
}[] = [
  {
    id: "easy",
    label: "Easy",
    activeClass: "bg-emerald-500 border-emerald-500 text-white",
    hoverClass: "hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700",
  },
  {
    id: "medium",
    label: "Medium",
    activeClass: "bg-amber-500 border-amber-500 text-white",
    hoverClass: "hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700",
  },
  {
    id: "hard",
    label: "Hard",
    activeClass: "bg-rose-500 border-rose-500 text-white",
    hoverClass: "hover:border-rose-400 hover:bg-rose-50 hover:text-rose-700",
  },
];

export const LOADING_STEPS: LoadingStep[] = [
  { id: 1, label: "Understanding the concept", Icon: Brain },
  { id: 2, label: "Identifying question types", Icon: LayoutList },
  { id: 3, label: "Creating questions", Icon: PenLine },
  { id: 4, label: "Checking question variety", Icon: CheckCircle2 },
];


export function canGenerate(config: {
  grade: string;
  subtopic: string;
  difficulty: Difficulty | "";
  selectedTypesSize: number;
  autoTypes: boolean;
  selectedPatternsSize: number;
  autoPatterns: boolean;
}): boolean {
  return (
    config.grade !== "" &&
    config.subtopic !== "" &&
    config.difficulty !== "" &&
    (config.selectedTypesSize > 0 || config.autoTypes) &&
    (config.selectedPatternsSize > 0 || config.autoPatterns)
  );
}

