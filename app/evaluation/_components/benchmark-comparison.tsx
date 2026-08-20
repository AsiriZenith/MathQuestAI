import { ArrowDown, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";
import { BENCHMARK_COMPARISON } from "@/lib/mock-data";

export function BenchmarkComparisonSection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      id="benchmark-comparison"
      className="bg-card border border-border rounded-2xl p-6 mb-6 shadow-sm"
    >
      <h2 className="font-jakarta text-base font-bold text-foreground mb-1">
        See How AI Changed the Question
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        AI can create a different question while testing the same underlying skill.
      </p>

      <div className="bg-secondary/60 border border-border rounded-xl p-4 mb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Benchmark
        </span>
        <p className="text-sm font-medium text-foreground mt-1.5">
          {BENCHMARK_COMPARISON.benchmarkQuestion}
        </p>
      </div>
      <div className="flex justify-center py-1">
        <ArrowDown className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-5">
        <span className="text-xs font-bold uppercase tracking-wider text-primary">AI Generated</span>
        <p className="text-sm font-medium text-foreground mt-1.5">
          {BENCHMARK_COMPARISON.generatedQuestion}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
        {BENCHMARK_COMPARISON.rows.map((row) => (
          <div key={row.label} className="flex items-start gap-1.5">
            {row.matched ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <span className="w-4 h-4 shrink-0" />
            )}
            <div>
              <p className="text-xs text-muted-foreground">{row.label}</p>
              <p className="text-sm font-semibold text-foreground">{row.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-emerald-50 border border-emerald-200/60 rounded-xl px-4 py-3">
        <span className="text-sm font-bold text-emerald-800 uppercase tracking-wide">
          {BENCHMARK_COMPARISON.resultLabel}
        </span>
        <p className="text-sm text-emerald-900/90 mt-1">{BENCHMARK_COMPARISON.resultDescription}</p>
      </div>
    </motion.div>
  );
}
