# Kanban AI (working name)

A Kanban project management app. Each user signs in with Google (via Clerk) and
manages multiple isolated projects, each with its own To Do / In Progress / Done /
Shipped board and a project-scoped AI assistant that proposes board changes for the
user to confirm before anything is written.

See `PLAN.md` for the phase-by-phase build order, `docs/ARCHITECTURE.md` for how the
system fits together, `docs/DESIGN.md` for the visual contract, and
`docs/DECISIONS.md` for why the key choices (stack, auth integration, RLS approach,
AI confirm-before-execute) were made.

## Status

Intake is complete (`AGENTS.md` Status: CONFIGURED) but no application code has been
written yet — this repo currently holds only the operating policy and plan. Phase 1
in `PLAN.md` (scaffold, auth, data layer) is next.

## Stack

- Next.js (App Router)
- Supabase Postgres, Row Level Security
- Clerk (Google OAuth, native Supabase third-party auth integration)
- `@dnd-kit/react` for the board's drag-and-drop
- Anthropic API for the AI assistant

## Running this project's build

Each phase in `PLAN.md` is executed with either `prompts/02-execute-phase.md`
(GATED phases — human reviews before the next phase) or
`prompts/05-autonomous-phase.md` (AUTONOMOUS phases — human reviews when the loop
stops). See `README` "Execution modes" section of the original template, or
`PLAN.md` itself, for which mode each phase uses.

## Once Phase 1 exists: local development

This section will be filled in once the app is scaffolded (Phase 1) with the actual
install/run/env-variable steps. Until then, the commands below are placeholders for
what Phase 1 must produce:

```bash
npm install
cp .env.example .env   # fill in Clerk + Supabase + Anthropic keys
npm run dev
```

## Validation

`scripts/validate.sh` holds this project's lint, typecheck, test, and build
commands and is the only place they appear:

```bash
bash scripts/validate.sh
```

These commands assume a `package.json` with matching `lint`, `typecheck`, `test`,
and `build` scripts — created as part of Phase 1. Until Phase 1 lands, running this
script will fail with "command not found" rather than reporting unconfigured checks.
