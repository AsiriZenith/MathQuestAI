# Lesson 7 — AI Provider Integration

Goal of this lesson: read the three files that sit between a finished prompt string (Lesson 6's output) and an actual HTTP call to an AI service — `lib/ai/provider.ts`, `lib/ai/http-provider.ts`, and `lib/ai/config.ts` — and understand *why* there's no AI vendor SDK anywhere in this project's dependencies. This lesson stops at "a raw text response comes back or an error does"; what calls this layer and chains it together with the prompt builder is Lesson 8.

`ai-generation.md` §20 states the design intent directly: *"The application should not spread provider-specific API calls throughout the application. Use an application-level abstraction... This allows the project to change or compare AI providers without rewriting the rest of the application."* This lesson is where you see that intent actually paid off — this codebase has already swapped its AI provider once, and the swap touched exactly the three files this lesson covers.

---

## 1. `lib/ai/provider.ts` — the interface everything else depends on

```ts
export interface AiGenerateRequest {
  prompt: string;
  responseJsonSchema: Record<string, unknown>;
}

export type AiGenerateResult =
  | { ok: true; rawText: string }
  | { ok: false; error: string };

export interface AiProvider {
  generate(request: AiGenerateRequest): Promise<AiGenerateResult>;
}
```

This is the entire contract. One method, one request shape, one result shape — the same `{ ok, ... } | { ok: false; error }` convention you've now seen at every trust boundary in this codebase (database calls in Lesson 4, the AI response schema in Lesson 6, and now the AI request itself). Nothing here mentions Groq, Gemini, OpenAI, or any vendor by name — `AiProvider` is deliberately the smallest possible surface a caller needs, and the smallest possible surface an implementation needs to satisfy.

Note the shape of `AiGenerateRequest`: it carries a `prompt` (the string Lesson 6's `buildPrompt` produces) and a `responseJsonSchema`. Hold onto that second field — section 2 has a specific, honest detail about it.

---

## 2. `lib/ai/http-provider.ts` — one class, no vendor SDK

```ts
/**
 * Talks to any OpenAI-compatible `/chat/completions` endpoint (Groq, Gemini's
 * OpenAI-compatible endpoint, OpenAI itself, ...). Which provider is actually used
 * is entirely determined by the AI_API_KEY / AI_MODEL / AI_BASE_URL env vars —
 * swapping providers should never require editing this file.
 */
export class HttpAiProvider implements AiProvider {
  async generate(request: AiGenerateRequest): Promise<AiGenerateResult> {
    const apiKey = process.env.AI_API_KEY;
    if (!apiKey) {
      return { ok: false, error: "AI_API_KEY is not configured." };
    }

    const baseUrl = getAiBaseUrl();
    const model = getAiModel();

    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: request.prompt }],
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        return { ok: false, error: `AI provider request failed with status ${response.status}.` };
      }

      const data = await response.json();
      const text = data?.choices?.[0]?.message?.content;

      if (typeof text !== "string" || text.length === 0) {
        return { ok: false, error: "AI provider returned an empty or unexpected response." };
      }

      return { ok: true, rawText: text };
    } catch {
      return { ok: false, error: "Unable to reach the AI provider." };
    }
  }
}
```

This is a plain `fetch` call, not a vendor SDK — the whole implementation depends on nothing but the standard `chat/completions` HTTP shape that Groq, OpenAI, and Gemini's OpenAI-compatible endpoint all happen to share. Walk the defensive checks in order: a missing `AI_API_KEY` is caught before any network call is attempted; a non-2xx HTTP response is turned into an error carrying the status code but nothing about *why* (no response body is echoed back, so a provider error message can't leak into the app); an unexpected response shape (`data?.choices?.[0]?.message?.content` not being a non-empty string) is caught explicitly rather than letting a later `undefined.length` throw; and the whole thing is wrapped in `try/catch` so a network failure (DNS, timeout, connection refused) becomes the same `{ ok: false, error }` shape as every other failure mode here. **This method never throws** — same discipline you saw in `parseGenerationResponse` (Lesson 6).

### The one honest loose end: `responseJsonSchema` is accepted but unused here

Look again at the request body actually sent: `model`, `messages`, and `response_format: { type: "json_object" }`. Nowhere does `request.responseJsonSchema` — the field defined on `AiGenerateRequest` in section 1 — actually appear in the HTTP call. The interface declares it; this implementation doesn't use it. That's not an oversight to "fix" — the reasoning is recorded directly in `docs/agent-feedbacks/TASK-012-configurable-ai-provider.md`:

> Groq's docs... support a stricter `json_schema` mode with `strict: true`... I chose the simpler `json_object` mode instead, because `generationResponseSchema`'s JSON Schema... has conditionally-required fields (`options` only required when `questionType` is `multiple_choice`) that OpenAI-style strict schema mode generally doesn't support without restructuring the schema... I used the same "best effort + existing Zod validation as the real safety net" approach.

In other words: the schema-carrying field exists on the interface as a hook for a provider that *can* enforce structured output, but the current implementation deliberately treats the zod validation you read in Lesson 6 as the real safety net, and asks the AI for `json_object` mode (loosely-structured JSON) rather than a strict schema guarantee. This is worth internalizing as a real pattern in this codebase: an interface can carry more information than every implementation uses, when that information is there for a *future* or *alternative* implementation rather than the current one.

---

## 3. `lib/ai/config.ts` — provider selection lives entirely in environment variables

```ts
export const DEFAULT_QUESTION_COUNT = 10;

// Defaults match Groq's OpenAI-compatible API — the provider currently in use.
// Override via the AI_MODEL / AI_BASE_URL env vars to point at any other
// OpenAI-compatible provider (e.g. Gemini's OpenAI-compatible endpoint, OpenAI itself)
// without changing any source file.
export const DEFAULT_AI_MODEL = "openai/gpt-oss-120b";
export const DEFAULT_AI_BASE_URL = "https://api.groq.com/openai/v1";

export function getAiModel(): string {
  return process.env.AI_MODEL || DEFAULT_AI_MODEL;
}

export function getAiBaseUrl(): string {
  return process.env.AI_BASE_URL || DEFAULT_AI_BASE_URL;
}
```

Three environment variables control everything about which AI service actually gets called: `AI_API_KEY` (required, read directly in `http-provider.ts`), `AI_MODEL`, and `AI_BASE_URL` (both optional, defaulting to Groq's values here). Notice the defaults aren't just documented somewhere — they're real fallback logic, so a fresh checkout with only `AI_API_KEY` set in `.env.local` still works end-to-end without anyone needing to know Groq's base URL by heart. Swapping to a different OpenAI-compatible provider (say, OpenAI itself, or Gemini's OpenAI-compatible endpoint) means changing two environment variables — no source file changes, no redeploy of different code.

---

## 4. The provider swap that already happened — TASK-012

This isn't a hypothetical "the architecture is *supposed* to be swappable" story — it already happened once. `docs/agent-feedbacks/TASK-012-configurable-ai-provider.md` records it: the project originally had a `GeminiProvider` built directly on the `@google/genai` SDK. TASK-012 replaced it with the generic `HttpAiProvider` you just read, and the changes were contained to exactly the boundary `ai-generation.md` §20 describes:

- `lib/ai/gemini-provider.ts` deleted, `@google/genai` uninstalled from `package.json` entirely.
- `MATHQUESTAI_GEMINI_API_KEY_V1` renamed to the vendor-neutral `AI_API_KEY`.
- `app/dev/gemini-check/` renamed to `app/dev/ai-provider-check/` (the dev inspection route from Lesson 2 §4 — its name used to say "Gemini" and now doesn't, because the app no longer has an opinion about which vendor it's talking to).
- `lib/generation/generate-questions.ts` — the orchestration function you'll read in full in Lesson 8 — needed exactly one line changed: its injectable `provider` parameter's default value became `new HttpAiProvider()` instead of the old Gemini class. Nothing about *how* that function calls `provider.generate(...)` changed, because both classes satisfied the same `AiProvider` interface from section 1.

That last point is the whole lesson in miniature: because every caller depends on `AiProvider` (an interface), not on `GeminiProvider` or `HttpAiProvider` (a concrete class), replacing the implementation required touching the implementation and its direct config, and nothing else. You'll see this same injection point again in Lesson 8 — `generateQuestions(context, questionTypes, provider: AiProvider = new HttpAiProvider())` — and again in Lesson 10, where tests substitute a fake `AiProvider` to make generation tests deterministic without a live API call.

---

**Explicitly out of scope for this lesson** (deferred, not forgotten):

- How `generateQuestions` actually chains `buildPrompt` → `provider.generate` → `parseGenerationResponse` together → Lesson 8
- How tests substitute a fake `AiProvider` → Lesson 10
- What `app/dev/ai-provider-check` actually does when you visit it → Lesson 12

---

## Checkpoint

Answer these in your own words before moving to Lesson 8. No answer key — if any of these feel shaky, re-read the relevant section above.

1. Why does `AiProvider` define just one method, `generate`, instead of separate methods for different question types or difficulty levels?
2. `HttpAiProvider` never throws — every failure path returns `{ ok: false, error }`. Name the four distinct failure conditions it checks for, in the order they're checked.
3. `AiGenerateRequest` includes a `responseJsonSchema` field that `HttpAiProvider` never actually sends to the AI provider. Why does the field exist on the interface anyway, and what real constraint stopped this implementation from using it?
4. When TASK-012 replaced `GeminiProvider` with `HttpAiProvider`, what had to change in `lib/generation/generate-questions.ts`? What does that tell you about the value of depending on `AiProvider` the interface rather than a concrete provider class?
5. If you wanted to point this app at OpenAI itself instead of Groq, which environment variables would you change, and would you need to edit any TypeScript file to do it?
