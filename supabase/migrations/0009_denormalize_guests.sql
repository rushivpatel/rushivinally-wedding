-- ============================================================
-- Collapse households + guests + guest_event_invites into a
-- single denormalized guests table — matching how the guest list
-- is actually tracked in practice: one row per person, invited
-- status as a boolean flag per event, and household grouping via
-- a plain text key rather than a separate table with a real FK.
-- ============================================================

alter table guests drop constraint guests_household_id_fkey;
alter table guests alter column household_id type text using household_id::text;
alter table guests alter column household_id drop not null;

alter table guests
  add column address text,
  add column digital_save_the_date_sent boolean not null default false,
  add column physical_save_the_date_sent boolean not null default false,
  add column invite_sent boolean not null default false,
  add column message text,
  add column status text not null default 'invited' check (status in ('invited', 'confirmed', 'declined')),
  add column side text check (side in ('rushi', 'vinally')),
  add column relation_label text,
  add column invited_vinally_grah_shanti boolean not null default false,
  add column invited_welcome_dinner boolean not null default false,
  add column invited_rushi_grah_shanti boolean not null default false,
  add column invited_haldi_pithi boolean not null default false,
  add column invited_wedding boolean not null default false,
  add column invited_reception_garba boolean not null default false;

-- Carry the 3 test guests' existing invites onto the new flags
update guests set
  household_id = 'test-household-a',
  invited_vinally_grah_shanti = true,
  invited_welcome_dinner = true,
  invited_rushi_grah_shanti = true,
  invited_haldi_pithi = true,
  invited_wedding = true,
  invited_reception_garba = true
where full_name = 'Ayesha All Events';

update guests set
  household_id = 'test-household-b',
  invited_wedding = true,
  invited_reception_garba = true
where full_name = 'Ben Wedding Only';

update guests set
  household_id = 'test-household-c',
  invited_welcome_dinner = true
where full_name = 'Cara Welcome Dinner';

drop table guest_event_invites;
drop table households;
