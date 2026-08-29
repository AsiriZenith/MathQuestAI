"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, ClipboardCheck, History, Sparkles, X } from "lucide-react";
import { prepareEvaluationAction, findMatchingGenerationContextsAction, prepareComparisonAction } from "@/lib/actions/evaluation";
import { QUESTION_TYPE_OPTIONS } from "@/lib/mock-data";
import type {
  ComparisonData,
  EvaluationData,
  GenerationContext,
  GenerationMeta,
  MatchingGenerationContext,
  PracticeConfig,
} from "@/lib/types";
import type { GenerationResponse } from "@/lib/prompts/types";

type Phase =
  | "select"
  | "loading"
  | "error"
  | "saved-loading"
  | "saved-list"
  | "saved-empty"
  | "saved-error"
  | "comparing";

const TYPE_LABELS = new Map(QUESTION_TYPE_OPTIONS.map((o) => [o.id, o.label]));

export function EvaluationMethodDialog({
  open,
  onClose,
  config,
  generationContext,
  generationResponse,
  generationMeta,
  onPrepared,
  onComparisonPrepared,
  savedGenerationContextId = null,
}: {
  open: boolean;
  onClose: () => void;
  config: PracticeConfig;
  generationContext: GenerationContext;
  generationResponse: GenerationResponse;
  generationMeta: GenerationMeta;
  onPrepared: (data: EvaluationData) => void;
  /** Fired once a current-vs-previous comparison is ready (TASK-023). */
  onComparisonPrepared: (data: ComparisonData) => void;
  /** The current generation's own saved id, if any (TASK-022). */
  savedGenerationContextId?: string | null;
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
          onComparisonPrepared={onComparisonPrepared}
          savedGenerationContextId={savedGenerationContextId}
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
  onComparisonPrepared,
  savedGenerationContextId,
}: {
  onClose: () => void;
  config: PracticeConfig;
  generationContext: GenerationContext;
  generationResponse: GenerationResponse;
  generationMeta: GenerationMeta;
  onPrepared: (data: EvaluationData) => void;
  onComparisonPrepared: (data: ComparisonData) => void;
  savedGenerationContextId: string | null;
}) {
  const [selected, setSelected] = useState(false);
  const [phase, setPhase] = useState<Phase>("select");
  const [error, setError] = useState<string | null>(null);
  const [savedContexts, setSavedContexts] = useState<MatchingGenerationContext[]>([]);
  const [selectedSavedId, setSelectedSavedId] = useState<string | null>(null);
  const [savedListError, setSavedListError] = useState<string | null>(null);

  const backToSelect = () => {
    setPhase("select");
    setSelected(false);
    setSelectedSavedId(null);
    setSavedListError(null);
  };

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
      generationContextId: savedGenerationContextId,
    });

    if (!result.ok) {
      setError(result.error);
      setPhase("error");
      return;
    }

    onPrepared(result.data);
  };

  const handleFindSaved = async () => {
    setPhase("saved-loading");

    const result = await findMatchingGenerationContextsAction({
      config,
      generationContext,
      excludeGenerationContextId: savedGenerationContextId,
    });

    if (!result.ok) {
      setError(result.error);
      setPhase("saved-error");
      return;
    }

    if (result.contexts.length === 0) {
      setPhase("saved-empty");
      return;
    }

    setSavedContexts(result.contexts);
    setPhase("saved-list");
  };

  const handleContinueSaved = async () => {
    if (!selectedSavedId) return;
    setSavedListError(null);
    setPhase("comparing");

    const result = await prepareComparisonAction({
      config,
      generationContext,
      generationResponse,
      generationMeta,
      currentGenerationContextId: savedGenerationContextId,
      previousGenerationContextId: selectedSavedId,
    });

    if (!result.ok) {
      setSavedListError(result.error);
      setPhase("saved-list");
      return;
    }

    onComparisonPrepared(result.data);
  };

  const isLoading = phase === "loading" || phase === "saved-loading" || phase === "comparing";
  const isWide = phase === "saved-list" || phase === "saved-empty" || phase === "saved-error";

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
          className={`pointer-events-auto w-full ${
            isWide ? "max-w-2xl" : "max-w-md"
          } bg-card border border-border rounded-2xl shadow-xl overflow-hidden`}
        >
          {phase === "loading" || phase === "saved-loading" || phase === "comparing" ? (
            <div className="p-8 flex flex-col items-center text-center">
              <div className="relative w-14 h-14 mb-5">
                <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
                <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary/55" />
                </div>
              </div>
              <h2 className="font-jakarta text-lg font-bold text-foreground mb-1.5">
                {phase === "saved-loading"
                  ? "Looking for Saved Results…"
                  : phase === "comparing"
                    ? "Preparing Comparison…"
                    : "Preparing Evaluation…"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {phase === "saved-loading"
                  ? "Searching for previously saved generations that match your current selection."
                  : phase === "comparing"
                    ? "Evaluating the current and previous generations so they can be compared."
                    : "Getting everything ready to evaluate your questions."}
              </p>
            </div>
          ) : phase === "saved-empty" ? (
            <div className="p-7">
              <DialogHeader onClose={onClose} title="No Saved Results Found" />
              <p className="text-sm text-muted-foreground mb-6">
                No saved results were found for the selected difficulty, question patterns, and
                question types.
              </p>
              <BackButton onClick={backToSelect} />
            </div>
          ) : phase === "saved-error" ? (
            <div className="p-7">
              <DialogHeader onClose={onClose} title="Couldn't Load Saved Results" />
              {error && (
                <p className="text-center text-xs text-destructive mb-4" role="alert">
                  {error}
                </p>
              )}
              <BackButton onClick={backToSelect} />
            </div>
          ) : phase === "saved-list" ? (
            <div className="p-7">
              <DialogHeader onClose={onClose} title="Choose a Saved Result" />
              <p className="text-sm text-muted-foreground mb-4">
                Select one previously saved generation to compare against the current one.
              </p>

              <div className="overflow-x-auto mb-4 border border-border rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Select</th>
                      <th className="px-3 py-2 font-semibold">Context Name</th>
                      <th className="px-3 py-2 font-semibold">Pattern</th>
                      <th className="px-3 py-2 font-semibold">Type</th>
                      <th className="px-3 py-2 font-semibold">AI Provider</th>
                      <th className="px-3 py-2 font-semibold">AI Model</th>
                      <th className="px-3 py-2 font-semibold">Difficulty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {savedContexts.map((ctx) => (
                      <tr key={ctx.id} className="border-t border-border">
                        <td className="px-3 py-2">
                          <input
                            type="radio"
                            name="saved-context"
                            aria-label={`Select ${ctx.name}`}
                            checked={selectedSavedId === ctx.id}
                            onChange={() => setSelectedSavedId(ctx.id)}
                          />
                        </td>
                        <td className="px-3 py-2 text-foreground">{ctx.name}</td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {ctx.patterns.map((p) => p.name).join(", ")}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {ctx.questionTypes.map((t) => TYPE_LABELS.get(t) ?? t).join(", ")}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">{ctx.aiProvider}</td>
                        <td className="px-3 py-2 text-muted-foreground">{ctx.aiModel}</td>
                        <td className="px-3 py-2 text-muted-foreground">{ctx.difficultyLevel}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {savedListError && (
                <p className="text-center text-xs text-destructive mb-4" role="alert">
                  {savedListError}
                </p>
              )}

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={backToSelect}
                  className="font-jakarta flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-150"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleContinueSaved}
                  disabled={!selectedSavedId}
                  className={`font-jakarta flex-1 flex items-center justify-center gap-2 font-semibold text-sm py-3 rounded-xl transition-all duration-200 ${
                    selectedSavedId
                      ? "bg-primary text-primary-foreground hover:bg-accent cursor-pointer"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  }`}
                >
                  Compare
                  {selectedSavedId && <ArrowRight className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-7">
              <DialogHeader onClose={onClose} title="Choose Evaluation Method" />
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

                <button
                  type="button"
                  onClick={handleFindSaved}
                  className="w-full text-left p-4 rounded-xl border-2 border-border bg-background hover:border-primary/35 hover:bg-secondary/60 transition-all duration-150"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <History className="w-4 h-4 text-primary shrink-0" />
                    <span className="font-jakarta text-sm font-semibold text-foreground">
                      Compare with Previous Generations
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Compare the current generated questions with questions generated in previous
                    sessions.
                  </p>
                </button>
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

function DialogHeader({ onClose, title }: { onClose: () => void; title: string }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-1.5">
      <h2 className="font-jakarta text-lg font-bold text-foreground">{title}</h2>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="text-muted-foreground hover:text-foreground transition-colors duration-150 shrink-0"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="font-jakarta w-full flex items-center justify-center gap-2 font-semibold text-sm py-3 rounded-xl bg-muted text-foreground hover:bg-muted/70 transition-all duration-200"
    >
      <ArrowLeft className="w-4 h-4" />
      Back
    </button>
  );
}
