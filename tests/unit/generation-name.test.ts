import { describe, expect, it } from "vitest";
import { buildGenerationName } from "@/lib/persistence/generation-name";

describe("buildGenerationName", () => {
  it("formats the name as Generation-YYYY-MM-DD-HH-MM-SS-mmm in UTC", () => {
    const date = new Date("2026-08-29T04:30:15.123Z");
    expect(buildGenerationName(date)).toBe("Generation-2026-08-29-04-30-15-123");
  });

  it("zero-pads every component", () => {
    const date = new Date("2026-01-02T03:04:05.006Z");
    expect(buildGenerationName(date)).toBe("Generation-2026-01-02-03-04-05-006");
  });

  it("is deterministic for the same timestamp", () => {
    const a = new Date("2026-08-29T12:00:00.500Z");
    const b = new Date("2026-08-29T12:00:00.500Z");
    expect(buildGenerationName(a)).toBe(buildGenerationName(b));
  });

  it("produces distinct names for timestamps a millisecond apart", () => {
    const a = new Date("2026-08-29T12:00:00.500Z");
    const b = new Date("2026-08-29T12:00:00.501Z");
    expect(buildGenerationName(a)).not.toBe(buildGenerationName(b));
  });

  it("interprets the timestamp in UTC regardless of local time", () => {
    const date = new Date(Date.UTC(2026, 11, 31, 23, 59, 59, 999));
    expect(buildGenerationName(date)).toBe("Generation-2026-12-31-23-59-59-999");
  });
});
