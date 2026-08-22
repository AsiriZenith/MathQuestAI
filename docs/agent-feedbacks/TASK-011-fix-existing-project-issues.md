# Agent Feedback — TASK-011: Fix Existing Project Issues

## Files inspected

`prisma/schema.prisma` and the whole `prisma/` tree (confirmed no seed script/SQL/migrations exist anywhere in the repo); every `docs/project-management/*.md`, `README.md`, `CLAUDE.md`, `docs/tasks/tasks_README.md`; every test file under `tests/unit/` and `tests/integration/`; `app/dev/ai-provider-check/page.tsx`; `docs/agent-feedbacks/TASK-003-I-review-report.md` and `docs/project-management/progress.md`'s prior "Documentation Follow-up Needed" entries for both known issues' history.

## Issues confirmed and root cause

**Issue 1 — naming mismatch.** Confirmed: the real database's Subtopic is named `"Simplify & Calculate"`; `"Simplify / Calculate"` was used throughout docs, tests, and one dev route. Root cause: no seed script exists anywhere in this repo — the row was seeded manually/externally — and `"Simplify / Calculate"` was documented in TASK-002, *before the database layer was ever connected* (TASK-004). It was an assumption baked into early docs, never independently verified against the live DB until a browser walkthrough during TASK-012 (recorded in `docs/agent-feedbacks/TASK-012-configurable-ai-provider.md`) showed the real value. This is a stale documentation/test assumption, not an application defect — no production code (`app/page.tsx`, `lib/db/*.ts`) hardcodes the subtopic name.

**Issue 2 — `docs/development.md` stale reference.** Confirmed the file was referenced in `CLAUDE.md` §5 but never existed, and had already been reviewed twice before (TASK-003-I's review; a `progress.md` follow-up note) with the same conclusion both times: unnecessary, since `CLAUDE.md` §3 and `docs/tasks/tasks_README.md` §7/§8 already cover TDD/workflow content inline.

## Source of truth selected

**Database wins.** Per `docs/project-management/database.md` §29 and `CLAUDE.md` §9 (the existing PostgreSQL data is the established source of truth, not to be redesigned) — and given no seed artifact in the repo to argue otherwise — every current doc/test reference was corrected from `"Simplify / Calculate"` to `"Simplify & Calculate"`, not the other way around.

For Issue 2: removed the stale reference rather than creating the file, per the task's own explicit preference and a third independent review reaching the same "not needed" conclusion.

## Files changed

**Docs (living, current):** `docs/project-management/{database,requirements,ai-generation,product,ui}.md`, `README.md`, `CLAUDE.md` (§5 — removed the `docs/development.md` bullet, added an inline pointer to where that content actually lives), `docs/project-management/progress.md` (marked both prior follow-up notes resolved, added a Completed-section entry for this task).

**Code:** `app/dev/ai-provider-check/page.tsx` (dev-route sample `TEST_CONTEXT.subtopicName`).

**Tests:** `tests/unit/{setup-validation,prompt-builder,generation-context,generate-questions,generate-questions-action}.test.ts`, `tests/test-utils.tsx`, `tests/integration/{dynamic-data-loading,type-selection,database-connection,setup-form}.test.tsx` — all `"Simplify / Calculate"` string literals updated to `"Simplify & Calculate"`.

**Deliberately left unchanged:** `docs/agent-feedbacks/*.md` (one-time records per `CLAUDE.md` §18, not edited after the fact) and old `docs/tasks/TASK-002/005/006.md` spec files (historical task descriptions) — both still say `"Simplify / Calculate"`, describing what was believed/asked at the time, which is accurate as history even though the belief was later found wrong.

## An additional issue found and fixed along the way

Renaming the test fixtures to `"Simplify & Calculate"` broke 5 tests in `tests/integration/setup-form.test.tsx` that were previously passing — not because the rename was wrong, but because `@testing-library/user-event`'s `selectOptions(element, displayText)` has a genuine bug/quirk: it fails to match an `<option>` by its visible text when that text contains an `&` character (reproduced in isolation with a minimal throwaway test, confirmed unrelated to this app's code). **Root cause confirmed before touching the tests**, per the task's TDD instructions. Fix: changed those four `selectOptions` calls to select by the option's `value` attribute (`"subtopic-1"`) instead of by display text — this is both a correct workaround and arguably a better test, since it no longer couples test code to the subtopic's exact display string.

## Test results

**Before:** `npx vitest run tests/integration/database-connection.test.ts tests/integration/dynamic-data-loading.test.ts` → 2 test files failed, 6 of 9 tests failed (`expected null not to be null` / `expected false to be true`, both from looking up the subtopic by the wrong name).

**After naming fix, before the `selectOptions` fix:** those same 9 tests passed, but the naming-fix ripple broke 5 previously-passing tests in `setup-form.test.tsx` (the `&`-matching bug above) — full suite: 1 file failed, 8 of 98 tests failed.

**After the `selectOptions` fix:** full suite — **19 files passed, 98/98 tests passing.** `npx tsc --noEmit` and `npx eslint .` both clean.

## Regression verification

Live browser check against the running dev server (real DB, real AI provider) after all changes: Setup page loads and renders correctly (screenshot-verified), no new errors. A full Setup → Generate → Questions walkthrough with the real `"Simplify & Calculate"` value and real Groq generation had already been verified minutes earlier under TASK-012 in this same session, using identical application code (TASK-011 changed no production code paths, only doc/test/dev-route string literals) — re-running that full multi-step walkthrough again would have been redundant, so I did a lighter confirmation (page load + no console errors) instead of repeating the entire generation flow.

## Additional issues discovered

- The `@testing-library/user-event` `selectOptions`-by-text-with-ampersand bug documented above. Not filed anywhere else since it's now worked around at the only call site that hit it.

## Issues intentionally left for future tasks

- None specific to this task's scope. The Evaluation page remains mock-data-driven and untouched, as required.
