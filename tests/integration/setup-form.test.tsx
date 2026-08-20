import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SetupPage from "@/app/page";
import { renderWithSession } from "../test-utils";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
}));

describe("Setup form", () => {
  it("disables Generate Questions until all required fields are filled", async () => {
    const user = userEvent.setup();
    renderWithSession(<SetupPage />);

    const generateButton = screen.getByRole("button", { name: /generate questions/i });
    expect(generateButton).toBeDisabled();

    await user.selectOptions(screen.getByLabelText(/subtopic/i), "Simplify / Calculate");
    expect(generateButton).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Easy" }));
    expect(generateButton).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Multiple Choice" }));
    expect(generateButton).toBeEnabled();
  });

  it("toggling a selected difficulty button again deselects it", async () => {
    const user = userEvent.setup();
    renderWithSession(<SetupPage />);

    const easyButton = screen.getByRole("button", { name: "Easy" });
    await user.click(easyButton);
    expect(easyButton.className).toMatch(/bg-emerald-500/);

    await user.click(easyButton);
    expect(easyButton.className).not.toMatch(/bg-emerald-500/);
  });

  it("toggling a question type chip reflects its selected state", async () => {
    const user = userEvent.setup();
    renderWithSession(<SetupPage />);

    const mcButton = screen.getByRole("button", { name: "Multiple Choice" });
    expect(mcButton.className).not.toMatch(/bg-primary\b/);

    await user.click(mcButton);
    expect(mcButton.className).toMatch(/bg-primary\b/);
  });

  it("navigates to /generate on submit once the form is valid", async () => {
    const user = userEvent.setup();
    renderWithSession(<SetupPage />);

    await user.selectOptions(screen.getByLabelText(/subtopic/i), "Simplify / Calculate");
    await user.click(screen.getByRole("button", { name: "Easy" }));
    await user.click(screen.getByRole("button", { name: "Multiple Choice" }));
    await user.click(screen.getByRole("button", { name: /generate questions/i }));

    expect(push).toHaveBeenCalledWith("/generate");
  });
});
