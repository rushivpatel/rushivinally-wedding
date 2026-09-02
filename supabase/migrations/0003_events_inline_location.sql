-- ============================================================
-- Inline venue data directly onto events, replacing the loose
-- location_id string reference into src/data/locations.ts.
-- Wedding venues no longer live in locations.ts at all — that
-- file is now scoped to "things to do" reference data only
-- (hotels, airports, restaurants, coffee, sightseeing).
-- ============================================================

alter table events
  add column location_name text,
  add column location_address text,
  add column location_lat double precision,
  add column location_lng double precision;

update events set
  location_name = 'Fullerton Community Center',
  location_address = '340 W Commonwealth Ave, Fullerton, CA 92832',
  location_lat = 33.86941135258817,
  location_lng = -117.930842408641
where location_id = 'fullerton-community-center';

update events set
  location_name = 'Diamond Bar Community Center',
  location_address = '1600 Grand Ave, Diamond Bar, CA 91765',
  location_lat = 33.9988911000908,
  location_lng = -117.79766561341545
where location_id = 'diamond-bar-community-center';

update events set
  location_name = 'Cerritos Library',
  location_address = '18025 Bloomfield Ave, Cerritos, CA 90703',
  location_lat = 33.866665,
  location_lng = -118.065506
where location_id = 'cerritos-library';

alter table events
  alter column location_name set not null,
  alter column location_address set not null,
  alter column location_lat set not null,
  alter column location_lng set not null;

alter table events drop column location_id;
