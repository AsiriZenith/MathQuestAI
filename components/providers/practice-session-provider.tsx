"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { GeneratedQuestion, PracticeConfig } from "@/lib/types";

interface PracticeSessionState {
  config: PracticeConfig | null;
  setConfig: (config: PracticeConfig) => void;
  questions: GeneratedQuestion[] | null;
  setQuestions: (questions: GeneratedQuestion[]) => void;
}

const PracticeSessionContext = createContext<PracticeSessionState | null>(null);

export function PracticeSessionProvider({
  children,
  initialConfig = null,
  initialQuestions = null,
}: {
  children: ReactNode;
  initialConfig?: PracticeConfig | null;
  initialQuestions?: GeneratedQuestion[] | null;
}) {
  const [config, setConfig] = useState<PracticeConfig | null>(initialConfig);
  const [questions, setQuestions] = useState<GeneratedQuestion[] | null>(initialQuestions);

  const value = useMemo(
    () => ({ config, setConfig, questions, setQuestions }),
    [config, questions],
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
