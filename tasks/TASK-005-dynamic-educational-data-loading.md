# TASK-004 — Implement Dynamic Educational Data Loading

## Status

Backlog

---

## Objective

Connect the MathQuestAI UI to the existing PostgreSQL educational data through Prisma and implement the first version of **dynamic context loading based on user selections**.

The purpose of this task is to prove the core idea of the project:

> Keep structured educational data in the database and dynamically load only the relevant information based on the user's selections.

Target application:

```text
D:\my works\MathQuestAI
```

---

# 1. Context

The project already has:

```text
Next.js
   ↓
Prisma
   ↓
Existing PostgreSQL
```

The database contains structured educational information such as:

```text
Subject
   ↓
Topic
   ↓
Subtopic
   ↓
Question Pattern
   ↓
Reference Questions

QuestionGenerationRequests
```

The UI was created based on the Figma reference project.

This task connects the UI selections to the database.

---

# 2. Core Project Idea

The application should **not extract educational information repeatedly from external documents or sources** during every question-generation request.

Instead:

```text
Educational Data
      ↓
Stored in PostgreSQL
      ↓
User selects criteria
      ↓
Application loads relevant records
      ↓
Context is assembled
      ↓
Later task will send context to AI
```

This task implements up to:

```text
User Input
   ↓
Dynamic Database Loading
   ↓
Structured Context
```

It does NOT implement the AI call.

---

# 3. Required Project Context

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
tasks/backlog/TASK-004-dynamic-educational-data-loading.md
```

Also inspect the implementation completed by previous tasks.

Do not assume that previous tasks were implemented exactly as originally planned.

---

# 4. Inspect Existing Implementation

Before making changes, inspect:

```text
app/
components/
lib/
prisma/
tests/
```

and any existing database-related code.

Confirm:

- How Prisma Client is currently accessed.
- How the UI routes are structured.
- Where the question-generation UI exists.
- What form controls are already available.
- What server-side boundaries already exist.
- What testing framework is configured.

Reuse existing project patterns where appropriate.

Do not create duplicate database clients or duplicate infrastructure.

---

# 5. Educational Selection Flow

The current selection model is:

```text
Subject
   ↓
Subtopic
   ↓
Question Pattern(s)
   ↓
Difficulty
   ↓
Question Type
```

Important project requirements:

### Subtopic

The user must select a Subtopic.

### Question Pattern

The user must select at least one Question Pattern.

Multiple Question Patterns are allowed.

The user may select:

```text
All Patterns
```

when supported by the UI.

### Difficulty

Difficulty is mandatory.

Current levels:

```text
Easy
Medium
Hard
```

### Question Type

Question Type is selected by the user.

It is not automatically determined by the Question Pattern.

---

# 6. Dynamic Loading

The UI should load dependent educational data dynamically.

Conceptually:

```text
Select Subject
      ↓
Load relevant Subtopics
      ↓
Select Subtopic
      ↓
Load relevant Question Patterns
      ↓
Select one or more Question Patterns
      ↓
Select Difficulty
      ↓
Load relevant generation context
```

Do not load every possible educational record into the browser simply because it is available in the database.

Load the data required for the current selection.

---

# 7. Subject Loading

The application should retrieve available Subjects from PostgreSQL.

Expected behavior:

```text
Application
    ↓
Prisma
    ↓
Subject records
    ↓
UI
```

The Subject list should be generated from database data rather than hard-coded application data.

---

# 8. Subtopic Loading

When a Subject is selected, retrieve only the Subtopics associated with that Subject according to the actual database relationships.

Example:

```text
Subject:
Mathematics

        ↓

Relevant Subtopics
```

Do not return unrelated Subtopics.

When the Subject changes, dependent selections should be handled correctly.

For example, an existing Subtopic selection that no longer belongs to the selected Subject must not remain silently valid.

---

# 9. Question Pattern Loading

After a Subtopic is selected, retrieve the Question Patterns associated with that Subtopic.

Example:

```text
Subtopic:
Simplify / Calculate

        ↓

Question Patterns
- Find Simplified Form
- Combine Like Terms
- Apply Distributive Property
- Simplify Algebraic Fractions
- Simplify Multi-Operation Expressions
- Simplify and Retain Variables
```

The actual values must come from PostgreSQL.

Do not hard-code these examples into the application.

---

# 10. Multiple Question Patterns

The application must support selecting multiple Question Patterns.

Example:

```text
Question Patterns:

[x] Combine Like Terms
[x] Apply Distributive Property
[ ] Simplify Algebraic Fractions
```

The backend/data-loading logic must accept multiple pattern IDs.

It must not assume:

```text
QuestionPatternId = single value
```

when the UI allows multiple selections.

---

# 11. All Patterns

If the UI supports:

```text
All Patterns
```

the implementation should treat it as a selection of all valid Question Patterns for the selected Subtopic rather than creating an artificial database record called "All Patterns".

The exact UI representation may be different, but the underlying data query should remain meaningful.

---

# 12. Difficulty

Difficulty is mandatory.

The current project-level definition is:

| Level | Definition |
|---|---|
| 🟢 Easy | Direct application of the Question Pattern. Usually requires one main step and a familiar structure. |
| 🟡 Medium | Still directly related to the Question Pattern, but requires additional processing or 2–3 connected steps. |
| 🔴 Hard | Requires multiple connected steps, more complex arrangement, or combining a few related complexity factors. |

These definitions are **project-specific**.

They are not intended to be a universal mathematical definition.

The purpose of this task is only to load the selected difficulty as part of the generation context.

Do not implement an automatic difficulty classifier here.

---

# 13. Question Type

Question Type is selected by the user.

The application must not infer Question Type from Question Pattern.

For example:

```text
Question Pattern:
Combine Like Terms

Question Type:
Multiple Choice
```

or:

```text
Question Pattern:
Combine Like Terms

Question Type:
Short Answer
```

The exact available Question Types should follow the project requirements/database/UI.

Do not introduce an automatic pattern → question-type mapping unless explicitly required later.

---

# 14. Reference Questions

Reference questions are stored in the database.

They are examples used to provide context for question generation.

When the user selects:

```text
Subtopic
Question Pattern(s)
Difficulty
```

the application should be capable of loading the relevant reference questions.

For example:

```text
Question Pattern:
Combine Like Terms

Difficulty:
Hard

        ↓

Reference Questions
for Combine Like Terms + Hard
```

The implementation must use the actual database relationships and fields.

Do not generate new reference questions in this task.

---

# 15. QuestionGenerationRequests

The project contains `QuestionGenerationRequests`.

These records contain generation prompts associated with:

```text
Question Pattern
Difficulty
```

The project intentionally removed a separate `QuestionCount` column.

The number of generated questions is considered part of the common generation instructions/request context rather than a database-level difficulty/pattern relationship.

The application should be able to load the appropriate `GenerationPrompt` for the selected generation context.

Do not redesign the `QuestionGenerationRequests` table in this task.

---

# 16. Prompt Context Assembly

This task may introduce a structured representation of the loaded context.

For example:

```text
Generation Context

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
<selected prompt>

Reference Questions:
<selected examples>
```

The exact DTO/type structure should follow the existing project architecture.

The important requirement is that the context is:

- Structured
- Deterministic
- Traceable to database records
- Based on user selections

---

# 17. Common Prompt

The project has a separate concept of a **constant/common prompt**.

The common prompt contains instructions applicable to question-generation scenarios regardless of:

- Subject
- Subtopic
- Question Pattern
- Difficulty

Examples of common concerns include:

```text
How many questions should be generated?
Expected output format
General purpose of the generation request
Common generation instructions
```

This common prompt is not necessarily a database record.

Do not redesign the database to store this constant prompt in this task.

The current task only needs to prepare the dynamic context that can later be combined with the common prompt.

---

# 18. Important Boundary

The final prompt sent to an AI provider is **NOT implemented in TASK-004**.

Do not call:

```text
OpenAI
Claude
Gemini
```

or another LLM provider.

The intended future architecture is approximately:

```text
Common Prompt
      +
Dynamic Database Context
      ↓
Prompt Builder
      ↓
AI Provider
      ↓
Generated Questions
```

TASK-004 implements only:

```text
Dynamic Database Context
```

---

# 19. API / Server Boundary

Database access must remain server-side.

The browser should not query PostgreSQL directly.

Expected flow:

```text
Browser
   ↓
Next.js server/API/server action
   ↓
Prisma
   ↓
PostgreSQL
```

Use the simplest appropriate Next.js mechanism based on the architecture already established.

Do not introduce unnecessary API layers.

---

# 20. TDD Approach

This task contains important application behavior and should follow TDD.

For each meaningful behavior:

```text
Write test
   ↓
Implement
   ↓
Run test
   ↓
Refactor
```

Focus tests on observable behavior.

---

# 21. Required Test Cases

At minimum, cover these scenarios.

### Subject loading

```text
Given the database contains Subjects,
when Subjects are requested,
the application returns the expected Subject records.
```

### Subtopic filtering

```text
Given a Subject is selected,
when Subtopics are requested,
only Subtopics belonging to that Subject are returned.
```

### Question Pattern filtering

```text
Given a Subtopic is selected,
when Question Patterns are requested,
only patterns belonging to that Subtopic are returned.
```

### Multiple patterns

```text
Given multiple Question Pattern IDs,
when generation context is requested,
the context contains all selected patterns.
```

### Difficulty

```text
Given a Question Pattern and Difficulty,
the corresponding generation context is selected.
```

### Reference questions

```text
Given a Question Pattern and Difficulty,
the appropriate reference questions are loaded.
```

### Generation prompt

```text
Given a Question Pattern and Difficulty,
the appropriate GenerationPrompt is loaded.
```

### Invalid combinations

Test that invalid combinations are rejected or safely return no data.

Example:

```text
A Question Pattern that does not belong to the selected Subtopic
```

must not silently be treated as valid.

---

# 22. Test Database Considerations

Do not make all unit tests dependent on the developer's personal PostgreSQL database.

Where appropriate:

```text
Unit tests
    ↓
Mocks / fakes

Integration tests
    ↓
Controlled database
```

The real PostgreSQL database should be used for integration verification where appropriate.

Do not modify production-like data merely to make tests pass.

---

# 23. UI Integration

Connect the existing generation UI to the dynamic data.

At minimum, demonstrate:

```text
Subject
   ↓
Subtopic
   ↓
Question Pattern(s)
   ↓
Difficulty
   ↓
Loaded generation context
```

The UI should no longer depend on hard-coded educational data for these selections.

The UI does not yet need to send the final prompt to an AI provider.

---

# 24. State Reset Rules

Dependent selections must not become invalid after a parent selection changes.

For example:

```text
Subject A
   ↓
Subtopic A1
   ↓
Question Pattern A1-1
```

If the user changes to:

```text
Subject B
```

the application must ensure that:

```text
Subtopic A1
Question Pattern A1-1
```

are not incorrectly retained as valid selections.

The exact reset behavior should follow the UI design, but invalid dependent state must not be submitted.

---

# 25. Performance

Do not optimize prematurely.

However:

- Avoid loading the entire database when only a subset is required.
- Select only required fields where practical.
- Avoid unnecessary duplicate requests.
- Avoid querying the same context repeatedly when the current selection has not changed.

Caching may be introduced later if measurement shows it is necessary.

Do not introduce Redis or another caching system for this task.

---

# 26. Error Handling

Handle database/loading failures safely.

The UI should provide a meaningful state such as:

```text
Unable to load question patterns.
```

Do not expose:

- Database credentials
- Raw connection strings
- Internal SQL details
- Sensitive server exceptions

to the browser.

---

# 27. Out of Scope

Do NOT implement:

```text
❌ AI provider integration
❌ Prompt Builder
❌ Final prompt construction
❌ Question generation
❌ GeneratedQuestions persistence
❌ Evaluation engine
❌ EvaluationResults persistence
❌ Difficulty classification
❌ Automatic question-type selection
❌ Authentication
❌ User sessions
❌ Students
❌ Teachers
❌ Teams
❌ Redis caching
❌ Complex state-management architecture
```

---

# 28. Acceptance Criteria

This task is complete when:

- [ ] Subjects are loaded dynamically from PostgreSQL.
- [ ] Subtopics are dynamically filtered by Subject.
- [ ] Question Patterns are dynamically filtered by Subtopic.
- [ ] Multiple Question Patterns can be selected.
- [ ] "All Patterns" can be represented without requiring an artificial database record.
- [ ] Difficulty is mandatory.
- [ ] Question Type remains user-selected.
- [ ] Relevant Reference Questions can be loaded based on the selected generation context.
- [ ] Relevant `GenerationPrompt` data can be loaded.
- [ ] Dynamic context can be represented in a structured DTO/type.
- [ ] The UI uses database data rather than hard-coded educational selections.
- [ ] Dependent selections cannot remain invalid after parent selections change.
- [ ] Database access remains server-side.
- [ ] Meaningful behavior has tests.
- [ ] Tests pass.
- [ ] `npm run lint` succeeds.
- [ ] Production/build validation succeeds.
- [ ] No AI provider has been called.
- [ ] No database schema has been changed.
- [ ] No unrelated architecture has been introduced.

---

# 29. Expected Result

After this task, the application should be able to demonstrate:

```text
User
 ↓
Select Subject
 ↓
Select Subtopic
 ↓
Select one or more Question Patterns
 ↓
Select Difficulty
 ↓
Select Question Type
 ↓
Application loads:
    - Selected patterns
    - Difficulty-specific GenerationPrompt
    - Relevant Reference Questions
 ↓
Structured Generation Context
```

For example:

```text
Subject:
Mathematics

Subtopic:
Simplify / Calculate

Question Patterns:
Combine Like Terms
Apply Distributive Property

Difficulty:
Hard

Question Type:
Multiple Choice

Generation Prompt:
<database value>

Reference Questions:
<database values>
```

The application should be able to produce this structured context without calling an LLM.

---

# 30. Research Significance

This task represents an important part of the project's research hypothesis:

> Structured educational knowledge can be stored once and dynamically selected as context for AI question generation based on user requirements.

The intended loop later becomes:

```text
User Selection
      ↓
Dynamic Context
      ↓
Common Prompt + Dynamic Context
      ↓
AI Generation
      ↓
Evaluation
      ↓
Identify Weakness
      ↓
Improve Context / Prompt
      ↓
Generate Again
```

TASK-004 establishes the **Dynamic Context** stage.

---

# 31. Completion Report

When the task is complete, report:

### Dynamic flow

Show:

```text
Subject
→ Subtopic
→ Question Pattern(s)
→ Difficulty
→ Question Type
→ Generation Context
```

### Database queries

List the important queries/data-access operations implemented.

### Tests

List:

- Test cases
- Results
- Any integration tests

### UI

List the pages/components changed.

### Validation

```text
Tests:
Lint:
Build:
Manual UI validation:
Database verification:
```

### Schema

Explicitly report:

```text
Database schema changed: YES / NO
```

Expected:

```text
NO
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

### Documentation

List documentation updated.

Do not automatically begin TASK-005 after completion.

Wait for review/approval.
