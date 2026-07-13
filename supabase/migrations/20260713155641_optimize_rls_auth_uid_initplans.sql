-- Evaluate the authenticated user id once per statement instead of once per row.
-- The policy predicates and authorization rules remain unchanged.
do $$
declare
  policy_record record;
  using_clause text;
  with_check_clause text;
begin
  for policy_record in
    select schemaname, tablename, policyname, qual, with_check
    from pg_policies
    where schemaname = 'public'
      and (
        coalesce(qual, '') like '%auth.uid()%'
        or coalesce(with_check, '') like '%auth.uid()%'
      )
  loop
    using_clause := case
      when policy_record.qual is null then ''
      else format(' using (%s)', replace(policy_record.qual, 'auth.uid()', '(select auth.uid())'))
    end;

    with_check_clause := case
      when policy_record.with_check is null then ''
      else format(' with check (%s)', replace(policy_record.with_check, 'auth.uid()', '(select auth.uid())'))
    end;

    execute format(
      'alter policy %I on %I.%I%s%s',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename,
      using_clause,
      with_check_clause
    );
  end loop;
end;
$$;
