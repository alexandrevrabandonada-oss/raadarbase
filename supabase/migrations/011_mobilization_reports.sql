-- ============================================================
-- 011_mobilization_reports
-- Cria estrutura para relatórios de mobilização por pauta.
-- Foco em escuta pública e volume de pautas, não perfilamento.
-- ============================================================

-- 1. Relatórios de mobilização
create table if not exists public.mobilization_reports (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  period_start date,
  period_end date,
  status text not null check (status in ('draft', 'generated', 'archived')) default 'draft',
  created_by uuid null references auth.users(id) on delete set null,
  created_by_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  generated_at timestamptz null,
  filters jsonb not null default '{}'::jsonb,
  snapshot jsonb not null default '{}'::jsonb
);

alter table public.mobilization_reports enable row level security;

create policy "Authenticated users can read mobilization_reports"
  on public.mobilization_reports for select to authenticated using (true);

create policy "Admins and operators can manage mobilization_reports"
  on public.mobilization_reports for all to authenticated
  using (
    exists (
      select 1 from public.internal_users as me
      where me.id = auth.uid() and me.role in ('admin', 'operador') and me.status = 'active'
    )
  );

create policy "Admins can archive mobilization_reports"
  on public.mobilization_reports for update to authenticated
  using (
    exists (
      select 1 from public.internal_users as me
      where me.id = auth.uid() and me.role = 'admin' and me.status = 'active'
    )
  );

-- 2. Temas incluídos no relatório
create table if not exists public.mobilization_report_topics (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.mobilization_reports(id) on delete cascade,
  topic_id uuid not null references public.topic_categories(id),
  interaction_count int not null default 0,
  post_count int not null default 0,
  people_count int not null default 0,
  summary text,
  created_at timestamptz not null default now(),
  unique(report_id, topic_id)
);

alter table public.mobilization_report_topics enable row level security;

create policy "Authenticated users can read mobilization_report_topics"
  on public.mobilization_report_topics for select to authenticated using (true);

create policy "Admins and operators can manage mobilization_report_topics"
  on public.mobilization_report_topics for all to authenticated
  using (
    exists (
      select 1 from public.internal_users as me
      where me.id = auth.uid() and me.role in ('admin', 'operador') and me.status = 'active'
    )
  );

-- 3. Audit actions e comentários
comment on table public.mobilization_reports is 'Relatórios consolidados de mobilização por pauta pública.';
comment on table public.mobilization_report_topics is 'Snapshot de métricas por tema dentro de um relatório específico.';
