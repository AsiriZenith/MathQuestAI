# TASK-023 — Implement Compare with Previous Generations

## Objective

Implement the **Compare with Previous Generations** feature based on the completed ANALYSIS-001 findings.

This task changes the current TASK-020 behavior from:

```text
Select previous generation
        ↓
Evaluate only previous generation
```

to:

```text
Select previous generation
        ↓
Evaluate CURRENT + PREVIOUS
        ↓
Compare their evaluation results
        ↓
Show explicit comparison and deltas
```

The comparison must be implemented as a **dedicated Comparison page/route**, while preserving the existing single-generation Evaluation page and evaluation engine.

---

# 1. Important Design Decision

Use the recommended architecture from ANALYSIS-001:

> **Option 3 — Shared single-result components + dedicated comparison orchestration**

Do NOT extend the existing `/evaluation` page into a dual-purpose page.

The existing `/evaluation` flow must remain responsible for the existing single-generation/predefined evaluation experience.

Create a separate comparison experience.

---

# 2. Current Behavior to Change

TASK-020 currently does:

```text
Questions Page
    ↓
Evaluate Results
    ↓
Compare with Previous Generations
    ↓
Find matching saved generations
    ↓
Select one
    ↓
Evaluate
    ↓
/evaluation
```

The selected previous generation is evaluated by itself.

That is not an actual comparison.

Change the behavior to:

```text
Questions Page
    ↓
Evaluate Results
    ↓
Compare with Previous Generations
    ↓
Find matching saved generations
    ↓
Select one previous generation
    ↓
Prepare CURRENT + PREVIOUS
    ↓
Evaluate both independently
    ↓
/comparison
    ↓
Show side-by-side results + deltas
```

---

# 3. Do Not Change the Existing Evaluation Algorithm

The existing:

```text
evaluateGeneration()
```

must remain unchanged.

Do NOT modify:

- evaluation dimension calculators
- scoring logic
- existing evaluation weights
- existing evaluation criteria
- existing `evaluate-generation.ts`

The comparison must call the existing function twice:

```text
evaluateGeneration(current)
evaluateGeneration(previous)
```

Both calls must use the exact same evaluation implementation.

---

# 4. Create a Pure Comparison Function

Create a new pure comparison/diff function.

A suitable location could be:

```text
lib/evaluation/compare-evaluations.ts
```

or another location consistent with the project's architecture.

The function should conceptually be:

```text
compareEvaluationResults(
    currentResult,
    previousResult
)
```

It should NOT perform:

- database access
- API calls
- React state updates
- navigation
- score persistence

It should only compare already-calculated results.

---

# 5. Comparison Output

The comparison function should provide enough information for the UI to show:

## Overall Score

```text
Current:  84
Previous: 76
Difference: +8
```

Use a clear convention:

```text
difference = current - previous
```

Therefore:

```text
+8 → current is higher
 0 → equal
-8 → current is lower
```

Do not invent a new scoring algorithm.

---

# 6. Compare Existing Evaluation Dimensions

Review the actual `EvaluationResult` structure and compare the dimensions that already exist.

The comparison should include, where supported by the existing result:

- overall/prompt effectiveness score
- each evaluation dimension
- question count adherence
- question type coverage
- question pattern coverage
- difficulty assessment
- output integrity
- reference alignment
- deviations/other existing measurable results

Do not invent metrics that the current evaluation engine does not produce.

If a metric cannot be compared meaningfully, document that in the agent feedback.

---

# 7. Side-by-Side Comparison

The Comparison page should clearly distinguish:

```text
CURRENT GENERATION
```

and:

```text
PREVIOUS GENERATION
```

Each side should display the appropriate existing evaluation information.

Then provide comparison information showing:

```text
Current
Previous
Difference
```

for comparable numeric metrics.

The user should not need to manually calculate the difference.

---

# 8. Reuse Existing Evaluation Components

Inspect the existing Evaluation page components and reuse suitable presentational components as building blocks.

For example, if components already accept a single-result-shaped prop, they can be rendered for:

```text
Current
```

and:

```text
Previous
```

Do NOT duplicate existing evaluation calculation logic.

Do NOT unnecessarily rewrite existing components.

Only create new components for genuinely comparison-specific UI such as:

- comparison header
- side-by-side layout
- delta indicators
- comparison metric rows
- current-vs-previous labels

---

# 9. Comparison Route

Create a dedicated route.

A suitable route is:

```text
/comparison
```

Follow the existing Next.js App Router conventions.

Do not change the existing:

```text
/evaluation
```

route.

---

# 10. Practice Session State

The existing `EvaluationData` is singular and should remain singular.

Do NOT redesign it into a two-result structure.

Add a separate comparison-specific state shape, for example:

```text
comparisonData
```

containing:

```text
current
previous
comparison
```

Use the actual project's TypeScript conventions.

The comparison state should contain enough information for the Comparison page to render without duplicating the preparation logic.

---

# 11. Current Generation Data

The current generation does NOT need to already be saved in order to be compared.

Use the current live generation data already available in the Questions/Practice Session flow.

Conceptually:

```text
Current
  ↓
live session data
  ↓
evaluateGeneration()
```

If the current generation has a valid `GenerationContextId`, persist its freshly calculated score.

If it does not have an ID, skip score persistence as the existing TASK-022 behavior does.

Do not force the user to save the current generation solely to enable comparison.

---

# 12. Previous Generation Data

The selected previous generation is always identified by:

```text
previousGenerationContextId
```

Load it using the existing saved-generation loading functionality:

```text
loadSavedGeneration(previousGenerationContextId)
```

Then evaluate it using:

```text
evaluateGeneration(previous)
```

Do not trust the stored `GenerationContext.score` as the comparison score.

---

# 13. Always Re-Evaluate Both Sides

Every comparison must calculate fresh results:

```text
Current
   ↓
evaluateGeneration()

Previous
   ↓
evaluateGeneration()
```

Do NOT use:

```text
previousGeneration.score
```

as the comparison result.

The stored score is historical information only.

The reason is that the evaluation implementation may evolve over time. Re-evaluating both sides using the same current rules ensures the comparison is performed under the same evaluation criteria.

After fresh evaluation:

```text
Current score → persist if current GenerationContextId exists
Previous score → persist to previous GenerationContext
```

Use the existing score persistence implementation.

Do not create a new comparison-score persistence mechanism.

---

# 14. Previous Generation Picker

Keep TASK-020's existing matching rules:

```text
DifficultyLevel
+
exact QuestionPatternId set
+
exact QuestionType set
```

Keep TASK-022's current-generation exclusion.

Do not loosen or redesign matching in this task.

The user still selects exactly one previous generation using the existing radio-button behavior.

---

# 15. Optional Picker Information

The analysis identified that the existing picker currently does not show:

- score
- grade
- requestedQuestionCount

These fields may be added to the picker if useful for selecting a comparison candidate.

If implemented:

- no database schema change is required
- use the existing columns
- display them only as selection context
- do not use stored score as the actual comparison score

If adding these fields significantly expands the task, keep them out of scope and document them as a follow-up.

Do not compromise the core comparison implementation for this optional enhancement.

---

# 16. Comparison Eligibility Rules

Keep the existing exact matching rules.

Do NOT add these as mandatory filters:

### requestedQuestionCount

Do not require equal requested counts.

A difference is itself useful evaluation information.

### Actual generated question count

Do not require equal actual counts.

Question count adherence is already part of evaluation.

### grade

Do not introduce a grade filter at this time because the current application uses a fixed grade value.

### AI provider/model

Do not require matching providers/models.

Display provider/model for transparency if appropriate.

There is no separate AI evaluation/judge model in the current application.

---

# 17. Comparison Results Persistence

Do NOT create a persisted Comparison entity.

Do NOT create comparison tables.

Do NOT store comparison artifacts.

Only persist each GenerationContext's individual score using the existing score mechanism.

The comparison result itself is temporary UI/session state.

---

# 18. Navigation Flow

Update TASK-020's selected-generation flow.

Currently:

```text
selected previous
    ↓
prepareSavedEvaluationAction()
    ↓
/evaluation
```

Change comparison behavior to:

```text
selected previous
    ↓
prepare comparison
    ↓
evaluate current
    ↓
evaluate previous
    ↓
calculate comparison
    ↓
store comparison state
    ↓
/comparison
```

Do not break the existing predefined evaluation flow.

If the existing "saved" path is shared by other functionality, carefully separate comparison behavior rather than globally changing unrelated navigation.

---

# 19. Existing Evaluation Page Must Remain Working

The existing `/evaluation` page must continue to support the existing single-generation evaluation behavior.

Especially preserve:

```text
Evaluate Against Predefined Questions
```

Do not turn `/evaluation` into:

```text
if comparison then ...
else ...
```

unless a very small shared infrastructure change is unavoidable.

Prefer dedicated comparison orchestration.

---

# 20. TDD Requirements

This task MUST follow TDD.

Use:

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

Do not implement everything first and add tests afterward.

---

# 21. Required Unit Tests — Comparison Function

Add unit tests for:

### Higher current score

```text
current = 84
previous = 76
difference = +8
```

### Lower current score

```text
current = 70
previous = 78
difference = -8
```

### Equal score

```text
current = 80
previous = 80
difference = 0
```

### Dimension comparison

Verify each comparable evaluation dimension produces the correct difference.

### Non-numeric/unsupported values

Handle them according to the existing data types rather than inventing behavior.

---

# 22. Required Tests — Comparison Preparation

Test that comparison preparation:

1. receives the current generation data
2. receives the selected previous GenerationContextId
3. loads the previous generation
4. evaluates current generation
5. evaluates previous generation
6. compares the two results
7. stores both results in comparison state
8. uses fresh evaluation results rather than stored score

---

# 23. Required Tests — Score Persistence

Verify:

```text
current result
    ↓
current score persistence
```

only happens when a current GenerationContextId exists.

Verify:

```text
previous result
    ↓
previous score persistence
```

uses the selected previous GenerationContextId.

Verify the stored historical score is not used as the comparison input.

---

# 24. Required Tests — Navigation

Verify:

```text
Compare with Previous Generations
        ↓
select previous
        ↓
Comparison page
```

and NOT:

```text
Comparison
        ↓
/evaluation
```

Also verify:

```text
Evaluate Against Predefined Questions
        ↓
/evaluation
```

still works.

---

# 25. Required UI Tests

Test:

- comparison page renders both generations
- current and previous labels are clear
- both scores are visible
- differences are visible
- comparable dimensions are displayed
- positive/negative/zero differences are represented correctly
- loading state works
- error state works
- missing comparison state is handled safely
- existing Evaluation page remains functional
- existing Evaluate Results dialog remains functional
- radio-button selection remains single-select

Do not over-test purely visual styling.

---

# 26. Error Handling

Handle these cases:

### Previous generation cannot be loaded

Show an appropriate error.

### Current generation data is unavailable

Do not attempt an invalid comparison.

### Evaluation fails

Do not show a fake comparison result.

### Score persistence fails

Do not claim persistence succeeded.

The comparison result can still be displayed if the evaluation itself succeeded, but persistence failure must be handled honestly according to existing UI conventions.

---

# 27. No Database Schema Changes

This task requires no database schema changes.

Do NOT:

- create migrations
- modify GenerationContext schema
- create comparison tables
- create comparison entities
- reset the database

Use the existing:

```text
GenerationContext
GeneratedQuestions
GenerationContext.score
```

---

# 28. Agent Feedback

Create:

```text
docs/agent-feedbacks/TASK-023-compare-with-previous-generations.md
```

The feedback must include:

## Summary

What was implemented.

## Architecture

Explain why the dedicated Comparison page was used.

## Evaluation

Explain how both generations are evaluated using the existing `evaluateGeneration()`.

## Comparison

Explain the new pure comparison function and what it compares.

## Persistence

Explain how scores are persisted independently.

## Navigation

Explain the changed TASK-020 flow.

## Reused Components

List existing components/functions reused.

## New Components

List comparison-specific components added.

## TDD

List tests added and their purpose.

## Verification

Report actual results for:

- unit tests
- relevant test suites
- TypeScript
- ESLint
- Prisma validation/build if applicable

Do not claim checks passed unless actually executed.

## Issues / Follow-ups

Document anything discovered but intentionally left out of scope.

---

# 29. Manual Verification

After implementation, manually verify this complete flow:

```text
Questions Page
      ↓
Generate questions
      ↓
Save current generation
      ↓
Evaluate Results
      ↓
Compare with Previous Generations
      ↓
Select a previous generation
      ↓
Evaluate
      ↓
Comparison Page
      ↓
Current result     Previous result
      ↓                  ↓
   Score              Score
      ↓                  ↓
        Comparison / Delta
```

Also verify:

```text
Current generation
      ↓
is NOT shown as its own previous-generation candidate
```

and:

```text
Evaluate Against Predefined Questions
      ↓
Existing /evaluation page
```

still works.

---

# 30. Scope Boundary

## Included

- dedicated Comparison page/route
- comparison-specific state
- evaluation of current + previous
- pure comparison/delta function
- side-by-side comparison
- reuse of existing evaluation components
- TASK-020 navigation change
- score persistence for both sides
- TDD unit/UI tests
- regression protection
- agent feedback

## Not Included

- new database tables
- database migrations
- changes to evaluation algorithms
- changes to scoring methodology
- AI-based evaluation
- new AI providers/models
- multi-generation comparison
- comparison-history persistence
- redesign of the existing `/evaluation` page
- changing exact matching rules
- mandatory grade/question-count/provider filters

---

# 31. Final Acceptance Criteria

TASK-023 is complete when:

- [ ] User can select one previous matching generation.
- [ ] Current generation is available for comparison without requiring a new save.
- [ ] Previous generation is loaded by GenerationContextId.
- [ ] Both generations are evaluated using the same existing `evaluateGeneration()`.
- [ ] Stored previous score is not used as comparison input.
- [ ] A new pure comparison function calculates deltas.
- [ ] Comparison page shows current vs previous clearly.
- [ ] Overall score comparison is visible.
- [ ] Relevant evaluation dimensions can be compared.
- [ ] Current score is persisted when a current GenerationContextId exists.
- [ ] Previous score is persisted to the selected GenerationContext.
- [ ] Current generation remains excluded from candidate results.
- [ ] Existing `/evaluation` functionality remains intact.
- [ ] Predefined evaluation remains intact.
- [ ] TDD tests are implemented.
- [ ] No database schema changes are introduced.
- [ ] Agent feedback is created.
- [ ] Verification results are documented honestly.
