/**
 * Wipes guests + guest_event_invites and reseeds a set of test guests
 * covering every guest-facing behavior currently built:
 *   - simple_invite (nav hides Travel/Where to Stay/Things to Do)
 *   - hide_rsvp (nav hides RSVP, /rsvp blocks direct access)
 *   - lock_rsvp (existing responses visible but frozen, banner shown)
 *   - ambiguous login (two guests sharing one full_name)
 *   - login with no email on file
 *   - household grouping (multiple guests sharing household_id)
 *   - partial event invites (guest invited to a subset of events)
 *   - a mix of pre-set RSVP statuses (attending / not_attending / undecided / none)
 *
 * Run with:
 *   set -a; source .env.local; set +a
 *   node scripts/seed-test-guests.js
 */
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const EVENT_SLUGS = [
  "vinally-grah-shanti",
  "welcome-dinner",
  "rushi-grah-shanti",
  "haldi-pithi",
  "wedding",
  "reception-garba",
];

// guests: each entry is one household. `invites` maps event slug -> status
// ("attending" | "not_attending" | "undecided" | null for no response yet).
const HOUSEHOLDS = [
  {
    householdId: "test-ambiguous-a",
    label: "Ambiguous login — guest A",
    guests: [
      {
        fullName: "Riley Anders",
        email: "riley.anders.a@example.com",
        invites: allEvents(null),
      },
    ],
  },
  {
    householdId: "test-ambiguous-b",
    label: "Ambiguous login — guest B (same full name as guest A)",
    guests: [
      {
        fullName: "Riley Anders",
        email: "riley.anders.b@example.com",
        invites: allEvents(null),
      },
    ],
  },
  {
    householdId: "test-full-access",
    label: "Full access household — everything open, nothing answered yet",
    guests: [
      { fullName: "Jordan Patel", email: "jordan.patel@example.com", invites: allEvents(null) },
      { fullName: "Taylor Patel", email: "taylor.patel@example.com", invites: allEvents(null) },
    ],
  },
  {
    householdId: "test-simple-invite",
    label: "simple_invite — invited to only 2 of 6 events",
    guests: [
      {
        fullName: "Sam Rivera",
        email: "sam.rivera@example.com",
        simpleInvite: true,
        invites: { wedding: null, "reception-garba": null },
      },
    ],
  },
  {
    householdId: "test-hidden-rsvp",
    label: "hide_rsvp — RSVP nav hidden, /rsvp blocked (the current default)",
    guests: [
      {
        fullName: "Casey Nguyen",
        email: "casey.nguyen@example.com",
        hideRsvp: true,
        invites: allEvents(null),
      },
    ],
  },
  {
    householdId: "test-locked-rsvp",
    label: "lock_rsvp — existing mixed responses, frozen",
    guests: [
      {
        fullName: "Morgan Ellis",
        email: "morgan.ellis@example.com",
        hideRsvp: false,
        lockRsvp: true,
        invites: {
          "vinally-grah-shanti": "attending",
          "welcome-dinner": "undecided",
          "rushi-grah-shanti": "not_attending",
          "haldi-pithi": null,
          wedding: "attending",
          "reception-garba": "not_attending",
        },
      },
    ],
  },
  {
    householdId: "test-no-email",
    label: "No email on file — must log in by name only",
    guests: [
      {
        fullName: "Drew Whitfield",
        email: null,
        hideRsvp: false,
        invites: allEvents(null),
      },
    ],
  },
  {
    householdId: "test-family",
    label: "3-person household, partial invite list, one response already in",
    guests: [
      {
        fullName: "Parent A Kapoor",
        email: "parenta.kapoor@example.com",
        invites: {
          "welcome-dinner": "attending",
          "haldi-pithi": null,
          wedding: null,
          "reception-garba": null,
        },
      },
      {
        fullName: "Parent B Kapoor",
        email: "parentb.kapoor@example.com",
        invites: {
          "welcome-dinner": null,
          "haldi-pithi": null,
          wedding: null,
          "reception-garba": null,
        },
      },
      {
        fullName: "Kid Kapoor",
        email: null,
        isChild: true,
        invites: {
          "welcome-dinner": null,
          "haldi-pithi": null,
          wedding: null,
          "reception-garba": null,
        },
      },
    ],
  },
];

function allEvents(status) {
  return Object.fromEntries(EVENT_SLUGS.map((slug) => [slug, status]));
}

async function main() {
  console.log("Deleting all guest_event_invites...");
  const { error: deleteInvitesError } = await supabase
    .from("guest_event_invites")
    .delete()
    .not("id", "is", null);
  if (deleteInvitesError) throw deleteInvitesError;

  console.log("Deleting all guests...");
  const { error: deleteGuestsError } = await supabase.from("guests").delete().not("id", "is", null);
  if (deleteGuestsError) throw deleteGuestsError;

  const { data: events, error: eventsError } = await supabase.from("events").select("id, slug");
  if (eventsError) throw eventsError;
  const eventIdBySlug = Object.fromEntries(events.map((e) => [e.slug, e.id]));

  for (const household of HOUSEHOLDS) {
    console.log(`Seeding household "${household.householdId}" — ${household.label}`);

    for (const guest of household.guests) {
      const { data: inserted, error: insertError } = await supabase
        .from("guests")
        .insert({
          household_id: household.householdId,
          full_name: guest.fullName,
          email: guest.email ?? null,
          is_child: guest.isChild ?? false,
          simple_invite: guest.simpleInvite ?? false,
          hide_rsvp: guest.hideRsvp ?? false,
          lock_rsvp: guest.lockRsvp ?? false,
          status: "invited",
        })
        .select("id")
        .single();
      if (insertError) throw insertError;

      const inviteRows = Object.entries(guest.invites).map(([slug, status]) => ({
        guest_id: inserted.id,
        event_id: eventIdBySlug[slug],
        status,
        responded_at: status ? new Date().toISOString() : null,
      }));

      const { error: inviteError } = await supabase.from("guest_event_invites").insert(inviteRows);
      if (inviteError) throw inviteError;
    }
  }

  console.log("\nDone. Log in with any of these names or emails:\n");
  for (const household of HOUSEHOLDS) {
    console.log(`- ${household.label}`);
    for (const guest of household.guests) {
      console.log(`    ${guest.fullName}${guest.email ? ` / ${guest.email}` : " (no email)"}`);
    }
  }
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  }
);
