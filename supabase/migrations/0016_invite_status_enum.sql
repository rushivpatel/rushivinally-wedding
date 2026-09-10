-- ============================================================
-- Replace guest_event_invites.attending (boolean) with a status
-- column that maps directly to the RSVP dropdown: 'attending',
-- 'not_attending', 'undecided', or null (never responded — the
-- only state that can never be selected again once they've
-- answered once).
-- ============================================================

alter table guest_event_invites
  add column status text check (status in ('attending', 'not_attending', 'undecided'));

update guest_event_invites set status = 'attending' where attending = true;
update guest_event_invites set status = 'not_attending' where attending = false;
-- attending is null -> status stays null (never responded)

alter table guest_event_invites drop column attending;
