# TASK-015 — Fix Reference Questions Missing from Final AI Prompt

## Status
Completed — see `docs/agent-feedbacks/TASK-015-reference-questions-fix.md`

## Objective

Fix the issue where reference questions exist in PostgreSQL for the selected Question Pattern and Difficulty, but the final prompt sent to the AI contains:

```text
REFERENCE QUESTIONS
-------------------
No reference questions are available for this context.
```

The developer manually verified that the selected Question Pattern has **5 reference questions** in the database for the selected difficulty level.

The goal is to trace the complete data flow from PostgreSQL to the final prompt, identify why the reference questions were not included, fix the root cause, and verify the actual prompt sent to the AI contains the expected reference questions.

---

## 1. Reproduce the Problem First

Before changing implementation code:

1. Run the application normally.
2. Select the same or equivalent Subject, Subtopic, Difficulty, Question Pattern, and Question Type used during the investigation.
3. Start question generation.
4. Capture the `FINAL PROMPT` log from the server terminal.
5. Confirm that the `REFERENCE QUESTIONS` section incorrectly says no reference questions are available.
6. Independently verify the corresponding PostgreSQL records.

Do not assume the root cause before tracing the data.

---

## 2. Trace the Complete Data Flow

Investigate:

```text
PostgreSQL
    ↓
Prisma query
    ↓
getGenerationContext()
    ↓
GenerationContext.patterns
    ↓
pattern.referenceQuestions
    ↓
buildPrompt()
    ↓
REFERENCE QUESTIONS section
    ↓
HttpAiProvider.generate()
    ↓
AI API
```

Inspect the relevant implementation, including:

```text
lib/db/generation-context.ts
lib/generation/generate-questions.ts
lib/prompts/builder.ts
lib/ai/http-provider.ts
```

Also inspect the Prisma schema, database seed/data, existing tests, and relevant documentation.

---

## 3. Investigation Questions

### Database
- Are the 5 reference-question rows associated with the expected Question Pattern?
- Are they associated with the expected difficulty?
- Are there filters that could exclude them?

### Prisma query
- Does `getGenerationContext()` actually query reference questions?
- Is the required relation included?
- Are reference questions filtered by difficulty?
- Is the difficulty propagated correctly?
- Is the Question Pattern relation loaded correctly?

### GenerationContext
Inspect the actual object returned by `getGenerationContext()`.

Determine whether:

```text
pattern.referenceQuestions
```

contains the expected 5 records.

If the records are missing here, the problem is upstream of `buildPrompt()`.

### Prompt builder
If the records exist in `GenerationContext`, inspect:

```text
lib/prompts/builder.ts
```

Determine why `buildPrompt()` does not render them.

If they are rendered correctly, continue tracing toward the provider.

---

## 4. Fix the Root Cause

Fix the actual source of the problem.

Do **not**:
- hard-code the 5 questions
- hard-code reference-question text into the prompt
- simply remove the empty-data fallback

Reference questions must remain dynamically loaded from PostgreSQL:

```text
Database reference questions
        ↓
GenerationContext
        ↓
Prompt Builder
        ↓
Final Prompt
```

---

## 5. TDD Requirement

Follow the project's TDD approach.

Before implementing the fix:

1. Identify the appropriate test boundary.
2. Add or update a test representing the expected behavior.
3. Run it and confirm it fails for the current implementation.
4. Implement the smallest appropriate fix.
5. Run the test again.
6. Refactor only if necessary.

Expected cycle:

```text
RED
 ↓
GREEN
 ↓
REFACTOR
```

Do not weaken existing tests merely to make them pass.

---

## 6. Required Test Coverage

Use the existing test structure where appropriate, likely:

```text
tests/unit/generation-context.test.ts
tests/unit/prompt-builder.test.ts
```

The tests should cover at least:

### Reference questions exist

Given:

```text
Question Pattern = Simplify Algebraic Fractions
Difficulty = Medium
Reference Questions = 5
```

verify that the reference questions reach the final prompt under:

```text
REFERENCE QUESTIONS
```

### No reference questions exist

When there are genuinely no reference questions, verify that the existing fallback remains:

```text
No reference questions are available for this context.
```

---

## 7. Do Not Change Unrelated Prompt Behavior

Do not redesign the prompt or unnecessarily change:

- COMMON INSTRUCTIONS
- generation count
- difficulty guidance
- question type handling
- Question Pattern behavior
- output JSON structure
- AI provider abstraction

unless the investigation proves a related change is required.

The specific goal is:

```text
Reference Questions in DB
        ↓
Reference Questions in Final Prompt
```

---

## 8. Final Prompt Verification

After the fix, perform a real generation run.

The server terminal should show the actual database-backed reference questions, for example:

```text
----- FINAL PROMPT BEGIN -----

...

REFERENCE QUESTIONS
-------------------
Example 1 (Simplify Algebraic Fractions):
<reference question 1>

Example 2 (Simplify Algebraic Fractions):
<reference question 2>

Example 3 (Simplify Algebraic Fractions):
<reference question 3>

Example 4 (Simplify Algebraic Fractions):
<reference question 4>

Example 5 (Simplify Algebraic Fractions):
<reference question 5>

...

----- FINAL PROMPT END -----
```

Follow the existing prompt-builder formatting. The important requirement is that the database-backed questions actually appear in the final prompt.

---

## 9. Regression Testing

After the fix:

- [ ] Relevant unit tests pass.
- [ ] Prompt-builder tests pass.
- [ ] Generation-context tests pass.
- [ ] Full test suite passes.
- [ ] Real generation still works.
- [ ] Questions are still generated successfully.
- [ ] Final prompt contains the expected reference questions.
- [ ] Empty-reference fallback still works.

---

## 10. Required Agent Feedback

After completing TASK-015, create:

```text
agent-feedback/TASK-015-reference-questions-fix.md
```

The feedback file must clearly explain:

### A. Why were the reference questions empty?

Explain the actual root cause and exactly where the data was lost.

For example, if applicable:

```text
Database
  ↓
Prisma query
  ↓
GenerationContext  ← problem
  ↓
Prompt Builder
```

or:

```text
Database
  ↓
GenerationContext
  ↓
Prompt Builder  ← problem
  ↓
Final Prompt
```

Only report what the investigation proves.

### B. Was the issue fixed?

Clearly state:

```text
Fixed: Yes
```

or:

```text
Fixed: No
```

If not completely fixed, explain why.

### C. How was it fixed?

Document:
- files changed
- logic changed
- tests added/updated
- why the fix addresses the root cause

### D. Verification

Include:
- test results
- real generation verification
- confirmation that reference questions appear in the final prompt
- remaining limitations, if any

### E. Database Finding

Explicitly record that the developer manually verified that the selected Question Pattern had **5 reference questions for the selected difficulty**.

This is important evidence that the original problem was not simply missing database data.

---

## 11. Definition of Done

- [ ] Original problem reproduced.
- [ ] PostgreSQL records verified.
- [ ] Complete data flow traced.
- [ ] Root cause identified.
- [ ] Appropriate failing test created/updated before the fix where practical.
- [ ] Root cause fixed.
- [ ] Reference questions remain dynamically loaded from PostgreSQL.
- [ ] Reference questions reach `GenerationContext`.
- [ ] Reference questions appear in the final prompt.
- [ ] Empty-reference fallback still works.
- [ ] Relevant tests pass.
- [ ] Full test suite passes.
- [ ] Real question generation still works.
- [ ] Required agent-feedback file created.
- [ ] Feedback explains why the reference questions were empty.
- [ ] Feedback states whether the issue was fixed.
- [ ] Feedback explains how it was fixed.
- [ ] No unrelated functionality changed.

---

## 12. Key Principle

Do not treat the AI as the first suspect.

Prove this chain:

```text
Database has reference questions
            ↓
Application retrieves them
            ↓
GenerationContext contains them
            ↓
Prompt Builder includes them
            ↓
Final prompt contains them
            ↓
AI receives them
```

The purpose of TASK-015 is to make this chain reliable and testable.
