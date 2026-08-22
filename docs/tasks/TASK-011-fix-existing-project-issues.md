# TASK-011 — Fix Existing Project Issues

## Status
Completed

## Objective
Review and fix the issues already identified after the current implementation. This is a cleanup and consistency task; it must not introduce new product functionality.

**Evaluation is explicitly out of scope** and will be designed separately later.

## Known Issue 1 — Question Pattern Naming Mismatch

The actual PostgreSQL data contains:

```text
Simplify & Calculate
```

while some existing tests/documentation expect:

```text
Simplify / Calculate
```

This has been associated with failures in:
- `database-connection.test.ts`
- `dynamic-data-loading.test.ts`

### Required action

Inspect:
- PostgreSQL seed/data
- Prisma schema/seed
- application references
- tests
- task documentation
- hard-coded references

Determine the authoritative value before changing anything. Do not blindly replace every occurrence.

If `Simplify & Calculate` is the source of truth, update stale tests/docs/code references consistently.

## Known Issue 2 — Documentation Reference

`CLAUDE.md` references:

```text
docs/development.md
```

but that file was not created because the existing documentation already covers the development workflow.

Review:
- `CLAUDE.md`
- `README.md`
- `docs/`

Prefer removing/updating a stale reference rather than creating a redundant document. Do not create `docs/development.md` unless the investigation proves it is genuinely needed.

## Documentation Consistency Review

Review the affected documentation, including:
- `README.md`
- `CLAUDE.md`
- `docs/project.md`
- `docs/product.md`
- `docs/architecture.md`
- `docs/database.md`
- relevant task/feedback documents

Only change information that is demonstrably stale or inconsistent.

## Testing / TDD

Before changes:
1. Run the existing tests.
2. Reproduce the relevant failures.
3. Identify the root cause.
4. Confirm whether failures are stale expectations or actual defects.

For behavioral fixes, follow:

```text
RED → GREEN → REFACTOR
```

Do not make tests green by blindly changing assertions.

Documentation-only changes do not require tests.

## Preserve Existing Generation Flow

Do not redesign or unnecessarily modify:
- `GenerationContext`
- Prompt Builder
- `AIProvider`
- AI model configuration
- `GenerationResponse`
- Question Generation Use Case

Keep the current behavior of generating **10 questions**.

## Database Safety

Do not change the database schema, create tables, or redesign relationships.

Only modify Prisma models if investigation proves an existing model incorrectly represents the intended structure.

## Evaluation — Out of Scope

Do NOT implement or design:
- Evaluation page
- evaluation metrics
- scoring
- AI quality assessment
- prompt/context experiment comparison
- evaluation persistence

These will be discussed separately before creating the Evaluation task.

## Regression Verification

After fixes, verify:

```text
Setup Page
   ↓
Generate
   ↓
AI generation
   ↓
Questions Page
```

Also run the relevant tests and full test suite.

## Expected Result

There should be one consistent representation of the question pattern across database, application, tests, and documentation.

There should be no unexplained mixture of:

```text
Simplify & Calculate
```

and:

```text
Simplify / Calculate
```

Documentation should accurately reflect the actual project structure.

## Verification Checklist

### Naming
- [x] Database value inspected.
- [x] Prisma/seed data inspected.
- [x] Application references inspected.
- [x] Tests inspected.
- [x] Documentation inspected.
- [x] Source of truth identified.
- [x] Stale references corrected.
- [x] No unrelated replacements made.

### Documentation
- [x] `CLAUDE.md` reviewed.
- [x] `README.md` reviewed.
- [x] Relevant `docs/` files reviewed.
- [x] `docs/development.md` decision documented.
- [x] No unnecessary documentation file created.

### Testing
- [x] Existing failures reproduced before changes.
- [x] Root cause identified.
- [x] Relevant tests corrected/added where appropriate.
- [x] Relevant tests pass.
- [x] Full test suite passes.

### Regression
- [x] Setup page still works.
- [x] Generation still works.
- [x] AI provider configuration still works.
- [x] 10 questions are still generated.
- [x] Questions page still displays generated questions.
- [x] No API key exposure introduced.

### Scope
- [x] No Evaluation implementation.
- [x] No Evaluation architecture added.
- [x] No database schema redesign.
- [x] No unrelated refactoring.
- [x] No unnecessary dependencies added.

## Implementation Feedback

After completion, document:
- files inspected
- issues confirmed
- root cause of each issue
- source of truth selected
- files changed
- tests changed
- documentation changed
- whether `docs/development.md` was created or intentionally not created
- test results before and after
- regression verification
- additional issues discovered
- issues intentionally left for future tasks

## Definition of Done

- [x] Naming mismatch resolved consistently.
- [x] Relevant failing tests corrected appropriately.
- [x] `CLAUDE.md` references match the actual documentation structure.
- [x] Related documentation is current.
- [x] No unnecessary `docs/development.md` created.
- [x] TDD followed for behavioral fixes where applicable (N/A here — see feedback report: this was a stale-fixture correction, not new behavior, plus one genuine test-infrastructure bug found and fixed along the way).
- [x] Relevant tests pass.
- [x] Full test suite passes.
- [x] Existing question-generation flow still works.
- [x] Evaluation remains out of scope.
- [x] No database schema changes introduced.
- [x] Implementation feedback documented.
