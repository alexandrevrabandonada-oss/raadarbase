-- Reconciles legacy records that were already marked as contacted but had no
-- delivery audit. The actor stays null so the mural exposes them as unknown,
-- rather than crediting a volunteer without evidence.
insert into public.audit_logs (
  action,
  entity_type,
  entity_id,
  summary,
  metadata,
  created_at
)
select
  'contact.dm_sent',
  'ig_people',
  p.id,
  'Envio manual histórico reconciliado a partir do status abordado.',
  jsonb_build_object('origin', 'legacy_status_reconciliation', 'operator_attribution', 'unknown'),
  p.updated_at
from public.ig_people p
where p.status = 'abordado'
  and not exists (
    select 1
    from public.audit_logs a
    where a.entity_type = 'ig_people'
      and a.entity_id = p.id
      and a.action = 'contact.dm_sent'
  );
