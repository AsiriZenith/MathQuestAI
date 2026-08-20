# Agent Feedback — TASK-007: AI Provider Integration (Google Gemini)

**Date:** 2026-08-21

---

## Selected Gemini model

**`gemini-3.7-flash`**, centralized in `lib/ai/config.ts` (`GEMINI_MODEL`). Not spread through the codebase — only `gemini-provider.ts` references the constant.

## SDK / package used, and why

**`@google/genai`** (official Google package, `googleapis/js-genai`). I did not rely on training data for this — fast-moving API surfaces like this are exactly where stale knowledge causes real mistakes, and the task explicitly warned against an obsolete model/approach. Process:

1. Fetched `ai.google.dev`'s live quickstart and structured-output docs pages directly.
2. They pointed to a newer **Interactions API** (`ai.interactions.create(...)`), described as "now generally available... recommended for access to all the latest features and models" — superseding the older `models.generateContent` pattern I'd have defaulted to from memory.
3. Installed the package and read its actual shipped `.d.ts` type definitions as ground truth (not just trusting the fetched doc prose, which can be imprecise/paraphrased). Confirmed directly in the types:
   - `GoogleGenAI({ apiKey })` constructor accepts `apiKey`.
   - `.interactions.create({ model, input, response_format: { type: "text", mime_type: "application/json", schema } })` — exact field names match what the docs described.
   - The response type has `output_text?: string`.
   - `"gemini-3.7-flash"` is a literal in the SDK's own `Model` union type — confirming it as a real, current, non-obsolete identifier, not just a docs claim.

No discrepancy was found between the fetched docs and the installed SDK's types — both agreed. This is recorded here so the verification method is visible, not just the conclusion.

## Provider interface

```ts
// lib/ai/provider.ts
interface AiGenerateRequest { prompt: string; responseJsonSchema: Record<string, unknown> }
type AiGenerateResult = { ok: true; rawText: string } | { ok: false; error: string }
interface AiProvider { generate(request: AiGenerateRequest): Promise<AiGenerateResult> }
```

Deliberately small — one method, one request shape, one result shape. `lib/ai/gemini-provider.ts`'s `GeminiProvider implements AiProvider`; all Gemini-specific request/response shaping (the `interactions.create` call, `response_format` structure, `output_text` field access) stays inside that one file. A future second provider (e.g. Claude, OpenAI) would only need its own adapter file — no changes to the interface or to anything that consumes it.

## Reused, not duplicated

`z.toJSONSchema(generationResponseSchema)` (TASK-006's existing Zod schema, now exported) produces the JSON Schema hint sent to Gemini's `response_format.schema`. Whatever Gemini actually returns is validated by TASK-006's unchanged `parseGenerationResponse` — no second schema, no second parser.

## Test strategy

`tests/unit/gemini-provider.test.ts`, 5 tests, `@google/genai` fully mocked (a fake `GoogleGenAI` class, since the SDK is instantiated with `new` — my first mock attempt used a plain arrow function and silently failed with "not a constructor," caught by the provider's own try/catch; fixed by mocking a real class):
- Missing API key → safe error, SDK never touched.
- Correct model/input/`response_format` passed to the SDK call.
- Successful response → raw text returned.
- SDK rejection → safe generic error, **and the API key string is explicitly asserted absent from the error message** (I used an actual secret-looking string in the mocked rejection to make this a real check, not a tautology).
- Missing/empty `output_text` → safe error, not silently treated as success.

None of these touch the network. Full suite: **64/64 passing** (59 existing + 5 new).

## Real API verification result

Ran for real via `/dev/gemini-check` (curl, during implementation, using the key you added to `.env.local` — I never saw or logged its value):

```text
Connected: YES
Model: gemini-3.7-flash
Raw response: {"questions":[{"questionNumber":1,"questionText":"Simplify the expression by
  combining like terms:\n\n4x + 7x","questionType":"multiple_choice", ...,"correctAnswer":"A", ...}]}
Valid (via TASK-006's parseGenerationResponse): YES
```

This is a genuine, evidence-based verification — the full pipeline (prompt → real Gemini call → structured JSON → existing Zod validation) worked end-to-end on the first attempt, no retries needed.

## Limitations discovered

- The `@google/genai` SDK's Interactions API is very new (the `GeminiNextGenInteractions` class name in its own types hints at this being a newer/parallel surface alongside the older `models` API also present in the same package). If Google changes this API before TASK-008, the only file that should need updating is `gemini-provider.ts` — that isolation is the whole point of the interface.
- `npm install` still reports the same pre-existing `deepmerge-ts`/`@prisma/config` dev-tooling vulnerability noted in TASK-004/005 — unrelated to this task, not re-investigated.
- The verification route's test prompt is intentionally tiny (1 question, minimal context) to keep real API cost/quota usage low — it proves the pipeline works, not that a full 10-question generation request behaves identically. That's implicitly TASK-008's job once it exercises the real flow.

## Follow-up work required for TASK-008

- A `generateQuestions()` use case that: builds the real prompt from a live `GenerationContext` (TASK-005) with `DEFAULT_QUESTION_COUNT` (10, already defined in `lib/ai/config.ts`), calls `GeminiProvider.generate`, and runs the result through `parseGenerationResponse` — essentially what `/dev/gemini-check` already demonstrates, but wired to the real Setup→Generate flow instead of a fixed test context.
- Decide whether `/dev/db-check`, `/dev/prompt-preview`, and `/dev/gemini-check` (3 dev-only routes now) should be consolidated, removed, or left as ongoing debugging tools once TASK-008 makes the real flow inspectable through the actual UI.
- User-facing error handling for generation failures is explicitly deferred to TASK-011 per this task's own scope — `GeminiProvider` already returns safe, generic errors, but nothing surfaces them to end users yet.

## Validation

```text
Tests: 64/64 passing (mocked; no network calls)
Lint:  passing
Build: passing — "/dev/gemini-check" correctly shows as Dynamic (ƒ)
```

### Gemini

```text
Real API verification: SUCCESS (see result above)
```

### AI

```text
AI provider called: YES — but only for the required one-time real verification (via /dev/gemini-check),
                      not from any application/business-logic code path. No Setup/Generate/Questions
                      flow calls it.
```

### Database

```text
Database schema changed: NO
```

## Risky / judgment-call decisions

- **Trusted a very new, possibly-still-settling API surface (Interactions API) over the older, more battle-tested `generateContent` pattern I'd have used from memory**, because the current live docs and the installed SDK's own types both independently confirmed it's the recommended path. Flagging this because "very new" carries some inherent risk of upstream churn, even though today's evidence is solid.
- **`/dev/gemini-check` makes one real, billable API call every time it's loaded.** It's not linked from navigation and only I (or you) would hit it deliberately, but worth knowing it's not free to poke at repeatedly.
- Fixed a real test-authoring bug during RED→GREEN (arrow-function mock silently swallowed by the provider's own try/catch) rather than leaving a subtly-wrong test — documented above so the pattern (mock ES classes as classes, not arrow functions, when the code under test uses `new`) doesn't get relearned the hard way next time.

## Documentation Changes

- `README.md` — new §25 "Local AI Configuration" (Gemini API key setup), sections renumbered 25→28 to accommodate it.
- `.env.example` — added `MATHQUESTAI_GEMINI_API_KEY_V1=` (name only).
- `docs/progress.md` — updated with this task's summary and 2 new decision notes.
