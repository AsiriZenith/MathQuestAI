# Agent Feedback — Add "Agent Feedback Reports" instruction to CLAUDE.md

**Date:** 2026-08-20
**Trigger:** Explicit user request (not a numbered task file).

---

## What was done

1. Renamed `output/` → `docs/agent-feedbacks/` at the project root, per your request. Moved both existing reports (`TASK-003-agent-skills-report.md`, `TASK-003-I-review-report.md`) with it, unchanged.
2. Fixed the two `output/...` path references inside those files and in `docs/project-management/progress.md` so they now point to `docs/agent-feedbacks/...`.
3. Added a new standing section, **`CLAUDE.md` §18 — Agent Feedback Reports**, establishing: after completing each task, write a per-task Markdown report into `docs/agent-feedbacks/`, named after the task, covering what was done, any action needed from you before the next task, risky/judgment-call decisions, deviations from the task's instructions, and suggestions. Also added "Write Agent Feedback Report" as a step in the task-completion workflow diagram in §16.
4. Renumbered `CLAUDE.md` §19–23 (Testing, Change Management, Current Development Strategy, Initial Tasks, Important Rule) to accommodate the new §18. Verified no other file cross-references the old numbers, so nothing else needed updating.
5. This file is the first output of the new rule, written for this change itself even though it wasn't a numbered task — a judgment call, explained below.

## Risky / judgment-call decisions

- **Renumbering CLAUDE.md sections 19→23.** I checked for cross-references to those section numbers elsewhere in the repo first (none existed), so this was low-risk, but it does mean any of your own notes or memory of "§19 = Testing" etc. are now off by one. New numbering: §18 Agent Feedback Reports, §19 Testing, §20 Change Management, §21 Current Development Strategy, §22 Initial Tasks, §23 Important Rule.
- **Writing this report for a non-task request.** The new rule says "after completing each task." This wasn't a `docs/tasks/` file — it was a direct instruction from you. I chose to apply the new rule to itself anyway, since it's a meaningful, standing-instruction-level change you'll likely want a record of before the next real task starts. If you'd rather agent-feedback reports be reserved strictly for numbered `docs/tasks/*.md` work and not ad-hoc requests like this one, let me know and I'll narrow §18's wording accordingly.

## Action needed from you

None required to proceed — this is documentation/policy only, no code changed. Worth deciding, when convenient: do you want feedback reports for every ad-hoc request like this one, or only for formal numbered tasks? I defaulted to "also cover meaningful ad-hoc requests" above.

## Suggestions

- `docs/agent-feedbacks/` is currently untracked in git (along with the rest of the TASK-002+ backlog noted in `docs/project-management/progress.md`). Once you're ready to commit, these reports will become part of the permanent history — worth deciding if you want them included as-is or trimmed to a summary at that point.
