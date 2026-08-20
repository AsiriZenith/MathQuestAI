# MathQuestAI — Claude Code Instructions

## 1. Project Overview

MathQuestAI is an AI-powered educational question-generation research project.

The goal is to investigate how effectively LLMs generate mathematics questions based on structured context such as:

- Subject
- Topic
- Subtopic
- Question Pattern
- Difficulty Level
- Question Type
- Reference Questions
- Generation Instructions

The main research focus is not simply generating questions.

The main focus is understanding how the quality of the provided context and prompts affects the generated results.

The project follows this iterative research loop:

```text
Define Context
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

---

## 2. Technology Stack

The application uses:

- Next.js
- TypeScript
- PostgreSQL
- Prisma
- AI API — provider to be decided later

Do not introduce additional major technologies unless there is a clear requirement or the decision is documented first.

---

## 3. Development Approach — TDD

The project follows a Test-Driven Development (TDD) approach wherever practical.

The general development cycle is:

```text
Write Test
    ↓
Implement
    ↓
Run Test
    ↓
Refactor
    ↓
Repeat
```

TDD should not be forced where it provides little value.

For example, these may be completed before meaningful tests exist:

- Initial project scaffolding
- Creating the basic Next.js project
- Installing dependencies
- Basic configuration
- Initial folder structure

Once application behavior begins to be implemented, TDD should become the default approach.

---

## 4. Research-Driven Development

MathQuestAI is not only a software application. It is also a research experiment.

The important development loop is:

```text
User Configuration
        ↓
Load Database Context
        ↓
Build Prompt
        ↓
AI API
        ↓
Generated Questions
        ↓
Evaluation
        ↓
Evaluate Against Expected Result
        ↓
Improve Prompt / Context
        ↓
Repeat
```

The purpose is to experiment with different ways of providing context to an LLM and observe how the generated questions change.

Prompt construction and context selection are therefore first-class parts of the application.

---

## 5. Project Context

Detailed project information is maintained in `docs/`.

Before implementing a feature, read the relevant documentation.

### Documentation

- `docs/project.md` — overall project context and current project state
- `docs/product.md` — product definition and goals
- `docs/requirements.md` — functional requirements and user flows
- `docs/architecture.md` — technical architecture
- `docs/database.md` — database structure and relationships
- `docs/ai-generation.md` — AI generation, context and prompt strategy
- `docs/ui.md` — UI pages, routes and design decisions
- `docs/development.md` — development workflow and TDD practices
- `docs/progress.md` — current project progress and completed/in-progress work

If documentation conflicts with assumptions in the code, stop and identify the conflict rather than silently choosing an implementation.

---

## 6. README Maintenance

`README.md` is the high-level public entry point for the project.

The project is still evolving, so **do not treat the README as a finalized specification**.

The later parts of the project have not yet been fully decided. Requirements, UI behavior, evaluation methodology, architecture details, and research workflow may evolve as the project progresses.

### After completing a meaningful task

Check `README.md` before considering the task complete.

Ask:

> Does this task introduce or change information that a new developer or reviewer should know from the project overview?

If yes, update `README.md`.

Examples of information that may need to be reflected include:

- A new major feature
- A significant architecture decision
- A change to the technology stack
- A new important workflow
- A significant database concept
- A major change to the AI generation pipeline
- A meaningful change to the research process
- A change to the overall project structure

Do **not** duplicate detailed implementation documentation in the README.

The README should remain a concise, high-level project overview.

When a task does not introduce meaningful project-level information, leave the README unchanged.

---

## 7. Source of Truth

Use the following priority when determining project behavior:

1. Explicit task requirements
2. Relevant documentation in `docs/`
3. Existing application code
4. Existing UI reference project
5. General technical assumptions

Do not invent requirements.

If something is unclear and the decision affects architecture, data structure, research methodology, or user-facing behavior, ask for clarification before implementing it.

---

## 8. Figma / React UI Reference Project

An existing React project generated from the Figma design is available at:

`D:\my works\MathQuestAI_UI\`

This project is a READ-ONLY reference project.

It contains the UI pages and design that should be reproduced in the actual Next.js application.

### Important rules

- Do NOT modify the project at `D:\my works\MathQuestAI_UI\`.
- Inspect it when UI implementation requires it.
- Reuse its visual structure, page concepts, routes, assets, and design patterns where appropriate.
- Adapt the implementation to Next.js rather than blindly copying the React project.
- The actual application is being developed in `D:\my works\MathQuestAI\`.

---

## 9. Database

The project uses PostgreSQL with Prisma.

The database has already been created and seeded with the initial educational data.

The database contains concepts such as:

- Subjects
- Topics
- Subtopics
- Difficulty Levels
- Question Patterns
- Reference Questions
- Question Generation Requests

The detailed schema and relationships are documented in:

`docs/database.md`

Do not redesign existing database relationships without first reviewing the documented design and identifying the reason for the change.

---

## 10. Difficulty Levels

MathQuestAI uses three project-specific difficulty levels.

### Easy

Direct application of the Question Pattern.

Usually requires one main step and a familiar structure.

### Medium

Still directly related to the Question Pattern, but requires additional processing or approximately 2–3 connected steps.

### Hard

Requires multiple connected steps, a more complex arrangement, or a combination of a few related complexity factors.

These definitions are project-specific benchmarks. They are not intended to represent a universal educational definition of difficulty.

Reference questions demonstrate how each difficulty level should look for a particular Question Pattern.

---

## 11. AI Question Generation

Question generation is one of the main research areas.

The system should dynamically construct generation context from database data.

The general flow is:

```text
User selections
      ↓
Load relevant database data
      ↓
Question Pattern
      ↓
Difficulty-specific Generation Prompt
      ↓
Reference Questions
      ↓
Common Generation Instructions
      ↓
Final AI Prompt
      ↓
AI Model
      ↓
Generated Questions
      ↓
Evaluation
```

The team will experiment with different prompts and context combinations.

The objective is to determine which context produces better and more consistent results.

Detailed decisions belong in:

`docs/ai-generation.md`

---

## 12. Evaluation Status

The Evaluation page is part of the intended research workflow, but **it is not yet finalized**.

Do not assume that its UI, evaluation criteria, scoring model, workflow, or implementation details are final.

The evaluation process may eventually consider:

- Whether the generated question follows the selected Question Pattern
- Whether the generated question matches the requested difficulty
- Whether the generated question follows the provided reference questions
- Whether the question follows the requested question type
- Whether the generated output follows the expected format
- Other research-specific criteria defined later

Treat these as current research considerations, not as a finalized specification.

When implementing the Evaluation page, follow the latest task and documentation rather than assuming this section defines the final design.

---

## 13. Research Iteration

When an AI generation result is poor, do not immediately add complex application logic.

First investigate whether the problem can be improved through:

- Better context
- Better reference questions
- Better difficulty definitions
- Better generation prompts
- Better common instructions
- Better prompt composition

The research loop is:

```text
Generate
   ↓
Evaluate
   ↓
Identify Weakness
   ↓
Improve Context
   ↓
Generate Again
```

This iterative process is a core research activity.

---

## 14. Scope

This is a focused research/capstone project.

Do NOT unnecessarily implement enterprise-level features such as:

- Authentication
- User management
- Student management
- Teacher management
- Teams
- Complex authorization
- User sessions
- Large-scale production infrastructure

Unless explicitly added to the requirements later.

Prefer the simplest implementation that allows the team to demonstrate and evaluate the research objective.

---

## 15. Development Principles

When implementing features:

1. Understand the requirement first.
2. Read the relevant documentation.
3. Read the relevant task file.
4. Identify the expected behavior.
5. Write or update tests where practical.
6. Implement the smallest reasonable solution.
7. Run the tests.
8. Refactor when appropriate.
9. Verify the acceptance criteria.
10. Update project progress.
11. Check `README.md` and update it if the task introduced meaningful project-level information.
12. Update detailed documentation when a project decision changes.

Avoid implementing future requirements prematurely.

---

## 16. Task-Based Development

Development work should be organized into small tasks under:

`tasks/`

Tasks will be created progressively as the project evolves.

Do not create a large number of speculative tasks in advance.

Each task should normally contain:

- Objective
- Context
- Requirements
- Acceptance Criteria
- Constraints
- Testing expectations

A task should represent one meaningful scope of work.

```text
Task
 ↓
Understand
 ↓
Test
 ↓
Implement
 ↓
Verify
 ↓
Complete
 ↓
Update Progress
 ↓
Write Agent Feedback Report
 ↓
Review README and docs
```

---

## 17. Project Progress Tracking

Current project progress is maintained in:

`docs/progress.md`

This file should provide a high-level view of:

- Completed work
- Current work
- Upcoming work
- Important decisions
- Blockers
- Research iterations

Individual task details remain in `tasks/`.

The progress document should answer:

> "Where are we now?"

The task files should answer:

> "What exactly are we doing?"

Do not duplicate detailed task content inside `docs/progress.md`.

Update `docs/progress.md` when a meaningful task is started or completed.

---

## 18. Agent Feedback Reports

After completing each task, write a Markdown file into:

`agent-feedbacks/`

The file should be named after the task (e.g. `TASK-004-configure-prisma-postgresql.md`), so the developer can read it manually before deciding whether to proceed to the next task.

The report should cover:

- What was actually done (task output/result summary).
- Any action the developer needs to take before the next task proceeds (approvals, credentials, manual verification, environment setup, etc.).
- Any risky or judgment-call decisions made during the task, and why.
- Any deviations from the task's original instructions, and why.
- Suggestions or concerns for the developer to consider going forward.

This is separate from `docs/progress.md`:

- `docs/progress.md` stays a short, high-level, continuously-updated project state.
- `agent-feedbacks/<task-name>.md` is a one-time, detailed, per-task record — written once when the task completes and not edited afterward, except to append a follow-up if the developer asks a question about it.

Do not skip this step for meaningful tasks. It may be brief for small or low-risk tasks, but it should still exist.

---

## 19. Testing

Tests are organized under:

`tests/`

with separate areas for:

- Acceptance tests
- Integration tests
- Unit tests

Testing should focus on behavior that matters to the research project.

Important areas include:

- User selection logic
- Database-driven context selection
- Prompt construction
- Difficulty-specific prompt selection
- Reference question selection
- AI response handling
- Evaluation behavior

Prompt construction should be testable independently from the actual AI provider.

Where possible, deterministic tests should not depend on a live AI API call.

---

## 20. Change Management

When a change affects:

- Product behavior
- Database structure
- AI generation strategy
- Difficulty definitions
- Evaluation methodology
- User flow
- Architecture

update the relevant documentation.

Also check whether the change affects the high-level `README.md`. If it does, update it.

Do not silently change an established project decision.

If an existing decision appears problematic, explain the issue and propose an alternative before making a significant change.

---

## 21. Current Development Strategy

The project will be developed incrementally.

Initial stages:

1. Establish the Next.js project.
2. Analyze the existing Figma/React reference project.
3. Recreate the required UI pages and routes.
4. Verify the UI flow.
5. Connect the application to PostgreSQL through Prisma.
6. Load educational data dynamically.
7. Implement prompt construction.
8. Implement the question-generation flow.
9. Integrate the selected AI API.
10. Implement the Evaluation page once its requirements are sufficiently defined.
11. Begin research iterations.
12. Improve context and prompts based on evaluation results.

Later stages should only be implemented when the requirements are defined.

---

## 22. Initial Tasks

The initial tasks are intentionally limited.

### Task 001 — Project Initialization

Establish the Next.js + TypeScript project and basic development environment.

TDD does not need to be forced during the initial scaffolding phase.

### Task 002 — Analyze and Recreate UI

Inspect the read-only Figma/React reference project and implement the required pages and routes in the Next.js application.

### Task 003 — Database Integration

Configure Prisma and connect the Next.js application to the existing PostgreSQL database.

Verify that the application can load the existing educational data.

Additional tasks will be created as the project progresses.

---

## 23. Important Rule

When working on MathQuestAI, optimize for:

**Research Value → Correctness → Clarity → Simplicity**

rather than:

**Complexity → Abstraction → Production-scale infrastructure**

The goal is to build a working, understandable research prototype that allows the team to investigate how context and prompts influence AI-generated mathematics questions.

When in doubt:

**Ask before assuming.**

---

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
