import { motion } from "motion/react";
import { DeltaBadge } from "./delta-badge";
import type { DimensionComparison } from "@/lib/evaluation/types";

function pct(value: number | null): string {
  return value === null ? "N/A" : `${Math.round(value * 100)}%`;
}

/** Per-dimension current/previous/difference — the reader never has to subtract by hand. */
export function DimensionComparisonTable({ dimensions }: { dimensions: DimensionComparison[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 }}
      className="bg-card border border-border rounded-2xl p-6 mb-6 shadow-sm"
    >
      <h2 className="font-jakarta text-base font-bold text-foreground mb-4">
        Dimension-by-Dimension Comparison
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-muted-foreground uppercase tracking-wider">
            <tr>
              <th className="py-2 pr-3 font-semibold">Dimension</th>
              <th className="py-2 px-3 font-semibold">Current</th>
              <th className="py-2 px-3 font-semibold">Previous</th>
              <th className="py-2 pl-3 font-semibold">Difference</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {dimensions.map((d) => (
              <tr key={d.id}>
                <td className="py-2.5 pr-3 text-foreground font-medium">{d.label}</td>
                <td className="py-2.5 px-3 text-foreground tabular-nums">{pct(d.current)}</td>
                <td className="py-2.5 px-3 text-foreground tabular-nums">{pct(d.previous)}</td>
                <td className="py-2.5 pl-3">
                  <DeltaBadge value={d.difference === null ? null : Math.round(d.difference * 100)} suffix="%" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
