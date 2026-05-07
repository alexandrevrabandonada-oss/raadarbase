-- Migration 023: Silence Radar Corrective Actions
-- Tracks corrective actions generated from Radar de Silêncios findings.
-- All data is aggregated by bairro/pauta/post/janela — no PII, no individual scoring.

create table if not exists silence_radar_corrective_actions (
  id                  uuid        primary key default gen_random_uuid(),
  action_plan_item_id uuid        null references action_plan_items(id) on delete set null,
  kind                text        not null check (kind in (
                                    'reforco_bairro',
                                    'explicacao_pauta',
                                    'pergunta_publica',
                                    'roda_escuta',
                                    'card_explicativo'
                                  )),
  target_type         text        not null check (target_type in ('bairro', 'pauta', 'post', 'janela')),
  target_label        text        not null,
  source_metric       text        not null,
  baseline_value      numeric     null,
  baseline_snapshot   jsonb       not null default '{}'::jsonb,
  status              text        not null check (status in ('planned', 'doing', 'done', 'archived')) default 'planned',
  created_by          uuid        null,
  created_by_email    text        null,
  created_at          timestamptz not null default now(),
  completed_at        timestamptz null,
  metadata            jsonb       not null default '{}'::jsonb
);

-- ── RLS ────────────────────────────────────────────────────────────────────
alter table silence_radar_corrective_actions enable row level security;

-- Internal (approved) users can read all corrective actions
create policy "internal_can_select_silence_radar_corrective_actions"
  on silence_radar_corrective_actions
  for select
  using (
    exists (
      select 1
      from internal_users u
      where u.id = auth.uid()
        and u.status = 'active'
    )
  );

-- Anonymous users cannot write (service_role bypasses RLS for server-side writes)
create policy "deny_anon_insert_silence_radar_corrective_actions"
  on silence_radar_corrective_actions
  for insert
  with check (false);

create policy "deny_anon_update_silence_radar_corrective_actions"
  on silence_radar_corrective_actions
  for update
  using (false);

create policy "deny_anon_delete_silence_radar_corrective_actions"
  on silence_radar_corrective_actions
  for delete
  using (false);

-- ── Index ──────────────────────────────────────────────────────────────────
create index if not exists idx_srca_target
  on silence_radar_corrective_actions (target_type, target_label, status);

create index if not exists idx_srca_status
  on silence_radar_corrective_actions (status);

create index if not exists idx_srca_action_plan_item
  on silence_radar_corrective_actions (action_plan_item_id)
  where action_plan_item_id is not null;
