-- TIJOLO 55 - Radar de Influencia Instagram
-- Somente dados legitimamente fornecidos/importados pelos usuarios do sistema.

create extension if not exists pg_trgm;

create or replace function public.is_current_internal_user()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.internal_users me
    where me.id = (select auth.uid())
      and me.status = 'active'
  );
$$;

revoke all on function public.is_current_internal_user() from public;
grant execute on function public.is_current_internal_user() to authenticated;

create table public.instagram_profiles (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  nome text,
  foto text,
  bio text,
  categoria text not null default 'outros'
    check (categoria in ('politico', 'jornalista', 'empresa', 'comercio', 'professor', 'medico', 'advogado', 'sindicato', 'influenciador', 'ong', 'ambientalista', 'servidor_publico', 'artista', 'estudante', 'outros')),
  site text,
  cidade text,
  estado char(2),
  seguidores bigint not null default 0 check (seguidores >= 0),
  seguindo bigint not null default 0 check (seguindo >= 0),
  posts bigint not null default 0 check (posts >= 0),
  conta_verificada boolean not null default false,
  criador boolean not null default false,
  empresa boolean not null default false,
  privada boolean not null default false,
  influence_score numeric(10,4) not null default 0,
  score_components jsonb not null default '{}'::jsonb,
  classification_confidence numeric(5,4) not null default 0 check (classification_confidence between 0 and 1),
  classification_source text not null default 'regra' check (classification_source in ('regra', 'ia', 'manual')),
  location_confidence numeric(5,4) not null default 0 check (location_confidence between 0 and 1),
  location_evidence jsonb not null default '[]'::jsonb,
  source text not null default 'importacao_legitima' check (source in ('importacao_legitima', 'api_oficial', 'entrada_manual', 'seed')),
  source_reference text,
  raw_profile jsonb not null default '{}'::jsonb,
  data_ultima_atualizacao timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint instagram_profiles_username_format check (username ~ '^[a-z0-9._]{1,30}$')
);

create index instagram_profiles_username_ci_idx on public.instagram_profiles (lower(username));
create index instagram_profiles_score_idx on public.instagram_profiles (influence_score desc, seguidores desc);
create index instagram_profiles_category_score_idx on public.instagram_profiles (categoria, influence_score desc);
create index instagram_profiles_location_score_idx on public.instagram_profiles (estado, cidade, influence_score desc);
create index instagram_profiles_followers_idx on public.instagram_profiles (seguidores desc);
create index instagram_profiles_stale_idx on public.instagram_profiles (data_ultima_atualizacao asc);
create index instagram_profiles_name_trgm_idx on public.instagram_profiles using gin (lower(coalesce(nome, '')) gin_trgm_ops);
create index instagram_profiles_username_trgm_idx on public.instagram_profiles using gin (lower(username) gin_trgm_ops);
create index instagram_profiles_bio_trgm_idx on public.instagram_profiles using gin (lower(coalesce(bio, '')) gin_trgm_ops);

create table public.influence_score_config (
  id text primary key default 'default' check (id = 'default'),
  config jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

insert into public.influence_score_config (id, config)
values ('default', '{"logFollowers": 10, "verified": 12, "business": 4, "creator": 5, "location": 3, "interaction": 0}'::jsonb)
on conflict (id) do nothing;

create table public.instagram_profile_history (
  id bigint generated always as identity primary key,
  profile_id uuid not null references public.instagram_profiles(id) on delete cascade,
  snapshot jsonb not null,
  changed_fields text[] not null default '{}',
  reason text not null default 'atualizacao',
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);
create index instagram_profile_history_profile_idx on public.instagram_profile_history (profile_id, created_at desc);

create table public.instagram_profile_classifications (
  id bigint generated always as identity primary key,
  profile_id uuid not null references public.instagram_profiles(id) on delete cascade,
  categoria text not null,
  confidence numeric(5,4) not null check (confidence between 0 and 1),
  source text not null check (source in ('regra', 'ia', 'manual')),
  rationale text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);
create index instagram_profile_classifications_profile_idx on public.instagram_profile_classifications (profile_id, created_at desc);

create table public.instagram_profile_notes (
  id bigint generated always as identity primary key,
  profile_id uuid not null references public.instagram_profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id),
  created_by_email text
);
create index instagram_profile_notes_profile_idx on public.instagram_profile_notes (profile_id, created_at desc);

create table public.instagram_imports (
  id uuid primary key default gen_random_uuid(),
  filename text,
  format text not null check (format in ('csv', 'json')),
  status text not null default 'processing' check (status in ('processing', 'completed', 'failed')),
  total_rows integer not null default 0,
  inserted_rows integer not null default 0,
  updated_rows integer not null default 0,
  duplicate_rows integer not null default 0,
  rejected_rows integer not null default 0,
  error_summary text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  created_by uuid not null references auth.users(id)
);

create table public.instagram_update_jobs (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'queued' check (status in ('queued', 'processing', 'completed', 'completed_with_errors', 'failed')),
  stale_before timestamptz not null,
  requested_limit integer not null check (requested_limit between 1 and 10000),
  concurrency integer not null default 4 check (concurrency between 1 and 20),
  total_items integer not null default 0,
  completed_items integer not null default 0,
  failed_items integer not null default 0,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  created_by uuid not null references auth.users(id)
);
create index instagram_update_jobs_status_idx on public.instagram_update_jobs (status, created_at);

create table public.instagram_update_queue (
  id bigint generated always as identity primary key,
  job_id uuid not null references public.instagram_update_jobs(id) on delete cascade,
  profile_id uuid not null references public.instagram_profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  attempts integer not null default 0,
  max_attempts integer not null default 3 check (max_attempts between 1 and 10),
  next_attempt_at timestamptz not null default now(),
  locked_at timestamptz,
  locked_by text,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, profile_id)
);
create index instagram_update_queue_claim_idx on public.instagram_update_queue (status, next_attempt_at, id)
  where status in ('pending', 'failed');

create table public.instagram_processing_logs (
  id bigint generated always as identity primary key,
  job_id uuid references public.instagram_update_jobs(id) on delete cascade,
  profile_id uuid references public.instagram_profiles(id) on delete set null,
  level text not null check (level in ('info', 'warning', 'error')),
  event text not null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index instagram_processing_logs_job_idx on public.instagram_processing_logs (job_id, created_at desc);

create or replace function public.set_instagram_profile_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_instagram_profiles_updated_at
before update on public.instagram_profiles
for each row execute function public.set_instagram_profile_updated_at();

create trigger set_instagram_queue_updated_at
before update on public.instagram_update_queue
for each row execute function public.set_instagram_profile_updated_at();

create or replace function public.get_instagram_influence_kpis()
returns table(total_profiles bigint, total_followers numeric, average_followers numeric)
language sql
stable
security invoker
set search_path = public
as $$
  select count(*)::bigint, coalesce(sum(seguidores), 0)::numeric,
         coalesce(avg(seguidores), 0)::numeric
  from public.instagram_profiles;
$$;

revoke all on function public.get_instagram_influence_kpis() from public;
grant execute on function public.get_instagram_influence_kpis() to authenticated, service_role;

alter table public.instagram_profiles enable row level security;
alter table public.influence_score_config enable row level security;
alter table public.instagram_profile_history enable row level security;
alter table public.instagram_profile_classifications enable row level security;
alter table public.instagram_profile_notes enable row level security;
alter table public.instagram_imports enable row level security;
alter table public.instagram_update_jobs enable row level security;
alter table public.instagram_update_queue enable row level security;
alter table public.instagram_processing_logs enable row level security;

create policy "Internal users can read instagram profiles" on public.instagram_profiles
  for select to authenticated using ((select public.is_current_internal_user()));
create policy "Internal users can read influence score config" on public.influence_score_config
  for select to authenticated using ((select public.is_current_internal_user()));
create policy "Admins can update influence score config" on public.influence_score_config
  for update to authenticated using ((select public.is_current_internal_admin()))
  with check ((select public.is_current_internal_admin()));

create policy "Internal users can read instagram profile history" on public.instagram_profile_history
  for select to authenticated using ((select public.is_current_internal_user()));
create policy "Internal users can read instagram classifications" on public.instagram_profile_classifications
  for select to authenticated using ((select public.is_current_internal_user()));
create policy "Internal users can read instagram notes" on public.instagram_profile_notes
  for select to authenticated using ((select public.is_current_internal_user()));
create policy "Internal users can create instagram notes" on public.instagram_profile_notes
  for insert to authenticated with check ((select public.is_current_internal_user()) and created_by = (select auth.uid()));
create policy "Note owners and admins can update instagram notes" on public.instagram_profile_notes
  for update to authenticated
  using (created_by = (select auth.uid()) or (select public.is_current_internal_admin()))
  with check (created_by = (select auth.uid()) or (select public.is_current_internal_admin()));

create policy "Internal users can read instagram imports" on public.instagram_imports
  for select to authenticated using ((select public.is_current_internal_user()));
create policy "Internal users can read instagram update jobs" on public.instagram_update_jobs
  for select to authenticated using ((select public.is_current_internal_user()));
create policy "Internal users can read instagram queue" on public.instagram_update_queue
  for select to authenticated using ((select public.is_current_internal_user()));
create policy "Internal users can read instagram processing logs" on public.instagram_processing_logs
  for select to authenticated using ((select public.is_current_internal_user()));

revoke all on table public.instagram_profiles, public.influence_score_config,
  public.instagram_profile_history, public.instagram_profile_classifications,
  public.instagram_profile_notes, public.instagram_imports, public.instagram_update_jobs,
  public.instagram_update_queue, public.instagram_processing_logs from anon, authenticated;

grant select on table public.instagram_profiles, public.influence_score_config,
  public.instagram_profile_history, public.instagram_profile_classifications,
  public.instagram_profile_notes, public.instagram_imports, public.instagram_update_jobs,
  public.instagram_update_queue, public.instagram_processing_logs to authenticated;
grant insert, update on table public.instagram_profile_notes to authenticated;
grant all on table public.instagram_profiles, public.influence_score_config,
  public.instagram_profile_history, public.instagram_profile_classifications,
  public.instagram_profile_notes, public.instagram_imports, public.instagram_update_jobs,
  public.instagram_update_queue, public.instagram_processing_logs to service_role;
grant usage, select on sequence public.instagram_profile_history_id_seq,
  public.instagram_profile_classifications_id_seq, public.instagram_profile_notes_id_seq,
  public.instagram_update_queue_id_seq, public.instagram_processing_logs_id_seq to service_role;
grant usage, select on sequence public.instagram_profile_notes_id_seq to authenticated;
