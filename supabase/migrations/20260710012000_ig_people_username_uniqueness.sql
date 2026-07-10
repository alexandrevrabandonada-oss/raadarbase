-- Prevents duplicate Instagram people when username casing or surrounding whitespace differs.
-- Existing rows were audited before this constraint was introduced.
create unique index if not exists ig_people_username_normalized_key
  on public.ig_people (lower(btrim(username)));
