# TASK-016 — Verify Database Schema and Create Domain Entities

## Objective

The database tables for question-generation persistence have **already been created in the PostgreSQL database** by manually executing the SQL scripts.

This task is now focused on:

1. Reviewing the existing PostgreSQL tables and constraints.
2. Verifying that the actual database implementation matches the finalized ER/database design described below.
3. Identifying and reporting any discrepancies.
4. Updating the project's Prisma schema to accurately represent the existing database.
5. Creating/updating TypeScript domain entities/types according to the verified database design.
6. Adding appropriate unit tests for the new domain types/validation where applicable.

**Do NOT create or execute database SQL scripts in this task.**

**Do NOT modify the database schema automatically.**

The developer has already executed the SQL scripts manually. Claude Code should inspect/verify the existing database configuration/schema and report any mismatch rather than changing the database.

Do NOT implement the complete persistence workflow yet.

Do NOT modify the Evaluation page in this task.

---

# 1. Before Making Changes

Carefully inspect the existing project and understand what has already been implemented.

Review:

- Existing Prisma schema
- Existing database-related files
- Existing TypeScript types/interfaces
- Existing question-generation implementation
- Existing question-generation response types
- Existing repository/service structure
- Existing tests
- Existing `CLAUDE.md`
- Existing `README.md`
- Existing task/feedback documentation

Do not blindly replace existing implementations.

Identify what needs to be changed because of the new persistence design.

Preserve existing functionality unless it conflicts with this task.

---

# 2. Final Database Design

The following four tables/entities must be supported.

## GenerationContexts

Properties:

- Id
- Name
- DifficultyLevel
- AIProvider
- AIModel
- Prompt
- CreatedAt

Database requirements:

- Id: UUID primary key
- Id default: `gen_random_uuid()`
- Name: required and unique
- DifficultyLevel: required
- Allowed DifficultyLevel values:
  - Easy
  - Medium
  - Hard
- AIProvider: required
- AIModel: required
- Prompt: optional
- CreatedAt: required
- CreatedAt default: `now()`

---

## GenerationContextQuestionTypes

Properties:

- Id
- GenerationContextId
- QuestionType

Relationships:

- GenerationContextId → GenerationContexts.Id

QuestionType is NOT a foreign key to another table.

There is currently NO QuestionTypes database table.

The application uses these stable question-type codes:

- `mc` → Multiple Choice
- `fib` → Fill in the Blank
- `wp` → Word Problem
- `tf` → True / False
- `ms` → Multi-step Problem

The database must only allow these values.

Unique constraint:

`GenerationContextId + QuestionType`

---

## GenerationContextQuestionPatterns

Properties:

- Id
- GenerationContextId
- QuestionPatternId

Relationships:

- GenerationContextId → GenerationContexts.Id
- QuestionPatternId → QuestionPatterns.Id

Unique constraint:

`GenerationContextId + QuestionPatternId`

---

## GeneratedQuestions

IMPORTANT:

The entity/table name is `GeneratedQuestions`.

Do NOT use `GenerationQuestions`.

Properties:

- Id
- GenerationContextId
- QuestionPatternId
- QuestionType
- QuestionNumber
- QuestionText
- ExpectedAnswer
- Explanation
- CreatedAt

Relationships:

- GenerationContextId → GenerationContexts.Id
- QuestionPatternId → QuestionPatterns.Id
- `(GenerationContextId, QuestionType)` references the selected question type for that generation
- `(GenerationContextId, QuestionPatternId)` references the selected question pattern for that generation

QuestionType:

- `mc`
- `fib`
- `wp`
- `tf`
- `ms`

QuestionNumber:

- Required integer
- Must be greater than 0
- Unique within a GenerationContext

Unique constraint:

`GenerationContextId + QuestionNumber`

---

# 3. Important Data Integrity Rules

## Question Type integrity

A GeneratedQuestion must not use a QuestionType that wasn't selected for its GenerationContext.

The database design should enforce this through the composite relationship where supported.

## Question Pattern integrity

A GeneratedQuestion must not use a QuestionPattern that wasn't selected for its GenerationContext.

The database design should enforce this through the composite relationship.

---

# 4. Prisma Schema

Update the existing Prisma schema to represent the finalized database design.

Requirements:

1. Add models for:
   - GenerationContexts
   - GenerationContextQuestionTypes
   - GenerationContextQuestionPatterns
   - GeneratedQuestions

2. Use appropriate Prisma types for:
   - UUID
   - strings
   - integers
   - timestamps

3. Preserve the existing models.

4. Add appropriate relationships.

5. Add unique constraints.

6. Add database defaults where appropriate.

7. Ensure Prisma model names and database table names are clear and consistent.

8. Do NOT introduce a `QuestionTypes` model.

9. Do NOT remove the existing `QuestionPatterns` model.

10. Do NOT rename existing database tables unless required by the finalized design.

---

# 5. TypeScript Domain Entities

Define TypeScript types/interfaces for:

- GenerationContext
- GenerationContextQuestionType
- GenerationContextQuestionPattern
- GeneratedQuestion

The types should represent the application/domain meaning rather than exposing Prisma-specific types throughout the application.

For example:

```typescript
{
  id: string;
  generationContextId: string;
  questionPatternId: string;
  questionType: QuestionType;
  questionNumber: number;
  questionText: string;
  expectedAnswer: string;
  explanation?: string | null;
  createdAt: Date;
}
```

Use the project's existing naming conventions and type organization.

---

# 6. QuestionType

Reuse the existing question-type definition if one already exists.

The application currently uses:

```typescript
export const QUESTION_TYPE_OPTIONS = [
  { id: "mc", label: "Multiple Choice" },
  { id: "fib", label: "Fill in the Blank" },
  { id: "wp", label: "Word Problem" },
  { id: "tf", label: "True / False" },
  { id: "ms", label: "Multi-step Problem" },
];
```

Do not create duplicated QuestionType definitions.

If appropriate, provide a reusable type:

```typescript
type QuestionType = "mc" | "fib" | "wp" | "tf" | "ms";
```

Keep UI labels separate from stable codes.

---

# 7. Existing AI Response Types

Review the current AI-generated question response structure.

Make sure it can be mapped cleanly to `GeneratedQuestions`.

Keep these layers separated:

```text
AI Response
      ↓
Domain Model
      ↓
Database Model
```

Do not unnecessarily couple the AI provider response to Prisma/database-specific fields.

---

# 8. Verify Existing PostgreSQL Database

The SQL scripts have already been executed manually against the PostgreSQL database.

**Do NOT create, execute, migrate, drop, or alter database tables as part of this task.**

Instead, verify the actual database implementation against the finalized design in this document.

Verify at minimum:

- `generation_contexts`
- `generation_context_question_types`
- `generation_context_question_patterns`
- `generated_questions`

Check:

- Table names
- Column names
- Column data types
- Nullable / NOT NULL configuration
- Primary keys
- Foreign keys
- Composite foreign keys
- Unique constraints
- CHECK constraints
- Default values
- Relationships

Pay particular attention to:

### GenerationContexts

Verify:

- `id` is UUID and defaults to `gen_random_uuid()`
- `name` is required and unique
- `difficulty_level` is required
- difficulty values are restricted to `Easy`, `Medium`, `Hard`
- `ai_provider` is required
- `ai_model` is required
- `prompt` exists and is optional
- `created_at` is required and defaults to `now()`

### GenerationContextQuestionTypes

Verify:

- `generation_context_id` references `generation_contexts.id`
- `question_type` is required
- allowed values are `mc`, `fib`, `wp`, `tf`, `ms`
- `(generation_context_id, question_type)` is unique

### GenerationContextQuestionPatterns

Verify:

- `generation_context_id` references `generation_contexts.id`
- `question_pattern_id` references `question_patterns.id`
- `(generation_context_id, question_pattern_id)` is unique

### GeneratedQuestions

Verify:

- `generation_context_id` references `generation_contexts.id`
- `question_pattern_id` is present
- `question_type` is present
- allowed question-type values are `mc`, `fib`, `wp`, `tf`, `ms`
- `question_number` is required and positive
- `(generation_context_id, question_number)` is unique
- `(generation_context_id, question_type)` correctly enforces that the type was selected for the generation
- `(generation_context_id, question_pattern_id)` correctly enforces that the pattern was selected for the generation
- `question_text` and `expected_answer` are required
- `explanation` is optional
- `created_at` defaults to `now()`

## Verification Result

Clearly report:

- What matches the finalized design
- What differs
- Any missing constraints
- Any unexpected columns
- Any unexpected relationships
- Any potentially dangerous integrity issues

If the actual database cannot be inspected directly from the development environment, state that clearly and provide the exact verification commands/steps the developer should run rather than claiming the database was verified.

**Do not silently fix discrepancies. Report them for review.**

---

# 9. Tests — TDD

This project follows TDD.

Add/update unit tests for the new domain types and validation logic introduced by this task.

At minimum consider tests for:

### QuestionType

Valid:
- `mc`
- `fib`
- `wp`
- `tf`
- `ms`

Invalid:
- `unknown`
- `multiple_choice`
- `null`

### DifficultyLevel

Valid:
- `Easy`
- `Medium`
- `Hard`

### GeneratedQuestion

Where validation exists, test:

- question number must be positive
- required identifiers must be present
- question type must be valid
- required question text must exist
- expected answer must exist

Do not create meaningless tests simply to increase coverage.

Follow the testing framework and conventions already established in the project.

---

# 10. Do Not Implement Yet

This task must NOT implement the complete question-generation persistence workflow.

Do NOT yet implement:

- Creating GenerationContext during question generation
- Saving selected question types
- Saving selected question patterns
- Saving GeneratedQuestions
- Repository methods for persistence
- Evaluation page changes
- Generation history UI
- Database querying from the question page

Those will be handled in later tasks after this foundation is reviewed.

---

# 11. Documentation

After completing the implementation:

Review `README.md`.

If database setup instructions need to change because of this task, update the README accordingly.

Do not overwrite existing useful documentation.

Also review whether existing task documentation or project documentation has become outdated because of the finalized database design.

---

# 12. Verification

Before completing the task:

1. Run the existing test suite.
2. Run the new/updated unit tests.
3. Run TypeScript type checking.
4. Validate the Prisma schema against the verified database design.
5. Verify Prisma relations and unique constraints.
6. Verify the actual PostgreSQL schema where database inspection is available.
7. Check that existing functionality has not been unnecessarily broken.
8. Check for duplicated QuestionType definitions.
9. Check that `GeneratedQuestions` is used consistently instead of `GenerationQuestions`.
10. Do not execute migrations or alter the database schema.

---

# 13. Final Feedback

Create:

`agent-feedback/TASK-016-feedback.md`

Include:

## Summary

What was changed.

## Database Verification

Report the actual PostgreSQL tables, columns, constraints, defaults, and relationships that were verified.

Clearly list any discrepancies between the database and the finalized design.

## Prisma Changes

Explain the models and constraints added.

## TypeScript Changes

Explain the new domain entities/types.

## QuestionType Handling

Explain how the `mc`, `fib`, `wp`, `tf`, and `ms` codes are represented and where the source of truth is.

## Tests

List the tests added/updated and their purpose.

## Validation

Report:

- Tests
- TypeScript
- Prisma validation
- SQL validation

## Issues / Decisions

Document any problems encountered, assumptions made, or design decisions that still need review.

Do not claim something was completed if it was not actually verified.

---

# Expected Outcome

After TASK-016:

```text
Existing Application
        │
        ▼
AI Question Generation
        │
        ▼
AI Response Types
        │
        ▼
Domain Types
        │
        ▼
Prisma Models
        │
        ▼
PostgreSQL
```

The project should have a clean and consistent foundation for:

- GenerationContexts
- GenerationContextQuestionTypes
- GenerationContextQuestionPatterns
- GeneratedQuestions

The actual persistence workflow will be implemented in a later task.
