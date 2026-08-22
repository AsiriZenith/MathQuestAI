"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { GenerationResponse } from "@/lib/prompts/types";
import type {
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
  setEvaluationData: (data: EvaluationData) => void;
}

const PracticeSessionContext = createContext<PracticeSessionState | null>(null);

export function PracticeSessionProvider({
  children,
  initialConfig = null,
  initialGenerationResponse = null,
  initialGenerationContext = null,
  initialGenerationMeta = null,
  initialEvaluationData = null,
}: {
  children: ReactNode;
  initialConfig?: PracticeConfig | null;
  initialGenerationResponse?: GenerationResponse | null;
  initialGenerationContext?: GenerationContext | null;
  initialGenerationMeta?: GenerationMeta | null;
  initialEvaluationData?: EvaluationData | null;
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
    }),
    [config, generationResponse, generationContext, generationMeta, evaluationData],
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
