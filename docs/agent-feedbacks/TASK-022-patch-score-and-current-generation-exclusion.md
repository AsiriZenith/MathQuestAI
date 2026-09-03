# TASK-022 — Patch: Persist Evaluation Score and Exclude Current Generation

## Summary

Two fixes to the existing generate/save/evaluate flow:

1. The Evaluation page now persists the final `promptEffectiveness` score back
   onto the `GenerationContext` that was evaluated, once evaluation completes.
2. "Compare with Previous Generations" no longer offers the currently saved
   generation as a candidate to compare against itself.

Both are implemented as thin additions to the existing TASK-016–021
architecture (Server Actions → `lib/db/generation-context.ts` repository →
Prisma). No evaluation algorithm, matching rule, or database schema changed.

**A blocking ambiguity was resolved with the user before implementation.**
The task doc instructs using "the existing `GenerationContext.Score`" and
explicitly forbids schema changes. A read-only check of the live database
(`npx prisma db pull --print`) showed no `score` column exists anywhere — not
in the live database, not in `prisma/schema.prisma`. Asked the user; they
confirmed this was their own wording mistake in the task doc and that "score"
should reuse the **existing `grade` column** (added in TASK-021) — no new
column. This is a low-risk reuse in practice: `grade` currently carries no
real per-generation information (`app/_components/setup-form.tsx` hard-codes
it to the constant `"Grade 6"` for every generation — never user-editable),
and the two live rows already had owner-backfilled score-looking values in it
(`"87"`, `"93"`) before this task started. This decision, and its one
cosmetic side effect, is documented in `docs/project-management/database.md`'s
`generation_contexts` table section — not left implicit.

## Score Update

- **"Endpoint"**: a Server Action, `updateGenerationContextScoreAction`
  (`lib/actions/evaluation.ts`) — not a literal `PUT /api/...` route. There is
  no `app/api/` directory or route handler anywhere in this codebase; every
  mutation (save, prepare-evaluation, find-matching) is already a Server
  Action, and the task doc explicitly allows the route to differ from its
  conceptual example when the project already has its own convention.
- **Payload**: `{ generationContextId: string | null; score: number }` — no
  full `GenerationContext` object is accepted, per the task's instruction.
- **Validation**: `isValidScore` (new, `lib/persistence/validation.ts`) —
  integer, `0 <= score <= 100`, mirroring `evaluateGeneration()`'s own
  `Math.round(weighted * 100)` range; no new scoring rule invented. The action
  short-circuits with a safe error (no repository call) when
  `generationContextId` is `null` — the "current generation not saved yet"
  case.
- **Repository**: `updateGenerationContextScore(generationContextId, score)`
  (`lib/db/generation-context.ts`) validates the id/score again at the
  repository boundary (defence in depth, matching this file's existing
  convention), then `prisma.generationContext.update({ where: { id }, data: {
  grade: String(score) } })` inside try/catch. Not-found, malformed id, and
  DB failures all collapse to one safe generic error — never leaks Prisma/
  Postgres internals, consistent with every other function in this file.
- **Evaluation integration**: `EvaluationData` gained
  `generationContextId: string | null`. `prepareEvaluation()` (predefined
  method) and `prepareSavedEvaluation()` (saved method) both thread it
  through — for the saved method it's simply the id the caller already passed
  in to load that context; for the predefined method it's the current
  generation's `savedGenerationContextId` from `PracticeSessionProvider`
  (`null` if not yet saved), passed down through
  `EvaluationMethodDialog`'s new optional `savedGenerationContextId` prop.
  `app/evaluation/page.tsx` gained a `useEffect` (guarded by a `useRef`,
  mirroring the existing dev-mode-double-invoke guard pattern in
  `app/generate/page.tsx`) that calls
  `updateGenerationContextScoreAction({ generationContextId, score:
  evaluationData.result.promptEffectiveness })` once, only when
  `generationContextId` is non-null. Since `evaluationData.result` only
  exists once `evaluateGeneration()` has fully run, "do not update the score
  before a final score exists" is structurally guaranteed — no separate flag
  was needed. On failure, a single non-blocking `role="alert"` line renders
  near the top of the page (`"Couldn't save this generation's score. Your
  evaluation report is unaffected."`); on success nothing extra renders — the
  Evaluation page itself was not redesigned.

## Current Generation Exclusion

- **Retaining the id**: `PracticeSessionProvider.savedGenerationContextId`
  already existed (TASK-018) and is already the authoritative
  "current-generation" reference — no new tracking was added, per the task's
  own instruction to reuse it if already present.
- **Passing it to matching**: `app/questions/page.tsx` passes
  `savedGenerationContextId` to `EvaluationMethodDialog` (new optional prop,
  default `null` so every pre-existing call site/test that doesn't pass it
  keeps behaving exactly as before). The dialog forwards it as
  `excludeGenerationContextId` on the `findMatchingGenerationContextsAction`
  call.
- **Server-side exclusion**: `findMatchingGenerationContexts`
  (`lib/db/generation-context.ts`) gained an optional
  `excludeGenerationContextId?: string`; when present, `id: { not:
  excludeGenerationContextId }` is added to the same `where` clause as the
  existing `difficultyLevel` filter — applied by PostgreSQL, not filtered out
  in React afterward.

## TDD

Written test-first, in this order:

1. `tests/unit/persistence-validation.test.ts` (extended): `isValidScore` —
   valid 0/50/100; invalid -1, 101, 3.5, `NaN`, `"85"`, `null`, `undefined`.
2. `tests/unit/update-generation-context-score.test.ts` (new): correct
   `where`/`data` shape on success; empty id and out-of-range score both
   short-circuit without calling Prisma; a Prisma rejection (not-found or DB
   failure) returns a safe error that never leaks Prisma/Postgres text.
3. `tests/unit/update-generation-context-score-action.test.ts` (new):
   `generationContextId: null` → safe error, repository not called; forwards
   `(id, score)` to the repository on success; propagates a repository
   failure as a safe error.
4. `tests/unit/find-matching-generation-contexts.test.ts` (extended): the
   `where` clause carries `id: { not: excludeId }` only when
   `excludeGenerationContextId` is passed; a worked-example test directly
   from the task doc's §4 (A/B/C/D scenario) confirming B is the only result
   when excluding A; an all-excluded-nothing-left case returns an empty list.
5. `tests/unit/prepare-evaluation.test.ts` / `prepare-saved-evaluation.test.ts`
   (extended): both `prepareEvaluation()` and `prepareSavedEvaluation()`
   thread `generationContextId` into the returned `EvaluationData`, including
   the `null` case.
6. `tests/unit/evaluation-method-dialog.test.tsx` (extended): the
   `prepareEvaluationAction` call assertion now includes
   `generationContextId: null` by default; a new case confirms
   `excludeGenerationContextId` is forwarded to
   `findMatchingGenerationContextsAction` when the new prop is set.
7. `tests/integration/evaluation-screen.test.tsx` (extended): **added the
   missing mock for `@/lib/actions/evaluation`** (this file previously had
   none — without it, rendering `<EvaluationPage/>` with real `evaluationData`
   would have invoked the real Server Action, hitting a live database during
   `npm test`). New cases: the score persists with the correct id+score
   exactly once; no call at all when `generationContextId` is `null`; a
   failed persist shows the alert without hiding the rest of the report; a
   successful persist shows nothing extra.
8. Regression: `save-generation*.test.ts`, `load-saved-generation.test.ts`,
   `generation-context.test.ts`, `generate-questions*.test.ts`,
   `questions-screen.test.tsx`, `navigation-flow.test.tsx` all pass
   unmodified.

## Verification

- **Full tests**: `npx vitest run` → 296/296 passing (32 new/updated across
  the files above), 0 failures.
- **TypeScript**: `npx tsc --noEmit` → clean.
- **ESLint**: `npx eslint .` → clean.
- **Prisma validation**: `npx prisma validate` → schema valid. Confirmed no
  edits were made to `prisma/schema.prisma` in this task (verified by review
  of every file this task touched — the schema file was never opened for
  writing).
- **`next build`**: production build succeeds cleanly.
- **PUT score update / persistence**: verified at the unit level (mocked
  Prisma, per §2/§3 above) — real Prisma call shape (`where`/`data`)
  confirmed correct. **Not** verified against the live database with a real
  write: doing so would have overwritten the project owner's manually
  backfilled `grade` test values (`"87"`, `"93"`) on the two existing rows,
  which felt like the wrong call to make unilaterally. Recommend the owner
  run the manual walkthrough in the task's own §12 checklist
  (Generate → Save → Evaluate → check `grade` in the DB) themselves when
  convenient.
- **Current-generation exclusion**: verified at the unit level against the
  task's own worked example (§4) and via the `where`-clause assertions —
  not verified against the live database for the same reason as above (no
  destructive/mutating live-DB actions were taken without explicit request).
- **Existing saved-result matching**: `find-matching-generation-contexts.test.ts`'s
  pre-existing TASK-020 cases (exact set matching, ordering, partial-match
  exclusion) all still pass unmodified.
- **Evaluation navigation**: `questions-screen.test.tsx` (TASK-020's
  navigation-to-`/evaluation` tests) and `evaluation-screen.test.tsx`'s
  existing rendering tests all pass unmodified — navigation itself was not
  changed, only the data now carries one more field.

## Issues / Follow-ups

- ~~**Cosmetic label mismatch**: once a `GenerationContext` is scored, its
  `grade` column literally holds a number...~~ and ~~**`grade` is now
  genuinely dual-purpose**...~~ — **superseded, see "Correction" below.**
  Both bullets described consequences of writing the score into `grade`,
  which was reversed once a dedicated `score` column was added. `grade` is
  single-purpose again; neither issue applies anymore.
- Re-evaluating an already-scored saved context (via "Compare with Previous
  Generations" → select it → Evaluate) recomputes and overwrites its score
  with the freshly computed value. This is treated as intended "keep the
  score fresh" behavior, not a bug — each evaluation of a context is
  authoritative for that context's stored score.

## Correction (after initial delivery)

**The `grade`-reuse decision above was wrong, and has been reversed.** After
seeing the original implementation in practice, the user correctly identified
that writing the score into `grade` was a mistake: it silently destroyed the
real Setup-screen grade value (e.g. `"Grade 6"`) on any context once it was
evaluated, and mixed two unrelated concerns into one column. This was raised,
investigated, and fixed in a follow-up pass within the same session.

**What changed:**

- The user manually added a dedicated nullable `score integer` column to the
  live `generation_contexts` table (the same pattern as TASK-021's
  `requested_question_count`/`grade` — added directly to the database, no
  migration run by any task). Confirmed read-only via `npx prisma db pull
  --print`, and confirmed via a direct `pg_constraint` query that it carries
  no DB CHECK constraint (validated at the application layer only, via the
  existing `isValidScore`).
- `prisma/schema.prisma`: added `score Int?` to `model GenerationContext`
  (`npx prisma generate` regenerated the client; `npx prisma validate` — no
  migration created or run, per the task's constraint).
- `lib/db/generation-context.ts` `updateGenerationContextScore`: now writes
  `data: { score }` (a native integer) instead of `data: { grade:
  String(score) } }`. `grade` is untouched by this function again — it stays
  single-purpose, exactly as TASK-021 intended.
- **Bonus finding while re-verifying the schema comments around this change**:
  the CHECK-constraint note this task's own §4 (originally written during
  TASK-021) claimed for `requested_question_count`
  (`chk_generation_contexts_requested_question_count`) does not actually
  exist in the live database — confirmed via the same direct `pg_constraint`
  query. It was never verified against `pg_constraint` at the time it was
  written, only inferred from the TASK-021 task doc's prose. Corrected the
  comment in `prisma/schema.prisma` to state plainly that
  `requested_question_count`/`grade`/`score` carry no DB CHECK constraint and
  are validated at the application layer only. This does not change any
  application behavior — the app never relied on that constraint existing.
- Test updated: `tests/unit/update-generation-context-score.test.ts`'s
  "updates ... keyed by id" case now asserts `data: { score: 85 }` (a number)
  instead of `data: { grade: "85" }` (a string). No other test needed a logic
  change — everything else in the original TDD suite (§"TDD" above) tests
  behavior above the storage-column boundary.
- Documentation (`database.md`, `CLAUDE.md`, `progress.md`) updated to
  describe the real `score` column instead of the grade-reuse workaround, and
  to drop the now-cosmetic-non-issue "Grade: 85 in the export" follow-up from
  the Issues section above — it no longer applies, since `grade` is no longer
  written by the scoring flow.

**Verification after the correction**: `npx vitest run` → 296/296 passing;
`npx tsc --noEmit` / `npx eslint .` clean; `npx prisma validate` clean,
`git diff prisma/schema.prisma` limited to the `score Int?` addition and the
corrected CHECK-constraint comment. Not re-verified against a live write for
the same reason as the original delivery — no destructive/mutating live-DB
write was made without an explicit request.
