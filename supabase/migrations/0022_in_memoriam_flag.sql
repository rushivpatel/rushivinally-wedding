-- ============================================================
-- in_memoriam — a guest who has passed away but is still listed
-- out of respect. They show on their family's RSVP list greyed
-- out with no response control, and are left out of every count.
-- NULL (the default) means a normal guest; set to true by hand.
-- ============================================================

alter table guests add column in_memoriam boolean;
