import { describe, expect, it } from "vitest";
import {
  formatTime,
  parseCustomMinutes,
} from "@/app/questions/practice/_components/practice-view";

describe("formatTime", () => {
  it("formats whole minutes and seconds as mm:ss", () => {
    expect(formatTime(0)).toBe("00:00");
    expect(formatTime(5)).toBe("00:05");
    expect(formatTime(65)).toBe("01:05");
    expect(formatTime(125)).toBe("02:05");
    expect(formatTime(600)).toBe("10:00");
  });

  it("clamps negative values to 00:00", () => {
    expect(formatTime(-1)).toBe("00:00");
    expect(formatTime(-120)).toBe("00:00");
  });
});

describe("parseCustomMinutes", () => {
  it("accepts whole numbers within 1–60 minutes", () => {
    expect(parseCustomMinutes("1")).toBe(1);
    expect(parseCustomMinutes("7")).toBe(7);
    expect(parseCustomMinutes("60")).toBe(60);
    expect(parseCustomMinutes(" 7 ")).toBe(7);
  });

  it("rejects out-of-range, non-integer, and non-numeric values", () => {
    expect(parseCustomMinutes("0")).toBeNull();
    expect(parseCustomMinutes("61")).toBeNull();
    expect(parseCustomMinutes("-1")).toBeNull();
    expect(parseCustomMinutes("1.5")).toBeNull();
    expect(parseCustomMinutes("abc")).toBeNull();
    expect(parseCustomMinutes("")).toBeNull();
    expect(parseCustomMinutes("   ")).toBeNull();
  });
});
