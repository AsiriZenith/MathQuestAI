# TASK-003 — Configure Prisma and PostgreSQL

## Status

Backlog

---

## Objective

Connect the MathQuestAI Next.js application to the **existing PostgreSQL database** using Prisma and verify that the application can safely read the existing educational data.

Target application:

```text
D:\my works\MathQuestAI
```

Existing PostgreSQL database:

```text
Already created manually before application development.
```

The database schema is documented in:

```text
docs/project-management/database.md
```

---

## Context

The PostgreSQL database was designed and created manually before the Next.js application.

The application must integrate with this existing database.

The objective of this task is **database connectivity and Prisma setup**, not database redesign.

The expected initial flow is:

```text
Existing PostgreSQL Database
          ↓
       Prisma
          ↓
     Prisma Client
          ↓
Next.js server-side code
          ↓
      Simple read
```

---

## Important Constraint

### Do NOT recreate the database

The existing PostgreSQL database is the source of truth for the current schema.

Do not:

- Drop the database
- Drop existing tables
- Recreate existing tables
- Rename existing tables
- Change columns
- Change relationships
- Change constraints
- Change existing seed data
- Run destructive migrations

unless the user explicitly requests a database schema change in a separate task.

---

# 1. Required Project Context

Before implementation, read:

```text
CLAUDE.md

docs/project-management/project.md
docs/project-management/product.md
docs/project-management/requirements.md
docs/project-management/architecture.md
docs/project-management/database.md
docs/project-management/ai-generation.md

docs/tasks/README.md
docs/tasks/backlog/TASK-003-configure-prisma-postgresql.md
```

The database documentation must be compared against the actual PostgreSQL database before making assumptions.

---

# 2. Inspect Existing Project

Before changing the project:

Inspect:

```text
D:\my works\MathQuestAI
```

Determine:

- Whether Prisma is already installed
- Whether a Prisma configuration already exists
- Whether `.env` or another environment configuration already exists
- Whether database-related code already exists
- Whether previous tasks introduced a database abstraction
- Whether the project has a testing setup

Do not overwrite an existing valid configuration unnecessarily.

---

# 3. Inspect Existing Database

The database already exists.

Before defining Prisma models, inspect the actual PostgreSQL schema.

Confirm the relevant tables and relationships documented in:

```text
docs/project-management/database.md
```

The initial educational data model includes the concepts established during the database design:

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

Use the actual table names, columns, primary keys, foreign keys, and data types from the existing database.

Do not invent fields based only on conceptual names.

If the actual database differs from `docs/project-management/database.md`, stop and report the difference rather than silently modifying the database.

---

# 4. Prisma Setup

If Prisma is not already configured, add the appropriate Prisma dependencies.

Configure Prisma for PostgreSQL.

The application should use Prisma Client for server-side database access.

The database connection string must be stored in environment configuration.

Do not hard-code:

- Database host
- Username
- Password
- Database name
- Connection string

inside TypeScript source files.

---

# 5. Environment Configuration

Use an environment variable for the PostgreSQL connection string.

For example:

```text
DATABASE_URL
```

The exact environment-file approach should follow normal Next.js practices.

Do not commit real credentials to source control.

If an environment example file is created, it must contain placeholders only.

Example:

```text
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
```

Do not place the user's actual password in:

```text
.env.example
```

or any committed file.

---

# 6. Existing Schema → Prisma

Prisma's representation must reflect the existing database.

Where appropriate, use Prisma introspection to understand the existing schema rather than manually recreating models from memory.

Conceptually:

```text
PostgreSQL
    ↓
Existing schema
    ↓
Prisma schema
    ↓
Prisma Client
```

The Prisma schema must not be treated as permission to change the PostgreSQL schema.

---

# 7. Migration Policy

Do **not** introduce Prisma migrations as part of this task unless they are genuinely required for a non-destructive configuration reason.

The database already exists.

The initial goal is:

```text
Connect
   ↓
Understand existing schema
   ↓
Generate Prisma Client
   ↓
Query existing data
```

Database schema evolution can be addressed later if required.

Do not run commands that may modify or reset the existing database.

In particular, do not use destructive database-reset workflows.

---

# 8. Prisma Client

Create a clean server-side Prisma Client setup appropriate for a Next.js development environment.

Avoid creating a new Prisma Client instance on every hot reload if that would cause unnecessary connection/client issues.

The exact implementation should follow the project's architecture documented in:

```text
docs/project-management/architecture.md
```

Do not introduce a large repository abstraction solely for this task.

Keep the database boundary simple.

---

# 9. Database Access Boundary

Database access must remain server-side.

The browser must not connect directly to PostgreSQL.

Expected architecture:

```text
Browser
   ↓
Next.js Server
   ↓
Prisma Client
   ↓
PostgreSQL
```

Not:

```text
Browser
   ↓
PostgreSQL
```

---

# 10. Verification Query

Implement a minimal server-side database read to prove that the connection works.

The query should use an existing table containing known data.

A suitable first verification is to retrieve existing Subject data if the actual schema supports it.

Conceptually:

```text
Prisma Client
      ↓
SELECT existing Subjects
      ↓
Return data
```

The purpose is only to verify:

- Database connectivity
- Prisma Client generation
- Correct table mapping
- Correct column mapping
- Server-side execution

Do not build the complete dynamic educational-data workflow yet.

That belongs to a later task.

---

# 11. UI Integration

Only minimal UI integration is required for verification.

If TASK-002 has already created the application UI, do not redesign it.

A temporary development/test page or server-side verification path may be used if appropriate.

Do not turn this task into the implementation of the complete generation workflow.

---

# 12. TDD / Testing

This task contains meaningful database behavior.

Tests should cover the database access boundary where practical.

The preferred approach is to avoid making every unit test dependent on the real PostgreSQL database.

Separate:

```text
Application logic
```

from:

```text
Real database integration
```

Where appropriate:

### Unit tests

Test deterministic database-related application logic with mocks/fakes.

### Integration test

Use the real PostgreSQL database for a small number of integration checks if the project environment supports it.

At minimum, verify that the actual application can successfully perform the chosen database read.

---

# 13. Verification Requirements

Verify all of the following:

### Prisma

- Prisma dependencies are installed.
- Prisma configuration is valid.
- Prisma Client can be generated successfully.

### PostgreSQL

- The application can connect to the existing database.
- Authentication works through environment configuration.
- The expected schema can be accessed.
- Existing data can be queried.

### Next.js

- Database access occurs server-side.
- The application starts successfully.
- The application can execute the verification query.

### Code Quality

Run:

```text
npm run lint
```

and an appropriate build/type validation:

```text
npm run build
```

Resolve errors caused by this task.

---

# 14. Acceptance Criteria

This task is complete when:

- [ ] The existing PostgreSQL database has been inspected.
- [ ] The actual schema has been compared with `docs/project-management/database.md`.
- [ ] Prisma is correctly configured for PostgreSQL.
- [ ] Prisma Client is generated successfully.
- [ ] The database connection uses environment configuration.
- [ ] No database credentials are hard-coded.
- [ ] The existing PostgreSQL schema remains unchanged.
- [ ] Existing data remains unchanged.
- [ ] A server-side Prisma query successfully retrieves known existing data.
- [ ] The Next.js application can execute the database query.
- [ ] Relevant database access tests have been added where practical.
- [ ] `npm run lint` succeeds.
- [ ] Production/build validation succeeds.
- [ ] No AI integration has been implemented.
- [ ] No prompt-generation logic has been implemented.
- [ ] No complete dynamic educational-data workflow has been implemented.
- [ ] No unrelated architecture has been introduced.

---

# 15. Out of Scope

Do NOT implement:

```text
❌ Database redesign
❌ New database tables
❌ Database seeding
❌ Database migrations
❌ Destructive schema changes
❌ Authentication
❌ AI provider integration
❌ Prompt Builder
❌ Question Generation
❌ Evaluation
❌ Complete Subject → Topic → Subtopic workflow
❌ Complete Question Pattern selection workflow
```

These belong to later tasks.

---

# 16. Security Requirements

Never expose database credentials to the browser.

Do not:

- Put credentials in React components
- Return the database connection string through an API
- Log database passwords
- Commit `.env` containing real secrets
- Hard-code credentials in source code

Use environment variables.

---

# 17. Error Handling

Database errors should not expose sensitive connection information to end users.

During development, useful server-side diagnostic information may be logged carefully.

The UI should receive a safe error representation.

For example:

```text
Unable to load educational data.
```

rather than:

```text
password authentication failed for user '...'
host=...
password=...
```

---

# 18. No Premature Repository Architecture

Do not introduce unnecessary abstractions such as:

```text
GenericRepository
GenericUnitOfWork
CQRS
MediatR
Repository-per-table
```

unless the existing project architecture specifically requires them.

For this research project, a simple and understandable database access layer is preferred.

---

# 19. Documentation Synchronization

If the actual database differs from:

```text
docs/project-management/database.md
```

do not silently modify the database to match the documentation.

Instead:

1. Report the difference.
2. Determine whether the database or documentation is the intended source of truth.
3. Update the appropriate documentation only after the decision is clear.

Important database decisions discovered during implementation should be recorded in:

```text
docs/project-management/database.md
```

or another appropriate documentation file.

---

# 20. Expected Result

After completing this task:

```text
Next.js
   ↓
Prisma Client
   ↓
Existing PostgreSQL
```

must work successfully.

A simple example:

```text
GET /development/database-test
        ↓
Next.js server
        ↓
Prisma
        ↓
PostgreSQL
        ↓
Existing Subject records
```

The exact verification mechanism can be implemented in the simplest appropriate way.

The application is **not yet** expected to dynamically populate the complete question-generation workflow.

---

# 21. Completion Report

When the task is complete, report:

### Database inspection

- Tables inspected
- Important relationships confirmed
- Any discrepancy with `docs/project-management/database.md`

### Prisma

- Prisma version/configuration
- Models represented
- Client generation result

### Connection

- Environment variable configuration
- Verification query
- Result

### Tests

- Tests added
- Test results

### Validation

```text
Lint:
Build:
Database connection:
Verification query:
```

### Schema Changes

Explicitly state:

```text
Database schema changed: YES / NO
```

For this task, the expected answer is:

```text
NO
```

### Documentation Changes

List any documentation updated.

Do not automatically begin TASK-004 after completing this task.

Wait for review/approval.
