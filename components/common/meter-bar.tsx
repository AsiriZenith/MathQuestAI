import { motion } from "motion/react";

/**
 * A horizontal proportion bar. Hand-rolled because the project has no charting
 * library and does not need one for single-value bars.
 */
export function MeterBar({
  value,
  tone = "primary",
  delay = 0,
}: {
  /** 0..1 */
  value: number;
  tone?: "primary" | "good" | "warning" | "bad" | "muted";
  delay?: number;
}) {
  const fill: Record<string, string> = {
    primary: "bg-primary",
    good: "bg-emerald-500",
    warning: "bg-amber-500",
    bad: "bg-rose-500",
    muted: "bg-muted-foreground/40",
  };

  const percent = Math.max(0, Math.min(1, value)) * 100;

  return (
    <div className="w-full h-2 bg-secondary/60 rounded-full overflow-hidden">
      <motion.div
        className={`h-full rounded-full ${fill[tone]}`}
        initial={{ width: "0%" }}
        animate={{ width: `${percent}%` }}
        transition={{ duration: 0.6, delay, ease: "easeOut" }}
      />
    </div>
  );
}

/** Map a 0..1 score onto the project's semantic colour scale. */
export function toneForScore(score: number | null): "good" | "warning" | "bad" | "muted" {
  if (score === null) return "muted";
  if (score >= 0.85) return "good";
  if (score >= 0.6) return "warning";
  return "bad";
}
