# TASK-026 (patch) — Custom Practice Time — Agent Feedback

## Summary

Added a **custom practice-duration input** to the Try Question practice screen,
alongside the existing 1 / 2 / 3 / 5-minute presets. The user can type a whole
number of minutes (1–60) and start the countdown with it. Exactly one duration
source is active at a time, invalid custom values cannot start the timer and
surface an accessible message, and every other aspect of the screen (countdown
rules, zero-time behaviour, reveal flow, navigation, reset) is unchanged.

All changes are in **one component** plus tests:

| File | Change |
|---|---|
| `app/questions/practice/_components/practice-view.tsx` | New `parseCustomMinutes` export; `durationMinutes` state replaced by `presetMinutes: number \| null` + `customMinutes: string` + `durationError: string \| null`; custom input + active-source line + validation message added to the setup phase; `handleStart` now guards on the resolved active duration. |
| `tests/integration/practice-screen.test.tsx` | New `describe("custom practice time")` block — 8 tests. |
| `tests/unit/format-time.test.ts` | New `describe("parseCustomMinutes")` block — 2 tests. |
| `docs/project-management/progress.md` | Note appended to the TASK-026 bullet. |

No database, Prisma, schema, migration, route, session-state, or
`question-card.tsx` changes. `README.md` unchanged (§10 already says "picks a
practice duration", which still covers presets + custom).

## UI

Setup phase, unchanged preset row, then directly below it:

```
Practice time
[1 minute] [2 minutes] [3 minutes] [5 minutes]

Custom time  [   7   ] minutes
Starting a 7-minute countdown (custom).

[ Start ]
```

- The custom control is a real `<input type="number" inputMode="numeric" min=1 max=60 step=1>` with a visible `<label htmlFor="custom-practice-minutes">Custom time</label>` (associated), `aria-invalid`, and `aria-describedby` pointing at the error text when present.
- **Selection state is conveyed by text, not just colour:** a line under the control reads `Starting a N-minute countdown (preset).` / `(custom).`, or `Choose a preset or enter a custom time to start.` when nothing valid is active. Preset buttons additionally carry `aria-pressed`.
- Validation message is a `<p role="alert" class="text-destructive">` — no `window.alert`/`confirm`.

## Selection Rules

- **Click a preset** → that preset becomes the active source; the custom field is cleared; any validation error is cleared. `presetMinutes` holds the value.
- **Type in the custom field** → `presetMinutes` is set to `null` immediately (so no preset shows as active mid-typing); the raw text is kept in `customMinutes`; validation error cleared.
- **Active duration** = `presetMinutes !== null ? presetMinutes : parseCustomMinutes(customMinutes)`. There is no state in which a preset appears selected while a different custom value would actually be used — selecting one source always deselects the other.

## Validation

`parseCustomMinutes(raw)` (pure, unit-tested):

| Input | Result |
|---|---|
| `"1"`, `"7"`, `"60"`, `" 7 "` | the number |
| `"0"`, `"61"`, `"-1"` | `null` (out of 1–60) |
| `"1.5"` | `null` (not a whole number — regex `^\d+$`) |
| `"abc"`, `""`, `"   "` | `null` |

On `Start` with no valid active duration (`activeMinutes === null`): the timer does
**not** start and `durationError` is set to
`"Enter a whole number between 1 and 60 minutes."`. The Start button stays enabled
so the message can be shown on click (disabling it would hide the feedback the task
asks for).

Range note (task §3): the countdown has no inherent range limit — it is just
`minutes * 60` fed to the same `setInterval`. The 1–60 bound is a product choice for
this input, matching the task's recommended rules exactly; no adjustment was needed.

## Timer Integration

`handleStart` resolves `activeMinutes` (preset or parsed custom), then does exactly
what it did before: `setRemaining(activeMinutes * 60)` and `setPhase("running")`.
The countdown `useEffect`, the `mm:ss` display via `formatTime`, and the
"stop at `00:00`, do nothing automatically" behaviour are untouched — a custom
7-minute attempt runs `07:00 → 00:00` and then just sits there, same as a preset.

## State Reset

Still entirely component-local `useState` in `PracticeView`. `presetMinutes`
(default 2), `customMinutes` (default `""`), `durationError` (default `null`),
`remaining`, `answerShown`, `explanationShown` all reset when the component
unmounts — which is what happens on "Back to Questions" or opening a different
question, since each attempt mounts a fresh `PracticeView`. Custom duration is
never persisted, never written to `PracticeSessionProvider`, storage, or the DB,
and never leaks into another question's attempt.

## TDD

Written test-first (RED → GREEN). No refactor forced this time; the change adds no
`useEffect`, so no ESLint `set-state-in-effect` issue.

`tests/unit/format-time.test.ts` — `parseCustomMinutes`:
- accepts `"1"`, `"7"`, `"60"`, `" 7 "`.
- rejects `"0"`, `"61"`, `"-1"`, `"1.5"`, `"abc"`, `""`, `"   "`.

`tests/integration/practice-screen.test.tsx` — new `custom practice time` block:
- valid custom `7` → Start → timer `07:00`.
- preset `2` selected, then type custom `7` → "2 minutes" button `aria-pressed="false"`; Start → `07:00`.
- type custom `7`, then click "3 minutes" → Start → `03:00`.
- custom `0` → Start → no `role="timer"`, `role="alert"` with the validation text.
- custom `61` → Start prevented + alert.
- custom `1.5` → Start prevented + alert.
- custom mode active but field cleared → Start prevented.
- custom `1` → Start → advance 75 s → `00:00`, `push`/`replace` not called, answer not auto-revealed, "View Answer" still available.

All 9 pre-existing practice-screen tests and the format-time tests still pass
unchanged (preset flow untouched).

## Verification

Actually run in this environment:

| Check | Command | Result |
|---|---|---|
| Targeted | `npx vitest run tests/integration/practice-screen.test.tsx tests/unit/format-time.test.ts` | **24/24 pass** |
| Full suite | `npm test` | **356/356 pass** (41 files) |
| TypeScript | `npx tsc --noEmit` | **clean** |
| ESLint | `npm run lint` | **clean** |
| Build | `npm run build` | **success** |

**Not run:** the manual browser walkthrough (task §13). The Claude browser
extension is not connected in this environment, so the click-through
(2-min preset → fresh attempt → custom 7 → `07:00` → custom 7 then click "3 minutes"
→ `03:00` → invalid `0`/`61`/`1.5`/empty → Start blocked with message) was not
performed. Please run it before merging.

## Follow-ups (genuine, not implemented — out of scope)

- **Inline (as-you-type) validation.** Currently the message appears on `Start`. Showing it as soon as the field holds an invalid non-empty value would be friendlier, but the task's examples are all Start-triggered and §8 says not to over-engineer.
- **Remembering the last-used custom duration** within a session (or across attempts) — explicitly out of scope now (§7, §16), but a plausible convenience later if practice sessions get longer.
- **`type="number"` quirks.** jsdom accepts `"1.5"` in the number input so the decimal test passes against `parseCustomMinutes`; real browsers may sanitise differently. `parseCustomMinutes` is the actual gate, so behaviour is correct regardless, but if cross-browser input display ever looks odd, switching to `type="text" inputMode="numeric"` is a safe swap.
