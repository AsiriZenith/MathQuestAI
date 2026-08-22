import { motion } from "motion/react";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import type { EffectivenessBand } from "@/lib/evaluation/types";

const BAND_STYLE: Record<
  EffectivenessBand,
  { card: string; title: string; text: string; label: string }
> = {
  strong: {
    card: "bg-emerald-50 border-emerald-200/60",
    title: "text-emerald-800",
    text: "text-emerald-900/90",
    label: "Prompt Followed Closely",
  },
  moderate: {
    card: "bg-amber-50 border-amber-200/60",
    title: "text-amber-800",
    text: "text-amber-900/90",
    label: "Prompt Partially Followed",
  },
  weak: {
    card: "bg-rose-50 border-rose-200/60",
    title: "text-rose-800",
    text: "text-rose-900/90",
    label: "Prompt Weakly Followed",
  },
};

export function PromptEffectivenessHero({
  score,
  band,
  explanation,
}: {
  score: number;
  band: EffectivenessBand;
  explanation: string;
}) {
  const style = BAND_STYLE[band];
  const Icon = band === "strong" ? CheckCircle2 : band === "moderate" ? AlertTriangle : XCircle;
  const iconTone =
    band === "strong" ? "text-emerald-600" : band === "moderate" ? "text-amber-600" : "text-rose-600";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`border rounded-2xl p-6 mb-6 shadow-sm flex items-start justify-between gap-6 ${style.card}`}
    >
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Prompt Effectiveness
        </p>
        <div className="flex items-center gap-2 mt-1.5 mb-1">
          <Icon className={`w-6 h-6 shrink-0 ${iconTone}`} />
          <h2 className={`font-jakarta text-xl font-bold ${style.title}`}>{style.label}</h2>
        </div>
        <p className={`text-sm ${style.text}`}>{explanation}</p>
        <p className="text-xs text-muted-foreground mt-3">
          This measures how completely the generated output followed the requirements set by the
          current prompt. It is an experimental prototype metric, not an objective measure of
          question quality or of the AI model itself.
        </p>
      </div>

      <div
        className={`shrink-0 w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center bg-background/70 ${style.title} border-current/40`}
      >
        <span className="text-3xl font-extrabold leading-none">{score}%</span>
        <span className="text-xs text-muted-foreground leading-none mt-1.5">followed</span>
      </div>
    </motion.div>
  );
}
