# MathQuestAI — Project Progress

## Completed

- Next.js + TypeScript + App Router foundation established (TASK-001).
- Local project connected to GitHub: `https://github.com/AsiriZenith/MathQuestAI.git`, `main` branch (TASK-000).
- Figma UI reference recreated as 4 real Next.js App Router routes (`/`, `/generate`, `/questions`, `/evaluation`) with Tailwind v4, static/mock data, and a Vitest + React Testing Library test suite (TASK-002). See `docs/ui.md` for the full route/component mapping and deviations.
- Researched and installed Claude Code Agent Skills (TASK-003): 3 official Prisma-maintained skills (`prisma-cli`, `prisma-client-api`, `prisma-database-setup`) installed under `.claude/skills/` ahead of TASK-004's Prisma/PostgreSQL work. Full evaluation and rationale in `agent-feedbacks/TASK-003-agent-skills-report.md`.
- Re-reviewed the project and Agent Skills a second time (TASK-003-I): re-affirmed no additional skills are needed (fresh evidence, not a rubber-stamp — see `agent-feedbacks/TASK-003-I-review-report.md`); existing 3 Prisma skills kept unchanged. Review found one real structural inconsistency (Setup screen not following the `_components/` extraction pattern used elsewhere) and an honest TDD-process gap (TASK-002 tests were written after implementation, not test-first). A narrowly-scoped corrective task, `tasks/TASK-003-II-review-and-restructure-existing-implementation.md`, was created.
- Executed TASK-003-II: extracted `FixedField`, `DifficultyToggle`, and `QuestionTypeChips` out of `app/page.tsx` into `app/_components/`, each written test-first (RED→GREEN→REFACTOR), closing both findings from TASK-003-I. `app/page.tsx` shrank from 240 to 168 lines; behavior and visual output unchanged (existing Setup integration tests pass unmodified). Test suite grew from 21 to 30 tests.
- Connected the app to the existing PostgreSQL database via Prisma (TASK-004): introspected the real schema (6 tables, matches `docs/database.md`'s conceptual model), generated a typed Prisma Client with the `PrismaPg` driver adapter, added a `lib/prisma.ts` singleton, and verified connectivity end-to-end with a temporary `/dev/db-check` route and 2 new integration tests against the real database. No schema/data changes. Full report in `agent-feedbacks/TASK-004-configure-prisma-postgresql.md`.

## Current

- No active task in progress.

## Upcoming

- TASK-005 — Dynamic educational data loading.
- TASK-006 — Build prompt context.

## Important Decisions

- The target Next.js application is built directly in `D:\my works\MathQuestAI`. The Figma/shadcn UI reference project lives separately at `D:\my works\MathQuestAI_UI` and must not be modified. (`CLAUDE.md` §8 previously stated a different, incorrect target path — see "Documentation Follow-up Needed" below, now resolved.)
- Question Pattern is not exposed as a UI-selectable field in the Setup screen (TASK-002), per explicit product decision to match the reference UI exactly. `docs/requirements.md` §6, `docs/architecture.md` §7/§10/§11, and `docs/project.md` §9 were annotated (not rewritten) to note this without losing the originally intended long-term behavior.
- Mock Question Pattern names in the Evaluation screen were aligned to the real seeded Algebra/Simplify-Calculate patterns from `docs/database.md` §26, replacing the reference's placeholder names.
- Styling stack: Tailwind CSS v4 (CSS-first, `@tailwindcss/postcss`), `next/font/google` for Plus Jakarta Sans + DM Sans, `motion` for animation, `lucide-react` for icons — matching only what the reference screens actually use (the ~45 unused shadcn/ui primitives and other unused reference dependencies were not ported).
- Test stack: Vitest + React Testing Library + jsdom, under `tests/unit/` and `tests/integration/` (no e2e framework introduced).
- **Environment workaround:** `npm run dev` runs with `--webpack` instead of the Turbopack default, because Turbopack's dev-mode PostCSS worker subprocess crashes on this machine once `@tailwindcss/postcss` is introduced (`STATUS_DLL_INIT_FAILED`). `npm run build` (Turbopack, production) is unaffected. Worth re-testing against future Next.js/Turbopack releases.
- TASK-002 through TASK-003-II were committed and pushed to `origin/asiri/v0.1.0/feature/ai-question-generation` in a single commit (`ce88da5`) once explicitly requested. TASK-004's work (this entry) is not yet committed.
- **Database:** Prisma v7 with the `PrismaPg` driver adapter (`@prisma/adapter-pg` + `pg`) against the existing PostgreSQL database. `DATABASE_URL` lives only in `.env.local` (gitignored); `prisma.config.ts` was changed to load `.env.local` explicitly instead of Prisma's default `.env`. Fixed a `.gitignore` bug where the blanket `.env*` rule was also excluding `.env.example` from being committed. Discovered and documented (in `docs/database.md` §5) an undocumented `language` column on `subjects` — not changed, just recorded; worth confirming with the team whether it's intentional.

## Blockers

- None currently.

## Documentation Follow-up Needed

- ~~`CLAUDE.md` referenced a wrong target application path.~~ **Resolved.** The original `ai-bootcamp` reference had already been edited (outside this session) to instead say the actual application is developed in `MathQuestAI_UI` — the read-only reference project's own path, contradicting that same section's "do not modify" rule. Fixed in `CLAUDE.md` §8 to correctly say `D:\my works\MathQuestAI\`, matching `docs/project.md` §15, `docs/architecture.md` §25, and every task file.
- `docs/development.md` is referenced by `CLAUDE.md` §5 as an expected doc (development workflow and TDD practices) but does not exist. Noted during TASK-003-I's review (`agent-feedbacks/TASK-003-I-review-report.md`); not created yet since CLAUDE.md §3 and `tasks/tasks_README.md` already cover TDD/workflow content inline, and creating a doc "just because it's referenced" would cut against the project's own anti-unnecessary-documentation principle. Revisit if the project accumulates enough workflow-specific detail to justify a dedicated file.
