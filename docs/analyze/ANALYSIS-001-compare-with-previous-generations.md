# ANALYSIS-001 — Compare with Previous Generations: Evaluation Flow Analysis

## Purpose

This is an **analysis/design task only**.

**Do NOT implement any code.**

The goal is to carefully analyze the existing Evaluation feature and determine what should happen when the user selects:

> **Compare with Previous Generations**

We are not yet creating an execution task.

After this analysis is reviewed, a separate implementation task will be created based on the findings.

---

# 1. Background

The application currently has a Questions page where the user can:

1. Configure question generation.
2. Generate questions.
3. Save generated questions for evaluation.
4. Click **Evaluate Results**.
5. Choose an evaluation option.

One of the available options is:

> **Compare with Previous Generations**

TASK-020 implemented the ability to find previously saved GenerationContexts that match the current generation by:

- `DifficultyLevel`
- exact set of selected `QuestionPatternIds`
- exact set of selected `QuestionTypes`

The current GenerationContext is excluded from the comparison candidates.

The user can select one previous generation using a radio button.

The next question is:

> What should happen after the user selects a previous generation?

We need to determine whether the existing Evaluation page is appropriate for this use case or whether a dedicated comparison experience is required.

---

# 2. Important Existing Concepts

Review the actual project implementation before making recommendations.

Relevant concepts include:

```text
GenerationContext
GeneratedQuestions
QuestionPattern
QuestionType
DifficultyLevel
Score
Evaluation
```

The current GenerationContext contains information such as:

```text
grade
requestedQuestionCount
score
aiProvider
aiModel
difficultyLevel
```

GeneratedQuestions contain information such as:

```text
generationContextId
questionPatternId
questionType
questionText
expectedAnswer
explanation
```

The exact current implementation must be verified from source code rather than assumed from this document.

---

# 3. TASK-020 Existing Flow

Review the implementation created by TASK-020.

Understand exactly what happens after:

```text
Questions Page
    ↓
Evaluate Results
    ↓
Compare with Previous Generations
    ↓
Find matching GenerationContexts
    ↓
Display saved generations
    ↓
User selects one generation
```

Document:

- what information is currently selected
- what information is passed to the Evaluation page
- what GenerationContextId is used
- how the current generated questions are represented
- how the selected previous generation is represented
- what the existing Evaluation page expects
- whether the existing evaluation pipeline can evaluate two generations simultaneously
- whether the current evaluation model is designed for one dataset or two datasets

Do not change implementation.

---

# 4. Understand the Meaning of "Compare"

Do not assume that "Compare with Previous Generations" simply means:

```text
Evaluate current generation
```

The word **Compare** may imply:

```text
Current Generation
        VS
Previous Generation
```

We need to determine what comparison should actually mean.

Analyze possible interpretations.

### Option A — Evaluate Previous Generation Only

The user selects a previous generation and the existing Evaluation page evaluates that saved generation.

Example:

```text
Current Generation
        ↓
ignored

Previous Generation
        ↓
Evaluation
```

This technically reuses the existing evaluation feature, but it is not really a comparison.

### Option B — Evaluate Both Independently

Evaluate:

```text
Current Generation
Previous Generation
```

separately and show two sets of evaluation results.

Example:

```text
Current Generation
Score: 82%

Previous Generation
Score: 74%
```

Then allow the user to compare them.

### Option C — Direct Comparison

Evaluate both generations and provide explicit comparison metrics.

Example:

```text
                     Current    Previous
Overall Score          82%        74%
Multiple Choice        88%        79%
Fill in Blank          76%        70%
Pattern A              91%        82%
Pattern B              73%        66%
```

This would be a genuinely comparative Evaluation feature.

### Option D — Other

If the existing architecture suggests a better interpretation, document it.

---

# 5. Analyze the Existing Evaluation Page

Carefully review the current Evaluation page and identify what can be reused.

Create a clear analysis of:

## Existing features that should remain

For example:

- evaluation input structure
- evaluation criteria
- AI evaluation
- score calculation
- question-level evaluation
- explanations
- loading/error handling
- existing result presentation
- score persistence
- navigation

Do not assume these should all remain. Verify the implementation and explain why each should or should not be reused.

---

# 6. Identify Features That Do Not Fit Comparison

Determine which existing Evaluation page features are designed around:

```text
ONE generation
```

and therefore may not work correctly for:

```text
TWO generations
```

Look specifically for:

- state assumptions
- single GenerationContextId
- single question list
- single score
- single evaluation result
- single AI evaluation request
- score persistence
- result rendering
- navigation/back behavior

Document any conflicts.

---

# 7. Determine Whether a Separate Comparison Experience Is Required

Answer this question based on the actual code:

> Can the existing Evaluation page be extended cleanly to support comparison, or would a dedicated comparison page/component be more maintainable?

Consider:

### Reuse

What existing components/services can be reused?

### Separation

What comparison-specific functionality should remain separate?

### Complexity

Would modifying the current Evaluation page make it difficult to understand?

### Domain meaning

Does a comparison result represent the same thing as an ordinary evaluation result?

### Persistence

Should comparison results be persisted?

Do NOT implement anything. Only analyze.

---

# 8. Current vs Previous Generation

Define exactly what the two datasets are.

For example:

```text
CURRENT
GenerationContextId = currentGenerationContextId
GeneratedQuestions = current generated questions
```

and:

```text
PREVIOUS
GenerationContextId = selectedPreviousGenerationContextId
GeneratedQuestions = saved generated questions
```

Determine whether the current generation must already be saved before comparison.

If it is not saved, determine whether comparison is still possible.

---

# 9. Ensure Fair Comparison

Because TASK-020 already filters previous generations using exact:

```text
DifficultyLevel
QuestionPatternIds
QuestionTypes
```

an analysis should verify whether this is sufficient for a fair comparison.

Consider:

- same requested question count?
- same grade?
- same question patterns?
- same question types?
- same difficulty?
- same evaluation criteria?
- same reference questions?
- same AI evaluation model?
- same AI provider?
- same generated-question count?

Do not automatically add new filtering rules.

For every proposed comparison condition, explain:

```text
Required
OR
Optional
OR
Not appropriate
```

The goal is to avoid making the comparison unnecessarily restrictive.

---

# 10. Question Count Consideration

TASK-021 introduced:

```text
requestedQuestionCount
```

Determine how this should affect comparison.

For example:

```text
Current:
requested = 10
generated = 10

Previous:
requested = 10
generated = 8
```

Should this previous generation:

- be excluded?
- remain eligible?
- be shown with a warning?
- be normalized during scoring?

Analyze the implications.

Do not implement a decision without documenting the reasoning.

---

# 11. Grade Consideration

TASK-021 introduced:

```text
grade
```

Determine whether previous generations should require the same grade.

For example:

```text
Current = Grade 6
Previous = Grade 7
```

Should that be:

- excluded?
- allowed?
- warned?

Explain why.

Remember that `grade` represents the educational grade and `score` represents the evaluation score.

Do not confuse these fields.

---

# 12. Existing Score

The current GenerationContext now has:

```text
score
```

Analyze how comparison should treat:

### Previous generation already evaluated

```text
Previous.score = 78
```

### Previous generation not yet evaluated

```text
Previous.score = null
```

### Current generation

The current score may not exist before evaluation.

Determine whether comparison should:

- reuse an existing previous score
- re-evaluate the previous generation
- evaluate both generations using the same evaluation criteria
- show stored score separately from newly calculated comparison score

Do not implement yet.

---

# 13. AI Evaluation Considerations

Analyze whether comparison should require:

```text
same AI provider
same AI model
```

For example:

```text
Current:
Groq / model-A

Previous:
OpenAI / model-B
```

Should comparison be allowed?

There are two possible meanings:

### Content-quality comparison

Different AI providers/models are allowed because we are comparing generated educational content.

### Model-performance comparison

Different providers/models are important because the comparison is explicitly about AI model performance.

Determine what the current application appears to be trying to measure and recommend the more appropriate approach.

If this cannot be determined from the existing project, explicitly say so rather than inventing an assumption.

---

# 14. Comparison Metrics

Do NOT design the complete final comparison UI yet.

Instead, identify which metrics the existing evaluation system already provides that could be compared.

Potential categories include:

```text
Overall Score
Question Type
Question Pattern
Difficulty
Question-level results
```

Determine which are already available.

Then identify:

```text
Available now
Needs backend changes
Needs evaluation changes
Needs UI changes
```

---

# 15. Persistence of Comparison Results

Analyze whether comparison results should be saved.

Possible approaches:

### Persist

Save comparison result/history.

### Do not persist

Comparison is a temporary analysis session.

Determine what is appropriate for the current research prototype.

Do not implement.

---

# 16. Recommended User Experience

Based on the analysis, describe the recommended flow.

For example:

```text
Questions Page
      ↓
Evaluate Results
      ↓
Compare with Previous Generations
      ↓
Select previous generation
      ↓
Comparison page
      ↓
Load Current + Previous
      ↓
Evaluate / Compare
      ↓
Comparison Results
```

Or, if the existing Evaluation page can cleanly support it:

```text
Questions Page
      ↓
Evaluate Results
      ↓
Compare with Previous Generations
      ↓
Select previous generation
      ↓
Existing Evaluation Page
      ↓
Comparison mode
```

Do not implement either option yet.

---

# 17. Required Output

After reviewing the actual project, provide a structured analysis containing:

## A. Current Implementation

What TASK-020 currently does.

## B. Existing Evaluation Flow

How the current Evaluation page works.

## C. Reusable Features

What can be reused.

## D. Features That Need Modification

What must change for comparison.

## E. Features That Should Remain Unchanged

What should not be touched.

## F. Comparison Architecture Options

Compare at least:

```text
Option 1 — Extend existing Evaluation page
Option 2 — Dedicated Comparison page
Option 3 — Shared evaluation components + dedicated comparison orchestration
```

For each:

- advantages
- disadvantages
- complexity
- maintainability
- recommended/not recommended

## G. Data Requirements

Identify whether any additional fields/data are required.

## H. Evaluation Requirements

Identify whether the existing evaluation engine can support comparison.

## I. Recommended UX

Describe the recommended user flow.

## J. Open Questions

List decisions that still need user/product clarification.

## K. Recommended Next Task

Do NOT create the implementation task yet.

Instead, provide a precise recommendation for what the next implementation task should contain.

---

# 18. Important Constraints

This is an **ANALYSIS ONLY** task.

Claude must NOT:

- modify application code
- modify Prisma schema
- modify database
- create migrations
- create API endpoints
- change UI
- add tests
- refactor existing code
- create an implementation task

Claude should only inspect the existing implementation and produce the analysis.

The next execution task will be created after this analysis and user review.

---

# 19. TDD Consideration

Because this is analysis only, no tests should be implemented.

However, the analysis must identify what would need unit/integration tests in the eventual implementation task.

Do not implement those tests now.

---

# 20. Final Decision Goal

The goal is to answer these questions clearly:

1. **What does "Compare with Previous Generations" actually mean in this application?**
2. **Can the current Evaluation page support it cleanly?**
3. **Should we introduce a dedicated comparison experience?**
4. **Which existing Evaluation features should remain?**
5. **Which existing features need modification?**
6. **What data should be compared?**
7. **Should previous scores be reused or recalculated?**
8. **Should comparison results be persisted?**
9. **What is the minimum clean architecture for this research prototype?**
10. **What exactly should the next implementation task do?**

Do not implement anything until the analysis has been reviewed and approved.
