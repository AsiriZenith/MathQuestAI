"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { usePracticeSession } from "@/components/providers/practice-session-provider";
import { updateGenerationContextScoreAction } from "@/lib/actions/evaluation";
import { ComparisonHeader } from "./_components/comparison-header";
import { DimensionComparisonTable } from "./_components/dimension-comparison-table";
import { ComparisonSide } from "./_components/comparison-side";

export default function ComparisonPage() {
  const router = useRouter();
  const { comparisonData } = usePracticeSession();
  const [scoreSaveFailed, setScoreSaveFailed] = useState(false);
  const persistedRef = useRef(false);

  useEffect(() => {
    if (!comparisonData) {
      router.replace("/");
    }
  }, [comparisonData, router]);

  useEffect(() => {
    if (!comparisonData || persistedRef.current) return;
    persistedRef.current = true;

    const { current, previous } = comparisonData;

    const persistCurrent = current.generationContextId
      ? updateGenerationContextScoreAction({
          generationContextId: current.generationContextId,
          score: current.result.promptEffectiveness,
        })
      : Promise.resolve({ ok: true as const });

    const persistPrevious = updateGenerationContextScoreAction({
      generationContextId: previous.generationContextId,
      score: previous.result.promptEffectiveness,
    });

    Promise.all([persistCurrent, persistPrevious]).then(([currentRes, previousRes]) => {
      if (!currentRes.ok || !previousRes.ok) setScoreSaveFailed(true);
    });
  }, [comparisonData]);

  if (!comparisonData) return null;

  const { current, previous, comparison } = comparisonData;

  return (
    <main className="relative z-10 max-w-3xl mx-auto px-6 pb-24">
      {scoreSaveFailed && (
        <p role="alert" className="text-center text-xs text-destructive mb-4">
          Couldn&apos;t save one or both generations&apos; scores. The comparison below is
          unaffected.
        </p>
      )}
      <button
        type="button"
        onClick={() => router.push("/questions")}
        className="group flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-150 mb-8"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-150" />
        Back to Questions
      </button>

      <h1 className="font-jakarta text-3xl font-extrabold tracking-tight text-foreground mb-1.5">
        Current vs. Previous Generation
      </h1>
      <p className="text-[0.95rem] text-muted-foreground mb-5">
        Both generations were evaluated fresh, using the same criteria, so the numbers below are
        directly comparable.
      </p>

      <ComparisonHeader current={current} previous={previous} overallScore={comparison.overallScore} />

      <DimensionComparisonTable dimensions={comparison.dimensions} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ComparisonSide label="Current Generation" data={current} />
        <ComparisonSide label="Previous Generation" data={previous} />
      </div>
    </main>
  );
}
