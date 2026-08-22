import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GeneratePage from "@/app/generate/page";
import { renderWithSession, TEST_CONFIG, TEST_GENERATION_CONTEXT, TEST_GENERATION_RESPONSE } from "../test-utils";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
}));

const generateQuestionsActionMock = vi.fn();
vi.mock("@/lib/actions/generation", () => ({
  generateQuestionsAction: (...args: unknown[]) => generateQuestionsActionMock(...args),
}));

beforeEach(() => {
  push.mockClear();
  generateQuestionsActionMock.mockReset();
});

async function runAnimationToEnd() {
  for (let i = 0; i < 4; i++) {
    await act(async () => {
      await new Promise((r) => setTimeout(r, 2250));
    });
  }
}

describe("GeneratePage — real generation", () => {
  it("calls generateQuestionsAction exactly once on mount", async () => {
    generateQuestionsActionMock.mockResolvedValue({ ok: true, data: TEST_GENERATION_RESPONSE });

    renderWithSession(<GeneratePage />, {
      config: TEST_CONFIG,
      generationContext: TEST_GENERATION_CONTEXT,
    });

    expect(generateQuestionsActionMock).toHaveBeenCalledTimes(1);
    expect(generateQuestionsActionMock).toHaveBeenCalledWith(
      TEST_GENERATION_CONTEXT,
      ["multiple_choice"],
    );
  });

  it(
    "navigates to /questions with the real result once both the animation and result are ready",
    async () => {
      generateQuestionsActionMock.mockResolvedValue({ ok: true, data: TEST_GENERATION_RESPONSE });
      const user = userEvent.setup();

      renderWithSession(<GeneratePage />, {
        config: TEST_CONFIG,
        generationContext: TEST_GENERATION_CONTEXT,
      });

      expect(generateQuestionsActionMock).toHaveBeenCalledTimes(1);

      await runAnimationToEnd();

      const button = screen.getByRole("button", { name: /view questions/i });
      await user.click(button);

      expect(push).toHaveBeenCalledWith("/questions");
    },
    15000,
  );

  it(
    "shows an error state and does not navigate when generation fails",
    async () => {
      generateQuestionsActionMock.mockResolvedValue({
        ok: false,
        stage: "provider",
        error: "Unable to reach the Gemini API.",
      });

      renderWithSession(<GeneratePage />, {
        config: TEST_CONFIG,
        generationContext: TEST_GENERATION_CONTEXT,
      });

      await runAnimationToEnd();

      expect(screen.getByText(/unable to reach the gemini api/i)).toBeInTheDocument();
      expect(push).not.toHaveBeenCalled();
    },
    15000,
  );
});
