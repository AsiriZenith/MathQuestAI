import { motion } from "motion/react";
import { Info } from "lucide-react";
import { MeterBar } from "@/components/common/meter-bar";
import { ConfidenceChip } from "@/components/common/evaluation-indicators";
import type { DifficultySignals } from "@/lib/evaluation/types";
import type { Difficulty } from "@/lib/types";

const BANDS: Difficulty[] = ["easy", "medium", "hard"];

/**
 * Difficulty is the one dimension that cannot be measured exactly, so the raw
 * signals behind the verdict are shown rather than hidden behind a number.
 */
export function DifficultyAssessment({ signals }: { signals: DifficultySignals }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25 }}
      className="bg-card border border-border rounded-2xl p-6 mb-6 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h2 className="font-jakarta text-base font-bold text-foreground">Difficulty Alignment</h2>
        <ConfidenceChip confidence="medium" />
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        The prompt requested <span className="font-semibold text-foreground">{signals.requested}</span>.
        {" "}
        {signals.matched} of {signals.total} questions show structural complexity consistent with
        that band.
      </p>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {BANDS.map((band) => (
          <div
            key={band}
            className={`rounded-xl border p-3 text-center ${
              band === signals.requested
                ? "bg-primary/5 border-primary/30"
                : "bg-secondary/50 border-border"
            }`}
          >
            <p className="font-jakarta text-xl font-extrabold text-foreground leading-none">
              {signals.observedBands[band]}
            </p>
            <p className="text-xs text-muted-foreground mt-1 capitalize">
              {band}
              {band === signals.requested && " (requested)"}
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-3 mb-4">
        <div>
          <div className="flex items-center justify-between gap-3 mb-1.5">
            <span className="text-sm text-foreground">Mean reasoning steps per question</span>
            <span className="text-sm font-semibold text-foreground tabular-nums">
              {signals.meanReasoningSteps.toFixed(1)}
            </span>
          </div>
          <MeterBar value={Math.min(1, signals.meanReasoningSteps / 5)} tone="primary" />
        </div>
        <div>
          <div className="flex items-center justify-between gap-3 mb-1.5">
            <span className="text-sm text-foreground">Mean operators per question</span>
            <span className="text-sm font-semibold text-foreground tabular-nums">
              {signals.meanOperators.toFixed(1)}
            </span>
          </div>
          <MeterBar value={Math.min(1, signals.meanOperators / 8)} tone="primary" />
        </div>
      </div>

      <div className="flex items-start gap-2">
        <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          These are structural proxies, not a semantic judgement of difficulty. They count the
          reasoning steps each explanation describes and the operators each question contains, then
          map those onto the project&apos;s Easy / Medium / Hard step-count definitions. Treat a
          borderline result as a prompt to look at the questions yourself.
        </p>
      </div>
    </motion.div>
  );
}
