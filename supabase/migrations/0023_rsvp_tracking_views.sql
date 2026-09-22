-- ============================================================
-- RSVP tracking views — read-only summaries for querying directly
-- in the Supabase SQL editor / Table Editor. The master RSVP page
-- itself now only shows the detailed guest list, so this replaces
-- the headline numbers, by-event counts and mailing stats that
-- used to be rendered there.
--
-- All of these exclude:
--   - the master login itself (household_id = 'master')
--   - children (is_child = true)
--   - in-memoriam guests (in_memoriam = true)
--   - an open-invite host's own row — their seats are tracked via
--     guest_slots/guest_slot_invites instead, once named
-- ============================================================

-- Every "countable" person with a per-event answer: normal guests
-- (not an open-invite host) plus named open-invite seats.
create or replace view v_rsvp_countable_responses as
select
  g.id as guest_id,
  g.full_name,
  false as is_slot,
  gei.event_id,
  gei.status
from guests g
join guest_event_invites gei on gei.guest_id = g.id
where g.household_id is distinct from 'master'
  and coalesce(g.is_child, false) = false
  and coalesce(g.in_memoriam, false) = false
  and g.open_slots is null

union all

select
  gs.id as guest_id,
  gs.full_name,
  true as is_slot,
  gsi.event_id,
  gsi.status
from guest_slots gs
join guest_slot_invites gsi on gsi.slot_id = gs.id;

-- Per-event breakdown: replaces the old "By event" table.
create or replace view v_rsvp_event_counts as
select
  e.slug as event_slug,
  e.name as event_name,
  count(r.guest_id) as invited,
  count(*) filter (where r.status = 'attending') as attending,
  count(*) filter (where r.status = 'not_attending') as not_attending,
  count(*) filter (where r.status = 'undecided') as undecided,
  count(*) filter (where r.status is null) as pending
from events e
left join v_rsvp_countable_responses r on r.event_id = e.id
group by e.id, e.slug, e.name, e.sort_order
order by e.sort_order;

-- One row per countable person, with how many of their invited
-- events they've answered so far.
create or replace view v_rsvp_progress_by_guest as
select
  guest_id,
  full_name,
  bool_or(is_slot) as is_slot,
  count(*) as invited_count,
  count(*) filter (where status is not null) as answered_count,
  case
    when count(*) filter (where status is not null) = 0 then 'not_started'
    when count(*) filter (where status is not null) = count(*) then 'complete'
    else 'partial'
  end as progress
from v_rsvp_countable_responses
group by guest_id, full_name;

-- Headline numbers: replaces the old top stat cards.
create or replace view v_rsvp_progress_summary as
select
  count(*) as total_guests,
  count(*) filter (where progress = 'complete') as fully_answered,
  count(*) filter (where progress = 'partial') as partly_answered,
  count(*) filter (where progress = 'not_started') as not_started
from v_rsvp_progress_by_guest;

-- Mailing tracker (save-the-dates, invites): replaces the old
-- "Mailings" section. Uses `guests` directly rather than the
-- countable-responses view — these flags are about contacting the
-- person, so an open-invite host is included here even though
-- their own RSVP row is tracked through their named seats instead.
create or replace view v_rsvp_mailing_stats as
select
  count(*) as total_guests,
  count(*) filter (where digital_save_the_date_sent) as digital_sent,
  count(*) filter (where physical_save_the_date_sent) as physical_sent,
  count(*) filter (where invite_sent) as invite_sent
from guests
where household_id is distinct from 'master'
  and coalesce(is_child, false) = false
  and coalesce(in_memoriam, false) = false;
