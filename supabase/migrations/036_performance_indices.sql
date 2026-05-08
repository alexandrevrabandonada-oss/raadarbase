-- Migration 036: Operational Performance Indices
-- Improves performance for Kanban board and daily operational reports.

-- 1. Index for Kanban Column filtering
create index if not exists idx_outreach_tasks_column_key on public.outreach_tasks(column_key);

-- 2. Index for interaction theme analysis (used in reports)
create index if not exists idx_ig_interactions_theme on public.ig_interactions(theme) where theme is not null;

-- 3. Composite index for priority calculation (recent interactions per person)
-- Already covered by ig_interactions_person_idx but adding explicit one for clarity if needed.
-- create index if not exists idx_ig_interactions_person_recent on public.ig_interactions(person_id, occurred_at desc);

-- 4. Index for contact channel (used in quality reports)
create index if not exists idx_contacts_person_id on public.contacts(person_id);
