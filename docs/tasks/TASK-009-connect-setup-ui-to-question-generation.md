# TASK-009 — Connect Setup UI to Question Generation

## Status

Planned

## Objective

Connect the existing MathQuestAI Setup UI to the question-generation use case implemented in TASK-008.

The goal is to make the first complete user-driven generation flow work:

```text
Setup Page
    ↓
User selects/configures generation context
    ↓
Generate button
    ↓
Server-side generation boundary
    ↓
Question Generation Use Case
    ↓
Google Gemini
    ↓
Validated GenerationResponse
    ↓
Question Page
```

TASK-009 is the first task that connects the browser UI to the backend/application generation capability.

---

# 1. Scope

### In scope

- Connect the existing Setup page to the generation use case.
- Create the appropriate Next.js server boundary.
- Send the required generation context from the Setup UI.
- Trigger question generation when the user clicks Generate.
- Handle loading state.
- Handle generation errors.
- Receive the validated generation response.
- Navigate to the existing Question page.
- Pass/store the generated question data using the project's agreed architecture.
- Make the Question page capable of receiving the generated result.
- Unit tests following TDD.
- Tests for the server/application boundary.
- Tests for the UI behavior that is appropriate for the project's testing setup.

### Out of scope

- Evaluation page.
- Evaluation engine.
- Evaluation scoring.
- Prompt optimization loop.
- Persisting generated questions to PostgreSQL.
- Question history.
- Authentication.
- User accounts.
- User-configurable question count.
- Multiple AI providers.
- Model selection UI.
- Production deployment.
- E2E browser automation unless a strong architectural reason is discovered.

---

# 2. Existing Work That Must Be Reused

TASK-009 builds on:

### TASK-002

Existing Figma-derived UI/pages and routes.

### TASK-006

Existing:

```text
GenerationContext
Prompt Builder
GenerationResponse
Zod validation
```

### TASK-007

Existing:

```text
AI Provider Contract
Google Gemini Provider
Secure API-key configuration
```

### TASK-008

Existing:

```text
Question Generation Use Case
```

Do not recreate these components.

The UI should consume the existing generation capability rather than implementing another generation mechanism.

---

# 3. Target User Flow

The user flow should become:

```text
1. User opens Setup page.
2. User selects/provides the available generation context.
3. User clicks Generate.
4. UI validates required input.
5. UI sends the generation request to the Next.js server boundary.
6. Server boundary invokes the question-generation use case.
7. Question-generation use case calls Gemini.
8. Validated GenerationResponse is returned.
9. UI receives the generated result.
10. UI navigates to the Question page.
11. Question page displays the generated questions.
```

The exact fields must follow the existing Setup page and `GenerationContext` contract.

Do not invent duplicate fields.

---

# 4. Question Count

Question count remains:

```text
10
```

It is hard-coded for now.

The Setup UI must NOT add:

```text
Question Count
```

as a user-editable field.

The server/application generation flow should continue using the existing TASK-008 behavior.

---

# 5. Server Boundary

The browser must NOT directly call Gemini.

The target architecture is:

```text
Browser
   ↓
Next.js Server Boundary
   ↓
Question Generation Use Case
   ↓
AIProvider
   ↓
Gemini
```

The server boundary may use the Next.js mechanism already established by the project architecture.

Claude Code must inspect the existing project before choosing between:

- Server Action
- Route Handler
- another appropriate Next.js server-side mechanism

Choose the simplest mechanism that fits the current architecture.

Do not introduce both Server Actions and Route Handlers unless there is a concrete reason.

---

# 6. API Key Security

The browser must never receive:

```text
Gemini API key
```

The browser must never directly import the Gemini SDK.

The API key must remain:

```text
.env.local
       ↓
Server-side code
       ↓
Gemini
```

Verify that the implementation does not accidentally expose environment variables through:

```text
NEXT_PUBLIC_*
```

or serialized client responses.

---

# 7. TDD Requirement

TASK-009 MUST follow:

```text
RED
 ↓
GREEN
 ↓
REFACTOR
```

Tests must be written before implementation.

Do not implement the UI-to-generation flow first and add tests afterward.

---

# 8. TDD — Tests Before Implementation

Tests should be divided according to responsibility.

Do not make every test an end-to-end test.

## 8.1 Server Boundary Tests

Test that the server boundary:

### Valid request

Given valid generation input:

```text
Request
   ↓
Server boundary
```

Then:

```text
Generation use case is called with the expected context.
```

### Successful generation

Given a successful use-case response:

```text
GenerationResponse
```

Then the server boundary returns the expected safe response.

### Invalid input

Given invalid/missing required context:

```text
Request
   ↓
Server boundary
```

Then:

```text
Generation use case must not be called.
```

### Generation failure

Given a generation failure:

```text
Generation use case
       ↓
error
```

Then the server boundary returns a safe application-level error.

Do not expose:

- API key
- Gemini SDK internals
- stack traces
- unnecessary provider details

---

# 9. Setup UI Tests

Test the Setup page behavior that matters for this task.

At minimum:

### Generate button

Given valid input:

```text
User clicks Generate
```

Then:

```text
generation request is triggered.
```

### Loading state

While generation is running:

```text
Generate button/action
       ↓
loading
```

The UI should prevent accidental duplicate generation requests.

The exact UX should follow the existing Figma design.

### Error state

Given a generation failure:

```text
Generation fails
```

Then the user receives a clear error state/message.

The Setup page should remain usable so the user can try again.

### Successful generation

Given:

```text
GenerationResponse
```

Then:

```text
Question page navigation occurs.
```

---

# 10. TDD — RED Phase

Before implementing:

1. Inspect the existing Setup page.
2. Inspect existing routes.
3. Inspect existing Question page.
4. Inspect TASK-008 generation use case.
5. Identify the existing testing framework and conventions.
6. Write the tests against the desired behavior.
7. Run tests and confirm the expected failures.

Do not rewrite the existing testing setup unless it is genuinely broken.

---

# 11. GREEN Phase

Implement the minimum code required to make the tests pass.

The implementation should establish:

```text
Setup UI
   ↓
Server Boundary
   ↓
Generation Use Case
```

and:

```text
GenerationResponse
   ↓
Question Page
```

Do not add evaluation functionality.

---

# 12. REFACTOR Phase

After tests pass:

- remove unnecessary client/server coupling
- improve naming
- simplify data flow
- avoid duplicated validation
- keep server-only code server-side
- keep UI responsibilities in UI components
- keep generation responsibilities in the application/use-case layer
- preserve the existing architecture

Do not introduce unnecessary state-management libraries.

---

# 13. Generation Context

The Setup UI must send the context required by the existing `GenerationContext`.

The exact shape must come from the existing implementation.

Conceptually:

```text
Setup Form
    ↓
GenerationRequest
    ↓
Server Boundary
    ↓
GenerationContext
    ↓
generateQuestions()
```

Do not create a second context model unless the current architecture genuinely requires a transport DTO.

If a transport DTO is required, clearly separate:

```text
Request DTO
    ↓
GenerationContext
```

rather than allowing UI-specific objects to leak into the domain/application layer.

---

# 14. Client vs Server Responsibility

### Client responsibilities

The client should handle:

- user input
- form state
- basic client-side validation where appropriate
- Generate action
- loading state
- displaying errors
- navigation
- displaying generated data

### Server/application responsibilities

The server should handle:

- trusted generation context
- calling the generation use case
- AI provider communication
- API-key access
- provider errors
- response validation
- returning a safe response

Do not move Gemini logic into client components.

---

# 15. Question Page Data Flow

The Question page must display the actual generated questions rather than static/mock questions when reached through the new generation flow.

Target:

```text
GenerationResponse
       ↓
Question Page
       ↓
Question components
```

The exact transport/storage mechanism must be chosen after inspecting the existing application architecture.

Possible approaches include:

```text
URL-safe identifier + server retrieval
```

or:

```text
client-side state/store
```

or another architecture already established in the project.

Do NOT put the entire generated question payload into the URL unless there is a strong reason.

Do NOT persist generated questions to PostgreSQL just to solve navigation.

The implementation should choose the simplest safe mechanism that works with the current application architecture.

Document the decision in task feedback.

---

# 16. Question Page Contract

The Question page must consume the existing `GenerationResponse` contract.

The UI should not assume a completely different data structure.

The rendering flow should conceptually be:

```text
GenerationResponse
      ↓
questions[]
      ↓
Question Card / Question Component
```

The existing question-type information must be respected.

For example, if a question is:

```text
Multiple Choice
```

the UI should render the appropriate existing UI.

If the existing Figma design already supports different question types, use that design rather than creating a new visual system.

---

# 17. Output Format Requirement

The generated data must remain structured.

The UI should receive data conceptually equivalent to:

```json
{
  "questions": [
    {
      "questionText": "...",
      "questionType": "...",
      "options": [],
      "correctAnswer": "...",
      "explanation": "..."
    }
  ]
}
```

The exact property names and optional fields MUST come from the existing `GenerationResponse` contract.

Do not invent a second response format.

The purpose is:

```text
AI structured output
       ↓
validated GenerationResponse
       ↓
UI binding
```

---

# 18. Loading UX

When generation starts:

```text
Generate
   ↓
Loading
```

The UI should:

- clearly indicate generation is running
- prevent accidental duplicate requests
- preserve the user's entered context
- not navigate prematurely

When generation finishes:

```text
Loading
   ↓
Success
   ↓
Question Page
```

When it fails:

```text
Loading
   ↓
Error
   ↓
Setup Page remains available
```

Follow the existing Figma design as much as possible.

---

# 19. Error UX

The user should receive a meaningful message.

Avoid showing technical details such as:

```text
TypeError: ...
Gemini SDK exception ...
HTTP 429 ...
```

unless the project already has a deliberate developer-facing error mechanism.

The application should log technical details server-side according to existing conventions.

The client should receive a safe, understandable error.

---

# 20. Duplicate Requests

The UI must protect against accidental repeated clicks.

During an active generation request:

```text
Generate button = disabled/loading
```

A second request should not be triggered by repeated clicks.

Do not implement a complex request queue.

A simple UI-level guard is sufficient for this task.

---

# 21. Testing Strategy

Use the project's existing unit/component testing setup.

Prefer:

```text
Unit tests
+
Component tests where appropriate
```

over E2E for this task.

### Why E2E is not required yet

The important logic can be tested at lower levels:

```text
Server boundary → unit test
Generation use case → unit test
Setup UI → component test
Question rendering → component test
```

A full browser test would mainly verify wiring that these tests already cover.

If Claude Code discovers a specific interaction that cannot be safely verified without an E2E test, document the reason before adding one.

Do not add E2E simply because it is available.

---

# 22. Test Isolation

Tests must not:

- call the real Gemini API
- require the developer's API key
- depend on PostgreSQL being available unless the existing architecture makes database access unavoidable
- depend on network availability

Mock/fake the generation boundary appropriately.

Real Gemini verification remains a manual/local verification step, not a normal unit test.

---

# 23. Database

TASK-009 must NOT change the database schema.

Do not create tables for:

```text
GeneratedQuestions
QuestionAttempts
GenerationHistory
```

yet.

The generated result is temporary for this phase.

Database persistence can be considered later when the product flow is clearer.

---

# 24. Navigation

After successful generation:

```text
Setup
  ↓
Question
```

Use the existing Next.js routing conventions.

Do not create duplicate routes.

Before modifying routes, inspect the routes created by TASK-002.

---

# 25. Existing Figma UI

The UI implementation must respect the existing Figma-derived pages created in TASK-002.

Do not redesign the page.

Do not introduce unrelated visual changes.

If the existing Figma UI contains placeholders/mock data, replace only the relevant data source with the real generation result.

Keep the existing layout and styling unless a change is required for functional behavior.

---

# 26. Verification Checklist

## TDD

- [ ] Tests written before implementation.
- [ ] RED state observed where practical.
- [ ] Minimum implementation made tests GREEN.
- [ ] Refactoring preserved GREEN.

## Setup Page

- [ ] Existing Setup page reused.
- [ ] Existing form/context fields reused.
- [ ] Generate action connected.
- [ ] Loading state implemented.
- [ ] Duplicate clicks prevented.
- [ ] Error state implemented.

## Server

- [ ] Server boundary implemented.
- [ ] Gemini remains server-side.
- [ ] API key remains server-side.
- [ ] Generation use case reused.
- [ ] No Gemini SDK imported into client code.

## Generation

- [ ] TASK-008 use case is called.
- [ ] Question count remains 10.
- [ ] Existing GenerationResponse is reused.
- [ ] No second generation implementation created.

## Question Page

- [ ] Generated data reaches Question page.
- [ ] Static/mock question data is not used for the generated flow.
- [ ] Existing question components are reused.
- [ ] Question types are respected.
- [ ] Correct structured data is bound to the UI.

## Tests

- [ ] Server boundary tests pass.
- [ ] Setup component tests pass.
- [ ] Relevant Question page/component tests pass.
- [ ] Tests do not call Gemini.
- [ ] Tests do not require the real API key.
- [ ] Existing test suite passes.

## Quality

- [ ] Lint passes.
- [ ] Type checking/build passes.
- [ ] No database schema changes.
- [ ] No evaluation functionality.
- [ ] No API key exposed.
- [ ] No unrelated UI redesign.

---

# 27. Expected Architecture After TASK-009

```text
                    Browser
                       │
                       ▼
                 Setup Page
                       │
                  Generate
                       │
                       ▼
             Next.js Server Boundary
                       │
                       ▼
          Question Generation Use Case
                       │
                       ▼
                AIProvider Contract
                       │
                       ▼
                 Gemini Provider
                       │
                       ▼
              GenerationResponse
                       │
                       ▼
                Question Page
                       │
                       ▼
             Question Components
```

The browser should never directly communicate with Gemini.

---

# 28. Relationship With Previous Tasks

### TASK-006

Provides:

```text
GenerationContext
Prompt Builder
GenerationResponse
Validation
```

### TASK-007

Provides:

```text
Gemini Provider
AI Provider Contract
Secure API configuration
```

### TASK-008

Provides:

```text
Question Generation Use Case
```

### TASK-009

Provides:

```text
Setup UI → Generation Use Case → Question Page
```

---

# 29. Future Work

After TASK-009, the main generation flow should work:

```text
User
 ↓
Setup
 ↓
Generate
 ↓
Gemini
 ↓
10 Questions
 ↓
Question Page
```

Potential later tasks can address:

- Question interaction/answer submission
- Answer checking
- Question navigation
- Generation history
- Persistence
- Evaluation page
- Evaluation metrics
- Prompt/context experiments
- AI output quality evaluation
- Retry/resilience
- Multiple providers

These are intentionally not part of TASK-009.

---

# 30. Implementation Feedback

After completing TASK-009, document:

- files created/modified
- server boundary chosen and why
- client/server data flow
- how `GenerationContext` is transported
- how `GenerationResponse` reaches the Question page
- how generated data is stored/transferred between routes
- tests created
- TDD RED/GREEN/REFACTOR results
- loading/error UX implemented
- any architectural problems discovered
- any deviations from TASK-009
- recommendations for the next task

Do not simply report "tests passed".

---

# 31. Definition of Done

TASK-009 is complete only when:

- [ ] TDD was followed.
- [ ] Existing Setup UI is connected to generation.
- [ ] A proper Next.js server boundary exists.
- [ ] Gemini remains completely server-side.
- [ ] TASK-008 generation use case is reused.
- [ ] Question count remains hard-coded to 10.
- [ ] Generate action works.
- [ ] Loading state works.
- [ ] Duplicate generation clicks are prevented.
- [ ] Generation errors are handled safely.
- [ ] Successful generation navigates to the Question page.
- [ ] Question page receives actual generated data.
- [ ] Question page no longer relies on mock data for this flow.
- [ ] Existing question UI is reused.
- [ ] Structured `GenerationResponse` is correctly bound to the UI.
- [ ] Unit/component tests were written before implementation.
- [ ] Relevant tests pass.
- [ ] Tests do not call Gemini.
- [ ] Real API key is never exposed to the browser.
- [ ] Lint passes.
- [ ] Type checking/build passes.
- [ ] No database schema changes.
- [ ] No evaluation functionality.
- [ ] No unrelated UI redesign.
- [ ] Implementation feedback is documented.
