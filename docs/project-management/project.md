# MathQuestAI — Project Context

## 1. Project Name

**MathQuestAI**

MathQuestAI is an AI-powered mathematics question-generation research project.

---

## 2. Project Purpose

The purpose of MathQuestAI is to investigate how effectively different Large Language Models (LLMs) can generate mathematics questions when they are provided with carefully structured context.

The project is not only about generating questions.

The main research interest is:

> How does the quality and structure of the context and prompt affect the quality and consistency of AI-generated mathematics questions?

We want to experiment with different context and prompt strategies, generate questions, evaluate the results, identify weaknesses, improve the context, and repeat the process.

---

## 3. Core Research Loop

The project follows an iterative research loop:

```text
Define Context
      ↓
Build Prompt
      ↓
Generate Questions
      ↓
Evaluate Results
      ↓
Identify Problems
      ↓
Improve Context / Prompt
      ↓
Generate Again
      ↓
Evaluate Again
      ↓
      ...
```

This iterative process is a core part of the project.

---

## 4. Problem We Are Investigating

Different LLMs may interpret the same instructions differently.

For example, if we request:

```text
Question Pattern: Combine Like Terms
Difficulty: Hard
```

one LLM may generate a question that our team considers Hard, while another LLM may generate something that appears closer to Medium.

Therefore, simply sending:

```text
Generate a Hard question.
```

is not sufficient for our research.

We need to provide structured context that makes our intended difficulty and question pattern clearer.

This is why the project uses:

- Question Patterns
- Difficulty Levels
- Reference Questions
- Difficulty-specific Generation Prompts
- Common Generation Instructions
- User-selected Question Types
- Structured database data

---

## 5. Project-Specific Difficulty Definition

The project uses three difficulty levels.

### Easy

Direct application of the Question Pattern.

Usually requires one main step and a familiar structure.

### Medium

Still directly related to the Question Pattern, but requires additional processing or approximately 2–3 connected steps.

### Hard

Requires multiple connected steps, a more complex arrangement, or a combination of a few related complexity factors.

These definitions are specific to this research project.

They are not intended to be a universal definition of mathematical difficulty.

---

## 6. Reference Questions

Reference Questions are examples that demonstrate how a particular Question Pattern should look at a particular difficulty level.

For example:

```text
Question Pattern
      +
Difficulty Level
      ↓
Reference Questions
```

We maintain sample questions for:

- Easy
- Medium
- Hard

The reference questions help us communicate the intended difficulty and question structure to the LLM.

They are also useful when evaluating whether generated questions are consistent with our intended benchmark.

---

## 7. Question Generation Concept

The user provides selections through the application.

The expected flow is:

```text
Open MathQuestAI
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
```

The system then loads the relevant information from PostgreSQL and constructs the AI generation context.

Conceptually:

```text
User Selections
      ↓
Database Data
      ↓
Question Pattern
      ↓
Difficulty
      ↓
Reference Questions
      ↓
Difficulty-specific Generation Prompt
      ↓
Common Generation Instructions
      ↓
Final Prompt
      ↓
AI API
      ↓
Generated Questions
```

---

## 8. Database-Driven Context

The application should not hard-code every possible question-generation scenario.

Instead, educational information is stored in PostgreSQL.

The application dynamically loads the appropriate information based on the user's selections.

The database currently contains concepts such as:

- Subjects
- Topics
- Subtopics
- Difficulty Levels
- Question Patterns
- Reference Questions
- Question Generation Requests

The database design is documented separately in:

`docs/project-management/database.md`

---

## 9. Question Patterns

> **Implementation note (TASK-002):** Question Pattern is not exposed as a user-selectable field in the recreated UI's Setup screen — it's resolved internally during generation. See `docs/project-management/requirements.md` §6 and `docs/project-management/ui.md` §5.

Question Patterns represent specific types of mathematical tasks within a Subtopic.

For example, under Algebra we have worked with patterns such as:

- Combine Like Terms
- Apply Distributive Property
- Simplify Algebraic Fractions
- Simplify Multi-Operation Expressions
- Simplify and Retain Variables

The exact list may evolve as the project develops.

A Question Pattern should represent a meaningful and distinguishable type of question rather than simply being another wording of the same mathematical task.

---

## 10. Question Types

Question Type is selected by the user.

Question Type is intentionally separate from Question Pattern.

For example:

```text
Question Pattern:
Combine Like Terms

Question Type:
Multiple Choice
```

The same Question Pattern may therefore potentially be generated using different Question Types.

The exact Question Type implementation and supported values will be defined in the requirements.

---

## 11. Common Generation Instructions

The project uses common generation instructions that can be applied to question-generation requests regardless of the specific:

- Subject
- Topic
- Subtopic
- Question Pattern

The common instructions may define things such as:

- General purpose of the generation
- Number of questions
- Expected output format
- General generation rules

Question-pattern-specific and difficulty-specific instructions are maintained separately.

This separation allows us to experiment with the context without duplicating common instructions across every database record.

---

## 12. Evaluation

The application will include an Evaluation page.

The Evaluation page is important because generated questions are not automatically considered correct simply because an AI model produced them.

The team needs to evaluate generated questions against the expected behavior.

Potential evaluation considerations include:

- Correct Question Pattern
- Correct Difficulty Level
- Appropriate mathematical content
- Similarity to reference-question characteristics
- Correct Question Type
- Expected output format
- Other criteria defined during the research

The evaluation methodology is expected to evolve during the project.

---

## 13. Research Iterations

The project should support repeated experiments.

For example:

### Iteration 1

```text
Initial prompt
      ↓
LLM
      ↓
Generated questions
      ↓
Evaluation
      ↓
Problems identified
```

### Iteration 2

```text
Improved prompt/context
      ↓
LLM
      ↓
Generated questions
      ↓
Evaluation
      ↓
Compare with previous result
```

### Iteration 3

```text
Further improved context
      ↓
LLM
      ↓
Generated questions
      ↓
Evaluation
```

The project should make it easy for the team to experiment with these changes.

---

## 14. Technology Stack

The planned technology stack is:

- **Next.js**
- **TypeScript**
- **PostgreSQL**
- **Prisma**
- **AI API** — provider to be decided later

The application is intended to remain simple because this is a research/capstone project rather than a production enterprise system.

---

## 15. Existing UI Reference

A React project generated from the Figma design already exists at:

```text
D:\my works\MathQuestAI_UI
```

The project has already been installed and can run locally at:

```text
http://localhost:5173/
```

This project is a **read-only UI reference**.

It already contains the pages and visual design required for the application.

The actual Next.js application will be developed separately at:

```text
D:\my works\MathQuestAI
```

The existing React project must not be modified.

The initial UI implementation task is to:

1. Inspect the existing React project.
2. Understand its pages.
3. Understand its routes.
4. Understand its components.
5. Understand its assets and styling.
6. Recreate the required UI in the Next.js application.
7. Preserve the intended user flow and visual design.

---

## 16. Current Database Status

The PostgreSQL database has already been created.

Initial tables and relationships have been designed and SQL scripts have been executed.

Initial seed data has also been added for the educational question-generation domain.

The database includes reference questions and difficulty-specific question-generation prompts for several Algebra Question Patterns.

The detailed schema, relationships, and current seed data are documented in:

`docs/project-management/database.md`

---

## 17. Current Project Status

### Completed

- [x] Project concept defined
- [x] Research objective identified
- [x] Difficulty benchmark defined
- [x] Initial Question Patterns defined
- [x] Reference Question approach defined
- [x] Question Generation Request approach defined
- [x] PostgreSQL database designed
- [x] PostgreSQL database created
- [x] Initial seed data created
- [x] Initial AI-generation context strategy defined
- [x] Figma UI design created
- [x] Figma-generated React reference project available

### In Progress

- [ ] Create Next.js project
- [ ] Establish project development structure
- [ ] Recreate UI pages and routes
- [ ] Connect PostgreSQL through Prisma

### Upcoming

- [ ] Load database data dynamically
- [ ] Implement user-selection flow
- [ ] Implement prompt construction
- [ ] Implement AI API integration
- [ ] Generate questions
- [ ] Implement Evaluation page
- [ ] Begin AI prompt/context experiments
- [ ] Evaluate and improve generation results iteratively

---

## 18. Initial Development Tasks

The first development tasks are intentionally limited.

### Task 001 — Project Initialization

Create and configure the Next.js + TypeScript project.

Initial project scaffolding does not need to strictly follow TDD because there is little application behavior to test at this stage.

---

### Task 002 — UI Analysis and Implementation

Inspect the read-only Figma/React project and recreate the required pages and routes in the Next.js application.

Use TDD where meaningful for application behavior.

---

### Task 003 — Database Integration

Configure Prisma and connect the Next.js application to the existing PostgreSQL database.

Verify that the application can load the existing educational data.

---

## 19. Development Philosophy

The project should remain:

- Simple
- Understandable
- Testable
- Research-focused
- Easy to modify
- Easy to experiment with

Avoid unnecessary enterprise-level architecture.

The project does not currently require:

- Authentication
- Student accounts
- Teacher accounts
- Team management
- Complex authorization
- User sessions
- Large-scale infrastructure

These may be considered in the future only if the project scope changes.

---

## 20. Important Project Principle

The goal is not to build the most sophisticated AI question-generation system.

The goal is to build a controlled research environment where we can answer questions such as:

> How does structured context affect the quality of LLM-generated mathematics questions?

and:

> Can better prompts, reference questions, difficulty definitions, and contextual information produce more consistent results across different LLMs?

Therefore, every major feature should be evaluated based on whether it helps us answer the research question.

---

## 21. Current Research Direction

The current direction is:

```text
Database
    ↓
Dynamic Context
    ↓
Prompt Construction
    ↓
AI Generation
    ↓
Evaluation
    ↓
Context / Prompt Improvement
    ↓
AI Generation
    ↓
Evaluation
    ↓
...
```

The team will refine this approach as experimental results become available.
