"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronDown } from "lucide-react";
import { motion } from "motion/react";
import { canGenerate } from "@/lib/mock-data";
import { loadGenerationContextAction, loadQuestionPatternsAction } from "@/lib/actions/setup";
import { usePracticeSession } from "@/components/providers/practice-session-provider";
import { FixedField } from "@/app/_components/fixed-field";
import { DifficultyToggle } from "@/app/_components/difficulty-toggle";
import { QuestionTypeChips } from "@/app/_components/question-type-chips";
import { QuestionPatternChips } from "@/app/_components/question-pattern-chips";
import type {
  Difficulty,
  QuestionPatternsResult,
  SubjectRecord,
  SubtopicRecord,
  TopicRecord,
} from "@/lib/types";

export function SetupForm({
  subject,
  topic,
  subtopics,
}: {
  subject: SubjectRecord;
  topic: TopicRecord;
  subtopics: SubtopicRecord[];
}) {
  const router = useRouter();
  const { setConfig, setGenerationContext } = usePracticeSession();

  const [grade] = useState("Grade 6");
  const [subtopicId, setSubtopicId] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty | "">("");
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [autoTypes, setAutoTypes] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [selectedPatternIds, setSelectedPatternIds] = useState<Set<string>>(new Set());
  const [autoPatterns, setAutoPatterns] = useState(false);
  const [patternsResultBySubtopic, setPatternsResultBySubtopic] = useState<{
    subtopicId: string;
    result: QuestionPatternsResult;
  } | null>(null);

  const [selectionSubtopicId, setSelectionSubtopicId] = useState(subtopicId);
  if (subtopicId !== selectionSubtopicId) {
    setSelectionSubtopicId(subtopicId);
    setSelectedPatternIds(new Set());
    setAutoPatterns(false);
  }

  useEffect(() => {
    if (!subtopicId) return;
    let cancelled = false;

    loadQuestionPatternsAction(subtopicId).then((result) => {
      if (!cancelled) setPatternsResultBySubtopic({ subtopicId, result });
    });

    return () => {
      cancelled = true;
    };
  }, [subtopicId]);

  const currentPatternsResult =
    patternsResultBySubtopic?.subtopicId === subtopicId ? patternsResultBySubtopic.result : null;
  const patterns = currentPatternsResult?.ok ? currentPatternsResult.patterns : null;
  const patternsError =
    currentPatternsResult && !currentPatternsResult.ok ? currentPatternsResult.error : null;
  const patternsLoading = subtopicId !== "" && currentPatternsResult === null;

  const togglePattern = (id: string) => {
    if (autoPatterns) setAutoPatterns(false);
    setSelectedPatternIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAutoPatterns = () => {
    if (!autoPatterns) {
      setSelectedPatternIds(new Set());
      setAutoPatterns(true);
    } else {
      setAutoPatterns(false);
    }
  };

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
    subtopic: subtopicId,
    difficulty,
    selectedTypesSize: selectedTypes.size,
    autoTypes,
    selectedPatternsSize: selectedPatternIds.size,
    autoPatterns,
  });

  const handleGenerate = async () => {
    if (!ready || isLoading) return;
    const selectedSubtopic = subtopics.find((s) => s.id === subtopicId);
    if (!selectedSubtopic || !patterns) return;

    const patternIds = autoPatterns ? patterns.map((p) => p.id) : Array.from(selectedPatternIds);

    setError(null);
    setIsLoading(true);

    const result = await loadGenerationContextAction({
      subjectName: subject.name,
      subtopicId: selectedSubtopic.id,
      subtopicName: selectedSubtopic.name,
      difficulty: difficulty as Difficulty,
      patternIds,
    });

    setIsLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setGenerationContext(result.context);
    setConfig({
      grade,
      subtopic: selectedSubtopic.name,
      subtopicId: selectedSubtopic.id,
      difficulty: difficulty as Difficulty,
      selectedTypes: Array.from(selectedTypes),
      autoTypes,
      selectedPatternIds: patternIds,
      autoPatterns,
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
            <FixedField label="Subject" value={subject.name} />
            <FixedField label="Topic" value={topic.name} />
          </div>

          <div>
            <label className="font-jakarta block text-sm font-semibold text-foreground mb-2">
              Subtopic
            </label>
            <div className="relative">
              <select
                value={subtopicId}
                onChange={(e) => setSubtopicId(e.target.value)}
                aria-label="Subtopic"
                className="w-full appearance-none bg-background border border-border rounded-xl px-4 py-3 text-[0.95rem] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/60 transition-colors pr-10 cursor-pointer"
              >
                <option value="">Select a subtopic…</option>
                {subtopics.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          <div className="border-t border-border" />

          <div>
            <label className="font-jakarta block text-sm font-semibold text-foreground mb-1">
              Question Patterns
            </label>
            <p className="text-xs text-muted-foreground mb-3">
              Which types of tasks within this subtopic should be included?
            </p>
            {!subtopicId && (
              <p className="text-sm text-muted-foreground">
                Select a subtopic to see the available question patterns.
              </p>
            )}
            {subtopicId && patternsLoading && (
              <p className="text-sm text-muted-foreground">Loading question patterns…</p>
            )}
            {subtopicId && !patternsLoading && patternsError && (
              <p className="text-sm text-destructive" role="alert">
                {patternsError}
              </p>
            )}
            {subtopicId && !patternsLoading && !patternsError && patterns?.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No question patterns are available for this subtopic.
              </p>
            )}
            {subtopicId && !patternsLoading && !patternsError && patterns && patterns.length > 0 && (
              <QuestionPatternChips
                patterns={patterns}
                selectedPatternIds={selectedPatternIds}
                autoPatterns={autoPatterns}
                onTogglePattern={togglePattern}
                onToggleAuto={toggleAutoPatterns}
              />
            )}
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
            disabled={!ready || isLoading}
            className={`font-jakarta w-full flex items-center justify-center gap-3 font-semibold text-base py-4 rounded-xl transition-all duration-200 ${
              ready && !isLoading
                ? "bg-primary text-primary-foreground shadow-[0_4px_16px_rgba(79,70,229,0.22)] hover:bg-accent hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(79,70,229,0.28)] cursor-pointer"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
          >
            {isLoading ? "Loading…" : "Generate Questions"}
            {ready && !isLoading && <ArrowRight className="w-5 h-5" />}
          </button>
          {!ready && !error && (
            <p className="text-center text-xs text-muted-foreground mt-3">
              Fill in all fields above to continue.
            </p>
          )}
          {error && (
            <p className="text-center text-xs text-destructive mt-3" role="alert">
              {error}
            </p>
          )}
        </div>
      </motion.div>
    </main>
  );
}
