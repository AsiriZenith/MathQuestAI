# Lesson 6 — Prompt Construction System

Goal of this lesson: read the code `docs/project-management/ai-generation.md` itself calls the project's core research area — the four files under `lib/prompts/` that turn a `GenerationContext` (Lesson 4's output) into a prompt string, and turn an AI's raw text response back into a validated object. This lesson covers exactly two conversions: request → prompt string, and response string → validated data. What calls these functions and in what order is Lesson 8; how the AI is actually reached over HTTP is Lesson 7.

`ai-generation.md` §17 states the boundary this lesson lives inside directly: *"The Prompt Builder should not directly query the database... this makes the Prompt Builder easier to unit test."* Everything in this lesson is deliberately pure — no `await`, no I/O, no database import anywhere in `lib/prompts/`.

---

## 1. The types — `lib/prompts/types.ts`

```ts
export type AiQuestionType =
  | "multiple_choice" | "fill_in_the_blank" | "word_problem" | "true_false" | "multi_step";

export interface PromptRequest {
  context: GenerationContext;
  questionTypes: AiQuestionType[] | "auto";
  questionCount: number;
}
```

`PromptRequest` is `buildPrompt`'s single input shape — one `GenerationContext` (Lesson 4's `getGenerationContext` output), the question type selection, and a count. `AiQuestionType` is the AI-facing vocabulary for question types — five specific strings, distinct from whatever shorthand ids the UI uses internally (you'll meet the translation between the two in the next section).

The most interesting line in this file is one field, on the response side:

```ts
export interface GeneratedQuestion {
  questionNumber: number;
  questionText: string;
  questionType: AiQuestionType;
  /**
   * The Question Pattern this question implements, as declared by the AI.
   * Optional: a missing label must never fail an otherwise-valid generation —
   * absence is instead measured as an instruction-adherence finding by the
   * evaluation pipeline (lib/evaluation/dimensions/pattern-adherence.ts).
   */
  questionPattern?: string;
  options?: GeneratedQuestionOption[];
  correctAnswer: string;
  explanation: string;
}
```

`questionPattern` is optional by design, and the comment says exactly why: whether the AI *labeled* its question with the right pattern name is a question of prompt compliance, not structural validity. `ai-generation.md` §24 draws this distinction explicitly — *"a question can follow the requested Question Pattern but still contain a mathematical error"* — and the same logic runs the other way here: a question can be perfectly well-formed JSON and still fail to name its pattern. That failure belongs to the Evaluation page (Lesson 9), not to this file. If `questionPattern` were required here, one missing label would throw away an otherwise good question; instead it's tolerated at this layer and scored later.

`ParsedGenerationResponse` closes the file with the same convention you've seen since Lesson 4:

```ts
export type ParsedGenerationResponse =
  | { ok: true; data: GenerationResponse }
  | { ok: false; error: string };
```

Same `{ ok, ... } | { ok: false; error }` shape as `QuestionPatternsResult` and `GenerationContextResult` — here applied at a new kind of boundary: not a database call, but an external AI response.

---

## 2. The static prompt content — `lib/prompts/common.ts`

Four exports, each answering a different "why does this exist as code, not data" question.

### `COMMON_INSTRUCTIONS` — instructions that don't belong to any one row

```ts
export const COMMON_INSTRUCTIONS = `You are generating mathematics practice questions for a research prototype.
Generate exactly the requested number of questions.
Every question must be based on the educational context and reference questions provided below.
Follow the requested difficulty and question type(s).
Do not include any commentary, explanation, or text outside the required JSON output format.`;
```

Recall from Lesson 3 that `QuestionGenerationRequest.generationPrompt` is a database row scoped to one `(questionPatternId, difficultyLevel)` pair. `COMMON_INSTRUCTIONS` is the opposite kind of instruction — it applies to *every* generation request regardless of pattern or difficulty — and `ai-generation.md` §7 is explicit that this is exactly why it isn't a database column: instructions specific to one Pattern+Difficulty combination belong in `QuestionGenerationRequests`; instructions that apply universally belong in this constant. Same principle you met in Lesson 3 §1 about `questionCount` never becoming a column — it's restated here as executable code rather than a schema decision.

### `DIFFICULTY_GUIDANCE` — one benchmark, now living where the AI can read it

```ts
export const DIFFICULTY_GUIDANCE: Record<Difficulty, string> = {
  easy: "Direct application of the Question Pattern. Usually requires one main step and a familiar structure.",
  medium: "Still directly related to the Question Pattern, but requires additional processing or approximately 2-3 connected steps.",
  hard: "Requires multiple connected steps, a more complex arrangement, or a combination of a few related complexity factors.",
};
```

Compare this word-for-word against `CLAUDE.md` §10 and `database.md` §9 — it's the identical three-tier definition you first read in Lesson 1. The benchmark is stated in three places in this project (the project instructions, the database docs, and here), and this is the one place it becomes a typed `Record<Difficulty, string>` — keyed by the same `Difficulty` type from `lib/types.ts` you met in Lesson 3/4 — so a difficulty-guidance lookup is a compiler-checked, exhaustive `Record` access rather than a string comparison that could silently miss a case.

### `QUESTION_TYPE_ID_MAP` — the UI-to-AI vocabulary translation

```ts
export const QUESTION_TYPE_ID_MAP: Record<string, { id: AiQuestionType; label: string }> = {
  mc: { id: "multiple_choice", label: "Multiple Choice" },
  fib: { id: "fill_in_the_blank", label: "Fill in the Blank" },
  wp: { id: "word_problem", label: "Word Problem" },
  tf: { id: "true_false", label: "True / False" },
  ms: { id: "multi_step", label: "Multi-step Problem" },
};
```

The Setup screen's chip UI (Lesson 5) works in short ids — `mc`, `fib`, `wp`, `tf`, `ms` (this is `RequestedTypeId` from `lib/types.ts`). The AI prompt needs the full `AiQuestionType` strings. This map is the one place that translation happens, in both directions: `questionTypeLabel(id)` looks a label up by AI id (used when rendering the prompt's Question Type section), and the reverse mapping is what the Setup form uses to convert its chip selections before calling `loadGenerationContextAction`. Keeping this translation in one small table means the UI's shorthand and the AI's vocabulary can evolve independently without every call site needing to know both.

### `OUTPUT_FORMAT_INSTRUCTIONS` — the JSON contract, as prompt text

```ts
export const OUTPUT_FORMAT_INSTRUCTIONS = `Return ONLY valid JSON using this exact structure. Do not wrap it in Markdown code fences. Do not add any text before or after the JSON.

{
  "questions": [
    {
      "questionNumber": 1,
      "questionText": "...",
      "questionType": "multiple_choice",
      "questionPattern": "...",
      "options": [ { "id": "A", "text": "..." }, ... ],
      "correctAnswer": "A",
      "explanation": "..."
    }
  ]
}
...`;
```

`ai-generation.md` §22 left this genuinely open at design time: *"The exact schema will be finalized when the generation API is implemented... do not rely on free-form text if structured output is available from the selected AI provider."* What was actually built (recorded in §44) settled on **prompt-embedded JSON instructions**, checked after the fact by `schema.ts` (next section) — not a provider-side structured-output/tool-call feature. This is a real, documented design choice worth noticing: the contract is enforced by validation on the way back in, not by a guarantee from the AI provider on the way out.

---

## 3. `buildPrompt` — assembling the seven sections

```ts
export function buildPrompt(request: PromptRequest): string {
  const sections = [
    `COMMON INSTRUCTIONS\n-------------------\n${COMMON_INSTRUCTIONS}`,
    `GENERATION REQUIREMENT\n----------------------\nGenerate ${request.questionCount} questions.`,
    buildEducationalContextSection(request),
    buildDifficultySection(request),
    buildQuestionTypeSection(request),
    buildReferenceQuestionsSection(request),
    `OUTPUT FORMAT\n-------------\n${OUTPUT_FORMAT_INSTRUCTIONS}`,
  ];

  return sections.join("\n\n");
}
```

Line this up against `ai-generation.md` §19's diagram (Common Instructions / Subject+Topic+Subtopic / Question Pattern(s) / Difficulty / Question Type / Generation Prompt(s) / Reference Questions / Output Format) and you'll see it's the same structure, just merged in one place: `buildEducationalContextSection` covers Subject, Subtopic, and every selected Pattern (plus each pattern's own `generationPrompt`) together, since they're all "what and where" information about one request.

**`buildEducationalContextSection`** — per-pattern lines, with the per-pattern `generationPrompt` included only when present:

```ts
const lines = [`- ${pattern.name}`];
if (pattern.generationPrompt) {
  lines.push(`  Generation guidance: ${pattern.generationPrompt}`);
}
```

Recall from Lesson 4: `getGenerationContext` returns `generationPrompt: null` when no `QuestionGenerationRequest` row exists for a given pattern+difficulty. That `null` surfaces here as "just omit the line" rather than an error — the absence flows all the way from the database to the final prompt as a quiet, valid state. The section also adds one explicit instruction: *"Not every question needs to use every pattern."* This is the code's direct answer to the open question `ai-generation.md` §14 raises about multi-pattern selection — the project chose not to require every generated question to combine every selected pattern.

**`buildDifficultySection`** — the payoff of `DIFFICULTY_GUIDANCE` being a typed `Record`:

```ts
function buildDifficultySection(request: PromptRequest): string {
  const difficulty = request.context.difficulty;
  return `DIFFICULTY\n----------\n${capitalize(difficulty)}\n\n${capitalize(difficulty)} means:\n${DIFFICULTY_GUIDANCE[difficulty]}`;
}
```

One `Record` lookup, and the entire difficulty-benchmark concept from Lesson 1 and Lesson 3 is in the prompt.

**`buildReferenceQuestionsSection`** — implementing the "examples, not templates" constraint:

```ts
return `REFERENCE QUESTIONS\n-------------------\nThese are examples of the expected style and structure. Use them as guidance, not as questions to copy directly.\n\n${body}`;
```

This sentence is the code-level implementation of `ai-generation.md` §39: *"Reference Questions are examples, not templates to copy... The AI should generate new questions rather than simply reproduce the reference questions."* The section also handles the empty case explicitly — `"No reference questions are available for this context."` — rather than erroring, which is the same "absence is a valid state, not a failure" pattern you just saw in the educational-context section.

Every one of these functions is pure and synchronous. Nothing here reaches into `prisma` or does an `await` — which is exactly what makes `ai-generation.md` §17's "should not directly query the database" rule true structurally rather than just by convention, and what makes this whole module unit-testable with a hand-built `PromptRequest` object and no test database (Lesson 10's territory).

---

## 4. `schema.ts` — validating what comes back

The AI's response is a raw string. `parseGenerationResponse` turns it into a `ParsedGenerationResponse` in two steps: `JSON.parse`, then a zod schema.

### Tolerating LLM-shaped noise, deliberately

```ts
/**
 * Normalise an absent-ish value to `undefined` before validation.
 *
 * Zod's `.optional()` accepts `undefined` but rejects `null`, and models
 * routinely emit `null` or `""` for a field they cannot confidently fill.
 * Because `questions` is validated as a whole array, one such value would
 * otherwise invalidate an entire batch of good questions.
 */
function emptyToUndefined(value: unknown): unknown {
  if (value === null) return undefined;
  if (typeof value === "string" && value.trim().length === 0) return undefined;
  if (Array.isArray(value) && value.length === 0) return undefined;
  return value;
}
```

This is applied to `questionPattern` and `options` before the zod check runs. The comment states the concrete failure mode it prevents: without this, a `null` where the AI meant "I have nothing to put here" would make `.optional()` reject the whole field — and because `generationResponseSchema` validates the entire `questions` array as one unit, that one bad field on one question would discard every other valid question in the batch. This is a lesson specifically about validating LLM output rather than generic zod usage — the failure mode being guarded against is the model's habit of emitting `null`/`""` rather than simply omitting a key.

### The one cross-field rule: multiple-choice structure

```ts
.superRefine((question, ctx) => {
  if (question.questionType === "multiple_choice") {
    if (!question.options || question.options.length === 0) {
      ctx.addIssue({ code: "custom", message: "multiple_choice questions require a non-empty options array", path: ["options"] });
      return;
    }
    if (!question.options.some((opt) => opt.id === question.correctAnswer)) {
      ctx.addIssue({ code: "custom", message: "correctAnswer must match one of the option ids", path: ["correctAnswer"] });
    }
  }
});
```

Every other field-level rule in `questionSchema` is independent (a string is non-empty, a number is a positive integer). This is the one place two fields are checked against each other, and it's type-specific: only `multiple_choice` questions are required to carry `options`, and only for those questions does `correctAnswer` have to match one of the option ids. Non-multiple-choice questions just need `correctAnswer` as plain text — the schema doesn't try to validate free-text answer correctness (that's the "mathematical correctness vs. prompt compliance" distinction from §1 again — a schema can check *shape*, never *truth*).

### Failing without leaking, and without throwing

```ts
export function parseGenerationResponse(raw: string): ParsedGenerationResponse {
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch {
    return { ok: false, error: "Response is not valid JSON." };
  }

  const result = generationResponseSchema.safeParse(parsedJson);
  if (!result.success) {
    console.error("parseGenerationResponse: schema validation failed -", /* ...issue paths... */);
    return { ok: false, error: "Response does not match the expected question schema." };
  }

  return { ok: true, data: result.data };
}
```

This function never throws — both failure paths return the same `{ ok: false, error }` shape you've seen at every boundary so far. The interesting asymmetry: it `console.error`s the *specific* field paths that failed (useful for a developer debugging a bad prompt or a misbehaving model) but returns a *generic* message to the caller. The reasoning is in the code's own comment, referencing `architecture.md` §27: provider/internal details must not reach the user. This is the same `{ ok, error }` convention from Lessons 4-5, now doing a second job — it's not just a clean way to report a database failure, it's the mechanism that keeps a foreign, untrusted AI response from leaking implementation detail to whatever eventually renders the error.

---

## Tying back to the docs

`ai-generation.md` §44, "Implemented Prompt Structure (TASK-006)," is the design doc's own after-the-fact record of exactly this code — worth reading directly once you've read the code itself, as a check on your own understanding rather than a new source of information. It also names the tool that makes this whole system inspectable without spending an AI API call: `app/dev/prompt-preview` (met briefly in Lesson 2 §4) builds a real `GenerationContext` from the live database and runs it through the exact `buildPrompt` you just read, showing a researcher the literal string that would be sent. That route is where "prompt construction is a first-class, experimentable concern" (Lesson 1's framing) becomes something you can actually click on.

---

**Explicitly out of scope for this lesson** (deferred, not forgotten):

- What actually calls `buildPrompt` and `parseGenerationResponse`, and in what order, around an AI call → Lesson 8
- How the AI provider is reached over HTTP → Lesson 7
- How a missing `questionPattern` label gets turned into a scored evaluation finding → Lesson 9

---

## Checkpoint

Answer these in your own words before moving to Lesson 7. No answer key — if any of these feel shaky, re-read the relevant section above.

1. Why can `buildPrompt` be a plain synchronous function with no `await` anywhere in it, given that everything it needs came from a database query in Lesson 4?
2. `COMMON_INSTRUCTIONS` lives as a TypeScript constant, while `QuestionGenerationRequest.generationPrompt` lives as a database row. What distinguishes which kind of instruction belongs in which place?
3. Why is `GeneratedQuestion.questionPattern` optional in the type, and optional (via `emptyToUndefined`) in the zod schema, rather than required in both?
4. If an AI response has 5 valid questions and 1 `multiple_choice` question missing its `options` array, what does `parseGenerationResponse` return for the whole batch, and why does the code choose that behavior instead of discarding just the bad question?
5. Where would you look to see the literal, real final prompt string for a specific Subtopic/Pattern/Difficulty combination, without spending an AI API call to do it?
