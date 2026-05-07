-- Migration 026: Field Agenda
-- Tracks public and collective field activities (meetings, plenaries, etc.)
-- Focused on neighborhoods and topics, no individual targeting.

create table if not exists public.field_agenda_events (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    description text null,
    type text not null check (type in (
        'roda_escuta',
        'reuniao',
        'plenaria',
        'panfletagem',
        'visita_bairro',
        'visita_institucional',
        'live',
        'mutirao_conversa',
        'outro'
    )),
    status text not null check (status in ('draft','planned','done','archived','cancelled')) default 'draft',
    neighborhood text null,
    topic_slug text null,
    source_report_id uuid null references public.mobilization_reports(id) on delete set null,
    source_action_plan_id uuid null references public.action_plans(id) on delete set null,
    source_corrective_action_id uuid null references public.silence_radar_corrective_actions(id) on delete set null,
    starts_at timestamptz null,
    ends_at timestamptz null,
    location_text text null,
    public_url text null,
    created_by uuid null,
    created_by_email text null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.field_agenda_event_results (
    id uuid primary key default gen_random_uuid(),
    event_id uuid not null references public.field_agenda_events(id) on delete cascade,
    result_summary text not null,
    estimated_people_count int null,
    topics_discussed jsonb not null default '[]'::jsonb,
    neighborhoods_mentioned jsonb not null default '[]'::jsonb,
    next_steps text null,
    created_by uuid null,
    created_by_email text null,
    created_at timestamptz not null default now(),
    metadata jsonb not null default '{}'::jsonb
);

-- RLS
alter table public.field_agenda_events enable row level security;
alter table public.field_agenda_event_results enable row level security;

-- Internal users can read
create policy "internal_can_read_field_agenda_events"
    on public.field_agenda_events for select to authenticated
    using (true);

create policy "internal_can_read_field_agenda_event_results"
    on public.field_agenda_event_results for select to authenticated
    using (true);

-- Creation/Management: admin, operador, comunicacao
create policy "authorized_can_manage_field_agenda_events"
    on public.field_agenda_events for all to authenticated
    using (
        exists (
            select 1 from public.internal_users
            where id = auth.uid() and role in ('admin', 'operador', 'comunicacao') and status = 'active'
        )
    );

create policy "authorized_can_manage_field_agenda_event_results"
    on public.field_agenda_event_results for all to authenticated
    using (
        exists (
            select 1 from public.internal_users
            where id = auth.uid() and role in ('admin', 'operador', 'comunicacao') and status = 'active'
        )
    );

-- Trigger for updated_at
create trigger tr_field_agenda_events_updated_at
    before update on public.field_agenda_events
    for each row execute function public.handle_updated_at();

-- Indexes
create index idx_field_agenda_events_status on public.field_agenda_events(status);
create index idx_field_agenda_events_neighborhood on public.field_agenda_events(neighborhood);
create index idx_field_agenda_events_topic_slug on public.field_agenda_events(topic_slug);
create index idx_field_agenda_events_starts_at on public.field_agenda_events(starts_at);

comment on table public.field_agenda_events is 'Agenda de atividades presenciais e publicas da pre-campanha.';
comment on table public.field_agenda_event_results is 'Resultados agregados e conclusoes de atividades de campo.';
