-- Migration 033: Responsible Management
-- Adds explicit responsible management to core CRM entities.

-- 1. Rename owner_id to responsible_id on ig_people (owner_id was added in 032 but unused)
alter table public.ig_people rename column owner_id to responsible_id;

-- 2. Add responsible_id to outreach_tasks
alter table public.outreach_tasks add column if not exists responsible_id uuid references public.internal_users(id);

-- 3. Add responsible_id to ig_person_referrals
alter table public.ig_person_referrals add column if not exists responsible_id uuid references public.internal_users(id);

-- 4. Create indices for performance
create index if not exists idx_ig_people_responsible_id on public.ig_people(responsible_id);
create index if not exists idx_outreach_tasks_responsible_id on public.outreach_tasks(responsible_id);
create index if not exists idx_referrals_responsible_id on public.ig_person_referrals(responsible_id);
