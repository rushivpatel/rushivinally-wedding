-- ============================================================
-- Test scenarios covering the 5 invite patterns given:
-- 1. Only Vinally's Grah Shanti
-- 2. Only Rushi's Grah Shanti
-- 3. Wedding + Reception & Garba
-- 4. Rushi's Grah Shanti, Welcome Dinner, Haldi & Pithi, Wedding, Reception & Garba
-- 5. Vinally's Grah Shanti, Haldi & Pithi, Wedding, Reception & Garba
-- ============================================================

insert into guests (household_id, full_name, email) values
  ('test-vgs-only', 'Test Guest VGS1', 'testguestvgs1@example.com'),
  ('test-vgs-only', 'Test Guest VGS2', 'testguestvgs2@example.com'),
  ('test-vgs-only', 'Test Guest VGS3', 'testguestvgs3@example.com'),

  ('test-rgs-only', 'Test Guest RGS1', 'testguestrgs1@example.com'),
  ('test-rgs-only', 'Test Guest RGS2', 'testguestrgs2@example.com'),

  ('test-wedding-reception', 'Test Guest WR1', 'testguestwr1@example.com'),
  ('test-wedding-reception', 'Test Guest WR2', 'testguestwr2@example.com'),
  ('test-wedding-reception', 'Test Guest WR3', 'testguestwr3@example.com'),

  ('test-rushi-side-full', 'Test Guest RSF1', 'testguestrsf1@example.com'),
  ('test-rushi-side-full', 'Test Guest RSF2', 'testguestrsf2@example.com'),

  ('test-vinally-side-full', 'Test Guest VSF1', 'testguestvsf1@example.com'),
  ('test-vinally-side-full', 'Test Guest VSF2', 'testguestvsf2@example.com'),
  ('test-vinally-side-full', 'Test Guest VSF3', 'testguestvsf3@example.com');

insert into guest_event_invites (guest_id, event_id)
select g.id, e.id from guests g, events e
where g.household_id = 'test-vgs-only' and e.slug = 'vinally-grah-shanti';

insert into guest_event_invites (guest_id, event_id)
select g.id, e.id from guests g, events e
where g.household_id = 'test-rgs-only' and e.slug = 'rushi-grah-shanti';

insert into guest_event_invites (guest_id, event_id)
select g.id, e.id from guests g, events e
where g.household_id = 'test-wedding-reception' and e.slug in ('wedding', 'reception-garba');

insert into guest_event_invites (guest_id, event_id)
select g.id, e.id from guests g, events e
where g.household_id = 'test-rushi-side-full'
  and e.slug in ('rushi-grah-shanti', 'welcome-dinner', 'haldi-pithi', 'wedding', 'reception-garba');

insert into guest_event_invites (guest_id, event_id)
select g.id, e.id from guests g, events e
where g.household_id = 'test-vinally-side-full'
  and e.slug in ('vinally-grah-shanti', 'haldi-pithi', 'wedding', 'reception-garba');
