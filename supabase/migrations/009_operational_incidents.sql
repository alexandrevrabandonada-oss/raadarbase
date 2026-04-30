-- ============================================================
-- 009_operational_incidents
-- Tabela de incidentes operacionais para painel de governança.
-- ============================================================

create table if not exists public.operational_incidents (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  severity text not null check (severity in ('info', 'warning', 'critical')),
  status text not null default 'open' check (status in ('open', 'acknowledged', 'resolved')),
  title text not null,
  description text,
  related_entity_type text,
  related_entity_id text,
  created_at timestamptz not null default now(),
  acknowledged_at timestamptz null,
  resolved_at timestamptz null,
  actor_email text null,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists operational_incidents_status_idx
  on public.operational_incidents (status, severity, created_at desc);

create index if not exists operational_incidents_kind_idx
  on public.operational_incidents (kind, created_at desc);

alter table public.operational_incidents enable row level security;

-- Authenticated users can read incidents
create policy "Authenticated users can read operational_incidents"
  on public.operational_incidents for select to authenticated using (true);

-- Service role (used by server actions) handles writes
-- No authenticated write policy: all writes via service role only

comment on table public.operational_incidents is
  'Incidentes operacionais derivados de falhas, runs presas, e violações de acesso.';

comment on column public.operational_incidents.kind is
  'Categoria do incidente: stuck_run, repeated_failure, auth_denied, export_attempt, anonymization, sync_error, healthcheck_warning';

comment on column public.operational_incidents.severity is
  'Severidade: info, warning, critical';

comment on column public.operational_incidents.status is
  'Estado: open, acknowledged, resolved';
