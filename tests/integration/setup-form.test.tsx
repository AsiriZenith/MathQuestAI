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
const loadQuestionPatternsAction = vi.fn();
vi.mock("@/lib/actions/setup", () => ({
  loadGenerationContextAction: (...args: unknown[]) => loadGenerationContextAction(...args),
  loadQuestionPatternsAction: (...args: unknown[]) => loadQuestionPatternsAction(...args),
}));

const SUBJECT = { id: "subject-1", name: "Mathematics" };
const TOPIC = { id: "topic-1", name: "Algebra" };
const SUBTOPICS = [{ id: "subtopic-1", name: "Simplify & Calculate" }];

const PATTERNS = [
  { id: "pattern-a", name: "Combine Like Terms" },
  { id: "pattern-b", name: "Apply Distributive Property" },
];

const SAMPLE_CONTEXT: GenerationContext = {
  subjectName: "Mathematics",
  subtopicName: "Simplify & Calculate",
  difficulty: "easy",
  patterns: [],
};

function renderSetupForm() {
  return renderWithSession(<SetupForm subject={SUBJECT} topic={TOPIC} subtopics={SUBTOPICS} />);
}

async function selectSubtopicAndWaitForPatterns(user: ReturnType<typeof userEvent.setup>) {
  await user.selectOptions(screen.getByLabelText(/subtopic/i), "subtopic-1");
  return screen.findByRole("button", { name: "Combine Like Terms" });
}

describe("Setup form", () => {
  beforeEach(() => {
    push.mockClear();
    loadGenerationContextAction.mockReset();
    loadQuestionPatternsAction.mockReset();
    loadQuestionPatternsAction.mockResolvedValue({ ok: true, patterns: PATTERNS });
  });

  it("shows a prompt to select a subtopic before any patterns are loaded", () => {
    renderSetupForm();

    expect(
      screen.getByText(/select a subtopic to see the available question patterns/i),
    ).toBeInTheDocument();
    expect(loadQuestionPatternsAction).not.toHaveBeenCalled();
  });

  it("loads and displays question patterns once a subtopic is selected", async () => {
    const user = userEvent.setup();
    renderSetupForm();

    await user.selectOptions(screen.getByLabelText(/subtopic/i), "subtopic-1");

    expect(loadQuestionPatternsAction).toHaveBeenCalledWith("subtopic-1");
    expect(await screen.findByRole("button", { name: "Combine Like Terms" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Apply Distributive Property" })).toBeInTheDocument();
  });

  it("shows a message when the subtopic has no question patterns", async () => {
    loadQuestionPatternsAction.mockResolvedValue({ ok: true, patterns: [] });
    const user = userEvent.setup();
    renderSetupForm();

    await user.selectOptions(screen.getByLabelText(/subtopic/i), "subtopic-1");

    expect(
      await screen.findByText(/no question patterns are available for this subtopic/i),
    ).toBeInTheDocument();
  });

  it("shows an inline error when question patterns fail to load", async () => {
    loadQuestionPatternsAction.mockResolvedValue({
      ok: false,
      error: "Unable to load question patterns.",
    });
    const user = userEvent.setup();
    renderSetupForm();

    await user.selectOptions(screen.getByLabelText(/subtopic/i), "subtopic-1");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to load question patterns.",
    );
  });

  it("disables Generate Questions until all required fields, including a pattern, are filled", async () => {
    const user = userEvent.setup();
    renderSetupForm();

    const generateButton = screen.getByRole("button", { name: /generate questions/i });
    expect(generateButton).toBeDisabled();

    await selectSubtopicAndWaitForPatterns(user);
    expect(generateButton).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Easy" }));
    expect(generateButton).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Multiple Choice" }));
    expect(generateButton).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Combine Like Terms" }));
    expect(generateButton).toBeEnabled();
  });

  it("selecting the 'use all patterns' toggle satisfies the pattern requirement", async () => {
    const user = userEvent.setup();
    renderSetupForm();

    await selectSubtopicAndWaitForPatterns(user);
    await user.click(screen.getByRole("button", { name: "Easy" }));
    await user.click(screen.getByRole("button", { name: "Multiple Choice" }));

    const generateButton = screen.getByRole("button", { name: /generate questions/i });
    expect(generateButton).toBeDisabled();

    await user.click(screen.getByRole("button", { name: /use all question patterns/i }));
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

  it("toggling a question pattern chip reflects its selected state", async () => {
    const user = userEvent.setup();
    renderSetupForm();

    const patternButton = await selectSubtopicAndWaitForPatterns(user);
    expect(patternButton.className).not.toMatch(/bg-primary\b/);

    await user.click(patternButton);
    expect(patternButton.className).toMatch(/bg-primary\b/);
  });

  it("loads the generation context and navigates to /generate on successful submit", async () => {
    loadGenerationContextAction.mockResolvedValue({ ok: true, context: SAMPLE_CONTEXT });
    const user = userEvent.setup();
    renderSetupForm();

    await selectSubtopicAndWaitForPatterns(user);
    await user.click(screen.getByRole("button", { name: "Easy" }));
    await user.click(screen.getByRole("button", { name: "Multiple Choice" }));
    await user.click(screen.getByRole("button", { name: "Combine Like Terms" }));
    await user.click(screen.getByRole("button", { name: /generate questions/i }));

    expect(await screen.findByText(/generate questions/i)).toBeInTheDocument();
    expect(push).toHaveBeenCalledWith("/generate");
    expect(loadGenerationContextAction).toHaveBeenCalledWith({
      subjectName: "Mathematics",
      subtopicId: "subtopic-1",
      subtopicName: "Simplify & Calculate",
      difficulty: "easy",
      patternIds: ["pattern-a"],
    });
  });

  it("shows an inline error and does not navigate when the context fails to load", async () => {
    loadGenerationContextAction.mockResolvedValue({
      ok: false,
      error: "Unable to load question data.",
    });
    const user = userEvent.setup();
    renderSetupForm();

    await selectSubtopicAndWaitForPatterns(user);
    await user.click(screen.getByRole("button", { name: "Easy" }));
    await user.click(screen.getByRole("button", { name: "Multiple Choice" }));
    await user.click(screen.getByRole("button", { name: "Combine Like Terms" }));
    await user.click(screen.getByRole("button", { name: /generate questions/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to load question data.");
    expect(push).not.toHaveBeenCalled();
  });
});
