-- Runway: dated reminders.
-- A reminder is a personal nudge on a specific date ("Follow up with Suyash on
-- the GRN data", "Check the category team's emails"). It can be ad hoc or tied
-- to a project and/or a person. Unchecked reminders roll forward: the Cockpit
-- shows every reminder with remind_on <= today that has no done_at.
--
-- Paste into Supabase Studio -> SQL Editor -> New query -> Run.
-- Safe to re-run.

create table if not exists reminder (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  remind_on date not null default current_date,
  project_id uuid references project(id) on delete set null,
  person_id uuid references person(id) on delete set null,
  done_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists reminder_remind_on_idx on reminder(remind_on);
create index if not exists reminder_open_idx on reminder(remind_on) where done_at is null;

alter table reminder enable row level security;

drop policy if exists "authenticated full access" on reminder;
create policy "authenticated full access" on reminder
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
