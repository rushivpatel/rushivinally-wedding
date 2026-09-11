-- ============================================================
-- lock_rsvp — once RSVP collection closes for a guest, their
-- existing responses stay visible but can no longer be changed.
-- ============================================================

alter table guests add column lock_rsvp boolean not null default false;
