# TASK-012 — Make the AI Provider Configurable via Environment Variables (starting with Groq)

## Status

Completed

## Objective

Replace the current Gemini-specific `AiProvider` implementation with a single **generic, OpenAI-compatible HTTP provider**, so that switching AI providers (Groq, Gemini, OpenAI, or any other OpenAI-compatible endpoint) is purely an environment-variable change — a developer sets an API key, and a model/base-URL only if the default doesn't fit — with **no source file edits required**. Rename `MATHQUESTAI_GEMINI_API_KEY_V1` to a provider-neutral `AI_API_KEY`.

## Context

TASK-007 introduced Gemini as the AI provider behind a provider-agnostic `AiProvider` interface (`lib/ai/provider.ts`), but the *implementation* (`lib/ai/gemini-provider.ts`) is tightly coupled to Google's `@google/genai` SDK, and the API key is read from a Gemini-named environment variable (`MATHQUESTAI_GEMINI_API_KEY_V1`).

The developer generated a new key on Groq and pasted it into that same variable, expecting the app to just work. It can't — not because of the variable name, but because the provider implementation itself calls Google's SDK/endpoint regardless of what key is in that variable (see TASK-011... actually see the prior investigation that led to this task). An earlier version of this task proposed fixing that by adding a second, Groq-specific adapter file (`groq-provider.ts`) alongside `gemini-provider.ts`, and switching which one `generate-questions.ts` defaults to in code.

The developer has rejected that approach: **hardcoding a specific provider's SDK/adapter into the codebase and requiring a code change to switch providers is not good practice here.** The desired behavior is that changing providers is a `.env.local` change only — a new API key (and, only if genuinely needed, a different model name) — never a source file edit.

This is achievable because Groq, Gemini, and OpenAI itself all expose (or Groq/OpenAI natively are) an **OpenAI-compatible `chat/completions` HTTP API**: same request shape, same auth header style (`Authorization: Bearer <key>`), same response shape. Building the provider against that common shape — rather than against any one vendor's proprietary SDK — is what makes provider-swapping a config-only change.

## Requirements

1. **Rename the environment variable**: `MATHQUESTAI_GEMINI_API_KEY_V1` → `AI_API_KEY`, everywhere it's referenced (`.env.local`, `.env.example`, the provider implementation, `README.md` §25, any dev routes).
2. **Add the minimum additional env vars needed for genericity, with sensible defaults**:
   - `AI_MODEL` — the model name to request. Required to change providers/models, but ship a working default in `.env.example`/docs for the provider currently in use (Groq) so a fresh checkout works without guessing.
   - `AI_BASE_URL` — the OpenAI-compatible endpoint base URL. Same treatment: default documented for Groq (e.g. `https://api.groq.com/openai/v1`), overridable for any other OpenAI-compatible provider (Gemini's OpenAI-compatible endpoint, OpenAI itself, etc.).
   Do not invent additional env vars beyond what's actually needed to make a real request (key, model, base URL) — no speculative configuration knobs.
3. **Replace `lib/ai/gemini-provider.ts` with a single generic implementation** (e.g. `lib/ai/http-provider.ts`), implementing the existing `AiProvider` interface unchanged, that:
   - Sends a standard OpenAI-compatible `POST {AI_BASE_URL}/chat/completions` request (or the SDK-free `fetch` equivalent) with `Authorization: Bearer ${AI_API_KEY}`, `model: AI_MODEL`, and the prompt as a message.
   - Requests structured JSON output using whatever the OpenAI-compatible `response_format` mechanism supports (e.g. `{ type: "json_object" }`) as a best effort — this is not guaranteed to be as strict as Gemini's native schema-constrained output, so continue to rely on `lib/prompts/schema.ts`'s `parseGenerationResponse` as the actual safety net, same as today.
   - Returns `{ ok: false, error }` (never throws) for a missing `AI_API_KEY`/`AI_MODEL`/`AI_BASE_URL`, an HTTP error, or an empty/unparseable response — matching `GeminiProvider`'s existing defensive posture.
4. **Remove the Gemini-SDK-specific dependency** (`@google/genai`) once nothing references it, since a generic HTTP call replaces it — confirm via `package.json` and a repo-wide grep before removing.
5. **Update `generate-questions.ts`**: its injectable `provider` parameter already defaults to a concrete provider (`lib/generation/generate-questions.ts` line 18) — point that default at the new generic provider. This is the only call-site change; nothing about `generateQuestions()`'s own logic changes.
6. **Update the Gemini-specific dev route** (`app/dev/gemini-check/page.tsx`) to exercise the new generic provider instead (rename if appropriate, e.g. `app/dev/ai-provider-check`), so there's still a one-off way to smoke-test whatever provider `.env.local` currently points at.
7. **Update `README.md` §25 "Local AI Configuration"** to describe the new `AI_API_KEY` / `AI_MODEL` / `AI_BASE_URL` variables generically (not "Get a Gemini key from Google AI Studio"), with Groq's console as the concrete example a developer follows today, framed as "any OpenAI-compatible provider works."

## Scope

- One new generic provider file replacing `gemini-provider.ts`.
- The three env vars (rename + two additions) across `.env.local`, `.env.example`, and every file that reads them.
- `generate-questions.ts`'s default provider wiring.
- The dev inspection route.
- `README.md` §25.
- `docs/project-management/progress.md` "Important Decisions" entry recording this as a deliberate architecture correction (config-driven provider, not a hardcoded per-vendor adapter), and why.

## Out of Scope

- Any change to `lib/prompts/*` (prompt construction, response schema/validation) — already provider-agnostic.
- Any change to the Setup/Generate/Questions UI or Server Actions.
- Supporting non-OpenAI-compatible providers (i.e. a provider whose API shape is fundamentally different and can't be reached via `chat/completions`) — out of scope; if that need arises later, it's a new task, not a reason to keep a proprietary-SDK adapter around now.
- Runtime provider selection / multi-provider fallback — out of scope; one provider, fully determined by `.env.local`, is the goal.

## TDD / Tests

- New `tests/unit/http-provider.test.ts` (replacing `tests/unit/gemini-provider.test.ts`), mocking `fetch` rather than a vendor SDK — cover: successful response, non-2xx HTTP response, empty/malformed response body, and each of `AI_API_KEY`/`AI_MODEL`/`AI_BASE_URL` missing.
- `tests/unit/generate-questions.test.ts` and `tests/unit/generate-questions-action.test.ts` already inject a fake `AiProvider` — confirm they still pass unmodified and don't depend on Gemini specifics.
- No test should make a real network call.

## Acceptance Criteria

- With only `.env.local` changes (`AI_API_KEY` set to a real Groq key, `AI_MODEL`/`AI_BASE_URL` left at their documented Groq defaults or set explicitly), a real call through the new provider returns genuine structured JSON that passes `parseGenerationResponse` — verified via the renamed dev route.
- No source file needs to change to point the app at a different OpenAI-compatible provider — only the three env vars. (Demonstrate this claim, don't just assert it: swapping `AI_BASE_URL`/`AI_MODEL` to a second real OpenAI-compatible provider, if one is available to test with, and confirming it still works without touching code.)
- The full Setup → Generate → Questions flow works end-to-end against real output, verified via a real browser walkthrough.
- `MATHQUESTAI_GEMINI_API_KEY_V1` and any Gemini-SDK-specific code/dependency are gone from the active code path.
- Full test suite passes; `tsc --noEmit` and `eslint .` clean.

## Implementation Notes

- Keep `AiProvider`/`AiGenerateRequest`/`AiGenerateResult` (`lib/ai/provider.ts`) unchanged — they're already the right level of abstraction; only the concrete implementation and its configuration source need to change.
- A plain `fetch` call is likely sufficient and avoids adding a new SDK dependency for a fairly small, well-documented request/response shape — prefer it unless a concrete problem (e.g. retries, streaming) justifies a library, per `docs/project-management/architecture.md` §30's "smallest solution" principle.
- Verify the exact current `chat/completions` request/response shape and `response_format` support against Groq's live docs at implementation time (not from memory), same caution TASK-007's report raised about fast-moving AI provider surfaces.

## Validation

- Manual: real API call via the renamed dev inspection route; full browser walkthrough of Setup → Generate → Questions.
- Automated: `npm test`, `tsc --noEmit`, `eslint .` all clean.

## Decisions / Notes

- This task replaces an earlier draft that proposed adding a second, Groq-specific adapter file alongside the existing Gemini one, with the default provider chosen in code. The developer explicitly rejected that direction: hardcoding vendor SDKs and requiring a source change to switch providers is the wrong shape for this project. This version instead standardizes on the OpenAI-compatible HTTP shape that Groq, Gemini, and OpenAI all share, so provider selection lives entirely in `.env.local`.
