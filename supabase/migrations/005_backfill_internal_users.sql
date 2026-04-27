insert into public.internal_users (id, email, full_name)
select
  users.id,
  coalesce(users.email, ''),
  coalesce(users.raw_user_meta_data ->> 'full_name', users.raw_user_meta_data ->> 'name')
from auth.users as users
left join public.internal_users as internal_users
  on internal_users.id = users.id
where internal_users.id is null;
