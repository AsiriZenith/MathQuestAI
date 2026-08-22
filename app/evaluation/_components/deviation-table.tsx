import { motion } from "motion/react";
import { CheckCircle2 } from "lucide-react";
import type { Deviation, DeviationKind } from "@/lib/evaluation/types";

const KIND_LABEL: Record<DeviationKind, string> = {
  out_of_scope_type: "Unrequested question type",
  out_of_scope_pattern: "Unlisted question pattern",
  missing_pattern_label: "Missing pattern label",
  difficulty_drift: "Difficulty drift",
  copy_risk: "Possible reference copying",
  structure: "Structural issue",
};

const SEVERITY_STYLE: Record<Deviation["severity"], string> = {
  high: "bg-rose-50 border-rose-200/60 text-rose-700",
  medium: "bg-amber-50 border-amber-200/60 text-amber-700",
  low: "bg-secondary/60 border-border text-muted-foreground",
};

/**
 * Concrete per-question evidence behind the scores, so the researcher does not
 * have to re-read every generated question to find what went wrong.
 */
export function DeviationTable({ deviations }: { deviations: Deviation[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="bg-card border border-border rounded-2xl p-6 mb-6 shadow-sm"
    >
      <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
        <h2 className="font-jakarta text-base font-bold text-foreground">Where the Output Deviated</h2>
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {deviations.length} finding{deviations.length === 1 ? "" : "s"}
        </span>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Individual questions that did not match what the prompt asked for.
      </p>

      {deviations.length === 0 ? (
        <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200/60 rounded-xl px-4 py-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-900/90">
            No deviations detected — every question matched the prompt&apos;s stated requirements.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-2 px-2">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left">
                <th className="text-xs font-bold uppercase tracking-wider text-muted-foreground pb-2 pr-3">
                  Q
                </th>
                <th className="text-xs font-bold uppercase tracking-wider text-muted-foreground pb-2 pr-3">
                  Issue
                </th>
                <th className="text-xs font-bold uppercase tracking-wider text-muted-foreground pb-2 pr-3">
                  Expected
                </th>
                <th className="text-xs font-bold uppercase tracking-wider text-muted-foreground pb-2">
                  Observed
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {deviations.map((deviation, index) => (
                <tr key={`${deviation.questionNumber}-${deviation.kind}-${index}`}>
                  <td className="py-2.5 pr-3 align-top font-semibold text-foreground tabular-nums">
                    {deviation.questionNumber}
                  </td>
                  <td className="py-2.5 pr-3 align-top">
                    <span
                      className={`font-jakarta inline-block px-2 py-0.5 rounded-md border text-xs font-semibold whitespace-nowrap ${SEVERITY_STYLE[deviation.severity]}`}
                    >
                      {KIND_LABEL[deviation.kind]}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3 align-top text-xs text-muted-foreground">
                    {deviation.expected}
                  </td>
                  <td className="py-2.5 align-top text-xs text-foreground/80">
                    {deviation.observed}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}
