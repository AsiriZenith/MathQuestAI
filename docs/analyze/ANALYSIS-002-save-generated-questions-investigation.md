# ANALYSIS-002 — Investigate Save Generated Questions Failure

## Purpose

This is an **analysis-only task**.

Do **NOT** modify application code, database schema, Prisma schema, tests, or UI.

Investigate why saving generated questions appears to fail or behave unexpectedly when `saveGenerationAction` executes. Create a bug-fix task only after the root cause is confirmed.

## Reported Log

```text
POST /questions 200 in 187ms (next.js: 11ms, application-code: 176ms)
  └─ ƒ saveGenerationAction({...}) in 157ms lib/actions/save-generation.
```

The log also contains messages such as:

```text
"5 items not stringified"
"1 item not stringified"
```

Do **not** automatically treat these as application errors. Determine whether they are simply Next.js development logging abbreviations.

The prompt shown in the log already contains the expected selected pattern:

```text
ID: bc078865-0652-4ff9-86ba-32e475cfde66
Name: Formula-Based Substitution
```

and asks the AI to return:

```text
questionPatternId
questionType
```

Therefore, do not assume the prompt is the problem.

## Investigation

Trace the complete flow:

```text
Questions Page
    ↓
Save Generated Questions
    ↓
saveGenerationAction
    ↓
validation
    ↓
GenerationContext persistence
    ↓
GeneratedQuestions persistence
    ↓
database / transaction
    ↓
action response
    ↓
UI success/error handling
```

Inspect the actual implementation and document:

- input types and validation
- transformations/mapping
- repository calls
- Prisma calls
- transaction boundaries
- returned values
- error handling
- client/UI handling

## GenerationContext

Verify the actual values and mappings for:

```text
name
difficultyLevel
questionType
aiProvider
aiModel
prompt
requestedQuestionCount
grade
score
```

Ensure they match the finalized database/domain model.

## GeneratedQuestions

Verify that each question is mapped with:

```text
generationContextId
questionPatternId
questionType
questionText
expectedAnswer
explanation
```

Check for `undefined`, `null`, incorrect types, or incorrect property names.

## Question Pattern ID

Because TASK-019 changed the AI contract, verify the complete path:

```text
AI response
   ↓
questionPatternId
   ↓
parsed/validated question
   ↓
saveGenerationAction
   ↓
repository
   ↓
Prisma
   ↓
GeneratedQuestions.questionPatternId
```

Specifically verify that the application no longer expects the old:

```text
questionPattern
```

name property.

Verify that the UUID exists in `question_patterns`.

## Question Type

Verify that:

```text
mc
fib
wp
tf
ms
```

are handled consistently with the frontend `QUESTION_TYPE_OPTIONS`.

There is **no `question_types` database table**. Do not invent one.

Verify that the persisted value matches the finalized `GeneratedQuestions.questionType` definition.

## AI Response vs Save Contract

Compare:

```text
AI structured output
        VS
TypeScript generated-question type
        VS
saveGenerationAction input
        VS
Prisma create input
```

Look specifically for mismatches such as:

```text
questionPatternId vs questionPattern
expectedAnswer vs correctAnswer
questionType code vs display label
```

Also verify the **actual parsed AI response**, not just the prompt. The prompt proves what was requested, not what the AI returned.

## Database Constraints

Inspect the actual schema and Prisma model for:

```text
generation_contexts
generated_questions
question_patterns
```

Check:

- NOT NULL constraints
- foreign keys
- unique constraints
- check constraints
- UUID validity
- column types
- string/enum restrictions

Pay particular attention to:

```text
GeneratedQuestions.questionPatternId
GeneratedQuestions.questionType
```

## Transaction Behavior

Determine whether saving uses a transaction or separate operations.

If partial persistence is possible, document exactly what happens when one GeneratedQuestion fails after the GenerationContext succeeds.

Do not change transaction behavior during this analysis.

## Error Handling

Determine whether errors are:

- caught
- logged
- returned to the client
- converted to generic messages
- silently swallowed

If the real Prisma/database error exists but is being hidden, identify where it is lost.

## Reproduction

If the project can be safely run, reproduce using the configuration represented by the log:

```text
Subject: Mathematics
Subtopic: Substitute and Evaluate
Pattern: Formula-Based Substitution
Difficulty: Easy
Question Type: mc
Question Count: 10
```

Capture the **actual exception/error**, if any.

Do not modify source code just to reproduce the issue.

## Classify the Result

Explicitly classify the investigation as one of:

### Case A — BUG CONFIRMED

An actual application/database error occurs.

Identify the exact root cause, failing layer, field/value, file, and function where possible.

### Case B — NO BUG — LOGGING ONLY

The save succeeds and the `"not stringified"` messages are only development logging behavior.

Verify the database records and UI behavior.

### Case C — PARTIAL SAVE

Some records are persisted while others fail.

Explain exactly what happened.

### Case D — UI REPORTING ERROR

The server action succeeds but the client incorrectly reports failure.

### Case E — INSUFFICIENT EVIDENCE

The supplied log and available implementation do not expose the actual failure.

State exactly what additional runtime error/log is required.

Do not invent a root cause.

## Database Verification

If safe read-only inspection is available, verify whether the save created:

```text
GenerationContext
GeneratedQuestions
```

and check:

```text
GenerationContext.id
GeneratedQuestions.generationContextId
GeneratedQuestions.questionPatternId
GeneratedQuestions.questionType
```

Do not modify the database.

## Required Output

Provide these sections:

1. **What the supplied log actually means**
2. **Complete save flow**
3. **Actual failure / reproduction result**
4. **Root cause**
5. **Question Pattern ID verification**
6. **Question Type verification**
7. **Database verification**
8. **Error handling verification**
9. **Recommended fix**, if a real bug exists
10. **Minimum tests needed for the eventual fix**
11. **Final recommendation**

The final recommendation must explicitly be one of:

```text
BUG CONFIRMED
NO BUG — LOGGING ONLY
INSUFFICIENT EVIDENCE — NEED RUNTIME ERROR
```

## Strict Constraints

This is **ANALYSIS ONLY**.

Do NOT:

- modify source code
- modify Prisma schema
- modify database
- create migrations
- modify UI
- add tests
- refactor code
- change AI prompts
- change structured output
- create a bug-fix task

The next execution task will be created only after this analysis is reviewed.

## Agent Feedback

Create:

```text
docs/agent-feedbacks/ANALYSIS-002-save-generated-questions-investigation.md
```

Include the complete investigation and actual verification results.

Do not claim a bug is fixed.

Do not claim tests passed unless they were actually executed.
