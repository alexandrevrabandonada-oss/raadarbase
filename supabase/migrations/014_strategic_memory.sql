-- ============================================================
-- 014_strategic_memory.sql
-- Camada de Memória Estratégica e Consolidação de Aprendizados
-- ============================================================

-- 1. Tabela de Memórias Estratégicas
create table if not exists public.strategic_memories (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    summary text not null,
    topic_id uuid null references public.topic_categories(id) on delete set null,
    period_start date null,
    period_end date null,
    territory text null,
    status text not null check (status in ('draft', 'active', 'archived')) default 'active',
    created_by uuid null references public.internal_users(id) on delete set null,
    created_by_email text null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    archived_at timestamptz null,
    metadata jsonb not null default '{}'::jsonb
);

-- 2. Tabela de Vínculos da Memória
create table if not exists public.strategic_memory_links (
    id uuid primary key default gen_random_uuid(),
    memory_id uuid not null references public.strategic_memories(id) on delete cascade,
    entity_type text not null check (entity_type in (
      'topic',
      'report',
      'action_plan',
      'action_plan_item',
      'evidence',
      'result'
    )),
    entity_id uuid not null,
    created_at timestamptz not null default now(),
    unique(memory_id, entity_type, entity_id)
);

-- 3. Habilitar RLS
alter table public.strategic_memories enable row level security;
alter table public.strategic_memory_links enable row level security;

-- 4. Policies para strategic_memories

-- Leitura: Qualquer usuário interno autenticado
create policy "Internal users can read strategic memories"
    on public.strategic_memories for select to authenticated
    using (true);

-- Criação/Edição: admin, operador, comunicacao
create policy "Authorized users can insert strategic memories"
    on public.strategic_memories for insert to authenticated
    with check (
        exists (
            select 1 from public.internal_users
            where id = auth.uid() and role in ('admin', 'operador', 'comunicacao') and status = 'active'
        )
    );

create policy "Authorized users can update strategic memories"
    on public.strategic_memories for update to authenticated
    using (
        exists (
            select 1 from public.internal_users
            where id = auth.uid() and role in ('admin', 'operador', 'comunicacao') and status = 'active'
        )
    );

-- Arquivamento: admin, operador (a rigor update, mas se quisermos deletar...)
-- O arquivamento é um update no campo status. A policy de update já cobre.
-- Se quisermos delete real:
create policy "Admins and operators can delete strategic memories"
    on public.strategic_memories for delete to authenticated
    using (
        exists (
            select 1 from public.internal_users
            where id = auth.uid() and role in ('admin', 'operador') and status = 'active'
        )
    );

-- 5. Policies para strategic_memory_links

-- Leitura: Qualquer usuário interno autenticado
create policy "Internal users can read memory links"
    on public.strategic_memory_links for select to authenticated
    using (true);

-- Criação/Edição: admin, operador, comunicacao
create policy "Authorized users can insert memory links"
    on public.strategic_memory_links for insert to authenticated
    with check (
        exists (
            select 1 from public.internal_users
            where id = auth.uid() and role in ('admin', 'operador', 'comunicacao') and status = 'active'
        )
    );

create policy "Authorized users can delete memory links"
    on public.strategic_memory_links for delete to authenticated
    using (
        exists (
            select 1 from public.internal_users
            where id = auth.uid() and role in ('admin', 'operador', 'comunicacao') and status = 'active'
        )
    );

-- 6. Triggers para updated_at
create trigger tr_strategic_memories_updated_at
    before update on public.strategic_memories
    for each row execute function public.handle_updated_at();

-- 7. Documentação
comment on table public.strategic_memories is 'Memória organizacional consolidando aprendizados coletivos por pauta e território.';
comment on table public.strategic_memory_links is 'Relação entre memórias e as entidades (planos, itens, evidências) que as originaram.';
