# Lesson 4 — Data Access Layer

Goal of this lesson: read the two files that sit directly on top of the Prisma schema from Lesson 3 and turn raw rows into the shapes the rest of the app consumes — `lib/db/education.ts` and `lib/db/generation-context.ts`. This is a short lesson because these files are short and deliberately thin; the value is in seeing the *conventions* they establish (the result-object pattern, the `server-only` guard, the query shape) before you meet more of them in Lessons 6–9.

---

## 1. `server-only` — enforced at the top of every file in this layer

Both files open with the same first line:

```ts
import "server-only";
```

This import has no exports — it exists purely for its side effect. The `server-only` package throws a build error if any file that imports it ends up in a client bundle. Since `lib/db/*` talks to Postgres through the `prisma` singleton from Lesson 3, it must never be reachable from client-side code — a `"use client"` component accidentally importing `getSubjectWithSubtopics` directly (instead of going through a Server Action, Lesson 2 §3) would fail to build, loudly, instead of silently shipping a database client (and your `DATABASE_URL`) to the browser. You'll see this same guard again on `lib/generation/generate-questions.ts`, `lib/evaluation/prepare-evaluation.ts`, and `lib/ai/http-provider.ts` — anywhere server-only secrets or connections are involved. Lesson 10 covers how tests work around this guard (`vitest.config.ts` stubs the package so tests can still import these files in a Node test environment without a real client boundary).

---

## 2. `lib/db/education.ts` — Subject/Topic/Subtopic/Pattern lookups

Two functions, each answering one specific question the UI asks as the user makes selections.

### `getSubjectWithSubtopics` — the one real fetch behind `app/page.tsx`

```ts
export async function getSubjectWithSubtopics(
  subjectName: string,
  topicName: string,
): Promise<SubjectWithSubtopics | null> {
  const subject = await prisma.subject.findFirst({
    where: { name: subjectName },
    select: { id: true, name: true },
  });
  if (!subject) return null;

  const topic = await prisma.topic.findFirst({
    where: { subjectId: subject.id, name: topicName },
    select: {
      id: true,
      name: true,
      subtopics: {
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      },
    },
  });
  if (!topic) return null;

  return {
    subject,
    topic: { id: topic.id, name: topic.name },
    subtopics: topic.subtopics,
  };
}
```

This is the function `app/page.tsx` `await`s directly (Lesson 2 §2) with the hardcoded arguments `"Mathematics"`, `"Algebra"` — the project currently only researches one Subject/Topic pair, so the Setup screen doesn't need a Subject or Topic *selector* at all, only a Subtopic one. Two things to notice in the query shape itself:

- **`select`, not the whole row.** Every query in this file (and the next) names exactly the fields it needs — `{ id: true, name: true }` — rather than fetching a full Prisma model and letting extra columns ride along unused. This keeps the shape returned to callers exactly matching the `SubjectRecord` / `TopicRecord` / `SubtopicRecord` types in `lib/types.ts`, with nothing extra to accidentally leak further up the stack.
- **A nested `select` walks the relation in one round trip.** `topic`'s query asks for `subtopics` inline, ordered by name, in the same `prisma.topic.findFirst` call — one SQL query (Prisma compiles this into a join) instead of a separate `prisma.subtopic.findMany` afterward. This is the direct payoff of the `Subject → Topic → Subtopic` relation structure from Lesson 3: because the relation is declared in the schema, Prisma can traverse it in a single query rather than you hand-writing a second round trip.

The return type, `SubjectWithSubtopics | null`, is a plain nullable value — not yet the `{ ok, ... }` result pattern you'll see next. That's because this function backs a Server *Component* fetch (`app/page.tsx`), which already has its own `if (!data)` fallback-rendering branch; there's no client-side error state to populate, so a plain `null` is enough.

### `getQuestionPatternsForSubtopic` — the `{ ok, ... }` result pattern

```ts
export async function getQuestionPatternsForSubtopic(
  subtopicId: string,
): Promise<QuestionPatternsResult> {
  try {
    const patterns = await prisma.questionPattern.findMany({
      where: { subtopicId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
    return { ok: true, patterns };
  } catch {
    return { ok: false, error: "Unable to load question patterns." };
  }
}
```

Contrast this with the function above: this one is called from a Server *Action* (`loadQuestionPatternsAction` in `lib/actions/setup.ts`, Lesson 2 §3), which is invoked from client-side code that needs to render a loading/error/success state without a page-level fallback to fall back on. So instead of throwing or returning `null`, it returns a **discriminated union**:

```ts
export type QuestionPatternsResult =
  | { ok: true; patterns: QuestionPatternOption[] }
  | { ok: false; error: string };
```

(from `lib/types.ts`). This is the shape you'll see repeated for every function in this layer that a Server Action calls directly: `GenerationContextResult`, `EvaluationPrepResult`, and (in Lesson 7/8) the AI-provider and generation results all follow the identical `{ ok: true; ...data } | { ok: false; error: string }` pattern. The reason it matters here specifically: a caught database error becomes a plain, serializable, typed value the client can branch on (`if (result.ok) { ... } else { ... }`) — never an uncaught exception crossing the Server Action boundary as an opaque "something went wrong on the server" error.

---

## 3. `lib/db/generation-context.ts` — assembling everything a prompt needs

One function, `getGenerationContext`, and it's the busiest piece of code you've seen so far in this curriculum — because it's the first place where "gather everything an AI prompt needs" actually happens. Walk it in order:

```ts
export async function getGenerationContext(input: {
  subjectName: string;
  subtopicId: string;
  subtopicName: string;
  difficulty: Difficulty;
  patternIds: string[];
}): Promise<GenerationContextResult> {
  try {
    if (input.patternIds.length === 0) {
      return { ok: false, error: "Select at least one question pattern." };
    }
```

**Step 1 — validate at the boundary.** `database.md` §28 states the rule this line enforces: *"the server must validate these relationships before constructing the final AI prompt."* An empty pattern selection is rejected here, before any query runs, with the same `{ ok: false, error }` shape you just saw.

```ts
    const patterns = await prisma.questionPattern.findMany({
      where: { id: { in: input.patternIds }, subtopicId: input.subtopicId },
      select: { id: true, name: true },
    });

    if (patterns.length === 0) {
      return { ok: false, error: "No question patterns are available for this subtopic." };
    }
```

**Step 2 — re-validate ownership, not just existence.** The `where` clause filters by `id: { in: patternIds } AND subtopicId: input.subtopicId` together, not `patternIds` alone. This is `database.md` §28's rule again, applied concretely: *"A Question Pattern must belong to the selected Subtopic."* If a caller somehow passed a pattern ID belonging to a different subtopic, this query silently excludes it rather than trusting the client's claim that it belongs — the empty-result check afterward catches the case where none of the requested patterns actually matched.

```ts
    const patternIds = patterns.map((p) => p.id);

    const [generationRequests, referenceQuestions] = await Promise.all([
      prisma.questionGenerationRequest.findMany({
        where: { questionPatternId: { in: patternIds }, difficultyLevel: input.difficulty },
        select: { questionPatternId: true, generationPrompt: true },
      }),
      prisma.referenceQuestion.findMany({
        where: { questionPatternId: { in: patternIds }, difficultyLevel: input.difficulty },
        select: { id: true, questionPatternId: true, questionText: true, expectedAnswer: true, explanation: true },
      }),
    ]);
```

**Step 3 — fetch both difficulty-scoped tables from Lesson 3 in parallel.** `Promise.all` runs the `QuestionGenerationRequest` lookup and the `ReferenceQuestion` lookup concurrently rather than sequentially — they're independent reads (neither depends on the other's result), so there's no reason to `await` one before starting the next. Both are filtered by the *same* `(patternIds, difficulty)` pair, which is exactly the compound key `database.md` §10 describes: the same pattern can have different reference questions and different generation instructions per difficulty level, and this is the query that pulls both difficulty-specific slices at once.

```ts
    const promptByPattern = new Map(
      generationRequests.map((r) => [r.questionPatternId, r.generationPrompt]),
    );

    return {
      ok: true,
      context: {
        subjectName: input.subjectName,
        subtopicName: input.subtopicName,
        difficulty: input.difficulty,
        patterns: patterns.map((pattern) => ({
          id: pattern.id,
          name: pattern.name,
          generationPrompt: promptByPattern.get(pattern.id) ?? null,
          referenceQuestions: referenceQuestions
            .filter((rq) => rq.questionPatternId === pattern.id)
            .map((rq) => ({ id: rq.id, questionText: rq.questionText, expectedAnswer: rq.expectedAnswer, explanation: rq.explanation })),
        })),
      },
    };
  } catch {
    return { ok: false, error: "Unable to load question data." };
  }
}
```

**Step 4 — reshape from "flat query results" to "nested per-pattern context."** The two queries in step 3 come back as flat arrays spanning *all* selected patterns. This last block re-groups them: a `Map` from pattern ID → generation prompt (so each pattern's prompt is a single `.get()` instead of a re-scan), and a `.filter()` per pattern to pull just its own reference questions. The result — `GenerationContext` from `lib/types.ts` — is a list of patterns, each carrying its own prompt and its own reference questions, ready to be handed to the prompt builder in Lesson 6 without that code needing to know anything about SQL, `Map`s, or how the rows were originally shaped. This reshaping step is the actual "turn raw Prisma queries into the shape the rest of the app consumes" promised at the top of this lesson — everything before it was fetching; this is where the DB-shaped data becomes prompt-shaped data.

Note also `generationPrompt: promptByPattern.get(pattern.id) ?? null` — a pattern can have reference questions without a `QuestionGenerationRequest` row for a given difficulty (they're independent tables, both keyed by pattern+difficulty, but neither requires the other to exist). This function tolerates that by falling back to `null` rather than throwing; whether a missing prompt should still allow generation to proceed is a prompt-construction decision, made in Lesson 6, not a data-access one.

---

**Explicitly out of scope for this lesson** (deferred, not forgotten):

- How the Setup screen decides *when* to call `loadQuestionPatternsAction` vs. `loadGenerationContextAction` as the user progresses through selections → Lesson 5
- What `buildPrompt` actually does with a `GenerationContext` once it has one → Lesson 6
- Why a missing `generationPrompt` (`null`) is or isn't treated as a problem at prompt-build time → Lesson 6

---

## Checkpoint

Answer these in your own words before moving to Lesson 5. No answer key — if any of these feel shaky, re-read the relevant section above.

1. Why does `getSubjectWithSubtopics` return `SubjectWithSubtopics | null` while `getQuestionPatternsForSubtopic` returns a `{ ok, ... }` union instead? What's different about how each one is called?
2. What would go wrong (concretely, not just "it'd be insecure") if `lib/db/generation-context.ts` didn't have `import "server-only"` at the top and a client component imported `getGenerationContext` directly, skipping the Server Action?
3. In `getGenerationContext`, why does the `questionPattern.findMany` query filter by both `id: { in: patternIds }` *and* `subtopicId`, instead of just checking pattern IDs against the subtopic afterward in JavaScript?
4. Why are the `QuestionGenerationRequest` and `ReferenceQuestion` lookups run with `Promise.all` instead of two sequential `await`s?
5. If a selected Question Pattern has reference questions for "Hard" but no `QuestionGenerationRequest` row for "Hard," what does `getGenerationContext` return for that pattern's `generationPrompt` — and does the function itself decide whether that's an error?
