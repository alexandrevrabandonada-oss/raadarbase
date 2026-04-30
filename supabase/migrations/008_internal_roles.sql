-- ============================================================
-- 008_internal_roles
-- Consolida papéis internos na tabela internal_users existente.
-- Papéis permitidos: admin | operador | comunicacao | leitura
-- ============================================================

-- 1. Normalizar registros legados (role = 'operator' → 'operador')
update public.internal_users
set role = 'operador', updated_at = now()
where role = 'operator';

-- 2. Adicionar constraint de papéis válidos (idempotente)
alter table public.internal_users
  drop constraint if exists internal_users_role_check;

alter table public.internal_users
  add constraint internal_users_role_check
  check (role in ('admin', 'operador', 'comunicacao', 'leitura'));

-- 3. Habilitar RLS em operational_retention_policies (estava desativado)
alter table public.operational_retention_policies enable row level security;

create policy "Authenticated users can read operational_retention_policies"
  on public.operational_retention_policies for select to authenticated using (true);

-- 4. Policies adicionais para internal_users (admins veem tudo)
create policy "Admin can read all internal users"
  on public.internal_users for select to authenticated
  using (
    exists (
      select 1 from public.internal_users as me
      where me.id = auth.uid() and me.role = 'admin' and me.status = 'active'
    )
  );

create policy "Admin can update internal users"
  on public.internal_users for update to authenticated
  using (
    exists (
      select 1 from public.internal_users as me
      where me.id = auth.uid() and me.role = 'admin' and me.status = 'active'
    )
  );
