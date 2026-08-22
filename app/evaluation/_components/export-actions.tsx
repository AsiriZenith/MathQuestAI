"use client";

import { motion } from "motion/react";
import { Download, RefreshCw } from "lucide-react";
import { toEvaluationMarkdown } from "@/lib/evaluation/export";
import type { EvaluationResult } from "@/lib/evaluation/types";

function download(filename: string, contents: string, mime: string) {
  const blob = new Blob([contents], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Lets a researcher keep a run for comparison against later prompt iterations
 * without the project having to store generation history.
 */
export function ExportActions({
  result,
  onRegenerate,
}: {
  result: EvaluationResult;
  onRegenerate: () => void;
}) {
  const stamp = result.evaluatedAt.slice(0, 19).replace(/[:T]/g, "-");

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.6 }}
      className="bg-secondary/50 border border-border rounded-2xl p-6 mb-8 shadow-sm"
    >
      <h2 className="font-jakarta text-base font-bold text-foreground mb-2">Keep This Run</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Export the full report to compare against the next iteration after you change the prompt.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() =>
            download(
              `evaluation-${stamp}.json`,
              JSON.stringify(result, null, 2),
              "application/json",
            )
          }
          className="font-jakarta flex items-center gap-2 bg-background border border-border text-foreground font-semibold text-sm px-4 py-2.5 rounded-xl shadow-sm hover:border-primary/40 hover:bg-secondary/60 transition-colors duration-150"
        >
          <Download className="w-4 h-4" />
          JSON
        </button>
        <button
          type="button"
          onClick={() =>
            download(`evaluation-${stamp}.md`, toEvaluationMarkdown(result), "text/markdown")
          }
          className="font-jakarta flex items-center gap-2 bg-background border border-border text-foreground font-semibold text-sm px-4 py-2.5 rounded-xl shadow-sm hover:border-primary/40 hover:bg-secondary/60 transition-colors duration-150"
        >
          <Download className="w-4 h-4" />
          Markdown
        </button>
        <button
          type="button"
          onClick={onRegenerate}
          className="font-jakarta flex items-center gap-2 bg-primary text-primary-foreground font-semibold text-sm px-5 py-2.5 rounded-xl shadow-[0_4px_16px_rgba(79,70,229,0.22)] hover:bg-accent transition-colors duration-150"
        >
          <RefreshCw className="w-4 h-4" />
          Generate Another Set
        </button>
      </div>
    </motion.div>
  );
}
