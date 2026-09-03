"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Loader2, Save, X } from "lucide-react";
import { saveGenerationAction } from "@/lib/actions/save-generation";
import type { GenerationContext, GenerationMeta, PracticeConfig } from "@/lib/types";
import type { GenerationResponse } from "@/lib/prompts/types";

type Phase = "confirm" | "saving" | "error";

const CONFIRM_MESSAGE =
  "Do you want to save these generated questions for evaluation? This will save the questions and their generation details so they can be evaluated later.";

export function SaveForEvaluationDialog({
  open,
  onClose,
  config,
  generationContext,
  generationResponse,
  generationMeta,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  config: PracticeConfig;
  generationContext: GenerationContext;
  generationResponse: GenerationResponse;
  generationMeta: GenerationMeta;
  onSaved: (generationContextId: string) => void;
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
          onSaved={onSaved}
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
  onSaved,
}: {
  onClose: () => void;
  config: PracticeConfig;
  generationContext: GenerationContext;
  generationResponse: GenerationResponse;
  generationMeta: GenerationMeta;
  onSaved: (generationContextId: string) => void;
}) {
  const [phase, setPhase] = useState<Phase>("confirm");
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const isSaving = phase === "saving";

  const handleConfirm = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setPhase("saving");
    setError(null);

    const result = await saveGenerationAction({
      config,
      generationContext,
      generationResponse,
      generationMeta,
    });

    inFlight.current = false;

    if (!result.ok) {
      setError(result.error);
      setPhase("error");
      return;
    }

    onSaved(result.generationContextId);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 bg-black/40"
        onClick={isSaving ? undefined : onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none">
        <motion.div
          role="alertdialog"
          aria-modal="true"
          aria-label="Save Questions for Evaluation?"
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.2 }}
          className="pointer-events-auto w-full max-w-md bg-card border border-border rounded-2xl shadow-xl overflow-hidden"
        >
          <div className="p-7">
            <div className="flex items-start justify-between gap-4 mb-1.5">
              <div className="flex items-center gap-2">
                <Save className="w-5 h-5 text-primary shrink-0" />
                <h2 className="font-jakarta text-lg font-bold text-foreground">
                  Save Questions for Evaluation?
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                aria-label="Close"
                className="text-muted-foreground hover:text-foreground transition-colors duration-150 shrink-0 disabled:opacity-40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">{CONFIRM_MESSAGE}</p>

            {phase === "error" && error && (
              <p className="text-center text-xs text-destructive mb-4" role="alert">
                {error}
              </p>
            )}

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isSaving}
                className="font-jakarta w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold text-sm py-3 rounded-xl hover:bg-accent transition-colors duration-150 disabled:opacity-70 disabled:hover:bg-primary"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    {phase === "error" ? "Try Again" : "Save for Evaluation"}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="font-jakarta w-full text-center text-sm font-semibold text-muted-foreground hover:text-foreground py-2 transition-colors duration-150 disabled:opacity-40"
              >
                Cancel
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
