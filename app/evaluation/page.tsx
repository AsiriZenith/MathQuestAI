"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { usePracticeSession } from "@/components/providers/practice-session-provider";
import { PromptEffectivenessHero } from "./_components/prompt-effectiveness-hero";
import { ScoreBreakdown } from "./_components/score-breakdown";
import { AskedVsReceived } from "./_components/asked-vs-received";
import { RequirementMatrix } from "./_components/requirement-matrix";
import { CoverageCard } from "./_components/coverage-card";
import { DifficultyAssessment } from "./_components/difficulty-assessment";
import { OutputIntegrityCard, ReferenceAlignmentCard } from "./_components/integrity-and-reference";
import { DeviationTable } from "./_components/deviation-table";
import { ImprovementsList, StrengthsCard } from "./_components/improvements-list";
import { PromptInspector } from "./_components/prompt-inspector";
import { ExportActions } from "./_components/export-actions";

export default function EvaluationPage() {
  const router = useRouter();
  const { evaluationData } = usePracticeSession();

  useEffect(() => {
    if (!evaluationData) {
      router.replace("/");
    }
  }, [evaluationData, router]);

  if (!evaluationData) return null;

  const { result } = evaluationData;

  return (
    <main className="relative z-10 max-w-3xl mx-auto px-6 pb-24">
      <button
        type="button"
        onClick={() => router.push("/questions")}
        className="group flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-150 mb-8"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-150" />
        Back to Questions
      </button>

      <h1 className="font-jakarta text-3xl font-extrabold tracking-tight text-foreground mb-1.5">
        How Well Did This Prompt Work?
      </h1>
      <p className="text-[0.95rem] text-muted-foreground mb-5">
        This report evaluates the prompt and context that produced these questions — not the AI model
        — so you can decide what to change before the next run.
      </p>

      <PromptEffectivenessHero
        score={result.promptEffectiveness}
        band={result.band}
        explanation={result.explanation}
      />

      <ScoreBreakdown dimensions={result.dimensions} />

      <AskedVsReceived
        configuration={result.configuration}
        patternCoverage={result.patternCoverage}
        typeCoverage={result.typeCoverage}
      />

      <RequirementMatrix dimensions={result.dimensions} configuration={result.configuration} />

      <CoverageCard
        title="Question Pattern Coverage"
        description="How the generated questions were distributed across the patterns the prompt listed."
        report={result.patternCoverage}
        delay={0.2}
      />

      <CoverageCard
        title="Question Type Coverage"
        description="How the generated questions were distributed across the requested question types."
        report={result.typeCoverage}
        delay={0.22}
      />

      <DifficultyAssessment signals={result.difficulty} />

      <OutputIntegrityCard checks={result.integrityChecks} />

      <ReferenceAlignmentCard report={result.referenceAlignment} />

      <DeviationTable deviations={result.deviations} />

      <StrengthsCard strengths={result.strengths} />

      <ImprovementsList improvements={result.improvements} />

      <PromptInspector trace={result.promptTrace} />

      <ExportActions result={result} onRegenerate={() => router.push("/generate")} />
    </main>
  );
}
