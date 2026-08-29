import { afterEach, describe, expect, it } from "vitest";
import { DEFAULT_AI_PROVIDER, getAiProvider } from "@/lib/ai/config";

const original = process.env.AI_PROVIDER;

afterEach(() => {
  if (original === undefined) delete process.env.AI_PROVIDER;
  else process.env.AI_PROVIDER = original;
});

describe("getAiProvider", () => {
  it("defaults to 'groq'", () => {
    delete process.env.AI_PROVIDER;
    expect(getAiProvider()).toBe("groq");
    expect(DEFAULT_AI_PROVIDER).toBe("groq");
  });

  it("uses the AI_PROVIDER env var when set", () => {
    process.env.AI_PROVIDER = "openai";
    expect(getAiProvider()).toBe("openai");
  });

  it("ignores an empty AI_PROVIDER value", () => {
    process.env.AI_PROVIDER = "";
    expect(getAiProvider()).toBe("groq");
  });
});
