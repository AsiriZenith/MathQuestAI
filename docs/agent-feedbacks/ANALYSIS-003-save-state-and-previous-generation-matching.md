# ANALYSIS-003 — Save-for-Evaluation Disabled State & Previous-Generation Matching

**Type:** Analysis only. No source, schema, Prisma, test, UI, or data changes were made.
**Date:** 2026-09-03
**DB inspected:** `postgresql://localhost:5432/MathQuestAI` (read-only `SELECT` via `psql`).

---

## A. Reproduction Result

**Reproduced: YES — confirmed by code trace + live database inspection.**
Claude for Chrome was **not** used (developer opted for code + DB inspection only). The
defect is deterministic and fully explained by client state; a browser run was not
needed to establish it.

The reported behaviour follows necessarily from the code:

- The Questions page decides "already saved" purely from
  `savedGenerationContextId !== null` (`app/questions/page.tsx:53`).
- `savedGenerationContextId` is written exactly once — after a successful save
  (`app/questions/page.tsx:55-58`) — and is **never reset anywhere** (verified by
  grep across `app/` and `components/`: the setter is called at
  `app/questions/page.tsx:56` and nowhere else, and never with `null`).
- The provider holding it is mounted once at the app root
  (`app/layout.tsx:16`, no props, no `key`) and lives for the whole browser session.

So: save Gen #1 → `savedGenerationContextId = "A"` → navigate to Setup → generate Gen #2
→ `savedGenerationContextId` is still `"A"` → Questions page renders the static
"Saved for evaluation" chip instead of the Save button for a generation that was never
saved.

---

## B. Current Save-State Implementation

| Concern | Location | Behaviour |
| --- | --- | --- |
| Where stored | `components/providers/practice-session-provider.tsx:66-68` | `useState<string \| null>`, initial `null` |
| Provider scope | `app/layout.tsx:16` | Mounted once at root, above the router — survives all client-side navigation; only a hard refresh re-instantiates it to `null` |
| When set | `app/questions/page.tsx:55-58` `handleSaved` | Called by `SaveForEvaluationDialog` `onSaved(result.generationContextId)` after `saveGenerationAction` returns `{ ok: true, generationContextId }` |
| The id itself | `lib/persistence/save-generation.ts` (`tx.generationContext.create` → `created.id`) | A DB primary key that does not exist until the user saves |
| When cleared | — | **Never.** No `reset()`, no effect, no caller passes `null` |
| Save button condition | `app/questions/page.tsx:53` `const saved = savedGenerationContextId !== null;` | `saved` true → chip (`:124-133`); false → button (`:135-143`); dialog also gated `open={saveDialogOpen && !saved}` (`:160`) |

There is **no** `isSaving` / `alreadySaved` / `isSaved` on the page. `isSaving` exists only
locally inside `save-for-evaluation-dialog.tsx` (`phase === "saving"`) and never reaches
the page.

**There is no in-memory "generation instance" identifier.** `GenerationContext`,
`GenerationMeta`, and `GenerationResponse` carry no id, nonce, or counter.
`savedGenerationContextId` (a DB PK, `null` until save) is the *only* thing that
identifies a generation, and two AI responses with identical config are
indistinguishable in memory once `generationResponse` is overwritten.

---

## C. Save Button Root Cause

`saved = savedGenerationContextId !== null` conflates **"a generation with this
configuration has been saved at some point this session"** with **"this exact
on-screen question set has been saved."**

- **Gen #1** works because the session starts with `savedGenerationContextId = null`,
  so the button shows; after saving, the id is set and the chip correctly shows for
  *that* generation.
- **Gen #2** breaks because nothing between "Gen #1 saved" and "Gen #2 rendered on the
  Questions page" resets the id. `handleComplete` in `app/generate/page.tsx:107-116`
  — the one place a new AI response enters session state — sets only
  `setGenerationResponse(...)` and `setGenerationMeta(...)`. It does not touch
  `savedGenerationContextId` (nor `evaluationData` / `comparisonData`).

This **violates the §15 business rule** in the brief: the button must be disabled only
for "THIS exact newly generated set is already saved," not for "a saved generation with
the same criteria exists."

---

## D. Generation State Lifecycle: `Save → Setup → Generate again → Questions`

| State | Set at | Survives Setup→Generate→Questions? | Should it? |
| --- | --- | --- | --- |
| `config` | `app/_components/setup-form.tsx:150-159` | Yes — refreshed by the new Setup pass | Yes (refreshed) |
| `generationContext` | `setup-form.tsx:149` | Yes — refreshed | Yes (refreshed) |
| `generationResponse` | `app/generate/page.tsx:109` | Yes — **overwritten** with Gen #2 | Yes (overwritten) |
| `generationMeta` | `app/generate/page.tsx:111-114` | Yes — overwritten | Yes (overwritten) |
| `savedGenerationContextId` | `app/questions/page.tsx:56` | **Yes — stale Gen #1 id carried into Gen #2** | **No — must reset to `null`** |
| `evaluationData` | `app/questions/page.tsx:42` | **Yes — stale Gen #1 evaluation carried over** | **No — should reset** |
| `comparisonData` | `app/questions/page.tsx:48` | **Yes — stale Gen #1 comparison carried over** | **No — should reset** |

Only a hard browser refresh clears any of the stale values (provider re-instantiates
with all `null`).

`setup-form.tsx` `handleGenerate` sets only `generationContext` + `config`;
`generate/page.tsx` `handleComplete` sets only `generationResponse` + `generationMeta`.
Neither clears the three stale fields above.

---

## E. Recommended Save-State Fix (do NOT implement)

**Smallest correct fix:** treat "a new generation response is stored" as the start of a
new generation instance, and reset per-generation state at that single point.

In `app/generate/page.tsx` `handleComplete` (`:107-116`), alongside
`setGenerationResponse` / `setGenerationMeta`, also:

```
setSavedGenerationContextId(null);
setEvaluationData(null);      // requires widening the setter types to accept null
setComparisonData(null);
```

`setSavedGenerationContextId` already accepts `null`
(`practice-session-provider.tsx:26`). `setEvaluationData` / `setComparisonData`
currently do not — either widen their signatures to `(data: X | null)` or add a small
`resetGenerationDerivedState()` helper on the provider that nulls all three, and call
that from `handleComplete`.

**Why `handleComplete` and not `setup-form`:** the generation instance is defined by the
AI response, not by the config selection. Resetting in `handleComplete` covers
"Regenerate" (`/questions` → `/generate`) and "Edit Setup" (`/` → `/generate`) with one
code path, and it cannot wipe state before the user has actually produced a replacement
generation.

A `key`-based provider remount or a full session `reset()` is a larger change and is not
needed for this defect.

---

## F. Database Matching Verification

**Context under test:** Subtopic `Simplify & Calculate`
(`511308b6-afd0-458f-a148-93e77f72dd84`), Pattern `Apply Distributive Property`
(`9905013b-64a0-4b44-a9d9-b2a8acbdd261`), Difficulty `Easy`, Question Type `mc`.

All `generation_contexts` rows (5 total):

| id | difficulty | pattern_ids | type_codes | created_at | score | exact match? |
| --- | --- | --- | --- | --- | --- | --- |
| `30d2179e…` | Easy | Combine Like Terms **+** Apply Distributive Property | `fib, mc` | 2026-08-29 06:32 | 87 | **No** (extra pattern + extra type) |
| `893377bc…` | Medium | Combine Like Terms + Apply Distributive Property | `fib, mc` | 2026-08-29 07:26 | 93 | **No** (wrong difficulty) |
| `b4041a04…` | Easy | Formula-Based Substitution | `mc` | 2026-08-29 11:35 | — | **No** (wrong pattern) |
| `00448dff…` | Easy | Apply Distributive Property | `mc` | 2026-09-02 15:20 | 90 | **YES** |
| `489e6f3d…` | Easy | Apply Distributive Property | `mc` | 2026-09-03 13:32 | — | **YES** |

**True number of exact matches for the test configuration: 2** —
`00448dff…` (2026-09-02, score 90) and `489e6f3d…` (2026-09-03, unscored — the most
recent, i.e. the one produced/saved during the current testing).

Both AI provider/model: `groq` / `deepseek-v4-flash`. Both have 10 generated questions.

---

## G. Previous-Generation Result Verification

**Verdict: BUG.**

There are **2** saved contexts that exactly match the test configuration. The
"Compare with Previous Generations" list showed **1**.

Whether "1" is correct depends entirely on what the current on-screen generation is:

- **If the current generation had been saved** and its own id were the one excluded,
  then `2 matches − 1 self = 1` would be correct.
- **In the reported scenario it was NOT saved** (that is the very bug in §C — the Save
  button was unavailable for Gen #2). The current generation therefore has **no DB
  row**, so nothing should be excluded and **both** matches (`00448dff…` and
  `489e6f3d…`) are legitimately "previous generations." Expected list size: **2**.

The list is filtered by `id: { not: excludeGenerationContextId }` where
`excludeGenerationContextId = savedGenerationContextId`
(`app/questions/_components/evaluation-method-dialog.tsx:130-133` →
`lib/actions/evaluation.ts:64` → `lib/db/generation-context.ts:110-112`). Because that
value is the **stale id of a previously-saved generation from earlier in the session**,
the query wrongly drops one real previous generation and returns 1 instead of 2.

Proof it is not a data problem: the SQL/JS matcher is correct and well tested
(`tests/unit/find-matching-generation-contexts.test.ts`); the two matching rows are
genuinely present in the database (§F); the only reason one is missing from the UI is the
`id: { not: <stale id> }` exclusion.

---

## H. Current-Generation Exclusion Verification

- `excludeGenerationContextId` is sourced **only** from
  `savedGenerationContextId` (`evaluation-method-dialog.tsx:133`).
- It is applied **server-side** in the Prisma `where` clause
  (`lib/db/generation-context.ts:110-112`), not filtered in React. Correct mechanism.
- **The value is wrong in the bug scenario.** After "save Gen #1 → generate Gen #2",
  it holds **Gen #1's id** while the Questions page displays the unsaved Gen #2. So the
  query excludes Gen #1 (a valid previous generation) instead of the current generation
  (Gen #2, which has no id and needs no exclusion).
- When it *is* correct: only immediately after saving the exact generation currently on
  screen, and before any further generation — then `savedGenerationContextId` legitimately
  equals the current generation's id and self-exclusion behaves as intended (TASK-022).

---

## I. Matching Pipeline Verification

```
config (difficulty) ─ toDifficultyLevel("easy") ───────────► "Easy"
config.selectedTypes/autoTypes ─ resolveSelectedTypeCodes ─► ["mc"]   (lib/persistence/matching.ts:10-20)
generationContext.patterns ─ resolveSelectedPatternIds ────► ["9905013b-…"] (matching.ts:22-30)
savedGenerationContextId ─────────────────────────────────► excludeGenerationContextId
        │
        ▼
findMatchingGenerationContextsAction   (lib/actions/evaluation.ts:49-67)
        │
        ▼
findMatchingGenerationContexts         (lib/db/generation-context.ts:100-152)
  SQL where: { difficultyLevel: "Easy", id: { not: <exclude> } }   ← only these two filters in SQL
  JS filter: isExactSetMatch(typeCodes, candidate.types)
          && isExactSetMatch(patternIds, candidate.patterns)         (matching.ts:33-37)
        │
        ▼
UI table (evaluation-method-dialog.tsx:247-286) — renders every returned row, no client filter
```

Confirmed:
- **Filter values are correct.** Pattern ids come from `generationContext.patterns`
  (not `config`), the same source `mapGeneration` uses when persisting, so the matcher
  cannot drift from stored sets.
- **Exact-set logic is correct.** `isExactSetMatch` rejects extra *and* missing
  elements (length check + subset check). Verified against §F: `30d2179e…` is correctly
  rejected (extra pattern + extra type), `b4041a04…` rejected (wrong pattern),
  `893377bc…` rejected (wrong difficulty).
- **The only defect in the pipeline is the input `excludeGenerationContextId`**, which
  carries a stale session value. No stale `config` / `autoPatterns` / `autoTypes` issue
  was found — those are refreshed every time the user passes through Setup.

---

## J. Relationship Between the Two Issues

**SAME ROOT CAUSE.**

A single stale value — `savedGenerationContextId` in `PracticeSessionProvider`, written
at `app/questions/page.tsx:56` and never reset — produces both symptoms:

1. `saved = savedGenerationContextId !== null` (`app/questions/page.tsx:53`) →
   Save button replaced by "Saved for evaluation" chip for an unsaved Gen #2.
2. `excludeGenerationContextId = savedGenerationContextId`
   (`evaluation-method-dialog.tsx:133`) → the wrong row (a real previous generation) is
   excluded from "Compare with Previous Generations," so 1 row shows instead of 2.

Fix the reset (§E) and both symptoms disappear.

---

## K. Recommended Fixes (for a future execution task)

1. **Reset per-generation state when a new AI response is stored.**
   In `app/generate/page.tsx` `handleComplete` (`:107-116`), after
   `setGenerationResponse` / `setGenerationMeta`, also clear
   `savedGenerationContextId`, `evaluationData`, `comparisonData` to `null`.
2. **Provider support for the reset.** Either widen `setEvaluationData` /
   `setComparisonData` to accept `null` (`practice-session-provider.tsx:23,29`), or add
   `resetGenerationDerivedState()` to the provider that nulls all three and call it from
   `handleComplete`.
3. **No change to matching logic, SQL, schema, or `isExactSetMatch`.** They are correct.
4. **Optional hardening (not required):** on the Questions page, only honour
   `savedGenerationContextId` when it belongs to the generation currently in
   `generationResponse`. With fix #1 in place this is redundant, so keep it out unless a
   second entry path to `/questions` is added later.

---

## L. Minimum Tests to Recommend (do NOT implement now)

- **Unit / provider:** after `setGenerationResponse` for a second generation,
  `savedGenerationContextId`, `evaluationData`, `comparisonData` are all `null`.
- **Integration (`tests/integration/questions-screen.test.tsx`):**
  save Gen #1 → simulate a new `generationResponse` → the "Save for Evaluation" button
  is rendered again (chip is gone).
- **Integration:** with two exact-matching saved contexts in the mocked DB and a
  current *unsaved* generation, `findMatchingGenerationContextsAction` returns **2**
  rows (no exclusion). With the current generation saved, it returns **1** (self
  excluded).
- **Unit (already covered, keep):** `isExactSetMatch` extra/missing element rejection.
- **Regression:** saving Gen #2 after the reset correctly disables its own Save button
  and self-excludes only Gen #2 from comparison.

---

## M. Final Classification

**BUG CONFIRMED — BOTH.**

- **Save state:** `savedGenerationContextId` is session-scoped and never reset when a
  new generation is produced, so the Save button is wrongly suppressed for every
  generation after the first save in a session. Violates the §15 business rule.
  Root cause: missing reset in `app/generate/page.tsx` `handleComplete`.
- **Matching:** the database contains **2** exact matches for the test configuration
  (`00448dff…`, `489e6f3d…`); the UI showed **1**. Because `excludeGenerationContextId`
  is fed the same stale `savedGenerationContextId`, the comparison query excludes a
  genuine previous generation rather than the current (unsaved) one. The matching
  algorithm, SQL, and exact-set comparison are themselves correct — the bug is the
  stale input value.

Both are the same root cause and are fixed by the single reset described in §E / §K.
