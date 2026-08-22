# TASK-014 — Design and Implement Prompt Quality Evaluation

## Status

Completed

## Objective

Design and implement the Evaluation page for MathQuestAI.

The purpose of this page is **not simply to judge whether the generated math questions are good or bad**.

The primary research objective is:

> **Measure how effectively the generated prompt and supplied context produced the intended output, and use the evaluation findings to improve the prompt/context for the next generation.**

The AI model itself is **not the subject of this experiment**.

For this research prototype, treat the selected AI model as a relatively fixed execution engine. We are investigating whether improvements to:

- Context
- Prompt structure
- Instructions
- Question-pattern guidance
- Difficulty guidance
- Reference questions
- Output-format constraints

lead to better and more consistent generated questions.

The Evaluation page should therefore help the researcher answer:

> **"What did our prompt ask for, what did the AI actually produce, where did it deviate, and what should we improve in the prompt?"**

---

# 1. Research Principle — Most Important Requirement

The Evaluation page must clearly follow this principle:

```text
Better Context
      +
Better Prompt
      ↓
Better adherence to intended requirements
      ↓
Better Generated Questions
```

The evaluation should **not** attempt to determine:

```text
Gemini vs another AI model
GPT vs Gemini
Which model is smarter
Which model has better mathematical ability
```

Those are outside the scope of this research.

The page should instead evaluate the relationship:

```text
Prompt / Context
       ↓
Expected behavior
       ↓
Actual generated output
       ↓
Deviation / adherence
       ↓
Prompt improvement
```

This distinction should influence the naming, descriptions, scoring, and recommendations throughout the page.

---

# 2. Evaluation Page Should Be an Evaluation Report

Do not simply create a collection of unrelated percentage cards.

The page should tell a story.

Recommended high-level structure:

```text
┌──────────────────────────────────────────┐
│ Evaluation Summary                       │
│                                          │
│ How effectively did this prompt produce  │
│ the intended questions?                  │
│                                          │
│ Prompt Effectiveness: XX%                │
└──────────────────────────────────────────┘

                ↓

┌──────────────────────────────────────────┐
│ Prompt → Output Assessment               │
│                                          │
│ What was requested?                      │
│ What was actually produced?              │
│ How closely did they match?              │
└──────────────────────────────────────────┘

                ↓

┌──────────────────────────────────────────┐
│ Practice Configuration                    │
│                                          │
│ Grade / Subject / Topic / Subtopic       │
│ Difficulty / Patterns / Question Types   │
└──────────────────────────────────────────┘

                ↓

┌──────────────────────────────────────────┐
│ Question Pattern Coverage                │
│                                          │
│ Pattern A       40%                      │
│ Pattern B       35%                      │
│ Pattern C       25%                      │
└──────────────────────────────────────────┘

                ↓

┌──────────────────────────────────────────┐
│ Question Type Coverage                   │
│                                          │
│ Multiple Choice     50%                  │
│ Fill in the Blank   30%                  │
│ Word Problem        20%                  │
└──────────────────────────────────────────┘

                ↓

┌──────────────────────────────────────────┐
│ Requirement / Constraint Adherence       │
│                                          │
│ Difficulty             ✓                 │
│ Question type          ✓                 │
│ Pattern coverage       ⚠                 │
│ Output format          ✓                 │
│ Reference alignment    ✓                 │
└──────────────────────────────────────────┘

                ↓

┌──────────────────────────────────────────┐
│ Prompt Improvement Opportunities         │
│                                          │
│ What should change in the prompt?        │
│ What should be clarified?                │
│ What worked well?                        │
└──────────────────────────────────────────┘
```

This is only a suggested information architecture.

Claude Code should evaluate the existing design system and propose improvements before implementing the final layout.

---

# 3. Prompt Effectiveness — Primary Evaluation

This should be the **first and most important section** of the page.

The user wants a simple explanation of how well the prompt translated into the generated output.

For example:

> **Prompt Effectiveness — 82%**

Then explain what the score means.

Suggested explanation:

> The generated questions followed most of the requirements defined by the prompt, including the selected question patterns, difficulty, question types, and requested output structure. Some deviations were detected in pattern coverage and/or requirement adherence.

The exact wording and score presentation can be improved by Claude Code.

### Important

Do **not** invent an arbitrary percentage without defining what it measures.

The implementation must define a transparent evaluation methodology.

For example, the score could be derived from weighted dimensions such as:

```text
Pattern adherence
Difficulty adherence
Question-type adherence
Instruction adherence
Reference-question alignment
Output-format adherence
Coverage/completeness
```

Claude Code should propose the most appropriate scoring model based on the existing generation architecture.

The scoring methodology must be:

- Explainable
- Deterministic where possible
- Based on observable generated output
- Independent of which AI model is used
- Useful for improving the prompt

Avoid presenting the score as an absolute scientific measurement.

It is a **research-prototype metric**.

---

# 4. Prompt vs Output — Make the Comparison Understandable

The evaluation page should make the relationship between the prompt and generated output easy to understand.

The user should be able to answer:

### What did we ask for?

Examples:

```text
Difficulty: Medium

Patterns:
- Combine Like Terms
- Apply Distributive Property

Question Types:
- Multiple Choice
- Fill in the Blank

Question Count:
10
```

### What did we receive?

For example:

```text
Generated:
- 4 Combine Like Terms
- 5 Distributive Property
- 1 unexpected pattern

Types:
- 6 Multiple Choice
- 3 Fill in the Blank
- 1 Word Problem
```

### What was the result?

```text
Pattern adherence: 90%
Question-type adherence: 90%
Difficulty adherence: 100%
Format adherence: 100%
```

The UI should make these relationships visually obvious.

---

# 5. User Selection / Practice Configuration

Include a section showing what the user selected before generation.

This is important because the evaluation results cannot be understood without knowing the intended configuration.

The section should reflect the actual Setup page inputs.

At minimum:

```text
Grade
Subject
Topic
Subtopic
Difficulty
Question Patterns
Question Types
Question Count
```

Where appropriate, distinguish:

### Explicitly selected patterns

from:

### All patterns for this subtopic

If the user selected:

**"Use all question patterns for this subtopic"**

the evaluation should understand that the expected pattern set is:

```text
ALL patterns belonging to the selected subtopic
```

not just the patterns manually selected in the UI.

Likewise, question types may be:

- Explicitly selected
- AI-mixed / automatically selected

The evaluation should preserve that distinction.

---

# 6. Question Pattern Coverage

Create an evaluation section for question-pattern distribution.

If the user selected multiple patterns:

```text
Combine Like Terms
Apply Distributive Property
Simplify Algebraic Fractions
```

show the distribution among generated questions.

Example:

```text
Question Pattern Coverage

Combine Like Terms             40%
Apply Distributive Property     35%
Simplify Algebraic Fractions    25%
```

The representation can be a chart, progress bars, table, or another suitable visualization.

Do not assume equal percentages unless the generation requirements explicitly require equal distribution.

The evaluation should distinguish:

```text
Expected
vs
Actual
```

when the expected distribution can reasonably be determined.

---

# 7. "Use All Question Patterns" Scenario

If the user selected:

**Use all question patterns for this subtopic**

the evaluation must show **all applicable question patterns**.

For example:

```text
Subtopic: Simplify & Calculate

Expected Patterns
────────────────────────────
Combine Like Terms
Apply Distributive Property
Simplify Algebraic Fractions
Simplify Multi-Operation Expressions
Simplify and Retain Variables
```

Then show actual generated distribution.

Example:

```text
Pattern                         Generated
────────────────────────────────────────
Combine Like Terms                  20%
Apply Distributive Property         20%
Simplify Algebraic Fractions        20%
Simplify Multi-Operation Expressions 30%
Simplify and Retain Variables       10%
```

This is especially important because selecting "all patterns" represents a different user intention from manually selecting two or three patterns.

---

# 8. Question Type Coverage

Create another section for question-type distribution.

The Setup page allows multiple question types.

Examples:

```text
Multiple Choice
Fill in the Blank
Word Problem
True / False
Multi-step Problem
```

The evaluation should show:

```text
Requested Question Types
        ↓
Generated Question Types
        ↓
Coverage / adherence
```

Example:

```text
Multiple Choice       50%
Fill in the Blank     30%
Word Problem          20%
```

Again, do not assume that every type must have exactly the same percentage unless the generation requirement explicitly says so.

If the user selected an automatic AI-mix option, evaluate the generated distribution according to the intended behavior of that mode rather than treating equal distribution as mandatory.

---

# 9. Difficulty Evaluation

The selected difficulty should also be evaluated.

For example:

```text
Requested Difficulty
Medium
```

Then evaluate whether the generated questions appear consistent with the project's defined difficulty characteristics.

The current project defines:

```text
Easy
≈ direct application / approximately one step

Medium
≈ 2–3 connected steps

Hard
≈ multiple connected or complex steps while remaining within
the same question pattern
```

The evaluation should therefore distinguish:

```text
Requested difficulty
        ↓
Observed difficulty characteristics
        ↓
Adherence
```

Do not simply assume that the AI's returned difficulty label is correct.

Where possible, evaluate the actual characteristics of the generated question.

---

# 10. Output Format Evaluation

The generation system already defines an expected AI output schema and validates it with Zod.

The evaluation page should expose the idea of:

```text
Expected Output Format
        ↓
Actual AI Output
        ↓
Format Adherence
```

The evaluation should consider things such as:

- Required fields
- Question structure
- Question type
- Options where applicable
- Correct answer
- Valid option references
- Required metadata
- Number of questions
- Structural consistency

Important:

The existing Zod validation tells us whether the response is structurally valid.

The Evaluation page should **not duplicate or replace Zod validation**.

Instead, use the validation result as one input to the evaluation.

---

# 11. Requirement / Constraint Adherence

Consider an evaluation section that summarizes important prompt requirements.

For example:

```text
Requirement                    Result
──────────────────────────────────────
Correct subject                ✓
Correct topic                  ✓
Requested patterns             ✓
Requested difficulty           ✓
Requested question types      ⚠
Reference alignment            ✓
Output structure               ✓
Question count                 ✓
```

Use clear states such as:

```text
✓ Met
⚠ Partially met
✕ Not met
```

This may be more useful to the researcher than percentages alone.

Claude Code should consider whether this should become the primary detailed evaluation mechanism behind the overall prompt-effectiveness score.

---

# 12. Reference Question Alignment

The project uses Reference Questions as part of the generation context.

Therefore, consider evaluating whether generated questions preserve the **characteristics** expected from the reference questions.

Important:

The system must NOT reward copying a reference question.

The goal is to evaluate characteristics such as:

```text
Question pattern
Complexity
Expected reasoning
Structure
Difficulty characteristics
Educational intent
```

Claude Code should propose a safe and meaningful way to represent this evaluation.

This should be treated as a potential contributor to prompt effectiveness rather than as a simple "similarity percentage."

---

# 13. Prompt Improvement Opportunities

This should appear toward the end of the evaluation report.

The purpose is to answer:

> **"What should we change in the prompt/context before running the next experiment?"**

For example:

```text
Improvement Opportunities

1. Clarify distribution requirements
   The generated questions favored Combine Like Terms
   over the other requested patterns.

2. Strengthen question-type constraints
   Word Problems appeared even though they were not
   explicitly selected.

3. Clarify difficulty boundaries
   Some Medium questions appear to require only one
   reasoning step.
```

The wording should be based on actual evaluation findings.

Do not provide generic AI advice such as:

> "Make the prompt more detailed."

The recommendation should identify the **specific prompt/context weakness** discovered from the output.

---

# 14. What Worked Well

In addition to problems, show positive findings.

For example:

```text
What Worked Well

✓ Difficulty instructions were consistently followed.
✓ Output structure was fully compliant.
✓ Most generated questions stayed within the requested patterns.
✓ Question types matched the requested configuration.
```

This prevents the evaluation from becoming only a bug report.

It also helps identify which prompt instructions should **not** be changed in the next experiment.

---

# 15. Prompt Improvement Loop

The page should visually reinforce the research loop:

```text
Current Context + Prompt
          ↓
       Generate
          ↓
       Evaluate
          ↓
    Find weaknesses
          ↓
   Improve Prompt
          ↓
       Generate
          ↓
       Evaluate
          ↓
       Compare
```

The Evaluation page is therefore a **feedback mechanism for prompt engineering**, not simply a results screen.

---

# 16. Creative Evaluation Ideas — Claude Code Should Investigate

Do not restrict the implementation to the components explicitly listed in this task.

Before implementing the final Evaluation UI, Claude Code should review the existing project architecture and propose additional evaluation features that would help answer the research question.

Potential ideas to investigate include:

### A. Prompt Strength Radar

Show dimensions such as:

```text
Context clarity
Pattern adherence
Difficulty adherence
Type adherence
Instruction adherence
Output compliance
Reference alignment
```

This could provide a quick visual fingerprint of the prompt.

---

### B. Expected vs Actual Matrix

A compact matrix could show:

```text
                    Expected    Actual    Status
Pattern A              ✓          ✓        ✓
Pattern B              ✓          ✓        ✓
Pattern C              ✓          ✕        ✕

Multiple Choice        ✓          ✓        ✓
Fill in Blank          ✓          ✓        ✓
Word Problem           ✕          ✓        ⚠
```

This may be more useful than several isolated charts.

---

### C. Deviation Highlights

Instead of making the user inspect ten questions manually, highlight the generated questions that violated an important requirement.

For example:

```text
Question #7
⚠ Unexpected question pattern

Expected:
Apply Distributive Property

Observed:
Combine Like Terms
```

This gives the researcher concrete evidence behind the score.

---

### D. Prompt Improvement Suggestions

Generate structured recommendations such as:

```text
Problem
↓
Evidence
↓
Likely prompt weakness
↓
Suggested improvement
```

The exact implementation should be evaluated carefully because we don't want an LLM simply generating vague feedback about another LLM.

---

### E. Evaluation Confidence

If a score is based on uncertain or subjective evaluation, consider displaying a confidence indicator or explaining which parts are deterministic versus AI-assisted.

For example:

```text
Structural evaluation     High confidence
Pattern coverage          High confidence
Difficulty assessment     Medium confidence
Reference alignment       Medium confidence
```

This would make the research prototype more scientifically honest.

---

# 17. Deterministic vs AI-Assisted Evaluation

This is an important architectural consideration.

Where an evaluation can be calculated deterministically, prefer deterministic evaluation.

For example:

```text
Question count
Question types
Pattern identifiers
Required fields
Output schema
```

can potentially be evaluated without another AI call.

For more semantic evaluations such as:

```text
Does this question actually match the intended difficulty?
Does this question preserve the characteristics of the reference questions?
Does this question satisfy the educational intent?
```

Claude Code should identify whether an AI-assisted evaluator is necessary.

If an AI evaluator is proposed, clearly separate:

```text
Generation model
vs
Evaluation mechanism
```

and explain the implications for the research methodology.

Do not silently add another AI dependency.

---

# 18. Evaluation Score Design

Do not create a single "Prompt Score" by simply averaging unrelated percentages.

Before implementation, define the evaluation dimensions and their meaning.

A possible conceptual model is:

```text
Prompt Effectiveness
        │
        ├── Requirement adherence
        ├── Pattern coverage
        ├── Question-type adherence
        ├── Difficulty adherence
        ├── Output-format compliance
        ├── Reference alignment
        └── Instruction consistency
```

Claude Code should determine:

1. Which dimensions are objectively measurable.
2. Which require semantic evaluation.
3. Which should contribute to the overall score.
4. Whether weighting is appropriate.
5. How the score should be explained to the user.

The final score must remain interpretable.

---

# 19. Important Research Limitation

Do not claim:

> "Prompt effectiveness = 87% means the prompt is scientifically 87% effective."

Instead, use language such as:

> **Prompt Effectiveness: 87%**

> Based on the evaluation criteria used by this prototype, the generated output followed most of the requirements defined by the current prompt.

The metric is an **experimental measurement**, not an objective universal measure of prompt quality.

---

# 20. Data Required by the Evaluation

The evaluation flow should have access to the relevant session data:

```text
PracticeConfig
GenerationContext
GenerationResponse
Selected evaluation method
```

Where available, this includes:

```text
Grade
Subject
Topic
Subtopic
Difficulty
Selected Question Patterns
All-patterns selection state
Selected Question Types
AI-mix selection state
Question Count
Generation Prompts
Reference Questions
Final Generated Prompt
Generated Questions
Generation validation result
```

The final evaluation implementation should reuse the existing `PracticeSessionProvider` and existing server-side architecture.

Do not introduce a new global state-management solution.

---

# 21. Expected Output Format for the Evaluation

Just as the question-generation pipeline has an explicit expected output contract, the evaluation pipeline should also have an explicit structured output contract.

Do not rely on an unstructured block of text.

Define a typed evaluation result, for example conceptually:

```text
EvaluationResult
│
├── overallAssessment
│
├── promptEffectiveness
│
├── configurationSummary
│
├── patternCoverage
│
├── questionTypeCoverage
│
├── difficultyAssessment
│
├── requirementAdherence
│
├── outputFormatAssessment
│
├── referenceAlignment
│
├── strengths
│
├── deviations
│
└── improvementOpportunities
```

The exact schema should be designed after reviewing the existing `GenerationResponse`, `GenerationContext`, and evaluation requirements.

If AI is used to produce part of the evaluation, validate its response with **Zod**, just as the generation pipeline validates Gemini output.

Malformed evaluation output must not silently reach the UI.

---

# 22. Architecture

Follow the existing architecture:

```text
Evaluation UI
     ↓
Server Action
     ↓
Evaluation Orchestrator
     ↓
Deterministic Evaluation
     +
Optional semantic evaluation
     ↓
Validated EvaluationResult
     ↓
Evaluation UI
```

Keep responsibilities separated.

For example:

```text
app/evaluation/
    UI only

lib/actions/
    Server Action boundary

lib/evaluation/
    Evaluation orchestration and evaluation logic

lib/prompts/
    Existing generation prompt logic
```

Do not place evaluation logic directly inside the React page.

---

# 23. Important Scope Boundary

This task includes:

- Evaluation page design
- Evaluation data model
- Evaluation result schema
- Prompt effectiveness assessment
- Pattern coverage
- Question-type coverage
- Difficulty assessment
- Configuration display
- Output-format assessment
- Requirement adherence
- Improvement opportunities
- Positive findings
- Appropriate visualizations
- Evaluation loading/error states
- Server-side evaluation flow
- Zod validation for evaluation output

This task does **not** include:

- Comparing against previously generated questions
- Historical generation storage
- Generation history database design
- Previous-generation comparison algorithm
- Changing the Gemini model
- Comparing Gemini with other AI models
- Rebuilding the question-generation pipeline
- Redesigning the Setup page
- Redesigning the Questions page

---

# 24. Implementation Instructions for Claude Code

Before writing implementation code:

### Step 1 — Inspect

Review:

```text
app/evaluation/page.tsx
app/questions/page.tsx
components/providers/practice-session-provider.tsx
lib/types.ts
lib/prompts/types.ts
lib/prompts/schema.ts
lib/prompts/builder.ts
lib/generation/generate-questions.ts
lib/db/generation-context.ts
prisma/schema.prisma
docs/ai-generation.md
docs/architecture.md
docs/progress.md
```

### Step 2 — Understand

Determine exactly what information is already available after question generation.

Do not create duplicate state or database data unnecessarily.

### Step 3 — Propose

Before implementation, provide a concise proposed:

- Evaluation architecture
- Evaluation dimensions
- Scoring methodology
- EvaluationResult schema
- UI information hierarchy
- Deterministic vs AI-assisted evaluation strategy

Pay particular attention to whether the proposed score actually measures **prompt effectiveness** rather than merely judging the generated questions.

### Step 4 — Challenge the Requirements

Identify any evaluation requirement that cannot be measured reliably from the currently available data.

Do not silently invent data.

If an evaluation metric requires information that the current generation pipeline does not preserve, identify that gap and propose the smallest architectural change required.

### Step 5 — Implement

After the approach is clear, implement the Evaluation page and evaluation pipeline consistently with the existing architecture.

### Step 6 — Test

Add appropriate unit/integration tests for:

- Evaluation calculations
- Pattern coverage
- Question-type coverage
- Difficulty evaluation
- Output-format evaluation
- Overall scoring
- Evaluation schema validation
- Error handling
- Evaluation screen rendering

---

# 25. Final Acceptance Criteria

The completed Evaluation feature should allow a researcher to answer these questions:

### About the input

- [ ] What did the user ask the system to generate?
- [ ] What subject/topic/subtopic was selected?
- [ ] What difficulty was selected?
- [ ] Which question patterns were requested?
- [ ] Was "all patterns" selected?
- [ ] Which question types were requested?
- [ ] Was AI-mix selected?

### About the prompt

- [ ] What important requirements did the prompt communicate?
- [ ] How effectively were those requirements reflected in the generated output?
- [ ] Which prompt characteristics worked well?
- [ ] Which prompt characteristics appear weak or ambiguous?

### About the generated output

- [ ] How many questions were generated?
- [ ] What percentage belongs to each requested pattern?
- [ ] What percentage belongs to each requested question type?
- [ ] Does the generated difficulty appear appropriate?
- [ ] Does the output follow the expected structure?
- [ ] Which requirements were met?
- [ ] Which were partially met?
- [ ] Which were not met?

### About improvement

- [ ] What should be improved in the prompt/context?
- [ ] Why should it be improved?
- [ ] What evidence from the generated output supports the recommendation?
- [ ] What parts of the prompt should probably remain unchanged?

### About the research goal

- [ ] The page clearly focuses on prompt/context effectiveness.
- [ ] The page does not evaluate the relative power of different AI models.
- [ ] The evaluation score is explainable.
- [ ] The evaluation does not present experimental metrics as scientific absolute truths.
- [ ] The evaluation creates useful feedback for the next prompt iteration.

---

# Expected Research Loop

The final system should support this loop:

```text
        ┌──────────────────────────────┐
        │ Context + Prompt             │
        └──────────────┬───────────────┘
                       ↓
                Generate Questions
                       ↓
                Evaluate Output
                       ↓
             ┌─────────┴─────────┐
             ↓                   ↓
        What worked?       What failed?
             ↓                   ↓
             └─────────┬─────────┘
                       ↓
              Improve Prompt
                       ↓
                Generate Again
                       ↓
                  Evaluate
                       ↓
                    Repeat
```

**The success criterion for this feature is therefore not "the Evaluation page looks good."**

The real success criterion is:

> **After looking at the Evaluation page, the researcher should have enough evidence to make a better-informed decision about how to modify the prompt/context for the next generation experiment.**