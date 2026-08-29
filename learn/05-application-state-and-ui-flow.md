# Lesson 5 — Application State & UI Flow Across Routes

Goal of this lesson: understand the one mechanism that makes the whole Setup → Generate → Questions → Evaluation journey work with no backend session. Lesson 1 established that authentication/sessions are deliberately out of scope; this lesson is where you see the concrete consequence of that decision and the pattern the app uses to make it not matter. No new business logic here — `generateQuestionsAction` and `prepareEvaluationAction` are treated as black boxes you already met in Lesson 2 (they're Server Actions); what those functions actually orchestrate is Lesson 8's and Lesson 9's job.

---

## 1. `PracticeSessionProvider` — the shape of shared state

`components/providers/practice-session-provider.tsx` (`"use client"`) holds exactly five pieces of state, each with its own setter, all exposed through one hook:

```tsx
interface PracticeSessionState {
  config: PracticeConfig | null;
  setConfig: (config: PracticeConfig) => void;
  generationResponse: GenerationResponse | null;
  setGenerationResponse: (response: GenerationResponse) => void;
  generationContext: GenerationContext | null;
  setGenerationContext: (context: GenerationContext) => void;
  generationMeta: GenerationMeta | null;
  setGenerationMeta: (meta: GenerationMeta) => void;
  evaluationData: EvaluationData | null;
  setEvaluationData: (data: EvaluationData) => void;
}
```

Every value starts as plain `useState<...>(null)`, and the context value is wrapped in `useMemo` keyed on the five state values — without that, every consumer of `usePracticeSession()` would re-render whenever the provider itself re-rendered for any reason, not just when one of these five values actually changed. `usePracticeSession()` throws if called outside the provider, which is a deliberate fail-loud choice: a component that forgets it needs this context finds out immediately in development, rather than silently reading `undefined`.

This provider is instantiated exactly **once**, in `app/layout.tsx` (Lesson 2's root layout), wrapping `<ScreenShell>{children}</ScreenShell>`:

```tsx
<PracticeSessionProvider>
  <ScreenShell>{children}</ScreenShell>
</PracticeSessionProvider>
```

Because the root layout is shared by every route (recall from Lesson 2: this app has only one `layout.tsx`, no nested ones), there is exactly one `PracticeSessionProvider` instance for the whole app, and it survives client-side navigation between `/`, `/generate`, `/questions`, and `/evaluation` — Next.js doesn't unmount the layout when you navigate between routes it wraps. That persistence-across-navigation is the entire trick; there is no database write, no cookie, no URL parameter carrying any of this.

### Two kinds of state: local vs. committed

The Setup form (next section) manages a pile of its own `useState` — which subtopic is picked, which patterns are toggled, whether "auto" is checked — none of which touches `PracticeSessionProvider` while the user is still filling out the form. Only once the user commits (clicks "Generate Questions") does that local state get translated into the shapes `PracticeConfig`/`GenerationContext` and pushed into context. Keep this distinction in mind through the rest of the lesson: **local component state is provisional and route-scoped; context state is the "committed" record that the next route depends on.**

---

## 2. The happy-path handoff, one hop at a time

### `/` — `app/_components/setup-form.tsx` commits into context, then navigates

The form tracks its in-progress selections entirely in local state:

```ts
const [subtopicId, setSubtopicId] = useState("");
const [difficulty, setDifficulty] = useState<Difficulty | "">("");
const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
const [selectedPatternIds, setSelectedPatternIds] = useState<Set<string>>(new Set());
const [autoPatterns, setAutoPatterns] = useState(false);
// ...plus loading/error state and a fetched-patterns cache
```

It composes four small, controlled presentational components to render the actual form controls — none of them hold state of their own beyond what's passed in as props:

- `difficulty-toggle.tsx` — a 3-way toggle over Easy/Medium/Hard; clicking the already-selected option deselects it.
- `fixed-field.tsx` — a read-only "label: value" box with a "Fixed" badge, used for Grade/Subject/Topic (not user-editable in this build — recall from Lesson 4 that `getSubjectWithSubtopics` is called with hardcoded `"Mathematics"`/`"Algebra"`).
- `question-pattern-chips.tsx` — toggle chips for the fetched `QuestionPatternOption[]`, plus an "Use all question patterns" button.
- `question-type-chips.tsx` — the same toggle-chip pattern over a static list of question types.

Only at the end of `handleGenerate` — after calling `loadGenerationContextAction` (a Server Action from Lesson 2, wrapping `getGenerationContext` from Lesson 4) and getting a success result back — does any of this local state get converted and pushed into context:

```ts
const result = await loadGenerationContextAction({ subjectName, subtopicId, subtopicName, difficulty, patternIds });
if (!result.ok) { setError(result.error); return; }

setGenerationContext(result.context);
setConfig({
  grade,
  subtopic: selectedSubtopic.name,
  subtopicId: selectedSubtopic.id,
  difficulty: difficulty as Difficulty,
  selectedTypes: Array.from(selectedTypes),
  autoTypes,
  selectedPatternIds: patternIds,
  autoPatterns,
});
router.push("/generate");
```

`setGenerationContext` and `setConfig` are called exactly once each, immediately before `router.push("/generate")` — a plain client-side navigation via `useRouter()` from `next/navigation`, not a `<Link>`. Nothing about the in-progress form state (the `Set`s, the loading flags) ever reaches context; only the final, validated shape does.

### `/generate` — reads context, calls the AI, writes back, then navigates

`app/generate/page.tsx` reads `config` and `generationContext` at the top, calls `generateQuestionsAction(generationContext, questionTypes)` in a `useEffect`, and holds the raw result in **local** state while a loading animation plays. Only when the user clicks through ("View Questions") does it commit the result:

```ts
const handleComplete = () => {
  if (!result || !result.ok) return;
  setGenerationResponse(result.data);
  setGenerationMeta({ prompt: result.prompt, requestedQuestionCount: result.requestedQuestionCount });
  router.push("/questions");
};
```

Notice `setGenerationContext` is *not* called again here — it was already written by the setup form and this page only reads it. This page's job is narrower: turn a `GenerationContext` into a `GenerationResponse` (via the Server Action) and a `GenerationMeta` (the exact prompt and requested count, kept for the Evaluation page to hold accountable later), then hand both to context.

### `/questions` — reads, renders, and delegates the next commit to a dumb dialog

`app/questions/page.tsx` reads all four values written so far — `config`, `generationContext`, `generationResponse`, `generationMeta` — to render the question list and coverage summary. When the user clicks "Evaluate Results," it opens `EvaluationMethodDialog`, passing those four values down **as props**:

```tsx
<EvaluationMethodDialog
  config={config}
  generationContext={generationContext}
  generationResponse={generationResponse}
  generationMeta={generationMeta}
  onPrepared={handleEvaluationPrepared}
/>
```

The dialog itself never calls `usePracticeSession()`. It calls `prepareEvaluationAction` with whatever was handed to it in props, and on success calls the `onPrepared` callback with the result — it doesn't write to context or navigate itself:

```ts
const result = await prepareEvaluationAction({ method: "predefined", config, generationContext, generationResponse, generationMeta });
if (!result.ok) { setError(result.error); setPhase("error"); return; }
onPrepared(result.data);
```

The *page* owns the actual commit and navigation, in the callback it passed down:

```ts
const handleEvaluationPrepared = (data: EvaluationData) => {
  setEvaluationData(data);
  setDialogOpen(false);
  router.push("/evaluation");
};
```

This is a deliberate separation: `EvaluationMethodDialog` is a reusable, self-contained "do this async thing and report back" component with no opinion about *what* happens with its result — the page decides that the result becomes a context write plus a navigation. If you ever need to reuse this dialog somewhere that shouldn't write to `PracticeSessionProvider` at all, nothing about the dialog needs to change.

### `/evaluation` — reads only the final artifact

`app/evaluation/page.tsx` reads a single value: `evaluationData`. Every report component it renders (score breakdown, coverage, deviations — Lesson 9's subject) is fed from `evaluationData.result`. By this point in the chain, the four earlier values (`config`, `generationContext`, `generationResponse`, `generationMeta`) are folded into `evaluationData` itself (see `EvaluationData`'s shape in `lib/types.ts`) rather than being read separately.

### The full navigation map

| From | Call | Trigger | To |
|---|---|---|---|
| `setup-form.tsx` | `router.push("/generate")` | `handleGenerate` succeeds, after `setGenerationContext`+`setConfig` | `/generate` |
| `generate/page.tsx` | `router.push("/questions")` | "View Questions" clicked, after `setGenerationResponse`+`setGenerationMeta` | `/questions` |
| `questions/page.tsx` | `router.push("/evaluation")` | `handleEvaluationPrepared`, after `setEvaluationData` | `/evaluation` |
| `questions/page.tsx` | `router.push("/")` | "Edit Setup" clicked (manual) | `/` |
| `questions/page.tsx` | `router.push("/generate")` | "Regenerate" clicked (manual, reuses existing `config`/`generationContext`) | `/generate` |
| `evaluation/page.tsx` | `router.push("/questions")` | "Back to Questions" clicked (manual) | `/questions` |
| `evaluation/page.tsx` | `router.push("/generate")` | export panel's "Regenerate" (manual) | `/generate` |

Every forward hop in the happy path follows the same shape: **commit to context, then navigate** — never the reverse order, and never a navigation that isn't immediately preceded by the write it depends on.

---

## 3. The guard pattern — what a hard refresh actually does

`PracticeSessionProvider` is mounted in `app/layout.tsx` with no `initialConfig` or similar prop supplied anywhere — every one of its five values genuinely starts life as `useState(null)`. There is no localStorage, sessionStorage, cookie, or URL parameter backing any of it. So: **a hard refresh (F5) on `/generate`, `/questions`, or `/evaluation` remounts the whole React tree, including `RootLayout`, and every context value resets to `null`.** This is a full wipe, not a partial one — and it's the direct, unavoidable cost of the "no backend session" scope decision from Lesson 1.

All three downstream pages defend against exactly this with the same two-part pattern. From `app/generate/page.tsx`:

```ts
useEffect(() => {
  if (!config || !generationContext) {
    router.replace("/");
  }
}, [config, generationContext, router]);

// ...
if (!config || !generationContext) return null;
```

`app/questions/page.tsx` and `app/evaluation/page.tsx` repeat the identical shape, each checking whatever slice of context *that* page actually depends on (`config`+`generationResponse`, and `evaluationData`, respectively). Two details worth noticing:

- **`router.replace`, not `router.push`.** A `replace` swaps the current history entry instead of adding a new one, so hitting the browser's Back button after being bounced from `/generate` to `/` doesn't land you back on the broken `/generate` — there's nothing broken left in history to go back to.
- **The early `return null` matters as much as the effect.** `useEffect` runs *after* the first render, so without the `if (...) return null` guard in the render body, the page would attempt to render its normal UI once, on `null` data, before the redirect effect even fires — that's the crash this pattern exists to prevent. The redirect and the render guard are two separate lines doing two separate jobs, and both are necessary.

**One honest wrinkle worth knowing about, not an invented gotcha:** in `questions/page.tsx`, the effect and the render guard don't check quite the same thing —

```ts
useEffect(() => {
  if (!config || !generationResponse) router.replace("/");
}, [config, generationResponse, router]);

if (!config || !generationResponse || !generationContext || !generationMeta) return null;
```

The effect only watches `config`/`generationResponse`; the render guard also blocks on `generationContext`/`generationMeta`. Today this never manifests as a bug, because every code path that sets one of these four always sets all four together (they're written in the same `handleGenerate`/`handleComplete` calls in the previous two sections) — the invariant holds by construction, not by this check. But if a future change ever set `generationResponse` without also setting `generationContext` in the same step, this page would render `null` forever with no redirect ever firing, since the effect's condition would stay falsy. It's a good example of a subtle contract between two guard conditions that looks redundant until the data feeding them stops being as tightly coupled as it is today.

Taken together: Context is the right tool for this app's deliberately narrow scope — no server session to manage, no database writes for ephemeral practice state — and the guard-redirect pattern is precisely what keeps "state doesn't survive a refresh" from ever being visible to a user as a crash. It shows up as, at worst, an unexpected bounce back to the Setup screen.

---

**Explicitly out of scope for this lesson** (deferred, not forgotten):

- What the Setup form's fields mean pedagogically (subtopic/pattern/difficulty/type semantics) → already covered conceptually in Lessons 1, 3, and 4
- What `generateQuestionsAction` and `prepareEvaluationAction` actually do internally → Lesson 8 and Lesson 9
- The evaluation report components that render `evaluationData.result` → Lesson 9

---

## Checkpoint

Answer these in your own words before moving to Lesson 6. No answer key — if any of these feel shaky, re-read the relevant section above.

1. Why is `setConfig`/`setGenerationContext` called only once, right before `router.push`, instead of updating context on every keystroke or toggle in the Setup form?
2. What specifically gets wiped on a hard refresh at `/questions`, and what two-part mechanism stops that from showing a broken page?
3. Why does the guard pattern use `router.replace` while the happy-path hops use `router.push`?
4. `EvaluationMethodDialog` clearly needs `config`, `generationContext`, `generationResponse`, and `generationMeta` — so why doesn't it call `usePracticeSession()` itself instead of receiving them as props?
5. Describe the one place where `questions/page.tsx`'s guard effect and its render-blocking check don't test exactly the same conditions. Why doesn't this cause a visible bug today, and what assumption is it quietly relying on?
