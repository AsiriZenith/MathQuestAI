# Lesson 11 — Project Evolution & Decision History

Goal of this lesson: not new code, but a skill — reading `docs/project-management/progress.md`, a task file, and a feedback file together as a three-tier trail, and knowing which one actually answers a given "why is this built this way?" question. `CLAUDE.md` §17-18 already told you the intended purpose of each tier: `progress.md` answers *"where are we now"* (a short, continuously-updated, chronological state, including an explicit decision log); a task file (`docs/tasks/TASK-*.md`) records what was actually asked and why; a feedback file (`docs/agent-feedbacks/TASK-*.md`) is written once, when a task completes, and never edited afterward except to append a follow-up — it's the record of what *actually happened*, including judgment calls and deviations from the task as written. This lesson uses three real examples so you can verify the method yourself against the actual files.

---

## 1. Revisiting the AI provider swap — the fast case

Lesson 7 already covered *what* changed when TASK-012 replaced `GeminiProvider` with `HttpAiProvider`. Revisit it here for the *method*, not the facts: `progress.md`'s TASK-012 entry is one paragraph naming the change and pointing at both `docs/tasks/TASK-012-configurable-ai-provider.md` and `docs/agent-feedbacks/TASK-012-configurable-ai-provider.md`. But the actual reasoning behind one specific decision — why `response_format: { type: "json_object" }` instead of Groq's stricter `json_schema` mode — lives in exactly **one** of the three places: the feedback file's "Judgment calls made" section. It isn't in the task file (which only states the requirement to make the provider swappable) and it isn't in the code itself (`http-provider.ts` has no comment explaining that choice — you had to be told about it in Lesson 7 from this exact document).

That's the core teaching point of this lesson: **a given design decision's reasoning usually lives in exactly one of the three documents, not all three, and knowing which one to open first saves you from re-deriving something someone already wrote down.** For a judgment call made under uncertainty, check the feedback file first — that's specifically where `CLAUDE.md` §18 requires "risky or judgment-call decisions... and why" to be recorded.

---

## 2. Worked example: the Question Pattern picker, removed then restored

You've been reading `getGenerationContext()` (Lesson 4) as if requiring an explicit `patternIds` array and filtering by it were simply the obvious design. It wasn't reached in one pass — it's a *corrected* design, and the correction has a documented arc across three tasks.

**TASK-002** (Lesson 2's UI recreation) made a UI-fidelity call: skip a Question Pattern picker entirely, to match the Figma reference pixel-for-pixel. This wasn't a silent omission — it was recorded explicitly, as "Implementation note (TASK-002)" annotations spread across `project.md`, `architecture.md`, `requirements.md`, and `ui.md`.

**TASK-005** (which built the first version of `getGenerationContext`) then *reaffirmed* that decision — even though, in `progress.md`'s own words, *"TASK-005's own flow diagram and acceptance criteria described Question Pattern as user-selectable."* The implementation at that point auto-resolved every pattern belonging to a subtopic, with no filtering and no UI to narrow the set — a case of a task quietly drifting from its own stated acceptance criteria rather than a new decision being made.

**TASK-010**'s task file then reverses this, and states the reversal about as bluntly as a task file in this project ever does:

> The project owner has reviewed this and determined that skipping the picker was a mistake, not an acceptable deviation — this task reverses that earlier decision and brings the implementation in line with the documented design.

Its Requirement #5 is the direct ancestor of the `getGenerationContext()` code you read in Lesson 4:

> **Scope context loading to the selection.** `getGenerationContext()`... and its Server Action... must accept the selected pattern id(s) and filter the `ReferenceQuestion` and `QuestionGenerationRequest` queries by those ids (and difficulty) instead of by "every pattern id for the subtopic."

So the next time you meet a function whose parameter list looks unusually deliberate — required rather than optional, narrower than you'd first assume — it's worth asking whether the history explains it, rather than assuming the current shape was the first shape.

One more mechanic worth noticing in `progress.md` itself: the superseded decision wasn't deleted when TASK-010 reversed it. The "Important Decisions" section keeps the old bullet, now prefixed **"Superseded by TASK-010:"**, describing the original no-picker decision and the fact that it was reversed. The trail of "we used to think X, then decided Y, here's why" survives instead of being silently overwritten — you can literally watch the project's mind change by reading these bullets in order.

---

## 3. Worked example: the naming bug — `"Simplify / Calculate"` vs. `"Simplify & Calculate"`

This one is a case study in how a wrong assumption can survive for a long time when nothing forces a cross-check, and in how this project's documentation discipline handles fixing it.

**The origin.** TASK-002 documented the project's Subtopic as `"Simplify / Calculate"` — written *before the database layer existed at all* (Prisma wasn't connected until TASK-004). It was a guess, and a reasonable one to make at the time, given there was no database yet to check it against.

**The propagation.** That guessed name then sat, unverified, in docs, tests, and one dev-route fixture across six subsequent tasks, because nothing in the normal development flow forced a comparison against the real, live database value.

**The discovery.** TASK-012's real browser walkthrough (Lesson 7) — done to verify the Groq provider swap worked end to end — happened to render the real Subtopic name on screen: `"Simplify & Calculate"`. The mismatch was noticed as a side effect of unrelated verification work, not by design.

**The fix, and the principle behind it.** TASK-011's feedback file states the resolution directly, in a section literally titled "Source of truth selected":

> **Database wins.** Per `docs/project-management/database.md` §29 and `CLAUDE.md` §9 (the existing PostgreSQL data is the established source of truth, not to be redesigned)... every current doc/test reference was corrected from `"Simplify / Calculate"` to `"Simplify & Calculate"`, not the other way around.

This is the exact same principle you already met in Lesson 3 with `Subject.language` — the database is authoritative over what the docs *assumed* it would be — applied here in the opposite direction: instead of updating docs to *record* an undocumented reality, this time the docs and tests were *wrong outright* and had to be corrected to match. Same rule, two different-looking outcomes, because the rule doesn't care which direction the correction runs — only that the database wins.

Two more details worth noticing, because they teach *process* as much as history:

- **What was deliberately left unchanged.** The feedback file explicitly lists old `docs/agent-feedbacks/*.md` files and the historical `docs/tasks/TASK-002/005/006.md` spec files as *not* corrected — they still say the wrong name, on purpose, because they're an honest record of what was believed at the time the work was done. This is `CLAUDE.md` §18's "written once... not edited afterward" rule for feedback reports, applied consistently even when the thing they recorded turns out to have been based on a wrong assumption. A feedback report isn't a living doc to keep accurate forever — it's a historical record, and rewriting history to look right in hindsight would make it useless as history.
- **A bug found along the way.** Fixing the naming mismatch broke five previously-passing tests, for an unrelated reason: `@testing-library/user-event`'s `selectOptions` fails to match an `<option>` by its visible text when that text contains an `&` character. The feedback file documents this as a genuinely separate, real bug, confirmed in isolation before being fixed by switching those calls to select by option `value` instead of display text. This is the "Agent Feedback Reports" template's "any deviations... and why" and "additional issues discovered" sections doing exactly the job `CLAUDE.md` §18 describes them for — surfacing something nobody was looking for, rather than letting it slide because it wasn't the task's original point.

---

## 4. The method, generalized

When you hit a "why is this built this way and not some more obvious way?" question this curriculum hasn't already answered for you, the reusable procedure is:

1. **Check `progress.md` first.** Its Completed list gives a one-paragraph summary and names the relevant task number(s); its "Important Decisions" section is a lightweight decision log — look specifically for a "Superseded by TASK-N" marker, which tells you a decision changed and points you at the task that changed it.
2. **Read the named task file** for what was actually asked, and any rationale given for asking it that way — task files record intent going in, including context sections that explain *why* the work is being requested.
3. **Read the feedback file** for what actually happened — this is where judgment calls, deviations from the task as written, things deliberately left alone, and bugs found along the way get recorded, none of which necessarily appear in the task file or the code.

Not every question needs all three. Sometimes the task file alone answers it (as with TASK-010's blunt reversal statement). Sometimes only the feedback file has the real answer (as with TASK-012's `json_object` vs. strict-schema choice). Knowing this project's documentation shape well enough to guess which tier to open first is the actual skill this lesson was for.

---

## Checkpoint

Answer these in your own words before moving to Lesson 12. No answer key — if any of these feel shaky, re-read the relevant section above.

1. For the AI provider swap, which of the three documents actually explains *why* `json_object` mode was chosen over strict `json_schema` mode — and why isn't that reasoning in the code itself or the task file?
2. What did TASK-005 do that was inconsistent with its own stated acceptance criteria, and which later task corrected it?
3. In `getGenerationContext()` requiring `patternIds` (Lesson 4), what earlier, different behavior did this design replace, and why was that earlier behavior changed?
4. Why did TASK-011 deliberately leave old `docs/agent-feedbacks/*.md` files and historical task specs saying the wrong Subtopic name, instead of correcting them too?
5. Describe the three-tier reading order you'd use to answer a new "why is this built this way?" question you haven't seen before, and what each tier is most likely to tell you that the others won't.
