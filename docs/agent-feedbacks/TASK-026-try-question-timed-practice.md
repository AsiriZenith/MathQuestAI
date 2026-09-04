# TASK-026 — Try Question Timed Practice Flow — Agent Feedback

## Summary

The previously non-functional **"Try Question"** control on each generated question
card is now a working, focused, timed self-practice screen.

Changes:

| File | Change |
|---|---|
| `app/questions/_components/question-card.tsx` | The inert `<button>` is now a `next/link` `<Link href={\`/questions/practice/${question.questionNumber}\`}>` (same label, icon, styling). |
| `app/questions/practice/[questionNumber]/page.tsx` | **New.** Client route. Reads `config` + `generationResponse` from `PracticeSessionProvider`, looks the question up by `questionNumber` (its existing stable key), guards with `router.replace("/")` (no session) / `router.replace("/questions")` (unknown number) exactly like the other routes, renders the "Back to Questions" control + `<PracticeView>`. |
| `app/questions/practice/_components/practice-view.tsx` | **New.** The whole practice experience + an exported pure `formatTime(seconds)` helper. |
| `tests/integration/practice-screen.test.tsx` | **New.** 12 tests. |
| `tests/unit/format-time.test.ts` | **New.** 2 tests. |
| `tests/integration/questions-screen.test.tsx` | One test added: each card's Try Question link points at `/questions/practice/<n>`. |
| `docs/project-management/progress.md`, `README.md` (§10) | Updated. |

No database, Prisma, schema, migration, or `PracticeSessionProvider` state changes.

## UX Flow

```
Questions page → "Try Question" on a card
  → /questions/practice/<questionNumber>  (focused screen, global nav kept, list untouched behind it)
      Question <n> + Type badge + question text (large) + options (if any) always visible
      SETUP:   pick 1 / 2 / 3 / 5 minutes (default 2) → Start
      RUNNING: big mm:ss countdown + "Time Remaining", question still shown
               → "View Answer" → "Show Explanation"
      00:00:   countdown stops, nothing else happens; reveal still available
  → "Back to Questions" → router.push("/questions"), original list intact
```

Route choice: a dynamic segment `/questions/practice/[questionNumber]` (not a
`?q=` search param) — matches the app's App Router idiom and avoids the
`useSearchParams` Suspense-boundary requirement. Consistent with how every other
route in this app tolerates lost in-memory session state by redirecting.

## Timer

- Duration control: four buttons (`1 minute` … `5 minutes`), `aria-pressed`, default **2 minutes**. Changeable only before Start.
- On Start: `remaining = durationMinutes * 60`, phase → `running`, a single `setInterval` decrements once per second.
- Display: `formatTime(remaining)` inside `<span role="timer">`, e.g. `01:42`. `formatTime` floors, zero-pads, and clamps negatives to `00:00`.
- At zero: the interval callback clears itself and sets `remaining` to `0`. **No** submit, navigation, dialog close, answer reveal, correctness marking, result save, or evaluation. The user can still reveal the answer afterwards.
- No pause/resume, no sound, no expiry notification (all explicitly out of scope).

## Answer / Explanation

Hidden during the attempt. Two explicit user steps (task §5 "progressive" option):

1. **View Answer** button → shows a "Correct Answer" block with `question.correctAnswer`.
2. **Show Explanation** button → shows `question.explanation` under a labelled divider.

Both are text-labelled buttons (not color-only), real `<button type="button">`
elements. Reveal controls only appear once the attempt has started.

## Question Types

The screen renders straight from the existing `GeneratedQuestion` fields
(`questionText`, `questionType`, `options?`, `correctAnswer`, `explanation`) — no
new question model, no per-type answer-entry or scoring logic.

- `mc` / `ms` (have `options`): options rendered as an ordered list (`A. …`, `B. …`).
- `fib` / `wp` / `tf` (no `options`): just the question text; no empty list, flow unchanged.

Type label + colour come from the existing `QUESTION_TYPE_META` + `<TypeBadge>`.

## State

All practice state is component-local `useState` inside `PracticeView`:
`phase` (`"setup" | "running"`), `durationMinutes`, `remaining`, `answerShown`,
`explanationShown`.

- Nothing is written to `PracticeSessionProvider`, storage, or the database.
- Leaving the route unmounts `PracticeView`, discarding all of it.
- Reopening the same question, or opening a different one, mounts a fresh
  `PracticeView` → back to SETUP, default duration, answer hidden. No leak between
  questions (verified by test).
- `GenerationContext`, `savedGenerationContextId`, `evaluationData`,
  `comparisonData` are never read or written by this feature.

## TDD

Written test-first (RED → GREEN → REFACTOR). One refactor was forced by ESLint
(`react-hooks/set-state-in-effect`): the "stop at zero" transition was moved out of
a second `useEffect` and into the interval callback itself (`if (r <= 1) { clearInterval(id); return 0; }`),
removing a setState-in-effect.

`tests/unit/format-time.test.ts` (2):
- `mm:ss` formatting for 0 / 5 / 65 / 125 / 600 seconds.
- negative values clamp to `00:00`.

`tests/integration/practice-screen.test.tsx` (12) — protects:
- The screen shows **the exact** question whose action was used (`?q`-equivalent segment `3` → "Question 3", and question 4's text is absent).
- Unknown question number → `router.replace("/questions")`.
- Default duration is `02:00`; changing to "3 minutes" then Start shows `03:00`.
- Countdown actually decrements (`02:00` → `01:59` after 1s).
- Reaching `00:00` does **not** call `push`/`replace`, does **not** reveal `correctAnswer`/`explanation`, keeps the question mounted, and leaves "View Answer" available.
- "View Answer" then "Show Explanation" reveal the answer and explanation, and not before.
- Closing and reopening the **same** question resets to SETUP with the answer hidden.
- Opening question 1 (attempted, 5-minute duration, answer revealed) then question 2 → question 2 starts fresh at the default `02:00`, no timer/reveal leak.
- MC question shows options A–D.
- Non-MC question (custom `fib` fixture, no `options`) renders with no list and the full flow still works.
- "Back to Questions" calls `router.push("/questions")`.

`tests/integration/questions-screen.test.tsx`: added an assertion that every card's
"Try Question" is a link to `/questions/practice/<questionNumber>`.

Testing note: `next/link` + fake timers + `userEvent` needed
`vi.useFakeTimers({ shouldAdvanceTime: true })` together with
`userEvent.setup({ advanceTimers: vi.advanceTimersByTime })` — without
`shouldAdvanceTime` every `user.click` hangs to the 5 s test timeout. Recorded here
for the next timer-driven UI test.

## Verification

Actually run in the implementation environment:

| Check | Command | Result |
|---|---|---|
| Targeted tests | `npx vitest run tests/integration/practice-screen.test.tsx tests/unit/format-time.test.ts` | **14/14 pass** |
| Targeted (card link) | `npx vitest run tests/integration/questions-screen.test.tsx` | pass |
| Full suite | `npm test` | **346/346 pass** (41 files) |
| TypeScript | `npx tsc --noEmit` | **clean** (no output) |
| ESLint | `npm run lint` | **clean** (no output) |
| Production build | `npm run build` | **success**; route table lists `ƒ /questions/practice/[questionNumber]` |

**Not run:** the manual browser walkthrough from task §18. The Claude browser
extension is not connected in this environment (`tabs_context_mcp` →
"Browser extension is not connected"), so the end-to-end click-through
(Setup → generate → Questions → Try Question → change duration → Start → let it
hit `00:00` → View Answer → explanation → Back → open another question → fresh
state) was **not** performed. Please run it before merging. An AI provider
(DeepSeek, per TASK-025) is configured in `.env.local`, and a dev server was
already running on `:3000` during implementation.

## Follow-ups (not implemented — out of scope for this task)

- **Answer submission / self-grading.** A future version could let the user pick an MC option (or type an answer) and show correct/incorrect after reveal. Deliberately excluded here (task §7, §20).
- **Attempt history / analytics.** Recording how long the user took, whether they revealed early, per-question. Needs a persistence decision and is explicitly out of scope.
- **Keyboard shortcut to Start / reveal**, and focus management on route entry. Current implementation is keyboard-operable (real buttons/links) but adds no shortcuts.
- **Task-file heading mismatch.** `docs/tasks/TASK-026-try-question-timed-practice.md` is titled "TASK-025 — Implement 'Try Question' …" and its body refers to "TASK-025" throughout. It was treated as **TASK-026** (matching the filename, the branch `asiri/v0.1.0/feature/try-question-timed-practice`, and the fact that TASK-025 is already the DeepSeek switch). All new artifacts use TASK-026. Worth correcting the heading in the task file.
