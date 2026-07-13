-- Restringe as tabelas legadas expostas pela Data API a usuarios internos ativos.
-- As escritas seguem exclusivas das server actions/service role.

drop policy if exists "Authenticated users can read ig_posts" on public.ig_posts;
drop policy if exists "Authenticated users can read ig_people" on public.ig_people;
drop policy if exists "Authenticated users can read ig_interactions" on public.ig_interactions;
drop policy if exists "Authenticated users can read contacts" on public.contacts;
drop policy if exists "Authenticated users can read outreach_tasks" on public.outreach_tasks;
drop policy if exists "Authenticated users can read message_templates" on public.message_templates;
drop policy if exists "Authenticated users can read audit_logs" on public.audit_logs;

create policy "Internal users can read ig_posts" on public.ig_posts
  for select to authenticated using ((select public.is_current_internal_user()));
create policy "Internal users can read ig_people" on public.ig_people
  for select to authenticated using ((select public.is_current_internal_user()));
create policy "Internal users can read ig_interactions" on public.ig_interactions
  for select to authenticated using ((select public.is_current_internal_user()));
create policy "Internal users can read contacts" on public.contacts
  for select to authenticated using ((select public.is_current_internal_user()));
create policy "Internal users can read outreach_tasks" on public.outreach_tasks
  for select to authenticated using ((select public.is_current_internal_user()));
create policy "Internal users can read message_templates" on public.message_templates
  for select to authenticated using ((select public.is_current_internal_user()));
create policy "Internal users can read audit_logs" on public.audit_logs
  for select to authenticated using ((select public.is_current_internal_user()));
