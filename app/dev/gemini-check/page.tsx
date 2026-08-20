import { buildPrompt } from "@/lib/prompts/builder";
import { generationResponseSchema, parseGenerationResponse } from "@/lib/prompts/schema";
import { GeminiProvider } from "@/lib/ai/gemini-provider";
import { GEMINI_MODEL } from "@/lib/ai/config";
import { z } from "zod";
import type { GenerationContext } from "@/lib/types";

export const dynamic = "force-dynamic";

const TEST_CONTEXT: GenerationContext = {
  subjectName: "Mathematics",
  subtopicName: "Simplify / Calculate",
  difficulty: "easy",
  patterns: [
    {
      id: "verification-pattern",
      name: "Combine Like Terms",
      generationPrompt: "Create a very simple combine-like-terms question.",
      referenceQuestions: [],
    },
  ],
};

export default async function GeminiCheckPage() {
  const prompt = buildPrompt({
    context: TEST_CONTEXT,
    questionTypes: ["multiple_choice"],
    questionCount: 1,
  });

  const responseJsonSchema = z.toJSONSchema(generationResponseSchema);
  const provider = new GeminiProvider();
  const result = await provider.generate({ prompt, responseJsonSchema });

  if (!result.ok) {
    return (
      <main className="p-8 font-mono text-sm space-y-4">
        <h1 className="text-lg font-bold">Gemini Connectivity Check</h1>
        <p>Model: {GEMINI_MODEL}</p>
        <p>Connected: NO</p>
        <p>Error: {result.error}</p>
      </main>
    );
  }

  const parsed = parseGenerationResponse(result.rawText);

  return (
    <main className="p-8 font-mono text-sm space-y-6">
      <h1 className="text-lg font-bold">Gemini Connectivity Check</h1>
      <p>Model: {GEMINI_MODEL}</p>
      <p>Connected: YES</p>

      <section>
        <h2 className="font-bold mb-2">Raw Gemini Response</h2>
        <pre className="whitespace-pre-wrap border border-border rounded-lg p-4 bg-muted">
          {result.rawText}
        </pre>
      </section>

      <section>
        <h2 className="font-bold mb-2">Parsed via parseGenerationResponse (TASK-006 pipeline)</h2>
        <p>Valid: {parsed.ok ? "YES" : "NO"}</p>
        {parsed.ok ? (
          <pre className="whitespace-pre-wrap">{JSON.stringify(parsed.data, null, 2)}</pre>
        ) : (
          <p>{parsed.error}</p>
        )}
      </section>
    </main>
  );
}
