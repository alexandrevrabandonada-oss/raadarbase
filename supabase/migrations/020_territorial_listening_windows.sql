-- ============================================================
-- 020_territorial_listening_windows.sql
-- Janela operacional de monitoramento territorial por bairro
-- ============================================================

create table if not exists public.territorial_listening_windows (
    id uuid primary key default gen_random_uuid(),
    source_report_id uuid not null references public.mobilization_reports(id) on delete cascade,
    action_plan_id uuid null references public.action_plans(id) on delete set null,
    starts_at timestamptz not null,
    ends_at timestamptz not null,
    status text not null default 'open' check (status in ('open', 'closed', 'archived')),
    created_by uuid null,
    created_by_email text null,
    created_at timestamptz not null default now(),
    metadata jsonb not null default '{}'::jsonb,
    unique (source_report_id)
);

alter table public.territorial_listening_windows enable row level security;
revoke all on public.territorial_listening_windows from anon, authenticated;

create policy "Internal users can read territorial listening windows"
    on public.territorial_listening_windows for select to authenticated
    using (true);

create policy "Authorized internal users can manage territorial listening windows"
    on public.territorial_listening_windows for all to authenticated
    using (
        exists (
            select 1 from public.internal_users
            where id = auth.uid() and role in ('admin', 'operador', 'comunicacao') and status = 'active'
        )
    );

comment on table public.territorial_listening_windows is
    'Janela operacional de monitoramento territorial por bairro após publicação controlada da devolutiva pública.';