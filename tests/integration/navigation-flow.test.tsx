import { beforeEach, describe, expect, it, vi } from "vitest";
import { waitFor } from "@testing-library/react";
import QuestionsPage from "@/app/questions/page";
import EvaluationPage from "@/app/evaluation/page";
import GeneratePage from "@/app/generate/page";
import { renderWithSession, TEST_CONFIG } from "../test-utils";
import { SAMPLE_QUESTIONS } from "@/lib/mock-data";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace }),
}));

describe("Direct navigation without prior session state", () => {
  beforeEach(() => {
    replace.mockClear();
  });

  it("redirects /generate to / when there is no config", async () => {
    renderWithSession(<GeneratePage />, {});
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
  });

  it("redirects /questions to / when there is no config or questions", async () => {
    renderWithSession(<QuestionsPage />, {});
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
  });

  it("redirects /questions to / when config exists but questions do not", async () => {
    renderWithSession(<QuestionsPage />, { config: TEST_CONFIG });
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
  });

  it("redirects /evaluation to / when there is no config", async () => {
    renderWithSession(<EvaluationPage />, {});
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
  });

  it("does not redirect /questions when config and questions are present", async () => {
    renderWithSession(<QuestionsPage />, { config: TEST_CONFIG, questions: SAMPLE_QUESTIONS });
    await new Promise((r) => setTimeout(r, 0));
    expect(replace).not.toHaveBeenCalled();
  });
});
