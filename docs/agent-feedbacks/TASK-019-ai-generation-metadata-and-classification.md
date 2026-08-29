# TASK-019 — AI Generation Metadata & Classification

## Summary

Every generated question is now self-classified with a stable `questionType`
code and the exact `questionPatternId` (the database id), and both are validated
against the user's selections before the questions can be displayed or saved.
The old flow — AI returns a long-form type and an optional pattern **name**, then
the app string-matches the name back to an id — is removed entirely, including
its type (`AiQuestionType`), its maps, and the name-resolution code in the
persistence mapper and the evaluation pattern dimension.

TASK-018's Save-for-Evaluation UX is unchanged; it now receives already-classified
data.

## AI Prompt Context

`lib/prompts/builder.ts` assembles the same 7 sections (headings unchanged so the
evaluation's `splitPromptSections` still works), with two enriched:

- **EDUCATIONAL CONTEXT** now contains a numbered **SELECTED QUESTION PATTERNS**
  block. Each selected pattern is printed as:
  ```
  1.
     ID: <question_patterns.id>
     Name: <pattern name>
     Details: <per-difficulty generation_prompt, when present>
  ```
  Only the user's selected patterns appear. "Details" reuses the existing
  `GenerationContextPattern.generationPrompt` (from
  `question_generation_requests.generation_prompt`) — no schema change, no
  `Subtopic.concept`.
- **QUESTION TYPE** now contains **SELECTED QUESTION TYPES** — each selected code
  as `- ID: mc` / `  Name: Multiple Choice` (from `QUESTION_TYPE_OPTIONS`).
  `"auto"` lists all five.

`OUTPUT_FORMAT_INSTRUCTIONS` (`lib/prompts/common.ts`) now shows
`"questionType": "mc"` and `"questionPatternId": "<...>"` in the JSON template and
carries the §6 instruction verbatim ("use the exact ID … never invent, modify,
or generate a new ID … do not return the Question Pattern name instead of the
ID").

## AI Response Contract

`GeneratedQuestion` (`lib/prompts/types.ts`):

```ts
{ questionNumber: number; questionText: string;
  questionType: QuestionType;      // "mc" | "fib" | "wp" | "tf" | "ms"
  questionPatternId: string;       // REQUIRED, non-empty (trimmed)
  options?: { id; text }[];        // mc only
  correctAnswer: string; explanation: string }
```

`questionPattern` (the name field) is **gone**. `AiQuestionType` is **gone**.
`lib/prompts/schema.ts`: `questionType: z.enum(QUESTION_TYPE_CODES)`,
`questionPatternId: z.string().trim().min(1)`, the `mc` superRefine keys on `"mc"`.

**Confirmed: the AI returns `questionPatternId`, not `questionPattern`.**

## QuestionType

Supplied to the AI as the code + label in SELECTED QUESTION TYPES. Validated
twice: `parseGenerationResponse` (enum) and then `validateClassification`
(`lib/prompts/validate-classification.ts`) checks membership in the user's
selected codes (`config.autoTypes` ⇒ all five). `map-generation.ts` also
re-checks it before persistence (defence in depth). An unselected or invalid code
fails the whole generation at `stage: "validation"`.

## QuestionPatternId

The prompt lists each selected pattern's real `question_patterns.id`.
`generateQuestions` computes `patternIds = context.patterns.map(p => p.id)` and
`validateClassification` requires every question's `questionPatternId` to be in
that set — compared **verbatim**, no trimming-into-a-name, no lookup. The
persistence mapper then uses `q.questionPatternId` directly as
`generated_questions.question_pattern_id`.

## Validation

`validateClassification(response, { patternIds, typeCodes })` collects every
offending question number into one message and returns
`{ ok:false, error }` → `generateQuestions` returns
`{ ok:false, stage:"validation", error }`. The `/generate` page already renders
`stage:"validation"` as a "Generation Failed" page, so an unselected id/type
means the questions never reach `/questions` and can't be saved. No silent
substitution anywhere.

## Name Resolution

**No.** The AI returns the `questionPatternId` directly and the application
validates that the id belongs to the user's selected patterns. `map-generation.ts`
lost its `patternIdByName` map and `normalisePatternName`; `pattern-adherence.ts`
lost its `normalise` + canonical-name map + raw-fallback.

## TASK-018 Integration

`saveGeneration` / `saveGenerationAction` / the Save-for-Evaluation dialog are
untouched. `mapGeneration` now reads `q.questionType` / `q.questionPatternId`
straight through (it already produced `MappedGeneratedQuestion` with those exact
fields, so `save-generation.ts` needed no change). The only compatibility edit
was the mapper's internal validation and its doc comment.

## Terminology

`DifficultyLevel`, `QuestionType`, `questionPatternId` are used consistently in
the domain/persistence/AI-contract layers. `AiQuestionType` and the
`questionPattern` name field are removed. Per the project owner's decision the
`Difficulty` (lowercase, UI/prompt boundary) / `DifficultyLevel` (capitalized,
domain/DB) split is **kept** — it is one concept with a single bridge
(`toDifficultyLevel`), established in TASK-016; a full rename was judged a large
cross-cutting change out of scope here.

## TDD

- `tests/unit/validate-classification.test.ts` (new) — valid id+code pass;
  missing/unknown/unselected id fails; missing/unknown/unselected type fails; a
  pattern **name** in `questionPatternId` is rejected (no name matching); all
  offending question numbers reported at once; the four selection mixes
  (1×1, N×1, 1×N, N×N) pass.
- `tests/unit/response-schema.test.ts` (rewritten) — codes only; long-form type
  rejected; `questionPatternId` required (null/""/whitespace rejected); a
  `questionPattern` name field is not accepted as the classifier.
- `tests/unit/prompt-builder.test.ts` — patterns show both id and name;
  unselected pattern/type absent; prompt asks for `questionPatternId` / "exact
  ID"; selected types shown as `ID:` / `Name:`.
- `tests/unit/generate-questions.test.ts` — unselected `questionPatternId` and
  unselected `questionType` each → `stage:"validation"`.
- `tests/unit/map-generation.test.ts` — id used directly; a name in the id field
  fails; unselected id fails; name-normalisation tests removed.
- `tests/unit/evaluation-dimensions.test.ts` — pattern dimension takes
  `{id,name}[]`, scores on id membership; type fixtures use codes.
- Fixture updates across `test-utils.tsx`, `prepare-evaluation.test.ts`,
  `evaluation-method-dialog.test.ts`, `save-generation*.test.ts`,
  `generate-questions-action.test.ts`, `generate-screen.test.tsx`.

## Real AI Verification

**Not performed** — no live `AI_API_KEY` or database in this environment. The
required check (multiple types + multiple patterns; confirm every question
returns `questionType` code + `questionPatternId`; confirm the ids are among the
selected ids and are ids, not names; then Save for Evaluation and confirm
`generated_questions.question_pattern_id` matches) is unchanged and left for the
developer.

## Verification

| Check | Result |
|---|---|
| `npx vitest run` | **225 passed** (29 files) |
| `npx tsc --noEmit` | clean — the real proof every `AiQuestionType` / `questionPattern` consumer was updated |
| `npx eslint .` | clean |
| `npx prisma validate` | valid (no schema change) |
| `grep -rn AiQuestionType` (src) | zero hits |
| `grep -rn "questionPattern[^I]"` (src, excl. generated Prisma client) | zero hits |
| Real AI generation / multiple types+patterns / DB persistence | **not performed** (see above) |

## Issues / Decisions

1. **`schema` uses `z.string().trim().min(1)`** for `questionPatternId` so a
   whitespace-only value is rejected (matches the intent of "required").
2. **`map-generation` still re-validates** type/pattern membership even though
   `generateQuestions` already did via `validateClassification`. Kept as defence
   in depth — `saveGeneration` is a separate public function and a future caller
   might not have gone through `generateQuestions`.
3. **Evaluation `pattern-adherence` deviation `observed`** is now the raw
   `questionPatternId` (an opaque uuid) rather than a readable name when a
   question uses an unselected id. This is an edge case (the id was never offered
   in the prompt, so there's no name to show); the coverage `entries` still show
   selected patterns by name.
4. **`components/common/ai-question-type-meta.ts` renamed** to
   `question-type-meta.ts`, export `QUESTION_TYPE_META`, keyed by code. Two
   importers updated.
5. TASK-018 feedback was written in this same session (it had not been recorded
   before the task switch).
