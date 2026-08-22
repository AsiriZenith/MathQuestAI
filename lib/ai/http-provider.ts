import "server-only";
import { getAiBaseUrl, getAiModel } from "@/lib/ai/config";
import type { AiGenerateRequest, AiGenerateResult, AiProvider } from "@/lib/ai/provider";

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
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
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
