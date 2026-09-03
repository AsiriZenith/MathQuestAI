# TASK-024 — Fix Stale Generation Save State and Previous-Generation Exclusion

## Objective

Fix the two manual-testing defects confirmed by `ANALYSIS-003`:

1. A newly generated question set is incorrectly treated as already saved when an earlier generation in the same browser session was saved.
2. "Compare with Previous Generations" can incorrectly hide a valid previous generation because it receives a stale `savedGenerationContextId`.

The analysis confirmed that **both symptoms have the same root cause**:

```text
savedGenerationContextId
```

is stored in `PracticeSessionProvider`, set after a successful save, and never reset when a new generation is completed.

This task should apply the smallest correct fix and preserve the existing matching implementation.

---

## 1. Confirmed Root Cause

Current behavior:

```text
Generation #1
    ↓
Save
    ↓
savedGenerationContextId = A
    ↓
Navigate to Setup
    ↓
Generate Generation #2
    ↓
NEW generationResponse stored
BUT savedGenerationContextId still = A
    ↓
Questions page
```

This produces two incorrect effects:

```text
savedGenerationContextId !== null
    ↓
Save for Evaluation disabled
```

and:

```text
excludeGenerationContextId = A
    ↓
A valid previous generation is excluded
```

The matching logic itself is correct and must not be changed.

---

## 2. Correct Business Rule

These are different:

```text
A previous generation with the same configuration was saved.
```

and:

```text
The exact question set currently shown on the Questions page was saved.
```

`Save for Evaluation` must be disabled only for the second case.

A newly generated question set must begin with:

```text
savedGenerationContextId = null
```

even if its configuration is identical to an older saved generation.

---

## 3. Correct Reset Point

Use the reset point recommended by ANALYSIS-003:

```text
app/generate/page.tsx
handleComplete
```

A new generation instance should be considered created when a **new successful AI generation response is stored**.

At that point, reset the state that belongs to the previous generation:

```text
setSavedGenerationContextId(null)
setEvaluationData(null)
setComparisonData(null)
```

alongside the existing:

```text
setGenerationResponse(...)
setGenerationMeta(...)
```

Use the actual source structure and conventions.

---

## 4. Why Reset Only After Successful Generation

Do NOT reset these values merely when the user:

- returns to Setup
- changes selections
- opens `/generate`
- starts an AI generation request

Reset them only once a **new successful generation response** is available.

This prevents a failed generation attempt from unnecessarily clearing the previous completed generation's derived state.

---

## 5. Provider API

`setSavedGenerationContextId` already accepts `null`.

If the current provider setters for:

```text
setEvaluationData
setComparisonData
```

do not accept `null`, apply the smallest clean change.

Either:

### Option A

Widen the existing setter types to accept:

```text
EvaluationData | null
ComparisonData | null
```

### Option B

Add one provider helper such as:

```text
resetGenerationDerivedState()
```

that clears:

```text
savedGenerationContextId
evaluationData
comparisonData
```

Choose whichever is most consistent with the existing provider design.

Do not introduce multiple competing reset mechanisms.

---

## 6. Expected Save Behavior

### Generation #1

```text
Generate #1
→ Questions
→ Save for Evaluation enabled
→ Save
→ savedGenerationContextId = A
→ Save for Evaluation disabled / Saved chip shown
```

### Generation #2 with the SAME criteria

```text
Generate #2
→ new successful generation response
→ savedGenerationContextId = null
→ Questions
→ Save for Evaluation enabled
```

After saving Generation #2:

```text
savedGenerationContextId = B
→ Save for Evaluation disabled / Saved chip shown
```

---

## 7. Compare with Previous Generations

Do NOT change:

```text
findMatchingGenerationContexts
isExactSetMatch
DifficultyLevel filtering
QuestionPatternId exact-set matching
QuestionType exact-set matching
```

The defect is the stale exclusion ID.

### Current generation is unsaved

```text
savedGenerationContextId = null
```

Therefore no current ID should be excluded.

Example:

```text
DB exact matches:
A
B

Current:
unsaved
```

Expected result:

```text
A
B
```

### Current generation is saved

Example:

```text
DB exact matches:
A
B
C

Current:
C
```

Expected result:

```text
A
B
```

Only the exact current saved generation should be excluded.

---

## 8. Do Not Add a Generation Identity System

ANALYSIS-003 confirmed there is no in-memory generation nonce/id before persistence.

Do NOT introduce a new generation identity mechanism for this bug unless the recommended reset approach proves impossible.

The reset-on-successful-generation approach is sufficient for the confirmed defect.

Keep the implementation small.

---

## 9. TDD

Follow:

```text
RED
↓
Failing test
↓
GREEN
↓
Minimum implementation
↓
REFACTOR
```

Do not implement first and add tests later.

---

## 10. Required Tests — Derived State Reset

Add tests proving that after Generation #1 has:

```text
savedGenerationContextId = A
evaluationData = populated
comparisonData = populated
```

when Generation #2 completes successfully:

```text
savedGenerationContextId = null
evaluationData = null
comparisonData = null
```

and the new:

```text
generationResponse
generationMeta
```

are stored correctly.

---

## 11. Required Test — Same Criteria, Different Generation

Use two generations with the same effective configuration:

```text
Subtopic: Simplify & Calculate
Pattern: Apply Distributive Property
Difficulty: Easy
Type: mc
```

Flow:

```text
Generation #1
→ save successfully
→ Generation #2 completes
```

Verify:

```text
Save for Evaluation
```

is enabled for Generation #2.

The test must prove that saved state belongs to the current question set, not merely its configuration.

---

## 12. Required Test — Current Generation Saved

After Generation #2 is saved:

```text
savedGenerationContextId = B
```

verify the Questions page returns to the existing:

```text
Saved for evaluation
```

state and does not allow another save of that same current generation.

---

## 13. Required Tests — Matching Exclusion State

### Unsaved current generation

Given:

```text
A = exact previous match
B = exact previous match
current = unsaved
savedGenerationContextId = null
```

verify no exclusion ID is supplied and both previous matches remain available.

### Saved current generation

Given:

```text
A = previous
B = previous
C = current saved generation
savedGenerationContextId = C
```

verify:

```text
excludeGenerationContextId = C
```

and the results are:

```text
A
B
```

Do not rewrite the existing exact-set matching tests.

---

## 14. Regression Coverage

Preserve behavior from:

- TASK-018 Save for Evaluation
- TASK-020 exact saved-generation matching
- TASK-022 current-generation exclusion
- TASK-023 comparison flow
- existing single-generation Evaluation flow

Verify:

```text
Evaluate Against Predefined Questions
```

still works.

Verify:

```text
Compare with Previous Generations
```

still uses single radio selection and the current comparison flow.

---

## 15. Matching Logic Must Remain Unchanged

ANALYSIS-003 confirmed the following are correct:

```text
resolveSelectedPatternIds
resolveSelectedTypeCodes
isExactSetMatch
findMatchingGenerationContexts
```

Do NOT:

- loosen exact matching
- add grade filtering
- add requested-question-count filtering
- add provider/model filtering
- alter SQL matching semantics
- hide matches client-side

Only correct the lifecycle of the current generation's saved ID.

---

## 16. Database / Prisma

No database or Prisma schema change is required.

Do NOT:

- create migrations
- modify tables
- add columns
- modify persisted records
- reset the database

This is a session-state lifecycle bug.

---

## 17. Manual Verification

After implementation, verify this exact reported scenario:

```text
Setup:
Simplify & Calculate
Apply Distributive Property
Easy
Multiple Choice

Generate #1
→ Save
→ return to Setup
→ choose same options
→ Generate #2
→ Questions
```

Expected:

```text
Save for Evaluation = ENABLED
```

Then:

```text
Evaluate Results
→ Compare with Previous Generations
```

If two matching saved generations exist and the current Generation #2 is unsaved:

```text
Expected previous-generation rows = 2
```

After saving Generation #2:

```text
Save for Evaluation = disabled / Saved chip shown
```

and comparison must exclude only Generation #2 itself.

If useful, Claude may use Claude for Chrome for this manual verification.

---

## 18. Agent Feedback

Create:

```text
docs/agent-feedbacks/TASK-024-fix-generation-derived-state-reset.md
```

Include:

### Summary
The two visible defects and the shared root cause.

### Root Cause
How stale `savedGenerationContextId` caused both issues.

### Implementation
Where the reset was added, which values are reset, and why the reset occurs only after successful generation completion.

### Provider Changes
Any setter-type or reset-helper changes.

### Matching
Confirm that matching logic itself was not changed.

### TDD
Tests added/updated and RED → GREEN behavior.

### Manual Verification
The actual tested browser/manual flow and results.

### Verification
Report actual results for:
- targeted tests
- full tests
- TypeScript
- ESLint
- build if normally used

### Database
Confirm no database/schema changes were made.

### Follow-ups
Only genuine remaining concerns.

Do not claim checks passed unless actually executed.

---

## 19. Acceptance Criteria

TASK-024 is complete when:

- [ ] A newly completed generation resets `savedGenerationContextId`.
- [ ] A newly completed generation resets stale `evaluationData`.
- [ ] A newly completed generation resets stale `comparisonData`.
- [ ] Reset happens only after successful generation completion.
- [ ] A second generation with identical criteria is saveable.
- [ ] After that second generation is saved, its own Save action is disabled as before.
- [ ] An unsaved current generation excludes no previous GenerationContext.
- [ ] A saved current generation excludes only itself.
- [ ] Exact matching behavior remains unchanged.
- [ ] Existing predefined evaluation remains working.
- [ ] Existing comparison flow remains working.
- [ ] No DB or Prisma changes are introduced.
- [ ] TDD tests pass.
- [ ] Agent feedback is created.

---

## 20. Scope Boundary

### Included

- reset stale per-generation derived state
- minimal provider API adjustment if required
- Save-for-Evaluation state correction
- correct self-exclusion input
- targeted TDD tests
- regression tests
- agent feedback

### Not Included

- generation nonce/id system
- database changes
- Prisma changes
- matching algorithm changes
- evaluation algorithm changes
- comparison redesign
- UI redesign
- new matching filters
- persistence redesign
