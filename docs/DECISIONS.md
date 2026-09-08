# Decisions

Append-only. Newest last. One entry per choice a future reader would question.

Do not delete an entry when it is reversed — add a new one that supersedes it and
mark the old entry `Superseded by ADR-NNN`. The reversal history is the point.

Required by `AGENTS.md` §5: a change that makes a questionable choice adds an entry
in the same commit.

---

## ADR-000 — Template

**Date:**
**Status:** accepted | superseded by ADR-NNN

**Context**

<What forced a choice. Constraints in play.>

**Decision**

<What was chosen, stated plainly.>

**Alternatives considered**

- <option> — rejected because <reason>

**Consequences**

<What this makes easy. What this makes hard. What we accept as a cost.>

---

## ADR-001 — Stack: Next.js + Supabase + Clerk

**Date:** 2026-09-06
**Status:** accepted

**Context**

Building a Kanban app with per-user, multi-project data that must be isolated
between projects and between users, plus an AI assistant that needs server-side
access to that data. Needed a stack fast to build against with strong data-isolation
guarantees.

**Decision**

Next.js (App Router) for frontend + API, Supabase Postgres for data with Row Level
Security as the isolation mechanism, Clerk for authentication (Google OAuth).

**Alternatives considered**

- Next.js + Prisma against a self-hosted/managed Postgres instance — rejected for
  v1 because it pushes isolation enforcement entirely into application code with no
  database-level backstop, and adds operational surface (hosting the DB) the
  project doesn't need yet.

**Consequences**

Gets RLS-backed isolation "for free" at the schema level. Couples the project to
Supabase and Clerk as managed services. Requires the Clerk↔Supabase integration
(see ADR-002) to work correctly for RLS to actually see the right user id.

---

## ADR-002 — Clerk↔Supabase: native third-party auth integration, not JWT templates

**Date:** 2026-09-06
**Status:** accepted

**Context**

Supabase historically integrated with third-party auth providers like Clerk via a
custom JWT template Clerk would mint and Supabase would validate against a shared
secret. Current documentation (checked via context7 at intake time) confirms this
JWT-template method is deprecated as of 2025-04-01, replaced by a native
integration: Clerk Dashboard exposes a Clerk domain for the "Supabase integration",
and that domain is registered in the Supabase Dashboard as a third-party auth
provider — no shared JWT secret, no manual token-template maintenance.

**Decision**

Use Clerk's native Supabase third-party auth integration. Server-side Supabase
clients are created per-request carrying the Clerk session; RLS policies read the
Clerk user id from `auth.jwt()` claims supplied through that integration.

**Alternatives considered**

- JWT template integration — rejected: officially deprecated, and requires sharing
  Supabase's JWT secret with Clerk, a weaker security posture than the native
  integration.

**Consequences**

RLS policies are written against `auth.jwt()` claims sourced from this integration,
not a hand-rolled template — Phase 1 must set this up correctly before any RLS
policy is written, since the policies depend on it.

---

## ADR-003 — RLS enforces isolation for both reads and writes

**Date:** 2026-09-06
**Status:** accepted

**Context**

Data isolation between projects and between users is a hard requirement. A common
mistake is to write RLS `SELECT` policies but leave `INSERT`/`UPDATE` unrestricted
or under-restricted, letting a client write a row into another user's project even
though they can't read it back.

**Decision**

Every table (`projects`, `cards`, `labels`, `card_labels`) gets explicit RLS
policies covering `SELECT`, `INSERT`, `UPDATE`, and `DELETE`, each checking
ownership through the `projects.owner_user_id = auth.jwt()` chain — not read-only
policies with writes left open.

**Alternatives considered**

- Application-layer ownership checks only — rejected: a missed filter in one query
  path becomes a cross-user data leak or corruption with no backstop.

**Consequences**

Every new table added later must repeat this pattern (read AND write policies) or
isolation silently regresses for that table. Phase success criteria in `PLAN.md`
explicitly test cross-user writes, not just cross-user reads, to catch this.

---

## ADR-004 — AI assistant proposes, never silently executes

**Date:** 2026-09-06
**Status:** accepted

**Context**

The AI assistant can suggest tool calls (create/move/edit/delete a card) via the
Anthropic API's tool-use loop. Letting it execute those directly is faster but means
a model mistake or an adversarial prompt could mutate a user's project data without
their intent.

**Decision**

Tool calls the assistant wants to make are rendered as an in-panel preview
(diff-like: "Move 'X' to Done") with explicit Confirm/Reject controls. The server
only performs the mutation after the user confirms, through the same RLS-backed
Route Handlers used by manual edits — the AI has no separate, more-trusted write
path.

**Alternatives considered**

- Direct execution ("chat + actions" with no confirm step) — considered during
  intake brainstorming but explicitly rejected by the project owner in favor of the
  confirm/reject preview.

**Consequences**

Every AI-proposed action needs a structured, previewable representation (not just
free text), which is more UI work than a plain chat-executes-tools loop, but removes
an entire class of "the AI did something I didn't want" incidents.

---

## ADR-005 — Visual direction: Deep Ink / Focused Dark

**Date:** 2026-09-06
**Status:** accepted

**Context**

`docs/PALETTES.md` in this repo is an unfilled template — no pre-built palette
families to choose from. The product requirement was "premium, modern, clean,
intentional, not generic AI-SaaS." Three original directions were mocked up
(Warm Neutral/Editorial, Deep Ink/Focused Dark, Crisp Monochrome) and reviewed
visually during brainstorming.

**Decision**

Deep Ink / Focused Dark: near-black surfaces, cool indigo accent, dark-first with a
derived light theme (both themes required, per explicit confirmation). Full token
values recorded in `docs/DESIGN.md`.

**Alternatives considered**

- Warm Neutral/Editorial — not chosen; reads closer to a productivity/notes tool
  than a focused work-tracking dashboard.
- Crisp Monochrome — not chosen; the zero-decoration Swiss-poster feel was judged
  less distinctive for this product than the focused-dark direction.

**Consequences**

Sets `docs/DESIGN.md` as the binding visual contract for Phase 4. Committing to
both dark and light themes roughly doubles the states each component needs
covering, versus a dark-only decision.

---
