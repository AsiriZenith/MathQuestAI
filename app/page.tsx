"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronDown } from "lucide-react";
import { motion } from "motion/react";
import { SUBTOPICS, canGenerate } from "@/lib/mock-data";
import { usePracticeSession } from "@/components/providers/practice-session-provider";
import { FixedField } from "@/app/_components/fixed-field";
import { DifficultyToggle } from "@/app/_components/difficulty-toggle";
import { QuestionTypeChips } from "@/app/_components/question-type-chips";
import type { Difficulty } from "@/lib/types";

export default function SetupPage() {
  const router = useRouter();
  const { setConfig } = usePracticeSession();

  const [grade] = useState("Grade 6");
  const [subtopic, setSubtopic] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty | "">("");
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [autoTypes, setAutoTypes] = useState(false);

  const toggleType = (id: string) => {
    if (autoTypes) setAutoTypes(false);
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAutoTypes = () => {
    if (!autoTypes) {
      setSelectedTypes(new Set());
      setAutoTypes(true);
    } else {
      setAutoTypes(false);
    }
  };

  const ready = canGenerate({
    grade,
    subtopic,
    difficulty,
    selectedTypesSize: selectedTypes.size,
    autoTypes,
  });

  const handleGenerate = () => {
    if (!ready) return;
    setConfig({
      grade,
      subtopic,
      difficulty: difficulty as Difficulty,
      selectedTypes: Array.from(selectedTypes),
      autoTypes,
    });
    router.push("/generate");
  };

  return (
    <main className="relative z-10 max-w-3xl mx-auto px-6 pt-14 pb-24">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-7"
      >
        <h1 className="font-jakarta text-3xl font-extrabold tracking-tight text-foreground mb-1.5">
          Set Up Your Practice
        </h1>
        <p className="text-[0.95rem] text-muted-foreground">
          Tell us what you want to work on and how you want to be tested.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.12 }}
        className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden"
      >
        <div className="p-7 space-y-6">
          <FixedField label="Grade" value={grade} />

          <div className="grid grid-cols-2 gap-4">
            <FixedField label="Subject" value="Mathematics" />
            <FixedField label="Topic" value="Algebra" />
          </div>

          <div>
            <label className="font-jakarta block text-sm font-semibold text-foreground mb-2">
              Subtopic
            </label>
            <div className="relative">
              <select
                value={subtopic}
                onChange={(e) => setSubtopic(e.target.value)}
                aria-label="Subtopic"
                className="w-full appearance-none bg-background border border-border rounded-xl px-4 py-3 text-[0.95rem] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/60 transition-colors pr-10 cursor-pointer"
              >
                <option value="">Select a subtopic…</option>
                {SUBTOPICS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          <div className="border-t border-border" />

          <div>
            <label className="font-jakarta block text-sm font-semibold text-foreground mb-1">
              Difficulty
            </label>
            <p className="text-xs text-muted-foreground mb-3">
              How challenging should the questions be?
            </p>
            <DifficultyToggle value={difficulty} onChange={setDifficulty} />
          </div>

          <div className="border-t border-border" />

          <div>
            <label className="font-jakarta block text-sm font-semibold text-foreground mb-1">
              Question Types
            </label>
            <p className="text-xs text-muted-foreground mb-3">
              Pick one or more types, or let AI choose a varied mix for you.
            </p>
            <QuestionTypeChips
              selectedTypes={selectedTypes}
              autoTypes={autoTypes}
              onToggleType={toggleType}
              onToggleAuto={toggleAutoTypes}
            />
          </div>
        </div>

        <div className="px-7 pb-7">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!ready}
            className={`font-jakarta w-full flex items-center justify-center gap-3 font-semibold text-base py-4 rounded-xl transition-all duration-200 ${
              ready
                ? "bg-primary text-primary-foreground shadow-[0_4px_16px_rgba(79,70,229,0.22)] hover:bg-accent hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(79,70,229,0.28)] cursor-pointer"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
          >
            Generate Questions
            {ready && <ArrowRight className="w-5 h-5" />}
          </button>
          {!ready && (
            <p className="text-center text-xs text-muted-foreground mt-3">
              Fill in all fields above to continue.
            </p>
          )}
        </div>
      </motion.div>
    </main>
  );
}
