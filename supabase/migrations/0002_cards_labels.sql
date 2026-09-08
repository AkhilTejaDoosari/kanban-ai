-- cards, labels, card_labels: scoped to a project, which is scoped to its
-- owner (docs/ARCHITECTURE.md). Ownership is chained through project_id, not
-- duplicated onto every table, so every RLS policy here re-derives it via an
-- EXISTS join back to `projects` (ADR-003: read AND write policies, every
-- table).

create table cards (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  column_key text not null check (column_key in ('todo', 'in_progress', 'done', 'shipped')),
  title text not null,
  description text,
  due_date date,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index cards_project_id_idx on cards (project_id);

alter table cards enable row level security;

create policy "Owner can select their project's cards"
on "public"."cards"
for select
to authenticated
using (
  exists (
    select 1 from projects
    where projects.id = cards.project_id
      and projects.owner_user_id = (select auth.jwt()->>'sub')
  )
);

create policy "Owner can insert cards into their own project"
on "public"."cards"
as permissive
for insert
to authenticated
with check (
  exists (
    select 1 from projects
    where projects.id = cards.project_id
      and projects.owner_user_id = (select auth.jwt()->>'sub')
  )
);

create policy "Owner can update their project's cards"
on "public"."cards"
as permissive
for update
to authenticated
using (
  exists (
    select 1 from projects
    where projects.id = cards.project_id
      and projects.owner_user_id = (select auth.jwt()->>'sub')
  )
)
with check (
  exists (
    select 1 from projects
    where projects.id = cards.project_id
      and projects.owner_user_id = (select auth.jwt()->>'sub')
  )
);

create policy "Owner can delete their project's cards"
on "public"."cards"
as permissive
for delete
to authenticated
using (
  exists (
    select 1 from projects
    where projects.id = cards.project_id
      and projects.owner_user_id = (select auth.jwt()->>'sub')
  )
);

create table labels (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  name text not null,
  color text not null default '#7c9cff',
  created_at timestamptz not null default now()
);

create index labels_project_id_idx on labels (project_id);

alter table labels enable row level security;

create policy "Owner can select their project's labels"
on "public"."labels"
for select
to authenticated
using (
  exists (
    select 1 from projects
    where projects.id = labels.project_id
      and projects.owner_user_id = (select auth.jwt()->>'sub')
  )
);

create policy "Owner can insert labels into their own project"
on "public"."labels"
as permissive
for insert
to authenticated
with check (
  exists (
    select 1 from projects
    where projects.id = labels.project_id
      and projects.owner_user_id = (select auth.jwt()->>'sub')
  )
);

create policy "Owner can update their project's labels"
on "public"."labels"
as permissive
for update
to authenticated
using (
  exists (
    select 1 from projects
    where projects.id = labels.project_id
      and projects.owner_user_id = (select auth.jwt()->>'sub')
  )
)
with check (
  exists (
    select 1 from projects
    where projects.id = labels.project_id
      and projects.owner_user_id = (select auth.jwt()->>'sub')
  )
);

create policy "Owner can delete their project's labels"
on "public"."labels"
as permissive
for delete
to authenticated
using (
  exists (
    select 1 from projects
    where projects.id = labels.project_id
      and projects.owner_user_id = (select auth.jwt()->>'sub')
  )
);

create table card_labels (
  card_id uuid not null references cards (id) on delete cascade,
  label_id uuid not null references labels (id) on delete cascade,
  primary key (card_id, label_id)
);

create index card_labels_card_id_idx on card_labels (card_id);
create index card_labels_label_id_idx on card_labels (label_id);

alter table card_labels enable row level security;

create policy "Owner can select their own card_labels"
on "public"."card_labels"
for select
to authenticated
using (
  exists (
    select 1 from cards
    join projects on projects.id = cards.project_id
    where cards.id = card_labels.card_id
      and projects.owner_user_id = (select auth.jwt()->>'sub')
  )
);

create policy "Owner can attach labels to their own cards"
on "public"."card_labels"
as permissive
for insert
to authenticated
with check (
  exists (
    select 1 from cards
    join projects on projects.id = cards.project_id
    where cards.id = card_labels.card_id
      and projects.owner_user_id = (select auth.jwt()->>'sub')
  )
  and exists (
    select 1 from labels
    join projects on projects.id = labels.project_id
    where labels.id = card_labels.label_id
      and projects.owner_user_id = (select auth.jwt()->>'sub')
  )
);

create policy "Owner can remove labels from their own cards"
on "public"."card_labels"
as permissive
for delete
to authenticated
using (
  exists (
    select 1 from cards
    join projects on projects.id = cards.project_id
    where cards.id = card_labels.card_id
      and projects.owner_user_id = (select auth.jwt()->>'sub')
  )
);
