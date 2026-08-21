# MathQuestAI — Product Definition

## 1. Product Overview

MathQuestAI is an AI-powered mathematics question-generation application created as a research project.

The application allows a user to select structured mathematics-related requirements and generate questions using an AI model.

The product is designed to help the team investigate how different combinations of structured context, reference questions, and prompts influence the quality of AI-generated mathematics questions.

---

## 2. Product Goal

The primary goal is:

> Provide a simple interface for generating mathematics questions from structured requirements and evaluating whether the generated questions satisfy those requirements.

The product should make it easy to experiment with different prompt and context strategies.

---

## 3. Research Goal

The product supports research into:

> How can structured context and carefully designed prompts improve the quality and consistency of AI-generated mathematics questions?

The application should therefore support an iterative workflow:

```text
Select Requirements
        ↓
Generate Questions
        ↓
Evaluate Questions
        ↓
Identify Problems
        ↓
Improve Context / Prompt
        ↓
Generate Again
        ↓
Evaluate Again
```

---

## 4. Target User

The initial target user is the project team/researcher.

The application is not currently designed as a complete commercial learning platform.

It is primarily a research prototype that allows the team to experiment with AI-generated mathematics questions.

---

## 5. Core User Journey

The primary user journey is:

```text
Open MathQuestAI
      ↓
Select Subject
      ↓
Select Topic
      ↓
Select Subtopic
      ↓
Select Question Pattern(s)
      ↓
Select Difficulty
      ↓
Select Question Type
      ↓
Generate Questions
      ↓
Review Generated Questions
      ↓
Evaluate Results
```

---

## 6. Subject Selection

The user selects a Subject.

A Subject represents a high-level educational subject.

Example:

```text
Mathematics
```

The available Subjects are maintained in the database.

---

## 7. Topic Selection

After selecting a Subject, the application loads the relevant Topics.

Topics represent a major area within the selected Subject.

Example:

```text
Subject:
Mathematics

Topic:
Algebra
```

Topics are loaded dynamically from the database.

---

## 8. Subtopic Selection

After selecting a Topic, the application loads its available Subtopics.

A Subtopic represents a specific area of learning within the Topic.

Example:

```text
Topic:
Algebra

Subtopic:
Simplify / Calculate
```

Subtopic selection is mandatory for the question-generation flow.

---

## 9. Question Pattern Selection

Question Patterns represent specific mathematical tasks that can be generated within a Subtopic.

Examples include:

- Combine Like Terms
- Apply Distributive Property
- Simplify Algebraic Fractions
- Simplify Multi-Operation Expressions
- Simplify and Retain Variables

The available Question Patterns depend on the selected Subtopic.

The user must select at least one Question Pattern.

The user may select:

- One pattern
- Multiple patterns
- All available patterns

Example:

```text
Subtopic:
Simplify / Calculate

Selected Question Patterns:
✓ Combine Like Terms
✓ Apply Distributive Property
✓ Simplify Algebraic Fractions
```

---

## 10. Difficulty Selection

The user must select a Difficulty Level.

The project defines three difficulty levels.

### Easy

Direct application of the Question Pattern.

Usually requires one main step and a familiar structure.

### Medium

Still directly related to the Question Pattern, but requires additional processing or approximately 2–3 connected steps.

### Hard

Requires multiple connected steps, a more complex arrangement, or a combination of a few related complexity factors.

These definitions are project-specific benchmarks.

They are not intended to represent a universal educational standard.

---

## 11. Question Type

Question Type is selected by the user.

Question Type is separate from Question Pattern.

For example:

```text
Question Pattern:
Combine Like Terms

Question Type:
Multiple Choice
```

This allows the same mathematical Question Pattern to potentially be generated using different presentation formats.

The exact supported Question Types will be defined in the requirements.

---

## 12. Question Generation

After the user completes the required selections, the user can request question generation.

The application uses the selected information to dynamically load relevant data from the database.

Conceptually:

```text
User Selections
      ↓
Relevant Database Data
      ↓
Generation Context
      ↓
AI Prompt
      ↓
AI API
      ↓
Generated Questions
```

The generated questions are displayed to the user.

---

## 13. Generation Context

The generation context may contain:

- Subject
- Topic
- Subtopic
- Question Pattern
- Difficulty Level
- Question Type
- Difficulty-specific generation instructions
- Reference Questions
- Common generation instructions

The purpose of storing these elements separately is to allow the team to experiment with different combinations of context.

---

## 14. Reference Questions

Reference Questions are sample questions associated with a Question Pattern and Difficulty Level.

They demonstrate the intended characteristics of generated questions.

For example:

```text
Question Pattern:
Combine Like Terms

Difficulty:
Easy

Reference Questions:
- Sample question 1
- Sample question 2
- Sample question 3
...
```

Reference Questions are part of the generation context.

They are also useful during evaluation.

---

## 15. Generation Prompts

Generation instructions are divided conceptually into two areas.

### Common Generation Instructions

These apply generally to question generation.

They may contain instructions such as:

- The purpose of the generation
- Number of questions
- Expected output format
- General generation rules

### Question-Specific Generation Instructions

These depend on:

- Question Pattern
- Difficulty Level

These instructions explain how questions should be generated for the particular combination.

The final AI prompt is constructed dynamically from these pieces of information.

---

## 16. Generated Questions

Generated questions are initially treated as output for the research experiment.

The current project does not require permanent storage of generated questions.

The initial goal is:

```text
Generate
   ↓
Display
   ↓
Evaluate
```

Persistent generated-question history is outside the current scope unless the requirement changes later.

---

## 17. Evaluation Page

The application will provide an Evaluation page for reviewing generated questions.

The purpose of the Evaluation page is to help the team determine whether generated questions satisfy the requested requirements.

Potential evaluation criteria include:

- Question Pattern correctness
- Difficulty correctness
- Mathematical correctness
- Question Type correctness
- Relevance to the selected Subtopic
- Similarity to the intended characteristics represented by Reference Questions
- Output format correctness

The exact evaluation methodology may evolve as the research progresses.

---

## 18. Research Experiment

The product should make it possible to compare the effect of different generation contexts.

For example:

### Experiment A

```text
Question Pattern
+
Difficulty
+
Basic Instructions
```

Generate and evaluate.

### Experiment B

```text
Question Pattern
+
Difficulty
+
Reference Questions
+
Detailed Generation Prompt
+
Common Instructions
```

Generate and evaluate again.

The team can then compare the results.

The product should therefore avoid tightly coupling the generation process to one fixed prompt strategy.

---

## 19. Iterative Improvement

The application is intended to support an iterative research process.

If generated questions do not meet expectations:

1. Review the generated questions.
2. Identify the weakness.
3. Determine whether the context or prompt needs improvement.
4. Modify the relevant context or generation instruction.
5. Generate again.
6. Evaluate again.

This process can be repeated multiple times.

```text
             ┌─────────────────────┐
             │ Context / Prompt     │
             └──────────┬──────────┘
                        ↓
                   Generate
                        ↓
                   Evaluate
                        ↓
                Identify Issues
                        ↓
                Improve Context
                        │
                        └──────────────┐
                                       ↓
                                   Generate
```

---

## 20. MVP Scope

The initial MVP should support:

- Subject selection
- Topic selection
- Subtopic selection
- Question Pattern selection
- Multiple Question Pattern selection
- Difficulty selection
- Question Type selection
- Dynamic loading of educational data
- Dynamic prompt construction
- AI question generation
- Displaying generated questions
- Evaluation of generated questions

---

## 21. Out of Scope

The current research project does not require:

- Authentication
- Student accounts
- Teacher accounts
- Team management
- User sessions
- User profiles
- Persistent generated-question history
- Student progress tracking
- Payment functionality
- Complex authorization
- Production-scale infrastructure

These features should not be implemented unless the project scope changes.

---

## 22. Product Principles

### Keep the product simple

The application exists to support research, not to demonstrate unnecessary enterprise architecture.

### Make context visible

The team should be able to understand what information is being provided to the AI model.

### Make experimentation easy

Changing prompts or context should not require rewriting large parts of the application.

### Separate configuration from generation

Educational definitions and generation instructions should be maintained independently from the AI provider implementation.

### Evaluate, don't assume

AI-generated questions should be evaluated against the project's intended requirements.

---

## 23. Current Product Flow

The intended initial product flow is:

```text
                  MathQuestAI
                       │
                       ↓
                 Select Subject
                       │
                       ↓
                  Select Topic
                       │
                       ↓
                Select Subtopic
                       │
                       ↓
            Select Question Pattern(s)
                       │
                       ↓
               Select Difficulty
                       │
                       ↓
             Select Question Type
                       │
                       ↓
                 Generate
                       │
                       ↓
              Generated Questions
                       │
                       ↓
                  Evaluation
                       │
                       ↓
             Improve Context/Prompt
                       │
                       └──────────→ Generate
```

This flow represents the current product direction and may evolve as research findings emerge.
