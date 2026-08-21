# MathQuestAI — Architecture

## 1. Purpose

This document defines the technical architecture of MathQuestAI.

The architecture is intentionally simple because MathQuestAI is a research project rather than a production enterprise application.

The architecture should support:

- Fast experimentation
- Clear separation of responsibilities
- Testability
- TDD where meaningful
- Database-driven educational data
- Dynamic prompt construction
- AI API experimentation
- Easy iteration between generation and evaluation

---

# 2. Technology Stack

The planned stack is:

| Area | Technology |
|---|---|
| Framework | Next.js |
| Language | TypeScript |
| UI | React |
| Database | PostgreSQL |
| ORM | Prisma |
| AI Integration | AI provider API, provider to be decided |
| Testing | To be selected based on the Next.js/TypeScript setup |
| Package Manager | Use the package manager selected during project initialization |

Do not introduce additional infrastructure unless a real project requirement justifies it.

---

# 3. High-Level Architecture

The application follows a simple full-stack Next.js architecture.

```text
┌──────────────────────────────────────────┐
│                Browser                   │
│                                          │
│  React / Next.js UI                      │
│  Selection Pages                         │
│  Generated Questions                     │
│  Evaluation                              │
└───────────────────┬──────────────────────┘
                    │
                    │ HTTP / Server Actions
                    ↓
┌──────────────────────────────────────────┐
│              Next.js Application         │
│                                          │
│  UI / Pages                              │
│       ↓                                  │
│  Application / Server Logic              │
│       ↓                                  │
│  Prompt Construction                     │
│       ↓                                  │
│  Data Access                             │
│       ↓                                  │
│  AI Integration                          │
└───────────────┬───────────────────┬──────┘
                │                   │
                ↓                   ↓
        ┌──────────────┐    ┌──────────────┐
        │ PostgreSQL   │    │   AI API     │
        │              │    │              │
        │ Educational  │    │ Question     │
        │ Context      │    │ Generation   │
        └──────────────┘    └──────────────┘
```

---

# 4. Why Next.js

Next.js is used because this project needs both UI and server-side functionality while remaining simple.

It allows us to keep:

- React UI
- Server-side logic
- API endpoints
- Database access
- AI API integration

inside one project.

We do not need a separate ASP.NET Core API for the current research scope.

This reduces the number of projects and infrastructure components we need to maintain.

---

# 5. Application Structure

The project should use a clear separation between UI, application logic, data access, and AI integration.

A proposed structure is:

```text
MathQuestAI/
│
├── app/
│   ├── page.tsx
│   ├── layout.tsx
│   │
│   ├── generate/
│   │   └── page.tsx
│   │
│   ├── evaluation/
│   │   └── page.tsx
│   │
│   └── api/
│       └── ...
│
├── components/
│   ├── generation/
│   ├── evaluation/
│   └── shared/
│
├── lib/
│   ├── db/
│   ├── ai/
│   ├── prompts/
│   └── validation/
│
├── prisma/
│   └── schema.prisma
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── docs/
│
├── docs/tasks/
│
├── CLAUDE.md
└── package.json
```

The exact folder structure may be adjusted during implementation if the framework requires it.

---

# 6. UI Layer

The UI layer is responsible for:

- Rendering pages
- Displaying selection controls
- Loading available options
- Managing user selections
- Validating user input at the UI level
- Displaying generated questions
- Displaying evaluation information

The UI should not contain database-specific logic or AI prompt construction logic.

---

# 7. Generation Flow

> **Implementation note (TASK-002):** The recreated UI does not include a "Select Question Pattern(s)" step — Question Pattern is resolved internally rather than user-selected. See `docs/project-management/requirements.md` §6 and `docs/project-management/ui.md` §5.

The generation flow is:

```text
User
 ↓
Select Subject
 ↓
Select Topic
 ↓
Select Subtopic
 ↓
Select Question Pattern(s)
 ↓
Select Difficulty
 ↓
Select Question Type
 ↓
Generate
 ↓
Server-side generation flow
```

The server-side flow then becomes:

```text
Validate Request
      ↓
Load Relevant Database Data
      ↓
Load Reference Questions
      ↓
Load Difficulty-specific Prompt
      ↓
Load Common Generation Instructions
      ↓
Build Final Prompt
      ↓
Call AI API
      ↓
Validate AI Response
      ↓
Return Generated Questions
```

---

# 8. Database Layer

PostgreSQL is the source of truth for educational configuration and generation context.

The database currently contains concepts such as:

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
Difficulty
```

and:

```text
QuestionPattern
       ↓
QuestionGenerationRequests
       ↑
Difficulty
```

The detailed schema is documented separately in:

`docs/project-management/database.md`

The application should use Prisma for database access.

---

# 9. Prisma

Prisma is responsible for providing typed database access from TypeScript.

The intended flow is:

```text
Next.js Server Logic
       ↓
Prisma
       ↓
PostgreSQL
```

Prisma should not be used directly from client-side React components.

Database access should remain server-side.

---

# 10. Dynamic Data Loading

> **Implementation note (TASK-002):** "Question Patterns for Subtopic" below is not a UI-facing load in the current implementation, since Question Pattern is not user-selected. See `docs/project-management/requirements.md` §6.

Educational values should be loaded dynamically.

For example:

```text
GET / Subject
       ↓
Subject list

Selected Subject
       ↓
Topics for Subject

Selected Topic
       ↓
Subtopics for Topic

Selected Subtopic
       ↓
Question Patterns for Subtopic
```

The UI should not hard-code these values.

---

# 11. Cascading Selection

> **Implementation note (TASK-002):** The current UI's selection chain ends at Subtopic; Question Pattern is not a separate UI selection step. See `docs/project-management/requirements.md` §6.

The selection chain is:

```text
Subject
   ↓
Topic
   ↓
Subtopic
   ↓
Question Pattern(s)
```

When a parent selection changes, dependent selections must be reset or validated.

For example:

```text
Subject A
 ↓
Topic A
 ↓
Subtopic A
 ↓
Pattern A
```

If Subject changes to Subject B, the previous Topic, Subtopic, and Pattern selections may no longer be valid.

The server must not trust only client-side validation.

---

# 12. Generation Request

The client should send a small structured request rather than a fully constructed AI prompt.

Conceptually:

```typescript
{
  subjectId,
  topicId,
  subtopicId,
  questionPatternIds,
  difficultyLevel,
  questionType
}
```

The server should use these identifiers/selections to retrieve the required context.

The client should not be responsible for assembling the final AI prompt.

This keeps prompt construction centralized and easier to experiment with.

---

# 13. Prompt Construction

Prompt construction is a core part of the research.

The architecture should keep prompt construction separate from:

- React UI
- Database access
- AI provider implementation

Conceptually:

```text
Generation Request
        ↓
Context Loader
        ↓
Prompt Builder
        ↓
Final Prompt
        ↓
AI Provider
```

A possible internal structure is:

```text
lib/
└── prompts/
    ├── common/
    ├── builder.ts
    └── types.ts
```

The exact implementation can evolve.

---

# 14. Prompt Context

The prompt builder should be able to combine:

```text
Common Instructions
+
Subject
+
Topic
+
Subtopic
+
Question Pattern(s)
+
Difficulty
+
Question Type
+
Difficulty-specific Generation Instructions
+
Reference Questions
```

Conceptually:

```text
┌─────────────────────────────┐
│ Common Instructions         │
├─────────────────────────────┤
│ Educational Context         │
├─────────────────────────────┤
│ Selected Pattern(s)         │
├─────────────────────────────┤
│ Difficulty Instructions     │
├─────────────────────────────┤
│ Reference Questions         │
├─────────────────────────────┤
│ Question Type               │
└──────────────┬──────────────┘
               ↓
         Final AI Prompt
```

---

# 15. AI Integration

The AI provider should be isolated behind a small application-level interface.

Conceptually:

```typescript
interface QuestionGenerator {
  generate(request: GenerationContext): Promise<GeneratedQuestion[]>;
}
```

The exact interface may change during implementation.

The purpose is to prevent the rest of the application from becoming tightly coupled to one AI provider.

---

# 16. AI Provider Boundary

The architecture should separate:

```text
Application
     ↓
QuestionGenerator
     ↓
AI Provider Adapter
     ↓
External AI API
```

For example:

```text
lib/
└── ai/
    ├── question-generator.ts
    └── providers/
        └── ...
```

The provider implementation should be replaceable.

This is useful because the research may involve comparing different LLMs.

---

# 17. AI Response Validation

The AI response should not be trusted blindly.

The server should validate that the response follows the expected structure before returning it to the UI.

At minimum, the application should detect:

- Invalid response structure
- Missing questions
- Unexpected response format
- AI API failure

The exact output schema will be defined when the generation API is implemented.

---

# 18. Evaluation Architecture

The Evaluation page is initially a human evaluation tool.

It should allow the researcher/team to inspect generated questions and compare them against the intended requirements.

The first version should remain simple.

Do not introduce automated LLM judging unless it becomes an explicit research requirement.

The architecture should leave room for future evaluation improvements.

---

# 19. TDD Approach

The project should follow Test-Driven Development where meaningful.

The normal development loop should be:

```text
Write Test
    ↓
Implement Small Change
    ↓
Run Test
    ↓
Refactor
    ↓
Repeat
```

For a feature:

```text
Requirement
    ↓
Test
    ↓
Implementation
    ↓
Evaluation
```

Not every project-initialization action needs a test.

For example:

- Creating the Next.js project
- Installing dependencies
- Initial configuration

can be completed without forcing artificial tests.

Once application behavior begins, TDD should become the normal development approach.

---

# 20. Testing Layers

Tests should be separated according to responsibility.

```text
tests/
├── unit/
├── integration/
└── e2e/
```

### Unit Tests

Use for isolated logic such as:

- Prompt construction
- Validation
- Data transformation
- Difficulty-related logic
- Selection rules

### Integration Tests

Use for behavior involving:

- Database access
- Prisma
- Server-side application logic

### End-to-End Tests

Use for important user flows such as:

```text
Select requirements
       ↓
Generate
       ↓
Display results
```

The project should not create unnecessary tests simply to increase test count.

Tests should protect meaningful behavior.

---

# 21. Task Management

Tasks will be created incrementally during development.

The project should maintain task information inside the repository so that Claude Code can understand:

- What has been completed
- What is currently in progress
- What is planned next
- What decisions were made
- What remains unresolved

A proposed structure is:

```text
docs/tasks/
├── backlog/
├── active/
├── completed/
└── tests/
```

The exact organization can evolve.

Each task should contain enough context for Claude Code to work without guessing.

---

# 22. Research Documentation

The `docs/` directory is part of the development process.

It should contain stable project knowledge such as:

```text
docs/
├── project.md
├── product.md
├── requirements.md
├── architecture.md
├── database.md
├── ai-generation.md
└── research/
```

Research findings should be documented as they become available.

---

# 23. Research Experiment Boundary

A major architectural principle is to keep the following concerns separate:

```text
Product UI
      │
      ↓
Generation Request
      │
      ↓
Context Retrieval
      │
      ↓
Prompt Construction
      │
      ↓
AI Provider
      │
      ↓
Generated Output
      │
      ↓
Evaluation
```

This separation allows the team to change the prompt/context strategy without rewriting the UI or database layer.

---

# 24. No Unnecessary Backend

The project does not currently require a separate backend project.

Avoid creating:

```text
Angular
+
ASP.NET Core API
+
Next.js
+
Separate AI service
```

or similar unnecessary layers.

The current architecture is intentionally:

```text
Next.js
+
PostgreSQL
+
Prisma
+
AI API
```

This is sufficient for the research scope.

---

# 25. Existing Figma React Project

A separate React project exists at:

```text
D:\my works\MathQuestAI_UI
```

It is the visual reference for the application.

The target Next.js project is:

```text
D:\my works\MathQuestAI
```

The existing React project must not be modified.

The first UI implementation should inspect and reproduce:

- Pages
- Routes
- Components
- Layout
- Styling
- Assets
- User flow

The reference project is not the production/runtime dependency of MathQuestAI.

---

# 26. Environment and Secrets

Secrets such as AI API keys and database credentials must be stored in environment variables.

They must not be:

- Hard-coded
- Committed to source control
- Sent to client-side code

Use an environment file such as:

```text
.env.local
```

and provide an appropriate example file for required variables.

---

# 27. Error Handling

Errors should be handled at the appropriate boundary.

Examples:

```text
UI Validation Error
        ↓
Display validation message
```

```text
Database Error
        ↓
Server-side handling
        ↓
Safe user-facing error
```

```text
AI API Error
        ↓
Server-side handling
        ↓
Safe user-facing error
        ↓
Allow retry
```

Internal stack traces and secrets must not be exposed to users.

---

# 28. Architecture Principles

The project should follow these principles:

### Keep it simple

Do not introduce architecture because it is popular.

Introduce it only when it solves a real project problem.

### Separate responsibilities

UI, database access, prompt construction, AI integration, and evaluation should not become one large module.

### Prefer server-side data access

Database and AI API credentials belong on the server.

### Make experiments easy

Prompt and context changes should be isolated and easy to test.

### Use TDD for behavior

Tests should guide meaningful application development.

### Avoid premature optimization

This is a research project. Optimize only when an actual problem appears.

---

# 29. Initial Implementation Order

The recommended implementation sequence is:

```text
1. Initialize Next.js project
        ↓
2. Recreate UI pages/routes from Figma reference
        ↓
3. Configure PostgreSQL + Prisma
        ↓
4. Verify database connectivity
        ↓
5. Load Subject / Topic / Subtopic data
        ↓
6. Implement cascading selections
        ↓
7. Load Question Patterns
        ↓
8. Implement Difficulty and Question Type selection
        ↓
9. Implement generation request model
        ↓
10. Implement context retrieval
        ↓
11. Implement prompt builder
        ↓
12. Integrate AI provider
        ↓
13. Display generated questions
        ↓
14. Implement Evaluation page
        ↓
15. Begin research iterations
```

Tasks should be created and executed incrementally rather than implementing everything in one large change.

---

# 30. Architecture Decision Rule

When Claude Code encounters an architectural choice, it should prefer the smallest solution that satisfies the current requirement.

Before introducing a new library, service, abstraction, or architectural layer, ask:

1. What problem does it solve?
2. Is that problem currently present?
3. Can the existing stack solve it simply?
4. Will it make the research harder to understand?
5. Is it easy to remove later?

If the answer does not justify the complexity, do not introduce it.

---

# 31. Final Architecture Summary

The intended architecture is:

```text
                    ┌──────────────────────┐
                    │       Browser        │
                    │                      │
                    │    Next.js / React   │
                    └──────────┬───────────┘
                               │
                               ↓
                    ┌──────────────────────┐
                    │     Next.js Server   │
                    │                      │
                    │ Validation           │
                    │ Application Logic    │
                    │ Prompt Construction   │
                    └───────┬────────┬──────┘
                            │        │
                    ┌───────┘        └────────┐
                    ↓                         ↓
             ┌──────────────┐        ┌──────────────┐
             │    Prisma    │        │ AI Provider  │
             └──────┬───────┘        └──────────────┘
                    ↓
             ┌──────────────┐
             │ PostgreSQL   │
             └──────────────┘

                    ↓
              Generated Output
                    ↓
                Evaluation
                    ↓
          Improve Context / Prompt
                    ↓
                 Repeat
```

This architecture is the baseline for the project.

It should evolve only when new requirements or research findings justify a change.
