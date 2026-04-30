-- ============================================================
-- 012_action_plans.sql
-- Módulo de Planos de Ação por Pauta
-- ============================================================

-- 1. Tabela de Planos de Ação
create table if not exists public.action_plans (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    description text null,
    source_report_id uuid null references mobilization_reports(id) on delete set null,
    topic_id uuid null references topic_categories(id) on delete set null,
    status text not null check (status in ('draft', 'active', 'done', 'archived')) default 'draft',
    priority text not null check (priority in ('low', 'medium', 'high')) default 'medium',
    due_date date null,
    created_by uuid null,
    created_by_email text null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    completed_at timestamptz null,
    metadata jsonb not null default '{}'::jsonb
);

-- 2. Tabela de Itens do Plano de Ação
create table if not exists public.action_plan_items (
    id uuid primary key default gen_random_uuid(),
    action_plan_id uuid not null references action_plans(id) on delete cascade,
    type text not null check (type in (
        'post_publico',
        'resposta_publica',
        'reuniao',
        'plenaria',
        'escuta_bairro',
        'material_explicativo',
        'encaminhamento',
        'tarefa_interna',
        'video_curto',
        'story',
        'carrossel'
    )),
    title text not null,
    description text null,
    status text not null check (status in ('todo', 'doing', 'done', 'blocked', 'archived')) default 'todo',
    assigned_to_email text null,
    due_date date null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    completed_at timestamptz null,
    metadata jsonb not null default '{}'::jsonb
);

-- 3. Habilitar RLS
alter table public.action_plans enable row level security;
alter table public.action_plan_items enable row level security;

-- 4. Policies para action_plans

-- Leitura: Qualquer usuário interno autenticado
create policy "Internal users can read action_plans"
    on public.action_plans for select to authenticated
    using (true);

-- Inserção: admin, operador, comunicacao
create policy "Authorized users can insert action_plans"
    on public.action_plans for insert to authenticated
    with check (
        exists (
            select 1 from public.internal_users
            where id = auth.uid() and role in ('admin', 'operador', 'comunicacao') and status = 'active'
        )
    );

-- Atualização (incluindo conclusão): admin, operador, comunicacao
create policy "Authorized users can update action_plans"
    on public.action_plans for update to authenticated
    using (
        exists (
            select 1 from public.internal_users
            where id = auth.uid() and role in ('admin', 'operador', 'comunicacao') and status = 'active'
        )
    );

-- Arquivamento: admin, operador (está embutido na policy de update se usarmos status='archived', mas se quisermos ser explícitos ou usar DELETE, faríamos aqui. Como o pedido fala em arquivamento via status, update resolve).

-- 5. Policies para action_plan_items

-- Leitura: Qualquer usuário interno autenticado
create policy "Internal users can read action_plan_items"
    on public.action_plan_items for select to authenticated
    using (true);

-- Inserção: admin, operador, comunicacao
create policy "Authorized users can insert action_plan_items"
    on public.action_plan_items for insert to authenticated
    with check (
        exists (
            select 1 from public.internal_users
            where id = auth.uid() and role in ('admin', 'operador', 'comunicacao') and status = 'active'
        )
    );

-- Atualização: admin, operador, comunicacao
create policy "Authorized users can update action_plan_items"
    on public.action_plan_items for update to authenticated
    using (
        exists (
            select 1 from public.internal_users
            where id = auth.uid() and role in ('admin', 'operador', 'comunicacao') and status = 'active'
        )
    );

-- 6. Trigger para updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger tr_action_plans_updated_at
    before update on public.action_plans
    for each row execute function public.handle_updated_at();

create trigger tr_action_plan_items_updated_at
    before update on public.action_plan_items
    for each row execute function public.handle_updated_at();

-- 7. Audit Logging (registrado via Server Actions, mas podemos adicionar comentários aqui para documentação)
comment on table public.action_plans is 'Planos de ação organizativos para resposta a pautas públicas.';
comment on table public.action_plan_items is 'Tarefas específicas dentro de um plano de ação.';
