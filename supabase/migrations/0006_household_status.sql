-- ============================================================
-- households.status — single source of truth for headcount
-- tracking against the 300-guest cap. New households default to
-- 'invited'; flip to 'confirmed' once they RSVP yes to attending,
-- or 'declined' to free up their slot for a backfill invite.
-- ============================================================

alter table households
  add column status text not null default 'invited'
  check (status in ('invited', 'confirmed', 'declined'));
