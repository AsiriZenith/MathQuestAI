# TASK-013 — Evaluation Entry Flow and Evaluation Mode Selection

## Status

Completed

## Objective

Change the current Questions → Evaluation navigation flow.

Currently, clicking the evaluation button at the bottom of the Questions page navigates directly to `/evaluation`.

Change this behavior so that the user must first choose **how the generated questions should be evaluated**.

For this task, only the predefined-question evaluation mode should be available. The previously-generated-question comparison mode is a future feature and must remain disabled.

Do **not** redesign or implement the actual Evaluation page components in this task. That will be handled separately.

---

## Current Flow

```text
Questions Page
      ↓
Click Evaluation button
      ↓
/evaluation
```

## New Flow

```text
Questions Page
      ↓
Click Evaluation button
      ↓
Evaluation Method Dialog
      ↓
Select evaluation method
      ↓
Proceed button becomes enabled
      ↓
Click Proceed
      ↓
Evaluation loading state
      ↓
Send required session/generated-question data to server
      ↓
Generate/prepare evaluation results
      ↓
Navigate to /evaluation
```

---

# 1. Add Evaluation Method Dialog

When the user clicks the existing evaluation button on the Questions page, **do not navigate immediately**.

Open a modal/dialog instead.

The dialog should follow the existing MathQuestAI visual style:

- Rounded corners
- Existing purple/indigo primary color
- Clean white/light background
- Existing typography and spacing conventions
- Clear title and short explanation
- Two selectable evaluation methods
- Primary Proceed button
- Appropriate Cancel/Close behavior

Suggested title:

**Choose Evaluation Method**

Suggested supporting text:

> Choose how you want to evaluate the generated questions.

Claude Code may adjust the wording slightly if necessary to remain consistent with the existing UI terminology.

---

# 2. Evaluation Method Options

The dialog must contain exactly two options.

## Option 1 — Enabled

Recommended display name:

**Evaluate Against Predefined Questions**

Description:

> Evaluate the generated questions against the predefined benchmark/reference questions for the selected subject, topic, subtopic, patterns, and difficulty.

This option is currently available.

It should have a clear selectable/selected state.

For example:

```text
┌─────────────────────────────────────────┐
│ ○ Evaluate Against Predefined Questions │
│   Compare generated questions with      │
│   predefined benchmark questions.      │
└─────────────────────────────────────────┘
```

The exact visual implementation should follow existing component conventions.

---

## Option 2 — Disabled / Upcoming Feature

Recommended display name:

**Compare with Previous Generations**

Description:

> Compare the current generated questions with questions generated in previous sessions.

This feature is **not implemented yet**.

The option must:

- Be visibly disabled
- Not be selectable
- Not allow the user to proceed using this method
- Clearly communicate that it is an upcoming feature

Use an appropriate visual signal such as:

**Coming Soon**

For example:

```text
┌─────────────────────────────────────────┐
│ 🔒 Compare with Previous Generations    │
│    Compare against previously generated │
│    questions.                           │
│                          Coming Soon    │
└─────────────────────────────────────────┘
```

Do not implement any backend logic for this option.

Do not create database structures for previous-generation comparison.

Do not create the comparison algorithm.

This task only establishes the UI placeholder for the future feature.

---

# 3. Proceed Button Behavior

The **Proceed** button must initially be disabled until an available evaluation method is selected.

Because only the first option is currently available:

```text
No selection
    ↓
Proceed disabled

Select "Evaluate Against Predefined Questions"
    ↓
Proceed enabled
```

Selecting the disabled "Compare with Previous Generations" option must not be possible.

Once the first option is selected, the UI should clearly indicate the selected state and enable Proceed.

---

# 4. Proceed Flow

When the user clicks Proceed after selecting:

**Evaluate Against Predefined Questions**

do not immediately render the Evaluation page.

Instead, start an evaluation-loading state.

Expected flow:

```text
User clicks Proceed
       ↓
Disable dialog interaction
       ↓
Show evaluation loader
       ↓
Prepare/send evaluation request
       ↓
Wait for server-side evaluation preparation/generation
       ↓
Store the resulting evaluation data
       ↓
Navigate to /evaluation
```

The loading experience should be consistent with the existing `/generate` loading experience.

The user should not see a blank page or be able to repeatedly submit the evaluation request.

---

# 5. Evaluation Data Handoff

The evaluation process will need information from the current practice session.

Use the existing `PracticeSessionProvider` and current application architecture rather than introducing a new global state-management solution.

The evaluation request should have access to the relevant current-session information, including where applicable:

```text
Practice configuration
    ├── Grade
    ├── Subject
    ├── Topic
    ├── Subtopic
    ├── Difficulty
    ├── Selected Question Patterns
    └── Selected Question Types

Generation context
    └── Context used to generate the questions

Generated questions
    └── Actual GenerationResponse from Gemini

Evaluation method
    └── Predefined Questions
```

Important:

**Do not finalize or over-engineer the evaluation API contract in this task.**

The detailed evaluation algorithm, evaluation criteria, database requirements, and exact API request/response structure will be defined in the next evaluation-page task.

For this task, establish the appropriate application boundary so the selected evaluation mode and current generated/session data can be handed to the server-side evaluation flow.

Follow the existing project architecture:

```text
Client Component
      ↓
Server Action
      ↓
Server-side evaluation logic
```

Do not call the database or external AI service directly from the client.

---

# 6. Navigation to `/evaluation`

After the server-side evaluation preparation/generation succeeds:

```text
Questions
   ↓
Evaluation Method Dialog
   ↓
Predefined Questions selected
   ↓
Evaluation loading
   ↓
Server-side evaluation processing
   ↓
/evaluation
```

The `/evaluation` page should receive/access the generated evaluation result using the application's existing state-management approach.

Do not redesign the `/evaluation` UI in this task.

The existing evaluation page can remain as-is temporarily.

---

# 7. Error Handling

If the server-side evaluation preparation fails:

- Do not navigate to `/evaluation`
- Stop the loading state
- Keep the user informed that the evaluation could not be prepared
- Allow the user to retry
- Do not expose raw database/API/implementation errors to the user

Follow the existing error-handling conventions used by the generation flow.

---

# 8. Preserve Existing Behavior

Do not unnecessarily change:

- Setup page
- Question generation logic
- Gemini provider
- Prompt builder
- Questions page question rendering
- Existing PracticeSessionProvider structure
- Existing application layout
- Existing visual design system

The only Questions-page change required is:

```text
Evaluation button
    ↓
Open evaluation-method dialog
```

instead of:

```text
Evaluation button
    ↓
router.push("/evaluation")
```

---

# 9. Important Future Feature Boundary

The second evaluation method is intentionally a placeholder.

Do NOT implement:

- Previous generation storage
- Previous generation retrieval
- Comparison algorithms
- Historical evaluation
- New database tables for generation history
- Comparison scoring
- UI for comparing two generations
- Any AI logic specifically for previous-generation comparison

Only provide the disabled UI option with a clear "Coming Soon" indication.

---

# 10. Acceptance Criteria

### Dialog

- [x] Clicking the existing evaluation button on `/questions` opens an evaluation-method dialog.
- [x] Clicking the button no longer directly navigates to `/evaluation`.
- [x] Dialog follows the existing MathQuestAI visual language.
- [x] Dialog contains two evaluation-method options.

### Evaluation Methods

- [x] "Evaluate Against Predefined Questions" is enabled and selectable.
- [x] "Compare with Previous Generations" is disabled.
- [x] The disabled option clearly indicates that it is an upcoming feature.
- [x] The disabled option cannot be selected.

### Proceed

- [x] Proceed is disabled when no evaluation method is selected.
- [x] Selecting the predefined-question option enables Proceed.
- [x] Proceed cannot be triggered multiple times while processing.

### Loading

- [x] Clicking Proceed starts an evaluation loading state.
- [x] The loading experience follows the existing generation/loading UX where practical.
- [x] The user cannot accidentally submit the same evaluation request multiple times.

### Server-side handoff

- [x] Evaluation processing is initiated through the existing server-side architecture.
- [x] Current practice-session data and generated questions are available to the server-side evaluation flow.
- [x] The selected evaluation method is included in the evaluation flow.
- [x] Client components do not directly access PostgreSQL or external AI services.

### Navigation

- [x] Successful processing navigates the user to `/evaluation`.
- [x] Failed processing does not navigate to `/evaluation`.
- [x] The user can retry after an evaluation-processing failure.

### Scope

- [x] Existing `/evaluation` components are not redesigned in this task.
- [x] Previous-generation comparison logic is not implemented.
- [x] No unnecessary changes are made to the existing generation pipeline.

---

# 11. Recommended Implementation Approach

Before coding, inspect the existing implementation of:

```text
app/questions/page.tsx
components/providers/practice-session-provider.tsx
app/generate/page.tsx
lib/actions/generation.ts
lib/generation/generate-questions.ts
app/evaluation/page.tsx
```

Reuse existing patterns for:

- Dialog/modal implementation
- Loading states
- Server Actions
- Session state
- Error handling
- Navigation

Do not introduce a new state-management library or architectural pattern.

The implementation should remain consistent with the current lightweight architecture of MathQuestAI.

---

# Expected Result

The final user experience should be:

```text
Questions Page
      │
      │ Click Evaluate
      ▼
┌─────────────────────────────────────┐
│       Choose Evaluation Method      │
│                                     │
│  ◉ Evaluate Against Predefined      │
│    Questions                        │
│                                     │
│  ○ Compare with Previous Generations│
│    Coming Soon                      │
│                                     │
│              [ Proceed ]             │
└─────────────────────────────────────┘
      │
      │ Proceed
      ▼
┌─────────────────────────────────────┐
│                                     │
│       Preparing Evaluation...       │
│                                     │
│             Loading...              │
│                                     │
└─────────────────────────────────────┘
      │
      ▼
 /evaluation
```

The actual design and implementation of the Evaluation results page will be handled in a separate task.