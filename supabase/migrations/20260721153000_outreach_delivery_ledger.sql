-- Fonte de verdade imutável para a primeira DM já enviada.
-- O estado da fila nunca deve depender apenas de status, tarefa ou cache do navegador.

create table if not exists public.outreach_delivery_ledger (
  person_id uuid primary key references public.ig_people(id) on delete cascade,
  sent_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  source text not null check (source in (
    'canonical_confirmation',
    'dm_sent_audit',
    'person_status',
    'manual_dm_interaction',
    'instagram_contact'
  )),
  source_audit_id uuid null references public.audit_logs(id) on delete set null,
  actor_id uuid null,
  actor_email text null,
  metadata jsonb not null default '{}'::jsonb
);

alter table public.outreach_delivery_ledger enable row level security;

drop policy if exists "Internal users can read outreach_delivery_ledger" on public.outreach_delivery_ledger;
create policy "Internal users can read outreach_delivery_ledger"
  on public.outreach_delivery_ledger
  for select
  to authenticated
  using ((select private.is_current_internal_user()));

-- A chave primária dá a garantia de idempotência. Os índices abaixo atendem
-- à auditoria temporal e ao mural sem aumentar o custo da consulta principal.
create index if not exists idx_outreach_delivery_ledger_sent_at
  on public.outreach_delivery_ledger (sent_at desc);
create index if not exists idx_outreach_delivery_ledger_actor_sent_at
  on public.outreach_delivery_ledger (actor_id, sent_at desc)
  where actor_id is not null;

-- Qualquer registro direto de dm_sent também grava a trava permanente.
create or replace function private.capture_outreach_delivery_from_audit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.entity_type = 'ig_people'
     and new.action = 'contact.dm_sent'
     and new.entity_id is not null then
    insert into public.outreach_delivery_ledger (
      person_id,
      sent_at,
      source,
      source_audit_id,
      actor_id,
      actor_email,
      metadata
    )
    values (
      new.entity_id,
      new.created_at,
      'dm_sent_audit',
      new.id,
      new.actor_id,
      new.actor_email,
      coalesce(new.metadata, '{}'::jsonb)
    )
    on conflict (person_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists capture_outreach_delivery_from_audit on public.audit_logs;
create trigger capture_outreach_delivery_from_audit
  after insert on public.audit_logs
  for each row
  execute function private.capture_outreach_delivery_from_audit();

-- Também protege alterações de status feitas por rotas legadas ou importações.
create or replace function private.capture_outreach_delivery_from_person_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status in ('abordado', 'respondeu', 'contato_confirmado')
     and new.status is distinct from old.status then
    insert into public.outreach_delivery_ledger (
      person_id,
      sent_at,
      source,
      actor_id,
      actor_email,
      metadata
    )
    values (
      new.id,
      coalesce(new.updated_at, now()),
      'person_status',
      null,
      null,
      jsonb_build_object('status', new.status)
    )
    on conflict (person_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists capture_outreach_delivery_from_person_status on public.ig_people;
create trigger capture_outreach_delivery_from_person_status
  after update of status on public.ig_people
  for each row
  execute function private.capture_outreach_delivery_from_person_status();

-- Confirmação atômica: somente quem insere a linha do ledger executa os
-- efeitos derivados. Tentativas concorrentes retornam "recorded = false".
create or replace function public.confirm_outreach_delivery(
  p_person_id uuid,
  p_actor_id uuid,
  p_actor_email text,
  p_origin text,
  p_template_id text default null,
  p_sent_at timestamptz default now()
)
returns table(recorded boolean, sent_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sent_at timestamptz;
begin
  if p_person_id is null or p_actor_id is null then
    raise exception 'person_id e actor_id são obrigatórios';
  end if;

  if nullif(btrim(p_origin), '') is null or char_length(p_origin) > 100 then
    raise exception 'origem de envio inválida';
  end if;

  if not exists (select 1 from public.ig_people where id = p_person_id) then
    raise exception 'Pessoa não encontrada';
  end if;

  insert into public.outreach_delivery_ledger (
    person_id,
    sent_at,
    source,
    actor_id,
    actor_email,
    metadata
  )
  values (
    p_person_id,
    coalesce(p_sent_at, now()),
    'canonical_confirmation',
    p_actor_id,
    nullif(btrim(p_actor_email), ''),
    jsonb_build_object(
      'origin', p_origin,
      'template_id', nullif(btrim(p_template_id), ''),
      'auto_status', true,
      'automatic_on_return', p_origin = 'minha_fila_retorno_instagram'
    )
  )
  on conflict (person_id) do nothing
  returning outreach_delivery_ledger.sent_at into v_sent_at;

  if not found then
    select delivery.sent_at into v_sent_at
    from public.outreach_delivery_ledger as delivery
    where delivery.person_id = p_person_id;
    return query select false, v_sent_at;
    return;
  end if;

  update public.ig_people
  set status = 'abordado', updated_at = now()
  where id = p_person_id
    and status in ('novo', 'responder');

  insert into public.contacts (
    person_id,
    contact_channel,
    source,
    consent_given,
    consent_purpose,
    consent_status,
    last_contacted_at
  )
  values (
    p_person_id,
    'Instagram',
    'instagram_manual',
    false,
    'Contato comunitário via Instagram',
    'pending',
    v_sent_at
  )
  on conflict (person_id) do update
  set last_contacted_at = case
    when public.contacts.last_contacted_at is null
      or excluded.last_contacted_at > public.contacts.last_contacted_at
      then excluded.last_contacted_at
    else public.contacts.last_contacted_at
  end;

  with current_task as (
    select task.id
    from public.outreach_tasks as task
    where task.person_id = p_person_id
      and task.completed_at is null
    order by task.created_at desc
    limit 1
    for update
  ), updated_task as (
    update public.outreach_tasks as task
    set
      column_key = 'esperando_resposta',
      title = 'Aguardar retorno da pessoa (Auto-Status)',
      notes = 'Confirmação de envio manual registrada. Sistema moveu automaticamente para Aguardando Retorno.',
      updated_at = now()
    where task.id in (select id from current_task)
    returning task.id
  )
  insert into public.outreach_tasks (
    person_id,
    column_key,
    title,
    notes,
    completed_at
  )
  select
    p_person_id,
    'esperando_resposta',
    'Aguardar retorno da pessoa (Auto-Status)',
    'Confirmação de envio manual registrada. Sistema moveu automaticamente para Aguardando Retorno.',
    null
  where not exists (select 1 from updated_task);

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
  values (
    p_actor_id,
    nullif(btrim(p_actor_email), ''),
    'contact.dm_sent',
    'ig_people',
    p_person_id,
    case
      when p_origin = 'minha_fila_retorno_instagram'
        then 'DM manual registrada automaticamente após retorno do Instagram.'
      else 'DM confirmada como enviada manualmente.'
    end,
    jsonb_build_object(
      'origin', p_origin,
      'template_id', nullif(btrim(p_template_id), ''),
      'auto_status', true,
      'automatic_on_return', p_origin = 'minha_fila_retorno_instagram'
    ),
    v_sent_at
  );

  return query select true, v_sent_at;
end;
$$;

revoke all on function private.capture_outreach_delivery_from_audit() from public, anon, authenticated;
revoke all on function private.capture_outreach_delivery_from_person_status() from public, anon, authenticated;
revoke all on function public.confirm_outreach_delivery(uuid, uuid, text, text, text, timestamptz) from public, anon, authenticated;
grant execute on function public.confirm_outreach_delivery(uuid, uuid, text, text, text, timestamptz) to service_role;

-- Reconciliamos somente evidências já aceitas pelo fluxo existente. A operação
-- não altera pessoas, mensagens ou créditos de voluntários.
insert into public.outreach_delivery_ledger (
  person_id,
  sent_at,
  source,
  source_audit_id,
  actor_id,
  actor_email,
  metadata
)
select distinct on (evidence.person_id)
  evidence.person_id,
  evidence.sent_at,
  evidence.source,
  evidence.source_audit_id,
  evidence.actor_id,
  evidence.actor_email,
  evidence.metadata
from (
  select
    audit.entity_id as person_id,
    audit.created_at as sent_at,
    'dm_sent_audit'::text as source,
    audit.id as source_audit_id,
    audit.actor_id,
    audit.actor_email,
    coalesce(audit.metadata, '{}'::jsonb) as metadata,
    1 as precedence
  from public.audit_logs as audit
  where audit.entity_type = 'ig_people'
    and audit.action = 'contact.dm_sent'
    and audit.entity_id is not null

  union all

  select
    interaction.person_id,
    interaction.occurred_at,
    'manual_dm_interaction'::text,
    null::uuid,
    null::uuid,
    null::text,
    jsonb_build_object('interaction_id', interaction.id),
    2
  from public.ig_interactions as interaction
  where interaction.type = 'dm_manual'

  union all

  select
    contact.person_id,
    contact.last_contacted_at,
    'instagram_contact'::text,
    null::uuid,
    null::uuid,
    null::text,
    jsonb_build_object('contact_id', contact.id),
    3
  from public.contacts as contact
  where contact.last_contacted_at is not null
    and lower(coalesce(contact.contact_channel, '')) = 'instagram'

  union all

  select
    person.id,
    coalesce(person.updated_at, now()),
    'person_status'::text,
    null::uuid,
    null::uuid,
    null::text,
    jsonb_build_object('status', person.status),
    4
  from public.ig_people as person
  where person.status in ('abordado', 'respondeu', 'contato_confirmado')
) as evidence
order by evidence.person_id, evidence.precedence, evidence.sent_at, evidence.source_audit_id
on conflict (person_id) do nothing;

create or replace view public.outreach_delivery_audit
with (security_invoker = true)
as
select
  person.id as person_id,
  person.username,
  person.status,
  delivery.sent_at,
  delivery.source,
  case
    when delivery.person_id is null and person.status in ('abordado', 'respondeu', 'contato_confirmado') then 'status_without_ledger'
    when delivery.person_id is not null and person.status in ('novo', 'responder') then 'ledger_with_pending_status'
    else 'consistent'
  end as audit_state
from public.ig_people as person
left join public.outreach_delivery_ledger as delivery on delivery.person_id = person.id;

revoke all on table public.outreach_delivery_audit from public, anon;
grant select on table public.outreach_delivery_audit to authenticated;
