import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";
import { EVALUATION_FINDINGS } from "@/lib/mock-data";

export function FindingsList() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25 }}
      className="bg-card border border-border rounded-2xl p-6 mb-6 shadow-sm"
    >
      <h2 className="font-jakarta text-base font-bold text-foreground mb-3">
        What Could Be Improved?
      </h2>
      <ul className="space-y-2">
        {EVALUATION_FINDINGS.map((finding, i) => (
          <li
            key={i}
            className={`flex items-start gap-2 text-sm ${
              finding.type === "warning" ? "text-amber-900/90" : "text-emerald-900/90"
            }`}
          >
            {finding.type === "warning" ? (
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            )}
            {finding.text}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
