# ANALYSIS-001 — Compare with Previous Generations: Evaluation Flow Analysis (Findings)

This is the completed analysis for `docs/analyze/ANALYSIS-001-compare-with-previous-generations.md`. **Analysis only — no code, schema, or test changes were made.** No implementation task has been created; that is explicitly deferred to a future, separate task per the source document's own instructions.

The analysis below is grounded in direct source verification (not assumption) — much of the referenced code was built across TASK-018 through TASK-022 in the same working session, cross-checked directly against `lib/evaluation/types.ts` and `components/providers/practice-session-provider.tsx` while writing this document.

---

## A. Current Implementation (what TASK-020 does today)

`app/questions/_components/evaluation-method-dialog.tsx`'s "Compare with Previous Generations" button (`handleFindSaved`) calls `findMatchingGenerationContextsAction` → `findMatchingGenerationContexts` (`lib/db/generation-context.ts`), which finds saved `generation_contexts` rows matching the *current* selection **exactly** on:

- `difficultyLevel`
- the full `questionPatternIds` set (order-independent, no partial matches)
- the full `questionTypeCodes` set (order-independent, no partial matches)

and **excludes** the current generation's own id (`excludeGenerationContextId`, TASK-022 — server-side `id: { not: ... }`, not filtered in React). Matches are shown in a table (`MatchingGenerationContext[]`: `id`, `name`, `patterns[]`, `questionTypes[]`, `aiProvider`, `aiModel`, `difficultyLevel` — **not** `score`, `grade`, or `requestedQuestionCount`; those columns exist on `GenerationContext` but are not selected/returned by this function today) with single radio-button selection.

On "Evaluate", `prepareSavedEvaluationAction({ generationContextId: selectedId })` → `prepareSavedEvaluation(generationContextId)` (`lib/evaluation/prepare-evaluation.ts`) runs:

```
loadSavedGeneration(id)        // lib/db/generation-context.ts — reconstructs
                                // { context, config, generationResponse, prompt,
                                //   requestedQuestionCount } for THAT id only
      ↓
evaluateGeneration({ config, generationContext, generationResponse,
                      prompt, requestedQuestionCount })   // same pure fn as "predefined"
      ↓
EvaluationData { method: "saved", ..., result, generationContextId: id }
```

**This is answered precisely: today, "Compare with Previous Generations" evaluates only the selected previous generation. The current generation is never loaded, never evaluated, and never appears anywhere in the output.** This is exactly **Option A** from the source document (§4) — technically a reuse of the evaluation feature, not a comparison. The word "Compare" in the button's own label and its own description text ("Compare the current generated questions with questions generated in previous sessions") does not match what the code does.

## B. Existing Evaluation Flow

`app/evaluation/page.tsx` reads **one** `evaluationData` object from `usePracticeSession()` (React context, `components/providers/practice-session-provider.tsx` — confirmed: `evaluationData: EvaluationData | null`, a single slot, no plural/array). If null, it redirects to `/`. It renders a fixed pipeline of ~13 child components, **every one of which takes a single-result-shaped prop**:

`PromptEffectivenessHero(score, band, explanation)`, `ScoreBreakdown(dimensions)`, `AskedVsReceived(configuration, patternCoverage, typeCoverage)`, `RequirementMatrix(dimensions, configuration)`, `CoverageCard(report)` ×2, `DifficultyAssessment(signals)`, `OutputIntegrityCard(checks)`, `ReferenceAlignmentCard(report)`, `DeviationTable(deviations)`, `StrengthsCard/ImprovementsList`, `PromptInspector(trace)`, `ExportActions(result)`.

Since TASK-022, the page also has a `useEffect` (ref-guarded, fires once per mount) that calls `updateGenerationContextScoreAction({ generationContextId: evaluationData.generationContextId, score: evaluationData.result.promptEffectiveness })` — persists **one** score onto **one** `GenerationContext.score` column, skipped entirely when `generationContextId` is `null` (current generation not yet saved).

**Evaluation itself performs no AI call at all** — `evaluateGeneration()` (`lib/evaluation/evaluate-generation.ts`) is a pure, deterministic function (six dimension calculators, all counting/set-membership/proxy-heuristic based) over one `{config, generationContext, generationResponse, prompt, requestedQuestionCount}` tuple. This is a **deliberate, documented project decision** (`progress.md`, TASK-014: "the evaluation is deterministic by deliberate choice... reproducibility is the point"), not a gap. **This directly resolves §13 of the source document: there is no "AI evaluation model" in this application at all** — "AI provider/model" only ever refers to the model that *generated* the questions being evaluated, never a judge/evaluator model. Framing comparison around "same AI evaluation model" is based on a premise that doesn't hold; the real question is only about the *generation* provider/model of the two datasets (addressed in F/§13 below).

**Can the existing pipeline evaluate two generations simultaneously? No.** Every type (`EvaluationData`, `EvaluationResult`, the ~13 components) is singular by construction. There is no "second result" slot anywhere in the type system, the provider, or the page.

## C. Reusable Features (verified, not assumed)

| Feature | Reuse as-is? | Why |
|---|---|---|
| `evaluateGeneration()` | **Yes, unmodified** | Pure function over one dataset — call it twice (once per side) for a comparison; it has no per-call state or side effects to conflict with a second invocation. |
| Individual dimension calculators (`evaluateCountAdherence`, `evaluateTypeAdherence`, etc.) | **Yes, unmodified** | Same reason — pure, single-dataset, already composed inside `evaluateGeneration`. |
| `loadSavedGeneration()` / `getGenerationContext()` | **Yes, unmodified** | Already load exactly one dataset by id — call once per side. |
| `updateGenerationContextScoreAction` | **Yes, unmodified** | Already persists one score for one id — call once per side, independently, exactly as it does today. |
| Presentational components with a single-result-shaped prop (`CoverageCard`, dimension rows, etc.) | **Partially — as building blocks, rendered twice or fed into new comparison components** | Their prop shapes already match "one dataset's worth of X" — reusable inside a two-column or delta layout, but the *page* that currently assembles them for one result cannot be reused unmodified for two (see D). |
| `findMatchingGenerationContexts` / the TASK-020 picker table/dialog | **Yes, largely unmodified** | The selection step (find candidates, exact-match filter, exclude self, radio-select) is orthogonal to what happens *after* selection — this doesn't need to change for comparison, only what "Evaluate" does with the selection changes. |
| Score/grade/requestedQuestionCount persistence semantics (TASK-021/022) | **Yes, unmodified** | Both sides of a comparison are ordinary, independently-saved `GenerationContext`s; nothing about comparison changes what a "save" or "score" means for either one individually. |

## D. Features That Need Modification

- **`EvaluationMethod`** (`lib/types.ts`, currently `"predefined" | "saved"`) — needs a third path, or the "saved" method needs to be repurposed, to represent "evaluate-for-comparison" rather than "evaluate this one saved thing and land on the single-result page."
- **`prepareSavedEvaluationAction`'s destination** — today it returns one `EvaluationData` and the dialog navigates to `/evaluation`. For comparison, selecting a previous generation must not throw away the current generation's own data; both need to reach wherever the comparison is rendered.
- **A new "both sides" data shape** — nothing today holds "current EvaluationResult + previous EvaluationResult" together. This is new, not a modification of `EvaluationData` (which must stay singular for the still-needed non-comparison flows — see E).
- **A new pure diff/comparison computation** — nothing today computes a delta between two `EvaluationResult`s. `evaluateGeneration()` itself does not need to change to support this (see H); a comparison is a *new, separate* pure function over two of its outputs.

## E. Features That Should Remain Unchanged

- `evaluateGeneration()` and every dimension calculator — zero changes; comparison consumes their existing outputs, doesn't alter their logic ("do not invent a new scoring algorithm" applies here by extension).
- The **existing, single-result Evaluation page and route (`/evaluation`)** — the "predefined" method (Evaluate Against Predefined Questions) has nothing to do with comparison and must keep working exactly as today; this page should not be turned into a dual-mode component (see F, Option 1 rejection).
- `updateGenerationContextScoreAction` / `updateGenerationContextScore` — unchanged; still "persist one score for one id," called independently for whichever side(s) have a real id.
- TASK-020's matching/exclusion logic (`findMatchingGenerationContexts`) and its picker dialog's core selection mechanics (radio, single-select, empty state) — unchanged; only what happens after "Evaluate" is clicked changes.
- The GenerationContext/GeneratedQuestions persistence model — no schema implications at all (see G).

## F. Comparison Architecture Options

**Option 1 — Extend the existing Evaluation page in place.** Would require either branching its entire ~13-component render tree on a "comparison mode" flag (duplicating most of the page's JSX conditionally) or redesigning `EvaluationData` to optionally hold two results (breaking the type every existing consumer — predefined flow, the current "saved" flow, all their tests — assumes is singular). High complexity, high regression risk to a page with substantial existing test coverage (`evaluation-screen.test.tsx`, `navigation-flow.test.tsx`) and zero architectural precedent for "sometimes two." **Not recommended.**

**Option 2 — Dedicated Comparison page.** New route (e.g. `/compare`), new `PracticeSessionProvider` state slot (e.g. `comparisonData`, alongside — not replacing — `evaluationData`), builds its own two-column/delta layout. The existing Evaluation page and its data contract are untouched, so its own tests and the "predefined" flow carry zero regression risk. Some duplication of small presentational pieces unless factored out. Moderate, but *isolated and additive* complexity — the risk stays contained to new code, not modifications to trusted existing code.

**Option 3 — Shared single-result components + dedicated comparison orchestration.** The refinement of Option 2: several existing presentational components already take a clean, single-dataset-shaped prop (`CoverageCard`, dimension rows) and can be reused *as building blocks* inside the new comparison page (rendered per-side, or feeding a new delta component) — without touching the existing Evaluation page that currently assembles them. Only genuinely comparison-specific pieces (delta rows, current-vs-previous framing, an at-a-glance "which is better" indicator) are new.

**Recommended: Option 3.** It is Option 2 with maximum reuse rather than a from-scratch build, avoiding both Option 1's regression risk to trusted existing code and unnecessary duplication.

## G. Data Requirements

**No new database schema, columns, or tables are required.** Everything needed (both `GenerationContext`s and their `GeneratedQuestions`) is already loadable via existing functions (`loadSavedGeneration`, live session state for the current generation).

Two **optional, separable** additions worth flagging (neither is a comparison-blocker):

1. **The TASK-020 picker table currently doesn't show `score`/`grade`/`requestedQuestionCount`** (confirmed — `MatchingGenerationContext` selects `id, name, difficultyLevel, aiProvider, aiModel, patterns, questionTypes` only, even though all three columns exist on `GenerationContext` since TASK-021/022). A user picking a comparison candidate today has no visibility into whether it was already evaluated, or what its original requested count was. This is a UI/select-clause-only change (no schema change) — could be bundled into the comparison task or split out.
2. **A new session-state slot** to carry two prepared results to wherever comparison is rendered (Option 3's `comparisonData` on `PracticeSessionProvider`) — application state, not persisted data.

## H. Evaluation Requirements

`evaluateGeneration()` needs **zero changes**. It is called twice — once per side, unmodified, exactly as it's called once today. The only new evaluation-adjacent code is a **new, separate pure function** (e.g. `compareEvaluationResults(current: EvaluationResult, previous: EvaluationResult)`) that consumes two already-computed `EvaluationResult`s and derives deltas — it does not touch `evaluate-generation.ts`, its dimension weights, or its scoring math. This cleanly satisfies "do not invent a new scoring algorithm" — a comparison is a *presentation/analysis layer over two independent, unmodified evaluation runs*, not a new algorithm.

## I. Recommended UX

```
Questions Page
      ↓
Evaluate Results
      ↓
Compare with Previous Generations
      ↓
(existing TASK-020 picker — unchanged mechanics, optionally showing score/grade/count)
      ↓
Select one previous generation → Evaluate
      ↓
NEW: Comparison page (not /evaluation)
      ↓
Evaluate CURRENT (live session data, fresh) + Evaluate PREVIOUS (loadSavedGeneration, fresh)
   — both via the unmodified evaluateGeneration(), always re-run fresh, never trusting a stale
     stored `score` for either side (see §12 reasoning below)
      ↓
Persist each side's score independently via the existing updateGenerationContextScoreAction
   — current: only if it already has a generationContextId (skip silently otherwise, mirroring
     today's TASK-022 behavior); previous: always has one by definition
      ↓
Render: individual scores/dimensions for both (Option B), PLUS explicit per-dimension/coverage
   deltas (Option C) — Option C is a strict superset of B and better serves the app's stated
   "understand what to change in the prompt" research goal (CLAUDE.md §1, §4)
```

This directly answers §4: **recommend Option C (direct comparison with explicit metrics), not A (current code) or B alone** — B's "two separate reports" leaves the researcher to do the diffing by eye, when the explicit numbers are already sitting right there in two `EvaluationResult`s.

### Current-vs-previous specifics (§8, §9, §10, §11, §12, §13 — answered)

- **§8 — must the current generation already be saved?** No. It can be evaluated from live session data the same way the "predefined" method already does today, without requiring a prior save. Only *persisting* its score requires a real id (already how TASK-022 behaves — silently skips persistence when there's none).
- **§9 — fairness filters**, one by one:
  - `DifficultyLevel` exact match — **Required** (already enforced by TASK-020; unchanged).
  - `QuestionPatternIds` exact set — **Required** (already enforced; unchanged).
  - `QuestionTypes` exact set — **Required** (already enforced; unchanged).
  - Reference questions — **Not appropriate as a separate filter**: they're derived automatically from difficulty+patterns (`getGenerationContext` → `question_generation_requests`/`reference_questions`), so once difficulty+patterns match exactly, the reference set is *already* identical by construction — nothing new to check.
  - `requestedQuestionCount` — **Optional**: not required for eligibility (already not filtered on by TASK-020), but worth *displaying* for both sides since interpreting side-by-side percentages is easier with equal N, even though percentages remain individually valid regardless.
  - `grade` — **Not appropriate as a required filter today**: `grade` is currently a hard-coded constant (`"Grade 6"`, `app/_components/setup-form.tsx` — confirmed in TASK-021/022 work), so it never actually varies between any two generations in this app today; a filter on it would be a no-op. Worth revisiting *only if* the Setup screen's grade ever becomes real/user-selectable.
  - Same "AI evaluation criteria" — **Always true, automatically**: both sides run through the exact same, single, unmodified `evaluateGeneration()` — there is no possibility of the two sides using different criteria within one comparison run (see the score-reuse note in §12 for the *cross-time* version of this concern).
  - Same AI provider/model (generation, not evaluation — see §13) — **Optional, informational only**; reasoning below.
  - Same generated-question count (actual, not requested) — **Not appropriate to require equal**: the AI returning fewer/more than requested is itself part of what's being evaluated (the count-adherence dimension), not a pre-condition for eligibility.
- **§10 — requestedQuestionCount mismatch (e.g. current requested=10/generated=10, previous requested=10/generated=8)**: **remain eligible, shown with the existing per-side deviation signal** (each side's own count-adherence dimension already surfaces this — "8/10" — nothing new needs computing). Do **not** exclude, and do **not** normalize/rescale scores to compensate — that would misrepresent what the AI actually produced, which is precisely what's being measured.
- **§11 — grade mismatch**: **allowed, not excluded, no special warning needed today** — since it's currently a fixed constant, there is no realistic case where it varies. If the Setup screen's grade ever becomes real, this should be revisited (display it for transparency; still probably not a hard filter, since comparing prompt effectiveness across grade levels could itself be a legitimate research question).
- **§12 — existing `score` handling**: **always re-evaluate both sides fresh; never reuse a stored `score` as the comparison's source of truth.** Reasoning: `evaluateGeneration()`'s dimension logic can change over time (it's actively iterated on, per the project's own research-loop framing); a `score` stored months ago used whatever criteria existed *then*. Comparing a stale stored number against a freshly computed one for the other side risks comparing under two different rulesets, undermining the entire point of a fair comparison. The stored `score` remains useful as *informational* context (e.g., shown in the picker table per G/§9) but is never the comparison's actual input — `evaluateGeneration()` is always re-run for both sides at comparison time, and each side's freshly computed score is what gets (re-)persisted afterward via the unchanged `updateGenerationContextScoreAction`.
- **§13 — AI provider/model**: **Optional/informational — not required to match.** Two reasons, both traceable to the actual project: (1) there is no "AI evaluation model" at all (§B) — this question can only be about the *generation* provider/model, and (2) `CLAUDE.md` §1/§4 states the project's research focus explicitly and unambiguously: *"the main research focus is not simply generating questions... understanding how the quality of the provided context and prompts affects the generated results"* — a **content-quality comparison**, not a model-performance benchmark. Recommend: show both sides' provider/model for transparency, do not gate or warn on a mismatch. (Practically, since the provider/model is a single env-var-driven, non-per-generation setting, most real comparisons within one deployment will share the same values anyway.)

## J. Open Questions (need product/user sign-off before an implementation task is written)

1. Confirm **Option C** (explicit side-by-side + per-dimension deltas) is wanted over the simpler **Option B** (two independent reports, no computed deltas) — B is materially less new code if the team wants to ship something narrower first.
2. Confirm a **dedicated Comparison page/route** (Option 2/3) rather than reusing `/evaluation` — this adds a route/nav surface to the app; worth explicit sign-off since it's a real architectural addition, not just an internal refactor.
3. Confirm the **"always re-evaluate both sides fresh, never trust a stored `score`"** policy (§12) — this is a strong recommendation grounded in the project's own reproducibility principle, but it does mean a comparison always costs two fresh evaluation runs, never an instant "reuse what's already there."
4. Confirm **grade/requestedQuestionCount/provider-model mismatches are allowed-with-display, not excluded/blocked** (recommended throughout §9–§13, but each is ultimately a product call).
5. Confirm **comparison results are not persisted** as their own artifact (recommended — see K) — meaning a comparison must be re-run each time the user wants to see it again; only each side's individual `score` persists, as it already does today.
6. Confirm whether the **TASK-020 picker table should be widened** to show `score`/`grade`/`requestedQuestionCount` (G, item 1) — recommended, but small enough to be its own separable sub-task rather than bundled.
7. Confirm scope is **exactly one-vs-one** (current vs. a single selected previous generation) — both the source document's own examples and TASK-020's radio-button single-select imply this; flagging it as the assumed scope rather than silently assuming multi-way comparison is out of scope.

## K. Recommended Next Task

A future implementation task (e.g. TASK-023) scoped to:

1. **New pure comparison function** (e.g. `lib/evaluation/compare-evaluations.ts` or a new `lib/comparison/`), TDD-first — takes two `EvaluationResult`s, returns per-dimension/coverage/score deltas. Zero changes to `evaluate-generation.ts` or any dimension calculator.
2. **New dedicated Comparison route/page** + a new `PracticeSessionProvider` state slot to carry "current result + previous result" there. The existing `/evaluation` route, its components, and `EvaluationData` stay untouched for the still-needed "predefined" flow.
3. **Repurpose the "saved" evaluation method's destination**: instead of `prepareSavedEvaluationAction` landing on `/evaluation` as it does today (Option A behavior), the TASK-020 picker's "Evaluate" action should evaluate *both* current and selected-previous and route to the new Comparison page. (This is a real behavior change to an existing, working, tested flow — call this out explicitly in that task's own plan, and decide whether the current single-result "saved" path should be kept as an alternate/fallback or fully replaced.)
4. **Reuse** existing single-result presentational components as per-side building blocks inside the new page (Option 3); build only genuinely new comparison-specific components (delta rows, current-vs-previous framing).
5. **Persistence**: each side's score persists independently via the existing, unmodified `updateGenerationContextScoreAction` — no new persistence for the comparison artifact itself.
6. **Optional, separable**: widen the TASK-020 picker's `MatchingGenerationContext`/`findMatchingGenerationContexts` select clause to surface `score`/`grade`/`requestedQuestionCount` (no schema change — the columns already exist).
7. **Test coverage to plan for** (not written now, per this analysis's own scope): unit tests for the new pure comparison/diff function (straightforward TDD candidate); tests for the new page's "evaluate both, fresh, persist independently" data-loading flow; explicit regression tests confirming the existing single-result Evaluation page/flow (predefined method) is unaffected; a decision-dependent test for whichever choice is made in item 3 above (repurposed vs. kept-as-alternate "saved" path).

---

## Final Decision Goal — direct answers (source document §20)

1. **What does "Compare" actually mean here?** Today: nothing — it silently means "evaluate only the previous one" (Option A), which contradicts its own label. Recommended: Option C, an explicit current-vs-previous evaluation with computed deltas.
2. **Can the current Evaluation page support it cleanly?** No — verified via its component tree and the singular `EvaluationData` type; extending it in place would mean invasive branching or breaking an established single-result contract every other flow depends on.
3. **Should we introduce a dedicated comparison experience?** Yes — a new page/route (Option 3: dedicated orchestration + reused single-result building-block components).
4. **Which existing Evaluation features should remain?** `evaluateGeneration()` and all dimension logic (unmodified, called twice), `updateGenerationContextScoreAction` (unmodified, called once per side), the existing `/evaluation` route and its data contract for the "predefined" flow, TASK-020's picker/matching/exclusion mechanics.
5. **Which existing features need modification?** `EvaluationMethod`'s "saved" path's *destination* (today routes to `/evaluation`; needs to route to the new comparison flow instead) and a new "both sides" state shape — not `EvaluationData` itself, which must stay singular for its still-needed uses.
6. **What data should be compared?** Both sides' full `EvaluationResult`s (scores, all six dimensions, coverage, deviations) — nothing new needs to be *computed* by evaluation itself, only *diffed* by a new function.
7. **Should previous scores be reused or recalculated?** Always recalculated, both sides, every comparison run — never trust a stored `score` as comparison input (reproducibility/fairness-over-time argument, §12).
8. **Should comparison results be persisted?** No — recommended against, consistent with this research prototype's "simplest implementation" principle (CLAUDE.md §14/§23); each side's individual score still persists as it already does.
9. **What is the minimum clean architecture?** Option 3 — a new, isolated Comparison page/route + a new pure diff function, maximally reusing existing single-result pieces, with zero changes to the trusted existing single-result Evaluation page or `evaluateGeneration()` itself.
10. **What should the next implementation task do?** See K above.
