# MathQuestAI — AI Generation

## 1. Purpose

AI question generation is the core research area of MathQuestAI.

The goal is not simply to call an AI API and generate mathematics questions.

The goal is to investigate:

> How can structured educational context and carefully designed prompts improve the quality, relevance, consistency, and difficulty of AI-generated mathematics questions?

The application should therefore make the generation process understandable, configurable, and easy to improve iteratively.

---

# 2. Research Loop

The central research loop is:

```text
Define Context
      ↓
Build Prompt
      ↓
Generate Questions
      ↓
Evaluate Results
      ↓
Identify Problems
      ↓
Improve Context / Prompt
      ↓
Generate Again
      ↓
Evaluate Again
```

This loop is an important product and architecture principle.

The project should make it easy to repeat this cycle.

---

# 3. User Input

The user provides the main generation requirements through the UI.

The current required selections are:

```text
Subject
Topic
Subtopic
Question Pattern(s)
Difficulty
Question Type
```

The user must select:

- One Subtopic
- At least one Question Pattern
- A Difficulty Level
- A Question Type

The user may select multiple Question Patterns.

The user may also select all available Question Patterns.

---

# 4. Context Construction

The user selections are not directly sent to the AI as the final prompt.

Instead, the server uses the selections to retrieve relevant context.

Conceptually:

```text
User Selections
      ↓
Context Retrieval
      ↓
Relevant Database Data
      ↓
Generation Context
      ↓
Prompt Builder
      ↓
Final AI Prompt
```

This allows the application to experiment with how different context affects AI output.

---

# 5. Database Context

The database contains structured educational information.

The relevant hierarchy is:

```text
Subject
   ↓
Topic
   ↓
Subtopic
   ↓
Question Pattern
```

For a selected Question Pattern and Difficulty, the application can retrieve:

```text
Reference Questions
+
QuestionGenerationRequests.GenerationPrompt
```

The application can also retrieve common generation instructions that apply to every generation request.

---

# 6. Example Context

For example, the user may select:

```text
Subject:
Mathematics

Topic:
Algebra

Subtopic:
Simplify / Calculate

Question Pattern:
Combine Like Terms

Difficulty:
Medium

Question Type:
Multiple Choice
```

The server then retrieves the appropriate generation context.

Conceptually:

```text
Mathematics
+
Algebra
+
Simplify / Calculate
+
Combine Like Terms
+
Medium
+
Multiple Choice
+
Medium reference questions
+
Medium generation prompt
+
Common generation instructions
```

This becomes the input to the Prompt Builder.

---

# 7. Common Generation Instructions

The project uses common instructions that apply to question generation generally.

These are not specific to one Subject, Topic, Subtopic, Question Pattern, or Difficulty.

They may define things such as:

- The main purpose of the generation
- How many questions should be generated
- Expected output format
- General quality requirements
- General rules that should apply to every generation request

The number of generated questions is therefore not stored as a `QuestionCount` column in `QuestionGenerationRequests`.

---

# 8. Question-Specific Generation Prompt

`QuestionGenerationRequests.GenerationPrompt` contains instructions specific to a Question Pattern and Difficulty combination.

For example:

```text
Question Pattern:
Combine Like Terms

Difficulty:
Hard
```

The corresponding generation prompt should explain how the AI should generate questions that satisfy the intended characteristics of that combination.

This is different from the common generation instructions.

Conceptually:

```text
Common Instructions
        +
Question-specific GenerationPrompt
        ↓
Generation Instructions
```

---

# 9. Difficulty Benchmark

The current project uses three project-specific difficulty levels.

## Easy

> Direct application of the Question Pattern. Usually requires one main step and a familiar structure.

## Medium

> Still directly related to the Question Pattern, but requires additional processing or 2–3 connected steps.

## Hard

> Requires multiple connected steps, more complex arrangement, or combining a few related complexity factors.

These definitions are intentionally human-friendly.

They are not intended to be a universal mathematical difficulty standard.

---

# 10. Difficulty and Prompt Generation

Difficulty should affect the generation instructions.

The intention is not simply to tell the AI:

```text
Difficulty = Hard
```

The prompt should explain what "Hard" means in the context of this project.

For example, the common generation instructions can communicate the general principle:

```text
Generate questions according to the requested difficulty benchmark.
```

Then the QuestionGenerationRequests.GenerationPrompt can provide the Question Pattern-specific interpretation.

For Hard questions, the project may instruct the AI to:

- Use multiple connected steps
- Use a more complex arrangement
- Combine a few related complexity factors

However, the AI should still remain focused on the selected Question Pattern.

Difficulty must not cause the question to become a different Question Pattern.

---

# 11. Question Pattern Must Remain Primary

Difficulty should increase complexity without changing the mathematical task being tested.

For example:

```text
Question Pattern:
Combine Like Terms
```

A Hard question should still primarily test:

```text
Combining Like Terms
```

It should not accidentally become primarily:

```text
Apply Distributive Property
```

or:

```text
Simplify Algebraic Fractions
```

The same principle applies to every Question Pattern.

---

# 12. Reference Questions

Reference Questions provide examples of the expected output for a Question Pattern and Difficulty.

Conceptually:

```text
Question Pattern
      +
Difficulty
      ↓
Reference Questions
      ↓
AI Context
```

Reference Questions should help the AI understand:

- The intended mathematical task
- The expected structure
- The expected level of complexity
- Appropriate variation

They should not be copied mechanically.

The AI should generate new questions rather than simply reproduce the reference questions.

---

# 13. Reference Questions by Difficulty

Each Question Pattern should have representative examples for the difficulty levels being supported.

For example:

```text
Combine Like Terms
│
├── Easy
│   └── Reference Questions
│
├── Medium
│   └── Reference Questions
│
└── Hard
    └── Reference Questions
```

The examples should clearly reflect the project's difficulty benchmark.

---

# 14. Multiple Question Patterns

The user can select multiple Question Patterns.

Example:

```text
✓ Combine Like Terms
✓ Apply Distributive Property
✓ Simplify Algebraic Fractions
```

The generation context should include the selected patterns.

The application must decide how to instruct the AI when multiple patterns are selected.

A key principle is:

> Do not assume that selecting multiple patterns automatically means every generated question must combine all selected patterns.

The prompt strategy should explicitly define how multiple patterns should be handled.

This is an area that can be refined during research.

---

# 15. "All Patterns"

"All Patterns" is a user-interface selection.

It does not represent a special Question Pattern in the database.

The application should resolve:

```text
All Patterns
      ↓
All Question Patterns for selected Subtopic
      ↓
Relevant generation context
```

The AI prompt should then clearly communicate how those patterns should be used.

---

# 16. Question Type

Question Type is selected by the user.

It is separate from Question Pattern and Difficulty.

For example:

```text
Question Pattern:
Combine Like Terms

Difficulty:
Medium

Question Type:
Multiple Choice
```

The selected Question Type must be included in the generation context so the AI knows how the question should be presented.

The Question Type does not change the mathematical Question Pattern.

---

# 17. Prompt Builder

Prompt construction should be implemented as a dedicated application concern.

Conceptually:

```text
Generation Request
        ↓
Context Loader
        ↓
Prompt Builder
        ↓
Final Prompt
```

The Prompt Builder should not directly query the database.

A better separation is:

```text
Database Layer
      ↓
Context Loader
      ↓
Generation Context
      ↓
Prompt Builder
      ↓
Final Prompt
```

This makes the Prompt Builder easier to unit test.

---

# 18. Generation Context Model

The application should use an internal structured model representing the information required to construct a prompt.

Conceptually:

```typescript
type GenerationContext = {
  subject: string;
  topic: string;
  subtopic: string;
  questionPatterns: QuestionPatternContext[];
  difficulty: string;
  questionType: string;
  commonInstructions: string;
};
```

A Question Pattern context can contain information such as:

```typescript
type QuestionPatternContext = {
  name: string;
  generationPrompt: string;
  referenceQuestions: ReferenceQuestion[];
};
```

The exact TypeScript model should be defined during implementation.

The purpose is to prevent prompt construction from being tightly coupled to database entities.

---

# 19. Final Prompt

The final prompt should be constructed from structured context.

Conceptually:

```text
┌──────────────────────────────┐
│ Common Instructions          │
├──────────────────────────────┤
│ Subject                      │
├──────────────────────────────┤
│ Topic                        │
├──────────────────────────────┤
│ Subtopic                     │
├──────────────────────────────┤
│ Question Pattern(s)          │
├──────────────────────────────┤
│ Difficulty                   │
├──────────────────────────────┤
│ Question Type                │
├──────────────────────────────┤
│ Generation Prompt(s)         │
├──────────────────────────────┤
│ Reference Question(s)        │
└───────────────┬──────────────┘
                ↓
          Final AI Prompt
```

The exact formatting of the final prompt should remain easy to change because prompt design is part of the research.

---

# 20. AI Provider Boundary

The application should not spread provider-specific API calls throughout the application.

Use an application-level abstraction.

Conceptually:

```text
Prompt Builder
      ↓
Question Generator
      ↓
AI Provider Adapter
      ↓
External AI API
```

This allows the project to change or compare AI providers without rewriting the rest of the application.

---

# 21. AI Request

The AI request should contain the final generation context/prompt and any provider-specific configuration required by the selected AI provider.

Provider-specific implementation details should remain inside the AI integration layer.

The rest of the application should not need to know how the external provider API works.

---

# 22. Expected Output

The AI should return a predictable structured format.

The common generation instructions should communicate the expected output format.

The exact schema will be finalized when the generation API is implemented.

Conceptually, the application expects something similar to:

```text
Generated Questions
    ├── Question
    ├── Question Type
    ├── Options (when applicable)
    └── Answer / Expected Answer
```

The final structure should be designed for reliable parsing and evaluation.

Do not rely on free-form text if structured output is available from the selected AI provider.

---

# 23. AI Response Validation

The application must validate the AI response before displaying it as a successful generation result.

Validation should check at least:

- Response structure
- Required fields
- Number of generated questions
- Question Type compatibility
- Presence of required answer information
- Parseability of the AI response

Invalid responses should be handled as generation failures rather than silently displayed as valid results.

---

# 24. Mathematical Correctness

The generation system should distinguish between:

```text
Prompt compliance
```

and:

```text
Mathematical correctness
```

A question can follow the requested Question Pattern but still contain a mathematical error.

Therefore, the Evaluation page should allow the team to inspect mathematical correctness separately.

The current project does not require an automated mathematical judge.

---

# 25. Evaluation

The Evaluation page is initially designed for human evaluation.

The evaluator should be able to consider questions such as:

```text
Does the question match the selected Question Pattern?

Does the question match the requested Difficulty?

Is the mathematics correct?

Does it match the requested Question Type?

Is it relevant to the selected Subtopic?

Does it follow the intended generation instructions?
```

The exact evaluation criteria may evolve during the research.

---

# 26. Difficulty Evaluation Problem

A key research concern is:

> We currently have a human-friendly definition of Easy, Medium, and Hard, but we do not yet have a precise and universally reliable way to determine whether a generated question actually belongs to the requested difficulty level.

The current benchmark is:

```text
Easy
→ Direct application
→ Usually one main step
→ Familiar structure

Medium
→ Additional processing
→ Approximately 2–3 connected steps
→ Some variation

Hard
→ Multiple connected steps
→ More complex arrangement
→ A few related complexity factors may be combined
```

This benchmark is intended primarily for human interpretation and evaluation.

The project should not prematurely introduce a complex mathematical formula for difficulty.

The difficulty evaluation method is an open research concern.

---

# 27. Difficulty Evaluation Approach

For the current phase, treat the benchmark as a human-readable definition.

When evaluating generated questions, the team can ask:

```text
1. Is this directly applying the Question Pattern?
2. How many meaningful connected steps are required?
3. Is the structure familiar or more complex?
4. Does the question introduce additional related complexity?
5. Does it still primarily test the requested Question Pattern?
```

The goal is consistency rather than pretending that difficulty can already be measured with perfect mathematical precision.

---

# 28. Prompt Experimentation

Prompt construction should be treated as an experimental variable.

For example, the team may compare:

### Experiment A

```text
Question Pattern
+
Difficulty
+
Basic Instructions
```

against:

### Experiment B

```text
Question Pattern
+
Difficulty
+
Detailed Difficulty Instructions
+
Reference Questions
+
Common Instructions
```

The resulting questions can then be evaluated.

The application should make such experimentation possible without major code changes.

---

# 29. Context Experimentation

The team may also experiment with how much context is provided.

For example:

```text
Experiment 1
Question Pattern + Difficulty
```

```text
Experiment 2
Question Pattern + Difficulty + Reference Questions
```

```text
Experiment 3
Question Pattern + Difficulty + Reference Questions
+ Detailed GenerationPrompt
+ Common Instructions
```

The Evaluation page can then be used to compare the results.

---

# 30. Prompt Versioning

Prompt content may change frequently during research.

Therefore, prompt construction should not be scattered across React components or API route handlers.

Keep prompt construction centralized.

This allows changes to be made in one place and tested independently.

If the project later requires persistent experiment history, prompt versions can be stored explicitly.

That is not currently required.

---

# 31. Generation Logging

The initial project does not require permanent storage of every generated prompt or generated question.

During development, normal application logging may be used to debug generation behavior.

If research later requires comparing historical generations, a persistence model can be introduced.

Do not create a generation-history table prematurely.

---

# 32. Security

AI API keys must remain server-side.

The browser must never receive the provider secret.

The expected flow is:

```text
Browser
   ↓
Next.js Server
   ↓
AI Provider
```

not:

```text
Browser
   ↓
AI Provider
```

with the secret exposed to the client.

---

# 33. Error Handling

The generation flow should handle:

### Invalid user selection

```text
Validation error
```

### Missing database context

```text
Context retrieval error
```

### Prompt construction failure

```text
Prompt generation error
```

### AI provider failure

```text
AI generation error
```

### Invalid AI response

```text
Response validation error
```

Errors should be represented clearly in the UI without exposing secrets or internal implementation details.

---

# 34. TDD for AI Generation

AI generation contains both deterministic and non-deterministic behavior.

TDD should focus on the deterministic parts.

Good candidates for unit tests include:

```text
Context → Prompt
```

```text
Selected Pattern(s) → Context
```

```text
Difficulty → Correct generation instructions
```

```text
AI Response → Parsed Generated Questions
```

```text
Invalid AI Response → Validation Failure
```

The actual AI output should not normally be treated as a fixed unit-test expectation because LLM output can vary.

Instead, the AI provider should be isolated behind a mock/fake during most automated tests.

---

# 35. Example TDD Flow

For a Prompt Builder feature:

```text
Requirement:
Include selected difficulty instructions.

        ↓

Write test:
Given Hard difficulty,
the final prompt contains the Hard generation instructions.

        ↓

Implement

        ↓

Run test

        ↓

Refactor
```

For AI integration:

```text
Application
    ↓
QuestionGenerator interface
    ↓
Mock provider
    ↓
Deterministic test
```

The real AI API should be used in controlled integration/manual evaluation scenarios rather than every test run.

---

# 36. Research Experiment Workflow

The complete research workflow should look like:

```text
1. Define Question Pattern
        ↓
2. Define Difficulty Benchmark
        ↓
3. Prepare Reference Questions
        ↓
4. Prepare GenerationPrompt
        ↓
5. Define Common Instructions
        ↓
6. Generate Questions
        ↓
7. Evaluate Questions
        ↓
8. Identify Weaknesses
        ↓
9. Improve Prompt / Context
        ↓
10. Generate Again
        ↓
11. Compare Results
```

This workflow is the central purpose of the AI generation architecture.

---

# 37. Example Research Scenario

Consider:

```text
Topic:
Algebra

Subtopic:
Simplify / Calculate

Question Pattern:
Combine Like Terms

Difficulty:
Hard
```

The database provides:

```text
QuestionGenerationRequests.GenerationPrompt
+
Hard Reference Questions
```

The application adds:

```text
Common Generation Instructions
+
Question Type
+
Selected educational context
```

The Prompt Builder constructs the final prompt.

The AI generates questions.

The team then evaluates:

```text
✓ Is it Combine Like Terms?
✓ Is it Algebra?
✓ Is it Hard according to our benchmark?
✓ Is it mathematically correct?
✓ Is it the requested Question Type?
✓ Does it resemble the intended characteristics?
```

If the result is poor:

```text
Identify why
    ↓
Improve GenerationPrompt
or
Improve Reference Questions
or
Improve Common Instructions
    ↓
Generate again
```

---

# 38. Important Constraint

The application should not assume:

> More prompt text = Better result.

The research should test whether additional context actually improves the output.

The team should be able to compare different prompt/context strategies.

---

# 39. Important Constraint on Reference Questions

Reference Questions are examples, not templates to copy.

The AI should:

```text
Learn characteristics
        ↓
Generate new question
```

not:

```text
Copy reference question
        ↓
Change a number
```

The prompt should explicitly encourage meaningful variation while preserving the intended Question Pattern and Difficulty.

---

# 40. Important Constraint on Difficulty

Difficulty should not be increased by simply making numbers larger.

For example:

```text
Easy:
2x + 3x

Hard:
928374x + 583921x
```

does not automatically represent a meaningful increase in difficulty.

Difficulty should be based on the project benchmark:

```text
Steps
+
Processing
+
Structure
+
Related complexity
```

while remaining focused on the Question Pattern.

---

# 41. Important Constraint on Topic

Generated questions must remain relevant to the selected educational context.

For example:

```text
Topic:
Algebra
```

should result in algebra-focused questions.

The generation process should not introduce unrelated mathematical topics simply to make questions harder.

---

# 42. Separation of Concerns

The final architecture should preserve:

```text
UI
 ↓
Generation Request
 ↓
Context Loader
 ↓
Prompt Builder
 ↓
AI Provider
 ↓
Response Parser
 ↓
Evaluation
```

Each stage should have one clear responsibility.

---

# 43. Summary

MathQuestAI's AI-generation architecture is built around one core idea:

> Store structured educational context, dynamically retrieve the relevant information based on user selections, construct a controlled AI prompt, generate questions, evaluate the output, and iteratively improve the context and prompt.

The important research variables are:

```text
Question Pattern
Difficulty
Reference Questions
GenerationPrompt
Common Instructions
Question Type
```

The important research outcome is:

```text
Better context/prompt
        ↓
Better generated questions
```

The project should therefore optimize for **experimentability, clarity, and evaluation**, not unnecessary architectural complexity.

---

# 44. Implemented Prompt Structure (TASK-006)

TASK-006 implemented the deterministic Prompt Builder and AI output contract described conceptually above. This section records what was actually built, in `lib/prompts/`:

```text
lib/prompts/
├── types.ts     — AiQuestionType, GeneratedQuestion, GenerationResponse, PromptRequest
├── common.ts    — COMMON_INSTRUCTIONS, DIFFICULTY_GUIDANCE, QUESTION_TYPE_ID_MAP, OUTPUT_FORMAT_INSTRUCTIONS
├── builder.ts   — buildPrompt(request: PromptRequest): string
└── schema.ts    — parseGenerationResponse(raw: string): ParsedGenerationResponse
```

`buildPrompt` takes an already-loaded `GenerationContext` (from `lib/db/generation-context.ts`, TASK-005) plus the requested question type(s) and count, and deterministically assembles 7 sections: Common Instructions, Generation Requirement (count), Educational Context (Subject/Subtopic/Question Patterns + per-pattern generation guidance), Difficulty (with the project-specific guidance text), Question Type (explicit list, or all available types when the user chose "let AI mix"), Reference Questions, and Output Format (the required JSON contract, verbatim).

The expected AI response is validated with a small `zod` schema (`lib/prompts/schema.ts`) — a `multiple_choice` question requires a non-empty `options` array and a `correctAnswer` matching one of the option ids; other question types only require `correctAnswer` as plain text. `parseGenerationResponse` never throws — malformed JSON or a schema violation both return `{ ok: false, error }`.

**No AI provider is called by this module.** A dev-only inspection route, `app/dev/prompt-preview`, lets a researcher see the exact final prompt string that would be sent, built from live database context — satisfying the "prompt must be inspectable" research-loop requirement without wiring a live AI call.
