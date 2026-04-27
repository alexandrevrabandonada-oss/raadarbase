do $$
declare
  total_users integer;
  active_admins integer;
begin
  select count(*), count(*) filter (where role = 'admin' and status = 'active')
  into total_users, active_admins
  from public.internal_users;

  if total_users = 1 and active_admins = 0 then
    update public.internal_users
    set
      role = 'admin',
      status = 'active',
      approved_at = now(),
      updated_at = now()
    where id = (
      select id
      from public.internal_users
      order by created_at asc
      limit 1
    );
  end if;
end
$$;
