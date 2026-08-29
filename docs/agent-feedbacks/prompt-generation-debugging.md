# Agent Feedback — Prompt Generation Debugging

**Trigger:** Explicit user request (not a numbered task file) — "I want to check the final
generated prompt before passing it to the AI API. I'm not sure it's passing all expected
details."

## What was done

1. Added a console log of the **full final prompt** on the real generation path, in
   `lib/generation/generate-questions.ts`. The existing
   `console.log("generateQuestions: generation started")` was replaced with a block that
   prints the resolved inputs and the exact prompt string, wrapped in delimiters:

   ```
   generateQuestions: generation started
     questionTypes: ["multiple_choice"]
     questionCount: 10
     patterns: Solve linear equations, Expand brackets
   ----- FINAL PROMPT BEGIN -----
   ...the exact string sent to the AI API...
   ----- FINAL PROMPT END -----
   ```

   The logged `prompt` is byte-for-byte what `HttpAiProvider.generate` sends as the single
   `user` message (`lib/ai/http-provider.ts:30`). Nothing is added or transformed between
   this log and the HTTP call.

2. Wrote this guide.

No prompt content, `buildPrompt` logic, or provider code was changed.

## Where the output appears

`generateQuestionsAction` is a server action (`lib/actions/generation.ts`,
`"use server"`), so `generateQuestions` runs **on the server**. The log prints in the
terminal running `npm run dev` — **not** the browser console / DevTools.

## The prompt pipeline

| Stage | File | Notes |
|---|---|---|
| User selections (subject, subtopic, difficulty, patterns, types, count) | `app/generate/page.tsx` (~L54–76 `useEffect`) | Fires once on mount; types mapped via `QUESTION_TYPE_ID_MAP` |
| Server action | `lib/actions/generation.ts` — `generateQuestionsAction` | Null-guards context, calls `generateQuestions` |
| Load context from DB | `lib/db/generation-context.ts` — `getGenerationContext` | Prisma: `questionPattern`, `questionGenerationRequest` (per-difficulty `generationPrompt`), `referenceQuestion` (per-difficulty) |
| Orchestration | `lib/generation/generate-questions.ts` — `generateQuestions` | **New prompt log lives here**, right after `buildPrompt` |
| Prompt assembly | `lib/prompts/builder.ts` — `buildPrompt` | 7 sections joined by `\n\n` |
| Static prompt text | `lib/prompts/common.ts` | `COMMON_INSTRUCTIONS`, `DIFFICULTY_GUIDANCE`, `OUTPUT_FORMAT_INSTRUCTIONS`, question-type label map |
| HTTP call | `lib/ai/http-provider.ts` | `messages: [{ role: "user", content: prompt }]`, `response_format: json_object` |

## The 7 sections `buildPrompt` must emit (in order)

1. **COMMON INSTRUCTIONS** — from `COMMON_INSTRUCTIONS`.
2. **GENERATION REQUIREMENT** — `Generate <N> questions.` (`N` = `DEFAULT_QUESTION_COUNT`, currently 10).
3. **EDUCATIONAL CONTEXT** — `Subject:`, `Subtopic:`, then a `- <pattern name>` line per
   pattern, each optionally followed by `  Generation guidance: <generationPrompt>`.
4. **DIFFICULTY** — the capitalized difficulty + `DIFFICULTY_GUIDANCE[difficulty]`.
5. **QUESTION TYPE** — the selected type labels, or the full "varied mix" list when `auto`.
6. **REFERENCE QUESTIONS** — `Example N (<pattern>):` blocks from
   `pattern.referenceQuestions`, or `No reference questions are available for this context.`
7. **OUTPUT FORMAT** — from `OUTPUT_FORMAT_INSTRUCTIONS` (includes the `questionPattern` field requirement).

## Method 1 — read the prompt from a real run (new console log)

1. `npm run dev`
2. Go through `/setup` → `/generate` and start a generation.
3. In the dev-server terminal, find the `----- FINAL PROMPT BEGIN -----` /
   `----- FINAL PROMPT END -----` block.
4. Check each of the 7 sections above is present **and populated**.

Common gaps to look for:

- **`Generation guidance:` line missing** under a pattern → that pattern's
  `questionGenerationRequest.generationPrompt` for the selected difficulty is empty/absent
  in the DB.
- **`No reference questions are available for this context.`** → no `referenceQuestion`
  rows for those patterns at the selected difficulty.
- **Wrong difficulty text** in the DIFFICULTY section → selection not propagated; compare
  the `patterns:`/inputs line in the log with what you picked.
- **Question types not listed / says "varied mix" unexpectedly** → `questionTypes`
  resolved to `"auto"`; check the mapping in `app/generate/page.tsx`.

## Method 2 — dev preview page (no AI call)

`/dev/prompt-preview?difficulty=medium&questionType=multiple_choice&count=5&subtopicId=<id>`

Renders three blocks: **Selected Context**, **Loaded Generation Context** (the exact
object `getGenerationContext` returned — inspect this to see what the DB actually
provided), and **Final Prompt**.

Caveat: this page hard-codes Subject/Subtopic to **Mathematics / Algebra**
(`app/dev/prompt-preview/page.tsx:39`) and uses its own query params, so it is a
structural check, not a reproduction of a specific `/generate` run. Use Method 1 for the
exact prompt of a real run.

## Method 3 — unit tests

- `tests/unit/prompt-builder.test.ts` — 13 cases over `buildPrompt` (each section,
  determinism, auto vs explicit types).
- `tests/unit/generation-context.test.ts` — DB → `GenerationContext` assembly.

Run: `npm test -- prompt-builder generation-context`

When you find a detail that should be in the prompt but isn't, add a failing case here
first, then fix.

## Diagnosing a missing detail

- Section **absent** from `buildPrompt` output → bug in `lib/prompts/builder.ts`.
- Section **present but empty/placeholder** → the data is missing upstream: check the
  "Loaded Generation Context" block (Method 2) or the DB seed. `buildPrompt` only renders
  what `getGenerationContext` gives it.
- Detail present in context but not in prompt → `buildPrompt` isn't reading that field.

## Notes / decisions

- The log is **unconditional**, matching the existing logging style in the same file
  (CLAUDE.md §23 — simplicity). If it becomes noisy, wrap it in
  `if (process.env.DEBUG_PROMPT === "1")`. Not wired up now.
- Existing tests don't assert on stdout, so the extra log doesn't break them.
- Per CLAUDE.md §13: if the prompt turns out to be complete but the generated questions
  are still poor, iterate on context/reference/prompt **text**, not on application logic.

## Action needed from the developer

- None required. Optionally decide whether to keep the log unconditional or gate it behind
  `DEBUG_PROMPT` before this reaches any shared/deployed environment.
