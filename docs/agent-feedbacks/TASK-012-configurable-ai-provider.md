# Agent Feedback — TASK-012: Make the AI Provider Configurable via Environment Variables

## What was done

Replaced the Gemini-specific `GeminiProvider` (`@google/genai` SDK) with a single generic `HttpAiProvider` (`lib/ai/http-provider.ts`) that speaks the OpenAI-compatible `chat/completions` HTTP shape — the same shape Groq, Gemini (via its OpenAI-compatible endpoint), and OpenAI itself all support. Provider selection is now entirely determined by three environment variables, with no source file involved in switching providers.

**Environment variables:**
- `MATHQUESTAI_GEMINI_API_KEY_V1` → renamed to `AI_API_KEY` (required).
- `AI_MODEL` (optional, defaults to `openai/gpt-oss-120b` via `lib/ai/config.ts`'s `getAiModel()`).
- `AI_BASE_URL` (optional, defaults to `https://api.groq.com/openai/v1` via `getAiBaseUrl()`).

`.env.local` and `.env.example` updated accordingly; `README.md` §25 rewritten to describe the generic setup with Groq as the concrete example.

**Provider implementation (`lib/ai/http-provider.ts`):** a plain `fetch` call — no new SDK dependency — to `POST {AI_BASE_URL}/chat/completions` with `Authorization: Bearer ${AI_API_KEY}`, `model: AI_MODEL`, the prompt as a single user message, and `response_format: { type: "json_object" }`. Returns `{ ok: false, error }` (never throws) for a missing key, a non-2xx response, or an empty/malformed response body — matching `GeminiProvider`'s existing defensive posture, including never leaking the key value in an error message.

**Removed:** `lib/ai/gemini-provider.ts`, `tests/unit/gemini-provider.test.ts`, and the `@google/genai` dependency from `package.json` (`npm uninstall` also updated `package-lock.json`, removing 36 packages).

**Renamed:** `app/dev/gemini-check/` → `app/dev/ai-provider-check/` (via `git mv`, preserving history), rewritten to use `HttpAiProvider` and display the resolved base URL/model instead of a hardcoded Gemini label.

**Rewired:** `lib/generation/generate-questions.ts`'s injectable `provider` parameter now defaults to `new HttpAiProvider()`.

**Tests:** new `tests/unit/http-provider.test.ts` (8 tests, mocking `fetch` instead of a vendor SDK) covering missing API key, default vs. overridden model/base URL, the request shape (user message + `json_object` format), a successful response, a non-2xx HTTP response, an empty response body, and a thrown/network error never leaking the key. Updated two generic-error-message assertions in `tests/unit/generate-questions.test.ts` that referenced "Gemini" in fake test data (no behavioral change).

## Verified

- **Real, live Groq call** through `/dev/ai-provider-check`: `Connected: YES`, resolved model `openai/gpt-oss-120b`, resolved base URL `https://api.groq.com/openai/v1`, a genuine generated question, validated `YES` by the unchanged `parseGenerationResponse`.
- **Full real browser walkthrough**: Setup (Subtopic "Simplify & Calculate", pattern "Combine Like Terms", Easy, Multiple Choice) → Generate (real Groq call, "Your Questions are Ready!") → Questions page rendering real Groq-generated multiple-choice Algebra questions with correct lettering and EASY badge.
- `npx next build` (full production build, not just `tsc --noEmit`) — compiled successfully, all routes listed correctly including the renamed `/dev/ai-provider-check`.
- `tsc --noEmit` and `eslint .` both clean.
- 63/63 unit tests passing.

## Action needed before the next task

None. `.env.local` now has `AI_API_KEY` set to the Groq key you'd already generated, plus `AI_MODEL`/`AI_BASE_URL` set explicitly to Groq's values (the code would default to the same values if you removed those two lines — they're set explicitly for discoverability, not because they're required).

## Judgment calls made

- **`response_format: { type: "json_object" }` instead of `json_schema` strict mode.** Groq's docs (checked live, not from memory — confirmed via `console.groq.com/docs/structured-outputs`) support a stricter `json_schema` mode with `strict: true` that guarantees schema conformance on the `openai/gpt-oss-*` models. I chose the simpler `json_object` mode instead, because `generationResponseSchema`'s JSON Schema (from `z.toJSONSchema`) has conditionally-required fields (`options` only required when `questionType` is `multiple_choice`) that OpenAI-style strict schema mode generally doesn't support without restructuring the schema (e.g. splitting into a `oneOf`/`anyOf` per question type). Rather than reshape a schema that's shared with prompt-building and response validation just to fit one provider's strict mode, I used the same "best effort + existing Zod validation as the real safety net" approach the task's own Requirements #3 explicitly allowed as an example. This matches exactly how the old `GeminiProvider` already worked (schema was a *hint*, not a hard guarantee) — so no behavioral regression, and the live Groq test above confirms it produces correctly-shaped output in practice.
- **`AI_MODEL`/`AI_BASE_URL` defaults live in code (`lib/ai/config.ts`), not just docs.** The task's Requirements #2 asked for "a working default... so a fresh checkout works without guessing." I implemented this as actual fallback logic (`getAiModel()`/`getAiBaseUrl()`), not just a documentation convention, so a `.env.local` with only `AI_API_KEY` set still works end-to-end — verified by one of the new unit tests.
- **Did not live-test a second OpenAI-compatible provider (e.g. Gemini's own OpenAI-compatible endpoint) to literally demonstrate the "swap without code changes" claim beyond the single Groq verification.** The task's acceptance criteria flagged this as conditional ("if one is available to test with"). I judged the real, successful Groq call plus the fact that `http-provider.ts` contains zero vendor-specific branching (only reads three env vars) as sufficient evidence, and avoided restarting the shared local dev server (not clearly mine to restart) purely for an optional secondary demo. Happy to run this live if you want it confirmed with a second provider — I still have the previous Gemini key on hand.

## Deviations from the task file

None of substance. Implemented per the Requirements section as written, including the specific choice points it left open (SDK-vs-fetch: chose fetch, per Implementation Notes' own steer toward "smallest solution").

## Suggestions for going forward

- If you want the `json_schema` strict-mode guarantee Groq offers, `generationResponseSchema` (`lib/prompts/schema.ts`) would need restructuring into a provider-strict-mode-compatible shape first — worth a dedicated task if response quality/consistency becomes a research concern, rather than bundling it into a provider-swap task.
- The old Gemini API key is still sitting unused in your possession/`.env.local` history (not in the current file) — worth deleting it from Google AI Studio if you don't intend to use Gemini again, purely for key hygiene.
