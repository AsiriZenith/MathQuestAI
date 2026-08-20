import "server-only";
import { GoogleGenAI } from "@google/genai";
import { GEMINI_MODEL } from "@/lib/ai/config";
import type { AiGenerateRequest, AiGenerateResult, AiProvider } from "@/lib/ai/provider";

export class GeminiProvider implements AiProvider {
  async generate(request: AiGenerateRequest): Promise<AiGenerateResult> {
    const apiKey = process.env.MATHQUESTAI_GEMINI_API_KEY_V1;
    if (!apiKey) {
      return { ok: false, error: "Gemini API key is not configured." };
    }

    try {
      const client = new GoogleGenAI({ apiKey });
      const interaction = await client.interactions.create({
        model: GEMINI_MODEL,
        input: request.prompt,
        response_format: {
          type: "text",
          mime_type: "application/json",
          schema: request.responseJsonSchema,
        },
      });

      const text = interaction.output_text;
      if (typeof text !== "string" || text.length === 0) {
        return { ok: false, error: "Gemini returned an empty or unexpected response." };
      }

      return { ok: true, rawText: text };
    } catch {
      return { ok: false, error: "Unable to reach the Gemini API." };
    }
  }
}
