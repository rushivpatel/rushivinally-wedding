-- ============================================================
-- Seed events table with the finalized wedding weekend schedule.
-- attire_colors is left as an explicit placeholder string, matching
-- the un-filled-in values that were already in src/data/weddingDetails.ts.
-- ============================================================

insert into events
  (slug, name, location_id, event_datetime, attire_colors, attire_type, is_primary_event, sort_order)
values
  ('vinally-grah-shanti', 'Vinally''s Grah Shanti', 'fullerton-community-center', '2027-02-14T09:30:00-08:00', 'REPLACE_EVENT_COLORS', 'Indian', false, 1),
  ('welcome-dinner', 'Welcome Dinner', 'cerritos-library', '2027-02-18T18:00:00-08:00', 'REPLACE_EVENT_COLORS', 'REPLACE_ATTIRE_TYPE', false, 2),
  ('rushi-grah-shanti', 'Rushi''s Grah Shanti', 'fullerton-community-center', '2027-02-19T09:00:00-08:00', 'REPLACE_EVENT_COLORS', 'Indian', false, 3),
  ('haldi-pithi', 'Haldi & Pithi', 'fullerton-community-center', '2027-02-19T12:00:00-08:00', 'REPLACE_EVENT_COLORS', 'Indian', false, 4),
  ('wedding', 'Wedding', 'diamond-bar-community-center', '2027-02-20T10:00:00-08:00', 'REPLACE_EVENT_COLORS', 'Indian', true, 5),
  ('reception-garba', 'Reception & Garba', 'diamond-bar-community-center', '2027-02-20T17:00:00-08:00', 'REPLACE_EVENT_COLORS', 'Indian/Indo-Western/Western Formal', false, 6);
