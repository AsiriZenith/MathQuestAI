# Lesson 9 — Evaluation System (scoring engine + UI)

Goal of this lesson: read the deterministic scoring engine that closes the research loop from Lesson 1, and the UI that renders its output. This is the biggest lesson so far because the engine genuinely has more moving parts than anything before it — six independent dimension scorers, three supporting modules, an orchestrator, and eleven UI components. The organizing idea that makes all of it hang together: **every score is computed from the generated output by explainable code, with no AI judge involved**, so re-running an evaluation on the same input always produces the same result. The engine's own doc comment states the point of that directly: *"when the researcher changes the prompt and the score moves, the prompt caused it."*

---

## 1. The shape of one evaluation — `lib/evaluation/types.ts`

Before the engine, the vocabulary. Every dimension scorer returns a `DimensionScore`:

```ts
interface DimensionScore {
  id: DimensionId;           // e.g. "pattern_adherence"
  label: string;
  score: number | null;      // null = not applicable to this run
  weight: number;             // how much this dimension counts toward the overall score
  status: AdherenceStatus;    // "met" | "partial" | "not_met" | "not_applicable"
  confidence: Confidence;     // "high" | "medium" — is this an exact count or a structural proxy?
  promptSection: PromptSectionId; // which of buildPrompt's 7 sections this dimension is accountable for
  method: string;
  summary: string;
}
```

Two fields are worth internalizing before anything else: `score: number | null` — a dimension can be genuinely inapplicable to a given run (you'll see two concrete cases below), and `confidence` — the engine is honest in its own data model about which measurements are exact and which are heuristic proxies for something it can't measure directly. `PromptSectionId` is literally the seven section names from `buildPrompt` (Lesson 6): `common_instructions`, `generation_requirement`, `educational_context`, `difficulty`, `question_type`, `reference_questions`, `output_format`. Every dimension is pre-assigned to the prompt section it's accountable for — that link is what makes the "Prompt Inspector" UI (section 5) possible at all.

`EvaluationResult` is the final bundle: `promptEffectiveness` (0-100), `band` (`"strong" | "moderate" | "weak"`), `explanation`, the six `dimensions`, a `configuration` summary, per-dimension supporting detail (`patternCoverage`, `typeCoverage`, `difficulty` signals, `integrityChecks`, `referenceAlignment`), a `promptTrace` (prompt sections + their verdicts), `deviations` (a flat, sortable list of specific per-question issues), `strengths`, `improvements`, and `evaluatedAt`.

---

## 2. The six dimension scorers

Each dimension lives in its own file under `lib/evaluation/dimensions/`, is accountable for exactly one prompt section, and carries its own fixed `weight`:

| Dimension | Prompt section | Weight | `score: null` when... |
|---|---|---|---|
| `pattern_adherence` | Educational Context | 25 | the prompt predates pattern labelling (see below) |
| `type_adherence` | Question Type | 20 | never |
| `difficulty_alignment` | Difficulty | 20 | never |
| `output_integrity` | Output Format | 15 | never |
| `count_adherence` | Generation Requirement | 10 | never |
| `reference_alignment` | Reference Questions | 10 | no reference questions exist for this pattern/difficulty |

**`count-adherence.ts`** exists for a specific, narrow reason its own comment states: the zod schema from Lesson 6 only requires `min(1)` question, so a response with 3 questions when 10 were requested still *validates* — nothing else in the pipeline would ever notice. Score is `Math.max(0, 1 - drift / requestedCount)`, a smooth penalty rather than pass/fail.

**`difficulty-proxy.ts`** is the dimension with the most humility built into it. It can't know a question's true cognitive difficulty, so it classifies each question into easy/medium/hard using two structural heuristics from `text-metrics.ts` — reasoning steps counted from the explanation text, and operator count from the question text:

```ts
if (steps >= 4 || operators >= 6) return "hard";
if (steps >= 2 || operators >= 3) return "medium";
return "easy";
```

This is the code-level face of `ai-generation.md` §26-27's "Difficulty Evaluation Problem" — the docs admit there's no precise, reliable way to measure requested difficulty, so this dimension is marked `confidence: "medium"` (a proxy, not an exact count) and gives **partial credit for adjacent misses**: a question classified one band away from what was requested scores 0.5, not 0, because — per the code's own comment — "the proxy is not precise enough to treat a near miss as a full failure."

**`pattern-adherence.ts`** carries the heaviest weight (25) and is the one dimension that can go fully `not_applicable`:

```ts
const promptRequestsLabels = promptRequestsPatternLabels(prompt); // prompt.includes("questionPattern")
if (!promptRequestsLabels) return { score: null, status: "not_applicable", ... };
```

Recall from Lesson 6 that `GeneratedQuestion.questionPattern` is optional precisely because a missing label shouldn't fail a generation — this dimension is where that deferred judgment actually gets made. It only scores at all if the prompt (the exact string Lesson 8 threads through from `buildPrompt` to `evaluateGeneration`) actually asked for pattern labels in the first place; a prompt from before that instruction existed correctly reports "not applicable" rather than a misleading zero. When it does score, it's `labelledRatio * inScopeRatio` — and it doesn't penalize a skewed pattern distribution, because `buildEducationalContextSection` (Lesson 6) explicitly tells the AI "not every question needs to use every pattern."

**`reference-alignment.ts`** pulls its comparison data straight from the database-sourced `GenerationContext.patterns[].referenceQuestions` (Lesson 4). Its score combines two opposing checks: a 5-gram containment overlap (`ngramOverlap`, from `text-metrics.ts`) to catch the AI copying a reference question nearly verbatim, and a complexity-drift comparison to catch the opposite failure — ignoring the reference questions' shape entirely. `score = originality * 0.6 + characteristicMatch * 0.4` — deliberately rewarding neither pure originality nor pure mimicry, which is the direct implementation of `ai-generation.md` §39's "examples, not templates" constraint you already met at prompt-build time in Lesson 6, now checked on the way *out*.

**`type-adherence.ts`** has two scoring modes depending on what was actually requested: if the user chose "auto" (let the AI mix types), the score is a variety ratio; otherwise it's the fraction of questions using an allowed type. Like pattern adherence, a *missing* requested type is reported in `coverage.missing` for the UI but not penalized — same "not every X needs to appear in every question" principle, applied to types this time.

**`output-integrity.ts`** deliberately checks things the zod schema in Lesson 6 does *not* — sequential numbering, unique option ids, the A/B/C/D convention, substantive (≥15 character) explanations. Its own comment explains why: re-checking what zod already guarantees "would score 100% every time and tell the researcher nothing." Its checks are split into `severity: "requirement"` (schema-adjacent musts) vs. `"convention"` (stylistic expectations) — only a requirement failure can push the dimension's `status` to `"not_met"`.

Notice the shared design principle across all six: **something the prompt explicitly permits (skewed patterns, missing types, adjacent difficulty misses) is never scored as a failure.** The engine only measures adherence to what was actually asked, which is exactly what makes it useful for the research loop — a low score is evidence the *prompt's own stated intent* didn't come through, not evidence of an arbitrary quality bar.

---

## 3. Supporting modules

**`text-metrics.ts`** is the one place doing anything like NLP, and it says so plainly in its own header comment: these are "structural proxies, not semantic understanding." `countOperators`, `countReasoningSteps`, and `complexityScore` are all regex/tokenization heuristics — no external library, nothing probabilistic. `difficulty-proxy.ts` and `reference-alignment.ts` are its only two consumers.

**`prompt-sections.ts`** is the bridge between the raw prompt *string* (what `buildPrompt` actually returns, Lesson 6) and the *structured* sections the UI wants to show. `PROMPT_SECTIONS` is the single source of truth mapping each of the 7 section headings to the `DimensionId[]` accountable for it. `splitPromptSections(prompt)` locates each heading by `indexOf` and slices the body up to the next recognized heading — and if a heading is missing or the prompt format ever changes, it degrades to an empty body rather than throwing. `promptRequestsPatternLabels(prompt)` is the one-line gate you already met in `pattern-adherence.ts` above: `prompt.includes("questionPattern")`.

**`improvements.ts`** turns dimension scores into text a researcher can act on immediately — and it's explicit in its own comment that this is "deliberately rule-based rather than AI-generated." When a signal crosses a threshold (count drift, an out-of-scope pattern, a missing type, a difficulty mismatch, copied reference text, a failed integrity check), `deriveImprovements` doesn't just flag it — it names the exact file to edit and drafts the literal replacement text:

```
targetFile: "lib/prompts/builder.ts › GENERATION REQUIREMENT section"
suggestedChange: "Return exactly 10 questions. A response containing any
                   other number of questions is invalid and must not be returned."
```

This is the research loop from Lesson 1 (`Generate → Evaluate → Identify Problems → Improve Prompt`) made concrete: the "Improve Prompt" step is handed to the researcher pre-drafted, pointing at the exact function in `lib/prompts/builder.ts` (Lesson 6) that would need to change. `deriveStrengths` is the mirror image — any dimension scoring ≥ 0.9 becomes a positive, canned-wording confirmation (e.g. *"Reference questions informed the output without being copied — exactly the intended balance."*) rather than staying silent about what already worked.

**`export.ts`** produces exactly one format: Markdown, via `toEvaluationMarkdown`. It's explicitly pure and dependency-free — the comment notes this lets it "run on the client for a direct download without a round trip," i.e. no Server Action needed to export a result, since everything it needs is already sitting in `EvaluationResult` on the client. The output is a full research write-up: score/band/explanation, a configuration summary, a per-dimension table, strengths, improvement suggestions with fenced code blocks ready to paste into `builder.ts`, a deviations table, and a timestamp footer.

---

## 4. `evaluateGeneration` — the orchestrator

```ts
export function evaluateGeneration(input: {
  config: PracticeConfig;
  generationContext: GenerationContext;
  generationResponse: GenerationResponse;
  prompt: string;
  requestedQuestionCount: number;
}): EvaluationResult {
  const count = evaluateCountAdherence(generationResponse, requestedQuestionCount);
  const { checks, ...integrity } = evaluateOutputIntegrity(generationResponse);
  const type = evaluateTypeAdherence(generationResponse, requestedTypes);
  const pattern = evaluatePatternAdherence(generationResponse, requestedPatterns, promptRequestsPatternLabels(prompt));
  const difficulty = evaluateDifficultyAlignment(generationResponse, generationContext.difficulty);
  const reference = evaluateReferenceAlignment(generationResponse, generationContext);

  const dimensions: DimensionScore[] = [pattern.dimension, type.dimension, difficulty.dimension, integrity, count, reference.dimension];

  const applicable = dimensions.filter((d) => d.score !== null);
  const totalWeight = applicable.reduce((sum, d) => sum + d.weight, 0);
  const weighted = totalWeight > 0
    ? applicable.reduce((sum, d) => sum + (d.score as number) * d.weight, 0) / totalWeight
    : 0;
  const promptEffectiveness = Math.round(weighted * 100);
  // ...
}
```

This function calls all six dimensions, then computes the overall score with weights **renormalized over only the applicable dimensions** — the comment states why directly: *"a dimension that cannot be measured for this run neither helps nor hurts the score."* Concretely: if `pattern_adherence` (weight 25) is `not_applicable` for a given run, the overall score is computed from the remaining 75 points of weight, not out of 100 with a silent zero dragging the score down for something the run was never asking to be measured on.

The function then builds `promptTrace` — one entry per prompt section, rolling up whichever dimensions are accountable for it via `traceStatus`. A section backed by exactly one dimension inherits that dimension's status verbatim (so the Prompt Inspector and a dimension breakdown view can never disagree about the same score); a section backed by multiple dimensions gets an averaged verdict. Everything else — `deviations` (flattened and sorted by question number from all four dimensions that produce them), `improvements`, `strengths` — is assembled from the same six dimension results, and the whole thing is stamped with `evaluatedAt: new Date().toISOString()`.

---

## 5. `prepare-evaluation.ts` — the boundary this all sits behind

`prepareEvaluation` — the function `prepareEvaluationAction` (Lesson 8) delegates to — is a thin validating wrapper, not a passthrough:

```ts
export async function prepareEvaluation(input: {...}): Promise<EvaluationPrepResult> {
  if (input.generationResponse.questions.length === 0) {
    return { ok: false, error: "No generated questions available to evaluate." };
  }
  if (input.prompt.trim().length === 0) {
    return { ok: false, error: "The prompt used for this generation is unavailable. Generate a new set to evaluate it." };
  }
  try {
    const result = evaluateGeneration(input);
    return { ok: true, data: { ...input, result } };
  } catch {
    return { ok: false, error: "Unable to evaluate this generation." };
  }
}
```

Two guards before scoring even starts (an empty question list, an empty prompt — both would make several dimensions meaningless to compute), a `try/catch` around the deterministic-but-still-fallible scoring call, and on success the *entire original input* is spread alongside the computed `result` into the `EvaluationData` shape you met back in Lesson 5. That's a deliberate choice: the Evaluation page needs both "what was asked" (`config`, `generationContext`, `prompt`) and "what was scored" (`result`) side by side, and this is where those two get bundled into one object.

---

## 6. The UI — `app/evaluation/_components/*`

Eleven components, each reading one slice of `EvaluationResult`:

| Component | Reads | Renders |
|---|---|---|
| `prompt-effectiveness-hero.tsx` | `promptEffectiveness`, `band`, `explanation` | the headline score |
| `requirement-matrix.tsx` | `configuration`, `dimensions` | requested-vs-scored matrix |
| `score-breakdown.tsx` | `dimensions` | expandable per-dimension detail |
| `asked-vs-received.tsx` | `configuration`, coverage reports | side-by-side comparison |
| `coverage-card.tsx` | `patternCoverage` / `typeCoverage` | missing/unexpected pattern or type buckets |
| `difficulty-assessment.tsx` | `difficulty` (signals) | the difficulty-proxy breakdown from section 2 |
| `integrity-and-reference.tsx` | `integrityChecks`, `referenceAlignment` | combined pass/fail + originality panel |
| `deviation-table.tsx` | `deviations` | one row per specific per-question issue |
| `prompt-inspector.tsx` | `promptTrace` | the prompt, section by section, each with its rolled-up verdict |
| `improvements-list.tsx` | `improvements`, `strengths` | copy-to-clipboard suggested prompt edits |
| `export-actions.tsx` | the whole `result` | the Markdown download + "regenerate" button |

Every one of these is a pure presentational component reading props derived from `evaluationData.result` (Lesson 5 — `app/evaluation/page.tsx` reads only `evaluationData` from context and fans its `.result` field out to all eleven). None of them re-score anything or call a Server Action — by the time this page renders, all the work described in sections 2-5 has already happened, once, inside `prepareEvaluationAction`.

---

**Explicitly out of scope for this lesson** (deferred, not forgotten):

- How the deterministic tests for these dimension scorers avoid needing a live AI call → Lesson 10
- The specific historical decisions behind why pattern labelling / evaluation criteria evolved the way they did → Lesson 11

---

## Checkpoint

Answer these in your own words before moving to Lesson 10. No answer key — if any of these feel shaky, re-read the relevant section above.

1. Why does `evaluateGeneration` renormalize dimension weights over only the *applicable* dimensions, instead of always dividing by a fixed total of 100?
2. Name the two conditions under which a dimension's `score` is `null`, and which two specific dimensions can produce each one.
3. `difficulty-proxy.ts` gives partial credit for a one-band miss instead of scoring it as a full failure. Why, according to the code's own reasoning?
4. What's the difference between what `output-integrity.ts` checks and what the zod schema in `lib/prompts/schema.ts` (Lesson 6) already checks — and why does the dimension exist at all if the schema already validates the response?
5. `deriveImprovements` doesn't just say "difficulty was off" — what does it actually produce, and which lesson's file does its output point a researcher back toward editing?
