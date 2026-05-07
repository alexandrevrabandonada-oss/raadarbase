-- Migration 028: Public volunteer applications
-- Consent-first public queue. Applications never become active volunteers automatically.

create table if not exists public.campaign_volunteer_applications (
    id uuid primary key default gen_random_uuid(),
    display_name text not null,
    neighborhood text null,
    city text null default 'Volta Redonda',
    contact_email text null,
    contact_phone text null,
    contact_preference text not null check (contact_preference in ('whatsapp','email','telefone','nenhum')) default 'nenhum',
    consent_to_contact boolean not null default false,
    consent_to_store_data boolean not null default false,
    availability jsonb not null default '{}'::jsonb,
    skills jsonb not null default '[]'::jsonb,
    interests jsonb not null default '[]'::jsonb,
    status text not null check (status in ('pending','approved','rejected','archived')) default 'pending',
    review_notes text null,
    reviewed_by uuid null,
    reviewed_by_email text null,
    reviewed_at timestamptz null,
    converted_volunteer_id uuid null references public.campaign_volunteers(id) on delete set null,
    created_at timestamptz not null default now(),
    metadata jsonb not null default '{}'::jsonb,
    constraint campaign_volunteer_applications_store_consent_required
        check (consent_to_store_data = true),
    constraint campaign_volunteer_applications_contact_consent_required
        check (
            ((contact_email is null or btrim(contact_email) = '') and (contact_phone is null or btrim(contact_phone) = ''))
            or consent_to_contact = true
        ),
    constraint campaign_volunteer_applications_pending_public_default
        check (status <> 'pending' or converted_volunteer_id is null)
);

create index if not exists idx_campaign_volunteer_applications_status on public.campaign_volunteer_applications(status);
create index if not exists idx_campaign_volunteer_applications_neighborhood on public.campaign_volunteer_applications(neighborhood);
create index if not exists idx_campaign_volunteer_applications_created_at on public.campaign_volunteer_applications(created_at desc);

alter table public.campaign_volunteer_applications enable row level security;

create policy "public_can_submit_pending_volunteer_applications"
    on public.campaign_volunteer_applications for insert to anon, authenticated
    with check (
        status = 'pending'
        and consent_to_store_data = true
        and converted_volunteer_id is null
        and reviewed_by is null
        and reviewed_by_email is null
        and reviewed_at is null
        and review_notes is null
        and length(btrim(display_name)) between 2 and 120
        and (
            ((contact_email is null or btrim(contact_email) = '') and (contact_phone is null or btrim(contact_phone) = ''))
            or consent_to_contact = true
        )
    );

create policy "internal_can_read_volunteer_applications"
    on public.campaign_volunteer_applications for select to authenticated
    using (
        exists (
            select 1 from public.internal_users
            where id = auth.uid() and role in ('admin', 'operador', 'comunicacao', 'leitura') and status = 'active'
        )
    );

create policy "authorized_can_review_volunteer_applications"
    on public.campaign_volunteer_applications for update to authenticated
    using (
        exists (
            select 1 from public.internal_users
            where id = auth.uid() and role in ('admin', 'operador', 'comunicacao') and status = 'active'
        )
    )
    with check (
        exists (
            select 1 from public.internal_users
            where id = auth.uid() and role in ('admin', 'operador', 'comunicacao') and status = 'active'
        )
    );

comment on table public.campaign_volunteer_applications is 'Fila pública consentida de inscrições para revisão humana antes de virar voluntário.';
