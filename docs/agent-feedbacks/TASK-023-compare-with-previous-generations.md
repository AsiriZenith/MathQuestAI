# TASK-023 — Implement Compare with Previous Generations

## Summary

Implemented a real "Compare with Previous Generations" feature per ANALYSIS-001's recommended architecture (Option 3). TASK-020's behavior — selecting a previous generation and evaluating only that one — is replaced with: evaluate **both** the current and the selected previous generation independently, diff their results, and show the comparison on a new dedicated `/comparison` route. The existing `/evaluation` page, its data contract (`EvaluationData`), and `evaluateGeneration()` itself are completely unchanged.

## Architecture

Followed ANALYSIS-001's Option 3 exactly: a dedicated Comparison page/route, reusing existing single-result components as building blocks, with only genuinely comparison-specific pieces built new. Rejected extending `/evaluation` in place (Option 1) for the same reason the analysis gave — it would mean either branching the page's ~13-component render tree on a mode flag, or redesigning `EvaluationData` to hold two results, breaking a contract every existing flow (predefined evaluation, and now the comparison's own internal calls) depends on being singular.

The key reuse insight, confirmed while implementing: `prepareEvaluation()` and `prepareSavedEvaluation()` (`lib/evaluation/prepare-evaluation.ts`) already do exactly "evaluate one dataset, bundle it with its id, return `EvaluationData`." A comparison is just calling both, unmodified, once each — `lib/evaluation/prepare-comparison.ts`'s `prepareComparison()` is essentially a 15-line composition of two existing functions plus the new diff function.

## Evaluation

Both sides are evaluated through the exact same, unmodified `evaluateGeneration()` — no new evaluation logic, no dimension calculator touched, no scoring weight changed:

- **Current**: `prepareEvaluation({ method: "predefined", ...liveSessionData, generationContextId: currentGenerationContextId })` — uses live in-memory session data (config/generationContext/generationResponse/prompt/requestedQuestionCount already available as props on the dialog), exactly like the existing "Evaluate Against Predefined Questions" path. No save is required first.
- **Previous**: `prepareSavedEvaluation(previousGenerationContextId)` — the exact function TASK-020 already used, unchanged. It calls `loadSavedGeneration()` internally, whose return shape (`LoadedSavedGeneration`) **does not expose the stored `score` column at all** — so a stale historical score can never be used as comparison input even by accident, not just by convention.

Both calls happen inside `prepareComparison()` (`lib/evaluation/prepare-comparison.ts`), which does no I/O of its own beyond calling these two existing functions and the new pure diff function — no DB access, no persistence, no navigation.

## Comparison

New pure function `compareEvaluationResults(current, previous)` (`lib/evaluation/compare-evaluations.ts`), TDD, zero I/O:

- `overallScore: { current, previous, difference }` from `promptEffectiveness` — `difference = current - previous`, per the task's own convention (+8 = current higher, -8 = current lower, 0 = equal).
- `dimensions: DimensionComparison[]` — one entry per the 6 fixed dimension ids (`count_adherence`, `output_integrity`, `type_adherence`, `pattern_adherence`, `difficulty_alignment`, `reference_alignment`), each with `current`/`previous`/`difference`. **`difference` is only computed when both sides' `.score` are non-null** — a dimension that's N/A on either side produces `difference: null`, never a fabricated 0.

**Deliberately not diffed** (documented per the task's own "if a metric can't be compared meaningfully, document that" instruction): `patternCoverage`, `typeCoverage`, `difficulty` (signals), `integrityChecks`, `referenceAlignment`, `deviations`. These are structured reports (entry lists, per-pattern breakdowns, copy-risk flags), not single numbers — the evaluation engine defines no delta semantic for them, and inventing one would mean inventing a new metric the engine doesn't actually produce. Instead, both sides' full reports are shown side by side, unchanged, reusing the existing single-result components once per side (see "Reused Components").

## Persistence

Each side's score persists **independently**, via the existing, completely unchanged `updateGenerationContextScoreAction` — no new persistence mechanism, no comparison-specific table or entity:

- Current: persisted only if `comparisonData.current.generationContextId` is non-null (mirrors TASK-022's exact behavior — silently skipped when the current generation hasn't been saved).
- Previous: always persisted (a previous generation is only selectable because it's already saved, so it always has an id).

Both calls happen in a single `useEffect` on `/comparison`, ref-guarded to fire once per mount (mirrors `/evaluation`'s existing pattern exactly). A failure on either side shows one non-blocking `role="alert"` notice without hiding the comparison itself — the comparison is still fully useful even if persistence fails, since it was computed successfully.

The comparison result itself (the diff) is **not persisted** — it's derived, recomputable state, held only in `PracticeSessionProvider.comparisonData` for the current browser session, consistent with the task's explicit "no comparison entity, no comparison tables" instruction.

## Navigation

TASK-020's flow (`select previous → prepareSavedEvaluationAction → /evaluation`) is replaced with (`select previous → prepareComparisonAction → /comparison`):

- `app/questions/_components/evaluation-method-dialog.tsx`: `handleContinueSaved` now calls `prepareComparisonAction` and, on success, calls a new `onComparisonPrepared` prop instead of `onPrepared`. The predefined-method path (`handleProceed`, "Evaluate Against Predefined Questions") is **completely untouched** — still calls `prepareEvaluationAction` and `onPrepared`, still lands on `/evaluation`.
- `app/questions/page.tsx`: new `handleComparisonPrepared` stores the result in `comparisonData` and pushes `/comparison`. `handleEvaluationPrepared`/`/evaluation` navigation is untouched.
- Copy fix while touching this code: the saved-list phase's button now says "Compare" (was "Evaluate") and its loading text says "Preparing Comparison…" — since that's what's actually happening now, directly resolving the label/behavior mismatch ANALYSIS-001 flagged.
- **Removed `prepareSavedEvaluationAction`** (the server action, not the underlying `prepareSavedEvaluation` function) as dead code — after this change, nothing in the UI calls it anymore. The underlying function stays fully alive, now called from inside `prepareComparison`.

TASK-020's picker mechanics (exact difficulty/pattern/type matching, TASK-022's current-generation exclusion, radio single-select, empty-state) are **entirely unchanged** — only what "Compare" does after a row is selected changed.

## Reused Components

- `prepareEvaluation`, `prepareSavedEvaluation` (`lib/evaluation/prepare-evaluation.ts`) — unmodified, called once each per comparison.
- `evaluateGeneration()` and every dimension calculator — unmodified, called transitively (once per side) by the two functions above.
- `loadSavedGeneration()`, `getGenerationContext()` — unmodified.
- `updateGenerationContextScoreAction` / `updateGenerationContextScore` — unmodified, called twice per comparison (once per side).
- `findMatchingGenerationContexts` and the TASK-020 picker dialog's selection mechanics — unmodified.
- Presentational components from `app/evaluation/_components/`, reused **unmodified**, rendered once per side inside the new `ComparisonSide` component: `CoverageCard` (×2 — pattern and type), `DifficultyAssessment`, `OutputIntegrityCard`, `ReferenceAlignmentCard`, `DeviationTable`.
- `MeterBar`/`toneForScore` color conventions (`components/common/meter-bar.tsx`) informed the new delta-badge coloring (emerald/rose/muted) for visual consistency with the rest of the app, though not directly imported.

## New Components

All under `app/comparison/`:

- `page.tsx` — the route: redirect-if-empty (mirrors `/evaluation`), the two independent score-persist effects, overall page layout.
- `_components/delta-badge.tsx` — the `+N`/`-N`/`0`/`N/A` indicator, colored by sign; used for both the overall score and every dimension row.
- `_components/comparison-header.tsx` — current vs. previous subtopic/difficulty/score summary plus the overall delta badge.
- `_components/dimension-comparison-table.tsx` — the current/previous/difference table for the 6 comparable dimensions.
- `_components/comparison-side.tsx` — thin wrapper rendering one side's reused single-result components (see above), labeled "Current Generation" / "Previous Generation".

## TDD

Written test-first, in this order:

1. `tests/unit/compare-evaluations.test.ts` — the task's own three overall-score examples (84/76/+8, 70/78/-8, 80/80/0); per-dimension delta correctness across mismatched dimension sets; a dimension null on one side → `difference: null`, never fabricated as 0; label passthrough.
2. `tests/unit/prepare-comparison.test.ts` — mocks `prepareEvaluation`/`prepareSavedEvaluation`/`compareEvaluationResults`: current is evaluated with `method: "predefined"` and its own id; previous is loaded via `prepareSavedEvaluation`; the two fresh `.result`s (not stored scores) are compared; a current-side failure short-circuits before evaluating the previous side (a deliberate ordering choice, documented here since the task left it open); a previous-side failure propagates; a `null` current id is passed through correctly (current generation not yet saved).
3. `tests/unit/prepare-comparison-action.test.ts` — missing session fields / missing `previousGenerationContextId` → safe error, `prepareComparison` never called; forwards the right shape on success.
4. `tests/unit/evaluation-method-dialog.test.tsx` (extended) — the saved-list "Compare" button calls `prepareComparisonAction` with both ids and fires `onComparisonPrepared` (not `onPrepared`) on success; a failure shows the error and keeps the saved-list visible; existing predefined-path tests (`prepareEvaluationAction`, `onPrepared`) pass unmodified.
5. `tests/integration/questions-screen.test.tsx` (extended) — selecting a saved result and clicking Compare navigates to `/comparison` (asserted `push` was **not** called with `/evaluation`); existing predefined-path→`/evaluation` test passes unmodified.
6. `tests/integration/comparison-screen.test.tsx` (new) — both sides labeled clearly; both scores visible; the overall difference shown without the reader doing arithmetic; every comparable dimension's label rendered; both sides' scores persist independently (current skipped when its id is null); a persistence failure shows the alert without hiding the comparison; success shows nothing extra. Needed a mock for `@/lib/actions/evaluation` (this file had none before — without it, `updateGenerationContextScoreAction` would run for real against a live DB during `npm test`, the same class of gap TASK-022 fixed for `evaluation-screen.test.tsx`).
7. `tests/integration/navigation-flow.test.tsx` (extended) — `/comparison` redirects to `/` when there's no `comparisonData`, mirroring `/evaluation`'s existing case.
8. `tests/test-utils.tsx` (extended) — `renderWithSession` accepts `comparisonData`.
9. Regression: `save-generation*.test.ts`, `load-saved-generation.test.ts`, `find-matching-generation-contexts.test.ts`, `prepare-evaluation.test.ts`, `prepare-saved-evaluation.test.ts`, `update-generation-context-score*.test.ts`, `evaluation-screen.test.tsx` all pass unmodified — none of their behavior changed.

## Verification

- **Unit tests**: `npx vitest run` → 327/327 passing (31 new/updated across the files above), 0 failures.
- **Relevant test suites**: all of the above ran as part of the same full-suite run; no test file was skipped or run in isolation for the final check.
- **TypeScript**: `npx tsc --noEmit` → clean.
- **ESLint**: `npx eslint .` → clean.
- **Prisma validation**: `npx prisma validate` → schema valid; no edits were made to `prisma/schema.prisma` at any point in this task (verified by review — no `score`/new-column work was needed, TASK-022 already added `score`).
- **`next build`**: production build succeeds; `/comparison` appears in the route list as a static page alongside `/evaluation`.
- **Manual walkthrough**: not performed in this session (would require a live DB with matching saved generations and a running dev server) — recommend the developer run the task's own §29 walkthrough (Generate → Save → Evaluate Results → Compare with Previous Generations → select → Comparison page → both scores + delta visible → current generation still excluded from its own candidate list → "Evaluate Against Predefined Questions" still lands on the unchanged `/evaluation` page) before considering this fully verified end-to-end.

## Issues / Follow-ups

- **AI provider/model transparency (task §16) was not implemented.** `EvaluationData` doesn't carry `aiProvider`/`aiModel` at all (only the persisted `MatchingGenerationContext` row does, from the picker table) — displaying them on the Comparison page would require extending `EvaluationData`, `prepareEvaluation`, or `loadSavedGeneration`'s output, which risks touching the stable, singular `EvaluationData` contract the task explicitly said must stay untouched. Deferred; the Comparison page currently shows subtopic/difficulty/score per side instead.
- **Optional picker enhancement deferred** (task §15 explicitly permits this): the TASK-020 picker table still doesn't surface `score`/`grade`/`requestedQuestionCount` for candidate selection. Adding it would touch `MatchingGenerationContext`'s select clause and the picker table UI — a small, separable, low-risk addition, but kept out of scope to avoid expanding this already-large task's surface area, per the task's own explicit permission to defer it.
- **`prepareComparison`'s current-failure-short-circuits-before-previous ordering** was a judgment call (the task didn't specify sequencing). Chosen for simplicity and to avoid an unnecessary `loadSavedGeneration` call when the current side already failed; documented in the `prepare-comparison.test.ts` test names and here rather than left implicit.
- **No manual browser verification was performed** (see Verification above) — the implementation is verified by automated tests and a successful production build only.
