# TASK-027 — Next Question Navigation in Try Question Practice — Agent Feedback

## Summary

The Try Question practice screen can now walk the user through the generated
questions one at a time. After the answer **and** explanation are revealed, a bottom
action appears:

- **non-final question** → `Next Question` → goes straight to the next generated
  question as a fresh practice attempt (no trip back to the Questions list);
- **final question** → `Back to Questions` → returns to `/questions`.

The existing top `Back to Questions` link is unchanged and available throughout.

Changes (2 files + tests):

| File | Change |
|---|---|
| `app/questions/practice/[questionNumber]/page.tsx` | Resolves the current question by array position in `generationResponse.questions`, derives `nextQuestion`, and passes `hasNext` / `onNext` / `onBackToQuestions` to `PracticeView`. Adds `key={question.questionNumber}` so a Next navigation remounts `PracticeView` (state reset). Existing missing-session guard untouched. |
| `app/questions/practice/_components/practice-view.tsx` | New props `hasNext` / `onNext` / `onBackToQuestions`; a bottom button rendered only once `explanationShown` is true — `Next Question` (with an arrow icon) when `hasNext`, otherwise `Back to Questions`. Imports `ArrowRight`. Nothing else touched. |
| `tests/integration/practice-screen.test.tsx` | New `describe("next question navigation")` — 6 tests; the mocked `push` now updates `params` so a follow-up `rerender` renders the destination question. |

No database, Prisma, schema, migration, route-shape, or session-provider changes.
No persistence of practice progress or index.

## Navigation Flow

1. User is on `/questions/practice/2`. `PracticePage` finds question 2 at array
   index 1 and computes `nextQuestion = questions[2]` (question 3).
2. User Starts the timer, reveals the answer, then the explanation.
3. `PracticeView` now renders a `Next Question` button (because `explanationShown`
   and `hasNext`).
4. Clicking it calls `onNext` → `router.push("/questions/practice/3")`.
5. The route param changes; `PracticePage` re-renders, `question.questionNumber`
   changes, so `<PracticeView key=…>` unmounts and remounts with question 3.

Ordering source: the existing array order of `generationResponse.questions`.
`questionNumber` is used only as the stable per-question key for the URL and the
lookup — no second ordering scheme was introduced.

## Reveal Gate

`Next Question` is gated on `explanationShown === true` — i.e. the user has stepped
through both `View Answer` and `Show Explanation`. Rationale: task §4/§10 describe
the control appearing only "after the answer/explanation has been revealed", with
both "Correct Answer visible" and "Explanation visible" as the precondition. Gating
on the *end* of the two-step reveal flow keeps the intended rhythm
(attempt → reveal → continue) and means the button can never be used to skip past a
question without seeing its full solution. Before Start, and after Start but before
the explanation, no `Next Question` control exists in the DOM at all (not just
disabled).

## Final Question

When `nextQuestion` is `null` (current question is the last element of the array),
`hasNext` is `false`. After the reveal, the bottom button is `Back to Questions`
instead of `Next Question`; it calls `onBackToQuestions` → `router.push("/questions")`.
This is the same label and destination as the always-present top link (the page now
has two controls that both return to the list — deliberate: the top one is the
"leave early" affordance, the bottom one is the end of the guided progression).

## State Reset

Moving to the next question resets **everything** in `PracticeView`, because the
`key={question.questionNumber}` on the element forces React to discard the old
instance and mount a fresh one. That clears `phase` (back to `setup`),
`presetMinutes` (back to the default 2-minute preset), `customMinutes` (`""`),
`durationError`, `remaining`, `answerShown`, `explanationShown`. No explicit reset
code was added — the remount is the reset, and it is identical to how the screen
behaved when the user navigated away and re-entered under TASK-026. All displayed
data (number, type, text, options, correct answer, explanation) comes from the new
`question` prop, so there is no window where question N's title shows with question
N−1's answer.

## Routing / Data

- Current question: `questions.findIndex(q => q.questionNumber === Number(params.questionNumber))`, then `questions[index]`.
- Next question: `index >= 0 && index < questions.length - 1 ? questions[index + 1] : null`.
- `hasNext = nextQuestion !== null`.
- Missing session data: unchanged — `!config || !generationResponse` → `router.replace("/")`, unknown number → `router.replace("/questions")`, `return null` while redirecting. `questions` defaults to `[]` so the derivations are safe even in that transient state, and no broken `Next` button can render because the component returns `null` first.

## TDD

Tests written first (RED → GREEN). No refactor needed; the change adds no effects,
so no ESLint `set-state-in-effect` concern.

New integration tests in `tests/integration/practice-screen.test.tsx`:

1. No `Next Question` before the answer is revealed (after Start only).
2. No `Next Question` after `View Answer` but before `Show Explanation`.
3. `Next Question` present once answer + explanation are both revealed.
4. Clicking `Next Question` on question 2 → `push("/questions/practice/3")`; after
   `rerender`, "Question 3" and its text show, `role="timer"` is gone, question 2's
   explanation text is gone, the 2-minute preset is `aria-pressed="true"` again, and
   Start shows `02:00` — i.e. a fresh attempt.
5. Final question (10): no `Next Question`; two `Back to Questions` buttons (top +
   bottom); clicking the bottom one → `push("/questions")`.
6. Cross-type navigation with a custom 2-question `mc → fib` response: question 1's
   options and explanation do not leak into question 2 after Next; question 2 shows
   its own text, no options list, and its own answer/explanation after revealing.

All pre-existing practice-screen tests (24) and `format-time` / `parseCustomMinutes`
tests still pass unchanged.

## Verification

Actually run in this environment:

| Check | Command | Result |
|---|---|---|
| Targeted | `npx vitest run tests/integration/practice-screen.test.tsx tests/unit/format-time.test.ts` | **30/30 pass** |
| Full suite | `npm test` | **362/362 pass** (41 files) |
| TypeScript | `npx tsc --noEmit` | **clean** |
| ESLint | `npm run lint` | **clean** |
| Build | `npm run build` | **success** |

`README.md` §10 already describes the practice flow ("attempts the question, and
then manually reveals the correct answer and explanation") at project-overview
altitude — a single-question-vs-walkthrough distinction is an implementation detail,
so **no README change** was made.

**Not run:** the manual browser walkthrough (task §18). The Claude browser
extension is not connected in this environment. Please run the multi-question
click-through (q1 → time → Start → reveal → Next → q2 fresh → … → q10 → reveal →
Back to Questions; plus top Back to Questions at any point) before merging.

## Follow-ups (genuine, not implemented — out of scope)

- **Focus management on question change.** The `key` remount drops focus to
  `<body>`. Task §13 asks only that focus behaviour "remain reasonable", which a
  clean remount satisfies, but moving focus to the new question heading (or the
  Start button) on advance would be a small a11y improvement.
- **Progress indicator** ("Question 3 of 10") on the practice screen — purely
  informational, would make the walkthrough feel bounded. Not requested.
- **Previous-question navigation** — explicitly out of scope (§21); noting only that
  the array-index resolution already makes it a trivial future addition.
- **Keyboard shortcut** to advance after reveal (e.g. Enter) — minor convenience.
