import { getQuestionPatternsForSubtopic, getSubjectWithSubtopics } from "@/lib/db/education";
import { getGenerationContext } from "@/lib/db/generation-context";
import { buildPrompt } from "@/lib/prompts/builder";
import { QUESTION_TYPE_CODES, type Difficulty, type QuestionType } from "@/lib/types";

export const dynamic = "force-dynamic";

const VALID_DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];
const VALID_QUESTION_TYPES: QuestionType[] = [...QUESTION_TYPE_CODES];

export default async function PromptPreviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rawDifficulty = typeof params.difficulty === "string" ? params.difficulty : "medium";
  const difficulty: Difficulty = VALID_DIFFICULTIES.includes(rawDifficulty as Difficulty)
    ? (rawDifficulty as Difficulty)
    : "medium";

  const rawQuestionType =
    typeof params.questionType === "string" ? params.questionType : "mc";
  const questionType: QuestionType = VALID_QUESTION_TYPES.includes(rawQuestionType as QuestionType)
    ? (rawQuestionType as QuestionType)
    : "mc";

  const count = Number(params.count) > 0 ? Number(params.count) : 5;

  const data = await getSubjectWithSubtopics("Mathematics", "Algebra");
  if (!data || data.subtopics.length === 0) {
    return (
      <main className="p-8 font-mono text-sm">
        <h1 className="text-lg font-bold mb-4">Prompt Preview</h1>
        <p>Unable to load Subject/Subtopic data.</p>
      </main>
    );
  }

  const requestedSubtopicId = typeof params.subtopicId === "string" ? params.subtopicId : null;
  const subtopic =
    data.subtopics.find((s) => s.id === requestedSubtopicId) ?? data.subtopics[0];

  const patternsResult = await getQuestionPatternsForSubtopic(subtopic.id);
  if (!patternsResult.ok) {
    return (
      <main className="p-8 font-mono text-sm">
        <h1 className="text-lg font-bold mb-4">Prompt Preview</h1>
        <p>{patternsResult.error}</p>
      </main>
    );
  }

  const contextResult = await getGenerationContext({
    subjectName: data.subject.name,
    subtopicId: subtopic.id,
    subtopicName: subtopic.name,
    difficulty,
    patternIds: patternsResult.patterns.map((p) => p.id),
  });

  if (!contextResult.ok) {
    return (
      <main className="p-8 font-mono text-sm">
        <h1 className="text-lg font-bold mb-4">Prompt Preview</h1>
        <p>{contextResult.error}</p>
      </main>
    );
  }

  const finalPrompt = buildPrompt({
    context: contextResult.context,
    questionTypes: [questionType],
    questionCount: count,
  });

  return (
    <main className="p-8 font-mono text-sm space-y-8">
      <h1 className="text-lg font-bold">Prompt Preview</h1>

      <section>
        <h2 className="font-bold mb-2">Selected Context</h2>
        <pre className="whitespace-pre-wrap">
          {JSON.stringify(
            {
              subject: data.subject.name,
              subtopic: subtopic.name,
              difficulty,
              questionType,
              questionCount: count,
            },
            null,
            2,
          )}
        </pre>
      </section>

      <section>
        <h2 className="font-bold mb-2">Loaded Generation Context</h2>
        <pre className="whitespace-pre-wrap">{JSON.stringify(contextResult.context, null, 2)}</pre>
      </section>

      <section>
        <h2 className="font-bold mb-2">Final Prompt</h2>
        <pre className="whitespace-pre-wrap border border-border rounded-lg p-4 bg-muted">
          {finalPrompt}
        </pre>
      </section>
    </main>
  );
}
