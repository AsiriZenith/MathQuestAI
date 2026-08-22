import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HttpAiProvider } from "@/lib/ai/http-provider";
import { DEFAULT_AI_BASE_URL, DEFAULT_AI_MODEL } from "@/lib/ai/config";

const ORIGINAL_ENV = {
  AI_API_KEY: process.env.AI_API_KEY,
  AI_MODEL: process.env.AI_MODEL,
  AI_BASE_URL: process.env.AI_BASE_URL,
};

const fetchMock = vi.fn();

function restoreEnvVar(name: keyof typeof ORIGINAL_ENV) {
  const value = ORIGINAL_ENV[name];
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  restoreEnvVar("AI_API_KEY");
  restoreEnvVar("AI_MODEL");
  restoreEnvVar("AI_BASE_URL");
  vi.unstubAllGlobals();
});

function jsonResponse(body: unknown, ok = true, status = 200) {
  return { ok, status, json: async () => body };
}

describe("HttpAiProvider", () => {
  it("returns a safe error when AI_API_KEY is not configured, without calling fetch", async () => {
    delete process.env.AI_API_KEY;

    const provider = new HttpAiProvider();
    const result = await provider.generate({ prompt: "test prompt", responseJsonSchema: {} });

    expect(result.ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("falls back to the default model and base URL when AI_MODEL/AI_BASE_URL are not set", async () => {
    process.env.AI_API_KEY = "test-key";
    delete process.env.AI_MODEL;
    delete process.env.AI_BASE_URL;
    fetchMock.mockResolvedValue(
      jsonResponse({ choices: [{ message: { content: '{"questions":[]}' } }] }),
    );

    const provider = new HttpAiProvider();
    await provider.generate({ prompt: "Generate 5 questions", responseJsonSchema: {} });

    expect(fetchMock).toHaveBeenCalledWith(
      `${DEFAULT_AI_BASE_URL}/chat/completions`,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer test-key" }),
      }),
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.model).toBe(DEFAULT_AI_MODEL);
  });

  it("uses AI_MODEL/AI_BASE_URL overrides when set", async () => {
    process.env.AI_API_KEY = "test-key";
    process.env.AI_MODEL = "some-other-model";
    process.env.AI_BASE_URL = "https://example.com/v1";
    fetchMock.mockResolvedValue(
      jsonResponse({ choices: [{ message: { content: '{"questions":[]}' } }] }),
    );

    const provider = new HttpAiProvider();
    await provider.generate({ prompt: "test", responseJsonSchema: {} });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.com/v1/chat/completions",
      expect.anything(),
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.model).toBe("some-other-model");
  });

  it("sends the prompt as a user message and requests JSON object output", async () => {
    process.env.AI_API_KEY = "test-key";
    fetchMock.mockResolvedValue(
      jsonResponse({ choices: [{ message: { content: '{"questions":[]}' } }] }),
    );

    const provider = new HttpAiProvider();
    await provider.generate({ prompt: "Generate 5 questions", responseJsonSchema: {} });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.messages).toEqual([{ role: "user", content: "Generate 5 questions" }]);
    expect(body.response_format).toEqual({ type: "json_object" });
  });

  it("returns the raw text on a successful response", async () => {
    process.env.AI_API_KEY = "test-key";
    fetchMock.mockResolvedValue(
      jsonResponse({ choices: [{ message: { content: '{"questions":[{"questionNumber":1}]}' } }] }),
    );

    const provider = new HttpAiProvider();
    const result = await provider.generate({ prompt: "test", responseJsonSchema: {} });

    expect(result).toEqual({ ok: true, rawText: '{"questions":[{"questionNumber":1}]}' });
  });

  it("returns a safe error on a non-2xx HTTP response", async () => {
    process.env.AI_API_KEY = "test-key";
    fetchMock.mockResolvedValue(jsonResponse({ error: "unauthorized" }, false, 401));

    const provider = new HttpAiProvider();
    const result = await provider.generate({ prompt: "test", responseJsonSchema: {} });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/401/);
    }
  });

  it("returns a safe error when the response body has no message content", async () => {
    process.env.AI_API_KEY = "test-key";
    fetchMock.mockResolvedValue(jsonResponse({ choices: [] }));

    const provider = new HttpAiProvider();
    const result = await provider.generate({ prompt: "test", responseJsonSchema: {} });

    expect(result.ok).toBe(false);
  });

  it("returns a safe error when fetch throws, never leaking the API key", async () => {
    process.env.AI_API_KEY = "super-secret-key";
    fetchMock.mockRejectedValue(new Error("request failed with key super-secret-key"));

    const provider = new HttpAiProvider();
    const result = await provider.generate({ prompt: "test", responseJsonSchema: {} });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).not.toContain("super-secret-key");
    }
  });
});
