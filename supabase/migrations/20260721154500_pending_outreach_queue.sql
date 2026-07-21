-- Consulta canônica da fila: o anti-join é executado pelo Postgres antes do
-- limite, garantindo que perfis já entregues não ocupem uma vaga da parcela.
create or replace function public.list_pending_outreach_people(
  p_statuses public.person_status[] default array['novo'::public.person_status, 'responder'::public.person_status],
  p_limit integer default 80
)
returns setof public.ig_people
language sql
stable
set search_path = ''
as $$
  select person.*
  from public.ig_people as person
  where person.status = any(p_statuses)
    and not exists (
      select 1
      from public.outreach_delivery_ledger as delivery
      where delivery.person_id = person.id
    )
  order by
    person.total_interactions desc,
    person.last_interaction_at desc nulls last,
    person.updated_at desc
  limit greatest(1, least(coalesce(p_limit, 80), 500));
$$;

revoke all on function public.list_pending_outreach_people(public.person_status[], integer) from public, anon, authenticated;
grant execute on function public.list_pending_outreach_people(public.person_status[], integer) to service_role;
