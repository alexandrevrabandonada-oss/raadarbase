-- auth.role() is not an authorization boundary. These records are internal
-- operational data, so require an active internal user instead.
drop policy if exists "leitura para usuarios internos public_receipt_distribution_logs"
  on public.public_receipt_distribution_logs;
drop policy if exists "leitura para usuarios internos public_receipt_distribution_cycles"
  on public.public_receipt_distribution_cycles;
drop policy if exists "authenticated insert works" on public.works;
drop policy if exists "authenticated update works" on public.works;
drop policy if exists "authenticated delete works" on public.works;

create policy "Internal users can read public receipt distribution logs"
  on public.public_receipt_distribution_logs
  for select to authenticated
  using ((select public.is_current_internal_user()));

create policy "Internal users can read public receipt distribution cycles"
  on public.public_receipt_distribution_cycles
  for select to authenticated
  using ((select public.is_current_internal_user()));

create policy "Internal users can insert works"
  on public.works
  for insert to authenticated
  with check ((select public.is_current_internal_user()));

create policy "Internal users can update works"
  on public.works
  for update to authenticated
  using ((select public.is_current_internal_user()))
  with check ((select public.is_current_internal_user()));

create policy "Internal users can delete works"
  on public.works
  for delete to authenticated
  using ((select public.is_current_internal_user()));
