# MathQuestAI — Session Brief

Speaking notes for the review session. Structured to answer the six questions asked,
with the numbers pulled out so they're easy to quote and follow-up questions
prepared.

> **Before the session:** fill in [Section 4's human-feedback block](#41-human-user-feedback--to-be-filled-in)
> — it's the one part of this document I can't evidence from the repository.

---

## Quick answers (the 30-second version of each)

| # | Question | Short answer |
| --- | --- | --- |
| 1 | **Current prototype** | Working end-to-end. Setup → Generate → Questions → Evaluation, all four screens live against a real PostgreSQL database and a real AI provider (Groq). 139/139 tests passing. |
| 2 | **Main goal** | Not "generate maths questions with AI" — it's to **measure how the quality of context and prompting changes the output**. The user is the research team itself; this is an instrument, not a product for students. |
| 3 | **Working / not working** | The full research loop works. Deliberately unbuilt: generation history, the "Compare with Previous Generations" mode, answer interaction. Known issues are catalogued rather than hidden. |
| 4 | **Testing / feedback** | 139 automated tests, live verified AI calls, a real generated question to show, and one real bug worth walking through. **No human user testing yet** — that's an honest gap. |
| 5 | **Lessons / next steps** | The provider abstraction and the docs-driven task loop paid off. The hard lesson was assumptions never checked against reality. Next: widen the seed data, then run real A/B prompt experiments. |
| 6 | **How AI was used** | Claude Code for the build, ChatGPT for exploration, Figma AI for the UI design, and Gemini/Groq APIs inside the product. The `docs/` task + feedback loop is the part worth explaining. |

**Numbers to have ready:**

```text
139/139 tests passing        22 test files (14 unit, 8 integration)
17 task specs               14 agent feedback reports
12 commits                   6 carrying Co-Authored-By: Claude
6 evaluation dimensions      7 prompt sections
1 subject / 1 topic / 1 subtopic / 5 patterns / 75 reference questions
98% prompt effectiveness on the last live run
```

---

## 1. Current product / prototype

### What to show

The app runs locally at `http://localhost:3000`. Four screens, in order:

| Screen | Route | What happens |
| --- | --- | --- |
| **Setup** | `/` | Pick subtopic → question pattern(s) → difficulty → question type. All options loaded live from PostgreSQL. |
| **Generating** | `/generate` | One real AI call (~9s). Button unlocks only when the real result arrives, not when the animation ends. |
| **Questions** | `/questions` | The 10 generated questions, with dynamic type-coverage badges. |
| **Evaluation** | `/evaluation` | The prompt-quality report — the project's culminating output. |

### Demo script

```bash
npm run dev        # plain `next dev` (Turbopack)
```

Then walk `/` → Generate → `/questions` → "Evaluate Results" → choose
"Evaluate Against Predefined Questions" → Proceed → `/evaluation`.

> **If the live AI call fails on the day**, fall back to the four diagnostic routes,
> which isolate each layer and make a good talking point in their own right:
> `/dev/db-check` (database) → `/dev/prompt-preview` (prompt building, no AI call) →
> `/dev/ai-provider-check` (AI connectivity) → `/dev/generate-questions-check` (full pipeline).

### Stack, briefly

Next.js 16 + TypeScript (strict) · PostgreSQL + Prisma 7 with the `PrismaPg` driver
adapter · Zod for the AI output contract · Vitest + React Testing Library · Groq
`openai/gpt-oss-120b` via a provider-neutral OpenAI-compatible HTTP client.

**Likely follow-up — "is it deployed?"**
No. It's a local research prototype by design; there's no persistence layer or auth,
and `README.md` §22 explicitly rules out being "a production-scale education
platform."

---

## 2. Main goal and users

### The one distinction to lead with

Everything else follows from this, so say it first:

> The goal is **not** to generate maths questions. It's to investigate **how the
> quality of the context and prompt we supply changes what the AI produces.**

The research question, from `README.md` §1:

> **"How can better context and prompting produce better educational mathematics questions?"**

And the governing principle, `README.md` §21 — worth quoting directly:

> **"Do not assume that a more complicated prompt produces better questions. Measure it."**

### The concrete problem behind it

From `docs/project-management/project.md` §4: ask two different LLMs for a *Hard*
"Combine Like Terms" question and you get two different notions of "hard". Sending
`Generate a Hard question.` isn't sufficient. So the project builds structured
context — pattern definitions, difficulty guidance, reference questions, common
instructions — and then measures whether that structure actually lands.

### The research loop

```text
Define Context → Build Prompt → Generate → Evaluate
       ↑                                       ↓
       └──── Improve Context / Prompt ←── Identify Problems
```

### Who the users are — be precise here

`docs/project-management/product.md` §4 names exactly one user group:

> "The initial target user is the project team/researcher. The application is not
> currently designed as a complete commercial learning platform. It is primarily a
> research prototype..."

**There is no student or teacher persona anywhere in the documentation**, and student
accounts, teacher accounts and progress tracking are all explicitly out of scope.

> **Don't invent a student audience if asked.** "The user is the researcher running
> the experiment" is both the truthful answer and the stronger one — it explains why
> there's no auth, no persistence and no gradebook, and reframes those absences as
> scope discipline rather than missing features.

### Definition of success

From `README.md` §27 — the goal is *not* "we generated questions using AI", it's:

> **"We can systematically experiment with educational context and prompting and
> observe whether those changes improve the quality of AI-generated mathematics questions."**

**Likely follow-up — "so who would actually use this?"**
Today: the team, to run prompt experiments. The transferable output isn't the app —
it's the finding about *which context structures work*, which would inform a real
educational product later.

---

## 3. What is working / not working

### Working — the full loop, end to end

| Capability | Status |
| --- | --- |
| Live PostgreSQL context loading (subject → topic → subtopic → patterns → reference questions) | ✅ |
| Deterministic 7-section prompt builder | ✅ |
| Provider-neutral AI integration, switchable by env var alone | ✅ |
| Structured generation with Zod validation that never throws | ✅ |
| 10 real questions rendered with correct option lettering + coverage badges | ✅ |
| Evaluation-method selection dialog | ✅ |
| Deterministic prompt-quality evaluation with per-question evidence, prompt patches and JSON/Markdown export | ✅ |

### Deliberately not built

These are scope decisions, not omissions — say so:

- **"Compare with Previous Generations"** — the second evaluation mode. UI placeholder
  with a "Coming Soon" badge. Blocked by the next item, and deliberately so.
- **No generation or evaluation history in the database.** `database.md` §23–24 rule it
  out for now. Markdown/JSON export is the deliberate substitute for comparing runs.
- **No answer interaction.** `correctAnswer` and `explanation` are generated and
  validated but never displayed — nothing checks a student's answer, because there is
  no student.
- **Question count is fixed at 10** (`DEFAULT_QUESTION_COUNT`), not a UI field.
- **No end-to-end test framework.** Verification is manual browser walkthroughs.

### Known issues — own these rather than wait to be asked

| Issue | Detail |
| --- | --- |
| `npm audit`: 3 high-severity | All from `deepmerge-ts`, a transitive dep of the Prisma **CLI** (not runtime). The auto-fix downgrades to Prisma 6 and breaks the v7 setup, so it was left with a written justification. |
| `topic` hardcoded to `"Algebra"` | In two places. Invisible because there's only one topic in the database. Proper fix means adding `topicName` to `GenerationContext`. |
| Pattern adherence trusts the model's self-label | It checks the model *claims* a pattern the prompt listed — not that the question genuinely implements it. Wouldn't catch a good-faith mislabel. |
| Every `/generate` visit = a real billable call | The guard only covers React's dev double-invoke, not remounts from back-navigation or refresh. |
| Dev routes are unguarded | Four `/dev/*` routes are live and not behind a `NODE_ENV` check. Fine locally, must be handled before any deployment. |
| ~~Turbopack crash~~ (resolved) | `npm run dev` was pinned to `--webpack` because Turbopack's PostCSS worker died with `STATUS_DLL_INIT_FAILED`. That no longer reproduces on Next.js 16.3.1, and `--webpack` was itself serving unstyled pages (Tailwind's PostCSS plugin never ran over `app/globals.css` in webpack dev). The pin has been removed. |
| Improvement threshold too high | Suggestions only fire below 0.85, so the 98% run reported "no weaknesses" despite two flagged difficulty deviations. One-line fix. |
| Documentation drift | `progress.md` still says TASK-005–008 is uncommitted (it's merged), and `requirements.md` §24 still lists evaluation methodology as "not finalized" (TASK-014 finalized it). |

### The data limitation — the most important one

The entire corpus is **one vertical slice**:

```text
1 subject (Mathematics) → 1 topic (Algebra) → 1 subtopic (Simplify & Calculate)
  → 5 question patterns → 75 reference questions → 15 generation requests
```

Subject and Topic are non-selectable "Fixed" fields in the UI *because there is only
one of each*. The cascading-selection architecture is built but only genuinely
exercised at the subtopic → pattern level. **No finding from this project generalises
beyond algebraic simplification yet** — that's the honest framing, and it makes the
top next step obvious.

---

## 4. Testing and feedback so far

### 4.1 Human user feedback — *to be filled in*

> **TODO — add before the session.**
>
> No human user testing is recorded in the repository. If you have run sessions,
> collected feedback, or shown this to anyone, add it here. If not, say plainly that
> evaluation so far has been automated and self-conducted, and that external feedback
> is a named next step — that's a credible answer, and far better than implying
> testing that didn't happen.

### 4.2 Automated testing

**139 tests across 22 files, all passing.**

| Layer | Files | Needs a live DB? | Makes a real AI call? |
| --- | --- | --- | --- |
| Unit | 14 | No | No |
| Integration (UI/flow) | 6 | No | No |
| Integration (database) | 2 | **Yes** | No |

Worth calling out: **no test anywhere makes a real AI call.** The provider is behind
an injectable interface, so generation logic is tested against a fake and the HTTP
client is tested against a mocked `fetch` — including a case asserting the API key
never leaks into an error message. Prompt building has a dedicated determinism test:
same input, same prompt, every time.

### 4.3 Live verification

Verified directly against Groq during preparation for this session:

```text
/dev/ai-provider-check        → Connected: YES   Valid: YES
                                 Base URL: https://api.groq.com/openai/v1
                                 Model:    openai/gpt-oss-120b
/dev/generate-questions-check → Result: SUCCESS  Question Count: 10
```

Database, independently confirmed: 6 tables, and the full chain
`Mathematics → Algebra → Simplify & Calculate → 5 patterns` present.

### 4.4 Example AI output — real, unedited

This came back from Groq during verification:

```json
{
  "questionNumber": 1,
  "questionText": "Simplify the expression: 4x + 3 - 2x + 7.",
  "questionType": "multiple_choice",
  "questionPattern": "Combine Like Terms",
  "options": [
    { "id": "A", "text": "2x + 10" },
    { "id": "B", "text": "6x + 10" },
    { "id": "C", "text": "2x + 4" },
    { "id": "D", "text": "6x + 4" }
  ],
  "correctAnswer": "A",
  "explanation": "Combine the x terms (4x - 2x = 2x) and the constant terms (3 + 7 = 10) to obtain 2x + 10."
}
```

Note the distractors: B, C and D are each a *specific* plausible error (adding instead
of subtracting the x terms; mishandling the constants; both). That's the reference
questions and pattern guidance doing their job — a good concrete example of context
quality showing up in output quality.

### 4.5 A real bug worth walking through

If asked "what went wrong along the way", this is the best story because the root
cause is genuinely instructive:

**Symptom.** After adding an optional `questionPattern` field to the output schema,
entire batches of 10 questions started failing validation — and the error was opaque.

**Root cause.** Adding the field to the Zod schema turned a previously *unknown* key
(silently stripped) into a *known* one. `.optional()` rejects `null`, and the prompt
simultaneously told the model the field was required — so the model emitted `null`
for questions it couldn't confidently attribute. **One bad value invalidated all ten.**
The error was opaque because the parser was discarding Zod's issue detail.

**Fix.** Preprocess absent-ish values to `undefined`, and restore the Zod issue detail
to server-side logs. **7 regression tests** were added and now guard it.

**Lesson.** Making a field known to a validator is a behaviour change, not just a
schema addition — and swallowing error detail turns a five-minute fix into an hour.

---

## 5. Lessons and next steps

### What worked well

**Designing the provider boundary before it was needed.** TASK-007 integrated Gemini
behind a three-method `AiProvider` interface. When the project moved to Groq, the
entire swap — deleting a vendor SDK, writing a generic HTTP client — changed exactly
**one line** in consuming code (a default parameter). The interface earned its keep.

**Deterministic evaluation.** No AI judge, so re-running an evaluation on the same
input always gives the same score. When the prompt changes and the number moves, the
prompt caused it. An LLM judge would have added variance to the very metric used to
compare prompt versions.

**The docs-driven task loop** — see §6; it's the process lesson.

**Refusing to over-build.** A `docs/development.md` was proposed three separate times
and rejected all three; unnecessary abstractions were declined with written reasoning.

### What was difficult — the honest version

**A decision made, re-affirmed, then reversed.** The Question Pattern picker was
omitted early to match the Figma design exactly, re-affirmed once under challenge,
then reversed in TASK-010 as "a mistake, not an acceptable deviation." Two tasks of
rework. *Lesson: matching a design mock is not the same as meeting a requirement —
when a spec and a mock disagree, escalate instead of picking one.*

**An assumption unverified for nine tasks.** The subtopic was documented as
`"Simplify / Calculate"`; the database actually said `"Simplify & Calculate"`. Written
down before the database layer existed and never checked, it silently failed six
integration tests until a browser walkthrough exposed it. *Lesson: verify against the
real system at the first opportunity, not the first convenient one.*

**TDD was claimed before it was practised.** The first UI task's 21 tests were written
*after* implementation, despite the project mandating test-first. A later review named
this plainly rather than papering over it, and three components were redone test-first.
*Lesson worth stating aloud: the process document only matters if reviews check it.*

### Next steps, in priority order

1. **Widen the seed data** — more subtopics and patterns. Without this, no result
   generalises past algebraic simplification. Everything else is worth less until
   this is done.
2. **Run actual A/B prompt experiments.** The instrument is built but has not yet been
   *used* for its purpose: e.g. 3 reference questions vs 5, and compare scores across
   runs. This is the research the project exists to do.
3. **Lower the improvement threshold** (one line) so suggestions surface on strong runs.
4. **Persist generation history**, which unlocks the "Compare with Previous
   Generations" mode.
5. **Housekeeping:** guard the dev routes behind `NODE_ENV`, un-hardcode `topic`, fix
   the documentation drift noted in §3.

---

## 6. How AI was used in the project

### The tools, and where each was used

| Tool | Where | How well it worked |
| --- | --- | --- |
| **Claude Code** | Primary build agent — implementation, tests, refactors, documentation, code review | Most effective on well-specified tasks with clear acceptance criteria. Needed correcting on product decisions (see below). |
| **ChatGPT** | Exploration, comparing approaches, general problem-solving | Useful for open-ended thinking before a task was specified. |
| **Figma AI** | Generating the UI design, exported as the read-only reference project at `MathQuestAI_UI` | Gave a complete visual starting point; recreated in Next.js rather than copied. |
| **Gemini API** | First AI provider integration (TASK-007) | Worked, but the vendor SDK was later removed in favour of a neutral client. |
| **Groq API** | Current provider — `openai/gpt-oss-120b` via the OpenAI-compatible endpoint | In use today. ~9s for 10 validated questions. |

### The process — the part worth explaining in detail

This is the most distinctive thing about how the project was built, and the strongest
material for this question.

```text
Write task spec (docs/tasks/TASK-XXX.md)
        ↓
AI agent implements against it
        ↓
Agent writes an honest feedback report (docs/agent-feedbacks/TASK-XXX.md)
   — what it built, what it deviated from, what it's unsure about
        ↓
Developer reads the report, decides what to correct
        ↓
Corrections become the NEXT task spec
        ↓
        └──────────── repeat ────────────
```

Concretely: **17 task specifications** and **14 agent feedback reports** in
`docs/`. The project instruction file (`CLAUDE.md`) mandates that every task ends with
a written report covering *"any risky or judgment-call decisions made... any deviations
from the task's original instructions, and why."*

**The loop demonstrably worked.** Three whole tasks exist *because* an earlier
feedback report surfaced a problem:

- **TASK-010** — restored the Question Pattern picker after the omission was reviewed
  and judged a mistake.
- **TASK-011** — fixed the `Simplify & Calculate` naming bug the previous task's
  browser walkthrough exposed.
- **TASK-012** — replaced the vendor-specific Gemini SDK with a configurable provider,
  after an earlier draft proposing a second hardcoded adapter was rejected as bad
  practice.

That's the reusable insight: **the AI's own written self-assessment became the input
to the next iteration** — the same Generate → Evaluate → Improve loop the product
itself implements, applied to the development process.

### Where AI got it wrong — have these ready

Being specific here is more credible than claiming it went smoothly:

1. **A product decision, wrong twice.** The pattern-picker omission was made, then
   *re-affirmed* when challenged, before a human review reversed it. The agent
   followed the design mock over the written requirement.
2. **A dependency added, then removed.** An entire vendor SDK integrated in one task,
   deleted two tasks later. Not wasted — the interface designed around it is what made
   removal cheap — but it was avoidable with more upfront thought about provider
   neutrality.
3. **A self-inflicted bug** — the Zod `null` issue in §4.5.
4. **An unverified assumption** propagated through docs and tests for nine tasks.

### One precision point — expect to be asked

The AI APIs **generate** the questions. The **evaluation is not AI** — it's
deterministic TypeScript.

Six weighted dimensions, mapped 1:1 onto the prompt's seven sections:

| Dimension | Weight | Measure |
| --- | --- | --- |
| Pattern adherence | 25 | Exact |
| Type adherence | 20 | Exact |
| Difficulty alignment | 20 | **Proxy** (reasoning steps + operator counts) |
| Output integrity | 15 | Exact |
| Count adherence | 10 | Exact |
| Reference alignment | 10 | **Proxy** (n-gram overlap) |

Three design points worth stating if the topic comes up:

- **Why no AI judge:** an LLM judge would inject variance into the exact number used
  to compare prompt versions. Deterministic scoring means a score change is
  attributable to the prompt.
- **Proxies are labelled as proxies.** The two structural measures carry a `PROXY`
  badge and `medium` confidence in the UI, showing their raw signals. They count
  steps and operators, not meaning.
- **Coverage is deliberately not scored.** The prompt says *"Not every question needs
  to use every pattern"* — so penalising skew would blame the model for the prompt's
  own permissiveness. Instead it's reported as a **prompt gap**, with the exact
  sentence to add. That's the whole philosophy in one decision: **the report evaluates
  the prompt, not the model.**

If a dimension can't be measured (e.g. no reference questions seeded for that
combination), it returns N/A and the remaining weights renormalise — so it neither
helps nor hurts the score.

---

## Appendix — where things live

| What | Where |
| --- | --- |
| Local setup instructions | `SETUP.md` |
| Project overview | `README.md` |
| Working conventions for the AI agent | `CLAUDE.md` |
| Current state | `docs/project-management/progress.md` |
| Task specifications (17) | `docs/tasks/` |
| Agent feedback reports (14) | `docs/agent-feedbacks/` |
| Prompt builder | `lib/prompts/builder.ts` |
| Evaluation engine | `lib/evaluation/` |
| AI provider | `lib/ai/http-provider.ts` |
