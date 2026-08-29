# TASK-016 — Verify Database Schema and Create Domain Entities

> Task file: `docs/tasks/TASK-016-update-database-schema-and-domain-entities.md`
> (filename still says "update"; the task content was revised mid-flight to
> "verify" — the DDL had already been run manually by the developer.)

## Summary

Aligned the project's ORM and domain layers with the finalized question-generation
persistence design. **No database changes were made** — the four tables already
existed (developer-run SQL). Work done:

1. **Verified** the live PostgreSQL schema against the finalized design (read-only).
2. **Mapped** the four tables into `prisma/schema.prisma` using the project's
   existing naming conventions (introspection alone produced snake_case model
   names).
3. **Added** TypeScript domain types (`lib/persistence/types.ts`) and validation
   (`lib/persistence/validation.ts`).
4. **Promoted** the question-type codes to a single typed source of truth in
   `lib/types.ts`; added a DB-form `DifficultyLevel` type.
5. **Added** unit tests (`tests/unit/persistence-validation.test.ts`, 31 cases).
6. **Updated** documentation (`database.md` §4/§22/§23/§33/new §35, `progress.md`,
   `README.md`, `CLAUDE.md` §9, `SETUP.md`).

The persistence *workflow* (writing rows) was intentionally **not** implemented —
that is a later task (task §10).

## Database Verification

Method (read-only, from the dev environment, `DATABASE_URL` from `.env.local`):

- `npx prisma db pull --print` (does not write the schema file)
- a one-off script querying `information_schema.columns` and
  `pg_constraint` / `pg_get_constraintdef()` (run, then deleted)

### Result: the database matches the finalized design.

| Table | Verified |
|---|---|
| `generation_contexts` | `id uuid` PK default `gen_random_uuid()`; `name varchar(100)` NOT NULL + UNIQUE `uq_generation_contexts_name`; `difficulty_level varchar(20)` NOT NULL + CHECK `chk_generation_contexts_difficulty` = `IN ('Easy','Medium','Hard')`; `ai_provider varchar(100)` NOT NULL; `ai_model varchar(150)` NOT NULL; `prompt text` NULL; `created_at timestamptz` NOT NULL default `now()` |
| `generation_context_question_types` | `id uuid` PK; `generation_context_id uuid` NOT NULL FK → `generation_contexts.id` (`fk_generation_context_question_types_context`); `question_type varchar(20)` NOT NULL + CHECK `IN ('mc','fib','wp','tf','ms')`; UNIQUE `(generation_context_id, question_type)` |
| `generation_context_question_patterns` | `id uuid` PK; `generation_context_id uuid` NOT NULL FK → `generation_contexts.id`; `question_pattern_id uuid` NOT NULL FK → `question_patterns.id`; UNIQUE `(generation_context_id, question_pattern_id)` |
| `generated_questions` | `id uuid` PK; `generation_context_id uuid` NOT NULL; `question_pattern_id uuid` NOT NULL; `question_type varchar(20)` NOT NULL + CHECK `IN (5 codes)`; `question_number integer` NOT NULL + CHECK `> 0`; `question_text text` NOT NULL; `expected_answer text` NOT NULL; `explanation text` NULL; `created_at timestamptz` NOT NULL default `now()`; UNIQUE `(generation_context_id, question_number)` |

**Composite foreign keys on `generated_questions` (the integrity mechanism) — present:**

- `fk_generated_questions_context_type`: `(generation_context_id, question_type)` → `generation_context_question_types(generation_context_id, question_type)`
- `fk_generated_questions_context_pattern`: `(generation_context_id, question_pattern_id)` → `generation_context_question_patterns(generation_context_id, question_pattern_id)`
- plus `fk_generated_questions_context`: `generation_context_id` → `generation_contexts.id`

### Discrepancies / notes for review

1. **No direct FK `generated_questions.question_pattern_id` → `question_patterns.id`.**
   The task's §2 relationship list implies one, but the live DB enforces the pattern
   link only *transitively* via the composite FK to
   `generation_context_question_patterns` (which itself FKs `question_patterns`).
   This is arguably **better** — it simultaneously guarantees the pattern was
   selected for the context — so I did not flag it as a defect, but it means you
   cannot `JOIN generated_questions → question_patterns` directly in Prisma without
   going through `selectedQuestionPattern`. **Confirm this is intended.**
2. **FKs have no `ON DELETE` / `ON UPDATE` action** (default `NO ACTION`), matching
   every existing table in this schema. Deleting a `generation_contexts` row will
   be blocked while children exist. Fine for now; worth a `CASCADE` decision when
   the delete/cleanup story is designed.
3. `ai_provider` is `varchar(100)` and `ai_model` is `varchar(150)` — the design
   said only "required", didn't specify lengths. No action needed.
4. `name` is `varchar(100)` (design said "required and unique", no length). Fine.

If you want to re-run the verification yourself:

```sql
-- columns
SELECT table_name, column_name, data_type, character_maximum_length, is_nullable, column_default
FROM information_schema.columns
WHERE table_name IN ('generation_contexts','generation_context_question_types',
                     'generation_context_question_patterns','generated_questions')
ORDER BY table_name, ordinal_position;

-- constraints (PK / FK / UNIQUE / CHECK)
SELECT conrelid::regclass AS table_name, conname, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid::regclass::text IN ('generation_contexts','generation_context_question_types',
                                   'generation_context_question_patterns','generated_questions')
ORDER BY conrelid::regclass::text, contype DESC, conname;
```

## Prisma Changes

`prisma/schema.prisma` — four models added below the existing six (all existing
models untouched except one additive back-relation on `QuestionPattern`):

| Prisma model | `@@map` | Notes |
|---|---|---|
| `GenerationContext` | `generation_contexts` | `name @unique`; `prompt String?`; three child back-relations |
| `GenerationContextQuestionType` | `generation_context_question_types` | `@@unique([generationContextId, questionType])` — also the target of a composite FK |
| `GenerationContextQuestionPattern` | `generation_context_question_patterns` | relations to `GenerationContext` and `QuestionPattern`; `@@unique([generationContextId, questionPatternId])` |
| `GeneratedQuestion` | `generated_questions` | `questionNumber Int`; relations `generationContext`, `selectedQuestionType` (composite), `selectedQuestionPattern` (composite); `@@unique([generationContextId, questionNumber])` |

- Conventions matched: PascalCase model + `@@map("snake_plural")`, camelCase fields
  + `@map`, `@db.Uuid`, `@db.VarChar(n)`, `@db.Timestamptz(6)`,
  `@default(dbgenerated("gen_random_uuid()"))`, `@default(now())`, FK relations
  `onDelete: NoAction, onUpdate: NoAction` with explicit `map: "fk_…"` names,
  `@@unique(..., map: "uq_…")`.
- CHECK constraints are not expressible in Prisma — the three affected models carry
  the standard `/// This table contains check constraints …` doc-comment (same as
  the pre-existing `ReferenceQuestion`). A header comment block in the schema lists
  every CHECK by name.
- `QuestionPattern` gained one back-relation field:
  `generationContextQuestionPatterns GenerationContextQuestionPattern[]`. There is
  deliberately **no** `generatedQuestions` back-relation on `QuestionPattern`
  because the DB has no direct FK (see discrepancy #1).
- `npx prisma validate` → valid. `npx prisma generate` → client regenerated
  (`lib/generated/prisma`, gitignored — a fresh clone must run `prisma generate`).

## TypeScript Changes

### New: `lib/persistence/types.ts`

Plain interfaces, no Prisma imports:

- `GenerationContextRecord` — `{ id, name, difficultyLevel: DifficultyLevel, aiProvider, aiModel, prompt?: string | null, createdAt: Date }`
- `GenerationContextQuestionTypeRecord` — `{ id, generationContextId, questionType: QuestionType }`
- `GenerationContextQuestionPatternRecord` — `{ id, generationContextId, questionPatternId }`
- `GeneratedQuestionRecord` — `{ id, generationContextId, questionPatternId, questionType: QuestionType, questionNumber: number, questionText, expectedAnswer, explanation?: string | null, createdAt: Date }`

The `*Record` suffix follows the existing `SubjectRecord` / `TopicRecord` /
`SubtopicRecord` convention **and** resolves two name collisions:
`GenerationContext` (already the prompt-builder's educational context in
`lib/types.ts`) and `GeneratedQuestion` (already a question in the AI response in
`lib/prompts/types.ts`). This keeps task §7's three layers verbally distinct:
`GeneratedQuestion` (AI) → `GeneratedQuestionRecord` (domain/DB). A doc-comment in
the file spells out the field mapping (`correctAnswer` → `expectedAnswer`, pattern
label → resolved `questionPatternId`, etc.). **No mapper function was written** —
deferred per §10.

### New: `lib/persistence/validation.ts`

Hand-written (no Zod — the workflow that might need a schema is deferred):

- `isQuestionType(v: unknown): v is QuestionType`
- `isDifficultyLevel(v: unknown): v is DifficultyLevel`
- `validateGeneratedQuestion(input): { ok: true } | { ok: false; errors: string[] }` —
  mirrors the DB CHECKs: `questionNumber` positive integer; `generationContextId` /
  `questionPatternId` non-empty; `questionType` valid; `questionText` /
  `expectedAnswer` non-empty. Collects all errors, not just the first.

### Changed: `lib/types.ts`

- Renamed the **unused** `RequestedTypeId` union → `QuestionType`, and added a
  runtime tuple `QUESTION_TYPE_CODES = ["mc","fib","wp","tf","ms"] as const` next to
  it (`QuestionType = (typeof QUESTION_TYPE_CODES)[number]`).
- Added `DIFFICULTY_LEVELS = ["Easy","Medium","Hard"] as const` and
  `DifficultyLevel = (typeof DIFFICULTY_LEVELS)[number]` — the **capitalized** DB
  form, distinct from the existing lowercase UI `Difficulty`. A comment points at
  the existing `DIFFICULTY_DB_VALUE` bridge in `lib/db/generation-context.ts`.

### Changed (light): `lib/mock-data.ts`, `learn/06-prompt-construction-system.md`

- `QUESTION_TYPE_OPTIONS` is now typed `{ id: QuestionType; label: string }[]`
  (labels unchanged — "UI labels separate from stable codes" per §6).
- The one prose reference to `RequestedTypeId` in the learn doc was updated to
  `QuestionType`.

## QuestionType Handling

| Layer | Representation | Location |
|---|---|---|
| **Source of truth** | `QUESTION_TYPE_CODES` tuple + `QuestionType` union (`"mc" \| "fib" \| "wp" \| "tf" \| "ms"`) | `lib/types.ts` |
| DB constraint | `question_type varchar(20)` CHECK `IN (mc,fib,wp,tf,ms)` on `generation_context_question_types` and `generated_questions` | PostgreSQL |
| UI chips + labels | `QUESTION_TYPE_OPTIONS` (`{ id: QuestionType, label }`) | `lib/mock-data.ts` |
| UI-code → AI-vocabulary bridge | `QUESTION_TYPE_ID_MAP` (`mc` → `multiple_choice`, …) | `lib/prompts/common.ts` |
| AI request/response | `AiQuestionType` (`"multiple_choice" \| …`) — a **deliberately separate** long-form union | `lib/prompts/types.ts` |
| Persistence domain | `GenerationContextQuestionTypeRecord.questionType: QuestionType`, `GeneratedQuestionRecord.questionType: QuestionType` | `lib/persistence/types.ts` |

No duplicate short-code unions remain — `QuestionType` (codes) and `AiQuestionType`
(long form) are the only two, and they are different layers by design.

`QUESTION_TYPE_ID_MAP` was **kept** as `Record<string, …>` (not tightened to
`Record<QuestionType, …>`): two call sites (`app/generate/page.tsx`,
`lib/evaluation/evaluate-generation.ts`) index it with an unnarrowed `string` from
`PracticeConfig.selectedTypes`, and narrowing them was out of scope for this task.
A comment notes its keys are exactly `QUESTION_TYPE_CODES`.

## Tests

New file `tests/unit/persistence-validation.test.ts` (31 cases, Vitest, written
before the implementation — RED then GREEN):

- `isQuestionType` — accepts `mc/fib/wp/tf/ms`; rejects `"unknown"`,
  `"multiple_choice"`, `"MC"`, `""`, `" mc "`, `null`, `undefined`.
- `isDifficultyLevel` — accepts `Easy/Medium/Hard`; rejects `"easy"`, `"HARD"`,
  `"medium"`, `"Simple"`, `""`, `null`.
- `validateGeneratedQuestion` — happy path; `questionNumber` `0` / `-1` / `1.5` /
  `NaN`; missing `generationContextId`; whitespace `questionPatternId`; invalid
  `questionType`; whitespace `questionText`; empty `expectedAnswer`; a
  fully-invalid input yielding ≥ 5 errors at once.

## Validation

| Check | Result |
|---|---|
| `npx vitest run` | **171 passed** (23 files) — was 140, +31 new |
| `npx tsc --noEmit` | clean |
| `npx eslint .` | clean |
| `npx prisma validate` | valid |
| `npx prisma generate` | client regenerated |
| Live DB constraint inspection | done — see Database Verification |
| grep `GenerationQuestions` | zero hits outside the task file's own "do NOT use" note |
| grep duplicate question-type unions | only `QuestionType` + `AiQuestionType` (intentional) |

No migration / `db push` / `db pull` (file-writing) / DDL was run. The verification
script was created in the repo root, run, and deleted in the same step.

## Issues / Decisions

1. **Feedback file location.** The task says `agent-feedback/TASK-016-feedback.md`;
   every prior feedback file lives in `docs/agent-feedbacks/`. Followed the repo
   convention — this file is at
   `docs/agent-feedbacks/TASK-016-verify-schema-and-domain-entities.md`.
2. **`*Record` naming** (see TypeScript Changes) — chosen over renaming the two
   existing `GenerationContext` / `GeneratedQuestion` types (larger blast radius)
   or a `Persisted*` prefix. Confirmed with the project owner during planning.
3. **No direct `question_pattern_id` → `question_patterns` FK** in the live DB
   (Database Verification, discrepancy #1). Reported, not "fixed". Needs a yes/no
   from the design owner.
4. **`DifficultyLevel` vs `Difficulty`.** Two types now coexist deliberately:
   lowercase `Difficulty` (UI/prompt) and capitalized `DifficultyLevel` (DB/domain).
   The mismatch is a known project quirk (TASK-015). An alternative — normalising
   everything to one casing — was out of scope and risky.
5. **Prisma model names collide with the generated client's TS type names.** Prisma
   generates a type `GenerationContext` in `lib/generated/prisma`. This is harmless
   today because the app never imports Prisma model types (all DB access maps to
   `lib/types.ts` / `lib/persistence/types.ts` shapes), but a future persistence
   module must import the generated types under an alias or via the `Prisma`
   namespace to avoid shadowing.
6. **`QUESTION_TYPE_ID_MAP` left as `Record<string, …>`** — deliberate, to avoid
   touching unrelated call sites (see QuestionType Handling).
7. The task's Expected-Outcome diagram (`AI Response → Domain Types → Prisma Models
   → PostgreSQL`) is now wired at the type level only. The actual data flow
   (mapper + repository + write) is the next task.
