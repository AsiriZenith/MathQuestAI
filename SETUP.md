# MathQuestAI — Local Setup Guide

This guide takes you from a fresh `git clone` to a fully working local MathQuestAI
environment that can generate questions with a real AI provider.

Follow the sections in order. Each one ends with a way to confirm it worked before
you move on.

> **Read this first — two things that break a fresh clone**
>
> 1. **You must run `npx prisma generate`.** The Prisma Client is generated code and
>    is *not* committed to Git. Nothing that touches the database will compile until
>    you generate it. See [Step 5](#step-5--generate-the-prisma-client).
> 2. **Your environment file must be named `.env.local`, not `.env`.** The Prisma CLI
>    and the test runner both load `.env.local` explicitly. A file named `.env` is
>    silently ignored. See [Step 4](#step-4--configure-environment-variables).

---

## Table of Contents

1. [Prerequisites](#step-1--prerequisites)
2. [Clone and install](#step-2--clone-and-install)
3. [Set up the database](#step-3--set-up-the-database)
   - [No PostgreSQL yet? Choose a setup option](#30-no-postgresql-yet-choose-a-setup-option)
4. [Configure environment variables](#step-4--configure-environment-variables)
5. [Generate the Prisma Client](#step-5--generate-the-prisma-client)
6. [Configure the AI provider](#step-6--configure-the-ai-provider)
7. [Run the application](#step-7--run-the-application)
8. [Verify your setup](#step-8--verify-your-setup)
9. [Running the tests](#step-9--running-the-tests)
10. [Troubleshooting](#troubleshooting)
11. [Command cheat sheet](#command-cheat-sheet)

---

## Step 1 — Prerequisites

Install these before anything else.

| Tool | Version | Notes |
| --- | --- | --- |
| **Node.js** | **20.9 or newer** (22 LTS recommended) | Required by Next.js 16. Verified on Node 22.22.1. |
| **npm** | 10 or newer | Ships with Node. |
| **PostgreSQL** | **15 or newer** | The backup is dumped from PostgreSQL 15.12, and `pg_restore` cannot load a v15 dump into an older server. **Don't have it installed? See [Step 3.0](#30-no-postgresql-yet-choose-a-setup-option).** |
| **pgAdmin 4** | Any recent version | Optional — only if you want a GUI. Bundled with the PostgreSQL Windows installer. |
| **Git** | Any recent version | |

Check what you have:

```bash
node -v      # must print v20.9.x or higher
npm -v
psql --version
git --version
```

> The repo has no `.nvmrc` and no `engines` field, so nothing will stop you from
> using an older Node. If you are on Node 18 or below, Next.js 16 will fail at
> startup with confusing errors — upgrade first.

---

## Step 2 — Clone and install

```bash
git clone https://github.com/AsiriZenith/MathQuestAI.git
cd MathQuestAI
npm install
```

`npm install` only installs packages. It does **not** generate the Prisma Client and
does **not** create your environment file — those are Steps 4 and 5.

---

## Step 3 — Set up the database

MathQuestAI reads its entire educational context (subjects, topics, subtopics,
question patterns, reference questions, generation prompts) from PostgreSQL. Without
a populated database, the app cannot build a prompt and nothing will generate.

> ### ⚠️ There is no migration history and no seed script in this repository
>
> The database was created and populated outside of this repo, and the Prisma schema
> was produced by introspecting it (`prisma db pull`). That means:
>
> - **You cannot create the data from this repository.** You need the database backup
>   file from the project owner.
> - **Never run `npx prisma migrate ...` or `npx prisma db push`.** There are no
>   migrations to apply, and those commands can alter or wipe the real schema. The
>   database is the source of truth — the Prisma schema follows it, not the reverse.

### 3.0 No PostgreSQL yet? Choose a setup option

Skip this if you already have PostgreSQL 15+ running. Otherwise pick one:

| Your situation | Use |
| --- | --- |
| Normal dev machine, want a GUI (pgAdmin) | **Option A — installer** |
| Docker already installed, want zero system changes and easy cleanup | **Option B — Docker** |
| Comfortable in a terminal, want one command | **Option C — package manager** |
| Can't install software, or very low disk space | **Option D — hosted** |

Whichever you choose, **the rest of this guide is identical** — only your
`DATABASE_URL` in Step 4 changes.

---

#### Option A — Official installer (recommended for most people)

Download from <https://www.postgresql.org/download/> and pick **version 15 or 16**.

The installer bundles everything you need: the server, **pgAdmin 4**, and the
`psql` / `pg_restore` command-line tools.

During installation:

- **Remember the password you set for the `postgres` user** — it goes straight into
  `DATABASE_URL` in Step 4.
- Keep the default port **5432**.
- Leave the "Stack Builder" step unchecked; you don't need it.

**Windows:** if `psql --version` says "command not found" afterwards, the tools
installed fine but aren't on your PATH. Add this folder to your PATH environment
variable (adjust the version number):

```text
C:\Program Files\PostgreSQL\15\bin
```

---

#### Option B — Docker (fastest, if you already have Docker)

One command gives you a running PostgreSQL 15 with the database already created.
It is written on a single line so it works in PowerShell, Command Prompt and bash
alike:

```bash
docker run --name mathquestai-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=MathQuestAI -p 5432:5432 -v mathquestai-data:/var/lib/postgresql/data -d postgres:15
```

| Flag | Why |
| --- | --- |
| `-e POSTGRES_PASSWORD=postgres` | Password for the `postgres` user — use it in `DATABASE_URL` |
| `-e POSTGRES_DB=MathQuestAI` | Creates the database on first start, capitals preserved |
| `-p 5432:5432` | Exposes the server on `localhost:5432` |
| `-v mathquestai-data:...` | Stores data in a named volume so it survives the container |
| `-d postgres:15` | Runs detached, pinned to PostgreSQL 15 to match the backup |

> **This creates the database for you**, with the capital letters intact — so you can
> **skip Step 3.2** and go straight to restoring the backup in Step 3.3.

Your `DATABASE_URL` for Step 4:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/MathQuestAI?schema=public"
```

Managing the container:

```bash
docker stop mathquestai-db     # stop it (data is kept)
docker start mathquestai-db    # start it again
docker logs mathquestai-db     # check it started cleanly
docker rm -f mathquestai-db    # remove the container (named volume survives)
docker volume rm mathquestai-data   # delete the data permanently
```

To browse the data, either install **pgAdmin 4 standalone** and connect it to
`localhost:5432`, or use the shell inside the container:

```bash
docker exec -it mathquestai-db psql -U postgres -d MathQuestAI
```

> Docker Desktop must actually be **running** before any `docker` command works. If
> you see `error during connect ... docker_engine`, start Docker Desktop and retry.

---

#### Option C — Package manager (one-liners)

```bash
# Windows
winget install PostgreSQL.PostgreSQL.16
winget install PostgreSQL.pgAdmin          # optional GUI, installed separately

# macOS
brew install postgresql@16
brew services start postgresql@16

# Ubuntu / Debian
sudo apt update && sudo apt install postgresql
```

Note that package-manager installs usually **do not** include pgAdmin — install it
separately (as above) or just use `psql` from the command line. On macOS with
Homebrew, the default superuser is your own macOS username rather than `postgres`,
so adjust `DATABASE_URL` accordingly.

---

#### Option D — Hosted PostgreSQL (no local install)

Use this only if you genuinely can't install software locally. Free options include
[Neon](https://neon.tech/) and [Supabase](https://supabase.com/) — sign up, create a
project, and copy the connection string they give you.

> ⚠️ **Check with the project owner first.** This route uploads the project's database
> backup to a third-party service rather than keeping it on your machine.

Things that differ from a local setup:

- **Append `sslmode=require`** — hosted providers reject unencrypted connections:
  ```env
  DATABASE_URL="postgresql://user:password@host.neon.tech/neondb?schema=public&sslmode=require"
  ```
- **Don't rename the database.** The provider assigns a name (Neon uses `neondb`).
  Keep it and make sure `DATABASE_URL` matches — the name `MathQuestAI` isn't special,
  it just has to agree with your connection string. **Skip Step 3.2.**
- **You still need `pg_restore` locally** to load a custom-format backup. A plain
  `.sql` dump can instead be pasted into the provider's web SQL editor.
- **Expect it to feel slower.** Every query is a network round-trip, and free tiers
  suspend after inactivity, so the first request after a pause is sluggish.

---

### 3.1 Get the backup file

Ask the project owner for the database backup. It will be one of:

- a **custom-format** dump — `.backup`, `.dump`, or `.tar`
- a **plain SQL** dump — `.sql`

The restore procedure differs slightly between the two, so check the file extension
before continuing. Save the file somewhere simple, e.g. `C:\temp\mathquestai.backup`.

### 3.2 Create an empty database named `MathQuestAI`

> **Skip this step** if you used **Option B (Docker)** — `POSTGRES_DB` already created
> it — or **Option D (hosted)**, where the provider assigns the name.

The database must be named **exactly `MathQuestAI`** — same capital letters. This is
the name the connection string in Step 4 expects.

> There is nothing magic about the name itself. It only has to **match whatever you
> put in `DATABASE_URL`**. If you deliberately use a different name, change it in both
> places and everything works the same.

**Using pgAdmin:**

1. Open pgAdmin 4 and connect to your local server (usually `PostgreSQL 15` →
   enter the `postgres` password you chose during installation).
2. In the left-hand browser tree, right-click **Databases** → **Create** →
   **Database…**
3. Set **Database** to `MathQuestAI`.
4. Set **Owner** to `postgres`.
5. Open the **Definition** tab and confirm **Encoding** is `UTF8`.
6. Click **Save**.

**Or using the command line:**

```bash
psql -U postgres -c "CREATE DATABASE \"MathQuestAI\";"
```

> **The double quotes are required.** PostgreSQL folds unquoted identifiers to
> lowercase, so `CREATE DATABASE MathQuestAI;` silently creates a database called
> `mathquestai`, and your connection string will then fail with
> `database "MathQuestAI" does not exist`.

### 3.3 Restore the backup into it

**If your file is custom-format (`.backup` / `.dump` / `.tar`):**

1. In pgAdmin, right-click the new **MathQuestAI** database → **Restore…**
2. **Format:** `Custom or tar`
3. **Filename:** browse to the backup file.
4. Open the **Data Options** tab and make sure **Do not save → Owner** is enabled if
   your local PostgreSQL user differs from the one that created the dump. This avoids
   "role does not exist" errors.
5. Click **Restore**. Watch for the green success notification.

Command-line equivalent:

```bash
pg_restore -U postgres -d MathQuestAI --no-owner --no-privileges C:/temp/mathquestai.backup
```

**If your file is plain SQL (`.sql`):**

1. In pgAdmin, select the **MathQuestAI** database, then open **Tools** →
   **Query Tool**.
2. Click the folder icon (**Open File**) and choose the `.sql` file.
3. Click **Execute** (▶ or F5).

Command-line equivalent:

```bash
psql -U postgres -d MathQuestAI -f C:/temp/mathquestai.sql
```

> Make sure you are connected to `MathQuestAI` and not `postgres` before executing —
> running the script against the wrong database is the most common mistake here.

**If you used Option B (Docker):**

The backup file lives on your machine, not inside the container, so pipe it in over
standard input:

```bash
# custom-format backup
docker exec -i mathquestai-db pg_restore -U postgres -d MathQuestAI --no-owner --no-privileges < C:/temp/mathquestai.backup

# plain .sql dump
docker exec -i mathquestai-db psql -U postgres -d MathQuestAI < C:/temp/mathquestai.sql
```

> **PowerShell users:** PowerShell doesn't support `<` input redirection, and piping
> binary data through it corrupts the file. Copy the backup into the container first
> and restore from there instead — this works in every shell:
>
> ```powershell
> docker cp C:\temp\mathquestai.backup mathquestai-db:/tmp/backup.dump
> docker exec mathquestai-db pg_restore -U postgres -d MathQuestAI --no-owner --no-privileges /tmp/backup.dump
> ```
>
> For a plain `.sql` dump, `docker cp` it the same way and run
> `docker exec mathquestai-db psql -U postgres -d MathQuestAI -f /tmp/backup.sql`.

> Note the `-i` flag (not `-it`). Without it, the file never reaches the command.

### 3.4 Verify the restore

Expand **MathQuestAI → Schemas → public → Tables** in pgAdmin. You should see
**exactly these six tables**:

```text
question_generation_requests
question_patterns
reference_questions
subjects
subtopics
topics
```

Now confirm the data actually came across. In the Query Tool, run:

```sql
SELECT 'subjects'                     AS table_name, count(*) FROM subjects
UNION ALL SELECT 'topics',                     count(*) FROM topics
UNION ALL SELECT 'subtopics',                  count(*) FROM subtopics
UNION ALL SELECT 'question_patterns',          count(*) FROM question_patterns
UNION ALL SELECT 'reference_questions',        count(*) FROM reference_questions
UNION ALL SELECT 'question_generation_requests', count(*) FROM question_generation_requests;
```

A correctly restored database returns:

| table_name | count |
| --- | --- |
| subjects | 1 |
| topics | 1 |
| subtopics | 1 |
| question_patterns | 5 |
| reference_questions | 75 |
| question_generation_requests | 15 |

Finally, confirm the content chain the application depends on:

```sql
SELECT s.name AS subject, t.name AS topic, st.name AS subtopic, qp.name AS pattern
FROM subjects s
JOIN topics t            ON t.subject_id  = s.id
JOIN subtopics st        ON st.topic_id   = t.id
JOIN question_patterns qp ON qp.subtopic_id = st.id
ORDER BY qp.name;
```

You should get five rows, all `Mathematics → Algebra → Simplify & Calculate`, with
these patterns:

```text
Apply Distributive Property
Combine Like Terms
Simplify Algebraic Fractions
Simplify and retain variables
Simplify Multi-Operation Expressions
```

> Note the subtopic is `Simplify & Calculate` with an **ampersand**. Some older
> documents in this project wrote it as "Simplify / Calculate" — that was wrong and
> has been corrected. Tests assert the ampersand spelling.

If the tables exist but the counts are all `0`, the database was created but the
backup never restored into it. Redo Step 3.3.

---

## Step 4 — Configure environment variables

Copy the template to your own local file:

```bash
cp .env.example .env.local
```

> ### ⚠️ The file must be `.env.local`
>
> `prisma.config.ts` and `tests/setup.ts` both call `config({ path: ".env.local" })`
> explicitly. A file named `.env` is **not** read by the Prisma CLI or by the test
> runner, and you will get confusing "database not found" errors while everything
> *looks* configured. `.env.local` is gitignored, so your credentials stay local.

Open `.env.local` and fill it in. There are only four variables in the entire project:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/MathQuestAI?schema=public"

AI_API_KEY=your-api-key-here
AI_MODEL=openai/gpt-oss-120b
AI_BASE_URL=https://api.groq.com/openai/v1
```

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | **Yes** | PostgreSQL connection string. |
| `AI_API_KEY` | **Yes** (for generation) | API key for your AI provider. |
| `AI_MODEL` | No | Defaults to `openai/gpt-oss-120b`. |
| `AI_BASE_URL` | No | Defaults to `https://api.groq.com/openai/v1`. |

For `DATABASE_URL`, replace `postgres` with your PostgreSQL username if it differs,
and `YOUR_PASSWORD` with the password you set when installing PostgreSQL. Keep the
database name as `MathQuestAI` and keep `?schema=public`.

> **If your password contains special characters, URL-encode them.** A raw `@`, `:`,
> `/`, `#` or `?` in the password will corrupt the connection string.
> For example `p@ss:word` becomes `p%40ss%3Aword`.
> Common encodings: `@` → `%40`, `:` → `%3A`, `/` → `%2F`, `#` → `%23`, `?` → `%3F`,
> space → `%20`.

Never commit `.env.local` and never paste your API key into chat, issues, or docs.

---

## Step 5 — Generate the Prisma Client

```bash
npx prisma generate
```

Expected output:

```text
✔ Generated Prisma Client (7.9.1) to .\lib\generated\prisma
```

**Why this step exists:** the schema's generator writes the client to
`lib/generated/prisma`, which is listed in `.gitignore`, so it never arrives with a
clone. `lib/prisma.ts` imports from `@/lib/generated/prisma/client`, and there is no
`postinstall` hook to generate it automatically.

**Run this again whenever:**

- you clone the repo or switch to a branch with a different schema
- `prisma/schema.prisma` changes
- you delete `node_modules` or `lib/generated`

If you skip it, you will see errors like `Cannot find module
'@/lib/generated/prisma/client'` on every page that touches the database.

---

## Step 6 — Configure the AI provider

MathQuestAI talks to **any OpenAI-compatible `chat/completions` endpoint**. There is
no vendor SDK — `lib/ai/http-provider.ts` makes a plain `fetch` call. Switching
providers is an `.env.local` change only; no source file is ever edited.

The three variables combine like this:

```text
POST  {AI_BASE_URL}/chat/completions
      Authorization: Bearer {AI_API_KEY}
      body: { model: {AI_MODEL}, messages: [...], response_format: { type: "json_object" } }
```

### Provider options

| Provider | `AI_BASE_URL` | Example `AI_MODEL` | Status |
| --- | --- | --- | --- |
| **Groq** (default) | `https://api.groq.com/openai/v1` | `openai/gpt-oss-120b` | ✅ Verified working in this project |
| Google Gemini (OpenAI-compatible endpoint) | `https://generativelanguage.googleapis.com/v1beta/openai` | `gemini-2.0-flash` | ⚠️ Not yet tested here |
| OpenAI | `https://api.openai.com/v1` | `gpt-4o-mini` | ⚠️ Not yet tested here |

**Recommended for new members: use Groq.** It is the configuration the project has
actually been verified against, and it has a free tier.

1. Create an account at <https://console.groq.com/>.
2. Generate an API key.
3. Put it in `.env.local` as `AI_API_KEY`.
4. Leave `AI_MODEL` and `AI_BASE_URL` at the values shown in Step 4 (or delete both
   lines — they fall back to exactly those Groq defaults).

> **Do not put a trailing slash on `AI_BASE_URL`.** It is concatenated directly with
> `/chat/completions`, so `.../v1/` produces a malformed `.../v1//chat/completions`
> URL and the request fails.

`AI_API_KEY` is the only variable that hard-fails. If it is missing, generation
returns the error `AI_API_KEY is not configured.` rather than crashing — so the app
still loads, it just cannot generate.

---

## Step 7 — Run the application

```bash
npm run dev
```

Then open <http://localhost:3000>.

Available scripts (this is the complete list):

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server on port 3000 |
| `npm run build` | Production build |
| `npm start` | Serve a production build |
| `npm run lint` | ESLint |
| `npm test` | Run all tests once |
| `npm run test:watch` | Run tests in watch mode |

> **Why `dev` is pinned to `--webpack`:** Next.js 16 defaults to Turbopack, but
> Turbopack's dev-mode PostCSS worker crashes with `STATUS_DLL_INIT_FAILED` on
> Windows once `@tailwindcss/postcss` is in play. `npm run build` still uses
> Turbopack and is unaffected. Do not remove the flag unless you have re-tested it.

---

## Step 8 — Verify your setup

The project ships four dev-only diagnostic pages. Visit them **in this order** — each
one tests one more layer, so the first failure tells you exactly what is misconfigured.

### 1. `/dev/db-check` — database + Prisma Client

<http://localhost:3000/dev/db-check>

Dumps all rows from `subjects` as JSON.

- ✅ **Pass:** you see JSON containing `"name": "Mathematics"`.
- ❌ **Empty array `[]`** → the database restored without data (revisit Step 3.4).
- ❌ **Module-not-found error** → you skipped `npx prisma generate` (Step 5).
- ❌ **Connection error** → `DATABASE_URL` is wrong, or PostgreSQL is not running.

### 2. `/dev/prompt-preview` — database context + prompt building

<http://localhost:3000/dev/prompt-preview>

Loads real context for Mathematics/Algebra and prints the selected context, the
loaded `GenerationContext`, and the final assembled prompt. **Makes no AI call**, so
it works without an API key.

- ✅ **Pass:** you see a fully rendered prompt with reference questions in it.

You can vary the output with query parameters:

```text
/dev/prompt-preview?difficulty=hard&questionType=word_problem&count=3
```

Supported: `difficulty` (`easy` | `medium` | `hard`), `questionType`
(`multiple_choice` | `fill_in_the_blank` | `word_problem` | `true_false` |
`multi_step`), `count`, `subtopicId`.

### 3. `/dev/ai-provider-check` — AI connectivity

<http://localhost:3000/dev/ai-provider-check>

Sends one small request to your configured provider. Uses a hardcoded context, so it
needs **no database** — it isolates the AI configuration.

- ✅ **Pass:** the page prints your resolved **Base URL** and **Model**, then
  `Connected: YES`, the raw provider response, and `Valid: YES`.
- ❌ `Connected: NO` with `AI_API_KEY is not configured.` → key missing from `.env.local`.
- ❌ `Connected: NO` with `...failed with status 401` → invalid key.
- ❌ `Connected: NO` with `...failed with status 404` → wrong `AI_BASE_URL` or a model
  name your provider does not offer.

### 4. `/dev/generate-questions-check` — the full pipeline

<http://localhost:3000/dev/generate-questions-check>

Runs everything end to end: database context → prompt → AI → schema validation.

- ✅ **Pass:** `Result: SUCCESS` with `Question Count: 10` and the parsed JSON.
- ❌ `FAILED at stage: prompt` → context/database problem.
- ❌ `FAILED at stage: provider` → AI connectivity (go back to check 3).
- ❌ `FAILED at stage: validation` → the model returned JSON that does not match the
  expected schema. Usually a model-quality issue; try the default Groq model.

### 5. Walk the real application

Finally, confirm the actual user flow:

`/` → choose subject/topic/subtopic → select question pattern(s), difficulty and
question type → **Generate** → wait for the real AI call → **View Questions** →
**Evaluate Results** → choose "Evaluate Against Predefined Questions" → **Proceed**
→ the evaluation report.

If all of that works, your environment is fully set up.

---

## Step 9 — Running the tests

```bash
npm test          # everything, once
npm run test:watch
```

A healthy full run reports **139 passing tests across 22 files**.

There is no separate unit/integration script, but you can target folders directly:

```bash
npx vitest run tests/unit          # no database needed
npx vitest run tests/integration   # some of these need the live database
```

| Test group | Needs a live database? | Needs an API key? |
| --- | --- | --- |
| `tests/unit/**` (all) | No | No |
| `tests/integration/database-connection.test.ts` | **Yes** | No |
| `tests/integration/dynamic-data-loading.test.ts` | **Yes** | No |
| All other `tests/integration/**` | No | No |

**No test ever makes a real AI API call** — the provider is mocked or injected as a
fake everywhere. Tests read `DATABASE_URL` from `.env.local`.

> There is no separate test database. The DB-backed tests run read-only queries
> against whatever `DATABASE_URL` points at, and assert the seeded data from Step 3.4
> is present.

---

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| `Cannot find module '@/lib/generated/prisma/client'` | Prisma Client never generated | `npx prisma generate` (Step 5) |
| Prisma CLI says the URL is missing, but your env file looks fine | Your file is named `.env`, not `.env.local` | Rename it to `.env.local` (Step 4) |
| `database "MathQuestAI" does not exist` | Created without quotes, so it became lowercase `mathquestai` | Recreate with `CREATE DATABASE "MathQuestAI";` (Step 3.2) |
| `psql: command not found` / `'psql' is not recognized` | PostgreSQL installed, but its `bin` folder isn't on PATH | Add `C:\Program Files\PostgreSQL\15\bin` to PATH (Step 3.0, Option A) |
| `password authentication failed for user "postgres"` | Wrong password, or unencoded special characters | Fix the password and URL-encode it (Step 4) |
| `unsupported version` or `server version mismatch` during restore | Your server is older than the v15 dump | Install PostgreSQL 15 or newer (Step 1) |
| `port is already allocated` / `address already in use` starting Docker | A native PostgreSQL is already using 5432 | Either stop it, or run Docker on another port (`-p 5433:5432`) and use `5433` in `DATABASE_URL` |
| `error during connect ... docker_engine` | Docker Desktop isn't running | Start Docker Desktop, then retry the command |
| Hosted DB refuses the connection or complains about SSL | Missing SSL parameter | Append `&sslmode=require` to `DATABASE_URL` (Step 3.0, Option D) |
| `/dev/db-check` returns `[]` | Database created but backup not restored into it | Redo the restore (Step 3.3) and re-verify (Step 3.4) |
| `Connected: NO` — `AI_API_KEY is not configured.` | Key missing or blank in `.env.local` | Add `AI_API_KEY` (Step 6) |
| `AI provider request failed with status 401` | Invalid or revoked API key | Regenerate the key at your provider |
| `AI provider request failed with status 404` | Wrong `AI_BASE_URL`, trailing slash, or unavailable model | Remove any trailing slash; check the model name (Step 6) |
| `Unable to reach the AI provider.` | Network, proxy, or firewall | Check connectivity to the base URL |
| Dev server crashes with `STATUS_DLL_INIT_FAILED` | Turbopack + `@tailwindcss/postcss` on Windows | Use `npm run dev` (already pins `--webpack`); don't remove the flag |
| Two integration tests fail, everything else passes | The DB-backed tests can't find the seeded data | Confirm Step 3.4's counts and the `Simplify & Calculate` spelling |
| Changed `.env.local` but nothing changed | Env files are read at startup | Restart `npm run dev` |

---

## Command cheat sheet

The complete happy path:

```bash
# 1. Clone and install
git clone https://github.com/AsiriZenith/MathQuestAI.git
cd MathQuestAI
npm install

# 2. Create the database (exact casing, quotes required)
psql -U postgres -c "CREATE DATABASE \"MathQuestAI\";"

# 3. Restore the backup you received from the project owner
pg_restore -U postgres -d MathQuestAI --no-owner --no-privileges C:/temp/mathquestai.backup
#   ...or, for a plain .sql dump:
# psql -U postgres -d MathQuestAI -f C:/temp/mathquestai.sql

# 4. Create your env file, then edit it (DATABASE_URL + AI_API_KEY)
cp .env.example .env.local

# ---------------------------------------------------------------
# Steps 2 and 3 the Docker way instead (creates the DB for you):
#
#   docker run --name mathquestai-db -e POSTGRES_PASSWORD=postgres \
#     -e POSTGRES_DB=MathQuestAI -p 5432:5432 \
#     -v mathquestai-data:/var/lib/postgresql/data -d postgres:15
#
#   docker exec -i mathquestai-db pg_restore -U postgres -d MathQuestAI \
#     --no-owner --no-privileges < C:/temp/mathquestai.backup
#
#   (both are single-line commands in the Step 3.0 / 3.3 sections)
# ---------------------------------------------------------------

# 5. Generate the Prisma Client — required, not automatic
npx prisma generate

# 6. Confirm everything works
npm test

# 7. Run it
npm run dev
```

Then verify in the browser:

```text
http://localhost:3000/dev/db-check                 → JSON with "Mathematics"
http://localhost:3000/dev/prompt-preview           → a fully assembled prompt
http://localhost:3000/dev/ai-provider-check        → Connected: YES
http://localhost:3000/dev/generate-questions-check → Result: SUCCESS
http://localhost:3000                              → the application
```

---

## Where to go next

| Document | What it covers |
| --- | --- |
| `README.md` | High-level project overview and research goals |
| `CLAUDE.md` | Working conventions, TDD approach, project rules |
| `docs/project-management/project.md` | Overall project context and state |
| `docs/project-management/database.md` | Full schema, relationships, seeded data |
| `docs/project-management/ai-generation.md` | Prompt strategy and generation pipeline |
| `docs/project-management/progress.md` | Where the project is right now |
| `docs/tasks/` | Individual task definitions |

If something in this guide is wrong or out of date, please fix it — an onboarding
guide is only useful while it stays accurate.
