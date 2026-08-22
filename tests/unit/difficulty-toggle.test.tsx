import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DifficultyToggle } from "@/app/_components/difficulty-toggle";

describe("DifficultyToggle", () => {
  it("renders a button for each difficulty option", () => {
    render(<DifficultyToggle value="" onChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Easy" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Medium" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hard" })).toBeInTheDocument();
  });

  it("calls onChange with the clicked option's id", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DifficultyToggle value="" onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Medium" }));
    expect(onChange).toHaveBeenCalledWith("medium");
  });

  it("calls onChange with an empty string when the selected option is clicked again", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DifficultyToggle value="medium" onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Medium" }));
    expect(onChange).toHaveBeenCalledWith("");
  });

  it("visually marks the selected option", () => {
    render(<DifficultyToggle value="easy" onChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Easy" }).className).toMatch(/bg-emerald-500/);
    expect(screen.getByRole("button", { name: "Medium" }).className).not.toMatch(/bg-amber-500/);
  });
});
