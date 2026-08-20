# MathQuestAI — Agent Skills Research & Installation

## Purpose

Use this document as the instruction/specification for Claude Code to identify, evaluate, and install the most useful Agent Skills for the **MathQuestAI** project.

Do not install skills blindly. First inspect the project, identify actual needs, research relevant skills, evaluate them, and then install only the skills that provide clear value.

---

## 1. Project Context

**Project:** MathQuestAI

**Goal:** Build a mathematics question-generation application using AI while also using the project as a research/learning project for context engineering and prompt engineering.

The intended research loop is:

```text
Educational Context
       ↓
Prompt / Generation Instructions
       ↓
AI API
       ↓
Generated Mathematics Questions
       ↓
Evaluation
       ↓
Improve Context / Prompt
       ↓
Generate Again
```

The evaluation functionality is **not finalized yet** and is currently outside the implementation scope.

---

## 2. Current Technology Stack

The project is intended to use:

- Next.js
- React
- TypeScript
- PostgreSQL
- Prisma ORM
- Claude Code as the primary AI development agent
- Git / GitHub

Testing approach:

- TDD (Test-Driven Development)
- Red → Green → Refactor
- Unit tests are the primary testing strategy
- Integration tests are used selectively where they provide real value, especially at database/Prisma boundaries
- E2E testing is not currently planned unless a strong future requirement justifies it

---

## 3. Development Philosophy

MathQuestAI is being developed with **context engineering** as an important part of the project.

Claude Code should use the project's documentation as context before implementing features.

Important project documentation includes:

```text
CLAUDE.md
README.md
docs/
tasks/
tests/
```

Development should follow a task-driven workflow.

For meaningful implementation tasks:

```text
Define requirement
      ↓
Define test specification
      ↓
RED — write failing test
      ↓
GREEN — implement minimum solution
      ↓
REFACTOR
      ↓
Run tests
      ↓
Update documentation
```

Testing should not be treated as a separate afterthought.

---

## 4. Current Project Structure

Claude Code must inspect the actual repository before making assumptions.

The intended documentation/task structure currently includes:

```text
MathQuestAI/
├── CLAUDE.md
├── README.md
├── docs/
├── tasks/
└── tests/
    ├── unit/
    └── integration/
```

The actual source structure, package configuration, Prisma schema, and installed dependencies must be inspected from the repository.

---

## 5. Domain Context

The application allows a user to configure mathematics question generation using concepts such as:

- Grade
- Subject
- Topic
- Subtopic
- Difficulty
- Question Type(s)

The current reference UI contains:

```text
Grade
Subject
Topic
Subtopic
Difficulty
Question Types
```

Question Types currently include concepts such as:

- Multiple Choice
- Fill in the Blank
- Word Problem
- True / False
- Multi-step Problem

### Important distinction: Question Pattern

Question Pattern is an **internal question-generation/domain concept**.

It is NOT currently a user-facing selector in the Setup UI.

Examples of Question Patterns we have defined include:

- Combine Like Terms
- Apply Distributive Property
- Simplify Algebraic Fractions
- Simplify Multi-Operation Expressions
- Simplify and retain variables

Do not recommend or install a skill based on an assumption that Question Pattern is a UI field.

---

## 6. Database Context

The project uses PostgreSQL with Prisma.

The project contains educational/question-generation concepts including:

- Question Patterns
- Reference Questions
- Question Generation Requests
- Difficulty-related generation guidance
- Educational hierarchy/data

The exact schema must be obtained from the current project documentation and Prisma schema.

Do not invent database structures that are not present in the repository.

---

# 7. Task for Claude Code

## Phase 1 — Inspect the project

Before searching for skills:

1. Read `CLAUDE.md`.
2. Read `README.md`.
3. Review relevant files under `docs/`.
4. Review current task files under `tasks/`.
5. Review current test specifications/files under `tests/`.
6. Inspect `package.json`.
7. Inspect Next.js configuration.
8. Inspect TypeScript configuration.
9. Inspect Prisma configuration and schema.
10. Inspect the current source-code structure.
11. Identify the test framework currently configured.
12. Identify any existing development tooling that already provides functionality that a skill might duplicate.

Do not modify the project during this inspection phase.

---

# 8. Phase 2 — Identify Skill Categories

Research whether useful Agent Skills exist for the following areas:

### Core application development

- Next.js
- React
- TypeScript

### Database

- Prisma
- PostgreSQL
- Prisma migrations
- Prisma queries / database workflows

### Testing

- TDD
- Unit testing
- React component testing
- TypeScript testing
- Integration testing

### AI application development

- LLM application development
- AI SDKs
- structured AI output
- prompt engineering
- context engineering
- AI application architecture

### Engineering workflow

- code review
- verification
- debugging
- documentation
- Git/GitHub workflows

Do not assume that every category needs a skill.

A skill should only be recommended if it provides meaningful capabilities that are not already adequately covered by the project's codebase, documentation, or Claude Code instructions.

---

# 9. Phase 3 — Evaluate Each Candidate Skill

For every candidate skill, evaluate:

1. Skill name
2. Skill source/repository
3. Maintainer
4. Official/vendor-maintained or community-maintained
5. What the skill actually provides
6. Which MathQuestAI problem it solves
7. Why Claude Code would benefit from it
8. Whether it overlaps with existing skills or project instructions
9. Whether it is actively maintained
10. Whether there are security or trust concerns
11. Whether it introduces unnecessary complexity
12. Whether it should be installed

Classify each candidate as:

- **MUST HAVE**
- **USEFUL**
- **OPTIONAL**
- **NOT NEEDED**

Prefer a small set of high-quality skills over installing many skills.

---

# 10. Important Selection Rules

Follow these rules strictly.

### Rule 1 — Do not install skills just because they exist

The existence of a skill does not mean MathQuestAI needs it.

### Rule 2 — Prefer official/vendor-maintained skills

When a reputable official skill exists, prefer it over an unknown community implementation when the capabilities are comparable.

### Rule 3 — Avoid overlapping skills

Do not install several skills that solve essentially the same problem.

### Rule 4 — Do not replace project documentation

Skills should complement:

```text
CLAUDE.md
docs/
tasks/
tests/
```

They should not override project-specific requirements.

### Rule 5 — Project-specific instructions have priority

If a skill conflicts with MathQuestAI's documented architecture, TDD workflow, database design, or requirements, do not blindly follow the skill.

### Rule 6 — Minimize installed skills

The objective is:

> The smallest useful set of skills that materially improves Claude Code's development performance.

### Rule 7 — Do not install unrelated skills

Do not install skills simply because they are popular, highly rated, or interesting.

They must have a clear connection to MathQuestAI.

---

# 11. Phase 4 — Recommended Skill Set

After research, produce a report containing:

## MUST HAVE

Skills that should be installed because they provide clear and significant value.

## USEFUL

Skills that could improve development but are not essential.

## OPTIONAL

Skills that may become useful later.

## NOT NEEDED

Relevant-looking skills that should deliberately NOT be installed, including the reason.

---

# 12. Phase 5 — Install the Approved Skills

After completing the evaluation:

1. Install only the skills classified as **MUST HAVE**.
2. Install **USEFUL** skills only when their value is clear and they do not introduce unnecessary overlap.
3. Do not install OPTIONAL skills unless there is a specific current requirement.
4. Do not install NOT NEEDED skills.
5. Follow the official installation instructions for each selected skill.
6. Verify that each installed skill is available to Claude Code.
7. Do not modify application source code as part of the skill installation work.
8. Do not modify project requirements merely to accommodate a skill.

If a skill cannot be safely verified or its source is questionable, do not install it. Report the issue instead.

---

# 13. Final Report Required

After the research and installation process, provide:

### Skills investigated

A table containing:

| Skill | Category | Source | Recommendation | Reason |
|---|---|---|---|---|

### Skills installed

List each installed skill and explain:

- What it does
- Why MathQuestAI needs it
- How Claude Code is expected to use it

### Skills deliberately not installed

Explain important rejected candidates and why.

### Project impact

Explain whether any project documentation needs to be updated because of the installed skills.

Do not automatically modify `CLAUDE.md` unless explicitly required by the installation instructions or unless you identify a clear project-level integration requirement. If an update is useful, report the proposed change first.

---

# 14. Important Constraint

This is a **skill research and installation task**, not an application implementation task.

Do not:

- implement new MathQuestAI features
- modify the database schema
- modify the UI
- implement AI question generation
- create the evaluation system
- change the project's architecture
- create unrelated configuration

The goal is only:

```text
Understand MathQuestAI
        ↓
Find relevant Agent Skills
        ↓
Evaluate them
        ↓
Select a minimal useful set
        ↓
Install the selected skills
        ↓
Verify installation
```

---

# 15. Success Criteria

This task is complete when:

- [ ] Existing MathQuestAI project structure has been inspected
- [ ] Existing documentation has been reviewed
- [ ] Existing testing approach has been reviewed
- [ ] Relevant Agent Skills have been researched
- [ ] Candidate skills have been compared
- [ ] Overlapping/unnecessary skills have been rejected
- [ ] High-value skills have been selected
- [ ] Selected skills have been installed
- [ ] Installation has been verified
- [ ] No application functionality has been changed
- [ ] A final recommendation/report has been provided
