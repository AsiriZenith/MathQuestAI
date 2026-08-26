# Lesson 10 — Testing Strategy & TDD in Practice

Goal of this lesson: see how `CLAUDE.md` §3's stated TDD approach actually shows up in `tests/`, and — more specifically — how four *different* files in this codebase each solve the same underlying problem (testing code that would otherwise need a live AI API call or a live database) in four genuinely different ways. `ai-generation.md` §34 states the guiding principle directly: *"TDD should focus on the deterministic parts... the AI provider should be isolated behind a mock/fake during most automated tests."* This lesson is about the mechanics of that isolation, file by file.

---

## 1. The `tests/` split, and what actually distinguishes it

```
tests/
├── unit/          — 8 files, no live external dependency
├── integration/   — 2 files, hit the real Postgres database
├── setup.ts
└── stubs/server-only.ts
```

Worth knowing up front: there is exactly **one** npm script — `"test": "vitest run"` — and `vitest.config.ts`'s `include: ["tests/**/*.test.{ts,tsx}"]` picks up both folders identically. Nothing in the tooling itself enforces "unit tests must not touch the network or a database" — that's a naming convention and a discipline, not a hard boundary. What actually makes `tests/integration/database-connection.test.ts` an integration test is simply that it imports `prisma` (Lesson 3's singleton) and calls `prisma.subject.findMany()` for real, against whatever `DATABASE_URL` the environment resolves to — same client, same connection, no substitute of any kind:

```ts
it("connects to the existing PostgreSQL database and reads seeded Subject data", async () => {
  const subjects = await prisma.subject.findMany();
  expect(subjects.length).toBeGreaterThan(0);
  ...
});
```

This only works in CI or on a machine with a real, reachable, seeded database — which is exactly why it's kept separate from `tests/unit/`, even though the test runner doesn't structurally distinguish them.

---

## 2. `vitest.config.ts` and `tests/setup.ts` — making server-only code testable at all

```ts
export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  resolve: {
    alias: {
      "server-only": path.resolve(__dirname, "tests/stubs/server-only.ts"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    css: false,
  },
});
```

Recall from Lesson 4: `lib/db/*`, `lib/generation/generate-questions.ts`, `lib/evaluation/prepare-evaluation.ts`, and `lib/ai/http-provider.ts` all start with `import "server-only"`. In a real Next.js build, that import is resolved to a no-op via bundler-specific conditions that only exist inside Next's build pipeline. Vitest doesn't understand those conditions at all — without help, importing any of those files in a test would throw. The fix is the `resolve.alias` entry: point Vitest at `tests/stubs/server-only.ts`, which is just:

```ts
export {};
```

An empty module. That's the entire stub — it exists purely so the import doesn't fail, with no behavior of its own. This one line is what makes every server-only file in this codebase importable and testable at all, despite being written specifically to be unreachable from client code (Lesson 4 §1).

`tests/setup.ts` does two things: loads `.env.local` via `dotenv` (so any test that reads real environment variables — the integration tests' `DATABASE_URL`, or a test that wants to check `AI_API_KEY` behavior — sees the same values the running app would) and imports `@testing-library/jest-dom/vitest` for DOM assertion matchers, in case a future test renders a component (`environment: "jsdom"` is configured for exactly that, even though most of the current suite doesn't need a DOM at all).

---

## 3. Four ways this codebase tests "code that touches something external"

The most instructive thing about this test suite isn't any one test — it's that four different files solve the mocking problem at four different layers, because each one is testing a different *seam*.

### a. No mocking needed — the dimension scorers are pure functions

`lib/evaluation/dimensions/*` (Lesson 9) take plain data in and return plain data out, with no I/O anywhere inside them. `tests/unit/evaluation-dimensions.test.ts` tests them by simply constructing input objects and calling the functions directly:

```ts
function question(overrides: Partial<GeneratedQuestion> = {}): GeneratedQuestion {
  return {
    questionNumber: 1, questionText: "Simplify 3x + 5x.", questionType: "multiple_choice",
    questionPattern: "Combine Like Terms",
    options: [{ id: "A", text: "8x" }, { id: "B", text: "5x" }, { id: "C", text: "2x" }, { id: "D", text: "15x" }],
    correctAnswer: "A", explanation: "3x and 5x are like terms, so add their coefficients to get 8x.",
    ...overrides,
  };
}

it("scores a perfect match as met", () => {
  const result = evaluateCountAdherence(responseOf([question(), question()]), 2);
  expect(result.score).toBe(1);
  expect(result.status).toBe("met");
});
```

No fake, no mock, no injected dependency — because there's nothing external to fake. This is the cheapest and most direct form of test in the whole suite, and it's only possible because Lesson 9's dimension scorers were written as pure functions in the first place. The `question(overrides)` helper pattern (a builder function with sensible defaults, overridden per test) shows up across this file precisely because most tests only care about one or two fields differing from a realistic baseline question.

### b. Constructor injection — `generateQuestions` accepts a fake `AiProvider`

Recall from Lesson 7/8: `generateQuestions(context, questionTypes, provider: AiProvider = new HttpAiProvider())` takes the provider as a parameter with a real default. `tests/unit/generate-questions.test.ts` exploits exactly that seam:

```ts
function makeFakeProvider(): AiProvider & { generate: ReturnType<typeof vi.fn<...>> } {
  return { generate: vi.fn() };
}

it("fails safely at the provider stage when the provider fails, without returning fake questions", async () => {
  const provider = makeFakeProvider();
  provider.generate.mockResolvedValue({ ok: false, error: "Unable to reach the AI provider." });

  const result = await generateQuestions(CONTEXT, ["multiple_choice"], provider);

  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.stage).toBe("provider");
    expect(result.error).toBe("Unable to reach the AI provider.");
  }
});
```

This file tests all three of `generateQuestions`'s failure stages from Lesson 8 (`"prompt"`, `"provider"`, `"validation"`) by controlling exactly what the fake `provider.generate()` resolves to — a malformed response, a `{ ok: false }` result, an empty pattern list — without ever making a network call. One test even states the point of this design outright in its own name: *"only depends on the AiProvider interface, not any concrete provider implementation"* — the fake object satisfies `AiProvider` structurally and nothing in the test imports `HttpAiProvider` at all. This is the direct payoff of Lesson 7's interface-first design: the seam for testing and the seam for swapping providers (TASK-012) are the same seam.

### c. Module mocking — where there's no injection parameter to use instead

`lib/actions/generation.ts`'s `generateQuestionsAction` (Lesson 8) has no injectable-provider parameter — it just calls `generateQuestions(context, questionTypes)` directly, always with the real default provider. So `tests/unit/generate-questions-action.test.ts` can't inject a fake the way the previous test did; instead it replaces the whole imported module before the code under test even runs:

```ts
const generateQuestionsMock = vi.fn();
vi.mock("@/lib/generation/generate-questions", () => ({
  generateQuestions: (...args: unknown[]) => generateQuestionsMock(...args),
}));

import { generateQuestionsAction } from "@/lib/actions/generation";

it("calls generateQuestions with the given context and question types", async () => {
  generateQuestionsMock.mockResolvedValue({ ok: true, data: { questions: [] } });
  await generateQuestionsAction(CONTEXT, ["multiple_choice"]);
  expect(generateQuestionsMock).toHaveBeenCalledWith(CONTEXT, ["multiple_choice"]);
});
```

`vi.mock` has to be called before the `import` of the module under test (Vitest hoists it), which is why the mock setup appears above the `import { generateQuestionsAction }` line. This test isn't verifying generation behavior at all — that's `generate-questions.test.ts`'s job — it's verifying `generateQuestionsAction`'s own narrow responsibility from Lesson 8: does it forward its arguments correctly, and does it short-circuit with the right error shape when `context` is `null`, without ever calling `generateQuestions`.

### d. Mocking the network boundary directly — testing `HttpAiProvider` itself

Someone has to test `HttpAiProvider` (Lesson 7) itself, and at that layer there's no `AiProvider` seam to inject — the whole point of this file *is* the HTTP call. `tests/unit/http-provider.test.ts` mocks one level lower, at `fetch`:

```ts
const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  restoreEnvVar("AI_API_KEY");
  restoreEnvVar("AI_MODEL");
  restoreEnvVar("AI_BASE_URL");
  vi.unstubAllGlobals();
});

it("returns a safe error when AI_API_KEY is not configured, without calling fetch", async () => {
  delete process.env.AI_API_KEY;
  const provider = new HttpAiProvider();
  const result = await provider.generate({ prompt: "test prompt", responseJsonSchema: {} });
  expect(result.ok).toBe(false);
  expect(fetchMock).not.toHaveBeenCalled();
});
```

`vi.stubGlobal("fetch", fetchMock)` swaps out the global `fetch` function itself for the duration of each test, and every test carefully restores the real environment variables and unstubs globals afterward so tests don't leak state into each other. This is the lowest-level test in the suite — it's the one place verifying the literal shape of the HTTP request (headers, body, endpoint URL) that Lesson 7 described, and the one place confirming a missing `AI_API_KEY` short-circuits *before* `fetch` is ever called.

### e. No fake at all — the integration test hits the real thing

Finally, back to `tests/integration/database-connection.test.ts` from section 1: zero mocking, by design. This is the deliberate exception to "isolate external dependencies" — it exists specifically to prove the real Prisma client (Lesson 3) can reach the real, already-seeded database, which is a thing no fake could ever verify.

---

## Why four different techniques, not one

Each choice traces back to *where the seam actually is* in the code being tested:

- A pure function needs no seam at all (a).
- A function with an injectable parameter gets tested through that parameter (b) — this is the cheapest form of mocking, and it's only available because Lesson 7/8's design put a seam there on purpose.
- A function with no injectable parameter, calling a named import directly, has to be tested by replacing the import itself (c) — a real but slightly heavier technique, and a subtle piece of evidence about the previous layer's design: if `generateQuestionsAction` *had* taken a provider parameter, its test could have used technique (b) instead.
- Code that *is* the boundary to an external system has nothing further down to inject, and gets tested by mocking the platform primitive it's built on (d).
- Code whose entire job is reaching a real external system sometimes shouldn't be mocked at all (e).

`ai-generation.md` §34's guidance — "isolate the AI provider behind a mock/fake" — undersells how many concretely different shapes that isolation takes once you look at the actual test files. The unifying idea isn't "always inject the same way"; it's "test at whatever seam the code under test actually exposes."

---

**Explicitly out of scope for this lesson** (deferred, not forgotten):

- The historical reasoning behind specific test additions (e.g. why `tests/unit/generate-questions-action.test.ts` was added when it was) → Lesson 11
- Using `app/dev/*` routes as manual, non-automated verification tools → Lesson 12

---

## Checkpoint

Answer these in your own words before moving to Lesson 11. No answer key — if any of these feel shaky, re-read the relevant section above.

1. What actually distinguishes a file under `tests/unit/` from one under `tests/integration/` in this project, given that both run via the same `vitest run` command?
2. What does `tests/stubs/server-only.ts` do, and why is an empty module (`export {}`) enough to solve the problem it exists for?
3. `generate-questions.test.ts` injects a fake `AiProvider` as a function parameter, while `generate-questions-action.test.ts` uses `vi.mock` on a whole module. What structural difference between `generateQuestions` and `generateQuestionsAction` explains why each test needed a different technique?
4. Why does `http-provider.test.ts` mock the global `fetch` function instead of injecting a fake `AiProvider`, when both approaches are used elsewhere in this suite?
5. Why does `tests/integration/database-connection.test.ts` deliberately use zero mocking, when `ai-generation.md` §34 generally argues for isolating external dependencies in tests?
