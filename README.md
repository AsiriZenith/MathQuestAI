# MathQuestAI

MathQuestAI is an AI-powered mathematics question generation application and an AI/context-engineering research project.

The main goal is not simply to generate mathematics questions with an LLM. The project is designed to investigate how the **quality of generated questions changes when the context and prompt supplied to the AI are improved**.

## Core Research Loop

```text
Educational Context
        ↓
Prompt / Context Design
        ↓
AI Question Generation
        ↓
Generated Questions
        ↓
Evaluation
        ↓
Identify Problems
        ↓
Improve Context / Prompt
        ↓
Generate Again
        ↓
Evaluate Again
        ↓
Repeat
```

The project uses **Next.js + PostgreSQL** and follows a **TDD-oriented development workflow** with **Claude Code** as the primary development assistant.

---

## 1. Project Purpose

MathQuestAI explores:

> **How can better context and prompting produce better educational mathematics questions?**

Instead of putting all educational knowledge into one large prompt, the application stores structured educational information in PostgreSQL and dynamically builds the generation context.

```text
User Selections
      ↓
Educational Database
      ↓
Dynamic Context
      ↓
Prompt Builder
      ↓
AI Model
      ↓
Structured Questions
      ↓
Question Page
      ↓
Evaluation
```

The project combines:

- Structured educational data
- Question patterns
- Difficulty definitions
- Reference questions
- Generation prompts
- AI-generated questions
- Human evaluation
- Iterative prompt/context improvement

---

## 2. Technology Stack

### Application

- Next.js
- React
- TypeScript

### Database

- PostgreSQL
- Prisma

### Development

- Claude Code
- Git
- TDD

### AI

The application integrates with an AI provider through a server-side provider boundary.

Provider-specific implementation should remain isolated so the rest of the application is not tightly coupled to one AI vendor.

---

## 3. Why Next.js?

The application needs:

```text
Browser UI
+
Server-side logic
+
Database access
+
AI API integration
```

Next.js provides a practical full-stack foundation while allowing server-only functionality to remain separate from client-side code.

This is especially important because AI provider API keys must never be exposed to the browser.

```text
Browser
   ↓
Next.js
   ↓
Application / Server Logic
   ↓
PostgreSQL
   ↓
AI Provider
```

---

## 4. Product Concept

The user selects educational criteria and requests mathematics questions.

The educational structure is:

```text
Subject
   ↓
Subtopic
   ↓
Question Pattern
   ↓
Difficulty
   ↓
Question Type
```

Example:

```text
Subject:
Mathematics

Subtopic:
Simplify / Calculate

Question Pattern:
Combine Like Terms

Difficulty:
Easy

Question Type:
Multiple Choice
```

The application loads the relevant educational context and uses it to construct the AI generation prompt.

---

## 5. Difficulty Benchmark

The project does not attempt to define a universal mathematical difficulty formula.

Difficulty is defined specifically for this project in a simple, human-friendly way.

| Level | Definition |
|---|---|
| 🟢 **Easy** | Direct application of the Question Pattern. Usually requires one main step and a familiar structure. |
| 🟡 **Medium** | Still directly related to the Question Pattern, but requires additional processing or 2–3 connected steps. |
| 🔴 **Hard** | Requires multiple connected steps, more complex arrangement, or combining a few related complexity factors. |

These definitions are intended primarily for human understanding and question-generation guidance.

The project does not currently use an automatic universal formula to classify question difficulty.

---

## 6. Question Patterns

Question Patterns describe recognizable ways of asking questions within an educational subtopic.

The project has been defining and reviewing patterns individually rather than treating every visually different example as a completely separate question type.

Examples currently established include:

- Combine Like Terms
- Apply Distributive Property
- Simplify Algebraic Fractions
- Simplify Multi-Operation Expressions
- Simplify and Retain Variables

Question Patterns are stored in the database and form part of the generation context.

---

## 7. Reference Questions

Reference Questions are example questions stored in PostgreSQL.

They are associated with a Question Pattern and difficulty level.

Their purpose is to provide the AI with examples of the expected:

- Structure
- Complexity
- Mathematical pattern
- Question style

They are **examples**, not questions that should be copied.

```text
Question Pattern
       +
Difficulty
       ↓
Reference Questions
       ↓
Generation Context
       ↓
AI
```

---

## 8. Generation Prompts

The project uses database-driven generation prompts for educational contexts.

The application combines:

```text
Common Instructions
        +
Educational Context
        +
Difficulty Guidance
        +
Question Type
        +
Reference Questions
        +
Generation Prompt
        ↓
Final AI Prompt
```

This separation is important because prompt/context engineering is one of the main research goals.

---

## 9. AI Output Contract

The AI response must be structured.

The application should not depend on parsing free-form natural-language output.

The intended response is JSON similar to:

```json
{
  "questions": [
    {
      "questionNumber": 1,
      "questionText": "Simplify 3x + 5x - 2.",
      "questionType": "multiple_choice",
      "options": [
        { "id": "A", "text": "8x - 2" },
        { "id": "B", "text": "8x + 2" },
        { "id": "C", "text": "6x - 2" },
        { "id": "D", "text": "3x + 3" }
      ],
      "correctAnswer": "A",
      "explanation": "3x and 5x are like terms, so their coefficients are combined."
    }
  ]
}
```

The exact schema is defined and refined through the project documentation and implementation.

The important principle is:

> The AI response must be machine-readable so the application can validate it and bind it to the Question page.

---

## 10. Question Page

The Question page consumes validated question data.

```text
AI Response
    ↓
Validation
    ↓
Question DTO
    ↓
Question Page
```

The UI should not need to parse raw AI-generated text.

---

## 11. Evaluation

Evaluation is a major part of the research purpose.

The project is not only interested in:

> "Did the AI generate a question?"

It is interested in:

> "Did the AI generate a good question given the supplied context?"

The Evaluation page will eventually allow generated questions to be reviewed.

Evaluation helps identify weaknesses in:

- Prompt design
- Educational context
- Reference questions
- Difficulty guidance
- Question pattern instructions

Generation and evaluation are intentionally separate concerns.

---

## 12. Research Loop

The central research loop is:

```text
             ┌─────────────────────┐
             │ Context / Prompt V1 │
             └──────────┬──────────┘
                        ↓
                   AI Generation
                        ↓
                Generated Questions
                        ↓
                    Evaluation
                        ↓
                 Identify Problems
                        ↓
              Improve Context/Prompt
                        ↓
             ┌─────────────────────┐
             │ Context / Prompt V2 │
             └──────────┬──────────┘
                        ↓
                   AI Generation
                        ↓
                    Evaluation
                        ↓
                       ...
```

The project should make prompts and generated results easy to inspect.

---

## 13. Development Methodology

The project follows a **Test-Driven Development (TDD)** approach wherever practical.

```text
Write Test
    ↓
Implement
    ↓
Run Tests
    ↓
Refactor
    ↓
Verify
```

Project initialization may contain work that has little meaningful test coverage. After the foundation is established, application behavior should generally be developed with tests alongside implementation.

---

## 14. Testing Strategy

The project maintains a dedicated test structure:

```text
tests/
├── unit/
│   ├── prompt/
│   ├── generation/
│   └── validation/
│
├── integration/
│   ├── database/
│   └── generation/
│
└── fixtures/
    ├── generation/
    └── reference-questions/
```

Unit tests should be:

- Fast
- Deterministic
- Independent of external AI services

Normal automated tests should mock the AI provider:

```text
Test
 ↓
QuestionGenerationService
 ↓
Mock AI Provider
 ↓
Known JSON
 ↓
Validation
```

Real AI calls are controlled manual/research experiments, not normal unit tests.

---

## 15. Claude Code Workflow

Claude Code is the primary development assistant.

Claude Code should first understand the project context before implementing tasks.

Important project context is stored in:

```text
CLAUDE.md
docs/
docs/tasks/
```

The intended workflow is:

```text
Project Documentation
        ↓
Task
        ↓
Claude Code
        ↓
Implementation
        ↓
Tests
        ↓
Review
        ↓
Task Completion
```

Claude Code should not automatically start future tasks after completing the current task. The developer reviews the result and decides what comes next.

---

## 16. Documentation Structure

The `docs` folder contains persistent project knowledge.

Important documents include:

```text
docs/
├── project.md
├── product.md
├── requirements.md
├── architecture.md
├── database.md
└── ai-generation.md
```

These documents prevent important decisions and project context from existing only inside conversations.

---

## 17. Task Management

Tasks are maintained separately:

```text
docs/tasks/
├── README.md
├── backlog/
├── in-progress/
└── completed/
```

A task should contain enough information for Claude Code to understand:

- Objective
- Context
- Scope
- Requirements
- Constraints
- TDD expectations
- Acceptance criteria
- Completion reporting

Tasks are created over time as the project progresses.

---

## 18. Current Development Path

The planned implementation path is:

```text
Database
   ↓
Project Foundation
   ↓
UI / Figma Recreation
   ↓
Dynamic Educational Data Loading
   ↓
Prompt Context Construction
   ↓
AI Provider Integration
   ↓
Question Generation
   ↓
Question Page
   ↓
Evaluation
   ↓
Research Experiments
```

The task system should be treated as the authoritative source for the exact current implementation status.

---

## 19. Existing Figma UI

A React project generated from the Figma design already exists locally.

It contains the pages required by the application.

The target Next.js application is developed separately.

```text
Existing Figma React Project
        ↓
Reference UI / Design
        ↓
Next.js MathQuestAI
        ↓
Recreate pages and routes
```

The existing project is a design/reference source rather than something to blindly copy into the final architecture.

---

## 20. Architecture Principles

### Separation of concerns

Each layer should have one clear responsibility.

### Explicit data flow

Prefer:

```text
Request
 ↓
Context
 ↓
Prompt
 ↓
AI
 ↓
Validation
 ↓
UI
```

over hidden behavior.

### Server-side secrets

AI credentials and database credentials must never be exposed to the browser.

### Deterministic application logic

Prompt construction and validation should be deterministic wherever possible.

### AI at the boundary

AI-specific behavior should be isolated behind an application boundary.

### Research observability

Make it possible to inspect:

```text
Input
Context
Prompt
Model
Response
Evaluation
```

### Avoid premature complexity

Do not introduce queues, caching, microservices, event buses, or other infrastructure unless the research/application actually requires them.

---

## 21. Current Research Principle

A key principle is:

> **Do not assume that a more complicated prompt produces better questions. Measure it.**

Prefer controlled experiments.

For example:

```text
Experiment A
Prompt + 3 reference questions
        ↓
Generate 5 questions
        ↓
Evaluate

Experiment B
Prompt + 5 reference questions
        ↓
Generate 5 questions
        ↓
Evaluate

Compare
```

The evaluation should tell us whether the change actually helped.

---

## 22. What This Project Is Not

MathQuestAI is not currently intended to be:

- A generic chatbot
- A general-purpose tutoring platform
- A universal mathematical difficulty classifier
- A benchmark for comparing LLM intelligence
- A production-scale education platform

The primary focus is:

```text
Educational Context
        +
Prompt Engineering
        +
AI Question Generation
        +
Human Evaluation
        +
Iterative Improvement
```

---

## 23. Getting Started

The project is a Next.js application.

The development environment requires:

```text
Node.js
npm
PostgreSQL
```

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

The application is expected to be available at:

```text
http://localhost:3000
```

Always confirm the current scripts against `package.json`.

---

## 24. Environment Configuration

Environment variables should be used for sensitive configuration.

Typical categories include:

```text
DATABASE_URL
AI provider API key
AI model
```

Do not commit secrets.

Use the project's environment configuration conventions and ensure local environment files are ignored by Git.

---

## 25. Local AI Configuration

MathQuestAI uses Google Gemini for AI-powered question generation.

### 1. Get a Gemini API key

Create an API key using Google AI Studio:

https://aistudio.google.com/

### 2. Configure the local environment

Create `.env.local` in the project root and add:

```env
MATHQUESTAI_GEMINI_API_KEY_V1=your-api-key-here
```

Never commit `.env.local` or expose the API key publicly.

### 3. Run the application

Start MathQuestAI using the normal development command (`npm run dev`).

---

## 26. High-Level Repository Structure

The project is expected to evolve toward:

```text
MathQuestAI/
│
├── app/
├── components/
├── lib/
├── prisma/
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
│
├── docs/
│
├── docs/tasks/
│   ├── backlog/
│   ├── in-progress/
│   └── completed/
│
├── CLAUDE.md
├── README.md
├── package.json
└── ...
```

The actual implementation may evolve as the project develops.

---

## 27. Definition of Success

The project is successful if it can demonstrate a repeatable process where:

1. A user selects educational criteria.
2. The application loads relevant structured educational context.
3. The application constructs a clear generation prompt.
4. The AI generates structured questions.
5. The application validates the response.
6. The questions are displayed through the Question page.
7. Humans evaluate the generated questions.
8. Problems are identified.
9. Prompt/context changes are documented.
10. The experiment is repeated.
11. Results can be compared.

The goal is not merely:

> "We generated questions using AI."

The goal is:

> **"We can systematically experiment with educational context and prompting and observe whether those changes improve the quality of AI-generated mathematics questions."**

---

## 28. Documentation Entry Points

When working on the project, start with:

```text
CLAUDE.md
```

Then review the relevant documentation:

```text
docs/project-management/project.md
docs/project-management/product.md
docs/project-management/requirements.md
docs/project-management/architecture.md
docs/project-management/database.md
docs/project-management/ai-generation.md
```

Then identify the current task under:

```text
docs/tasks/
```

---

## Final Principle

MathQuestAI should be developed as both:

```text
A working application
```

and:

```text
A controlled AI/context-engineering experiment
```

The application provides the infrastructure.

The experiments provide the research value.

The evaluation loop provides the feedback needed to improve prompts and context.

```text
Build → Generate → Evaluate → Learn → Improve → Repeat
```
