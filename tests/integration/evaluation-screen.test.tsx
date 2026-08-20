import { describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import EvaluationPage from "@/app/evaluation/page";
import { renderWithSession, TEST_CONFIG } from "../test-utils";
import { COVERAGE_RESULT, QUESTION_PATTERN_COVERAGE } from "@/lib/mock-data";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

describe("Evaluation screen", () => {
  it("renders the coverage percentage", () => {
    renderWithSession(<EvaluationPage />, { config: TEST_CONFIG });
    expect(screen.getByText(`${Math.round(COVERAGE_RESULT.secondaryScore)}%`)).toBeInTheDocument();
  });

  it("renders a status label for every pattern in the coverage list", () => {
    renderWithSession(<EvaluationPage />, { config: TEST_CONFIG });

    const section = screen.getByText("Question Pattern Coverage").closest("div") as HTMLElement;
    QUESTION_PATTERN_COVERAGE.forEach((row) => {
      expect(within(section).getByText(row.pattern)).toBeInTheDocument();
    });
    expect(within(section).getAllByText("Covered").length).toBeGreaterThan(0);
    expect(within(section).getAllByText("Partially covered").length).toBeGreaterThan(0);
  });
});
