-- ============================================================
-- Revert the Wedding/Reception split back to single invitable
-- events (guest_event_invites stays simple — invited to "Wedding"
-- as a whole, not each sub-moment). The sub-times (Baraat,
-- Ceremony, Mocktail Hour, Garba & Reception) become purely
-- descriptive rows in event_segments, unrelated to invites, shown
-- on the Schedule page grouped under their parent event.
-- ============================================================

create table event_segments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  name text not null,
  segment_datetime timestamptz not null,
  sort_order int not null default 0
);

alter table event_segments enable row level security;

-- Drop the 4 sub-events (cascades their guest_event_invites rows)
delete from events where slug in ('baraat', 'wedding-ceremony', 'mocktail-hour', 'garba-reception');

alter table events drop column group_label;

-- Re-insert the single Wedding and Reception & Garba events
insert into events
  (slug, name, location_name, location_address, location_lat, location_lng, event_datetime, attire_colors, attire_type, is_primary_event, sort_order)
values
  ('wedding', 'Wedding', 'Diamond Bar Community Center', '1600 Grand Ave, Diamond Bar, CA 91765', 33.9988911000908, -117.79766561341545, '2027-02-20T11:00:00-08:00', 'REPLACE_EVENT_COLORS', 'Indian', true, 5),
  ('reception-garba', 'Reception & Garba', 'Diamond Bar Community Center', '1600 Grand Ave, Diamond Bar, CA 91765', 33.9988911000908, -117.79766561341545, '2027-02-20T18:00:00-08:00', 'REPLACE_EVENT_COLORS', 'Indian/Indo-Western/Western Formal', false, 6);

-- Descriptive sub-times shown on the Schedule page
insert into event_segments (event_id, name, segment_datetime, sort_order)
select id, 'Baraat', '2027-02-20T09:00:00-08:00'::timestamptz, 1 from events where slug = 'wedding'
union all
select id, 'Wedding Ceremony', '2027-02-20T11:00:00-08:00'::timestamptz, 2 from events where slug = 'wedding'
union all
select id, 'Mocktail Hour', '2027-02-20T17:00:00-08:00'::timestamptz, 1 from events where slug = 'reception-garba'
union all
select id, 'Garba & Reception', '2027-02-20T18:00:00-08:00'::timestamptz, 2 from events where slug = 'reception-garba';

-- Re-create the test-guest invites lost when the sub-events were dropped
insert into guest_event_invites (guest_id, event_id)
select g.id, e.id
from guests g, events e
where g.full_name = 'Ayesha All Events'
  and e.slug in ('wedding', 'reception-garba');

insert into guest_event_invites (guest_id, event_id)
select g.id, e.id
from guests g, events e
where g.full_name = 'Ben Wedding Only'
  and e.slug in ('wedding', 'reception-garba');
