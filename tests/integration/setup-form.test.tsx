import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SetupForm } from "@/app/_components/setup-form";
import { renderWithSession } from "../test-utils";
import type { GenerationContext } from "@/lib/types";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
}));

const loadGenerationContextAction = vi.fn();
vi.mock("@/lib/actions/setup", () => ({
  loadGenerationContextAction: (...args: unknown[]) => loadGenerationContextAction(...args),
}));

const SUBJECT = { id: "subject-1", name: "Mathematics" };
const TOPIC = { id: "topic-1", name: "Algebra" };
const SUBTOPICS = [{ id: "subtopic-1", name: "Simplify / Calculate" }];

const SAMPLE_CONTEXT: GenerationContext = {
  subjectName: "Mathematics",
  subtopicName: "Simplify / Calculate",
  difficulty: "easy",
  patterns: [],
};

function renderSetupForm() {
  return renderWithSession(<SetupForm subject={SUBJECT} topic={TOPIC} subtopics={SUBTOPICS} />);
}

describe("Setup form", () => {
  beforeEach(() => {
    push.mockClear();
    loadGenerationContextAction.mockReset();
  });

  it("disables Generate Questions until all required fields are filled", async () => {
    const user = userEvent.setup();
    renderSetupForm();

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
    renderSetupForm();

    const easyButton = screen.getByRole("button", { name: "Easy" });
    await user.click(easyButton);
    expect(easyButton.className).toMatch(/bg-emerald-500/);

    await user.click(easyButton);
    expect(easyButton.className).not.toMatch(/bg-emerald-500/);
  });

  it("toggling a question type chip reflects its selected state", async () => {
    const user = userEvent.setup();
    renderSetupForm();

    const mcButton = screen.getByRole("button", { name: "Multiple Choice" });
    expect(mcButton.className).not.toMatch(/bg-primary\b/);

    await user.click(mcButton);
    expect(mcButton.className).toMatch(/bg-primary\b/);
  });

  it("loads the generation context and navigates to /generate on successful submit", async () => {
    loadGenerationContextAction.mockResolvedValue({ ok: true, context: SAMPLE_CONTEXT });
    const user = userEvent.setup();
    renderSetupForm();

    await user.selectOptions(screen.getByLabelText(/subtopic/i), "Simplify / Calculate");
    await user.click(screen.getByRole("button", { name: "Easy" }));
    await user.click(screen.getByRole("button", { name: "Multiple Choice" }));
    await user.click(screen.getByRole("button", { name: /generate questions/i }));

    expect(await screen.findByText(/generate questions/i)).toBeInTheDocument();
    expect(push).toHaveBeenCalledWith("/generate");
    expect(loadGenerationContextAction).toHaveBeenCalledWith({
      subjectName: "Mathematics",
      subtopicId: "subtopic-1",
      subtopicName: "Simplify / Calculate",
      difficulty: "easy",
    });
  });

  it("shows an inline error and does not navigate when the context fails to load", async () => {
    loadGenerationContextAction.mockResolvedValue({
      ok: false,
      error: "Unable to load question data.",
    });
    const user = userEvent.setup();
    renderSetupForm();

    await user.selectOptions(screen.getByLabelText(/subtopic/i), "Simplify / Calculate");
    await user.click(screen.getByRole("button", { name: "Easy" }));
    await user.click(screen.getByRole("button", { name: "Multiple Choice" }));
    await user.click(screen.getByRole("button", { name: /generate questions/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to load question data.");
    expect(push).not.toHaveBeenCalled();
  });
});
