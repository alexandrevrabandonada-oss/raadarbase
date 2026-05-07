-- Criar tabela de ciclos de distribuicao
create table public.public_receipt_distribution_cycles (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    status text not null default 'planned' check (status in ('planned','active','closed','archived')),
    starts_at timestamptz null,
    ends_at timestamptz null,
    created_by uuid null,
    created_by_email text null,
    created_at timestamptz not null default now(),
    metadata jsonb not null default '{}'::jsonb
);

-- Adicionar FK em logs
alter table public.public_receipt_distribution_logs 
add column cycle_id uuid null references public.public_receipt_distribution_cycles(id);

-- RLS
alter table public.public_receipt_distribution_cycles enable row level security;

create policy "leitura para usuarios internos public_receipt_distribution_cycles"
on public.public_receipt_distribution_cycles
for select
using (auth.role() = 'authenticated');

-- Escrita restrita a server actions (service_role)
