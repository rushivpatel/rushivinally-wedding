-- ============================================================
-- phone — guest phone number, for contacting them directly
-- (e.g. about RSVP follow-ups) outside the website.
-- ============================================================

alter table guests add column phone text;
