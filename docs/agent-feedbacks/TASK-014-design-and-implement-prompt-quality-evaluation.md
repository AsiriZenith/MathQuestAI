# Agent Feedback — TASK-014: Prompt Quality Evaluation

## The design decision that shaped everything

`buildPrompt` emits exactly 7 sections. Each maps 1:1 to a measurable dimension, so the score decomposes along the prompt's *own structure* and every finding points at an editable block of text:

| Prompt section | Dimension | Confidence | Weight |
|---|---|---|---|
| GENERATION REQUIREMENT | Count adherence | high | 10 |
| OUTPUT FORMAT | Structure integrity | high | 15 |
| QUESTION TYPE | Type adherence | high | 20 |
| EDUCATIONAL CONTEXT | Pattern adherence | high | 25 |
| DIFFICULTY | Difficulty alignment | **medium (proxy)** | 20 |
| REFERENCE QUESTIONS | Reference alignment | **medium (proxy)** | 10 |

This is what makes the page evaluate *the prompt* rather than the questions, per §1.

**The most important judgement call: coverage is deliberately NOT scored.** The prompt literally says *"Not every question needs to use every pattern"* and *"Not every type needs to appear in every question."* Penalising skew would measure the output against a rule the prompt never stated — blaming the model for the prompt's permissiveness. Instead coverage is reported descriptively, and when incomplete it becomes a **prompt-gap finding**: *"your prompt permits the skew you're seeing; here is the sentence to add."* Verified live: the coverage cards quote that exact prompt wording back to the researcher.

## What was built

**Engine — `lib/evaluation/`** (pure, deterministic, no AI): `types.ts`, `text-metrics.ts` (tokenising, n-gram containment, operator/variable/reasoning-step counts), six `dimensions/*.ts`, `prompt-sections.ts` (splits the preserved prompt into its 7 sections), `improvements.ts` (rule table producing evidence-backed prompt patches + the inverse "leave this alone" strengths), `evaluate-generation.ts` (orchestrator with weight renormalisation), `export.ts` (Markdown rendering). `prepare-evaluation.ts` grew from TASK-013's stub into the real entry point.

**Upstream (minimum viable changes):** optional `questionPattern` on the AI output contract + prompt instructions; `generateQuestions` now returns the prompt and requested count instead of discarding them; `GenerationMeta` threaded through the session provider → generate → questions → dialog → Server Action.

**UI — 11 new `app/evaluation/_components/`** plus `meter-bar.tsx` and `evaluation-indicators.tsx` in `components/common/`. The 5 mock components and every evaluation-only export in `lib/mock-data.ts` were deleted (that file went from 158 to 44 lines), along with their orphaned types.

**Tests:** 19 new dimension unit tests with deliberately-violating fixtures, a rewritten evaluation-screen integration suite that runs the real evaluator, plus the 7 schema regression tests from the mid-task bug fix. 139/139 pass; `tsc`/`eslint`/production build clean.

## Verified live

Full walkthrough against the real database and real Groq API, using the "all patterns" + Medium + two-types path: **98% effectiveness**, weights renormalised correctly after reference alignment came back N/A (no reference questions seeded for that combination), difficulty correctly flagged at 90% with 8/10 medium and 2 hard, and the deviation table naming questions 2 and 3 specifically. The Prompt Inspector expanded to show the real DIFFICULTY section text alongside its verdict — the traceability this whole design exists for.

## Bug I introduced and fixed mid-task

Adding `questionPattern` to the Zod schema turned a previously-*unknown* key (silently stripped) into a *known* one — and `.optional()` rejects `null` while `.min(1)` rejects `""`. Since I had simultaneously told the model the field was required, it began emitting `null` for questions it couldn't attribute, and one bad value invalidated all 10. Fixed by preprocessing absent-ish values to `undefined`, applying the same treatment to `options` (identical latent trap, would have bitten eventually), and restoring the Zod issue detail to server-side logs — `parseGenerationResponse` was discarding it, which is why the failure was opaque. Full detail in the session; 7 regression tests guard it.

## Deviations from the plan, and why

**1. No Zod schema for `EvaluationResult`.** The plan listed one, but §21 conditions it on *"If AI is used to produce part of the evaluation"* — and we chose deterministic. Mirroring a ~180-line TypeScript type in Zod, for data produced by our own fully-typed code, is real drift risk for no practical gain. The result crosses a Server Action boundary but both sides are type-checked from the same definition. Happy to add it if you'd rather have the runtime guard.

**2. Consistency fix found during browser verification.** Requirement Adherence showed Difficulty as "Met" while the Prompt Inspector showed the same dimension as "Partially met" — two different thresholds over one score. A section backed by a single dimension now inherits that dimension's status verbatim, so the two views cannot disagree.

## Known limitations worth your judgement

- **`topic` is hardcoded to `"Algebra"`** in the orchestrator's configuration summary. `GenerationContext` carries no topic and `app/questions/page.tsx` already hardcodes it identically — consistent with the app, but still a wart. Fixing it properly means adding `topicName` to `GenerationContext`.
- **Pattern adherence trusts the AI's self-label.** It measures whether the model *claims* a pattern the prompt listed, not whether the question genuinely implements it. Good for coverage and scope; it would not catch a question mislabelled in good faith. Flagged as `high` confidence because the set-membership check is exact — but the underlying attribution is the model's own.
- **Difficulty and reference alignment are structural proxies**, labelled `PROXY` in the UI with their raw signals shown. They count reasoning steps and operators, not meaning. A borderline result should send you to the questions themselves.
- **Runs generated before this task** report pattern adherence as `not_applicable` (detected by checking whether the preserved prompt mentions `questionPattern`) rather than scoring zero.

## Suggestion for the next iteration

The improvement threshold currently only fires below 0.85, so this run showed "no prompt weaknesses" despite two flagged difficulty deviations. That is defensible, but if you want the page to surface softer signals, lowering that threshold in `improvements.ts` is a one-line change — worth deciding once you have run a few real experiments and know how noisy the proxy is.
