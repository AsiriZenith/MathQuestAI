# TASK-025 — Switch the AI Provider from Groq to DeepSeek

## What was done

DeepSeek is now the provider the project ships pointed at.

**Config / code:**
- `.env.local` — added `AI_PROVIDER="deepseek"` (one line). `AI_API_KEY`, `AI_MODEL`
  (`deepseek-v4-flash`) and `AI_BASE_URL` (`https://api.deepseek.com`) left exactly as the
  owner had them.
- `lib/ai/config.ts` — `DEFAULT_AI_PROVIDER = "deepseek"`,
  `DEFAULT_AI_MODEL = "deepseek-chat"`, `DEFAULT_AI_BASE_URL = "https://api.deepseek.com"`;
  header comment and the `getAiProvider` doc comment reworded (Groq → DeepSeek, "any
  OpenAI-compatible provider" framing kept).
- `app/dev/ai-provider-check/page.tsx` — now also renders `Provider: {getAiProvider()}`
  alongside Base URL / Model, so the persisted label is visible on the connectivity probe.

**Tests:**
- `tests/unit/ai-config.test.ts` — default assertions `"groq"` → `"deepseek"` (3 sites +
  the `it()` name).
- `tests/integration/questions-screen.test.tsx` — the `SAVED_CONTEXT` fixture and the two
  UI assertions changed from `groq` / `openai/gpt-oss-120b` to `deepseek` / `deepseek-chat`.
- `tests/unit/{map-generation,load-saved-generation,find-matching-generation-contexts}.test.ts`
  and `tests/unit/evaluation-method-dialog.test.tsx` — `aiProvider` / `aiModel` fixtures
  updated for realism (these never asserted on the values; they pass either way).
- `tests/unit/http-provider.test.ts` — untouched; it asserts against the `DEFAULT_*`
  constants and auto-follows the config change.

**Docs:**
- `.env.example`, `README.md` §25, `SETUP.md` (Step-4 env block, variable table, the
  "Provider options" table, the "recommended for new members" section, and the
  troubleshooting line) all now describe DeepSeek as the default. Groq stays in `SETUP.md`
  and `README.md` only as one of the listed *alternative* OpenAI-compatible providers.

**Not touched:** `lib/ai/http-provider.ts` (already provider-agnostic — plain
`fetch` against `{AI_BASE_URL}/chat/completions` with `response_format:
{ type: "json_object" }`, which DeepSeek supports), Prisma schema / migrations, the
database, and historical records (`docs/agent-feedbacks/**`, `docs/tasks/TASK-007|012|016|020*`,
`docs/analyze/**`, `learn/**`, `SESSION-BRIEF.md`).

## Verification (checks actually run)

| Check | Command | Result |
| --- | --- | --- |
| Affected tests | `npx vitest run` (7 files) | **72 passed** |
| Full suite | `npm test` | **39 files, 331 passed** |
| TypeScript | `npx tsc --noEmit` | **clean** |
| ESLint | `npm run lint` | **clean** |
| Build | `npm run build` | **succeeded** |
| Grep gate | `grep -rniE groq lib/ app/ tests/ .env.example README.md SETUP.md` | only 3 hits, all listing Groq as an *alternative* provider — no groq-as-default |

Not run: any live DeepSeek API call (no live-AI test policy in CI). Verify manually below.

## Action needed from the developer

1. **Confirm the model id.** `.env.local` has `AI_MODEL="deepseek-v4-flash"`. That is not
   one of DeepSeek's documented model ids — DeepSeek's own OpenAI-compatible API exposes
   `deepseek-chat` and `deepseek-reasoner`. It was kept as-is on your instruction. If a
   real generation returns an HTTP 400 / "model not found", change it to `deepseek-chat`.
   The code default and all docs use `deepseek-chat`.
2. **Manual smoke test.** With `npm run dev` running, open
   `http://localhost:3000/dev/ai-provider-check` → expect
   `Provider: deepseek`, `Base URL: https://api.deepseek.com`,
   `Model: deepseek-v4-flash`, `Connected: YES`, and a parsed question with `Valid: YES`.
   Then run a real Setup → Generate → Questions → **Save for Evaluation** and confirm the
   new `generation_contexts` row has `ai_provider = 'deepseek'`.

## Judgment calls

- **`DEFAULT_AI_BASE_URL = "https://api.deepseek.com"`** (no `/v1`), matching your working
  `.env.local` rather than the also-valid `https://api.deepseek.com/v1`. `http-provider.ts`
  appends `/chat/completions`, and DeepSeek routes that path at the domain root, so this
  works and stays consistent with your env. The SETUP.md "no trailing slash" warning still
  applies and is still correct.
- **`DEFAULT_AI_MODEL = "deepseek-chat"`, not `deepseek-v4-flash`.** The default and
  `.env.example` are what a fresh checkout uses; they should be a model that actually
  exists for any DeepSeek account. Your local env keeps its explicit `deepseek-v4-flash`
  override.
- **Existing 5 DB rows left labelled `"groq"`** (your decision). They were generated with
  `deepseek-v4-flash` but say `groq`; rewriting saved research records was judged not
  worth it, and comparison matching ignores the provider field entirely.
- **Historical docs and the `learn/` curriculum were not updated.** They snapshot the
  state at the time each was written; a `groq` mention there is a record, not a bug. Only
  the live operational docs (`.env.example`, `README.md`, `SETUP.md`) were changed.

## Deviations from the task instructions

None. The task was given directly in chat (no pre-written task file); `docs/tasks/TASK-025-switch-ai-provider-to-deepseek.md`
was authored as part of the work to match the project's task-based convention (CLAUDE.md §16).

## Concerns / follow-ups

- If DeepSeek generation quality differs materially from Groq's `openai/gpt-oss-120b`, the
  evaluation scores from before and after this switch are not directly comparable — the
  prompt is the experiment variable, and the model just changed underneath it. Worth a
  note in whatever research log tracks evaluation runs.
- `SESSION-BRIEF.md` still presents Groq as the current provider. It reads as dated
  session-prep material; left as-is. Update it if it is still used as a live briefing.
