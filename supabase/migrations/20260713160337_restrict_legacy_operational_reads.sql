-- Legacy operational policies used `USING (true)`, despite representing
-- internal data. Keep the public portfolio tables intentionally public.
do $$
declare
  policy_record record;
begin
  for policy_record in
    select tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and cmd = 'SELECT'
      and qual = 'true'
      and tablename not in ('services', 'testimonials', 'works')
  loop
    execute format('drop policy %I on public.%I', policy_record.policyname, policy_record.tablename);
    execute format(
      'create policy %I on public.%I for select to authenticated using ((select public.is_current_internal_user()))',
      policy_record.policyname,
      policy_record.tablename
    );
  end loop;
end;
$$;

drop policy if exists "Admins can archive mobilization_reports" on public.mobilization_reports;
