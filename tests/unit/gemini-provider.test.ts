import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createMock = vi.fn();
const GoogleGenAIConstructor = vi.fn();

vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    constructor(...args: unknown[]) {
      GoogleGenAIConstructor(...args);
    }
    interactions = { create: createMock };
  },
}));

import { GeminiProvider } from "@/lib/ai/gemini-provider";
import { GEMINI_MODEL } from "@/lib/ai/config";

const ORIGINAL_KEY = process.env.MATHQUESTAI_GEMINI_API_KEY_V1;

beforeEach(() => {
  createMock.mockReset();
  GoogleGenAIConstructor.mockClear();
});

afterEach(() => {
  if (ORIGINAL_KEY === undefined) {
    delete process.env.MATHQUESTAI_GEMINI_API_KEY_V1;
  } else {
    process.env.MATHQUESTAI_GEMINI_API_KEY_V1 = ORIGINAL_KEY;
  }
});

describe("GeminiProvider", () => {
  it("returns a safe error when the API key is not configured, without calling the SDK", async () => {
    delete process.env.MATHQUESTAI_GEMINI_API_KEY_V1;

    const provider = new GeminiProvider();
    const result = await provider.generate({ prompt: "test prompt", responseJsonSchema: {} });

    expect(result.ok).toBe(false);
    expect(GoogleGenAIConstructor).not.toHaveBeenCalled();
    expect(createMock).not.toHaveBeenCalled();
  });

  it("calls the SDK with the configured model, the prompt, and the structured output config", async () => {
    process.env.MATHQUESTAI_GEMINI_API_KEY_V1 = "test-key";
    createMock.mockResolvedValue({ output_text: '{"questions":[]}' });

    const schema = { type: "object" };
    const provider = new GeminiProvider();
    await provider.generate({ prompt: "Generate 5 questions", responseJsonSchema: schema });

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: GEMINI_MODEL,
        input: "Generate 5 questions",
        response_format: expect.objectContaining({
          type: "text",
          mime_type: "application/json",
          schema,
        }),
      }),
    );
  });

  it("returns the raw text on a successful response", async () => {
    process.env.MATHQUESTAI_GEMINI_API_KEY_V1 = "test-key";
    createMock.mockResolvedValue({ output_text: '{"questions":[{"questionNumber":1}]}' });

    const provider = new GeminiProvider();
    const result = await provider.generate({ prompt: "test", responseJsonSchema: {} });

    expect(result).toEqual({ ok: true, rawText: '{"questions":[{"questionNumber":1}]}' });
  });

  it("returns a safe error when the SDK call fails, never leaking the API key", async () => {
    process.env.MATHQUESTAI_GEMINI_API_KEY_V1 = "super-secret-key";
    createMock.mockRejectedValue(new Error("request failed with key super-secret-key"));

    const provider = new GeminiProvider();
    const result = await provider.generate({ prompt: "test", responseJsonSchema: {} });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).not.toContain("super-secret-key");
    }
  });

  it("returns a safe error when the SDK response has no output text", async () => {
    process.env.MATHQUESTAI_GEMINI_API_KEY_V1 = "test-key";
    createMock.mockResolvedValue({});

    const provider = new GeminiProvider();
    const result = await provider.generate({ prompt: "test", responseJsonSchema: {} });

    expect(result.ok).toBe(false);
  });
});
