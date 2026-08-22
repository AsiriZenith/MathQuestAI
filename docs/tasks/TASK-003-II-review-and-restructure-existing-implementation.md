# TASK-003-II — Review and Restructure Existing Implementation

## Status

Planned — created by TASK-003-I. **Must be executed separately after review/approval.** Do not execute automatically.

---

## Objective

Bring `app/page.tsx` (the Setup screen, TASK-002) in line with the component-extraction pattern already used by the other three routes (`app/generate/page.tsx`, `app/questions/page.tsx`, `app/evaluation/page.tsx`), each of which extracted page-local pieces into a `_components/` folder. Close the test-first gap for the extracted pieces specifically, since TASK-002's tests were written after implementation rather than test-first.

This is the only corrective work identified during TASK-003-I's review that rises to the level of a real, evidence-based structural inconsistency. Other observations from that review (uncommitted work backlog, `docs/development.md` gap, `CLAUDE.md`'s stale path reference) are recorded in the TASK-003-I report but are explicitly **not** part of this task's scope — none of them require restructuring.

---

## Findings

| ID | Severity | Area | Current state | Problem | Why it matters | Recommended solution |
|---|---|---|---|---|---|---|
| F1 | Low | `app/page.tsx` | 240 lines, single file, all markup inline | The Grade/Subject/Topic "Fixed" field blocks are 3 near-identical ~15-line JSX blocks (only the label and value text differ) | Duplicated markup is harder to change consistently (e.g. a style tweak needs editing 3 places) and doesn't match the extraction pattern already used elsewhere in this codebase | Extract a `FixedField` component (`label`, `value` props) and use it 3 times |
| F2 | Low | `app/page.tsx` | Difficulty toggle group (3-button) inlined in the page | Self-contained, stateful-looking UI block that's a natural extraction candidate, consistent with `app/questions/_components/question-card.tsx` etc. | Improves readability of the page component and makes the toggle group independently testable | Extract a `DifficultyToggle` component (`value`, `onChange` props) |
| F3 | Low | `app/page.tsx` | Question Type chip group + "auto mix" toggle inlined in the page | Same reasoning as F2 — a self-contained, multi-element UI block | Same as F2 | Extract a `QuestionTypeChips` component (`selectedTypes`, `autoTypes`, `onToggleType`, `onToggleAuto` props) |
| F4 | Low (process) | `tests/integration/setup-form.test.tsx` and related | Tests for the Setup page were written after `app/page.tsx` was implemented | Not strict RED→GREEN→REFACTOR as `CLAUDE.md` mandates for meaningful UI behavior, even though the tests are real and meaningful | Since this task is already touching the Setup page, it's a natural place to close the gap for the newly-extracted pieces specifically | Write new unit tests for `FixedField`, `DifficultyToggle`, and `QuestionTypeChips` *before* extracting them (test-first against the target component API), then extract to make them pass |

No other findings from the TASK-003-I review rose to a severity or concreteness level warranting inclusion here.

---

## Files affected

- `app/page.tsx` — reduced to composing the extracted pieces plus the remaining page-level logic (`canGenerate`, `handleGenerate`, layout/heading markup).
- `app/_components/fixed-field.tsx` — new.
- `app/_components/difficulty-toggle.tsx` — new.
- `app/_components/question-type-chips.tsx` — new.
- `tests/unit/fixed-field.test.tsx` — new.
- `tests/unit/difficulty-toggle.test.tsx` — new.
- `tests/unit/question-type-chips.test.tsx` — new.
- `tests/integration/setup-form.test.tsx` — updated only if extraction changes any selector/role text used by existing tests (expected: no change, since the rendered output should be identical).

---

## TDD plan

For each of the three extracted components:

```text
RED
  Write a unit test against the target component's props/behavior
  (e.g. FixedField renders label + value + "Fixed" badge;
  DifficultyToggle calls onChange with the clicked value, or "" if
  the already-selected option is clicked again; QuestionTypeChips
  reflects selected state and enforces the auto-mix mutual exclusion).
  Run it — it must fail because the component doesn't exist yet.
↓
GREEN
  Implement the minimal component that makes the test pass.
↓
REFACTOR
  Replace the corresponding inline block in app/page.tsx with the
  new component. Re-run the full test suite (including the existing
  tests/integration/setup-form.test.tsx and type-selection.test.tsx)
  to confirm the page's observable behavior is unchanged.
```

Repeat for each of the 3 components, one at a time, rather than extracting all three before running tests.

---

## Scope

**In scope:**
- Extracting the 3 identified pieces from `app/page.tsx` into `app/_components/`.
- Writing test-first unit tests for each extracted piece.
- Confirming existing integration tests for the Setup page still pass unchanged (they test observable behavior, which should not change).

**Out of scope (explicitly not part of this task):**
- Any change to `app/generate/`, `app/questions/`, `app/evaluation/`, or their `_components/` — already follow the established pattern.
- Any change to `lib/mock-data.ts` or `lib/types.ts`, including the forward-looking `PracticeConfig.subtopic` typing note from the TASK-003-I review — that belongs to TASK-005 (dynamic educational data loading), once real Subject/Topic/Subtopic IDs exist.
- Committing the uncommitted TASK-002/TASK-003 work backlog — a separate, explicit git action, not a restructuring concern.
- `docs/development.md` creation or `CLAUDE.md`'s stale path fix — documentation-only items, not implementation restructuring.
- Any database, Prisma, or AI-integration work.
- Any visual/design change — the rendered output must remain visually and functionally identical to the current Setup screen.

---

## Acceptance criteria

- [ ] `FixedField`, `DifficultyToggle`, and `QuestionTypeChips` exist under `app/_components/`, each with a test-first unit test written and failing before implementation.
- [ ] `app/page.tsx` uses all three extracted components in place of the previously inlined markup.
- [ ] The Setup screen's rendered output and behavior are unchanged (manually verified in the browser, side-by-side with the pre-change version if practical, or via the existing passing integration tests).
- [ ] All existing tests (`tests/unit/`, `tests/integration/`) continue to pass, plus the new unit tests for the 3 extracted components.
- [ ] `npm run lint` and `npm run build` pass.
- [ ] No files outside the "Files affected" list above are modified.

---

## Execution boundary

> **TASK-003-II must be executed separately after TASK-003-I has been reviewed and approved.** It was not, and must not be, executed automatically as part of TASK-003-I.
