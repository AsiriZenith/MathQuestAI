"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Check, CheckCircle2, Copy, FileCode2 } from "lucide-react";
import type { ImprovementOpportunity, Strength } from "@/lib/evaluation/types";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard access can be denied; the text is still selectable on screen.
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="font-jakarta inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-accent transition-colors duration-150 shrink-0"
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

/**
 * The point of the whole report: what to change in the prompt before the next
 * run. Every item carries its evidence and concrete replacement text, so it can
 * be acted on without re-deriving the reasoning.
 */
export function ImprovementsList({ improvements }: { improvements: ImprovementOpportunity[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
      className="bg-card border border-border rounded-2xl p-6 mb-6 shadow-sm"
    >
      <h2 className="font-jakarta text-base font-bold text-foreground mb-2">
        What to Change in the Prompt
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        Each recommendation traces a specific finding back to the prompt text that allowed it.
      </p>

      {improvements.length === 0 ? (
        <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200/60 rounded-xl px-4 py-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-900/90">
            No prompt weaknesses detected in this run. The current prompt communicated its
            requirements effectively.
          </p>
        </div>
      ) : (
        <ol className="space-y-4">
          {improvements.map((item, index) => (
            <li key={item.id} className="border border-border rounded-xl p-4 bg-background">
              <div className="flex items-start gap-2.5 mb-3">
                <span className="font-jakarta shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                  {index + 1}
                </span>
                <p className="text-sm font-semibold text-foreground">{item.problem}</p>
              </div>

              <dl className="space-y-2.5 mb-3">
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Evidence
                  </dt>
                  <dd className="text-sm text-foreground/80">{item.evidence}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Likely prompt weakness
                  </dt>
                  <dd className="text-sm text-foreground/80">{item.likelyPromptWeakness}</dd>
                </div>
              </dl>

              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
                <div className="flex items-center justify-between gap-3 mb-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">
                    Suggested prompt text
                  </span>
                  <CopyButton text={item.suggestedChange} />
                </div>
                <p className="text-sm text-foreground font-medium whitespace-pre-wrap">
                  {item.suggestedChange}
                </p>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2.5">
                  <FileCode2 className="w-3.5 h-3.5 shrink-0" />
                  <code className="break-all">{item.targetFile}</code>
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </motion.div>
  );
}

/** The inverse signal: prompt instructions to leave alone next iteration. */
export function StrengthsCard({ strengths }: { strengths: Strength[] }) {
  if (strengths.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.45 }}
      className="bg-card border border-border rounded-2xl p-6 mb-6 shadow-sm"
    >
      <h2 className="font-jakarta text-base font-bold text-foreground mb-2">
        What Worked — Leave These Alone
      </h2>
      <p className="text-sm text-muted-foreground mb-3">
        These prompt instructions were followed closely. Changing them risks losing ground in the
        next iteration.
      </p>
      <ul className="space-y-2">
        {strengths.map((strength) => (
          <li key={strength.id} className="flex items-start gap-2 text-sm text-emerald-900/90">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            {strength.finding}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
