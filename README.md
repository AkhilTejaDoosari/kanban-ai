# Kanban AI (working name)

A Kanban project management app. Each user signs in with Google (via Clerk) and
manages multiple isolated projects, each with its own To Do / In Progress /
Test/Validate / Done board and a project-scoped AI assistant that proposes board
changes for the user to confirm before anything is written.

See `PLAN.md` for the phase-by-phase build order, `docs/ARCHITECTURE.md` for how the
system fits together, `docs/DESIGN.md` for the visual contract, and
`docs/DECISIONS.md` for why the key choices (stack, auth integration, RLS approach,
AI confirm-before-execute) were made.

## Status

Phases 1–5 are complete: auth + data layer, projects, the Kanban board, the visual
design pass, and the AI assistant. Phase 6 (testing and hardening) is in progress.
See `PLAN.md` for details and success-criteria evidence.

## Stack

- Next.js (App Router)
- Supabase Postgres, Row Level Security
- Clerk (Google OAuth, native Supabase third-party auth integration)
- `@dnd-kit/react` for the board's drag-and-drop
- Groq API (`groq-sdk`, model `openai/gpt-oss-120b`) for the AI assistant — see
  `docs/DECISIONS.md` ADR-009

## Local development

```bash
npm install
cp .env.example .env.local   # fill in Clerk, Supabase, and Groq keys
npm run dev
```

`.env.example` documents every variable, including which ones are required just to
run the app versus which only gate a specific test suite (e.g. the cross-user RLS
integration tests, the Playwright E2E suite).

## Validation

`scripts/validate.sh` holds this project's lint, typecheck, test, and build
commands and is the only place they appear:

```bash
bash scripts/validate.sh
```

## Testing

Two separate suites:

- **`npm test`** — Vitest + Testing Library. Fast, runs against mocks; part of
  `scripts/validate.sh`. A few specs are real cross-user RLS integration tests
  (`src/lib/supabase/*-rls.integration.test.ts`) that hit the real Supabase project
  with two real Clerk session JWTs — they're skipped automatically unless
  `SUPABASE_TEST_URL`, `SUPABASE_TEST_PUBLISHABLE_KEY`,
  `SUPABASE_TEST_USER_A_JWT`, and `SUPABASE_TEST_USER_B_JWT` are set.
- **`npm run test:e2e`** — Playwright, covering sign in, create a project, move a
  card, and the AI assistant proposing and the user confirming an action. Runs
  against a real local dev server, the real Supabase project, and the real Groq
  API. Auth uses Clerk's Testing Token bypass (no real Google OAuth, no real
  Google credentials — see `docs/DECISIONS.md` ADR-010), so it needs
  `E2E_CLERK_USER_EMAIL` set to an existing signed-up user's email in the Clerk
  instance; the suite skips itself with a clear message when that's unset. Not
  part of `scripts/validate.sh` — see ADR-010 for why.
