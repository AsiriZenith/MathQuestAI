# TASK-002 — Recreate Figma UI and Routes

## Status

Backlog

---

## Objective

Recreate the required MathQuestAI user interface and routes in the Next.js application using the existing Figma-generated React project as the visual and functional reference.

Target application:

```text
D:\my works\MathQuestAI
```

Reference project:

```text
D:\my works\MathQuestAI_UI
```

The reference project must remain unchanged.

---

## Context

The Figma design has already been exported as a React project.

The reference project has been installed and verified to run locally at:

```text
http://localhost:5173/
```

It already contains the pages and UI required for the MathQuestAI project.

The purpose of this task is **not** to redesign the application.

The purpose is to reproduce the existing design in the new Next.js application while adapting it to the Next.js App Router architecture.

---

## Critical Reference Project Rule

The following project is read-only:

```text
D:\my works\MathQuestAI_UI
```

Claude Code may:

- Inspect files
- Read components
- Read route definitions
- Inspect styles
- Inspect assets
- Understand page structure
- Use the project as implementation reference

Claude Code must NOT:

- Modify files
- Delete files
- Rename files
- Install dependencies into the reference project
- Change its configuration
- Run formatting that modifies its files
- Commit changes to the reference project

All implementation changes must happen in:

```text
D:\my works\MathQuestAI
```

---

# 1. Required Project Context

Before implementation, read:

```text
CLAUDE.md

docs/project-management/project.md
docs/project-management/product.md
docs/project-management/requirements.md
docs/project-management/architecture.md
docs/project-management/database.md
docs/project-management/ai-generation.md

docs/tasks/README.md
docs/tasks/backlog/TASK-002-recreate-figma-ui.md
```

Also inspect:

```text
D:\my works\MathQuestAI_UI
```

Do not start implementation immediately.

First understand the reference project.

---

# 2. First Phase — Reference Project Analysis

Before copying or recreating components, inspect the reference project and identify:

### Pages

List every application page that is relevant to MathQuestAI.

For each page identify:

- Page purpose
- Existing route
- Main layout
- Major components
- Important UI states
- Navigation relationships

### Routes

Create a clear mapping:

```text
Reference Route
       ↓
Next.js Route
```

For example:

```text
/reference-route
       ↓
/target-route
```

Use the existing design routes as the primary reference.

Do not invent additional application routes unless required by the design or project requirements.

### Components

Identify reusable components such as:

- Header
- Sidebar
- Navigation
- Cards
- Forms
- Select controls
- Buttons
- Tables
- Dialogs
- Question-related UI
- Evaluation-related UI
- Layout components

Determine which components are:

```text
Page-specific
```

and which are:

```text
Reusable
```

### Assets

Identify:

- Images
- Icons
- SVGs
- Fonts
- Logos
- Other static assets

Determine which assets can be reused in the Next.js project.

---

# 3. Reference Analysis Output

Before substantial implementation, create a short implementation mapping in the task notes or an appropriate documentation file.

The mapping should show:

```text
Reference Page
    ↓
Reference Route
    ↓
Next.js Route
    ↓
Next.js Page
    ↓
Reusable Components
```

Example:

```text
Question Generation
    ↓
/generate
    ↓
app/generate/page.tsx
    ↓
GenerationForm
QuestionPatternSelector
DifficultySelector
QuestionTypeSelector
```

The exact mapping must come from inspecting the actual reference project.

Do not invent the mapping before inspection.

---

# 4. Implement Next.js Routes

Implement the required routes using the Next.js App Router.

Use the appropriate structure under:

```text
app/
```

Each route should be accessible directly through the browser.

Navigation between pages should work.

Avoid implementing route handling through the old React Router architecture unless there is a specific technical reason.

The target application should use Next.js routing.

---

# 5. Recreate UI

Recreate the visual structure of the reference application.

This includes, where present:

- Page layout
- Navigation
- Header
- Sidebar
- Typography
- Spacing
- Forms
- Cards
- Buttons
- Tables
- Tabs
- Modals/dialogs
- Empty states
- Loading states
- Error states
- Responsive behavior

The objective is visual and functional consistency with the reference project.

Do not redesign the UI during this task.

---

# 6. Component Strategy

Use React components appropriate for the Next.js application.

Prefer reusable components when the same UI appears across multiple pages.

For example:

```text
components/
├── layout/
├── navigation/
├── common/
└── ...
```

The exact folder structure should follow the existing project architecture and should not be unnecessarily complicated.

Do not create an abstraction merely because two components look slightly similar.

Prefer clear and maintainable components.

---

# 7. Styling

Inspect the reference project to determine its existing styling approach.

Identify whether it uses:

- CSS
- Tailwind CSS
- CSS modules
- Component libraries
- Other styling mechanisms

Then use an appropriate approach in the Next.js project.

Do not automatically introduce a completely different styling system if the existing design can be reproduced using the current project setup.

Preserve the visual intent of the design.

---

# 8. Assets

Where appropriate, copy required static assets from the reference project into the target project.

Before copying an asset:

- Confirm that it is actually required.
- Preserve the reference project.
- Copy rather than move.
- Place it in an appropriate Next.js static/public location.

Never move or delete assets from:

```text
D:\my works\MathQuestAI_UI
```

---

# 9. Static Data Only

This task is UI-focused.

Use static/mock data where the UI requires data to render.

Do not connect the UI to PostgreSQL yet.

Do not use Prisma yet.

For example:

```text
Subject:
Mathematics

Topic:
Algebra

Subtopic:
Simplify / Calculate
```

may be represented with temporary mock data if the design requires it.

The database integration will be implemented in later tasks.

---

# 10. No AI Integration

Do not implement:

- AI provider integration
- Prompt Builder
- Context Loader
- Question generation API
- AI response parsing
- Evaluation engine

The UI may contain the screens required for these features, but they should remain static/mock for this task.

---

# 11. No Authentication

Do not implement authentication or authorization.

The UI should be accessible without a login system during this research phase.

---

# 12. TDD / Testing

This task contains meaningful UI behavior, so testing should be used where appropriate.

Tests should focus on observable behavior rather than implementation details.

Examples:

### Navigation

```text
Given the application is on the home page,
when the user selects the generation page,
the generation page is displayed.
```

### Form interaction

```text
Given the generation form is displayed,
when the user selects a Question Pattern,
the selected pattern is reflected in the UI.
```

### Required selections

```text
Given a required selection has not been made,
when the user attempts to continue,
the appropriate validation state is displayed.
```

Use mocks/static data where necessary.

Do not make tests depend on PostgreSQL or an external AI provider.

---

# 13. Visual Validation

Automated tests alone are not sufficient for this task.

The UI should be manually compared with the reference project.

Compare:

- Layout
- Spacing
- Typography
- Component sizes
- Navigation
- Colors
- Icons
- Form controls
- Responsive behavior
- Page transitions

The goal is to identify meaningful visual differences.

Do not spend time achieving pixel-perfect equality if doing so creates unnecessary complexity, but the implemented UI should clearly represent the same design.

---

# 14. Route Validation

Verify every implemented route.

For each route:

```text
Open route
    ↓
Page renders
    ↓
No console/runtime errors
    ↓
Navigation works
    ↓
Expected UI appears
```

Direct navigation should also work.

For example:

```text
http://localhost:<port>/some-route
```

should load the corresponding Next.js page.

---

# 15. Build Validation

After implementation:

Run:

```text
npm run lint
```

and an appropriate production/build validation such as:

```text
npm run build
```

Resolve errors caused by this task.

Do not ignore build errors.

---

# 16. Acceptance Criteria

This task is complete when:

- [ ] The reference project has been inspected.
- [ ] The reference project remains unchanged.
- [ ] Required pages have been identified.
- [ ] Required routes have been identified.
- [ ] The required routes exist in the Next.js application.
- [ ] Navigation between relevant pages works.
- [ ] The UI has been recreated based on the reference project.
- [ ] Required assets are available in the target project.
- [ ] The application does not depend on the reference project at runtime.
- [ ] Static/mock data is used where data is required.
- [ ] No PostgreSQL integration has been introduced.
- [ ] No Prisma integration has been introduced.
- [ ] No AI API integration has been introduced.
- [ ] Meaningful UI behavior has appropriate tests.
- [ ] Manual visual validation has been performed.
- [ ] `npm run lint` succeeds.
- [ ] Production/build validation succeeds.
- [ ] No unrelated features have been implemented.

---

# 17. Out of Scope

The following are explicitly outside TASK-002:

```text
Database
Prisma
PostgreSQL
AI API
Prompt Builder
Context Loader
Question Generation
AI Response Validation
Evaluation Logic
Authentication
Authorization
Persistent user sessions
Generated question persistence
Evaluation-result persistence
```

These belong to later tasks.

---

# 18. Avoid Premature Architecture

Do not create complex infrastructure simply because future tasks may need it.

For example, do not introduce:

```text
Repository pattern
Service layer
CQRS
MediatR
Microservices
Event bus
Complex state management
```

unless the current UI task genuinely requires them.

The project is intentionally kept simple.

---

# 19. Implementation Principle

The reference project is the source of truth for the current UI design.

The project documentation is the source of truth for product and architectural decisions.

If there is a conflict:

```text
Product / Architecture requirements
        ↓
Project documentation
        ↓
Reference UI implementation
```

Do not blindly copy behavior from the reference project if it conflicts with the intended MathQuestAI requirements.

---

# 20. Completion Report

When the task is completed, report:

### Pages identified

List the pages found in the reference project.

### Routes implemented

List the Next.js routes.

### Components created

List the major reusable components.

### Assets copied

List important assets copied from the reference project.

### Tests

List tests added and their results.

### Validation

Report:

```text
Lint:
Build:
Manual UI validation:
Route validation:
```

### Deviations

Clearly state any UI behavior or visual difference that could not be reproduced and why.

### Documentation changes

Mention any project documentation that was updated.

Do not automatically begin TASK-003 after completing this task.

Wait for review/approval.
