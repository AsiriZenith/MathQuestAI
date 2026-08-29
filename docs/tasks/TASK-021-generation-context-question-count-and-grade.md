# TASK-021 — Update Application for GenerationContext Question Count and Grade

## Objective

The PostgreSQL database has already been updated manually.

Two new columns were added to the existing `public.generation_contexts` table:

```text
requested_question_count integer
grade varchar(50)
```

The application must now be updated to recognize, persist, load, and use these fields correctly.

**Important:** The database changes have ALREADY been executed manually.

Do NOT create or execute a database migration for these changes.

Do NOT alter the database schema as part of this task unless a genuine mismatch is discovered and explicitly reported before making changes.

---

# 1. Database Changes Already Applied

The existing `public.generation_contexts` table now contains:

```sql
requested_question_count integer
grade character varying(50)
```

A check constraint was also added for the question count:

```text
requested_question_count IS NULL
OR requested_question_count > 0
```

Existing rows may contain `NULL` because these fields were added after data already existed.

Do not assume existing historical records have values.

---

# 2. Required Domain Meaning

These fields have distinct meanings.

## requestedQuestionCount

This represents:

> The number of questions the user requested when the generation was started.

It is NOT the number of questions the AI actually returned.

Example:

```text
User requested: 10
AI generated:    8

GenerationContext.requestedQuestionCount = 10
GeneratedQuestions count                  = 8
```

Do not derive `requestedQuestionCount` from `GeneratedQuestions.length`.

## grade

This represents the grade selected as part of the generation configuration.

It must be persisted as the actual selected grade when available.

Do not replace it with `"N/A"` for newly saved generations.

Existing records with `NULL` must be handled safely.

---

# 3. Before Making Changes

Carefully inspect the current implementation.

Review:

- `CLAUDE.md`
- `README.md`
- TASK-016 implementation and feedback
- TASK-017 implementation and feedback
- TASK-018 implementation and feedback
- TASK-019 implementation and feedback
- TASK-020 implementation and feedback
- current Prisma schema
- GenerationContext TypeScript/domain types
- GenerationContext repository
- GenerationContext creation/save flow
- `mapGeneration()` and related persistence code
- generation configuration types
- Questions page
- evaluation preparation flow
- `loadSavedGeneration()`
- current tests

Do not rely only on previous task descriptions. Verify the actual source code.

---

# 4. Prisma Schema

Update the Prisma model corresponding to `public.generation_contexts` so it reflects the already-existing database columns.

Use the project's existing naming/mapping conventions.

The resulting Prisma/domain representation should expose concepts equivalent to:

```text
requestedQuestionCount
grade
```

respecting the project's existing camelCase/snake_case mapping conventions.

Do NOT generate or run a migration.

Do NOT reset the database.

Do NOT modify unrelated Prisma models.

---

# 5. TypeScript / Domain Types

Update all relevant TypeScript types/interfaces/models so `GenerationContext` can represent:

```text
requestedQuestionCount
grade
```

Use the project's existing domain naming convention.

Avoid duplicate or competing definitions.

If the project has multiple representations (database, persistence, domain, evaluation), update them consistently only where required.

---

# 6. Generation Configuration → GenerationContext

Trace where the current generation configuration contains:

```text
question count
grade
```

The selected values must flow into the GenerationContext.

Conceptually:

```text
Questions Page
      ↓
Generation Configuration
      ├── requestedQuestionCount
      └── grade
      ↓
GenerationContext
      ↓
Database
```

The question count must come from the user's generation configuration.

Do NOT hard-code it in the persistence layer.

Do NOT calculate it from the generated questions.

---

# 7. Persistence

Update the GenerationContext creation/save mapping so new records persist:

```text
requestedQuestionCount
grade
```

For example:

```text
GenerationContext
├── requestedQuestionCount = 10
└── grade = "Grade 10"
```

The exact grade value must come from the existing application configuration/source.

Do not invent a new grade system.

---

# 8. Loading Saved Generations

TASK-020 introduced:

```text
loadSavedGeneration(generationContextId)
```

Update this flow so the saved GenerationContext includes:

```text
requestedQuestionCount
grade
```

Do NOT reconstruct the requested count using:

```text
generatedQuestions.length
```

The original requested count must come from:

```text
GenerationContext.requestedQuestionCount
```

---

# 9. Evaluation Data

When a saved generation is prepared for evaluation, preserve the original values:

```text
GenerationContext.requestedQuestionCount
GenerationContext.grade
```

into the appropriate evaluation configuration/data structure.

Remove or avoid the previous fallback:

```text
grade = "N/A"
```

when a saved GenerationContext actually contains a grade.

For historical records where `grade` is `NULL`, use a safe existing fallback according to the application's current conventions.

Do not invent misleading values.

Likewise, if `requestedQuestionCount` is `NULL` for an old record, handle it safely without pretending that the generated-question count was the originally requested count.

---

# 10. Existing Generation Flow

Verify that adding these fields does not change existing question-generation behavior.

Question generation should continue to use the requested question count as before.

The new responsibility is to ensure the same configuration is also persisted in GenerationContext.

The flow should conceptually become:

```text
User selects:
  Question Count = 10
  Grade = Grade X
        ↓
Generation
        ↓
AI generates questions
        ↓
GenerationContext
  requestedQuestionCount = 10
  grade = Grade X
        ↓
Save
```

---

# 11. Saved Evaluation Accuracy

The purpose of this task is partly to fix the limitation identified during TASK-020.

Previously, saved evaluation could approximate:

```text
requestedQuestionCount = number of saved questions
grade = "N/A"
```

That behavior must be replaced for newly saved records.

After this task:

```text
requestedQuestionCount
```

must represent the original request.

And:

```text
grade
```

must represent the original selected grade.

---

# 12. TDD Requirements

This task MUST follow TDD.

Use:

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

Do not implement everything first and add tests afterward.

---

# 13. Required Tests — Domain / Mapping

Add tests proving:

### Requested question count

```text
Generation configuration:
requestedQuestionCount = 10

Persisted context:
requestedQuestionCount = 10
```

### Grade

```text
Generation configuration:
grade = "Grade 10"

Persisted context:
grade = "Grade 10"
```

### Count is not derived from generated questions

Test a case such as:

```text
requestedQuestionCount = 10
generatedQuestions = 8
```

and verify:

```text
persisted requestedQuestionCount = 10
```

not `8`.

### Existing null values

Verify that existing contexts with:

```text
grade = null
requestedQuestionCount = null
```

can still be loaded without breaking the application.

---

# 14. Required Tests — Saved Generation

Update/add tests for `loadSavedGeneration()`.

Verify:

- `requestedQuestionCount` is loaded from GenerationContext.
- `grade` is loaded from GenerationContext.
- saved evaluation data receives the stored values.
- the question count is not reconstructed from generated-question count.
- historical `NULL` values are handled safely.

---

# 15. Required Tests — Evaluation

Verify that:

```text
Saved GenerationContext
        ↓
EvaluationData.configuration
```

preserves:

```text
requestedQuestionCount
grade
```

For example:

```text
GenerationContext:
requestedQuestionCount = 10
grade = Grade 10

EvaluationData:
requestedQuestionCount = 10
grade = Grade 10
```

---

# 16. Required Tests — Regression

Existing functionality must remain working.

At minimum verify:

- existing generation flow
- save-for-evaluation flow
- TASK-019 AI metadata classification
- TASK-020 saved-generation matching
- existing evaluation preparation
- existing predefined evaluation option

Do not unnecessarily rewrite unrelated tests.

---

# 17. Database Safety

The database changes are already applied manually.

Do NOT:

- create a migration
- run `prisma migrate dev`
- reset the database
- drop/recreate tables
- alter unrelated tables
- delete existing data

It is acceptable to run:

```text
npx prisma validate
```

and other read/validation commands.

If Prisma introspection is appropriate for the project's workflow, inspect the database carefully before deciding whether it is needed.

Do not overwrite existing schema work from TASK-016.

---

# 18. Backward Compatibility

There are existing GenerationContext records created before these columns existed.

Therefore:

```text
grade = NULL
requestedQuestionCount = NULL
```

is possible.

The application must not crash when loading those records.

For old records:

- preserve `NULL` semantics where appropriate
- use an existing safe UI fallback if required
- do not fabricate historical data
- do not infer the original requested count from generated-question count

---

# 19. Documentation

Update relevant documentation if the project's conventions require it.

In particular, review:

- `README.md`
- `CLAUDE.md`

Do not add secrets or API keys.

Mention that the database schema was updated manually and that the application now expects these two GenerationContext fields.

---

# 20. Agent Feedback

Create:

```text
docs/agent-feedbacks/TASK-021-generation-context-question-count-and-grade.md
```

Include:

## Summary

Explain what was changed.

## Database Changes

State that the database columns already existed before implementation:

```text
requested_question_count
grade
```

Confirm that no migration was created/executed by this task.

## Domain / Prisma

Explain how the fields were represented.

## Generation Flow

Explain how:

```text
Question Count
Grade
```

flow from the user's configuration into GenerationContext.

## Persistence

Explain how the values are saved.

## Saved Generation

Explain how `loadSavedGeneration()` now retrieves them.

## Evaluation

Explain how saved evaluations now preserve the original requested count and grade.

## Backward Compatibility

Explain how old records with `NULL` values are handled.

## TDD

List the tests added/updated and what they protect.

## Verification

Report actual results for:

- Full tests
- TypeScript
- ESLint
- Prisma validation
- Generation flow
- Persistence
- Saved generation loading
- Evaluation data
- Null/legacy records

Do not claim a check passed if it was not actually performed.

## Issues / Follow-ups

Document anything discovered that should be handled later.

---

# 21. Verification Checklist

Before completing TASK-021:

1. Confirm the database columns already exist.
2. Confirm Prisma reflects the existing columns.
3. Confirm TypeScript/domain types include both fields.
4. Confirm generation configuration provides the requested question count.
5. Confirm generation configuration provides the grade.
6. Confirm persistence saves both values.
7. Confirm requested count is NOT calculated from generated-question count.
8. Confirm `loadSavedGeneration()` loads both fields.
9. Confirm saved EvaluationData receives both fields.
10. Confirm old NULL values do not crash the application.
11. Confirm no database migration was created/executed.
12. Run full tests.
13. Run TypeScript checks.
14. Run ESLint.
15. Run Prisma validation.
16. Verify existing TASK-018 behavior.
17. Verify existing TASK-019 behavior.
18. Verify existing TASK-020 behavior.
19. Verify no unrelated schema or application changes were introduced.

---

# 22. Scope Boundary

TASK-021 includes:

- Prisma schema update to reflect already-existing database columns
- TypeScript/domain type updates
- Generation configuration → GenerationContext mapping
- Persistence updates
- Saved Generation loading updates
- Evaluation data updates
- Backward compatibility for NULL values
- TDD tests
- Documentation/feedback

TASK-021 does NOT include:

- creating database migrations
- executing database migrations
- changing the database schema
- changing evaluation scoring algorithms
- redesigning the Evaluation page
- changing QuestionPattern/QuestionType matching
- changing AI generation prompts
- adding new AI providers
- adding new database tables
- redesigning grade management

After TASK-021 is completed, review the feedback and verify the saved-generation evaluation flow before planning the next feature.
