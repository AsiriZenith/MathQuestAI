# TASK-001 — Initialize Next.js Project

## Status

Backlog

---

## Objective

Establish the basic **MathQuestAI** Next.js application foundation in:

```text
D:\my works\MathQuestAI
```

The project should have a clean, working Next.js foundation before we begin implementing the Figma-based UI, database integration, and AI-generation functionality.

---

## Context

MathQuestAI is a research project focused on generating mathematics questions using structured educational context and AI.

The target technology stack is:

- Next.js
- TypeScript
- React
- Next.js App Router
- PostgreSQL
- Prisma

The PostgreSQL database already exists and has been created manually according to the project database design.

The Figma-generated React project is maintained separately at:

```text
D:\my works\MathQuestAI_UI
```

This project is a **reference project for UI implementation**.

It must not be modified by this task or by later UI implementation tasks.

The target application is:

```text
D:\my works\MathQuestAI
```

---

## Important Project Context

Before making changes, Claude Code must read:

```text
CLAUDE.md

docs/project.md
docs/product.md
docs/requirements.md
docs/architecture.md
docs/database.md
docs/ai-generation.md
```

The documentation is the source of project-level decisions.

Do not introduce architectural decisions that conflict with those documents without first identifying the conflict.

---

## First Action: Inspect Existing Directory

Before initializing anything, inspect:

```text
D:\my works\MathQuestAI
```

Do not assume that the directory is empty.

Determine:

- Whether a Next.js project already exists
- Whether `package.json` already exists
- Whether source files already exist
- Whether configuration files already exist
- Whether the existing files should be preserved
- Whether initialization is actually required

If a valid Next.js project already exists, do not recreate it unnecessarily.

Do not delete or overwrite existing project files without a clear reason.

---

## Requirements

If project initialization is required, establish:

- Next.js
- React
- TypeScript
- Next.js App Router
- ESLint
- Standard Next.js development configuration

The project should be runnable using the normal Next.js development workflow.

The exact dependency versions should use currently compatible versions rather than unnecessarily pinning outdated versions.

---

## Project Name

The application is:

```text
MathQuestAI
```

The project directory is:

```text
D:\my works\MathQuestAI
```

Use the existing directory rather than creating another project directory elsewhere.

---

## App Router

Use the Next.js **App Router**.

The application should have the normal App Router foundation, including an appropriate:

```text
app/
```

structure.

Do not introduce Pages Router architecture.

---

## TypeScript

The project must use TypeScript.

Do not convert the project to JavaScript.

---

## Initial Project Structure

At the end of this task, the project should have a clean foundation similar to:

```text
ai-bootcamp/
│
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── ...
│
├── docs/
│
├── tasks/
│
├── tests/
│
├── public/
│
├── package.json
├── tsconfig.json
├── eslint.config.*
├── next.config.*
└── ...
```

The exact files may vary according to the selected compatible Next.js version.

Do not create unnecessary architectural folders yet.

---

## Existing Documentation

Do not remove or overwrite the existing project documentation:

```text
docs/
CLAUDE.md
```

The documentation created during project planning is part of the project context.

---

## TDD

This task does not require traditional TDD.

Reason:

There is no meaningful application behavior being implemented yet.

This task is primarily project initialization and configuration.

Testing will become mandatory for meaningful application behavior in subsequent tasks.

---

## Validation

After initialization, verify the project.

At minimum:

### 1. Install dependencies

The dependency installation must complete successfully.

### 2. Start development server

Run the Next.js development server.

The application must start without configuration errors.

### 3. Open application

Verify that the default application page can be loaded successfully.

### 4. Lint

Run the project's lint command.

It should complete without blocking errors.

### 5. TypeScript

Run an appropriate TypeScript validation/build check if available.

The project should not contain TypeScript compilation errors.

---

## Acceptance Criteria

This task is complete when:

- [ ] The existing `ai-bootcamp` directory has been inspected before modification.
- [ ] A valid Next.js application exists in `D:\my works\MathQuestAI`.
- [ ] The application uses TypeScript.
- [ ] The application uses the Next.js App Router.
- [ ] React and Next.js dependencies are correctly configured.
- [ ] ESLint is configured and runs successfully.
- [ ] The development server starts successfully.
- [ ] The application can be opened locally.
- [ ] TypeScript validation succeeds.
- [ ] Existing project documentation is preserved.
- [ ] The separate Figma reference project remains untouched.
- [ ] No database or AI integration has been implemented as part of this task.
- [ ] No unnecessary architecture has been introduced.

---

## Out of Scope

Do **not** implement the following in TASK-001:

### UI

Do not reproduce the Figma design.

Do not copy components from:

```text
D:\my works\MathQuestAI_UI
```

UI implementation belongs to TASK-002.

### Database

Do not configure Prisma.

Do not connect PostgreSQL.

Do not create database models.

Do not modify the existing PostgreSQL database.

Database work belongs to later tasks.

### AI

Do not integrate an AI provider.

Do not implement prompt generation.

Do not implement question generation.

Do not implement evaluation.

### Authentication

Do not implement authentication or authorization.

### Business Logic

Do not implement Subject, Topic, Subtopic, Question Pattern, Difficulty, or Question Generation functionality.

---

## Figma Reference Project Constraint

The project at:

```text
D:\my works\MathQuestAI_UI
```

is the UI reference project.

It is separate from the target Next.js project.

For TASK-001:

> Do not modify the reference project under any circumstances.

Later tasks may inspect its source code and assets to reproduce the required UI in the Next.js project.

---

## Implementation Guidance

Prefer the simplest valid Next.js setup.

Do not add libraries merely because they might be useful later.

Do not implement future architecture prematurely.

The purpose of this task is to establish a stable foundation for the following tasks.

If a dependency or configuration is not required for the current task, do not introduce it just because the project may need it later.

---

## Expected Result

After completing TASK-001:

```text
D:\my works\MathQuestAI
```

should contain a working Next.js application.

Conceptually:

```text
Browser
   ↓
Next.js
   ↓
Default App Router Page
```

No database or AI functionality should exist yet.

---

## Notes for Claude Code

Before changing files:

1. Inspect the existing project.
2. Read the project documentation.
3. Determine whether initialization is actually necessary.
4. Preserve existing useful files.
5. Avoid destructive operations.
6. Keep the implementation within this task's scope.

If the project is already correctly initialized, validate the existing setup and make only the changes necessary to satisfy the acceptance criteria.

---

## Completion

When the task is complete:

1. Run the required validation.
2. Report what was changed.
3. Report the validation results.
4. Mention any assumptions or issues discovered.
5. Identify any documentation that needs updating.
6. Do not start TASK-002 automatically.

The next task should be started only after review/approval.
