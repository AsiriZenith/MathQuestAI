# Lesson 1 — Project Orientation & Research Goal

Goal of this lesson: give you the mental model and the repo map you'll need for every lesson after this one. No code walkthrough of implementation logic yet — that starts in Lesson 2. This is "why does this exist" and "where do I look."

---

## 1. The research framing

It's easy to describe MathQuestAI as "an app that generates math questions with AI." That's true but it's not the point of the project. Read `docs/project-management/project.md` §2 and the framing is sharper:

> How does the quality and structure of the context and prompt affect the quality and consistency of AI-generated mathematics questions?

The concrete problem (`project.md` §4): if you ask an LLM for a "Hard" question with no further structure, different LLMs — or even the same LLM on different runs — will disagree about what "Hard" means. One model's Hard question might read as Medium to your team. A bare instruction like `Generate a Hard question` is not a controlled experiment; it's a coin flip.

So the project's actual subject of study is: **can structured context make different LLMs converge on the same intended difficulty and pattern, more reliably than an unstructured prompt would?**

"Structured context" here isn't abstract — it's a specific, deliberately layered set of ingredients (`project.md` §4):

- Question Pattern (e.g. "Combine Like Terms" — a specific, nameable task type, not just "algebra")
- Difficulty Level (a project-specific 3-tier definition, not a generic scale — see below)
- Reference Questions (worked examples showing what the pattern+difficulty combination should look like)
- Difficulty-specific generation instructions
- Common generation instructions (apply regardless of pattern/difficulty)
- User-selected Question Type (e.g. multiple choice — deliberately orthogonal to Question Pattern)

Every lesson from here on is, in some sense, explaining how one of these ingredients gets stored, retrieved, or assembled in code.

### The loop is the product

`project.md` §3 and `product.md` §3/§19 both describe the same loop:

```
Define Context → Build Prompt → Generate → Evaluate → Identify Problems → Improve Context/Prompt → Generate again → ...
```

This loop — not the question-generation feature in isolation — is what the application is *for*. The Evaluation page isn't a bolted-on QA step; it's the mechanism that closes the loop and makes the next iteration possible. If you're ever unsure why a feature exists or doesn't, the test is `product.md` §22: does it help someone run this loop, or is it incidental?

### Why the scope is deliberately narrow

`project.md` §19 and `product.md` §21 both explicitly rule out: authentication, student/teacher accounts, team management, user sessions, persisted generation history, production-scale infrastructure. This isn't unfinished work — it's a standing decision. `CLAUDE.md` §14 encodes the same rule for anything added later: don't build it unless it's explicitly added to requirements.

The practical effect for you as a reader: when you hit a place in the code where you'd *expect* a production app to have a users table, a saved-history feature, or a login flow, and it's not there — that's not a gap to "fix," it's intentional. The project's only job is to support the research loop as cheaply and clearly as possible.

### The difficulty definitions, concretely

You'll see `Easy` / `Medium` / `Hard` referenced constantly starting in Lesson 3. The project-specific definitions (`project.md` §5, restated identically in `product.md` §10 and `CLAUDE.md` §10):

| Level | Definition |
|---|---|
| Easy | Direct application of the Question Pattern — one main step, familiar structure |
| Medium | Still directly tied to the Pattern, but ~2–3 connected steps |
| Hard | Multiple connected steps, more complex arrangement, or a combination of complexity factors |

These are explicitly **not** a universal educational standard — they're a benchmark specific to this project, meant to be interpreted consistently by whoever (human or LLM) is generating or judging a question.

---

## 2. Documentation map

`docs/project-management/` is the design-intent layer — it tells you *why*, not *how the code does it*. You'll be pointed back to specific files in later lessons; here's what each one is for so you know where to go without being told every time.

| File | What it's for | You'll need it in |
|---|---|---|
| `project.md` | The research question, the loop, scope rationale — what you just read | Referenced throughout |
| `product.md` | Product-level framing of the same material: user journey, MVP scope, out-of-scope list | Lesson 5 (UI flow), Lesson 9 (evaluation criteria) |
| `architecture.md` | Technical shape: how the generation flow is structured, prompt/AI boundaries, testing layers | Lessons 2, 6, 7, 8 |
| `database.md` | Schema and relationships, and *why* they're shaped this way | Lesson 3 |
| `ai-generation.md` | Prompt/context construction strategy in detail — the research core | Lesson 6 |
| `ui.md` | How the Figma reference project was ported to Next.js, and deviations from it | Lessons 2, 5 |
| `progress.md` | Chronological log of what's been built, task by task | Background reading, Lesson 11 |

Two more locations exist but aren't for design intent — they're the *history* of how decisions changed during implementation:

- `docs/tasks/TASK-*.md` — the actual task specs given to the implementer for each unit of work
- `docs/agent-feedbacks/TASK-*.md` — the implementation reports written after each task, including deviations and judgment calls

These are the right place to look when you find yourself asking "why is this built this way and not the more obvious way?" — chances are a task doc or feedback report explains a real tradeoff that was made. Lesson 11 is dedicated to reading these properly; for now, just know they exist.

---

## 3. Repo tour

Top-level folders, one line each:

| Folder | Purpose |
|---|---|
| `app/` | Next.js routes — every URL the app serves, plus the UI components local to each route |
| `components/` | Shared UI (buttons, badges, layout shell) and React context providers used across routes |
| `lib/` | Almost all business logic lives here: database queries, prompt construction, AI provider integration, generation orchestration, evaluation scoring, Server Actions |
| `prisma/` | The database schema definition (`schema.prisma`) |
| `tests/` | Unit and integration tests |
| `docs/` | Everything covered in section 2 above |

Inside `app/`, the routes that matter for the user journey (`product.md` §5):

- `app/page.tsx` — `/`, the Setup screen (Subject → Topic → Subtopic → Pattern → Difficulty → Type selection)
- `app/generate/` — `/generate`, the generation trigger/loading screen
- `app/questions/` — `/questions`, displays the generated questions
- `app/evaluation/` — `/evaluation`, scores the generated questions against the research criteria
- `app/dev/*` — developer-only inspection routes (`db-check`, `prompt-preview`, `ai-provider-check`, `generate-questions-check`) — not part of the user journey, but useful tools you'll use in Lesson 12 to inspect each pipeline stage directly

You don't need to understand *how* Next.js routes to these folders yet, or what makes a page a "route" versus a helper file — that's Lesson 2. For now, just recognize these names; every later lesson will refer back to this table instead of re-explaining what each route is for.

**Explicitly out of scope for this lesson** (so you know it's not forgotten, just deferred):

- How `app/` folder structure maps to URLs, and server vs. client components → Lesson 2
- What's actually inside `prisma/schema.prisma` → Lesson 3
- What's inside `lib/db/`, `lib/prompts/`, `lib/ai/`, `lib/generation/`, `lib/evaluation/`, `lib/actions/` → Lessons 4, 6, 7, 8, 9
- How state survives navigation between routes with no backend session → Lesson 5

---

## Checkpoint

Answer these in your own words before moving to Lesson 2. No answer key — if any of these feel shaky, re-read the relevant section above.

1. In one or two sentences, what is MathQuestAI actually researching? (Hint: it's not "can an LLM write a math question.")
2. Why does the Evaluation page exist — what role does it play in the loop, beyond "checking the AI's homework"?
3. Name two features a typical production app would have that MathQuestAI deliberately does not, and explain the rule that justifies leaving them out.
4. If you wanted to find out *why* a particular design decision was made (not just what it is), which two folders under `docs/` would you check first?
5. Without opening any code yet — which top-level folder would you guess contains the logic for turning a user's selections into an AI prompt? Which folder would contain the logic for scoring a generated question afterward?
