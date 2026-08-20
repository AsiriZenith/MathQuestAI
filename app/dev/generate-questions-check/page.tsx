import { getSubjectWithSubtopics } from "@/lib/db/education";
import { getGenerationContext } from "@/lib/db/generation-context";
import { generateQuestions } from "@/lib/generation/generate-questions";

export const dynamic = "force-dynamic";

export default async function GenerateQuestionsCheckPage() {
  const data = await getSubjectWithSubtopics("Mathematics", "Algebra");
  if (!data || data.subtopics.length === 0) {
    return (
      <main className="p-8 font-mono text-sm">
        <h1 className="text-lg font-bold mb-4">Generate Questions Check</h1>
        <p>Unable to load Subject/Subtopic data.</p>
      </main>
    );
  }

  const subtopic = data.subtopics[0];
  const contextResult = await getGenerationContext({
    subjectName: data.subject.name,
    subtopicId: subtopic.id,
    subtopicName: subtopic.name,
    difficulty: "medium",
  });

  if (!contextResult.ok) {
    return (
      <main className="p-8 font-mono text-sm">
        <h1 className="text-lg font-bold mb-4">Generate Questions Check</h1>
        <p>{contextResult.error}</p>
      </main>
    );
  }

  const result = await generateQuestions(contextResult.context, ["multiple_choice"]);

  return (
    <main className="p-8 font-mono text-sm space-y-6">
      <h1 className="text-lg font-bold">Generate Questions Check</h1>
      <p>Subtopic: {subtopic.name}</p>
      <p>Result: {result.ok ? "SUCCESS" : `FAILED at stage: ${result.stage}`}</p>

      {result.ok ? (
        <section>
          <h2 className="font-bold mb-2">Question Count: {result.data.questions.length}</h2>
          <pre className="whitespace-pre-wrap border border-border rounded-lg p-4 bg-muted">
            {JSON.stringify(result.data, null, 2)}
          </pre>
        </section>
      ) : (
        <p>{result.error}</p>
      )}
    </main>
  );
}
