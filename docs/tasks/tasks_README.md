# MathQuestAI — Task Management

## 1. Purpose

This directory contains the implementation tasks for MathQuestAI.

Tasks are intentionally kept separate from the stable project documentation in `docs/`.

The purpose of this structure is to give Claude Code clear, bounded work items while preserving the project's current state and decisions.

---

## 2. Task Lifecycle

Tasks follow this lifecycle:

```text
Backlog
   ↓
Active
   ↓
Completed
```

### Backlog

Tasks that are defined but not currently being implemented.

### Active

The task currently being worked on.

Only move a task to `active` when implementation begins.

### Completed

Tasks that have been implemented, tested, reviewed, and accepted.

---

## 3. Directory Structure

```text
docs/tasks/
├── README.md
├── backlog/
├── active/
└── completed/
```

Task files should be Markdown files.

Example:

```text
docs/tasks/
├── backlog/
│   ├── TASK-001-initialize-nextjs.md
│   └── TASK-002-recreate-figma-ui.md
│
├── active/
│   └── ...
│
└── completed/
    └── ...
```

---

## 4. Task IDs

Every task receives a unique ID.

Format:

```text
TASK-001
TASK-002
TASK-003
```

The ID should not change after the task is created.

---

## 5. Task Structure

Each task should contain the following sections where applicable:

```markdown
# TASK-XXX — Task Name

## Status

Backlog

## Objective

What should be achieved?

## Context

Why is this task required?

## Requirements

What must be implemented?

## Scope

What is included?

## Out of Scope

What must not be implemented?

## TDD / Tests

What behavior should be tested?

## Acceptance Criteria

How do we know the task is complete?

## Implementation Notes

Important technical guidance.

## Validation

How the result should be manually or automatically verified.

## Decisions / Notes

Important decisions discovered while implementing the task.
```

Not every section needs to contain information if it is not relevant.

Do not add artificial requirements just to fill the template.

---

## 6. Task Scope

A task should represent one meaningful piece of work.

Avoid creating tasks that are:

- Too large to understand
- Too vague to verify
- Dependent on many unrelated changes
- Full of future assumptions

Prefer:

```text
Implement dynamic Subject → Topic loading
```

over:

```text
Implement the entire application
```

---

## 7. TDD Requirement

MathQuestAI follows TDD for meaningful application behavior.

The expected development cycle is:

```text
Requirement
    ↓
Write Test
    ↓
Implement
    ↓
Run Test
    ↓
Refactor
    ↓
Validate
```

However, TDD should not be forced into project-initialization activities where there is no meaningful application behavior to test.

For example, these may not require dedicated tests:

- Creating the Next.js project
- Installing dependencies
- Creating initial configuration
- Creating documentation folders

Once application behavior is implemented, tests should normally be created before or alongside the implementation.

---

## 8. Test Expectations

Every task that introduces meaningful behavior should identify how that behavior will be tested.

Examples:

### Prompt construction

Test:

```text
Given a selected difficulty,
the generated prompt contains the appropriate difficulty instructions.
```

### Database loading

Test:

```text
Given a valid Subject,
the application returns Topics belonging to that Subject.
```

### UI behavior

Test:

```text
When the Subject changes,
dependent selections are reset or updated correctly.
```

### AI integration

Use a mock/fake provider for deterministic automated tests.

Do not make normal unit tests depend on unpredictable live LLM responses.

---

## 9. Acceptance Criteria

Acceptance criteria should be observable.

Good:

```text
- The Next.js application starts successfully.
- The existing Figma UI is reproduced.
- The expected route is accessible.
- Existing PostgreSQL data can be queried.
```

Avoid vague criteria such as:

```text
- Code should be good.
- Application should work properly.
```

---

## 10. Definition of Done

A task can be moved to `completed` when:

- The implementation satisfies the task requirements.
- Relevant tests have been added or updated.
- Tests pass.
- The feature has been manually validated when appropriate.
- No unrelated scope has been introduced.
- Important decisions have been documented.
- The task status is updated to `Completed`.

For UI tasks, visual/manual validation is expected in addition to automated tests where appropriate.

For AI-generation tasks, evaluation should include the actual generated result rather than relying only on code-level tests.

---

## 11. Moving Tasks

When starting a task:

```text
docs/tasks/backlog/
      ↓
docs/tasks/active/
```

When completing a task:

```text
docs/tasks/active/
      ↓
docs/tasks/completed/
```

The task file should move with the task.

Do not create duplicate copies unless there is a clear reason.

---

## 12. Current Initial Backlog

The first implementation tasks are expected to cover:

```text
TASK-001 — Initialize Next.js Project

TASK-002 — Recreate Figma UI and Routes

TASK-003 — Configure Prisma and PostgreSQL

TASK-004 — Connect Existing Database

TASK-005 — Implement Dynamic Educational Data Loading
```

These are initial planning items.

Their detailed requirements should be created one at a time.

Do not implement all of them as one large task.

---

## 13. Task Execution Principle

Claude Code should work on one active task at a time unless the user explicitly requests otherwise.

Before starting a task:

1. Read `CLAUDE.md`.
2. Read the relevant files under `docs/`.
3. Read the task completely.
4. Inspect the existing project before making changes.
5. Identify assumptions.
6. Ask for clarification if a requirement is genuinely ambiguous.

Do not guess when an assumption could materially change the implementation.

---

## 14. Existing Project Reference

The Figma-generated React project is located separately from the target project.

Reference project:

```text
D:\my works\MathQuestAI_UI
```

Target Next.js project:

```text
D:\my worksi-bootcamp
```

The reference project should be inspected when implementing UI-related tasks.

It must not be modified.

---

## 15. Research Loop

Some tasks will be research-oriented rather than ordinary feature development.

For AI-generation work, the task lifecycle may include:

```text
Implement
   ↓
Generate
   ↓
Evaluate
   ↓
Identify Problem
   ↓
Modify Context / Prompt
   ↓
Generate Again
   ↓
Evaluate
```

These iterations should be recorded in the relevant task or research documentation when they produce meaningful findings.

---

## 16. Updating Documentation

If implementation reveals that an architectural or product decision has changed, do not silently leave the documentation outdated.

Update the relevant document under:

```text
docs/
```

Examples:

```text
Architecture decision changes
    → docs/project-management/architecture.md

Database changes
    → docs/project-management/database.md

AI-generation strategy changes
    → docs/project-management/ai-generation.md

Product behavior changes
    → docs/project-management/product.md
```

The task should mention the documentation update.

---

## 17. Avoid Premature Tasks

Do not create detailed tasks for features that are not yet required.

For example, the current project does not need implementation tasks for:

- Authentication
- Students
- Teachers
- Teams
- User sessions
- Persistent generated-question history
- Evaluation-result persistence

unless the project scope changes.

---

## 18. Task Writing Principle

A task should tell Claude Code:

```text
WHAT to build
WHY it is needed
WHAT constraints apply
HOW it will be validated
```

It should not prescribe unnecessary implementation details when multiple valid solutions exist.

The task should leave room for Claude Code to inspect the existing project and choose the simplest appropriate implementation.

---

## 19. Task Management Summary

The task system exists to make project progress visible.

At any point, the repository should make it possible to understand:

```text
What is planned?
      ↓
What is currently being implemented?
      ↓
What has already been completed?
      ↓
What decisions were made?
      ↓
What should happen next?
```

The task files are therefore part of the project's context engineering strategy, not merely a checklist.
