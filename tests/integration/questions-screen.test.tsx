import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import QuestionsPage from "@/app/questions/page";
import { renderWithSession, TEST_CONFIG, TEST_GENERATION_RESPONSE } from "../test-utils";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
}));

describe("Questions screen", () => {
  it("renders a card for every generated question and the coverage badges", () => {
    renderWithSession(<QuestionsPage />, {
      config: TEST_CONFIG,
      generationResponse: TEST_GENERATION_RESPONSE,
    });

    TEST_GENERATION_RESPONSE.questions.forEach((q) => {
      expect(screen.getByText(`Question ${q.questionNumber}`)).toBeInTheDocument();
    });
    expect(screen.getByText("1 different question types")).toBeInTheDocument();
  });

  it("navigates to /evaluation when Evaluate Results is clicked", async () => {
    const user = userEvent.setup();
    renderWithSession(<QuestionsPage />, {
      config: TEST_CONFIG,
      generationResponse: TEST_GENERATION_RESPONSE,
    });

    await user.click(screen.getByRole("button", { name: /evaluate results/i }));
    expect(push).toHaveBeenCalledWith("/evaluation");
  });
});
