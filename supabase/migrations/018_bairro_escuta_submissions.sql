-- ============================================================
-- 018_bairro_escuta_submissions.sql
-- Escuta territorial pública por bairro com consentimento explícito
-- ============================================================

create table if not exists public.bairro_escuta_submissions (
    id uuid primary key default gen_random_uuid(),
    source_report_id uuid null references mobilization_reports(id) on delete set null,
    bairro text not null,
    pauta text not null,
    relato_curto text not null,
    quer_contato boolean not null default false,
    contato_opcional text null,
    consentimento_explicito boolean not null default false,
    aviso_privacidade_aceito boolean not null default false,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

alter table public.bairro_escuta_submissions enable row level security;
revoke all on public.bairro_escuta_submissions from anon, authenticated;

create policy "Internal users can read neighborhood listen submissions"
    on public.bairro_escuta_submissions for select to authenticated
    using (true);

comment on table public.bairro_escuta_submissions is
    'Escuta territorial pública por bairro com consentimento explícito. Não contém automação de abordagem, score, dados sensíveis desnecessários ou perfilamento individual.';