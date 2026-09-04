"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { QUESTION_TYPE_META } from "@/components/common/question-type-meta";
import { TypeBadge } from "@/components/common/type-badge";
import type { GeneratedQuestion } from "@/lib/prompts/types";

/** Practice durations offered before an attempt starts. */
const DURATION_OPTIONS = [
  { minutes: 1, label: "1 minute" },
  { minutes: 2, label: "2 minutes" },
  { minutes: 3, label: "3 minutes" },
  { minutes: 5, label: "5 minutes" },
] as const;

const DEFAULT_DURATION_MINUTES = 2;

const MIN_CUSTOM_MINUTES = 1;
const MAX_CUSTOM_MINUTES = 60;
const DURATION_VALIDATION_MESSAGE =
  "Enter a whole number between 1 and 60 minutes.";

/** Format a whole number of seconds as `mm:ss`, clamping negatives to `00:00`. */
export function formatTime(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Parse a raw custom-duration input into a whole number of minutes, or `null`
 * when it is empty, non-numeric, fractional, or outside 1–60 minutes.
 */
export function parseCustomMinutes(raw: string): number | null {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const minutes = Number(trimmed);
  if (minutes < MIN_CUSTOM_MINUTES || minutes > MAX_CUSTOM_MINUTES) return null;
  return minutes;
}

type Phase = "setup" | "running";

export function PracticeView({
  question,
  hasNext,
  onNext,
  onBackToQuestions,
}: {
  question: GeneratedQuestion;
  /** Whether a further generated question follows this one. */
  hasNext: boolean;
  /** Advance to the next generated question (only called when `hasNext`). */
  onNext: () => void;
  /** Leave the practice flow and return to the questions list. */
  onBackToQuestions: () => void;
}) {
  const meta = QUESTION_TYPE_META[question.questionType];

  const [phase, setPhase] = useState<Phase>("setup");
  // Exactly one duration source is active at a time: a selected preset
  // (`presetMinutes !== null`) or the custom input (`presetMinutes === null`).
  const [presetMinutes, setPresetMinutes] = useState<number | null>(
    DEFAULT_DURATION_MINUTES,
  );
  const [customMinutes, setCustomMinutes] = useState<string>("");
  const [durationError, setDurationError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number>(DEFAULT_DURATION_MINUTES * 60);
  const [answerShown, setAnswerShown] = useState(false);
  const [explanationShown, setExplanationShown] = useState(false);

  const activeMinutes =
    presetMinutes !== null ? presetMinutes : parseCustomMinutes(customMinutes);

  const selectPreset = (minutes: number) => {
    setPresetMinutes(minutes);
    setCustomMinutes("");
    setDurationError(null);
  };

  const changeCustom = (value: string) => {
    setCustomMinutes(value);
    setPresetMinutes(null);
    setDurationError(null);
  };

  useEffect(() => {
    if (phase !== "running") return;
    const id = setInterval(() => {
      // The timer is only a practice aid: stop at 00:00 and do nothing else —
      // no submit, navigation, answer reveal, or scoring.
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(id);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  const handleStart = () => {
    if (activeMinutes === null) {
      setDurationError(DURATION_VALIDATION_MESSAGE);
      return;
    }
    setRemaining(activeMinutes * 60);
    setPhase("running");
  };

  const started = phase === "running";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <h1 className="font-jakarta text-2xl font-extrabold tracking-tight text-foreground">
          Question {question.questionNumber}
        </h1>
        <TypeBadge meta={meta} size="sm" />
      </div>

      {started && (
        <div className="flex flex-col items-center py-8 mb-2">
          <span
            role="timer"
            aria-live="off"
            className="font-jakarta text-6xl font-extrabold tabular-nums tracking-tight text-foreground"
          >
            {formatTime(remaining)}
          </span>
          <span className="mt-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Time Remaining
          </span>
        </div>
      )}

      <section className="bg-card border border-border rounded-2xl p-7 shadow-sm">
        <p className="font-jakarta text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
          Solve
        </p>
        <p className="whitespace-pre-line text-lg font-medium text-foreground leading-relaxed">
          {question.questionText}
        </p>

        {question.options && question.options.length > 0 && (
          <ol className="mt-5 space-y-2.5">
            {question.options.map((opt) => (
              <li key={opt.id} className="flex gap-2 text-[0.98rem] text-foreground/85">
                <span className="font-semibold text-foreground">{opt.id}.</span>
                <span>{opt.text}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      {phase === "setup" && (
        <div className="mt-6">
          <p className="font-jakarta text-sm font-semibold text-foreground mb-2.5">
            Practice time
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {DURATION_OPTIONS.map((opt) => {
              const active = presetMinutes === opt.minutes;
              return (
                <button
                  key={opt.minutes}
                  type="button"
                  aria-pressed={active}
                  onClick={() => selectPreset(opt.minutes)}
                  className={`font-jakarta text-sm font-semibold px-4 py-2 rounded-xl border-2 transition-colors duration-150 ${
                    active
                      ? "bg-primary/10 border-primary text-foreground"
                      : "bg-background border-border text-muted-foreground hover:border-primary/35"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 mb-1.5">
            <label
              htmlFor="custom-practice-minutes"
              className="font-jakarta text-sm font-semibold text-foreground"
            >
              Custom time
            </label>
            <input
              id="custom-practice-minutes"
              type="number"
              inputMode="numeric"
              min={MIN_CUSTOM_MINUTES}
              max={MAX_CUSTOM_MINUTES}
              step={1}
              value={customMinutes}
              onChange={(e) => changeCustom(e.target.value)}
              aria-invalid={durationError !== null}
              aria-describedby={durationError ? "custom-practice-error" : undefined}
              className={`font-jakarta w-20 text-sm font-semibold px-3 py-2 rounded-xl border-2 bg-background text-foreground transition-colors duration-150 focus:outline-none focus:border-primary ${
                presetMinutes === null && customMinutes !== ""
                  ? "border-primary"
                  : "border-border"
              }`}
            />
            <span className="text-sm text-muted-foreground">minutes</span>
          </div>

          <p className="text-xs text-muted-foreground mb-2" aria-live="polite">
            {activeMinutes !== null
              ? `Starting a ${activeMinutes}-minute countdown (${
                  presetMinutes !== null ? "preset" : "custom"
                }).`
              : "Choose a preset or enter a custom time to start."}
          </p>

          {durationError && (
            <p
              id="custom-practice-error"
              role="alert"
              className="text-xs font-medium text-destructive mb-3"
            >
              {durationError}
            </p>
          )}

          <button
            type="button"
            onClick={handleStart}
            className="font-jakarta mt-2 w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold text-base py-4 rounded-xl shadow-sm hover:bg-accent transition-colors duration-200"
          >
            Start
          </button>
        </div>
      )}

      {started && (
        <div className="mt-6 space-y-4">
          {!answerShown ? (
            <button
              type="button"
              onClick={() => setAnswerShown(true)}
              className="font-jakarta w-full flex items-center justify-center gap-2 bg-background border border-border text-foreground font-semibold text-sm py-3 rounded-xl shadow-sm hover:border-primary/40 hover:bg-secondary/60 transition-colors duration-150"
            >
              View Answer
            </button>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <p className="font-jakarta text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Correct Answer
              </p>
              <p className="text-[0.98rem] font-semibold text-foreground whitespace-pre-line">
                {question.correctAnswer}
              </p>

              {!explanationShown ? (
                <button
                  type="button"
                  onClick={() => setExplanationShown(true)}
                  className="font-jakarta mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-accent transition-colors duration-150"
                >
                  Show Explanation
                </button>
              ) : (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="font-jakarta text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Explanation
                  </p>
                  <p className="whitespace-pre-line text-[0.95rem] text-foreground/85 leading-relaxed">
                    {question.explanation}
                  </p>
                </div>
              )}
            </div>
          )}

          {explanationShown &&
            (hasNext ? (
              <button
                type="button"
                onClick={onNext}
                className="font-jakarta w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold text-base py-4 rounded-xl shadow-sm hover:bg-accent transition-colors duration-200"
              >
                Next Question
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onBackToQuestions}
                className="font-jakarta w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold text-base py-4 rounded-xl shadow-sm hover:bg-accent transition-colors duration-200"
              >
                Back to Questions
              </button>
            ))}
        </div>
      )}
    </motion.div>
  );
}
