# ANALYSIS-003 — Investigate Save-for-Evaluation Disabled State and Previous-Generation Matching

## Purpose

This is an **analysis-only task**.

Do **NOT** modify application code, database schema, Prisma schema, tests, UI, or persisted data.

Investigate two issues found during manual testing:

1. **Save for Evaluation is disabled for a newly generated question set after an earlier generation with the same configuration was already saved.**
2. **Compare with Previous Generations shows only one saved result, and we need to verify whether that result count is correct.**

After this analysis is reviewed, a separate bug-fix task will be created if needed.

Create the final report under:

```text
docs/agent-feedbacks/ANALYSIS-003-save-state-and-previous-generation-matching.md
```

If browser/UI inspection is useful, use **Claude for Chrome** to inspect the real application flow and browser state.

---

## 1. Manual Reproduction Scenario

Use this configuration:

```text
Subtopic:
Simplify & Calculate

Question Pattern:
Apply Distributive Property

DifficultyLevel:
Easy

QuestionType:
Multiple Choice
```

Use the exact current labels/IDs from the application/database when investigating.

---

## 2. First Generation

Reproduce:

```text
1. Open the application.
2. Select Simplify & Calculate.
3. Select Apply Distributive Property.
4. Select Easy.
5. Select Multiple Choice.
6. Generate questions.
7. Navigate to Questions.
8. Click Save for Evaluation.
9. Confirm the save.
```

Expected and observed:

```text
Generation #1 saves successfully.
```

---

## 3. Second Generation

Then:

```text
1. Navigate back to the initial/setup page.
2. Select the SAME configuration again.
3. Generate a NEW set of questions.
4. Navigate to Questions.
```

### Actual

```text
Save for Evaluation
```

is disabled.

### Expected

This is a **new generation attempt**, even though the criteria are identical.

Therefore:

```text
Save for Evaluation
```

should initially be enabled.

The application must distinguish:

```text
same generation criteria
```

from:

```text
same generation instance
```

---

## 4. Investigate Save State

Trace the lifecycle of:

```text
savedGenerationContextId
isSaved
save state
generation response
PracticeSessionProvider
navigation
setup/reset
new generation
Questions page
```

Determine:

- where saved state is stored
- when it is assigned
- when it is cleared
- whether navigating back clears it
- whether starting a new generation clears it
- whether receiving a new AI response clears it
- what condition disables the Save for Evaluation button

A possible scenario to verify is:

```text
Generation #1 saved
      ↓
savedGenerationContextId = A
      ↓
navigate to Setup
      ↓
generate Generation #2
      ↓
savedGenerationContextId still = A
      ↓
Questions page assumes Generation #2 is already saved
```

Do not assume this is the root cause until verified.

---

## 5. Generation Identity

Determine how the application identifies a **generation instance**.

Example:

```text
Generation #1
same config
questions set A

Generation #2
same config
questions set B
```

These are different attempts and need independent saved state.

Answer:

- Is there an in-memory generation ID?
- Is GenerationContextId created only after saving?
- Is a new AI response treated as a new generation?
- Is saved state session-wide rather than generation-specific?
- Should save state reset when a new generation response is stored?

Do not implement a fix.

---

## 6. Save Button Condition

Inspect the exact logic used to disable:

```text
Save for Evaluation
```

Document whether it depends on:

```text
savedGenerationContextId !== null
```

or:

```text
isSaving
alreadySaved
```

or something else.

Explain why it works for Generation #1 and why it produces the reported behavior for Generation #2.

---

## 7. Navigation / Reset Behavior

Trace:

```text
Questions
   ↓
Setup
   ↓
Generate
   ↓
Questions
```

Determine which state survives navigation.

Check whether the application intentionally keeps:

- previous generation questions
- generation config
- evaluation data
- saved GenerationContextId
- comparison data
- prompt
- generation metadata

Identify which values should survive and which should reset for a new generation attempt.

---

## 8. Browser Verification

If useful, use **Claude for Chrome**.

Inspect:

- Save for Evaluation button state
- whether previous success state remains
- behavior after client-side navigation
- behavior after hard refresh
- whether the issue reproduces exactly as reported

Do not modify code during browser testing.

Document whether the issue was reproduced.

---

## 9. Compare with Previous Generations

The user also observed that:

```text
Compare with Previous Generations
```

shows only **one** saved result.

Verify whether that is correct.

Current expected matching rules are:

```text
DifficultyLevel
QuestionPatternId set
QuestionType set
```

with exact-set matching, plus exclusion of the current saved GenerationContextId.

Inspect the actual implementation.

---

## 10. Database Verification

Perform read-only database inspection.

For:

```text
Simplify & Calculate
Apply Distributive Property
Easy
Multiple Choice
```

find every saved GenerationContext that should match.

For each candidate inspect:

```text
GenerationContextId
Name
DifficultyLevel
QuestionPatternIds
QuestionTypes
CreatedAt
Score
AIProvider
AIModel
```

Determine the true number of exact matches.

---

## 11. Current Generation Exclusion

Verify:

```text
excludeGenerationContextId
```

and determine whether one displayed result is correct because:

```text
2 exact matching records
- current saved generation
= 1 previous result
```

Example:

```text
A → exact match
B → exact match/current
```

Expected UI:

```text
A only
```

If there are 3 exact matches:

```text
A
B
C/current
```

expected UI:

```text
A
B
```

If fewer rows appear, identify the cause.

---

## 12. Matching Pipeline

Trace:

```text
Current config
      ↓
resolveSelectedPatternIds
resolveSelectedTypeCodes
DifficultyLevel
      ↓
findMatchingGenerationContextsAction
      ↓
findMatchingGenerationContexts
      ↓
database candidates
      ↓
exact-set comparison
      ↓
current-generation exclusion
      ↓
UI table
```

Verify:

- actual filter values
- exact-set logic
- current ID exclusion
- returned records
- displayed records

Check for stale:

```text
config
savedGenerationContextId
autoPatterns
autoTypes
```

or incorrect ID/name usage.

---

## 13. Relationship Between Both Issues

Determine whether both observations share a root cause.

For example, stale:

```text
savedGenerationContextId
```

might potentially:

1. disable Save for Evaluation for Generation #2
2. exclude the wrong GenerationContext from comparison results

Do not assume they are connected.

Explicitly classify them as:

```text
same root cause
```

or:

```text
independent issues
```

---

## 14. Refresh / Session Tests

If useful, compare:

### Flow A

```text
Save
→ navigate back
→ generate again
```

### Flow B

```text
Save
→ hard refresh/reopen
→ generate again
```

### Flow C

```text
Save
→ start a new practice session/reset if available
→ generate again
```

Determine whether the issue is caused by:

```text
client/session state
```

or:

```text
database/backend behavior
```

---

## 15. Important Business Rule

These are different:

```text
A saved generation exists with:
Easy + Pattern P + mc
```

and:

```text
THIS exact newly generated question set is already saved
```

The Save button should only be disabled for the second condition.

Confirm whether the current implementation violates this rule.

---

## 16. Required Report

Create:

```text
docs/agent-feedbacks/ANALYSIS-003-save-state-and-previous-generation-matching.md
```

Include:

### A. Reproduction Result
Whether the Save button issue was reproduced. State whether Claude for Chrome was used.

### B. Current Save-State Implementation
How saved state is tracked.

### C. Save Button Root Cause
Why the second generation's button is disabled.

### D. Generation State Lifecycle
What survives:

```text
Save → Setup → Generate again → Questions
```

### E. Recommended Save-State Fix
Describe the smallest correct fix. Do NOT implement it.

### F. Database Matching Verification
List how many exact matching GenerationContexts actually exist.

### G. Previous-Generation Result Verification
State whether one displayed result is:

```text
CORRECT
```

or:

```text
BUG
```

and prove why.

### H. Current-Generation Exclusion Verification
Which ID is excluded and why.

### I. Matching Pipeline Verification
Confirm the exact filters/values.

### J. Relationship Between Issues
Same root cause or independent.

### K. Recommended Fixes
Exact changes for a future execution task.

### L. Minimum Tests Needed
Recommend tests, but do not implement them.

### M. Final Classification

Use one:

```text
BUG CONFIRMED — SAVE STATE
BUG CONFIRMED — MATCHING
BUG CONFIRMED — BOTH
SAVE BUG CONFIRMED / MATCHING CORRECT
NO BUG
INSUFFICIENT EVIDENCE
```

Explain why.

---

## 17. Future Tests to Recommend

Do not add them now, but consider:

### New generation after previous save

```text
Generation #1 saved
→ Generation #2 created
→ Save button enabled
```

### Same criteria, different generation

```text
Generation #1 config = X
Generation #2 config = X
```

Generation #2 remains saveable.

### Current generation saved

After saving Generation #2:

```text
Save button disabled
```

for that exact generation only.

### Navigation reset

```text
save
→ Setup
→ generate
→ Questions
```

resets save state.

### Matching

```text
A, B, C exact matches
current = C
```

returns:

```text
A, B
```

and:

```text
A, B exact matches
current = B
```

returns:

```text
A
```

---

## 18. Strict Constraints

This is **ANALYSIS ONLY**.

Do NOT:

- modify source code
- modify database
- modify Prisma
- create migrations
- modify UI
- add tests
- refactor state
- change matching logic
- fix the button
- create an execution task

Use read-only inspection and browser testing where appropriate.

The next bug-fix task will be created only after this report is reviewed.
