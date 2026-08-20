import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import QuestionsPage from "@/app/questions/page";
import { renderWithSession, TEST_CONFIG } from "../test-utils";
import { SAMPLE_QUESTIONS } from "@/lib/mock-data";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
}));

describe("Questions screen", () => {
  it("renders a card for every generated question and the coverage badges", () => {
    renderWithSession(<QuestionsPage />, { config: TEST_CONFIG, questions: SAMPLE_QUESTIONS });

    SAMPLE_QUESTIONS.forEach((_, i) => {
      expect(screen.getByText(`Question ${i + 1}`)).toBeInTheDocument();
    });
    expect(screen.getByText(`${SAMPLE_QUESTIONS.length} different question types`)).toBeInTheDocument();
  });

  it("navigates to /evaluation when Evaluate Results is clicked", async () => {
    const user = userEvent.setup();
    renderWithSession(<QuestionsPage />, { config: TEST_CONFIG, questions: SAMPLE_QUESTIONS });

    await user.click(screen.getByRole("button", { name: /evaluate results/i }));
    expect(push).toHaveBeenCalledWith("/evaluation");
  });
});
