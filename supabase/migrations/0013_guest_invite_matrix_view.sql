-- ============================================================
-- guest_invite_matrix — pivoted view: one row per guest, one
-- column per event. A blank cell means not invited; otherwise
-- shows Pending / Yes / No based on guest_event_invites.attending.
-- Saved as a view so it shows up in Table Editor like a regular
-- table, always reflecting live data.
-- ============================================================

create or replace view guest_invite_matrix as
select
  g.household_id,
  g.full_name,
  g.email,
  g.status as guest_status,
  max(case when e.slug = 'vinally-grah-shanti'
      then case when gei.attending is true then 'Yes' when gei.attending is false then 'No' else 'Pending' end
      end) as "Vinally's Grah Shanti",
  max(case when e.slug = 'welcome-dinner'
      then case when gei.attending is true then 'Yes' when gei.attending is false then 'No' else 'Pending' end
      end) as "Welcome Dinner",
  max(case when e.slug = 'rushi-grah-shanti'
      then case when gei.attending is true then 'Yes' when gei.attending is false then 'No' else 'Pending' end
      end) as "Rushi's Grah Shanti",
  max(case when e.slug = 'haldi-pithi'
      then case when gei.attending is true then 'Yes' when gei.attending is false then 'No' else 'Pending' end
      end) as "Haldi & Pithi",
  max(case when e.slug = 'wedding'
      then case when gei.attending is true then 'Yes' when gei.attending is false then 'No' else 'Pending' end
      end) as "Wedding",
  max(case when e.slug = 'reception-garba'
      then case when gei.attending is true then 'Yes' when gei.attending is false then 'No' else 'Pending' end
      end) as "Reception & Garba"
from guests g
left join guest_event_invites gei on gei.guest_id = g.id
left join events e on e.id = gei.event_id
group by g.household_id, g.full_name, g.email, g.status
order by g.household_id, g.full_name;
