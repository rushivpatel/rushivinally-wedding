-- ============================================================
-- Update guest_invite_matrix for the new status column: a blank
-- cell still means not invited; otherwise shows Pending (never
-- responded) / Yes / No / Undecided (responded, then walked it
-- back) based on guest_event_invites.status.
-- ============================================================

create or replace view guest_invite_matrix as
select
  g.household_id,
  g.full_name,
  g.email,
  g.status as guest_status,
  max(case when e.slug = 'vinally-grah-shanti'
      then coalesce(
        case gei.status when 'attending' then 'Yes' when 'not_attending' then 'No' when 'undecided' then 'Undecided' end,
        'Pending'
      ) end) as "Vinally's Grah Shanti",
  max(case when e.slug = 'welcome-dinner'
      then coalesce(
        case gei.status when 'attending' then 'Yes' when 'not_attending' then 'No' when 'undecided' then 'Undecided' end,
        'Pending'
      ) end) as "Welcome Dinner",
  max(case when e.slug = 'rushi-grah-shanti'
      then coalesce(
        case gei.status when 'attending' then 'Yes' when 'not_attending' then 'No' when 'undecided' then 'Undecided' end,
        'Pending'
      ) end) as "Rushi's Grah Shanti",
  max(case when e.slug = 'haldi-pithi'
      then coalesce(
        case gei.status when 'attending' then 'Yes' when 'not_attending' then 'No' when 'undecided' then 'Undecided' end,
        'Pending'
      ) end) as "Haldi & Pithi",
  max(case when e.slug = 'wedding'
      then coalesce(
        case gei.status when 'attending' then 'Yes' when 'not_attending' then 'No' when 'undecided' then 'Undecided' end,
        'Pending'
      ) end) as "Wedding",
  max(case when e.slug = 'reception-garba'
      then coalesce(
        case gei.status when 'attending' then 'Yes' when 'not_attending' then 'No' when 'undecided' then 'Undecided' end,
        'Pending'
      ) end) as "Reception & Garba"
from guests g
left join guest_event_invites gei on gei.guest_id = g.id
left join events e on e.id = gei.event_id
group by g.household_id, g.full_name, g.email, g.status
order by g.household_id, g.full_name;
