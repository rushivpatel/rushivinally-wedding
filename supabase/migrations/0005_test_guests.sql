-- ============================================================
-- Test households/guests for exercising conditional event
-- visibility on the Schedule page. Log in at the site gate using
-- any of the three guest names below.
-- ============================================================

-- Household A — invited to every event
with household_a as (
  insert into households (display_name, email)
  values ('Test Household A', 'testa@example.com')
  returning id
),
guest_a as (
  insert into guests (household_id, full_name, email)
  select id, 'Ayesha All Events', 'ayesha@example.com' from household_a
  returning id
)
insert into guest_event_invites (guest_id, event_id)
select guest_a.id, events.id from guest_a, events;

-- Household B — invited to Wedding + Reception & Garba only
with household_b as (
  insert into households (display_name, email)
  values ('Test Household B', 'testb@example.com')
  returning id
),
guest_b as (
  insert into guests (household_id, full_name, email)
  select id, 'Ben Wedding Only', 'ben@example.com' from household_b
  returning id
)
insert into guest_event_invites (guest_id, event_id)
select guest_b.id, events.id from guest_b, events
where events.slug in ('wedding', 'reception-garba');

-- Household C — invited to Welcome Dinner only
with household_c as (
  insert into households (display_name, email)
  values ('Test Household C', 'testc@example.com')
  returning id
),
guest_c as (
  insert into guests (household_id, full_name, email)
  select id, 'Cara Welcome Dinner', 'cara@example.com' from household_c
  returning id
)
insert into guest_event_invites (guest_id, event_id)
select guest_c.id, events.id from guest_c, events
where events.slug = 'welcome-dinner';
