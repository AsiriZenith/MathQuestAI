# MathQuestAI — Functional Requirements

## 1. Purpose

This document defines the functional requirements of MathQuestAI.

It describes what the application should do from a user and system behavior perspective.

It should not contain detailed implementation decisions. Technical implementation belongs in `docs/architecture.md`.

---

# 2. Core User Flow

The primary question-generation flow is:

```text
Subject
   ↓
Topic
   ↓
Subtopic
   ↓
Question Pattern(s)
   ↓
Difficulty Level
   ↓
Question Type
   ↓
Generate
   ↓
Generated Questions
   ↓
Evaluation
```

The selections should progressively determine the available options in the next selection.

---

# 3. Subject

## Requirement

The system must allow the user to select a Subject.

Subjects are stored in the database.

### Rules

- Subject selection is required.
- The list of Subjects should be loaded dynamically from the database.
- The application should not hard-code the Subject list in the UI.

Example:

```text
Mathematics
```

---

# 4. Topic

## Requirement

After selecting a Subject, the system must load Topics belonging to that Subject.

### Rules

- Topic selection is required.
- Topics must be filtered based on the selected Subject.
- Topics should be loaded dynamically from the database.
- The UI should not display Topics that do not belong to the selected Subject.

Example:

```text
Subject:
Mathematics

Topic:
Algebra
```

---

# 5. Subtopic

## Requirement

After selecting a Topic, the system must load the Subtopics belonging to that Topic.

### Rules

- Subtopic selection is mandatory.
- The user must select exactly one Subtopic for a generation request.
- Subtopics must be filtered based on the selected Topic.
- Subtopics should be loaded dynamically from the database.

Example:

```text
Topic:
Algebra

Subtopic:
Simplify / Calculate
```

---

# 6. Question Pattern

> **Implementation note (TASK-002):** The UI recreated in TASK-002 from the reference design does **not** present Question Pattern as a user-selectable field in the Setup screen. It is resolved internally during generation based on Subject/Topic/Subtopic/Difficulty/Question Type. This was a deliberate decision to match the reference UI exactly rather than add UI not present in the design (see `docs/ui.md` §5). The requirement below describes the originally intended long-term behavior; it does not currently reflect the implemented UI.

## Requirement

After selecting a Subtopic, the system must load the Question Patterns belonging to that Subtopic.

### Rules

- Question Pattern selection is mandatory.
- The user can select one Question Pattern.
- The user can select multiple Question Patterns.
- The user can select all available Question Patterns.
- Question Patterns must belong to the selected Subtopic.
- The available Question Patterns should be loaded dynamically from the database.

Example:

```text
Subtopic:
Simplify / Calculate

Question Patterns:

☐ Combine Like Terms
☐ Apply Distributive Property
☐ Simplify Algebraic Fractions
☐ Simplify Multi-Operation Expressions
☐ Simplify and Retain Variables
```

---

# 7. Difficulty Level

## Requirement

The user must select a Difficulty Level.

The project currently defines:

- Easy
- Medium
- Hard

### Rules

- Difficulty selection is mandatory.
- Exactly one Difficulty Level should be selected for a generation request.
- Difficulty definitions are project-specific.
- Difficulty-specific generation instructions are stored in the database.

### Project Benchmark

#### Easy

Direct application of the Question Pattern.

Usually requires one main step and a familiar structure.

#### Medium

Still directly related to the Question Pattern, but requires additional processing or approximately 2–3 connected steps.

#### Hard

Requires multiple connected steps, a more complex arrangement, or a combination of a few related complexity factors.

These definitions are project-specific and are not intended to represent a universal educational standard.

---

# 8. Question Type

## Requirement

The user must select a Question Type.

Question Type is independent from Question Pattern.

For example:

```text
Question Pattern:
Combine Like Terms

Question Type:
Multiple Choice
```

### Rules

- Question Type selection is required.
- Question Type is selected by the user.
- Question Type should not be automatically determined by Question Pattern.
- The selected Question Type must be included in the generation context.

The exact list of supported Question Types may evolve as the project develops.

---

# 9. Generate Button

## Requirement

The Generate action should only be available when all mandatory selections have been completed.

The required selections are:

```text
Subject
Topic
Subtopic
Question Pattern(s)
Difficulty Level
Question Type
```

If one or more required selections are missing, the system should prevent generation and clearly indicate what is missing.

---

# 10. Multiple Question Patterns

The user can select multiple Question Patterns.

Example:

```text
✓ Combine Like Terms
✓ Apply Distributive Property
✓ Simplify Algebraic Fractions
```

The generation request must preserve all selected patterns.

The system should not silently reduce multiple selected patterns to a single pattern.

The final prompt construction should receive the complete set of selected Question Patterns.

---

# 11. Select All Question Patterns

The user can select all available Question Patterns for the selected Subtopic.

The system should treat "All" as selecting the complete set of currently available patterns for that Subtopic.

The application should not store "All" as a separate Question Pattern.

Instead:

```text
All
 ↓
All available patterns
 ↓
Generation context
```

This prevents "All" from becoming duplicated or incorrectly represented as an actual mathematical Question Pattern.

---

# 12. Cascading Selection

The selection controls should behave as a dependency chain:

```text
Subject
   ↓
Topic
   ↓
Subtopic
   ↓
Question Pattern
```

If an earlier selection changes, dependent selections should be reset or revalidated.

Example:

```text
Subject A
   ↓
Topic A
   ↓
Subtopic A
   ↓
Question Pattern A
```

If the user changes the Subject:

```text
Subject B
```

the previously selected Topic, Subtopic, and Question Pattern values may no longer be valid.

The application must prevent invalid combinations from being submitted.

---

# 13. Generation Context

When the user clicks Generate, the application should construct a generation request from the selected values.

The generation context should contain relevant information such as:

```text
Subject
Topic
Subtopic
Question Pattern(s)
Difficulty Level
Question Type
Reference Questions
Difficulty-specific Generation Prompt
Common Generation Instructions
```

The system should retrieve the relevant information dynamically from the database.

---

# 14. Reference Questions

Reference Questions are associated with Question Patterns and Difficulty Levels.

When constructing the generation context, the system should retrieve the relevant Reference Questions for the selected Question Pattern(s) and Difficulty Level.

For multiple Question Patterns:

```text
Selected Pattern A
      ↓
Relevant reference questions

Selected Pattern B
      ↓
Relevant reference questions

Selected Pattern C
      ↓
Relevant reference questions
```

The final generation context should contain the relevant examples.

---

# 15. Generation Prompt

The system should construct the final AI prompt dynamically.

Conceptually:

```text
Common Instructions
        +
Subject / Topic / Subtopic
        +
Question Pattern(s)
        +
Difficulty
        +
Question Type
        +
Difficulty-specific Instructions
        +
Reference Questions
        ↓
Final AI Prompt
```

The exact prompt construction strategy is documented separately in:

`docs/ai-generation.md`

---

# 16. Generated Questions

After a successful AI generation request, the generated questions should be displayed to the user.

The current scope does not require permanent storage of generated questions.

The initial flow is:

```text
Generate
   ↓
AI API
   ↓
Generated Questions
   ↓
Display
```

Generated questions are currently treated as experimental output.

---

# 17. AI API Errors

If the AI API request fails, the application should:

- Inform the user that generation failed.
- Avoid displaying misleading or incomplete results.
- Provide an appropriate way to retry.

The application should not expose sensitive API credentials or internal implementation details to the user.

---

# 18. Evaluation

The application will provide an Evaluation page.

The purpose is to allow the team to review generated questions against the project requirements.

The Evaluation page should eventually allow the team to assess areas such as:

- Question Pattern
- Difficulty
- Mathematical correctness
- Question Type
- Relevance to Subtopic
- Reference Question characteristics
- Output format

The exact evaluation methodology is not finalized yet.

Do not implement a complex scoring system unless it is explicitly defined in a future requirement.

---

# 19. Research Iteration

The application should support an iterative workflow:

```text
Generate
   ↓
Evaluate
   ↓
Identify weakness
   ↓
Improve context / prompt
   ↓
Generate again
```

The system should make prompt and context improvements relatively easy to experiment with.

The research objective is not to create one permanently fixed prompt.

---

# 20. Database-Driven Behavior

Educational data should be loaded dynamically from PostgreSQL.

The UI should not contain hard-coded business data for:

- Subjects
- Topics
- Subtopics
- Question Patterns
- Reference Questions
- Difficulty-specific generation prompts

The database is the source for these values.

---

# 21. Current Database Concepts

The current database design includes:

```text
Subject
   ↓
Topic
   ↓
Subtopic
   ↓
QuestionPattern
```

and:

```text
QuestionPattern
       ↓
ReferenceQuestions
       ↑
DifficultyLevel
```

and:

```text
QuestionPattern
       ↓
QuestionGenerationRequests
       ↑
DifficultyLevel
```

The complete schema is documented in:

`docs/database.md`

---

# 22. Validation Requirements

Before sending a generation request, the application must validate:

- Subject is selected.
- Topic is selected.
- Subtopic is selected.
- At least one Question Pattern is selected.
- Difficulty Level is selected.
- Question Type is selected.

The application must also ensure that the selected values represent a valid combination.

---

# 23. Out of Scope

The following are currently outside the functional scope:

- Authentication
- Student accounts
- Teacher accounts
- Teams
- User sessions
- Persistent generated-question history
- Student progress tracking
- Payment functionality
- Complex authorization
- Production-scale infrastructure

These should not be implemented unless explicitly added later.

---

# 24. Requirements That Are Intentionally Not Finalized

The following areas are intentionally open for future research/design:

- Exact AI provider
- Exact Question Type list
- Exact evaluation scoring methodology
- Number of generated questions
- Final AI output schema
- Advanced prompt optimization strategy
- Automated evaluation
- Comparison methodology between LLMs

Do not make irreversible architectural decisions based on these unresolved areas.

---

# 25. Functional Requirement Summary

The minimum functional flow is:

```text
┌───────────────┐
│    Subject    │
└───────┬───────┘
        ↓
┌───────────────┐
│     Topic     │
└───────┬───────┘
        ↓
┌───────────────┐
│    Subtopic   │
└───────┬───────┘
        ↓
┌─────────────────────┐
│ Question Pattern(s) │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│    Difficulty       │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│    Question Type    │
└──────────┬──────────┘
           ↓
      ┌──────────┐
      │ Generate │
      └────┬─────┘
           ↓
    ┌──────────────┐
    │ AI Generation│
    └──────┬───────┘
           ↓
    ┌──────────────┐
    │   Results    │
    └──────┬───────┘
           ↓
    ┌──────────────┐
    │  Evaluation  │
    └──────────────┘
```

This represents the current functional baseline.

Future requirements should extend this document rather than silently changing existing behavior.
