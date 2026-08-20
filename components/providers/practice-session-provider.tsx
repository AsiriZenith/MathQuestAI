"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { GenerationResponse } from "@/lib/prompts/types";
import type { GenerationContext, PracticeConfig } from "@/lib/types";

interface PracticeSessionState {
  config: PracticeConfig | null;
  setConfig: (config: PracticeConfig) => void;
  generationResponse: GenerationResponse | null;
  setGenerationResponse: (response: GenerationResponse) => void;
  generationContext: GenerationContext | null;
  setGenerationContext: (context: GenerationContext) => void;
}

const PracticeSessionContext = createContext<PracticeSessionState | null>(null);

export function PracticeSessionProvider({
  children,
  initialConfig = null,
  initialGenerationResponse = null,
  initialGenerationContext = null,
}: {
  children: ReactNode;
  initialConfig?: PracticeConfig | null;
  initialGenerationResponse?: GenerationResponse | null;
  initialGenerationContext?: GenerationContext | null;
}) {
  const [config, setConfig] = useState<PracticeConfig | null>(initialConfig);
  const [generationResponse, setGenerationResponse] = useState<GenerationResponse | null>(
    initialGenerationResponse,
  );
  const [generationContext, setGenerationContext] = useState<GenerationContext | null>(
    initialGenerationContext,
  );

  const value = useMemo(
    () => ({
      config,
      setConfig,
      generationResponse,
      setGenerationResponse,
      generationContext,
      setGenerationContext,
    }),
    [config, generationResponse, generationContext],
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
