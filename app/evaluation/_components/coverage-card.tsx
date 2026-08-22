import { motion } from "motion/react";
import { Info } from "lucide-react";
import { MeterBar } from "@/components/common/meter-bar";
import type { CoverageReport } from "@/lib/evaluation/types";

/**
 * Distribution of generated questions across the requested patterns or types.
 *
 * Coverage is presented descriptively rather than as a pass/fail score: the
 * prompt explicitly permits an uneven spread, so a missing bucket is a gap in
 * the prompt rather than a rule the output broke. That distinction is spelled
 * out in the footnote so the researcher acts on the prompt, not the model.
 */
export function CoverageCard({
  title,
  description,
  report,
  delay = 0,
}: {
  title: string;
  description: string;
  report: CoverageReport;
  delay?: number;
}) {
  const total = report.entries.reduce((sum, entry) => sum + entry.count, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="bg-card border border-border rounded-2xl p-6 mb-6 shadow-sm"
    >
      <h2 className="font-jakarta text-base font-bold text-foreground mb-2">{title}</h2>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>

      {report.entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">No distribution data available for this run.</p>
      ) : (
        <div className="space-y-3">
          {report.entries.map((entry, index) => (
            <div key={entry.label}>
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <span className="text-sm font-medium text-foreground truncate">
                  {entry.label}
                  {!entry.requested && (
                    <span className="ml-2 font-jakarta text-[0.65rem] font-bold uppercase tracking-wide text-amber-700 bg-amber-50 border border-amber-200/60 rounded-md px-1.5 py-0.5">
                      Not requested
                    </span>
                  )}
                </span>
                <span className="text-sm text-muted-foreground tabular-nums shrink-0">
                  {entry.count} · {Math.round(entry.share * 100)}%
                </span>
              </div>
              <MeterBar
                value={entry.share}
                tone={!entry.requested ? "warning" : entry.count === 0 ? "muted" : "primary"}
                delay={delay + index * 0.04}
              />
            </div>
          ))}
        </div>
      )}

      {report.unlabelled > 0 && (
        <p className="text-sm text-amber-900/90 bg-amber-50 border border-amber-200/60 rounded-xl px-4 py-3 mt-4">
          {report.unlabelled} of {total + report.unlabelled} questions came back with no label, so
          they could not be attributed to a pattern.
        </p>
      )}

      {(report.missing.length > 0 || report.promptPermitsSkew) && (
        <div className="flex items-start gap-2 mt-4">
          <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            {report.missing.length > 0 && (
              <span className="text-foreground/80">
                No questions generated for: {report.missing.join(", ")}.{" "}
              </span>
            )}
            {report.note}
          </p>
        </div>
      )}
    </motion.div>
  );
}
