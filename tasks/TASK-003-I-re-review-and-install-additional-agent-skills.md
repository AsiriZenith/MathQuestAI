# TASK-003-I — Re-Review Project & Research Additional Agent Skills

## Status

Planned — **Do not execute TASK-003-II as part of this task**

## Purpose

This task is a second, deliberate review of the MathQuestAI project before continuing with database implementation.

The previous Agent Skills task primarily evaluated and installed Prisma-related skills. It concluded that no additional Next.js/React/TypeScript/testing skills were required at that time.

That decision should **not be treated as final**.

The project has now progressed through:

```text
TASK-000
    ↓
TASK-001
    ↓
TASK-002
    ↓
TASK-003-I
```

We now want Claude Code to inspect the **actual current repository again**, reassess the development workflow and installed skills, and determine whether additional high-quality Agent Skills would materially improve Claude Code's work on MathQuestAI.

At the same time, the review should identify whether TASK-000, TASK-001, or TASK-002 introduced structural or implementation problems that need to be corrected before continuing.

---

# 1. Important Execution Boundary

This task has two responsibilities:

### Part A — Re-review and Agent Skills research

Claude Code must:

- inspect the current project
- review TASK-000
- review TASK-001
- review TASK-002
- review current implementation
- review current tests
- review installed skills
- research additional relevant Agent Skills
- install only skills that are genuinely justified

### Part B — Prepare the next corrective task

If the review discovers real problems in the existing project structure or implementation, Claude Code must create:

```text
tasks/TASK-003-II-review-and-restructure-existing-implementation.md
```

That file will contain the detailed corrective plan.

**Do not execute TASK-003-II during TASK-003-I.**

The intended workflow is:

```text
TASK-003-I
    ↓
Skill research + project review
    ↓
TASK-003-II created if corrective work is required
    ↓
User reviews TASK-003-I results
    ↓
User reviews/approves TASK-003-II
    ↓
TASK-003-II executed separately
```

---

# 2. Current Project Context

Project:

```text
MathQuestAI
```

Target repository:

```text
D:\my worksi-bootcamp
```

Figma/reference project:

```text
D:\my works\MathQuestAI
```

The reference project must remain read-only.

The application is intended to use:

- Next.js
- React
- TypeScript
- PostgreSQL
- Prisma ORM
- Claude Code
- Git/GitHub

The project is also being used to research:

- context engineering
- prompt engineering
- AI-assisted software development
- TDD
- AI mathematics question generation

---

# 3. Existing Agent Skills Context

A previous Agent Skills task installed these Prisma skills:

```text
.claude/skills/
├── prisma-cli/
├── prisma-client-api/
└── prisma-database-setup/
```

The previous report states that these were selected because MathQuestAI uses an existing PostgreSQL database and will use Prisma ORM.

The previous report also investigated, but did not keep:

- Prisma Postgres skills
- Prisma Compute
- MongoDB skills
- Prisma upgrade skills
- generic AI/prompt skills
- community Vitest/TDD skills
- Vercel performance skills
- Anthropic E2E/webapp-testing skills

The previous report concluded that Next.js/React/TypeScript did not currently require additional skills.

**This task intentionally reopens that decision.**

Do not assume the previous conclusion was wrong.

Do not assume it was correct.

Re-evaluate it based on the current repository and current available skills.

---

# 4. Phase 1 — Inspect the Current Repository

Before installing anything, perform a read-only inspection.

Read:

```text
CLAUDE.md
README.md
```

Review:

```text
docs/
```

including, where present:

```text
docs/project.md
docs/product.md
docs/requirements.md
docs/architecture.md
docs/database.md
docs/ai-generation.md
docs/ui.md
docs/progress.md
```

Review:

```text
tasks/
```

especially:

```text
TASK-000
TASK-001
TASK-002
```

Also inspect:

```text
tests/
```

and the actual application source.

Inspect:

```text
package.json
package-lock.json
next.config.*
tsconfig.json
eslint configuration
vitest configuration
.gitignore
skills-lock.json
.claude/
```

Determine the actual current:

- Next.js version
- React version
- TypeScript version
- testing framework
- styling approach
- package manager
- Prisma version, if installed
- database-related dependencies
- Claude Code skill configuration

Do not modify source code during the initial inspection.

---

# 5. Phase 2 — Review What Has Actually Been Built

Do not review only the task descriptions.

Compare:

```text
Requirement
    ↓
Task specification
    ↓
Actual implementation
    ↓
Tests
    ↓
Documentation
```

The actual repository is the source of truth for implementation.

Identify discrepancies such as:

```text
Task says X
Implementation does Y
Tests expect Z
Documentation says W
```

These discrepancies must be reported clearly.

---

# 6. Review TASK-000

Review Git/GitHub initialization.

Check:

- Git repository setup
- remote configuration
- branch structure
- `.gitignore`
- tracked files
- secrets
- environment files
- build output
- `node_modules`
- repository metadata
- initial commit

Check that files such as:

```text
.env
.env.local
```

are not accidentally committed.

Do not expose credentials.

If there is a problem, record it for TASK-003-II rather than fixing it as part of the skills research.

---

# 7. Review TASK-001

Review the actual Next.js initialization.

Check:

### Next.js

- Next.js version
- App Router
- routing conventions
- Server/Client Component usage
- project configuration
- unnecessary configuration
- unnecessary dependencies

### TypeScript

Check:

- strict mode
- path aliases
- compiler configuration
- unsafe settings
- unnecessary overrides

### Configuration

Review:

```text
next.config.*
tsconfig.json
package.json
eslint configuration
```

Do not upgrade dependencies just because newer versions exist.

Only recommend an upgrade when there is a concrete compatibility, security, correctness, or maintenance reason.

---

# 8. Review TASK-002

Review the Figma recreation implementation.

Check:

### Routes

- required pages
- route names
- App Router structure
- navigation

### Components

Check:

- component boundaries
- duplicated components
- oversized components
- unnecessary abstractions
- difficult-to-test components
- UI/business logic mixing

### Client Components

Inspect every:

```text
"use client"
```

and determine whether it is actually necessary.

### Mock Data

Check:

- where mock data lives
- duplication
- coupling to UI
- suitability for later database integration

### Styling

Check:

- styling consistency
- unnecessary dependencies
- duplication
- maintainability

The objective is not pixel-perfect perfection.

The objective is a clean foundation for the next development stage.

---

# 9. Review Testing and TDD

MathQuestAI follows:

```text
RED
 ↓
GREEN
 ↓
REFACTOR
```

Review whether TASK-002 actually followed this approach.

Be honest.

If tests were created after implementation, do not describe that as strict TDD.

Assess:

- test quality
- behavior vs implementation testing
- test organization
- naming
- duplication
- missing tests
- fragile tests
- unnecessary tests

The current strategy is:

```text
Unit tests       → primary
Integration      → selective, when valuable
E2E              → not currently planned
```

Do not install E2E skills unless you discover a strong project requirement that justifies changing this decision.

---

# 10. Review Next.js / React / TypeScript Skills Again

This is one of the main purposes of TASK-003-I.

Research the current Agent Skills ecosystem for:

### Next.js

Look for skills that genuinely improve Claude Code's ability to:

- build modern Next.js App Router applications
- follow current Next.js conventions
- understand Server vs Client Components
- use Next.js data-fetching patterns
- avoid common Next.js mistakes

### React

Look for skills that genuinely improve:

- component design
- state management
- React patterns
- testing
- maintainability

### TypeScript

Look for skills that improve:

- type safety
- modern TypeScript practices
- maintainable typing
- avoiding unsafe patterns

### Testing

Investigate skills for:

- Vitest
- React Testing Library
- TDD
- test design

Do not install community skills merely because they contain many rules.

---

# 11. Review Database Skills

The three existing Prisma skills should remain unless a concrete problem is discovered:

```text
prisma-cli
prisma-client-api
prisma-database-setup
```

Check whether additional database-related skills are actually needed for:

- PostgreSQL
- SQL
- Prisma + PostgreSQL
- migrations
- database schema design

Be careful with the distinction between:

```text
PostgreSQL
```

and:

```text
Prisma Postgres
```

MathQuestAI uses an existing PostgreSQL database.

Do not install skills intended specifically for Prisma's hosted Prisma Postgres product unless the project requirements change.

---

# 12. Review AI Application Skills

MathQuestAI will eventually call an AI API to generate mathematics questions.

However:

- the final AI provider is not yet finalized
- prompt/context engineering is one of the project's research subjects
- evaluation is not yet finalized

Therefore, research relevant skills, but do not install generic AI skills merely because they mention:

```text
AI
LLM
prompt engineering
RAG
agents
```

A skill must have a concrete current benefit.

If the project documentation already provides better project-specific guidance than a generic skill, prefer the project documentation.

---

# 13. Review Claude Code / Engineering Workflow Skills

Check whether Claude Code already provides useful built-in capabilities for:

- code review
- debugging
- verification
- testing
- Git
- documentation

Do not install a third-party skill that simply duplicates built-in Claude Code functionality.

---

# 14. Skill Evaluation Criteria

For every candidate skill, evaluate:

| Criteria | Question |
|---|---|
| Relevance | Does MathQuestAI actually need it now? |
| Source | Who maintains it? |
| Trust | Is the source reputable? |
| Maintenance | Is it actively maintained? |
| Scope | Does it solve a real project problem? |
| Duplication | Does Claude Code already provide this? |
| Conflict | Could it conflict with project documentation? |
| Security | Does installing it introduce unnecessary risk? |
| Complexity | Does it add unnecessary rules or concepts? |
| Long-term value | Will it help future MathQuestAI development? |

Classify each candidate:

```text
MUST HAVE
USEFUL
OPTIONAL
NOT NEEDED
```

---

# 15. Installation Rules

Only install skills that are clearly justified.

Prefer:

```text
Official / vendor-maintained
```

over:

```text
Unknown / unverified community
```

Do not install a skill because:

- it is popular
- it has many rules
- it sounds impressive
- it covers a technology name
- another developer uses it

The goal is:

> **Minimum useful skill set, maximum practical benefit.**

If a skill can execute commands, inspect files, or otherwise influence Claude Code behavior, treat the source as a trust boundary and evaluate it carefully.

---

# 16. Required Skill Research Report

Before making installation changes, create a report containing:

## A. Current Installed Skills

Show:

```text
Skill
Source
Purpose
Current value
Keep/remove
```

## B. Newly Investigated Skills

For each:

```text
Skill
Category
Source
What it provides
Why MathQuestAI might need it
Risks
Recommendation
```

## C. Final Skill Set

Show:

```text
Existing skills kept
+
New skills installed
```

## D. Rejected Skills

Explain important rejected candidates.

---

# 17. Installation and Verification

After selecting approved skills:

1. Install only the selected skills.
2. Verify their files.
3. Verify `skills-lock.json`.
4. Confirm no unrelated dependencies were added.
5. Confirm no application source code was changed because of the skill installation.
6. Confirm no database schema was changed.
7. Confirm no UI was changed.

Run appropriate verification commands if they are safe and relevant.

---

# 18. Project Review Findings

While researching skills, simultaneously record actual project problems discovered during inspection.

Examples:

```text
Incorrect folder placement
Wrong Next.js convention
Unnecessary Client Component
Duplicated component
Weak test
Incorrect dependency
Configuration issue
Documentation contradiction
Future Prisma integration risk
```

Do not fix these problems during TASK-003-I unless they are directly required to install/verify a skill.

The purpose is to preserve a clean separation:

```text
TASK-003-I
Research + Review
        ↓
TASK-003-II
Corrective implementation
```

---

# 19. TASK-003-II Creation

If the review identifies real issues that require code/folder/configuration restructuring, create:

```text
tasks/TASK-003-II-review-and-restructure-existing-implementation.md
```

The file must contain:

### Objective

What needs to be corrected.

### Findings

For each issue:

```text
ID
Severity
Area
Current state
Problem
Why it matters
Recommended solution
```

### Files affected

List expected files/folders.

### TDD plan

For each meaningful correction:

```text
RED
↓
GREEN
↓
REFACTOR
```

### Scope

Clearly state what the task will and will not change.

### Acceptance criteria

Define measurable completion criteria.

### Execution boundary

Explicitly state:

> TASK-003-II must be executed separately after TASK-003-I has been reviewed and approved.

---

# 20. Do Not Automatically Execute TASK-003-II

This is critical.

After creating TASK-003-II:

```text
STOP
```

Do not:

- restructure the project
- rewrite components
- move folders
- rewrite tests
- change architecture
- modify database integration

Those changes belong to TASK-003-II.

---

# 21. Important Architecture Principle

The review should protect the project from both extremes.

### Avoid under-engineering

Do not allow:

- database code inside UI components
- uncontrolled client-side access to server functionality
- duplicated domain logic
- untestable business logic
- insecure environment handling

### Avoid over-engineering

Do not introduce:

- Generic Repository
- CQRS
- MediatR
- unnecessary service layers
- unnecessary state-management libraries
- microservices
- event buses
- complex dependency injection
- premature abstractions

The correct target is:

```text
Simple
Correct
Testable
Maintainable
Ready for the next stage
```

---

# 22. Required Final Output

At the end of TASK-003-I, Claude Code must report:

## Skill Research

- skills investigated
- skills installed
- skills rejected
- reasons

## Current Project Review

- TASK-000 findings
- TASK-001 findings
- TASK-002 findings
- testing/TDD findings
- architecture findings
- documentation findings
- database-readiness findings

## Corrective Task

If problems were found:

```text
TASK-003-II created:
tasks/TASK-003-II-review-and-restructure-existing-implementation.md
```

Summarize what it will correct.

If no corrective work is necessary, explicitly state:

```text
No TASK-003-II corrective task is required.
```

## Validation

Report:

```text
Tests:
Lint:
Build:
Skill installation verification:
```

Do not start any later development task.

---

# 23. Success Criteria

TASK-003-I is complete when:

- [ ] Current repository has been inspected.
- [ ] TASK-000 has been reviewed.
- [ ] TASK-001 has been reviewed.
- [ ] TASK-002 has been reviewed.
- [ ] Current tests have been reviewed.
- [ ] TDD adherence has been assessed honestly.
- [ ] Existing Prisma skills have been reviewed.
- [ ] Next.js skills have been researched again.
- [ ] React skills have been researched again.
- [ ] TypeScript skills have been researched again.
- [ ] Testing/TDD skills have been researched again.
- [ ] AI application skills have been reconsidered.
- [ ] Claude Code built-in capabilities have been considered.
- [ ] Candidate skills have been evaluated for trust and relevance.
- [ ] Only genuinely useful additional skills have been installed.
- [ ] Existing unnecessary skills have not been retained merely because they were previously installed.
- [ ] Skill installation has been verified.
- [ ] Actual project problems have been documented.
- [ ] TASK-003-II has been created if corrective work is required.
- [ ] TASK-003-II has NOT been executed.
- [ ] No unrelated application functionality has been implemented.

---

# 24. Final Principle

This task is a **checkpoint**, not a feature-development task.

The goal is to answer two questions before we continue:

### Question 1

> **Does Claude Code have the right skills to build MathQuestAI effectively with Next.js, React, TypeScript, Prisma, PostgreSQL, and our TDD workflow?**

### Question 2

> **Is the work from TASK-000 → TASK-001 → TASK-002 good enough to build the next layer on top of it, or do we need to clean it up first?**

Do not assume the answer.

Inspect the repository.

Challenge previous decisions.

Use evidence.

Then prepare the next corrective task if necessary.
