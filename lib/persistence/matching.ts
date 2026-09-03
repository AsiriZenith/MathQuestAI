import { QUESTION_TYPE_CODES, type GenerationContext, type PracticeConfig, type QuestionType } from "@/lib/types";
import { isQuestionType } from "@/lib/persistence/validation";

/**
 * Shared "current selection" resolution — the same auto-type/dedup rules
 * `mapGeneration` uses when persisting a generation, extracted so the
 * saved-results matcher (TASK-020) can never drift from what actually gets
 * saved.
 */
export function resolveSelectedTypeCodes(
  config: Pick<PracticeConfig, "selectedTypes" | "autoTypes">,
): QuestionType[] {
  if (config.autoTypes) return [...QUESTION_TYPE_CODES];

  const seen = new Set<QuestionType>();
  for (const raw of config.selectedTypes) {
    if (isQuestionType(raw)) seen.add(raw);
  }
  return [...seen];
}

export function resolveSelectedPatternIds(
  generationContext: Pick<GenerationContext, "patterns">,
): string[] {
  const ids: string[] = [];
  for (const pattern of generationContext.patterns) {
    if (!ids.includes(pattern.id)) ids.push(pattern.id);
  }
  return ids;
}

/** Order-independent exact set equality. */
export function isExactSetMatch(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const setB = new Set(b);
  return a.every((value) => setB.has(value));
}
