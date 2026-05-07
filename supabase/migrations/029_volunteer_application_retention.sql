-- Migration 029: Volunteer application retention and safe redaction
-- Keeps operational history while allowing controlled PII redaction.

alter table public.campaign_volunteer_applications
    add column if not exists retention_status text not null default 'active'
        check (retention_status in ('active','scheduled_for_redaction','redacted','retained')),
    add column if not exists retention_reason text null,
    add column if not exists redacted_at timestamptz null,
    add column if not exists redacted_by uuid null,
    add column if not exists redacted_by_email text null,
    add column if not exists scheduled_redaction_at timestamptz null;

create index if not exists idx_campaign_volunteer_applications_retention_status
    on public.campaign_volunteer_applications(retention_status);

create index if not exists idx_campaign_volunteer_applications_scheduled_redaction_at
    on public.campaign_volunteer_applications(scheduled_redaction_at);

comment on column public.campaign_volunteer_applications.retention_status is
    'Internal retention state for public volunteer applications. Redaction removes PII but preserves decision history.';

comment on column public.campaign_volunteer_applications.retention_reason is
    'Operational justification for retention scheduling, redaction, or explicit retain decision.';
