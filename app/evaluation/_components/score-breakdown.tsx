"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { MeterBar, toneForScore } from "@/components/common/meter-bar";
import { ConfidenceChip, StatusIcon } from "@/components/common/evaluation-indicators";
import type { DimensionScore } from "@/lib/evaluation/types";

/**
 * The auditable breakdown behind the headline score. Every dimension exposes its
 * weight and the exact method used, so the number is explainable rather than
 * asserted.
 */
export function ScoreBreakdown({ dimensions }: { dimensions: DimensionScore[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const applicable = dimensions.filter((d) => d.score !== null);
  const totalWeight = applicable.reduce((sum, d) => sum + d.weight, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 }}
      className="bg-card border border-border rounded-2xl p-6 mb-6 shadow-sm"
    >
      <h2 className="font-jakarta text-base font-bold text-foreground mb-2">
        How the Score Breaks Down
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        Each dimension measures one section of the prompt. Select any row to see exactly how it was
        calculated.
      </p>

      <div className="divide-y divide-border">
        {dimensions.map((dimension) => {
          const isOpen = expanded === dimension.id;
          const isNa = dimension.score === null;
          const normalisedWeight =
            !isNa && totalWeight > 0 ? Math.round((dimension.weight / totalWeight) * 100) : null;

          return (
            <div key={dimension.id} className="py-3 first:pt-0 last:pb-0">
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : dimension.id)}
                aria-expanded={isOpen}
                className="w-full text-left group"
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <StatusIcon status={dimension.status} />
                    <span className="text-sm font-medium text-foreground truncate">
                      {dimension.label}
                    </span>
                    <ConfidenceChip confidence={dimension.confidence} />
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">
                      {normalisedWeight !== null ? `weight ${normalisedWeight}%` : "excluded"}
                    </span>
                    <span className="font-jakarta text-sm font-bold text-foreground tabular-nums w-11 text-right">
                      {isNa ? "N/A" : `${Math.round((dimension.score as number) * 100)}%`}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-muted-foreground transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`}
                    />
                  </div>
                </div>
                <MeterBar value={dimension.score ?? 0} tone={toneForScore(dimension.score)} />
              </button>

              <p className="text-xs text-muted-foreground mt-2">{dimension.summary}</p>

              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 bg-secondary/50 border border-border rounded-xl p-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                      How this was measured
                    </p>
                    <p className="text-xs text-foreground/80">{dimension.method}</p>
                  </div>
                </motion.div>
              )}
            </div>
          );
        })}
      </div>

      {applicable.length < dimensions.length && (
        <p className="text-xs text-muted-foreground mt-4">
          Dimensions marked N/A could not be measured for this run and were excluded. The remaining
          weights were rescaled so they still total 100%.
        </p>
      )}
    </motion.div>
  );
}
