"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ClipboardCheck, RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import { DIFFICULTY_OPTIONS } from "@/lib/mock-data";
import { usePracticeSession } from "@/components/providers/practice-session-provider";
import { SelectionSummary } from "@/components/common/selection-summary";
import { QuestionCoverage } from "./_components/question-coverage";
import { QuestionCard } from "./_components/question-card";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function QuestionsPage() {
  const router = useRouter();
  const { config, questions } = usePracticeSession();

  useEffect(() => {
    if (!config || !questions) {
      router.replace("/");
    }
  }, [config, questions, router]);

  if (!config || !questions) return null;

  const difficultyLabel = cap(config.difficulty);
  const difficultyStyle =
    DIFFICULTY_OPTIONS.find((d) => d.id === config.difficulty)?.activeClass ??
    "bg-primary border-primary text-white";

  const summaryItems = ["Mathematics", "Algebra", config.subtopic, difficultyLabel];

  return (
    <main className="relative z-10 max-w-3xl mx-auto px-6 pb-24">
      <button
        type="button"
        onClick={() => router.push("/")}
        className="group flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-150 mb-8"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-150" />
        Edit Setup
      </button>

      <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
        <div>
          <h1 className="font-jakarta text-3xl font-extrabold tracking-tight text-foreground mb-1.5">
            Your Practice Questions
          </h1>
          <p className="text-[0.95rem] text-muted-foreground">
            Different question types covering {config.subtopic}.
          </p>
        </div>

        <motion.button
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.96 }}
          type="button"
          onClick={() => router.push("/generate")}
          className="font-jakarta group flex items-center gap-2 bg-background border border-border text-foreground font-semibold text-sm px-4 py-2.5 rounded-xl shadow-sm hover:border-primary/40 hover:bg-secondary/60 transition-colors duration-150 shrink-0"
        >
          <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
          Regenerate
        </motion.button>
      </div>

      <SelectionSummary grade={config.grade} items={summaryItems} />

      <QuestionCoverage totalTypes={questions.length} />

      <div className="space-y-4">
        {questions.map((q, i) => (
          <QuestionCard
            key={q.id}
            question={q}
            index={i}
            difficultyLabel={difficultyLabel}
            difficultyStyle={difficultyStyle}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 * questions.length }}
        className="mt-8"
      >
        <button
          type="button"
          onClick={() => router.push("/evaluation")}
          className="font-jakarta w-full flex items-center justify-center gap-3 bg-primary text-primary-foreground font-semibold text-base py-4 rounded-xl shadow-[0_4px_16px_rgba(79,70,229,0.22)] hover:bg-accent hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(79,70,229,0.28)] transition-all duration-200"
        >
          <ClipboardCheck className="w-5 h-5" />
          Evaluate Results
          <ArrowRight className="w-5 h-5" />
        </button>
        <p className="text-center text-xs text-muted-foreground mt-3">
          See how well these questions cover the benchmark set and requested difficulty.
        </p>
      </motion.div>
    </main>
  );
}
