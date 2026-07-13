-- Reconcilia somente retornos antigos em que a abertura/preparação da DM foi
-- registrada, mas a confirmação de envio não persistiu. A operação é
-- deliberadamente restrita a perfis ainda pendentes e sem evento dm_sent.
with first_preparation as (
  select distinct on (audit.entity_id)
    audit.entity_id,
    audit.actor_id,
    audit.actor_email,
    audit.created_at as prepared_at
  from public.audit_logs as audit
  where audit.entity_type = 'ig_people'
    and audit.action = 'contact.dm_prepared'
    and audit.entity_id is not null
  order by audit.entity_id, audit.created_at asc, audit.id asc
), reconciled_people as (
  update public.ig_people as person
  set
    status = 'abordado',
    updated_at = now()
  from first_preparation as preparation
  where person.id = preparation.entity_id
    and person.status in ('novo', 'responder')
    and not exists (
      select 1
      from public.audit_logs as sent_audit
      where sent_audit.entity_type = 'ig_people'
        and sent_audit.entity_id = person.id
        and sent_audit.action = 'contact.dm_sent'
    )
  returning person.id
)
insert into public.audit_logs (
  actor_id,
  actor_email,
  action,
  entity_type,
  entity_id,
  summary,
  metadata,
  created_at
)
select
  preparation.actor_id,
  preparation.actor_email,
  'contact.dm_sent',
  'ig_people',
  reconciled.id,
  'Envio manual reconciliado com autorização a partir de mensagem preparada.',
  jsonb_build_object(
    'origin', 'prepared_dm_reconciliation',
    'authorized', true,
    'prepared_at', preparation.prepared_at
  ),
  now()
from reconciled_people as reconciled
join first_preparation as preparation on preparation.entity_id = reconciled.id;
