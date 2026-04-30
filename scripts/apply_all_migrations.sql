-- ============================================================
-- RADAR DE BASE — MIGRATIONS COMPLETAS (001 → 007)
-- Aplicar no Supabase SQL Editor em uma única execução
-- ============================================================

-- ============================================================
-- 001_initial_schema
-- ============================================================
create extension if not exists pgcrypto;

create type person_status as enum (
  'novo',
  'responder',
  'abordado',
  'respondeu',
  'contato_confirmado',
  'nao_abordar'
);

create type interaction_type as enum (
  'comentario',
  'curtida',
  'resposta_story',
  'dm_manual'
);

create table ig_posts (
  id uuid primary key default gen_random_uuid(),
  instagram_post_id text unique not null,
  shortcode text,
  caption text,
  permalink text,
  media_type text,
  published_at timestamptz,
  metrics jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table ig_people (
  id uuid primary key default gen_random_uuid(),
  instagram_user_id text unique,
  username text not null,
  display_name text,
  status person_status not null default 'novo',
  themes text[] not null default '{}',
  notes text not null default '',
  total_interactions integer not null default 0,
  last_interaction_at timestamptz,
  do_not_contact_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ig_people_username_idx on ig_people using gin (to_tsvector('simple', username));
create index ig_people_status_idx on ig_people (status);
create index ig_people_last_interaction_idx on ig_people (last_interaction_at desc);

create table ig_interactions (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references ig_people(id) on delete cascade,
  post_id uuid references ig_posts(id) on delete set null,
  instagram_interaction_id text unique,
  type interaction_type not null,
  text_content text,
  theme text,
  occurred_at timestamptz not null,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index ig_interactions_person_idx on ig_interactions (person_id, occurred_at desc);
create index ig_interactions_post_idx on ig_interactions (post_id);

create table contacts (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references ig_people(id) on delete cascade,
  contact_channel text not null,
  contact_value text,
  consent_given boolean not null default false,
  consent_purpose text not null,
  consent_recorded_at timestamptz,
  privacy_policy_url text,
  source text not null default 'instagram_manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table outreach_tasks (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references ig_people(id) on delete cascade,
  column_key text not null,
  title text not null,
  notes text not null default '',
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table message_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  theme text,
  body text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table ig_posts enable row level security;
alter table ig_people enable row level security;
alter table ig_interactions enable row level security;
alter table contacts enable row level security;
alter table outreach_tasks enable row level security;
alter table message_templates enable row level security;
alter table audit_logs enable row level security;

create policy "Authenticated users can read ig_posts" on ig_posts for select to authenticated using (true);
create policy "Authenticated users can read ig_people" on ig_people for select to authenticated using (true);
create policy "Authenticated users can read ig_interactions" on ig_interactions for select to authenticated using (true);
create policy "Authenticated users can read contacts" on contacts for select to authenticated using (true);
create policy "Authenticated users can read outreach_tasks" on outreach_tasks for select to authenticated using (true);
create policy "Authenticated users can read message_templates" on message_templates for select to authenticated using (true);
create policy "Authenticated users can read audit_logs" on audit_logs for select to authenticated using (true);

-- ============================================================
-- 002_operational_hardening
-- ============================================================
create type consent_status as enum ('pending', 'confirmed', 'revoked');

alter table contacts
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists consent_status consent_status not null default 'pending',
  add column if not exists last_contacted_at timestamptz;

alter table contacts
  add constraint contacts_person_id_key unique (person_id);

alter table audit_logs
  add column if not exists actor_email text,
  add column if not exists summary text not null default '';

-- ============================================================
-- 003_meta_ingestion
-- ============================================================
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

-- ============================================================
-- 004_internal_user_access
-- ============================================================
create type internal_user_status as enum ('pending', 'active', 'disabled');

create table if not exists internal_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  role text not null default 'operator',
  status internal_user_status not null default 'pending',
  approved_at timestamptz,
  approved_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_internal_user_created()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.internal_users (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = coalesce(excluded.full_name, internal_users.full_name),
      updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_internal_user_created();

alter table internal_users enable row level security;

create policy "Authenticated users can read own internal profile"
  on internal_users for select to authenticated
  using (auth.uid() = id);

-- ============================================================
-- 005_backfill_internal_users
-- ============================================================
insert into public.internal_users (id, email, full_name)
select
  users.id,
  coalesce(users.email, ''),
  coalesce(users.raw_user_meta_data ->> 'full_name', users.raw_user_meta_data ->> 'name')
from auth.users as users
left join public.internal_users as internal_users
  on internal_users.id = users.id
where internal_users.id is null;

-- ============================================================
-- 006_bootstrap_first_admin
-- ============================================================
do $$
declare
  total_users integer;
  active_admins integer;
begin
  select count(*), count(*) filter (where role = 'admin' and status = 'active')
  into total_users, active_admins
  from public.internal_users;

  if total_users = 1 and active_admins = 0 then
    update public.internal_users
    set
      role = 'admin',
      status = 'active',
      approved_at = now(),
      updated_at = now()
    where id = (
      select id
      from public.internal_users
      order by created_at asc
      limit 1
    );
  end if;
end
$$;

-- ============================================================
-- 007_retention_policy
-- ============================================================
create table if not exists public.operational_retention_policies (
  id uuid primary key default gen_random_uuid(),
  entity text not null unique,
  retention_days int not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint operational_retention_policies_retention_days_positive check (retention_days > 0)
);

insert into public.operational_retention_policies (entity, retention_days, enabled)
values
  ('meta_sync_runs', 180, true),
  ('audit_logs', 365, true),
  ('meta_account_snapshots', 365, true)
on conflict (entity) do update
set
  retention_days = excluded.retention_days,
  enabled = excluded.enabled,
  updated_at = now();

comment on table public.operational_retention_policies is
  'Políticas operacionais de retenção. Este tijolo não executa limpeza automática.';

comment on column public.operational_retention_policies.entity is
  'Entidade operacional coberta pela política de retenção.';

comment on column public.operational_retention_policies.retention_days is
  'Quantidade de dias prevista para retenção antes de futura limpeza manual ou assistida.';

comment on column public.operational_retention_policies.enabled is
  'Indica se a política está ativa para futura rotina manual/assistida.';

-- ============================================================
-- VERIFICAÇÃO FINAL — deve retornar 11 tabelas
-- ============================================================
select table_name
from information_schema.tables
where table_schema = 'public'
order by table_name;
