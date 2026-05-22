-- Migration 037: Outreach Locks Table
-- Move outreach lock engine from memory Map to Database to support multiple server instances.

create table if not exists public.outreach_locks (
    person_id uuid primary key references public.ig_people(id) on delete cascade,
    operator_id text not null,
    operator_name text not null,
    expires_at timestamptz not null,
    created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.outreach_locks enable row level security;

-- Policy for reading locks
create policy "Authenticated users can read outreach_locks"
    on public.outreach_locks for select to authenticated
    using (true);

-- Policy for updating/creating locks
create policy "Authenticated users can manage outreach_locks"
    on public.outreach_locks for all to authenticated
    using (
        exists (
            select 1
            from public.internal_users as internal_user
            where internal_user.id = auth.uid()
              and internal_user.status = 'active'
              and internal_user.role in ('admin', 'operador')
        )
    )
    with check (
        exists (
            select 1
            from public.internal_users as internal_user
            where internal_user.id = auth.uid()
              and internal_user.status = 'active'
              and internal_user.role in ('admin', 'operador')
        )
    );

-- Index to optimize cleanup and check queries
create index if not exists idx_outreach_locks_expires_at on public.outreach_locks(expires_at);
