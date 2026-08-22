# MathQuestAI — Database Documentation

## 1. Purpose

This document describes the PostgreSQL database used by MathQuestAI.

The database stores the structured educational information required to dynamically build context for AI-generated mathematics questions.

The database is intentionally focused on the current research scope.

It is **not** intended to store the complete state of a production learning platform.

---

# 2. Database Technology

| Item | Value |
|---|---|
| Database | PostgreSQL |
| Application | Next.js |
| Database Access | Prisma |
| Purpose | Store educational configuration and AI-generation context |

The database is the source of truth for the educational data used by the application.

---

# 3. Database Responsibility

The database currently provides data for:

```text
Subject
   ↓
Topic
   ↓
Subtopic
   ↓
Question Pattern
```

Question-generation context is then associated with Question Patterns and Difficulty Levels:

```text
Question Pattern
      ↓
Reference Questions
      ↑
Difficulty Level
```

and:

```text
Question Pattern
      ↓
Question Generation Request
      ↑
Difficulty Level
```

The application retrieves this information dynamically when constructing an AI generation prompt.

---

# 4. Current Tables

The current database design contains the following core tables:

```text
Subjects
Topics
Subtopics
QuestionPatterns
ReferenceQuestions
QuestionGenerationRequests
```

The exact physical table names should follow the SQL schema that has already been created.

The database implementation should not introduce additional tables unless a new requirement justifies them.

---

# 5. Subject

## Purpose

The Subject table represents the highest-level educational subject.

Example:

```text
Mathematics
```

A Subject can have multiple Topics.

Conceptually:

```text
Subject
   │
   └── Topics
```

### Relationship

```text
Subject 1 ──────── * Topic
```

Subject selection is required in the application.

### Physical schema note (discovered during TASK-004 introspection)

The actual `subjects` table also has a `language` column (`VARCHAR(50)`, e.g. `"English"`), with a unique constraint on `(name, language)`. This was not previously documented here. The database is the source of truth for the physical schema (per §29), so this is recorded here rather than treated as an error — currently seeded data uses a single language, and no application requirement depends on it yet.

---

# 6. Topic

## Purpose

A Topic represents a major area within a Subject.

Example:

```text
Subject:
Mathematics

Topic:
Algebra
```

A Topic belongs to one Subject.

A Topic can contain multiple Subtopics.

### Relationships

```text
Subject 1 ──────── * Topic

Topic 1 ──────── * Subtopic
```

The application should load Topics based on the selected Subject.

---

# 7. Subtopic

## Purpose

A Subtopic represents a specific learning area within a Topic.

For the current project, an important example is:

```text
Topic:
Algebra

Subtopic:
Simplify & Calculate
```

There are **not** separate concepts such as:

```text
Algebraic Expressions
```

in this level of the current database design.

Instead, the current design treats:

```text
Simplify & Calculate
```

as the Subtopic.

Specific activities such as:

```text
Combine Like Terms
Apply Distributive Property
Simplify Algebraic Fractions
```

are Question Patterns.

### Relationship

```text
Topic 1 ──────── * Subtopic
```

Subtopic selection is mandatory in the application.

The user selects one Subtopic for a generation request.

---

# 8. Question Pattern

## Purpose

A Question Pattern represents a specific and meaningful type of mathematical task within a Subtopic.

For the current `Simplify & Calculate` Subtopic, examples include:

- Combine Like Terms
- Apply Distributive Property
- Simplify Algebraic Fractions
- Simplify Multi-Operation Expressions
- Simplify and Retain Variables

A Question Pattern belongs to a Subtopic.

### Relationship

```text
Subtopic 1 ──────── * QuestionPattern
```

The application allows the user to:

- Select one Question Pattern
- Select multiple Question Patterns
- Select all available Question Patterns

At least one Question Pattern must be selected.

---

# 9. Difficulty Level

## Purpose

Difficulty represents the project-specific difficulty benchmark used during question generation.

The current levels are:

```text
Easy
Medium
Hard
```

### Easy

Direct application of the Question Pattern.

Usually requires one main step and a familiar structure.

### Medium

Still directly related to the Question Pattern, but requires additional processing or approximately 2–3 connected steps.

### Hard

Requires multiple connected steps, a more complex arrangement, or a combination of a few related complexity factors.

These definitions are specific to MathQuestAI.

They are not intended to be a universal mathematical difficulty standard.

---

# 10. Difficulty and Database Design

Difficulty is used as part of the generation context.

The project currently associates difficulty with:

```text
Question Pattern
       ↓
Difficulty-specific Reference Questions

Question Pattern
       ↓
Difficulty-specific Generation Prompt
```

Therefore, the same Question Pattern can have different reference questions and generation instructions for:

```text
Easy
Medium
Hard
```

This is important because the research depends on giving the AI examples and instructions appropriate to the requested difficulty.

---

# 11. ReferenceQuestions

## Purpose

`ReferenceQuestions` contains example mathematics questions that demonstrate the expected characteristics of a Question Pattern at a particular Difficulty Level.

Conceptually:

```text
Question Pattern
       +
Difficulty
       ↓
Reference Questions
```

For example:

```text
Question Pattern:
Combine Like Terms

Difficulty:
Easy

Reference Questions:
- Example 1
- Example 2
- Example 3
...
```

The examples are included in the AI generation context.

They also provide a useful reference when evaluating generated questions.

---

# 12. Reference Question Design

Reference Questions should represent the selected Question Pattern clearly.

For example, if the Question Pattern is:

```text
Combine Like Terms
```

the examples should demonstrate combining algebraic like terms.

They should not accidentally represent another Question Pattern such as:

```text
Apply Distributive Property
```

or:

```text
Simplify Algebraic Fractions
```

The examples should also reflect the intended difficulty benchmark.

---

# 13. QuestionGenerationRequests

## Purpose

`QuestionGenerationRequests` stores generation instructions associated with a Question Pattern and Difficulty Level.

The purpose is to provide the AI with instructions describing how questions should be generated for that particular combination.

Conceptually:

```text
Question Pattern
       +
Difficulty
       ↓
Generation Prompt
```

The project intentionally does not use a `QuestionCount` column in this table.

The number of questions to generate is considered part of the common generation instructions rather than a Question Pattern/Difficulty-specific database property.

---

# 14. GenerationPrompt

`QuestionGenerationRequests` contains a `GenerationPrompt` column.

This prompt describes how the AI should generate questions for the associated Question Pattern and Difficulty Level.

For example, the prompt can communicate:

```text
Question Pattern:
Combine Like Terms

Difficulty:
Hard

Generation instructions:
Create questions that require multiple connected steps,
while remaining focused on combining like terms.
```

The exact prompt wording may evolve as the research progresses.

---

# 15. Common Generation Instructions

Not every generation instruction belongs in `QuestionGenerationRequests`.

The project also uses a common prompt/instruction layer that is not stored as a separate database record for every Question Pattern.

Common instructions may contain things such as:

- Main purpose of the generation
- Number of questions to generate
- Expected output format
- General rules that apply to every generation request

Conceptually:

```text
Common Instructions
        +
Question-specific GenerationPrompt
        +
Reference Questions
        ↓
Final AI Prompt
```

This avoids duplicating common instructions across every database record.

---

# 16. Prompt Construction

The database does not directly store one giant final AI prompt.

Instead, the application dynamically constructs the final prompt.

Conceptually:

```text
User Selection
      ↓
Subject
Topic
Subtopic
Question Pattern(s)
Difficulty
Question Type
      ↓
Database Lookup
      ↓
Reference Questions
GenerationPrompt
      ↓
Common Instructions
      ↓
Final Prompt
      ↓
AI API
```

This separation is important for the research because prompts can be improved without redesigning the database structure.

---

# 17. Multiple Question Patterns

The user can select multiple Question Patterns.

For example:

```text
✓ Combine Like Terms
✓ Apply Distributive Property
✓ Simplify Algebraic Fractions
```

The application should retrieve context for each selected Question Pattern.

Conceptually:

```text
Pattern A
   ↓
Reference Questions + Generation Prompt

Pattern B
   ↓
Reference Questions + Generation Prompt

Pattern C
   ↓
Reference Questions + Generation Prompt
```

The application then combines the relevant information into the generation context.

The database does not need a separate "All Patterns" record.

---

# 18. "All Patterns"

The user can select all Question Patterns belonging to the selected Subtopic.

"All" is a UI selection concept.

It should not become a database record such as:

```text
QuestionPattern:
All
```

Instead:

```text
All
 ↓
All Question Patterns for selected Subtopic
 ↓
Generation Context
```

This keeps the database model semantically correct.

---

# 19. Question Type

Question Type is selected by the user.

Question Type is intentionally separate from Question Pattern.

Example:

```text
Question Pattern:
Combine Like Terms

Question Type:
Multiple Choice
```

The selected Question Type is part of the generation request.

It does not necessarily need to be represented as a relationship to Question Pattern because the same Question Pattern may potentially be generated using multiple Question Types.

The exact Question Type database design is not finalized if it is not already represented in the existing schema.

Do not invent a new table until the requirement requires one.

---

# 20. Data Retrieval Flow

The application should retrieve data progressively.

```text
Subject selected
      ↓
Load Topics
      ↓
Topic selected
      ↓
Load Subtopics
      ↓
Subtopic selected
      ↓
Load Question Patterns
      ↓
Question Pattern(s) selected
      ↓
Load relevant generation context
      ↓
Difficulty selected
      ↓
Load difficulty-specific Reference Questions
      ↓
Load difficulty-specific GenerationPrompt
```

The server should validate that the selected relationships are valid.

---

# 21. Database as Context Store

The database is not only storing normal application configuration.

It acts as a structured **context store** for the AI generation process.

The important distinction is:

```text
Traditional application data
        +
AI generation context
        ↓
Database
```

The application retrieves the relevant context based on the user's selections.

---

# 22. What the Database Does Not Store

The current research scope intentionally does not require database tables for:

- Students
- Teachers
- Teams
- Authentication
- User sessions
- Student profiles
- Persistent generated questions
- Evaluation history
- User progress

These were deliberately excluded from the current database scope.

---

# 23. Generated Questions

Generated questions are currently treated as temporary AI output.

The initial flow is:

```text
Question Generation Request
        ↓
AI API
        ↓
Generated Questions
        ↓
Display
        ↓
Evaluation
```

There is currently no requirement to persist every generated question in PostgreSQL.

If future research requires historical comparison of generated results, a persistence model can be introduced later.

---

# 24. Evaluation Data

The current project has an Evaluation page, but evaluation persistence is not currently part of the database scope.

The initial purpose of the Evaluation page is human review of generated questions.

If the project later requires storing evaluation results, that should be introduced as a separate requirement rather than prematurely adding tables now.

---

# 25. Current Data Example

A simplified representation of the current educational hierarchy is:

```text
Subject
└── Mathematics
    │
    └── Topic
        └── Algebra
            │
            └── Subtopic
                └── Simplify & Calculate
                    │
                    ├── Combine Like Terms
                    │   ├── Easy
                    │   │   └── Reference Questions
                    │   ├── Medium
                    │   │   └── Reference Questions
                    │   └── Hard
                    │       └── Reference Questions
                    │
                    ├── Apply Distributive Property
                    │   ├── Easy
                    │   ├── Medium
                    │   └── Hard
                    │
                    ├── Simplify Algebraic Fractions
                    │   ├── Easy
                    │   ├── Medium
                    │   └── Hard
                    │
                    ├── Simplify Multi-Operation Expressions
                    │   ├── Easy
                    │   ├── Medium
                    │   └── Hard
                    │
                    └── Simplify and Retain Variables
                        ├── Easy
                        ├── Medium
                        └── Hard
```

This is a conceptual representation of the data, not a replacement for the actual SQL schema.

---

# 26. Existing Seed Data

The database has already been seeded with examples for the current Algebra research.

Known Question Pattern identifiers include:

```text
Combine Like Terms
37c86114-1b91-4f01-b92e-4febe44d7988

Apply Distributive Property
9905013b-64a0-4b44-a9d9-b2a8acbdd261

Simplify Algebraic Fractions
afd0acf5-2910-4047-b0fd-05eeaa93db62

Simplify Multi-Operation Expressions
d3956b95-a079-4e75-bed7-76d4822a7c32

Simplify and Retain Variables
f8665c14-f597-41d1-b0cb-758a2a3dde67
```

These IDs represent the current seeded Question Pattern records.

Do not assume these IDs should be recreated or changed during application development.

---

# 27. Important Data Modeling Principle

The database hierarchy should represent meaning rather than wording.

For example:

```text
Topic
  Algebra

Subtopic
  Simplify & Calculate

Question Pattern
  Combine Like Terms
```

is preferred over incorrectly treating:

```text
Algebraic Expressions
```

as another level simply because it appears in a question description.

The database should follow the agreed educational categorization.

---

# 28. Data Integrity

The application must respect the database relationships.

Examples:

A Question Pattern must belong to the selected Subtopic.

A Subtopic must belong to the selected Topic.

A Topic must belong to the selected Subject.

Reference Questions must belong to the appropriate Question Pattern and Difficulty context.

Generation prompts must correspond to the appropriate Question Pattern and Difficulty context.

The server must validate these relationships before constructing the final AI prompt.

---

# 29. Prisma Mapping

The existing PostgreSQL schema is the source of truth.

When creating the Prisma schema:

1. Inspect the existing PostgreSQL tables.
2. Map the existing tables and relationships accurately.
3. Do not redesign the database simply to fit a preferred Prisma model.
4. Preserve existing primary keys and foreign keys.
5. Preserve existing seeded data.
6. Use Prisma for typed access from the Next.js server.

If Prisma introduces naming differences between database tables and TypeScript models, use explicit mappings rather than changing the PostgreSQL schema unnecessarily.

---

# 30. Database Changes

Database changes should be driven by requirements.

Before adding a new table or column, ask:

1. What requirement needs this data?
2. Can an existing table represent it correctly?
3. Is the data configuration or transactional/application state?
4. Will storing it improve the research?
5. Is persistence actually required?

Avoid adding tables simply because the information could theoretically be stored.

---

# 31. Current Database Architecture Summary

```text
                 ┌──────────────┐
                 │   Subject    │
                 └──────┬───────┘
                        │
                        │ 1 : many
                        ↓
                 ┌──────────────┐
                 │    Topic     │
                 └──────┬───────┘
                        │
                        │ 1 : many
                        ↓
                 ┌──────────────┐
                 │   Subtopic   │
                 └──────┬───────┘
                        │
                        │ 1 : many
                        ↓
              ┌─────────────────────┐
              │  QuestionPattern    │
              └─────────┬───────────┘
                        │
             ┌──────────┴──────────┐
             ↓                     ↓
┌──────────────────────┐  ┌─────────────────────────┐
│ ReferenceQuestions   │  │ QuestionGeneration       │
│                      │  │ Requests                  │
└──────────┬───────────┘  └────────────┬────────────┘
           │                           │
           └──────────┬────────────────┘
                      ↓
               Difficulty Level
```

The application combines this database information with common generation instructions to construct the final AI context.

---

# 32. Key Principle for Claude Code

Claude Code should treat the existing PostgreSQL schema as an established project decision.

During implementation:

- Inspect before changing.
- Reuse existing tables.
- Do not create duplicate educational tables.
- Do not add unnecessary persistence.
- Do not move educational configuration into hard-coded TypeScript.
- Keep database access server-side.
- Keep prompt construction separate from database access.
- Preserve existing seeded data.

Any proposed schema change should be discussed and documented before implementation.

---

# 33. Future Database Possibilities

The following may be considered later if research requirements evolve:

- GeneratedQuestions
- EvaluationResults
- ExperimentRuns
- PromptVersions
- ModelConfigurations
- GenerationHistory

These are intentionally **future possibilities**, not current requirements.

Do not implement them unless a concrete requirement is introduced.

---

# 34. Database Design Goal

The database should answer this question efficiently:

> Given the user's selected Subject, Topic, Subtopic, Question Pattern(s), and Difficulty, can the application retrieve the right educational context and build an appropriate AI generation prompt?

If the answer is yes, the current database is doing its job.

The database should not become more complex simply because more information could theoretically be stored.
