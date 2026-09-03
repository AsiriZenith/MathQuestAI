# TASK-017 — Complete Question-Generation Persistence

## Summary

Implemented the full persistence workflow on top of the TASK-016 foundation.
Every successful question generation is now saved to PostgreSQL as one complete,
atomic record. No database schema changes; no Evaluation-page changes. TDD —
tests written before each module.

New files:

| File | Purpose |
|---|---|
| `lib/persistence/generation-name.ts` | `buildGenerationName(date)` → `Generation-YYYY-MM-DD-HH-MM-SS-mmm` (UTC, timestamp-derived, no user input) |
| `lib/persistence/map-generation.ts` | Pure `mapGeneration(input)` — validated AI response + selections → persistence row shapes, or a list of resolution errors |
| `lib/persistence/save-generation.ts` | `saveGeneration(input)` — `server-only`; maps, then runs one interactive `prisma.$transaction` |
| `app/generate/_components/generation-issue-dialog.tsx` | Presentational alert dialog shown when a generation can't be saved |
| `tests/unit/generation-name.test.ts`, `tests/unit/map-generation.test.ts`, `tests/unit/save-generation.test.ts`, `tests/unit/ai-config.test.ts` | New unit tests |

Changed files: `lib/types.ts` (+`toDifficultyLevel`), `lib/db/generation-context.ts`
(use it, drop local `DIFFICULTY_DB_VALUE`), `lib/prompts/common.ts`
(+`AI_QUESTION_TYPE_TO_CODE`), `lib/ai/config.ts` (+`getAiProvider` / `DEFAULT_AI_PROVIDER`),
`lib/generation/generate-questions.ts` (call `saveGeneration`, new `persistence`
failure stage, new `config` param), `lib/actions/generation.ts` (pass `config`),
`app/generate/page.tsx` (pass `config`; render the dialog on a persistence
failure), `app/dev/generate-questions-check/page.tsx` (new param), three test
files updated for the new signature, plus docs.

## Architecture

```
app/generate/page.tsx (client)
  → generateQuestionsAction(context, questionTypes, {selectedTypes, autoTypes})   lib/actions/generation.ts  "use server"
  → generateQuestions(context, questionTypes, config, provider?)                   lib/generation/generate-questions.ts  server-only
        buildPrompt → provider.generate (HttpAiProvider) → parseGenerationResponse (Zod)
      → saveGeneration({ generationContext, config, aiResponse, prompt })          lib/persistence/save-generation.ts  server-only
          → mapGeneration(...)          lib/persistence/map-generation.ts  (pure)
          → prisma.$transaction(...)    lib/prisma.ts → @prisma/adapter-pg → PostgreSQL
```

The persistence layer follows the existing data-access convention (plain
functions, `import "server-only"`, shared `prisma` singleton, `{ ok } | { ok:false; ... }`
results, generic safe error strings). No repository class, no second DB pattern.

## Persistence Flow

1. Validate user configuration (unchanged — Setup form + `getGenerationContext`).
2. Generate AI questions (unchanged).
3. Validate the AI response with the existing Zod schema (unchanged).
4. `mapGeneration` resolves everything the DB needs **before any write**:
   difficulty → `DifficultyLevel`, AI `questionType` → stable code, each AI
   pattern label → a selected `questionPatternId`. Collects every problem.
5. If mapping fails → return `format-mismatch`; **`$transaction` is never opened**,
   nothing is written.
6. Otherwise one interactive transaction inserts, in order:
   `generation_contexts` → `generation_context_question_types` →
   `generation_context_question_patterns` → `generated_questions`.
7. Any error inside the transaction → rollback → `save-failed`.
8. On success the questions (plus the new `generationContextId`) are returned to
   the UI exactly as before.

## GenerationContext

One `generation_contexts` row per successful generation:

- `name` — `buildGenerationName(createdAt)` = `Generation-2026-08-29-04-30-15-123`
  (UTC, zero-padded, milliseconds). Fully derived from the creation timestamp;
  the **same `Date`** is written to `created_at`, so name and timestamp always
  agree. Milliseconds go beyond the task's seconds-only example — a deliberate
  deviation (below) to keep the `uq_generation_contexts_name` constraint from
  tripping on two generations in the same second.
- `difficulty_level` — `toDifficultyLevel(generationContext.difficulty)` (`easy`→`Easy`).
- `ai_provider` — `getAiProvider()` (`AI_PROVIDER` env, default `"groq"`).
- `ai_model` — `getAiModel()` (existing).
- `prompt` — the exact final prompt string already returned by `generateQuestions`
  (blank → `NULL`).
- `id`, `created_at` default handling untouched (`created_at` passed explicitly).

## Question Types

- `mapGeneration` produces the set of codes to persist: **all five**
  `QUESTION_TYPE_CODES` when `config.autoTypes`, otherwise exactly
  `config.selectedTypes` (de-duplicated, each checked with `isQuestionType`).
- Persisting all five for "AI mix" is required, not cosmetic: `generated_questions`
  has a composite FK `(generation_context_id, question_type)` →
  `generation_context_question_types`, so any type the AI returns must already be
  recorded as selected.
- One `generation_context_question_types` row per code, stable codes only
  (`mc/fib/wp/tf/ms`) — never UI labels, never the AI long-form vocabulary.
- A generated question whose mapped code is **not** in the selected set is a
  `format-mismatch` (caught before the transaction).

## Question Patterns

- Every pattern in `generationContext.patterns` (already the fully-expanded
  selection, including "all patterns") becomes one
  `generation_context_question_patterns` row, keyed by the real
  `question_patterns.id` — never the name.
- Generated-question pattern resolution: `mapGeneration` builds a
  `normalise(name) → id` map (`trim().toLowerCase()`) from the selected patterns
  and looks up each question's `questionPattern` label.
  - Missing label → error.
  - Label that doesn't match a selected pattern → error.
  - No single-pattern fallback — any unresolved label fails the whole generation
    (project owner's decision).
- On any such error nothing is persisted and the transaction rolls back
  (it never opens).

## Generated Questions

`mapGeneration` maps each validated AI `GeneratedQuestion` →
`generated_questions` row:

| AI field | DB column |
|---|---|
| `questionNumber` | `question_number` (also checked unique within the batch) |
| `questionText` | `question_text` |
| `questionType` (long form) | `question_type` (code, via `AI_QUESTION_TYPE_TO_CODE`) |
| `questionPattern` (label) | `question_pattern_id` (resolved to a selected id) |
| `correctAnswer` | `expected_answer` |
| `explanation` | `explanation` (blank → `NULL`) |
| — | `generation_context_id` (the id created in the transaction) |

Each row is also run through the existing `validateGeneratedQuestion`
(`lib/persistence/validation.ts`) — mirroring the DB CHECKs — with a `"pending"`
sentinel for the not-yet-known `generationContextId`. The AI contract was not
changed to match the DB (`correctAnswer` stays `correctAnswer` in
`lib/prompts/types.ts`).

## Transaction

`saveGeneration` uses one interactive `prisma.$transaction(async (tx) => …)`.
Inserts are ordered context → types → patterns → questions so the two composite
foreign keys on `generated_questions` are always satisfiable. `createMany` is
used for the three child tables (it accepts the scalar FK columns directly).
Any throw inside the callback aborts the transaction — PostgreSQL rolls back
every insert — and `saveGeneration` returns
`{ ok:false, reason:"save-failed", error: <generic> }` (Prisma/pg text never
leaks). A partially-persisted generation is therefore impossible.

## TDD

Tests written before the implementation of each module:

- **`generation-name.test.ts`** (5) — exact format, zero-padding, UTC handling,
  determinism, millisecond distinctness. Protects: the unique, no-input name.
- **`map-generation.test.ts`** (14) — happy path; `correctAnswer→expectedAnswer`;
  all five type mappings; case/whitespace-insensitive pattern resolution; missing
  label fails; unselected label fails; `autoTypes`→5 codes; explicit codes exact
  + de-duplicated; unselected type fails; number/text preserved; blank
  explanation → null; duplicate `questionNumber` fails; blank prompt → null;
  multiple errors collected at once. Protects: every mapping rule and every
  "reject, don't guess" rule in §7–§11.
- **`save-generation.test.ts`** (4) — insert order is context→types→patterns→questions
  in a single `$transaction`; questions carry the created context id;
  `format-mismatch` returns **without** opening a transaction; a thrown write →
  `save-failed` with no leaked internals. Protects: atomicity, ordering, the
  "nothing written on format mismatch" guarantee, safe errors.
- **`generate-questions.test.ts`** (rewritten, 9) — success now also calls
  `saveGeneration` and surfaces `generationContextId`; provider/validation/prompt
  failures never persist; a `format-mismatch` from persistence still carries
  `data` + `prompt` + `requestedQuestionCount` for review; `save-failed` is
  surfaced as `stage:"persistence"`.
- **`ai-config.test.ts`** (3) — `getAiProvider()` default / env override / empty.

Per the agreed test strategy, transaction rollback is covered by mocking
`prisma.$transaction` (unit) — **no test writes to the real database.**

## Verification

| Check | Command | Result |
|---|---|---|
| Full test suite | `npx vitest run` | **198 passed** (27 files) — was 171 |
| New persistence tests | (subset above) | pass |
| TypeScript | `npx tsc --noEmit` | clean |
| ESLint | `npx eslint .` | clean |
| Prisma schema | `npx prisma validate` | valid (schema unchanged) |
| Prisma client | not regenerated — schema unchanged | n/a |
| Secret scan | `git grep -i "AI_API_KEY\|secret"` on the diff | only env-var *names* in docs/config; no values |
| Evaluation page | `git diff --stat app/evaluation` | no changes |

**Manual end-to-end generation test: NOT run in this session.** It needs a live
`AI_API_KEY` + database, which the agent environment does not have. Before
merging, the developer should:

1. `npm run dev`, complete a generation (subtopic → patterns → difficulty →
   types) and reach `/questions`.
2. `npx prisma studio` — confirm exactly one `generation_contexts` row
   (name `Generation-…`, correct `difficulty_level`, `ai_provider`, `ai_model`,
   non-null `prompt`); one `generation_context_question_types` row per selected
   type (all five for "AI mix"); one `generation_context_question_patterns` row
   per selected pattern; one `generated_questions` row per AI question, all
   pointing at that context, with `(question_type, question_pattern_id)` inside
   the selected sets.
3. Run a second generation → an independent context, no rows mixed.
4. Rollback in practice is exercised only if a write actually fails; the unit
   tests cover the logic. A deliberate way to see the format-mismatch dialog:
   temporarily narrow the selected patterns so the AI labels a question with a
   pattern that wasn't selected.

## Issues / Decisions

1. **Generation name includes milliseconds** — `Generation-YYYY-MM-DD-HH-MM-SS-mmm`
   vs the task's `Generation-2026-08-29-04-30-15` example. Still fully
   deterministic from the timestamp and needs no user input; the extra segment
   avoids a `uq_generation_contexts_name` violation for two generations started
   in the same second. If a same-millisecond collision ever happens it surfaces
   as `save-failed` (rolled back) — acceptable for single-user research use.
2. **Format-mismatch failure UX** — per the project owner: instead of the plain
   "Generation Failed" page, `/generate` shows a dialog ("these questions need a
   review — didn't match the expected format, weren't saved") with **Review &
   evaluate** (keeps the questions in session, routes to `/questions` where the
   existing *Evaluate Results* button opens the Evaluation page and its reasons)
   and **Cancel** (back to Setup). `save-failed` uses the same dialog with a
   "system error, try again" message and no review action. Other failure stages
   (prompt/provider/validation) keep the existing full-page error.
   This means a valid AI generation is **not shown as a success** when it can't
   be saved (task §13) — the questions live only in session for that review hop.
3. **`generated_questions` written with `createMany` + scalar FKs.** The model's
   composite relations (`selectedQuestionType`, `selectedQuestionPattern`) make a
   plain `create` awkward; `GeneratedQuestionCreateManyInput` exposes the raw
   `generationContextId` / `questionPatternId` / `questionType` columns, which is
   exactly what we have after mapping. The composite FKs still enforce integrity
   at the DB.
4. **`validateGeneratedQuestion` sentinel.** `mapGeneration` runs each row through
   the TASK-016 validator, but `generationContextId` doesn't exist until the
   transaction creates the context — a `"pending"` sentinel stands in. Slightly
   awkward; kept because reusing the validator (which mirrors the DB CHECKs) is
   more valuable than avoiding the sentinel.
5. **`getGenerationContext` no longer has a local `DIFFICULTY_DB_VALUE`** — it now
   uses the exported `toDifficultyLevel` from `lib/types.ts`. Same behaviour;
   one source of truth for the lowercase→capitalised bridge.
6. **`app/dev/generate-questions-check` now persists on every load.** It calls
   `generateQuestions`, which now saves. Acceptable for a dev-only inspection
   route; noted with a comment. Remove or guard it if that becomes noisy.
7. **`AI_PROVIDER` env var added** (default `"groq"`). Documented in
   `.env.example`, `SETUP.md`. No secret.
