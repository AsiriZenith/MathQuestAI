"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, ClipboardCheck, Lock, Sparkles, X } from "lucide-react";
import { prepareEvaluationAction } from "@/lib/actions/evaluation";
import type {
  EvaluationData,
  GenerationContext,
  GenerationMeta,
  PracticeConfig,
} from "@/lib/types";
import type { GenerationResponse } from "@/lib/prompts/types";

type Phase = "select" | "loading" | "error";

export function EvaluationMethodDialog({
  open,
  onClose,
  config,
  generationContext,
  generationResponse,
  generationMeta,
  onPrepared,
}: {
  open: boolean;
  onClose: () => void;
  config: PracticeConfig;
  generationContext: GenerationContext;
  generationResponse: GenerationResponse;
  generationMeta: GenerationMeta;
  onPrepared: (data: EvaluationData) => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <DialogContent
          onClose={onClose}
          config={config}
          generationContext={generationContext}
          generationResponse={generationResponse}
          generationMeta={generationMeta}
          onPrepared={onPrepared}
        />
      )}
    </AnimatePresence>
  );
}

function DialogContent({
  onClose,
  config,
  generationContext,
  generationResponse,
  generationMeta,
  onPrepared,
}: {
  onClose: () => void;
  config: PracticeConfig;
  generationContext: GenerationContext;
  generationResponse: GenerationResponse;
  generationMeta: GenerationMeta;
  onPrepared: (data: EvaluationData) => void;
}) {
  const [selected, setSelected] = useState(false);
  const [phase, setPhase] = useState<Phase>("select");
  const [error, setError] = useState<string | null>(null);

  const handleProceed = async () => {
    if (!selected) return;
    setPhase("loading");
    setError(null);

    const result = await prepareEvaluationAction({
      method: "predefined",
      config,
      generationContext,
      generationResponse,
      generationMeta,
    });

    if (!result.ok) {
      setError(result.error);
      setPhase("error");
      return;
    }

    onPrepared(result.data);
  };

  const isLoading = phase === "loading";

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 bg-black/40"
        onClick={isLoading ? undefined : onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.2 }}
          className="pointer-events-auto w-full max-w-md bg-card border border-border rounded-2xl shadow-xl overflow-hidden"
        >
          {isLoading ? (
            <div className="p-8 flex flex-col items-center text-center">
              <div className="relative w-14 h-14 mb-5">
                <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
                <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary/55" />
                </div>
              </div>
              <h2 className="font-jakarta text-lg font-bold text-foreground mb-1.5">
                Preparing Evaluation…
              </h2>
              <p className="text-sm text-muted-foreground">
                Getting everything ready to evaluate your questions.
              </p>
            </div>
          ) : (
            <div className="p-7">
              <div className="flex items-start justify-between gap-4 mb-1.5">
                <h2 className="font-jakarta text-lg font-bold text-foreground">
                  Choose Evaluation Method
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="text-muted-foreground hover:text-foreground transition-colors duration-150 shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground mb-5">
                Choose how you want to evaluate the generated questions.
              </p>

              <div className="space-y-3 mb-6">
                <button
                  type="button"
                  onClick={() => setSelected(true)}
                  aria-pressed={selected}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-150 ${
                    selected
                      ? "bg-primary/10 border-primary"
                      : "bg-background border-border hover:border-primary/35 hover:bg-secondary/60"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <ClipboardCheck className="w-4 h-4 text-primary shrink-0" />
                    <span className="font-jakarta text-sm font-semibold text-foreground">
                      Evaluate Against Predefined Questions
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Compare the generated questions with predefined benchmark/reference questions
                    for the selected subject, topic, subtopic, patterns, and difficulty.
                  </p>
                </button>

                <div
                  aria-disabled="true"
                  className="w-full text-left p-4 rounded-xl border-2 border-border bg-muted/40 opacity-60 cursor-not-allowed"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="font-jakarta text-sm font-semibold text-muted-foreground">
                        Compare with Previous Generations
                      </span>
                    </div>
                    <span className="font-jakarta text-[0.65rem] font-bold uppercase tracking-wide text-muted-foreground bg-background border border-border rounded-full px-2 py-0.5 shrink-0">
                      Coming Soon
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Compare the current generated questions with questions generated in previous
                    sessions.
                  </p>
                </div>
              </div>

              {phase === "error" && error && (
                <p className="text-center text-xs text-destructive mb-4" role="alert">
                  {error}
                </p>
              )}

              <button
                type="button"
                onClick={handleProceed}
                disabled={!selected}
                className={`font-jakarta w-full flex items-center justify-center gap-2 font-semibold text-sm py-3 rounded-xl transition-all duration-200 ${
                  selected
                    ? "bg-primary text-primary-foreground hover:bg-accent cursor-pointer"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
              >
                {phase === "error" ? "Try Again" : "Proceed"}
                {selected && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </>
  );
}
