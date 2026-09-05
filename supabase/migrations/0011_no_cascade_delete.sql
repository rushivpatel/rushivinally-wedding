-- ============================================================
-- Replace cascade deletes on guest_event_invites with restrict —
-- deleting a guest or event that still has invite rows now fails
-- with an error instead of silently wiping those rows. Forces a
-- deliberate two-step delete (invites first, then the guest/event)
-- once real guest data is in place.
-- ============================================================

alter table guest_event_invites drop constraint guest_event_invites_guest_id_fkey;
alter table guest_event_invites
  add constraint guest_event_invites_guest_id_fkey
  foreign key (guest_id) references guests(id) on delete restrict;

alter table guest_event_invites drop constraint guest_event_invites_event_id_fkey;
alter table guest_event_invites
  add constraint guest_event_invites_event_id_fkey
  foreign key (event_id) references events(id) on delete restrict;
