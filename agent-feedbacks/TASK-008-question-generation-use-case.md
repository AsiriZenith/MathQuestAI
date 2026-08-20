# Agent Feedback — TASK-008: Question Generation Use Case

**Date:** 2026-08-21

---

## Files created/modified

- New: `lib/generation/generate-questions.ts` (the use case), `tests/unit/generate-questions.test.ts` (6 tests), `app/dev/generate-questions-check/page.tsx` (real verification route).
- Modified: `docs/progress.md`.
- Nothing else — no Setup/Generate/Questions/Evaluation UI files touched, no schema changes, no new dependencies (uses only what TASK-005/006/007 already installed).

## Use-case design

```ts
async function generateQuestions(
  context: GenerationContext,
  questionTypes: AiQuestionType[] | "auto",
  provider: AiProvider = new GeminiProvider(),
): Promise<GenerateQuestionsResult>

type GenerateQuestionsResult =
  | { ok: true; data: GenerationResponse }
  | { ok: false; stage: "prompt" | "provider" | "validation"; error: string };
```

Takes an **already-loaded** `GenerationContext` rather than loading it itself — the task's own orchestration diagram starts at `GenerationContext → buildPrompt()`, and its required RED test list has no "context loading failure" case, which only makes sense if context loading is treated as someone else's already-tested job (it is — TASK-005's `getGenerationContext`). Keeping that boundary meant I didn't need to invent a DB-failure test case that wasn't actually asked for.

`provider` is a constructor-injected dependency, defaulting to the real `GeminiProvider` for production call sites but swappable in tests — this is what makes the "mock provider, no Gemini/network dependency" requirement trivial rather than requiring module-level mocking (TASK-007's SDK test needed the heavier approach; this one doesn't, because the use case itself only ever talks to the `AiProvider` interface).

## Dependency flow

```text
generateQuestions(context, questionTypes, provider)
  → buildPrompt(...)                      [TASK-006, unchanged]
  → provider.generate(...)                [TASK-007's AiProvider interface — no Gemini SDK import here]
  → parseGenerationResponse(...)          [TASK-006, unchanged]
  → GenerateQuestionsResult
```

No Gemini-specific code, no prompt construction rules, no Zod schema definitions, and no UI code live inside `generate-questions.ts` — it's purely coordination, matching §4's explicit "should not contain" list.

## How the provider contract is used

`provider.generate({ prompt, responseJsonSchema })` — the exact same `AiGenerateRequest`/`AiGenerateResult` shape TASK-007 already defined. No new provider method, no new request/response shape.

## How the existing prompt builder is reused

Called with `questionCount: DEFAULT_QUESTION_COUNT` (TASK-007's existing constant, value 10) rather than hard-coding `10` a second time anywhere in this file — there is exactly one place in the codebase that says "10."

## How the existing response parser/Zod validation is reused

`parseGenerationResponse(providerResult.rawText)` — TASK-006's function, called as-is. `generationResponseSchema` is also reused (via `z.toJSONSchema`) to build the `responseJsonSchema` hint sent to the provider, same pattern TASK-007 already established in `/dev/gemini-check`.

## One real (not contrived) failure case

The task requires a "prompt construction failure → provider must not be called" test. `buildPrompt` itself can't actually fail on valid input (it's a pure string template), so I added a real guard: if `context.patterns.length === 0`, the use case fails at the prompt stage before calling the provider. This isn't hypothetical — `getGenerationContext` already refuses to return an empty-patterns context in normal operation, but the use case shouldn't *assume* that invariant holds forever just because it currently does; this guard is the actual safety net, not a contrived test fixture.

## Test cases created (RED → GREEN → REFACTOR)

1. Successful generation — prompt built, provider called once, response parsed, correct question content returned.
2. Question count = 10 — the exact prompt text sent to the (fake) provider is asserted to contain `"Generate 10 questions"`.
3. Empty-patterns context → provider never called, `stage: "prompt"`.
4. Provider failure → `stage: "provider"`, original error message passed through, no fake questions.
5. Invalid provider response (non-JSON text) → `stage: "validation"`.
6. Provider independence — this test file imports nothing from `lib/ai/gemini-provider.ts` or `@google/genai` (verified with `grep` — zero matches beyond an explanatory comment).

RED confirmed first (import of the not-yet-existing module failed to resolve), then GREEN on the first implementation attempt. One REFACTOR-phase fix was needed for `npm run build`'s type check (a loosely-typed `vi.fn()` in the test didn't satisfy the strongly-typed `AiProvider.generate` signature) — fixed by giving the mock its proper generic type; no production code changed.

**Total suite: 70/70 passing** (64 existing + 6 new).

## Real Gemini verification result

Hit `/dev/generate-questions-check` for real (curl, using the already-configured key — took noticeably longer than TASK-007's 1-question check, since this requests a real 10-question generation):

```text
Result: SUCCESS
Question Count: 10 (questionNumber 1 through 10, all present, none missing/duplicated)
```

Sample generated questions (real Gemini output, no secrets):

```text
1. "Simplify the expression: 3(2x - 5) - 4(x - 3)" — multiple_choice, correctAnswer: A
2. "Simplify the algebraic fraction: (12x^3y^2 - 18x^2y^3) / (6x^2y)" — multiple_choice, correctAnswer: C
3. "Simplify the expression: 2a(3a - 4b) + 5b(2a - b) - a^2" — multiple_choice, correctAnswer: (truncated in extraction, full record present in the route's rendered output)
...continuing through question 10
```

All 10 questions passed `parseGenerationResponse`'s Zod validation (the route wouldn't have rendered "SUCCESS" otherwise — failure would show `Result: FAILED at stage: validation`).

## Issues discovered

None. The design worked on the first real attempt — no retries, no schema mismatches, no provider errors.

## Limitations

- The real-verification route always requests `medium` difficulty and `["multiple_choice"]` only (matching `/dev/prompt-preview`'s defaulting pattern) — it doesn't exercise `"auto"`/mixed question types or other difficulties against the real API. The unit tests do cover the `"auto"` code path, just not with a real Gemini call.
- Generating 10 real questions is measurably slower and more quota-consuming than TASK-007's single-question check — expected and unavoidable given the task's own "10 valid questions are produced" requirement, but worth remembering before re-running this route casually.

## Recommendations for TASK-009

- `generateQuestions()` is ready to be called directly from wherever the Setup form's submit flow ends up living (currently `lib/actions/setup.ts`'s `loadGenerationContextAction`, which already produces the `GenerationContext` this use case consumes) — the natural next step is likely a second server action that chains `getGenerationContext` → `generateQuestions`, or extending the existing one.
- The Setup form doesn't currently collect/pass `questionTypes` in the shape `generateQuestions` expects (`AiQuestionType[] | "auto"`) — it has `selectedTypes: string[]` using the short UI codes (`mc`, `fib`, etc.) and a separate `autoTypes: boolean`. TASK-007's `QUESTION_TYPE_ID_MAP` (`lib/prompts/common.ts`) already does exactly this UI-code → `AiQuestionType` mapping — reuse it rather than inventing another one.
- Real generation takes a real, noticeable amount of time (multiple seconds for 10 questions) — TASK-009 will need a loading state on the UI side; the existing `/generate` screen already has a fake-progress animation that could plausibly be repurposed to reflect real generation time instead of a fixed timer, though that's a UI decision for that task, not this one.
- Now that there are 4 dev-only inspection routes (`/dev/db-check`, `/dev/prompt-preview`, `/dev/gemini-check`, `/dev/generate-questions-check`), a cleanup/consolidation pass is worth considering once the real UI flow (TASK-009/010) makes them redundant for day-to-day use.

## Validation

```text
Tests: 70/70 passing (64 existing + 6 new; fully mocked via injected fake provider, no network)
Lint:  passing
Build: passing — "/dev/generate-questions-check" correctly shows as Dynamic (ƒ)
```

### Real Verification

```text
Real Gemini generation: SUCCESS
Response parsed:        YES
Zod validation:         PASSED
Questions produced:     10 (exact match to the hard-coded requirement)
```
