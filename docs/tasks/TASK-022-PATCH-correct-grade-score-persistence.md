# TASK-022-PATCH — Correct Grade and Score Persistence

## Objective

Apply a small correction to the TASK-022 implementation.

The database has already been updated manually.

### Database changes already made

1. The `grade` column in `generation_contexts` must contain the educational grade selected for question generation.

Example:

```text
grade = "Grade 6"
```

2. A new `score` column has been manually added to `generation_contexts`.

The application must now use:

```text
grade → educational grade
score → evaluation score
```

Do NOT store the evaluation score in `grade`.

---

## 1. Grade

Ensure the GenerationContext creation/save flow stores the selected educational grade in:

```text
GenerationContext.grade
```

Example:

```text
grade = "Grade 6"
```

Do not overwrite this value with the evaluation score.

---

## 2. Score

The `score` column was already added manually to:

```text
public.generation_contexts
```

Update the Evaluation page flow so that the final evaluation score is persisted to:

```text
GenerationContext.score
```

The existing TASK-022 score-update behavior should remain otherwise unchanged.

Conceptually:

```text
Evaluation Page
      ↓
Final evaluation score
      ↓
Update GenerationContext.score
```

Do NOT update:

```text
GenerationContext.grade
```

with the score.

---

## 3. Prisma / Types

Update the relevant Prisma model and TypeScript/domain types to recognize:

```text
score
```

Use the project's existing naming/mapping conventions.

Do not create a migration because the database column has already been added manually.

Do not change unrelated fields.

---

## 4. Persistence

Update the existing GenerationContext score persistence implementation from TASK-022.

If the current implementation contains logic similar to:

```text
grade: String(score)
```

replace it so that it updates:

```text
score
```

instead.

The existing selected grade must remain unchanged.

---

## 5. Evaluation Flow

Keep the current Evaluation flow:

```text
Load GenerationContext
        ↓
Evaluate generated questions
        ↓
Calculate final score
        ↓
Persist score to GenerationContext.score
```

Use the existing `GenerationContextId`.

Do not redesign the evaluation algorithm.

Do not introduce a new API architecture if the existing project already uses Server Actions/repository methods for this operation.

---

## 6. TDD

For this small patch, **unit tests are sufficient**.

Do not add unnecessary integration or end-to-end tests for this correction.

Add/update unit tests to verify:

### Test 1 — Score is persisted correctly

Given:

```text
GenerationContextId = valid ID
score = 85
```

verify the persistence layer updates:

```text
score = 85
```

### Test 2 — Grade is not overwritten

Given:

```text
grade = "Grade 6"
score = 85
```

verify the score update does not change:

```text
grade = "Grade 6"
```

### Test 3 — Correct GenerationContext is updated

Verify the existing `GenerationContextId` is used.

### Test 4 — Existing validation remains working

Preserve the existing score validation from TASK-022.

---

## 7. Agent Feedback

Create/update:

```text
docs/agent-feedbacks/TASK-022-patch-grade-score-correction.md
```

Include:

- What was corrected.
- Confirmation that `grade` represents the educational grade.
- Confirmation that `score` represents the evaluation score.
- Confirmation that the `score` database column was already added manually.
- Prisma/type changes.
- Persistence changes.
- Unit tests added/updated.
- Actual test results.
- Any remaining issues.

Do not claim tests passed unless they were actually executed.

---

## 8. Database Safety

The database change has already been performed manually.

Do NOT:

- create a migration
- execute a migration
- reset the database
- modify the `grade` column definition
- add another score column
- modify unrelated tables

Only update the application to reflect the existing database state.

---

## 9. Scope

This is a **small corrective patch**.

Included:

- `score` Prisma/domain mapping
- score persistence correction
- preserving educational grade
- Evaluation score update
- unit tests
- agent feedback

Not included:

- evaluation redesign
- scoring algorithm changes
- UI redesign
- new database tables
- new API architecture
- integration/E2E tests
- changes to question generation
- changes to saved-generation matching
