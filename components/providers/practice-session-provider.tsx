"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { GenerationResponse } from "@/lib/prompts/types";
import type {
  ComparisonData,
  EvaluationData,
  GenerationContext,
  GenerationMeta,
  PracticeConfig,
} from "@/lib/types";

interface PracticeSessionState {
  config: PracticeConfig | null;
  setConfig: (config: PracticeConfig) => void;
  generationResponse: GenerationResponse | null;
  setGenerationResponse: (response: GenerationResponse) => void;
  generationContext: GenerationContext | null;
  setGenerationContext: (context: GenerationContext) => void;
  generationMeta: GenerationMeta | null;
  setGenerationMeta: (meta: GenerationMeta) => void;
  evaluationData: EvaluationData | null;
  setEvaluationData: (data: EvaluationData | null) => void;
  /** Set once the current generation has been persisted (TASK-018). */
  savedGenerationContextId: string | null;
  setSavedGenerationContextId: (id: string | null) => void;
  /** Current-vs-previous comparison, prepared by the Questions page (TASK-023). */
  comparisonData: ComparisonData | null;
  setComparisonData: (data: ComparisonData | null) => void;
}

const PracticeSessionContext = createContext<PracticeSessionState | null>(null);

export function PracticeSessionProvider({
  children,
  initialConfig = null,
  initialGenerationResponse = null,
  initialGenerationContext = null,
  initialGenerationMeta = null,
  initialEvaluationData = null,
  initialSavedGenerationContextId = null,
  initialComparisonData = null,
}: {
  children: ReactNode;
  initialConfig?: PracticeConfig | null;
  initialGenerationResponse?: GenerationResponse | null;
  initialGenerationContext?: GenerationContext | null;
  initialGenerationMeta?: GenerationMeta | null;
  initialEvaluationData?: EvaluationData | null;
  initialSavedGenerationContextId?: string | null;
  initialComparisonData?: ComparisonData | null;
}) {
  const [config, setConfig] = useState<PracticeConfig | null>(initialConfig);
  const [generationResponse, setGenerationResponse] = useState<GenerationResponse | null>(
    initialGenerationResponse,
  );
  const [generationContext, setGenerationContext] = useState<GenerationContext | null>(
    initialGenerationContext,
  );
  const [generationMeta, setGenerationMeta] = useState<GenerationMeta | null>(
    initialGenerationMeta,
  );
  const [evaluationData, setEvaluationData] = useState<EvaluationData | null>(
    initialEvaluationData,
  );
  const [savedGenerationContextId, setSavedGenerationContextId] = useState<string | null>(
    initialSavedGenerationContextId,
  );
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(
    initialComparisonData,
  );

  const value = useMemo(
    () => ({
      config,
      setConfig,
      generationResponse,
      setGenerationResponse,
      generationContext,
      setGenerationContext,
      generationMeta,
      setGenerationMeta,
      evaluationData,
      setEvaluationData,
      savedGenerationContextId,
      setSavedGenerationContextId,
      comparisonData,
      setComparisonData,
    }),
    [
      config,
      generationResponse,
      generationContext,
      generationMeta,
      evaluationData,
      savedGenerationContextId,
      comparisonData,
    ],
  );

  return (
    <PracticeSessionContext.Provider value={value}>{children}</PracticeSessionContext.Provider>
  );
}

export function usePracticeSession(): PracticeSessionState {
  const ctx = useContext(PracticeSessionContext);
  if (!ctx) {
    throw new Error("usePracticeSession must be used within a PracticeSessionProvider");
  }
  return ctx;
}
