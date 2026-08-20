import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuestionTypeChips } from "@/app/_components/question-type-chips";

describe("QuestionTypeChips", () => {
  it("renders a chip for every question type and the auto-mix toggle", () => {
    render(
      <QuestionTypeChips
        selectedTypes={new Set()}
        autoTypes={false}
        onToggleType={vi.fn()}
        onToggleAuto={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Multiple Choice" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /generate a mix/i })).toBeInTheDocument();
  });

  it("calls onToggleType with the clicked chip's id", async () => {
    const user = userEvent.setup();
    const onToggleType = vi.fn();
    render(
      <QuestionTypeChips
        selectedTypes={new Set()}
        autoTypes={false}
        onToggleType={onToggleType}
        onToggleAuto={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Multiple Choice" }));
    expect(onToggleType).toHaveBeenCalledWith("mc");
  });

  it("calls onToggleAuto when the auto-mix button is clicked", async () => {
    const user = userEvent.setup();
    const onToggleAuto = vi.fn();
    render(
      <QuestionTypeChips
        selectedTypes={new Set()}
        autoTypes={false}
        onToggleType={vi.fn()}
        onToggleAuto={onToggleAuto}
      />,
    );

    await user.click(screen.getByRole("button", { name: /generate a mix/i }));
    expect(onToggleAuto).toHaveBeenCalled();
  });

  it("visually marks selected chips and an active auto-mix toggle", () => {
    render(
      <QuestionTypeChips
        selectedTypes={new Set(["mc"])}
        autoTypes={true}
        onToggleType={vi.fn()}
        onToggleAuto={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Multiple Choice" }).className).toMatch(
      /bg-primary\b/,
    );
    expect(screen.getByRole("button", { name: /generate a mix/i }).className).toMatch(
      /bg-accent/,
    );
  });
});
