-- Migration 032: Person Referrals
-- Tracks interest and referrals of IG people to events, volunteering, etc.

create type public.referral_target_type as enum (
  'evento_campo',
  'voluntariado',
  'grupo_lista',
  'missao_eluta',
  'missao_simples',
  'revisar_depois',
  'nao_abordar'
);

create type public.referral_status as enum (
  'recomendado',
  'convidado',
  'respondeu',
  'confirmou',
  'compareceu',
  'ajudou',
  'recusou',
  'interessado',
  'em_revisao',
  'concluido',
  'recebeu_link',
  'acessou',
  'fez_primeira_missao',
  'colaborador',
  'pode_puxar_missao'
);

create table if not exists public.ig_person_referrals (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.ig_people(id) on delete cascade,
  target_type public.referral_target_type not null,
  target_id uuid null references public.field_agenda_events(id) on delete set null,
  status public.referral_status not null default 'recomendado',
  notes text not null default '',
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

-- Indexes
create index idx_referrals_person_id on public.ig_person_referrals(person_id);
create index idx_referrals_target_type on public.ig_person_referrals(target_type);
create index idx_referrals_status on public.ig_person_referrals(status);

-- Trigger for updated_at
create trigger tr_ig_person_referrals_updated_at
  before update on public.ig_person_referrals
  for each row execute function public.handle_updated_at();

comment on table public.ig_person_referrals is 'Registros de encaminhamento de pessoas do Instagram para acoes de mobilizacao.';
