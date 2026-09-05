-- ============================================================
-- simple_invite — guests invited to only 1-2 events (typically
-- distant family who won't need trip-planning info) get Travel,
-- Where to Stay, and Things to Do hidden from their nav.
-- ============================================================

alter table guests add column simple_invite boolean not null default false;

update guests set simple_invite = true
where full_name in (
  'Test Guest VGS1',
  'Test Guest VGS2',
  'Test Guest VGS3',
  'Test Guest RGS1',
  'Test Guest RGS2'
);
