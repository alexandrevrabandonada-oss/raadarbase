alter table ig_posts
  add column if not exists raw jsonb,
  add column if not exists synced_at timestamptz;

alter table ig_people
  add column if not exists raw jsonb,
  add column if not exists synced_at timestamptz;

alter table ig_interactions
  add column if not exists external_id text unique,
  add column if not exists raw jsonb,
  add column if not exists synced_at timestamptz;

create table if not exists meta_account_snapshots (
  id uuid primary key default gen_random_uuid(),
  username text,
  name text,
  followers_count int,
  media_count int,
  captured_at timestamptz not null default now(),
  raw jsonb
);

create table if not exists meta_sync_runs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid null,
  actor_email text null,
  kind text not null,
  status text not null check (status in ('started','success','error')),
  started_at timestamptz not null default now(),
  finished_at timestamptz null,
  inserted_count int not null default 0,
  updated_count int not null default 0,
  skipped_count int not null default 0,
  error_message text null,
  metadata jsonb not null default '{}'::jsonb
);

alter table meta_account_snapshots enable row level security;
alter table meta_sync_runs enable row level security;

create policy "Authenticated users can read meta_account_snapshots"
  on meta_account_snapshots for select to authenticated using (true);

create policy "Authenticated users can read meta_sync_runs"
  on meta_sync_runs for select to authenticated using (true);
