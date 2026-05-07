-- Migration 032: Referrals and Daily Routine Enhancement
-- Tracks individual referrals to events, volunteering, and other mobilization targets.

create type person_referral_type as enum (
  'evento_campo',
  'voluntariado',
  'grupo_lista',
  'missao_eluta',
  'missao_simples',
  'outro'
);

create type person_referral_status as enum (
  'recomendado',
  'convidado',
  'respondeu',
  'confirmou',
  'compareceu',
  'ajudou',
  'recusou'
);

create table if not exists public.ig_person_referrals (
    id uuid primary key default gen_random_uuid(),
    person_id uuid not null references public.ig_people(id) on delete cascade,
    target_type person_referral_type not null,
    target_id uuid null, -- Opcional, link para field_agenda_events
    status person_referral_status not null default 'recomendado',
    notes text null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- RLS
alter table public.ig_person_referrals enable row level security;

create policy "internal_can_read_referrals"
    on public.ig_person_referrals for select to authenticated
    using (true);

create policy "authorized_can_manage_referrals"
    on public.ig_person_referrals for all to authenticated
    using (
        exists (
            select 1 from public.internal_users
            where id = auth.uid() and role in ('admin', 'operador', 'comunicacao') and status = 'active'
        )
    );

-- Add updated_at trigger
create trigger tr_ig_person_referrals_updated_at
    before update on public.ig_person_referrals
    for each row execute function public.handle_updated_at();

-- Add index
create index idx_referrals_person_id on public.ig_person_referrals(person_id);
create index idx_referrals_status on public.ig_person_referrals(status);

-- Adicionando coluna de responsável (owner) se não existir
alter table public.ig_people add column if not exists owner_id uuid references public.internal_users(id);

comment on table public.ig_person_referrals is 'Registra encaminhamentos individuais de pessoas do Instagram para acoes de mobilizacao.';
