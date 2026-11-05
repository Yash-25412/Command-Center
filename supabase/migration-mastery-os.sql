-- Life // Mastery OS: Supabase-backed persistence for the Piano / Handstand /
-- Dragon Flag / Marathon cockpit at /mastery. Replaces the old localStorage-only
-- store so progress survives across devices and browsers, same as the rest of
-- Command Center.
-- Paste this into Supabase Studio -> SQL Editor -> New query -> Run.
-- Safe to run once; safe to re-run (uses "if not exists" / "on conflict do nothing").

-- One row holds the whole Mastery OS store (phase checks, tissue status, field
-- notes, session logs, recovery-buff state, calendar log, nav state) as jsonb.
-- Single-user app, so a single fixed-id row is enough -- no need to normalize
-- every sub-collection into its own table for this.
create table if not exists mastery_state (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table mastery_state enable row level security;

drop policy if exists "authenticated full access" on mastery_state;
create policy "authenticated full access" on mastery_state
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

insert into mastery_state (id, data) values ('singleton', '{}'::jsonb)
on conflict (id) do nothing;
