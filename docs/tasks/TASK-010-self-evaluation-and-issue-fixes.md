# TASK-010 — Self-Evaluation and Issue Fixes: Restore Question Pattern Selection in Setup

## Status

Completed

## Objective

Make Question Pattern selection a real step in the Setup screen: after a Subtopic is selected, load and display the Question Patterns available for it (with an appropriate loading/empty state while nothing is selected yet or while patterns are loading), let the user select one or more of them (including an "all patterns" option), and scope the loaded `ReferenceQuestions` and `QuestionGenerationRequests.GenerationPrompt` to the *selected* pattern(s) + difficulty — not, as today, to every pattern that happens to belong to the subtopic.

## Context

The project's own documentation (`docs/project-management/project.md` §7/§9, `docs/project-management/architecture.md` §7/§10/§11, `docs/project-management/requirements.md` §6, `docs/project-management/database.md` §8/§17/§18, `docs/project-management/ai-generation.md` §3-§6) consistently describes the intended Setup flow as:

```
Subject → Topic → Subtopic → Question Pattern(s) → Difficulty → Question Type
```

with the server loading `ReferenceQuestions` and `QuestionGenerationRequests.GenerationPrompt` filtered by the *selected* Question Pattern(s) and Difficulty. That is how the app is supposed to arrive at the reference questions and generation prompt for each chosen pattern.

The current implementation does not do this. During TASK-002 (UI recreation from the Figma reference) and TASK-005 (dynamic DB wiring), a decision was made to skip a Question-Pattern picker entirely, to match the reference design pixel-for-pixel. This was recorded as an intentional deviation via "Implementation note (TASK-002)" annotations in:

- `docs/project-management/requirements.md` §6
- `docs/project-management/ui.md` §5
- `docs/project-management/architecture.md` §7, §10, §11
- `docs/project-management/project.md` §9
- `docs/project-management/progress.md` "Important Decisions" (including a bullet that explicitly overrode TASK-005's *own* acceptance criteria, which already called for multi-pattern selection and an "all patterns" option).

As implemented today, `getGenerationContext()` in `lib/db/generation-context.ts` silently auto-resolves **every** Question Pattern belonging to the selected Subtopic (`prisma.questionPattern.findMany({ where: { subtopicId } })` with no pattern filter), and there is no UI anywhere to see, choose, or narrow that set. `canGenerate()` in `lib/mock-data.ts` does not gate on pattern selection because the concept doesn't exist on the client at all.

The project owner has reviewed this and determined that skipping the picker was a mistake, not an acceptable deviation — this task reverses that earlier decision and brings the implementation in line with the documented design.

## Requirements

1. **Load patterns for the selected Subtopic.** Query `QuestionPattern` filtered by `subtopicId` (`id`, `name`) — no Prisma schema change is needed; `QuestionPattern.id/name/subtopicId` already exist (`prisma/schema.prisma`, `question_patterns` table).
2. **Appropriate state messaging**, distinctly for:
   - No Subtopic selected yet → prompt the user to pick a subtopic first (no pattern list shown).
   - Subtopic selected, patterns loading → a clear loading indicator.
   - Patterns loaded → the actual selectable list.
   - A subtopic with zero patterns → an explicit "no patterns available" message rather than a silently empty list.
3. **Selectable Question Pattern UI** allowing the user to choose one, several, or "all" available patterns. Model this on the existing multi-select pattern used by `app/_components/question-type-chips.tsx`. "All patterns" stays a UI-only concept (per `docs/project-management/database.md` §18) — it must resolve to "every currently loaded pattern id," never a database record.
4. **Gate `canGenerate()`** (`lib/mock-data.ts`) on at least one Question Pattern being selected (directly, or via "all"), the same way it already gates on Difficulty and Question Type.
5. **Scope context loading to the selection.** `getGenerationContext()` (`lib/db/generation-context.ts`) and its Server Action (`lib/actions/setup.ts`, `loadGenerationContextAction`) must accept the selected pattern id(s) and filter the `ReferenceQuestion` and `QuestionGenerationRequest` queries by those ids (and difficulty) instead of by "every pattern id for the subtopic."
6. **Carry the selection through session state.** Extend `PracticeConfig`/`GenerationContext` in `lib/types.ts` with a field for the selected pattern id(s) so it survives from Setup → Generate. `components/providers/practice-session-provider.tsx` should not need structural changes — it already stores whatever shape it's given.
7. **Confirm the prompt builder needs no change.** `lib/prompts/builder.ts` already iterates whatever `context.patterns` array it receives, so once `getGenerationContext()` returns a narrower, selection-scoped list, prompt construction should work unmodified — verify this rather than assume it.

## Scope

- Setup screen UI (new pattern-selection component + wiring in `app/_components/setup-form.tsx`).
- The Server Action and DB query changes needed to accept and apply the selection.
- Type changes needed to carry the selection through session state.
- Once implemented: update the "Implementation note (TASK-002)" annotations in the docs listed above (they should no longer describe the no-picker behavior as current), and correct the relevant "Important Decisions" bullets in `docs/project-management/progress.md` to record that TASK-010 reversed the earlier decision. Do not leave documentation silently stale once behavior changes.

## Out of Scope

- Evaluation page wiring to real generation results (tracked separately; still mock data).
- Any change to the AI provider, the AI request/response schema, or `lib/ai/*`.
- Persisting pattern-selection history or past generation requests.
- Redesigning the database schema — no schema change is required for this task.

## TDD / Tests

Extend existing test files/locations rather than inventing new ones:

- `tests/unit/setup-validation.test.ts` — `canGenerate()` must require pattern selection.
- `tests/unit/generation-context.test.ts` and `tests/integration/dynamic-data-loading.test.ts` — `getGenerationContext()` must filter `ReferenceQuestion`/`QuestionGenerationRequest` by the *provided* pattern ids, not by every pattern id for the subtopic.
- `tests/integration/setup-form.test.tsx` — covers the loading/empty states, pattern selection interaction, and the Generate button staying disabled until at least one pattern is chosen.

## Acceptance Criteria

- Selecting a Subtopic with no patterns yet loaded shows a loading message; once loaded, the real list of Question Patterns for that subtopot appears (sourced from the database, not mock data).
- No Subtopic selected → no pattern list and no loading state; a subtopic with zero patterns → an explicit "not available" message.
- The user can select one, several, or all patterns; "Generate" stays disabled until at least one pattern is selected (directly or via "all"), in addition to the existing Difficulty/Question Type gates.
- The `GenerationContext` passed into `/generate` contains reference questions and a generation prompt only for the pattern(s) the user selected — verifiable via the existing `/dev/prompt-preview` route or a targeted test.
- Full existing automated test suite still passes, plus the new/extended tests above.

## Implementation Notes

- Reuse `app/_components/question-type-chips.tsx` as the structural model for the new pattern-selection component (multi-select chip/checkbox list + an "all" toggle) rather than inventing a new interaction pattern.
- No Prisma migration is required.
- There is no existing "fetch-on-client-state-change" pattern in this codebase other than the current submit-time Server Action call (`loadGenerationContextAction`). Implementing the subtopic → patterns load will likely need a new Server Action invoked from a `useEffect` when `subtopicId` changes, following that same style.

## Decisions / Notes

- This task explicitly reverses the TASK-002 / TASK-003-I / TASK-005 decision to omit a Question Pattern picker. That decision is now judged to have been a mistake by the project owner, not merely superseded by a later, still-valid product call — treat the documentation annotations tied to it as needing correction, not preservation, once this task is implemented.
- During investigation for this task, an unrelated pre-existing inconsistency was noticed: `docs/tasks/TASK-005-dynamic-educational-data-loading.md`'s own in-file heading reads "TASK-004" despite the filename saying TASK-005. Left unfixed — out of scope here, noted for awareness only.
