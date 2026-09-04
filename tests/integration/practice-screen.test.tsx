import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PracticePage from "@/app/questions/practice/[questionNumber]/page";
import { renderWithSession, TEST_CONFIG, TEST_GENERATION_RESPONSE } from "../test-utils";
import type { GenerationResponse } from "@/lib/prompts/types";

// The mock mirrors real navigation just enough for tests: pushing a practice URL
// updates the params the (mocked) useParams hook returns, so a follow-up rerender
// shows the destination question.
const push = vi.fn((url: string) => {
  const match = /\/questions\/practice\/(\d+)/.exec(url);
  if (match) params = { questionNumber: match[1] };
});
const replace = vi.fn();
let params: Record<string, string> = { questionNumber: "3" };

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
  useParams: () => params,
}));

/** A generation whose single question is a non-multiple-choice type (no options). */
const FIB_RESPONSE: GenerationResponse = {
  questions: [
    {
      questionNumber: 1,
      questionText: "Fill in the blank: 2 + ___ = 5.",
      questionType: "fib",
      questionPatternId: "pattern-a",
      correctAnswer: "3",
      explanation: "5 minus 2 is 3.",
    },
  ],
};

function renderPractice(
  questionNumber: string,
  response: GenerationResponse = TEST_GENERATION_RESPONSE,
) {
  params = { questionNumber };
  return renderWithSession(<PracticePage />, {
    config: TEST_CONFIG,
    generationResponse: response,
  });
}

/** Move the practice countdown forward by `seconds` whole seconds. */
function tick(seconds: number) {
  act(() => {
    vi.advanceTimersByTime(seconds * 1000);
  });
}

describe("Try Question practice screen", () => {
  beforeEach(() => {
    push.mockClear();
    replace.mockClear();
    params = { questionNumber: "3" };
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const setup = () =>
    userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

  it("shows the exact question whose Try Question action was used", () => {
    renderPractice("3");

    expect(screen.getByText("Question 3")).toBeInTheDocument();
    expect(screen.getByText("Simplify the expression 3.")).toBeInTheDocument();
    // no other generated question leaks onto the focused screen
    expect(screen.queryByText("Simplify the expression 4.")).not.toBeInTheDocument();
  });

  it("redirects back to the questions list when the question number is unknown", () => {
    renderPractice("999");
    expect(replace).toHaveBeenCalledWith("/questions");
  });

  it("uses a sensible default duration and lets the user change it before starting", async () => {
    const user = setup();
    renderPractice("3");

    await user.click(screen.getByRole("button", { name: "3 minutes" }));
    await user.click(screen.getByRole("button", { name: /start/i }));

    expect(screen.getByRole("timer")).toHaveTextContent("03:00");
  });

  it("defaults to 2 minutes when the duration is not changed", async () => {
    const user = setup();
    renderPractice("3");

    await user.click(screen.getByRole("button", { name: /start/i }));

    expect(screen.getByRole("timer")).toHaveTextContent("02:00");
  });

  it("counts down once started", async () => {
    const user = setup();
    renderPractice("3");

    await user.click(screen.getByRole("button", { name: /start/i }));
    tick(1);

    expect(screen.getByRole("timer")).toHaveTextContent("01:59");
  });

  it("stops at 00:00 without submitting, navigating, or revealing the answer", async () => {
    const user = setup();
    renderPractice("3");

    await user.click(screen.getByRole("button", { name: "1 minute" }));
    await user.click(screen.getByRole("button", { name: /start/i }));
    tick(75); // well past the full minute

    expect(screen.getByRole("timer")).toHaveTextContent("00:00");
    expect(push).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
    expect(screen.queryByText("Because A is correct.")).not.toBeInTheDocument();
    expect(screen.getByText("Simplify the expression 3.")).toBeInTheDocument();
    // answer reveal is still available afterwards
    expect(screen.getByRole("button", { name: /view answer/i })).toBeInTheDocument();
  });

  it("reveals the correct answer and explanation only on user action", async () => {
    const user = setup();
    renderPractice("3");

    await user.click(screen.getByRole("button", { name: /start/i }));
    expect(screen.queryByText("Because A is correct.")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /view answer/i }));
    expect(screen.getByText(/^A$/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /explanation/i }));
    expect(screen.getByText("Because A is correct.")).toBeInTheDocument();
  });

  it("resets to a fresh attempt when the same question is reopened", async () => {
    const user = setup();
    const { unmount } = renderPractice("3");

    await user.click(screen.getByRole("button", { name: /start/i }));
    tick(5);
    await user.click(screen.getByRole("button", { name: /view answer/i }));
    unmount();

    renderPractice("3");
    expect(screen.queryByRole("timer")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start/i })).toBeInTheDocument();
    expect(screen.queryByText("Because A is correct.")).not.toBeInTheDocument();
  });

  it("does not leak timer or reveal state between different questions", async () => {
    const user = setup();
    const { unmount } = renderPractice("1");

    await user.click(screen.getByRole("button", { name: "5 minutes" }));
    await user.click(screen.getByRole("button", { name: /start/i }));
    tick(10);
    await user.click(screen.getByRole("button", { name: /view answer/i }));
    unmount();

    renderPractice("2");
    expect(screen.getByText("Question 2")).toBeInTheDocument();
    expect(screen.queryByRole("timer")).not.toBeInTheDocument();
    // duration control is back to the default, not the previous "5 minutes"
    await user.click(screen.getByRole("button", { name: /start/i }));
    expect(screen.getByRole("timer")).toHaveTextContent("02:00");
  });

  it("shows the multiple-choice options for a multiple-choice question", async () => {
    const user = setup();
    renderPractice("3");
    await user.click(screen.getByRole("button", { name: /start/i }));

    expect(screen.getByText("Option A")).toBeInTheDocument();
    expect(screen.getByText("Option B")).toBeInTheDocument();
    expect(screen.getByText("Option C")).toBeInTheDocument();
    expect(screen.getByText("Option D")).toBeInTheDocument();
  });

  it("works for a non-multiple-choice question without options", async () => {
    const user = setup();
    renderPractice("1", FIB_RESPONSE);

    await user.click(screen.getByRole("button", { name: /start/i }));
    expect(screen.getByText("Fill in the blank: 2 + ___ = 5.")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /view answer/i }));
    await user.click(screen.getByRole("button", { name: /explanation/i }));
    expect(screen.getByText("5 minus 2 is 3.")).toBeInTheDocument();
  });

  it("returns to the questions list via the back control", async () => {
    const user = setup();
    renderPractice("3");

    await user.click(screen.getByRole("button", { name: /back to questions/i }));
    expect(push).toHaveBeenCalledWith("/questions");
  });

  describe("custom practice time", () => {
    const customInput = () => screen.getByLabelText(/custom time/i);

    it("starts the countdown from a valid custom number of minutes", async () => {
      const user = setup();
      renderPractice("3");

      await user.type(customInput(), "7");
      await user.click(screen.getByRole("button", { name: /start/i }));

      expect(screen.getByRole("timer")).toHaveTextContent("07:00");
    });

    it("lets a custom value override a previously selected preset", async () => {
      const user = setup();
      renderPractice("3");

      await user.click(screen.getByRole("button", { name: "2 minutes" }));
      await user.type(customInput(), "7");

      // the preset must no longer read as the active duration
      expect(screen.getByRole("button", { name: "2 minutes" })).toHaveAttribute(
        "aria-pressed",
        "false",
      );

      await user.click(screen.getByRole("button", { name: /start/i }));
      expect(screen.getByRole("timer")).toHaveTextContent("07:00");
    });

    it("lets a preset override a previously typed custom value", async () => {
      const user = setup();
      renderPractice("3");

      await user.type(customInput(), "7");
      await user.click(screen.getByRole("button", { name: "3 minutes" }));
      await user.click(screen.getByRole("button", { name: /start/i }));

      expect(screen.getByRole("timer")).toHaveTextContent("03:00");
    });

    it("does not start and shows a validation message for a zero custom value", async () => {
      const user = setup();
      renderPractice("3");

      await user.type(customInput(), "0");
      await user.click(screen.getByRole("button", { name: /start/i }));

      expect(screen.queryByRole("timer")).not.toBeInTheDocument();
      expect(screen.getByRole("alert")).toHaveTextContent(
        /whole number between 1 and 60 minutes/i,
      );
    });

    it("does not start for a custom value above the maximum", async () => {
      const user = setup();
      renderPractice("3");

      await user.type(customInput(), "61");
      await user.click(screen.getByRole("button", { name: /start/i }));

      expect(screen.queryByRole("timer")).not.toBeInTheDocument();
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("does not start for a decimal custom value", async () => {
      const user = setup();
      renderPractice("3");

      await user.type(customInput(), "1.5");
      await user.click(screen.getByRole("button", { name: /start/i }));

      expect(screen.queryByRole("timer")).not.toBeInTheDocument();
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("does not start when custom mode is active but the field is empty", async () => {
      const user = setup();
      renderPractice("3");

      await user.type(customInput(), "5");
      await user.clear(customInput());
      await user.click(screen.getByRole("button", { name: /start/i }));

      expect(screen.queryByRole("timer")).not.toBeInTheDocument();
    });

    it("still stops a custom countdown at 00:00 without any automatic action", async () => {
      const user = setup();
      renderPractice("3");

      await user.type(customInput(), "1");
      await user.click(screen.getByRole("button", { name: /start/i }));
      tick(75);

      expect(screen.getByRole("timer")).toHaveTextContent("00:00");
      expect(push).not.toHaveBeenCalled();
      expect(replace).not.toHaveBeenCalled();
      expect(screen.queryByText("Because A is correct.")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: /view answer/i })).toBeInTheDocument();
    });
  });

  describe("next question navigation", () => {
    const MIXED_RESPONSE: GenerationResponse = {
      questions: [
        {
          questionNumber: 1,
          questionText: "MC question one.",
          questionType: "mc",
          questionPatternId: "pattern-a",
          options: [
            { id: "A", text: "First option" },
            { id: "B", text: "Second option" },
          ],
          correctAnswer: "A",
          explanation: "Q1 explanation.",
        },
        {
          questionNumber: 2,
          questionText: "Fill in the blank question two.",
          questionType: "fib",
          questionPatternId: "pattern-a",
          correctAnswer: "42",
          explanation: "Q2 explanation.",
        },
      ],
    };

    const reveal = async (user: ReturnType<typeof setup>) => {
      await user.click(screen.getByRole("button", { name: /start/i }));
      await user.click(screen.getByRole("button", { name: /view answer/i }));
      await user.click(screen.getByRole("button", { name: /show explanation/i }));
    };

    it("does not offer Next Question before the answer is revealed", async () => {
      const user = setup();
      renderPractice("2");

      await user.click(screen.getByRole("button", { name: /start/i }));

      expect(screen.queryByRole("button", { name: /next question/i })).not.toBeInTheDocument();
    });

    it("does not offer Next Question after the answer but before the explanation", async () => {
      const user = setup();
      renderPractice("2");

      await user.click(screen.getByRole("button", { name: /start/i }));
      await user.click(screen.getByRole("button", { name: /view answer/i }));

      expect(screen.queryByRole("button", { name: /next question/i })).not.toBeInTheDocument();
    });

    it("offers Next Question once the answer and explanation are revealed", async () => {
      const user = setup();
      renderPractice("2");

      await reveal(user);

      expect(screen.getByRole("button", { name: /next question/i })).toBeInTheDocument();
    });

    it("moves to the next generated question as a fresh attempt", async () => {
      const user = setup();
      const { rerender } = renderPractice("2");

      await reveal(user);
      await user.click(screen.getByRole("button", { name: /next question/i }));

      expect(push).toHaveBeenCalledWith("/questions/practice/3");

      rerender(<PracticePage />);

      expect(screen.getByText("Question 3")).toBeInTheDocument();
      expect(screen.getByText("Simplify the expression 3.")).toBeInTheDocument();
      // fresh: back at setup, no timer, previous reveal gone
      expect(screen.queryByRole("timer")).not.toBeInTheDocument();
      expect(screen.queryByText("Because A is correct.")).not.toBeInTheDocument();
      // duration reset to the default preset
      expect(screen.getByRole("button", { name: "2 minutes" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await user.click(screen.getByRole("button", { name: /start/i }));
      expect(screen.getByRole("timer")).toHaveTextContent("02:00");
    });

    it("shows Back to Questions instead of Next Question on the final question", async () => {
      const user = setup();
      renderPractice("10");

      await reveal(user);

      expect(screen.queryByRole("button", { name: /next question/i })).not.toBeInTheDocument();

      const backButtons = screen.getAllByRole("button", { name: /back to questions/i });
      expect(backButtons.length).toBeGreaterThanOrEqual(2); // top + bottom
      await user.click(backButtons[backButtons.length - 1]);
      expect(push).toHaveBeenCalledWith("/questions");
    });

    it("carries no stale data across question types when navigating", async () => {
      const user = setup();
      const { rerender } = renderPractice("1", MIXED_RESPONSE);

      await user.click(screen.getByRole("button", { name: /start/i }));
      expect(screen.getByText("First option")).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: /view answer/i }));
      await user.click(screen.getByRole("button", { name: /show explanation/i }));
      expect(screen.getByText("Q1 explanation.")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /next question/i }));
      expect(push).toHaveBeenCalledWith("/questions/practice/2");

      rerender(<PracticePage />);

      expect(screen.getByText("Question 2")).toBeInTheDocument();
      expect(screen.getByText("Fill in the blank question two.")).toBeInTheDocument();
      expect(screen.queryByRole("list")).not.toBeInTheDocument(); // no stale mc options
      expect(screen.queryByText("First option")).not.toBeInTheDocument();
      expect(screen.queryByText("Q1 explanation.")).not.toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /start/i }));
      await user.click(screen.getByRole("button", { name: /view answer/i }));
      await user.click(screen.getByRole("button", { name: /show explanation/i }));
      expect(screen.getByText("42")).toBeInTheDocument();
      expect(screen.getByText("Q2 explanation.")).toBeInTheDocument();
    });
  });
});
