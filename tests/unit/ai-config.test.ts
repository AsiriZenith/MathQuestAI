import { afterEach, describe, expect, it } from "vitest";
import { DEFAULT_AI_PROVIDER, getAiProvider } from "@/lib/ai/config";

const original = process.env.AI_PROVIDER;

afterEach(() => {
  if (original === undefined) delete process.env.AI_PROVIDER;
  else process.env.AI_PROVIDER = original;
});

describe("getAiProvider", () => {
  it("defaults to 'deepseek'", () => {
    delete process.env.AI_PROVIDER;
    expect(getAiProvider()).toBe("deepseek");
    expect(DEFAULT_AI_PROVIDER).toBe("deepseek");
  });

  it("uses the AI_PROVIDER env var when set", () => {
    process.env.AI_PROVIDER = "openai";
    expect(getAiProvider()).toBe("openai");
  });

  it("ignores an empty AI_PROVIDER value", () => {
    process.env.AI_PROVIDER = "";
    expect(getAiProvider()).toBe("deepseek");
  });
});
