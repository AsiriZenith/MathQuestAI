import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { motion } from "motion/react";
import { COVERAGE_LEVEL_STYLE, COVERAGE_RESULT } from "@/lib/mock-data";
import type { CoverageLevel } from "@/lib/types";

function CoverageLevelIcon({ level, className }: { level: CoverageLevel; className?: string }) {
  if (level === "good") return <CheckCircle2 className={className ?? "w-5 h-5 text-emerald-600"} />;
  if (level === "partial") return <AlertTriangle className={className ?? "w-5 h-5 text-amber-600"} />;
  return <XCircle className={className ?? "w-5 h-5 text-rose-600"} />;
}

export function CoverageResultCard() {
  const style = COVERAGE_LEVEL_STYLE[COVERAGE_RESULT.level];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`border rounded-2xl p-6 mb-6 shadow-sm flex items-start justify-between gap-4 ${style.cardClass}`}
    >
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Coverage Result
        </span>
        <div className="flex items-center gap-2.5 mt-1.5 mb-1.5">
          <CoverageLevelIcon level={COVERAGE_RESULT.level} className="w-6 h-6 text-emerald-600" />
          <h2 className={`font-jakarta text-xl font-bold ${style.titleClass}`}>
            {COVERAGE_RESULT.headline}
          </h2>
        </div>
        <p className={`text-sm ${style.textClass}`}>{COVERAGE_RESULT.description}</p>
        <p className="text-xs text-muted-foreground mt-3">
          This is a prototype evaluation based on the predefined benchmark/question patterns.
        </p>
      </div>
      <div
        className={`shrink-0 w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center bg-background/70 ${style.titleClass} border-current/40`}
      >
        <span className="text-3xl font-extrabold leading-none">
          {Math.round(COVERAGE_RESULT.secondaryScore)}%
        </span>
        <span className="text-xs text-muted-foreground leading-none mt-1.5">coverage</span>
      </div>
    </motion.div>
  );
}
