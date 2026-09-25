-- Command Center schema
-- Paste this whole file into Supabase Studio -> SQL Editor -> New query -> Run.
-- Safe to re-run: it drops and recreates its own tables only.

drop table if exists capture cascade;
drop table if exists entry cascade;
drop table if exists link cascade;
drop table if exists milestone cascade;
drop table if exists routine cascade;
drop table if exists task cascade;
drop table if exists project cascade;
drop table if exists category cascade;
drop table if exists person cascade;

create table person (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_me boolean not null default false,
  role text,
  active boolean not null default true,
  hue int not null default 200,
  created_at timestamptz not null default now()
);

create table category (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text not null default '#6b675e',
  created_at timestamptz not null default now()
);

create table project (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  objective text default '',
  status text not null default 'active' check (status in ('active','paused','done','cancelled')),
  priority text not null default 'med' check (priority in ('high','med','low')),
  owner_id uuid references person(id) on delete set null,
  start_date date,
  target_date date,
  health_override text check (health_override in ('green','amber','red')),
  pinned boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

create table milestone (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references project(id) on delete cascade,
  name text not null,
  date date,
  done_at timestamptz,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table task (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  project_id uuid references project(id) on delete set null,
  doer_id uuid references person(id) on delete set null,
  category_id uuid references category(id) on delete set null,
  status text not null default 'planned' check (status in ('planned','active','waiting','blocked','review','done','cancelled')),
  priority text not null default 'med' check (priority in ('high','med','low')),
  start_date date,
  due_date date,
  next_action text default '',
  waiting_on text,
  waiting_since date,
  expected_by date,
  follow_up_on date,
  focus_on date,
  promised_to text,
  checklist jsonb not null default '[]',
  recurrence_id uuid,
  last_activity_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  archived_at timestamptz
);

create table entry (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references task(id) on delete cascade,
  project_id uuid references project(id) on delete cascade,
  kind text not null check (kind in ('update','meeting','decision','status','system')),
  body text not null default '',
  reason text,
  occurred_at timestamptz not null default now(),
  status_from text,
  status_to text,
  person_id uuid references person(id) on delete set null,
  link_id uuid,
  edited_at timestamptz,
  created_at timestamptz not null default now(),
  check (task_id is not null or project_id is not null)
);

create table link (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references task(id) on delete cascade,
  project_id uuid references project(id) on delete cascade,
  url text not null,
  title text not null default '',
  type text default 'Link',
  description text default '',
  created_at timestamptz not null default now(),
  check (task_id is not null or project_id is not null)
);

create table routine (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  cadence text not null default 'weekly' check (cadence in ('daily','weekly','monthly')),
  doer_id uuid references person(id) on delete set null,
  category_id uuid references category(id) on delete set null,
  project_id uuid references project(id) on delete set null,
  next_due date not null default current_date,
  created_at timestamptz not null default now()
);

create table capture (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  created_at timestamptz not null default now()
);

create index task_status_idx on task(status);
create index task_project_idx on task(project_id);
create index task_doer_idx on task(doer_id);
create index entry_task_idx on entry(task_id, occurred_at desc);
create index entry_project_idx on entry(project_id, occurred_at desc);
create index link_task_idx on link(task_id);
create index milestone_project_idx on milestone(project_id);

-- Single-user app: enable RLS and allow any authenticated request full access.
-- Locking sign-in to one email address happens in the app (middleware), not here.
alter table person enable row level security;
alter table category enable row level security;
alter table project enable row level security;
alter table milestone enable row level security;
alter table task enable row level security;
alter table entry enable row level security;
alter table link enable row level security;
alter table routine enable row level security;
alter table capture enable row level security;

create policy "authenticated full access" on person for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on category for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on project for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on milestone for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on task for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on entry for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on link for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on routine for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on capture for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
