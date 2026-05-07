-- ============================================================
-- 021_territorial_listening_daily_snapshots.sql
-- Snapshots diários agregados da janela territorial
-- ============================================================

create table if not exists public.territorial_listening_daily_snapshots (
    id uuid primary key default gen_random_uuid(),
    window_id uuid not null references public.territorial_listening_windows(id) on delete cascade,
    snapshot_date date not null,
    total_reports int not null default 0,
    total_with_contact_consent int not null default 0,
    total_without_contact_consent int not null default 0,
    neighborhoods_count int not null default 0,
    topics_count int not null default 0,
    pending_review_count int not null default 0,
    reviewed_count int not null default 0,
    forwarded_count int not null default 0,
    archived_count int not null default 0,
    top_neighborhoods jsonb not null default '[]'::jsonb,
    top_topics jsonb not null default '[]'::jsonb,
    status text not null default 'ok' check (status in ('ok', 'attention', 'blocked')),
    notes text null,
    generated_by uuid null,
    generated_by_email text null,
    generated_at timestamptz not null default now(),
    metadata jsonb not null default '{}'::jsonb,
    unique (window_id, snapshot_date)
);

alter table public.territorial_listening_daily_snapshots enable row level security;
revoke all on public.territorial_listening_daily_snapshots from anon, authenticated;

create policy "Internal users can read territorial daily snapshots"
    on public.territorial_listening_daily_snapshots for select to authenticated
    using (true);

create policy "Authorized internal users can manage territorial daily snapshots"
    on public.territorial_listening_daily_snapshots for all to authenticated
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

comment on table public.territorial_listening_daily_snapshots is
    'Snapshots agregados diários da janela territorial. Não contém dados pessoais nem relatos brutos.';