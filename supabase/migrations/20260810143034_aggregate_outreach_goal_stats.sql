create or replace function public.get_outreach_goal_stats_snapshot(
  p_today_start timestamp with time zone
)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $function$
  with people_counts as (
    select
      count(*)::bigint as total_people,
      count(*) filter (where status = 'nao_abordar')::bigint as do_not_contact,
      count(*) filter (
        where status in ('abordado', 'respondeu', 'contato_confirmado')
      )::bigint as sent_by_status
    from public.ig_people
  ),
  audit_summary as (
    select
      count(*) filter (where created_at >= p_today_start)::bigint as sent_today
    from public.audit_logs
    where action = 'contact.dm_sent'
  ),
  first_sends as (
    select distinct on (entity_id)
      id as audit_id,
      entity_id,
      actor_id,
      actor_email,
      created_at
    from public.audit_logs
    where action = 'contact.dm_sent'
      and entity_id is not null
    order by entity_id, created_at asc, id asc
  ),
  operator_rollups as (
    select
      coalesce(actor_id::text, actor_email, 'sem-operador') as operator_key,
      (array_agg(actor_id order by created_at asc, audit_id asc))[1] as actor_id,
      (array_agg(actor_email order by created_at asc, audit_id asc))[1] as actor_email,
      count(*)::bigint as total_sent,
      count(*) filter (where created_at >= p_today_start)::bigint as sent_today,
      max(created_at) as last_sent_at
    from first_sends
    group by coalesce(actor_id::text, actor_email, 'sem-operador')
  ),
  operator_scores as (
    select
      rollup.actor_id as operator_id,
      coalesce(active_operator.email, rollup.actor_email) as operator_email,
      case
        when active_operator.id is not null then
          coalesce(nullif(active_operator.full_name, ''), active_operator.email, 'Operador')
        else coalesce(rollup.actor_email, 'Sem operador identificado')
      end as operator_name,
      rollup.total_sent,
      rollup.sent_today,
      rollup.last_sent_at
    from operator_rollups as rollup
    left join public.internal_users as active_operator
      on active_operator.id = rollup.actor_id
      and active_operator.status = 'active'
  )
  select jsonb_build_object(
    'total_people', people_counts.total_people,
    'do_not_contact', people_counts.do_not_contact,
    'sent_by_status', people_counts.sent_by_status,
    'sent_today', audit_summary.sent_today,
    'operator_scores', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'operator_id', operator_id,
            'operator_email', operator_email,
            'operator_name', operator_name,
            'total_sent', total_sent,
            'sent_today', sent_today,
            'last_sent_at', last_sent_at
          )
          order by total_sent desc, sent_today desc, operator_name asc
        )
        from operator_scores
      ),
      '[]'::jsonb
    )
  )
  from people_counts
  cross join audit_summary;
$function$;

comment on function public.get_outreach_goal_stats_snapshot(timestamp with time zone)
is 'Returns the outreach goal counters and per-operator rollups without transferring the audit history.';

revoke execute on function public.get_outreach_goal_stats_snapshot(timestamp with time zone)
from public, anon, authenticated;

grant execute on function public.get_outreach_goal_stats_snapshot(timestamp with time zone)
to service_role;
