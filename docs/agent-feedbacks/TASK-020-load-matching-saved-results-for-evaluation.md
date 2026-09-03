# TASK-020 — Load Matching Saved Results for Evaluation

## Summary

Enabled the second, previously-disabled "Compare with Previous Generations"
option in the Questions page's Evaluate Results dialog
(`app/questions/_components/evaluation-method-dialog.tsx`). Selecting it now
finds saved `generation_contexts` whose difficulty + question-pattern set +
question-type set **exactly** matches the current selection, displays them in a
table with radio-button single selection, and navigates to `/evaluation` after
evaluating the chosen saved run — reusing the existing evaluation pipeline
rather than adding new scoring logic. TASK-018's Save for Evaluation flow and
TASK-019's id/code-based classification were not touched.

## Matching Rules

- `DifficultyLevel` — exact match (`Medium` vs `Hard` never matches).
- `QuestionPattern` set — exact set equality by **id**, never by name.
- `QuestionType` set — exact set equality by the stable code (`mc`/`fib`/`wp`/`tf`/`ms`).
- Ordering never matters for either set. A saved context with an extra or a
  missing pattern/type is excluded — partial matches are never returned.

`isExactSetMatch(a, b)` (`lib/persistence/matching.ts`) implements this: same
length + every element of `a` present in `b`. The "current selection" side is
resolved by `resolveSelectedTypeCodes`/`resolveSelectedPatternIds` in the same
file — the exact logic `mapGeneration()` (TASK-017/018 writer) already used,
now extracted and shared so the writer and the new matcher can never disagree
about what "the current selection" means.

## Repository / Service

`lib/db/generation-context.ts` (existing `server-only` repository, next to the
TASK-005 `getGenerationContext()`) gained two functions:

- `findMatchingGenerationContexts({ difficultyLevel, questionTypeCodes,
  questionPatternIds })` — filters `generation_contexts` by `difficulty_level`
  in the database (the cheap part), then compares each candidate's
  `questionTypes`/`questionPatterns` join rows against the requested sets with
  `isExactSetMatch` in application code. There is no single Prisma query that
  expresses set equality against two join tables, and the per-difficulty
  candidate set is small in this research app, so DB-filter-then-JS-compare was
  chosen over raw SQL — matches the task's "prefer server-side filtering" intent
  without over-engineering a SQL set-equality query.
- `loadSavedGeneration(generationContextId)` — reconstructs a full saved run for
  evaluation. It resolves the subject/subtopic from the saved pattern's
  `subtopic → topic → subject` relation, then **reuses the existing
  `getGenerationContext()`** to rebuild reference questions and generation
  prompts, rather than duplicating that query.

Both return safe, generic error strings on failure (same convention as
`getGenerationContext`), never leaking Prisma/Postgres details.

## UI

`evaluation-method-dialog.tsx`'s `Phase` state machine grew three phases:
`saved-loading` (fetching matches), `saved-list` (table + selection), and
`saved-empty` / `saved-error`. The disabled `<div aria-disabled>` "Coming Soon"
placeholder was replaced with a real button. No new dialog file or `page.tsx`
change was needed — `onPrepared` was already method-agnostic, so the saved flow
reuses the exact same prop the predefined flow already had wired through. The
dialog widens (`max-w-md` → `max-w-2xl`) only while showing the table, since the
task's required 7 columns don't fit the narrower card readably.

## Display

- **Context Name**: `GenerationContext.name` verbatim.
- **Pattern**: `patterns.map(p => p.name).join(", ")` — names are for display
  only; matching itself never touches names.
- **Type**: codes mapped through the existing `QUESTION_TYPE_OPTIONS`
  (`lib/mock-data.ts`) to friendly labels, comma-joined
  (e.g. `Multiple Choice, Fill in the Blank`).
- **AI Provider** / **AI Model**: `GenerationContext.aiProvider` /
  `.aiModel` verbatim.
- **Difficulty**: `GenerationContext.difficultyLevel` (`Easy`/`Medium`/`Hard`).

## Selection

A single `<input type="radio" name="saved-context">` per row, backed by one
`useState<string | null>` holding the selected `GenerationContextId` (never the
name). The Evaluate button is disabled while that state is `null` and enabled
once a row is selected; selecting a different row deselects the previous one
(native radio-group behavior).

## Evaluation Navigation

No query params or new route were introduced — the app has no precedent for
either (only one dev-only page reads `searchParams`), and every real page
transition already goes through `PracticeSessionProvider`'s `evaluationData` +
`router.push("/evaluation")`. So: clicking Evaluate calls
`prepareSavedEvaluationAction({ generationContextId })`
(`lib/actions/evaluation.ts`) → `prepareSavedEvaluation` → `loadSavedGeneration`
→ the **same** `evaluateGeneration()` used for live generations, tagged
`method: "saved"` on the resulting `EvaluationData`. On success the dialog calls
the same `onPrepared` prop the predefined flow uses; `app/questions/page.tsx`'s
existing `handleEvaluationPrepared` stores it and navigates — unchanged.

## Provider Metadata

Investigated the task brief's "`AiProvider = groq`" concern. `lib/ai/config.ts`
reads `AI_PROVIDER`/`AI_MODEL`/`AI_BASE_URL` as three independently-defaulted
env vars; `.env.example` sets them to `groq` / `openai/gpt-oss-120b` /
`https://api.groq.com/openai/v1` — all three consistently point at Groq. There
is no in-app provider switcher (single process, single env config), and
`save-generation.ts` reads these fresh at save time, not cached from generation
time, so under the shipped defaults a saved `AiProvider = groq` is the correct,
intended value — **not a bug**. No historical records were modified. (If a real
deployment's `.env.local` ever set `AI_MODEL`/`AI_BASE_URL` to a different
provider without also updating `AI_PROVIDER`, the saved label would drift from
reality — worth a follow-up validation if multi-provider switching is ever
added, but out of scope here.)

## TDD

Written test-first, in this order:

1. `tests/unit/matching.test.ts` — `isExactSetMatch` (order-independence,
   missing/extra/different/empty sets), `resolveSelectedTypeCodes` (auto vs
   explicit, dedup, invalid-code filtering), `resolveSelectedPatternIds` (dedup,
   empty).
2. `tests/unit/find-matching-generation-contexts.test.ts` — DB-level difficulty
   filter, exact match on both sets, exclusion on missing/extra/different
   pattern, exclusion on missing/extra/different type, empty-results, safe error
   on DB failure.
3. `tests/unit/load-saved-generation.test.ts` — not-found id, full
   reconstruction shape (context/config/response/prompt/count), reuse of
   `getGenerationContext`'s own query path, no-patterns guard.
4. `tests/unit/prepare-saved-evaluation.test.ts` — load failure propagates,
   successful evaluation tagged `method: "saved"`, missing-prompt guard reused
   from `prepareEvaluation`.
5. `tests/unit/evaluation-method-dialog.test.tsx` — updated the stale
   "disabled/Coming Soon" assertion to "both options selectable"; added
   radio-group single-selection and empty-results-message coverage.
6. `tests/integration/questions-screen.test.tsx` — full flow: table renders
   required columns with comma-joined pattern/type display and friendly type
   labels, Evaluate disabled→enabled on selection, navigation uses the selected
   id (not the name), empty-state message with a working Back button, and the
   predefined-questions option is unaffected (`findMatchingGenerationContextsAction`
   not called on that path).

`mapGeneration()` was refactored (not behavior-changed) to call the new shared
resolvers instead of inlining the same logic — its own existing test suite
(`save-generation.test.ts`, `save-generation-action.test.ts`) passes unmodified,
confirming no regression.

## Verification

- **Full tests**: `npx vitest run` → 258/258 passing (33 new/updated across the
  6 files above), 0 failures.
- **TypeScript**: `npx tsc --noEmit` → clean.
- **ESLint**: `npx eslint .` → clean.
- **Prisma validation**: `npx prisma validate` → schema valid; `git diff --stat
  prisma/schema.prisma` confirms this task made **no** schema changes (the file
  shows as modified only because of pre-existing, already-uncommitted TASK-016
  work present before this task started).
- **Exact matching**: covered by `find-matching-generation-contexts.test.ts` and
  `matching.test.ts` (§14/§15 of the task doc, all cases).
- **Multiple pattern / type display**: covered by
  `questions-screen.test.tsx`'s "shows the matching saved results with the
  required columns" test (asserts the exact comma-joined strings).
- **Single selection**: covered at both the unit level (radio mutual exclusion)
  and integration level (disabled→enabled→navigates-with-id).
- **Evaluation navigation**: covered — asserts `prepareSavedEvaluationAction`
  is called with `{ generationContextId: "ctx-1" }`, not a name, and that
  `router.push("/evaluation")` follows.
- **Empty results**: covered — exact message text asserted, Back button present
  and functional.
- **Provider/model metadata**: investigated via `.env.example` and
  `lib/ai/config.ts`/`lib/persistence/save-generation.ts` source reading only
  (no live `.env.local` was read); conclusion above. Not independently verified
  against a real deployment's actual `.env.local`, since that file is
  gitignored and out of this task's reach.

## Issues / Follow-ups

- `PracticeConfig.grade` has no persisted counterpart anywhere in the schema
  (it's a free-text UI label). `loadSavedGeneration` fills it with `"N/A"` for
  the saved-evaluation path. Evaluation scoring doesn't use `grade`
  computationally (display-only in `EvaluationResult.configuration` and the
  Markdown/JSON export), so this doesn't affect scores — but the exported
  report for a saved-run evaluation will show "N/A" where a live-run one shows
  a real grade.
- `requestedQuestionCount` has no persisted counterpart either. Approximated as
  the count of saved `generated_questions` rows, which means the "asked vs.
  received" evaluation dimension will always read 100% for a saved-run
  evaluation (it can't detect that fewer questions were originally requested
  than were saved, because that original number was never recorded). Worth a
  schema addition (`generation_contexts.requested_question_count`) if this
  matters for research accuracy later — deliberately not added here per the
  task's "no schema changes" boundary.
- MC `options` are not persisted at all (`generated_questions` has no `options`
  column). A saved multiple-choice question always reconstructs with
  `options: undefined`. Evaluation scoring doesn't depend on options, so this
  doesn't block TASK-020, but any future "review the saved questions
  themselves" UI would need a schema change to show MC choices for saved runs.
- The dialog widens to `max-w-2xl` only in the saved-results table phase (was
  `max-w-md` throughout). This is a minor, deliberate UI accommodation for the
  task's required 7-column table, not a redesign of the existing predefined
  flow.
