"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { StatusPill } from "@/components/common/evaluation-indicators";
import type { PromptSectionTrace } from "@/lib/evaluation/types";

/**
 * The actual prompt that produced this output, section by section, each annotated
 * with how well it landed.
 *
 * This is what makes the report an evaluation of the prompt rather than of the
 * questions: a weak score here points at a specific, editable block of text.
 */
export function PromptInspector({ trace }: { trace: PromptSectionTrace[] }) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.55 }}
      className="bg-card border border-border rounded-2xl p-6 mb-6 shadow-sm"
    >
      <h2 className="font-jakarta text-base font-bold text-foreground mb-2">
        The Prompt That Produced This
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        The exact text sent to the AI, split into its sections. Each verdict shows what that section
        achieved — select one to read it.
      </p>

      <div className="divide-y divide-border">
        {trace.map((section) => {
          const isOpen = open === section.id;

          return (
            <div key={section.id} className="py-3 first:pt-0 last:pb-0">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : section.id)}
                aria-expanded={isOpen}
                className="w-full text-left"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-jakarta text-xs font-bold uppercase tracking-wider text-foreground truncate">
                      {section.heading}
                    </span>
                    {section.score !== null && (
                      <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                        {Math.round(section.score * 100)}%
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusPill status={section.status} />
                    <ChevronDown
                      className={`w-4 h-4 text-muted-foreground transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`}
                    />
                  </div>
                </div>
              </button>

              <p className="text-xs text-muted-foreground mt-1.5">{section.verdict}</p>

              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="overflow-hidden"
                >
                  <pre className="mt-3 bg-secondary/50 border border-border rounded-xl p-3 text-xs text-foreground/80 whitespace-pre-wrap font-mono overflow-x-auto">
                    {section.body || "This section was empty for this run."}
                  </pre>
                </motion.div>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
