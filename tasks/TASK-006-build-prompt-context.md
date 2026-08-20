# TASK-005 — Build Prompt Context and Output Contract

## Status

Backlog

---

## Objective

Build the deterministic prompt-construction layer that combines:

```text
Common Generation Instructions
        +
Dynamic Educational Context
        ↓
Final Generation Prompt
```

The prompt produced by this task will later be sent to an AI provider.

This task must also define the **structured output format expected from the AI**, because the generated questions will eventually be parsed by the application and bound to the Question Generation / Question page UI.

**Important:** This task does NOT call an AI provider.

---

# 1. Context

The project has already established:

```text
Next.js
   ↓
Prisma
   ↓
Existing PostgreSQL
   ↓
Dynamic Educational Context
```

TASK-004 established that the application can dynamically load educational context based on user selections.

TASK-005 now converts that context into a deterministic generation prompt.

The future flow is:

```text
User Selection
      ↓
Dynamic Context Loader
      ↓
Structured Educational Context
      ↓
Prompt Builder
      ↓
Final Generation Prompt
      ↓
AI Provider          ← later task
      ↓
Structured AI Response
      ↓
Question Page
```

---

# 2. Required Project Context

Before implementation, read:

```text
CLAUDE.md

docs/project.md
docs/product.md
docs/requirements.md
docs/architecture.md
docs/database.md
docs/ai-generation.md

tasks/README.md
tasks/backlog/TASK-005-build-prompt-context.md
```

Also inspect the implementation completed by TASK-004.

Do not assume the TASK-004 implementation is identical to the original task description.

---

# 3. Core Prompt Architecture

The final prompt should conceptually contain these sections:

```text
1. Common Generation Instructions
2. Educational Context
3. Difficulty Instructions
4. Selected Question Type
5. Reference Questions
6. Output Format
7. Output Constraints
```

Conceptually:

```text
COMMON PROMPT
      +
DYNAMIC CONTEXT
      +
OUTPUT CONTRACT
      ↓
FINAL GENERATION PROMPT
```

The implementation should keep these responsibilities logically separate.

---

# 4. Common Generation Instructions

There is a constant/common prompt that applies to all question-generation scenarios.

It contains instructions that do not depend on:

- Subject
- Subtopic
- Question Pattern
- Difficulty

Examples include:

```text
- Generate the requested number of questions.
- Follow the selected educational context.
- Follow the selected question type.
- Return the response in the required structured format.
- Do not include additional commentary outside the required format.
```

The exact wording should follow the project's current requirements and research decisions.

Do not create a database table for this constant prompt unless explicitly required later.

---

# 5. Dynamic Educational Context

The dynamic portion should be populated from TASK-004.

It may contain:

```text
Subject
Subtopic
Question Pattern(s)
Difficulty
Question Type
GenerationPrompt
Reference Questions
```

Example:

```text
Subject:
Mathematics

Subtopic:
Simplify / Calculate

Question Patterns:
- Combine Like Terms
- Apply Distributive Property

Difficulty:
Hard

Question Type:
Multiple Choice

Generation Prompt:
<selected database prompt>

Reference Questions:
<selected examples>
```

Only context relevant to the user's selections should be included.

Do not send unrelated question patterns or reference questions.

---

# 6. Difficulty Instructions

The current project-specific difficulty definitions are:

| Level | Definition |
|---|---|
| 🟢 Easy | Direct application of the Question Pattern. Usually requires one main step and a familiar structure. |
| 🟡 Medium | Still directly related to the Question Pattern, but requires additional processing or 2–3 connected steps. |
| 🔴 Hard | Requires multiple connected steps, more complex arrangement, or combining a few related complexity factors. |

These definitions are specific to this project.

They are intended to be understandable by humans and used as guidance for generation.

The prompt builder should include the appropriate difficulty guidance when generating the final prompt.

Do not implement a universal mathematical difficulty formula.

Do not implement automatic difficulty classification in this task.

---

# 7. Multiple Question Patterns

The prompt builder must support multiple selected Question Patterns.

Example:

```text
Question Patterns:
1. Combine Like Terms
2. Apply Distributive Property
```

The prompt must clearly communicate that the selected patterns are the allowed generation context.

It must not incorrectly imply that every selected pattern must appear in every generated question.

The common generation instructions may specify that selected concepts should be mixed where appropriate, especially for Hard difficulty, according to the project's current generation strategy.

---

# 8. Reference Questions

Reference Questions are examples stored in PostgreSQL.

They provide examples of the expected style and structure for a selected:

```text
Question Pattern
+
Difficulty
```

The final prompt should include the relevant reference questions in a clearly separated section.

Example:

```text
REFERENCE QUESTIONS

Example 1:
...

Example 2:
...

Example 3:
...
```

Reference questions are examples, not questions that should be copied directly.

The prompt should instruct the AI to use them as guidance and create new questions.

---

# 9. Question Type

Question Type is selected by the user.

It must be explicitly included in the final prompt.

Do not infer Question Type from Question Pattern.

Example:

```text
Question Type:
Multiple Choice
```

The output format must correspond to the selected Question Type.

---

# 10. REQUIRED AI OUTPUT FORMAT

## This is a critical requirement

The AI response must be structured so that the Next.js application can parse it and bind the generated questions to the Question page.

Do NOT design the AI output as free-form text.

The preferred response contract is **JSON**.

The top-level response should have a predictable structure:

```json
{
  "questions": [
    {
      "questionNumber": 1,
      "questionText": "...",
      "questionType": "multiple_choice",
      "options": [
        {
          "id": "A",
          "text": "..."
        },
        {
          "id": "B",
          "text": "..."
        },
        {
          "id": "C",
          "text": "..."
        },
        {
          "id": "D",
          "text": "..."
        }
      ],
      "correctAnswer": "A",
      "explanation": "..."
    }
  ]
}
```

The exact number of questions is determined by the generation request/common prompt.

The AI must return valid JSON and must not wrap the JSON in Markdown code fences.

---

# 11. Question Output Fields

The generated question object should have a predictable schema.

### `questionNumber`

A sequential number:

```text
1
2
3
...
```

Used by the UI to identify/order generated questions.

### `questionText`

The actual mathematics question.

Example:

```text
Simplify 3x + 5x - 2.
```

### `questionType`

A stable machine-readable value.

Example:

```text
multiple_choice
```

The exact allowed values should be defined centrally rather than being invented by the AI.

### `options`

An array of answer options when the selected Question Type requires options.

For example:

```json
[
  {
    "id": "A",
    "text": "8x - 2"
  },
  {
    "id": "B",
    "text": "8x + 2"
  },
  {
    "id": "C",
    "text": "6x + 2"
  },
  {
    "id": "D",
    "text": "3x + 3"
  }
]
```

For question types that do not require options, this field should follow the agreed application contract rather than forcing meaningless options.

### `correctAnswer`

Contains the answer in a predictable machine-readable representation.

For Multiple Choice, for example:

```text
A
```

The contract must be consistent with the selected Question Type.

### `explanation`

Contains a concise explanation/solution suitable for displaying or reviewing the generated question.

This field should be included because the application/research evaluation may need to inspect why an answer is correct.

---

# 12. Output Format Must Be Designed for UI Binding

The Question page should be able to do something conceptually similar to:

```text
AI JSON
   ↓
Parse response
   ↓
Question DTO
   ↓
Question page
   ↓
Render questionText
   ↓
Render options
   ↓
Track selected answer
   ↓
Show correctAnswer / explanation when appropriate
```

The UI must not need to parse natural-language AI output.

Bad:

```text
Question 1:
What is 3x + 5x?

A) 8x
B) 5x
C) 15x
D) 2x

Answer: A
```

Good:

```json
{
  "questions": [
    {
      "questionNumber": 1,
      "questionText": "What is 3x + 5x?",
      "questionType": "multiple_choice",
      "options": [
        { "id": "A", "text": "8x" },
        { "id": "B", "text": "5x" },
        { "id": "C", "text": "15x" },
        { "id": "D", "text": "2x" }
      ],
      "correctAnswer": "A",
      "explanation": "3x and 5x are like terms, so their coefficients are added."
    }
  ]
}
```

---

# 13. Output Contract and Question Type

The output contract must support different Question Types.

Do not assume that every future Question Type has the same structure.

For example:

```text
Multiple Choice
    → options + correctAnswer

Short Answer
    → expected answer + explanation

True / False
    → true/false answer

Other future types
    → type-specific fields
```

However, TASK-005 should implement only the Question Types already required by the current project.

Do not build a generalized question-type framework prematurely.

The important principle is:

> The AI output must have a predictable schema that matches the selected Question Type and can be converted directly into a UI DTO.

---

# 14. Separate AI Response DTO From Database Entities

The generated AI response is not automatically a database entity.

Do not create or modify a `GeneratedQuestions` database table as part of this task.

The initial purpose is:

```text
AI Response
    ↓
Generation Response DTO
    ↓
Question Page
```

Persistence can be considered later if the project scope requires it.

---

# 15. Prompt Builder Responsibilities

The Prompt Builder should:

1. Receive structured generation context.
2. Add the common generation instructions.
3. Add the selected educational context.
4. Add difficulty guidance.
5. Add the selected Question Type.
6. Add relevant reference questions.
7. Add the required output contract.
8. Return a deterministic final prompt.

Conceptually:

```text
GenerationContext
       ↓
PromptBuilder
       ↓
string finalPrompt
```

The same input should produce the same prompt.

Do not call an AI provider from the Prompt Builder.

---

# 16. Prompt Builder Should NOT

The Prompt Builder must not:

```text
❌ Query PostgreSQL directly
❌ Decide which Subject the user selected
❌ Decide which Difficulty the user selected
❌ Infer Question Type
❌ Generate questions
❌ Evaluate generated questions
❌ Call an AI provider
❌ Persist generated questions
```

Those responsibilities belong elsewhere.

The Prompt Builder consumes already prepared context.

---

# 17. Prompt Inspection

Because this is an AI research project, the final prompt must be inspectable.

The application should provide a development/research-friendly way to see:

```text
Selected Context
+
Final Prompt
```

This is important because the research loop is:

```text
Prompt Version 1
    ↓
Generate
    ↓
Evaluate
    ↓
Identify weakness
    ↓
Modify context/prompt
    ↓
Prompt Version 2
    ↓
Generate again
```

The developer/researcher must be able to inspect what was actually sent to the AI later.

---

# 18. TDD

This task must follow TDD for the prompt-construction behavior.

Tests should be written around deterministic inputs and outputs.

Examples:

### Common prompt inclusion

```text
Given a generation context,
the final prompt contains the common generation instructions.
```

### Subject

```text
The selected Subject appears in the educational context.
```

### Multiple patterns

```text
All selected Question Patterns appear in the final prompt.
```

### Difficulty

```text
Hard produces the Hard difficulty guidance.
```

### Reference questions

```text
Only relevant reference questions are included.
```

### Question Type

```text
The selected Question Type is explicitly included.
```

### Output contract

```text
The final prompt explicitly requires the agreed JSON output format.
```

### Determinism

```text
The same GenerationContext produces the same final prompt.
```

---

# 19. Output Schema Validation

Define a TypeScript DTO/schema for the expected AI response.

The application should be able to validate:

```text
AI response
    ↓
Expected schema
    ↓
Valid / Invalid
```

Use the project's existing validation approach if one exists.

If no validation library has been selected, choose a lightweight approach appropriate for the project.

Do not add a large validation framework unnecessarily.

---

# 20. Invalid AI Response

The future AI integration must be able to detect malformed output.

Examples:

```text
Invalid JSON
Missing questions
Missing questionText
Missing questionType
Missing options when required
Invalid correctAnswer
Unexpected structure
```

TASK-005 should establish the response contract and validation model.

It does not need to implement AI retry logic yet.

---

# 21. Output Format Is Part of the Prompt Contract

The final prompt must explicitly tell the AI:

```text
Return ONLY the required JSON structure.
Do not return Markdown.
Do not add commentary before or after the JSON.
Follow the required field names.
Follow the selected Question Type.
```

The wording may be refined during the research iterations.

The important requirement is that the expected output is machine-readable.

---

# 22. Number of Questions

The number of questions is part of the common generation instructions/request context.

Do not add a `QuestionCount` column to the database.

The final prompt must contain the requested question count.

Example:

```text
Generate 5 questions.
```

The generated JSON should contain the requested number of question objects.

---

# 23. Example Final Prompt Structure

The exact wording will evolve during research, but the structure should resemble:

```text
COMMON INSTRUCTIONS
-------------------
[constant instructions]

GENERATION REQUIREMENT
----------------------
Generate 5 questions.

EDUCATIONAL CONTEXT
-------------------
Subject: Mathematics
Subtopic: Simplify / Calculate

Question Patterns:
- Combine Like Terms
- Apply Distributive Property

DIFFICULTY
----------
Hard

Hard means:
Requires multiple connected steps, more complex arrangement,
or combining a few related complexity factors.

QUESTION TYPE
-------------
Multiple Choice

REFERENCE QUESTIONS
-------------------
Example 1:
...

Example 2:
...

GENERATION GUIDANCE
-------------------
[QuestionGenerationRequests.GenerationPrompt]

OUTPUT FORMAT
-------------
Return ONLY valid JSON using this structure:

{
  "questions": [
    {
      "questionNumber": 1,
      "questionText": "...",
      "questionType": "multiple_choice",
      "options": [
        { "id": "A", "text": "..." },
        { "id": "B", "text": "..." },
        { "id": "C", "text": "..." },
        { "id": "D", "text": "..." }
      ],
      "correctAnswer": "A",
      "explanation": "..."
    }
  ]
}
```

The actual final prompt should be generated programmatically, not hard-coded as one giant string with values embedded manually.

---

# 24. Out of Scope

Do NOT implement:

```text
❌ OpenAI integration
❌ Claude integration
❌ Gemini integration
❌ Actual question generation
❌ GeneratedQuestions persistence
❌ Evaluation engine
❌ EvaluationResults persistence
❌ Automatic difficulty classification
❌ Authentication
❌ User sessions
❌ Teachers
❌ Students
❌ Teams
```

---

# 25. Acceptance Criteria

This task is complete when:

- [ ] A deterministic Prompt Builder exists.
- [ ] Common instructions can be included.
- [ ] Dynamic educational context can be included.
- [ ] Multiple Question Patterns are supported.
- [ ] Difficulty guidance is included.
- [ ] Question Type is included.
- [ ] Relevant Reference Questions are included.
- [ ] `GenerationPrompt` can be included.
- [ ] Requested question count is included.
- [ ] A clear machine-readable output contract is included.
- [ ] The expected AI response has a defined TypeScript DTO/schema.
- [ ] Multiple Choice output can be represented correctly if it is part of the current project.
- [ ] The generated question structure is suitable for direct UI binding.
- [ ] The AI response can be validated against the expected structure.
- [ ] Prompt construction has meaningful tests.
- [ ] The same context produces a deterministic prompt.
- [ ] The final prompt can be inspected during development/research.
- [ ] No AI provider is called.
- [ ] No generated-question persistence is introduced.
- [ ] No database schema is changed.
- [ ] `npm run lint` succeeds.
- [ ] Production/build validation succeeds.

---

# 26. Research Significance

This task establishes the second major part of the project's research loop.

TASK-004:

```text
Can we load the correct educational context?
```

TASK-005:

```text
Can we consistently transform that context into
a useful, inspectable AI prompt with a predictable
machine-readable response format?
```

The future loop becomes:

```text
User Selection
      ↓
Dynamic Context
      ↓
Prompt Builder
      ↓
Inspect Prompt
      ↓
AI Provider
      ↓
Structured JSON Response
      ↓
Bind to Question Page
      ↓
Evaluate
      ↓
Improve Prompt / Context
      ↓
Repeat
```

---

# 27. Completion Report

When the task is complete, report:

### Prompt Structure

Show the major sections of the generated prompt.

### Example

Provide one representative generated prompt using test/mock context.

### Output Contract

Show the final TypeScript DTO/schema and one valid JSON example.

### UI Binding

Explain how the generated question DTO can be mapped to the Question page.

### Tests

List:

- Prompt construction tests
- Output schema validation tests
- Determinism test

### Validation

```text
Tests:
Lint:
Build:
```

### AI

Explicitly report:

```text
AI provider called: YES / NO
```

Expected:

```text
NO
```

### Database

Explicitly report:

```text
Database schema changed: YES / NO
```

Expected:

```text
NO
```

### Documentation

List any documentation updated.

Do not automatically begin TASK-006 after completion.

Wait for review/approval.
