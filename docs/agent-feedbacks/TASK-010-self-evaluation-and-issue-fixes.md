# Agent Feedback — TASK-010: Self-Evaluation and Issue Fixes

## What was done

Restored a real Question Pattern selection step in the Setup screen, reversing the TASK-002/TASK-005 decision to auto-resolve every pattern for a subtopic instead of letting the user choose.

**Types (`lib/types.ts`):** added `QuestionPatternOption`, `QuestionPatternsResult`; extended `PracticeConfig` with `selectedPatternIds: string[]` and `autoPatterns: boolean`.

**Data access (`lib/db/education.ts`):** added `getQuestionPatternsForSubtopic(subtopicId)`, returning a `QuestionPatternsResult` (`{ok:true, patterns}` / `{ok:false, error}`), consistent with `getGenerationContext`'s existing result-type convention.

**Server Actions (`lib/actions/setup.ts`):** added `loadQuestionPatternsAction(subtopicId)`; `loadGenerationContextAction` now requires `patternIds: string[]` in its input.

**Context scoping (`lib/db/generation-context.ts`):** `getGenerationContext()` now requires `patternIds`, returns an error if the array is empty, and filters the `QuestionPattern` lookup by `{ id: { in: patternIds }, subtopicId }` (defense against a pattern id that doesn't belong to the subtopic) before scoping `ReferenceQuestion`/`QuestionGenerationRequest` to the resolved patterns — previously it loaded every pattern for the subtopic unconditionally.

**Gating (`lib/mock-data.ts`):** `canGenerate()` now also requires `selectedPatternsSize > 0 || autoPatterns`.

**UI:** new `app/_components/question-pattern-chips.tsx` (modeled directly on the existing `question-type-chips.tsx` — chip multi-select + an "all" toggle). `app/_components/setup-form.tsx` fetches patterns via a `useEffect` keyed on `subtopicId` once it's non-empty, and renders four distinct states: no subtopic selected, loading, error, empty (zero patterns for the subtopic), and the loaded chip list. `handleGenerate` now resolves `patternIds` (either the explicit selection or every loaded pattern id when "all" is toggled) and threads it into `loadGenerationContextAction` and `setConfig`.

**Dev routes:** `app/dev/prompt-preview/page.tsx` and `app/dev/generate-questions-check/page.tsx` updated to fetch all patterns for the subtopic first (via the new `getQuestionPatternsForSubtopic`) and pass them as `patternIds`, since `getGenerationContext` no longer accepts an implicit "all" default.

**Tests:** updated `tests/unit/setup-validation.test.ts`, `tests/unit/generation-context.test.ts` (now asserts the Prisma `findMany` call is scoped by `id: { in: patternIds }`), `tests/integration/dynamic-data-loading.test.ts`, `tests/integration/setup-form.test.tsx`, `tests/test-utils.tsx`; added `tests/unit/question-pattern-chips.test.tsx`. 86 unit + non-DB-integration tests pass; `tsc --noEmit` and `eslint .` are both clean.

**Documentation:** corrected the "Implementation note (TASK-002)" annotations in `docs/project-management/{project,architecture,requirements,ui}.md` (5 locations) to record the reversal, and updated `docs/project-management/progress.md`'s Completed section, two "Important Decisions" bullets, and the "Upcoming" placeholder (renumbered the not-yet-written Evaluation-page task from TASK-010 to TASK-011, since this task claimed TASK-010).

## Verified

Full manual browser walkthrough against the live dev server and the real database: selecting "Simplify & Calculate" as Subtopic triggered a live fetch that rendered the 5 real seeded Question Patterns (Apply Distributive Property, Combine Like Terms, Simplify Algebraic Fractions, Simplify and retain variables, Simplify Multi-Operation Expressions); selecting one pattern + Easy + Multiple Choice enabled Generate; submitting navigated to `/generate` with a loaded context. Cross-checked `getGenerationContext`'s scoping logic directly against the real database via `/dev/prompt-preview`.

## Action needed before the next task

None required to proceed. One thing worth a quick look when convenient: the "use all question patterns" chip's evaluation-page counterpart (`lib/mock-data.ts`'s Evaluation mock data, `components/common/pattern-status-indicator.tsx`) is unaffected by this task and still entirely mock-driven — that's TASK-011's territory, not this one's.

## Judgment calls made

- **Where to reset pattern selection when the subtopic changes:** an initial implementation reset the selection state directly inside the data-fetching `useEffect`, but that tripped the repo's `react-hooks/set-state-in-effect` ESLint rule (any direct, non-callback `setState` call in an effect body is flagged). Fixed by moving the reset to "adjust state during render" — comparing `subtopicId` against a tracked `selectionSubtopicId` and calling `setState` directly in the component body when they diverge, which is React's own documented pattern for "resetting state when a prop changes" and is not flagged by the rule. The fetch effect itself now only calls `setState` inside the `.then()` callback, mirroring the pattern already used in `app/generate/page.tsx`.
- **How "loading" state is represented:** rather than a separate `patternsLoading` boolean (which would itself need a direct `setState(true)` at the top of the effect — the same rule violation), loading is derived: `patternsResultBySubtopic` is tagged with the subtopic id it was fetched for, and `patternsLoading` is simply "a subtopic is selected but no tagged result exists for it yet." This also incidentally fixes a subtle stale-response bug: if the user changes the subtopic again before a slow fetch resolves, the stale result is naturally ignored because its tagged subtopic id no longer matches.
- **Dev routes (`/dev/prompt-preview`, `/dev/generate-questions-check`):** rather than leaving them broken by the `getGenerationContext` signature change, they now resolve "all patterns for the subtopic" themselves first, preserving their original all-patterns inspection behavior. This wasn't explicitly listed in the task's requirements but was necessary to keep the build green and the dev tooling functional.

## Deviations from the task file

None of substance — implemented per the task's Requirements section as written. The "all patterns" UI concept was implemented as a dedicated toggle button (mirroring `QuestionTypeChips`' existing "auto-mix" toggle) rather than a literal "select all individual chips" interaction, which the task's Implementation Notes anticipated by pointing at that exact component as the model.

## New finding, unrelated to this task's scope

While verifying against the live database, the real seeded Subtopic name turned out to be `"Simplify & Calculate"`, not `"Simplify / Calculate"` as used throughout `docs/project-management/database.md` and the integration tests. This is very likely also the root cause of two integration test failures (`tests/integration/database-connection.test.ts`, `tests/integration/dynamic-data-loading.test.ts`) observed in this environment, both of which predate this task and look up the subtopic by the `"/"`-spelled name. Left unfixed — recorded in `docs/project-management/progress.md`'s decisions log per the project's "database is the source of truth" principle; worth the team confirming which spelling is correct.

## Suggestions for going forward

- Reconcile the `"Simplify / Calculate"` vs `"Simplify & Calculate"` naming discrepancy above — it's currently silently failing two integration tests in this environment.
- Consider whether `QuestionPatternChips` and `QuestionTypeChips` are similar enough now to warrant a small shared base component — deferred here to keep this task's diff focused, but the duplication is real (two now-near-identical files).
