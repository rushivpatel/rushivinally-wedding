-- ============================================================
-- Initial schema: events, households, guests, guest_event_invites
--
-- Access model: nothing in these tables is readable/writable by
-- Supabase's public "anon" key. The Next.js app talks to Supabase
-- exclusively from the server (server components + API routes)
-- using the service_role key, which bypasses RLS entirely. RLS is
-- still enabled below with zero policies attached, so the anon key
-- is denied by default if it's ever accidentally used.
-- ============================================================

create extension if not exists "pgcrypto";

-- ============================================================
-- events — every event on the wedding weekend
-- ============================================================
create table events (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  location_id text,
  event_datetime timestamptz not null,
  attire_colors text,
  attire_type text,
  is_primary_event boolean not null default false,
  sort_order int not null default 0
);

alter table events enable row level security;

-- ============================================================
-- households — the invite/mailing unit
-- ============================================================
create table households (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  email text,
  address text,
  digital_save_the_date_sent boolean not null default false,
  physical_save_the_date_sent boolean not null default false,
  invite_sent boolean not null default false,
  message text,
  created_at timestamptz not null default now()
);

alter table households enable row level security;

-- ============================================================
-- guests — individual people within a household
-- ============================================================
create table guests (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  full_name text not null,
  email text,
  is_child boolean not null default false,
  dietary_restrictions text,
  created_at timestamptz not null default now()
);

create index guests_household_id_idx on guests(household_id);

alter table guests enable row level security;

-- ============================================================
-- guest_event_invites — join table: row existence = invited,
-- `attending` tracks the RSVP response for that event
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
