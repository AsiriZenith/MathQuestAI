# TASK-007 — AI Provider Integration (Google Gemini)

## Status

Planned

## Objective

Introduce the first real AI provider integration for MathQuestAI using **Google Gemini**.

The implementation must establish a small, provider-independent boundary so that the question-generation business logic does not become tightly coupled to Gemini.

Target:

```text
Question Generation
        ↓
AI Provider Interface
        ↓
Google Gemini
        ↓
Structured AI Response
```

Google Gemini is the first provider implementation. A future AI provider/model must be replaceable without rewriting the question-generation business logic.

---

## 1. Scope

### In scope

- Google Gemini API integration
- Server-side AI provider implementation
- Provider-independent interface/contract
- Environment-based API-key configuration
- `.env.local` support
- `.env.example` support
- Secure API-key handling
- README local setup instructions
- Gemini structured-output configuration
- Unit tests using a mocked provider/client
- Real Gemini API verification
- TDD workflow: RED → GREEN → REFACTOR

### Out of scope

- Question-generation business use case
- Connecting the Setup page to AI generation
- Replacing mock questions on the Question page
- Evaluation page
- Evaluation engine
- Prompt/context redesign
- Question-count UI
- Database schema changes
- New database functionality
- Implementing another AI provider

TASK-007 establishes the AI provider boundary. TASK-008 will use this boundary to implement the actual question-generation use case.

---

## 2. Current Project Context

MathQuestAI already has:

```text
PostgreSQL
    ↓
Prisma
    ↓
GenerationContext
    ↓
Prompt Builder
    ↓
Structured GenerationResponse
    ↓
Zod validation
```

TASK-006 has already established the prompt/context and response contract.

Do not recreate or redesign those pieces.

The new flow introduced by this task is:

```text
Existing Prompt
      ↓
AI Provider Interface
      ↓
Google Gemini
      ↓
Structured Provider Response
```

---

## 3. Provider Independence

The application must not depend directly on Gemini throughout the codebase.

Avoid:

```text
React Component
    ↓
Gemini SDK
```

or spreading Gemini-specific calls through the question-generation logic.

Prefer:

```text
Question Generation
       ↓
AI Provider Contract
       ↓
Google Gemini Adapter
       ↓
Gemini SDK
```

The exact folder/file names must follow the existing project architecture. Do not introduce unnecessary abstractions or a large dependency-injection framework solely for this task.

The provider abstraction should be **small and practical**.

Gemini-specific request/response types should remain inside the Gemini implementation.

---

## 4. AI Provider

Use:

```text
Provider: Google
Model family: Gemini
```

The exact current Gemini model identifier must be selected using Google's current API documentation and the model available to the configured API key.

Do not invent or use an obsolete model identifier.

Keep the model configuration centralized rather than spreading the model name throughout the codebase.

---

## 5. API Key Configuration

Use:

```env
MATHQUESTAI_GEMINI_API_KEY_V1=your-api-key-here
```

### Local environment

Store the real key only in:

```text
.env.local
```

Example:

```env
MATHQUESTAI_GEMINI_API_KEY_V1=your-api-key-here
```

### Example environment file

Create/update:

```text
.env.example
```

with:

```env
MATHQUESTAI_GEMINI_API_KEY_V1=
```

The example file must contain **no real secret**.

---

## 6. Secret-Safety Requirements

Before implementing the real API call, verify:

- `.env.local` is ignored by Git.
- No real API key exists in tracked files.
- No API key is present in source code.
- No API key is placed in `CLAUDE.md`.
- No API key is placed in task documentation.
- No API key is placed in `README.md`.
- No API key is logged.
- The API key is accessed only on the server side.

Do not commit the actual API key.

Do not use a `NEXT_PUBLIC_` prefix for the API key.

---

## 7. README Update

Update `README.md` with a concise **Local AI Configuration** section.

It should explain that MathQuestAI uses Google Gemini for AI-powered question generation.

Include simple guidance such as:

```text
## Local AI Configuration

MathQuestAI uses Google Gemini for AI-powered question generation.

### 1. Get a Gemini API key

Create an API key using Google AI Studio:

https://aistudio.google.com/

### 2. Configure the local environment

Create `.env.local` in the project root and add:

MATHQUESTAI_GEMINI_API_KEY_V1=your-api-key-here

Never commit `.env.local` or expose the API key publicly.

### 3. Run the application

Start MathQuestAI using the normal development command.
```

Use the project's existing README style.

Do not add the actual API key.

---

## 8. Structured Output

Gemini must be configured to return structured output suitable for the existing MathQuestAI generation contract.

Target:

```text
Prompt
   ↓
Gemini structured response
   ↓
Existing application parser
   ↓
Zod validation
   ↓
Trusted GenerationResponse
```

Do not create a second competing schema.

Do not duplicate the Zod response contract created in TASK-006.

The final implementation should follow the actual interfaces and parser already present in the repository.

---

## 9. TDD Requirement

This task must follow:

```text
RED
 ↓
GREEN
 ↓
REFACTOR
```

Do not implement the provider first and add tests afterward.

### RED

Write tests before implementation.

At minimum cover:

#### Configuration

- Missing API-key configuration is handled safely.
- Required configuration is detected.

#### Request behavior

Given a valid prompt:

- expected Gemini request is constructed.
- configured model is used.
- structured output configuration is applied.

#### Successful response

Given a successful mocked Gemini response:

- expected response/data is returned.

#### Provider failure

Given a provider/API failure:

- failure is handled according to project conventions.
- the API key is never exposed.

#### Invalid provider response

If Gemini returns an unexpected response shape:

- the provider does not silently produce incorrect application data.

Use the actual project contract rather than inventing unnecessary behavior.

---

## 10. Unit Tests Must Not Depend on Gemini

Normal unit tests must not make real Gemini API calls.

Use a mock/fake provider client or mock the Gemini SDK boundary.

Tests must be:

- deterministic
- fast
- repeatable
- independent of network availability
- independent of API quota
- independent of the developer's real API key

Conceptually:

```text
Unit Test
    ↓
Mock Gemini
    ↓
Deterministic response
```

Never put a real API key into automated test files.

---

## 11. Real Gemini API Verification

This task explicitly requires one real API verification because we need to prove the application can communicate with Gemini successfully.

This is separate from normal unit testing.

Use the developer's locally configured:

```text
.env.local
```

and real API key.

Verify:

1. API key is loaded correctly.
2. Gemini can be reached.
3. Selected model is accepted.
4. Request is accepted.
5. Structured output configuration works.
6. Real response is received.
7. Response is compatible with the existing MathQuestAI response pipeline.

Do not print or commit the API key.

---

## 12. Question Count

For the current project:

```text
Question count = 10
```

This is intentionally **hard-coded for now**.

TASK-007 must not add a question-count field to the Setup page.

The actual generation use case will use the hard-coded value when TASK-008 is implemented.

---

## 13. Error Handling

Consider provider-level failures such as:

```text
Missing API key
Invalid API key
Unauthorized request
Rate limit
Network failure
Timeout
Provider/server error
Invalid provider response
```

Do not expose raw provider internals or secrets to the user.

Detailed user-facing generation error handling can be expanded in TASK-011.

---

## 14. Server Boundary

The Gemini API key must remain server-side.

Target:

```text
Browser
   ↓
Next.js server boundary
   ↓
AI Provider
   ↓
Gemini
```

Do not call Gemini directly from React Client Components.

The exact Next.js server mechanism should follow the existing architecture and be suitable for TASK-008.

---

## 15. Dependency Management

Use the official/recommended Google Gemini SDK/API approach supported by the current Gemini documentation.

Before adding a package:

- verify whether the project already has a suitable dependency.
- avoid duplicate SDKs.
- prefer the official/recommended package.
- do not add unrelated AI frameworks.
- do not add a large abstraction library just to support one provider.

Document the dependency decision in the implementation feedback.

---

## 16. Verification Checklist

### Configuration

- [ ] `.env.local` contains the local API key.
- [ ] `.env.local` is ignored by Git.
- [ ] `.env.example` contains only the variable name.
- [ ] No secret is committed.
- [ ] README explains local setup.

### Architecture

- [ ] AI provider boundary exists.
- [ ] Gemini-specific implementation is isolated.
- [ ] Question-generation logic does not directly depend on Gemini-specific details.
- [ ] No unnecessary abstraction was introduced.

### Gemini

- [ ] Current supported Gemini model selected.
- [ ] API request works.
- [ ] Structured output is configured.
- [ ] Real API verification succeeds.

### Tests

- [ ] Tests were written before implementation.
- [ ] RED state was observed where practical.
- [ ] Implementation reaches GREEN.
- [ ] Refactoring preserves GREEN.
- [ ] Unit tests do not call the real Gemini API.
- [ ] Existing test suite passes.

### Build

- [ ] Lint passes.
- [ ] Type checking/build passes.
- [ ] No unrelated functionality was changed.

---

## 17. Expected Architecture After TASK-007

```text
Existing:
Database
   ↓
Prisma
   ↓
GenerationContext
   ↓
Prompt Builder
   ↓
Generation Prompt

New:
Generation Prompt
   ↓
AI Provider Contract
   ↓
Google Gemini Adapter
   ↓
Gemini API
   ↓
Structured Response
```

TASK-008 will connect these pieces into the actual:

```text
generateQuestions()
```

use case.

---

## 18. Explicit Non-Goals

Do NOT implement:

- Setup → Generate UI flow
- Question page integration
- Evaluation page
- Evaluation engine
- Prompt evaluation
- Prompt optimization loop
- Multiple AI providers
- User-configurable model selection
- User-configurable question count
- Database schema changes
- Question persistence
- Authentication
- Production deployment

These belong to later work.

---

## 19. Final Deliverables

TASK-007 should produce:

```text
AI provider contract
Gemini provider implementation
Provider unit tests
.env.example update
README.md local Gemini setup documentation
Secure environment configuration
Real Gemini API verification
```

Implementation feedback must document:

- selected Gemini model
- SDK/package used
- why it was selected
- provider interface
- test strategy
- real API verification result
- limitations discovered
- follow-up work required for TASK-008

---

## 20. Completion Boundary

When TASK-007 is complete:

```text
Prompt
  ↓
AI Provider
  ↓
Gemini
  ↓
Structured response
```

must work independently.

However:

```text
Setup Page
   ↓
Generate
   ↓
Gemini
   ↓
Question Page
```

does **not** need to work yet.

That complete application flow belongs to TASK-008 and subsequent tasks.

---

## 21. Definition of Done

- [ ] TDD process followed.
- [ ] Provider contract defined.
- [ ] Gemini implementation completed.
- [ ] Gemini API key loaded securely from `.env.local`.
- [ ] `.env.example` updated.
- [ ] `.gitignore` verified.
- [ ] README updated with local API-key setup guidance.
- [ ] Structured output configured.
- [ ] Unit tests use mocks/fakes and do not call Gemini.
- [ ] Real Gemini API call successfully verified locally.
- [ ] Existing tests pass.
- [ ] Lint passes.
- [ ] Build/type checking passes.
- [ ] No real API key was committed.
- [ ] No unrelated application functionality was implemented.
- [ ] Implementation feedback is documented.
- [ ] TASK-008 is not implemented as part of this task.
