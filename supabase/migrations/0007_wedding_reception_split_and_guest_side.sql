-- ============================================================
-- Split "Wedding" into Baraat + Wedding Ceremony, and
-- "Reception & Garba" into Mocktail Hour + Garba & Reception.
-- group_label groups sub-events under one schedule heading.
--
-- NOTE: dateTimes and venue below are placeholders (same venue as
-- the original combined events, plausible but unconfirmed times).
-- Update via Table Editor once you have the real schedule.
-- ============================================================

alter table events add column group_label text;

delete from events where slug in ('wedding', 'reception-garba');

insert into events
  (slug, name, location_name, location_address, location_lat, location_lng, event_datetime, attire_colors, attire_type, is_primary_event, sort_order, group_label)
values
  ('baraat', 'Baraat', 'Diamond Bar Community Center', '1600 Grand Ave, Diamond Bar, CA 91765', 33.9988911000908, -117.79766561341545, '2027-02-20T09:00:00-08:00', 'REPLACE_EVENT_COLORS', 'Indian', false, 5, 'Wedding'),
  ('wedding-ceremony', 'Wedding Ceremony', 'Diamond Bar Community Center', '1600 Grand Ave, Diamond Bar, CA 91765', 33.9988911000908, -117.79766561341545, '2027-02-20T11:00:00-08:00', 'REPLACE_EVENT_COLORS', 'Indian', true, 6, 'Wedding'),
  ('mocktail-hour', 'Mocktail Hour', 'Diamond Bar Community Center', '1600 Grand Ave, Diamond Bar, CA 91765', 33.9988911000908, -117.79766561341545, '2027-02-20T17:00:00-08:00', 'REPLACE_EVENT_COLORS', 'Indian/Indo-Western/Western Formal', false, 7, 'Reception'),
  ('garba-reception', 'Garba & Reception', 'Diamond Bar Community Center', '1600 Grand Ave, Diamond Bar, CA 91765', 33.9988911000908, -117.79766561341545, '2027-02-20T18:00:00-08:00', 'REPLACE_EVENT_COLORS', 'Indian/Indo-Western/Western Formal', false, 8, 'Reception');

-- Re-create test-guest invites that cascade-deleted along with the
-- old wedding/reception-garba rows above.
insert into guest_event_invites (guest_id, event_id)
select g.id, e.id
from guests g, events e
where g.full_name = 'Ayesha All Events'
  and e.slug in ('baraat', 'wedding-ceremony', 'mocktail-hour', 'garba-reception');

insert into guest_event_invites (guest_id, event_id)
select g.id, e.id
from guests g, events e
where g.full_name = 'Ben Wedding Only'
  and e.slug in ('baraat', 'wedding-ceremony', 'mocktail-hour', 'garba-reception');

-- ============================================================
-- households.side / relation_label — which side of the couple a
-- household is invited by, plus a free-text descriptor for your
-- own reference (e.g. "Rushi's Friends", "Vinally's Family").
-- ============================================================

alter table households add column side text check (side in ('rushi', 'vinally'));
alter table households add column relation_label text;
