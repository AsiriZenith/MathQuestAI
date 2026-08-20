"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  Check,
  GraduationCap,
  Layers,
  Shuffle,
  Sigma,
  Sparkles,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { LOADING_STEPS, QUESTION_TYPE_OPTIONS, SAMPLE_QUESTIONS } from "@/lib/mock-data";
import { usePracticeSession } from "@/components/providers/practice-session-provider";
import { SessionSummaryCard } from "./_components/session-summary-card";
import type { SummaryItem } from "@/lib/types";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function GeneratePage() {
  const router = useRouter();
  const { config, setQuestions } = usePracticeSession();
  const [currentStep, setCurrentStep] = useState(1);
  const isDone = currentStep > 4;

  useEffect(() => {
    if (!config) {
      router.replace("/");
    }
  }, [config, router]);

  useEffect(() => {
    if (!config || isDone) return;
    const t = setTimeout(() => setCurrentStep((s) => s + 1), 2200);
    return () => clearTimeout(t);
  }, [config, currentStep, isDone]);

  if (!config) return null;

  const difficultyLabel = cap(config.difficulty);
  const typesLabel = config.autoTypes
    ? "Mixed (AI selects)"
    : config.selectedTypes
        .map((id) => QUESTION_TYPE_OPTIONS.find((o) => o.id === id)?.label ?? id)
        .join(", ");

  const progressPct = Math.min(((currentStep - 1) / 4) * 100, 100);

  const stepSubLabels: Record<number, string> = {
    1: `Analysing ${config.subtopic}`,
    2: "Selecting suitable question formats",
    3: `Preparing ${difficultyLabel} questions for ${config.grade}`,
    4: "Ensuring a balanced and varied set",
  };

  const summaryItems: SummaryItem[] = [
    { label: "Grade", value: config.grade, Icon: GraduationCap },
    { label: "Subject", value: "Mathematics", Icon: BookOpen },
    { label: "Topic", value: "Algebra", Icon: Sigma },
    { label: "Subtopic", value: config.subtopic, Icon: Layers },
    { label: "Difficulty", value: difficultyLabel, Icon: Zap },
    { label: "Question Types", value: typesLabel, Icon: Shuffle },
  ];

  const handleComplete = () => {
    setQuestions(SAMPLE_QUESTIONS);
    router.push("/questions");
  };

  return (
    <main className="relative z-10 max-w-3xl mx-auto px-6 pb-24">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_230px] gap-10 md:gap-14 items-start">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="mb-7">
            {isDone ? (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 220, damping: 16 }}
                className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-[0_4px_20px_rgba(79,70,229,0.32)]"
              >
                <Check className="w-8 h-8 text-white" />
              </motion.div>
            ) : (
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
                <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-primary/55" />
                </div>
              </div>
            )}
          </div>

          <h1 className="font-jakarta text-3xl font-extrabold tracking-tight text-foreground mb-2">
            {isDone ? "Your Questions are Ready!" : "Generating Your Questions"}
          </h1>
          <p className="text-[0.95rem] text-muted-foreground leading-relaxed max-w-sm">
            {isDone
              ? "All questions have been prepared and checked. Tap the button below to begin."
              : "AI is creating different question types based on the selected Algebra concept."}
          </p>

          <div className="w-full h-1.5 bg-indigo-100 rounded-full mt-7 mb-8 overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            />
          </div>

          <div className="space-y-5">
            {LOADING_STEPS.map((step) => {
              const isComplete = currentStep > step.id;
              const isActive = currentStep === step.id;
              const isUpcoming = currentStep < step.id;

              return (
                <div key={step.id} className="flex items-start gap-4">
                  <div className="relative shrink-0 mt-0.5">
                    {isActive && (
                      <div className="absolute -inset-2 rounded-full bg-primary/12 animate-ping" />
                    )}
                    <div
                      className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isComplete || isActive
                          ? "bg-primary shadow-[0_2px_10px_rgba(79,70,229,0.25)]"
                          : "bg-muted border-2 border-border"
                      }`}
                    >
                      {isComplete ? (
                        <Check className="w-4 h-4 text-white" />
                      ) : isActive ? (
                        <step.Icon className="w-4 h-4 text-white" />
                      ) : (
                        <span className="font-jakarta text-xs font-bold text-muted-foreground">
                          {step.id}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-1.5 min-w-0">
                    <p
                      className={`font-jakarta text-sm font-semibold transition-colors duration-300 ${
                        isUpcoming ? "text-muted-foreground" : "text-foreground"
                      }`}
                    >
                      {step.label}
                    </p>
                    {!isUpcoming && (
                      <motion.p
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35 }}
                        className={`text-xs mt-0.5 ${
                          isActive ? "text-primary/70" : "text-muted-foreground"
                        }`}
                      >
                        {stepSubLabels[step.id]}
                      </motion.p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {isDone && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25 }}
              className="mt-10"
            >
              <button
                type="button"
                onClick={handleComplete}
                className="font-jakarta group flex items-center gap-3 bg-primary text-primary-foreground font-semibold text-base px-8 py-4 rounded-xl shadow-[0_4px_20px_rgba(79,70,229,0.22)] hover:bg-accent hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(79,70,229,0.28)] transition-all duration-200"
              >
                View Questions
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
              </button>
            </motion.div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, delay: 0.15 }}
        >
          <SessionSummaryCard items={summaryItems} />
        </motion.div>
      </div>
    </main>
  );
}
