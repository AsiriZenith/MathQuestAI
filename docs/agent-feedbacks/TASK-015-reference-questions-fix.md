# Agent Feedback — TASK-015: Fix Reference Questions Missing from Final AI Prompt

## A. Why were the reference questions empty?

```text
Database (has the 5 rows)
        ↓
Prisma query            ← problem: difficulty filter never matched
        ↓
GenerationContext       (referenceQuestions: [] for every pattern)
        ↓
Prompt Builder          (emits the "No reference questions..." fallback)
        ↓
Final Prompt
```

**Root cause: a difficulty-value casing mismatch at the query boundary.**

- `reference_questions.difficulty_level` and `question_generation_requests.difficulty_level`
  are plain `VARCHAR(20)` free-text columns (no enum, no FK). The seeded rows store the
  **capitalized** form: `Easy` / `Medium` / `Hard`.
- The application's `Difficulty` type (`lib/types.ts:7`) is **lowercase**:
  `"easy" | "medium" | "hard"`. The `/setup` difficulty toggle emits the lowercase id,
  and it flows unchanged into `getGenerationContext`.
- `lib/db/generation-context.ts` filtered both tables with
  `where: { ..., difficultyLevel: input.difficulty }` — an exact, case-sensitive match.
  `"medium" !== "Medium"`, so **both** queries returned 0 rows.
- Result: `pattern.referenceQuestions` was `[]` → `buildReferenceQuestionsSection`
  (`lib/prompts/builder.ts:49-50`) emitted `No reference questions are available for this
  context.` The **same bug also silently dropped every `generationPrompt`** — the
  `Generation guidance:` line under each pattern in the EDUCATIONAL CONTEXT section was
  missing for the same reason.

Everything else in the path was sound: pattern IDs are re-scoped to the subtopic, empty
pattern sets raise visible errors, and `ReferenceQuestion.questionPatternId` is a real FK.
The only broken link was the difficulty string comparison.

Why it was never caught: `tests/unit/generation-context.test.ts` mocks Prisma and never
asserted the `difficultyLevel` value passed to the queries; the integration test only
used `"easy"` and never asserted `referenceQuestions.length > 0`.

## B. Was the issue fixed?

```text
Fixed: Yes
```

## C. How was it fixed?

**Files changed:**

- `lib/db/generation-context.ts`
  - Added `DIFFICULTY_DB_VALUE: Record<Difficulty, string>` mapping
    `easy→"Easy"`, `medium→"Medium"`, `hard→"Hard"`.
  - Both the `questionGenerationRequest.findMany` and `referenceQuestion.findMany`
    queries now filter on `difficultyLevel: DIFFICULTY_DB_VALUE[input.difficulty]`
    (via a shared local `const difficultyLevel`).
- `tests/unit/generation-context.test.ts`
  - New test: asserts both `findMany` calls receive `difficultyLevel: "Medium"` when the
    input difficulty is `"medium"` (RED before the fix).
  - Extended the existing "assembles a context…" test to return **5** reference rows and
    assert `patternA.referenceQuestions` has length 5 (mirrors the TASK-015 scenario).
- `docs/project-management/database.md` §9 — added a "Stored representation" note
  documenting the capitalized DB form and the app-side normalization.

**Why this addresses the root cause:** the fix makes the application send the exact string
the database stores, at the single point where the two representations meet. The internal
lowercase `Difficulty` type is unchanged, so `DIFFICULTY_GUIDANCE` keys, the difficulty
toggle, `lib/mock-data.ts`, and the evaluation dimensions are untouched (TASK-015 §7). No
hard-coded questions, no removed fallback — reference questions are still loaded
dynamically from PostgreSQL.

**Considered and rejected:** a global rename of `Difficulty` to capitalized values (large
ripple, unrelated-behavior risk); `mode: "insensitive"` (looser than needed and does not
address whitespace/wording drift — can be added later if the seed data proves inconsistent).

## D. Verification

- `npx vitest run` — **140 passed (22 files)**. The new assertion fails on the pre-fix
  code and passes after.
- `npx tsc --noEmit` — clean.
- `npx eslint` on the changed files — clean.
- Real generation run (developer to confirm, see Definition of Done): with the debug log
  added in the previous task (`lib/generation/generate-questions.ts`), a Medium generation
  for a pattern with 5 reference questions should now print a populated
  `REFERENCE QUESTIONS` section (`Example 1..5 (<pattern>):`) and a `Generation guidance:`
  line, between `----- FINAL PROMPT BEGIN/END -----` in the `npm run dev` terminal.
- Empty-reference fallback: unchanged code path in `buildReferenceQuestionsSection`; a
  pattern/difficulty with genuinely no rows still yields
  `No reference questions are available for this context.`

**Remaining limitations:** the fix assumes the DB consistently uses `Easy`/`Medium`/`Hard`.
The developer confirmed `SELECT DISTINCT difficulty_level` returns exactly those three
values. If rows are later added with a different spelling or casing, the exact-match filter
will miss them again — consider a DB `CHECK` constraint or `mode: "insensitive"` if that
becomes a risk.

## E. Database Finding

The developer manually verified that the selected Question Pattern has **5 reference
questions for the selected difficulty level** in PostgreSQL, and that
`SELECT DISTINCT difficulty_level FROM reference_questions` returns `Easy`, `Medium`,
`Hard` (capitalized). This confirms the original problem was **not** missing database
data — the data was present and correct; the application was querying it with the wrong
string.

## Deviations from the task file

- The task says to create `agent-feedback/TASK-015-reference-questions-fix.md`; the
  established folder in this repo is `docs/agent-feedbacks/`, so the file is there.
- The fix normalizes at the query boundary rather than "renaming the application side"
  to capitalized values. The user approved this in planning (a global rename would touch
  many unrelated modules). If it turns out not to resolve the symptom in a real run, the
  user asked to fall back to another approach.
