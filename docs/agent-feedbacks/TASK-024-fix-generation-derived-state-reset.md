# TASK-024 — Fix Generation Derived-State Reset

## Summary

Two manual-testing defects (from `ANALYSIS-003`), both fixed:

1. **Save button.** After Generation #1 was saved, generating a new set with the same
   configuration in the same browser session showed the static "Saved for evaluation"
   chip instead of an enabled **Save for Evaluation** button.
2. **Compare with Previous Generations.** The comparison list dropped a genuine previous
   generation. For the reported configuration the database holds **2** exact matches; the
   UI showed **1**.

Both are the **same root cause**.

## Root Cause

`PracticeSessionProvider.savedGenerationContextId` is written exactly once — after a
successful save, in `app/questions/page.tsx` `handleSaved` — and was never reset. The
provider is mounted once at the app root (`app/layout.tsx`) and lives for the whole
browser session, so the id from Generation #1 survived into Generation #2:

- `app/questions/page.tsx` computes `const saved = savedGenerationContextId !== null;` and
  renders the "Saved for evaluation" chip when `saved` is true → Generation #2 looked
  already-saved.
- `app/questions/_components/evaluation-method-dialog.tsx` passes
  `excludeGenerationContextId: savedGenerationContextId` into
  `findMatchingGenerationContextsAction`. With the stale id, the query
  (`lib/db/generation-context.ts`, `where: { id: { not: <stale id> } }`) excluded a real
  previous generation instead of the current (unsaved) one.

`evaluationData` and `comparisonData` leaked across generations the same way.

The matching algorithm itself (`findMatchingGenerationContexts`, `isExactSetMatch`,
`resolveSelectedPatternIds`, `resolveSelectedTypeCodes`) was confirmed correct by
`ANALYSIS-003` and was not touched.

## Implementation

**`app/generate/page.tsx` — `handleComplete` (the only place a new AI response enters
session state):** after storing `generationResponse` / `generationMeta` and before
navigating, it now also calls:

```ts
setSavedGenerationContextId(null);
setEvaluationData(null);
setComparisonData(null);
```

`handleComplete` early-returns on `!result || !result.ok`, and the "View Questions" button
that invokes it only renders when the generation succeeded (`isDone`). So a **failed**
generation never clears the previous completed generation's derived state (task §4). The
reset is deliberately **not** placed in `setup-form.tsx`, on `/generate` mount, or at
request start.

A new generation instance is therefore defined as "a new successful generation response",
which is the identity the app already has — no generation nonce/id system was introduced
(task §8).

## Provider Changes

`components/providers/practice-session-provider.tsx`: the type signatures of
`setEvaluationData` and `setComparisonData` were widened from `(data: X) => void` to
`(data: X | null) => void`, matching the existing `setSavedGenerationContextId`. This is a
**type-only** change — the backing `useState` slots were already `X | null`. No
`resetGenerationDerivedState()` helper was added (Option A chosen, per the user, to avoid
"multiple competing reset mechanisms" — task §5). All existing call sites pass non-null
values and still type-check.

## Matching

`findMatchingGenerationContexts`, `isExactSetMatch`, difficulty filtering, pattern-id
exact-set matching, type-code exact-set matching, the `where` clause, `lib/actions/evaluation.ts`,
`evaluation-method-dialog.tsx`, Prisma schema, and the database were **not changed**. The
stale-input bug is fixed entirely by resetting the session value that feeds
`excludeGenerationContextId`.

## TDD

Verified RED before GREEN by stashing the two source files and re-running the new tests:
the derived-state-reset test failed with
`probe-saved-id … Expected "null" … Received "gc-previous"`. With the fix applied all pass.

New / updated tests:

- **`tests/integration/generate-screen.test.tsx`** (2 new) — a `SessionProbe` component
  rendered alongside `<GeneratePage />` in one provider, seeded with
  `savedGenerationContextId: "gc-previous"`, `evaluationData`, `comparisonData`:
  - after a successful generation + "View Questions", all three are `null` and
    `generationResponse` / `generationMeta` are set;
  - after a **failed** generation, all three are unchanged and no navigation occurs.
- **`tests/integration/questions-screen.test.tsx`** (1 new) — with
  `savedGenerationContextId: null` and a config identical to an earlier saved run, the
  "Save for Evaluation" button is present (saved state tracks the instance, not the
  config). The existing `savedGenerationContextId: "gc-existing"` test remains as the
  "current generation already saved" case.
- **`tests/unit/evaluation-method-dialog.test.tsx`** (1 new) — with
  `savedGenerationContextId = null`, "Compare with Previous Generations" calls
  `findMatchingGenerationContextsAction` with `excludeGenerationContextId: null`. The
  existing `"ctx-current"` exclusion test (TASK-022) is unchanged.
- **`tests/test-utils.tsx`** — new reusable `TEST_EVALUATION_DATA` and
  `TEST_COMPARISON_DATA` fixtures (built from `evaluateGeneration` /
  `compareEvaluationResults` over the existing TEST_ fixtures).

`tests/unit/find-matching-generation-contexts.test.ts` exact-set tests and all
TASK-018/020/022/023 regression tests were left untouched.

## Manual Verification

Not performed by Claude this task (developer will verify manually — their choice). The
scenario to walk through (`ANALYSIS-003` DB state still applies: exactly two saved Easy /
Apply Distributive Property / `mc` contexts, `00448dff…` and `489e6f3d…`):

1. Setup → Simplify & Calculate / Apply Distributive Property / Easy / Multiple Choice →
   Generate #1 → Save for Evaluation → confirm.
2. Back to Setup → same four options → Generate #2 → Questions.
   - Expect: **Save for Evaluation is ENABLED** (not the "Saved for evaluation" chip).
3. Evaluate Results → Compare with Previous Generations.
   - Expect: **2 rows** while Generation #2 is unsaved.
4. Save Generation #2, then re-open the comparison.
   - Expect: chip shown on the Questions page; comparison now excludes only Generation #2
     (1 row).

## Verification (checks actually run)

| Check | Command | Result |
| --- | --- | --- |
| Targeted tests | `npx vitest run tests/integration/generate-screen.test.tsx tests/integration/questions-screen.test.tsx tests/unit/evaluation-method-dialog.test.tsx` | **30 passed** |
| RED check | same, with source files stashed | derived-state-reset test **failed** as expected |
| Full suite | `npm test` | **39 files, 331 passed** |
| TypeScript | `npx tsc --noEmit` | **clean** |
| ESLint | `npm run lint` | **clean** |
| Build | `npm run build` | **succeeded** |

## Database

No database, Prisma schema, migration, or persisted-record changes were made. This was a
session-state lifecycle bug. No DB access was needed for the fix (the ANALYSIS-003
read-only queries already established the two matching rows).

## Follow-ups

- The "unsaved current generation excludes no previous context" behaviour depends on
  `savedGenerationContextId` being `null` for a fresh generation, which the reset now
  guarantees. If a second entry path into `/questions` is ever added that bypasses
  `/generate` `handleComplete`, that reset point must be revisited.
- `evaluationData` / `comparisonData` are now cleared on every new generation. If a future
  feature wants to keep the previous generation's evaluation visible for side-by-side
  work, that would need an explicit "keep" mechanism rather than relying on the leak.
