# TASK-003-I — Re-Review & Additional Agent Skills Research Report

**Date:** 2026-08-20
**Task:** `tasks/TASK-003-I-re-review-and-install-additional-agent-skills.md`

---

## A. Current Installed Skills

| Skill | Source | Purpose | Current value | Keep/remove |
|---|---|---|---|---|
| `prisma-cli` | `prisma/skills` (official, Prisma) | Prisma CLI reference (init/generate/migrate/db/studio/etc.) | Directly needed for TASK-004 (Prisma + PostgreSQL setup, next in queue) | **Keep** |
| `prisma-client-api` | `prisma/skills` (official, Prisma) | Prisma Client API reference (CRUD, queries, transactions, relations) | Directly needed for the data-access layer in TASK-005+ | **Keep** |
| `prisma-database-setup` | `prisma/skills` (official, Prisma) | Multi-provider connection/config guidance (incl. PostgreSQL) | Directly needed for TASK-004's connection to the existing PostgreSQL database | **Keep** |

No changes made — verified via `skills-lock.json` content hashes matching the original installation from TASK-003.

---

## B. Newly Investigated Skills

Re-searched with fresh, more specific queries rather than reusing the prior task's conclusions verbatim.

| Skill | Category | Source | What it provides | Why MathQuestAI might need it | Risks | Recommendation |
|---|---|---|---|---|---|---|
| `vercel/next.js` skills (`next-cache-components-optimizer`, `next-cache-components-adoption`) | Core app dev | Vercel (official, version-matched to Next.js) | Guidance for Next.js's "Cache Components" feature | Not used by MathQuestAI (bare App Router app, no caching strategy) | N/A | **Not needed** — revisit only if the feature is adopted |
| `react-best-practices` (`vercel-labs/agent-skills`) | Core app dev | Vercel (official) | 40+ rules on React/Next.js performance — waterfalls, bundle size, re-render prevention | None currently | Actively conflicts with the project's own "avoid premature optimization... this is a research project" principle | **Not needed** |
| `composition-patterns` (`vercel-labs/agent-skills`) | Core app dev | Vercel (official) | Compound components, state lifting, reducing boolean-prop proliferation, aimed at reusable component-library API design | MathQuestAI's components are page-specific, not a component library; no boolean-prop-proliferation problem exists in the current codebase | Low risk (official source) but no concrete current benefit | **Optional** — reconsider only if the project starts building a genuine shared component library |
| `web-design-guidelines` (`vercel-labs/agent-skills`) | Core app dev | Vercel (official) | 100+ accessibility/UX rules (ARIA, focus states, forms, typography, dark mode) | A legitimate correctness concern in general | No accessibility requirement is documented anywhere in the project | **Optional** — no expressed requirement to satisfy right now; reconsider if accessibility becomes a stated goal |
| `writing-guidelines`, `react-native-guidelines`, `react-view-transitions`, `vercel-optimize`, `vercel-deploy-claimable` (`vercel-labs/agent-skills`) | Various | Vercel (official) | Documentation style rules, mobile patterns, page-transition animation, deployed-project auditing, Vercel deploy tooling | None apply — no mobile app, no view-transitions usage, nothing deployed to Vercel, and `CLAUDE.md`'s own detailed conventions already govern documentation style | N/A | **Not needed** |
| Community "TypeScript Pro" / "typescript-expert" / similar | TypeScript | Various individuals, unverified | Generic advanced-TypeScript pattern guidance | `strict: true` is already set; no concrete gap identified | No official/vendor option exists; unclear maintenance | **Not needed** |
| Community Vitest / React Testing Library skills | Testing | Various individuals, unverified | Testing setup/pattern guidance | Existing Vitest + RTL setup already works (21/21 tests passing) | No official Vitest- or Testing-Library-maintained skill exists; a skill can execute shell commands once installed | **Not needed** |
| Generic AI SDK / prompt-engineering skills | AI application dev | Various, mostly community | Generic LLM/prompt-engineering guidance | AI provider is still undecided (`docs/ai-generation.md`); prompt/context engineering is MathQuestAI's own research subject, already documented in depth | Risk of quietly overriding project-specific research methodology | **Not needed** |

**Conclusion: no new skills installed.** This reaffirms the prior TASK-003 conclusion, but with materially new evidence — this review inspected Vercel's `agent-skills` repo skill-by-skill (8 individual skills) rather than treating it as one undifferentiated "performance skill," and surfaced two genuinely new OPTIONAL candidates (`composition-patterns`, `web-design-guidelines`) for future reconsideration rather than blanket dismissal.

---

## C. Final Skill Set

```text
Existing skills kept:
  prisma-cli
  prisma-client-api
  prisma-database-setup

+ New skills installed:
  (none)

= Final set: unchanged from TASK-003 (3 skills)
```

---

## D. Rejected Skills

See table B above for the full list with reasoning. The most important rejections, restated:

- **Vercel's `react-best-practices`** — the closest thing to a "why not just install it, it's official" temptation, but it directly contradicts a principle the project states explicitly for itself. Installing it would create standing pressure toward premature optimization in a project that has deliberately chosen not to prioritize that yet.
- **Generic AI/prompt-engineering skills** — the project's own documentation (`docs/ai-generation.md`, `docs/project.md`) already defines a project-specific prompt/context-engineering strategy in more depth and with more domain relevance than any generic external skill could provide; this is the project's actual research subject.
- **Community Vitest/TypeScript skills** — no official/vendor-maintained option exists in either category, and the working test/type setup doesn't have a concrete unmet need that would justify the trust cost of installing arbitrary community instruction files (which can execute shell commands).

---

## Current Project Review

### TASK-000 (Git/GitHub) findings

Still sound. Verified directly (not just re-reading the task file):
- No `.env*` files present anywhere in the repository.
- `.gitignore` still correctly excludes `.env*`, `node_modules/`, `.next/`, etc.
- `git log --oneline --all` shows exactly 2 commits: `chore: initialize MathQuestAI project`, `docs: add project progress tracking` — both from TASK-000/001.

**Process observation (not a defect):** `git status` currently shows 36 changed/untracked entries — effectively all of TASK-002 and TASK-003's work is still uncommitted. This isn't a TASK-000 setup problem (the repo itself is correctly configured), but it means there are no git checkpoints for two completed tasks' worth of work. I can commit this as separate, per-task commits if you'd like — just say so; I won't do it unprompted.

### TASK-001 (Next.js init) findings

- `package.json` — every dependency and devDependency is actually used; no bloat.
- `tsconfig.json` — `strict: true` intact, `@/*` path alias in place, Next.js TS plugin configured.
- `next.config.ts` — still a clean stub, no unnecessary configuration.
- The `npm run dev` → `--webpack` workaround (documented in `docs/progress.md`) remains necessary on this machine; not a code defect, an environment note.

No upgrades recommended — no concrete compatibility, security, correctness, or maintenance reason was found to justify one.

### TASK-002 (UI recreation) findings

**"use client" audit (verified via `grep -rl '"use client"'`):** Exactly 5 files carry the directive — the 4 route pages (`app/page.tsx`, `app/generate/page.tsx`, `app/questions/page.tsx`, `app/evaluation/page.tsx`) and `components/providers/practice-session-provider.tsx`. All 5 genuinely need it (state, router, or context hooks). `components/layout/{screen-shell,app-nav,geometric-decorations}.tsx` and all of `components/common/` correctly have **no** directive and remain true Server Components — `app/layout.tsx` (a Server Component) renders `ScreenShell` directly and passes the route's content through as `children`, so the nav and decorations are genuinely server-rendered, not accidentally bundled into the client. **No unnecessary Client Components were found** — this part of TASK-002 was done correctly.

**File-size / duplication audit (`wc -l` across the source tree):** `app/page.tsx` (Setup screen) is the outlier at 240 lines, with everything inlined — unlike the other 3 routes, which each extracted page-local UI into `_components/` folders. Concretely: the Grade/Subject/Topic "Fixed" field blocks are 3 near-identical ~15-line JSX blocks differing only in label/value text, and the Difficulty toggle group and Question Type chip group are also fully inlined. This is a real, evidence-based inconsistency relative to the pattern already established elsewhere in the same codebase.

**Mock data placement:** `lib/mock-data.ts` and `lib/types.ts` centralize all mock data — nothing is duplicated into components, which is a good foundation for TASK-005. One forward-looking note (not a current defect): `PracticeConfig.subtopic` is a plain display string matched against a hardcoded array, rather than an ID reference — expected and appropriate for a mock-data-only stage, but will need to become an ID once TASK-005 wires real cascading Subject→Topic→Subtopic selection against the database.

**Styling:** Consistent Tailwind v4 usage throughout, including the custom `font-jakarta` utility everywhere the reference used inline `fontFamily` styles. No leftover CSS Modules (the old `page.module.css` was correctly removed in TASK-001/002).

### Testing / TDD findings — stated honestly

TASK-002's 21 tests (6 files, `tests/unit/` + `tests/integration/`) were written **after** the routes and components were implemented, in the same work session — not via strict RED→GREEN→REFACTOR as `CLAUDE.md` mandates for meaningful UI behavior. The tests themselves are meaningful (they assert observable behavior — form validation, selection state, navigation, redirect guards — not implementation details) and all pass, but the process was implementation-first, not test-first. This should be named plainly rather than described as TDD, per this task's own instruction not to overstate adherence.

### Architecture findings

No over-engineering found: no repository pattern, no unnecessary service layers, no state-management library beyond a single plain React Context (justified by the task's own rules). No under-engineering found: no database access from UI components (none exists yet, correctly — that's TASK-004+), no business logic embedded in presentational components. The one concrete structural issue is the Setup-page inconsistency described above.

### Documentation findings

- `docs/development.md` is referenced by `CLAUDE.md` §5 as an expected doc but does not exist. Low severity, not blocking.
- `CLAUDE.md` §7 still references a stale `D:\my works\ai-bootcamp` path — already tracked in `docs/progress.md`'s "Documentation Follow-up Needed" section from TASK-001; still unresolved, still low severity (doesn't affect actual work, since `docs/project.md`/`docs/architecture.md` are the correct, followed source of truth).

### Database-readiness findings

No `prisma/` folder or `schema.prisma` exists yet — TASK-004 hasn't started, as expected. `docs/database.md` remains the schema source of truth and appears internally consistent with what TASK-002's mock data was aligned to (Question Pattern names, Subtopic name). No blockers identified for starting TASK-004.

---

## Corrective Task

**TASK-003-II created:** `tasks/TASK-003-II-review-and-restructure-existing-implementation.md`

Summary of what it covers: extracting the 3 duplicated/inlined pieces from `app/page.tsx` (`FixedField`, `DifficultyToggle`, `QuestionTypeChips`) into `app/_components/`, matching the pattern already used by the other 3 routes, with test-first unit tests for each extracted piece — closing both the structural-consistency finding and the TDD-honesty finding for the piece being touched. Explicitly scoped to exclude everything else found in this review (uncommitted work, doc gaps, the `subtopic` typing note) since none of those require restructuring.

**TASK-003-II was not executed as part of this task.**

---

## Validation

```text
Tests:  21/21 passing (npm run test) — unchanged, since no application code was touched by this review
Lint:   passing (npm run lint)
Build:  passing (npm run build)
Skill installation verification: .claude/skills/ still contains exactly prisma-cli, prisma-client-api,
        prisma-database-setup; skills-lock.json content hashes match the original TASK-003 installation
        (no drift)
```

No later development task was started.
