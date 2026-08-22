# TASK — Initialize Git Repository and Connect MathQuestAI to GitHub

## Objective

Prepare the existing local MathQuestAI project for version control and connect it to the newly created GitHub repository.

The local project already exists and must **not** be recreated.

### Local project

```text
D:\my works\MathQuestAI
```

### GitHub repository

```text
https://github.com/AsiriZenith/MathQuestAI.git
```

The GitHub repository was created as an empty repository:

- Repository name: `MathQuestAI`
- Visibility: Public
- No GitHub-generated README
- No GitHub-generated `.gitignore`
- No license
- No template

The local project should remain the source of truth for the initial commit.

---

## Important Context

This project already contains the MathQuestAI application and project documentation.

Do **not** create a new Next.js project.

Do **not** replace the existing project.

Do **not** overwrite or delete existing project files.

The objective is only to establish a clean Git repository and connect the existing project to GitHub.

---

# 1. First Inspect the Existing Git State

Open a terminal in:

```text
D:\my works\MathQuestAI
```

Run:

```bash
git status
```

Also inspect:

```bash
git branch --show-current
git remote -v
```

Determine whether:

1. Git is already initialized.
2. A branch already exists.
3. A remote already exists.
4. There are existing commits.

### Important

Do **not** run `git init` blindly.

If the directory is already a Git repository, preserve the existing Git history.

If Git is not initialized, then initialize it.

---

# 2. Protect Existing Work

Before staging files, inspect the project structure.

Important files/directories may include:

```text
CLAUDE.md
README.md
docs/
docs/tasks/
tests/
app/
components/
lib/
prisma/
package.json
...
```

Do not remove existing documentation or project files.

---

# 3. Create / Verify `.gitignore`

Before the first commit, make sure the repository has an appropriate `.gitignore`.

At minimum, the following must not be committed:

```text
node_modules/
.next/
.env
.env.local
.env.*.local
```

Also ignore other generated files or local-only files appropriate for the existing Next.js project.

If the project already has a `.gitignore`, inspect it before modifying it.

Do not replace a good existing `.gitignore` unnecessarily.

---

# 4. Protect Secrets

Before staging files, inspect for sensitive configuration.

Never commit:

- API keys
- AI provider keys
- Database passwords
- `.env` files
- `.env.local`
- Access tokens
- Private credentials

If a secret is found in a tracked file, **stop and report it instead of committing it**.

---

# 5. Review Git Status

Run:

```bash
git status
```

Review the files that will be committed.

The initial commit should represent the current MathQuestAI project, including the important project documentation, but should exclude generated dependencies, build output, secrets, and other local-only files.

---

# 6. Create the Initial Commit

If the project does not already have an appropriate initial commit, stage the files:

```bash
git add .
```

Then inspect:

```bash
git status
```

Only after confirming the staged files are correct:

```bash
git commit -m "chore: initialize MathQuestAI project"
```

If an appropriate existing commit already represents the current project state, do not create a meaningless duplicate commit. Report the existing state instead.

---

# 7. Use `main` as the Primary Branch

The GitHub repository should use:

```text
main
```

If the current branch is not `main`, rename it only if doing so will not destroy or rewrite useful history:

```bash
git branch -M main
```

Verify:

```bash
git branch --show-current
```

Expected:

```text
main
```

---

# 8. Configure the GitHub Remote

The required remote is:

```text
https://github.com/AsiriZenith/MathQuestAI.git
```

First inspect the existing remote:

```bash
git remote -v
```

### If no remote exists

Add:

```bash
git remote add origin https://github.com/AsiriZenith/MathQuestAI.git
```

### If `origin` already exists

Do **not** blindly add another remote.

Check whether it already points to the correct repository.

If it points somewhere else, report the situation before changing it.

After configuration, verify:

```bash
git remote -v
```

Expected:

```text
origin  https://github.com/AsiriZenith/MathQuestAI.git (fetch)
origin  https://github.com/AsiriZenith/MathQuestAI.git (push)
```

---

# 9. Push to GitHub

After confirming:

- Correct local directory
- Correct branch
- Correct commit
- Correct remote
- No secrets
- Correct `.gitignore`

push:

```bash
git push -u origin main
```

Do not use the older GitHub-generated `master` commands.

The intended primary branch is:

```text
main
```

---

# 10. Verify the Result

After the push succeeds, verify:

```bash
git status
```

Expected state should be similar to:

```text
On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean
```

Also verify:

```bash
git remote -v
```

and:

```bash
git log --oneline --max-count=5
```

Confirm that the GitHub repository contains the project.

---

# TDD Note

This task is infrastructure/project initialization work.

Do **not** force TDD for Git initialization itself.

There is no meaningful application behavior to test here.

Normal TDD expectations continue for subsequent application-development tasks.

---

# Documentation Update

After completing this task:

1. Check `docs/project-management/progress.md` if it exists.
2. Record that the local project has been connected to GitHub.
3. Check `README.md`.
4. Update `README.md` only if this task introduces meaningful project-level information that belongs in the high-level project overview.
5. Do not duplicate Git command details in `README.md`.

If a relevant documentation file does not exist yet, do not create unnecessary documentation just for this task unless the existing project structure requires it.

---

# Acceptance Criteria

The task is complete when all of the following are true:

- [ ] Existing local project at `D:\my works\MathQuestAI` is preserved.
- [ ] Existing Git state was inspected before making changes.
- [ ] Git is initialized if required.
- [ ] Appropriate `.gitignore` exists.
- [ ] `node_modules/` is not tracked.
- [ ] `.next/` is not tracked.
- [ ] `.env` and local environment files are not tracked.
- [ ] No secrets are committed.
- [ ] The project is committed with an appropriate initial commit, if required.
- [ ] Primary branch is `main`.
- [ ] `origin` points to `https://github.com/AsiriZenith/MathQuestAI.git`.
- [ ] Local `main` is pushed to GitHub.
- [ ] Working tree is clean after the push.
- [ ] Project progress is updated if applicable.
- [ ] `README.md` was reviewed and updated only if necessary.

---

# Final Report

When finished, report:

### Git State

- Was Git already initialized?
- Current branch:
- Existing commits:
- Initial commit created?:

### Remote

- Remote configured:
- Remote URL:

### Security

- `.gitignore` verified:
- Secrets checked:
- Any files excluded:

### Push

- Push successful:
- GitHub branch:

### Documentation

- `docs/project-management/progress.md` updated:
- `README.md` reviewed:
- `README.md` updated:

If any step could not be completed, clearly explain why and **do not pretend the task is complete**.
