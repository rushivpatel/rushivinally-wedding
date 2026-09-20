-- ============================================================
-- Open-invite slots — for guests who get a set number of "seats"
-- instead of named household members. The guest logs in as
-- themselves (no RSVP row of their own), then names who from their
-- party is attending and RSVPs for each of those names per event.
--
--   guests.open_slots   how many names this login guest can enter
--                       (NULL = normal guest, feature off)
--   guest_slots         one row per named slot (name typed once)
--   guest_slot_invites  one row per slot per event (attending etc.)
--
-- Deliberately NOT linked back to guests — these are just names for
-- manual tracking.
-- ============================================================

alter table guests
  add column open_slots integer check (open_slots is null or open_slots > 0);

create table guest_slots (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null references guests(id) on delete cascade,
  slot_number integer not null check (slot_number >= 1),
  full_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (guest_id, slot_number)
);

create index guest_slots_guest_id_idx on guest_slots(guest_id);

create table guest_slot_invites (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references guest_slots(id) on delete cascade,
  event_id uuid not null references events(id) on delete cascade,
  status text not null check (status in ('attending', 'not_attending', 'undecided')),
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  unique (slot_id, event_id)
);

create index guest_slot_invites_slot_id_idx on guest_slot_invites(slot_id);
create index guest_slot_invites_event_id_idx on guest_slot_invites(event_id);

alter table guest_slots enable row level security;
alter table guest_slot_invites enable row level security;
