"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import { QUESTION_TYPE_OPTIONS, REQUESTED_TYPE_MATCH } from "@/lib/mock-data";
import { usePracticeSession } from "@/components/providers/practice-session-provider";
import { SelectionSummary } from "@/components/common/selection-summary";
import { CoverageResultCard } from "./_components/coverage-result-card";
import { PatternCoverageList } from "./_components/pattern-coverage-list";
import { RequestedVsGenerated } from "./_components/requested-vs-generated";
import { BenchmarkComparisonSection } from "./_components/benchmark-comparison";
import { FindingsList } from "./_components/findings-list";
import type { RequestedTypeId } from "@/lib/types";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function EvaluationPage() {
  const router = useRouter();
  const { config } = usePracticeSession();

  useEffect(() => {
    if (!config) {
      router.replace("/");
    }
  }, [config, router]);

  if (!config) return null;

  const difficultyLabel = cap(config.difficulty);
  const summaryItems = ["Mathematics", "Algebra", config.subtopic, difficultyLabel];

  const requestedTypeIds = (
    config.autoTypes ? QUESTION_TYPE_OPTIONS.map((o) => o.id) : config.selectedTypes
  ) as RequestedTypeId[];

  const requestedRows = requestedTypeIds.map((id) => {
    const opt = QUESTION_TYPE_OPTIONS.find((o) => o.id === id);
    const generated = REQUESTED_TYPE_MATCH[id] !== null;
    return { id, label: opt?.label ?? id, generated };
  });

  const missingTypeLabels = requestedRows.filter((r) => !r.generated).map((r) => r.label);
  const requestedInterpretation =
    missingTypeLabels.length === 0
      ? "AI generated a matching question for everything you asked for."
      : `AI didn't generate a ${missingTypeLabels.join(" or ")} question as requested.`;

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
        How Well Did AI Cover This Topic?
      </h1>
      <p className="text-[0.95rem] text-muted-foreground mb-5">
        We compared the generated questions with the predefined question patterns for this topic.
      </p>

      <SelectionSummary grade={config.grade} items={summaryItems} />

      <CoverageResultCard />
      <PatternCoverageList />
      <RequestedVsGenerated
        config={config}
        requestedRows={requestedRows}
        interpretation={requestedInterpretation}
      />
      <BenchmarkComparisonSection />
      <FindingsList />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="bg-secondary/50 border border-border rounded-2xl p-6 mb-8 shadow-sm"
      >
        <h2 className="font-jakarta text-base font-bold text-foreground mb-2">
          How did we check this?
        </h2>
        <p className="text-sm text-muted-foreground">
          The generated questions were compared with the predefined question patterns and sample
          questions for the selected topic. We looked at whether the important concepts, question
          styles, and requested difficulty were represented.
        </p>
      </motion.div>

      <div className="flex flex-wrap items-center gap-3">
        <motion.button
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.96 }}
          type="button"
          onClick={() => router.push("/generate")}
          className="font-jakarta flex items-center gap-2 bg-primary text-primary-foreground font-semibold text-sm px-5 py-3 rounded-xl shadow-[0_4px_16px_rgba(79,70,229,0.22)] hover:bg-accent transition-colors duration-150"
        >
          <RefreshCw className="w-4 h-4" />
          Generate Another Set
        </motion.button>
        <motion.button
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.96 }}
          type="button"
          onClick={() => router.push("/questions")}
          className="font-jakarta flex items-center gap-2 bg-background border border-border text-foreground font-semibold text-sm px-5 py-3 rounded-xl shadow-sm hover:border-primary/40 hover:bg-secondary/60 transition-colors duration-150"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Questions
        </motion.button>
      </div>
    </main>
  );
}
