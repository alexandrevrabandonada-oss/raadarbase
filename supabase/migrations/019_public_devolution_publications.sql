-- ============================================================
-- 019_public_devolution_publications.sql
-- Publicação controlada da devolutiva e governança da escuta territorial
-- ============================================================

create table if not exists public.public_devolution_publications (
    id uuid primary key default gen_random_uuid(),
    report_id uuid not null references public.mobilization_reports(id) on delete cascade,
    action_plan_id uuid null references public.action_plans(id) on delete set null,
    status text not null check (status in ('draft', 'reviewed', 'published', 'archived')) default 'draft',
    published_at timestamptz null,
    published_url text null,
    instagram_post_url text null,
    whatsapp_shared boolean not null default false,
    created_by uuid null,
    created_by_email text null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    metadata jsonb not null default '{}'::jsonb,
    unique (report_id)
);

alter table public.public_devolution_publications enable row level security;

revoke all on public.public_devolution_publications from anon, authenticated;

create policy "Internal users can read public_devolution_publications"
    on public.public_devolution_publications for select to authenticated
    using (true);

create policy "Authorized internal users can manage public_devolution_publications"
    on public.public_devolution_publications for all to authenticated
    using (
        exists (
            select 1 from public.internal_users
            where id = auth.uid() and role in ('admin', 'operador', 'comunicacao') and status = 'active'
        )
    );

create trigger tr_public_devolution_publications_updated_at
    before update on public.public_devolution_publications
    for each row execute function public.handle_updated_at();

comment on table public.public_devolution_publications is
    'Status controlado da devolutiva pública do relatório, com rastreio de revisão, publicação e arquivamento.';

alter table public.bairro_escuta_submissions
    add column if not exists status text not null default 'novo' check (status in ('novo', 'revisado', 'encaminhado', 'arquivado'));

alter table public.bairro_escuta_submissions
    add column if not exists consent_to_contact boolean not null default false;

alter table public.bairro_escuta_submissions
    add column if not exists contact_redacted text null;

alter table public.bairro_escuta_submissions
    add column if not exists reviewed_at timestamptz null;

alter table public.bairro_escuta_submissions
    add column if not exists reviewed_by uuid null;

update public.bairro_escuta_submissions
set
    consent_to_contact = quer_contato,
    contact_redacted = case
        when contato_opcional is null or btrim(contato_opcional) = '' then null
        when position('@' in contato_opcional) > 0 then
            regexp_replace(split_part(contato_opcional, '@', 1), '^(.{2}).*', '\1***') || '@' || split_part(contato_opcional, '@', 2)
        else
            left(regexp_replace(contato_opcional, '\\D', '', 'g'), 3) || '***' || right(regexp_replace(contato_opcional, '\\D', '', 'g'), 2)
    end
where consent_to_contact is distinct from quer_contato or contact_redacted is null;

comment on column public.bairro_escuta_submissions.status is
    'Estado operacional do relato: novo, revisado, encaminhado ou arquivado.';

comment on column public.bairro_escuta_submissions.consent_to_contact is
    'Indica consentimento explícito para eventual retorno humano, sem automação.';

comment on column public.bairro_escuta_submissions.contact_redacted is
    'Prévia redigida do contato opcional para uso interno autorizado.';
