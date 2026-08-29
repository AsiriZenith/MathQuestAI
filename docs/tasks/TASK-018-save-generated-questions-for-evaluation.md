# TASK-018 — Save Generated Questions for Evaluation

## Objective

Add an explicit **Save for Evaluation** action to the Questions page.

TASK-017 established the persistence foundation. TASK-018 adds the user-controlled save flow: generated questions remain available for review, and database persistence happens only after the user explicitly confirms that they want to save them for future evaluation.

Do NOT implement the Evaluation page itself.

---

## 1. Important Behavioral Change

Target flow:

```text
Generate Questions
       ↓
Questions Page
       ↓
Generated questions remain in current state/session
       ↓
User clicks "Save for Evaluation"
       ↓
Confirmation Dialog
       ↓
 ┌───────────────┬────────────────────┐
 │ Cancel/Close  │ Save for Evaluation│
 │       ↓       │         ↓          │
 │  Nothing saved│  Persist generation│
 └───────────────┴──────────┬─────────┘
                            ↓
                       Success / Failure
```

If TASK-017 currently persists automatically during AI generation, refactor that behavior so generation itself does NOT persist the generation before user confirmation.

**Do not create duplicate records.**

---

## 2. Before Making Changes

Carefully review:

- `CLAUDE.md`
- `README.md`
- TASK-016 feedback
- TASK-017 feedback
- Questions page
- Generate page
- Existing generation state/session handling
- Existing server actions
- Existing persistence service
- Existing domain/persistence types
- Existing dialog/modal components
- Existing notification/toast components
- Existing tests

Reuse existing architecture. Do not introduce a second persistence or UI pattern unnecessarily.

---

## 3. Questions Page Action

Add a clear button:

```text
Save for Evaluation
```

Do not use an ambiguous label such as just `Save`.

Follow the existing design system and Questions-page layout. Do not redesign the page.

---

## 4. Confirmation Dialog

Clicking the button must open a confirmation dialog.

Suggested content:

### Title

```text
Save Questions for Evaluation?
```

### Message

```text
Do you want to save these generated questions for evaluation?
```

Optionally, if appropriate to the existing UI:

```text
Do you want to save these generated questions for evaluation?
This will save the questions and their generation details so they can be evaluated later.
```

Actions:

```text
Cancel
Save for Evaluation
```

Canceling or closing the dialog must not save anything.

---

## 5. Save Operation

On confirmation, call a server-side action/service.

Architecture should remain approximately:

```text
Questions Page
      ↓
Server Action
      ↓
Persistence Service
      ↓
Prisma
      ↓
PostgreSQL
```

Do NOT put Prisma calls directly in React components.

Reuse the persistence functionality from TASK-017.

---

## 6. Data to Persist

Save the complete generation using the existing database design.

### GenerationContext

Persist:

- Name
- DifficultyLevel
- AIProvider
- AIModel
- Prompt
- CreatedAt

### Selected Question Types

Persist the applicable stable `QuestionType` codes:

```text
mc
fib
wp
tf
ms
```

Do not persist UI labels.

### Selected Question Patterns

Persist the selected `QuestionPatternId` values.

### GeneratedQuestions

Persist:

- GenerationContextId
- QuestionPatternId
- QuestionType
- QuestionNumber
- QuestionText
- ExpectedAnswer
- Explanation
- CreatedAt

Do not create another table or duplicate persistence model.

---

## 7. Preserve the Original Generation Context

Use the actual inputs that produced the current questions.

Do NOT reconstruct the generation context from displayed question text.

The saved generation must retain:

```text
User-selected configuration
        +
AI provider/model
        +
Prompt
        +
Generated questions
```

If the Questions page currently does not retain enough information to perform the save, identify the missing state/data and implement the smallest appropriate change.

Do not invent missing values.

---

## 8. Reuse TASK-017 Persistence

Do NOT copy/paste:

- GenerationContext insertion
- QuestionType insertion
- QuestionPattern insertion
- GeneratedQuestion insertion
- transaction logic
- AI response mapping

Refactor TASK-017's persistence service if necessary so it can be invoked from the explicit save action.

The application should have one reusable persistence operation rather than two separate implementations.

---

## 9. Transaction and Integrity

Continue using the atomic transaction implemented in TASK-017.

The complete save must succeed or fail as one unit:

```text
GenerationContext
      ↓
QuestionTypes
      ↓
QuestionPatterns
      ↓
GeneratedQuestions
```

If any persistence step fails, everything must roll back.

Continue enforcing:

- `DifficultyLevel`
- `QuestionType`
- selected QuestionType relationship
- selected QuestionPattern relationship
- GeneratedQuestion constraints

---

## 10. Prevent Duplicate Saves

After a successful save:

- prevent another accidental save of the same generation
- disable or hide the save action, or otherwise clearly mark it as saved

While saving:

- disable the confirmation button
- show a loading state such as `Saving...`
- prevent double-click/duplicate submissions

A single generation must not create multiple `GenerationContexts` because of repeated clicks.

---

## 11. Success State

After successful saving, keep the user on the Questions page and keep the generated questions visible.

Show a clear message, for example:

```text
Questions saved successfully for evaluation.
```

If the resulting `GenerationContextId` is needed by future evaluation functionality, retain it in the appropriate state.

Do not automatically navigate to the Evaluation page unless that is already established behavior.

---

## 12. Failure State

If saving fails, show a user-friendly message:

```text
We couldn't save the questions for evaluation. Please try again.
```

Do not expose:

- Prisma errors
- PostgreSQL errors
- stack traces
- API keys
- internal implementation details

Do not show a success message when persistence failed.

The generated questions must remain available so the user can retry.

---

## 13. Cancel Behavior

If the user:

- clicks Cancel
- closes the dialog
- clicks outside the dialog where the existing dialog behavior permits closing

then:

- close the dialog
- keep generated questions visible
- do not call the save action
- create no database records

---

## 14. TDD Requirements

This project follows TDD.

For each meaningful behavior:

```text
RED
Write failing test
      ↓
GREEN
Minimum implementation
      ↓
REFACTOR
      ↓
Next behavior
```

Do not implement the entire UI first and add tests afterward.

Use the existing test framework and conventions.

---

## 15. Required Tests

Add meaningful unit/component tests.

### Dialog

Test:

- Save for Evaluation opens the dialog
- correct confirmation message appears
- Cancel closes it
- closing it does not save
- confirmation triggers the save action

### Save behavior

Test:

- correct generation data is submitted
- persistence is not triggered before confirmation
- duplicate submissions are prevented
- loading state appears
- successful persistence produces the success state/message
- failed persistence produces the error state/message
- questions remain available after failure

### Already-saved state

Test:

- successful save prevents accidental second save
- `GenerationContextId` is retained if required

### Server action

Test:

- valid data reaches the persistence service
- success is returned correctly
- failure is handled safely
- internal database errors are not exposed to the client

Do not introduce a new test framework.

---

## 16. AI Generation Separation

The target architecture is:

```text
AI Generation
    │
    ├── Build prompt
    ├── Call AI provider
    ├── Validate response
    └── Return generated questions
             │
             ▼
       Questions Page
             │
             │ User confirms
             ▼
       Save Generation
             │
             ▼
         PostgreSQL
```

AI generation should not decide whether the user wants to persist the result.

The user controls persistence from the Questions page.

---

## 17. Evaluation Page

Do NOT implement or modify Evaluation functionality.

The only evaluation-related requirement is that saved questions are available for future evaluation.

---

## 18. Documentation

Review and update when necessary:

- `README.md`
- `CLAUDE.md`

Document the new user flow if appropriate:

```text
Generate → Review Questions → Save for Evaluation
```

Do not include secrets or API keys.

---

## 19. Verification

Before completing TASK-018:

1. Run the full test suite.
2. Run new/updated tests.
3. Run TypeScript type checking.
4. Run ESLint.
5. Run Prisma validation if database-related code changed.
6. Generate questions through the real UI.
7. Confirm questions appear on the Questions page.
8. Click `Save for Evaluation`.
9. Confirm the dialog appears.
10. Click Cancel and verify nothing is saved.
11. Open it again and confirm Save.
12. Verify PostgreSQL contains:
    - one GenerationContext
    - correct QuestionTypes
    - correct QuestionPatterns
    - all generated questions
13. Verify all GeneratedQuestions reference the correct GenerationContext.
14. Trigger save again and confirm duplicate persistence does not occur.
15. Test a save failure and confirm:
    - error message appears
    - no false success appears
    - generated questions remain visible
16. Confirm the Evaluation page was not modified.

---

## 20. Feedback

Create:

```text
docs/agent-feedbacks/TASK-018-save-generated-questions-for-evaluation.md
```

Include:

### Summary

What was implemented.

### User Flow

Explain the final Questions-page save flow.

### Confirmation Dialog

Document the final title, message, and actions.

### Persistence

Explain how the Questions page triggers the existing persistence service.

### TASK-017 Refactoring

If automatic persistence was removed from AI generation, explain what changed and why.

### Duplicate Save Protection

Explain how duplicate submissions are prevented.

### Success / Failure UX

Explain the final UI states/messages.

### TDD

List tests added and the behaviors they protect.

### Verification

Report actual results for:

- Full tests
- TypeScript
- ESLint
- Prisma validation
- Manual UI test
- Database verification
- Cancel behavior
- Successful save
- Duplicate-save behavior
- Failure behavior

Do not claim a check passed if it was not actually performed.

### Issues / Decisions

Document problems, assumptions, and decisions that should be reviewed.

---

## 21. Scope Boundary

TASK-018 is specifically:

> Allow the user to explicitly save the currently generated questions for future evaluation from the Questions page.

It includes:

- Save for Evaluation button
- Confirmation dialog
- Explicit persistence action
- Loading state
- Success state
- Failure state
- Duplicate-save protection
- TDD tests
- Necessary refactoring of TASK-017 automatic persistence

It does NOT include:

- Evaluation page implementation
- Evaluation calculations
- Evaluation analytics
- Generation history
- Editing saved questions
- Deleting saved generations
- Database schema changes unless a genuine blocker is discovered

After TASK-018 is completed, review the implementation and actual application behavior before deciding on another task.
