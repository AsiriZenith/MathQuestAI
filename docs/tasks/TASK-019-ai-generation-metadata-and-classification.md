# TASK-019 — AI Generation Metadata and Classification

## Objective

Improve the existing AI question-generation workflow so that **every generated question explicitly contains its QuestionType and QuestionPatternId**, and the application reliably validates those values before the questions can be saved for evaluation.

TASK-018 has already been implemented. Do NOT discard or redesign TASK-018. This task must enhance the existing implementation and integrate with it.

The key requirement is:

> The application must pass the selected Question Pattern **ID and name** to the AI, and the AI must return the exact selected **QuestionPatternId** for every generated question. The AI must NOT return the Question Pattern name as the classification value.

Target flow:

```text
User selections
    ↓
Application builds AI generation context
    ↓
Selected Question Patterns:
    ├── QuestionPatternId
    ├── Name
    └── relevant pattern details
    ↓
AI generates questions
    ↓
Every question contains:
    ├── QuestionType
    ├── QuestionPatternId
    ├── QuestionText
    ├── ExpectedAnswer
    └── Explanation
    ↓
Application validates response
    ↓
Questions Page
    ↓
TASK-018 Save for Evaluation
    ↓
GeneratedQuestions
```

---

# 1. Before Making Changes

Carefully inspect the current project and existing implementation.

Review:

- `CLAUDE.md`
- `README.md`
- TASK-016 feedback
- TASK-017 feedback
- TASK-018 implementation
- TASK-018 feedback
- Current AI provider abstraction
- Current prompt/context builder
- Current structured-output schema
- Current AI response types
- Current response validation
- Current question-generation service
- Current Questions page
- Current Save for Evaluation flow
- Existing unit/component tests

Do not assume the previous implementation is unchanged.

First understand how TASK-018 currently consumes generated-question data.

---

# 2. Why This Task Is Required

The `GeneratedQuestions` table requires:

```text
GenerationContextId
QuestionPatternId
QuestionType
QuestionText
ExpectedAnswer
Explanation
```

Therefore, every generated question must already contain enough structured information for the application to persist:

```text
QuestionPatternId
QuestionType
```

The AI must explicitly classify each question using the selected values.

The preferred design is:

```text
Application knows:
    QuestionPatternId + QuestionPattern Name
              ↓
        AI receives both
              ↓
AI returns:
    QuestionPatternId
              ↓
Application validates ID
              ↓
GeneratedQuestions.QuestionPatternId
```

Do NOT add a name-to-ID comparison/resolution layer.

---

# 3. Standard Terminology

Use these names consistently.

## Difficulty

Use:

```text
DifficultyLevel
```

Valid values:

```text
Easy
Medium
Hard
```

## Question Type

Use:

```text
QuestionType
```

for the application's stable codes:

```text
mc
fib
wp
tf
ms
```

Do NOT introduce `AiQuestionType` as another domain concept.

If the AI provider requires different terminology, keep the mapping inside the provider boundary.

---

# 4. Selected Question Types

The AI prompt/context must explicitly receive the QuestionTypes selected by the user.

Example:

```text
SELECTED QUESTION TYPES

- ID: mc
  Name: Multiple Choice

- ID: fib
  Name: Fill in the Blank
```

Use the application's existing `QUESTION_TYPE_OPTIONS` source of truth.

The AI must be instructed:

- Every question must use exactly one QuestionType.
- The QuestionType must be one of the selected values.
- Return the stable QuestionType ID/code expected by the application.
- Do not invent a new QuestionType.
- Do not return an unselected QuestionType.

The application remains the source of truth for allowed QuestionTypes.

---

# 5. Selected Question Patterns — IMPORTANT

The AI prompt/context MUST include the selected Question Patterns with BOTH:

```text
QuestionPatternId
Name
```

and any relevant existing pattern details that help the AI understand what the pattern means.

Example:

```text
SELECTED QUESTION PATTERNS

1.
   ID: 8f2c...
   Name: Simplify Algebraic Fractions
   Description: ...

2.
   ID: 3a91...
   Name: Solve Linear Equations
   Description: ...
```

Only the patterns selected by the user must be included.

Do not include unrelated Question Patterns.

The QuestionPatternId must be the actual database identifier.

---

# 6. AI Must Return QuestionPatternId

This is a critical requirement.

Every generated question MUST contain:

```text
questionPatternId
```

The value must be the exact QuestionPatternId supplied in the prompt.

Example:

```json
{
  "questionNumber": 1,
  "questionText": "...",
  "questionType": "fib",
  "questionPatternId": "8f2c...",
  "correctAnswer": "...",
  "explanation": "..."
}
```

Do NOT use:

```json
{
  "questionPattern": "Simplify Algebraic Fractions"
}
```

as the classification field.

The AI must return the ID, not the name.

The prompt must explicitly state:

> For every generated question, return the `questionPatternId` of the selected Question Pattern that the question implements. Use the exact ID supplied in the selected Question Patterns section. Never invent, modify, or generate a new ID. Do not return the Question Pattern name instead of the ID.

---

# 7. Why Both ID and Name Are Passed

The AI needs the name and relevant details to understand the educational meaning of the pattern.

The application needs the ID for reliable persistence.

Therefore:

```text
Prompt input:

QuestionPatternId
+
QuestionPattern Name
+
Pattern Description / relevant details
```

AI output:

```text
QuestionPatternId
```

This gives us both:

```text
semantic understanding
+
deterministic persistence
```

Do not make the application compare:

```text
AI pattern name
        ↓
database pattern name
        ↓
QuestionPatternId
```

That extra string-resolution step is intentionally avoided.

---

# 8. QuestionPatternId Validation

Although the AI returns the database ID, do NOT blindly trust it.

After receiving the response, the application must verify:

```text
AI questionPatternId
        ↓
Is it one of the QuestionPatternIds
selected by the user?
        ↓
YES → accept
NO  → reject generation
```

For example, if the user selected:

```text
abc-123
xyz-456
```

then:

```text
abc-123 → valid
xyz-456 → valid
qwe-999 → invalid
```

If an AI-generated QuestionPatternId is not among the selected IDs:

- reject the generated result
- do not allow it to be saved
- return a useful error
- do not silently replace it

---

# 9. QuestionType Validation

Similarly:

```text
AI questionType
        ↓
Is it one of the selected QuestionTypes?
        ↓
YES → accept
NO  → reject generation
```

Do not silently replace an invalid value.

---

# 10. Required AI Output

Update the structured AI response contract so every generated question contains:

```text
questionNumber
questionText
questionType
questionPatternId
correctAnswer / expectedAnswer
explanation
```

Follow the existing naming conventions and provider contract where possible.

If the current provider contract uses:

```text
correctAnswer
```

continue using it at the provider boundary and map it to:

```text
ExpectedAnswer
```

where the domain/persistence model requires it.

The important new requirement is:

```text
questionType        REQUIRED
questionPatternId   REQUIRED
```

for every generated question.

---

# 11. Example Expected Response

Conceptually:

```json
{
  "questions": [
    {
      "questionNumber": 1,
      "questionText": "...",
      "questionType": "fib",
      "questionPatternId": "8f2c...",
      "correctAnswer": "...",
      "explanation": "..."
    },
    {
      "questionNumber": 2,
      "questionText": "...",
      "questionType": "mc",
      "questionPatternId": "3a91...",
      "correctAnswer": "...",
      "explanation": "..."
    }
  ]
}
```

The exact schema must follow the project's existing structured-output implementation.

Do not blindly copy this example if the current provider schema has established conventions.

---

# 12. Application Validation

Do not trust the AI response blindly.

Validate every generated question.

### QuestionType

Must be:

- present
- valid
- one of the selected QuestionTypes

### QuestionPatternId

Must be:

- present
- a valid identifier
- one of the selected QuestionPatternIds

### Question content

Continue enforcing existing required fields.

If any generated question fails validation:

```text
Reject generation
Do not allow it to be saved
Return a useful error
```

Do not guess missing metadata.

---

# 13. No Pattern Name Resolution

Do NOT implement logic such as:

```text
AI questionPattern name
        ↓
find database pattern by name
        ↓
QuestionPatternId
```

This task intentionally avoids that design.

The persistence-ready value should already be:

```text
questionPatternId
```

Then the save operation can directly use:

```text
GeneratedQuestions.QuestionPatternId = questionPatternId
```

This is simpler, deterministic, and avoids string-comparison problems.

---

# 14. Multiple Question Types and Patterns

The application supports selecting more than one QuestionType and more than one QuestionPattern.

The AI must classify every question independently.

Example:

```text
Selected QuestionTypes:
- mc
- fib

Selected QuestionPatterns:
- abc-123 → Simplify Algebraic Fractions
- xyz-456 → Solve Linear Equations
```

Possible valid output:

```text
Q1 → mc  + abc-123
Q2 → fib + abc-123
Q3 → mc  + xyz-456
Q4 → fib + xyz-456
```

Every question must contain the exact ID:

```text
questionPatternId = abc-123
```

or:

```text
questionPatternId = xyz-456
```

The AI does NOT need to use every possible combination unless an explicit distribution requirement exists.

---

# 15. Do Not Over-Constrain Distribution

TASK-019 is about **correct classification**, not distribution.

Do not automatically require equal distribution of:

- QuestionTypes
- QuestionPatterns

unless an existing product requirement explicitly requires it.

For example, selecting two QuestionTypes does not automatically mean 50/50 distribution.

---

# 16. Evaluation-Oriented Metadata

This metadata will support future evaluation.

For every saved question we should be able to determine:

```text
QuestionType
QuestionPatternId
GenerationContextId
QuestionText
ExpectedAnswer
Explanation
```

Do not remove QuestionType or QuestionPatternId after generation.

---

# 17. Integration With TASK-018

TASK-018 is already implemented.

Do NOT replace the Save for Evaluation UX.

TASK-019 should make the generated data persistence-ready before it reaches that save operation.

Target:

```text
AI Generation
     ↓
Structured response
     ↓
Validation
     ↓
questionType + questionPatternId
     ↓
Questions Page
     ↓
User clicks Save for Evaluation
     ↓
TASK-018 persistence
     ↓
GeneratedQuestions
```

If TASK-018 currently expects a different field name or structure, make the smallest necessary compatibility change.

Document any compatibility change in the feedback.

---

# 18. TDD Requirements

This task MUST follow TDD.

Follow:

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
  ↓
Next behavior
```

Do not implement the complete prompt/schema/validation first and add tests afterward.

---

# 19. Required Tests

Add meaningful tests using the project's existing test framework.

## Prompt/context construction

Test that:

- selected QuestionTypes are included
- selected QuestionPatterns are included
- each selected QuestionPattern includes its ID
- each selected QuestionPattern includes its name
- relevant pattern details are included when available
- unselected QuestionPatterns are not included
- unselected QuestionTypes are not included
- the prompt explicitly instructs the AI to return `questionPatternId`

## Structured output

Test that:

- `questionType` is required
- `questionPatternId` is required
- existing required question fields remain required
- `questionPattern` as a name is not used as the required classification field

## QuestionType validation

Test that:

- valid selected QuestionType passes
- missing QuestionType fails
- unsupported QuestionType fails
- unselected QuestionType fails

## QuestionPatternId validation

Test that:

- valid selected QuestionPatternId passes
- missing QuestionPatternId fails
- unselected QuestionPatternId fails
- unknown QuestionPatternId fails
- the application does not perform name-based pattern resolution

## Multiple selections

Test:

- one type + one pattern
- multiple types + one pattern
- one type + multiple patterns
- multiple types + multiple patterns

## TASK-018 compatibility

Test that validated generated-question data can still be passed to the existing Save for Evaluation flow.

Do not duplicate unrelated TASK-018 tests.

---

# 20. Real AI Verification

After automated tests pass, perform a real AI generation test.

Use at least:

```text
Multiple QuestionTypes
+
Multiple QuestionPatterns
```

Inspect the actual AI response.

Verify every generated question contains:

```text
questionType
questionPatternId
```

Verify:

```text
questionPatternId
```

is one of the selected IDs.

Verify the AI returns the ID rather than the pattern name.

For example, this is correct:

```json
{
  "questionPatternId": "8f2c..."
}
```

This is NOT correct:

```json
{
  "questionPattern": "Simplify Algebraic Fractions"
}
```

Do not claim real AI verification was completed unless it was actually performed.

---

# 21. Database Verification

TASK-019 should not introduce a new database schema.

When the Save for Evaluation flow is used, verify:

```text
GeneratedQuestions.QuestionType
```

contains the expected stable QuestionType code.

And:

```text
GeneratedQuestions.QuestionPatternId
```

contains the exact selected QuestionPattern ID returned by the validated AI response.

There should be no name-comparison step between AI response and database persistence.

Do not modify database tables unless a genuine blocker is discovered.

---

# 22. Terminology Cleanup

While implementing this task, identify and correct ambiguous duplicate terminology from earlier tasks.

Use:

```text
DifficultyLevel
QuestionType
QuestionPatternId
```

consistently.

Avoid:

```text
Difficulty
AiQuestionType
questionPattern
```

as alternative domain representations for the same concepts.

Provider-specific names may exist only inside the provider boundary when genuinely necessary.

---

# 23. Documentation

Review:

- `README.md`
- `CLAUDE.md`

Update documentation if TASK-019 changes actual project behavior or development instructions.

If the AI response contract is documented elsewhere, update it.

Do not expose API keys or secrets.

---

# 24. Verification Checklist

Before completing TASK-019:

1. Run the full test suite.
2. Run all new/updated tests.
3. Run TypeScript type checking.
4. Run ESLint.
5. Run Prisma validation if relevant code changed.
6. Verify selected QuestionTypes reach the AI context.
7. Verify selected QuestionPatterns reach the AI context.
8. Verify each selected pattern includes both ID and name.
9. Verify the AI prompt explicitly requests `questionPatternId`.
10. Verify every generated question receives a QuestionType.
11. Verify every generated question receives a QuestionPatternId.
12. Verify QuestionPatternId belongs to the selected QuestionPattern IDs.
13. Verify QuestionType belongs to the selected QuestionTypes.
14. Verify invalid QuestionPatternIds are rejected.
15. Verify invalid QuestionTypes are rejected.
16. Verify there is no name-based QuestionPatternId resolution.
17. Verify the result remains compatible with TASK-018.
18. Perform real AI generation using multiple types and patterns.
19. Verify the actual AI response contains IDs, not pattern names.
20. If Save for Evaluation is tested, verify the exact QuestionPatternId reaches GeneratedQuestions.
21. Confirm Evaluation page was not modified.
22. Confirm no unnecessary database schema changes were introduced.
23. Confirm no API keys/secrets were added to source control.

---

# 25. Feedback

Create:

```text
docs/agent-feedbacks/TASK-019-ai-generation-metadata-and-classification.md
```

Include:

## Summary

Explain what was implemented.

## AI Prompt Context

Explain how selected QuestionTypes and QuestionPatterns are passed to the AI.

Explicitly document that each selected QuestionPattern contains:

```text
QuestionPatternId
Name
```

and relevant pattern details.

## AI Response Contract

Document the final generated-question response structure.

Explicitly confirm whether the AI returns:

```text
questionPatternId
```

rather than:

```text
questionPattern
```

## QuestionType

Explain how QuestionType is supplied to and validated from the AI.

## QuestionPatternId

Explain how the AI receives the selected pattern ID and returns the exact ID for each generated question.

## Validation

Explain how invalid/unselected QuestionTypes and QuestionPatternIds are handled.

## Name Resolution

Explicitly state whether any name-based QuestionPattern → QuestionPatternId comparison was implemented.

The expected answer is:

```text
No.
The AI returns the QuestionPatternId directly and the application validates that the ID belongs to the user's selected patterns.
```

## TASK-018 Integration

Explain how the new metadata works with Save for Evaluation.

## Terminology

Confirm that:

```text
DifficultyLevel
QuestionType
QuestionPatternId
```

are used consistently.

## TDD

List tests added and the behaviors they protect.

## Real AI Verification

Report the actual result of testing the real AI response.

Include whether:

- multiple QuestionTypes were tested
- multiple QuestionPatterns were tested
- QuestionPatternId was returned
- returned IDs matched selected IDs

## Verification

Report actual results for:

- Full tests
- TypeScript
- ESLint
- Prisma validation
- Real AI generation
- Multiple QuestionTypes
- Multiple QuestionPatterns
- QuestionPatternId validation
- TASK-018 compatibility
- Database persistence verification if performed

Do not claim a check passed if it was not actually performed.

## Issues / Decisions

Document problems, assumptions, architectural decisions, and anything that should be reviewed before the next task.

---

# 26. Scope Boundary

TASK-019 is specifically about:

> **Making AI-generated questions reliably self-classified with the selected QuestionType and exact QuestionPatternId, validating those values, and keeping the result directly compatible with TASK-018 persistence.**

It includes:

- passing selected QuestionPattern IDs and names to the AI
- passing selected QuestionTypes to the AI
- requiring `questionPatternId` in AI output
- requiring `questionType` in AI output
- validating both against user selections
- keeping database IDs out of AI-generated invention
- removing/avoiding name-based pattern ID resolution
- maintaining TASK-018 compatibility
- TDD tests
- real AI verification

It does NOT include:

- Evaluation page implementation
- Evaluation calculations
- Evaluation analytics
- Generation history
- Editing saved generations
- Deleting saved generations
- New database tables
- New AI providers
- QuestionType/QuestionPattern distribution algorithms unless already required

After TASK-019 is completed, review the actual implementation and real AI output before deciding whether another task is necessary.
