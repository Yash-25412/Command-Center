-- Life mode: trading journal, side hustle pipeline, skills ladder, habits.
-- Paste this into Supabase Studio -> SQL Editor -> New query -> Run.
-- Safe to run once; safe to re-run (uses "if not exists" throughout).

-- ---------- Skills (generic ladder: Trading reuses this too) ----------
create table if not exists skill (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  kind text not null default 'skill' check (kind in ('skill', 'trading')),
  stages jsonb not null default '[]',
  current_stage int not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists skill_practice_log (
  id uuid primary key default gen_random_uuid(),
  skill_id uuid not null references skill(id) on delete cascade,
  date date not null,
  done boolean not null default true,
  created_at timestamptz not null default now(),
  unique (skill_id, date)
);

-- ---------- Trading journal ----------
create table if not exists trade (
  id uuid primary key default gen_random_uuid(),
  date date not null default current_date,
  symbol text not null,
  side text not null check (side in ('Long', 'Short')),
  entry numeric,
  exit numeric,
  pnl numeric not null default 0,
  r_multiple numeric,
  setup text,
  notes text default '',
  created_at timestamptz not null default now()
);

create table if not exists trade_image (
  id uuid primary key default gen_random_uuid(),
  trade_id uuid not null references trade(id) on delete cascade,
  url text not null,
  path text not null,
  created_at timestamptz not null default now()
);

create index if not exists trade_image_trade_idx on trade_image(trade_id);

-- ---------- Side hustle pipeline ----------
create table if not exists side_hustle_idea (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  note text default '',
  stage text not null default 'idea' check (stage in ('idea', 'talks', 'negotiating', 'committed', 'parked')),
  created_at timestamptz not null default now()
);

-- ---------- Habits ----------
create table if not exists habit (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists habit_log (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references habit(id) on delete cascade,
  date date not null,
  done boolean not null default true,
  created_at timestamptz not null default now(),
  unique (habit_id, date)
);

create index if not exists habit_log_habit_idx on habit_log(habit_id);

-- ---------- RLS: same single-user "authenticated full access" pattern as everything else ----------
alter table skill enable row level security;
alter table skill_practice_log enable row level security;
alter table trade enable row level security;
alter table trade_image enable row level security;
alter table side_hustle_idea enable row level security;
alter table habit enable row level security;
alter table habit_log enable row level security;

drop policy if exists "authenticated full access" on skill;
create policy "authenticated full access" on skill for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
drop policy if exists "authenticated full access" on skill_practice_log;
create policy "authenticated full access" on skill_practice_log for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
drop policy if exists "authenticated full access" on trade;
create policy "authenticated full access" on trade for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
drop policy if exists "authenticated full access" on trade_image;
create policy "authenticated full access" on trade_image for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
drop policy if exists "authenticated full access" on side_hustle_idea;
create policy "authenticated full access" on side_hustle_idea for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
drop policy if exists "authenticated full access" on habit;
create policy "authenticated full access" on habit for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
drop policy if exists "authenticated full access" on habit_log;
create policy "authenticated full access" on habit_log for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ---------- Storage: a bucket for trade screenshots (chart screenshots, broker statements) ----------
insert into storage.buckets (id, name, public)
values ('trade-images', 'trade-images', true)
on conflict (id) do nothing;

drop policy if exists "trade-images authenticated access" on storage.objects;
create policy "trade-images authenticated access" on storage.objects
  for all using (bucket_id = 'trade-images' and auth.role() = 'authenticated')
  with check (bucket_id = 'trade-images' and auth.role() = 'authenticated');

drop policy if exists "trade-images public read" on storage.objects;
create policy "trade-images public read" on storage.objects
  for select using (bucket_id = 'trade-images');

-- ---------- Seed: your two ladders + a few habits, matching the design we agreed on ----------
insert into skill (title, kind, stages, current_stage)
values
  ('Trading', 'trading', '["Learning & backtesting","Paper trading — consistency","Small live capital","Prop firm evaluation","Funded account"]', 2),
  ('Piano', 'skill', '["Reading notes & basic chords","First full song, start to finish","Comfortable sight-reading","A real piece, performance-ready","Playing from memory, confidently"]', 1)
on conflict do nothing;

insert into habit (title) values
  ('Trading journal review'),
  ('Piano practice (20 min)'),
  ('Workout')
on conflict do nothing;

insert into side_hustle_idea (title, note, stage) values
  ('Freelance FP&A consulting', 'Help 2-3 small D2C brands set up their first revenue dashboard.', 'talks'),
  ('Notion templates shop', 'Package the Command Center style of planning as a sellable template.', 'idea'),
  ('Trading signals newsletter', 'Only once actually profitable — otherwise it is irresponsible.', 'idea')
on conflict do nothing;
