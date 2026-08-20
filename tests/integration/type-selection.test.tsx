import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SetupPage from "@/app/page";
import { renderWithSession } from "../test-utils";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

describe("Question type / auto-mix mutual exclusion", () => {
  it("selecting the auto-mix toggle clears any selected type chips", async () => {
    const user = userEvent.setup();
    renderWithSession(<SetupPage />);

    const mcButton = screen.getByRole("button", { name: "Multiple Choice" });
    await user.click(mcButton);
    expect(mcButton.className).toMatch(/bg-primary\b/);

    const autoButton = screen.getByRole("button", { name: /generate a mix/i });
    await user.click(autoButton);

    expect(mcButton.className).not.toMatch(/bg-primary\b/);
    expect(autoButton.className).toMatch(/bg-accent/);
  });

  it("selecting a type chip turns off the auto-mix toggle", async () => {
    const user = userEvent.setup();
    renderWithSession(<SetupPage />);

    const autoButton = screen.getByRole("button", { name: /generate a mix/i });
    await user.click(autoButton);
    expect(autoButton.className).toMatch(/bg-accent/);

    const mcButton = screen.getByRole("button", { name: "Multiple Choice" });
    await user.click(mcButton);

    expect(autoButton.className).not.toMatch(/bg-accent/);
    expect(mcButton.className).toMatch(/bg-primary\b/);
  });
});
