# TASK-021 — GenerationContext Question Count and Grade

## Summary

`public.generation_contexts` gained two nullable columns, added directly to the
live PostgreSQL database by the project owner (not by this task):
`requested_question_count integer` (with a `IS NULL OR > 0` check) and
`grade varchar(50)`. This task updated the application to recognize, persist,
load, and use both fields correctly — closing two limitations TASK-020's own
feedback report explicitly flagged as follow-ups: `requestedQuestionCount` was
being approximated as the number of *saved* questions (wrong whenever the AI
returned a different count than requested), and `grade` was hard-coded to
`"N/A"` at load time even though the real value was known and simply never
persisted.

## Database Changes

The `requested_question_count`/`grade` columns and the count's check
constraint already existed in the live database before this task started.
**No migration was created or executed by this task** — no `prisma migrate
dev`, no `db push`, no `db pull` other than a read-only `npx prisma db pull
--print` used during planning to confirm the exact column types/nullability
against the real database before hand-editing the schema file. No other table
was touched.

## Domain / Prisma

`prisma/schema.prisma`'s `GenerationContext` model gained:

```prisma
requestedQuestionCount Int?    @map("requested_question_count")
grade                  String? @db.VarChar(50)
```

placed between `createdAt` and the relation fields, matching the field order
`db pull --print` reported. The table's existing hand-written CHECK-constraint
comment block (added during TASK-016/017) was extended with the new
`requested_question_count` constraint for documentation accuracy. `npx prisma
generate` was run afterward (codegen only, no DB write) so `prisma.generationContext.create`/`.findUnique` type-check against the new fields.

`lib/persistence/map-generation.ts`:
- `MapGenerationInput.config` widened from `Pick<PracticeConfig, "selectedTypes" | "autoTypes">` to also include `"grade"`.
- `MapGenerationInput` gained a top-level `requestedQuestionCount: number` (parallel to the existing top-level `prompt`/`createdAt`/`aiProvider`/`aiModel` — it's a property of the generation run, not of the pattern/type selection).
- `MappedGenerationContext` gained `requestedQuestionCount: number | null` and `grade: string | null`.

## Generation Flow

```
Setup screen (PracticeConfig.grade)  ─┐
Generation (GenerationMeta.requestedQuestionCount) ─┤→ saveGenerationAction → saveGeneration → mapGeneration → generation_contexts
```

`GenerationMeta.requestedQuestionCount` already existed (set in
`app/generate/page.tsx` from `generateQuestions()`'s return value — today
always `DEFAULT_QUESTION_COUNT` = 10, since there is no user-facing count
selector) and was already threaded into evaluation (`prepareEvaluationAction`).
It was simply never forwarded to the save path. `PracticeConfig.grade` was
likewise already a real, known value (the Setup screen's grade input) — also
never forwarded. Neither required a new UI element or a new configuration
concept; both were already-tracked values that just needed one more hop.

## Persistence

`lib/persistence/save-generation.ts` `saveGeneration()`:
- `config` param widened to `Pick<PracticeConfig, "selectedTypes" | "autoTypes" | "grade">`.
- Gained a `requestedQuestionCount: number` input, threaded into `mapGeneration()`.
- The `tx.generationContext.create({ data: {...} })` call now includes `requestedQuestionCount` and `grade`.

`mapGeneration()`'s mapping rules (no validation-error path added — an
out-of-range value simply persists as `NULL` rather than failing the whole
save, since the DB check already tolerates `NULL`):
- `requestedQuestionCount: input.requestedQuestionCount > 0 ? input.requestedQuestionCount : null`
- `grade: nonEmpty(input.config.grade)` (reuses the existing `nonEmpty()` helper already used for `prompt`)

`lib/actions/save-generation.ts` `saveGenerationAction()`: passes
`requestedQuestionCount: generationMeta.requestedQuestionCount` through (the
`config` object it already forwards wholesale already carries `grade`).

## Saved Generation

`lib/db/generation-context.ts` `loadSavedGeneration()`:
- `select` now includes `requestedQuestionCount`/`grade`.
- If `saved.requestedQuestionCount == null`, returns `{ ok: false, error: "This saved generation's original question count is unavailable. Generate a new set to evaluate it." }` **before** doing any further work (subtopic resolution, `getGenerationContext` call) — see "Backward Compatibility" below.
- Otherwise returns `requestedQuestionCount: saved.requestedQuestionCount` verbatim — the `generatedQuestions.length` fallback is gone.
- `config.grade: saved.grade ?? "N/A"` — the unconditional `"N/A"` is gone; the placeholder is now only used for a genuinely missing value.

## Evaluation

**No evaluation scoring code changed.** `evaluateGeneration()` already builds
`configuration: { grade: config.grade, ..., requestedQuestionCount, ... }`
directly from its inputs — it never needed a fix, only correct inputs. Once
`loadSavedGeneration()` supplies the real persisted values, they flow through
`prepareSavedEvaluation()` → `prepareEvaluation()` → `evaluateGeneration()`
unchanged, and appear correctly in `EvaluationResult.configuration` (and its
Markdown/JSON export) with no further wiring.

## Backward Compatibility

Asked the user how a saved run with `requested_question_count IS NULL`
(pre-TASK-021) should behave when evaluated. They confirmed both currently-
existing saved rows were manually backfilled with real values, so this is a
non-issue for present data — but the column stays nullable and the task
explicitly requires defensive handling and tests for it, so it was
implemented anyway:

- **`requestedQuestionCount IS NULL`**: evaluation is blocked with a clear,
  generic message — the same pattern `prepareEvaluation()` already uses when
  a saved `prompt` is missing (`"...unavailable. Generate a new set to
  evaluate it."`). This was chosen over the alternative (evaluate anyway with
  a `0` sentinel, relying on `evaluateCountAdherence`'s existing `> 0`
  branch) because a `0` would still print a fabricated, misleading number
  into the report/Markdown export (`"8 generated of 0 requested"`) — the
  task explicitly forbids "inventing misleading values." Blocking requires
  zero changes to any scoring code.
- **`grade IS NULL`**: falls back to the existing `"N/A"` display placeholder.
  No risk of a misleading score, since `grade` is purely cosmetic and is
  never read by any scoring dimension — confirmed by reading
  `evaluate-generation.ts` and every `lib/evaluation/dimensions/*` file.
- **Not-found / no-patterns**: unchanged, pre-existing guards still run
  first.

Verified against the live database (read-only, via a temporary local script
in the session scratchpad, not committed) that the two existing rows already
carry real values (`requestedQuestionCount: 10`, `grade` populated) — the
`NULL` guard is exercised only by tests, not by any live record today.

## TDD

Written test-first, in this order:

1. `tests/unit/map-generation.test.ts` (pre-existing, extended): passthrough
   of `requestedQuestionCount`/`grade` into the mapped context; "does not
   derive `requestedQuestionCount` from the number of generated questions"
   (10 requested, only 1 AI-returned question in the fixture → mapped
   context still shows 10); a blank `grade` → `null`; a non-positive
   `requestedQuestionCount` → `null`.
2. `tests/unit/save-generation.test.ts` (pre-existing, extended): the
   transaction's `generationContext.create` call includes
   `requestedQuestionCount`/`grade`.
3. `tests/unit/save-generation-action.test.ts` (pre-existing, extended):
   `saveGeneration` is called with `requestedQuestionCount` sourced from
   `generationMeta.requestedQuestionCount`.
4. `tests/unit/load-saved-generation.test.ts` (pre-existing from TASK-020,
   extended): the "reconstructs..." test now asserts
   `requestedQuestionCount: 10` (the persisted value) rather than `1` (the
   number of saved questions) and `config.grade: "Grade 6"`; new cases for
   `requestedQuestionCount: null` → `ok: false` with the count-specific
   message, and `grade: null` → `config.grade: "N/A"`.
5. Full regression pass — no changes needed in
   `tests/unit/prepare-saved-evaluation.test.ts`,
   `tests/unit/generation-context.test.ts`,
   `tests/unit/find-matching-generation-contexts.test.ts`,
   `tests/integration/questions-screen.test.tsx`, or
   `tests/unit/evaluation-method-dialog.test.tsx` — all pass unmodified,
   confirming TASK-018/019/020 flows are unaffected.

## Verification

- **Full tests**: `npx vitest run` → 264/264 passing (13 new/updated across
  the 4 files above; 258 → 264 vs. the TASK-020 baseline), 0 failures.
- **TypeScript**: `npx tsc --noEmit` → clean.
- **ESLint**: `npx eslint .` → clean.
- **Prisma validation**: `npx prisma validate` → schema valid;
  `npx prisma generate` succeeded; `git diff prisma/schema.prisma` limited to
  the two new `GenerationContext` fields and the extended check-constraint
  comment — no other model touched, no migration files created.
- **`next build`**: production build succeeds cleanly.
- **Generation flow**: `GenerationMeta.requestedQuestionCount` /
  `PracticeConfig.grade` traced end-to-end from their existing sources
  through to persistence — verified by the `save-generation`/
  `save-generation-action` test assertions above; the live generation
  request/response pipeline itself (`lib/generation/generate-questions.ts`)
  was not touched.
- **Persistence**: verified by the `save-generation.test.ts` transaction-call
  assertions (mocked Prisma).
- **Saved generation loading**: verified by `load-saved-generation.test.ts`
  (mocked Prisma) and by a read-only live-DB check (temporary local script,
  not committed) confirming the two real existing rows now expose
  `requestedQuestionCount: 10` and their backfilled `grade` values through
  `prisma.generationContext.findMany`.
- **Null/legacy records**: verified by the two new `load-saved-generation.test.ts`
  cases (`requestedQuestionCount: null` blocked with a clear message;
  `grade: null` falls back to `"N/A"`).

## Issues / Follow-ups

- There is still no user-facing "question count" selector in the Setup
  screen — generation always requests `DEFAULT_QUESTION_COUNT` (10). This
  task persists whatever count was actually used, but does not add UI to let
  the user choose a different count; that would be a separate, explicitly
  out-of-scope feature.
- The `grade` values currently in the live database (manually backfilled by
  the project owner) are short numeric-looking strings (e.g. `"87"`, `"93"`)
  rather than a `"Grade N"` format. The application does not enforce any
  particular format for `grade` (it never has — it's a free-text
  `PracticeConfig` field), so this is not a bug, just worth the owner's own
  awareness since it will now show up verbatim in evaluation reports/exports.
- The MC-`options`-not-persisted gap documented in the TASK-020 feedback
  report is unchanged by this task (out of scope here).
