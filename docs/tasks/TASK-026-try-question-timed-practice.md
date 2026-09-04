# TASK-025 — Implement “Try Question” Timed Practice Flow

## Objective

Implement the currently non-functional **“Try Question”** action on the Questions page.

The purpose of this feature is to let the user attempt an individual generated question for a user-selected amount of time, and then reveal the correct answer and explanation.

This is a lightweight self-practice feature.

The first version should stay simple:

```text
Try Question
    ↓
Choose / adjust practice time
    ↓
Start timer
    ↓
User attempts the question
    ↓
Timer may reach 0
    ↓
No automatic action required
    ↓
User can reveal Answer + Explanation
```

Do not turn this into a scoring, submission, or evaluation feature.

---

## 1. Current UI

On the Questions page, each generated question card currently includes:

```text
Try Question →
```

This action is visible but not functional yet.

Each generated question already has the data required for the next step, including:

```text
questionText
questionType
options (when applicable)
correctAnswer / expected answer
explanation
```

Use the actual current types and property names from the implementation.

Do not duplicate or invent another question model.

---

## 2. Core User Flow

When the user clicks:

```text
Try Question
```

open a practice experience for that specific question.

Recommended flow:

```text
Question Card
    ↓
Try Question
    ↓
Practice view / dialog
    ↓
Set preferred time
    ↓
Start
    ↓
Countdown
    ↓
User attempts question
    ↓
View Answer
    ↓
View Explanation
```

The implementation should follow the project's existing UI/component conventions.

Use a **dedicated focused practice/countdown page or full-page practice view** for the selected question.

The purpose is to make the chosen question much easier to focus on than it is inside the normal Questions list.

The user should clearly see:

```text
Selected Question
Countdown Timer
Question Type
Question Text
Options (if applicable)
Practice actions
```

Do not keep the timed attempt as a small inline expansion inside the existing question card.

A dedicated route such as:

```text
/questions/practice
```

or another route consistent with the current Next.js App Router structure is preferred.

If the existing architecture strongly favors a full-screen state instead of a new route, that is acceptable, but the result must feel like a separate focused countdown/practice screen rather than a small dialog.

---

## 2A. Focused Countdown / Practice Page

When the user clicks:

```text
Try Question
```

the selected question should be shown in a **clear, focused practice experience**.

The normal Questions page contains many question cards and navigation controls. Those should not compete visually with the selected question while the user is attempting it.

The practice/countdown page should give visual priority to:

```text
Question number
Question type
Question text
Answer options when applicable
Countdown timer
Start / reveal-answer actions
```

Recommended layout concept:

```text
Back to Questions

Question 3
Type: Multiple Choice

        02:00
      Time Remaining

--------------------------------

Solve:
[Selected question shown prominently]

A. ...
B. ...
C. ...
D. ...

--------------------------------

[Start / View Answer]
```

The exact visual design should follow the current MathQuestAI design system.

### Important UX requirement

The selected question must be easier to read here than on the normal Questions list.

Use:

- clear spacing
- a prominent question area
- readable typography
- clearly separated answer options
- a highly visible countdown timer

Do not make the timer visually overpower the question itself. Both the question and remaining time should be immediately understandable.

### Navigation

Provide a clear way to return to:

```text
Questions
```

When returning, the original generated-question list should remain available.

No practice state needs to be persisted after leaving this page.


---

## 3. Time Selection

Before starting the attempt, allow the user to adjust the practice duration.

Keep this simple.

For example, support a small duration control such as:

```text
1 minute
2 minutes
3 minutes
5 minutes
```

or a simple numeric duration input if that better matches the current UI.

The user must be able to change the suggested/default time before starting.

Use a sensible default.

Do not build a complex timer-settings system.

---

## 4. Timer Behavior

Once the user starts:

```text
selected duration
    ↓
countdown begins
```

Display the remaining time clearly.

Example:

```text
01:42
```

The timer is only a practice aid.

### When the timer reaches zero

Do **not** automatically:

- submit anything
- close the dialog
- navigate away
- reveal the answer
- mark the question correct/incorrect
- save a result
- trigger evaluation

Simply stop at:

```text
00:00
```

The user should still be able to continue viewing the question and manually reveal the answer/explanation.

---

## 5. Answer and Explanation

The user should not see the answer/explanation immediately when the timed attempt starts.

Provide a manual action such as:

```text
View Answer
```

After the user chooses it, show:

```text
Correct Answer
```

and allow/show:

```text
Explanation
```

A simple flow is acceptable:

```text
View Answer
    ↓
Correct Answer
    ↓
Explanation
```

If the existing design works better with:

```text
View Answer & Explanation
```

as a single action, that is also acceptable.

The important requirement is that these are hidden during the initial attempt and revealed only by user action.

---

## 6. Question Types

The feature should work with all currently supported generated question types:

```text
mc  → Multiple Choice
fib → Fill in the Blank
wp  → Word Problem
tf  → True / False
ms  → Multi-step Problem
```

For Multiple Choice, display the existing options.

For other question types, display the question using the existing question-card data.

Do not create question-type-specific scoring or answer-entry logic in this task.

---

## 7. No Answer Submission in This Version

This task is for **self-practice**, not automatic grading.

The user does not need to:

- submit an answer
- receive correct/incorrect feedback
- store a selected option
- persist an attempted answer
- receive a score

The user attempts the question mentally/on paper and then reveals the answer.

Keep this task focused.

---

## 8. State Scope

The timer/practice state belongs to the currently opened question attempt.

It should not affect:

```text
GenerationContext
savedGenerationContextId
evaluationData
comparisonData
```

Closing the practice view should be enough to discard the timer state.

No database persistence is required.

---

## 9. Reopening a Question

If the user closes the Try Question experience and opens it again:

```text
timer state
answer visibility
selected duration
```

should reset for a fresh attempt.

Do not preserve practice timer state between openings in this version.

---

## 10. Multiple Questions

The feature should work independently for every question card.

Example:

```text
Question 1 → Try Question
Question 2 → Try Question
Question 3 → Try Question
```

Opening one question should not carry:

```text
remaining time
answer reveal state
selected duration
```

into another question.

---

## 11. Suggested UI States

The implementation can use states similar to:

```text
SETUP
RUNNING
FINISHED
ANSWER_REVEALED
```

This is only a conceptual suggestion.

Use the smallest state model that fits the existing codebase.

---

## 12. Accessibility / UX

Keep the interaction clear and keyboard-friendly.

At minimum:

- buttons should be real button elements
- timer text should be readable
- dialog should follow existing accessible dialog behavior
- answer reveal should not depend only on color
- closing the dialog should work consistently with existing dialogs

Do not redesign the Questions page itself. The new focused practice/countdown experience should be separate from the normal question-list layout.

---

## 13. TDD Requirements

Follow TDD:

```text
RED
↓
failing test
↓
GREEN
↓
minimum implementation
↓
REFACTOR
```

---

## 14. Required Tests

Add tests covering at least:

### Open focused practice page

```text
Click Try Question
→ focused countdown/practice page opens
→ selected question is clearly visible
```

Verify that the selected question shown is the exact question whose `Try Question` action was clicked.

### Time selection

```text
change duration
→ selected duration is used
```

### Start timer

```text
Start
→ countdown begins
```

### Timer reaches zero

```text
timer → 00:00
```

Verify that it does **not**:

- close
- submit
- navigate
- reveal answer automatically

### Reveal answer

```text
View Answer
→ correct answer visible
→ explanation visible
```

### Close and reopen

```text
close
→ reopen same question
```

Verify fresh state.

### Different question

Open Question 1, close it, then open Question 2.

Verify state does not leak between questions.

### Multiple Choice

Verify existing options are shown correctly.

### Non-Multiple Choice

Verify the practice flow works without MC options.

---

## 15. Existing Functionality Must Remain Unchanged

Do not break:

- question generation
- Regenerate
- Edit Setup
- Save for Evaluation
- Evaluate Results
- Compare with Previous Generations
- question coverage UI
- question cards
- current generated question rendering

This task should be additive.

---

## 16. No Database / Prisma Changes

This feature is entirely client-side/UI-state based.

Do NOT:

- add database tables
- add database columns
- create migrations
- update GenerationContext
- persist timer state
- persist attempts
- persist revealed answers

No Prisma changes are expected.

---

## 17. Agent Feedback

Create:

```text
docs/agent-feedbacks/TASK-025-try-question-timed-practice.md
```

Include:

### Summary
What was implemented.

### UX Flow
Describe the Try Question flow.

### Timer
Explain duration selection, countdown, and zero-time behavior.

### Answer / Explanation
Explain how the user reveals them.

### Question Types
Explain how the feature behaves across supported types.

### State
Explain where practice/timer state lives and how it resets.

### TDD
List tests added and what they protect.

### Verification
Report actual results for:

- targeted tests
- full tests
- TypeScript
- ESLint
- build if normally used

Do not claim a check passed unless it was actually run.

### Follow-ups
Document only genuine follow-up ideas, such as future answer submission/scoring, but do not implement them in this task.

---

## 18. Manual Verification

Manually verify:

```text
Questions page
    ↓
Click Try Question
    ↓
Select/change duration
    ↓
Start
    ↓
Countdown
    ↓
Timer reaches zero
    ↓
Nothing automatic happens
    ↓
Click View Answer
    ↓
Correct answer + explanation visible
```

Also verify:

```text
close
→ open another question
→ fresh timer/reveal state
```

---

## 19. Acceptance Criteria

TASK-025 is complete when:

- [ ] Try Question is functional.
- [ ] Clicking Try Question opens a focused countdown/practice page or equivalent full-page view.
- [ ] The exact selected question is shown prominently and clearly.
- [ ] Multiple-choice options are clearly visible when applicable.
- [ ] User can easily return to the Questions page.
- [ ] User can choose/adjust practice duration.
- [ ] User can start a countdown.
- [ ] Timer stops at `00:00`.
- [ ] No automatic action happens when time expires.
- [ ] Answer remains hidden until the user chooses to reveal it.
- [ ] Correct answer is displayed.
- [ ] Explanation is displayed.
- [ ] The feature works for all current question types.
- [ ] Practice state resets when the view is closed/reopened.
- [ ] Practice state does not leak between questions.
- [ ] Existing Questions page functionality remains intact.
- [ ] No database/Prisma changes are introduced.
- [ ] TDD tests pass.
- [ ] Agent feedback is created.

---

## 20. Out of Scope

Do NOT implement in this task:

- automatic grading
- answer submission
- storing user answers
- attempt history
- scoring
- evaluation integration
- comparison integration
- timer persistence
- notifications when time expires
- sounds
- pause/resume unless already trivial in existing timer utilities
- analytics
