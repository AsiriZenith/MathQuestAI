# TASK-027 — Add Next Question Navigation to Try Question Practice Flow

## Objective

Enhance the existing **Try Question** practice flow so the user can move through generated questions one by one after viewing the answer/explanation.

The intended behavior is:

```text
Try Question
    ↓
Attempt question
    ↓
View Answer / Explanation
    ↓
Next Question
    ↓
Attempt next generated question
```

For the final generated question:

```text
View Answer / Explanation
    ↓
Back to Questions
```

The user should not be forced to return to the Questions page after every question.

---

## 1. Current Behavior

The Try Question practice page currently supports:

```text
Selected generated question
Practice timer
Correct answer
Explanation
Back to Questions
```

After the user reveals the answer/explanation, there is currently no dedicated action to continue directly to the next generated question.

---

## 2. New Navigation Rule

Once the user has revealed the answer/explanation for the current question, show a bottom action:

```text
Next Question
```

The action should move directly to the next generated question in the current generated-question list.

Example:

```text
Question 2
    ↓
View Answer / Explanation
    ↓
Next Question
    ↓
Question 3
```

Do not require the user to return to the Questions page first.

---

## 3. Final Question Behavior

When the user is viewing the **last generated question**, do not show:

```text
Next Question
```

Instead, enable/show:

```text
Back to Questions
```

or the existing equivalent Questions-page redirect action.

Conceptually:

```text
Question 10
    ↓
View Answer / Explanation
    ↓
Back to Questions
```

The exact button label should follow the current UI conventions.

---

## 4. Button Visibility

The navigation action should become available **after the answer/explanation has been revealed**.

Before reveal:

```text
Question displayed
Timer running / finished
Answer still hidden
```

Do not show an active:

```text
Next Question
```

button yet.

After reveal:

```text
Correct Answer visible
Explanation visible
```

then show:

```text
Next Question
```

for non-final questions.

This keeps the intended practice flow:

```text
Attempt
→ Reveal
→ Continue
```

---

## 5. Selected Question Order

Use the existing generated-question order.

For example:

```text
Question 1
Question 2
Question 3
...
Question N
```

If the generated questions use:

```text
questionNumber
```

or array order, inspect the current implementation and use the most reliable existing ordering source.

Do not invent a second ordering system.

---

## 6. Next Question State Reset

When the user moves to the next question:

```text
Question N
    ↓
Next Question
    ↓
Question N+1
```

the next question must start as a fresh practice attempt.

Reset:

```text
selected practice duration
remaining timer
timer running/finished state
answer visibility
explanation visibility
```

Use the same default practice-time behavior already established by TASK-025/TASK-026.

Do not carry the previous question's timer or reveal state into the next one.

---

## 7. Question Data

When navigating to the next question, update all displayed data to match that question:

```text
Question number
Question type
Question text
Options (if applicable)
Correct answer
Explanation
```

The page must never show:

```text
Question 3 title
+
Question 2 answer/explanation
```

or other stale data.

---

## 8. Timer Integration

Do not change the timer rules.

For every newly opened next question:

```text
choose preset/custom time
→ Start
→ countdown
```

The timer behavior from TASK-025/TASK-026 remains unchanged.

When the countdown reaches:

```text
00:00
```

nothing automatic happens.

The user must still manually reveal the answer/explanation before moving on.

---

## 9. Preserve Direct Back Navigation

The existing top:

```text
Back to Questions
```

navigation should remain available according to the current design.

The new bottom action does not replace the user's ability to leave the practice flow early.

So:

```text
Top Back to Questions
```

can remain available throughout.

The new bottom action is specifically the guided practice progression.

---

## 10. Recommended Bottom Actions

### Non-final question, before reveal

```text
No Next Question action
```

### Non-final question, after reveal

```text
[ Next Question ]
```

### Final question, before reveal

```text
No final-navigation action
```

### Final question, after reveal

```text
[ Back to Questions ]
```

Follow the existing MathQuestAI styling.

---

## 11. Routing / State

Inspect how TASK-025 currently passes the selected question to the practice page.

Extend that mechanism cleanly so the practice page knows:

```text
current question
current position/index
generated questions list
whether next question exists
```

Do not introduce database persistence.

The navigation should work entirely from the current generated-question session data.

---

## 12. Missing Session Data

If the user somehow navigates directly to the practice route without valid generated-question session data, preserve the current safe behavior.

Do not render a broken Next button.

Use the project's existing fallback/navigation approach.

---

## 13. Accessibility / UX

At minimum:

- Next Question must be a real button/link as appropriate.
- The control must have a clear accessible label.
- The final action must clearly communicate return to the Questions page.
- Do not rely only on color to indicate enabled/disabled state.
- Focus/navigation behavior should remain reasonable when the question changes.

Do not redesign the page.

---

## 14. TDD Requirements

Follow TDD:

```text
RED
↓
Failing test
↓
GREEN
↓
Minimum implementation
↓
REFACTOR
```

---

## 15. Required Tests

### Next button hidden before reveal

```text
Question 2 opened
answer hidden
```

Verify:

```text
Next Question
```

is not available yet.

### Next button appears after reveal

```text
Question 2
→ View Answer / Explanation
```

Verify:

```text
Next Question
```

is available.

### Navigate to next question

```text
Question 2
→ Next Question
```

Verify:

```text
Question 3
```

is displayed with its own content.

### State reset

After moving from Question 2 to Question 3, verify:

```text
timer reset
answer hidden
explanation hidden
practice duration reset to current default behavior
```

### Final question

For the final generated question:

```text
View Answer / Explanation
```

verify:

```text
Next Question
```

is not shown and:

```text
Back to Questions
```

is available.

### Return to Questions

Click the final bottom action and verify navigation returns to the Questions page.

### Data integrity

Verify the next question uses its own:

```text
questionType
questionText
options
correctAnswer
explanation
```

### Multiple question types

Verify navigation works between different question types, such as:

```text
Question 1 → mc
Question 2 → fib
```

without stale options/data carrying over.

---

## 16. Regression Requirements

Do not break existing behavior from TASK-025/TASK-026:

- selected-question practice page
- preset practice times
- custom practice time
- countdown
- zero-time behavior
- answer reveal
- explanation reveal
- top Back to Questions navigation
- question-type rendering
- fresh-state behavior

Do not change:

- Save for Evaluation
- Evaluate Results
- Compare with Previous Generations
- generation persistence
- evaluation logic

---

## 17. No Database / Prisma Changes

No database changes are required.

Do NOT:

- create tables
- add columns
- modify Prisma schema
- create migrations
- persist question-attempt progress
- persist current practice index
- persist timer state

This feature remains session/UI-state based.

---

## 18. Manual Verification

Verify a multi-question flow such as:

```text
Question 1
→ Try Question
→ choose time
→ Start
→ View Answer / Explanation
→ Next Question

Question 2
→ fresh state
→ choose time
→ Start
→ View Answer / Explanation
→ Next Question

...

Final Question
→ View Answer / Explanation
→ Back to Questions
```

Also verify that the user can use the top:

```text
Back to Questions
```

at any point.

---

## 19. Agent Feedback

Create:

```text
docs/agent-feedbacks/TASK-027-next-question-practice-navigation.md
```

Include:

### Summary
What was implemented.

### Navigation Flow
Explain how the practice page moves from one generated question to the next.

### Reveal Gate
Explain why Next Question becomes available only after answer/explanation reveal.

### Final Question
Explain how the last-question behavior differs.

### State Reset
Explain what is reset when moving to the next question.

### Routing / Data
Explain how the current question index/next question is resolved.

### TDD
List tests added/updated.

### Verification
Report actual results for:

- targeted tests
- full tests
- TypeScript
- ESLint
- build if normally used

Do not claim a check passed unless it was actually run.

### Follow-ups
Document only genuine follow-up ideas.

---

## 20. Acceptance Criteria

TASK-027 is complete when:

- [ ] Next Question is not available before answer/explanation reveal.
- [ ] Next Question appears after reveal for non-final questions.
- [ ] Clicking Next Question opens the next generated question.
- [ ] The next question starts with fresh timer/reveal state.
- [ ] Correct question data is shown after navigation.
- [ ] Final question does not show Next Question.
- [ ] Final question shows/enables Back to Questions after reveal.
- [ ] Final action returns to the Questions page.
- [ ] Existing top Back to Questions navigation remains available.
- [ ] TASK-025/TASK-026 timer behavior remains unchanged.
- [ ] No database/Prisma changes are introduced.
- [ ] TDD tests pass.
- [ ] Agent feedback is created.

---

## 21. Out of Scope

Do NOT implement:

- progress persistence
- answered/unanswered history
- scoring
- answer submission
- automatic navigation when timer expires
- automatic navigation when answer is revealed
- previous-question navigation
- attempt analytics
- database persistence
