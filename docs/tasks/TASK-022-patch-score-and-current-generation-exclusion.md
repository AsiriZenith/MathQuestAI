# TASK-022 — Patch: Persist Evaluation Score and Exclude Current Generation

## Objective

Fix two issues in the current question-generation/evaluation flow:

1. The final **Score** is only known after evaluation, so the Evaluation page must update the corresponding `GenerationContext` record using a `PUT` request.
2. When the user saves the currently generated questions, that newly saved `GenerationContext` must **not appear as a previous-result candidate for comparison against itself**.

This is a **patch task**. Preserve the existing architecture and behavior from TASK-016 through TASK-021 wherever possible.

---

## 1. Issue One — Persist Evaluation Score

The score becomes available only after evaluation:

```text
Questions Page
    ↓
Generate Questions
    ↓
Save GenerationContext
    ↓
Evaluation Page
    ↓
Calculate final Score
    ↓
PUT GenerationContext.Score
```

The Evaluation page must update the correct `GenerationContext` using its existing `GenerationContextId`.

### API

Create or extend the appropriate endpoint according to the project's conventions.

Conceptually:

```http
PUT /api/generation-contexts/{generationContextId}
```

The exact route may differ if the project already uses another convention.

The request should update only the score, for example:

```json
{
  "score": 85
}
```

Do not accept an unnecessary complete GenerationContext object.

### Rules

- Use `GenerationContextId` as the authoritative identifier.
- Validate the ID.
- Validate the score according to the existing scoring rules/range.
- Do not update score when evaluation has not produced a final score.
- Do not put Prisma calls directly inside the React page.
- Use the existing repository/service architecture from TASK-017.
- Handle not-found, validation, and persistence errors correctly.
- Do not invent a new scoring algorithm.

Conceptually:

```text
Evaluation Page
      ↓
Final score
      ↓
PUT GenerationContext
      ↓
GenerationContext.Score
```

---

## 2. Issue Two — Exclude Current Generation

When a user saves the currently generated questions:

```text
GenerationContext A created
```

and later chooses:

```text
Evaluate Results
→ Compare with Previous Generations
```

GenerationContext A must not be displayed as a comparison candidate against itself.

There is no meaningful comparison:

```text
A vs A
```

### Identify the current generation

Use the actual:

```text
GenerationContextId
```

associated with the current saved generation.

Do NOT identify it using:

- context name
- timestamp
- question text
- matching patterns
- matching question types

If the current generation has not been saved and there is no current ID, normal matching behavior should remain unchanged.

---

## 3. Matching API/Repository

Extend the existing matching operation with an optional exclusion.

Conceptually:

```text
findMatchingGenerationContexts({
    difficultyLevel,
    questionPatternIds,
    questionTypes,
    excludeGenerationContextId
})
```

The repository/service must exclude:

```text
id = excludeGenerationContextId
```

from the results.

This must happen server-side/database-side rather than loading the current record and hiding it only in React.

---

## 4. Example

Current GenerationContext:

```text
ID = A
Difficulty = Medium
Patterns = P1, P2
Types = mc, fib
```

Saved records:

```text
A → Medium + P1,P2 + mc,fib
B → Medium + P1,P2 + mc,fib
C → Medium + P1,P2 + mc
D → Hard   + P1,P2 + mc,fib
```

Normal exact matching:

```text
A → MATCH
B → MATCH
C → NOT MATCH
D → NOT MATCH
```

With:

```text
excludeGenerationContextId = A
```

the result must be:

```text
B
```

only.

---

## 5. Questions Page State

Inspect how the current Questions page knows that generated questions have been saved.

If TASK-018/TASK-020 already retains the newly created `GenerationContextId`, reuse it.

If not, update the flow so the created ID is retained.

Do not derive it from another field.

The ID must be the authoritative current-generation reference.

---

## 6. Evaluation Navigation

Keep the existing Evaluation navigation using:

```text
GenerationContextId
```

The same ID should be used for:

1. Loading the saved generation.
2. Evaluating it.
3. Persisting the final score.

Conceptually:

```text
GenerationContextId
       │
       ├── Load saved generation
       ├── Evaluate
       └── PUT Score
```

---

## 7. TDD Requirements

This task MUST follow TDD:

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

Do not implement the feature first and add tests afterward.

### Score tests

Cover:

- successful score update
- correct GenerationContext is updated
- invalid ID
- invalid/missing score
- non-numeric score
- score outside the existing valid range
- persistence failure does not report success

### Evaluation integration tests

Verify:

```text
Final evaluation score
    ↓
PUT request
    ↓
Correct GenerationContextId
    ↓
Score persisted
```

Also verify no score update happens before a final score exists.

### Exclusion tests

Cover:

- current generation excluded
- no current ID → normal results
- current generation is the only match → empty list
- current generation differs from other matching records → others remain
- multiple matching records → all except current are returned

### UI tests

Verify:

- Evaluation receives GenerationContextId.
- Final score triggers PUT.
- Correct ID is sent.
- Save success/failure is handled.
- Current generation is excluded from comparison results.
- Other exact matches remain visible.
- Radio-button single selection still works.
- Empty results state still works.
- Existing Evaluate Results first option remains functional.

---

## 8. Regression

Ensure these remain working:

- question generation
- Save for Evaluation
- TASK-019 QuestionPatternId / QuestionType metadata
- TASK-020 exact matching
- TASK-021 requested question count
- TASK-021 grade persistence
- saved generation loading
- existing evaluation scoring
- existing predefined evaluation option

Do not unnecessarily modify unrelated code.

---

## 9. Database

No schema change should be required.

Use the existing:

```text
GenerationContext.Score
```

Do NOT:

- create a new score table
- create another score field
- create a migration
- reset/recreate the database
- modify unrelated tables

---

## 10. Documentation / Agent Feedback

Create:

```text
docs/agent-feedbacks/TASK-022-patch-score-and-current-generation-exclusion.md
```

Include:

### Summary
What was fixed.

### Score Update
- endpoint
- payload
- validation
- repository/service changes
- Evaluation integration

### Current Generation Exclusion
- how current GenerationContextId is retained
- how it is passed to matching
- how the repository excludes it

### TDD
Tests added/updated and behaviors protected.

### Verification
Report actual results for:

- full tests
- TypeScript
- ESLint
- Prisma validation
- PUT score update
- score persistence
- current-generation exclusion
- existing saved-result matching
- Evaluation navigation

Do not claim a check passed if it was not performed.

### Issues / Follow-ups
Document anything discovered for later.

---

## 11. Verification Checklist

Before completing TASK-022:

1. Confirm existing GenerationContext.Score is used.
2. Add the appropriate PUT endpoint.
3. Validate GenerationContextId.
4. Validate score.
5. Update only Score.
6. Persist the score correctly.
7. Integrate PUT into Evaluation.
8. Use the correct GenerationContextId.
9. Do not update score before final evaluation.
10. Handle PUT failures correctly.
11. Retain current GenerationContextId after saving.
12. Pass it to saved-result matching.
13. Exclude the current GenerationContext server-side.
14. Preserve exact matching for other contexts.
15. Preserve behavior when no current ID exists.
16. Verify current generation is not shown as a comparison candidate.
17. Verify other matching generations are shown.
18. Verify empty-result state.
19. Run full tests.
20. Run TypeScript checks.
21. Run ESLint.
22. Run Prisma validation.
23. Confirm no database schema changes were made.

---

## 12. Scope Boundary

TASK-022 includes:

- PUT GenerationContext score
- Evaluation → score persistence
- current GenerationContextId tracking
- excluding current generation from saved-result comparison
- repository/service changes
- API changes
- TDD and regression tests
- agent feedback

TASK-022 does NOT include:

- changing evaluation algorithms
- redesigning the Evaluation page
- changing GenerationContext schema
- changing QuestionPattern matching rules
- changing QuestionType matching rules
- adding AI providers
- changing AI prompts
- changing score calculation methodology
- changing database tables
- generation-history management
- deleting/editing saved generations

After completion, manually verify:

```text
Generate
  ↓
Save
  ↓
Evaluate
  ↓
Score saved to GenerationContext
  ↓
Evaluate Results
  ↓
Compare with Previous Generations
  ↓
Current generation excluded
  ↓
Select another saved generation
  ↓
Evaluate
```
