# TASK-025 — Switch the AI Provider from Groq to DeepSeek

## Objective

Make DeepSeek the AI provider the project ships pointed at, replacing Groq, so that saved
generation runs are labelled correctly and a fresh checkout targets DeepSeek by default.

## Context

The project now runs against DeepSeek's OpenAI-compatible API. `.env.local` already
carries DeepSeek's `AI_API_KEY`, `AI_MODEL` (`deepseek-v4-flash`) and `AI_BASE_URL`
(`https://api.deepseek.com`), but there is **no `AI_PROVIDER` line**, so
`getAiProvider()` (`lib/ai/config.ts`) falls back to `DEFAULT_AI_PROVIDER = "groq"` and
every persisted `generation_contexts.ai_provider` is written as `"groq"` even though
generation actually happens on DeepSeek (see the ANALYSIS-003 DB dump:
`ai_provider = groq`, `ai_model = deepseek-v4-flash`).

`lib/ai/http-provider.ts` and the generation/persistence chain are already
provider-agnostic (everything is read from `lib/ai/config.ts`), so no request/response
logic changes — only defaults, config, tests and docs.

## Requirements

1. Add `AI_PROVIDER="deepseek"` to `.env.local`. Leave `AI_API_KEY`, `AI_MODEL` and
   `AI_BASE_URL` exactly as the owner set them.
2. `lib/ai/config.ts`: `DEFAULT_AI_PROVIDER = "deepseek"`,
   `DEFAULT_AI_MODEL = "deepseek-chat"`, `DEFAULT_AI_BASE_URL = "https://api.deepseek.com"`;
   update the comments accordingly.
3. Update `tests/unit/ai-config.test.ts` default assertions to `"deepseek"`. Update
   `tests/integration/questions-screen.test.tsx` provider/model fixture + UI assertions.
   Update the `aiProvider` / `aiModel` fixtures in `map-generation`, `load-saved-generation`,
   `find-matching-generation-contexts`, `evaluation-method-dialog` tests for realism.
4. `app/dev/ai-provider-check/page.tsx`: also display the resolved `getAiProvider()` label.
5. Update the live docs: `.env.example`, `README.md` §25, `SETUP.md` (env block, variable
   table, provider-options table, "recommended for new members", troubleshooting).
6. Add a `progress.md` entry.

## Acceptance Criteria

- [ ] `getAiProvider()` returns `"deepseek"` with no `AI_PROVIDER` env set.
- [ ] A new saved generation writes `ai_provider = 'deepseek'`.
- [ ] `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` all clean.
- [ ] No `groq`-as-default reference remains in `lib/`, `app/`, `tests/`, `.env.example`,
      `README.md`, `SETUP.md` (Groq may still appear as a listed *alternative* provider).
- [ ] `/dev/ai-provider-check` shows `Provider: deepseek` and connects.

## Constraints

- No Prisma schema / migration / DB write. Existing rows labelled `"groq"` are left as a
  historical record (owner decision).
- No changes to `lib/ai/http-provider.ts` request/response handling.
- Historical records (`docs/agent-feedbacks/**`, `docs/tasks/TASK-007|012|016|020*`,
  `docs/analyze/**`, `learn/**`, `SESSION-BRIEF.md`) are not rewritten.

## Testing

- Deterministic unit test: `ai-config.test.ts` asserts the new default.
- Existing `http-provider.test.ts` asserts against the `DEFAULT_*` constants and
  auto-follows.
- No live-AI test in CI (unchanged policy); `/dev/ai-provider-check` is the manual probe.
