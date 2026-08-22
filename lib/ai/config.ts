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
