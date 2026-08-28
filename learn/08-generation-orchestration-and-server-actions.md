# Lesson 8 — Generation Orchestration & Server Actions

Goal of this lesson: read the code that actually chains Lessons 4, 6, and 7 together — `lib/generation/generate-questions.ts`, plus the three thin Server Action files in `lib/actions/`. By the end of this lesson you should be able to trace a click on "Generate Questions" all the way to a validated AI response, naming every file the request passes through and why each one exists. Nothing new conceptually happens here — every individual piece (database context, prompt building, the AI provider) was covered in an earlier lesson. This lesson is the wiring.

---

## 1. `lib/generation/generate-questions.ts` — the orchestration function

```ts
export type GenerateQuestionsResult =
  | { ok: true; data: GenerationResponse; prompt: string; requestedQuestionCount: number }
  | { ok: false; stage: "prompt" | "provider" | "validation"; error: string };

export async function generateQuestions(
  context: GenerationContext,
  questionTypes: AiQuestionType[] | "auto",
  provider: AiProvider = new HttpAiProvider(),
): Promise<GenerateQuestionsResult> {
  if (context.patterns.length === 0) {
    console.error("generateQuestions: prompt stage failed - no question patterns in context");
    return { ok: false, stage: "prompt", error: "No question patterns available for this context." };
  }

  const prompt = buildPrompt({ context, questionTypes, questionCount: DEFAULT_QUESTION_COUNT });

  console.log("generateQuestions: generation started");

  const responseJsonSchema = z.toJSONSchema(generationResponseSchema);
  const providerResult = await provider.generate({ prompt, responseJsonSchema });

  if (!providerResult.ok) {
    console.error("generateQuestions: provider stage failed");
    return { ok: false, stage: "provider", error: providerResult.error };
  }

  const parsed = parseGenerationResponse(providerResult.rawText);
  if (!parsed.ok) {
    console.error("generateQuestions: validation stage failed");
    return { ok: false, stage: "validation", error: parsed.error };
  }

  console.log("generateQuestions: generation succeeded");
  return { ok: true, data: parsed.data, prompt, requestedQuestionCount: DEFAULT_QUESTION_COUNT };
}
```

Read this as three sequential stages, each named in the failure type itself:

1. **`stage: "prompt"`** — before anything else, guard against an empty pattern list (this shouldn't happen given Lesson 4's `getGenerationContext` already validated pattern selection, but the function doesn't trust its caller blindly), then call `buildPrompt` from Lesson 6 with the context, question types, and `DEFAULT_QUESTION_COUNT` (from `lib/ai/config.ts`, Lesson 7).
2. **`stage: "provider"`** — call `provider.generate({ prompt, responseJsonSchema })`. Notice `responseJsonSchema` is computed fresh here, via `z.toJSONSchema(generationResponseSchema)` — the same zod schema from Lesson 6 that validates the *response*, converted into a JSON Schema and handed to the provider on the way *in*. Lesson 7 already told you `HttpAiProvider` doesn't actually use this field in its HTTP call today — this is the call site that produces it anyway, kept available for a future or alternate provider implementation that could use it.
3. **`stage: "validation"`** — `parseGenerationResponse` (Lesson 6) checks the raw text the provider returned.

Each stage's failure is returned with its own `stage` tag rather than a single generic error, which maps onto `ai-generation.md` §33's error taxonomy: that doc lists five categories (invalid user selection, missing database context, prompt generation error, AI provider failure, invalid AI response). The first two happen *before* this function is ever called — they're `lib/db/*`'s job (Lesson 4) and the Server Action layer's job (section 2 below). `generateQuestions` owns exactly the latter three, and its `stage` field is precise about which one failed — useful for anyone debugging a bad generation run without needing to guess where in the pipeline it broke.

**The provider is injectable.** `provider: AiProvider = new HttpAiProvider()` is a default parameter, not a hardcoded call — this is the exact seam Lesson 7 pointed at when `HttpAiProvider` replaced `GeminiProvider` in TASK-012, and it's the same seam Lesson 10 will use to substitute a fake provider in tests, so generation logic can be tested without a live API call.

**Logging, not persistence.** The `console.log`/`console.error` calls scattered through this function are the concrete implementation of `ai-generation.md` §31: *"The initial project does not require permanent storage of every generated prompt or generated question... normal application logging may be used to debug generation behavior."* No `GenerationLog` table, no history — just server console output for the current run.

**The returned `prompt` isn't incidental.** On success, the function returns `data`, `requestedQuestionCount`, and the exact `prompt` string that was sent — not just the parsed questions. The code's own comment (elided above for brevity) explains why: *"The prompt is returned, not discarded: it is the object of study for the evaluation pipeline, which traces each finding back to a prompt section."* This is where `GenerationMeta` (Lesson 5's `{ prompt, requestedQuestionCount }`) actually comes from — `app/generate/page.tsx` takes this exact return value and hands it to `setGenerationMeta`.

---

## 2. `lib/actions/*.ts` — three thin RPC boundaries

You met the `"use server"` convention in Lesson 2. Now look at what each of the three action files actually adds on top of the library functions they call — in every case, it's either nothing, or one extra null-check.

### `lib/actions/setup.ts` — pure delegation

```ts
export async function loadGenerationContextAction(input: { ... }): Promise<GenerationContextResult> {
  return getGenerationContext(input);
}

export async function loadQuestionPatternsAction(subtopicId: string): Promise<QuestionPatternsResult> {
  return getQuestionPatternsForSubtopic(subtopicId);
}
```

No added logic at all — these two actions exist purely to make `lib/db/*` functions (Lesson 4) reachable from client code, since `lib/db/*` files carry `import "server-only"` and can never be imported by a `"use client"` component directly (Lesson 4 §1). All the validation (empty pattern list, pattern-belongs-to-subtopic) already happened inside `getGenerationContext` itself — there's nothing left for the action to check.

### `lib/actions/generation.ts` — one defensive null-check

```ts
export async function generateQuestionsAction(
  context: GenerationContext | null,
  questionTypes: AiQuestionType[] | "auto",
): Promise<GenerateQuestionsResult> {
  if (!context) {
    return { ok: false, stage: "prompt", error: "Missing generation context." };
  }
  return generateQuestions(context, questionTypes);
}
```

`generateQuestions` (section 1) requires a non-null `GenerationContext`. But `app/generate/page.tsx` reads `generationContext` out of `usePracticeSession()` as `GenerationContext | null` (Lesson 5 — it's `null` until the Setup form sets it, and wiped on a hard refresh). Rather than let a `null` reach `generateQuestions` and crash on `context.patterns`, this action checks it first and returns the *same* `{ ok: false, stage: "prompt", error }` shape `generateQuestions` itself would produce for a prompt-stage failure — from the caller's point of view, a missing context and an empty-pattern context fail identically. This is defense in depth on top of `app/generate/page.tsx`'s own guard-redirect (Lesson 5 §3): that guard should prevent this page from ever calling the action with a null context in practice, but the action doesn't rely on that being true.

### `lib/actions/evaluation.ts` — the same pattern, four fields deep

```ts
export async function prepareEvaluationAction(input: {
  method: EvaluationMethod;
  config: PracticeConfig | null;
  generationContext: GenerationContext | null;
  generationResponse: GenerationResponse | null;
  generationMeta: GenerationMeta | null;
}): Promise<EvaluationPrepResult> {
  const { method, config, generationContext, generationResponse, generationMeta } = input;

  if (!config || !generationContext || !generationResponse || !generationMeta) {
    return { ok: false, error: "Missing session data required to prepare evaluation." };
  }

  return prepareEvaluation({
    method, config, generationContext, generationResponse,
    prompt: generationMeta.prompt,
    requestedQuestionCount: generationMeta.requestedQuestionCount,
  });
}
```

Same idea as `generation.ts`, scaled to four required context values instead of one — every one of them is `| null` because that's genuinely how `usePracticeSession()` types them (Lesson 5), and this action is the last checkpoint before `prepareEvaluation` (Lesson 9's subject) can assume all four are actually present. Notice it also does one small reshaping: `generationMeta.prompt` and `generationMeta.requestedQuestionCount` are unpacked into separate top-level fields for `prepareEvaluation`'s input — a small adapter between how the client's context groups these values and how the evaluation function wants them.

---

## 3. The full trace: one click, seven files

Put Lessons 2, 4, 5, 6, 7, and this lesson's two sections together, and a single "Generate Questions" click resolves to this chain:

```
app/_components/setup-form.tsx (handleGenerate)
  → loadGenerationContextAction()            [lib/actions/setup.ts]
    → getGenerationContext()                 [lib/db/generation-context.ts, Lesson 4]
  → setConfig / setGenerationContext         [PracticeSessionProvider, Lesson 5]
  → router.push("/generate")

app/generate/page.tsx (useEffect)
  → generateQuestionsAction()                [lib/actions/generation.ts]
    → generateQuestions()                    [lib/generation/generate-questions.ts]
      → buildPrompt()                        [lib/prompts/builder.ts, Lesson 6]
      → provider.generate()                  [lib/ai/http-provider.ts, Lesson 7]
      → parseGenerationResponse()            [lib/prompts/schema.ts, Lesson 6]
  → setGenerationResponse / setGenerationMeta [PracticeSessionProvider, Lesson 5]
  → router.push("/questions")
```

Every arrow in this chain is either a Server Action call (client → server, Lesson 2), a plain function call (server-side, no network boundary), or a context write (Lesson 5). No step in this chain does more than one job — this is `ai-generation.md` §42's "Separation of Concerns" diagram (UI → Generation Request → Context Loader → Prompt Builder → AI Provider → Response Parser → Evaluation) realized almost verbatim in actual file boundaries.

---

**Explicitly out of scope for this lesson** (deferred, not forgotten):

- What `prepareEvaluation` actually does with its five inputs, and how scoring works → Lesson 9
- How tests substitute a fake `AiProvider` to make this whole chain deterministic → Lesson 10

---

## Checkpoint

Answer these in your own words before moving to Lesson 9. No answer key — if any of these feel shaky, re-read the relevant section above.

1. `generateQuestions`'s failure type has three `stage` values, but `ai-generation.md` §33 lists five error categories. Which two categories are handled *before* `generateQuestions` is ever called, and by what code?
2. Why does `generateQuestions` compute `responseJsonSchema` via `z.toJSONSchema(generationResponseSchema)` and pass it to the provider, when Lesson 7 established that `HttpAiProvider` doesn't currently use that field?
3. `lib/actions/setup.ts`'s two actions add zero logic beyond calling a `lib/db` function directly. Why don't they need to re-validate anything?
4. `lib/actions/generation.ts` checks for a `null` context even though `app/generate/page.tsx` already redirects away if `generationContext` is `null` (Lesson 5). Is that check redundant? Why might it still be worth keeping?
5. Why is the successful `GenerateQuestionsResult` shape `{ data, prompt, requestedQuestionCount }` instead of just `{ data }`? What later part of the app depends on the extra two fields?
