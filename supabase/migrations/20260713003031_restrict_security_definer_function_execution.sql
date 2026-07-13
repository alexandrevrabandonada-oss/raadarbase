-- Funções SECURITY DEFINER usadas internamente não devem ser endpoints RPC públicos.
-- O trigger de criação de usuário é executado pelo banco e não precisa de EXECUTE
-- concedido a papéis da Data API.

revoke all on function public.handle_internal_user_created() from public, anon, authenticated;

revoke all on function public.is_current_internal_admin() from public, anon;
grant execute on function public.is_current_internal_admin() to authenticated;

revoke all on function public.is_current_internal_user() from public, anon;
grant execute on function public.is_current_internal_user() to authenticated;
