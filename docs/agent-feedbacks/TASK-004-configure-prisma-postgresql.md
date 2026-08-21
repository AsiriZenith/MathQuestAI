# Agent Feedback — TASK-004: Configure Prisma and PostgreSQL

**Date:** 2026-08-20

---

## What was done

- Installed `prisma` (7.9.1, dev), `@prisma/client`, `@prisma/adapter-pg`, `pg`, `@types/pg`, and `dotenv` (dev).
- Ran `prisma init --datasource-provider postgresql --no-skills`, then consolidated environment handling onto `.env.local` (the Next.js convention) instead of the plain `.env` Prisma generates by default — updated `prisma.config.ts` to load `.env.local` explicitly via `dotenv`.
- Wrote your provided credentials into `.env.local` only (gitignored — confirmed via `git status` it never appears as trackable). Created `.env.example` with placeholders only, and fixed a real bug in `.gitignore`: the blanket `.env*` rule was also silently excluding `.env.example` from being committed, so I added `!.env.example`.
- Introspected the **existing** PostgreSQL database (read-only: `prisma db pull --print` to preview, then `prisma db pull` to write) — connection succeeded on the first try using your credentials.
- Cleaned up the introspected schema: PascalCase model names, camelCase fields, `@@map`/`@map` back to the real physical table/column names — the underlying database was never touched, only how Prisma represents it in TypeScript.
- Generated Prisma Client (`lib/generated/prisma/`, gitignored — regenerable output, not committed).
- Created `lib/prisma.ts` (hot-reload-safe singleton, using the `PrismaPg` driver adapter — the required v7 pattern).
- Created `app/dev/db-check/page.tsx` — a temporary, unlinked dev-only route that queries and displays real Subject records, forced to render dynamically (`force-dynamic`) so it re-queries the database on every visit rather than showing a build-time snapshot.
- Added 2 integration tests (`tests/integration/database-connection.test.ts`) against the real database: fetching Subjects, and resolving Question Patterns via the Subtopic relation. Both pass.
- Recorded one genuine, previously-undocumented schema detail in `docs/project-management/database.md` (see below).

## Database inspection results

**Tables found (6):** `subjects`, `topics`, `subtopics`, `question_patterns`, `reference_questions`, `question_generation_requests` — matches `docs/project-management/database.md`'s conceptual model exactly in structure and hierarchy.

**One real discrepancy found and documented (not silently changed):** `subjects` has a `language VARCHAR(50)` column with a unique constraint on `(name, language)`, which `docs/project-management/database.md` never mentioned. I judged the database to be the source of truth here (per the doc's own §29 principle) and added a short note to `docs/project-management/database.md` §5 recording it, since it's additive and non-conflicting — not a redesign. **You may want to confirm this was intentional** (e.g. future multi-language support) since it wasn't previously written down anywhere.

**Also confirmed:** the 5 known seeded QuestionPattern UUIDs from `docs/project-management/database.md` §26, and the documented absence of a `QuestionCount` column on `question_generation_requests`, both match the real database exactly.

## Action needed from you

- **Confirm the `language` column is intentional** and not something you'd rather I follow up on (e.g., was it meant for future i18n, or is `"English"` just a placeholder that should eventually be removed?). I didn't change anything about it — just documented it.
- **Nothing required to unblock TASK-005** — the connection is live and verified.

## Risky / judgment-call decisions

- **Consolidating on `.env.local` instead of the `.env` Prisma generates by default.** Low risk (both are gitignored), but worth knowing: if you or a teammate later run raw `prisma` CLI commands expecting a plain `.env` to work, it won't — `prisma.config.ts` is now hardcoded to read `.env.local`. This matches Next.js convention and was called out in the approved plan.
- **Not downgrading Prisma to work around a `npm audit` finding.** `npm install` reported 3 high-severity vulnerabilities, all from a stack-exhaustion issue in `deepmerge-ts`, a transitive dependency of `@prisma/config` (used only by the Prisma CLI itself, not at runtime). The suggested fix (`npm audit fix --force`) would downgrade to Prisma 6.12.0, which contradicts this whole task's v7-based setup (driver adapters, `prisma.config.ts`) and the installed Prisma skills. I left it as-is — this only affects local CLI tooling, not the deployed app. Worth revisiting when Prisma patches it upstream.
- **Forcing `/dev/db-check` to render dynamically.** Without this, Next.js statically pre-rendered the page at build time (baking in a build-time snapshot of Subjects) — technically still "proof of connectivity," but not what a live connectivity-check page should do. I added `export const dynamic = "force-dynamic"` so every visit re-queries.

## Deviations from the task's instructions

None of substance — followed the approved plan directly. The task file itself references `docs/tasks/backlog/TASK-003-configure-prisma-postgresql.md` and `docs/tasks/README.md`, which don't exist under those names anymore (task numbering/folder structure changed since TASK-003-I) — harmless, didn't affect the work.

## Suggestions

- `app/dev/db-check/` is a throwaway verification route. Fine to leave for now (useful for future debugging), but worth deleting once TASK-005's real dynamic-data UI exists, so it doesn't linger as dead code.
- The `deepmerge-ts` audit finding is worth a 2-minute check next time you run `npm install` in this project, to see if Prisma has shipped a patched `@prisma/config`.

---

## Validation

```text
Lint:                passing
Build:                passing (npm run build) — /dev/db-check correctly shows as dynamic (ƒ)
Database connection:  successful (real credentials, real data returned)
Verification query:   successful — Subject "Mathematics" (and others) returned via Prisma Client
Tests:                32/32 passing (30 existing + 2 new DB integration tests)
```

### Schema Changes

```text
Database schema changed: NO
```

No migrations, seeding, or destructive commands were run at any point.

### Documentation Changes

- `docs/project-management/database.md` §5 — added the `language` column note.
- `docs/project-management/progress.md` — updated separately with a summary entry.
