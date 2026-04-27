create extension if not exists pgcrypto;

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

-- Query segura para limpeza futura, ainda não ativada automaticamente:
-- delete from public.meta_sync_runs where started_at < now() - interval '180 days';