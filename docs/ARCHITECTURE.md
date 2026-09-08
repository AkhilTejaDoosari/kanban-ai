# Architecture

Authoritative answer to "how does this system work". If code contradicts this file,
one of them is wrong and both get fixed in the same commit (`AGENTS.md` §5).

## System overview

A Next.js (App Router) app is the whole system: server-rendered pages and Route
Handlers for mutations, no separate backend service. Clerk owns identity and Google
OAuth sign-in. Supabase Postgres is the data store; Clerk's native "third-party
auth" integration lets the server-side Supabase client carry the Clerk session, so
Postgres Row Level Security policies can authorize every query directly against the
signed-in user's Clerk id — isolation between users and between a user's own
projects is enforced by the database, not by application-level filtering alone. The
AI assistant is a chat panel that calls the Anthropic API with a tool-use loop; tool
calls it wants to make are previewed to the user and only executed, through the same
RLS-backed mutation paths as manual edits, after explicit confirmation.

## Components

| Component | Responsibility | Talks to |
|---|---|---|
| Clerk | User identity, Google OAuth sign-in, session issuance | Next.js app (via `@clerk/nextjs`), Supabase (via native third-party auth integration) |
| Next.js app (Server Components + Route Handlers) | Renders UI, enforces `await auth()` on every route, performs mutations | Clerk, Supabase |
| Supabase Postgres | Stores projects/cards/labels, enforces RLS | Next.js app (server-side client per request, carrying the Clerk session) |
| Board UI (`@dnd-kit/react`) | Client-side drag-and-drop, optimistic reordering | Route Handlers (persist position) |
| AI assistant panel | Project-scoped chat; proposes tool calls, never executes without confirm | Anthropic API (chat + tool-use), Route Handlers (execute confirmed action) |

## Data model

- `projects` — owned by a Clerk user id; the root of isolation. Everything else
  hangs off a `project_id`.
- `cards` — belong to exactly one project; carry column (`todo` / `in_progress` /
  `done` / `shipped`), title, description, due date, priority, and an ordering
  position within their column.
- `labels` — belong to a project; `card_labels` joins cards to labels
  (many-to-many).

A project's data is never queryable or writable by another user, and one project's
cards/labels are never visible from another project — both enforced by RLS, not
just by the UI only ever asking for the "right" `project_id`.

## External services

| Service | Used for | Failure behavior |
|---|---|---|
| Clerk | Authentication, Google OAuth, session/JWT issuance | Unauthenticated requests are redirected to sign-in; no route renders without a valid session |
| Supabase (Postgres) | All persisted data, RLS enforcement | A failed query surfaces a generic "couldn't save/load that" to the user; no query text or stack trace is shown |
| Anthropic API | AI assistant chat + tool-use | A failed AI call degrades the assistant panel to an error state; the board itself is unaffected since AI actions never write until confirmed |

## Boundaries

- Authorization is enforced at the database layer (RLS on every table, covering
  `SELECT`, `INSERT`, `UPDATE`, `DELETE`) so a bug in application code cannot leak
  or corrupt another user's data.
- Every mutation — manual drag-and-drop, card CRUD, or an AI-confirmed action —
  goes through the same server-side Route Handlers; none of them trust a
  client-supplied `project_id`/`card_id` without the RLS-backed query re-checking
  ownership.
- The AI assistant is explicitly not a trusted actor: its proposed tool calls are
  data (a suggestion to render as a preview), never executed directly. Confirmation
  is a real user action, not implied by the assistant's own output.
- User-facing errors never include stack traces, raw queries, or internal file
  paths (`AGENTS.md` §7).
