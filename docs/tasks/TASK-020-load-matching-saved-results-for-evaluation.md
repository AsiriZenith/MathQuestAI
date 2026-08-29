# TASK-020 — Load Matching Saved Results for Evaluation

## Objective

Enable the second option in the existing **Evaluate Results** dialog on the Questions page.

When the user chooses to evaluate against previously saved results, find all previously saved `GenerationContext` records whose generation criteria **exactly match the user's current selections**, display them in a selectable table, allow exactly one saved dataset to be selected, and navigate to the Evaluation page using the selected `GenerationContextId`.

TASK-018 already implemented Save for Evaluation. TASK-019 improved AI-generated `QuestionType` and `QuestionPatternId` metadata.

Do NOT redesign or break either feature.

## Target Flow

```text
Questions Page
      ↓
Evaluate Results
      ↓
Dialog
      ├── Existing option → keep working
      │
      └── Use Saved Results
              ↓
       Find matching GenerationContexts
              ↓
       Display matching saved contexts
              ↓
       User selects ONE
              ↓
       Continue to Evaluation
              ↓
       Evaluation Page
              ↓
       Load data using GenerationContextId
```

---

## 1. Before Making Changes

Carefully inspect the current project before implementing anything.

Review:

- `CLAUDE.md`
- `README.md`
- TASK-016 feedback
- TASK-017 feedback
- TASK-018 implementation and feedback
- TASK-019 implementation and feedback
- Current Questions page
- Existing Evaluate Results dialog
- Existing Evaluation page
- Current GenerationContext domain/type definitions
- GenerationContext persistence/repository
- GenerationContext ↔ QuestionPattern relationship
- GenerationContext ↔ QuestionType relationship
- GeneratedQuestions persistence
- Existing routing/navigation conventions
- Existing API/server-action/service conventions
- Existing tests

Do not assume previous task documents exactly match the current source code. Inspect the actual implementation.

---

## 2. Exact Matching Requirement

A saved `GenerationContext` is eligible only when its generation criteria are an **exact match** for the user's current selections.

Compare:

```text
DifficultyLevel
+
QuestionPattern set
+
QuestionType set
```

### DifficultyLevel

Must match exactly.

```text
Medium vs Hard → NOT a match
```

### QuestionPatterns

Must have exact set equality. Ordering must not matter.

```text
Current: A, B
Saved:   A, B       → MATCH

Current: A, B
Saved:   B, A       → MATCH

Current: A, B
Saved:   A          → NOT MATCH

Current: A, B
Saved:   A, B, C   → NOT MATCH

Current: A, B
Saved:   A, C      → NOT MATCH
```

### QuestionTypes

Also use exact set equality. Ordering must not matter.

```text
Current: mc, fib
Saved:   mc, fib    → MATCH

Current: mc, fib
Saved:   fib, mc    → MATCH

Current: mc, fib
Saved:   mc         → NOT MATCH

Current: mc, fib
Saved:   mc, fib, tf → NOT MATCH

Current: mc, fib
Saved:   mc, tf     → NOT MATCH
```

Compare sets, not comma-separated strings or array ordering.

---

## 3. Do Not Use Partial Matching

Do NOT treat a saved context as a match merely because it contains the selected values.

For example:

```text
Current: A, B
Saved:   A, B, C
```

must NOT be returned.

The saved context must contain exactly the same pattern set and exactly the same QuestionType set.

---

## 4. Repository / Service Layer

Matching logic belongs in the appropriate server-side repository/service/domain layer, not inside the React UI.

Create or extend an appropriate method according to the project's architecture.

Conceptually:

```text
findMatchingGenerationContexts({
    difficultyLevel,
    questionPatternIds,
    questionTypes
})
```

Use actual project naming conventions.

The method should:

1. Filter by `DifficultyLevel`.
2. Compare selected QuestionPattern ID sets exactly.
3. Compare selected QuestionType sets exactly.
4. Return only matching `GenerationContext` records.
5. Include related QuestionPatterns and QuestionTypes needed for display.
6. Return enough information for the UI table.

Prefer database/server-side filtering rather than loading every context into the browser.

---

## 5. QuestionPattern Matching

Use **QuestionPattern IDs**, not names.

Do NOT perform name-based matching.

This follows TASK-019.

The comparison should be based on:

```text
QuestionPatternId
```

not:

```text
QuestionPattern.Name
```

---

## 6. QuestionType Matching

Use the application's stable QuestionType codes:

```text
mc
fib
wp
tf
ms
```

Use the existing `QUESTION_TYPE_OPTIONS` source of truth where appropriate.

The UI may display friendly labels, but matching must use the stable codes.

Example:

```text
Internal:
mc, fib

Display:
Multiple Choice, Fill in the Blank
```

---

## 7. Evaluate Results Dialog

The existing Evaluate Results dialog already has two options.

Keep the first option working exactly as it currently does.

Enable the second option for saved-result selection.

Follow the existing UI component patterns and styling.

Do not unnecessarily redesign the dialog.

---

## 8. Saved Results Table

When the user chooses the saved-results option, display all matching saved GenerationContexts.

Required columns:

| Select | Context Name | Pattern | Type | AI Provider | AI Model | Difficulty |
|---|---|---|---|---|---|---|

### Select

Use a **radio button**.

Only one saved GenerationContext may be selected.

Do NOT use checkboxes.

### Context Name

Display `GenerationContext.Name`.

### Pattern

If multiple patterns exist, display them comma-separated.

Example:

```text
Simplify Algebraic Fractions, Solve Linear Equations
```

Pattern names are for display only.

### Type

If multiple QuestionTypes exist, display them comma-separated.

Prefer friendly labels:

```text
Multiple Choice, Fill in the Blank
```

rather than:

```text
mc, fib
```

Use the existing `QUESTION_TYPE_OPTIONS` mapping.

### AI Provider

Display the saved GenerationContext AI provider.

### AI Model

Display the saved GenerationContext AI model.

### Difficulty

Display `DifficultyLevel`.

---

## 9. Empty Results

If no matching saved GenerationContexts exist, show a clear message instead of an unexplained empty table.

Example:

```text
No saved results were found for the selected
difficulty, question patterns, and question types.
```

Provide an obvious way to go back or close the dialog.

Do not invent or fabricate a saved result.

---

## 10. Single Selection

The user can select exactly one saved GenerationContext.

The Continue/Evaluate button should:

- be disabled when no row is selected
- become enabled when one row is selected
- deselect the previous row when another row is selected

The selected value must be:

```text
GenerationContextId
```

not the context name.

---

## 11. Navigate to Evaluation

After selecting one saved GenerationContext and continuing:

```text
Selected GenerationContextId
        ↓
Evaluation Page
```

Use the application's existing routing/navigation convention.

A query parameter could conceptually look like:

```text
/evaluation?generationContextId=<uuid>
```

but do not assume this exact route if the current application uses another convention.

The important requirement is:

> Navigate using the selected `GenerationContextId`, not by passing the entire question dataset through the UI.

---

## 12. Evaluation Page Integration

The Evaluation page must be able to receive the selected GenerationContextId and load the appropriate saved generated questions.

Do not implement new evaluation calculations as part of this task unless they already exist and only need the selected context to load.

TASK-020 is primarily:

```text
Find
→ Display
→ Select
→ Navigate
→ Load selected saved dataset
```

---

## 13. TDD Requirements

This task MUST follow TDD.

Follow:

```text
RED
  ↓
Write failing test
  ↓
GREEN
  ↓
Minimum implementation
  ↓
REFACTOR
```

Do not implement the complete feature first and add tests afterward.

---

## 14. Required Tests — Matching Logic

Write tests for exact GenerationContext matching.

### Exact match

```text
Current:
Medium
Patterns: A, B
Types: mc, fib

Saved:
Medium
Patterns: A, B
Types: mc, fib
```

→ MATCH

### Pattern ordering

```text
Current: A, B
Saved: B, A
```

→ MATCH

### QuestionType ordering

```text
Current: mc, fib
Saved: fib, mc
```

→ MATCH

### Different difficulty

→ NOT MATCH

### Missing pattern

```text
Current: A, B
Saved: A
```

→ NOT MATCH

### Extra pattern

```text
Current: A, B
Saved: A, B, C
```

→ NOT MATCH

### Different pattern

```text
Current: A, B
Saved: A, C
```

→ NOT MATCH

### Missing QuestionType

```text
Current: mc, fib
Saved: mc
```

→ NOT MATCH

### Extra QuestionType

```text
Current: mc, fib
Saved: mc, fib, tf
```

→ NOT MATCH

### Different QuestionType

```text
Current: mc, fib
Saved: mc, tf
```

→ NOT MATCH

### No saved results

Verify that no matching contexts are returned when none exist.

---

## 15. Required Tests — Repository / Service

Test that:

- DifficultyLevel filtering is applied.
- QuestionPattern IDs are compared.
- QuestionType codes are compared.
- Exact set equality is enforced.
- Array/order differences do not affect matching.
- Names are not used for matching.
- Related display data is returned.
- Only eligible GenerationContexts are returned.

Prefer testing the real repository/service behavior according to the project's architecture.

---

## 16. Required Tests — UI

Test that:

- Evaluate Results opens correctly.
- Existing first option remains functional.
- Second option can be selected.
- Matching saved results are displayed.
- Context name is displayed.
- Multiple patterns are comma-separated.
- Multiple QuestionTypes are comma-separated.
- Friendly QuestionType labels are displayed.
- AI provider is displayed.
- AI model is displayed.
- DifficultyLevel is displayed.
- Radio buttons allow only one selection.
- Continue/Evaluate is disabled without a selection.
- Continue/Evaluate becomes enabled after selecting a row.
- Selected GenerationContextId is used for navigation.
- Empty results show a meaningful message.

Use the project's existing UI test conventions. Do not introduce E2E tests unless the project already requires them for this flow.

---

## 17. Existing Provider Metadata Check

During implementation, inspect how:

```text
AiProvider
AiModel
```

are populated in `GenerationContext`.

There has been a concern that a saved record showed:

```text
AiProvider = groq
```

Verify whether this is correct based on the actual provider/model used during generation.

Do NOT modify historical records merely because they use Groq.

Determine:

```text
Actual provider used
        ↓
GenerationContext.AiProvider
```

and ensure future saved contexts persist the actual provider/model.

If a bug is found and it is directly related to GenerationContext metadata, fix it and document the root cause.

If it is unrelated, document it as a follow-up rather than expanding the scope unnecessarily.

---

## 18. Performance / Data Loading

Avoid:

```text
load every GenerationContext
        ↓
load all relationships
        ↓
send everything to browser
        ↓
filter in React
```

when server/database filtering is reasonably possible.

Prefer:

```text
Current selection
      ↓
Server/repository
      ↓
Database filtering
      ↓
Only matching contexts
      ↓
UI
```

Follow the existing project architecture.

---

## 19. No Database Schema Changes Expected

TASK-020 should use the existing GenerationContext and relationship tables.

Do not create new tables.

Do not modify existing tables unless a genuine blocker is discovered.

If a schema change appears necessary:

1. Stop before making the change.
2. Document why it is necessary.
3. Do not silently redesign the database.

---

## 20. Documentation

Review and update where necessary:

- `README.md`
- `CLAUDE.md`

Document the new saved-result evaluation flow if appropriate.

Do not add secrets or API keys.

---

## 21. Verification Checklist

Before completing TASK-020:

1. Run the full test suite.
2. Run all new/updated tests.
3. Run TypeScript type checking.
4. Run ESLint.
5. Run Prisma validation if relevant.
6. Verify exact DifficultyLevel matching.
7. Verify exact QuestionPattern ID set matching.
8. Verify exact QuestionType set matching.
9. Verify ordering does not affect matching.
10. Verify extra patterns do not match.
11. Verify missing patterns do not match.
12. Verify extra QuestionTypes do not match.
13. Verify missing QuestionTypes do not match.
14. Verify pattern names are NOT used for matching.
15. Verify only matching criteria are returned.
16. Verify multiple patterns display comma-separated.
17. Verify multiple QuestionTypes display comma-separated friendly labels.
18. Verify radio-button single selection.
19. Verify no-selection state.
20. Verify selected GenerationContextId is passed to Evaluation.
21. Verify Evaluation loads the selected saved dataset.
22. Verify existing first Evaluate Results option still works.
23. Verify empty results state.
24. Verify AiProvider/AiModel metadata behavior.
25. Verify no unnecessary database schema changes.
26. Confirm Evaluation calculations/analytics were not unnecessarily changed.

---

## 22. Agent Feedback

Create:

```text
docs/agent-feedbacks/TASK-020-load-matching-saved-results-for-evaluation.md
```

Include:

### Summary

Explain what was implemented.

### Matching Rules

Clearly explain:

```text
DifficultyLevel = exact match

QuestionPatterns = exact set match
QuestionTypes = exact set match
```

Explain that ordering does not matter.

### Repository / Service

Explain where matching logic lives and why.

### UI

Explain the updated Evaluate Results dialog and saved-results table.

### Display

Document how:

- patterns are displayed
- QuestionTypes are displayed
- AI provider is displayed
- AI model is displayed
- DifficultyLevel is displayed

### Selection

Explain single selection and how `GenerationContextId` is retained.

### Evaluation Navigation

Explain how the selected GenerationContextId is passed to the Evaluation page.

### Provider Metadata

Explain what was discovered about `AiProvider` and `AiModel`, including the Groq concern.

If a bug was found, document:

- root cause
- fix
- tests added

If no bug was found, explain why the Groq value was correct.

### TDD

List tests written and the behaviors they protect.

### Verification

Report actual results for:

- Full tests
- TypeScript
- ESLint
- Prisma validation
- Exact matching
- Multiple pattern display
- Multiple QuestionType display
- Single selection
- Evaluation navigation
- Empty results
- Provider/model metadata

Do not claim a check passed if it was not actually performed.

### Issues / Follow-ups

Document anything discovered that should be addressed later.

---

## 23. Scope Boundary

TASK-020 includes:

- enabling the second Evaluate Results option
- finding saved GenerationContexts
- exact matching by DifficultyLevel + QuestionPattern set + QuestionType set
- displaying matching saved contexts
- single radio-button selection
- navigation to Evaluation using GenerationContextId
- loading the selected saved dataset
- TDD tests
- provider/model metadata verification

TASK-020 does NOT include:

- redesigning the Evaluation page
- evaluation algorithms
- evaluation scoring changes
- evaluation analytics
- new database tables
- new AI providers
- generation history management
- editing saved generations
- deleting saved generations
- distribution algorithms for QuestionTypes or QuestionPatterns

After TASK-020 is completed, review the implementation and test the real saved-data flow before starting another feature. create feedback .md file under the agent-feedbacks folder
