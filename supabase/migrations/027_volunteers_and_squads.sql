-- Migration 027: Volunteers and campaign squads
-- Internal-only organization of explicitly consented volunteers.
-- No automatic import from Instagram interactions, no auto-contact, no microtargeting.

create table if not exists public.campaign_volunteers (
    id uuid primary key default gen_random_uuid(),
    display_name text not null,
    neighborhood text null,
    city text null default 'Volta Redonda',
    contact_email text null,
    contact_phone text null,
    contact_preference text not null check (contact_preference in ('whatsapp','email','telefone','nenhum')) default 'nenhum',
    consent_to_contact boolean not null default false,
    consent_to_store_data boolean not null default false,
    availability jsonb not null default '{}'::jsonb,
    skills jsonb not null default '[]'::jsonb,
    interests jsonb not null default '[]'::jsonb,
    status text not null check (status in ('novo','ativo','pausado','arquivado')) default 'novo',
    source text not null check (source in ('formulario','evento_campo','indicacao','outro')) default 'formulario',
    created_by uuid null,
    created_by_email text null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    metadata jsonb not null default '{}'::jsonb,
    constraint campaign_volunteers_store_consent_required
        check (consent_to_store_data = true),
    constraint campaign_volunteers_contact_consent_required
        check (
            ((contact_email is null or btrim(contact_email) = '') and (contact_phone is null or btrim(contact_phone) = ''))
            or consent_to_contact = true
        ),
    constraint campaign_volunteers_contact_preference_safe
        check (
            consent_to_contact = true
            or contact_preference = 'nenhum'
            or ((contact_email is null or btrim(contact_email) = '') and (contact_phone is null or btrim(contact_phone) = ''))
        )
);

create table if not exists public.campaign_squads (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    description text null,
    kind text not null check (kind in ('rua','comunicacao','dados','formacao','eventos','territorio','outro')),
    status text not null check (status in ('ativo','pausado','arquivado')) default 'ativo',
    created_by uuid null,
    created_by_email text null,
    created_at timestamptz not null default now(),
    metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.campaign_squad_members (
    id uuid primary key default gen_random_uuid(),
    squad_id uuid not null references public.campaign_squads(id) on delete cascade,
    volunteer_id uuid not null references public.campaign_volunteers(id) on delete cascade,
    role text null,
    joined_at timestamptz not null default now(),
    status text not null check (status in ('ativo','pausado','removido')) default 'ativo',
    unique (squad_id, volunteer_id)
);

create table if not exists public.field_agenda_event_volunteers (
    id uuid primary key default gen_random_uuid(),
    event_id uuid not null references public.field_agenda_events(id) on delete cascade,
    volunteer_id uuid not null references public.campaign_volunteers(id) on delete cascade,
    role text null,
    status text not null check (status in ('convidado','confirmado','presente','ausente','removido')) default 'convidado',
    created_at timestamptz not null default now(),
    unique (event_id, volunteer_id)
);

create index if not exists idx_campaign_volunteers_status on public.campaign_volunteers(status);
create index if not exists idx_campaign_volunteers_city on public.campaign_volunteers(city);
create index if not exists idx_campaign_volunteers_neighborhood on public.campaign_volunteers(neighborhood);
create index if not exists idx_campaign_squads_status on public.campaign_squads(status);
create index if not exists idx_campaign_squads_kind on public.campaign_squads(kind);
create index if not exists idx_campaign_squad_members_squad_id on public.campaign_squad_members(squad_id);
create index if not exists idx_campaign_squad_members_volunteer_id on public.campaign_squad_members(volunteer_id);
create index if not exists idx_field_agenda_event_volunteers_event_id on public.field_agenda_event_volunteers(event_id);
create index if not exists idx_field_agenda_event_volunteers_volunteer_id on public.field_agenda_event_volunteers(volunteer_id);
create index if not exists idx_field_agenda_event_volunteers_status on public.field_agenda_event_volunteers(status);

alter table public.campaign_volunteers enable row level security;
alter table public.campaign_squads enable row level security;
alter table public.campaign_squad_members enable row level security;
alter table public.field_agenda_event_volunteers enable row level security;

create policy "internal_can_read_campaign_volunteers"
    on public.campaign_volunteers for select to authenticated
    using (
        exists (
            select 1 from public.internal_users
            where id = auth.uid() and role in ('admin', 'operador', 'comunicacao', 'leitura') and status = 'active'
        )
    );

create policy "authorized_can_manage_campaign_volunteers"
    on public.campaign_volunteers for all to authenticated
    using (
        exists (
            select 1 from public.internal_users
            where id = auth.uid() and role in ('admin', 'operador', 'comunicacao') and status = 'active'
        )
    )
    with check (
        exists (
            select 1 from public.internal_users
            where id = auth.uid() and role in ('admin', 'operador', 'comunicacao') and status = 'active'
        )
    );

create policy "internal_can_read_campaign_squads"
    on public.campaign_squads for select to authenticated
    using (
        exists (
            select 1 from public.internal_users
            where id = auth.uid() and role in ('admin', 'operador', 'comunicacao', 'leitura') and status = 'active'
        )
    );

create policy "authorized_can_manage_campaign_squads"
    on public.campaign_squads for all to authenticated
    using (
        exists (
            select 1 from public.internal_users
            where id = auth.uid() and role in ('admin', 'operador', 'comunicacao') and status = 'active'
        )
    )
    with check (
        exists (
            select 1 from public.internal_users
            where id = auth.uid() and role in ('admin', 'operador', 'comunicacao') and status = 'active'
        )
    );

create policy "internal_can_read_campaign_squad_members"
    on public.campaign_squad_members for select to authenticated
    using (
        exists (
            select 1 from public.internal_users
            where id = auth.uid() and role in ('admin', 'operador', 'comunicacao', 'leitura') and status = 'active'
        )
    );

create policy "authorized_can_manage_campaign_squad_members"
    on public.campaign_squad_members for all to authenticated
    using (
        exists (
            select 1 from public.internal_users
            where id = auth.uid() and role in ('admin', 'operador', 'comunicacao') and status = 'active'
        )
    )
    with check (
        exists (
            select 1 from public.internal_users
            where id = auth.uid() and role in ('admin', 'operador', 'comunicacao') and status = 'active'
        )
    );

create policy "internal_can_read_field_agenda_event_volunteers"
    on public.field_agenda_event_volunteers for select to authenticated
    using (
        exists (
            select 1 from public.internal_users
            where id = auth.uid() and role in ('admin', 'operador', 'comunicacao', 'leitura') and status = 'active'
        )
    );

create policy "authorized_can_manage_field_agenda_event_volunteers"
    on public.field_agenda_event_volunteers for all to authenticated
    using (
        exists (
            select 1 from public.internal_users
            where id = auth.uid() and role in ('admin', 'operador', 'comunicacao') and status = 'active'
        )
    )
    with check (
        exists (
            select 1 from public.internal_users
            where id = auth.uid() and role in ('admin', 'operador', 'comunicacao') and status = 'active'
        )
    );

create trigger tr_campaign_volunteers_updated_at
    before update on public.campaign_volunteers
    for each row execute function public.handle_updated_at();

comment on table public.campaign_volunteers is 'Cadastro interno de voluntarios consentidos; nunca derivado automaticamente de interacoes no Instagram.';
comment on table public.campaign_squads is 'Squads internos de campanha para organizacao operacional, sem microtargeting.';
comment on table public.campaign_squad_members is 'Vinculo entre voluntarios consentidos e squads internos.';
comment on table public.field_agenda_event_volunteers is 'Vinculo operacional entre voluntarios consentidos e acoes da agenda de campo.';