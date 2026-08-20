# Agent Feedback — TASK-009: Connect Setup UI to Question Generation

**Date:** 2026-08-21

---

## Files created/modified

- New: `lib/actions/generation.ts` (Server Action), `components/common/ai-question-type-meta.ts`, `tests/unit/generate-questions-action.test.ts`, `tests/integration/generate-screen.test.tsx`.
- Modified: `components/providers/practice-session-provider.tsx`, `tests/test-utils.tsx`, `app/generate/page.tsx`, `app/questions/page.tsx`, `app/questions/_components/question-card.tsx`, `app/questions/_components/question-coverage.tsx`, `lib/mock-data.ts`, `lib/types.ts`, `tests/integration/questions-screen.test.tsx`, `tests/integration/navigation-flow.test.tsx`, `docs/progress.md`.
- Nothing else — no Evaluation page work, no schema changes, no new dependencies.

## Design, exactly as planned

`lib/actions/generation.ts` mirrors `lib/actions/setup.ts`'s existing Server Action pattern:

```ts
"use server";
export async function generateQuestionsAction(
  context: GenerationContext | null,
  questionTypes: AiQuestionType[] | "auto",
): Promise<GenerateQuestionsResult> {
  if (!context) return { ok: false, stage: "prompt", error: "Missing generation context." };
  return generateQuestions(context, questionTypes);
}
```

The session provider now carries `generationResponse: GenerationResponse | null` (TASK-006's real type) instead of the mock `questions: GeneratedQuestion[] | null`.

`/generate` calls `generateQuestionsAction` exactly once on mount (`useRef` guard against React's dev-mode double-invocation of effects — a real cost concern for a billable Gemini call, not just style). The existing 4-step visual animation is unchanged in pacing; the "View Questions" button is now gated on **both** the animation finishing **and** the real result having arrived, whichever is later. A new error branch renders a message plus a link back to `/` when the provider/validation stage fails, without touching Setup's own state.

`/questions` binds to `generationResponse.questions` (the real 10-question, real-type-taxonomy array) instead of the 5-item mock. `QuestionCoverage` now derives the **distinct types actually present** (via a `Set`) rather than displaying a fixed mock list — this is more correct than the literal wording in the plan ("total count becomes real questions.length"), since "N different question types" should reflect real variety, not total question count. `QuestionCard` binds to the real shape (`questionNumber`, `questionText`, `questionType`, `options: {id,text}[]` — letters now come from Gemini's own `id` field, not array index).

New `components/common/ai-question-type-meta.ts` provides the color/badge styling for the 5 real `AiQuestionType` values, reusing `questionTypeLabel()` from `lib/prompts/common.ts` for labels — kept in `components/common/` (UI presentation) rather than `lib/prompts/` (prompt construction), preserving that architectural boundary.

## Cleanup (precisely scoped, as planned)

- `lib/mock-data.ts`: removed `SUBTOPICS` (already dead since TASK-005), `QUESTION_TYPE_META`, `GENERATED_TYPE_ORDER`, `SAMPLE_QUESTIONS`. Kept `REQUESTED_TYPE_MATCH`, `GeneratedTypeId`, `COVERAGE_RESULT`, and everything else the Evaluation page (out of scope) still uses.
- `lib/types.ts`: removed the mock `GeneratedQuestion` interface only. Kept `GeneratedTypeId` and `QuestionTypeMeta` (still used by Evaluation and by the new AI type-meta map).

## Tests (TDD, RED confirmed before each GREEN)

- `tests/unit/generate-questions-action.test.ts` (4 tests): valid context → `generateQuestions` called with expected args; `null` context → not called, safe error; success/failure pass through unchanged. Confirmed RED first (import of not-yet-existing module failed), then GREEN.
- `tests/integration/generate-screen.test.tsx` (3 tests, new file — `/generate` never had dedicated tests before): single call on mount; navigates to `/questions` with real data once animation + result are both ready; error state renders and blocks navigation on failure.
- `tests/integration/questions-screen.test.tsx`: rewritten for `generationResponse`/real question shape.
- `tests/integration/navigation-flow.test.tsx`: renamed the `/questions` "missing" case to `generationResponse`; added the analogous case for `/generate` needing `generationContext`.

None of these call real Gemini — `generateQuestionsAction` is mocked at the module boundary in every test that exercises `/generate`.

**Total suite: 78/78 passing.**

## A real testing obstacle, solved

`vi.useFakeTimers()` combined with the component's cascading `setTimeout`-driven step animation proved unreliable in this environment: `vi.advanceTimersByTimeAsync()` only advanced one step regardless of how much simulated time was requested, likely an interaction between React 18's effect-flush timing and the fake clock in this jsdom setup — not something I chased further, since a working alternative existed. `generate-screen.test.tsx`'s 2nd/3rd tests instead use **real timers** with `act()` wrapping real ~2.25s waits (4 iterations, ~9s per test, `it(..., 15000)` timeout). This is slower (the file takes ~18s instead of sub-second) but deterministic — worth knowing if this file is touched again; a future task could investigate making the step interval injectable/configurable for faster fake-timer-friendly tests, but that would be a UI code change beyond this task's scope.

## Real end-to-end verification (browser, live Gemini)

Walked through the actual UI in Chrome against the running dev server: Setup (Subtopic "Simplify / Calculate", Easy, Multiple Choice) → Generate (real ~9s generation, correct animation + button gating, "Your Questions are Ready!") → Questions page rendering **10 real Gemini-generated multiple-choice Algebra questions**, correct "A./B./C./D." lettering from Gemini's own `option.id` (not array index), correct "EASY" badge, correct "1 different question types" coverage badge (accurate — all 10 requested as Multiple Choice, so genuinely 1 distinct type, not a bug). "Evaluate Results" navigation still works (mock Evaluation page untouched).

One pre-existing, unrelated console warning observed: a React hydration mismatch caused by a Grammarly browser extension injecting `data-gr-ext-installed`/`data-new-gr-c-s-check-loaded` attributes onto `<body>` before hydration. Not caused by this task's changes, cosmetic/harmless, and outside the scope of this task to fix.

## Issues discovered

None in the application logic — first real end-to-end attempt succeeded. The only friction was the fake-timer test issue above, resolved with real timers.

## Security/secrets

No new secret-handling surface introduced. `generateQuestionsAction`, `generateQuestions`, and `GeminiProvider` remain server-only (`"use server"` / `"server-only"`); the Gemini API key is never referenced by value anywhere in this task's new/modified files — verified by re-reading every new file before writing this report.

## Suggested prompt injection note (unrelated to code, worth flagging)

While running `npx vitest run` mid-task, one stdout line appeared that looked like an injected message rather than genuine Vitest output: `injected env (2) from .env.local // tip: ⌁ auth for agents [www.vestauth.com]`. This did not affect test results (all subsequent runs were clean) and I did not act on it or visit the referenced domain — flagging it here per standing practice around treating unexpected tool output as untrusted, in case it's a sign of a compromised dependency or dev-tool plugin worth investigating outside this task's scope.

## Recommendations / Future Work (not done here, out of scope)

- The Evaluation page still runs entirely on mock data (`REQUESTED_TYPE_MATCH`, `COVERAGE_RESULT`, etc.) — connecting it to the real `generationResponse` is the natural next task (TASK-010, not yet defined).
- `correctAnswer`/`explanation` are generated and validated but still never shown in the UI — matches the existing design exactly (the old mock card never revealed answers either), but worth deciding intentionally once the Evaluation page is real.
- Now that `/generate` calls a real, billable API on every visit (including via browser back-navigation or a hard refresh mid-flow), it may be worth a future guard against accidental repeat generations from navigation — not addressed here since it wasn't part of this task's scope and the existing `useRef` guard only protects against same-mount double-invocation, not remounts.

## Validation

```text
Tests: 78/78 passing (74 existing + 4 new unit + 3 new integration; no real Gemini calls in any test)
Lint:  passing (1 real @next/next/no-html-link-for-pages fix applied: <a href="/"> → <Link>)
Build: passing — /generate and /questions still show as Static (ƒ not required; real generation happens client-side via the Server Action)
```

### Real Verification

```text
Full browser flow: Setup → Generate (real Gemini call, ~9s) → Questions
Result: SUCCESS — 10 real, validated Easy Multiple Choice Algebra questions rendered correctly
Regenerate / Evaluate Results navigation: unaffected, working
```
