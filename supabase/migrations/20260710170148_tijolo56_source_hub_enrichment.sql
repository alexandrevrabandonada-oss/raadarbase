-- TIJOLO 56 - Hub de Fontes e Motor de Enriquecimento do Radar
-- Camada mult fonte sobre o Radar de Influencia. Sem crawlers ou segredos no banco.

create extension if not exists pg_trgm;

create table public.radar_entities (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null default 'unknown' check (entity_type in (
    'person', 'organization', 'company', 'public_institution', 'media', 'union',
    'association', 'collective', 'event', 'community', 'digital_profile', 'unknown'
  )),
  display_name text not null check (char_length(display_name) between 1 and 200),
  normalized_name text not null check (char_length(normalized_name) between 1 and 200),
  description text,
  primary_city text,
  primary_state char(2),
  primary_region text,
  location_confidence numeric(5,4) not null default 0 check (location_confidence between 0 and 1),
  main_category text not null default 'outros' check (main_category in (
    'professor', 'medico', 'advogado', 'jornalista', 'empresa', 'comercio', 'sindicato',
    'ong', 'associacao', 'coletivo', 'ambiental', 'cultura', 'esporte', 'educacao',
    'saude', 'servidor_publico', 'politica_institucional', 'influenciador',
    'veiculo_de_imprensa', 'bairro_comunidade', 'outros'
  )),
  secondary_categories text[] not null default '{}',
  tags text[] not null default '{}',
  status text not null default 'active' check (status in ('active', 'needs_review', 'merged', 'archived')),
  influence_score numeric(7,4) not null default 0 check (influence_score between 0 and 100),
  influence_score_breakdown jsonb not null default '{}'::jsonb,
  confidence_score numeric(5,4) not null default 0 check (confidence_score between 0 and 1),
  last_enriched_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index radar_entities_normalized_name_idx on public.radar_entities (normalized_name);
create index radar_entities_name_trgm_idx on public.radar_entities using gin (normalized_name gin_trgm_ops);
create index radar_entities_description_trgm_idx on public.radar_entities using gin (lower(coalesce(description, '')) gin_trgm_ops);
create index radar_entities_type_score_idx on public.radar_entities (entity_type, influence_score desc);
create index radar_entities_category_score_idx on public.radar_entities (main_category, influence_score desc);
create index radar_entities_location_score_idx on public.radar_entities (primary_state, primary_city, primary_region, influence_score desc);
create index radar_entities_score_idx on public.radar_entities (influence_score desc, confidence_score desc);
create index radar_entities_tags_gin_idx on public.radar_entities using gin (tags);

create table public.radar_entity_identifiers (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references public.radar_entities(id) on delete cascade,
  source_type text not null check (source_type in (
    'instagram', 'facebook', 'tiktok', 'youtube', 'linkedin', 'threads', 'x',
    'website', 'news', 'tse', 'cnpj', 'portal_publico', 'manual', 'csv', 'json', 'radar_base', 'seed'
  )),
  identifier_type text not null,
  identifier_value text not null,
  normalized_identifier text not null,
  url text,
  username text,
  normalized_username text,
  is_primary boolean not null default false,
  confidence numeric(5,4) not null default 1 check (confidence between 0 and 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_type, identifier_type, normalized_identifier)
);
create index radar_entity_identifiers_entity_idx on public.radar_entity_identifiers (entity_id, is_primary desc);
create index radar_entity_identifiers_source_idx on public.radar_entity_identifiers (source_type, normalized_identifier);
create index radar_entity_identifiers_username_idx on public.radar_entity_identifiers (source_type, normalized_username) where normalized_username is not null;

create table public.radar_source_evidence (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references public.radar_entities(id) on delete cascade,
  source_type text not null,
  source_name text not null,
  source_url text,
  source_reference text,
  captured_at timestamptz not null default now(),
  field_name text not null,
  field_value jsonb not null,
  confidence numeric(5,4) not null check (confidence between 0 and 1),
  evidence_kind text not null check (evidence_kind in ('imported_field', 'public_excerpt', 'official_api', 'manual_assertion', 'internal_record', 'derived_non_sensitive')),
  raw_excerpt text check (raw_excerpt is null or char_length(raw_excerpt) <= 1000),
  content_hash text not null,
  created_at timestamptz not null default now(),
  unique (entity_id, field_name, source_type, content_hash)
);
create index radar_source_evidence_entity_idx on public.radar_source_evidence (entity_id, captured_at desc);
create index radar_source_evidence_source_idx on public.radar_source_evidence (source_type, captured_at desc);
create index radar_source_evidence_field_idx on public.radar_source_evidence (field_name, entity_id);

create table public.radar_entity_relationships (
  id uuid primary key default gen_random_uuid(),
  subject_entity_id uuid not null references public.radar_entities(id) on delete cascade,
  predicate text not null check (predicate in (
    'works_at', 'owns', 'member_of', 'related_to', 'appeared_in', 'organized',
    'participated_in', 'located_in', 'mentions', 'partner_of', 'same_as', 'possibly_same_as'
  )),
  object_entity_id uuid not null references public.radar_entities(id) on delete cascade,
  relationship_label text,
  confidence numeric(5,4) not null check (confidence between 0 and 1),
  evidence_id uuid references public.radar_source_evidence(id) on delete set null,
  valid_from timestamptz,
  valid_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (subject_entity_id <> object_entity_id),
  check (valid_until is null or valid_from is null or valid_until >= valid_from),
  unique (subject_entity_id, predicate, object_entity_id)
);
create index radar_relationships_subject_idx on public.radar_entity_relationships (subject_entity_id, predicate);
create index radar_relationships_object_idx on public.radar_entity_relationships (object_entity_id, predicate);
create index radar_relationships_predicate_idx on public.radar_entity_relationships (predicate, confidence desc);

create table public.radar_enrichment_jobs (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'queued' check (status in ('queued', 'processing', 'completed', 'completed_with_errors', 'failed', 'cancelled')),
  requested_by uuid not null references auth.users(id),
  source_type text,
  input_type text not null check (input_type in ('entities', 'import', 'instagram_sync', 'manual_review')),
  mode text not null default 'safe' check (mode in ('safe', 'configured', 'manual_review')),
  total_items integer not null default 0 check (total_items >= 0),
  processed_items integer not null default 0 check (processed_items >= 0),
  created_entities integer not null default 0 check (created_entities >= 0),
  updated_entities integer not null default 0 check (updated_entities >= 0),
  merged_entities integer not null default 0 check (merged_entities >= 0),
  rejected_items integer not null default 0 check (rejected_items >= 0),
  error_message text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);
create index radar_enrichment_jobs_status_idx on public.radar_enrichment_jobs (status, created_at desc);
create index radar_enrichment_jobs_requester_idx on public.radar_enrichment_jobs (requested_by, created_at desc);

create table public.radar_enrichment_queue (
  id bigint generated always as identity primary key,
  job_id uuid not null references public.radar_enrichment_jobs(id) on delete cascade,
  entity_id uuid references public.radar_entities(id) on delete cascade,
  source_type text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed', 'manual_review')),
  attempts integer not null default 0 check (attempts >= 0),
  max_attempts integer not null default 3 check (max_attempts between 1 and 10),
  locked_at timestamptz,
  locked_by text,
  next_run_at timestamptz not null default now(),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index radar_enrichment_queue_claim_idx on public.radar_enrichment_queue (status, next_run_at, id) where status in ('pending', 'failed');
create index radar_enrichment_queue_job_idx on public.radar_enrichment_queue (job_id, status);

create table public.radar_merge_suggestions (
  id uuid primary key default gen_random_uuid(),
  entity_a_id uuid not null references public.radar_entities(id) on delete cascade,
  entity_b_id uuid not null references public.radar_entities(id) on delete cascade,
  suggested_reason text not null,
  confidence numeric(5,4) not null check (confidence between 0 and 1),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'ignored')),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  check (entity_a_id <> entity_b_id)
);
create unique index radar_merge_suggestions_pending_pair_idx on public.radar_merge_suggestions (
  least(entity_a_id, entity_b_id), greatest(entity_a_id, entity_b_id)
) where status = 'pending';
create index radar_merge_suggestions_status_idx on public.radar_merge_suggestions (status, confidence desc, created_at);

create table public.radar_source_connectors (
  id uuid primary key default gen_random_uuid(),
  source_type text not null unique,
  display_name text not null,
  enabled boolean not null default false,
  mode text not null check (mode in ('internal', 'file_import', 'official_api', 'configured_endpoint')),
  base_url text,
  rate_limit_per_minute integer not null default 30 check (rate_limit_per_minute between 1 and 600),
  requires_api_key boolean not null default false,
  last_health_status text check (last_health_status is null or last_health_status in ('healthy', 'degraded', 'unavailable', 'not_configured')),
  last_health_checked_at timestamptz,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.radar_source_connectors (source_type, display_name, enabled, mode, rate_limit_per_minute, requires_api_key)
values
  ('manual', 'Entrada manual', true, 'internal', 120, false),
  ('csv', 'Importação CSV', true, 'file_import', 30, false),
  ('json', 'Importação JSON', true, 'file_import', 30, false),
  ('instagram', 'Instagram existente (Tijolo 55)', true, 'internal', 60, false),
  ('configured_http', 'Endpoint HTTP configurado', false, 'configured_endpoint', 30, true)
on conflict (source_type) do nothing;

create table public.radar_entity_history (
  id bigint generated always as identity primary key,
  entity_id uuid not null references public.radar_entities(id) on delete cascade,
  snapshot jsonb not null,
  changed_fields text[] not null default '{}',
  reason text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index radar_entity_history_entity_idx on public.radar_entity_history (entity_id, created_at desc);

create table public.radar_entity_notes (
  id bigint generated always as identity primary key,
  entity_id uuid not null references public.radar_entities(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_by uuid not null references auth.users(id),
  created_by_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index radar_entity_notes_entity_idx on public.radar_entity_notes (entity_id, created_at desc);

create or replace function public.set_radar_hub_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_radar_entities_updated_at before update on public.radar_entities for each row execute function public.set_radar_hub_updated_at();
create trigger set_radar_identifiers_updated_at before update on public.radar_entity_identifiers for each row execute function public.set_radar_hub_updated_at();
create trigger set_radar_relationships_updated_at before update on public.radar_entity_relationships for each row execute function public.set_radar_hub_updated_at();
create trigger set_radar_queue_updated_at before update on public.radar_enrichment_queue for each row execute function public.set_radar_hub_updated_at();
create trigger set_radar_connectors_updated_at before update on public.radar_source_connectors for each row execute function public.set_radar_hub_updated_at();
create trigger set_radar_notes_updated_at before update on public.radar_entity_notes for each row execute function public.set_radar_hub_updated_at();

create or replace function public.get_radar_entity_kpis()
returns table (
  total_entities bigint,
  average_score numeric,
  average_confidence numeric,
  needs_review bigint,
  pending_enrichment bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    count(*)::bigint,
    coalesce(avg(influence_score), 0)::numeric,
    coalesce(avg(confidence_score), 0)::numeric,
    count(*) filter (where status = 'needs_review')::bigint,
    (select count(*) from public.radar_enrichment_queue where status in ('pending', 'failed'))::bigint
  from public.radar_entities
  where status <> 'archived';
$$;

revoke all on function public.get_radar_entity_kpis() from public;
grant execute on function public.get_radar_entity_kpis() to authenticated, service_role;

create or replace function public.search_radar_entities(
  p_q text default null,
  p_entity_type text default null,
  p_category text default null,
  p_city text default null,
  p_state text default null,
  p_region text default null,
  p_source_type text default null,
  p_min_score numeric default null,
  p_max_score numeric default null,
  p_has_relationship boolean default null,
  p_offset integer default 0,
  p_limit integer default 50,
  p_sort text default 'score',
  p_direction text default 'desc'
)
returns table(entity jsonb, total_count bigint)
language sql
stable
security invoker
set search_path = public
as $$
  with filtered as (
    select e.*
    from public.radar_entities e
    where e.status <> 'archived'
      and (p_q is null or e.normalized_name ilike '%' || lower(p_q) || '%' or coalesce(e.description, '') ilike '%' || p_q || '%')
      and (p_entity_type is null or e.entity_type = p_entity_type)
      and (p_category is null or e.main_category = p_category or p_category = any(e.secondary_categories))
      and (p_city is null or e.primary_city = p_city)
      and (p_state is null or e.primary_state = upper(p_state))
      and (p_region is null or e.primary_region = p_region)
      and (p_min_score is null or e.influence_score >= p_min_score)
      and (p_max_score is null or e.influence_score <= p_max_score)
      and (p_source_type is null or exists (
        select 1 from public.radar_entity_identifiers i where i.entity_id = e.id and i.source_type = p_source_type
      ))
      and (p_has_relationship is null or p_has_relationship = exists (
        select 1 from public.radar_entity_relationships r where r.subject_entity_id = e.id or r.object_entity_id = e.id
      ))
  )
  select to_jsonb(f), count(*) over()::bigint
  from filtered f
  order by
    case when p_sort = 'name' and p_direction = 'asc' then f.normalized_name end asc,
    case when p_sort = 'name' and p_direction = 'desc' then f.normalized_name end desc,
    case when p_sort = 'confidence' and p_direction = 'asc' then f.confidence_score end asc,
    case when p_sort = 'confidence' and p_direction = 'desc' then f.confidence_score end desc,
    case when p_sort = 'updated' and p_direction = 'asc' then f.updated_at end asc,
    case when p_sort = 'updated' and p_direction = 'desc' then f.updated_at end desc,
    case when p_sort = 'score' and p_direction = 'asc' then f.influence_score end asc,
    f.influence_score desc,
    f.id
  offset greatest(p_offset, 0)
  limit least(greatest(p_limit, 1), 100);
$$;

revoke all on function public.search_radar_entities(text,text,text,text,text,text,text,numeric,numeric,boolean,integer,integer,text,text) from public;
grant execute on function public.search_radar_entities(text,text,text,text,text,text,text,numeric,numeric,boolean,integer,integer,text,text) to authenticated, service_role;

create or replace function public.get_radar_entity_facets()
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select jsonb_build_object(
    'entityTypes', coalesce((select jsonb_object_agg(entity_type, amount) from (select entity_type, count(*) amount from public.radar_entities where status <> 'archived' group by entity_type) x), '{}'::jsonb),
    'categories', coalesce((select jsonb_object_agg(main_category, amount) from (select main_category, count(*) amount from public.radar_entities where status <> 'archived' group by main_category) x), '{}'::jsonb),
    'cities', coalesce((select jsonb_object_agg(primary_city, amount) from (select primary_city, count(*) amount from public.radar_entities where status <> 'archived' and primary_city is not null group by primary_city) x), '{}'::jsonb),
    'sources', coalesce((select jsonb_object_agg(source_type, amount) from (select source_type, count(distinct entity_id) amount from public.radar_entity_identifiers group by source_type) x), '{}'::jsonb)
  );
$$;

revoke all on function public.get_radar_entity_facets() from public;
grant execute on function public.get_radar_entity_facets() to authenticated, service_role;

alter table public.radar_entities enable row level security;
alter table public.radar_entity_identifiers enable row level security;
alter table public.radar_source_evidence enable row level security;
alter table public.radar_entity_relationships enable row level security;
alter table public.radar_enrichment_jobs enable row level security;
alter table public.radar_enrichment_queue enable row level security;
alter table public.radar_merge_suggestions enable row level security;
alter table public.radar_source_connectors enable row level security;
alter table public.radar_entity_history enable row level security;
alter table public.radar_entity_notes enable row level security;

create policy "Internal users can read radar entities" on public.radar_entities for select to authenticated using ((select public.is_current_internal_user()));
create policy "Internal users can read radar identifiers" on public.radar_entity_identifiers for select to authenticated using ((select public.is_current_internal_user()));
create policy "Internal users can read radar evidence" on public.radar_source_evidence for select to authenticated using ((select public.is_current_internal_user()));
create policy "Internal users can read radar relationships" on public.radar_entity_relationships for select to authenticated using ((select public.is_current_internal_user()));
create policy "Internal users can read radar enrichment jobs" on public.radar_enrichment_jobs for select to authenticated using ((select public.is_current_internal_user()));
create policy "Internal users can read radar enrichment queue" on public.radar_enrichment_queue for select to authenticated using ((select public.is_current_internal_user()));
create policy "Internal users can read radar merge suggestions" on public.radar_merge_suggestions for select to authenticated using ((select public.is_current_internal_user()));
create policy "Internal users can read radar connectors" on public.radar_source_connectors for select to authenticated using ((select public.is_current_internal_user()));
create policy "Internal users can read radar entity history" on public.radar_entity_history for select to authenticated using ((select public.is_current_internal_user()));
create policy "Internal users can read radar entity notes" on public.radar_entity_notes for select to authenticated using ((select public.is_current_internal_user()));

revoke all on table public.radar_entities, public.radar_entity_identifiers, public.radar_source_evidence,
  public.radar_entity_relationships, public.radar_enrichment_jobs, public.radar_enrichment_queue,
  public.radar_merge_suggestions, public.radar_source_connectors, public.radar_entity_history,
  public.radar_entity_notes from anon, authenticated;

grant select on table public.radar_entities, public.radar_entity_identifiers, public.radar_source_evidence,
  public.radar_entity_relationships, public.radar_enrichment_jobs, public.radar_enrichment_queue,
  public.radar_merge_suggestions, public.radar_source_connectors, public.radar_entity_history,
  public.radar_entity_notes to authenticated;

grant all on table public.radar_entities, public.radar_entity_identifiers, public.radar_source_evidence,
  public.radar_entity_relationships, public.radar_enrichment_jobs, public.radar_enrichment_queue,
  public.radar_merge_suggestions, public.radar_source_connectors, public.radar_entity_history,
  public.radar_entity_notes to service_role;

grant usage, select on sequence public.radar_enrichment_queue_id_seq, public.radar_entity_history_id_seq,
  public.radar_entity_notes_id_seq to service_role;
