-- projects: the root of isolation (docs/ARCHITECTURE.md). owner_user_id is the
-- Clerk user id, sourced from the native Clerk<->Supabase integration's JWT
-- (ADR-002) -- not a hand-rolled JWT template.
create table projects (
  id uuid primary key default gen_random_uuid(),
  owner_user_id text not null default (auth.jwt()->>'sub'),
  name text not null,
  created_at timestamptz not null default now()
);

alter table projects enable row level security;

-- ADR-003: every table gets explicit SELECT/INSERT/UPDATE/DELETE policies --
-- read-only policies with writes left open are the isolation bug this guards.

create policy "Owner can select their own projects"
on "public"."projects"
for select
to authenticated
using (
  (select auth.jwt()->>'sub') = owner_user_id
);

create policy "Owner can insert their own projects"
on "public"."projects"
as permissive
for insert
to authenticated
with check (
  (select auth.jwt()->>'sub') = owner_user_id
);

create policy "Owner can update their own projects"
on "public"."projects"
as permissive
for update
to authenticated
using (
  (select auth.jwt()->>'sub') = owner_user_id
)
with check (
  (select auth.jwt()->>'sub') = owner_user_id
);

create policy "Owner can delete their own projects"
on "public"."projects"
as permissive
for delete
to authenticated
using (
  (select auth.jwt()->>'sub') = owner_user_id
);
