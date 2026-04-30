-- ============================================================
-- 010_topic_taxonomy
-- Cria taxonomia de temas para organizar posts e interações.
-- Foco no conteúdo, não no perfilamento político individual.
-- ============================================================

-- 1. Categorias de temas
create table if not exists public.topic_categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  color text null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.topic_categories enable row level security;

create policy "Authenticated users can read topic_categories"
  on public.topic_categories for select to authenticated using (true);

create policy "Admins and operators can manage topic_categories"
  on public.topic_categories for all to authenticated
  using (
    exists (
      select 1 from public.internal_users as me
      where me.id = auth.uid() and me.role in ('admin', 'operador') and me.status = 'active'
    )
  );

-- 2. Tags de temas em interações
create table if not exists public.interaction_topic_tags (
  id uuid primary key default gen_random_uuid(),
  interaction_id uuid not null references public.ig_interactions(id) on delete cascade,
  topic_id uuid not null references public.topic_categories(id) on delete cascade,
  source text not null check (source in ('manual', 'rule_suggestion', 'operator_confirmed')),
  confidence numeric null check (confidence >= 0 and confidence <= 1),
  created_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(interaction_id, topic_id)
);

alter table public.interaction_topic_tags enable row level security;

create policy "Authenticated users can read interaction_topic_tags"
  on public.interaction_topic_tags for select to authenticated using (true);

create policy "Admins and operators can manage interaction_topic_tags"
  on public.interaction_topic_tags for all to authenticated
  using (
    exists (
      select 1 from public.internal_users as me
      where me.id = auth.uid() and me.role in ('admin', 'operador') and me.status = 'active'
    )
  );

-- 3. Tags de temas em posts
create table if not exists public.post_topic_tags (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.ig_posts(id) on delete cascade,
  topic_id uuid not null references public.topic_categories(id) on delete cascade,
  source text not null check (source in ('manual', 'rule_suggestion', 'operator_confirmed')),
  confidence numeric null check (confidence >= 0 and confidence <= 1),
  created_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(post_id, topic_id)
);

alter table public.post_topic_tags enable row level security;

create policy "Authenticated users can read post_topic_tags"
  on public.post_topic_tags for select to authenticated using (true);

create policy "Admins and operators can manage post_topic_tags"
  on public.post_topic_tags for all to authenticated
  using (
    exists (
      select 1 from public.internal_users as me
      where me.id = auth.uid() and me.role in ('admin', 'operador') and me.status = 'active'
    )
  );

-- 4. Seeds iniciais
insert into public.topic_categories (slug, name, description, color) values
  ('saude', 'Saúde', 'Postos de saúde, hospitais, atendimentos, medicamentos e SUS.', '#ef4444'),
  ('transporte', 'Transporte', 'Ônibus, tarifas, linhas, pontos de ônibus e mobilidade urbana.', '#f59e0b'),
  ('educacao', 'Educação', 'Escolas, creches, professores, ensino e merenda.', '#3b82f6'),
  ('trabalho', 'Trabalho', 'Emprego, renda, qualificação e economia local.', '#10b981'),
  ('csn', 'CSN', 'Impactos da usina, relação com a cidade e questões corporativas.', '#6b7280'),
  ('poluicao', 'Poluição', 'Pó preto, qualidade do ar e resíduos industriais.', '#4b5563'),
  ('meio_ambiente', 'Meio Ambiente', 'Áreas verdes, saneamento, rios e clima.', '#22c55e'),
  ('bairro', 'Bairro', 'Demandas específicas de ruas, vilas e bairros.', '#8b5cf6'),
  ('denuncia', 'Denúncia', 'Relatos de irregularidades ou abandono de serviços.', '#b91c1c'),
  ('fiscalizacao', 'Fiscalização', 'Ação do poder público e acompanhamento de obras.', '#d97706'),
  ('cultura', 'Cultura', 'Eventos, patrimônio, lazer e artes.', '#ec4899'),
  ('juventude', 'Juventude', 'Demandas e espaços para jovens.', '#06b6d4'),
  ('plenaria', 'Plenária', 'Reuniões, encontros comunitários e escuta direta.', '#6366f1'),
  ('voluntariado', 'Voluntariado', 'Ações de ajuda mútua e engajamento cívico.', '#f97316'),
  ('economia_popular', 'Economia Popular', 'Feiras, pequenos negócios e sustento familiar.', '#84cc16'),
  ('moradia', 'Moradia', 'Habitação, regularização fundiária e infraestrutura urbana.', '#a855f7'),
  ('seguranca_publica', 'Segurança Pública', 'Iluminação, policiamento e prevenção.', '#1e293b'),
  ('outros', 'Outros', 'Assuntos que não se enquadram nas categorias principais.', '#94a3b8')
on conflict (slug) do nothing;

-- 5. Audit Actions (Placeholder - should be handled by app code but documented here)
comment on table public.topic_categories is 'Taxonomia de temas para classificação de conteúdo (não de pessoas).';
comment on table public.interaction_topic_tags is 'Associação de temas a comentários e interações públicas.';
comment on table public.post_topic_tags is 'Associação de temas a postagens autorais.';
