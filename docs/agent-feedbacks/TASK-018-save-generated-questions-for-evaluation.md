# TASK-018 — Save Generated Questions for Evaluation

## Summary

Persistence is now user-controlled. TASK-017 had wired `saveGeneration()` into
`generateQuestions()` so every successful generation was written automatically;
TASK-018 reverts that and moves the trigger to an explicit **Save for
Evaluation** action on the Questions page. The `lib/persistence/*` service
(mapper, name generator, transaction) is unchanged and reused as-is.

All TASK-017 changes were uncommitted working-tree changes, so the auto-persist
wiring (`generate-questions.ts`, `generation.ts` action, `/generate` page,
`generation-issue-dialog.tsx`, the affected tests) was reverted to `HEAD` rather
than layered over.

## User Flow

```
Generate → /questions (cards visible, nothing saved)
  → "Save for Evaluation" button
  → confirmation dialog
      ├── Cancel / X / overlay click  → dialog closes, nothing saved
      └── "Save for Evaluation"       → "Saving…" (button disabled)
            ├── success → dialog closes, success banner, button → disabled "Saved for evaluation"
            └── failure → generic error in dialog, "Try Again", cards still visible
```

Evaluate Results / the evaluation flow is unchanged and independent — a user can
evaluate without saving, and saving does not navigate anywhere.

## Confirmation Dialog

`app/questions/_components/save-for-evaluation-dialog.tsx` (structure copied from
`evaluation-method-dialog.tsx`).

- Title: **Save Questions for Evaluation?**
- Message: **Do you want to save these generated questions for evaluation? This
  will save the questions and their generation details so they can be evaluated
  later.**
- Actions: **Cancel** / **Save for Evaluation** (primary).
- While saving the primary button shows **Saving…** and is `disabled`; Cancel and
  the close affordances are disabled; a `useRef` in-flight guard blocks a second
  submit even if the button is somehow re-triggered.

## Persistence

`app/questions/page.tsx` → `saveGenerationAction({ config, generationContext,
generationResponse, generationMeta })` (`lib/actions/save-generation.ts`,
`"use server"`, modelled on `lib/actions/evaluation.ts`) → the existing
`saveGeneration({ generationContext, config, aiResponse: generationResponse,
prompt: generationMeta.prompt })`. No Prisma in the component. Null session data
or any service failure (`format-mismatch` / `save-failed`) returns the single
message *"We couldn't save the questions for evaluation. Please try again."* —
the service logs the detail server-side and never leaks internals.

## TASK-017 Refactoring

`generateQuestions(context, questionTypes, provider?)` is back to its pre-TASK-017
signature and return type (`stage: "prompt" | "provider" | "validation"`), with
no `saveGeneration` call and no `config` parameter. `generateQuestionsAction`
back to 2 args. `/generate` back to the simple inline result state + full-page
failure. `app/generate/_components/generation-issue-dialog.tsx` deleted.

## Duplicate Save Protection

- `PracticeSessionProvider` gains `savedGenerationContextId: string | null`
  (+ setter, + `initialSavedGenerationContextId` prop for tests).
- On success the page sets it; `const saved = savedGenerationContextId !== null`
  then hides the button entirely and renders a disabled "Saved for evaluation"
  pill + a `role="status"` success line.
- The dialog is rendered `open={saveDialogOpen && !saved}`, and the in-flight
  `useRef` guard prevents a double request within one save.

## Success / Failure UX

- Success: `role="status"` — *"Questions saved successfully for evaluation."* —
  under the disabled pill; questions stay on screen; no navigation.
- Failure: `role="alert"` inside the dialog with the generic message; primary
  button becomes **Try Again**; question cards untouched.

## TDD

Written before implementation:

- `tests/unit/save-generation-action.test.ts` — forwards the session objects to
  the service; returns `{ ok, generationContextId }`; any `null` input →
  `{ ok: false }` and the service is not called; `format-mismatch` /
  `save-failed` both collapse to the generic message with no leaked internals.
- `tests/integration/questions-screen.test.tsx` (extended) — button opens the
  dialog with the confirmation message; Cancel closes without calling the action;
  confirm calls the action exactly once and shows the disabled "Saving…" state;
  success → status banner + button gone + can't reopen; failure → alert +
  "Try Again" + cards still present; a session seeded with
  `savedGenerationContextId` renders the saved state and never offers to save.

## Verification

| Check | Result |
|---|---|
| `npx vitest run` | pass (was carried forward into TASK-019's final run: 225) |
| `npx tsc --noEmit` | clean |
| `npx eslint .` | clean |
| `npx prisma validate` | valid (no schema change) |
| Manual UI / DB / cancel / save / duplicate / failure | **not performed** — no live AI key or DB in this environment; steps unchanged from the TASK-017 feedback's manual list, plus: confirm the DB stays empty until the button is used, then holds exactly one run. |

## Issues / Decisions

1. **Generic failure message for both reasons.** TASK-018 §12 specifies one
   user-facing string; `format-mismatch` (bad AI output) and `save-failed` (DB
   error) both use it. TASK-019 makes `format-mismatch` nearly unreachable from
   this path anyway (generation now rejects such responses upstream).
2. **`GenerationIssueDialog` (TASK-017) deleted** rather than repurposed — the
   Questions-page dialog is a confirm→loading→error flow, a different shape.
3. Motion's `AnimatePresence` exit animation keeps the dialog briefly in the DOM
   after close; the component tests wrap the "dialog gone" assertions in
   `waitFor`.
