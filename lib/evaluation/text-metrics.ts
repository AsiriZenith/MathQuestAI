/**
 * Deterministic text measurements shared by the evaluation dimensions.
 *
 * These are structural proxies, not semantic understanding. They are used only
 * where the evaluation explicitly reports "medium" confidence, and the raw
 * numbers are always surfaced in the UI so a researcher can judge the judgement.
 */

const OPERATOR_PATTERN = /[+\-*/×÷=<>^]|(?<![a-zA-Z])x(?![a-zA-Z])/g;
const VARIABLE_PATTERN = /(?<![a-zA-Z])[a-z](?![a-zA-Z])/g;

/** Lowercased alphanumeric word tokens. */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 0);
}

export function ngrams(tokens: string[], size: number): string[] {
  if (tokens.length < size) return tokens.length > 0 ? [tokens.join(" ")] : [];
  const result: string[] = [];
  for (let i = 0; i <= tokens.length - size; i += 1) {
    result.push(tokens.slice(i, i + size).join(" "));
  }
  return result;
}

/**
 * Containment overlap: what fraction of the candidate's n-grams also appear in
 * the reference. Containment (rather than Jaccard) is the right measure here
 * because a short near-copy embedded in a longer question is still a copy.
 */
export function ngramOverlap(candidate: string, reference: string, size = 5): number {
  const candidateGrams = ngrams(tokenize(candidate), size);
  if (candidateGrams.length === 0) return 0;
  const referenceGrams = new Set(ngrams(tokenize(reference), size));
  if (referenceGrams.size === 0) return 0;

  const shared = candidateGrams.filter((gram) => referenceGrams.has(gram)).length;
  return shared / candidateGrams.length;
}

/** Count of mathematical operators and standalone `x` symbols in the text. */
export function countOperators(text: string): number {
  return text.match(OPERATOR_PATTERN)?.length ?? 0;
}

/** Count of distinct single-letter algebraic variables. */
export function countDistinctVariables(text: string): number {
  const matches = text.match(VARIABLE_PATTERN) ?? [];
  return new Set(matches).size;
}

/**
 * Approximate the number of reasoning steps a worked solution describes, by
 * counting the sentence-like segments and enumerated markers in its explanation.
 */
export function countReasoningSteps(explanation: string): number {
  const trimmed = explanation.trim();
  if (trimmed.length === 0) return 0;

  const enumerated = trimmed.match(/(?:^|\s)(?:step\s*\d|\d[.)])/gi)?.length ?? 0;
  if (enumerated >= 2) return enumerated;

  const segments = trimmed
    .split(/[.;\n]+|\bthen\b|\bnext\b|\bfinally\b/i)
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 2);

  return Math.max(1, segments.length);
}

/**
 * Composite structural complexity of a single question. Deliberately simple and
 * inspectable: reasoning steps dominate, with operator and variable counts as
 * secondary signals.
 */
export function complexityScore(questionText: string, explanation: string): number {
  const steps = countReasoningSteps(explanation);
  const operators = countOperators(questionText);
  const variables = countDistinctVariables(questionText);

  return steps * 1.5 + operators * 0.5 + variables * 0.25;
}
