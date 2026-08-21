# TASK-008 — Question Generation Use Case

## Status

Planned

## Objective

Connect the existing MathQuestAI prompt/context pipeline with the AI provider created in TASK-007 and implement the core **question generation use case**.

The goal is to make this backend/application flow work independently:

```text
GenerationContext
       ↓
Prompt Builder
       ↓
AI Provider Contract
       ↓
Google Gemini
       ↓
Provider Response
       ↓
Existing Response Parser
       ↓
Zod Validation
       ↓
GenerationResponse
```

After this task, MathQuestAI must be able to execute a complete question-generation operation programmatically.

The UI does not need to be connected yet.

---

## 1. Scope

### In scope

- Question-generation application/use-case service
- Connecting existing `GenerationContext` to the existing prompt builder
- Connecting the prompt builder to the AI provider contract from TASK-007
- Receiving the AI provider response
- Reusing existing response parsing/validation from TASK-006
- Returning a validated `GenerationResponse`
- Hard-coded question count of **10**
- Unit tests following TDD
- Mock/fake AI provider in unit tests
- Error handling at the use-case boundary
- Real generation verification through the server-side path

### Out of scope

- Setup page integration
- Generate button integration
- Question page integration
- UI loading/error states
- Evaluation page
- Evaluation engine
- Prompt evaluation loop
- Saving generated questions to the database
- User-configurable question count
- User-configurable model selection
- Multiple AI providers
- Authentication
- Production deployment

TASK-008 is the **application/business use case** only.

---

## 2. Existing Work That Must Be Reused

Do not recreate functionality already implemented in previous tasks.

The project already has:

```text
Database
   ↓
Prisma
   ↓
GenerationContext
```

and:

```text
GenerationContext
   ↓
Prompt Builder
   ↓
Generation Prompt
```

and:

```text
GenerationResponse
   ↓
Zod validation
```

TASK-007 provides:

```text
AI Provider Contract
   ↓
Google Gemini implementation
```

TASK-008 must connect these existing pieces:

```text
GenerationContext
      ↓
buildPrompt()
      ↓
AIProvider.generate(...)
      ↓
Provider response
      ↓
parseGenerationResponse(...)
      ↓
GenerationResponse
```

Do not create a second prompt builder, response schema, or provider abstraction.

---

## 3. Question Count

The current project requirement is:

```text
Question Count = 10
```

This is intentionally hard-coded.

Do not add a question-count field to the UI.

Do not add a database field for question count.

Do not make question count user-configurable in this task.

The generation use case must request/generate **10 questions** according to the existing prompt/output contract.

If the existing TASK-006 prompt builder already receives question count through its context, use the established contract rather than creating another mechanism.

---

## 4. Application Boundary

Create a clear application-level operation conceptually equivalent to:

```text
generateQuestions(...)
```

The exact name and location must follow the project's existing architecture.

The operation should orchestrate:

```text
1. Obtain/receive GenerationContext
2. Ensure question count is 10
3. Build the prompt using the existing prompt builder
4. Call the AI provider contract
5. Receive provider response
6. Parse/validate using the existing response parser
7. Return validated GenerationResponse
```

The use case should coordinate these responsibilities.

It should not contain:

- Gemini-specific SDK code
- prompt construction rules
- Zod schema definitions
- UI rendering logic
- unrelated database implementation details

---

## 5. Dependency Direction

Desired direction:

```text
Application / Use Case
        ↓
AI Provider Contract
        ↓
Gemini Adapter
        ↓
Gemini SDK
```

The use case must not depend directly on the Gemini SDK.

If Gemini is replaced later, the question-generation use case should not need to change merely because the provider changed.

---

## 6. TDD Requirement

This task MUST follow:

```text
RED
 ↓
GREEN
 ↓
REFACTOR
```

Do not implement the use case first and add tests afterward.

Tests must describe the behavior before implementation.

---

## 7. TDD — RED Phase

Create unit tests before implementation.

At minimum cover:

### Successful generation

Given valid generation context:

```text
When generateQuestions() is called
```

Then:

- the prompt builder is used
- the AI provider is called
- the expected prompt is supplied
- the provider response is parsed
- the response is validated
- a `GenerationResponse` is returned

### Exactly 10 questions

Given valid generation context:

```text
When generation starts
```

Then:

```text
question count = 10
```

must be applied according to the existing prompt/context contract.

### Prompt builder failure

If prompt construction fails:

```text
AI provider must not be called.
```

The error must follow project conventions.

### AI provider failure

Given:

```text
AI provider → failure
```

Then generation must fail safely and must not return fake or partial questions.

### Invalid AI response

Given an invalid provider response:

```text
Provider
   ↓
Invalid response
```

Then a valid `GenerationResponse` must not be returned.

Reuse the existing parser/Zod validation.

### Provider independence

Unit tests must use a mock/fake implementation of the AI provider contract, not Gemini directly.

Tests must not require:

- Gemini API key
- Internet access
- Gemini quota
- Google API availability

---

## 8. GREEN Phase

Implement the minimum production code required to make the tests pass.

Target:

```text
GenerationContext
      ↓
Prompt Builder
      ↓
AIProvider
      ↓
Response Parser
      ↓
Zod
      ↓
GenerationResponse
```

Do not implement UI behavior, persistence, or unrelated abstractions.

---

## 9. REFACTOR Phase

After tests are green:

- remove duplication
- improve naming
- keep provider-specific details isolated
- simplify unnecessary dependencies
- ensure the use case has a clear responsibility
- ensure TASK-006 contracts remain reusable
- keep tests readable

Do not refactor into a large framework.

---

## 10. Mock Provider Strategy

Unit tests must use a fake/mock implementation of the provider contract.

Conceptually:

```text
Generation Use Case
       ↓
Mock AIProvider
       ↓
Deterministic response
```

Tests must verify application behavior and orchestration, not Gemini SDK internals.

---

## 11. Real Generation Verification

After unit tests pass, perform real verification using the Gemini implementation from TASK-007.

Verify:

```text
Real GenerationContext
        ↓
Real Prompt Builder
        ↓
Real Gemini Provider
        ↓
Real Gemini Response
        ↓
Real Parser/Zod Validation
        ↓
10 Valid Questions
```

Use the existing local `.env.local` configuration.

Do not expose or commit the API key.

---

## 12. Expected Result

A successful generation operation should return a validated result equivalent to:

```text
GenerationResponse
    ├── questions: 10 items
    │
    ├── questionText
    ├── questionType
    ├── options (when applicable)
    ├── correctAnswer
    └── explanation
```

The exact fields and types must come from the existing TASK-006 response contract.

Do not invent a new response shape.

---

## 13. Question Types

Do not assume all generated questions have the same type.

The use case should return the existing `GenerationResponse` and leave question-type-specific rendering/interpretation to later layers.

Do not add new question-type business rules here.

---

## 14. Error Boundary

The use case should distinguish conceptually between:

```text
Prompt construction failure
AI provider failure
Invalid AI response
Validation failure
Unexpected application failure
```

Follow existing project conventions.

Do not expose unnecessary Gemini-specific implementation details to callers.

---

## 15. Logging

If the project already has a server-side logging convention, use it.

Useful diagnostics may include:

```text
generation started
provider selected
generation succeeded
generation failed
validation failed
```

Never log:

```text
API key
Authorization header
Sensitive credentials
```

Avoid logging the complete prompt or response unless the project's privacy/debugging strategy explicitly permits it.

---

## 16. Performance

Do not optimize prematurely.

Prioritize:

1. correctness
2. testability
3. clear boundaries
4. reliable generation

Do not introduce caching, queues, background jobs, or retry frameworks unless already required by the existing architecture.

---

## 17. Database Usage

Use existing database/context functionality only as required to obtain `GenerationContext`.

Do not change the database schema.

Do not persist generated questions yet.

The flow remains:

```text
Database
   ↓
GenerationContext
   ↓
Generation
   ↓
Response
```

---

## 18. UI Boundary

The UI must not be connected in TASK-008.

Do not modify:

- Setup page behavior
- Generate button behavior
- Question page behavior
- Question cards
- UI loading states
- UI error states

The use case must be independently testable.

TASK-009 will connect the UI.

---

## 19. Verification Checklist

### TDD

- [ ] Tests written before implementation.
- [ ] RED state observed where practical.
- [ ] Minimum implementation made tests GREEN.
- [ ] Refactoring preserved GREEN.

### Use Case

- [ ] Generation use case exists.
- [ ] Existing `GenerationContext` reused.
- [ ] Existing prompt builder reused.
- [ ] TASK-007 AI provider contract reused.
- [ ] Existing response parser/Zod validation reused.
- [ ] Exactly 10 questions requested/generated.
- [ ] No Gemini SDK dependency inside the use case.

### Error Handling

- [ ] Prompt failure handled.
- [ ] Provider failure handled.
- [ ] Invalid response handled.
- [ ] Validation failure handled.
- [ ] No fake/partial success returned.

### Testing

- [ ] Unit tests use mock/fake provider.
- [ ] Unit tests do not call Gemini.
- [ ] Unit tests do not require an API key.
- [ ] Existing test suite passes.

### Real Verification

- [ ] Real Gemini generation works.
- [ ] Real response is parsed.
- [ ] Zod validation succeeds.
- [ ] 10 valid questions are produced.

### Quality

- [ ] Lint passes.
- [ ] Type checking/build passes.
- [ ] No unrelated UI work implemented.
- [ ] No database schema changes introduced.
- [ ] No API key exposed or committed.

---

## 20. Expected Architecture After TASK-008

```text
                    MathQuestAI
                         │
                         ▼
               Question Generation
                         │
                         ▼
                GenerationContext
                         │
                         ▼
                   Prompt Builder
                         │
                         ▼
                 AIProvider Contract
                         │
                         ▼
                 Google Gemini
                         │
                         ▼
               Structured Response
                         │
                         ▼
              Existing Response Parser
                         │
                         ▼
                    Zod Validation
                         │
                         ▼
                GenerationResponse
                         │
                         ▼
                    10 Questions
```

At this point, the backend/application generation capability exists.

The UI is still separate.

---

## 21. Relationship With Other Tasks

### TASK-006

Responsible for:

```text
Context
Prompt
Output Contract
Validation
```

### TASK-007

Responsible for:

```text
AI Provider
Gemini Integration
API Key
Structured Provider Output
```

### TASK-008

Responsible for:

```text
Actual Question Generation Use Case
```

### TASK-009

Will be responsible for:

```text
Setup UI
   ↓
Generate Action
   ↓
Question Generation Use Case
```

### TASK-010

Will be responsible for:

```text
Generated Questions
   ↓
Question Page
```

Do not cross these boundaries.

---

## 22. Explicit Non-Goals

Do NOT implement:

- UI integration
- Question page integration
- Evaluation page
- Evaluation engine
- Prompt evaluation
- Prompt optimization loop
- Database persistence of generated questions
- Question history
- Authentication
- User-specific generation
- Configurable question count
- Configurable AI provider
- Configurable model selection
- Retry mechanisms
- Background generation
- Production deployment

---

## 23. Implementation Feedback

After completing the task, document:

- files created/modified
- use-case design
- dependency flow
- how the provider contract is used
- how the existing prompt builder is reused
- how the existing response parser/Zod validation is reused
- test cases created
- TDD RED/GREEN/REFACTOR results
- real Gemini verification result
- sample generated-question structure without secrets
- issues discovered
- limitations
- recommendations for TASK-009

Do not simply report "tests passed".

The feedback should make it possible to understand what Claude Code actually changed.

---

## 24. Definition of Done

TASK-008 is complete only when:

- [ ] TDD was followed.
- [ ] Question-generation use case implemented.
- [ ] Existing `GenerationContext` reused.
- [ ] Existing prompt builder reused.
- [ ] TASK-007 AI provider contract reused.
- [ ] Gemini-specific code remains outside the use case.
- [ ] Existing response parser/Zod validation reused.
- [ ] Question count is 10.
- [ ] Unit tests cover successful generation.
- [ ] Unit tests cover provider failure.
- [ ] Unit tests cover invalid response.
- [ ] Unit tests use a mocked/fake provider.
- [ ] Unit tests do not call Gemini.
- [ ] Real Gemini verification succeeds.
- [ ] 10 validated questions can be generated.
- [ ] Lint passes.
- [ ] Type checking/build passes.
- [ ] No UI integration implemented.
- [ ] No evaluation functionality implemented.
- [ ] No database persistence implemented.
- [ ] Implementation feedback documented.
- [ ] TASK-009 can consume the use case without architectural changes.
