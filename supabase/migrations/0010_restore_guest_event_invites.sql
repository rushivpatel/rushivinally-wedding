-- ============================================================
-- Revert the per-event boolean flags on guests back to a join
-- table. Reasoning: invited+RSVP status is two facts about a
-- (guest, event) PAIR — a join table lets you add a fact to that
-- pair once (e.g. `attending`) and it applies to every event
-- automatically, instead of needing a new pair of columns
-- (invited_X, accepted_X, ...) per event every time. households
-- stays gone — that collapse onto guests was the right call.
-- ============================================================

create table guest_event_invites (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null references guests(id) on delete cascade,
  event_id uuid not null references events(id) on delete cascade,
  attending boolean,
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  unique (guest_id, event_id)
);

create index guest_event_invites_guest_id_idx on guest_event_invites(guest_id);
create index guest_event_invites_event_id_idx on guest_event_invites(event_id);

alter table guest_event_invites enable row level security;

-- Carry the 3 test guests' flags over into invite rows
insert into guest_event_invites (guest_id, event_id)
select g.id, e.id from guests g, events e
where g.full_name = 'Ayesha All Events'
  and e.slug in ('vinally-grah-shanti', 'welcome-dinner', 'rushi-grah-shanti', 'haldi-pithi', 'wedding', 'reception-garba');

insert into guest_event_invites (guest_id, event_id)
select g.id, e.id from guests g, events e
where g.full_name = 'Ben Wedding Only'
  and e.slug in ('wedding', 'reception-garba');

insert into guest_event_invites (guest_id, event_id)
select g.id, e.id from guests g, events e
where g.full_name = 'Cara Welcome Dinner'
  and e.slug = 'welcome-dinner';

alter table guests
  drop column invited_vinally_grah_shanti,
  drop column invited_welcome_dinner,
  drop column invited_rushi_grah_shanti,
  drop column invited_haldi_pithi,
  drop column invited_wedding,
  drop column invited_reception_garba;
