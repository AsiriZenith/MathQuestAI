# MathQuestAI — UI Pages, Routes, and Design Decisions

## 1. Purpose

This document records how the Figma-generated UI reference (`D:\my works\MathQuestAI_UI`) was ported to the Next.js application, and the routing/component/state decisions made while doing so (TASK-002).

The reference project remains the visual source of truth for the current design. This document explains how its single-file, router-less prototype was mapped onto real Next.js App Router routes.

---

## 2. Reference → Route Mapping

The reference app (`src/app/App.tsx`) has no real routing — it's a single file with 4 screens switched via a plain `useState<Screen>`. The following routes were designed fresh for the Next.js port:

| Reference Screen | Reference Source | Next.js Route | Next.js Page File | Reusable Components Used |
|---|---|---|---|---|
| Setup | `SetupScreen` | `/` | `app/page.tsx` | `components/layout/*` |
| Loading | `LoadingScreen` | `/generate` | `app/generate/page.tsx` | `components/layout/*`, `app/generate/_components/session-summary-card.tsx` |
| Questions | `QuestionsScreen` | `/questions` | `app/questions/page.tsx` | `components/layout/*`, `components/common/selection-summary.tsx`, `components/common/type-badge.tsx`, `app/questions/_components/*` |
| Evaluation | `EvaluationScreen` | `/evaluation` | `app/evaluation/page.tsx` | `components/layout/*`, `components/common/selection-summary.tsx`, `components/common/pattern-status-indicator.tsx`, `app/evaluation/_components/*` |

`app/layout.tsx` hosts fonts, the `PracticeSessionProvider`, and the shared `ScreenShell` (nav + decorative background), since every reference screen repeats that exact wrapper.

---

## 3. Cross-route state

The reference passes `PracticeConfig` and generated questions via React state local to its single `App` component. Since Next.js routes are separate page components, this is replaced with `PracticeSessionProvider` (`components/providers/practice-session-provider.tsx`) — a plain React Context, mounted once in `app/layout.tsx`, holding `config: PracticeConfig | null` and `questions: GeneratedQuestion[] | null`. Not persisted to storage (in-memory only) — sufficient for this UI-only task.

**Direct navigation without prior state:** `/generate`, `/questions`, and `/evaluation` redirect to `/` (via `router.replace("/")`) if the required session state isn't present, rather than crashing or fabricating data. `/questions` additionally requires `questions` to be set.

---

## 4. Styling

Tailwind CSS v4 (CSS-first, via `@tailwindcss/postcss`), matching the reference's own styling mechanism. Theme tokens (colors, radius) ported from the reference's `src/styles/theme.css` into `app/globals.css`. Dark mode tokens, `--sidebar-*`, and `--chart-*` tokens were dropped — unused by any of the 4 screens.

Fonts: Plus Jakarta Sans and DM Sans, loaded via `next/font/google` (`app/fonts.ts`) instead of the reference's CSS `@import` — the standard Next.js approach for the same visual result. A `font-jakarta` Tailwind utility (from a `--font-jakarta` theme token) replaces the reference's repeated inline `style={{ fontFamily: ... }}`.

---

## 5. Known deviations from the reference

- **Question Pattern selector added beyond the reference (TASK-010).** The reference Setup screen has no Question Pattern field — only Subtopic, Difficulty, and Question Type. TASK-002/TASK-005 initially kept this as-is to match the reference exactly, but TASK-010 determined that omission was a mistake rather than an acceptable deviation: the Setup screen now includes a Question Pattern selection step (loaded from the database per Subtopic, with a loading/empty state, supporting single/multiple/"all" selection) between Subtopic and Difficulty, matching `docs/project-management/requirements.md`'s originally documented flow. See `docs/tasks/TASK-010-self-evaluation-and-issue-fixes.md`.
- **Mock Question Pattern names aligned to real seeded data.** The reference's evaluation mock data used placeholder pattern names ("Direct Equation", "Missing Value", "Multi-step Equation"). These were renamed in `lib/mock-data.ts` to the real seeded Algebra/Simplify-Calculate patterns from `docs/project-management/database.md` (Combine Like Terms, Apply Distributive Property, Simplify Multi-Operation Expressions) for more meaningful mock data.
- **Mock Subtopic list reduced to the one real seeded value** (`Simplify & Calculate`) instead of the reference's three fictional subtopic names. (TASK-011: corrected from the previously-documented `Simplify / Calculate` — that spelling was assumed in TASK-002, before the database layer existed, and never actually matched the live seeded data; the database is the source of truth per §29 of `docs/project-management/database.md`.)
- **`npm run dev` uses the Turbopack default (`next dev`).** It was temporarily pinned to `next dev --webpack` to work around a Turbopack dev-mode PostCSS worker crash (`STATUS_DLL_INIT_FAILED`) on this machine. As of Next.js 16.3.1 that crash no longer reproduces, and the `--webpack` pin was itself breaking styling: webpack's dev pipeline does not run the Tailwind v4 PostCSS plugin over `app/globals.css`, so the served stylesheet contained the raw `@theme inline` / `@apply` source and no generated utility classes, leaving every page unstyled. Do not re-add `--webpack` — if Turbopack dev regresses, fix it another way.

---

## 6. Testing approach

UI behavior tests live under `tests/unit/` and `tests/integration/` using Vitest + React Testing Library — see `docs/project-management/architecture.md` §19/§20 for the general testing philosophy. No e2e framework was introduced for this task; manual visual/navigation validation against the reference (`http://localhost:5173/`) covered that ground instead.
