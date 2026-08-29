# MathQuestAI — Implementation Learning Plan

## Why this exists

You built MathQuestAI through AI-assisted development sessions. You know what it does — the research loop, the difficulty levels, the generate/evaluate flow — but not necessarily how it's actually wired together in code. This plan is a curriculum for closing that gap: reading the real implementation, subsystem by subsystem, with your own experience as a developer doing the heavy lifting and only the Next.js-specific and project-specific parts explained in depth.

This is not a rehash of `docs/project-management/*`. Those files describe *intent and design*. These lessons walk the *actual code* that realizes that intent — file by file, with the "why" pulled from the docs and from `docs/tasks/` / `docs/agent-feedbacks/` where the design shifted during implementation.

## How to use this

- Lessons live in `/learn/` as `01-<name>.md`, `02-<name>.md`, etc. Read them in order — later lessons assume earlier ones.
- Each lesson follows the same shape: **Concept** (what you need to know, Next.js/project-specific only) → **Code Walkthrough** (real files, real snippets, in the order you'd actually trace them) → **Checkpoint** (a handful of self-check questions — no answer key; if you can't answer confidently, re-read that section).
- Lessons are scoped to *meaningful subsystems*, not micro-topics — e.g. "Database Design & Prisma" is one lesson including transactions, not split into three.
- Lessons are written one at a time, on request, so they can reflect anything you flag while working through the previous one. Ask for the next lesson when you're ready.
- Check off lessons as you finish them in the checklist below — that's the only piece of state this plan tracks.

## Prerequisite knowledge assumed

You have 5+ years of general development experience. These lessons will **not** explain: git, TypeScript basics, REST/HTTP fundamentals, SQL fundamentals, general React concepts (components, props, hooks), or general testing concepts. They **will** explain: Next.js App Router conventions, Server Actions, Prisma's driver-adapter setup, and every project-specific architectural decision.

---

## Curriculum

### Lesson 1 — Project Orientation & Research Goal
What MathQuestAI is actually for: the generate → evaluate → improve research loop, why the app is *not* primarily a question-generator product but a controlled experiment platform, and why that shapes scope decisions (no auth, no persistence of generated questions, etc.). A map of `docs/project-management/*` so you know where to look when a lesson references design intent, and a tour of the repo's top-level folders (`app/`, `components/`, `lib/`, `prisma/`, `tests/`, `docs/`) so the rest of the lessons have a shared mental map to point into.

### Lesson 2 — Next.js App Router Essentials
The Next.js-specific knowledge you need before any of the following lessons make sense: how routing works via folders under `app/` (`page.tsx`, `layout.tsx`, route segments), the server-component-by-default model and when/why a component opts into `"use client"`, and **Server Actions** — the mechanism this app uses instead of hand-written API routes to call server code from the UI. Grounded in `app/page.tsx`, `app/layout.tsx`, and the four route folders (`generate/`, `questions/`, `evaluation/`, plus the `dev/` inspection routes).

### Lesson 3 — Database Design & Prisma (including transactions)
The schema: `Subject → Topic → Subtopic → QuestionPattern → ReferenceQuestion` and the separate `QuestionGenerationRequest` (keyed by pattern + difficulty), read straight from `prisma/schema.prisma`, plus *why* it's shaped this way (from `docs/project-management/database.md` — including the deliberate omissions: no users, no persisted generations, no evaluation history). How Prisma is wired up in this project specifically: the `PrismaPg` driver adapter, the `lib/prisma.ts` client singleton, and where/how you'd use a Prisma transaction (`$transaction`) if a feature here needed one, since none of the current code paths do multi-step writes.

### Lesson 4 — Data Access Layer
How domain data actually gets from PostgreSQL into the app: `lib/db/education.ts` (Subject/Topic/Subtopic/QuestionPattern lookups) and `lib/db/generation-context.ts` (`getGenerationContext` — the function that assembles everything a prompt needs: pattern, difficulty, reference questions, instructions). This is the layer that turns raw Prisma queries into the shape the rest of the app consumes.

### Lesson 5 — Application State & UI Flow Across Routes
Since there's no backend session/auth (by deliberate scope decision), how does the app remember what you selected on the Setup screen once you navigate to `/generate`? Covers `components/providers/practice-session-provider.tsx` (in-memory React context spanning routes) and how the Setup → Generate → Questions → Evaluation screens hand state to each other. Also where the extracted Setup-screen components live (`app/_components/`) and how they compose the selection UI.

### Lesson 6 — Prompt Construction System
The research core of the project. `lib/prompts/builder.ts` (`buildPrompt`), `lib/prompts/common.ts` (common instructions + difficulty-specific guidance + question-type mapping), `lib/prompts/types.ts`, and `lib/prompts/schema.ts` (the zod schema that validates the AI's JSON response). Walks through the actual 7-section prompt structure this produces, and ties back to `docs/project-management/ai-generation.md` for why each section exists.

### Lesson 7 — AI Provider Integration
`lib/ai/provider.ts` (the provider-agnostic interface), `lib/ai/http-provider.ts` (`HttpAiProvider` — a hand-rolled OpenAI-compatible HTTP client, not a vendor SDK), and `lib/ai/config.ts` (env-driven model/base-URL/key configuration). Covers *why* there's no AI vendor SDK dependency, and the history of the provider swap from a Gemini-SDK-based implementation to this configurable HTTP approach (tie-in: `docs/tasks/TASK-012*`), so you understand the interface was deliberately kept swappable.

### Lesson 8 — Generation Orchestration & Server Actions
How Lessons 4, 6, and 7 get chained together: `lib/generation/generate-questions.ts` (`generateQuestions()` — context → prompt → AI call → validated response) and `lib/actions/{setup,generation,evaluation}.ts`, the Server Actions that act as the glue between the UI (Lesson 5's screens) and this pipeline. By the end of this lesson you should be able to trace a click on "Generate" all the way to a validated AI response.

### Lesson 9 — Evaluation System (scoring engine + UI)
The deterministic (no-LLM-judge, by deliberate design per project scope) evaluation engine: `lib/evaluation/evaluate-generation.ts` and the six dimension scorers under `lib/evaluation/dimensions/` (pattern adherence, difficulty proxy, reference alignment, type adherence, count adherence, output integrity), plus supporting modules (`text-metrics.ts`, `improvements.ts`, `export.ts`). Then the UI that renders these scores: `app/evaluation/_components/*` (prompt inspector, deviation table, score breakdown, coverage card, requirement matrix, export actions).

### Lesson 10 — Testing Strategy & TDD in Practice
How the project's stated TDD approach actually shows up in the test suite: the split between `tests/unit/` and `tests/integration/`, the Vitest + React Testing Library setup (`vitest.config.ts`, `tests/setup.ts`, the `server-only` stub), and specifically how the AI provider is mocked so generation/evaluation tests stay deterministic and don't depend on a live API call.

### Lesson 11 — Project Evolution & Decision History
A guided read of `docs/tasks/TASK-*.md`, `docs/agent-feedbacks/TASK-*.md`, and `docs/project-management/progress.md` — not to re-learn what you already lived through, but to practice using the project's own paper trail to answer "why is this built this way?" instead of guessing. Covers a few concrete examples already surfaced in earlier lessons (the AI provider swap, the Question Pattern selector being removed then restored, naming-bug fixes) so you see the pattern of how to mine this history yourself going forward.

### Lesson 12 — Capstone: End-to-End Trace
Using the `app/dev/*` inspection routes (`db-check`, `prompt-preview`, `ai-provider-check`, `generate-questions-check`) as instrumented checkpoints, trace one real request start to finish: a Setup-screen selection → context loading (Lesson 4) → prompt build (Lesson 6) → AI call (Lesson 7) → orchestration (Lesson 8) → rendered questions (Lesson 5) → evaluation scoring (Lesson 9). This lesson doesn't introduce new code — it's the synthesis exercise that proves the previous 11 connected.

---

## Progress checklist

- [x] Lesson 1 — Project Orientation & Research Goal
- [x] Lesson 2 — Next.js App Router Essentials
- [x] Lesson 3 — Database Design & Prisma (including transactions)
- [x] Lesson 4 — Data Access Layer
- [x] Lesson 5 — Application State & UI Flow Across Routes
- [x] Lesson 6 — Prompt Construction System
- [x] Lesson 7 — AI Provider Integration
- [x] Lesson 8 — Generation Orchestration & Server Actions
- [x] Lesson 9 — Evaluation System (scoring engine + UI)
- [x] Lesson 10 — Testing Strategy & TDD in Practice
- [x] Lesson 11 — Project Evolution & Decision History
- [x] Lesson 12 — Capstone: End-to-End Trace
