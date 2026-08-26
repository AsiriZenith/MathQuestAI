# Lesson 12 — Capstone: End-to-End Trace

Goal of this lesson: no new source code. You've already read every function in this trace across Lessons 2 through 9 — this lesson re-walks the four `app/dev/*` inspection routes in full (Lesson 2 §4 only named them one line each), in pipeline order, and then assembles one complete trace spanning the whole curriculum. If you can follow every step below without needing to re-open an earlier lesson, the previous eleven connected.

---

## 1. `app/dev/db-check` — the shallowest checkpoint

```tsx
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DbCheckPage() {
  const subjects = await prisma.subject.findMany();
  return (
    <main className="p-8 font-mono text-sm">
      <h1 className="text-lg font-bold mb-4">DB Connectivity Check — Subjects</h1>
      <pre>{JSON.stringify(subjects, null, 2)}</pre>
    </main>
  );
}
```

The entire route. It proves exactly one thing: the Prisma client (`lib/prisma.ts`, Lesson 3) can reach the real, seeded database — nothing about `Topic`/`Subtopic`/`QuestionPattern` relations, nothing about context assembly. This is the narrowest possible checkpoint in the whole pipeline: one link, isolated, with no dependency on anything from Lesson 4 onward.

---

## 2. `app/dev/prompt-preview` — the researcher's actual tool

This route is the concrete answer to a question Lessons 1 and 6 kept deferring: how does a researcher actually iterate on prompt wording without spending an AI call every time? It reads URL search params, validates each one defensively rather than trusting the URL string outright —

```ts
const rawDifficulty = typeof params.difficulty === "string" ? params.difficulty : "medium";
const difficulty: Difficulty = VALID_DIFFICULTIES.includes(rawDifficulty as Difficulty)
  ? (rawDifficulty as Difficulty)
  : "medium";
```

— then runs the exact same chain the real app runs, straight from a Server Component with no UI:

```ts
const data = await getSubjectWithSubtopics("Mathematics", "Algebra");           // Lesson 4
const patternsResult = await getQuestionPatternsForSubtopic(subtopic.id);        // Lesson 4
const contextResult = await getGenerationContext({ subjectName, subtopicId, subtopicName, difficulty, patternIds }); // Lesson 4
const finalPrompt = buildPrompt({ context: contextResult.context, questionTypes: [questionType], questionCount: count }); // Lesson 6
```

And renders three panels, each one a different altitude on the same data: **Selected Context** (what the URL asked for), **Loaded Generation Context** (the actual `GenerationContext` object from Lesson 4 — patterns, their `generationPrompt`s, their reference questions), and **Final Prompt** (the literal string `buildPrompt` produced, Lesson 6's seven sections rendered exactly as the AI would see them). Changing what this page shows means editing `lib/prompts/builder.ts` or `lib/prompts/common.ts` and refreshing a URL — zero AI spend, zero database writes. This is Lesson 1's research loop, closed at exactly the "Build Prompt" step, made into a tool you can actually click.

---

## 3. `app/dev/ai-provider-check` — isolating one link on purpose

Look closely at where this route's context comes from:

```ts
const TEST_CONTEXT: GenerationContext = {
  subjectName: "Mathematics",
  subtopicName: "Simplify & Calculate",
  difficulty: "easy",
  patterns: [{ id: "verification-pattern", name: "Combine Like Terms", generationPrompt: "...", referenceQuestions: [] }],
};
```

Hardcoded — not `getGenerationContext`, not the database at all. This is deliberate: if this route fails, the failure can only mean the AI-provider link is broken, never that the database or context loading is broken, because those two things aren't even in the call path. It's the same "isolate at the seam" instinct you saw in Lesson 10's test suite, applied here as a manual debugging tool instead of an automated test.

```ts
const prompt = buildPrompt({ context: TEST_CONTEXT, questionTypes: ["multiple_choice"], questionCount: 1 }); // Lesson 6
const provider = new HttpAiProvider();                                                                        // Lesson 7
const result = await provider.generate({ prompt, responseJsonSchema });
// ...
const parsed = parseGenerationResponse(result.rawText);                                                       // Lesson 6
```

The page then shows **both** the raw provider text and the result of running it through `parseGenerationResponse`, side by side. That's a deliberate two-layer checkpoint: it lets you tell apart "the provider is unreachable" (`result.ok === false` — Lesson 7's `HttpAiProvider` failure modes) from "the provider responded, but the model's output doesn't satisfy the schema" (`result.ok === true`, `parsed.ok === false` — Lesson 6's zod validation). Those are exactly the `"provider"` and `"validation"` stages of `GenerateQuestionsResult` from Lesson 8, now inspectable independently rather than only as a single combined pass/fail.

---

## 4. `app/dev/generate-questions-check` — the full real chain, UI-free

The only one of the four that calls `generateQuestions()` (Lesson 8) itself — the same function `generateQuestionsAction` wraps in the real app, called here directly from a Server Component with no Server Action, no `PracticeSessionProvider`, no click:

```ts
const data = await getSubjectWithSubtopics("Mathematics", "Algebra");                    // Lesson 4
const patternsResult = await getQuestionPatternsForSubtopic(subtopic.id);                 // Lesson 4
const contextResult = await getGenerationContext({ ..., difficulty: "medium", patternIds: patternsResult.patterns.map((p) => p.id) }); // Lesson 4
const result = await generateQuestions(contextResult.context, ["multiple_choice"]);       // Lesson 6, 7, 8 chained internally
```

Hardcoded inputs (the first subtopic, every one of its patterns, medium difficulty, multiple choice only) stand in for whatever the Setup form would normally collect from a user. The rendered output is a direct view of the `GenerateQuestionsResult` union from Lesson 8:

```tsx
<p>Result: {result.ok ? "SUCCESS" : `FAILED at stage: ${result.stage}`}</p>
```

This is the single route that exercises the longest real chain — database through AI response — without touching a browser click at any point.

---

## 5. The gap: there is no evaluation checkpoint

Notice what none of the four routes do: not one of them calls `prepareEvaluation` or `evaluateGeneration` (Lesson 9). The dev routes, taken together, cover exactly database → context → prompt → AI response → validated questions — and stop there. If you want to see the evaluation engine actually run, the only way is the real browser flow: Setup → Generate → Questions → the evaluation dialog (Lesson 5's `EvaluationMethodDialog`, Lesson 8's `prepareEvaluationAction`) → `/evaluation`. This isn't a mistake to go looking for a fix for — it's an honest, verifiable fact about the current state of this codebase's manual-testing tooling, worth knowing so you don't spend time hunting for an "evaluate-check" route that doesn't exist.

---

## 6. The full trace, start to finish

Putting every lesson together, one "Generate Questions" click resolves to this complete chain:

```
app/_components/setup-form.tsx (handleGenerate)                    [L2, L5]
  → loadGenerationContextAction()            lib/actions/setup.ts   [L2, L8]
    → getGenerationContext()                 lib/db/generation-context.ts  [L4]  ← inspect via /dev/prompt-preview
  → setConfig / setGenerationContext         PracticeSessionProvider       [L5]
  → router.push("/generate")

app/generate/page.tsx (useEffect)                                   [L5]
  → generateQuestionsAction()                lib/actions/generation.ts    [L2, L8]
    → generateQuestions()                    lib/generation/generate-questions.ts  [L8]  ← inspect via /dev/generate-questions-check
      → buildPrompt()                        lib/prompts/builder.ts       [L6]  ← inspect via /dev/prompt-preview
      → provider.generate()                  lib/ai/http-provider.ts      [L7]  ← inspect via /dev/ai-provider-check
      → parseGenerationResponse()            lib/prompts/schema.ts        [L6]  ← inspect via /dev/ai-provider-check
  → setGenerationResponse / setGenerationMeta  PracticeSessionProvider    [L5]
  → router.push("/questions")

app/questions/page.tsx → EvaluationMethodDialog                     [L5]
  → prepareEvaluationAction()                lib/actions/evaluation.ts   [L8]
    → prepareEvaluation()                    lib/evaluation/prepare-evaluation.ts  [L9]  ← no dev route; browser only
      → evaluateGeneration()                 lib/evaluation/evaluate-generation.ts [L9]
        → six dimension scorers               lib/evaluation/dimensions/*.ts        [L9]
  → setEvaluationData                        PracticeSessionProvider     [L5]
  → router.push("/evaluation")

app/evaluation/page.tsx → 11 report components  app/evaluation/_components/*  [L9]
```

Every stage traces back to a lesson; every stage but one (evaluation) has a dev route that lets you inspect it without going through the full browser flow; and the underlying database schema (Lesson 3), the Server Action/Server Component boundary (Lesson 2), and the test suite that keeps all of it honest without a live AI call (Lesson 10) sit underneath every box in this diagram, not called out again here because they're not steps in the request itself — they're the foundation the request runs on.

This trace **is** `docs/project-management/project.md`'s research loop from Lesson 1 — `Define Context → Build Prompt → Generate Questions → Evaluate Results` — now named down to the exact file and function at every arrow, rather than a four-box diagram. That was the whole point of these twelve lessons: not to memorize the diagram, but to be able to redraw it yourself, correctly, from the actual code.

---

## Checkpoint

Answer these in your own words. No answer key — if any of these feel shaky, this is the moment to go back to the specific lesson, not just this one.

1. Why does `app/dev/ai-provider-check` use a hardcoded `TEST_CONTEXT` instead of loading real data via `lib/db/*`, when the other three routes all hit the real database?
2. If `app/dev/generate-questions-check` reports `"FAILED at stage: validation"`, which specific file's logic just rejected the AI's response, and what would you check first?
3. Which lesson's code has no corresponding `app/dev/*` inspection route at all, and how would you exercise it manually instead?
4. `app/dev/prompt-preview` never calls an AI provider. What does that let a researcher iterate on for free, and which two files would they actually edit to change the prompt it shows?
5. Trace, from memory, the full list of files a single "Generate Questions" click passes through from `app/_components/setup-form.tsx` to a rendered score on `/evaluation` — naming at least eight.
