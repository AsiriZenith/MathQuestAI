import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuestionPatternChips } from "@/app/_components/question-pattern-chips";

const PATTERNS = [
  { id: "pattern-a", name: "Combine Like Terms" },
  { id: "pattern-b", name: "Apply Distributive Property" },
];

describe("QuestionPatternChips", () => {
  it("renders a chip for every pattern and the 'use all' toggle", () => {
    render(
      <QuestionPatternChips
        patterns={PATTERNS}
        selectedPatternIds={new Set()}
        autoPatterns={false}
        onTogglePattern={vi.fn()}
        onToggleAuto={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Combine Like Terms" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Apply Distributive Property" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /use all question patterns/i })).toBeInTheDocument();
  });

  it("calls onTogglePattern with the clicked chip's id", async () => {
    const user = userEvent.setup();
    const onTogglePattern = vi.fn();
    render(
      <QuestionPatternChips
        patterns={PATTERNS}
        selectedPatternIds={new Set()}
        autoPatterns={false}
        onTogglePattern={onTogglePattern}
        onToggleAuto={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Combine Like Terms" }));
    expect(onTogglePattern).toHaveBeenCalledWith("pattern-a");
  });

  it("calls onToggleAuto when the 'use all' button is clicked", async () => {
    const user = userEvent.setup();
    const onToggleAuto = vi.fn();
    render(
      <QuestionPatternChips
        patterns={PATTERNS}
        selectedPatternIds={new Set()}
        autoPatterns={false}
        onTogglePattern={vi.fn()}
        onToggleAuto={onToggleAuto}
      />,
    );

    await user.click(screen.getByRole("button", { name: /use all question patterns/i }));
    expect(onToggleAuto).toHaveBeenCalled();
  });

  it("visually marks selected chips and an active 'use all' toggle", () => {
    render(
      <QuestionPatternChips
        patterns={PATTERNS}
        selectedPatternIds={new Set(["pattern-a"])}
        autoPatterns={true}
        onTogglePattern={vi.fn()}
        onToggleAuto={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Combine Like Terms" }).className).toMatch(
      /bg-primary\b/,
    );
    expect(screen.getByRole("button", { name: /use all question patterns/i }).className).toMatch(
      /bg-accent/,
    );
  });
});
