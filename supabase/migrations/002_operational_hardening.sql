create type consent_status as enum ('pending', 'confirmed', 'revoked');

alter table contacts
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists consent_status consent_status not null default 'pending',
  add column if not exists last_contacted_at timestamptz;

alter table contacts
  add constraint contacts_person_id_key unique (person_id);

alter table audit_logs
  add column if not exists actor_email text,
  add column if not exists summary text not null default '';
