-- ============================================================
-- 013_action_execution.sql
-- Módulo de Execução e Evidências das Ações
-- ============================================================

-- 1. Tabela de Evidências dos Itens de Ação
create table if not exists public.action_item_evidence (
    id uuid primary key default gen_random_uuid(),
    action_plan_item_id uuid not null references public.action_plan_items(id) on delete cascade,
    evidence_type text not null check (evidence_type in (
      'nota_interna',
      'link_publico',
      'arquivo_referencia',
      'foto_registro',
      'print_publico',
      'ata_reuniao',
      'encaminhamento',
      'resultado'
    )),
    title text not null,
    description text null,
    url text null,
    created_by uuid null references public.internal_users(id) on delete set null,
    created_by_email text null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    metadata jsonb not null default '{}'::jsonb
);

-- 2. Tabela de Resultados dos Itens de Ação
create table if not exists public.action_item_results (
    id uuid primary key default gen_random_uuid(),
    action_plan_item_id uuid not null references public.action_plan_items(id) on delete cascade unique,
    result_summary text not null,
    public_response text null,
    lessons_learned text null,
    next_step text null,
    created_by uuid null references public.internal_users(id) on delete set null,
    created_by_email text null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    metadata jsonb not null default '{}'::jsonb
);

-- 3. Habilitar RLS
alter table public.action_item_evidence enable row level security;
alter table public.action_item_results enable row level security;

-- 4. Policies para action_item_evidence

-- Leitura: Qualquer usuário interno autenticado
create policy "Internal users can read evidence"
    on public.action_item_evidence for select to authenticated
    using (true);

-- Criação/Edição: admin, operador, comunicacao
create policy "Authorized users can insert evidence"
    on public.action_item_evidence for insert to authenticated
    with check (
        exists (
            select 1 from public.internal_users
            where id = auth.uid() and role in ('admin', 'operador', 'comunicacao') and status = 'active'
        )
    );

create policy "Authorized users can update evidence"
    on public.action_item_evidence for update to authenticated
    using (
        exists (
            select 1 from public.internal_users
            where id = auth.uid() and role in ('admin', 'operador', 'comunicacao') and status = 'active'
        )
    );

-- Remoção: admin, operador
create policy "Admins and operators can delete evidence"
    on public.action_item_evidence for delete to authenticated
    using (
        exists (
            select 1 from public.internal_users
            where id = auth.uid() and role in ('admin', 'operador') and status = 'active'
        )
    );

-- 5. Policies para action_item_results

-- Leitura: Qualquer usuário interno autenticado
create policy "Internal users can read results"
    on public.action_item_results for select to authenticated
    using (true);

-- Criação/Edição: admin, operador, comunicacao
create policy "Authorized users can insert results"
    on public.action_item_results for insert to authenticated
    with check (
        exists (
            select 1 from public.internal_users
            where id = auth.uid() and role in ('admin', 'operador', 'comunicacao') and status = 'active'
        )
    );

create policy "Authorized users can update results"
    on public.action_item_results for update to authenticated
    using (
        exists (
            select 1 from public.internal_users
            where id = auth.uid() and role in ('admin', 'operador', 'comunicacao') and status = 'active'
        )
    );

-- Remoção: admin, operador
create policy "Admins and operators can delete results"
    on public.action_item_results for delete to authenticated
    using (
        exists (
            select 1 from public.internal_users
            where id = auth.uid() and role in ('admin', 'operador') and status = 'active'
        )
    );

-- 6. Triggers para updated_at
create trigger tr_action_item_evidence_updated_at
    before update on public.action_item_evidence
    for each row execute function public.handle_updated_at();

create trigger tr_action_item_results_updated_at
    before update on public.action_item_results
    for each row execute function public.handle_updated_at();

-- 7. Documentação
comment on table public.action_item_evidence is 'Evidências e registros de execução de uma tarefa.';
comment on table public.action_item_results is 'Sinalização de resultados, aprendizados e próximos passos de uma tarefa concluída.';
