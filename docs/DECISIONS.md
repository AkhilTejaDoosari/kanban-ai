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

## ADR-006 — Board columns: To Do / In Progress / Test/Validate / Done, not Shipped

**Date:** 2026-09-08
**Status:** accepted
**Supersedes:** the column set in AGENTS.md §1 and PLAN.md Phase 3 as originally
written ("To Do / In Progress / Done / Shipped")

**Context**

During Phase 3 manual testing, the project owner found "Shipped" as a 4th-column
label confusing for a personal task tracker (it reads as a release/deploy concept,
not something every project has) and asked for a testing/validation stage instead.

**Decision**

The board's 3rd and 4th columns change: the old 3rd column ("Done") becomes
"Test/Validate" (`column_key = 'test_validate'`), and the old 4th column
("Shipped") becomes the new "Done" (`column_key = 'done'`). To Do and In Progress
are unchanged. Existing cards were remapped, not just relabeled, by
`supabase/migrations/0003_rename_board_columns.sql`: old `done` rows moved to
`test_validate`, old `shipped` rows moved to `done`.

**Alternatives considered**

- Keep "Shipped" and just rename the label — rejected: the project owner's request
  was for a genuinely different 4-stage workflow (add a testing stage), not a
  cosmetic rename.

**Consequences**

Any future migration, seed data, or documentation referencing the old
`done`/`shipped` column keys is now wrong and must use `test_validate`/`done`.
`AGENTS.md` §1, `PLAN.md` Phase 3, and `docs/ARCHITECTURE.md`'s data model section
were updated in the same commit as the code and migration.

---

## ADR-007 — Palette correction: text-muted, light-accent, light-success failed WCAG AA

**Date:** 2026-09-08
**Status:** accepted
**Supersedes:** the exact hex values recorded for these roles in `docs/DESIGN.md`
as of ADR-005

**Context**

`docs/DESIGN.md`'s non-negotiable is a 4.5:1 contrast floor for body text (3:1 for
large text/UI), in both themes. Phase 4 computed actual WCAG contrast ratios for
every text-role/surface pairing before building on top of them (rather than
assuming the intake-time palette was correct), and found three failures:

- `text muted` (`#6E7383`, identical in both themes) was only 3.56:1 against dark
  `surface` and 4.45:1 against light `background` -- a single gray cannot clear
  4.5:1 against both a near-black and a near-white surface at once, which is a
  structural flaw, not a rounding error.
- Light-theme `accent` (`#4C6FFF`) was 3.93-4.18:1 -- passes the 3:1 UI-component
  floor but fails for body-sized text (e.g. a text link or a ghost-button label).
- Light-theme `success` (`#16A34A`) was 3.10-3.30:1 -- fails even the 3:1 floor.

**Decision**

- `text muted` now differs per theme: `#848A9D` (dark), `#636776` (light) --
  each independently verified >=4.5:1 against both `background` and `surface`
  in its theme.
- Light `accent` darkened to `#4464E5` (>=4.71:1 both surfaces).
- Light `success` darkened to `#107A37` (>=5.12:1 both surfaces).
- Dark-theme accent/success/warning/danger and light-theme warning/danger were
  already compliant and are unchanged.

**Alternatives considered**

- Restrict the failing colors to large-text/decorative use only, keeping the
  original hex values -- rejected: `text-muted` is used for due dates and
  description previews at `text-xs`, which is small body text, not large text:
  the actual usage needed to pass the body-text floor, not just the UI floor.

**Consequences**

`docs/DESIGN.md`'s palette tables and `src/app/globals.css` were updated in the
same commit. Any future component using `text-muted`, or the light theme's
`accent`/`success`, is now safe by default rather than needing a manual contrast
check.

---

## ADR-008 — Livelier accent + curated label palette ("more joyful colours")

**Date:** 2026-09-08
**Status:** accepted
**Refines, does not supersede:** ADR-005 (Deep Ink / Focused Dark stays the base
identity: near-black canvas, restrained chrome, one accent used sparingly for
UI state)

**Context**

After using Phase 3's board, the project owner found the interface visually flat
and asked for "better joyful colours," explicitly invoking the `frontend-design`
skill. Two scopes were offered: (a) stay dark-first but inject more joy within
that identity, or (b) open a fresh direction mockup, like the original Phase-0
brainstorm. The project owner chose (a) — the base identity from ADR-005 stays;
only the color system gets richer.

Two concrete gaps drove the "flat" feeling: every card's priority accent and
every focus ring used the same fairly muted periwinkle-blue, and -- more
significantly -- `createLabelAction`'s caller always passed the same hardcoded
default color, so **every label a user ever created was visually identical**,
regardless of name. A board with several labels looked monochrome no matter
how much the user tried to categorize it with labels.

**Decision**

- Accent brightens from `#7C9CFF`/`#4464E5` (dark/light) to `#8B7FFF`/`#685FBF`
  -- a livelier violet-indigo, still >=4.5:1 compliant in both themes (verified:
  5.27-5.77:1 dark, 4.97-5.28:1 light).
- New labels cycle through a curated 8-color palette (`LABEL_COLORS` in
  `src/lib/board-constants.ts`) instead of one fixed default -- the color-picking
  decision moved from `CardModal` (presentation) to `Board` (which knows how many
  labels already exist, via `labels.length % LABEL_COLORS.length`). Every swatch
  is independently verified >=4.5:1 against `#12141A` chip text.
- Background, surface, border, and text-primary/muted are unchanged -- the calm
  near-black canvas from ADR-005 stands.

**Alternatives considered**

- A full new visual direction (option b above) -- not chosen; the project owner
  picked the narrower refinement.
- Giving every label a random color -- rejected in favor of a fixed, curated,
  contrast-verified rotation: predictable, accessible, and avoids two
  low-contrast or visually-clashing colors landing next to each other.

**Consequences**

Any future palette addition (e.g. a 9th label color) must be independently
contrast-checked against `#12141A` before joining `LABEL_COLORS`, the same way
these eight were. `docs/DESIGN.md`'s palette tables and label-palette section
were updated in the same commit.

---

## ADR-009 — Assistant history session-only; model openai/gpt-oss-120b via Groq

**Date:** 2026-09-08
**Status:** accepted

**Context**

Phase 5 required a planning-time decision: persist per-project conversation
history in Postgres or keep it session-only. A history table needs a schema,
RLS policies (read + write per ADR-003), and retention semantics — significant
surface for a v1 assistant whose core promise is propose/confirm, not memory.

The phase was originally planned against the Anthropic API. During planning, the
project owner directed a switch to Groq (free tier) over Anthropic (paid), with
model `openai/gpt-oss-120b` (the model Groq's own tool-use docs use, verified via
context7 at build time), key `GROQ_API_KEY` (already in `.env.example`), SDK
`groq-sdk`. Earlier ADRs (notably ADR-004) name Anthropic; this entry records the
as-built provider. `docs/ARCHITECTURE.md` was corrected to Groq in the same
commit; append-only prior entries are left as written.

**Decision**

Conversation history is React state inside the assistant panel — session-only,
cleared on navigation/reload. Model: `openai/gpt-oss-120b` via Groq (`groq-sdk`,
`GROQ_API_KEY`), verified via context7 at build time.

**Alternatives considered**

- `assistant_messages` table scoped by `project_id` with full RLS — rejected
  for v1: doubles the phase's schema/policy/test surface for a feature no
  success criterion requires. Revisit if users ask for persistent threads.

**Consequences**

Reloading the project page starts a fresh conversation. A future persistence
phase must add the table, RLS read+write policies, and cross-user tests per
ADR-003 before storing anything.

---
