-- ============================================================
-- 022_territorial_listening_outreach_logs.sql
-- Registro operacional do reforço da chamada territorial
-- ============================================================

create table if not exists public.territorial_listening_outreach_logs (
    id uuid primary key default gen_random_uuid(),
    window_id uuid not null references public.territorial_listening_windows(id) on delete cascade,
    channel text not null check (channel in ('instagram_story', 'instagram_feed', 'whatsapp', 'reuniao', 'outro')),
    status text not null default 'planned' check (status in ('planned', 'shared', 'archived')),
    shared_at timestamptz null,
    public_url text null,
    notes text null,
    created_by uuid null,
    created_by_email text null,
    created_at timestamptz not null default now(),
    metadata jsonb not null default '{}'::jsonb
);

alter table public.territorial_listening_outreach_logs enable row level security;
revoke all on public.territorial_listening_outreach_logs from anon, authenticated;

create policy "Internal users can read territorial outreach logs"
    on public.territorial_listening_outreach_logs for select to authenticated
    using (true);

create policy "Authorized internal users can manage territorial outreach logs"
    on public.territorial_listening_outreach_logs for all to authenticated
    using (
        exists (
            select 1 from public.internal_users
            where id = auth.uid() and role in ('admin', 'operador') and status = 'active'
        )
    )
    with check (
        exists (
            select 1 from public.internal_users
            where id = auth.uid() and role in ('admin', 'operador') and status = 'active'
        )
    );

comment on table public.territorial_listening_outreach_logs is
    'Registro operacional do reforço da chamada territorial. Contém somente metadados agregados e URLs públicas opcionais.';