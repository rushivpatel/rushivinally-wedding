-- ============================================================
-- hide_rsvp — guests who shouldn't see the RSVP page at all
-- get it hidden from nav and blocked if they navigate to /rsvp
-- directly. Defaults to true: only save-the-dates have gone out
-- so far, so RSVP stays hidden for everyone until turned on
-- per-guest (or in bulk) once invitations go out.
-- ============================================================

alter table guests add column hide_rsvp boolean not null default true;
