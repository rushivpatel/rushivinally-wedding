-- ============================================================
-- events.timezone — each event now carries its own IANA timezone
-- for display (defaults to Pacific, matching every event except
-- Vinally's Grah Shanti, which is in Texas). The stored
-- event_datetime must always include the correct UTC offset for
-- that event's actual timezone — the app displays each event in
-- its own zone rather than converting everything to Pacific.
-- ============================================================

alter table events add column timezone text not null default 'America/Los_Angeles';

update events
set
  event_datetime = '2027-02-14T09:00:00-06:00',
  timezone = 'America/Chicago'
where slug = 'vinally-grah-shanti';
