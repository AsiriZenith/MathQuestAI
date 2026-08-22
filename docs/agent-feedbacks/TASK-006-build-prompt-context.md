# Agent Feedback — TASK-006: Build Prompt Context and Output Contract

**Date:** 2026-08-21

---

## Prompt Structure

The final prompt has 7 sections, assembled in this order by `buildPrompt`:

```text
COMMON INSTRUCTIONS
GENERATION REQUIREMENT (question count)
EDUCATIONAL CONTEXT (Subject, Subtopic, Question Patterns + per-pattern generation guidance)
DIFFICULTY (level + project-specific guidance text)
QUESTION TYPE (explicit list, or all available types when "auto"/mixed)
REFERENCE QUESTIONS (from the loaded context, or a "none available" note)
OUTPUT FORMAT (the required JSON contract, verbatim)
```

## Example

Using the same context as `tests/unit/prompt-builder.test.ts` (Mathematics / Simplify-Calculate / Hard / Multiple Choice, 5 questions):

```text
COMMON INSTRUCTIONS
-------------------
You are generating mathematics practice questions for a research prototype.
Generate exactly the requested number of questions.
...

GENERATION REQUIREMENT
----------------------
Generate 5 questions.

EDUCATIONAL CONTEXT
-------------------
Subject: Mathematics
Subtopic: Simplify / Calculate

Question Patterns:
- Combine Like Terms
  Generation guidance: Focus on combining like terms across multiple steps.
- Apply Distributive Property

The listed Question Patterns are the allowed generation context. Not every question needs to use every pattern.

DIFFICULTY
----------
Hard

Hard means:
Requires multiple connected steps, a more complex arrangement, or a combination of a few related complexity factors.

QUESTION TYPE
-------------
Multiple Choice

Each generated question should use one of the listed types. Not every type needs to appear in every question.

REFERENCE QUESTIONS
-------------------
These are examples of the expected style and structure. Use them as guidance, not as questions to copy directly.

Example 1 (Combine Like Terms):
Simplify 3x + 5x - 2x.
Explanation: Combine the coefficients of x.

OUTPUT FORMAT
-------------
Return ONLY valid JSON using this exact structure. ...
```

(A live example built from real database data is viewable at `/dev/prompt-preview`.)

## Output Contract

```ts
type AiQuestionType =
  | "multiple_choice" | "fill_in_the_blank" | "word_problem" | "true_false" | "multi_step";

interface GeneratedQuestion {
  questionNumber: number;
  questionText: string;
  questionType: AiQuestionType;
  options?: { id: string; text: string }[]; // required only for multiple_choice
  correctAnswer: string;
  explanation: string;
}

interface GenerationResponse {
  questions: GeneratedQuestion[];
}
```

Example valid JSON:

```json
{
  "questions": [
    {
      "questionNumber": 1,
      "questionText": "What is 3x + 5x?",
      "questionType": "multiple_choice",
      "options": [
        { "id": "A", "text": "8x" },
        { "id": "B", "text": "5x" },
        { "id": "C", "text": "15x" },
        { "id": "D", "text": "2x" }
      ],
      "correctAnswer": "A",
      "explanation": "3x and 5x are like terms, so their coefficients are added."
    }
  ]
}
```

Validated with a `zod` schema (`lib/prompts/schema.ts`): `multiple_choice` requires a non-empty `options` array and a `correctAnswer` matching one of the option ids; other types only need `correctAnswer` as text. `parseGenerationResponse(raw: string)` never throws — malformed JSON and schema violations both return `{ ok: false, error }`.

## UI Binding

Not implemented in this task (no AI call, no UI wiring — that's a later task), but the DTO was designed for it directly: `GeneratedQuestion` already matches the shape `app/questions/_components/question-card.tsx` expects from its current mock `SAMPLE_QUESTIONS` (`lib/mock-data.ts`) — `questionNumber`/`prompt`↔`questionText`/`options`/`correctAnswer` — so wiring real AI output into that component later should mostly be a data-mapping step, not a component rewrite.

## Tests

- **Prompt construction** (`tests/unit/prompt-builder.test.ts`, 12 tests): common instructions present; requested count present; subject/subtopic present; all selected patterns present without implying every pattern is mandatory per question; difficulty guidance matches the selected level; pattern-specific generation prompt included when available; reference questions included; single/multiple/"auto" question-type handling; output-format instructions present; determinism.
- **Output schema validation** (`tests/unit/response-schema.test.ts`, 7 tests): valid `multiple_choice` accepted; valid non-multiple-choice (no `options`) accepted; malformed JSON caught without throwing; missing `questionText` rejected; `correctAnswer` not matching any option id rejected; `multiple_choice` with no `options` rejected; `"null"` input doesn't throw.
- **Determinism**: covered explicitly (same `PromptRequest` twice → identical string), plus implicitly by every other test being pure-function assertions with no time/randomness involved.
- **Total: 59/59 passing** (40 existing + 19 new).

## Validation

```text
Tests: 59/59 passing
Lint:  passing
Build: passing — "/dev/prompt-preview" correctly shows as Dynamic (ƒ)
```

Manual check: loaded `/dev/prompt-preview` via curl (browser extension didn't connect this session, same intermittent issue as before) — confirmed it renders real Subject/Subtopic/Difficulty/Question-Pattern data and a complete, readable final prompt with all 7 sections, built from the live database via TASK-005's `getGenerationContext`.

### AI

```text
AI provider called: NO
```

### Database

```text
Database schema changed: NO
```

## Risky / judgment-call decisions

- **Added `zod` as a new dependency.** Flagged in the plan before implementing (per `CLAUDE.md`'s "document new tech before adding" principle) and approved. It's a small, single-purpose schema-validation library — the de facto standard for this in TS/Next.js projects — not the "large validation framework" the task warned against.
- **`questionTypes: AiQuestionType[] | "auto"`** — the task's own prose examples assume a single Question Type, but the real UI (built in TASK-002/005) already supports multiple selected types or an "auto/mix" toggle. I designed the builder's input to match what the app actually has, not the task's simplified example, since that's the real integration point this will eventually connect to.
- **Kept `/dev/prompt-preview` fully decoupled from the live Setup→Generate session flow** — it independently loads context via query params/defaults rather than reading `PracticeSessionProvider` state, mirroring the `/dev/db-check` precedent. This keeps the task's stated non-goal (no changes to the main Setup/Generate/Questions flow) unambiguous, at the cost of the preview page not reflecting whatever a user just selected in the real form. If you'd rather it show the actual last-submitted selection, that's a small follow-up.
- **`correctAnswer` is a plain string for every question type**, not a per-type discriminated shape (e.g. a boolean for `true_false`). This matches the task's own examples and its explicit instruction not to build a generalized per-type framework prematurely — worth revisiting only if a concrete need for stricter typing per type shows up later.

## Deviations from the task's instructions

None of substance. The builder's `questionTypes` input shape (array-or-"auto" instead of a single type) is a deliberate adaptation to match the existing app, not a deviation from the task's actual requirement (§9: "must be explicitly included, must not be inferred") — that requirement is still fully satisfied.

## Suggestions

- When AI integration is eventually wired up, `buildPrompt`'s `questionCount` currently has no single canonical default in the app — I used `5` in `/dev/prompt-preview` (matching the reference UI's mock question count) but the real Setup form doesn't collect a count yet. Worth deciding where that comes from (a fixed constant vs. a future UI field) before that task starts.
- `/dev/db-check` and `/dev/prompt-preview` are both now sitting under `app/dev/` as manual verification tools. Fine to keep for ongoing debugging, but worth a cleanup pass (or moving them behind a `NODE_ENV` check) before any real deployment.

## Documentation Changes

- `docs/project-management/ai-generation.md` — appended §44 "Implemented Prompt Structure (TASK-006)" documenting what was actually built (not a rewrite of the existing conceptual sections).
- `docs/project-management/progress.md` — updated with this task's summary and the `zod` dependency note.
