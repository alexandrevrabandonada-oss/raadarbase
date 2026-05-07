create table public.public_receipt_distribution_logs (
    id uuid primary key default gen_random_uuid(),
    channel text not null check (channel in ('instagram_feed','instagram_story','whatsapp','telegram','reuniao','outro')),
    status text not null default 'planned' check (status in ('planned','shared','archived')),
    format text not null check (format in ('1x1','3x4','texto','link')),
    public_url text null,
    shared_at timestamptz null,
    notes text null,
    created_by uuid null,
    created_by_email text null,
    created_at timestamptz not null default now(),
    metadata jsonb not null default '{}'::jsonb
);

alter table public.public_receipt_distribution_logs enable row level security;

create policy "leitura para usuarios internos public_receipt_distribution_logs"
on public.public_receipt_distribution_logs
for select
using (auth.role() = 'authenticated');

-- Nao tem write anonimo ou auth, so service_role/admin server actions
