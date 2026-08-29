# ANALYSIS-002 — Investigate Save Generated Questions Failure

This is the completed investigation for `docs/analyze/ANALYSIS-002-save-generated-questions-investigation.md`. **Analysis only — no code, schema, test, or UI changes were made.** No bug-fix task has been created, per the source document's own instructions.

**Finding, up front: this is Case B — no bug, logging only.** The investigation found a `generation_contexts` row in the live database that exactly matches the reported reproduction config (pattern id `bc078865-0652-4ff9-86ba-32e475cfde66`, "Formula-Based Substitution", Easy, `mc`, `requestedQuestionCount: 10`) with all 10 `generated_questions` correctly and completely persisted. This is direct, conclusive evidence the save succeeded — not an inference from reading code. The "not stringified" log lines were also traced to their exact source (`safe-stable-stringify`, bundled inside Next.js's dev-mode server-action argument logger) and confirmed to be console-truncation formatting, unrelated to persistence.

## 1. What the supplied log actually means

```
POST /questions 200 in 187ms (next.js: 11ms, application-code: 176ms)
  └─ ƒ saveGenerationAction({...}) in 157ms lib/actions/save-generation.
"5 items not stringified"
"1 item not stringified"
```

- The `POST /questions 200` + `ƒ saveGenerationAction(...) in 157ms` lines are Next.js's dev-mode Server Action instrumentation — a normal, successful invocation trace, not an error report. A 200 here only means the RPC round-trip completed without throwing; `saveGenerationAction` itself never throws (every failure path returns `{ ok: false, error }`), so this line alone cannot distinguish success from a handled failure — that's why the database check below (§7) was necessary and decisive, not the log by itself.
- **"N item(s) not stringified" is traced to source**: it comes from the `safe-stable-stringify` package bundled inside `node_modules/next/dist/compiled/safe-stable-stringify/index.js`, which Next's dev server-action logger uses to pretty-print the action's arguments for the terminal. That library takes a `maximumBreadth` option and, when an array has more entries than the breadth limit, truncates it and appends a literal `"... N not stringified"` placeholder string for the remainder — confirmed by reading the exact source line that constructs this string. `saveGenerationAction`'s argument object contains `generationResponse.questions` (10 items, per the reproduction config) and `generationContext.patterns` (nested arrays too) — exactly the kind of payload this breadth-limiting exists for. **This is a console-formatting artifact of logging a moderately large object, not an application-level or database-level error, and not something that indicates any data was dropped from what was actually saved** (the truncation is display-only; the real object passed to the action was not modified).

## 2. Complete save flow (as implemented today)

```
Questions Page → "Save for Evaluation" button
    → SaveForEvaluationDialog (app/questions/_components/save-for-evaluation-dialog.tsx)
        confirm → "saving" phase (button disabled, inFlight-ref guards double-submit)
    → saveGenerationAction(input) (lib/actions/save-generation.ts, "use server")
        null-checks config/generationContext/generationResponse/generationMeta
        → saveGeneration({ generationContext, config, aiResponse, prompt, requestedQuestionCount })
            (lib/persistence/save-generation.ts)
          → mapGeneration(...) (lib/persistence/map-generation.ts) — PURE, no I/O
              resolves selected type codes + selected pattern ids
              validates every AI question's questionType/questionPatternId is
                among the current selection (no name-based resolution — TASK-019)
              maps correctAnswer → expectedAnswer
              on any problem: returns { ok:false, errors } — NOTHING is written
          → on success: one interactive prisma.$transaction:
              generation_contexts.create (name, difficultyLevel, aiProvider, aiModel,
                prompt, createdAt, requestedQuestionCount, grade)
              → generation_context_question_types.createMany
              → generation_context_question_patterns.createMany
              → generated_questions.createMany
              (order satisfies the two composite FKs on generated_questions)
          → on any transaction failure: catch, console.error the real error server-side,
              return a generic { ok:false, reason:"save-failed", error }
    → saveGenerationAction maps ANY failure (format-mismatch or save-failed) to one
        generic client-facing message; success returns { ok:true, generationContextId }
    → dialog: on ok:true, onSaved(id) → Questions page stores savedGenerationContextId,
        shows the "Saved for evaluation" success state; on ok:false, shows the generic
        error inline with a "Try Again" button, questions remain visible/unchanged
```

Every layer was read from the current source (not assumed) — `lib/actions/save-generation.ts`, `lib/persistence/save-generation.ts`, `lib/persistence/map-generation.ts`, `lib/persistence/validation.ts`, `app/questions/_components/save-for-evaluation-dialog.tsx`.

**Important structural fact discovered while tracing this**: the exact same classification check ("is this question's type/pattern id one of the current selection?") already runs once **at generation time**, before the user ever reaches the Questions page — `lib/generation/generate-questions.ts` calls `validateClassification()` right after parsing the AI response, and generation itself fails at `stage: "validation"` if it doesn't pass. So by construction, any `generationResponse` the user can see on the Questions page has *already* passed this exact check once. `mapGeneration()`'s re-check at save time is deliberate defense-in-depth (documented as such in its own comments), not the primary gate — and both checks derive "the current selection" from the same `config`/`generationContext` session objects, which don't change between `/generate` and `/questions` (no re-selection UI in between). This makes a *classification*-driven `format-mismatch` at save time — while generation itself succeeded — structurally very unlikely under normal use.

## 3. Actual failure / reproduction result

**No live code execution was performed** (a scripted call to `saveGeneration()` would write a new row to the live database — a mutation outside this analysis's read-only scope, so it wasn't done). Instead, the *existing* database was inspected read-only for a record matching the reported reproduction config, since one was highly likely to already exist from the user's own testing.

**A matching record was found and is fully intact:**

```
generation_contexts:
  id: b4041a04-c21d-456c-bbc3-fe6b9d913486
  name: Generation-2026-08-29-11-35-34-996
  difficultyLevel: Easy
  requestedQuestionCount: 10
  score: null                      (expected — not evaluated yet, unrelated to save)
  questionPatterns: [ { id: bc078865-0652-4ff9-86ba-32e475cfde66, name: "Formula-Based Substitution" } ]
  questionTypes: [ { questionType: "mc" } ]
  generatedQuestions count: 10     (== requestedQuestionCount — a complete save, not partial)
```

All 10 `generated_questions` rows were individually inspected:

- `questionNumber` 1 through 10, no gaps, no duplicates (matches the `UNIQUE (generation_context_id, question_number)` constraint working as intended).
- Every row's `questionPatternId` is exactly `bc078865-0652-4ff9-86ba-32e475cfde66` — the same UUID the reported prompt log showed.
- Every row's `questionType` is `"mc"`, matching the selected type.
- Every `questionText`/`expectedAnswer`/`explanation` is non-empty and internally consistent (each question's explanation correctly derives its `expectedAnswer` from its own text — e.g. "A = 8 × 5 = 40" → answer "A" matches a 40 option in that question's own generated content).

This is a complete, correctly-mapped, successfully-committed save — not a partial save, not a corrupted record, not a mismatched id.

## 4. Root cause

**No bug exists in the code responsible for the reported log.** There is nothing to root-cause: the save that produced this log succeeded completely, and the log lines that looked alarming are explained precisely by Next.js's own dev-console argument-truncation behavior (§1), confirmed at the source-code level, not inferred.

## 5. Question Pattern ID verification

Traced the full path end to end:

- **Prompt construction** (`lib/prompts/builder.ts`, via the SELECTED QUESTION PATTERNS section): gives the AI the pattern's real database id + name, and instructs it to return that exact id verbatim as `questionPatternId`.
- **AI response schema** (`lib/prompts/schema.ts`): `questionPatternId: z.string().trim().min(1)` is **required** on every question — a response missing it fails Zod validation before anything else happens (`parseGenerationResponse` returns `ok:false`, generation fails at `stage: "validation"`, the user never sees such a response).
- **Classification check** (`lib/prompts/validate-classification.ts`, called from `generateQuestions()`): confirms `questionPatternId` is a member of the *currently selected* pattern id set — id-based, never name-based.
- **Save-time mapping** (`lib/persistence/map-generation.ts`): re-derives the selected pattern id set (`resolveSelectedPatternIds`) and re-checks membership; the AI's `questionPatternId` is passed through **verbatim** to `MappedGeneratedQuestion.questionPatternId` — there is no name→id resolution step anywhere in this codebase (confirmed by reading every step; TASK-019 removed the last of it).
- **Confirmed absence of the old `questionPattern` name property**: read the current AI-response types (`lib/prompts/types.ts`) and the Zod schema (`lib/prompts/schema.ts`) — neither has a `questionPattern` (name) field; both only have `questionPatternId`.
- **Confirmed the UUID exists in `question_patterns`**: `bc078865-0652-4ff9-86ba-32e475cfde66` is a real row, name "Formula-Based Substitution", under subtopic "Substitute and Evaluate" → topic "Algebra" → subject "Mathematics" — verified with a direct, read-only database query, not assumed from the log text alone.
- **Confirmed the persisted rows use this exact id**: all 10 `generated_questions.questionPatternId` values for the matching context equal this UUID exactly (§3).

No mismatch found at any layer.

## 6. Question Type verification

- `QUESTION_TYPE_CODES = ["mc","fib","wp","tf","ms"]` (`lib/types.ts`) is the single source of truth, used identically by the Zod schema (`z.enum(QUESTION_TYPE_CODES)`), `isQuestionType()` (`lib/persistence/validation.ts`), the frontend's `QUESTION_TYPE_OPTIONS` (`lib/mock-data.ts`, derived from the same `QUESTION_TYPE_CODES`), and the database CHECK constraints (below) — one shared set of codes throughout, no parallel/competing definition found.
- Confirmed via direct, read-only `pg_constraint` inspection: **there is no `question_types` table** (matches the source document's own instruction not to invent one) — `question_type` is a plain `varchar(20)` column on both `generation_context_question_types` and `generated_questions`, each independently constrained by a `CHECK (question_type IN ('mc','fib','wp','tf','ms'))`. `generated_questions` additionally has a **composite foreign key** `(generation_context_id, question_type) → generation_context_question_types(generation_context_id, question_type)` — a generated question's type must already be one of that context's *selected* types, enforced by Postgres itself, not just application code.
- The matching record's persisted `questionType` is `"mc"` on every row, matching the selection.

No mismatch found.

## 7. Database verification

Performed read-only (no writes, no schema/data changes):

- `question_patterns` row for `bc078865-0652-4ff9-86ba-32e475cfde66` exists and matches the reported name/subtopic exactly (§3).
- The 3 most recent `generation_contexts` rows were inspected; the one matching the reported repro config has `_count.generatedQuestions === requestedQuestionCount` (10 === 10) — a complete save.
- All 10 `generated_questions` rows for that context were individually inspected field-by-field (§3) — no `null`/`undefined`/malformed values in any required field.
- Direct `pg_constraint` queries against `generation_contexts`, `generated_questions`, `generation_context_question_types`, `generation_context_question_patterns`, and `question_patterns` confirm the constraints described in §5/§6 are real (not assumed from schema comments — this matters because an earlier, unrelated task in this project's history found a schema-comment claim about a constraint that turned out not to actually exist in the database; this analysis re-verified everything relevant directly rather than trusting prior documentation).

## 8. Error handling verification

- `mapGeneration()` failures (`format-mismatch`): collected into an `errors: string[]`, logged server-side via `console.error("saveGeneration: format mismatch, nothing persisted", mapped.errors)`, **nothing is written to the database** in this case (checked before the transaction opens) — not a partial save, a zero save.
- Transaction failures (`save-failed`): caught, logged server-side via `console.error("saveGeneration: persistence failed", error)` with the **real** Prisma/Postgres error object, then converted to one generic message (`"The generated questions could not be saved. Please try again."`) before returning — the real error is deliberately not sent to the client (matches this project's established "never leak provider/DB internals" convention, consistent with every other persistence function in this codebase), but it **is** preserved in the server log, not silently swallowed.
- `saveGenerationAction` collapses both failure reasons to one even-more-generic client message (`"We couldn't save the questions for evaluation. Please try again."`) — by design, not a bug: the distinction between "nothing was ever written" and "a write failed partway" is not surfaced to the end user, only to server logs.
- Since a Prisma `$transaction` is used for every actual write, a failure partway through the four inserts rolls back the **entire** batch — Postgres guarantees no partial `generation_contexts`-without-`generated_questions` (or similar) state can persist from a single failed attempt. This was not modified or tested live in this analysis, per the source document's own "do not change transaction behavior" instruction — this is a description of the existing, already-implemented behavior, read directly from the code.
- Client-side (`SaveForEvaluationDialog`): the generic error is displayed via `role="alert"`, the confirm button becomes "Try Again", the dialog stays open, and the already-generated questions remain visible on the page — no fake success state is ever shown on failure, and the "in-flight" ref prevents a double-submit race.

No evidence of an error being silently dropped anywhere in this chain — every failure path either logs (server) or displays (client) something, even though the *specific* database error text is deliberately not shown to the end user.

## 9. Recommended fix

**None required.** No bug was found. No code, schema, or configuration change is recommended by this analysis.

## 10. Minimum tests needed for the eventual fix

Not applicable — there is no fix to test. For completeness: this exact scenario (single explicit pattern, single explicit type `mc`, 10 requested/10 generated, real AI-shaped response) is already within the shape covered by the existing `tests/unit/map-generation.test.ts` and `tests/unit/save-generation.test.ts` suites (both currently pass), which is further corroborating evidence that this code path is exercised and correct.

## 11. Final recommendation

```
NO BUG — LOGGING ONLY
```

The `"N item(s) not stringified"` log lines are Next.js's dev-mode server-action argument pretty-printer truncating a moderately large argument object (10 generated questions + nested pattern data) for terminal display — traced to the exact library and code path responsible (`safe-stable-stringify`, bundled in `next/dist/compiled`). They carry no information about save success or failure. A live database record matching the reported reproduction configuration exactly was found, fully and correctly persisted (all 10 questions, correct pattern id, correct type, no gaps, no malformed fields) — direct, conclusive evidence the save succeeded, not an inference. No application or database error was found at any traced layer (prompt → AI response contract → classification → mapping → transaction → client handling), and the relevant database constraints were independently re-verified rather than assumed from prior documentation.
