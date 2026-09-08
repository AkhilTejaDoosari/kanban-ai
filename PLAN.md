# Plan

Status: CONFIGURED — populated by `prompts/01-project-intake.md` on 2026-09-06.

Phases are ordered by default. Do not start a phase until its declared dependencies
are complete. Phases that `PLAN.md` explicitly marks independent may proceed in
parallel — order in this file is presentation, not an implied dependency.

Update the status marker on every phase as it changes.

Each phase also declares its execution mode. Decide this during planning, while you
are weighing the phase's risk — not later, at the moment you reach for a prompt.
An agent may not change a phase's mode; see `AGENTS.md` §10.

---

## Phase Template

### Phase N — <name>

**Status:** not started | in progress | blocked | complete

**Execution mode:** GATED | AUTONOMOUS

**Dependencies:** <phase numbers, or `none`>

**Goal**

<One sentence. What is true after this phase that was not true before.>

**Deliverables**

- <artifact>
- <artifact>

**Capabilities needed** (see `AGENTS.md` §4)

- <e.g. current documentation lookup, TDD, security review>

**Success criteria**

- [ ] <observable, binary, specific>
- [ ] <observable, binary, specific>

**Documents to update on completion** (see `AGENTS.md` §5)

- <e.g. docs/ARCHITECTURE.md, docs/DECISIONS.md>

---

## Phases

### Phase 1 — Foundation: scaffold, auth, data layer

**Status:** complete

**Execution mode:** GATED

**Dependencies:** none

**Goal**

A signed-in user (via Clerk, Google OAuth) hits an empty but real Next.js app backed by a Supabase Postgres database, with the Clerk↔Supabase native third-party auth integration wired so RLS can key off the Clerk user id.

**Deliverables**

- Next.js (App Router, current stable version confirmed via context7 at build time) app scaffolded with `package.json` scripts matching `scripts/validate.sh` (`lint`, `typecheck`, `test`, `build`).
- Clerk integrated with Google OAuth as a sign-in method; `await auth()` guarding all app routes.
- Supabase project created; Clerk's native Supabase third-party auth integration configured (Clerk Dashboard integration + Supabase Dashboard third-party provider) — the deprecated JWT-template method is not used.
- `projects` table created with an owner-scoped RLS policy covering `SELECT`, `INSERT`, `UPDATE`, and `DELETE` (not read-only) — a user must be unable to create a row under another user's ownership, not just unable to read one.
- Base app shell: top nav placeholder, dark/light theme tokens wired (values from `docs/DESIGN.md`), no real pages yet beyond a signed-in placeholder.

**Capabilities needed** (see `AGENTS.md` §4)

- current documentation lookup (Next.js version, Clerk-Supabase integration steps)
- security review (RLS policies, auth wiring)
- test-driven development (RLS policy behavior, auth guards)

**Success criteria**

- [x] A user can sign in with Google via Clerk and reach the app shell. (Manually verified 2026-09-08.)
- [x] A second Supabase test user cannot read or write a row owned by the first user (verified by a test that attempts both a cross-user `SELECT` and a cross-user `INSERT`/`UPDATE`, and expects both to fail). (Verified 2026-09-08: `src/lib/supabase/projects-rls.integration.test.ts` run against the real `kanban-ai` Supabase project with two real Clerk session JWTs minted via the Clerk Backend SDK — 3/3 tests passed.)
- [x] `bash scripts/validate.sh` runs lint, typecheck, test, and build and all configured checks pass. (Verified 2026-09-08: 4/4 checks passed.)

**Documents to update on completion**

- `docs/ARCHITECTURE.md`, `docs/DECISIONS.md` (if implementation diverges from the recorded ADRs)

---

### Phase 2 — Projects and home page

**Status:** complete

**Execution mode:** GATED

**Dependencies:** Phase 1

**Goal**

A signed-in user can create, see, and switch between multiple isolated projects.

**Deliverables**

- Home page (`/`) listing the signed-in user's own projects only, with a create-project action.
- `/projects/[id]` route stub (full board comes in Phase 3) that 404s/redirects for a project the user doesn't own.
- Project switcher dropdown in the top nav (exact visual treatment left to `frontend-design` in Phase 4; functionally: shows current project, lists the user's projects, links back home).
- RLS policies for `projects` re-verified end-to-end through the app (not just at the DB layer) for read and write paths.

**Capabilities needed**

- security review (ownership checks on every route/action)
- test-driven development

**Success criteria**

- [x] Creating a project as user A makes it appear on user A's home page and not on user B's. (Manually verified 2026-09-08 with two real Google accounts.)
- [x] Navigating to another user's project id directly (URL manipulation) does not expose that project's data. (`/projects/[id]` calls `notFound()` when `getProject()` returns null, which RLS guarantees for a non-owned id — same mechanism proven by Phase 1's integration test; also manually verified.)
- [x] `bash scripts/validate.sh` passes. (Verified 2026-09-08: 4/4 checks passed, 20 tests.)

**Documents to update on completion**

- `docs/ARCHITECTURE.md`

---

### Phase 3 — Kanban board core

**Status:** complete

**Execution mode:** GATED

**Dependencies:** Phase 2

**Goal**

Inside a project, a user has a working Kanban board: four columns, cards with title/description/due date/priority/labels, draggable within and across columns, all scoped and isolated to that project.

**Deliverables**

- `cards`, `labels`, `card_labels` tables with RLS policies (read and write) scoped through `project_id` ownership.
- Board UI: To Do / In Progress / Test/Validate / Done columns using `@dnd-kit/react`, cross-container sortable drag-and-drop with position persisted on drop, optimistic UI with rollback on server rejection.
- Card create/edit/delete UI covering all v1 fields (title, description, due date, priority, labels).

**Capabilities needed**

- current documentation lookup (`@dnd-kit/react` multi-container pattern)
- security review (new tables' RLS read/write policies)
- test-driven development

**Success criteria**

- [x] A card can be created, edited, deleted, and dragged between all four columns, with the new position persisted after a page reload. (Manually verified 2026-09-08, including a real bug found and fixed in review: a stale `column_key` after optimistic cross-column moves was causing drags to revert on reload.)
- [x] A user cannot read or write another user's project's cards/labels via direct API calls (tested, not just assumed from RLS). (Verified 2026-09-08: `src/lib/supabase/cards-labels-rls.integration.test.ts` run against the real `kanban-ai` Supabase project with two real Clerk session JWTs — 5/5 tests passed, covering cross-user read/insert/update on `cards`, read on `labels`, and insert on `card_labels`.)
- [x] `bash scripts/validate.sh` passes. (Verified 2026-09-08: 4/4 checks passed, 70 tests.)

**Documents to update on completion**

- `docs/ARCHITECTURE.md`

---

### Phase 4 — Visual design pass

**Status:** complete

**Execution mode:** AUTONOMOUS

**Dependencies:** Phase 3

**Goal**

The app matches the confirmed Deep Ink visual direction (dark-first, with a light theme) across all screens built so far, including the project switcher's final visual treatment.

**Deliverables**

- Full application of `docs/DESIGN.md`'s palette, typography, spacing, and component conventions to nav, home page, project switcher, and board.
- Light/dark theme toggle, both meeting the WCAG AA contrast floor.
- Empty, loading, and error states for the project list and board.

**Capabilities needed**

- frontend design

**Success criteria**

- [x] Every screen built in Phases 1–3 renders using `docs/DESIGN.md` tokens in both themes with no unstyled/default-browser elements. (Manually verified 2026-09-08 in both themes via the new toggle: home, project switcher dropdown, board, card modal, empty/loading/error states.)
- [x] Contrast floor verified (4.5:1 body text, 3:1 large text) in both themes. (Computed WCAG ratios for every token pair before building on them; found and fixed 3 real failures in the intake-time palette — see ADR-007. Re-verified after ADR-008's livelier accent + label palette.)
- [x] `bash scripts/validate.sh` passes. (Verified 2026-09-08: 4/4 checks passed, 92 tests.)

**Documents to update on completion**

- `docs/DESIGN.md` (if the pass reveals the recorded tokens need adjustment)

---

### Phase 5 — AI assistant (propose / confirm)

**Status:** complete

**Execution mode:** GATED

**Dependencies:** Phase 3

**Goal**

A project-scoped AI chat panel that can propose board changes (create/move/update/delete a card, add a label) as a preview the user must explicitly confirm before anything is written — the assistant never mutates data on its own.

**Deliverables**

- Fixed-width right panel on `/projects/[id]` with a chat UI, using the Anthropic API tool-use loop scoped to the current project's board state.
- Tool calls rendered as a confirm/reject preview in-panel; execution only happens server-side after explicit confirm, through the same RLS-backed mutation paths as the manual UI (no bypass).
- Decision, made during this phase's planning rather than assumed: whether v1 persists per-project conversation history in Postgres or keeps it session-only. Record the choice in `docs/DECISIONS.md`.

**Capabilities needed**

- current documentation lookup (Anthropic API tool-use shape, current model id)
- security review (tool execution path must respect RLS/ownership exactly like manual mutations)
- test-driven development

**Success criteria**

- [x] Asking the assistant to move/create/edit a card produces a preview, not an immediate change. (Verified 2026-09-08: `src/components/assistant/assistant-panel.test.tsx` — "shows a preview with Confirm/Reject instead of changing the board".)
- [x] Confirming the preview performs exactly the previewed mutation; rejecting performs none. (Verified 2026-09-08: `assistant-panel.test.tsx` — "confirm executes the previewed mutation; reject executes nothing" and "reject performs no mutation".)
- [x] The assistant cannot be prompted into affecting a project it wasn't scoped to (tested). (Verified 2026-09-08: `src/app/actions/assistant.test.ts` — "drops tool calls referencing cards outside the project" and "ignores a tool call smuggled in for another project"; scope enforced via `validateProposalInput` in `src/lib/assistant/tools.ts`.)
- [x] `bash scripts/validate.sh` passes. (Verified 2026-09-08: 4/4 checks passed — lint, typecheck, 103 tests passed (11 skipped), build.)

**Documents to update on completion**

- `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`

---

### Phase 6 — Testing and hardening

**Status:** complete

**Execution mode:** AUTONOMOUS

**Dependencies:** Phase 3, Phase 5

**Goal**

The core flows are covered by automated tests, and error handling matches the AGENTS.md §7 baseline (no leaked internals to users).

**Deliverables**

- Vitest + Testing Library coverage for board/card logic (position calculation, RLS-adjacent access checks at the app layer).
- Playwright coverage for: sign in, create a project, move a card, AI proposes and user confirms an action.
- Audit of user-facing error messages across the app for leaked stack traces/queries/paths.

**Capabilities needed**

- test-driven development
- verification

**Success criteria**

- [x] `npm test` and the Playwright suite both pass in CI-equivalent local run. (Verified 2026-09-08: `npm test` — 105 tests passed, 11 skipped (gated integration tests), 0 failed. `npm run test:e2e` — 6/6 passed twice in a row against the real dev server, real Supabase project, real Clerk sign-in (Testing Token bypass — no real Google OAuth), and real Groq API: sign-in reaches the projects page, create-project opens a board, dragging a card between columns persists after reload, and the assistant proposes a move as a preview that is confirmed into exactly that move. Each E2E spec creates and deletes its own project, so the real account this ran against was left clean.)
- [x] No user-facing error message in the audited surfaces exposes a stack trace, raw query, or internal file path. (Audited 2026-09-08: every `throw new Error(...)` in `src/lib/supabase/*.ts` and `src/app/actions/*.ts` uses a fixed generic message — "Could not load cards.", "Could not get a suggestion.", etc. — never the underlying Supabase/Groq error. Both `src/app/error.tsx` and `src/app/projects/[id]/error.tsx` render fixed copy and never read `error.message`. No changes were needed.)
- [x] `bash scripts/validate.sh` passes with all four checks configured and green. (Verified 2026-09-08: lint, typecheck, test, build all PASS — "VALIDATION PASSED (4 checks)".)

Building and running the real E2E suite (not just writing it) surfaced a genuine bug no mocked unit test could see: confirming an AI-proposed move wrote to the database correctly but never updated the on-screen board (`Board` and `AssistantPanel` are sibling components with independent state and no sync path). Fixed by having the assistant panel call `router.refresh()` after a confirmed mutation and having `Board` resync its state from props when they change — see the `fix:` commit on this phase's branch for detail, and `AGENTS.md` §5/§8 on why this is exactly what Phase 6 is for.

**Documents to update on completion**

- `README.md` (how to run the test suites) — done
- `docs/DECISIONS.md` — ADR-010 (E2E testing strategy: Clerk Testing Token bypass, real Groq calls, kept out of `validate.sh`)
