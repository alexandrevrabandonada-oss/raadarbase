-- Criar índices de performance adicionais no schema public

-- 1. Tabela outreach_tasks
create index if not exists idx_outreach_tasks_pending on public.outreach_tasks (completed_at, created_at desc);
create index if not exists idx_outreach_tasks_person_id on public.outreach_tasks (person_id);
create index if not exists idx_outreach_tasks_responsible_completed on public.outreach_tasks (responsible_id, completed_at);

-- 2. Tabela ig_interactions
create index if not exists idx_ig_interactions_occurred_at on public.ig_interactions (occurred_at desc);

-- 3. Tabela audit_logs
create index if not exists idx_audit_logs_entity on public.audit_logs (entity_type, entity_id, created_at desc);
create index if not exists idx_audit_logs_action on public.audit_logs (action, created_at desc);
create index if not exists idx_audit_logs_created_at on public.audit_logs (created_at desc);
