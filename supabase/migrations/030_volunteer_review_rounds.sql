-- Migration 030: Volunteer periodic review rounds
-- Internal operational review records. No public writes and no automated contact.

create table if not exists public.volunteer_review_rounds (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    status text not null check (status in ('open','done','archived')) default 'open',
    reviewed_pending_count int not null default 0,
    approved_count int not null default 0,
    rejected_count int not null default 0,
    archived_count int not null default 0,
    redacted_count int not null default 0,
    retained_count int not null default 0,
    notes text null,
    created_by uuid null,
    created_by_email text null,
    created_at timestamptz not null default now(),
    completed_at timestamptz null,
    metadata jsonb not null default '{}'::jsonb
);

create index if not exists idx_volunteer_review_rounds_status on public.volunteer_review_rounds(status);
create index if not exists idx_volunteer_review_rounds_created_at on public.volunteer_review_rounds(created_at desc);

alter table public.volunteer_review_rounds enable row level security;

create policy "internal_can_read_volunteer_review_rounds"
    on public.volunteer_review_rounds for select to authenticated
    using (
        exists (
            select 1 from public.internal_users
            where id = auth.uid() and role in ('admin', 'operador', 'comunicacao', 'leitura') and status = 'active'
        )
    );

create policy "authorized_can_manage_volunteer_review_rounds"
    on public.volunteer_review_rounds for all to authenticated
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

comment on table public.volunteer_review_rounds is 'Rodadas internas de revisão periódica de inscrições de voluntariado, sem automação de contato.';
