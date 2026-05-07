-- Migration 034: Missão ÉLuta Integration
-- Adds webhook event tracking and extends referrals for integration support.

-- 1. Create webhook_events table for idempotency and auditing
create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null, -- e.g., 'missao_eluta'
  external_event_id text unique not null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- 2. Extend ig_person_referrals with integration fields
alter table public.ig_person_referrals 
  add column if not exists external_id text,
  add column if not exists last_event_at timestamptz,
  add column if not exists last_event_type text,
  add column if not exists last_event_source text default 'manual', -- 'manual' or 'webhook'
  add column if not exists metadata jsonb not null default '{}'::jsonb;

-- 3. RLS for webhook_events
alter table public.webhook_events enable row level security;

create policy "internal_can_read_webhook_events"
  on public.webhook_events for select to authenticated
  using (true);

-- Indices
create index if not exists idx_webhook_events_external_id on public.webhook_events(external_event_id);
create index if not exists idx_referrals_external_id on public.ig_person_referrals(external_id);

comment on table public.webhook_events is 'Log de eventos recebidos via webhook para integracoes externas.';
comment on column public.ig_person_referrals.external_id is 'ID de referencia no sistema externo (ex: Missao ELuta).';
comment on column public.ig_person_referrals.last_event_source is 'Origem da ultima atualizacao de status: manual ou webhook.';
