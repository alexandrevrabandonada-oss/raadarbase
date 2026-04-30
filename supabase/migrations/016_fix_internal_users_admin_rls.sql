-- ============================================================
-- 016_fix_internal_users_admin_rls
-- Corrige recursao de RLS nas policies de admin de internal_users.
-- ============================================================

create or replace function public.is_current_internal_admin()
returns boolean
language sql
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.internal_users me
    where me.id = auth.uid()
      and me.role = 'admin'
      and me.status = 'active'
  );
$$;

revoke all on function public.is_current_internal_admin() from public;
grant execute on function public.is_current_internal_admin() to authenticated;

drop policy if exists "Admin can read all internal users" on public.internal_users;
create policy "Admin can read all internal users"
  on public.internal_users for select to authenticated
  using (public.is_current_internal_admin());

drop policy if exists "Admin can update internal users" on public.internal_users;
create policy "Admin can update internal users"
  on public.internal_users for update to authenticated
  using (public.is_current_internal_admin())
  with check (public.is_current_internal_admin());
