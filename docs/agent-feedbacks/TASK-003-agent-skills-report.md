# TASK-003 — Agent Skills Research & Installation Report

**Date:** 2026-08-20
**Task:** `docs/tasks/TASK-003-research-and-install-agent-skills.md`

This is a standalone record of what was inspected, researched, decided, and installed for this task, and the resulting impact on the MathQuestAI project. (`docs/project-management/progress.md` carries only a one-line pointer to this file, per the project's convention of not duplicating task detail into the progress log.)

---

## 1. What was inspected

Read-only inspection of the current repository state before any research or installation:

- `CLAUDE.md`, `README.md`, all of `docs/` (project.md, product.md, requirements.md, architecture.md, database.md, ai-generation.md, ui.md, progress.md), all files under `docs/tasks/`, all files under `tests/`.
- `package.json` — dependencies, devDependencies, scripts.
- `next.config.ts` — effectively a stub, no custom options.
- `tsconfig.json` — strict mode, `@/*` path alias, Next.js TS plugin.
- Confirmed **no `prisma/` folder or `schema.prisma` exists yet** — database integration (now TASK-004) hasn't started.
- Confirmed **no `.claude/` directory existed** before this task — no skills, agents, or commands were previously installed.
- Test framework: Vitest + React Testing Library + jsdom, `tests/unit/` and `tests/integration/`, 21 tests passing (established in TASK-002).

No files were modified during this inspection phase.

---

## 2. Skill categories researched

Researched via web search and official documentation fetches (Claude Code docs, Prisma docs, Vercel/Next.js repos, and community skill marketplaces) against the categories the task specified:

| Category | Finding |
|---|---|
| Core app dev (Next.js/React/TS) | Next.js 16.3+ already auto-generates and injects an agent-rules block into `CLAUDE.md` via `next dev` (observed firsthand in TASK-001/002) — automatic, nothing to install. Vercel's official Next.js "Cache Components" skills exist but target a feature this project doesn't use. |
| Database (Prisma/PostgreSQL) | **Real gap.** Prisma ships an official, vendor-maintained skill package (`prisma/skills`) covering exactly this stack. |
| Testing (TDD/Vitest/RTL) | No official Vitest-maintained skill exists. Community options found have no clear maintenance/trust signal. Existing setup already works (21/21 tests passing). |
| AI application dev (LLM/SDKs/structured output/prompt engineering) | Provider is explicitly undecided per `docs/project-management/ai-generation.md`. Prompt/context engineering is this project's *own research subject*, already documented in depth. The bundled `claude-api` skill already covers the most likely provider (Anthropic) with zero installation needed. |
| Engineering workflow (code review, debugging, docs, git) | Already covered by Claude Code's own bundled skills (`/code-review`, `/debug`, `/verify`, `/run`) and native git tooling — no gap. |

---

## 3. Skills investigated

| Skill | Category | Source | Recommendation | Reason |
|---|---|---|---|---|
| `prisma-cli` | Database | `prisma/skills` (official, Prisma) | **MUST HAVE — installed** | CLI reference (init, generate, migrate, studio) directly needed for TASK-004. |
| `prisma-client-api` | Database | `prisma/skills` (official, Prisma) | **MUST HAVE — installed** | Client API reference (CRUD, queries, transactions) directly needed for the data-access layer in TASK-005+. |
| `prisma-database-setup` | Database | `prisma/skills` (official, Prisma) | **MUST HAVE — installed** | Multi-provider (incl. PostgreSQL) connection/config guidance — directly needed for TASK-004. |
| `prisma-postgres` / `prisma-postgres-setup` | Database | `prisma/skills` (official, Prisma) | **NOT NEEDED — installed then removed** | Covers *Prisma Postgres*, Prisma's own hosted/managed database product (Console, `create-db` CLI, Management API). MathQuestAI already has an existing, manually-created PostgreSQL database (`docs/project-management/database.md`) — this is a different product, not applicable. `prisma-postgres-setup` was also flagged **High Risk** by the installer's built-in Socket/Snyk risk assessment. |
| `prisma-compute` | Deployment | `prisma/skills` (official, Prisma) | **NOT NEEDED — installed then removed** | Deployment to Prisma's own cloud compute platform — MathQuestAI is a local research prototype, not deploying there. Flagged **Med Risk**. |
| `prisma-mongodb-upgrade` | Database | `prisma/skills` (official, Prisma) | **NOT NEEDED — installed then removed** | MongoDB-specific; MathQuestAI uses PostgreSQL exclusively. |
| `prisma-driver-adapter-implementation` | Database | `prisma/skills` (official, Prisma) | **NOT NEEDED — installed then removed** | Advanced/niche topic (writing custom Prisma driver adapters) — out of scope for a standard Postgres connection in a research prototype. |
| `prisma-upgrade-v7` | Database | `prisma/skills` (official, Prisma) | **NOT NEEDED — installed then removed** | An upgrade guide from older Prisma versions to v7. MathQuestAI has no existing Prisma install to upgrade from — this task will do a fresh v7 install in TASK-004. |
| `vercel/next.js` — `next-cache-components-optimizer`, `next-cache-components-adoption` | Core app dev | Vercel (official, version-matched to Next.js) | **NOT NEEDED / OPTIONAL later** | Specific to the Next.js "Cache Components" feature, which the app doesn't use. Revisit if adopted. |
| `vercel-labs/agent-skills` (React/Next.js performance, 40+ rules) | Core app dev | Vercel (official) | **NOT NEEDED** | Actively conflicts with the project's own stated principle (`docs/project-management/architecture.md` §28, `CLAUDE.md`): "avoid premature optimization... this is a research project." |
| Community Vitest/TDD skills (e.g. `secondsky/claude-skills`, `sanity-io/next-sanity`) | Testing | Unverified individuals / unrelated projects | **NOT NEEDED** | No official Vitest-maintained skill exists. No clear maintenance signal on the alternatives. A skill can execute shell commands once installed — installing from unverified sources for negligible marginal benefit (existing setup already works) isn't justified. |
| Generic "AI SDK / structured output / prompt engineering" skills | AI application dev | Various, mostly community | **NOT NEEDED** | Provider undecided; prompt/context engineering is the project's own research domain, already documented. Bundled `claude-api` skill already covers the likely provider. |
| `anthropics/skills` — "webapp-testing" (Playwright e2e) | Testing | Anthropic (official) | **NOT NEEDED** | Project docs explicitly state e2e testing isn't currently planned. |
| `anthropics/skills` — document-skills (docx/pdf/pptx/xlsx) | N/A | Anthropic (official) | **NOT NEEDED** | No connection to MathQuestAI's domain. |

---

## 4. Skills installed

**Final installed set — 3 skills, all under `.claude/skills/`:**

### `prisma-cli`
- **What it does:** Reference for every Prisma ORM v7 CLI command — `init`, `generate`, `migrate` (dev/deploy/status/resolve), `db` (push/pull/seed/execute), `studio`, `validate`, `format`, `debug`.
- **Why MathQuestAI needs it:** TASK-004 (Prisma + PostgreSQL configuration) is the very next task. This gives Claude Code an accurate, version-matched reference for the exact CLI commands needed to initialize Prisma and manage migrations against the project's existing PostgreSQL database.
- **How Claude Code is expected to use it:** Loaded automatically when running/writing Prisma CLI commands during TASK-004 and later schema-migration work.

### `prisma-client-api`
- **What it does:** Reference for the Prisma Client API — CRUD operations, query options/filters, relations, transactions, raw queries.
- **Why MathQuestAI needs it:** The application's data-access layer (Subject/Topic/Subtopic/QuestionPattern/ReferenceQuestion/QuestionGenerationRequest queries, per `docs/project-management/database.md`) will be built with Prisma Client. Correct, current API usage matters for a project that explicitly prioritizes correctness.
- **How Claude Code is expected to use it:** Loaded automatically when writing Prisma Client queries in `lib/db/` (or equivalent) during TASK-005 (dynamic educational data loading) and beyond.

### `prisma-database-setup`
- **What it does:** Guides for configuring Prisma with different database providers (PostgreSQL, MySQL, SQLite, MongoDB), including connection strings, environment variables, and troubleshooting.
- **Why MathQuestAI needs it:** TASK-004 needs to connect Prisma to the project's **existing, manually-created** PostgreSQL database — this skill covers exactly that provider-configuration step.
- **How Claude Code is expected to use it:** Loaded automatically when setting up the Prisma `datasource` block, `.env`/`.env.local` `DATABASE_URL`, and initial connection verification.

**Installation method:** `npx skills add prisma/skills --agent claude-code -y`, which cloned the official `prisma/skills` GitHub repository and copied files into `.claude/skills/<name>/SKILL.md`. This is the exact command documented at `prisma.io/docs/ai/tools/skills` for Prisma ORM v7. The command does **not** modify `package.json` — skills are plain files, not npm dependencies. A `skills-lock.json` file was created at the project root to track installed skills (source repo, path, content hash) for future updates/verification.

The bulk command installs all 9 skills in the `prisma/skills` repo by default; the 6 not listed above (`prisma-postgres`, `prisma-postgres-setup`, `prisma-compute`, `prisma-mongodb-upgrade`, `prisma-driver-adapter-implementation`, `prisma-upgrade-v7`) were installed and then explicitly removed via `npx skills remove <name> -y`, which also updated `skills-lock.json` to reflect only the 3 kept skills. This keeps the installed set to the smallest one that materially helps, per the task's own selection rules.

---

## 5. Skills deliberately not installed

See the "Skills investigated" table (§3) for the full list and reasoning. The most important rejections, restated:

- **`prisma-postgres` / `prisma-postgres-setup`** — these are about *Prisma Postgres*, Prisma's own hosted database product, not generic PostgreSQL. MathQuestAI connects to an existing, separately-managed PostgreSQL instance. Installing these risks steering future database work toward provisioning a new managed database MathQuestAI doesn't need. `prisma-postgres-setup` was also independently flagged **High Risk** by the installer's Socket/Snyk assessment (likely due to the broader API/network operations a provisioning skill needs to describe).
- **Generic AI SDK / prompt-engineering skills** — MathQuestAI's own `docs/project-management/ai-generation.md` and `docs/project-management/project.md` already define the project's prompt/context-engineering strategy in detail; this *is* the project's research subject. An external, generic skill on the same topic risks quietly overriding project-specific methodology, which the task's Rule 4/5 explicitly warns against.
- **Vercel's React/Next.js performance skill** — actively contradicts `docs/project-management/architecture.md`'s and `CLAUDE.md`'s own stated principle to avoid premature optimization in a research prototype.
- **Community-maintained Vitest/testing skills** — no official option exists, and the ones found have no clear maintenance or trust signal; the existing Vitest + RTL setup (21/21 tests passing) already works, so the marginal benefit doesn't justify installing arbitrary third-party instruction files that can execute shell commands.

---

## 6. Project impact

**What Claude Code can now do that it couldn't before:** When working on TASK-004 (Prisma + PostgreSQL setup) and later database-dependent tasks, Claude Code will have accurate, vendor-maintained, version-matched (Prisma v7) reference material for CLI usage, Client API usage, and provider configuration automatically available — reducing the chance of using outdated or incorrect Prisma syntax/patterns.

**What was NOT changed:**
- No application source code (`app/`, `components/`, `lib/`) was modified.
- No database schema was created or modified (no `prisma/` folder exists yet — that's TASK-004's job).
- No UI was changed.
- `package.json` / `package-lock.json` were not modified by this task.
- `CLAUDE.md` was **not** modified. Nothing about the installed skills conflicts with or requires a change to project-level instructions — the skills are purely additive reference material, scoped to `.claude/skills/`, and don't override any documented project decision.

**Documentation updated:**
- `docs/project-management/progress.md` — one-line note recording this task's completion and a pointer to this report (task numbering also corrected: this was inserted as TASK-003, shifting the former TASK-003/004/005 to TASK-004/005/006).
- This report (`docs/agent-feedbacks/TASK-003-agent-skills-report.md`) — the detailed record.

**New files/directories created:**
- `.claude/skills/prisma-cli/`, `.claude/skills/prisma-client-api/`, `.claude/skills/prisma-database-setup/`
- `skills-lock.json` (project root)
- `docs/agent-feedbacks/TASK-003-agent-skills-report.md` (this file)

---

## 7. Verification performed

- `.claude/skills/` contains exactly 3 skill folders, each with a valid `SKILL.md` (YAML frontmatter with `name`, `description`, `license`, `metadata` present and well-formed).
- `skills-lock.json` reflects only the 3 kept skills after removal.
- `npm run lint`, `npm run test` (21/21 passing), and `npm run build` all still pass, confirming no accidental side effects on the application.
- `git status` confirms only `.claude/`, `skills-lock.json`, `docs/project-management/progress.md`, and this report were added/changed by this task — no application source touched.
