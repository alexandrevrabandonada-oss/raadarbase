create extension if not exists pgcrypto;

create type person_status as enum (
  'novo',
  'responder',
  'abordado',
  'respondeu',
  'contato_confirmado',
  'nao_abordar'
);

create type interaction_type as enum (
  'comentario',
  'curtida',
  'resposta_story',
  'dm_manual'
);

create table ig_posts (
  id uuid primary key default gen_random_uuid(),
  instagram_post_id text unique not null,
  shortcode text,
  caption text,
  permalink text,
  media_type text,
  published_at timestamptz,
  metrics jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table ig_people (
  id uuid primary key default gen_random_uuid(),
  instagram_user_id text unique,
  username text not null,
  display_name text,
  status person_status not null default 'novo',
  themes text[] not null default '{}',
  notes text not null default '',
  total_interactions integer not null default 0,
  last_interaction_at timestamptz,
  do_not_contact_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ig_people_username_idx on ig_people using gin (to_tsvector('simple', username));
create index ig_people_status_idx on ig_people (status);
create index ig_people_last_interaction_idx on ig_people (last_interaction_at desc);

create table ig_interactions (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references ig_people(id) on delete cascade,
  post_id uuid references ig_posts(id) on delete set null,
  instagram_interaction_id text unique,
  type interaction_type not null,
  text_content text,
  theme text,
  occurred_at timestamptz not null,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index ig_interactions_person_idx on ig_interactions (person_id, occurred_at desc);
create index ig_interactions_post_idx on ig_interactions (post_id);

create table contacts (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references ig_people(id) on delete cascade,
  contact_channel text not null,
  contact_value text,
  consent_given boolean not null default false,
  consent_purpose text not null,
  consent_recorded_at timestamptz,
  privacy_policy_url text,
  source text not null default 'instagram_manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table outreach_tasks (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references ig_people(id) on delete cascade,
  column_key text not null,
  title text not null,
  notes text not null default '',
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table message_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  theme text,
  body text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table ig_posts enable row level security;
alter table ig_people enable row level security;
alter table ig_interactions enable row level security;
alter table contacts enable row level security;
alter table outreach_tasks enable row level security;
alter table message_templates enable row level security;
alter table audit_logs enable row level security;

create policy "Authenticated users can read ig_posts" on ig_posts for select to authenticated using (true);
create policy "Authenticated users can read ig_people" on ig_people for select to authenticated using (true);
create policy "Authenticated users can read ig_interactions" on ig_interactions for select to authenticated using (true);
create policy "Authenticated users can read contacts" on contacts for select to authenticated using (true);
create policy "Authenticated users can read outreach_tasks" on outreach_tasks for select to authenticated using (true);
create policy "Authenticated users can read message_templates" on message_templates for select to authenticated using (true);
create policy "Authenticated users can read audit_logs" on audit_logs for select to authenticated using (true);
