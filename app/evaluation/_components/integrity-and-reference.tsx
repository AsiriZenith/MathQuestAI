import { motion } from "motion/react";
import { CheckCircle2, XCircle } from "lucide-react";
import type { IntegrityCheck, ReferenceAlignmentReport } from "@/lib/evaluation/types";

export function OutputIntegrityCard({ checks }: { checks: IntegrityCheck[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="bg-card border border-border rounded-2xl p-6 mb-6 shadow-sm"
    >
      <h2 className="font-jakarta text-base font-bold text-foreground mb-2">Output Structure</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Schema validation already passed before this report was produced, so these are the rules the
        prompt states or implies but nothing in code enforces.
      </p>

      <div className="divide-y divide-border">
        {checks.map((check) => (
          <div key={check.id} className="flex items-start gap-2.5 py-2.5 first:pt-0 last:pb-0">
            {check.passed ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <XCircle
                className={`w-4 h-4 shrink-0 mt-0.5 ${check.severity === "requirement" ? "text-rose-600" : "text-amber-600"}`}
              />
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">
                {check.label}
                {check.severity === "convention" && (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">convention</span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">{check.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export function ReferenceAlignmentCard({ report }: { report: ReferenceAlignmentReport }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.35 }}
      className="bg-card border border-border rounded-2xl p-6 mb-6 shadow-sm"
    >
      <h2 className="font-jakarta text-base font-bold text-foreground mb-2">Reference Alignment</h2>
      <p className="text-sm text-muted-foreground mb-4">
        The prompt supplies reference questions as guidance and tells the model not to copy them.
        Good output therefore sits in between: original wording, comparable structure.
      </p>

      {report.referenceCount === 0 ? (
        <p className="text-sm text-muted-foreground bg-secondary/50 border border-border rounded-xl px-4 py-3">
          No reference questions exist for this pattern and difficulty, so the prompt carried no
          examples to align against. This dimension was excluded from the score.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-secondary/50 border border-border rounded-xl p-3">
              <p className="text-xs text-muted-foreground">Reference complexity</p>
              <p className="font-jakarta text-lg font-bold text-foreground">
                {report.meanReferenceComplexity.toFixed(1)}
              </p>
            </div>
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
              <p className="text-xs text-muted-foreground">Generated complexity</p>
              <p className="font-jakarta text-lg font-bold text-foreground">
                {report.meanGeneratedComplexity.toFixed(1)}
                <span
                  className={`ml-2 text-xs font-semibold ${report.complexityDelta >= 0 ? "text-emerald-700" : "text-amber-700"}`}
                >
                  {report.complexityDelta >= 0 ? "+" : ""}
                  {report.complexityDelta.toFixed(1)}
                </span>
              </p>
            </div>
          </div>

          {report.copyRisks.length === 0 ? (
            <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200/60 rounded-xl px-4 py-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-900/90">
                No generated question closely echoes a reference question.
              </p>
            </div>
          ) : (
            <div className="bg-rose-50 border border-rose-200/60 rounded-xl px-4 py-3">
              <p className="text-sm font-bold text-rose-800 mb-1.5">
                {report.copyRisks.length} question(s) may be copying a reference
              </p>
              <ul className="space-y-1">
                {report.copyRisks.map((risk) => (
                  <li key={risk.questionNumber} className="text-sm text-rose-900/90">
                    Question {risk.questionNumber} — {Math.round(risk.overlap * 100)}% phrase overlap
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
