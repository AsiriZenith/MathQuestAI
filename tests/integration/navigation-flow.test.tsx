import { beforeEach, describe, expect, it, vi } from "vitest";
import { waitFor } from "@testing-library/react";
import QuestionsPage from "@/app/questions/page";
import EvaluationPage from "@/app/evaluation/page";
import ComparisonPage from "@/app/comparison/page";
import GeneratePage from "@/app/generate/page";
import { renderWithSession, TEST_CONFIG, TEST_GENERATION_RESPONSE } from "../test-utils";

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

  it("redirects /generate to / when config exists but generationContext does not", async () => {
    renderWithSession(<GeneratePage />, { config: TEST_CONFIG });
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
  });

  it("redirects /questions to / when there is no config or generationResponse", async () => {
    renderWithSession(<QuestionsPage />, {});
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
  });

  it("redirects /questions to / when config exists but generationResponse does not", async () => {
    renderWithSession(<QuestionsPage />, { config: TEST_CONFIG });
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
  });

  it("redirects /evaluation to / when there is no config", async () => {
    renderWithSession(<EvaluationPage />, {});
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
  });

  it("redirects /comparison to / when there is no comparison data", async () => {
    renderWithSession(<ComparisonPage />, {});
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
  });

  it("does not redirect /questions when config and generationResponse are present", async () => {
    renderWithSession(<QuestionsPage />, {
      config: TEST_CONFIG,
      generationResponse: TEST_GENERATION_RESPONSE,
    });
    await new Promise((r) => setTimeout(r, 0));
    expect(replace).not.toHaveBeenCalled();
  });
});
