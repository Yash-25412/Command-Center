-- One-time migration: adds support for assigning multiple people to one task.
-- Paste this into Supabase Studio -> SQL Editor -> New query -> Run.
-- Safe to run once; safe to re-run (uses "if not exists" / "on conflict do nothing").

create table if not exists task_assignee (
  task_id uuid not null references task(id) on delete cascade,
  person_id uuid not null references person(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (task_id, person_id)
);

create index if not exists task_assignee_task_idx on task_assignee(task_id);
create index if not exists task_assignee_person_idx on task_assignee(person_id);

alter table task_assignee enable row level security;

drop policy if exists "authenticated full access" on task_assignee;
create policy "authenticated full access" on task_assignee
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Carry every task's existing single doer over as its first assignee.
insert into task_assignee (task_id, person_id)
select id, doer_id from task where doer_id is not null
on conflict do nothing;
