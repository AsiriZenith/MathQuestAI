# TASK-026 — Add Custom Practice Time to Try Question

## Objective

Enhance the existing **Try Question** practice page by allowing the user to enter a **custom practice duration** in addition to the existing predefined time options.

The current page already provides preset choices such as:

```text
1 minute
2 minutes
3 minutes
5 minutes
```

The user must also be able to choose:

```text
Custom time
```

without removing the existing preset buttons.

---

## 1. Current Behavior

The Try Question page currently shows:

```text
Practice time

[1 minute] [2 minutes] [3 minutes] [5 minutes]

[Start]
```

This existing behavior should remain.

The selected preset is used as the countdown duration.

---

## 2. Required New Behavior

Add a way for the user to specify their own practice time.

Recommended interaction:

```text
Practice time

[1 minute] [2 minutes] [3 minutes] [5 minutes]

Custom time:
[    7    ] minutes

[Start]
```

The exact visual styling should follow the existing MathQuestAI design system.

Do not redesign the whole practice page.

---

## 3. Custom Time Input

Use a simple numeric input for custom duration.

Recommended rules:

```text
Unit: minutes
Minimum: 1 minute
Maximum: 60 minutes
Whole numbers only
```

Examples of valid values:

```text
1
4
7
10
15
30
60
```

Examples of invalid values:

```text
0
-1
1.5
61
text
empty value when Custom is selected
```

If the current timer utility naturally supports another safe range, inspect the implementation and use the smallest reasonable adjustment, but document it in feedback.

Do not introduce hours/seconds configuration in this task.

---

## 4. Preset vs Custom Selection

The user should have one active duration source at a time.

### If a preset is selected

Example:

```text
2 minutes
```

then the timer should start using:

```text
120 seconds
```

### If the user enters a custom value

Example:

```text
7 minutes
```

then the custom value becomes the active duration:

```text
420 seconds
```

The UI should make it clear whether the active value comes from:

```text
preset
```

or:

```text
custom
```

Do not allow ambiguous state where a preset appears selected while the timer actually uses a different custom value.

A simple approach is acceptable:

```text
Typing a valid custom value
→ clears/deselects the current preset

Clicking a preset
→ preset becomes active
→ custom mode is no longer active
```

Use the approach that best fits the current component implementation.

---

## 5. Start Button Validation

The **Start** button must only start a timer when the selected duration is valid.

For custom time:

```text
Custom = empty
→ do not start

Custom = 0
→ do not start

Custom = 61
→ do not start

Custom = 7
→ start 7-minute countdown
```

Show a small clear validation message when necessary.

Example:

```text
Enter a whole number between 1 and 60 minutes.
```

Do not use browser alerts.

---

## 6. Timer Behavior

Do not change the existing timer rules from TASK-025.

The selected duration, whether preset or custom, should feed the same countdown logic.

Example:

```text
Custom = 7 minutes
        ↓
Start
        ↓
07:00
06:59
06:58
...
00:00
```

When the timer reaches:

```text
00:00
```

still do **nothing automatically**.

Do not:

- submit
- close the page
- reveal the answer automatically
- navigate
- score the attempt
- persist anything

The user can manually reveal the answer/explanation as already implemented.

---

## 7. Reset Behavior

When the user leaves the Try Question page and starts a fresh Try Question attempt:

```text
custom time
selected preset
remaining timer
answer reveal state
```

should reset according to the current TASK-025 fresh-attempt behavior.

Do not persist custom duration between question attempts in this version.

---

## 8. Accessibility / Input UX

Use an accessible numeric input.

At minimum:

- provide a visible label
- associate the label with the input
- expose validation text accessibly
- prevent invalid timer start
- make selection state clear without relying only on color

Do not over-engineer the control.

---

## 9. No Database / Prisma Changes

This remains temporary UI state.

Do NOT:

- create tables
- add columns
- add migrations
- modify Prisma
- store preferred practice time
- persist timer settings

No backend change should be required unless the current Try Question implementation unexpectedly depends on server state.

---

## 10. TDD Requirements

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

## 11. Required Tests

Add/update tests for:

### Existing preset still works

```text
select 2 minutes
→ Start
→ timer begins at 02:00
```

### Custom value

```text
enter 7
→ Start
→ timer begins at 07:00
```

### Custom overrides preset

```text
2-minute preset selected
→ enter custom 7
→ Start
→ timer begins at 07:00
```

The UI should no longer present the 2-minute preset as the active duration.

### Preset selected after custom

```text
enter custom 7
→ click 3 minutes
→ Start
→ timer begins at 03:00
```

### Invalid custom — zero

```text
custom = 0
→ Start prevented
→ validation shown
```

### Invalid custom — above maximum

```text
custom = 61
→ Start prevented
→ validation shown
```

### Invalid custom — decimal

```text
custom = 1.5
→ Start prevented
→ validation shown
```

### Empty custom state

If Custom mode is active with no value:

```text
Start prevented
```

### Timer expiry

Verify custom durations still follow the existing behavior:

```text
00:00
→ no automatic action
```

---

## 12. Regression Requirements

Do not break existing TASK-025 behavior:

- Try Question navigation
- selected question display
- predefined time buttons
- countdown
- Back to Questions
- View Answer
- explanation display
- fresh state when reopening
- question-type handling

Do not modify unrelated Questions page behavior.

---

## 13. Manual Verification

Verify:

```text
Open a question
→ Try Question
→ choose 2-minute preset
→ timer works
```

Then:

```text
Open another fresh attempt
→ enter custom 7 minutes
→ Start
→ countdown begins at 07:00
```

Also verify:

```text
custom 7
→ click preset 3 minutes
→ timer uses 03:00
```

and:

```text
invalid custom value
→ Start prevented
→ useful validation message shown
```

---

## 14. Agent Feedback

Create:

```text
docs/agent-feedbacks/TASK-026-custom-practice-time.md
```

Include:

### Summary
What was added.

### UI
Explain how custom time is presented alongside preset options.

### Selection Rules
Explain how preset/custom precedence works.

### Validation
Document accepted range and invalid-value behavior.

### Timer Integration
Explain how custom minutes are converted into the existing countdown duration.

### State Reset
Explain how custom state resets for a fresh attempt.

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

## 15. Acceptance Criteria

TASK-026 is complete when:

- [ ] Existing preset times still work.
- [ ] User can enter a custom number of minutes.
- [ ] Custom time can be used to start the countdown.
- [ ] Only one duration source is active at a time.
- [ ] Entering a custom value does not leave a misleading preset selection active.
- [ ] Clicking a preset after custom input uses the preset.
- [ ] Invalid custom values cannot start the timer.
- [ ] Validation is clear.
- [ ] Timer behavior at `00:00` remains unchanged.
- [ ] Custom time is not persisted.
- [ ] Existing TASK-025 behavior remains intact.
- [ ] No database/Prisma changes are introduced.
- [ ] TDD tests pass.
- [ ] Agent feedback is created.

---

## 16. Out of Scope

Do NOT implement:

- saved timer preferences
- seconds-level custom input
- hour-level duration
- pause/resume changes
- timer sounds
- notifications
- attempt persistence
- answer submission
- scoring
- evaluation integration
