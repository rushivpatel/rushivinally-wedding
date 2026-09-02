-- ============================================================
-- locations — "things to do" reference data (hotels, airports,
-- restaurants, sightseeing). Not related to wedding venues, which
-- live directly on events. Editable via Table Editor going forward,
-- no code change/redeploy needed to add a new hotel/restaurant/etc.
-- ============================================================

create table locations (
  id text primary key,
  name text not null,
  category text not null check (category in ('hotel', 'airport', 'restaurant', 'coffee', 'sightseeing')),
  address text not null,
  lat double precision not null,
  lng double precision not null,
  description text,
  icon text not null,
  detail1 text,
  detail2 text,
  detail3 text
);

alter table locations enable row level security;

insert into locations (id, name, category, address, lat, lng, description, icon, detail1, detail2, detail3) values
  ('lax-airport', 'Los Angeles Airport (LAX)', 'airport', '1 World Wy, Los Angeles, CA 90045', 33.94275466594506, -118.40362489189816, 'Los Angeles''s Primary Gateway', 'Plane', 'Drive Time: ~1 Hour', 'Distance to Venue: ~50 Miles', 'Direct flights from most domestic and international locations'),
  ('sna-airport', 'Orange County (John Wayne) Airport (SNA)', 'airport', '18601 Airport Way, Santa Ana, CA 92707', 33.674995496901, -117.86916664031813, 'Alternate Airport', 'Plane', 'Drive Time: ~30 Mins', 'Distance to Venue: ~30 Miles', 'Airport has direct flights from Dallas and most medium/large US Cities'),
  ('ont-airport', 'Ontario Airport (ONT)', 'airport', '2900 E. Airport Drive, Ontario, CA 91761', 34.05623754276412, -117.59810292167565, 'Alternate Airport', 'Plane', 'Drive Time: ~25 Mins', 'Distance to Venue: ~20 Miles', 'Airport has direct flights from Dallas and most medium/large US Cities'),
  ('lgb-airport', 'Long Beach Airport (LGB)', 'airport', '4100 Donald Douglas Dr, Long Beach, CA 90808', 33.816159828092374, -118.15119142523577, 'Alternate Airport', 'Plane', 'Drive Time: ~1 Hour', 'Distance to Venue: ~50 Miles', 'Airport operates Southwest only flights'),
  ('holiday-inn-diamond-bar', 'Holiday Inn Diamond Bar - Pomona by IHG', 'hotel', '21725 Gateway Center Dr, Diamond Bar, CA 91765', 34.00104267991714, -117.8336538606396, 'Primary Hotel Option', 'Bed', null, null, null),
  ('jay-bharat', 'Jay Bharat', 'restaurant', '18701 Pioneer Blvd, Artesia, CA 90701', 33.861361083953085, -118.08230945385903, 'Indian Restaurant', 'Utensils', null, null, null),
  ('reborn-coffee', 'Reborn Coffee', 'coffee', '1138 S Diamond Bar Blvd, Diamond Bar, CA 91765', 34.00270525631017, -117.80979724551105, null, 'Coffee', null, null, null);
