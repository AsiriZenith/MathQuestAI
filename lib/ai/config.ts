export const DEFAULT_QUESTION_COUNT = 10;

// Defaults match Groq's OpenAI-compatible API — the provider currently in use.
// Override via the AI_MODEL / AI_BASE_URL env vars to point at any other
// OpenAI-compatible provider (e.g. Gemini's OpenAI-compatible endpoint, OpenAI itself)
// without changing any source file.
export const DEFAULT_AI_MODEL = "openai/gpt-oss-120b";
export const DEFAULT_AI_BASE_URL = "https://api.groq.com/openai/v1";
export const DEFAULT_AI_PROVIDER = "groq";

export function getAiModel(): string {
  return process.env.AI_MODEL || DEFAULT_AI_MODEL;
}

/**
 * A short identifier for the AI provider, persisted on each generation run
 * (`generation_contexts.ai_provider`). Defaults to `"groq"` — the OpenAI-compatible
 * provider the app ships pointed at — and can be overridden with the AI_PROVIDER
 * env var alongside AI_BASE_URL / AI_MODEL.
 */
export function getAiProvider(): string {
  return process.env.AI_PROVIDER || DEFAULT_AI_PROVIDER;
}

export function getAiBaseUrl(): string {
  return process.env.AI_BASE_URL || DEFAULT_AI_BASE_URL;
}
