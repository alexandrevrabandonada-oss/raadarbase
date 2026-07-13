-- Authorization helpers are used by RLS policies but must not be exposed as
-- PostgREST RPC endpoints. PostgreSQL preserves policy dependencies by OID
-- when moving the functions between schemas.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

alter function public.is_current_internal_admin() set schema private;
alter function public.is_current_internal_user() set schema private;

revoke all on function private.is_current_internal_admin() from public, anon;
revoke all on function private.is_current_internal_user() from public, anon;
grant execute on function private.is_current_internal_admin() to authenticated;
grant execute on function private.is_current_internal_user() to authenticated;
