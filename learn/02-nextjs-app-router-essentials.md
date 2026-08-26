# Lesson 2 — Next.js App Router Essentials

Goal of this lesson: give you the Next.js-specific vocabulary and mental model you need before any later lesson makes sense. Everything after this one will say things like "the Setup screen fetches this in a Server Component" or "this is called via a Server Action" without re-explaining what that means — this lesson is where those terms get grounded in real files. No business logic yet — that starts in Lesson 4.

`CLAUDE.md` warns that this project runs a Next.js version that may differ from what you'd expect from general Next.js knowledge. One concrete example of that shows up below (`LayoutProps<"/">`) — flagged when we get there.

---

## 1. Folder-based routing in this repo

Every URL the app serves comes from a folder under `app/` containing a `page.tsx`:

| Route | File |
|---|---|
| `/` | `app/page.tsx` |
| `/generate` | `app/generate/page.tsx` |
| `/questions` | `app/questions/page.tsx` |
| `/evaluation` | `app/evaluation/page.tsx` |
| `/dev/db-check` | `app/dev/db-check/page.tsx` |
| `/dev/prompt-preview` | `app/dev/prompt-preview/page.tsx` |
| `/dev/ai-provider-check` | `app/dev/ai-provider-check/page.tsx` |
| `/dev/generate-questions-check` | `app/dev/generate-questions-check/page.tsx` |

`layout.tsx` is the other routing-relevant file, but this project only has **one** — `app/layout.tsx`, the root layout. There are no nested layouts anywhere under `app/generate/`, `app/questions/`, etc. That means every route in the table above shares the exact same shell (walked through in section 2). If a later lesson mentions "the layout," it always means this one file.

Two things you will *not* find anywhere in `app/`, which is itself informative:

- **No `loading.tsx`, `error.tsx`, `not-found.tsx`, or `template.tsx`.** The project doesn't use any of Next.js's optional special files — routes are plain `page.tsx` only.
- **No `route.ts` anywhere.** `route.ts` is how you'd define a traditional REST-style API endpoint in the App Router. Zero exist in this codebase. Hold that thought — section 3 explains what replaces it.

### Not every folder under `app/` is a route

You'll see folders like `app/_components/`, `app/generate/_components/`, `app/questions/_components/`, and `app/evaluation/_components/`. The leading underscore is a Next.js convention: **any folder prefixed with `_` is a "private folder" and is excluded from routing entirely**, no matter what's inside it. These four folders exist purely to co-locate a route's UI pieces next to the route that uses them — `app/questions/_components/question-card.tsx` is just a component file, not a URL segment. When you're scanning `app/` for "what pages does this app have," ignore every `_`-prefixed folder.

---

## 2. Server components by default — `app/layout.tsx` and `app/page.tsx`

Next.js's App Router treats every component under `app/` as a **Server Component** unless the file explicitly opts out with a `"use client"` directive at the top. Server Components render on the server (they can `await` a database call directly in the component body, with no client-side JS shipped for that rendering work); Client Components render in the browser and are the only place you can use state, effects, or browser event handlers.

### `app/layout.tsx` — the shared shell, server-rendered

```tsx
import type { Metadata } from "next";
import { plusJakartaSans, dmSans } from "./fonts";
import { PracticeSessionProvider } from "@/components/providers/practice-session-provider";
import { ScreenShell } from "@/components/layout/screen-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "MathQuestAI",
  description: "AI-powered mathematics question generation research prototype.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${dmSans.variable}`}>
      <body>
        <PracticeSessionProvider>
          <ScreenShell>{children}</ScreenShell>
        </PracticeSessionProvider>
      </body>
    </html>
  );
}
```

No `"use client"` at the top, so this is a Server Component. It sets up `<html>`/`<body>`, wires the `next/font/google` variables from `app/fonts.ts`, and exports the static `metadata` object — `metadata` is a Server-Component-only export; you can't do this from a `"use client"` file.

It then wraps every page in `PracticeSessionProvider` and `ScreenShell`. `PracticeSessionProvider` (`components/providers/practice-session-provider.tsx`) *is* a Client Component under the hood — how it holds cross-route state is Lesson 5's subject, not this one. The point to take from this file for now: **a Server Component can render Client Components as children**. The server/client boundary isn't "the server can't touch client code" — it's "a Server Component can render Client Components, but a Client Component can't synchronously import and call a Server Component the same way." Composition flows outward from the server root; interactivity islands are opted into further down the tree.

**Non-default detail worth flagging:** the prop type here is `LayoutProps<"/">`, not a hand-written `{ children: React.ReactNode }`. This is not an import from anywhere in this file — it's a **global, ambient type** that this Next.js version auto-generates (via `next dev`/`next build`/`next typegen`) from the literal route path of the file it's used in. If you've used older Next.js versions, this will look unfamiliar; it's this project's Next.js version inferring `children` (and, on page files, `params`/`searchParams`) from the route string itself rather than you typing them by hand.

### `app/page.tsx` — a Server Component that fetches directly

```tsx
import { getSubjectWithSubtopics } from "@/lib/db/education";
import { SetupForm } from "@/app/_components/setup-form";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const data = await getSubjectWithSubtopics("Mathematics", "Algebra");

  if (!data) {
    return /* ...fallback message... */;
  }

  return <SetupForm subject={data.subject} topic={data.topic} subtopics={data.subtopics} />;
}
```

This is the `/` route, and it's `async function SetupPage()` — an `async` component is only legal for a Server Component. Notice there's no `fetch("/api/...")`, no client-side loading state: the component just `await`s a function from `lib/db/education.ts` directly in its body. That function talks to Postgres via Prisma (Lesson 3/4 territory) — the point here is *where* that call happens: inside a Server Component's render, not behind an API route.

`export const dynamic = "force-dynamic"` opts this route out of Next's static rendering/caching. Without it, Next could try to render this page once at build time and serve a stale cached copy of the subject/subtopic list forever; forcing dynamic rendering makes sure this DB read happens fresh on every request — appropriate for a research prototype whose seeded database data might change between runs.

Finally, the fetched data is passed as **plain props** into `<SetupForm>`, a Client Component. This is the standard handoff pattern in this app: a Server Component fetches, then hands the result down to a Client Component for anything interactive.

### The other three main pages are Client Components

`/generate`, `/questions`, and `/evaluation` all start their `page.tsx` with `"use client"` — unlike `app/page.tsx`, none of them fetch their own data from the database on render.

| Route | File | Type | Gets its data from |
|---|---|---|---|
| `/` | `app/page.tsx` | Server | `await getSubjectWithSubtopics(...)` directly in the component |
| `/generate` | `app/generate/page.tsx` | Client (`"use client"`) | `usePracticeSession()` context hook, then calls a Server Action (section 3) |
| `/questions` | `app/questions/page.tsx` | Client (`"use client"`) | `usePracticeSession()` context hook only |
| `/evaluation` | `app/evaluation/page.tsx` | Client (`"use client"`) | `usePracticeSession()` context hook only |

So the pattern across the whole app is: **one real Server-Component data fetch at the entry route**, and everything downstream runs client-side, pulling whatever it needs out of a shared React context (`usePracticeSession()`) rather than each page re-querying the server. *Why* that context persists state across client-side navigations with no backend session is Lesson 5's subject — for this lesson, just take away the fact that these three pages are Client Components and don't do their own server-side data fetching.

---

## 3. Server Actions — how the client calls the server here

Section 1 pointed out there are **zero `app/**/route.ts` files** in this codebase — confirmed by searching the whole `app/` tree. If there's no REST API, how does a Client Component like `/generate`'s page get the server to actually call the AI provider? Through **Server Actions**: plain async functions marked with a `"use server"` directive, which Next.js turns into callable RPC endpoints without you writing any request-handling boilerplate.

All of this project's Server Actions live in `lib/actions/`, one file per concern:

```ts
// lib/actions/setup.ts
"use server";

import { getGenerationContext } from "@/lib/db/generation-context";
import { getQuestionPatternsForSubtopic } from "@/lib/db/education";

export async function loadGenerationContextAction(input: {
  subjectName: string;
  subtopicId: string;
  subtopicName: string;
  difficulty: Difficulty;
  patternIds: string[];
}): Promise<GenerationContextResult> {
  return getGenerationContext(input);
}

export async function loadQuestionPatternsAction(
  subtopicId: string,
): Promise<QuestionPatternsResult> {
  return getQuestionPatternsForSubtopic(subtopicId);
}
```

`"use server"` here is a **module-level** directive (the first line of the file), which marks every exported function in the file as a Server Action. The action itself does almost no work — it validates/shapes its input and delegates to a plain library function (`lib/db/generation-context.ts` here). The other two files, `lib/actions/generation.ts` and `lib/actions/evaluation.ts`, follow the identical shape: thin action wrapper, real logic lives in `lib/generation/` and `lib/evaluation/` respectively. *What* those library functions actually orchestrate is Lesson 8's subject — the thing to internalize here is the shape of the boundary itself.

### Calling a Server Action from a Client Component

`app/_components/setup-form.tsx` (`"use client"`) imports and calls these directly:

```ts
import { loadGenerationContextAction, loadQuestionPatternsAction } from "@/lib/actions/setup";

useEffect(() => {
  if (!subtopicId) return;
  let cancelled = false;
  loadQuestionPatternsAction(subtopicId).then((result) => {
    if (!cancelled) setPatternsResultBySubtopic({ subtopicId, result });
  });
  return () => { cancelled = true; };
}, [subtopicId]);
```

From the calling component's point of view, `loadQuestionPatternsAction` is just an `async` function — call it, get a `Promise` back, `.then()` or `await` it like anything else. Next.js handles turning that call into a network request to the server behind the scenes.

**Worth knowing if you've used Server Actions before:** Next.js's own docs describe the idiomatic pattern as invoking actions via `<form action={...}>`, `useActionState`, or an event handler wrapped in `startTransition` — mechanisms that let Next bundle a page re-render into the same response when the action calls `revalidatePath`, `redirect`, or touches cookies. **This codebase doesn't use any of that.** Every call site here (`setup-form.tsx`, `app/generate/page.tsx`, `app/questions/_components/evaluation-method-dialog.tsx`) calls its action as a plain async function inside a `useEffect` or event handler, and manages loading/result state itself with ordinary `useState`. That works fine here because none of these three action files ever call `revalidatePath`, `redirect`, or touch cookies — they're pure request/response RPC calls with a JSON-serializable return value, so there's no automatic re-render behavior being bypassed. Treat Server Actions in this project as **"a callable async function that happens to run on the server,"** not as a form-binding mechanism.

One more consequence of that plainness: because a Server Action is just an async function, it's directly unit-testable with no HTTP mocking — `tests/unit/generate-questions-action.test.ts` imports `generateQuestionsAction` and calls it exactly like the setup-form component does. Lesson 10 covers the test suite properly; file this away for now as another reason the "plain function" framing matters.

---

## 4. The `app/dev/*` inspection routes

Four extra routes exist purely as manual diagnostic tools — not part of the Setup → Generate → Questions → Evaluation user journey:

- `/dev/db-check` — confirms the database connection by querying and dumping subjects directly.
- `/dev/prompt-preview` — renders the exact AI prompt the app would build for a given difficulty/pattern/type combination, for manual inspection.
- `/dev/ai-provider-check` — sends a fixed test prompt through the AI provider and reports success/failure.
- `/dev/generate-questions-check` — chains context loading → prompt building → AI call together and shows the full result, as an end-to-end smoke test.

All four are plain `async` Server Components with `export const dynamic = "force-dynamic"` — same pattern as `app/page.tsx`, just used for debugging instead of the product UI. You'll use these as instrumented checkpoints in Lesson 12 to trace a request through the whole pipeline; no need to open them yet.

---

**Explicitly out of scope for this lesson** (deferred, not forgotten):

- What `lib/actions/*.ts` functions actually orchestrate internally, and how context/prompt/AI-call/evaluation chain together → Lesson 8
- How `PracticeSessionProvider` keeps selection/generation/evaluation state alive across client-side navigations with no backend session → Lesson 5
- The database schema and Prisma setup behind `getSubjectWithSubtopics` / `getGenerationContext` → Lesson 3 and Lesson 4
- What the evaluation report components under `app/evaluation/_components/` actually render → Lesson 9

---

## Checkpoint

Answer these in your own words before moving to Lesson 3. No answer key — if any of these feel shaky, re-read the relevant section above.

1. Why is `app/_components/` not a route, and name one other folder in this repo that follows the same convention?
2. What's the practical difference between how `app/page.tsx` gets its data versus how `app/questions/page.tsx` gets its data?
3. If you added `export const dynamic = "force-static"` to `app/page.tsx` instead of `"force-dynamic"`, what would you expect to go stale, given what the component actually does on each render?
4. This app has no `app/**/route.ts` files. What mechanism replaces traditional API routes here, and where does the real server-side logic those calls delegate to actually live?
5. Name one way this codebase's Server Action usage differs from the idiomatic pattern shown in Next.js's own docs, and explain why that difference doesn't cause a functional problem here.
